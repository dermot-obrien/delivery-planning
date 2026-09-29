---
name: quarter-planning
description: Plan and maintain a quarter in two stages, deriving a budget of points from the calendar and the resourcing register, allocating it down to epics, then elaborating deliverables and rolling their sizes up. Frames an epic against its capability lane and the definition ladder, names its products from the deliverable register, generates epic cards, links the plan documents to each epic's and story's published page, and interprets the integrity checks. Optionally tracks feature requests raised against registered products, ranked by WSJF, taken on by epics and joined to the stories that build them. Use when planning or replanning a quarter, reporting or setting a quarter budget, framing or sizing an epic, setting budget_points, naming deliverables on a work item, generating epic cards, linking plan documents to epic and story pages, closing a quarter, or reconciling plan documents with the model.
license: CC-BY-4.0 AND Apache-2.0. Content under CC BY 4.0, code under Apache-2.0; see LICENSE and NOTICE.
compatibility: Python 3.11 or newer, and PyYAML. Reads the planning registers, the model sources and the deliverable register at whatever paths [suite.quarter-planning] in the workspace .agents/skill-bindings.toml declares. Those six paths are required and have no default, so the skill carries no directory layout; it assumes no jurisdiction's holidays either.
metadata:
  author: dermot-obrien
  version: "3.5.1"
  homepage: https://github.com/dermot-obrien/delivery-planning
  x-skill-requires: ""
  x-derived-from: "https://github.com/dermot-obrien/ai-assisted-work/tree/78ec34e732ace27cc50d322d33383a75fa628092/skills/quarter-planning"
---

# Quarter Planning

Plans a quarter, and keeps the plan honest afterwards. It does not decide scope.

## The rule that governs everything

The model is the source of truth and everything else is derived from it. Never type a figure
into prose that a script can compute, and never publish a view that cannot be derived.

Each row below is a binding key, not a path. All six are required and none has a default,
because a default would be whichever workspace this skill was written in. Declare them in
`[suite.quarter-planning]` of `.agents/skill-bindings.toml`; `--where` shows what they
resolve to, and names the ones still undeclared, without reading any of them.

| Holds | Binding key | Authoritative for |
|---|---|---|
| Epics and their products | `sources` → `work_item.yaml` | `budget_points`, `planned_points`, the `deliverables` each epic names |
| Stories | `sources` → `activity.yaml` | Who is assigned. Not sizing |
| Product sizes | `register` | `base_story_points` per type, and the `used` flag |
| The quarter's assumptions | `basis` | Working days, usable fraction, person-days per point, expected absence, and the three totals the registers must reproduce |
| Non-working time | `calendar` | Working days per period. Public holidays and any shutdown are whatever the weekdays exceed these, so no jurisdiction is assumed |
| Capacity | `resourcing` | Points per person, and which allocations count |

Optional keys each opt in to something, and a workspace that declares none of them validates
exactly as before: `ladder` for framing against the definition ladder, `epicsDir` and
`cardsDir` for the epic cards, `workItemsDir` for epics kept in work-item folders, `requests`
and `products` for the feature-request layer, and `siteUrl` and `externalRefSystem` for links
to published pages. What each turns on is in
[references/optional-bindings.md](references/optional-bindings.md).

Derived, never hand-edited: the epic cards and the stage grid, which this skill generates
with `--cards`, the capacity-load and epic-load views under the `quarterDir` binding, any
planning deck, and every figure quoted in the plan documents. A workspace lists its own
derived outputs; this skill only insists they are derived.

Regenerating what the model derives is the workspace's own job, not this skill's. Where the
binding names `commands.regenerate` and `commands.check`, run those; otherwise ask what this
workspace uses. A workspace that keeps a manifest of what depends on the model should add to
it in the same change as any new generator, not afterwards.

## The two stages

Read the workspace's planning playbook, at the `playbook` binding if it declares one, before
the first use. In short:

Stage 1, budget. Each epic is given `budget_points`, allocated down from each person's
enabler capacity split across the epics they work on. Set before stories exist. The epic
knows what it may spend, not what it will produce.

Stage 2, elaboration. The epic names its deliverables, each takes its points from its type in
the register, and those roll up into `planned_points`. The epic now knows what it intends to
produce and what that is worth.

