#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Post-install check for quarter-planning (DD-11 of AI-Assisted Work).

Run from the workspace root, with SKILL_DIR set to the installed skill's directory:

    python bin/check.py

Checks what the skill needs before it can plan any quarter: Python 3.11 or newer, PyYAML,
and [suite.quarter-planning] in the workspace's .agents/skill-bindings.toml, with the six
required paths declared and every declared path resolving. A path carrying {quarter} is
checked up to the placeholder, since only a run names the quarter. slugPattern must compile
and supply every field quarterLabel uses.

Exit 0: correct (warnings may be printed). Exit 1: problems, one line each.
Exit 2: usage or environment error. Offline and read-only: it opens no register.
"""
from __future__ import annotations

import os
import re
import sys

if sys.version_info < (3, 11):
    print(f"Python {sys.version.split()[0]} is too old: quarter-planning needs 3.11 or newer "
          "to read skill-bindings.toml.", file=sys.stderr)
    sys.exit(2)
if sys.argv[1:] in (["-h"], ["--help"]):
    print(__doc__.strip())
    sys.exit(0)
if len(sys.argv) > 1:
    print("usage: check.py   (run from the workspace root; takes no arguments)", file=sys.stderr)
    sys.exit(2)

import tomllib  # noqa: E402

SKILL_DIR = os.path.abspath(os.environ.get("SKILL_DIR")
                            or os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(SKILL_DIR, "src"))
import bindings as b  # noqa: E402

problems, warnings = [], []
PLACEHOLDER = "{quarter}"

try:
    import yaml  # noqa: F401
except ImportError:
    problems.append("PyYAML is not installed for this Python. Run: python -m pip install pyyaml")

file = b.find_bindings(os.getcwd())
if not file:
    problems.append(
        f"no .agents/skill-bindings.toml at or above {os.getcwd()}. Create it with a "
        f"[suite.quarter-planning] section declaring {', '.join(b.PATH_KEYS)}; see "
        f"references/data-contract.md.")
else:
    try:
        with open(file, "rb") as fh:
            tomllib.load(fh)
    except tomllib.TOMLDecodeError as e:
        problems.append(f"{file}: not valid TOML ({e}). Fix the file.")
        file = None

if file:
    bind = b.Bindings(PLACEHOLDER, start=os.getcwd())
    where = f"{bind.file}: [suite.quarter-planning]"
    undeclared = bind.undeclared()
    if undeclared:
        problems.append(f"{where} does not declare {', '.join(undeclared)}. Add each as a path; "
                        f"none has a default. See references/data-contract.md.")

    def checked(key):
        p = bind.resolve(key)
        shown = bind.values.get(key)
        if PLACEHOLDER in p:
            p = p.split(PLACEHOLDER)[0]
            p = p if p.endswith(os.sep) or os.path.isdir(p) else os.path.dirname(p)
            if not os.path.isdir(p):
                problems.append(f"{where} {key} = \"{shown}\": the folder in front of {PLACEHOLDER}, "
                                f"{p}, does not exist. Create it, or correct {key}.")
            return
        if not os.path.exists(p):
            if key in b.WRITTEN_KEYS:
                if not os.path.isdir(os.path.dirname(p)):
                    warnings.append(f"{where} {key} = \"{shown}\": {p} and its parent do not exist yet; "
                                    f"--cards creates it.")
                return
            problems.append(f"{where} {key} = \"{shown}\" resolves to {p}, which does not exist. "
                            f"Create it, or correct {key}.")

    for key in b.PATH_KEYS:
        if key not in undeclared:
            checked(key)
    for key in b.OPTIONAL_PATH_KEYS:
        if bind.declared(key):
            checked(key)

    pattern = bind.values["slugPattern"]
    try:
        groups = set(re.compile(pattern).groupindex)
    except re.error as e:
        problems.append(f"{where} slugPattern {pattern!r} is not a valid regular expression ({e}). "
                        f"Write it as a TOML literal string, in single quotes.")
        groups = None
    if groups is not None:
        fields = set(re.findall(r"\{(\w+)\}", str(bind.values["quarterLabel"])))
        if fields - groups:
            problems.append(f"{where} quarterLabel {bind.values['quarterLabel']!r} uses "
                            f"{', '.join(sorted(fields - groups))}, which slugPattern does not "
                            f"capture as a named group. Make the two agree.")
    if not bind.declared("slugPattern"):
        warnings.append(f"{where} does not declare slugPattern, so the fiscal-year default "
                        f"{b.DEFAULTS['slugPattern']} is in use.")
    if not bind.approval_stages:
        problems.append(f"{where} approvalStages is empty. Name the stages, least advanced first.")
    try:
        float(bind.values["tolerance"])
    except (TypeError, ValueError):
        problems.append(f"{where} tolerance {bind.values['tolerance']!r} is not a number.")

for w in warnings:
    print(f"warning: {w}")
for p in problems:
    print(p)
if not problems:
    print("quarter-planning: ok")
sys.exit(1 if problems else 0)
