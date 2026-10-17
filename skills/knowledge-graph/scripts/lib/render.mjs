// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * Render a built graph as one HTML file that opens from disk: the template, d3, the
 * viewer and the data are all inlined, so it needs no server, no network and no build.
 */

import fs from 'node:fs';
import path from 'node:path';
import {SKILL_DIR} from './build.mjs';

const asset = (...p) => fs.readFileSync(path.join(SKILL_DIR, 'assets', ...p), 'utf-8');

/** JSON safe to place inside a <script> element. */
function inlineJson(obj) {
  const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
  const BS = String.fromCharCode(92); // a backslash, kept out of this file's own escapes
  return JSON.stringify(obj).split('<').join(BS + 'u003c').split(LS).join(BS + 'u2028').split(PS).join(BS + 'u2029');
}

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);

export function render(graph) {
  return asset('viewer.html')
    .replace('{{TITLE}}', () => escapeHtml(graph.meta.title))
    .replace('/*{{D3}}*/', () => asset('vendor', 'd3.min.js'))
    .replace('/*{{DATA}}*/', () => `window.GRAPH = ${inlineJson(graph)};`)
    .replace('/*{{VIEWER}}*/', () => asset('viewer.js'));
}
