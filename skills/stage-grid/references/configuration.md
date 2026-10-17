<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Stage grid configuration

One JSON file per period. Paths in it are relative to the file. The worked example is [examples/workspace/planning/stage-grid.json](../examples/workspace/planning/stage-grid.json).

## Columns: the stages

The columns are configurable in number, order, names and wording. Give them one of two ways.

`ladder`: the path of the definition ladder register, the same CSV the quarter-planning skill binds as `ladder`. One row per stage, least defined first:

| Column | Required | Meaning |
|---|---|---|
| `stage` | yes | The stage's id, such as `R2`. Deliverables name it. A column headed `rung`, the old name, is read too |
| `name` | yes | The column heading |
| `description` | no | What being at this stage means |
| `builds` | no | What is built to reach it, items separated by `;` |
| `band` | no | The phase it belongs to, such as Define. Consecutive stages with the same band and mover make one band |
| `moved_by` | no | Who moves a capability here, such as architecture, delivery or run |
| `consumable` | no | `yes` on the first stage a consumer can use; that column is flagged |

`stages`: the same as a list of objects (`id`, `name`, `description`, `builds`, `band`, `movedBy`, `consumable`, `color`, `flag`). With a ladder, `stages` overrides fields of the stage with the same `id`, which is how a workspace sets colours. Without a ladder, `stages` is the whole list.

`only`: a list of stage ids to show, in order, when the grid should show fewer than the ladder holds (leaving out an R0 Unrecognised, say).

A stage with no `color` gets one from a neutral ramp.

## Rows: the lanes

`lanes` lists the rows in order. Each is a capability increment for the period:

| Key | Meaning |
|---|---|
| `lane` (or `id`) | The capability or capability area. Must be a node in the graph |
| `label` | The row heading. Default: the node's label |
| `description` | Shown in the lane's panel. Default: the node's `description` |
| `epic_ids` | Only these epics, when not every epic that advances the lane belongs on the grid |
| `excludeEpics` | Epics to leave out |
| `groups` | Several deliverables shown as one item: `{"label", "deliverables": [...], "stage"}`. Without `stage`, the first deliverable's |
| `outcomes` | What others deliver that the increment counts on: `{"text", "status", "stage", "product"}`. Without `stage`, the last stage |

## Cells: placement

A deliverable type can be produced at many stages; a planned deliverable is for one. A deliverable is placed at the first of: its own `stage` (a field on the deliverable), `placement.byDeliverable[id]`, its type's stage when the type's `stages` (the deliverable register's column) name exactly one, `placement.byType[type]`. When the type allows several stages and the deliverable names none, it stays off the grid with a warning; a deliverable for a stage its type does not list is a warning too. `placement.exclude` lists deliverables to leave off. A deliverable with none of these is not on the grid; the epic's panel lists it under "Also delivered".

`labels` gives a shorter label for a deliverable by id.

## Links

`links` says how pages are found: `base`, `manifest`, `templates` per role, `keys`, `fromGraph` and `none`. See [links.md](links.md). A thing with no page is not a link.

## The rest

| Key | Meaning |
|---|---|
| `title`, `subtitle`, `strap`, `note` | Text on the page |
| `period` | The period's label, as epics record it. Required |
| `epicFilter` | Fields an epic must have, such as `{"work_item_level": "epic"}` |
| `boundary` | The dashed line: `{"after": "<stage id>"}`, or `{"mover": "<moved_by>"}` for the last stage that mover moves. `title` and `label` make the "Who moves it" bar |
| `bands` | Explicit bands, `{"from", "to", "label", "who"}`, when the stages carry none |
| `consumableLabel` | The flag's text. Default `Consumable from here` |
