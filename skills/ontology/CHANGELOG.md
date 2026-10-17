<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Changelog

## [0.1.1] - 2026-10-18

### Changed

- The tasks say how to see the records of chosen classes and their links: name the classes here and build a knowledge-graph class view.

## [0.1.0] - 2026-10-03

### Added

- The `ontology` skill: a workspace's layered ontology, read from JSON Schema 2020-12 modules that extend each other by `$ref`, with nothing fetched.
- Class IRIs as `<module id without version>#/$defs/<Name>`, with prefixed (`delivery:Epic`) and bare (`Epic`) short forms; prefixes derived from module ids or declared.
- `scripts/ontology.mjs`: `modules`, `classes`, `show` (inheritance across modules and link fields) and `check` (every `$ref` resolves).
- `scripts/check.mjs`, the post-install check, and `inputs.toml`, the `[suite.ontology]` bindings.
