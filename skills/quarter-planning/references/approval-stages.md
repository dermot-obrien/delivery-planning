<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# Approval stages

A plan is approved in stages, and each stage is recorded on the model record it approves, in an
`approval` field, never in a register or a document. The same stages apply at every level:

| Stage | Means |
|---|---|
| `draft` | Written, not yet checked. The default when the field is absent |
| `sized` | The size is agreed: for a product its points, for an epic that its products are named and sized |
| `validated` | Checked and ready for approval |
| `approved` | Approved, and approval is commitment. Nothing further records commitment |

## Where each level records it

| Level | Record | `approved` means |
|---|---|---|
| Quarter budget and resourcing | The quarterly `WorkPlan` | The resourcing, and the budget derived from it, are approved. One mark covers both, because the budget is calculated from the resourcing |
| Epic | The `WorkItem` | The epic as written is approved: goal, value, dependencies, framing. Its budget needs no mark of its own, because it follows from the approved resourcing |
| Product | Each entry in the epic's `deliverables` | The product as defined is approved. Distinct from `state`, which tracks the product itself |

## What section 7 enforces

Section 7 of the validation enforces three rules, each because breaking it means the model
contradicts itself:

- An epic is never further on than its least advanced product.
- An epic is not `approved` until the quarter's `WorkPlan` is, because the budget it commits
  to comes from the approved resourcing.
- An epic past `draft` names at least one product.

## Other stage names

A workspace with different stage names declares them, least advanced first, as
`approvalStages` in its binding. The last stage is always read as approval and commitment.

## After approval

When the resourcing or the distribution changes after the `WorkPlan` is approved, set it back
to `validated` and approve it again. The report flags an approved plan whose sections 1 to 4
no longer agree, but it cannot see a change that leaves them agreeing, so this one is a
discipline, not a check.
