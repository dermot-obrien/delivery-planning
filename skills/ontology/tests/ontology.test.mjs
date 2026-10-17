// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Ontology, baseId, derivedPrefix} from '../scripts/lib/ontology.mjs';
import {readBindings} from '../scripts/lib/bindings.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const modules = ['work', 'delivery'].map((m) => path.join(here, '..', 'examples', 'modules', `${m}.schema.json`));

test('module ids lose their version, and prefixes come from the id', () => {
  assert.equal(baseId('pkg:generic/a/b/delivery-ontology@1.2.0'), 'pkg:generic/a/b/delivery-ontology');
  assert.equal(derivedPrefix('pkg:generic/a/b/delivery-ontology@1.2.0'), 'delivery');
  assert.equal(derivedPrefix('https://example.org/standards/ontology-schema.json'), 'ontology');
});

test('a class is found by IRI, prefixed name or bare name', () => {
  const o = Ontology.load(modules);
  const iri = 'pkg:generic/example/delivery/delivery-ontology#/$defs/Epic';
  assert.equal(o.expand('delivery:Epic'), iri);
  assert.equal(o.expand('Epic'), iri);
  assert.equal(o.expand('pkg:generic/example/delivery/delivery-ontology@1.0.0#/$defs/Epic'), iri);
  assert.equal(o.expand('delivery:Nope'), `pkg:generic/example/delivery/delivery-ontology#/$defs/Nope`);
  assert.equal(o.describe('delivery:Nope'), null);
});

test('a class inherits across modules and its link fields are marked', () => {
  const d = Ontology.load(modules).describe('delivery:Epic');
  assert.deepEqual(d.extends, ['pkg:generic/example/work/work-ontology#/$defs/WorkItem']);
  assert.equal(d.properties.initiative_id.link, true);
  assert.equal(d.properties.refines_pattern_ids.link, true);
  assert.equal(d.properties.title.link, false);
});

test('check names a $ref to a module that is not bound', () => {
  assert.deepEqual(Ontology.load(modules).check(), []);
  const problems = Ontology.load([modules[1]]).check();
  assert.ok(problems.some((p) => p.includes('names a module that is not bound')));
});

test('declared prefixes override derived ones', () => {
  const o = Ontology.load(modules, {prefixes: {dp: 'pkg:generic/example/delivery/delivery-ontology@1.0.0'}});
  assert.equal(o.compact(o.expand('dp:Story')), 'dp:Story');
});

test('bindings read multi-line arrays and resolve against the bindings file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ontology-'));
  fs.mkdirSync(path.join(dir, '.agents'));
  fs.writeFileSync(path.join(dir, '.agents', 'skill-bindings.toml'), '[suite.other]\nmodules = ["x"]\n\n[suite.ontology]\nmodules = [\n  "../a.json", # base\n  "../b.json",\n]\nprefixes = ["mo=https://example.org/s.json"]\n');
  const b = readBindings(dir, 'ontology');
  assert.deepEqual(b.modules, ['../a.json', '../b.json']);
  assert.deepEqual(b.prefixes, ['mo=https://example.org/s.json']);
  assert.equal(b.base, path.join(dir, '.agents'));
});
