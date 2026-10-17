// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0

/**
 * The stage grid's data, from a work graph and a grid configuration.
 *
 * Rows are lanes (capabilities or capability areas), columns are stages (the steps of the
 * workspace's definition ladder, as many as it has), and each cell is an increment step:
 * what the period's epics in that lane deliver towards that stage. The row in one period
 * is the lane's capability increment.
 *
 * The graph is the knowledge-graph contract, {nodes, links}, with the roles and predicates
 * of references/data-contract.md. Nothing here knows any organisation's identifiers.
 */

import fs from 'node:fs';
import path from 'node:path';
import {makeResolver} from './links.mjs';

/** RFC 4180 CSV into objects keyed by the header row. */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; } else if (c === '"') quoted = false; else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  return head ? body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()]))) : [];
}

const truthy = (v) => v === true || /^(yes|true|y|1)$/i.test(String(v || '').trim());
const list = (v) => (Array.isArray(v) ? v : String(v || '').split(';')).map((x) => String(x).trim()).filter(Boolean);

/** A neutral ramp, cool grey through blue to green, for stages that set no colour. */
export function defaultColor(i, n) {
  const t = n > 1 ? i / (n - 1) : 0;
  const hue = 215 - 65 * t, sat = 12 + 50 * t, light = 52 - 18 * t;
  return `hsl(${hue.toFixed(0)} ${sat.toFixed(0)}% ${light.toFixed(0)}%)`;
}

/**
 * The stages: the ladder's rows (stage, name, description, builds, band, moved_by, consumable),
 * in order, limited to config.only when given, with config.stages overriding any field by
 * id; or config.stages alone when no ladder is given.
 */
export function stagesFrom(config, ladderRows) {
  const overrides = new Map((config.stages || []).map((s) => [s.id, s]));
  let stages = ladderRows && ladderRows.length
    ? ladderRows.map((r) => ({id: r.stage || r.rung, name: r.name, description: r.description || '', builds: list(r.builds), band: r.band || '', movedBy: r.moved_by || '', consumable: truthy(r.consumable)}))
    : (config.stages || []).map((s) => ({...s}));
  const only = config.only || config.rungs;
  if (only) stages = only.map((id) => stages.find((s) => s.id === id)).filter(Boolean);
  stages = stages.map((s) => {
    const o = overrides.get(s.id) || {};
    return {...s, ...o, builds: list(o.builds ?? s.builds), movedBy: o.movedBy ?? s.movedBy ?? '', consumable: truthy(o.consumable ?? s.consumable)};
  });
  stages.forEach((s, i) => {
    s.color ||= defaultColor(i, stages.length);
    s.n = i + 1;
  });
  const first = stages.findIndex((s) => s.consumable);
  stages.forEach((s, i) => { s.flag = s.flag || (i === first ? config.consumableLabel || 'Consumable from here' : ''); });
  return stages;
}

/** Bands: config.bands, else runs of consecutive stages with the same band and mover. */
export function bandsFrom(config, stages) {
  if (config.bands) return config.bands;
  const out = [];
  for (const s of stages) {
    const last = out[out.length - 1];
    if (last && last.label === (s.band || '') && last.who === (s.movedBy || '')) last.to = s.id;
    else out.push({from: s.id, to: s.id, label: s.band || '', who: s.movedBy || ''});
  }
  return out.some((b) => b.label || b.who) ? out : [];
}

/** Where the planning team stops: config.boundary.after, else the last stage its mover moves. */
export function boundaryFrom(config, stages) {
  const b = config.boundary;
  if (!b) return null;
  let after = b.after;
  if (!after && b.mover) {
    const mine = stages.filter((s) => s.movedBy === b.mover);
    after = mine.length ? mine[mine.length - 1].id : null;
  }
  return after ? {...b, after} : null;
}

