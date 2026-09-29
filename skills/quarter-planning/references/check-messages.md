<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# Interpreting the check

What each message from the validation and the workspace's checks means, and what to do about it. Messages marked `WARNING` never fail the run. Rows marked (workspace) come from the workspace's own `commands.check`, not from this skill's scripts, so their wording is the workspace's. The bundle's docs/troubleshooting.md lists every message the scripts print, word for word.

| Message | What it means | What to do |
|---|---|---|
| `X records planned_points N but its products sum to M` | The epic record disagrees with its own products | Set `planned_points` to the sum, or fix the products |
| (workspace) `X is loaded to N against M of capacity` | Over-subscription | Not a tooling fix. Cut scope, or record the decision not to |
| (workspace) `X names deliverables worth N but has no budget_points` | Stage 1 has not been done for that epic | Allocate a budget, or confirm it is deferred |
| (workspace) `deliverable X is declared on Y but its id does not belong to it` | Structural break in `work_item.yaml`: a block has been cut across a record boundary | Repair from `roadmap.yaml`, which holds the composed copy |
| `overrides its type sizing with N points but records no reason` | `points` set without `points_override_reason` | Add the reason |
| `D on X is typed T, which is not in the register` | A product typed outside the register | Pick a type the register holds. Never invent an id |
| `D on X is typed T, which the register marks used No` | A retired type | Retype the product from a type in use |
| `D on X names no type from the register` | A product with no `deliverable_id` | Type it |
| `X flow F records rung_to R, which the ladder does not name` | A rung outside the bound ladder | Fix the rung, or the ladder |
| `X flow F moves down the ladder, from A to B` | A movement that loses definition | Fix the rungs. A rung lost is recorded at close, not planned |
| `WARNING X commits a flow to R but names no product whose type evidences R` | Nothing planned would show the rung was reached | Name a product of a type that evidences R, or lower the commitment |
| `WARNING X records no lane`, with a ladder bound | The capability area is unstated | Set `lane` |
| `WARNING X is recorded in both work_item.yaml and ...` | Two records for one epic | Remove one. `work_item.yaml` is used meanwhile |
| `Stale epic cards for Q` | A card no longer matches the model | Run `--cards` and commit the result |
| `Links behind the model for Q` | A definition does not point at its record's page | Run `--links` |
| `WARNING X is linked but has no site_route` | The record does not say where it is published | Set `site_route` on the record |
| (workspace) `<file>.csv has X; the model gives Y` | A derived view is stale | `commands.regenerate` |
| (workspace) `<file>.md says X; the derived view has Y` | Prose has drifted from the model | Fix the prose, never the view |
| (workspace) `activity X is assigned but has no estimate` | Warning. Sizing lives on products, not activities | Usually nothing |
| `X is recorded S but its product Y is only T` | An epic's approval runs ahead of one of its products | Bring the product up, or the epic back |
| `X is recorded approved, which is commitment, but the quarter budget and resourcing are S` | An epic committed before the budget it commits to | Approve the WorkPlan first, or set the epic back |
| `X records approval V, which is not one of ...` | A stage the workspace has not declared | Fix the value, or declare the stage in `approvalStages` |
| `The quarter budget is recorded approved, but levels 1 to 4 no longer agree` | What was approved has moved | Fix sections 1 to 4, then approve again |
