<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Troubleshooting

Every message `bin/check.py` and `bin/quarter.py` print, word for word, with what it means and what to do. The scripts emit no rule ids; search this page for a fragment of the message. In the messages, `X` is an epic or work item id, `D` a product id, `N` and `M` figures, and `<file>` a path.

The first thing to run when a file is not where you expect is:

```bash
python <skills>/quarter-planning/bin/quarter.py --quarter <slug> --where
```

It prints every binding and the path it resolves to, reading none of them.

## Setting up: `bin/check.py`

| Message | Means | Do |
|---|---|---|
| `Python 3.x is too old: quarter-planning needs 3.11 or newer to read skill-bindings.toml.` | The Python on the path predates `tomllib` | Install Python 3.11 or newer, or run the script with that interpreter |
| `PyYAML is not installed for this Python. Run: python -m pip install pyyaml` | PyYAML is missing for the interpreter that ran the check | Run the command it gives, with the same `python` |
| `no .agents/skill-bindings.toml at or above <dir>. Create it with a [suite.quarter-planning] section ...` | No bindings file in the working directory or any folder above it | Run from inside the workspace, or create the file as the [quick start](quick-start.md#4-bind-the-workspace) does |
| `<file>: not valid TOML (...). Fix the file.` | The bindings file does not parse | See [Not valid TOML](#not-valid-toml) |
| `<file>: [suite.quarter-planning] does not declare sources, register, ... Add each as a path; none has a default.` | Required keys are missing | Declare each one. [Configuration](configuration.md#required-keys) lists them |
| `... <key> = "<value>" resolves to <path>, which does not exist. Create it, or correct <key>.` | The path is wrong, usually relative to the wrong folder | Paths resolve against the bindings file's folder, so from `.agents/skill-bindings.toml` they start with `../` |
| `... <key> = "<value>": the folder in front of {quarter}, <path>, does not exist.` | The part of a `{quarter}` path before the placeholder is missing | Create the folder, or correct the key |
| `warning: ... cardsDir ... and its parent do not exist yet; --cards creates it.` | Nothing is wrong; cards have not been generated yet | Nothing |
| `warning: ... does not declare slugPattern, so the fiscal-year default ... is in use.` | Slugs must look like `fy30-q1` | Declare `slugPattern` and `quarterLabel` if your quarters are named otherwise |
| `... slugPattern '...' is not a valid regular expression (...). Write it as a TOML literal string, in single quotes.` | Usually a backslash lost to a double-quoted TOML string | Use single quotes: `slugPattern = '^(?P<y>\d{4})-q(?P<q>[1-4])$'` |
| `... quarterLabel '...' uses <field>, which slugPattern does not capture as a named group.` | The label names a group the pattern lacks | Make the `{field}` names in `quarterLabel` match the `(?P<field>...)` groups |
| `... approvalStages is empty.` | `approvalStages` is set to nothing | Name the stages, least advanced first, or remove the key |
| `... tolerance '...' is not a number.` | `tolerance` does not parse as a number | Use a number such as `0.05` |
| `usage: check.py   (run from the workspace root; takes no arguments)` | An argument was passed | Run it with none |

### Not valid TOML

`tomllib.TOMLDecodeError: Invalid statement (at line 1, column 1)` from `quarter.py`, or `not valid TOML (Invalid statement (at line 1, column 1))` from `check.py`, almost always means the file starts with a byte order mark. Windows PowerShell 5.1 writes one with `Out-File -Encoding utf8` and with `>`, which writes UTF-16. Write the file with `Set-Content -Encoding ascii`, or save it as UTF-8 without BOM in your editor. Other positions point at a real TOML error on that line.

## Starting a run: `bin/quarter.py`

| Message | Means | Do |
|---|---|---|
| `quarter-planning: this workspace has not said where its registers are. Declare <keys> in [suite.quarter-planning] of <file>. There is no default: ...` | Required keys are missing, or no bindings file was found (then `<file>` reads `.agents/skill-bindings.toml`) | Declare them. Run from inside the workspace, or pass `--workspace` |
| `quarter-planning: <keys> not found for <slug>. ...` followed by each key and path | A bound path does not exist for this quarter | Often the wrong slug: `{quarter}` became a folder that does not exist. Check with `--where` |
| `no planning folder for <slug>` | `quarterDir` exists but is not a folder | Point `quarterDir` at the quarter's folder |
| `quarter.py: error: --check applies to --cards or --links` | `--check` on its own | Add `--cards` or `--links` |
| `quarter.py: error: run --cards and --links separately` | Both given at once | Run two commands |
| `quarter-planning: --cards needs to know where the cards go. Declare cardsDir ...` | `--cards` without `cardsDir` | Bind `cardsDir` |
| `quarter-planning: --links needs the site the pages are published on. Declare siteUrl ...` | `--links` without `siteUrl` | Bind `siteUrl` |
| `quarter-planning: --backlog reads the feature-request register. Declare requests ...` | `--backlog` without `requests` | Bind `requests` |
| `FileNotFoundError: ... work_plan.yaml` or `... work_item.yaml` | The `sources` folder exists but lacks a required model file | Create it; an empty `work_plan: []` is enough to start |
| `KeyError: 'usable_fraction'` or another basis parameter | The planning basis lacks a parameter the arithmetic needs | Add the row. `working_days`, `usable_fraction` and `person_days_per_point` are always needed |
| `ERROR no WorkPlan record carries quarter None, ...` | The slug does not match `slugPattern`, so there is no label | Use a slug the pattern accepts, or fix the pattern. `--where` shows `label None` |
| `ERROR no WorkPlan record carries quarter <label>, so nothing in the model states which epics the quarter committed to` | No `work_plan` record with `plan_type: quarterly` and this `quarter` | Add one, with `work_item_ids` |

## The validation

Errors are printed at the end of the report, each starting `ERROR`, and fail the run. Warnings start `WARNING`, appear where they arise, and never fail it. Over or under budget and over or under load are reported in sections 5 and 6 but are not errors.

### Sections 1 to 4: integrity

| Message | Do |
|---|---|
| `the calendar totals N working days but the basis declares M` | Make the basis's `working_days` equal the sum of the calendar's |
| `points_at_full_allocation is N but the basis derives M from working days, usable fraction and person-days per point` | Set it to `working_days x usable_fraction / person_days_per_point` |
| `<name>: the register records gross capacity N, but a P percent allocation of M points gives G` | Correct `gross_capacity_points` in the resourcing register |
| `<name>: the register records an adjustment of N points, but L working days of leave at P percent allocation gives A` | Correct `adjustment_points`; leave is stated in days and the points follow |
| `<name>: the register records net capacity N, but gross less leave gives M` | Correct `capacity_points` |
| `<name> carries leave with no reason recorded` | Fill `adjustment_reason` |
| `<name>'s shares of allocation total N percent, not 100, so part of the allocation is unaccounted for` | Make that person's `share_of_allocation_pct` rows total 100 |
| `the basis declares no enabler_capacity_points, ...` (or `quarter_budget_points`) | Add the declared total to the basis |
| `the basis declares enabler_capacity_points N but the resourcing register derives M` | Correct the declaration, or the resourcing, whichever is wrong |
| `the basis declares quarter_budget_points N but the distribution in the resourcing register gives M` | As above |
| `the basis declares unallocated_capacity_points N but the register leaves M undistributed` | As above. Capacity given to a work item the model does not hold counts as unallocated |
| `the epic budgets total N against M of capacity, so more has been given out than the quarter holds` | Reduce the shares given to epics |
| `X is given N points by the distribution but records no budget_points` | Run with `--apply`, or set `budget_points` by hand |
| `X records budget_points N but the distribution gives M` | Run with `--apply` if the resourcing is right; otherwise fix the resourcing |
| `X carries a budget but the quarter's WorkPlan does not name it` | Add it to the WorkPlan's `work_item_ids`, or stop giving it capacity |
| `the WorkPlan names X but the resourcing register distributes nothing to it` | Give it a share in the resourcing, or remove it from the WorkPlan |
| `X records budget_points N but no allocation in the resourcing register produces it` | Remove the figure, or add the allocation |

When sections 1 to 4 fail, the report ends `Re-run with --apply to write the derived budget_points onto the epics.` only if `--apply` would fix something.

### Section 5 and 6: register rules and load

| Message | Do |
|---|---|
| `X records planned_points N but its products sum to M` | Set `planned_points` to the sum, or remove it and let the products speak |
| `D on X names no type from the register, so it has no size` | Set `deliverable_id` |
| `D on X is typed T, which is not in the register. Retired ids are not reissued, so pick a type the register holds` | Retype it. Never invent an id |
| `D on X is typed T, which the register marks used No. Only types in use are planned against` | Retype it from a type in use |
| `D on X overrides its type sizing with N points but records no reason` | Add `points_override_reason` |
| `<id> owns N points of products but is not in the capacity register` | Correct `owner_stakeholder_id`, or add the person to the resourcing |

`OVER by N points, P percent of the budget.` is not an error: time and cost are fixed, so it is a scope decision. `Deferred, naming products but given no budget, so loading nobody: ...` lists epics with products and no `budget_points`.

### Section 7: approval

| Message | Do |
|---|---|
| `X records approval 'V', which is not one of <stages>` | Fix the value, or declare the stage in `approvalStages` |
| `X is recorded S but names no products, so there is nothing for that stage to rest on` | Name products, or set the epic back to the first stage |
| `X is recorded S but its product D is only T. An epic cannot be further on than its least advanced product` | Bring the product up, or the epic back |
| `X is recorded approved, which is commitment, but the quarter budget and resourcing are S. ...` | Approve the WorkPlan first, or set the epic back |

`The quarter budget is recorded approved, but levels 1 to 4 no longer agree, so what was approved has moved.` Fix sections 1 to 4, then set the WorkPlan back to the stage before approval and approve it again.

### Section 8 and 9: framing and close (with a ladder bound)

| Message | Do |
|---|---|
| `X flow F records no rung_from` (or `rung_to`) | Record both rungs |
| `X flow F records rung_to R, which the ladder does not name. It names ...` | Use a rung the ladder names, or add it to the ladder |
| `X flow F moves down the ladder, from A to B. ...` | Fix the rungs. A rung lost is recorded at close, not planned |
| `X flow F records rung_reached R, which the ladder does not name` | Use a rung the ladder names |
| `WARNING X records no lane, so the capability area it advances is unstated` | Set `lane` |
| `WARNING X commits a flow to R but names no product whose type evidences R, ...` | Name a product of a type whose register `rung` is R, or lower the commitment |

`Names no flows:` and `Advances no recorded criterion:` are reported, not failed.

### Section 10: feature requests (with `requests` bound)

| Message | Do |
|---|---|
| `<req> has status S, which is not one of ...` | Use a status from `requestStatuses`, or declare it |
| `<req> scores <factor> V, which is not on the scale 1, 2, 3, 5, 8, 13, 20` | Rescore on the scale |
| `<req> names no product. A request is always raised against one` | Fill `product` |
| `<req> is raised against P, which the product register does not hold` | Fix the id, or register the product |
| `<req> is assigned to X, which the planning model does not hold` | Fix the `epic` column |
| `WARNING <req> is S but has no WSJF score, so it cannot be ranked` | Score `value`, `time_criticality`, `risk_reduction` and `job_size` |
| `WARNING <req> is cited by <stories> but the request register does not hold it` | Fix the story's `request_ids`, or add the request |
| `WARNING <req> is assigned to X but is S, so it is not ready to build` | Move it past the first status, or unassign it |

### Epics from work-item folders

| Message | Do |
|---|---|
| `WARNING X is recorded in both work_item.yaml and <path>. The work_item.yaml record is used and the work item is ignored` | Remove one of the two records |
| `X is read from <path>, which --apply does not write because a work item is versioned by its own protocol. Set budget_points there by hand` | Set it by hand in that `progress.yaml` |
| `X has no record in work_item.yaml to write to; add one by hand` | Add the epic to `work_item.yaml` |

## Cards and links

| Message | Means | Do |
|---|---|---|
| `Stale epic cards for <label>. Regenerate with <command>:` then the files | A card no longer matches the model (exit 1) | Run `--cards` and commit the result. Never edit a card |
| `Epic cards for <label> are current.` | Nothing to do | |
| `Links behind the model for <label>. Regenerate with <command>:` then the files | A link definition does not point at its record's page (exit 1) | Run `--links` |
| `WARNING X is linked but has no site_route in the model, so it is left as it is` | A document links a record that does not say where it is published | Set `site_route` on the record |
| `Pointed the links in N document(s) for <label> at <root>.` | `--links` rewrote those files | Review and commit |

## Messages from a workspace's own checks

Some messages in the skill's [check-messages.md](../skills/quarter-planning/references/check-messages.md) come from a workspace's own `commands.check`, not from these scripts, and are marked there. Their wording is the workspace's.

## Contributors: CI

| Failure | Do |
|---|---|
| `FAIL skills/<name>/SKILL.md: N lines, about T body tokens` | Move detail into a file under `references/` and link it; the limits are 500 lines and about 5,000 tokens |
| `<name>: SKILL.md A, marketplace.json B` in the versions job | Raise `metadata.version`, the marketplace entry and `bundle.json` together |
| `skills-ref` reports a problem reading `SKILL.md` on Windows | Set `PYTHONUTF8=1` |
| REUSE compliance fails | A new code file needs an SPDX header; see [CONTRIBUTING](../CONTRIBUTING.md#licensing-of-contributions) |
