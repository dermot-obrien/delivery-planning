#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * Post-install check for the ontology skill (DD-11 of AI-Assisted Work).
 *
 * Run from the workspace root; takes no arguments. Checks [suite.ontology] in
 * .agents/skill-bindings.toml against inputs.toml: at least one module is bound, every
 * bound module exists and has an $id, and every $ref resolves to a bound module and class.
 *
 * Exit 0: correct. Exit 1: problems, one line each. Exit 2: environment error.
 */

import {loadWorkspaceOntology} from './lib/workspace.mjs';

const {ontology, files, bindings} = loadWorkspaceOntology(process.cwd());
if (!files.length) {
  console.error(`[suite.ontology] binds no modules in ${bindings.file}`);
  process.exitCode = 1;
} else {
  const problems = ontology.check();
  for (const p of problems) console.error(p);
  if (!problems.length) console.log(`ontology: ${ontology.modules.size} modules, ${ontology.classes().length} classes, every $ref resolves`);
  process.exitCode = problems.length ? 1 : 0;
}
