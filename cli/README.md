# @usehandout/cli

The `handout` command turns an `.html`, `.md` or `.pdf` file into a
[Handout](https://usehandout.com) link, with a chosen audience and a version history. It also ships
the agent skill (`SKILL.md`) that lets Claude Code, Codex and other terminal agents publish what
they make.

```bash
npm install -g @usehandout/cli
handout login
handout publish report.html
```

Requires Node.js 24 or later. Works on macOS, Linux and Windows.

## Give your agent the skill

```bash
handout skill install --agent claude   # ~/.claude/skills/handout/SKILL.md
handout skill install --agent codex    # ~/.agents/skills/handout/SKILL.md
handout skill install --dir <path>     # any other agent's skills directory
```

In Claude Code you can install the plugin instead: `/plugin marketplace add usehandout/handout`,
then `/plugin install handout@usehandout`. Use the plugin or `--agent claude`, not both.

## Update

```bash
npm install -g @usehandout/cli@latest
handout skill install --agent claude   # again, for each agent you installed the skill for
```

## More

`handout --help` lists every command; `handout <command> --help` shows its flags. Every command
that lists, gets or searches accepts `--json`. The CLI talks to `https://usehandout.com` unless
`--host` or `HANDOUT_HOST` names another Handout site.

Issues and releases: [github.com/usehandout/handout](https://github.com/usehandout/handout).
Each version is published from that repository with npm provenance.

Copyright 2026 Nate Pierce. Licensed under the [Apache License 2.0](LICENSE); see NOTICE.
