<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Changelog

Releases of the skills in this bundle, each versioned on its own and headed with the skill it belongs to. The history of `quarter-planning` before 3.4.0 is in the [AI-Assisted Work changelog](https://github.com/dermot-obrien/ai-assisted-work/blob/main/CHANGELOG.md).

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## quarter-planning [3.4.0] - 2026-09-29

Extracted from AI-Assisted Work, where it was `skills/quarter-planning`, into this repository, so it can be installed and used without that framework. Its behaviour is unchanged. NOTICE records the source commit.

### Added

- `references/data-contract.md`: every binding, file and field the skill reads, required and optional, so any workspace can supply them, with or without a work-management framework.
- The repository is a Claude Code plugin marketplace, `delivery-planning`, holding one plugin per skill (`quarter-planning@delivery-planning`), so another plugin can depend on the skill by version.
- `scripts/validate-skills.mjs`, CI running it with the tests on Linux and Windows, a per-skill version check, a REUSE compliance check, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and `SECURITY.md`.

### Changed

- Licensed as AI-Assisted Work licenses its skills: content under CC BY 4.0 and code under Apache-2.0, declared per file in `REUSE.toml`. `SKILL.md`'s `license` says so, and the skill directory carries `LICENSE`, both licence texts and `NOTICE`.
- `metadata.framework: aaw` is gone. `metadata.homepage` names this repository, `metadata.x-derived-from` names the source commit, and `metadata.x-skill-requires` is empty: the skill needs no other skill.
- "Epics from AAW work items" is now "Epics from work-item folders": reading `progress.yaml` through `workItemsDir` is described as one way to supply epics, with AI-Assisted Work as an example, not a requirement.
- Example quarter names in help text and descriptions are neutral (`fy30-q1`).
- Released under the per-skill tag `quarter-planning--v3.4.0`, as DD-11 of AI-Assisted Work sets out.
