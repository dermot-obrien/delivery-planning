<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# delivery-planning

[Agent Skills](https://agentskills.io/specification) for planning the delivery of technology work: sizing what a team can take on, allocating it to epics, and keeping the plan honest as the work is elaborated. Usable in VS Code with GitHub Copilot, Cursor, Claude Code, Codex, Gemini CLI and any other agent that reads the format. Nothing in them assumes a particular agent or host.

This repository is a bundle: it can hold several skills, each versioned and released on its own.

| Skill | Identifier | What it does |
|---|---|---|
| [`quarter-planning`](skills/quarter-planning) | `pkg:generic/dermot-obrien/delivery-planning/quarter-planning` | Plans a quarter or programme increment in two stages: derives a budget of points from the calendar and the resourcing register, allocates it down to epics, then elaborates deliverables and rolls their sizes up. Checks the chain from calendar to products, frames epics against an optional definition ladder, generates epic cards, tracks feature requests, and links plan documents to each epic's and story's page |
| [`stage-grid`](skills/stage-grid) | `pkg:generic/dermot-obrien/delivery-planning/stage-grid` | Builds a period's stage grid as a single-page app: capability lanes as rows, the stages of the definition ladder as columns, and in each cell the deliverables that build a lane towards that stage. Every block opens a panel. Opens from disk or is published with a static site |
| [`ontology`](skills/ontology) | `pkg:generic/dermot-obrien/delivery-planning/ontology` | Reads a workspace's layered ontology, written as JSON Schema modules that extend each other by `$ref`: lists classes, shows what a class extends and links to, gives each class an IRI, and checks every `$ref` resolves. Needs only Node |
| [`knowledge-graph`](skills/knowledge-graph) | `pkg:generic/dermot-obrien/delivery-planning/knowledge-graph` | Builds a clickable graph of a workspace's work and what it connects to from the records it already keeps, typed by its own ontology through a graph map, and writes `graph.json` and one HTML page that opens from disk. A class view draws only the records of chosen classes, such as architecture and solution building blocks, and the links between them. Needs `ontology` beside it. `stage-grid` reads the graph it writes |

Planning for other horizons, such as a sprint or a year, shares the same data model and would join this bundle as further skills.

## Install

Requirements: Python 3.11 or newer, and PyYAML (`python -m pip install pyyaml`), for `quarter-planning`; Node 18 or newer for `stage-grid`, `ontology` and `knowledge-graph`. Each skill is a folder, such as `skills/quarter-planning/`; installing it means putting that folder where your agent reads skills.

| Directory | Read by |
|---|---|
| `.agents/skills/` in the project | VS Code with GitHub Copilot, Cursor, Codex, Gemini CLI and most others |
| `.github/skills/` in the project | VS Code with GitHub Copilot, and the Copilot coding agent |
| `.cursor/skills/` in the project | Cursor |
| `.claude/skills/` in the project | Claude Code, and also VS Code with GitHub Copilot and Cursor |
| `~/.agents/skills/`, `~/.copilot/skills/`, `~/.cursor/skills/`, `~/.claude/skills/` | The same tools, for every project |

A project folder (workspace level) shares the skill with everyone who clones the project and pins its version there. A folder in your home directory (user level) makes it available in every project you open.

### Copy the folder

Works for any agent. Clone the repository, then copy the skill into the folder your agent reads. For the workspace level, from your project's root:

bash:

```bash
git clone --depth 1 https://github.com/dermot-obrien/delivery-planning.git ../delivery-planning
mkdir -p .agents/skills
cp -r ../delivery-planning/skills/quarter-planning .agents/skills/
```

PowerShell:

```powershell
git clone --depth 1 https://github.com/dermot-obrien/delivery-planning.git ..\delivery-planning
New-Item -ItemType Directory -Force .agents\skills | Out-Null
Copy-Item -Recurse ..\delivery-planning\skills\quarter-planning .agents\skills\
```

For the user level, copy it to `~/.agents/skills/` (PowerShell: `$HOME\.agents\skills\`) instead, or to the folder your agent reads from the table. To update, copy the newer folder over the old one.

### With the GitHub CLI

With GitHub CLI 2.90 or later, for any agent:

```bash
gh skill install dermot-obrien/delivery-planning quarter-planning
```

### As a Claude Code plugin

The repository is also a Claude Code plugin marketplace, with one plugin per skill:

```
/plugin marketplace add dermot-obrien/delivery-planning
/plugin install quarter-planning@delivery-planning
```

### After installing

The skill reads the workspace's planning model and registers wherever `[suite.quarter-planning]` in the workspace's `.agents/skill-bindings.toml` says they are; nothing has a default path. [Configuration](docs/configuration.md) covers every key, and [`references/data-contract.md`](skills/quarter-planning/references/data-contract.md) every file and field. A work-management framework is optional: a workspace that keeps its epics in one file, written by hand or generated from a tracker, meets the contract in full. Then, from the workspace root:

```bash
python .agents/skills/quarter-planning/bin/check.py
```

prints `quarter-planning: ok` when the binding is complete.

## Quick start

With the skill copied into `.agents/skills/` and the workspace bound, as the [quick start](docs/quick-start.md) does step by step with a tiny example:

```bash
python .agents/skills/quarter-planning/bin/check.py
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --where
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --budget
```

Then ask your agent, for example, "Using quarter-planning, what is the status of quarter 2027-q1?"

## The stage grid and capability increments

A capability does not move from "we need it" to "in service" in one step. The workspace's definition ladder names the steps, its stages, and the stage grid shows, for one period, what is being done to move each capability along them.

| On the grid | In the ontology | What it is |
|---|---|---|
| A column | `LadderStage` | A stage: one step of the ladder, least defined first |
| A row | the lane | A capability or capability area |
| A row in one period | `CapabilityIncrement` | The lane's planned movement this period, carried by its epics and judged by its criteria |
| A cell | `IncrementStep` | What the increment delivers towards one stage. Derived, never stored |
| An item in a cell | `SizedDeliverable` | A deliverable is for one stage: its own `stage`, else its type's when the deliverable register allows the type only one. A type can be produced at many stages |
| An item in the last column | `IncrementOutcome` | Something others deliver that the increment counts on, such as a build put into service |

Everything is configurable. The columns are the ladder register's rows, so a workspace chooses how many stages there are and what they are called; four stages or nine work the same. The ladder's optional columns say what is built to reach each stage, which band it belongs to (Define, Build and so on), who moves a capability there, and where it becomes consumable, and the grid draws its bands, its "Who moves it" bar and the planning team's limit from them. The rows, the period, groups of deliverables shown as one item, outcomes, wording and colours are a per-period configuration file. The skill's app never changes; a build writes the one data file it reads. See [stage-grid](skills/stage-grid/SKILL.md) and its [configuration](skills/stage-grid/references/configuration.md).

Links are configuration too: the grid is told how to find pages (an identifier manifest, a template per kind of thing, a base URL, a tracker for keys) and makes no link where there is no page, so it is not tied to any site. [examples/harbourline](skills/stage-grid/examples/harbourline/README.md) is an invented operator with six stages and its own small site, ready to open.

The grid reads a work graph, `{nodes, links}`, so it does not need this bundle's planning model to be the store: anything that can write the graph, such as the [knowledge-graph](skills/knowledge-graph) skill over a workspace's own registers, will do.

## The knowledge graph and class views

`knowledge-graph` builds one graph of everything a workspace's graph map reads, laid out in lanes by role (Why, What, When, Delivery, Design). To see how the records of a few classes relate, without the rest, build a class view: give the classes as the [ontology](skills/ontology) skill names them.

```bash
node <skills>/knowledge-graph/scripts/graph.mjs build --classes mo:ABB,mo:SBB
node <skills>/knowledge-graph/scripts/graph.mjs build --view abb-sbb
node <skills>/knowledge-graph/scripts/graph.mjs views
```

A view keeps the records whose class is one of those given or extends one, and the links directly between them, one lane per class. It is written to `<out>/<name>/`, beside the whole graph. Name the views a workspace uses under `views` in its graph map; when two classes play one role, give each source its `class`, and each identifier scheme too. `stage-grid` reads the whole graph, never a view. See [the graph map](skills/knowledge-graph/references/graph-map.md#views).

## Documentation

| Page | Covers |
|---|---|
| [Quick start](docs/quick-start.md) | From nothing to a validated quarter plan in about ten minutes, in bash and PowerShell |
| [quarter-planning](docs/quarter-planning.md) | What the skill does, what it needs, and a map of its references |
| [Concepts](docs/concepts.md) | The budget ladder, the two stages, the checks, and the optional layers, in the order you need them |
| [Configuration](docs/configuration.md) | Every binding key, with type, default, precedence and an example; front matter and manifests |
| [Commands](docs/commands.md) | Every script, flag and exit code, and what to ask the agent |
| [Troubleshooting](docs/troubleshooting.md) | Every message the scripts print, and what to do |
| [Examples](docs/examples.md) | The test workspace and what each file in it shows |
| [References](skills/quarter-planning/references) | The rules the agent reads, inside the skill |
| [stage-grid configuration](skills/stage-grid/references/configuration.md) | The stage grid's columns, rows, placement and wording |
| [The graph map](skills/knowledge-graph/references/graph-map.md) | The knowledge graph's roles, sources, identifier schemes, links and class views |

## Agent Skills conformance

`quarter-planning` and `stage-grid` conform to the [Agent Skills specification](https://agentskills.io/specification). Its `SKILL.md` carries only the fields the specification defines, its `name` is the name of the directory it is installed into (`skills/quarter-planning` here, and `quarter-planning` under whichever skills directory an installer uses), every `metadata` value is a string, and the file stays within the specification's guidance of 500 lines and 5,000 tokens, with detail in files it links by a relative path one level deep. The `x-` keys in `metadata` are this project's own, which the specification allows.

CI checks this on every pull request and every push to `main`, with `skills-ref`, the specification's reference validator, beside this repository's own `scripts/validate-skills.mjs`, which also checks that relative links resolve. To run the same checks locally, from the repository root:

```bash
python -m pip install "git+https://github.com/agentskills/agentskills@69ef37e9424c0a7ea9dd2293b559e43ec8176379#subdirectory=skills-ref"
skills-ref validate skills/quarter-planning
node scripts/validate-skills.mjs skills
```

On Windows, set `PYTHONUTF8=1` before running `skills-ref`, which otherwise reads `SKILL.md` in the system's code page.

## Versions and identifiers

Each skill has its own Semantic Version in its `SKILL.md` (`metadata.version`), and each release is tagged `<skill>--v<version>`, such as `quarter-planning--v3.4.0`. A skill is identified by a Package URL of the `generic` type, `pkg:generic/dermot-obrien/delivery-planning/<skill>`, which names no host, so a mirror or a move changes where it is fetched from but not what it is called. This follows DD-11 of [AI-Assisted Work](https://github.com/dermot-obrien/ai-assisted-work/blob/main/docs/about/design-decisions.md).

## Origin

`quarter-planning` was developed as a skill of [AI-Assisted Work](https://github.com/dermot-obrien/ai-assisted-work), by the same author, and was extracted into this repository on 2026-09-29 at version 3.3.0. Delivery planning is technology-specific, so it sits outside AI-Assisted Work, which is domain-agnostic, and builds on its work items. [NOTICE](./NOTICE) records the exact source commit; the history before extraction is the history of `skills/quarter-planning` there, and its changelog.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues: [SECURITY.md](SECURITY.md).

## Licence

Content (documentation, `SKILL.md`, references) is licensed under [CC BY 4.0](LICENSES/CC-BY-4.0.txt), and code under [Apache-2.0](LICENSES/Apache-2.0.txt), the same terms as AI-Assisted Work. See [LICENSE](./LICENSE) for which files are which, and keep [NOTICE](./NOTICE) with any copy or derivative.
