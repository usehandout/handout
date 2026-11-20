# Handout CLI and agent skill

[Handout](https://usehandout.com) turns a file into a link. You give it an `.html`, `.md` or `.pdf`
file and get back a URL that opens in a reader, with a chosen audience and a version history behind
it. This repository holds the `handout` command-line tool and the agent skill that lets Claude
Code, Codex and other terminal agents publish what they just made.

## Install

The CLI needs [Node.js](https://nodejs.org) 24 or later, and works on macOS, Linux and Windows:

```bash
npm install -g @usehandout/cli
handout login
```

Then give your agent the skill:

| Agent                  | Install the skill                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Claude Code            | In Claude Code: `/plugin marketplace add usehandout/handout`, then `/plugin install handout@usehandout`   |
| Claude Code, no plugin | `handout skill install --agent claude`                                                                    |
| Codex                  | `handout skill install --agent codex`                                                                     |
| Another agent          | `handout skill install --dir <its skills directory>`, or ask the agent to read [`SKILL.md`](cli/SKILL.md) |

Start a new agent session afterwards so it loads the skill. Then, if you like, run the one-time
guided setup: `/handout:setup` in Claude Code with the plugin, `/handout-setup` otherwise; in
Codex, ask for the Handout setup. It saves your publishing defaults and, only after you approve the
exact change, adds a short Handout section to your agent's instructions. To update, run
`npm install -g @usehandout/cli@latest`, then `handout skill install` again (a plugin updates from
`/plugin`).

## What is here

| Path                                                             | What it is                                                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [`cli/`](cli)                                                    | The npm package `@usehandout/cli`: the bundled CLI (`handout.mjs`) and its two skills (`SKILL.md`, `setup/SKILL.md`) |
| [`.claude-plugin/`](.claude-plugin)                              | The Claude Code plugin marketplace (`usehandout`)                                                                    |
| [`plugins/handout/`](plugins/handout)                            | The Claude Code plugin: the same two skills (the setup skill as `/handout:setup`)                                    |
| [`.github/workflows/release.yml`](.github/workflows/release.yml) | Publishes `cli/` to npm, with provenance, when a `skill-v<version>` tag is pushed                                    |

`cli/handout.mjs` is a single, unminified file, so you can read exactly what runs. It is built in
Handout's development repository, which is not public. The CLI talks to
`https://usehandout.com` unless `--host` or `HANDOUT_HOST` names another Handout site.

## Verifying a release

Every version on npm is published by this repository's release workflow with
[npm provenance](https://docs.npmjs.com/generating-provenance-statements): the package page on
npmjs.com links the exact commit and workflow run that produced it, and `npm audit signatures` in a
project that depends on the package checks the attestation.

## Contributing

This repository is a one-way mirror of the CLI and skill, published from Handout's own
development repository at each release. Pull requests are turned off. Bug reports and feature
requests are welcome as [issues](https://github.com/usehandout/handout/issues). To report a
security problem, use [private vulnerability reporting](https://github.com/usehandout/handout/security/advisories/new)
instead of a public issue.

## License

Copyright 2026 Nate Pierce. Licensed under the [Apache License 2.0](LICENSE); see [NOTICE](NOTICE).
