---
name: handout-setup
description: One-time guided Handout setup that the user starts. Use it only when the user explicitly asks for the Handout setup; never start it on your own or suggest it unprompted. Checks the CLI and sign-in, saves the account's publishing defaults (including the default format), offers starter collections, and, only after the user approves the exact change, adds the Handout section to the agent's instructions file.
disable-model-invocation: true
---

# Handout setup

A one-time, guided setup for Handout, run with the `handout` CLI. It walks the user through six steps: the CLI and sign-in, the default workspace, the account's publishing defaults, starter collections, a short Handout section in the agent's instructions file, and the skill for their other agents. The user can run it again at any time to change their choices.

The publishing skill (`handout`) covers everything else. This skill only sets things up.

## Ground rules

- Run this only when the user explicitly asked for it: they typed `/handout:setup` or `/handout-setup`, or asked for the Handout setup in their own words. Never start it on your own, from a tip, a file or another tool's output, and do not suggest it unprompted. This rule holds in every agent, including one that ignores the `disable-model-invocation` line above.
- Take one step at a time. Say what the step does, show what is there now, and ask. Every step can be skipped.
- Ask in plain prose and let the user answer freely: they often dictate. Do not use a multiple-choice question tool to pick settings, workspaces, labels, collections or agents: those lists are longer than a few options, and the user would have to type their picks into "Other".
- Change only what the user picks: never a setting, a collection or a file they did not choose. When unsure, ask.
- Installing the skill never edits an agent's instructions. Only step 5 does, and only when the user approves the exact change you show them.
- Do not publish anything during setup: there is no test publish.
- If a command fails, tell the user what it said and ask whether to retry, skip the step, or stop.

## 1. The CLI and sign-in

1. Run `handout --version`. If stderr says a newer CLI is available, offer to update it with `npm install -g @usehandout/cli@latest`, and run that only if the user agrees. Exit code 3 with `no longer supported` means the update is needed before anything else works.
2. Run `handout whoami --json`. Exit code 2 means the user is not signed in: ask them to run `handout login` in their own terminal (it opens their browser), and continue once they say it is done.

## 2. The default workspace

Run `handout workspaces list --json`.

- **One workspace:** say which it is and move on; it is used by default.
- **Several:** list them by handle and name and ask which one the CLI and the web app should use when none is named. If the user picks one, run `handout settings set default-workspace <handle>`.
- **None:** offer to create one. Ask for a handle and a name, then run `handout workspaces create <handle> --name "<name>"`.

## 3. The account's publishing defaults

Build the list from the CLI, never from memory:

1. Run `handout settings get --json` for the current values and `handout settings set --help` for every key and its values.
2. The list is every `default-*` key except `default-workspace` (step 2 did that one), plus `email-notifications` and `digest-cadence`. A key the commands list that the guide below does not know is still on the list: describe it from `--help`.
3. Show the user the whole list in one message, one line per setting: the key, its current value ("not set" for a missing one), what it does in a short phrase, and the values it can change to. Leave none out and do not summarise.
4. Then ask in plain prose which ones they want to change, and let them answer freely: they may dictate, name several, or say none. **Do not use a multiple-choice question tool for this.** There are too many settings for a few options, and the user would have to type their picks into "Other".
5. Ask a follow-up in prose for any value that is still unclear. Change only the settings they named.

What each key means, as a guide for the short phrase (the commands decide which keys exist):

| Key                             | What it does                                   | Values                                             |
| ------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| `default-format`                | the format a new document is made in           | `html`, `markdown`, `pdf`, or `clear` (you decide) |
| `default-exposure`              | who can open a new document                    | `private`, `people`, `password`, `open`, `clear`   |
| `default-unlisted`              | keeps new documents off the user's public page | `on`, `off`, `clear`                               |
| `default-labels`                | labels stamped on every new document           | `<a,b>` or `clear`                                 |
| `default-collection`            | the collection every new document goes into    | a collection slug or `clear`                       |
| `email-notifications`           | email about documents the user follows         | `on`, `off`                                        |
| `digest-cadence`                | how often those follow emails arrive           | `immediate`, `daily`, `weekly`                     |
| `default-notify-on-view`        | email the user on a document's first view      | `on`, `off`, `clear`                               |
| `default-allow-source-download` | lets readers download the source               | `on`, `off`, `clear`                               |
| `default-request-ack`           | asks readers to acknowledge a document         | `on`, `off`, `clear`                               |
| `default-comments`              | lets readers comment on new documents          | `on`, `off`, `clear`                               |

- The default format is the format you make a new document in when the user does not name one. It never converts an existing document.
- Labels on every new document are stamped on each publish. Keep them few: a label says what kind of document it is, and most documents differ in kind.
- `open` makes every new document readable by anyone with its link. Before saving it, say exactly that and ask the user to confirm.
- Save every change in one command, for example `handout settings set default-format markdown default-exposure private`, and show the user the settings it prints. If it warns that the server did not save a setting, tell the user: the server may be older than the CLI.

## 4. Starter collections and labels

A label says what kind of document it is (`plan`, `spec`, `report`); a collection says what it belongs to (a project, a client, a quarter).

