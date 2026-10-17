// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * Where each thing on the grid links to, from the configuration's `links` table alone.
 *
 * The grid knows nothing about any site. A workspace says how its pages are found, and a
 * thing with no page gets no link, so nothing on the grid is clickable to nowhere.
 *
 *   links.base        prefix for every relative page: a URL ("https://site.example/"), a
 *                     site-relative path ("/docs/"), or a path relative to the app's own
 *                     folder ("../site/"), which keeps links working when opened from disk
 *   links.manifest    a file mapping identifiers to routes, {"ids": {"EP-1": "epics/ep-1/"}},
 *                     relative to the configuration. A site's id/index.json is one
 *   links.templates   a page per role, from the thing's fields: {"epic": "epics/{id}.html",
 *                     "story": "epics/{epic}.html#{id}"}. Fields: id, key, epic, lane, and
 *                     any prop
 *   links.keys        a link for an epic's or story's key, such as a tracker's browse page:
 *                     "https://tracker.example.org/browse/{key}"
 *   links.fromGraph   use a url the graph already carries (default true)
 *   links.none        roles never linked, whatever else says
 *
 * Order, first that gives a page: the graph's url, the manifest, the role's template.
 */

import fs from 'node:fs';
import path from 'node:path';

const ABSOLUTE = /^[a-z][a-z0-9+.-]*:|^\//i;

function fill(template, fields) {
  let missing = false;
  const out = template.replace(/\{([^}]+)\}/g, (_, k) => {
    const v = fields[k];
    if (v === undefined || v === null || v === '') { missing = true; return ''; }
    return encodeURIComponent(String(v)).replace(/%2F/gi, '/');
  });
  return missing ? null : out;
}

export function makeResolver(links = {}, {configDir = '.'} = {}) {
  const base = links.base || '';
  const none = new Set(links.none || []);
  let manifest = {};
  if (links.manifest) {
    const f = path.resolve(configDir, links.manifest);
    if (fs.existsSync(f)) {
      const m = JSON.parse(fs.readFileSync(f, 'utf-8'));
      manifest = m.ids || m;
    }
  }
  const join = (u) => (!u ? '' : ABSOLUTE.test(u) || u.startsWith('#') ? u : base + u);

  /** The page for a thing, or '' when it has none. fields: {id, role, url?, key?, ...}. */
  const url = (fields) => {
    if (!fields || none.has(fields.role)) return '';
    if (links.fromGraph !== false && fields.url) return join(fields.url);
    if (manifest[fields.id]) return join(manifest[fields.id]);
    const t = (links.templates || {})[fields.role];
    return t ? join(fill(t, fields) || '') : '';
  };
  const key = (k) => (k && links.keys ? fill(links.keys, {key: k}) || '' : '');
  return {url, key};
}
