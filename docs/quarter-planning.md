<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# quarter-planning

`pkg:generic/dermot-obrien/delivery-planning/quarter-planning`, in [`skills/quarter-planning/`](../skills/quarter-planning).

Plans a quarter, or a programme increment, in two stages, and keeps the plan honest afterwards. Stage 1 derives a budget of points from the calendar and the resourcing register and allocates it down to epics. Stage 2 names each epic's products from a deliverable register and rolls their sizes up. The skill compares the two, checks the whole chain from calendar to products, and never decides scope.

## When an agent uses it

When you ask to plan or replan a quarter, report or set its budget, frame or size an epic, set `budget_points`, name the deliverables on a work item, generate epic cards, link plan documents to epic and story pages, close a quarter, or reconcile plan documents with the model. [Commands](commands.md#what-you-ask-the-agent) lists the requests it understands.

## What it needs

- Python 3.11 or newer, and PyYAML.
- A workspace with `[suite.quarter-planning]` in `.agents/skill-bindings.toml`, declaring six paths: `sources`, `register`, `basis`, `calendar`, `resourcing` and `quarterDir`. No work-management framework is needed.

## What it provides

| Part | What it is |
|---|---|
| [`SKILL.md`](../skills/quarter-planning/SKILL.md) | The instructions the agent loads |
| [`bin/quarter.py`](../skills/quarter-planning/bin/quarter.py) | The validation, the budget report, `--apply`, `--cards`, `--links` and `--backlog`. See [Commands](commands.md#binquarterpy) |
| [`bin/check.py`](../skills/quarter-planning/bin/check.py) | The post-install check. See [Commands](commands.md#bincheckpy) |
| [`inputs.toml`](../skills/quarter-planning/inputs.toml) | Every binding key it reads. See [Configuration](configuration.md) |
| `src/` | The arithmetic (`capacity.py`), the model reader, cards, links, framing and feature requests. Other generators import these rather than recomputing |
| `tests/` | The tests and [the test workspace](examples.md) |
| [`ontology/delivery.schema.json`](../ontology/delivery.schema.json), at the repository root | The delivery layer of the ontology: the same shapes as the data contract, as JSON Schema |

## The references

The agent reads each reference when its topic comes up. They are the authority on the rules; these docs explain and link to them.

| Reference | Covers |
|---|---|
| [data-contract.md](../skills/quarter-planning/references/data-contract.md) | Every binding, file and field the skill reads |
| [budget-model.md](../skills/quarter-planning/references/budget-model.md) | How the budget is derived, and what each register must hold |
| [validation-report.md](../skills/quarter-planning/references/validation-report.md) | What each section of the validation answers, what fails the run, and how `--apply` patches the file |
| [check-messages.md](../skills/quarter-planning/references/check-messages.md) | What each check message means and what to do |
| [approval-stages.md](../skills/quarter-planning/references/approval-stages.md) | The approval stages at each level, and the rules section 7 enforces |
| [framing.md](../skills/quarter-planning/references/framing.md) | The definition ladder, and what section 8 checks |
| [epic-cards.md](../skills/quarter-planning/references/epic-cards.md) | Epic folder against epic card, what a card holds, and an outline for the folder |
| [links.md](../skills/quarter-planning/references/links.md) | Links from plan documents to epic and story pages |
| [feature-requests.md](../skills/quarter-planning/references/feature-requests.md) | The optional feature-request layer |
| [work-item-folders.md](../skills/quarter-planning/references/work-item-folders.md) | Reading epics from `progress.yaml` files |
| [optional-bindings.md](../skills/quarter-planning/references/optional-bindings.md) | What each optional key turns on |
| [failure-modes.md](../skills/quarter-planning/references/failure-modes.md) | Mistakes that have happened, and why each matters |

## What it does not do

It does not decide scope cuts, which are yours. It does not edit a governed schema. It does not regenerate a workspace's derived views itself: it names the workspace's own `commands.regenerate` and `commands.check`, or asks what the workspace uses.

## Versions

The current version is in `metadata.version` of `SKILL.md`, and each release is tagged `quarter-planning--v<version>`. Changes are in the [CHANGELOG](../CHANGELOG.md).
