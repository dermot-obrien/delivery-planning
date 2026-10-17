#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * Post-install check for the knowledge-graph skill (DD-11 of AI-Assisted Work).
 *
 * Run from the workspace root; takes no arguments. Checks [suite.knowledge-graph] binds a
 * graph map that exists and builds without warnings: every source is found and readable,
 * every mapped class is in the bound ontology. Gaps in the records are not failures here;
 * graph.mjs gaps reports them. Writes nothing.
 *
 * Exit 0: correct. Exit 1: problems, one line each. Exit 2: environment error.
 */

import fs from 'node:fs';
import {readBindings, boundPath} from './lib/bindings.mjs';
import {build} from './lib/build.mjs';

const b = readBindings(process.cwd(), 'knowledge-graph');
if (!b.map) {
  console.error(`[suite.knowledge-graph] binds no map in ${b.file}`);
  process.exitCode = 1;
} else if (!fs.existsSync(boundPath(b, b.map))) {
  console.error(`[suite.knowledge-graph] map ${b.map}: not found`);
  process.exitCode = 1;
} else {
  const g = await build(boundPath(b, b.map), {root: process.cwd()});
  for (const w of g.meta.warnings) console.error(w);
  if (!g.meta.warnings.length) console.log(`knowledge-graph: ${g.meta.counts.nodes} nodes, ${g.meta.counts.links} links from ${b.map}`);
  process.exitCode = g.meta.warnings.length ? 1 : 0;
}