The epic is the only place the two meet. They are compared, not reconciled. Planned above
budget is a scoping decision, never a request for more capacity: time and cost are fixed and
scope varies. An epic with no `budget_points` has been allocated no capacity, so its products
are deferred and cannot load anyone's quarter.

## Arguments

| Argument | What it does |
|---|---|
| none, or `status` | Budget against planned per epic, load against capacity per person, and what currently fails |
| `frame EP-NNN` | Frame one epic: lane, criterion, rung movement, products |
| `size EP-NNN` | Name or revise the products on one epic and set its budget |
| `budget` | Report the top-level budget and the ladder it comes down, and stop. Read only |
| `validate` | Validate the whole chain: period, resources, quarter budget, epic budgets, elaboration, load, approval, framing, and the close once recorded. Read only |
| `cards` | Regenerate the epic cards and the stage grid, then check them. Needs `cardsDir` |
| `links` | Point the epic and story links in the quarter's documents at each record's page. Needs `siteUrl` |
| `close` | Record what each flow reached and what each product took, then read section 9 |
| `approve <record> <stage>` | Move a WorkPlan, an epic or a product to an approval stage, then validate. Only on the user's say-so |
| `check` | Run the checks and interpret the output |
| `reconcile` | Regenerate the derived views, then align the plan documents to them |

## Report the budget

```bash
python <skills>/quarter-planning/bin/quarter.py --quarter <slug> --budget
```

A workspace usually wraps that in a script of its own, so the command people type is short.
`--where` prints the inputs the binding resolves to, and reads none of them, which is the
first thing to run when a figure comes from a file you did not expect. `python bin/check.py`,
run from the workspace root, is the post-install check: it confirms the binding declares the
six required paths and that every declared path resolves, without naming a quarter.

One question answered: what may this quarter spend, and which input produced each step of that
figure. Every line names its source, so a figure that looks wrong is argued with at the step
that made it. It ends with the per-epic split and a confirmation that the three totals the
planning basis declares match what the registers derive, or the errors if they do not.

Use this for the conversation about whether the quarter can hold the work. Use `validate` when
something has moved and you need to know what disagrees.

## Validate the budget

```bash
python <skills>/quarter-planning/bin/quarter.py --quarter <slug>
```

One report in ten sections, read top down, because that is the only direction the arithmetic
runs: period, resources, quarter budget and epic budgets (1 to 4), elaboration and load (5 and
6), approval, framing, the close once recorded, and feature requests when `requests` is bound.
Sections 1 to 4 are integrity, and a disagreement there fails the run. Sections 5 and 6 are
subscription: over is a scoping decision, not a defect, so they report and the run still
passes, except that section 5 fails on a broken register rule. Section 7 fails on an approval
the records beneath it do not support, section 8 on a rung the ladder does not name or a
movement down it. Warnings never fail the run. What each section answers, and exactly what
fails, is in [references/validation-report.md](references/validation-report.md).

`--apply` writes the derived `budget_points` onto the epics when the distribution has moved
and the recorded budgets are behind it, taking a `.bak` first and keeping every comment. It
does not write an epic read from a `progress.yaml`; set it there by hand. Compose the roadmap
and regenerate the views afterwards. How it patches the file is in
[references/validation-report.md](references/validation-report.md).

The arithmetic lives in `src/capacity.py` and nowhere else. Anything that needs a person's
capacity imports it rather than recomputing it.

What has to be in place before the report means anything:

- A `WorkPlan` record for the quarter, `plan_type: quarterly`, carrying `quarter`, the dates
  and the committed `work_item_ids`. Without it nothing in the model states which epics the
  quarter committed to.
- `enabler_capacity_points`, `quarter_budget_points` and `unallocated_capacity_points` declared
  in the planning basis. They are checked against the registers, not trusted.
- `leave_working_days` on each person's rows in the resourcing register. Leave is stated in
  working days and the points deduction is derived, so the two cannot drift.

## Approval stages

A plan is approved in stages, `draft`, `sized`, `validated` and `approved`, and each stage is
recorded on the model record it approves, in an `approval` field, never in a register or a
document. `approved` is commitment. The quarterly `WorkPlan` records it for the budget and
resourcing, the `WorkItem` for the epic, and each entry in `deliverables` for a product.
Section 7 fails an epic that runs ahead of its least advanced product, an `approved` epic
under a `WorkPlan` that is not, and an epic past `draft` that names no product. When the
resourcing or the distribution changes after the `WorkPlan` is approved, set it back to
`validated` and approve it again.

