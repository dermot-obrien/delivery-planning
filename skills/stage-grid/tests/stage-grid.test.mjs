// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0
//
//   node --test skills/stage-grid/tests/stage-grid.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildData, loadInputs, stagesFrom, bandsFrom, boundaryFrom} from '../scripts/lib/grid.mjs';
import {makeResolver} from '../scripts/lib/links.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ws = path.join(here, '..', 'examples', 'workspace');
const graph = JSON.parse(fs.readFileSync(path.join(ws, 'planning', 'graph.json'), 'utf-8'));
const {config, ladderRows} = loadInputs(path.join(ws, 'planning', 'stage-grid.json'));
const data = buildData(graph, config, {ladderRows});
const lane = (id) => data.lanes.find((l) => l.id === id);
const labels = (l, s) => lane(l).cells[s].map((i) => i.label);

test('the stages are the ladder\'s rows, as many as it has, with its columns', () => {
  assert.deepEqual(data.stages.map((s) => s.id), ['R1', 'R2', 'R3', 'R4', 'R5', 'R6']);
  const r2 = data.stages[1];
  assert.equal(r2.name, 'Intended');
  assert.deepEqual(r2.builds, ['Intent on the capability', 'Scenarios named']);
  assert.equal(r2.movedBy, 'architecture');
  assert.equal(data.stages[5].flag, 'Consumable from here');
  assert.ok(data.stages.every((s) => s.color));
});

test('the configuration can choose stages and override one', () => {
  const s = stagesFrom({only: ['R2', 'R4'], stages: [{id: 'R4', name: 'Endorsed', color: '#123456'}]}, ladderRows);
  assert.deepEqual(s.map((x) => [x.id, x.name, x.n]), [['R2', 'Intended', 1], ['R4', 'Endorsed', 2]]);
  assert.equal(s[1].color, '#123456');
  const only = stagesFrom({stages: [{id: 'a', name: 'A'}, {id: 'b', name: 'B'}, {id: 'c', name: 'C'}]}, null);
  assert.equal(only.length, 3);
});

test('bands and the boundary come from the ladder unless configured', () => {
  assert.deepEqual(bandsFrom({}, data.stages).map((b) => [b.from, b.to, b.label]),
    [['R1', 'R1', 'Starting point'], ['R2', 'R3', 'Define'], ['R4', 'R4', 'Design'], ['R5', 'R5', 'Build'], ['R6', 'R6', 'In service']]);
  assert.equal(data.boundary.after, 'R4');
  assert.equal(boundaryFrom({boundary: {after: 'R2'}}, data.stages).after, 'R2');
  assert.equal(boundaryFrom({}, data.stages), null);
});

test('a deliverable is for its own stage, else its type\'s when the type allows one', () => {
  assert.deepEqual(labels('LN-1', 'R1'), ['Catalogue of capabilities for order intake']); // its own stage
  assert.deepEqual(labels('LN-1', 'R2'), ['Catalogue of building blocks for order intake']); // its own stage, of the two its type allows
  assert.deepEqual(labels('LN-1', 'R4'), ['Physical patterns on A and B']); // its type allows only R4
  assert.deepEqual(labels('LN-1', 'R3'), ['Intake pattern']);
  assert.deepEqual(data.stages[2].types, [{id: 'T-PAT', name: 'Pattern'}]);
});

test('a type that allows several stages needs the deliverable to say which', () => {
  const g = JSON.parse(JSON.stringify(graph));
  delete g.nodes.find((n) => n.id === 'EP-2-D1').props.stage;
  const d = buildData(g, config, {ladderRows});
  assert.deepEqual(d.lanes.find((l) => l.id === 'LN-2').cells.R3, []);
  assert.deepEqual(d.warnings, ['EP-2-D1: its type can be produced at R2, R3; record which stage it is for']);
});

test('a deliverable for a stage its type does not list is a warning', () => {
  const g = JSON.parse(JSON.stringify(graph));
  g.nodes.find((n) => n.id === 'EP-2-D1').props.stage = 'R4';
  const d = buildData(g, config, {ladderRows});
  assert.ok(d.warnings.includes('EP-2-D1: is for R4, which its type T-PAT does not list (R2, R3)'));
});

