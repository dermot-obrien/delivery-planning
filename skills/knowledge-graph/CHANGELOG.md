<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Changelog

## [0.1.0] - 2026-10-03

### Added

- The `knowledge-graph` skill: a graph of a workspace's work and what it connects to, built from its own records and typed by its own ontology.
- A fixed vocabulary of roles, lanes and predicates (`assets/roles.json`) that a workspace maps its classes onto with SKOS mapping relations.
- The graph map (`references/graph-map.md`): sources in CSV, JSON or YAML, link fields, nested children, value nodes, identifier schemes, page links from a site's identifier manifest, and the opening view.
- `scripts/graph.mjs`: `build` (graph.json and a standalone index.html), `gaps` (identifiers with no record, records with no page) and `show`.
- The viewer: a lane-constrained force layout with a detail panel showing each node's class and its ontology description, role toggles, a gaps list, search, focus depth and `#focus=` deep links. d3 is inlined, so the page opens from disk.
- `scripts/check.mjs`, the post-install check, and `inputs.toml`, the `[suite.knowledge-graph]` bindings.
