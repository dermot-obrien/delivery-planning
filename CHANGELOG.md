<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Changelog

Releases of the skills in this bundle, each versioned on its own and headed with the skill it belongs to. The history of `quarter-planning` before 3.4.0 is in the [AI-Assisted Work changelog](https://github.com/dermot-obrien/ai-assisted-work/blob/main/CHANGELOG.md).

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## quarter-planning [3.5.2] - 2026-09-30

A patch release with the bundle's new documentation. Nothing the skill reads or writes moved.

### Fixed

- `--budget` reported an epic with no `budget_points` as `records budget_points None`. It now says the epic `is given N points by the distribution but records no budget_points`, as the validation does, and points at `--apply`.
- `references/data-contract.md` said `slugPattern` has the named groups `y` and `q`; the default has `fy` and `q`. It now gives both the default and the test workspace's pattern, and says that `work_item.yaml` and `work_plan.yaml` must exist while `activity.yaml` is optional.
- `references/check-messages.md` quoted the planned-points message as `its deliverables sum to`; the script says `its products sum to`. Messages that come from a workspace's own checks, not from this skill's scripts, are now marked as such.

### Added

- `quarter.py --help` has a description and names the documentation.
- `SKILL.md` links the bundle's documentation.
- `docs/`: a quick start, run end to end on Windows in PowerShell and Git Bash; a page for the skill; concepts; a configuration reference covering every binding key with its type, default, precedence and an example; a command reference; troubleshooting keyed to every message the scripts print; and examples. The README gains install steps for any agent at workspace and user level, a short quick start and an index of the docs.

## quarter-planning [3.5.1] - 2026-09-30

A patch release: the skill's behaviour is unchanged, and nothing it reads or writes moved. `skills-ref`, the reference validator of the [Agent Skills specification](https://agentskills.io/specification), reported the skill valid before this release, but its `SKILL.md` was 479 lines and about 6,800 body tokens, over the specification's guidance of 5,000. It is now 345 lines and about 4,400.

### Changed

- Detail moved out of `SKILL.md` into files it links, one level deep, each read when its topic comes up: `references/validation-report.md` (what each section of the validation answers, what fails the run, and how `--apply` patches the file), `references/check-messages.md` (every check message and what to do), `references/approval-stages.md`, `references/framing.md`, `references/links.md`, `references/work-item-folders.md`, `references/optional-bindings.md` and `references/failure-modes.md`. The text moved unchanged apart from headings and a line of introduction; `SKILL.md` keeps a summary of each, with the rules an agent must not miss.
- `SKILL.md` said four optional keys opt in to something where its table listed six.

### Added

- CI runs `skills-ref validate` on each skill, pinned to a commit, and fails a `SKILL.md` over the specification's guidance of 500 lines or about 5,000 body tokens.
- The README has an Agent Skills conformance section: what conforming means here, and how to run the same checks locally. CONTRIBUTING lists `skills-ref validate`.

## quarter-planning [3.5.0] - 2026-09-29

### Added

- `bin/check.py`, the skill's post-install check, as DD-11 of AI-Assisted Work defines it. Run from the workspace root, it checks Python 3.11 or newer, PyYAML, and `[suite.quarter-planning]`: the six required paths declared, every declared path resolving (up to `{quarter}`, since only a run names the quarter), `slugPattern` compiling and capturing every field `quarterLabel` uses, and `approvalStages` and `tolerance` usable. Exit 0 when all is well, 1 with one line per problem, 2 for a usage or environment error. `tests/test_check.py` covers it. `SKILL.md` and `references/data-contract.md` mention it.

## Bundle

### Added

- `ontology/delivery.schema.json`, the delivery layer of DD-11's layered ontology, `pkg:generic/dermot-obrien/delivery-planning/delivery-ontology@1.0.0`. It builds on the work layer of AI-Assisted Work (`work-ontology ^1.0.0`) by `$ref` and `allOf` and redefines nothing: `Epic` is a WorkItem whose `work_item_level` is `epic` with the planning fields, `Story` an Activity with `site_route` and `request_ids`, `SizedDeliverable` the work layer's Deliverable with points and approval. It also describes the planning model files (`WorkItemFile`, `ActivityFile`, `WorkPlanFile`), the registers (`DeliverableType`, `Product`, `FeatureRequest`, `CalendarPeriod`, `PlanningAssumption`, `Allocation`, `LadderRung`), as `references/data-contract.md` describes them. A product belongs here; what a work item produces is the work layer's Deliverable. Additive only: programmes, milestones, gates, commitments and slips move here with AI-Assisted Architecture's next major version.
- `scripts/test_ontology.py` validates the module against every file of the test fixture, and against cases it must refuse. CI runs it, and runs the post-install check on the fixture workspace.
- `bundle.json`, the bundle manifest DD-11 defines: the skill, its purl, its requirements (none), its check, the ontology module and the modules it extends, and the marketplace as its `claude-plugin` adapter. CI validates it with `scripts/validate-bundle.mjs`. The validator, the bundle schema and the work layer are copies from AI-Assisted Work, in `scripts/` and `scripts/vendor/`, so CI needs no network.

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
