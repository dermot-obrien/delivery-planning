<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Command reference

Every script in this repository, with every flag, checked against each script's `--help`. `<skills>` stands for the folder the skill is installed in, such as `.agents/skills`. Run the skill's scripts from anywhere inside the workspace; they find the bindings file by walking up from the working directory.

## What you ask the agent

An agent that has loaded `quarter-planning` accepts these requests, and runs the scripts below to answer them. They are listed in the skill's [`SKILL.md`](../skills/quarter-planning/SKILL.md#arguments).

| Request | What the agent does |
|---|---|
| none, or `status` | Budget against planned per epic, load against capacity per person, and what currently fails |
| `frame EP-NNN` | Frames one epic: lane, criterion, rung movement, products |
| `size EP-NNN` | Names or revises the products on one epic and sets its budget |
| `budget` | Reports the top-level budget and the ladder it comes down. Read only |
| `validate` | Validates the whole chain. Read only |
| `cards` | Regenerates the epic cards and the stage grid, then checks them. Needs `cardsDir` |
| `links` | Points the epic and story links in the quarter's documents at each record's page. Needs `siteUrl` |
| `close` | Records what each flow reached and what each product took, then reads section 9 |
| `approve <record> <stage>` | Moves a WorkPlan, an epic or a product to an approval stage, then validates. Only on your say-so |
| `check` | Runs the checks and interprets the output |
| `reconcile` | Regenerates the derived views, then aligns the plan documents to them |

## `bin/quarter.py`

```text
python <skills>/quarter-planning/bin/quarter.py --quarter QUARTER [--workspace WORKSPACE]
       [--where] [--budget] [--apply] [--cards] [--links] [--check] [--backlog]
```

| Flag | Help text | Notes |
|---|---|---|
| `-h`, `--help` | show this help message and exit | |
| `--quarter QUARTER` | quarter slug, e.g. fy30-q1; the form is set by slugPattern | Required. Fills `{quarter}` in path bindings |
| `--workspace WORKSPACE` | where to start looking for .agents/skill-bindings.toml | Defaults to the working directory |
| `--where` | print the resolved inputs and stop, without reading any of them | Runs even when keys are undeclared or paths missing, so it is the first thing to run when something is not found |
| `--budget` | print only the top-level budget and the ladder it comes down | Read only |
| `--apply` | write the derived budget_points onto the epics in work_item.yaml | Runs the validation, then patches `work_item.yaml` in place after copying it to `work_item.yaml.bak`. Keeps comments. Does not write epics read from a `progress.yaml` |
| `--cards` | write the epic cards and the stage grid to the cardsDir binding | Needs `cardsDir` |
| `--links` | point the epic and story links in the quarter folder documents at each record page: siteUrl plus the record site_route | Needs `siteUrl`. Rewrites the `*.md` files under `quarterDir`, subfolders included, except hidden and `_` folders, `dist`, `build` and `node_modules` |
| `--check` | with --cards or --links, write nothing and exit non-zero if stale | Only with `--cards` or `--links` |
| `--backlog` | print each product's feature requests ranked by WSJF, with their epic and stories, and stop. Needs the requests binding | Reads nothing about capacity |

With no action flag, it prints the validation, sections 1 to 10 as they apply.

Which flag wins, when several are given: `--where`, then `--backlog`, then `--cards`, then `--links`, then `--budget`, then the validation (with `--apply` if given). `--cards` and `--links` together is refused, as is `--check` without either.

Exit codes:

| Code | Means |
|---|---|
| 0 | Passed. Warnings may have been printed. For `--apply`, the budgets were written or nothing needed writing |
| 1 | The validation or `--budget` found errors, or `--cards --check` or `--links --check` found stale files |
| 2 | A usage error, an undeclared required key, a bound path that does not exist, no quarter folder, or an action whose binding is not declared |

Examples:

```bash
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --where
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --budget
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --apply
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --cards --check
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --links
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --backlog
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --workspace ../my-plan
```

## `bin/check.py`

The post-install check, as DD-11 of AI-Assisted Work defines one. Run it from the workspace root after installing, and after changing the bindings.

```text
python <skills>/quarter-planning/bin/check.py
python <skills>/quarter-planning/bin/check.py --help
```

It takes no other arguments. It checks Python 3.11 or newer, PyYAML, and `[suite.quarter-planning]`: the six required paths declared, every declared path resolving (up to `{quarter}`), `slugPattern` compiling and capturing every field `quarterLabel` uses, `approvalStages` not empty and `tolerance` a number. It opens no register and needs no quarter.

| Code | Means |
|---|---|
| 0 | `quarter-planning: ok`, possibly after lines starting `warning:` |
| 1 | One line per problem |
| 2 | Python older than 3.11, or an argument it does not take |

`SKILL_DIR` sets the skill's folder when the script is run from somewhere unusual; see [Configuration](configuration.md#environment).

## Repository scripts

For contributors, run from the repository root. CI runs all of them.

| Command | What it does |
|---|---|
| `python -m unittest discover -s skills/quarter-planning/tests` | The skill's tests: each copies [`tests/fixture/`](../skills/quarter-planning/tests/fixture), changes one thing and runs the scripts |
| `node scripts/validate-skills.mjs [skillsRoot]` | Checks every `<skillsRoot>/<name>/SKILL.md` against the Agent Skills specification, and that relative links resolve. `skillsRoot` defaults to `./skills`. It has no `--help`: any argument is read as the folder |
| `node scripts/validate-bundle.mjs [bundleDir ...]` | Validates `bundle.json` against the bundle schema and the skills it names |
| `node scripts/validate-bundle.mjs --instance <file.json> --schema <$id or file>[#pointer]` | Validates one JSON file against a schema, or one definition in it |
| `node scripts/validate-bundle.mjs --run-checks <workspace> [--skills <dir>] [bundleDir]` | Runs each skill's post-install check in `<workspace>`, as an installer would |
| `node scripts/validate-bundle.mjs ... --schemas <dir>` | In any form, loads more schemas by `$id`. Repeatable |
| `node scripts/validate-bundle.mjs --help` | Prints the usage above |
| `python scripts/test_ontology.py` | Validates `ontology/delivery.schema.json` against every file of the test fixture, and against cases it must refuse. Takes no arguments |
| `skills-ref validate skills/quarter-planning` | The specification's reference validator. Install it as the [README](../README.md#agent-skills-conformance) says; on Windows set `PYTHONUTF8=1` first |

CI also checks that each `SKILL.md` is at most 500 lines and about 5,000 body tokens, that each skill's version agrees with `.claude-plugin/marketplace.json`, and REUSE compliance. See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
