# Data contract

What this skill reads, so any workspace can supply it, whether or not it uses a work-management framework. The same shapes are published as the bundle's ontology module, `ontology/delivery.schema.json`, which builds on the work layer of AI-Assisted Work. Every location comes from `[suite.quarter-planning]` in the workspace's `.agents/skill-bindings.toml`; nothing has a default path. `tests/fixture/` is a complete, minimal workspace that satisfies this contract, and is the quickest way to see every file in context.

`{quarter}` in a path binding is the quarter's slug, such as `2027-q1`. `slugPattern` says how a slug is spelt, with named groups `y` and `q`, and `quarterLabel` builds the label the model records from them, such as `2027-Q1`.

## Required

| Binding | What it is | Shape |
|---|---|---|
| `sources` | A folder holding the planning model | The three YAML files below |
| `calendar` | The quarter's calendar | CSV: `period_id, type, start, end, working_days, note` |
| `basis` | The quarter's planning assumptions | CSV: `parameter, value, unit, basis`, with at least `working_days` and `usable_fraction` |
| `resourcing` | One row per person per piece of work | CSV: `stakeholder_id, name, role, allocation_pct, gross_capacity_points, leave_working_days, adjustment_points, capacity_points, work_item_id, share_of_allocation_pct, counts_against_enabler_capacity, adjustment_reason` |
| `register` | The deliverable types an epic can produce | CSV: `id, name, rung, base_story_points, used, description` |
| `quarterDir` | The quarter's folder, holding its plan documents | A folder |

### The planning model, in `sources`

`work_item.yaml` holds the epics, under a top-level `work_item:` list. An epic has:

| Field | Required | Meaning |
|---|---|---|
| `id` | Yes | The epic's identifier, such as `EP-001` |
| `title` | Yes | One line |
| `quarter` | Yes | The quarter label it is planned in, such as `2027-Q1` |
| `budget_points` | Stage 1 | The points allocated to it from the resourcing |
| `planned_points` | Stage 2 | The sum of its deliverables' sizes |
| `deliverables` | Stage 2 | A list, each with `id`, `deliverable_id` (a type in the register), `name`, `owner_stakeholder_id`, `state` and `approval` |
| `approval` | No | Its approval stage, when `approvalStages` is bound |
| `lane`, `flows` | No | Its capability lane, and each flow's `rung_from` and `rung_to`, when a `ladder` is bound |
| `home` | No | Its folder under `epicsDir`, for the epic card |
| `site_route` | No | The route of its published page, for `--links` |
| `external_refs` | No | `system` and `external_id` pairs, such as a tracker key, for `--links` with `externalRefSystem` |

`work_plan.yaml` holds the quarterly plan under `work_plan:`: a record with `id`, `plan_type: quarterly`, `quarter`, `planned_start`, `planned_end`, `status` and `work_item_ids`, the epics and other work the quarter commits to.

`activity.yaml` holds the stories under `activity:`: each with `id`, `work_item_id` (its epic), `title`, and optionally `site_route` and `request_ids`.

The skill edits `work_item.yaml` only through `--apply`, in place, keeping comments.

## Optional

| Binding | Turns on | Shape |
|---|---|---|
| `ladder` | Framing epics against a definition ladder | CSV: `rung, name, description`, in ascending order |
| `epicsDir`, `cardsDir` | Generated epic cards | Folders |
| `requests`, `products` | The feature-request layer | CSVs, described in [feature-requests.md](feature-requests.md) |
| `siteUrl`, `externalRefSystem` | Links from plan documents to epic and story pages | A URL, and a `system` name |
| `approvalStages`, `tolerance`, `playbook`, `commands` | Approval tracking, the load tolerance, a link to the workspace's own method, and the commands its reports suggest | See `inputs.toml` |
| `workItemsDir` | Reading epics and stories from work-item folders as well | See below |

## Work-item folders (optional)

A workspace that manages work as one folder per work item, as AI-Assisted Work does, can bind `workItemsDir`. Each `<workItemsDir>/*/progress.yaml` with `work_item_level: epic` and a `planning_period` equal to the quarter's label is then read as an epic, mapped onto the `work_item.yaml` fields, and its activities as stories. Where both stores hold the same epic, `work_item.yaml` wins and the clash is reported.

Nothing else needs a framework. A workspace that keeps its epics in `work_item.yaml` alone, written by hand or generated from a tracker, satisfies the contract in full.

## Checking a workspace

Before any quarter exists, `bin/check.py`, run from the workspace root, checks the binding: the six required paths declared, every declared path resolving (up to `{quarter}`), `slugPattern` compiling and supplying `quarterLabel`'s fields, and PyYAML installed.

```bash
python <skills>/quarter-planning/bin/check.py
```

For a quarter:

```bash
python <skills>/quarter-planning/bin/quarter.py --quarter <slug>
```

It reads everything above, and names any binding that is missing, any file that is absent and any record that breaks the chain from the calendar through to the products.
