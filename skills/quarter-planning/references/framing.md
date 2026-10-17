<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# The definition ladder and framing

The unit of progress is a stage on the workspace's definition ladder. Each stage names the
artefact that proves it, so a stage is a claim that can be checked rather than a statement of
effort. Bind the ladder as `ladder`, a CSV with the columns `stage`, `name` and `description`,
one row per stage, least defined first. The skill ships no ladder, because which stages a
workspace recognises is its own method.

## Where framing is recorded

Framing lives on the epic record in the model:

| Field | Holds |
|---|---|
| `lane` | The capability area the epic advances. One per epic |
| `flows` | One entry per flow: `flow`, an optional `description`, `stage_from` and `stage_to` |
| `advances_criterion_ids` | The criteria the epic advances. Empty is reported, not failed |
| `home` | The epic's own folder, by name, under `epicsDir` |

## What section 8 checks

The register's optional `stages` column lists every stage each product type can be produced at, separated by `;`: a type is one to many with stages. A product records the one stage it is for as `stage`; without one, it counts for every stage its type allows. Section 8
of the validation joins the two:

| With `ladder` bound | Result |
|---|---|
| A `stage_from` or `stage_to` the ladder does not name | Fails the run |
| `stage_to` below `stage_from` | Fails the run |
| A target stage no product is for | Warning |
| No `lane` | Warning |

With no ladder bound, section 8 lists the flows as recorded and judges nothing.