test('the old rung names still read', () => {
  const g = JSON.parse(JSON.stringify(graph));
  const cat = g.nodes.find((n) => n.id === 'EP-1-D1');
  cat.props.rung = cat.props.stage; delete cat.props.stage;
  const rows = ladderRows.map(({stage, ...r}) => ({rung: stage, ...r}));
  const d = buildData(g, config, {ladderRows: rows});
  assert.deepEqual(d.stages.map((s) => s.id), ['R1', 'R2', 'R3', 'R4', 'R5', 'R6']);
  assert.deepEqual(d.lanes[0].cells.R1.map((i) => i.label), ['Catalogue of capabilities for order intake']);
});

test('groups, exclusions and the deliverables not on the grid', () => {
  assert.deepEqual(lane('LN-1').cells.R4, [{label: 'Physical patterns on A and B', deliverables: ['EP-1-D4', 'EP-1-D5'], epics: ['EP-1']}]);
  assert.deepEqual(labels('LN-2', 'R3'), ['Status pattern']);
  assert.equal(data.epics['EP-1'].deliverables.find((d) => d.id === 'EP-1-D6').stage, null);
});

test('a lane carries its description, criteria and outcomes', () => {
  const l = lane('LN-1');
  assert.equal(l.label, 'Order capture');
  assert.equal(l.description, 'An invented capability for the example.');
  assert.deepEqual(l.criteria.map((c) => c.id), ['INC-1']);
  assert.equal(l.outcomes[0].stage, 'R6');
  assert.deepEqual(data.warnings, []);
});

test('the build writes the data file and the app', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'stage-grid-'));
  execFileSync(process.execPath, [path.join(here, '..', 'scripts', 'stage-grid.mjs'), 'build', '--out', out], {cwd: ws, stdio: 'pipe'});
  assert.deepEqual(fs.readdirSync(out).sort(), ['index.html', 'stage-grid-data.js', 'stage-grid.js']);
  const js = fs.readFileSync(path.join(out, 'stage-grid-data.js'), 'utf-8');
  assert.ok(js.startsWith('// Generated by the stage-grid skill'));
  assert.ok(!js.slice(js.indexOf('{')).includes('<'));
});

test('links: the graph\'s url, else the manifest, else the role\'s template, after the base', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'links-'));
  fs.writeFileSync(path.join(dir, 'ids.json'), JSON.stringify({ids: {'EP-2': 'work/ep-2/'}}));
  const r = makeResolver({base: '/site/', manifest: 'ids.json', templates: {epic: 'epics/{id}.html', story: 'epics/{epic}.html#{id}'}, keys: 'https://t.example.org/{key}', none: ['deliverable']}, {configDir: dir});
  assert.equal(r.url({id: 'EP-1', role: 'epic', url: 'https://elsewhere.example.org/ep-1'}), 'https://elsewhere.example.org/ep-1');
  assert.equal(r.url({id: 'EP-2', role: 'epic'}), '/site/work/ep-2/');
  assert.equal(r.url({id: 'EP-3', role: 'epic'}), '/site/epics/EP-3.html');
  assert.equal(r.url({id: 'EP-3-A1', role: 'story', epic: 'EP-3'}), '/site/epics/EP-3.html#EP-3-A1');
  assert.equal(r.url({id: 'EP-3-A1', role: 'story'}), ''); // the template needs {epic}
  assert.equal(r.url({id: 'EP-3-D1', role: 'deliverable', url: 'x.html'}), ''); // never linked
  assert.equal(r.url({id: 'LN-1', role: 'capability'}), ''); // no page, no link
  assert.equal(r.key('TRK-1'), 'https://t.example.org/TRK-1');
  assert.equal(makeResolver({}).key('TRK-1'), '');
});

test('the Harbourline example builds clean, and every page it links to exists', () => {
  const hl = path.join(here, '..', 'examples', 'harbourline');
  const g = JSON.parse(fs.readFileSync(path.join(hl, 'planning', 'graph.json'), 'utf-8'));
  const inputs = loadInputs(path.join(hl, 'planning', 'stage-grid.json'));
  const d = buildData(g, inputs.config, inputs);
  assert.deepEqual(d.warnings, []);
  assert.equal(d.stages.length, 6);
  const app = path.join(hl, 'stage-grid');
  const urls = Object.values(d.epics).flatMap((e) => [e.url, ...e.stories.map((s) => s.url), ...e.patterns.map((p) => p.url), ...e.deliverables.map((x) => x.url)]).filter(Boolean);
  assert.ok(urls.length > 10);
  for (const u of urls) assert.ok(fs.existsSync(path.join(app, u.split('#')[0])), u);
  assert.ok(d.lanes.every((l) => l.url === ''));
});
