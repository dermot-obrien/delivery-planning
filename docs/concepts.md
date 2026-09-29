<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Concepts

The ideas behind `quarter-planning`, in the order you meet them when planning a quarter. Each section links to the reference inside the skill that holds the full rules; the skill's agent reads those same files.

## 1. The skill carries method, the workspace carries data

The skill knows how to plan a quarter. It knows nothing about where your files are, how your quarters are named or which public holidays you observe. A workspace says all of that in one place: `[suite.quarter-planning]` in its `.agents/skill-bindings.toml`. Six paths are required and none has a default, because a default would be some other workspace's layout. A run in an unbound workspace names the keys it is waiting for and stops.

See [Configuration](configuration.md).

## 2. The quarter slug and its label

You name a quarter on the command line with a slug, such as `2027-q1` or `fy30-q1`. Path bindings may carry `{quarter}`, which becomes the slug, so one binding serves every quarter. The model records a label rather than the slug, such as `2027-Q1` or `Q1-FY30`; `slugPattern` and `quarterLabel` say how one becomes the other. An epic, a WorkPlan and a work item's `planning_period` all use the label.

## 3. The model is the source of truth

Every figure is derived from the planning model and the registers. Nothing that a script can compute is typed into prose, and no view is published that cannot be derived. Epic cards, the stage grid and any figure quoted in a plan document are outputs, regenerated rather than edited. When prose disagrees with a derived view, the prose is wrong.

## 4. Configuration, data and arithmetic are kept apart

- Configuration is where things live and what they are called: the bindings. It changes when a workspace reorganises.
- Data is the assumptions: working days, the usable fraction of a day, person-days per point, expected absence. These change every quarter and need their reasoning recorded, so they are rows in the planning basis register, each with a `basis` column, not settings.
- Arithmetic is the same everywhere and lives in one module, `src/capacity.py`.

The test for which is which: if someone should have to justify it, it is data. See [budget-model.md](../skills/quarter-planning/references/budget-model.md).

## 5. Three registers set the quarter's capacity

| Register | Binding | Says |
|---|---|---|
| Calendar | `calendar` | The quarter's periods and the working days in each. Holidays are whatever the weekdays exceed the working days by, so no jurisdiction is assumed. A `type: non_working` row is a shutdown |
| Planning basis | `basis` | The assumptions, one row each, and three declared totals the other registers must reproduce |
| Resourcing | `resourcing` | One row per person per work item: allocation, booked leave in working days, and the share of their allocation given to each work item |

## 6. The budget ladder

Capacity is derived top down. Time and cost are fixed first, and scope varies against them.

```text
working_days x usable_fraction / person_days_per_point = points at 100 percent allocation
per person: allocation x that, less booked leave, less expected absence = available
per row:    available x share_of_allocation_pct -> the work item named, or out of scope
sum of what counts = ENABLER CAPACITY = quarter_budget_points + unallocated_capacity_points
```

A row with `counts_against_enabler_capacity` other than `yes` is work outside the scope being budgeted, such as run work; it reduces what the person brings rather than disappearing. A person's shares must total 100 percent. Figures are carried unrounded and rounded once, for display.

## 7. Epics and the quarter's WorkPlan

An epic is a work item in `work_item.yaml` (or, optionally, a work-item folder; see section 16). The quarter's commitment is a `WorkPlan` record in `work_plan.yaml`, with `plan_type: quarterly`, the quarter label and `work_item_ids`. Without it nothing in the model states what the quarter committed to, and the validation fails.

## 8. Stage 1: budget

Each epic is given `budget_points`: the sum of what people's shares give it in the resourcing register. This is set before any story exists. The epic knows what it may spend, not what it will produce. `--apply` writes the derived figure onto each epic. An epic with no `budget_points` has been given no capacity: its products are deferred and load nobody.

## 9. Stage 2: elaboration

The epic names its products in `deliverables`. Each product is typed from the deliverable register (`deliverable_id`) and takes that type's `base_story_points` unless it overrides them with `points` and a `points_override_reason`. A missing `points` means the base points, not zero. The sum is the epic's `planned_points`.

The register is what gives a named product a size without estimating it again. A type the register does not hold, or marks `used: No`, fails the run; retired ids are never reissued.

## 10. Budget and planned are compared, never reconciled

