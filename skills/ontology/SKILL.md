---
name: ontology
description: Read a workspace's layered ontology, written as JSON Schema modules that extend each other by $ref, without fetching anything. Lists the bound modules and their classes, shows one class with what it inherits and which of its fields link to other records, expands a short name such as delivery:Epic to the class IRI, and checks that every $ref resolves to a bound module and class. Use when asked what classes an ontology has, what a class extends or links to, what IRI to use for a class, whether a workspace's ontology modules are complete, or before mapping records to classes for a knowledge graph.
license: CC-BY-4.0 AND Apache-2.0. Content under CC BY 4.0, code under Apache-2.0; see LICENSE and NOTICE.
compatibility: Node 18+. No other skills and no npm packages.
metadata:
  version: "0.1.1"
  homepage: https://github.com/dermot-obrien/delivery-planning
---

# Ontology

An ontology here is a set of JSON Schema 2020-12 modules. Each module's `$id` names it, as a purl (`pkg:generic/<owner>/<bundle>/<name>-ontology@1.0.0`) or a URL. Its classes are its `$defs`. A higher layer extends a lower one with `allOf` and a `$ref` to the lower module's id, with or without the version.

A class is named by its IRI: the module id without the version, then `#/$defs/<Name>`. That is the string a `$ref` already uses, so a class has one name wherever it is cited. Short forms are accepted everywhere a class is asked for:

| Written as | Means |
|---|---|
| `pkg:generic/acme/delivery/delivery-ontology#/$defs/Epic` | The class, by IRI |
| `delivery:Epic` | The same, by prefix. A module's prefix is its last path segment without `-ontology` or `.schema.json`, unless the workspace declares one |
| `Epic` | The same, when exactly one bound module defines `Epic` |

Nothing is fetched. The workspace binds the module files it uses, which is its source map.

## Step 0, before anything else

Run the post-install check from the workspace root, and stop on a problem:

```bash
node <skills>/ontology/scripts/check.mjs
```

It reads `[suite.ontology]` in `.agents/skill-bindings.toml`, the contract in `inputs.toml` beside this file. Paths there are relative to the bindings file:

```toml
[suite.ontology]
modules = [
  "../ontology/work.schema.json",
  "../ontology/delivery.schema.json",
]
prefixes = ["mo=https://example.org/standards/ontology-schema.json"]
```

Bind every layer a module extends, or its `$ref`s will not resolve.

## Tasks

| Asked to | Do |
|---|---|
| List what the ontology has | `ontology.mjs modules`, then `ontology.mjs classes [--prefix delivery]` |
| Explain a class | `ontology.mjs show delivery:Epic`: its IRI, description, what it extends and which fields link to other records |
| Give the IRI to use for a class | `ontology.mjs show <name> --json` and quote `iri` |
| Check the modules are complete | `ontology.mjs check`. Report each problem with the class it is in |
| Show the records of some classes and how they link | Name the classes here, then build a class view with the knowledge-graph skill: `graph.mjs build --classes delivery:Epic,delivery:Story`. A class takes in the classes that extend it |
| Try modules that are not bound | Add `--module <file>` once per file; it replaces the bound list |

```bash
node <skills>/ontology/scripts/ontology.mjs modules
node <skills>/ontology/scripts/ontology.mjs show delivery:Epic
node <skills>/ontology/scripts/ontology.mjs check
```

A field is shown as a link when its name ends in `_id` or `_ids`, or when its schema declares `x-target` naming the class it points to. Prefer adding `x-target` to guessing from names.

## Rules

- Never edit a module to make a check pass. A module belongs to whoever publishes it; report the problem to its owner, or bind the missing layer.
- A class missing from every module is a gap in the ontology, not something to invent here. Say which role or record needs it and ask the owner whether to add it.
- Quote a class by its prefixed name in prose, and by its IRI in anything a machine reads.

More on module layout, versions and prefixes: [references/modules.md](references/modules.md).
