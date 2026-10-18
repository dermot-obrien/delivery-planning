<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Changelog

The bundle's CHANGELOG.md records every release; this file records this skill's.

## [0.1.1] - 2026-10-18

### Changed

- The rules say to bind the whole work graph, never a knowledge-graph class view.

## [0.1.0] - 2026-10-03

### Added

- The `stage-grid` skill: a period's stage grid as a single-page app that opens from disk or is published with a static site. Lanes are rows, the ladder's stages are columns (as many as the ladder has), and each cell is an increment step.
- `scripts/stage-grid.mjs`: `build` writes `stage-grid-data.js` beside the fixed app; `show` prints the grid as text. `scripts/check.mjs` is the post-install check.
- The app: every block opens a panel (stage, band, the "Who moves it" bar, lane, epic, item, outcome), with deep links; the "Who moves it" bar and the bands sit above the period's work.
- Placement: each deliverable is for one stage, its own `stage`, else its type's when the type allows only one, with configuration fallbacks; a type with several stages and a deliverable that names none is a warning. The old `rung` names are read too. Bands and the boundary are drawn from the ladder's `band` and `moved_by` columns.
- Links from the configuration alone (`links`: base, manifest, templates per role, keys, fromGraph, none), so the grid needs no knowledge of any site; a thing with no page is not a link. `references/links.md`.
- `references/configuration.md`, `references/data-contract.md`, `inputs.toml`, the test workspace, and `examples/harbourline`, an invented transit operator with six stages and a small site, built and ready to open. `SOURCE_DATE_EPOCH` fixes the build date.
