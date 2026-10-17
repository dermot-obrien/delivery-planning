// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * A skill's table in .agents/skill-bindings.toml, read without a TOML parser.
 *
 * Reads only what a bindings table needs: key = "string", key = 'string', key = true,
 * key = 12, and key = ["a", "b"], where an array may run over several lines. Paths in a
 * bindings file are relative to the bindings file, as for every other skill, so the
 * returned object carries that directory as its non-enumerable `base`.
 */

import fs from 'node:fs';
import path from 'node:path';

export const BINDINGS = '.agents/skill-bindings.toml';

function parseValue(raw) {
  const v = raw.trim();
  if (v.startsWith('[')) {
    return [...v.matchAll(/"((?:[^"\\]|\\.)*)"|'([^']*)'/g)].map((m) => (m[1] !== undefined ? m[1] : m[2]));
  }
  if (v.startsWith('"')) return v.slice(1, v.lastIndexOf('"'));
  if (v.startsWith("'")) return v.slice(1, v.lastIndexOf("'"));
  if (v === 'true' || v === 'false') return v === 'true';
  const bare = v.replace(/\s+#.*$/, '');
  return /^-?\d+(\.\d+)?$/.test(bare) ? Number(bare) : bare;
}

/** The [suite.<suite>] table of a bindings file, or {} when the file or table is absent. */
export function readBindings(root, suite, file = BINDINGS) {
  const p = path.resolve(root, file);
  const out = {};
  Object.defineProperty(out, 'base', {value: path.dirname(p), writable: true});
  Object.defineProperty(out, 'file', {value: p, writable: true});
  if (!fs.existsSync(p)) return out;
  let inTable = false;
  let pending = null; // [key, text] while an array runs over several lines
  for (const line of fs.readFileSync(p, 'utf-8').split(/\r?\n/)) {
    const t = line.replace(/^\s+/, '');
    if (pending) {
      pending[1] += ' ' + t.replace(/\s+#.*$/, '');
      if (t.includes(']')) { out[pending[0]] = parseValue(pending[1]); pending = null; }
      continue;
    }
    if (!t || t.startsWith('#')) continue;
    const header = /^\[([^\]]+)\]\s*$/.exec(t.trim());
    if (header) { inTable = header[1].trim() === `suite.${suite}`; continue; }
    if (!inTable) continue;
    const kv = /^([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(t.trim());
    if (!kv) continue;
    if (kv[2].trim().startsWith('[') && !kv[2].includes(']')) { pending = [kv[1], kv[2]]; continue; }
    out[kv[1]] = parseValue(kv[2]);
  }
  return out;
}

/** A bound path, resolved against the bindings file's directory. */
export function boundPath(bindings, value) {
  return path.resolve(bindings.base, value);
}
