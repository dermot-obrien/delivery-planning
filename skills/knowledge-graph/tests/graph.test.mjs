// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build, pick, classSlug, resolveView} from '../scripts/lib/build.mjs';
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

test('a class view keeps the records of those classes and the links between them', async () => {
  const g = await build(path.join(ws, 'graph-map.json'), {root: ws, classes: ['delivery:Epic', 'delivery:Story']});
  assert.equal(g.meta.warnings.length, 0, g.meta.warnings.join('\n'));
  assert.deepEqual([...new Set(g.nodes.map((n) => n.cls))].sort(), ['delivery:Epic', 'delivery:Story']);
  assert.ok(g.links.every((l) => g.nodes.some((n) => n.id === l.source) && g.nodes.some((n) => n.id === l.target)));
  assert.ok(g.links.some((l) => l.source === 'EP-901-A1' && l.p === 'partOf' && l.target === 'EP-901'));
  assert.ok(!g.links.some((l) => l.p === 'refines'));
  assert.deepEqual(g.meta.lanes.map((l) => l.id), ['delivery:Epic', 'delivery:Story']);
  const count = (cls) => graph.nodes.filter((n) => n.cls === cls).length;
  assert.deepEqual(g.meta.classView.map((c) => [c.key, c.count]), [['delivery:Epic', count('delivery:Epic')], ['delivery:Story', count('delivery:Story')]]);
  assert.equal(g.meta.view.depth, 0);
  assert.ok(g.nodes.every((n) => n.view === n.cls));
});

test('a class view takes in the classes that extend a chosen class', async () => {
  const g = await build(path.join(ws, 'graph-map.json'), {root: ws, classes: ['work:WorkItem']});
  assert.ok(g.nodes.length > 0);
  assert.ok(g.nodes.every((n) => n.cls === 'delivery:Epic' && n.view === 'work:WorkItem'));
});

test('a named view comes from the map, and an unknown class is a warning', async () => {
  const map = JSON.parse((await import('node:fs')).readFileSync(path.join(ws, 'graph-map.json'), 'utf-8'));
  assert.equal(resolveView(map, {view: 'delivery'}).classes.length, 2);
  assert.throws(() => resolveView(map, {view: 'nope'}), /no such view/);
  assert.equal(resolveView(map, {}), null);
  assert.equal(classSlug(['delivery:Epic', 'work:WorkItem']), 'epic-workitem');
  const g = await build(path.join(ws, 'graph-map.json'), {root: ws, view: 'delivery'});
  assert.equal(g.meta.title, 'Epics and their stories');
  const u = await build(path.join(ws, 'graph-map.json'), {root: ws, classes: ['delivery:Epik']});
  assert.equal(u.nodes.length, 0);
  assert.ok(u.meta.warnings.some((w) => w.includes('delivery:Epik is not a class')));
});

test('an identifier scheme can name the class, so two classes can share a role', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const map = JSON.parse(fs.readFileSync(path.join(ws, 'graph-map.json'), 'utf-8'));
  map.sources = map.sources.map((s) => ({...s, file: path.join(ws, s.file)}));
  map.idSchemes.schemes.unshift({pattern: '^PAT-9[0-9]{2}$', role: 'pattern', class: 'delivery:CapabilityIncrement'});
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kg-')), 'map.json');
  fs.writeFileSync(f, JSON.stringify(map));
  const g = await build(f, {root: ws});
  assert.equal(g.nodes.find((n) => n.id === 'PAT-999').cls, 'delivery:CapabilityIncrement');
  assert.equal(g.nodes.find((n) => n.id === 'PAT-910').cls, 'delivery:CapabilityIncrement');
});

test('the page of a class view lays out by class', async () => {
  const g = await build(path.join(ws, 'graph-map.json'), {root: ws, view: 'delivery'});
  const html = render(g);
  assert.ok(html.includes('"classView"'));
  assert.ok(html.includes('kindOf'));
});
