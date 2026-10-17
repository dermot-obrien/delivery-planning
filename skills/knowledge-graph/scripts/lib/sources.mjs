// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * Read the records a graph map names: CSV, JSON or YAML files.
 *
 * CSV and JSON need nothing. YAML needs a parser the workspace already has: the `yaml` or
 * `js-yaml` package, found from the workspace root, so the skill itself installs nothing.
 */

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

/** RFC 4180 CSV into an array of objects keyed by the header row. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  if (!head) return [];
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

let yamlParser;
function yamlFor(root) {
  if (yamlParser !== undefined) return yamlParser;
  const req = createRequire(path.join(root, 'package.json'));
  for (const name of ['yaml', 'js-yaml']) {
    try {
      const mod = req(name);
      yamlParser = name === 'yaml' ? (t) => mod.parse(t) : (t) => mod.load(t);
      return yamlParser;
    } catch { /* try the next */ }
  }
  yamlParser = null;
  return yamlParser;
}

/** The parsed content of a source file. */
export function readFile(file, {root, format} = {}) {
  const fmt = format || path.extname(file).slice(1).toLowerCase();
  const text = fs.readFileSync(file, 'utf-8');
  if (fmt === 'csv') return parseCsv(text);
  if (fmt === 'json') return JSON.parse(text);
  if (fmt === 'yaml' || fmt === 'yml') {
    const parse = yamlFor(root || process.cwd());
    if (!parse) throw new Error(`${file}: reading YAML needs the yaml or js-yaml package in the workspace (npm install yaml)`);
    return parse(text);
  }
  throw new Error(`${file}: unknown format ${fmt}; use csv, json or yaml`);
}

/** Follow a dotted path into parsed content: "work_item" or "data.items". */
export function select(content, dotted) {
  if (!dotted) return content;
  return dotted.split('.').reduce((v, k) => (v == null ? v : v[k]), content);
}

/** Whether a record satisfies a where clause: {field: value | [values]}; "*" means present. */
export function matches(record, where) {
  if (!where) return true;
  return Object.entries(where).every(([k, want]) => {
    const v = record[k];
    if (want === '*') return v !== undefined && v !== null && v !== '';
    return Array.isArray(want) ? want.includes(v) : v === want;
  });
}

/** The values of a link field: a scalar, a list, or a delimited string. */
export function values(v, split) {
  if (v === undefined || v === null || v === '') return [];
  const list = Array.isArray(v) ? v : split && typeof v === 'string' ? v.split(split) : [v];
  return list.map((x) => (typeof x === 'object' && x !== null ? x.id ?? x.ref ?? null : x)).filter((x) => x !== null && x !== '').map((x) => String(x).trim());
}
