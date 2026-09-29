<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Quick start

From nothing to a validated quarter plan, with a budget derived from a calendar and two people, two epics sized from a register, and a generated epic card. It takes about ten minutes. Every command below has been run as written on Windows, in PowerShell 5.1 and in Git Bash; the bash commands also work on macOS and Linux.

Where the two shells differ, both are given. Where only one block is shown, it works in both.

## 1. Check the prerequisites

You need Python 3.11 or newer, PyYAML and Git.

```bash
python --version
python -m pip install pyyaml
```

You should see `Python 3.11` or later, and pip reporting PyYAML installed or already satisfied. On macOS and Linux, if `python` is not found, use `python3` in every command on this page.

## 2. Get the skill and make a workspace

Clone this repository beside a new, empty workspace called `my-plan`, and copy the skill into the workspace's `.agents/skills/` folder, which most agents read. [Install](../README.md#install) lists the folder each agent reads, and other ways to install.

bash:

```bash
git clone --depth 1 https://github.com/dermot-obrien/delivery-planning.git
mkdir my-plan
cd my-plan
mkdir -p .agents/skills registers planning/model planning/2027-q1
cp -r ../delivery-planning/skills/quarter-planning .agents/skills/
```

PowerShell:

```powershell
git clone --depth 1 https://github.com/dermot-obrien/delivery-planning.git
New-Item -ItemType Directory my-plan | Out-Null
Set-Location my-plan
New-Item -ItemType Directory -Force .agents\skills, registers, planning\model, planning\2027-q1 | Out-Null
Copy-Item -Recurse ..\delivery-planning\skills\quarter-planning .agents\skills\
```

You should now have `my-plan/.agents/skills/quarter-planning/SKILL.md`. Stay in `my-plan` for the rest of this guide.

## 3. Write the example inputs

A quarter is planned from six inputs. This example is as small as they come: one twelve-week quarter, two people, two epics and two product types. [Concepts](concepts.md) explains each file; [the data contract](../skills/quarter-planning/references/data-contract.md) lists every column and field.

bash:

```bash
cat > registers/deliverable-types.csv <<'EOF'
id,name,rung,base_story_points,used,description
pattern,Architecture pattern,,5,Yes,A pattern with its diagram and scenarios
decision,Decision record,,2,Yes,One settled question
EOF

cat > planning/2027-q1/calendar.csv <<'EOF'
period_id,type,start,end,working_days,note
2027-q1,quarter,2027-01-04,2027-03-26,60,Twelve full weeks
EOF

cat > planning/2027-q1/basis.csv <<'EOF'
parameter,value,unit,basis
working_days,60,days,From the calendar
usable_fraction,0.5,fraction,Half of each day reaches planned work
person_days_per_point,1,days,One point is one person-day
points_at_full_allocation,30,points,60 x 0.5 / 1
expected_absence_days_per_person,0,days,None assumed
enabler_capacity_points,45,points,Declared and checked
quarter_budget_points,45,points,Declared and checked
unallocated_capacity_points,0,points,Nothing held back
EOF

cat > planning/2027-q1/resourcing.csv <<'EOF'
stakeholder_id,name,role,allocation_pct,gross_capacity_points,leave_working_days,adjustment_points,capacity_points,work_item_id,share_of_allocation_pct,counts_against_enabler_capacity,adjustment_reason
ana,Ana,Architect,100,30,0,0,30,EP-001,100,yes,
ben,Ben,Engineer,50,15,0,0,15,EP-001,50,yes,
ben,Ben,Engineer,50,15,0,0,15,EP-002,50,yes,
EOF

cat > planning/model/work_plan.yaml <<'EOF'
work_plan:
- id: WP-2027-Q1
  name: 2027 Q1 plan
  plan_type: quarterly
  quarter: 2027-Q1
  planned_start: 2027-01-04
  planned_end: 2027-03-26
  status: planned
  owner: ana
  work_item_ids: [EP-001, EP-002]
EOF

cat > planning/model/work_item.yaml <<'EOF'
work_item:
- id: EP-001
  title: Self-service onboarding
  quarter: 2027-Q1
  lane: Onboarding
  deliverables:
  - id: EP-001-D1
    deliverable_id: pattern
    name: Onboarding pattern
    owner_stakeholder_id: ana
    state: planned
  - id: EP-001-D2
    deliverable_id: decision
    name: Identity provider decision
    owner_stakeholder_id: ben
    state: planned
- id: EP-002
  title: Usage reporting
  quarter: 2027-Q1
  lane: Reporting
  deliverables:
  - id: EP-002-D1
    deliverable_id: decision
    name: Reporting store decision
    owner_stakeholder_id: ben
    state: planned
EOF
```

PowerShell (`Set-Content -Encoding ascii` writes the files without a byte order mark, which the bindings file in step 4 must not have):

