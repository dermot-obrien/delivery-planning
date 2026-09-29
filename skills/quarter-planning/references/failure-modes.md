<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# Failure modes, learned the hard way

Never edit `work_item.yaml` by text range. A block delete that runs past a record boundary
silently removes whole work items and orphans their deliverables onto a neighbour. Parse,
edit the structure, serialise. If it happens, `roadmap.yaml` holds the composed copy of every
record, including working-tree edits, and is the recovery source.

Back up the derived views before regenerating. They are untracked, so git cannot restore
them, and a regeneration from a half-migrated model writes zeros over figures that came from
a state which no longer exists.

Null is not zero. A deliverable with no `points` takes its type's base points. An activity
with no `estimate_points` is unsized, not free. Two tools that disagree about this will
compute the same quantity differently and neither will look wrong.

Never write a Unicode minus into a table the checker prints. Windows cannot encode it and the
run dies partway, which makes the error count look smaller than it is. Use an ASCII hyphen.

If a view cannot be derived from the model, retire it rather than hand-maintaining it. Hand
figures rot silently and are believed for exactly as long as nobody checks.

Prefer deriving a label over hardcoding it. A hardcoded epic label hid a name drift for weeks;
deriving it from the model's title and Jira reference surfaced it immediately.
