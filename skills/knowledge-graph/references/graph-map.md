<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# The graph map

A graph map is one JSON file in the workspace. Paths in it are relative to the map. A worked example is [examples/workspace/graph-map.json](../examples/workspace/graph-map.json).

## title

The page's title.

## roles

Which class of the workspace's ontology plays each role the graph lays out. Keys are role ids from [assets/roles.json](../assets/roles.json). Each value takes one SKOS mapping relation and an optional note:

| Relation | Use when |
|---|---|
| `exactMatch` | The class is exactly what the role means |
| `closeMatch` | Near enough to stand in, with a known difference. Say what in `note` |
| `broadMatch` | The class is wider than the role, so only some of its instances play it |
| `narrowMatch` | The class is narrower; other classes play the role too |

A role with no class has only a `note`, for example `{"note": "the quarter label on each epic; no class yet"}`. Such a role still works; it is shown as not mapped, which is a prompt to add the class.

The class is written as the ontology skill accepts it: `delivery:Epic`, a bare `Epic`, or a full IRI. `prefixes` at the top of the map adds prefixes for this map. A class the bound ontology does not define is a build warning.

`ontology.modules` lists module files for a workspace that has not bound `[suite.ontology]`.

## sources

A list. Each entry reads one file of records:

| Key | Meaning |
|---|---|
| `file` | CSV, JSON or YAML, by extension or `format` |
| `select` | Dotted path to the list of records in the file, such as `work_item` or `data.items` |
| `where` | Only records whose fields equal these values: `{"work_item_level": "epic"}`, a list of allowed values, or `"*"` for present |
| `role` | The role these records play. Without it, the role is guessed from `idSchemes`, else `other` |
| `class` | The class, when it differs from the role's mapping (capability areas playing the capability role, say) |
| `id` | The identifier field. Default `id` |
| `label` | A field, or a template such as `"{id} {name}"`. Default `title`, then `name` |
| `url` | A field holding the record's page, absolute or relative to the site base |
| `props` | Fields shown in the detail panel, or `"*"` for every simple field. `"name=path"` takes a value from deeper in the record: `"key=external_refs[system=jira].external_id"`, where `[k=v]` picks the first list item whose `k` is `v` |
| `links` | Fields that refer to other records (below) |
| `children` | Records nested in each record, such as an epic's deliverables. Each takes the same keys plus `parent: {"p": "produces"}` for the edge from the parent |

A record seen in two sources is one node; the later source adds fields.

### links

| Key | Meaning |
|---|---|
| `field` | The field. A list, a single value, or a delimited string with `split` |
| `p` | The predicate, from `predicates` in roles.json or the map's own `predicates` |
| `reverse` | Draw the edge from the target to this record |
| `create` | Make a node from the value itself when no record has that id. For values that are things in their own right but have no register, such as a quarter's label |
| `role` | The role of a target with no record, when `idSchemes` cannot tell |

A target with no record and no `create` becomes a stub: drawn dashed, listed under Gaps, counted by `graph.mjs gaps`.

## idSchemes

How to tell an identifier's role from its shape. Either inline:

```json
"idSchemes": {"schemes": [{"pattern": "^EP-[0-9]+$", "role": "epic"}]}
```

or from a register: `{"file": "identifier-schemes.csv", "prefixColumn": "prefix", "patternColumn": "pattern", "roles": {"EP": "epic", "PAT": "pattern"}}`. The first matching pattern wins.

## links

| Key | Meaning |
|---|---|
| `manifest` | A site's identifier manifest, `{"base_url": ..., "ids": {"PAT-001": "patterns/pat-001/"}}`. The cross-reference skill's `id/index.json` is one |
| `baseUrl` | The base for relative pages. Overrides the manifest's `base_url`, for a local preview |
| `expectPages` | Roles whose records should have a page. Only these count as gaps when they have none; a record of any other role simply has no link. Default: every role but period, party and other |

## view

| Key | Meaning |
|---|---|
| `focus` | The identifier the page opens on. Without it, everything is shown |
| `depth` | Hops from the focus, 0 for everything. Default 2 |
| `hide` | Roles hidden until ticked in the Roles tab |

## predicates

Extra predicates and how to read them: `{"funds": "is funded by"}`.
