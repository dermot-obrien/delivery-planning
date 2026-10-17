---
name: knowledge-graph
description: Build a clickable knowledge graph of a workspace's work and what it connects to (initiatives, needs, capabilities and their increments, periods, epics, stories, deliverables, products, requests, patterns and building blocks) from the records the workspace already keeps, typed by the workspace's own ontology. A graph map says which class plays each role the graph lays out, which files hold records and which fields link them; the build writes graph.json and one HTML page that opens from disk, and lists every identifier that is referred to with no record, or has no page to click through to. Use when asked to build, show or explore a knowledge graph, a work graph or a traceability graph; to see what an epic, story, pattern or capability connects to; to find broken links between plans and the catalogue; or to map a workspace's ontology onto the graph.
license: CC-BY-4.0 AND Apache-2.0. Content under CC BY 4.0, code under Apache-2.0; see LICENSE and NOTICE. The bundled d3 is ISC; see assets/vendor/d3.LICENSE.
compatibility: Node 18+. Uses the ontology skill from the same bundle when it is installed beside this one. Reading YAML records needs the yaml or js-yaml package in the workspace; CSV and JSON need nothing.
metadata:
  version: "0.1.0"
  homepage: https://github.com/dermot-obrien/delivery-planning
  x-skill-requires: "pkg:generic/dermot-obrien/delivery-planning/ontology ^0.1.0"
---

# Knowledge graph

The graph knows a small, fixed set of roles and lays each one out in a lane: Why (initiative, need, request), What (capability, increment, product), When (period), Delivery (epic, story, deliverable, deliverable type) and Design (pattern, building block). It knows nothing about any organisation's classes. The workspace says which of its own classes plays each role, in a graph map, so the same viewer works over any ontology.

The roles, lanes and predicates are in [assets/roles.json](assets/roles.json). Never edit that file for one workspace; map onto it.

## Step 0, before anything else

Run the post-install check from the workspace root, and stop on a problem:

```bash
node <skills>/knowledge-graph/scripts/check.mjs
```

It reads `[suite.knowledge-graph]` in `.agents/skill-bindings.toml` (contract in `inputs.toml`), and `[suite.ontology]` for the ontology:

```toml
[suite.knowledge-graph]
map = "../graph-map.json"
out = "../build/graph"
```

## The graph map

One JSON file. Its full specification is [references/graph-map.md](references/graph-map.md); read it before writing or changing a map. In short:

| Key | Says |
|---|---|
| `roles` | For each role used, the class that plays it, as a SKOS mapping: `{"exactMatch": "delivery:Epic"}`, or `closeMatch`, `broadMatch`, `narrowMatch`. A role with no class gets a `note` saying why |
| `sources` | Each file of records: its `role`, `id`, `label`, `url` and `props` fields, its `links` (field, predicate) and nested `children` |
| `idSchemes` | Regular expressions that tell an identifier's role, for targets with no record |
| `links` | The site's identifier manifest (`id/index.json`) and base URL, so every node can be opened |
| `view` | Where the page opens: `focus`, `depth`, roles to `hide` |

## Tasks

| Asked to | Do |
|---|---|
| Build the graph | `graph.mjs build`. Report the counts and the two gap totals it prints |
| Show what something connects to | `graph.mjs show <id>`, or open the page with `#focus=<id>&depth=1` |
| Find broken click-through | `graph.mjs gaps`: identifiers referred to with no record, and records with no page. Exit 1 when there are any |
| Map a new workspace | List its classes with the ontology skill (`ontology.mjs classes`), write `roles` first, then one source per register, building and checking the warnings after each |
| Add a role the graph lacks | Don't. Map the class to the nearest role with `broadMatch`, or to `other`, and raise it against this skill |

```bash
node <skills>/knowledge-graph/scripts/graph.mjs build
node <skills>/knowledge-graph/scripts/graph.mjs gaps
node <skills>/knowledge-graph/scripts/graph.mjs show EP-901
```

## The page

`index.html` holds the data, the viewer and d3, so it opens from disk and can be published as a static file. Click a node to see its class, the ontology's description of that class, its fields and its links; double-click to focus on it; the depth buttons widen the view. The Roles tab shows each role's mapping and hides roles; the Gaps tab lists stubs and records without a page. A link to `index.html#focus=<id>&depth=2` opens on that identifier, which is how a plan or a page links into the graph.

## Rules

- The records are the source. Never hand-edit `graph.json`; fix the record or the map and rebuild.
- A stub is a finding, not noise: report it with what refers to it. Don't add a record to make it go away unless the user agrees it is missing.
- Keep the map in the workspace. Nothing about one organisation belongs in this skill.
