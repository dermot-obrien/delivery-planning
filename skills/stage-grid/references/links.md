<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# How links resolve

The grid knows nothing about any site. Every link it shows comes from the `links` table of the grid configuration, so the same skill works against a Docusaurus site, a wiki, a folder of HTML pages or no site at all. A thing with no page gets no link: nothing on the grid is clickable to nowhere.

## The table

```json
"links": {
  "base": "../site/",
  "manifest": "../site/id/index.json",
  "templates": {
    "epic": "epics/{id}.html",
    "story": "epics/{epic}.html#{id}",
    "pattern": "patterns/{id}.html"
  },
  "keys": "https://tracker.example.org/browse/{key}",
  "fromGraph": true,
  "none": ["deliverable"]
}
```

| Key | Meaning |
|---|---|
| `base` | Put before every relative page. A URL (`https://docs.example.org/`), a path from the site root (`/docs/`), or a path from the app's own folder (`../site/`), which keeps links working when the app is opened from disk |
| `manifest` | A JSON file mapping identifiers to pages, `{"ids": {"EP-1": "epics/ep-1/"}}`, relative to the configuration. A site that publishes an identifier manifest, such as the cross-reference skill's `id/index.json`, gives every identifier a page with no templates at all |
| `templates` | A page per role, built from the thing's fields: `{id}`, `{key}`, and for a story or deliverable `{epic}`, plus any prop the graph carries. A template naming a field the thing lacks gives no link |
| `keys` | A link for an epic's or story's key, such as its issue in a tracker. Without it a key is plain text |
| `fromGraph` | Use a `url` the graph already carries. Default `true`. Set `false` to let the configuration decide everything |
| `none` | Roles never linked, whatever else says |

## Order

For each epic, story, deliverable, pattern and lane, the first of these that gives a page wins:

1. the `url` on the thing in the graph, unless `fromGraph` is `false`
2. its identifier in the `manifest`
3. the `templates` entry for its role

A relative result is put after `base`. The result goes into `stage-grid-data.js` as it is; the app adds nothing.

## Choosing

| The workspace has | Configure |
|---|---|
| A graph whose nodes already carry pages, such as one the knowledge-graph skill built from a site's routes | Nothing: `fromGraph` does it |
| A site that publishes an identifier manifest | `manifest`, and `base` if its routes are relative |
| Pages at predictable paths | `templates` and `base` |
| A tracker with issue keys | `keys` |
| Things that should never be links | `none` |

The worked example in `examples/harbourline/` uses templates into a small site beside it, story anchors on epic pages, a tracker for keys, and `none` for deliverables. Its lanes have no template, so their panels open and link nowhere.
