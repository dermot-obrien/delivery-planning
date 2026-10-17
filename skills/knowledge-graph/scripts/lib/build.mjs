// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * Build a knowledge graph from a workspace's records, as its graph map directs.
 *
 * The graph map (references/graph-map.md) says three things:
 *   roles    which class of the workspace's own ontology plays each role the graph knows
 *   sources  which files hold records, which role each record plays, and which fields link
 *   links    where each identifier's page is, so every node can be opened
 *
 * The result is plain JSON: {meta, nodes, links}. A node is {id, role, label, cls, url,
 * props, stub}; a link is {source, target, p}. A stub is an identifier something refers to
 * that no source holds a record for, which is usually a gap worth seeing.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {readFile, select, matches, values, parseCsv} from './sources.mjs';

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MATCHES = ['exactMatch', 'closeMatch', 'broadMatch', 'narrowMatch', 'relatedMatch'];

export function loadRoles() {
  return JSON.parse(fs.readFileSync(path.join(SKILL_DIR, 'assets', 'roles.json'), 'utf-8'));
}

/** The ontology skill's loader, from beside this skill or ONTOLOGY_SKILL_DIR; null if absent. */
async function ontologyLoader() {
  const dirs = [process.env.ONTOLOGY_SKILL_DIR, path.join(SKILL_DIR, '..', 'ontology')].filter(Boolean);
  for (const d of dirs) {
    const f = path.join(d, 'scripts', 'lib', 'workspace.mjs');
    if (fs.existsSync(f)) return (await import(pathToFileURL(f).href)).loadWorkspaceOntology;
  }
  return null;
}

function label(record, spec, id) {
  if (!spec) return String(record.title ?? record.name ?? id);
  if (spec.includes('{')) return spec.replace(/\{([^}]+)\}/g, (_, k) => String(record[k] ?? '')).trim() || id;
  return String(record[spec] ?? id);
}

/**
 * A value at a path into a record: "a.b", "list.0.id", or "list[system=jira].external_id",
 * where [k=v] picks the first list item whose k equals v.
 */
export function pick(record, dotted) {
  let v = record;
  for (const part of dotted.match(/[^.[\]]+|\[[^\]]*\]/g) || []) {
    if (v == null) return undefined;
    const f = /^\[([^=\]]+)=([^\]]*)\]$/.exec(part);
    v = f ? (Array.isArray(v) ? v.find((x) => x && String(x[f[1]]) === f[2]) : undefined) : v[part];
  }
  return v;
}

function props(record, spec) {
  if (!spec) return {};
  const keys = spec === '*' ? Object.keys(record) : spec;
  const out = {};
  for (const entry of keys) {
    // "name=path" names a value deeper in the record; a plain key is a top-level field.
    const eq = entry.indexOf('=');
    const k = eq > 0 ? entry.slice(0, eq) : entry;
    const v = eq > 0 ? pick(record, entry.slice(eq + 1)) : record[k];
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'object' && !(Array.isArray(v) && v.every((x) => typeof x !== 'object'))) continue;
    out[k] = Array.isArray(v) ? v.join(', ') : v;
  }
  return out;
}

function idSchemes(map, base) {
  const spec = map.idSchemes;
  if (!spec) return [];
  const rows = spec.file ? parseCsv(fs.readFileSync(path.resolve(base, spec.file), 'utf-8')) : spec.schemes || [];
  const prefixCol = spec.prefixColumn || 'prefix';
  const patternCol = spec.patternColumn || 'pattern';
  const out = [];
  for (const r of rows) {
    const role = (spec.roles || {})[r[prefixCol]] || r.role;
    if (!role || !r[patternCol]) continue;
    try { out.push({re: new RegExp(r[patternCol]), role}); } catch { /* a scheme with a bad pattern is skipped */ }
  }
  return out;
}

/**
 * Build the graph. `mapFile` is the graph map; `root` is the workspace root, used to find
 * the ontology bindings and a YAML parser.
 */
