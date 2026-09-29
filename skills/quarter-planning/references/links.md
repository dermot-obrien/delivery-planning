<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# Links to epic and story pages

A plan document, or a deck built from one, is for discussion; the page each epic and story has
on the published site is where a reader goes for the detail and everything linked from it. So
the documents link every epic and story to its page, and a PDF of the deck keeps those links.

## Where a record is published

Where a record is published is data in the model, not configuration. The epic in
`work_item.yaml` (or its `progress.yaml`) and the story in `activity.yaml` each carry
`site_route`, the route of its own page relative to the site root. The workspace binds one
value, `siteUrl`, so moving from a local preview to the published site is one change and a
rerun. Keep routes stable, with no quarter or grouping in them, so a link in a PDF already
circulated survives a story moving quarter. The workspace's page generator publishes each page
at the route its record names; this skill only reads the routes.

## How a document names a record

A document names an epic or a story with a Markdown reference link and keeps the definition
at its foot:

```markdown
The quarter commits to [the example increment][EP-001], starting with [the capability area][EP-001-A1].

[EP-001]: https://site.example/epics/EP-001/
[EP-001-A1]: https://site.example/stories/EP-001-A1/
```

## Rewriting and checking the links

```bash
python <skills>/quarter-planning/bin/quarter.py --quarter <slug> --links
python <skills>/quarter-planning/bin/quarter.py --quarter <slug> --links --check
```

The first rewrites every definition in the quarter folder's Markdown whose label is an epic
id, a story id or, with `externalRefSystem` bound, an epic's tracker key, and leaves the prose
and every other definition alone. A record with no `site_route` is reported and its definition
left as it is. The second writes nothing and exits non-zero if any definition is behind the
model. A generator that writes links itself, a stories page or a schedule, imports
`src/links.py` so it resolves routes the same way.
