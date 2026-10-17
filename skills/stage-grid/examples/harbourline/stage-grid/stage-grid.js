// SPDX-FileCopyrightText: 2026 Dermot O'Brien
// SPDX-License-Identifier: Apache-2.0
//
// The stage grid app. Reads window.STAGE_GRID, written by the stage-grid skill, and draws
// the lanes (rows) against the stages (columns), each cell holding what the period's epics
// deliver towards that stage. Every block opens a panel: a stage, a band, the boundary, a
// lane, an epic, an item. Deep links: #stage:<id>, #lane:<id>, #epic:<id>, #epic:<id>/<deliverable>.

(function () {
  'use strict';
  var D = window.STAGE_GRID;
  if (!D) { document.body.textContent = 'stage-grid-data.js is missing: run the stage grid build.'; return; }
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); };
  var stages = D.stages, idx = {};
  stages.forEach(function (s, i) { idx[s.id] = i; });
  var bIdx = D.boundary ? idx[D.boundary.after] + 1 : -1; // first column past the boundary
  var sg = function (i) { var s = stages[i]; return s ? '--sg:' + s.color : ''; };
  var laneOf = function (id) { return D.lanes.filter(function (l) { return l.id === id; })[0]; };
  var epicName = function (id) { var e = D.epics[id]; return e ? (e.key || e.id) : id; };
  var open = function (kind, id, label, cls, extra) { return '<button class="' + (cls || 'chip') + '" data-open="' + kind + ':' + esc(id) + '"' + (extra || '') + '>' + label + '</button>'; };
  var link = function (url, text) { return url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(text) + '</a>' : esc(text); };

  // ---- The grid ----
  function td(i, inner, tag, cls) {
    tag = tag || 'td';
    var c = [cls, i === bIdx ? 'bnd' : ''].filter(Boolean).join(' ');
    return '<' + tag + ' style="' + sg(i) + '"' + (c ? ' class="' + c + '"' : '') + '>' + inner + '</' + tag + '>';
  }

  function render() {
    var h = [], span = stages.length + 1;
    h.push('<colgroup><col class="label">' + stages.map(function () { return '<col>'; }).join('') + '</colgroup>');
    if (stages.some(function (s) { return s.flag; })) {
      h.push('<tr class="flag"><td></td>' + stages.map(function (s, i) { return td(i, s.flag ? '<span class="pill">' + esc(s.flag) + '</span>' : ''); }).join('') + '</tr>');
    }
    h.push('<tr class="head"><th class="corner"></th>' + stages.map(function (s, i) {
      return td(i, open('stage', s.id, '<span class="n">' + s.n + '</span>' + esc(s.name), 'stage-btn', ' title="What ' + esc(s.name) + ' means"'), 'th');
    }).join('') + '</tr>');
    if (stages.some(function (s) { return s.description || s.builds.length; })) {
      h.push('<tr class="build"><th></th>' + stages.map(function (s, i) {
        return td(i, open('stage', s.id, '<span class="desc">' + esc(s.description) + '</span>' +
          (s.builds.length ? '<span class="lbl">What we build</span>' + s.builds.map(esc).join('<br>') : ''), 'card'));
      }).join('') + '</tr>');
    }
    // Who moves it, then the bands, above the period's work.
    if (D.boundary && D.boundary.label) {
      h.push('<tr class="who"><td colspan="' + span + '">' + open('who', 'all', '<b>' + esc(D.boundary.title || 'Who moves it') + '</b> · ' + esc(D.boundary.label), 'who-btn') + '</td></tr>');
    }
    if (D.bands.length) {
      var row = '<tr class="bands"><td></td>';
      D.bands.forEach(function (b, k) {
        var from = idx[b.from], to = idx[b.to];
        row += '<td colspan="' + (to - from + 1) + '" style="' + sg(to) + '"' + (from === bIdx ? ' class="bnd"' : '') + '>' +
          open('band', k, (b.label ? '<b>' + esc(b.label) + '</b>' : '') + (b.label && b.who ? ' · ' : '') + esc(b.who || ''), 'band-btn') + '</td>';
      });
      h.push(row + '</tr>');
    }
    if (D.strap) h.push('<tr class="strap"><td colspan="' + span + '"><div class="bar">' + esc(D.strap) + '</div></td></tr>');
    D.lanes.forEach(function (lane) {
      h.push('<tr class="lane" data-lane="' + esc(lane.id) + '"><th>' + open('lane', lane.id, esc(lane.label), 'lane-btn', ' title="This lane this period"') +
        '<div class="epics">' + lane.epics.map(function (id) { return open('epic', id, esc(epicName(id)), 'chip', ' title="' + esc(D.epics[id].title) + '"'); }).join('') + '</div></th>' +
        stages.map(function (s, i) {
          var items = (lane.cells[s.id] || []).map(function (it) {
            return open('epic', it.epics[0] + '/' + it.deliverables[0], esc(it.label) + (lane.epics.length > 1 ? '<span class="ep">' + it.epics.map(epicName).map(esc).join(', ') + '</span>' : ''),
              'item', ' data-epic="' + esc(it.epics.join(' ')) + '" data-deliverables="' + esc(it.deliverables.join(' ')) + '" title="' + esc(it.deliverables.join(', ')) + '"');
          });
          (lane.outcomes || []).forEach(function (o, k) {
            if (o.stage === s.id) items.push(open('outcome', lane.id + '/' + k, (o.status ? '<b>' + esc(o.status) + '</b>' : '') + esc(o.text), 'item outcome'));
          });
          return td(i, items.join(''));
        }).join('') + '</tr>');
    });
    $('#grid').innerHTML = h.join('');
  }

  // ---- Panels ----
  function track(counts) {
    var cols = 'grid-template-columns: repeat(' + stages.length + ', 1fr)';
    return '<div class="track" style="' + cols + '">' + counts.map(function (c, i) { return '<div style="' + sg(i) + '" class="' + (c ? 'has' : '') + '">' + (c || '') + '</div>'; }).join('') + '</div>' +
      '<div class="track-names" style="' + cols + '">' + stages.map(function (s) { return '<span>' + esc(s.name) + '</span>'; }).join('') + '</div>';
  }
  function section(title, n, body) { return body ? '<h3>' + esc(title) + (n == null ? '' : ' (' + n + ')') + '</h3>' + body : ''; }
  function li(style, cls, body, meta) { return '<li style="' + (style || '') + '" class="' + (cls || '') + '">' + body + (meta ? '<span class="m">' + meta + '</span>' : '') + '</li>'; }

  function stagePanel(id) {
    var s = stages[idx[id]];
    if (!s) return null;
    var i = idx[id];
    var atStage = D.lanes.map(function (l) {
      var items = l.cells[id] || [], outs = l.outcomes.filter(function (o) { return o.stage === id; });
      if (!items.length && !outs.length) return '';
      return li('', '', open('lane', l.id, esc(l.label), 'linkish') + '<div>' + items.map(function (it) { return open('epic', it.epics[0] + '/' + it.deliverables[0], esc(it.label), 'chip'); }).join(' ') +
        outs.map(function (o) { return '<span class="chip static">' + esc(o.text) + '</span>'; }).join(' ') + '</div>');
    }).join('');
    var facts = [];
    if (s.band) facts.push('Band <b>' + esc(s.band) + '</b>');
    if (s.movedBy) facts.push('Moved by <b>' + esc(s.movedBy) + '</b>');
    if (s.consumable) facts.push('<b>Consumable</b>');
    var nav = (i > 0 ? open('stage', stages[i - 1].id, '← ' + esc(stages[i - 1].name), 'chip') : '') + ' ' + (i < stages.length - 1 ? open('stage', stages[i + 1].id, esc(stages[i + 1].name) + ' →', 'chip') : '');
    return {
      style: sg(i),
      html: '<div class="kicker">Stage ' + s.n + ' of ' + stages.length + '</div><h2 class="stage-title">' + esc(s.name) + '</h2>' +
        '<div class="facts">' + facts.map(function (f) { return '<span>' + f + '</span>'; }).join('') + '</div>' +
        (s.description ? '<div class="goal">' + esc(s.description) + '</div>' : '') +
        (D.boundary && D.boundary.after === s.id ? '<p class="warn-line">The line falls after this stage: ' + esc(D.boundary.label || 'the planning team moves a capability no further') + '.</p>' : '') +
        (D.boundary && i >= bIdx && bIdx > 0 ? '<p class="warn-line">Past the line: ' + esc(s.movedBy || 'others') + ' moves a capability here, not the planning team.</p>' : '') +
        section('What we build to reach it', s.builds.length || null, s.builds.length ? '<ul class="dl">' + s.builds.map(function (b) { return li(sg(i), '', esc(b)); }).join('') + '</ul>' : '') +
        section('Deliverable types placed here', s.types.length || null, s.types.length ? '<div>' + s.types.map(function (t) { return '<span class="chip static">' + esc(t.name) + '</span>'; }).join(' ') + '</div>' : '') +
        section('This period, at this stage', null, atStage ? '<ul class="dl">' + atStage + '</ul>' : '<p class="m">Nothing this period.</p>') +
        '<div class="nav">' + nav + '</div>'
    };
  }

  function bandPanel(k) {
    var b = D.bands[k];
    if (!b) return null;
    var list = stages.slice(idx[b.from], idx[b.to] + 1);
    return {
      style: sg(idx[b.to]),
      html: '<div class="kicker">Band</div><h2>' + esc(b.label || b.who) + '</h2>' + (b.who ? '<div class="facts"><span>Moved by <b>' + esc(b.who) + '</b></span></div>' : '') +
        section('Stages in this band', list.length, '<ul class="dl">' + list.map(function (s) { return li(sg(idx[s.id]), '', open('stage', s.id, esc(s.n + ' ' + s.name), 'linkish'), esc(s.description)); }).join('') + '</ul>')
    };
  }

  function whoPanel() {
    var movers = [];
    stages.forEach(function (s) { if (s.movedBy && movers.indexOf(s.movedBy) < 0) movers.push(s.movedBy); });
    return {
      style: '',
      html: '<div class="kicker">Who moves it</div><h2>' + esc(D.boundary.label) + '</h2>' +
        (movers.length ? movers.map(function (m) {
          return section(m, null, '<ul class="dl">' + stages.filter(function (s) { return s.movedBy === m; }).map(function (s) { return li(sg(idx[s.id]), '', open('stage', s.id, esc(s.n + ' ' + s.name), 'linkish')); }).join('') + '</ul>');
        }).join('') : section('Bands', D.bands.length, '<ul class="dl">' + D.bands.map(function (b, k) { return li(sg(idx[b.to]), '', open('band', k, esc(b.label || b.who), 'linkish')); }).join('') + '</ul>'))
    };
  }

  function lanePanel(id, focusOutcome) {
    var l = laneOf(id);
    if (!l) return null;
    var counts = stages.map(function (s) { return (l.cells[s.id] || []).length + l.outcomes.filter(function (o) { return o.stage === s.id; }).length; });
    var reached = -1; counts.forEach(function (c, i) { if (c) reached = i; });
    var byStage = stages.map(function (s, i) {
      var items = l.cells[s.id] || [], outs = l.outcomes.map(function (o, k) { return [o, k]; }).filter(function (x) { return x[0].stage === s.id; });
      if (!items.length && !outs.length) return '';
      return li(sg(i), '', '<b>' + esc(s.name) + '</b><div>' + items.map(function (it) { return open('epic', it.epics[0] + '/' + it.deliverables[0], esc(it.label), 'chip'); }).join(' ') +
        outs.map(function (x) { return '<span class="chip static' + (String(x[1]) === focusOutcome ? ' on' : '') + '">' + esc((x[0].status ? x[0].status + ': ' : '') + x[0].text) + '</span>'; }).join(' ') + '</div>');
    }).join('');
    return {
      style: '',
      html: '<div class="kicker">' + esc(['Lane', l.id, D.period].join(' · ')) + '</div><h2>' + esc(l.label) + '</h2>' +
        (reached >= 0 ? '<div class="facts"><span>This period reaches towards <b>' + esc(stages[reached].name) + '</b></span></div>' : '') +
        (l.description ? '<div class="goal">' + esc(l.description) + '</div>' : '') +
        (l.url ? '<a class="btn" href="' + esc(l.url) + '" target="_blank" rel="noopener">Open the lane\'s page ↗</a>' : '') +
        section('The increment across the stages', null, track(counts)) +
        section('Carried by', l.epics.length, '<ul class="dl">' + l.epics.map(function (e) { return li('', '', open('epic', e, esc(epicName(e) + ' ' + D.epics[e].title), 'linkish')); }).join('') + '</ul>') +
        section('Step by step', null, byStage ? '<ul class="dl">' + byStage + '</ul>' : '') +
        section('What must become true', l.criteria.length || null, l.criteria.length ? '<ul class="dl">' + l.criteria.map(function (c) { return li('', '', esc(c.text), esc([c.id, c.status].filter(Boolean).join(' · '))); }).join('') + '</ul>' : '')
    };
  }

  function epicPanel(id, focus) {
    var e = D.epics[id];
    if (!e) return null;
    var dl = function (d) {
      var i = d.stage ? idx[d.stage] : -1;
      return li(i >= 0 ? sg(i) : '', focus.indexOf(d.id) >= 0 ? 'hl' : '', link(d.url, d.name), esc([d.id, d.typeName || d.type, d.stageName, d.state, d.approval].filter(Boolean).join(' · ')));
    };
    var placed = e.deliverables.filter(function (d) { return d.stage; }).sort(function (a, b) { return idx[a.stage] - idx[b.stage]; });
    var other = e.deliverables.filter(function (d) { return !d.stage; });
    var facts = [];
    if (e.status) facts.push('Status <b>' + esc(e.status) + '</b>');
    if (e.approval) facts.push('Approval <b>' + esc(e.approval) + '</b>');
    if (e.planned != null) facts.push('Planned <b>' + esc(e.planned) + '</b> of <b>' + esc(e.budget == null ? '?' : e.budget) + '</b> points');
    if (placed.length) facts.push('Builds towards <b>' + esc(placed[placed.length - 1].stageName) + '</b>');
    return {
      style: '',
      html: '<div class="kicker">' + [e.key ? link(e.keyUrl, e.key) : '', esc(e.id), esc(e.initiative)].filter(Boolean).join(' · ') + '</div><h2>' + esc(e.title) + '</h2>' +
        '<div class="facts">' + facts.map(function (f) { return '<span>' + f + '</span>'; }).join('') + '</div>' +
        (e.lanes.length ? '<div>' + e.lanes.filter(laneOf).map(function (l) { return open('lane', l, 'Lane: ' + esc(laneOf(l).label), 'chip'); }).join(' ') + '</div>' : '') +
        (e.goal ? '<div class="goal">' + esc(e.goal) + '</div>' : '') +
        (e.url ? '<a class="btn" href="' + esc(e.url) + '" target="_blank" rel="noopener">Open the epic page ↗</a>' : '') +
        section('Where its deliverables land', null, track(stages.map(function (s) { return placed.filter(function (d) { return d.stage === s.id; }).length; }))) +
        section('On the grid', placed.length, '<ul class="dl">' + placed.map(dl).join('') + '</ul>') +
        section('Also delivered, not on the grid', other.length || null, other.length ? '<ul class="dl">' + other.map(dl).join('') + '</ul>' : '') +
        section('What it must make true', e.increments.length || null, e.increments.length ? '<ul class="dl">' + e.increments.map(function (c) { return li('', '', esc(c.text), esc([c.id, c.status].filter(Boolean).join(' · '))); }).join('') + '</ul>' : '') +
        section('Stories', e.stories.length || null, e.stories.length ? '<ul class="dl">' + e.stories.map(function (s) {
          var hit = s.produces.some(function (p) { return focus.indexOf(p) >= 0; });
          return li('', hit ? 'hl' : '', link(s.url, s.title), esc([s.key, s.id, s.status, s.produces.length ? 'produces ' + s.produces.join(', ') : ''].filter(Boolean).join(' · ')));
        }).join('') + '</ul>' : '') +
        section('Refines', e.patterns.length || null, e.patterns.length ? '<ul class="dl">' + e.patterns.map(function (p) { return li('', '', link(p.url, p.name), esc(p.id)); }).join('') + '</ul>' : '') +
        section('Depends on', e.dependsOn.length || null, e.dependsOn.length ? '<div>' + e.dependsOn.map(function (d) { return D.epics[d] ? open('epic', d, esc(epicName(d)), 'chip') : '<span class="chip static">' + esc(d) + '</span>'; }).join(' ') + '</div>' : '')
    };
  }

  // ---- Opening and closing ----
  function show(target) {
    var cut = target.indexOf(':'), kind = target.slice(0, cut), rest = target.slice(cut + 1), parts = rest.split('/');
    var p = kind === 'stage' ? stagePanel(rest) : kind === 'band' ? bandPanel(Number(rest)) : kind === 'who' ? whoPanel()
      : kind === 'lane' ? lanePanel(rest) : kind === 'outcome' ? lanePanel(parts[0], parts[1]) : kind === 'epic' ? epicPanel(parts[0], parts.slice(1)) : null;
    if (!p) return;
    $('#drawer-body').innerHTML = p.html;
    $('#drawer').setAttribute('style', p.style || '');
    $('#drawer').classList.add('open'); $('#scrim').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false');
    $('#drawer').scrollTop = 0;
    mark(kind, parts);
    history.replaceState(null, '', '#' + target);
  }

  function close() {
    $('#drawer').classList.remove('open'); $('#scrim').classList.remove('open'); $('#drawer').setAttribute('aria-hidden', 'true');
    mark(null, []);
    history.replaceState(null, '', location.pathname + location.search);
  }

  // Dim what the open panel is not about.
  function mark(kind, parts) {
    var epic = kind === 'epic' ? parts[0] : null, lane = kind === 'lane' || kind === 'outcome' ? parts[0] : null, stage = kind === 'stage' ? parts[0] : null;
    document.querySelectorAll('#grid .item').forEach(function (el) {
      var row = el.closest('tr').dataset.lane, col = el.closest('td').cellIndex - 1;
      var mine = !kind || (epic && (el.dataset.epic || '').split(' ').indexOf(epic) >= 0) || (lane && row === lane) || (stage && stages[col] && stages[col].id === stage) || (!epic && !lane && !stage);
      el.classList.toggle('dim', !mine);
      el.classList.toggle('hl', Boolean(epic) && (el.dataset.deliverables || '').split(' ').some(function (d) { return parts.indexOf(d) > 0; }));
    });
    document.querySelectorAll('#grid .chip[data-open^="epic:"]').forEach(function (el) { el.classList.toggle('on', el.dataset.open === 'epic:' + epic); });
    document.querySelectorAll('#grid .stage-btn, #grid .card').forEach(function (el) { el.classList.toggle('on', el.dataset.open === 'stage:' + stage); });
  }

  // ---- Wiring ----
  $('#title').textContent = D.title; document.title = D.title;
  $('#sub').textContent = D.subtitle || '';
  $('#meta').textContent = [D.period, 'built ' + D.generated.slice(0, 10)].join(' · ');
  $('#note').textContent = D.note || '';
  if (D.warnings && D.warnings.length) $('#warnings').innerHTML = D.warnings.map(function (w) { return '<div class="warn">' + esc(w) + '</div>'; }).join('');
  render();
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-open]');
    if (t) { ev.preventDefault(); show(t.dataset.open); return; }
    if (ev.target.closest('.close') || ev.target.id === 'scrim') close();
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') close(); });
  var hash = decodeURIComponent(location.hash.slice(1));
  if (/^[a-z]+:/.test(hash)) show(hash);
  else if (hash && D.epics[hash.split('/')[0]]) show('epic:' + hash);
})();
