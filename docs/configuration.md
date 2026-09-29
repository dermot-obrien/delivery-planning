<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Configuration reference

Everything `quarter-planning` can be told about a workspace. The skill declares these keys in [`skills/quarter-planning/inputs.toml`](../skills/quarter-planning/inputs.toml); this page adds the type, default, precedence and an example for each. The shape of the files the keys point at is in [the data contract](../skills/quarter-planning/references/data-contract.md).

Assumptions such as working days, the usable fraction of a day and expected absence are not configuration. They are rows in the planning basis register, each with its reasoning, so they are reviewed like a plan rather than edited like a setting. See [Concepts](concepts.md#4-configuration-data-and-arithmetic-are-kept-apart).

## The bindings file

| Question | Answer |
|---|---|
| File | `.agents/skill-bindings.toml`, or `skill-bindings.toml`, in the workspace |
| Section | `[suite.quarter-planning]`. Other sections in the file belong to other skills and are ignored |
| How it is found | From the working directory, or from `--workspace` when given, the skill looks in each folder for `.agents/skill-bindings.toml` then `skill-bindings.toml`, and walks up to the root. The nearest file wins; files further up are not merged |
| Paths resolve against | The folder holding the bindings file, never the working directory. For `.agents/skill-bindings.toml` that is `.agents/`, so workspace paths start with `../` |
| Absolute paths | Allowed, and used as they are |
| `{quarter}` | Replaced in any path by the quarter slug given with `--quarter`. `bin/check.py`, which has no quarter, checks such a path up to the placeholder |
| Encoding | UTF-8 without a byte order mark. A BOM makes the file invalid TOML (see [Troubleshooting](troubleshooting.md#not-valid-toml)) |
| Other keys | Top-level keys such as `bindingsVersion` are not read by this skill |

Precedence, for every key: a value declared in `[suite.quarter-planning]` wins; otherwise the default below applies; a required key has no default, and a run stops and names it. There are no environment variables or command-line flags for these keys. `--workspace` only changes where the search for the file starts.

A complete example, from [`tests/fixture/`](../skills/quarter-planning/tests/fixture/.agents/skill-bindings.toml):

```toml
[suite.quarter-planning]
sources      = "../planning/model"
register     = "../registers/deliverable-types.csv"
basis        = "../planning/{quarter}/{quarter}-planning-basis.csv"
calendar     = "../planning/{quarter}/{quarter}-calendar.csv"
resourcing   = "../planning/{quarter}/{quarter}-resourcing.csv"
quarterDir   = "../planning/{quarter}"
slugPattern  = '^(?P<y>\d{4})-q(?P<q>[1-4])$'
quarterLabel = "{y}-Q{q}"
ladder       = "../registers/ladder.csv"
epicsDir     = "../epics"
cardsDir     = "../planning/{quarter}/cards"
workItemsDir = "../work-items"
siteUrl      = "http://localhost:3000/docs/"
externalRefSystem = "tracker"

[suite.quarter-planning.commands]
regenerate = "npm run gen:views"
check      = "npm run check"
```

The `commands` table is not in the fixture; the values shown are examples of a workspace's own commands.

## Required keys

All six are paths with no default.

| Key | Type | Points at | Example |
|---|---|---|---|
| `sources` | path, folder | The planning model: `work_item.yaml` and `work_plan.yaml` (both required) and `activity.yaml` (optional) | `"../planning/model"` |
| `register` | path, CSV | The deliverable type register: `id, name, rung, base_story_points, used, description` | `"../registers/deliverable-types.csv"` |
| `basis` | path, CSV | The planning basis: `parameter, value, unit, basis` | `"../planning/{quarter}/basis.csv"` |
| `calendar` | path, CSV | The quarter's periods: `period_id, type, start, end, working_days, note` | `"../planning/{quarter}/calendar.csv"` |
| `resourcing` | path, CSV | One row per person per work item (twelve columns; see the data contract) | `"../planning/{quarter}/resourcing.csv"` |
| `quarterDir` | path, folder | The quarter's folder. It must exist, and `--links` rewrites the `*.md` files directly inside it | `"../planning/{quarter}"` |

## Optional keys with defaults

| Key | Type | Default | What it does | Example |
|---|---|---|---|---|
| `slugPattern` | string, regular expression | `'^fy(?P<fy>\d{2})-q(?P<q>[1-4])$'` | How a quarter slug is shaped. Its named groups feed `quarterLabel`. Write it as a TOML literal string, in single quotes, because it carries backslashes. When it is not declared, `--where` and `check.py` note that the fiscal-year default is in use | `'^(?P<y>\d{4})-q(?P<q>[1-4])$'` |
| `quarterLabel` | string, format | `"Q{q}-FY{fy}"` | Builds the label the model records (`quarter`, `planning_period`) from the slug's named groups. Every `{field}` must be a group of `slugPattern` | `"{y}-Q{q}"` |
| `tolerance` | number, or a string holding one | `0.05` | How far two point figures may differ before an integrity section calls it a disagreement. It absorbs float representation, not real drift | `0.05` |
| `approvalStages` | string, comma-separated, or a list of strings | `"draft,sized,validated,approved"` | The approval stages, least advanced first. The last is read as approval and commitment | `"draft,reviewed,approved"` |
| `requestStatuses` | string, comma-separated, or a list of strings | `"analyzing,backlog,implementing,validating,releasing,done,rejected"` | A feature request's statuses, least advanced first. The first is not yet ready to build. Read only with `requests` bound | `"new,ready,building,done,rejected"` |

## Optional keys with no default

Each opts in to something. A workspace that declares none of them validates exactly as it would without them.

| Key | Type | Opts in to | Example |
|---|---|---|---|
| `ladder` | path, CSV | Judging each epic's `flows` against a definition ladder: `rung, name, description`, least defined first. Section 8 fails on an unknown rung or a downward movement | `"../registers/ladder.csv"` |
| `epicsDir` | path, folder | Linking each epic card to the epic's hand-written folder, `<epicsDir>/<home>/index.md` (or `README.md`) | `"../epics"` |
| `cardsDir` | path, folder | `--cards`. Written rather than read, so it need not exist before the first run. Usually carries `{quarter}` | `"../planning/{quarter}/cards"` |
| `workItemsDir` | path, folder | Reading `<workItemsDir>/*/progress.yaml` with `work_item_level: epic` and the quarter's label as `planning_period` as epics, and their activities as stories | `"../work-items"` |
| `requests` | path, CSV | The feature-request layer: section 10, the request sections on cards, and `--backlog` | `"../registers/feature-requests.csv"` |
| `products` | path, CSV | Names, platforms and teams for the products requests are raised against, and a check that each exists. Read with `requests` | `"../registers/products.csv"` |
| `siteUrl` | string, URL | `--links`. The root every record's `site_route` is appended to, including any base path. Never resolved against the bindings file | `"https://plans.example.org/docs/"` |
| `externalRefSystem` | string | Letting an epic's tracker key, the `external_id` of its `external_refs` entry with this `system` (compared case-insensitively), label a link to the epic's own page | `"tracker"` |
| `playbook` | path | Nothing in the scripts. The agent reads it before planning, because the workspace's own method governs and the skill only carries mechanics | `"../method/planning-playbook.md"` |
| `commands` | table of strings | Naming the workspace's own commands by role, so reports and the agent can say what to run. See below | See below |

### `commands` roles

Write the table as `[suite.quarter-planning.commands]` or inline as `commands = { check = "npm run check" }`. Any role left unset is described in words rather than named as a command.

| Role | Used by | Means |
|---|---|---|
| `regenerate` | The agent | Rebuild the views derived from the model |
| `check` | The agent, and each epic card's note on a disagreeing budget | Fail on prose that disagrees with the derived views |
| `compose` | The agent | Rebuild the composed model from its sources |
| `cards` | `--cards --check` when stale, and each card's generated-file notice | Regenerate the epic cards |
| `links` | `--links --check` when stale | Point the plan documents' links at their pages |

## Environment

| Variable | Read by | Effect |
|---|---|---|
| `SKILL_DIR` | `bin/check.py` | The installed skill's folder. Defaults to the folder `check.py` sits in, one level up, which is right for every normal install |
| `PYTHONUTF8=1` | `skills-ref`, on Windows | Makes the Agent Skills reference validator read `SKILL.md` as UTF-8 rather than in the system code page |

## Model record fields

The fields the skill reads on epics, products, stories and the WorkPlan are data, not configuration; they are listed in [the data contract](../skills/quarter-planning/references/data-contract.md). The ones that switch behaviour on:

| Field | On | Effect |
|---|---|---|
| `budget_points` | Epic | Stage 1 done. Absent means deferred |
| `points`, `points_override_reason` | Product | Override the type's base points; the reason is required |
| `approval` | WorkPlan, epic, product | Its approval stage; absent means the first stage |
| `lane`, `flows`, `advances_criterion_ids`, `home` | Epic | Framing (section 8) and the link from the card to the folder |
| `rung_reached`, `actual_points` | Flow, product | The close (section 9) |
| `site_route` | Epic, story | `--links` |
| `external_refs` | Epic | `--links` with `externalRefSystem` |
| `request_ids` | Story | The feature-request layer |

## Front matter

`SKILL.md` carries the fields the [Agent Skills specification](https://agentskills.io/specification) defines, and project keys in `metadata`, whose values must be strings:

| Key | Holds |
|---|---|
| `name` | `quarter-planning`, the folder name it is installed under |
| `description` | What the skill does and when an agent should use it. At most 1,024 characters |
| `license` | `CC-BY-4.0 AND Apache-2.0`, with a note on which files are which |
| `compatibility` | Its requirements: Python 3.11 or newer, PyYAML and the bindings. At most 500 characters |
| `metadata.author`, `metadata.homepage` | The author and this repository |
| `metadata.version` | The skill's Semantic Version. Must equal its entries in `.claude-plugin/marketplace.json` and `bundle.json` |
| `metadata.x-skill-requires` | Other skills it needs. Empty |
| `metadata.x-derived-from` | The source commit it was extracted from |

Each generated epic card has front matter too, written by `--cards` and never edited: `title`, `sidebar_label`, `sidebar_position` and `status: Generated`.

## Repository manifests

These describe the bundle to installers and are maintained with each release, not by users:

| File | Holds |
|---|---|
| `bundle.json` | The bundle manifest (DD-11 of AI-Assisted Work): each skill's path, version, Package URL, requirements and post-install check, the ontology module and what it extends, and the adapters |
| `.claude-plugin/marketplace.json` | The Claude Code plugin marketplace, one plugin per skill, with its version |
| `REUSE.toml` | Which files are CC BY 4.0 and which Apache-2.0 |
