---
name: stage-grid
description: Build the stage grid for a planning period as a single-page app that opens from disk or is published with a static site. Rows are lanes (capabilities or capability areas), columns are stages (the steps of the workspace's definition ladder, as many as it has), and each cell is an increment step, the period's deliverables that build a lane towards a stage. Every block opens a panel; a stage explains itself and lists what sits at it, a lane shows its capability increment step by step, an epic shows what it is doing. Reads a work graph and a grid configuration and writes the one data file the app needs. Use when asked to build, show, publish or explain a stage grid, to see how a quarter moves capabilities along the ladder, to place deliverables against stages, or to configure the stages, lanes and bands of the grid.
license: CC-BY-4.0 AND Apache-2.0. Content under CC BY 4.0, code under Apache-2.0; see LICENSE and NOTICE.
compatibility: Node 18 or newer. No npm packages and no other skill. Reads a work graph in the knowledge-graph contract (references/data-contract.md), which any tool may write; the knowledge-graph skill is one.
metadata:
  author: dermot-obrien
  version: "0.1.1"
  homepage: https://github.com/dermot-obrien/delivery-planning
  x-skill-requires: ""
---

# Stage grid

The stage grid answers one question per period: what are we doing to move each capability along the ladder, and how far? It is a table.

| Part | What it is | Where it comes from |
|---|---|---|
| A column | A stage: one stage of the definition ladder, least defined first | The ladder register, as many rows as it has, or `stages` in the configuration |
| A row | A lane: a capability or capability area | `lanes` in the configuration |
| A row in one period | The lane's capability increment | The period's epics that advance the lane |
| A cell | An increment step: what the increment delivers towards that stage | Derived. A deliverable type can be produced at many stages; each deliverable is for one, its own `stage`, else its type's when the type allows only one |
| A band under the columns | A run of stages with the same band and mover, such as Define by architecture | The ladder's `band` and `moved_by` columns |
| The dashed line | Where the planning team stops: the last stage it moves | `boundary` in the configuration |

The ontology terms are `CapabilityIncrement`, `IncrementStep`, `IncrementOutcome` and the ladder's `LadderRung` in the bundle's delivery ontology.

## Step 0, before anything else

Run the post-install check from the workspace root, and stop on a problem:

```bash
node <skills>/stage-grid/scripts/check.mjs
```

It reads `[suite.stage-grid]` in `.agents/skill-bindings.toml`, the contract in `inputs.toml`. Paths are relative to the bindings file; `{quarter}` is replaced by `--quarter`:

```toml
[suite.stage-grid]
graph  = "../build/graph/graph.json"
config = "../planning/{quarter}/stage-grid.json"
out    = "../site/static/planning/{quarter}/stage-grid"
```

## Tasks

| Asked to | Do |
|---|---|
| Build or refresh the grid | `stage-grid.mjs build --quarter <slug>`. Report the counts and every warning |
| Review the grid without a browser | `stage-grid.mjs show --quarter <slug>` |
| Change the number or names of stages | Edit the ladder register (or `stages` in the configuration). Never edit the app |
| Say which stage a deliverable is for | Record `stage` on the deliverable, with `stage_reason` when it is a judgement. Needed whenever its type can be produced at more than one stage. A placement in the configuration is a fallback for models that cannot carry one yet |
| Show a lane | Add it to `lanes`. Its epics are found from the graph: those scheduled in the period that advance it |
| Show what others deliver | Add `outcomes` to the lane, each with the `stage` it shows the capability at |
| Publish it | Point `out` under the site's static folder, and build before the site is built |
| Make things link to their pages | Set `links` in the configuration: a manifest, templates per role, a base. See [references/links.md](references/links.md). Never put a site's layout in the app |

```bash
node <skills>/stage-grid/scripts/stage-grid.mjs build --quarter 2027-q1
node <skills>/stage-grid/scripts/stage-grid.mjs show --quarter 2027-q1
```

The configuration, every key, is in [references/configuration.md](references/configuration.md); how links resolve is in [references/links.md](references/links.md). A worked example you can open, an invented transit operator with six stages and its own small site, is in [examples/harbourline](examples/harbourline/README.md). What the graph must hold is in [references/data-contract.md](references/data-contract.md).

## The app

`index.html` and `stage-grid.js` never change between workspaces; `stage-grid-data.js` is all a period's grid is. Everything is a button:

| Click | Opens |
|---|---|
| A stage's heading or its card | What the stage means, what is built to reach it, who moves it, the deliverable types placed there, and this period's work at that stage across every lane |
| The "Who moves it" bar | The stages grouped by who moves them |
| A band | Its stages |
| A lane | Its description, its increment across the stages, step by step, the epics that carry it and what must become true |
| An epic, or an item | What the epic is doing: its goal, points, where its deliverables land, everything it produces, its stories, what it refines |

Deep links open a panel: `#stage:R3`, `#lane:LN-1`, `#epic:EP-1`, `#epic:EP-1/EP-1-D3`.

## Rules

- The records are the source. Never hand-edit `stage-grid-data.js`; fix the record or the configuration and rebuild.
- Bind the whole work graph, never a knowledge-graph class view (`<out>/<view>/graph.json`). A view drops the periods, increments and deliverables the grid places.
- A warning names a lane, stage or group the data does not have. Report it; don't build around it.
- Colours and wording belong to the workspace's configuration. The app's defaults are neutral.
