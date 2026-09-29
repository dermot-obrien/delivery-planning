<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Examples

Where to find a working example of each part of `quarter-planning`.

| Example | Where | Shows |
|---|---|---|
| The quick start workspace | [quick-start.md](quick-start.md) | The smallest workspace that validates: six inputs, two people, two epics, three products. Built from nothing in about ten minutes |
| The test workspace | [`skills/quarter-planning/tests/fixture/`](../skills/quarter-planning/tests/fixture) | A complete, minimal workspace that uses every optional key except the feature-request layer. It passes the validation as it stands, and every test starts from a copy of it |
| Its bindings | [`tests/fixture/.agents/skill-bindings.toml`](../skills/quarter-planning/tests/fixture/.agents/skill-bindings.toml) | A `slugPattern` of the form `2027-q1`, `{quarter}` in file names as well as folders, and the optional keys for the ladder, cards, work-item folders and links |
| A calendar with holidays | [`tests/fixture/planning/2027-q1/2027-q1-calendar.csv`](../skills/quarter-planning/tests/fixture/planning/2027-q1/2027-q1-calendar.csv) | Three monthly periods whose working days are fewer than their weekdays, so the report derives the public holidays |
| Resourcing with leave and run work | [`tests/fixture/planning/2027-q1/2027-q1-resourcing.csv`](../skills/quarter-planning/tests/fixture/planning/2027-q1/2027-q1-resourcing.csv) | Booked leave with its reason, and a share that does not count against enabler capacity (`RUN`) |
| Epics with framing, overrides and routes | [`tests/fixture/planning/model/work_item.yaml`](../skills/quarter-planning/tests/fixture/planning/model/work_item.yaml) | `lane`, `flows`, `home`, `site_route`, `external_refs`, and a product overriding its type's points with a reason |
| An epic from a work-item folder | [`tests/fixture/work-items/WI-002/progress.yaml`](../skills/quarter-planning/tests/fixture/work-items/WI-002/progress.yaml) | The `progress.yaml` fields read when `workItemsDir` is bound |
| A definition ladder | [`tests/fixture/registers/ladder.csv`](../skills/quarter-planning/tests/fixture/registers/ladder.csv) | Five rungs, least defined first, and the register's `rung` column naming what each type evidences |
| A plan document with links | [`tests/fixture/planning/2027-q1/2027-q1-plan.md`](../skills/quarter-planning/tests/fixture/planning/2027-q1/2027-q1-plan.md) | Reference links labelled by epic id, story id and tracker key, before `--links` points them at pages |
| An epic folder | [`tests/fixture/epics/EP-001-example/index.md`](../skills/quarter-planning/tests/fixture/epics/EP-001-example/index.md) | The hand-written home a card links to. [epic-cards.md](../skills/quarter-planning/references/epic-cards.md) has the recommended outline |
| Feature requests | [`tests/test_quarter.py`](../skills/quarter-planning/tests/test_quarter.py), the feature-request tests | Request and product registers written by the tests, since the fixture leaves the layer unbound. [feature-requests.md](../skills/quarter-planning/references/feature-requests.md) has the columns |

## Running the test workspace

Copy it somewhere and run the skill against it, so nothing in the repository changes.

bash:

```bash
cp -r skills/quarter-planning/tests/fixture ../qp-example
cd ../qp-example
python ../delivery-planning/skills/quarter-planning/bin/quarter.py --quarter 2027-q1
```

PowerShell:

```powershell
Copy-Item -Recurse skills\quarter-planning\tests\fixture ..\qp-example
Set-Location ..\qp-example
python ..\delivery-planning\skills\quarter-planning\bin\quarter.py --quarter 2027-q1
```

These assume the repository is cloned as `delivery-planning` and you start in it. The validation passes, reads WI-002 from its work-item folder, and prints the framing against the ladder. Then try `--cards` and `--links`, which write into the copy.
