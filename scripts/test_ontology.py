#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Test ontology/delivery.schema.json against the quarter-planning fixture, and against
cases it must refuse.

Every file of skills/quarter-planning/tests/fixture/ that the data contract describes is
read as the skill reads it, written out as JSON, and validated with
scripts/validate-bundle.mjs, which resolves the work layer from scripts/vendor/.

Needs Python 3.9 or newer with PyYAML, and Node.js 18 or newer.

    python scripts/test_ontology.py
"""
from __future__ import annotations

import copy
import csv
import datetime
import json
import os
import subprocess
import sys
import tempfile

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIXTURE = os.path.join(ROOT, "skills", "quarter-planning", "tests", "fixture")
VALIDATOR = os.path.join(ROOT, "scripts", "validate-bundle.mjs")
MODULE = "pkg:generic/dermot-obrien/delivery-planning/delivery-ontology"


def load_yaml(*parts):
    with open(os.path.join(FIXTURE, *parts), encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def load_csv(*parts):
    with open(os.path.join(FIXTURE, *parts), encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def as_json(value):
    """YAML reads an unquoted date as a date; the model means the text."""
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()
    raise TypeError(type(value))


failures = 0


def check(label, value, definition, ok, tmp):
    global failures
    path = os.path.join(tmp, "instance.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(value, fh, default=as_json)
    r = subprocess.run(["node", VALIDATOR, "--schemas", os.path.join(ROOT, "ontology"),
                        "--instance", path, "--schema", f"{MODULE}#/$defs/{definition}"],
                       capture_output=True, text=True)
    passed = (r.returncode == 0) == ok
    print(f"{'  ok  ' if passed else ' FAIL '} {label}")
    if not passed:
        failures += 1
        print("        " + ("\n        ".join(r.stdout.splitlines()) if ok else "was accepted, and should have been refused"))


def main():
    work_item = load_yaml("planning", "model", "work_item.yaml")
    activity = load_yaml("planning", "model", "activity.yaml")
    work_plan = load_yaml("planning", "model", "work_plan.yaml")
    progress = load_yaml("work-items", "WI-002", "progress.yaml")
    rows = {
        "DeliverableType": load_csv("registers", "deliverable-types.csv"),
        "LadderStage": load_csv("registers", "ladder.csv"),
        "CalendarPeriod": load_csv("planning", "2027-q1", "2027-q1-calendar.csv"),
        "PlanningAssumption": load_csv("planning", "2027-q1", "2027-q1-planning-basis.csv"),
        "Allocation": load_csv("planning", "2027-q1", "2027-q1-resourcing.csv"),
    }
    with tempfile.TemporaryDirectory() as tmp:
        check("work_item.yaml matches WorkItemFile", work_item, "WorkItemFile", True, tmp)
        check("activity.yaml matches ActivityFile", activity, "ActivityFile", True, tmp)
        check("work_plan.yaml matches WorkPlanFile", work_plan, "WorkPlanFile", True, tmp)
        check("work-items/WI-002/progress.yaml matches Epic", progress, "Epic", True, tmp)
        for definition, table in rows.items():
            for i, row in enumerate(table):
                check(f"row {i + 1} matches {definition}", row, definition, True, tmp)
        check("a product matches Product",
              {"id": "PD-001", "name": "Example product", "platform": "PL-001", "team": "Team A"},
              "Product", True, tmp)
        request = {"id": "FRQ-001", "title": "Example request", "product": "PD-001", "epic": "EP-001",
                   "status": "backlog", "requested_by": "ana", "value": "8",
                   "time_criticality": "5", "risk_reduction": "3", "job_size": "5"}
        check("a feature request matches FeatureRequest", request, "FeatureRequest", True, tmp)

        x = copy.deepcopy(request)
        x["job_size"] = "4"
        check("a WSJF factor off the scale is refused", x, "FeatureRequest", False, tmp)
        x = copy.deepcopy(request)
        del x["product"]
        check("a feature request with no product is refused", x, "FeatureRequest", False, tmp)
        x = copy.deepcopy(work_item)
        del x["work_item"][0]["quarter"]
        check("an epic record with no quarter is refused", x, "WorkItemFile", False, tmp)
        x = copy.deepcopy(progress)
        x["work_item_level"] = "workstream"
        check("a workstream is not an Epic", x, "Epic", False, tmp)
        x = copy.deepcopy(progress)
        x["deliverables"][0]["state"] = "done"
        check("the work layer still applies: a deliverable state it does not know is refused",
              x, "Epic", False, tmp)
        x = copy.deepcopy(progress)
        x["activities"] = [{"id": "WI-002-A1", "title": "Story", "status": "pending",
                            "request_ids": "FRQ-001"}]
        check("request_ids must be a list", x, "Epic", False, tmp)

        # The stage grid: the ladder's optional columns, the increment and its steps.
        check("a stage with what is built and who moves it matches LadderStage",
              {"stage": "R2", "name": "Bounded", "builds": "Building block set; Scenario list",
               "moved_by": "architecture", "consumable": "no"}, "LadderStage", True, tmp)
        x = copy.deepcopy(progress)
        x["deliverables"][0]["stage"] = "R1"
        x["deliverables"][0]["stage_reason"] = "A capability catalogue names, it does not bound"
        check("a deliverable for its own stage matches Epic", x, "Epic", True, tmp)
        increment = {"id": "CI-2027-Q1-LN1", "lane": "LN-1", "period": "2027-Q1",
                     "flows": [{"flow": "Order intake", "stage_from": "R1", "stage_to": "R3"}],
                     "epic_ids": ["WI-002"], "criterion_ids": [],
                     "outcomes": [{"text": "Orders taken on the new channel", "status": "delivered this period", "stage": "R4"}]}
        check("an increment matches CapabilityIncrement", increment, "CapabilityIncrement", True, tmp)
        x = copy.deepcopy(increment)
        del x["lane"]
        check("an increment with no lane is refused", x, "CapabilityIncrement", False, tmp)
        x = copy.deepcopy(increment)
        x["outcomes"] = [{"status": "delivered"}]
        check("an outcome with no text is refused", x, "CapabilityIncrement", False, tmp)
        check("the old rung names still validate", {"rung": "R2", "name": "Bounded"}, "LadderRung", True, tmp)
        check("a type can be produced at several stages",
              {"id": "plan", "name": "Plan", "stages": "R1;R2", "base_story_points": 1}, "DeliverableType", True, tmp)
        check("a flow with neither stage names is refused", {"flow": "Intake"}, "Flow", False, tmp)
        check("a step matches IncrementStep",
              {"increment": "CI-2027-Q1-LN1", "stage": "R2", "deliverable_ids": ["WI-002-D1"]}, "IncrementStep", True, tmp)

    print(f"\n{failures} failure(s)." if failures else "\ndelivery.schema.json: all cases pass.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
