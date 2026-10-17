#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * Post-install check for the stage-grid skill (DD-11 of AI-Assisted Work).
 *
 * Run from the workspace root. Checks [suite.stage-grid] binds a graph and a configuration;
 * when neither carries {quarter}, also that both exist and build without warnings. A
 * binding with {quarter} is checked for shape only, since the quarter is chosen per run.
 * Writes nothing. --help prints this and exits 0.
 *
 * Exit 0: correct. Exit 1: problems, one line each. Exit 2: environment error.
 */

import fs from 'node:fs';
import {readBindings, boundPath} from './lib/bindings.mjs';
import {buildData, loadInputs} from './lib/grid.mjs';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('usage: node scripts/check.mjs   (from the workspace root; checks [suite.stage-grid])');
  process.exit(0);
}

const b = readBindings(process.cwd(), 'stage-grid');
const problems = [];
for (const k of ['graph', 'config']) if (!b[k]) problems.push(`[suite.stage-grid] binds no ${k} in ${b.file}`);
if (!problems.length && ![b.graph, b.config, b.ladder].some((p) => p && p.includes('{quarter}'))) {
  for (const k of ['graph', 'config', 'ladder']) if (b[k] && !fs.existsSync(boundPath(b, b[k]))) problems.push(`[suite.stage-grid] ${k} ${b[k]}: not found`);
  if (!problems.length) {
    const graph = JSON.parse(fs.readFileSync(boundPath(b, b.graph), 'utf-8'));
    const {config, ladderRows, configDir} = loadInputs(boundPath(b, b.config), {ladder: b.ladder ? boundPath(b, b.ladder) : null});
    problems.push(...buildData(graph, config, {ladderRows, configDir}).warnings);
  }
}
for (const p of problems) console.error(p);
if (!problems.length) console.log('stage-grid: ok');
process.exitCode = problems.length ? 1 : 0;