export async function build(mapFile, {root = process.cwd()} = {}) {
  const map = JSON.parse(fs.readFileSync(mapFile, 'utf-8'));
  const base = path.dirname(path.resolve(mapFile));
  const vocab = loadRoles();
  const warnings = [];

  // The ontology: what each role's class is, and what it says about itself.
  const loader = await ontologyLoader();
  let ontology = null;
  if (loader) {
    // The map may name module files itself, for a workspace that binds no [suite.ontology].
    const modules = ((map.ontology && map.ontology.modules) || []).map((m) => path.resolve(base, m));
    ontology = loader(root, {modules, prefixes: map.prefixes || {}}).ontology;
    if (!ontology.modules.size) { warnings.push('no ontology modules bound in [suite.ontology]; roles are not checked against classes'); ontology = null; }
  } else warnings.push('the ontology skill is not installed beside this one; roles are not checked against classes');

  const roles = {};
  for (const [role, v] of Object.entries(vocab.roles)) roles[role] = {...v, mapping: null, count: 0};
  for (const [role, m] of Object.entries(map.roles || {})) {
    if (!roles[role]) { warnings.push(`roles.${role}: not a role the graph knows (see assets/roles.json)`); continue; }
    const relation = MATCHES.find((k) => m[k]);
    if (!relation) { roles[role].mapping = {relation: null, note: m.note || ''}; continue; }
    const ref = m[relation];
    const iri = ontology ? ontology.expand(ref) : ref;
    const d = ontology && iri ? ontology.describe(iri) : null;
    if (ontology && !d) warnings.push(`roles.${role}: ${relation} ${ref} is not a class in the bound ontology`);
    roles[role].mapping = {relation, ref, iri: iri || ref, compact: d ? d.compact : ref, description: d ? d.description : '', note: m.note || ''};
    if (m.label) roles[role].label = m.label;
  }
  const classOf = (role, explicit) => {
    if (explicit) return ontology ? ontology.compact(ontology.expand(explicit) || explicit) : explicit;
    const mp = roles[role] && roles[role].mapping;
    return mp && mp.relation ? mp.compact : null;
  };

  // Records into nodes, and their link fields into pending edges.
  const nodes = new Map();
  const pending = [];
  const schemes = idSchemes(map, base);
  const guessRole = (id) => (schemes.find((s) => s.re.test(id)) || {}).role || null;

  const addRecords = (records, spec, source, parent) => {
    for (const rec of records || []) {
      if (!rec || typeof rec !== 'object' || !matches(rec, spec.where)) continue;
      const id = rec[spec.id || 'id'];
      if (id === undefined || id === null || id === '') continue;
      const key = String(id).trim();
      const role = spec.role || guessRole(key) || 'other';
      const prev = nodes.get(key);
      const node = {
        id: key,
        role,
        label: label(rec, spec.label, key),
        cls: classOf(role, spec.class),
        url: spec.url && rec[spec.url] ? String(rec[spec.url]) : prev && prev.url,
        props: {...(prev && !prev.stub ? prev.props : {}), ...props(rec, spec.props)},
        source,
      };
      if (prev && !prev.stub && prev.role !== role) warnings.push(`${key}: ${source} says ${role}, an earlier source says ${prev.role}; keeping ${prev.role}`);
      nodes.set(key, prev && !prev.stub ? {...prev, props: node.props, url: prev.url || node.url} : node);
      if (parent && spec.parent) pending.push({from: parent, to: key, p: spec.parent.p || 'partOf', reverse: Boolean(spec.parent.reverse)});
      for (const l of spec.links || []) {
        for (const v of values(rec[l.field], l.split)) pending.push({from: key, to: v, p: l.p || 'relatedTo', reverse: Boolean(l.reverse), role: l.role, create: Boolean(l.create)});
      }
      for (const child of spec.children || []) addRecords(select(rec, child.select), child, source, key);
    }
  };

  for (const s of map.sources || []) {
    const file = path.resolve(base, s.file);
    if (!fs.existsSync(file)) { warnings.push(`${s.file}: not found`); continue; }
    let content;
    try { content = readFile(file, {root, format: s.format}); } catch (e) { warnings.push(e.message); continue; }
    const records = select(content, s.select);
    if (!Array.isArray(records)) { warnings.push(`${s.file}: ${s.select || 'the file'} is not a list of records`); continue; }
    addRecords(records, s, path.relative(base, file).replace(/\\/g, '/'));
  }

  // Edges. A target with no record becomes a value node (create) or a stub.
  const links = new Map();
  for (const e of pending) {
    if (!nodes.has(e.to)) {
      const role = e.role || guessRole(e.to) || 'other';
      nodes.set(e.to, e.create
        ? {id: e.to, role, label: e.to, cls: classOf(role), props: {}, source: 'value'}
        : {id: e.to, role, label: e.to, cls: classOf(role), props: {}, stub: true, refs: 0});
    }
    const t = nodes.get(e.to);
    if (t.stub) t.refs += 1;
    const [s, d] = e.reverse ? [e.to, e.from] : [e.from, e.to];
    if (s === d) continue;
    links.set(`${s}|${e.p}|${d}`, {source: s, target: d, p: e.p});
  }

  // Pages: the record's own route, else the site's identifier manifest.
  const L = map.links || {};
  let manifest = {};
  let siteBase = L.baseUrl || '';
  if (L.manifest) {
    const mf = path.resolve(base, L.manifest);
    if (fs.existsSync(mf)) {
      const m = JSON.parse(fs.readFileSync(mf, 'utf-8'));
      manifest = m.ids || m;
      siteBase = L.baseUrl || m.base_url || '';
    } else warnings.push(`links.manifest ${L.manifest}: not found; build the site first`);
  }
  const join = (b, r) => (/^[a-z]+:/i.test(r) ? r : b ? b.replace(/\/?$/, '/') + r.replace(/^\//, '') : r);
  for (const n of nodes.values()) {
    if (n.url) n.url = join(siteBase, n.url);
    else if (manifest[n.id]) n.url = join(siteBase, manifest[n.id]);
  }

  // Gaps: what a reader would trip over when clicking through.
  const noUrlRoles = new Set(L.expectPages || Object.keys(roles).filter((r) => !['period', 'party', 'other'].includes(r)));
  const all = [...nodes.values()];
  for (const n of all) roles[n.role] && (roles[n.role].count += 1);
  const gaps = {
    stubs: all.filter((n) => n.stub).map((n) => ({id: n.id, role: n.role, refs: n.refs})).sort((a, b) => b.refs - a.refs || a.id.localeCompare(b.id)),
    noPage: all.filter((n) => !n.stub && !n.url && noUrlRoles.has(n.role)).map((n) => ({id: n.id, role: n.role, label: n.label})),
  };

  return {
    meta: {
      title: map.title || 'Knowledge graph',
      generated: new Date().toISOString(),
      lanes: vocab.lanes,
      roles,
      predicates: {...vocab.predicates, ...(map.predicates || {})},
      counts: {nodes: nodes.size, links: links.size},
      gaps,
      expectPages: [...noUrlRoles],
      warnings,
      view: map.view || {},
    },
    nodes: all.map(({refs, ...n}) => n),
    links: [...links.values()],
  };
}
