<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# delivery-planning

[Agent Skills](https://agentskills.io/specification) for planning the delivery of technology work: sizing what a team can take on, allocating it to epics, and keeping the plan honest as the work is elaborated. Usable in VS Code with GitHub Copilot, Cursor, Claude Code, Codex, Gemini CLI and any other agent that reads the format. Nothing in them assumes a particular agent or host.

This repository is a bundle: it can hold several skills, each versioned and released on its own.

| Skill | Identifier | What it does |
|---|---|---|
| [`quarter-planning`](skills/quarter-planning) | `pkg:generic/dermot-obrien/delivery-planning/quarter-planning` | Plans a quarter or programme increment in two stages: derives a budget of points from the calendar and the resourcing register, allocates it down to epics, then elaborates deliverables and rolls their sizes up. Checks the chain from calendar to products, frames epics against an optional definition ladder, generates epic cards, tracks feature requests, and links plan documents to each epic's and story's page |

Planning for other horizons, such as a sprint or a year, shares the same data model and would join this bundle as further skills.

## Install

Put `skills/quarter-planning/` wherever your agent reads skills:

| Directory | Read by |
|---|---|
| `.agents/skills/` in the project | VS Code with GitHub Copilot, Cursor, Codex, Gemini CLI and most others |
| `.github/skills/` in the project | VS Code with GitHub Copilot, and the Copilot coding agent |
| `.cursor/skills/` in the project | Cursor |
| `.claude/skills/` in the project | Claude Code, and also VS Code with GitHub Copilot and Cursor |
| `~/.agents/skills/`, `~/.copilot/skills/`, `~/.cursor/skills/`, `~/.claude/skills/` | The same tools, for every project |

With the GitHub CLI (2.90 or later), for any agent:

```bash
gh skill install dermot-obrien/delivery-planning quarter-planning
```

Or clone the repository and copy the skill folder. The repository is also a Claude Code plugin marketplace, with one plugin per skill:

```
/plugin marketplace add dermot-obrien/delivery-planning
/plugin install quarter-planning@delivery-planning
```

### Requirements

Python 3.11 or newer, and PyYAML (`pip install pyyaml`).

## What it reads

The skill reads the workspace's planning model and registers wherever `[suite.quarter-planning]` in the workspace's `.agents/skill-bindings.toml` says they are. [`references/data-contract.md`](skills/quarter-planning/references/data-contract.md) lists every file and field, so any workspace can supply them. A work-management framework is optional: a workspace that keeps its epics in one file, written by hand or generated from a tracker, meets the contract in full. [`tests/fixture/`](skills/quarter-planning/tests/fixture) is a complete, minimal workspace to copy from.

```bash
python <skills>/quarter-planning/bin/quarter.py --quarter <slug>
```

checks a workspace and names anything missing.

## Versions and identifiers

Each skill has its own Semantic Version in its `SKILL.md` (`metadata.version`), and each release is tagged `<skill>--v<version>`, such as `quarter-planning--v3.4.0`. A skill is identified by a Package URL of the `generic` type, `pkg:generic/dermot-obrien/delivery-planning/<skill>`, which names no host, so a mirror or a move changes where it is fetched from but not what it is called. This follows DD-11 of [AI-Assisted Work](https://github.com/dermot-obrien/ai-assisted-work/blob/main/docs/about/design-decisions.md).

## Origin

`quarter-planning` was developed as a skill of [AI-Assisted Work](https://github.com/dermot-obrien/ai-assisted-work), by the same author, and was extracted into this repository on 2026-09-29 at version 3.3.0. Delivery planning is technology-specific, so it sits outside AI-Assisted Work, which is domain-agnostic, and builds on its work items. [NOTICE](./NOTICE) records the exact source commit; the history before extraction is the history of `skills/quarter-planning` there, and its changelog.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues: [SECURITY.md](SECURITY.md).

## Licence

Content (documentation, `SKILL.md`, references) is licensed under [CC BY 4.0](LICENSES/CC-BY-4.0.txt), and code under [Apache-2.0](LICENSES/Apache-2.0.txt), the same terms as AI-Assisted Work. See [LICENSE](./LICENSE) for which files are which, and keep [NOTICE](./NOTICE) with any copy or derivative.
