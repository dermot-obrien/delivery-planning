// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build, pick} from '../scripts/lib/build.mjs';
import {render} from '../scripts/lib/render.mjs';
import {parseCsv, values} from '../scripts/lib/sources.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ws = path.join(here, '..', 'examples', 'workspace');
const graph = await build(path.join(ws, 'graph-map.json'), {root: ws});
const node = (id) => graph.nodes.find((n) => n.id === id);
const has = (s, p, t) => graph.links.some((l) => l.source === s && l.p === p && l.target === t);

test('CSV handles quotes, commas and a BOM', () => {
  assert.deepEqual(parseCsv(String.fromCharCode(0xfeff) + 'a,b\n"x, y","say ""hi"""\n'), [{a: 'x, y', b: 'say "hi"'}]);
  assert.deepEqual(values('A; B', ';'), ['A', 'B']);
  assert.deepEqual(values(['A', {id: 'B'}]), ['A', 'B']);
});

test('a path picks a value from deep in a record', () => {
  const r = {refs: [{system: 'a', id: 'A-1'}, {system: 'b', id: 'B-2'}]};
  assert.equal(pick(r, 'refs[system=b].id'), 'B-2');
  assert.equal(pick(r, 'refs.0.id'), 'A-1');
  assert.equal(pick(r, 'refs[system=c].id'), undefined);
});

test('records become nodes with the role and class the map gives them', () => {
  assert.equal(graph.meta.warnings.length, 0, graph.meta.warnings.join('\n'));
  assert.equal(node('EP-901').role, 'epic');
  assert.equal(node('EP-901').cls, 'delivery:Epic');
  assert.equal(node('EP-901-A1').cls, 'delivery:Story');
  assert.equal(node('INC-01').cls, 'delivery:CapabilityIncrement');
  assert.equal(graph.meta.roles.epic.mapping.description, 'A work item sized and scheduled in one period.');
});

test('link fields, children and created values become edges', () => {
  assert.ok(has('EP-901', 'refines', 'PAT-910'));
  assert.ok(has('EP-901', 'produces', 'EP-901-D1'));
  assert.ok(has('EP-901-A1', 'partOf', 'EP-901'));
  assert.ok(has('EP-902', 'dependsOn', 'EP-901'));
  assert.equal(node('2027-Q1').role, 'period');
  assert.ok(!node('2027-Q1').stub);
});

test('an identifier with no record is a stub, and records without pages are gaps', () => {
  assert.equal(node('PAT-999').stub, true);
  assert.equal(node('PAT-999').role, 'pattern');
  assert.deepEqual(graph.meta.gaps.stubs, [{id: 'PAT-999', role: 'pattern', refs: 1}]);
  assert.equal(node('EP-901').url, 'https://catalogue.example.org/epics/ep-901/');
  assert.ok(graph.meta.gaps.noPage.some((g) => g.id === 'EP-902'));
  assert.ok(!graph.meta.gaps.noPage.some((g) => g.id === '2027-Q1'));
});

test('a role mapped to a class the ontology lacks is a warning', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const map = JSON.parse(fs.readFileSync(path.join(ws, 'graph-map.json'), 'utf-8'));
  map.roles.epic = {exactMatch: 'delivery:Epik'};
  map.sources = map.sources.map((s) => ({...s, file: path.join(ws, s.file)}));
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kg-')), 'map.json');
  fs.writeFileSync(f, JSON.stringify(map));
  const g = await build(f, {root: ws});
  assert.ok(g.meta.warnings.some((w) => w.includes('delivery:Epik')));
});

test('the page inlines everything and escapes the data', () => {
  const html = render(graph);
  assert.ok(html.includes('d3js.org v7'));
  assert.ok(!/<script[^>]+src=/.test(html));
  assert.ok(!html.includes('/*{{DATA}}*/'));
  const data = html.slice(html.indexOf('window.GRAPH'));
  assert.ok(!data.slice(0, data.indexOf('</script>')).includes('<'));
});