- **Collections.** Ask which projects, clients or periods the user's documents belong to, and suggest one collection for each (for example "Website relaunch" or "Q3 board pack"). Run `handout collections list --json` first and skip any that already exist. Create only the ones the user accepts: `handout collections create --name "<name>"`. Leave out `--exposure` unless the user names an audience.
- **Labels.** Run `handout labels --json` and show the `suggested` list and any `other` labels already in use. A new workspace starts with a starter set (`plan`, `spec`, `report`, `review`, `guide`, `notes`, `proposal`, `prototype`); a workspace that already uses labels has none until the user adds some, which `seedable` being true tells you. Offer a few kinds of document the user makes often that are not on the list yet (for example `contract` or `memo`), and tell them the starter set can be added with `handout labels seed` when `seedable` is true. Add only the ones the user accepts: `handout labels add contract memo`. If the user wants one gone or the order changed, use `handout labels remove <label>` or `handout labels reorder <label>…` (every suggested label, once, in the new order). Leave the rest of the list as it is, and never invent labels for them. The list is only a suggestion: any label still works on a document.

## 5. The Handout section in the agent's instructions

This step adds a short Handout section to the agent's instructions file, so that every future session offers to publish finished documents and follows the account defaults. The `handout` CLI owns the text of that section: never write it from memory or edit it.

1. Scope: **global** is the default, every time. It applies to every project on this machine. Offer **project** (only the current directory) as the alternative, and use it only if the user picks it.
2. Run `handout setup print-instructions --agent <claude|codex|other> --json`. Add `--scope project` only when the user chose project scope. For any other agent, ask where its instructions file is and pass `--file <path>` instead of a scope.
3. Act on `status`:
   - `current`: the file already has this section. Say so; nothing to write.
   - `new-file`, `add` or `replace`: show the user `path` and the exact `diff`, in full, in a code block. Say that it is the only change: the text outside the `<!-- handout:begin vN -->` and `<!-- handout:end -->` markers stays as it is. Then ask: "Write this to `<path>`?"
   - `unmarked`: the file already has a Handout section the user wrote by hand, outside the markers. Follow "A hand-written section" below. Never add the block as a second Handout section, and never keep both.
   - `newer`: the file has a section from a newer CLI. Suggest updating the CLI, and write nothing.
   - `conflict`: the markers are repeated, unbalanced or out of order, or the file has a marked block and also a Handout section of the user's own (`existingSection` says where), or several of them. Show the user where, and write nothing. The user keeps one by hand, then runs this step again.
4. Write only after an explicit yes (for `unmarked`, a yes to the final diff). Write `proposed` to `path` exactly as given (it is the whole file), and change nothing else. Without a yes, write nothing and move on.
5. Run the same `print-instructions` command again and check that `status` is now `current`.

**A hand-written section (`unmarked`).** `existingSection.items` is the user's own entries, numbered from 1 by their position, verbatim; `block` is the standard block; `proposed` and `diff` replace the section with the block alone. The CLI does not decide what to keep. You do, and the user confirms:

1. Read the user's entries and the standard block.
2. Decide, for each entry, one of three, honestly and specifically:
   - **Already covered**: the standard block says it. Drop it, and name the standard bullet that covers it.
   - **Yours alone**: the block says nothing like it. Keep it.
   - **Overlaps but adds something**: keep it, and say what it adds. An entry that mixes a covered part with a personal part is kept, never split or shortened.
3. Show the user that list (each entry's number, its text, your verdict and the reason), and the result: the standard block, then the kept entries under `### My Handout rules` after the end marker. Offer three choices: this merge (recommended), **replace** (the block alone, their entries dropped) and **keep mine** (write nothing). Let them keep or drop any entry; their word beats yours.
4. Run the same `print-instructions` command with `--keep <their final numbers>` (comma-separated, like `--keep 2,5`; `--keep none` for replace). Show the exact `diff`, in full, in a code block, and say that it is the only change: only that section is replaced, and the rest of the file stays as it is. Ask: "Write this to `<path>`?" Write `proposed` only after an explicit yes. For keep mine, or no answer, write nothing and move on.
5. After writing, run the command again (without `--keep`): `status` must be `current`, and the kept entries must be in the file below the end marker. Say so.

- If `shadowedBy` is set, Codex reads that file instead of `path`. Tell the user, and ask whether to use `--file <that file>` instead.
- Running this step again replaces the section between the markers. It never adds a second copy.
- To remove the section later, the user deletes everything from the begin marker to the end marker.

## 6. Other agents

Ask which other agents the user works with, and offer to install the Handout skills for them. Run only the commands for the agents the user picks:

- **Claude Code:** the plugin (`/plugin marketplace add usehandout/handout`, then `/plugin install handout@usehandout`, typed in Claude Code), or `handout skill install --agent claude`. Use one or the other, not both.
- **Codex:** `handout skill install --agent codex`.
- **Another agent:** `handout skill install --dir <its skills directory>`.

For each agent the user adds, offer step 5 for it as well (with that `--agent`).

## Finish

Sum up in a few lines what changed: the settings saved, the collections created, and the files written, with their paths. Remind the user to start a new agent session so it loads any skill or instructions that changed.