Read [references/approval-stages.md](references/approval-stages.md) before `approve`: what
each stage means at each level, the rules section 7 enforces, and `approvalStages` for a
workspace with its own stage names.

## The definition ladder and framing

The unit of progress is a rung on the workspace's definition ladder, bound as `ladder`: a CSV
of `rung`, `name` and `description`, least defined first. The skill ships no ladder. Framing
lives on the epic record as `lane`, `flows` (each with `rung_from` and `rung_to`),
`advances_criterion_ids` and `home`, and section 8 joins it to the register's `rung` column.
The fields, and what fails the run and what only warns, are in
[references/framing.md](references/framing.md).

## Epic folder and epic card

An epic has two faces, kept apart on purpose. Its folder, `<epicsDir>/<home>/`, is written by
hand, lives for the epic's whole life, and holds the framing, scope decisions, dependencies,
what was left out and discovery. Its card, `<cardsDir>/<id>.md`, is generated by `--cards`
for one quarter and holds every figure about the epic and no prose that was not generated,
so it cannot drift from the model. Never edit a card. Change the model or the folder, then
regenerate.

```bash
python <skills>/quarter-planning/bin/quarter.py --quarter <slug> --cards
python <skills>/quarter-planning/bin/quarter.py --quarter <slug> --cards --check
```

The first writes one `<id>.md` per committed epic and a `README.md` holding the stage grid and
the epics table. The second writes nothing and exits non-zero if any file is stale, so it can
sit beside a workspace's other checks. What a card holds, and the recommended outline of an
epic folder's index page, are in [references/epic-cards.md](references/epic-cards.md).

## Feature requests, products and stories

With `requests` bound, the skill tracks the demand an epic answers. Consumers use products
that platform teams offer. When a product cannot yet meet a need, the consumer raises a
feature request against it, and the team ranks it. A request that needs a platform build is
taken on by an epic: the register's `epic` column records which. The epic is the SAFe
feature and carries the size through its deliverables; the request adds no points. Stories
are assigned separately, later: each story that builds part of a request cites it in
`request_ids`.

```bash
python <skills>/quarter-planning/bin/quarter.py --quarter <slug> --backlog
```

prints each product's requests ranked by WSJF, with the epic and the stories for each. The
register contracts, the checks and the card sections are in
[references/feature-requests.md](references/feature-requests.md).

## Links to epic and story pages

The plan documents link every epic and story to its page on the published site, as Markdown
reference links whose definitions sit at each document's foot. Each record carries its own
`site_route`, and the workspace binds `siteUrl`.

```bash
python <skills>/quarter-planning/bin/quarter.py --quarter <slug> --links
python <skills>/quarter-planning/bin/quarter.py --quarter <slug> --links --check
```

The first rewrites only the definitions whose label is an epic id, a story id or, with
`externalRefSystem` bound, an epic's tracker key. The second writes nothing and exits
non-zero if any definition is behind the model. The link form, where routes come from and
how other generators resolve them the same way are in
[references/links.md](references/links.md).

## Epics from work-item folders

A workspace that keeps an epic in `<work items>/WI-NNN/progress.yaml`, one folder per work
item, binds `workItemsDir`, and the skill reads each `progress.yaml` with
`work_item_level: epic` and the quarter's `planning_period` as an epic, beside
`work_item.yaml`. Where both hold the same id, `work_item.yaml` wins and the clash is a
warning. The field mapping is in
[references/work-item-folders.md](references/work-item-folders.md).

## Close the quarter

At the quarter's end, record what happened on the model records:

- `rung_reached` on each flow, from the evidence that exists, never from the effort spent.
- `actual_points` on each product, what it actually took.

Once any is recorded, the validation adds section 9: each flow committed against reached
(reached, short or beyond), each product planned against actual, and per register type the
mean ratio of actual to base points. That ratio is a hint for recalibrating the register, not
a correction to it: change a type's base points deliberately, in the register, with the
reasoning. Section 9 is read only. Carry anything unfinished into the next quarter as its
starting rung.

## Status

1. The workspace's `commands.check`, and read the assignment block it prints first.
2. For each committed epic, report `budget_points` against the sum of its products.
3. Report each person's load against capacity from the derived capacity-load view.
4. State the gap in points, and which epics carry it. Do not propose the cut.

