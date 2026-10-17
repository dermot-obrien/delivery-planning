// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0
//
// The knowledge graph viewer. Reads window.GRAPH ({meta, nodes, links}) and draws it as a
// force layout pulled into lanes (Why, What, When, Delivery, Design), with a detail panel,
// role toggles and a list of gaps. Deep link with #focus=<id>&depth=<n>. A class view
// (meta.classView) lays out one lane per chosen class, and colours and toggles by class.

(function () {
  'use strict';
  const G = window.GRAPH;
  const meta = G.meta;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);

  const byId = new Map(G.nodes.map((n) => [n.id, n]));
  const outs = new Map(), ins = new Map();
  for (const n of G.nodes) { outs.set(n.id, []); ins.set(n.id, []); }
  for (const l of G.links) { outs.get(l.source).push(l); ins.get(l.target).push(l); }
  const degree = (id) => outs.get(id).length + ins.get(id).length;

  const roleOf = (n) => meta.roles[n.role] || meta.roles.other;
  const classes = meta.classView ? new Map(meta.classView.map((c) => [c.key, {...c, lane: c.key, shape: c.shape || 'circle'}])) : null;
  // What a node is drawn as: its class in a class view, else its role.
  const kindOf = (n) => (classes && classes.get(n.view)) || roleOf(n);
  const keyOf = (n) => (classes ? n.view : n.role);
  const color = (n) => `var(--c${kindOf(n).color})`;
  const laneIndex = new Map(meta.lanes.map((l, i) => [l.id, i]));

  // State.
  const view = meta.view || {};
  const hidden = new Set(view.hide || []);
  let focus = null, depth = view.depth == null ? 2 : view.depth, selected = null;

  // Shapes.
  const hexagon = {draw(ctx, size) { const r = Math.sqrt(size / 2.6); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; i ? ctx.lineTo(r * Math.cos(a), r * Math.sin(a)) : ctx.moveTo(r * Math.cos(a), r * Math.sin(a)); } ctx.closePath(); }};
  const SHAPES = {circle: d3.symbolCircle, square: d3.symbolSquare, diamond: d3.symbolDiamond, triangle: d3.symbolTriangle, hexagon};
  const size = (n) => 90 + Math.min(degree(n.id), 30) * 14;

  // Stage.
  const svg = d3.select('#svg');
  const root = svg.append('g');
  const laneLayer = root.append('g');
  const linkLayer = root.append('g');
  const nodeLayer = root.append('g');
  svg.append('defs').append('marker').attr('id', 'arrow').attr('viewBox', '0 -4 8 8').attr('refX', 14).attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto')
    .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', 'var(--edge)');
  const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (e) => { root.attr('transform', e.transform); labelVisibility(e.transform.k); });
  svg.call(zoom).on('dblclick.zoom', null);

  let sim = null, nodeSel = null, linkSel = null, current = {nodes: [], links: []};
  const W = () => $('#stage').clientWidth, H = () => $('#stage').clientHeight;
  const laneX = (n) => { const i = laneIndex.get(kindOf(n).lane) ?? 0; return (i + 0.5) * W() / meta.lanes.length; };

  function visibleSet() {
    const ok = (n) => !hidden.has(keyOf(n));
    if (!focus || depth === 0) return new Set(G.nodes.filter(ok).map((n) => n.id));
    const seen = new Set([focus]);
    let frontier = [focus];
    for (let d = 0; d < depth; d++) {
      const next = [];
      for (const id of frontier) {
        for (const l of outs.get(id)) if (!seen.has(l.target) && ok(byId.get(l.target))) { seen.add(l.target); next.push(l.target); }
        for (const l of ins.get(id)) if (!seen.has(l.source) && ok(byId.get(l.source))) { seen.add(l.source); next.push(l.source); }
      }
      frontier = next;
    }
    return seen;
  }

  function draw() {
    const keep = visibleSet();
    const prev = new Map(current.nodes.map((n) => [n.id, n]));
    const nodes = [...keep].map((id) => { const n = byId.get(id); const p = prev.get(id); return Object.assign(n, p ? {x: p.x, y: p.y} : {x: laneX(n) + (Math.random() - 0.5) * 80, y: H() / 2 + (Math.random() - 0.5) * H() * 0.6}); });
    const links = G.links.filter((l) => keep.has(idOf(l.source)) && keep.has(idOf(l.target))).map((l) => ({...l, source: idOf(l.source), target: idOf(l.target)}));
    current = {nodes, links};

    // Lanes.
    const lanes = laneLayer.selectAll('g.lane').data(meta.lanes, (d) => d.id).join((e) => { const g = e.append('g').attr('class', 'lane'); g.append('line').attr('class', 'lane-rule'); g.append('text').attr('class', 'lane-label').attr('text-anchor', 'middle'); return g; });
    lanes.select('text').attr('x', (d, i) => (i + 0.5) * W() / meta.lanes.length).attr('y', 24).text((d) => d.label);
    lanes.select('line').attr('x1', (d, i) => (i + 1) * W() / meta.lanes.length).attr('x2', (d, i) => (i + 1) * W() / meta.lanes.length).attr('y1', -4000).attr('y2', 8000).style('display', (d, i) => (i === meta.lanes.length - 1 ? 'none' : null));

    linkSel = linkLayer.selectAll('line').data(links, (d) => `${d.source}|${d.p}|${d.target}`).join('line').attr('class', 'link').attr('marker-end', 'url(#arrow)');
    linkSel.selectAll('title').data((d) => [d]).join('title').text((d) => `${d.source} ${meta.predicates[d.p] || d.p} ${d.target}`);

    nodeSel = nodeLayer.selectAll('g.node').data(nodes, (d) => d.id).join((e) => {
      const g = e.append('g').attr('class', 'node');
      g.append('path');
      g.append('text').attr('dy', '0.32em');
      g.append('title');
      return g;
    });
    nodeSel.classed('stub', (d) => Boolean(d.stub)).classed('sel', (d) => d.id === selected);
    nodeSel.select('path').attr('d', (d) => d3.symbol(SHAPES[kindOf(d).shape] || d3.symbolCircle, size(d))()).attr('fill', color);
    nodeSel.select('text').attr('x', (d) => Math.sqrt(size(d)) / 1.6 + 4).text((d) => (d.label && d.label !== d.id ? `${d.id} ${truncate(d.label, 34)}` : d.id));
    nodeSel.select('title').text((d) => `${d.id}\n${d.label}\n${kindOf(d).label}${d.stub ? ' (no record)' : ''}`);
    nodeSel.on('click', (e, d) => { e.stopPropagation(); select(d.id); })
      .on('dblclick', (e, d) => { e.stopPropagation(); setFocus(d.id); })
      .on('mouseenter', (e, d) => highlight(d.id)).on('mouseleave', () => highlight(selected))
      .call(d3.drag().on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.2).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    if (sim) sim.stop();
    const strength = nodes.length > 400 ? -40 : nodes.length > 120 ? -120 : -260;
    sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(50).strength((l) => (kindOf(l.source).lane === kindOf(l.target).lane ? 0.3 : 0.04)))
      .force('charge', d3.forceManyBody().strength(strength).distanceMax(400))
      .force('x', d3.forceX(laneX).strength(0.7))
      .force('y', d3.forceY(H() / 2).strength(nodes.length > 400 ? 0.03 : 0.05))
      .force('collide', d3.forceCollide((d) => Math.max(Math.sqrt(size(d)) / 1.4 + 3, nodes.length > 120 ? 6 : 11)))
      .on('tick', () => {
        linkSel.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y).attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
        nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
      });
    labelVisibility(d3.zoomTransform(svg.node()).k);
    highlight(selected);
    $('#stats').textContent = `${nodes.length} of ${G.nodes.length} nodes · ${links.length} links · built ${meta.generated.slice(0, 10)}`;
    $('#crumb').textContent = focus ? `Focused on ${focus}, ${depth ? depth + (depth === 1 ? ' hop' : ' hops') : 'everything'}. Double-click a node to refocus.` : 'Everything shown. Double-click a node to focus on it.';
    document.querySelectorAll('#depth button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.d) === depth)));
  }

  const idOf = (x) => (typeof x === 'object' ? x.id : x);
  const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  function labelVisibility(k) {
    if (!nodeSel) return;
    const few = current.nodes.length <= 90;
    nodeSel.select('text').style('display', (d) => (few || k > 1.3 || d.id === focus || d.id === selected || degree(d.id) >= 8 || ['period', 'initiative'].includes(d.role) ? null : 'none'));
  }

  function highlight(id) {
    if (!nodeSel) return;
    if (!id) { nodeSel.classed('dim', false); linkSel.classed('dim', false).classed('hi', false); return; }
    const near = new Set([id]);
    current.links.forEach((l) => { if (l.source.id === id) near.add(l.target.id); if (l.target.id === id) near.add(l.source.id); });
    nodeSel.classed('dim', (d) => !near.has(d.id));
    linkSel.classed('hi', (d) => d.source.id === id || d.target.id === id).classed('dim', (d) => d.source.id !== id && d.target.id !== id);
  }

  function setFocus(id, d) {
    focus = id;
    if (d !== undefined) depth = d;
    selected = id;
    draw();
    showDetail(id);
    writeHash();
    svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
  }

  function select(id) {
    if (!current.nodes.some((n) => n.id === id)) return setFocus(id);
    selected = id;
    nodeSel.classed('sel', (d) => d.id === id);
    highlight(id);
    labelVisibility(d3.zoomTransform(svg.node()).k);
    showDetail(id);
    writeHash();
  }

  function chip(id) {
    const n = byId.get(id);
    if (!n) return '';
    return `<a class="chip${n.stub ? ' stub' : ''}" data-id="${esc(id)}" title="${esc(n.label)}"><span class="dot" style="background:${color(n)}"></span>${esc(id)}${n.label !== id ? ' · ' + esc(truncate(n.label, 28)) : ''}</a>`;
  }

  function relations(list, dir) {
    const groups = new Map();
    for (const l of list) {
      const other = dir === 'out' ? l.target : l.source;
      const key = l.p;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(other);
    }
    return [...groups].map(([p, ids]) => {
      const phrase = meta.predicates[p] || p;
      const head = dir === 'out' ? `${phrase} →` : `← ${phrase} this`;
      return `<div class="rel"><span class="p">${esc(head)} (${ids.length})</span>${ids.slice(0, 40).map(chip).join('')}${ids.length > 40 ? `<span class="empty"> and ${ids.length - 40} more</span>` : ''}</div>`;
    }).join('');
  }

  function showDetail(id) {
    tab('selected');
    const n = byId.get(id);
    const pane = $('#pane-selected');
    if (!n) { pane.innerHTML = '<p class="empty">Click a node to see what it is and what it connects to.</p>'; return; }
    const r = roleOf(n);
    const m = r.mapping;
    const cls = n.cls
      ? `<div class="cls">Class <code>${esc(n.cls)}</code>${m && m.relation ? ` · role ${esc(r.label)} (${esc(m.relation)})` : ''}${m && m.description ? `<br>${esc(m.description)}` : ''}</div>`
      : `<div class="cls">Role ${esc(r.label)}, not mapped to a class of this workspace's ontology.</div>`;
    const props = Object.entries(n.props || {}).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(truncate(String(v), 400))}</dd>`).join('');
    pane.innerHTML = `
      <span class="role-badge"><span class="dot" style="background:${color(n)}"></span>${esc(kindOf(n).label)}${n.stub ? ' · no record' : ''}</span>
      <h2>${esc(n.label)}</h2>
      <div class="id">${esc(n.id)}${n.source && n.source !== 'value' ? ' · from ' + esc(n.source) : ''}</div>
      ${cls}
      ${n.url ? `<a class="btn primary" href="${esc(n.url)}" target="_blank" rel="noopener">Open page ↗</a>` : n.stub ? '<p class="warn">Referred to, but no source holds a record for it.</p>' : (meta.expectPages || []).includes(n.role) ? '<p class="warn">No page yet, though a ' + esc(r.label.toLowerCase()) + ' should have one.</p>' : ''}
      <button class="btn" id="focus-btn">Focus here</button>
      ${props ? `<dl>${props}</dl>` : ''}
      ${outs.get(id).length ? '<h3>Out</h3>' + relations(outs.get(id), 'out') : ''}
      ${ins.get(id).length ? '<h3>In</h3>' + relations(ins.get(id), 'in') : ''}`;
    $('#focus-btn').onclick = () => setFocus(id);
  }

  function showRoles() {
    if (classes) return showClasses();
    const rows = Object.entries(meta.roles).filter(([, r]) => r.count || r.mapping).map(([key, r]) => {
      const m = r.mapping;
      const mapText = m && m.relation ? `${m.relation} <code>${esc(m.compact)}</code>${m.note ? ' · ' + esc(m.note) : ''}` : m && m.note ? esc(m.note) : 'not mapped to a class';
      return `<label class="role-row${m && m.relation ? '' : ' unmapped'}"><input type="checkbox" data-role="${key}" ${hidden.has(key) ? '' : 'checked'}>
        <span><span class="dot" style="background:var(--c${r.color})"></span> ${esc(r.label)} <span class="empty">· ${esc(meta.lanes.find((l) => l.id === r.lane)?.label || '')}</span></span><span class="empty">${r.count}</span>
        <span class="map">${mapText}</span></label>`;
    });
    const warnings = (meta.warnings || []).map((w) => `<div class="warn">${esc(w)}</div>`).join('');
    $('#pane-roles').innerHTML = `<p class="empty">Each role the graph lays out, and the class of this workspace's ontology that plays it. Untick to hide.</p>${rows.join('')}${warnings ? '<h3>Build warnings</h3>' + warnings : ''}`;
    $('#pane-roles').querySelectorAll('input[data-role]').forEach((cb) => cb.addEventListener('change', () => { cb.checked ? hidden.delete(cb.dataset.role) : hidden.add(cb.dataset.role); draw(); }));
  }

  function showClasses() {
    const rows = [...classes.values()].map((c) => `<label class="role-row"><input type="checkbox" data-role="${esc(c.key)}" ${hidden.has(c.key) ? '' : 'checked'}>
        <span><span class="dot" style="background:var(--c${c.color})"></span> ${esc(c.label)}</span><span class="empty">${c.count}</span>
        <span class="map"><code>${esc(c.key)}</code>${c.description ? ' · ' + esc(c.description) : ''}</span></label>`);
    const warnings = (meta.warnings || []).map((w) => `<div class="warn">${esc(w)}</div>`).join('');
    $('#pane-roles').innerHTML = `<p class="empty">The classes this view shows, one lane each, with the records of each and the links between them. Untick to hide.</p>${rows.join('')}${warnings ? '<h3>Build warnings</h3>' + warnings : ''}`;
    $('#pane-roles').querySelectorAll('input[data-role]').forEach((cb) => cb.addEventListener('change', () => { cb.checked ? hidden.delete(cb.dataset.role) : hidden.add(cb.dataset.role); draw(); }));
  }

  function showGaps() {
    const g = meta.gaps;
    const list = (items, note) => (items.length ? items.map((x) => chip(x.id) + (x.refs ? `<span class="empty"> ×${x.refs}</span>` : '')).join('') : `<p class="empty">${note}</p>`);
    $('#pane-gaps').innerHTML = `
      <h3>Referred to, no record (${g.stubs.length})</h3>
      <p class="empty">An identifier something links to that no source holds. Usually a missing register row, or a typo.</p>${list(g.stubs, 'None.')}
      <h3>No page to open (${g.noPage.length})</h3>
      <p class="empty">A record of a kind that should have a page, but has none. Kinds with no pages by design are not listed.</p>${list(g.noPage, 'None.')}`;
  }

  function tab(name) {
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    document.querySelectorAll('.pane').forEach((p) => (p.hidden = p.id !== `pane-${name}`));
  }

  function writeHash() {
    const h = new URLSearchParams();
    if (focus) h.set('focus', focus);
    h.set('depth', String(depth));
    if (selected && selected !== focus) h.set('selected', selected);
    history.replaceState(null, '', '#' + h.toString());
  }

  // Wiring.
  $('#title').textContent = meta.title;
  if (classes) document.querySelector('.tabs button[data-tab=roles]').textContent = 'Classes';
  document.title = meta.title;
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => tab(b.dataset.tab)));
  document.querySelectorAll('#depth button').forEach((b) => b.addEventListener('click', () => { depth = Number(b.dataset.d); draw(); writeHash(); }));
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-id]'); if (a) { e.preventDefault(); select(a.dataset.id); } });
  svg.on('click', () => { selected = null; nodeSel.classed('sel', false); highlight(null); });
  $('#ids').innerHTML = G.nodes.filter((n) => !n.stub).map((n) => `<option value="${esc(n.id)}">${esc(n.label)}</option>`).join('');
  $('#search').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const hit = byId.get(e.target.value.trim()) || G.nodes.find((n) => n.id.toLowerCase() === q) || G.nodes.find((n) => n.label.toLowerCase().includes(q));
    if (hit) setFocus(hit.id);
  });
  window.addEventListener('resize', () => draw());

  showRoles();
  showGaps();
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('depth')) depth = Number(h.get('depth'));
  const start = h.get('focus') || view.focus;
  if (start && byId.has(start)) { focus = start; selected = h.get('selected') || start; }
  draw();
  showDetail(selected);
})();
