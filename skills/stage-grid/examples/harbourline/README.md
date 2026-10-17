<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Harbourline Transit: a stage grid you can open

An invented transit operator, Harbourline, planning a quarter. Everything the grid needs is in this folder, and nothing outside it is read:

| File | What it is |
|---|---|
| `registers/stages.csv` | Six stages, Noticed to Boarding, with what is built at each, its band and who moves it |
| `planning/graph.json` | The work graph: four lanes, four epics, their deliverables, stories, patterns and increments |
| `planning/stage-grid.json` | The grid: wording, colours, the lanes and their outcomes, and how links resolve |
| `site/` | A tiny site, one page per epic and pattern, with each story an anchor on its epic's page |
| `stage-grid/` | The built app. Open `stage-grid/index.html` |

Rebuild it from this folder:

```
node ../../scripts/stage-grid.mjs build
```

## What it shows

- The columns come from the stage register: six here, seven in other workspaces.
- A deliverable type can be done at several stages; each deliverable says which one it is for when its type allows more than one. `HL-21-D3` names none, and its type allows only Blueprinted, so it lands there.
- Links resolve from the configuration alone (`links` in `planning/stage-grid.json`): epics and patterns through templates into `site/`, stories as anchors on their epic's page, keys to a tracker, and deliverables never. Lanes have no template, so they open their panel and link nowhere.
