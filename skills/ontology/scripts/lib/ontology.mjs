// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * Layered ontology modules written as JSON Schema 2020-12.
 *
 * A module is one schema file whose `$id` names it, a purl such as
 * pkg:generic/acme/delivery/delivery-ontology@1.0.0 or a URL. Its classes are its `$defs`.
 * A higher layer extends a lower one with `allOf` and a `$ref` to the lower module's id,
 * with or without the version. A class is named by its IRI, the module id without the
 * version followed by `#/$defs/<Name>`, which is the same string a `$ref` already uses.
 *
 * Short forms are accepted wherever a class is asked for:
 *   delivery:Epic   a prefix, declared or derived from the module id, then the class name
 *   Epic            a bare name, when exactly one loaded module defines it
 *
 * Nothing here fetches: the source map is the list of module files the workspace binds.
 */

import fs from 'node:fs';
import path from 'node:path';

const DEFS = '#/$defs/';

/** A module id without its @version. */
export function baseId(id) {
  return String(id || '').replace(/@[^/#@]+$/, '');
}

/** The prefix a module gets when none is declared: delivery-ontology -> delivery. */
export function derivedPrefix(id) {
  const last = baseId(id).split(/[/:]/).filter(Boolean).pop() || '';
  return last.replace(/\.schema\.json$|\.json$/, '').replace(/-ontology$|-schema$/, '');
}

function versionOf(schema) {
  const m = /@([^/#@]+)$/.exec(schema.$id || '');
  return schema.version || schema['x-version'] || (m ? m[1] : '');
}

function splitRef(ref, fromModule) {
  const i = ref.indexOf('#');
  const mod = i === 0 ? fromModule : baseId(i < 0 ? ref : ref.slice(0, i));
  const frag = i < 0 ? '' : ref.slice(i);
  return {module: mod, name: frag.startsWith(DEFS) ? frag.slice(DEFS.length) : null};
}

const isLinkName = (name) => /(_id|_ids|Id|Ids)$/.test(name);

export class Ontology {
  constructor() {
    this.modules = new Map(); // base id -> {id, base, version, file, prefix, schema}
    this.prefixes = new Map(); // prefix -> base id
    this.declared = new Set(); // prefixes the workspace declared, preferred when compacting
    this.problems = [];
  }

  /** Load module files; a later file with the same base id replaces an earlier one. */
  static load(files, {prefixes = {}} = {}) {
    const o = new Ontology();
    for (const f of files) {
      let schema;
      try {
        schema = JSON.parse(fs.readFileSync(f, 'utf-8'));
      } catch (e) {
        o.problems.push(`${f}: cannot read (${e.message})`);
        continue;
      }
      if (!schema.$id) { o.problems.push(`${f}: no $id, so it cannot be referred to`); continue; }
      const base = baseId(schema.$id);
      o.modules.set(base, {id: schema.$id, base, version: versionOf(schema), file: path.resolve(f), prefix: derivedPrefix(schema.$id), schema});
    }
    for (const m of o.modules.values()) if (!o.prefixes.has(m.prefix)) o.prefixes.set(m.prefix, m.base);
    for (const [p, iri] of Object.entries(prefixes)) { o.prefixes.set(p, baseId(iri)); o.declared.add(p); }
    return o;
  }

  /** The IRI of a class given as an IRI, a prefixed name or a bare name; null if unknown. */
  expand(ref) {
    if (!ref) return null;
    if (ref.includes('#')) {
      const {module, name} = splitRef(ref, null);
      return name ? `${module}${DEFS}${name}` : null;
    }
    const m = /^([A-Za-z][\w.-]*):([A-Za-z_][\w]*)$/.exec(ref);
    if (m && this.prefixes.has(m[1])) return `${this.prefixes.get(m[1])}${DEFS}${m[2]}`;
    const hits = [...this.modules.values()].filter((mod) => mod.schema.$defs && mod.schema.$defs[ref]);
    return hits.length === 1 ? `${hits[0].base}${DEFS}${ref}` : null;
  }

  /** A compact name for an IRI, prefix:Name, when a prefix covers its module. */
  compact(iri) {
    const {module, name} = splitRef(iri, null);
    const order = [...this.prefixes].sort(([a], [b]) => Number(this.declared.has(b)) - Number(this.declared.has(a)));
    for (const [p, base] of order) if (base === module) return `${p}:${name}`;
    return iri;
  }

  def(iri) {
    const {module, name} = splitRef(iri, null);
    const mod = this.modules.get(module);
    return mod && name && mod.schema.$defs ? mod.schema.$defs[name] : undefined;
  }

  has(iri) {
    return this.def(iri) !== undefined;
  }

  /** Every class in every module, as {iri, name, module, prefix}. */
  classes() {
    const out = [];
    for (const mod of this.modules.values()) {
      for (const name of Object.keys(mod.schema.$defs || {})) {
        out.push({iri: `${mod.base}${DEFS}${name}`, name, module: mod.base, prefix: mod.prefix});
      }
    }
    return out;
  }

  /**
   * A class with what it inherits: its description, the classes it extends, and its
   * properties merged across allOf, each marked as a link when its name ends in _id or
   * _ids or it declares x-target.
   */
  describe(ref) {
    const iri = this.expand(ref) || ref;
    const def = this.def(iri);
    if (def === undefined) return null;
    const {module, name} = splitRef(iri, null);
    const out = {iri, name, compact: this.compact(iri), module, title: def.title || name, description: def.description || '', extends: [], properties: {}, enum: def.enum || null, unresolved: []};
    const seen = new Set();
    const walk = (d, from) => {
      if (!d || typeof d !== 'object') return;
      if (d.$ref) {
        const r = splitRef(d.$ref, from);
        const target = r.name ? `${r.module}${DEFS}${r.name}` : null;
        if (!target || !this.has(target)) { out.unresolved.push(d.$ref); return; }
        if (seen.has(target)) return;
        seen.add(target);
        out.extends.push(target); // only a class itself and its allOf parts are walked
        walk(this.def(target), r.module);
      }
      for (const part of d.allOf || []) walk(part, from);
      for (const [p, s] of Object.entries(d.properties || {})) {
        if (out.properties[p]) continue;
        const item = s && s.items ? s.items : s;
        out.properties[p] = {
          description: (s && s.description) || '',
          type: (s && (s.type || (s.items && 'array'))) || (item && item.$ref ? 'ref' : ''),
          link: isLinkName(p) || Boolean(s && s['x-target']),
          target: (s && s['x-target']) || null,
        };
      }
    };
    walk(def, module);
    out.extends = [...new Set(out.extends)];
    return out;
  }

  /** Every $ref in every module that names a module or class not loaded. */
  check() {
    const problems = [...this.problems];
    const visit = (node, mod, where) => {
      if (!node || typeof node !== 'object') return;
      if (typeof node.$ref === 'string') {
        const r = splitRef(node.$ref, mod.base);
        if (!this.modules.has(r.module)) problems.push(`${where}: $ref ${node.$ref} names a module that is not bound`);
        else if (r.name && !this.has(`${r.module}${DEFS}${r.name}`)) problems.push(`${where}: $ref ${node.$ref} names a class its module does not define`);
      }
      for (const [k, v] of Object.entries(node)) if (k !== 'examples' && typeof v === 'object') visit(v, mod, where);
    };
    for (const mod of this.modules.values()) {
      for (const [name, def] of Object.entries(mod.schema.$defs || {})) visit(def, mod, `${mod.prefix}:${name}`);
    }
    return problems;
  }
}