export function indexGraph(graph) {
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));
  const out = new Map(), inn = new Map();
  const push = (m, k, p, v) => { if (!m.has(k)) m.set(k, {}); (m.get(k)[p] ||= []).push(v); };
  for (const l of graph.links) { push(out, l.source, l.p, l.target); push(inn, l.target, l.p, l.source); }
  return {
    nodes,
    outs: (id, p) => (out.get(id) || {})[p] || [],
    ins: (id, p) => (inn.get(id) || {})[p] || [],
  };
}

export function buildData(graph, config, {ladderRows = null, configDir = '.'} = {}) {
  const link = makeResolver(config.links, {configDir});
  const page = (n, extra = {}) => link.url({...(n.props || {}), id: n.id, role: n.role, url: n.url, key: (n.props || {}).key, ...extra});
  const g = indexGraph(graph);
  const node = (id) => g.nodes.get(id) || {id, label: id, props: {}, stub: true};
  const stages = stagesFrom(config, ladderRows);
  const stageIds = new Set(stages.map((s) => s.id));
  const stageName = (id) => (stages.find((s) => s.id === id) || {}).name || id;
  const placement = config.placement || {};
  const labels = config.labels || {};
  const warnings = [];
  if (!stages.length) warnings.push('no stages: bind a ladder or list stages in the configuration');
  for (const [k, v] of Object.entries({...placement.byType, ...placement.byDeliverable})) {
    if (!stageIds.has(v)) warnings.push(`placement ${k}: ${v} is not a stage`);
  }

  // A deliverable is for one stage; its type can be produced at many. Its stage is its own
  // (stage, once rung), else the configuration's for it, else its type's when the type has
  // exactly one, else the configuration's for its type. A deliverable whose type allows
  // several stages and that names none stays off the grid, with a warning. Excluded
  // deliverables stay off the grid.
  const typeStages = (type) => String((type && (type.props.stages || type.props.stage || type.props.rung)) || '')
    .split(';').map((x) => x.trim()).filter(Boolean);
  const stageOf = (d, typeId) => {
    if ((placement.exclude || []).includes(d.id)) return null;
    const type = typeId ? node(typeId) : null;
    const allowed = typeStages(type);
    const s = d.props.stage || d.props.rung || (placement.byDeliverable || {})[d.id]
      || (allowed.length === 1 ? allowed[0] : null) || (typeId && (placement.byType || {})[typeId]) || null;
    if (!s && allowed.length > 1) warnings.push(`${d.id}: its type can be produced at ${allowed.join(', ')}; record which stage it is for`);
    if (s && allowed.length && !allowed.includes(s)) warnings.push(`${d.id}: is for ${s}, which its type ${typeId} does not list (${allowed.join(', ')})`);
    return s && stageIds.has(s) ? s : null;
  };

  const period = config.period;
  if (!g.nodes.has(period)) warnings.push(`period ${period}: not in the graph`);
  const inPeriod = g.ins(period, 'scheduledIn').map(node)
    .filter((n) => n.role === 'epic' && Object.entries(config.epicFilter || {}).every(([k, v]) => n.props[k] === v));

  const epics = {};
  const typesAt = Object.fromEntries(stages.map((s) => [s.id, new Map()]));
  const describeEpic = (e) => {
    const deliverables = g.outs(e.id, 'produces').map(node).map((d) => {
      const typeId = g.outs(d.id, 'typedAs')[0] || '';
      const type = typeId ? node(typeId) : null;
      const stage = stageOf(d, typeId);
      if (stage && type && !type.stub) typesAt[stage].set(type.id, type.label);
      return {
        id: d.id, name: d.label, label: labels[d.id] || d.label, state: d.props.state || '', approval: d.props.approval || '',
        type: typeId, typeName: type && !type.stub ? type.label : '', stage, stageName: stage ? stageName(stage) : '', url: page(d, {epic: e.id}),
      };
    });
    const advances = g.outs(e.id, 'advances').map(node);
    return {
      id: e.id, key: e.props.key || '', keyUrl: link.key(e.props.key), title: e.label, url: page(e),
      goal: e.props.goal || '', status: e.props.status || '', approval: e.props.approval || '',
      budget: e.props.budget_points ?? null, planned: e.props.planned_points ?? null,
      lanes: advances.filter((n) => n.role === 'capability').map((n) => n.id),
      increments: advances.filter((n) => n.role === 'increment').map((n) => ({id: n.id, text: n.label, status: n.props.satisfaction_status || n.props.status || ''})),
      patterns: g.outs(e.id, 'refines').map(node).map((n) => ({id: n.id, name: n.label, url: n.stub ? '' : page(n), role: n.role})),
      initiative: (g.outs(e.id, 'partOf').map(node).find((n) => n.role === 'initiative') || {}).label || '',
      dependsOn: g.outs(e.id, 'dependsOn'),
      deliverables,
      stories: g.ins(e.id, 'partOf').map(node).filter((s) => s.role === 'story').map((s) => ({
        id: s.id, key: s.props.key || '', keyUrl: link.key(s.props.key), title: s.label, status: s.props.status || '', url: page(s, {epic: e.id}), produces: g.outs(s.id, 'produces'),
      })),
    };
  };

  const lanes = (config.lanes || []).map((cfg) => {
    const laneId = cfg.lane || cfg.id;
    const lane = node(laneId);
    if (lane.stub) warnings.push(`lane ${laneId}: not in the graph`);
    const laneEpics = inPeriod.filter((e) => g.outs(e.id, 'advances').includes(laneId)
      && (!cfg.epic_ids || cfg.epic_ids.includes(e.id)) && !(cfg.excludeEpics || []).includes(e.id));
    for (const e of laneEpics) epics[e.id] ||= describeEpic(e);
    const all = laneEpics.flatMap((e) => epics[e.id].deliverables.map((d) => ({...d, epic: e.id})));
    const cells = Object.fromEntries(stages.map((s) => [s.id, []]));
    const grouped = new Set();
    for (const grp of cfg.groups || []) {
      const members = all.filter((d) => grp.deliverables.includes(d.id));
      const stage = grp.stage || (members[0] && members[0].stage);
      if (!members.length || !stage || !cells[stage]) { warnings.push(`lane ${laneId}: group "${grp.label}" has no deliverable or no stage`); continue; }
      members.forEach((d) => grouped.add(d.id));
      cells[stage].push({label: grp.label, deliverables: members.map((d) => d.id), epics: [...new Set(members.map((d) => d.epic))]});
    }
    for (const d of all) if (d.stage && !grouped.has(d.id)) cells[d.stage].push({label: d.label, deliverables: [d.id], epics: [d.epic]});
    const outcomes = (cfg.outcomes || []).map((o) => { const s = o.stage || o.rung; return {...o, stage: s && cells[s] ? s : stages[stages.length - 1].id}; });
    return {
      id: laneId, label: cfg.label || lane.label, description: cfg.description || lane.props.description || lane.props.Description || '',
      url: lane.stub ? '' : page(lane), epics: laneEpics.map((e) => e.id), cells, outcomes,
      criteria: [...new Map(laneEpics.flatMap((e) => epics[e.id].increments).map((c) => [c.id, c])).values()],
    };
  });

  for (const s of stages) s.types = [...typesAt[s.id]].map(([id, name]) => ({id, name}));
  return {
    title: config.title || 'Stage grid', subtitle: config.subtitle || '', period, strap: config.strap || '',
    stages, boundary: boundaryFrom(config, stages), bands: bandsFrom(config, stages), note: config.note || '',
    lanes, epics, warnings,
    generated: (process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000) : new Date()).toISOString(), source: graph.meta ? graph.meta.title : '',
  };
}

/** Read the configuration and, when it names one, the ladder (relative to the configuration). */
export function loadInputs(configFile, {ladder} = {}) {
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  const ladderFile = ladder || (config.ladder && path.resolve(path.dirname(configFile), config.ladder));
  const ladderRows = ladderFile ? parseCsv(fs.readFileSync(ladderFile, 'utf-8')) : null;
  return {config, ladderRows, configDir: path.dirname(path.resolve(configFile))};
}
