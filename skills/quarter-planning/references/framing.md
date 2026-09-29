<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# The definition ladder and framing

The unit of progress is a rung on the workspace's definition ladder. Each rung names the
artefact that proves it, so a rung is a claim that can be checked rather than a statement of
effort. Bind the ladder as `ladder`, a CSV with the columns `rung`, `name` and `description`,
one row per rung, least defined first. The skill ships no ladder, because which rungs a
workspace recognises is its own method.

## Where framing is recorded

Framing lives on the epic record in the model:

| Field | Holds |
|---|---|
| `lane` | The capability area the epic advances. One per epic |
| `flows` | One entry per flow: `flow`, an optional `description`, `rung_from` and `rung_to` |
| `advances_criterion_ids` | The criteria the epic advances. Empty is reported, not failed |
| `home` | The epic's own folder, by name, under `epicsDir` |

## What section 8 checks

The register's optional `rung` column says which rung each product type evidences. Section 8
of the validation joins the two:

| With `ladder` bound | Result |
|---|---|
| A `rung_from` or `rung_to` the ladder does not name | Fails the run |
| `rung_to` below `rung_from` | Fails the run |
| A target rung that no product's type evidences | Warning |
| No `lane` | Warning |

With no ladder bound, section 8 lists the flows as recorded and judges nothing.