```powershell
@'
id,name,rung,base_story_points,used,description
pattern,Architecture pattern,,5,Yes,A pattern with its diagram and scenarios
decision,Decision record,,2,Yes,One settled question
'@ | Set-Content -Encoding ascii registers\deliverable-types.csv

@'
period_id,type,start,end,working_days,note
2027-q1,quarter,2027-01-04,2027-03-26,60,Twelve full weeks
'@ | Set-Content -Encoding ascii planning\2027-q1\calendar.csv

@'
parameter,value,unit,basis
working_days,60,days,From the calendar
usable_fraction,0.5,fraction,Half of each day reaches planned work
person_days_per_point,1,days,One point is one person-day
points_at_full_allocation,30,points,60 x 0.5 / 1
expected_absence_days_per_person,0,days,None assumed
enabler_capacity_points,45,points,Declared and checked
quarter_budget_points,45,points,Declared and checked
unallocated_capacity_points,0,points,Nothing held back
'@ | Set-Content -Encoding ascii planning\2027-q1\basis.csv

@'
stakeholder_id,name,role,allocation_pct,gross_capacity_points,leave_working_days,adjustment_points,capacity_points,work_item_id,share_of_allocation_pct,counts_against_enabler_capacity,adjustment_reason
ana,Ana,Architect,100,30,0,0,30,EP-001,100,yes,
ben,Ben,Engineer,50,15,0,0,15,EP-001,50,yes,
ben,Ben,Engineer,50,15,0,0,15,EP-002,50,yes,
'@ | Set-Content -Encoding ascii planning\2027-q1\resourcing.csv

@'
work_plan:
- id: WP-2027-Q1
  name: 2027 Q1 plan
  plan_type: quarterly
  quarter: 2027-Q1
  planned_start: 2027-01-04
  planned_end: 2027-03-26
  status: planned
  owner: ana
  work_item_ids: [EP-001, EP-002]
'@ | Set-Content -Encoding ascii planning\model\work_plan.yaml

@'
work_item:
- id: EP-001
  title: Self-service onboarding
  quarter: 2027-Q1
  lane: Onboarding
  deliverables:
  - id: EP-001-D1
    deliverable_id: pattern
    name: Onboarding pattern
    owner_stakeholder_id: ana
    state: planned
  - id: EP-001-D2
    deliverable_id: decision
    name: Identity provider decision
    owner_stakeholder_id: ben
    state: planned
- id: EP-002
  title: Usage reporting
  quarter: 2027-Q1
  lane: Reporting
  deliverables:
  - id: EP-002-D1
    deliverable_id: decision
    name: Reporting store decision
    owner_stakeholder_id: ben
    state: planned
'@ | Set-Content -Encoding ascii planning\model\work_item.yaml
```

What these say: the quarter has 60 working days, half of each reaches planned work, and a point is one person-day, so a person at 100 percent brings 30 points. Ana gives all of hers to EP-001; Ben, at 50 percent, splits his 15 points between the two epics. The epics name three products, sized from the register at 5, 2 and 2 points. Neither epic records a budget yet.

## 4. Bind the workspace

The skill has no default paths. It reads where each input lives from `[suite.quarter-planning]` in `.agents/skill-bindings.toml`, and every path is relative to that file's folder, `.agents/`. [Configuration](configuration.md) covers every key.

bash:

```bash
cat > .agents/skill-bindings.toml <<'EOF'
[suite.quarter-planning]
sources      = "../planning/model"
register     = "../registers/deliverable-types.csv"
basis        = "../planning/{quarter}/basis.csv"
calendar     = "../planning/{quarter}/calendar.csv"
resourcing   = "../planning/{quarter}/resourcing.csv"
quarterDir   = "../planning/{quarter}"
slugPattern  = '^(?P<y>\d{4})-q(?P<q>[1-4])$'
quarterLabel = "{y}-Q{q}"
EOF
```

PowerShell:

```powershell
@'
[suite.quarter-planning]
sources      = "../planning/model"
register     = "../registers/deliverable-types.csv"
basis        = "../planning/{quarter}/basis.csv"
calendar     = "../planning/{quarter}/calendar.csv"
resourcing   = "../planning/{quarter}/resourcing.csv"
quarterDir   = "../planning/{quarter}"
slugPattern  = '^(?P<y>\d{4})-q(?P<q>[1-4])$'
quarterLabel = "{y}-Q{q}"
'@ | Set-Content -Encoding ascii .agents\skill-bindings.toml
```

`{quarter}` is replaced by the quarter slug you pass on the command line, `2027-q1` here. `slugPattern` and `quarterLabel` turn that slug into `2027-Q1`, the label the model records in `quarter:`.

## 5. Run the post-install check

```bash
python .agents/skills/quarter-planning/bin/check.py
```

You should see:

```text
quarter-planning: ok
```

This confirms Python, PyYAML and the binding: all six required keys declared and every path resolving. It opens no register. If it prints anything else, [Troubleshooting](troubleshooting.md) has each message.

## 6. See what the skill will read

```bash
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --where
```

You should see each binding key with the absolute path it resolves to, the optional keys marked `not declared (optional)`, and at the end:

