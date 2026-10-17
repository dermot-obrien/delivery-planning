<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Ontology modules

## A module

One JSON Schema 2020-12 file. The skill reads four things from it:

| Key | Used for |
|---|---|
| `$id` | The module's name. A purl `pkg:generic/<owner>/<bundle>/<name>@<version>` or a URL. The version after `@` is dropped to make class IRIs, so a class keeps its IRI across minor releases |
| `version` or `x-version` | Shown by `modules`; otherwise taken from the `$id` |
| `$defs` | The classes, one per key |
| `$ref` inside a class or its `allOf` | What the class extends. A `$ref` that starts with `#` is in the same module |

Inside a class, `properties` are its fields. `description` and `title` are shown by `show`.

## Layers

A layer extends the one beneath it and never the other way round:

```json
"Epic": {
  "allOf": [
    {"$ref": "pkg:generic/acme/work/work-ontology#/$defs/WorkItem"},
    {"type": "object", "properties": {"period": {"type": "string"}}}
  ]
}
```

`show` merges the fields of every class reached this way. A field defined lower down is reported once, from the first class that defines it.

## Prefixes

A module gets a prefix from its id: `delivery-ontology` gives `delivery`, `ontology-schema.json` gives `ontology`. When two modules would get the same prefix, the first bound keeps it. Declare a prefix in `[suite.ontology] prefixes` as `name=module-id` to choose your own, for example `mo=https://example.org/standards/ontology-schema.json`. A declared prefix is preferred when an IRI is shortened.

## Links between records

A field links to another record when its name ends in `_id` or `_ids`. Where the name does not say which class it points to, add `"x-target": "delivery:Epic"` to the field's schema. JSON Schema ignores keywords it does not know, so this changes no validation.

## Why not RDF

The modules are already JSON Schema, and their `$ref`s are already IRIs. Reading them as they are gives every class a stable IRI without a second source of truth. A module can still be published as RDF or JSON-LD later; the IRIs stay the same.
