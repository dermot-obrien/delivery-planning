# Contributing to delivery-planning

Thank you for your interest in contributing. Bug reports, fixes, examples and documentation improvements to the delivery-planning skills are all welcome.

## Ways to contribute

- Report a bug, with the smallest document and diagram that show it.
- Suggest an improvement to the planning method, a check, or a new planning horizon.
- Fix a bug or add a feature, with tests.
- Improve the documentation or the worked example.

## Process

For a small change, fork the repository, make the change and open a pull request.

For a significant change, open an issue first describing what you want to do, so it can be discussed before you invest in it. Then fork, develop and open a pull request that references the issue.

## Before you open a pull request

Run, from the repository root:

```bash
node scripts/validate-skills.mjs skills
skills-ref validate skills/quarter-planning
python -m unittest discover -s skills/quarter-planning/tests
```

Keep the skills generic. They are used by many organisations, so nothing in them may name or imply one: no organisation names, internal hosts, identifiers or brand palettes in code, tests or examples. An organisation's own registers, calendar, people and plans belong in its own repository, bound through its own `.agents/skill-bindings.toml`.

Record a user-visible change in `CHANGELOG.md` under the skill it changes, and raise that skill's version in its `SKILL.md` (`metadata.version`), in its entry in `.claude-plugin/marketplace.json`, and in its `version` and `purl` in `bundle.json`, together. Any change inside a skill's folder is a release of that skill, at least a patch; documentation under `docs/` needs no version. Keep `references/data-contract.md` true to what the skill reads: a change to it is a breaking change, as listed in DD-11 of AI-Assisted Work.

Keep `docs/` in step with the scripts: a new flag goes in `docs/commands.md`, a new binding key in `docs/configuration.md` and `inputs.toml`, and a new or reworded message in `docs/troubleshooting.md`. If you change a step of `docs/quick-start.md`, run the whole guide again in a new folder, in PowerShell and in bash.

`skills-ref` is the Agent Skills reference validator; the README's [Agent Skills conformance](README.md#agent-skills-conformance) section says how to install it. CI runs both, and fails a `SKILL.md` over 500 lines or about 5,000 tokens: move detail into a file under the skill and link it.

## Releases

Each skill is versioned and released on its own. A release is a commit on `main` whose versions agree for that skill, tagged `<skill>--v<version>`, for example `quarter-planning--v3.4.0`.

## Licensing of contributions

This repository is dual-licensed:

- Content (Markdown, skill instructions, references): [CC BY 4.0](LICENSES/CC-BY-4.0.txt)
- Code (`bin/`, `src/`, `tests/`, `scripts/`, `inputs.toml`, plugin manifests, CI workflows): [Apache-2.0](LICENSES/Apache-2.0.txt)

By submitting a contribution (pull request, patch, or issue containing code), you agree that it is licensed under the same terms as the file you are modifying. New code files must include an SPDX header:

```python
# SPDX-FileCopyrightText: <year> <your name or organisation>
# SPDX-License-Identifier: Apache-2.0
```

New content files are covered by the bulk rules in `REUSE.toml` and need no header. The project follows the [REUSE Specification 3.3](https://reuse.software/spec-3.3/).

## Derivative works

If you fork this repository or build on it:

1. Keep `LICENSE`, `LICENSES/`, `NOTICE` and `REUSE.toml` intact, and add your own attribution to `NOTICE` rather than replacing it.
2. Preserve the `SPDX-FileCopyrightText` and `SPDX-License-Identifier` headers in the files you carry over.
3. Mention "Based on delivery-planning by Dermot O'Brien, derived from AI-Assisted Work" in your README, and link to this repository.
4. Indicate the changes you have made, as both CC BY 4.0 and Apache-2.0 require.

## Code of conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Questions

Open an [issue](https://github.com/dermot-obrien/delivery-planning/issues).