```text
    label        2027-Q1
    approval     draft > sized > validated > approved
```

## 7. Validate the quarter

```bash
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1
```

This prints the validation in numbered sections, from the period down to the framing. Section 2 shows Ana bringing 30.0 points and Ben 15.0, for 45.0 of enabler capacity, and section 4 shows what each epic should have been given. The run ends with two errors and exits with code 1:

```text
  ERROR EP-001 is given 37.5 points by the distribution but records no budget_points
  ERROR EP-002 is given 7.5 points by the distribution but records no budget_points

integrity: 2 errors. Levels 1 to 4 must agree before levels 5 and 6 mean anything, every product must be typed from the register, level 7 must claim no more than the records beneath it, and the framing must stay on the ladder.
Re-run with --apply to write the derived budget_points onto the epics.
```

That is stage 1 of planning not yet done: the resourcing gives each epic a budget, and the epics do not record it.

## 8. Write the derived budgets

```bash
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --apply
```

The report prints again, and ends:

```text
applied budget_points to EP-001, EP-002. Backup at work_item.yaml.bak.
```

`planning/model/work_item.yaml` now carries `budget_points: 37.5` on EP-001 and `budget_points: 7.5` on EP-002, and a `.bak` copy of the file as it was.

## 9. Validate again

```bash
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1
```

It exits 0 and ends:

```text
integrity: the chain closes from the calendar through to the products.
```

Section 5 shows each epic's budget against the products it names (37.5 against 7.0, and 7.5 against 2.0), and section 6 shows each person's load against their capacity. Both epics are under budget, which the report states as room to pull scope in. Over budget would be reported the same way and would not fail the run: it is a scoping decision, not an error.

## 10. Report the budget

```bash
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --budget
```

You should see the budget ladder, each step naming its source, then the split per epic:

```text
  step                             points from
  -------------------------------- ------ ----------------------------------------------------------------------
  working days in the period           60 calendar, 60 weekdays less nothing
  points at 100 percent allocation   30.0 60 days x 0.50 usable / 1.0 person-days per point
  gross across 2 people              45.0 30.0 x 100, 50 percent
  ENABLER CAPACITY                   45.0 the fixed cost. Scope varies against it
  distributed to epics as budget     45.0 each person's share of their allocation, across the epics they work on

  epic   budget from
  ------ ------ -----------------
  EP-001   37.5 Ana 30.0, Ben 7.5
  EP-002    7.5 Ben 7.5
  ------ ------ -----------------
  total    45.0

  Every figure above follows from the registers, and the basis declares the same three totals.
```

## 11. Generate the epic cards

Cards are opt-in: bind `cardsDir`, then generate and check them.

bash:

```bash
echo 'cardsDir     = "../planning/{quarter}/cards"' >> .agents/skill-bindings.toml
```

PowerShell:

```powershell
Add-Content -Encoding ascii .agents\skill-bindings.toml 'cardsDir     = "../planning/{quarter}/cards"'
```

Then:

```bash
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --cards
python .agents/skills/quarter-planning/bin/quarter.py --quarter 2027-q1 --cards --check
```

You should see:

```text
Wrote 3 of 3 file(s) for 2027-Q1.
  planning\2027-q1\cards\EP-001.md
  planning\2027-q1\cards\EP-002.md
  planning\2027-q1\cards\README.md
Epic cards for 2027-Q1 are current.
```

(with `/` in place of `\` on macOS and Linux). Open `planning/2027-q1/cards/EP-001.md`: it holds the epic's fields, its two products at 5.0 and 2.0 points, and its capacity, 37.5 budget against 7.0 planned. Cards are generated; never edit one. Change the model and regenerate.

## 12. Ask your agent

Open `my-plan` in your agent. VS Code with GitHub Copilot, Cursor, Codex and Gemini CLI read `.agents/skills/`. Claude Code reads `.claude/skills/`, so for it copy the skill there as well.

bash:

```bash
mkdir -p .claude/skills
cp -r .agents/skills/quarter-planning .claude/skills/
```

PowerShell:

```powershell
New-Item -ItemType Directory -Force .claude\skills | Out-Null
Copy-Item -Recurse .agents\skills\quarter-planning .claude\skills\
```

Then ask, for example:

- "Using quarter-planning, what is the status of quarter 2027-q1?"
- "Report the budget for 2027-q1 and where each figure comes from."
- "Add a decision record to EP-002 owned by Ana, then validate the quarter."

The agent runs the same commands you ran, and reports budget against planned per epic and load against capacity per person. It will not cut scope for you: over-subscription is reported as a decision for you to make. What the agent says depends on the agent; the figures do not.

## Where next

- [Concepts](concepts.md), to understand the budget ladder, the two stages and the checks.
- [Configuration](configuration.md), to bind your own workspace, with the optional keys for the ladder, cards, links and feature requests.
- [Commands](commands.md), for every flag.
- [Examples](examples.md), for the fuller test workspace, which uses every optional key.

To start again, delete `my-plan` and the `delivery-planning` clone.
