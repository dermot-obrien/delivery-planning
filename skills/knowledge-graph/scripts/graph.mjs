#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * Build and inspect a workspace's knowledge graph.
 *
 *   node graph.mjs build [--map file] [--out dir] [--json]   graph.json and index.html
 *   node graph.mjs gaps  [--map file] [--json]               identifiers with no record or no page
 *   node graph.mjs show <id> [--map file]                    one node and its links
 *   node graph.mjs views [--map file]                        the views the map names
 *
 * Each command takes --classes a,b (records of those classes and the links between them)
 * or --view <name> (a view the map names). A view is written to <out>/<name>/, beside the
 * whole graph rather than over it.
 *
 * --map and --out default to [suite.knowledge-graph] map and out in
 * .agents/skill-bindings.toml. Run from the workspace root.
 *
 * Exit 0: done. Exit 1: problems (build warnings with --strict). Exit 2: usage error.
 */

import fs from 'node:fs';
import path from 'node:path';
import {build, resolveView} from './lib/build.mjs';
import {render} from './lib/render.mjs';
import {readBindings, boundPath} from './lib/bindings.mjs';

function parseArgs(argv) {
  const out = {_: []};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json' || a === '--strict') out[a.slice(2)] = true;
    else if (a.startsWith('--')) out[a.slice(2)] = argv[++i];
    else out._.push(a);
  }
  return out;
}

const USAGE = 'usage: graph.mjs build [--map file] [--out dir] [--json] [--strict] | gaps [--map file] [--json] | show <id> [--map file] | views [--map file]' +
  '\n  any command: --classes <class,class> | --view <name>';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [cmd, arg] = args._;
  if (!cmd || args.help) { console.log(USAGE); return cmd ? 0 : 2; }
  const b = readBindings(process.cwd(), 'knowledge-graph');
  const mapFile = args.map ? path.resolve(args.map) : b.map ? boundPath(b, b.map) : null;
  if (!mapFile || !fs.existsSync(mapFile)) {
    console.error(mapFile ? `${mapFile}: not found` : 'No graph map: bind [suite.knowledge-graph] map, or pass --map.');
    return 2;
  }
  const map = JSON.parse(fs.readFileSync(mapFile, 'utf-8'));
  if (cmd === 'views') {
    const views = Object.entries(map.views || {});
    if (!views.length) console.log('The map names no views. Add them under "views", or pass --classes.');
    for (const [name, v] of views) console.log(`${name.padEnd(20)} ${(v.classes || []).join(', ')}${v.title ? `  (${v.title})` : ''}`);
    return 0;
  }
  const classes = typeof args.classes === 'string' ? args.classes.split(',').map((c) => c.trim()).filter(Boolean) : [];
  if (args.classes !== undefined && !classes.length) { console.error('--classes needs a comma-separated list of classes, such as mo:ABB,mo:SBB'); return 2; }
  let selection;
  try { selection = resolveView(map, {view: args.view, classes}); } catch (e) { console.error(e.message); return 2; }
  const graph = await build(mapFile, {root: process.cwd(), view: args.view, classes});
  for (const w of graph.meta.warnings) console.error(`warning: ${w}`);

  if (selection && !graph.nodes.length) {
    console.error(`No records of ${selection.classes.join(', ')}: nothing to draw. List the classes with the ontology skill, and check the map's roles and sources.`);
    return 1;
  }
  if (cmd === 'build') {
    let out = args.out ? path.resolve(args.out) : b.out ? boundPath(b, b.out) : path.resolve('knowledge-graph');
    if (selection && !args.out) out = path.join(out, selection.name);
    fs.mkdirSync(out, {recursive: true});
    fs.writeFileSync(path.join(out, 'graph.json'), JSON.stringify(graph, null, 1));
    if (!args.json) fs.writeFileSync(path.join(out, 'index.html'), render(graph));
    const g = graph.meta.gaps;
    console.log(`${graph.meta.counts.nodes} nodes, ${graph.meta.counts.links} links; ${g.stubs.length} referred to with no record, ${g.noPage.length} with no page -> ${path.relative(process.cwd(), out) || '.'}`);
    return args.strict && graph.meta.warnings.length ? 1 : 0;
  }
  if (cmd === 'gaps') {
    const g = graph.meta.gaps;
    if (args.json) console.log(JSON.stringify(g, null, 2));
    else {
      console.log(`Referred to, no record (${g.stubs.length})`);
      for (const s of g.stubs) console.log(`  ${s.id.padEnd(28)} ${s.role.padEnd(16)} ${s.refs} refs`);
      console.log(`No page (${g.noPage.length})`);
      for (const s of g.noPage) console.log(`  ${s.id.padEnd(28)} ${s.role.padEnd(16)} ${s.label}`);
    }
    return g.stubs.length || g.noPage.length ? 1 : 0;
  }
  if (cmd === 'show') {
    const n = graph.nodes.find((x) => x.id === arg);
    if (!n) { console.error(`${arg}: not in the graph`); return 1; }
    const P = graph.meta.predicates;
    console.log(`${n.id}  ${n.label}\n  role ${n.role}${n.cls ? `, class ${n.cls}` : ''}${n.stub ? ', no record' : ''}\n  page ${n.url || '-'}`);
    for (const l of graph.links) {
      if (l.source === n.id) console.log(`  ${P[l.p] || l.p} -> ${l.target}`);
      if (l.target === n.id) console.log(`  <- ${l.source} ${P[l.p] || l.p}`);
    }
    return 0;
  }
  console.error(USAGE);
  return 2;
}

process.exitCode = await main();
