#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * Read a workspace's layered ontology.
 *
 *   node ontology.mjs modules                 the bound modules, their prefixes and versions
 *   node ontology.mjs classes [--prefix p]    every class, as prefix:Name and IRI
 *   node ontology.mjs show <class>            one class with what it extends and its links
 *   node ontology.mjs check                   every $ref resolves to a bound module and class
 *
 * Options: --module <file> (repeatable) instead of the bound modules, --prefix p=iri
 * (repeatable) to add a prefix, --json for machine-readable output.
 *
 * Exit 0: done. Exit 1: problems found. Exit 2: usage or environment error.
 */

import {loadWorkspaceOntology, parsePrefixes} from './lib/workspace.mjs';

function parseArgs(argv) {
  const out = {_: [], module: [], prefix: [], json: false};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--module' || a === '--prefix') out[a.slice(2)].push(argv[++i]);
    else if (a === '-h' || a === '--help') out.help = true;
    else out._.push(a);
  }
  return out;
}

const USAGE = 'usage: ontology.mjs modules | classes [--prefix p] | show <class> | check  [--module file]... [--json]';

function main() {
  const args = parseArgs(process.argv.slice(2));
  const [cmd, arg] = args._;
  if (args.help || !cmd) { console.log(USAGE); return 0; }
  const prefixArgs = args.prefix.filter((p) => p.includes('='));
  const {ontology, files} = loadWorkspaceOntology(process.cwd(), {modules: args.module, prefixes: parsePrefixes(prefixArgs)});
  if (!files.length) {
    console.error('No ontology modules: bind [suite.ontology] modules in .agents/skill-bindings.toml, or pass --module.');
    return 2;
  }
  const print = (obj, text) => console.log(args.json ? JSON.stringify(obj, null, 2) : text());

  if (cmd === 'modules') {
    const mods = [...ontology.modules.values()].map((m) => ({prefix: m.prefix, id: m.id, version: m.version, classes: Object.keys(m.schema.$defs || {}).length, file: m.file}));
    print(mods, () => mods.map((m) => `${m.prefix.padEnd(12)} ${String(m.classes).padStart(4)} classes  ${m.id}`).join('\n'));
    return ontology.problems.length ? 1 : 0;
  }
  if (cmd === 'classes') {
    const only = args.prefix.find((p) => !p.includes('='));
    const list = ontology.classes().filter((c) => !only || c.prefix === only).map((c) => ({...c, compact: ontology.compact(c.iri)}));
    print(list, () => list.map((c) => c.compact).join('\n'));
    return 0;
  }
  if (cmd === 'show') {
    if (!arg) { console.error(USAGE); return 2; }
    const d = ontology.describe(arg);
    if (!d) { console.error(`${arg}: no such class in the bound modules`); return 1; }
    print(d, () => {
      const lines = [`${d.compact}  ${d.iri}`];
      if (d.description) lines.push(`  ${d.description}`);
      if (d.extends.length) lines.push(`  extends ${d.extends.map((e) => ontology.compact(e)).join(', ')}`);
      const links = Object.entries(d.properties).filter(([, p]) => p.link);
      if (links.length) lines.push(`  links   ${links.map(([n, p]) => (p.target ? `${n} -> ${p.target}` : n)).join(', ')}`);
      lines.push(`  ${Object.keys(d.properties).length} properties`);
      if (d.unresolved.length) lines.push(`  unresolved ${d.unresolved.join(', ')}`);
      return lines.join('\n');
    });
    return 0;
  }
  if (cmd === 'check') {
    const problems = ontology.check();
    print({problems}, () => (problems.length ? problems.join('\n') : `ok: ${ontology.modules.size} modules, ${ontology.classes().length} classes, every $ref resolves`));
    return problems.length ? 1 : 0;
  }
  console.error(USAGE);
  return 2;
}

process.exitCode = main();
