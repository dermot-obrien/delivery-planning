<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# What the work graph must hold

The grid reads one JSON file, `{nodes, links}`, in the contract the knowledge-graph skill writes. Any tool may write it.

A node is `{id, role, label, url, props}`. A link is `{source, target, p}`.

## Roles

| Role | Used as | Props read |
|---|---|---|
| `period` | The period, by its label (`Q1-FY27`, `2027-Q1`) | |
| `capability` | A lane | `description` or `Description` |
| `epic` | The work in a lane | `key`, `goal`, `status`, `approval`, `budget_points`, `planned_points`, and any field `epicFilter` names |
| `deliverable` | What an epic produces | `stage` (the one stage it is for), `state`, `approval` |
| `deliverable-type` | A deliverable's type | `stages`: every stage the type can be produced at, separated by `;` |
| `story` | An epic's story | `key`, `status` |
| `increment` | What must become true | `satisfaction_status` or `status` |
| `initiative`, `pattern`, `building-block` | Shown on the epic's panel | |

## Predicates

| Link | Means |
|---|---|
| epic `scheduledIn` period | The epic is in the period |
| epic `advances` capability | The epic's lane |
| epic `advances` increment | A criterion the epic must make true |
| epic `produces` deliverable | |
| deliverable `typedAs` deliverable-type | |
| story `partOf` epic, story `produces` deliverable | |
| epic `partOf` initiative, epic `refines` pattern, epic `dependsOn` epic | |

`url` on any node becomes a link in its panel. Site-relative URLs work when the grid is published on the same site.

The old names are read too: `rung` on a deliverable or a type, and `rung` as the ladder's id column.
