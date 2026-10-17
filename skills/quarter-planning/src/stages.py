# SPDX-License-Identifier: Apache-2.0
"""Stages: the steps of the definition ladder, read under their names or their old ones.

A stage is one step a capability climbs, least defined first. Before quarter-planning 3.7.0
the model called a stage a rung, so every reader here takes the stage field first and the
rung field when only that is recorded: a workspace written either way plans the same.

  the ladder register     column stage (was rung)
  a flow                  stage_from, stage_to, stage_reached (were rung_from, rung_to, rung_reached)
  a register type         stages: every stage the type can be produced at, separated by ';'
                          (was rung: the one stage it evidenced)
  a product of an epic    stage: the one stage it is for, when recorded
"""


def _first(record, *keys):
    for k in keys:
        v = (record or {}).get(k)
        if v is not None and str(v).strip() != '':
            return str(v).strip()
    return ''


def ladder_stage(row):
    return _first(row, 'stage', 'rung')


def flow_stage(flow, which):
    """which is 'from', 'to' or 'reached'."""
    return _first(flow, 'stage_' + which, 'rung_' + which) or None


def type_stages(row):
    """Every stage a register type can be produced at, in the order the register gives."""
    raw = _first(row, 'stages', 'stage', 'rung')
    return [s.strip() for s in raw.split(';') if s.strip()]


def product_stages(product, register):
    """The stages a product can be for: its own stage when recorded, else its type's."""
    own = _first(product, 'stage', 'rung')
    if own:
        return [own]
    return type_stages(register.get((product.get('deliverable_id') or '').strip()))