An epic with no `budget_points` is deferred. Say so rather than reporting it as over.

## Frame an epic

Follow the workspace's governing planning method, at the `playbook` binding where one is
declared. That method governs and this skill only carries the mechanics. Establish, in this
order:

1. The capability area and the named flows the epic advances. One lane per epic.
2. The `Criterion` ids it advances, as `advances_criterion_ids`. This is the join between
   ends and means.
3. The rung movement on the Definition Ladder, from and to, per flow.
4. What will be true at the end of the quarter that is not true now. If the value statement
   is circular, the epic is unframed.
5. The products that make it true, from the register.

Record 1 to 3 on the epic's model record, as `lane`, `advances_criterion_ids` and `flows`,
so section 8 can check them as [references/framing.md](references/framing.md) describes.
Write 4, and the reasoning behind all of it, in the epic's own
folder under `epicsDir`, following the outline in
[references/epic-cards.md](references/epic-cards.md). The card then carries the figures and
the folder carries the argument.

Two things a framing must surface, because they are the ones usually missed: a flow at a low
rung that the outcome statement does not mention, and a two-sided shape where a provider and
a consumer are joined by a contract.

## Name products on an epic

Each entry on `WorkItem.deliverables` carries `id` as `EP-NNN-DN`, `deliverable_id` from the
register, a `name` for the instance, `why_needed`, `owner_stakeholder_id`, `quality_criteria`
for that instance only, and `state`.

Rules that section 5 enforces, so check them before writing:

- The type must be in the register, and where the register has a `used` column, marked
  `Yes`. A retired type fails the run. Retired ids are not reissued, so an id absent from the
  register is not a typo to fix by inventing one.
- `points` omitted means the type's base points, not zero. Set it only to override.
- Any explicit `points` needs a `points_override_reason`, and the check fails without one.
- A product already produced carries `points: 0` with the reason, so it is recorded without
  consuming capacity.
- A product no story produces warns rather than fails. That is deliberate: some products are
  authored elsewhere and architecture's condition is receipt.

## Regenerate and check

```bash
<commands.regenerate>    # rebuilds the derived views from the model
<commands.check>         # fails on any prose that disagrees with them
```

Then reconcile the quarter's plan documents, whatever the workspace keeps under the
`quarterDir` binding, to the regenerated views. Where a sentence asserts something the new
figures contradict, rewrite the sentence rather than swapping the number. "The team is full
and the reserve is gone" is a claim, not a figure.

## Interpreting the check

Every message the validation and the workspace's checks print, what it means and what to do,
is in [references/check-messages.md](references/check-messages.md). Read it before acting on
a failure. Two rules cover most of it: over-subscription is a scoping decision, never a
tooling fix, and prose that disagrees with a derived view is fixed in the prose, never the
view.

## Failure modes, learned the hard way

Never edit `work_item.yaml` by text range: parse, edit the structure, serialise. A block
delete that runs past a record boundary silently removes whole work items, and `roadmap.yaml`
holds the composed copy to recover from. Back up the derived views before regenerating,
because they are untracked. Null is not zero: a deliverable with no `points` takes its type's
base points. These and the rest, with why each matters, are in
[references/failure-modes.md](references/failure-modes.md).

## What this skill does not do

It does not decide scope cuts, which are the user's. It does not edit the ontology schema,
which is governed and needs asking first. It does not regenerate hand-authored diagrams. It
carries no copy of the repository's scripts and does not reimplement their arithmetic: if a
figure is wrong, fix the script that derives it.

## Related

- The workspace's planning playbook, at the `playbook` binding, which governs the method
- The deliverable register, at the `register` binding: product types, sizes, and the used-only rule
- References, each read when its topic comes up: [budget-model.md](references/budget-model.md),
  [validation-report.md](references/validation-report.md),
  [check-messages.md](references/check-messages.md),
  [approval-stages.md](references/approval-stages.md), [framing.md](references/framing.md),
  [epic-cards.md](references/epic-cards.md), [links.md](references/links.md),
  [feature-requests.md](references/feature-requests.md),
  [work-item-folders.md](references/work-item-folders.md),
  [optional-bindings.md](references/optional-bindings.md),
  [data-contract.md](references/data-contract.md) and
  [failure-modes.md](references/failure-modes.md)
- `aaw-start-work`, from AI-Assisted Work, for opening a work item where a workspace uses it; this skill plans the quarter those work items sit in
