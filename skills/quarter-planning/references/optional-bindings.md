<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# Optional bindings

Beside the six required keys in `[suite.quarter-planning]`, six more keys are optional, and a workspace that declares none of them validates exactly as
before. Each one opts in to something:

| Key | Opts in to |
|---|---|
| `ladder` | Judging each epic's framing against the definition ladder, a CSV of `rung,name,description` in ascending order |
| `epicsDir` | Linking each generated card to the epic's own hand-written folder |
| `cardsDir` | `--cards`, which writes the epic cards and the stage grid. May carry `{quarter}` |
| `workItemsDir` | Reading epics from AAW work items' `progress.yaml` as well as `work_item.yaml`, and the feature requests each story cites in `request_ids` |
| `requests` | The feature-request layer: requests against products, taken on by epics, section 10 of the validation, requests and supported products on the cards, and `--backlog`. See [feature-requests.md](feature-requests.md) |
| `products` | Product names, platforms and teams for the requests, and checking each request's product exists |

Two optional values opt in to linking the plan documents to published pages, with `--links`, as [links.md](links.md) describes:

| Key | Opts in to |
|---|---|
| `siteUrl` | The root of the published site. Each epic's and story's `site_route` is appended to it |
| `externalRefSystem` | Letting a tracker key, the `external_id` an epic carries in `external_refs` for this system, label a link to the epic's own page |

[data-contract.md](data-contract.md) gives the shape of each file these keys name.
