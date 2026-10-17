// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/** The workspace's ontology: the module files and prefixes bound in [suite.ontology]. */

import fs from 'node:fs';
import {readBindings, boundPath} from './bindings.mjs';
import {Ontology} from './ontology.mjs';

export const SUITE = 'ontology';

const asList = (v) => (v === undefined || v === '' ? [] : Array.isArray(v) ? v : [v]);

/** "mo=https://example.org/schema.json" entries as {mo: "https://..."}. */
export function parsePrefixes(list) {
  const out = {};
  for (const entry of asList(list)) {
    const i = entry.indexOf('=');
    if (i > 0) out[entry.slice(0, i).trim()] = entry.slice(i + 1).trim();
  }
  return out;
}

/**
 * Load the ontology a workspace binds. `modules` given here (paths relative to the working
 * directory) replace the bound ones, which is how the command line's --module works.
 */
export function loadWorkspaceOntology(root, {modules, prefixes} = {}) {
  const b = readBindings(root, SUITE);
  const files = modules && modules.length ? modules : asList(b.modules).map((m) => boundPath(b, m));
  const missing = files.filter((f) => !fs.existsSync(f));
  const ontology = Ontology.load(files.filter((f) => fs.existsSync(f)), {prefixes: {...parsePrefixes(b.prefixes), ...(prefixes || {})}});
  for (const f of missing) ontology.problems.push(`${f}: bound but not found`);
  return {ontology, bindings: b, files};
}
