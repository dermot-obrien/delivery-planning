<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# Epics from work-item folders

A workspace that manages work as one folder per work item, as AI-Assisted Work does, keeps an
epic in `<work items>/WI-NNN/progress.yaml` rather than in the composed `work_item.yaml`. Bind
`workItemsDir` and the skill reads both: every `progress.yaml` with `work_item_level: epic` and
a `planning_period` equal to the quarter's label becomes an epic record.

| progress.yaml | Read as |
|---|---|
| `work_item_id` | `id` |
| `title`, `budget_points`, `planned_points`, `lane`, `flows`, `home`, `approval` | The same |
| Deliverable `type` | `deliverable_id` |
| Deliverable `owner` | `owner_stakeholder_id` |
| Deliverable `id`, `name`, `points`, `points_override_reason`, `state`, `approval`, `actual_points` | The same |

Where both stores hold the same id, `work_item.yaml` wins and the clash is a warning. A work
item's epic still needs the quarter's WorkPlan to name it, and a row in the resourcing
register to give it a budget.

`--apply` does not write `budget_points` onto an epic read from a `progress.yaml`, because
that file is versioned by its own protocol; set it there by hand.