The epic is the only place the two stages meet. Planned above budget is a scoping decision, not a request for more capacity, because capacity came from a calendar and a set of people and neither moves because a plan would prefer it. The skill reports the gap and who carries it; it never proposes the cut.

## 11. The validation: integrity against subscription

`quarter.py --quarter <slug>` prints one report in up to ten sections, read top down:

| Section | Kind | Fails the run when |
|---|---|---|
| 1 Period, 2 Resources, 3 Quarter budget, 4 Epic budgets | Integrity | Any figure disagrees with its derivation or a declared total |
| 5 Elaboration | Subscription, plus register rules | A product breaks a register rule (over budget never fails) |
| 6 Load | Subscription | Never, except a product owner missing from the resourcing register |
| 7 Approval | Integrity of claims | An approval the records beneath it do not support |
| 8 Framing | Judged only with a ladder | A rung the ladder does not name, or a movement down it |
| 9 Close | Once recorded | A `rung_reached` the ladder does not name |
| 10 Feature requests | With `requests` bound | An unknown epic or product, a bad status or WSJF score |

Warnings never fail the run. See [validation-report.md](../skills/quarter-planning/references/validation-report.md) and [Troubleshooting](troubleshooting.md).

## 12. Approval stages

A plan is approved in stages, `draft`, `sized`, `validated` and `approved` by default, each recorded in an `approval` field on the record it approves: the WorkPlan for the budget and resourcing, the epic, and each product. The last stage is commitment. An epic may not be further on than its least advanced product, may not be approved before the WorkPlan is, and may not pass `draft` with no product. See [approval-stages.md](../skills/quarter-planning/references/approval-stages.md).

## 13. The definition ladder and framing (optional)

Progress is measured as movement up a definition ladder: rungs, least defined first, each named by the artefact that proves it. Bind a ladder and each epic's `flows` (with `rung_from` and `rung_to`) are checked against it, and the register's `rung` column says which rung each product type evidences. The skill ships no ladder. See [framing.md](../skills/quarter-planning/references/framing.md).

## 14. Epic folder and epic card (optional)

An epic has a hand-written folder under `epicsDir`, which lives across quarters and holds the argument: framing, scope decisions, dependencies, discovery. It also has a generated card under `cardsDir`, one per quarter, which holds every figure and nothing else. If a script can compute it, it goes on the card; if somebody argued it, it goes in the folder. See [epic-cards.md](../skills/quarter-planning/references/epic-cards.md).

## 15. Links to published pages (optional)

Each epic and story records `site_route`, where its page is published. The workspace binds `siteUrl`, and `--links` points every Markdown reference-link definition in the quarter's documents whose label is an epic or story id at that page. See [links.md](../skills/quarter-planning/references/links.md).

## 16. Epics from work-item folders (optional)

A workspace that keeps one folder per work item, each with a `progress.yaml`, binds `workItemsDir`. Every `progress.yaml` with `work_item_level: epic` and the quarter's label as `planning_period` is read as an epic beside `work_item.yaml`, which wins on a clash. See [work-item-folders.md](../skills/quarter-planning/references/work-item-folders.md).

## 17. Feature requests (optional)

Consumers use products that platform teams offer. When a product cannot yet meet a need, a feature request is raised against it and ranked by WSJF. An epic takes the request on (the register's `epic` column), and the epic's stories cite it in `request_ids`. The request adds no points; the epic's products carry the size. See [feature-requests.md](../skills/quarter-planning/references/feature-requests.md).

## 18. Closing the quarter

At the end, record `rung_reached` on each flow and `actual_points` on each product. The validation then adds section 9: committed against reached per flow, planned against actual per product, and per type the ratio of actual to base points, as a hint for recalibrating the register by hand.

## 19. The delivery ontology

The same shapes are published as a JSON Schema module, `ontology/delivery.schema.json`, which builds on the work layer of [AI-Assisted Work](https://github.com/dermot-obrien/ai-assisted-work). An `Epic` is a work item at `work_item_level: epic` with the planning fields, a `Story` is an activity with `site_route` and `request_ids`, and the registers each have a row type. Use it to validate a workspace's files with your own tooling; the skill itself does not need it. [The data contract](../skills/quarter-planning/references/data-contract.md) describes the same shapes in prose.
