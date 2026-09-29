<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# The validation report

What `quarter.py --quarter <slug>` prints, section by section, and which sections fail the run.

## Sections

One report, read top down, because that is the only direction the arithmetic runs.

| Section | Answers |
|---|---|
| 1 Period | How many working days the quarter has once public holidays and any shutdown come out, and what a person at 100 percent is therefore worth |
| 2 Resources | Who is on the quarter, at what allocation, less their own leave, less any dedication outside enabler work. Ends at the quarter's capacity |
| 3 Quarter budget | How much of that capacity has been distributed, and how much is still held |
| 4 Epic budgets | Each epic's budget derived from the distribution, against what the epic records, and who it comes from |
| 5 Elaboration | Named products against the budget each epic was given |
| 6 Load | Each person's owned products against the capacity they brought |
| 7 Approval | How far the plan, each committed epic and each of its products have been approved, and what is ready for approval |
| 8 Framing | Each committed epic's lane and flows, and whether its products evidence the rungs it commits to |
| 9 Close | Committed against reached per flow, planned against actual per product, and a recalibration hint per type. Only once recorded |
| 10 Feature requests | The request register's rules, and the requests each committed epic takes on: ready, scored and cited by stories. Only with `requests` bound |

## What fails the run

Sections 1 to 4 are integrity. A disagreement there means the model contradicts itself and the
run exits non-zero, because nothing below it means anything until it is fixed. Sections 5 and
6 are subscription: over is a scoping decision, not a defect, so they report and the run still
passes. Positive is under, negative is over, in both. Section 5 also enforces the register
rules, which are integrity: a product whose type is not in the register, a type the register
does not mark used, or an explicit `points` with no `points_override_reason` fails the run.
Section 7 is integrity again, but only for claims: an approval the records beneath it do not
support fails the run. Section 8 fails only on a rung the ladder does not name or a movement
down it, and warns on the rest. Warnings are printed where they arise and never fail the run.

## Writing the derived budgets

`--apply` writes the derived `budget_points` onto the epics when the distribution has moved
and the recorded budgets are behind it. It takes a `.bak` first and replaces only that one
value on that one line, or inserts the line after the record's id where the record has none.
Any id works, not only `EP-NNN`. It patches text rather than round-tripping the YAML, which
would drop every comment in the file. An epic read from a work item's `progress.yaml` is not
written, because that file is versioned by its own protocol; set it there by hand. Compose
the roadmap and regenerate the views afterwards.

## Where the arithmetic lives

The arithmetic lives in `src/capacity.py` and nowhere else. Anything else that needs to know
what a person's capacity is imports it rather than recomputing, because three tools once
derived it three ways and disagreed by a tenth of a point: small enough that nothing looked
wrong, large enough to fail an equality check.
