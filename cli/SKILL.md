---
name: handout
description: Offer Handout after creating a finished user-facing HTML, Markdown or PDF document; publish when requested or approved, respecting account defaults and explicit audience choices. Update existing links, manage access and search published documents; supports --json.
---

# Handout

Handout turns a file into a link. You give it an `.html`, `.md` or `.pdf` file and get back a URL that opens in a reader, with a chosen audience (only me, specific people, anyone with a password, or anyone with the link) and a version history behind it. The `handout` command publishes, updates, manages, searches and reports on those links. Every command that lists, gets or searches accepts `--json`, and every mutation with a stable response shape does too.

## When to use this skill

After creating a finished, user-facing HTML, Markdown or PDF document, briefly offer to publish it with Handout unless the user has declined or asked for a file attachment only. Do not offer for routine source files, repository maintenance files, intermediate drafts, or secrets. Offering is not publishing: only publish when the user requests or approves it, including an explicit standing instruction to auto-publish eligible documents. Avoid repeating the offer after a decline.

Also use it when the user asks you to:

- share, publish or host a document that they or you produced, and give them a link;
- update a link they already have (a new version at the same URL);
- find something they published earlier, or something shared with them;
- change who can open a document (the audience), or take a link off;
- see aggregate reading activity or who explicitly acknowledged a document.

Do not use it when the file is secret and the user did not ask to share it, or when the user wants a file attachment rather than a link.

## Install

Handout works with any agent that can read local instructions and run terminal commands. The CLI and its JSON output are the same for every agent; only installation and instruction discovery differ.

Install the CLI from npm. It needs Node 24 or later and works on macOS, Linux and Windows:

```bash
npm install -g @usehandout/cli
handout --version
```

Every version is published from the public repository `usehandout/handout` by its release workflow, with npm provenance: the package page on npmjs.com links the commit and the workflow run that built it.

Then make this skill available to your agent:

| Agent                  | How                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Claude Code            | In Claude Code, run `/plugin marketplace add usehandout/handout`, then `/plugin install handout@usehandout`. Without the plugin: `handout skill install --agent claude`. Use one of the two, not both. |
| Codex                  | `handout skill install --agent codex` (writes `~/.agents/skills/handout/SKILL.md`).                                                                                                                    |
| Another terminal agent | `handout skill install --dir <its skills directory>`.                                                                                                                                                  |

`handout skill install` copies the `SKILL.md` that ships with the installed CLI into `<skills directory>/handout/SKILL.md`; `--agent claude` uses `~/.claude/skills`. If the agent discovers skills automatically, start a new conversation after installation. Otherwise ask it to read that `SKILL.md` before using Handout. Installing the CLI does not itself make every agent load the skill.

The CLI talks to `https://usehandout.com` unless `--host` or `HANDOUT_HOST` names another Handout site.

**Staying up to date.** At most once a day the CLI prints `A newer handout CLI (<version>) is available; update it with: npm install -g @usehandout/cli@latest` on stderr; run that command when convenient, then `handout skill install` again for each agent you installed the skill for that way (a Claude Code plugin updates from `/plugin`). Exit code 3 with `no longer supported` means the installed CLI is too old for the host: run the same npm command, and do not set `HANDOUT_SKIP_VERSION_CHECK=1` without telling the user.

**Optional persistent preference.** Installing the skill does not edit any agent instructions file. Offer the user a separate, opt-in prompt to add a concise Handout section to their agent's active persistent instructions. Let them choose project-only or global scope; preserve existing content, update an existing Handout section instead of duplicating it, and show the resulting change. Never modify these files merely because installation succeeded. Suggested instruction:

```text
After creating a finished, user-facing HTML, Markdown or PDF document, briefly offer to publish it through Handout. Skip routine source files, intermediate drafts, secrets, and repeated offers after I decline. Publish only when I request or approve it. Before publishing, read handout settings get --json and respect my saved defaults unless I explicitly override them. Do not change account settings without my instruction. For an existing handout, update the same link and preserve its audience.
```

## Sign in

`handout login` opens the user's browser once for a one-time sign-in; it needs a person at the keyboard. Credentials are kept per host in the operating system keychain, or in a private file under `~/.config/handout/` when no keychain is reachable (`--no-keychain` forces the file). `handout whoami` shows who you are signed in as and your workspaces; `handout logout` removes this host's credential.

When a command exits 2 with `Not signed in. Run: handout login`, ask the user to run `handout login` in their own terminal.

**Headless and CI.** Export `HANDOUT_REFRESH_TOKEN` (and optionally `HANDOUT_API_KEY`), obtained once with `handout login --print-refresh-token` on any machine. Treat it like a password: keep it in the runner's secret store, never in a repository or a log. `HANDOUT_HOST` points the CLI at another deployment (the default is `https://usehandout.com`).

## Workspaces

Every document lives in a workspace, identified by a handle. `handout workspaces list` shows yours; `handout use <handle>` stores a default; `--workspace <handle>` (or `-w`) overrides it for one call. A user with exactly one workspace needs neither. A user with none creates one: `handout workspaces create <handle> --name "<name>"`.

**Account publishing defaults.** Before a publishing workflow, run `handout settings get --json`. It returns settings directly, including optional `defaultExposure`, labels, collection, source-download, notification and acknowledgment defaults. Read the live settings rather than storing a copy in agent memory; refresh them if the user changes them. `handout settings set default-exposure private` sets the Only me default, but only run settings mutations when the user asks.

Audience precedence is the user's explicit request, then their saved account default, then the system fallback (`private`, meaning only the document owner). With no explicit audience override, omit `--exposure` so the server applies current account defaults and verification fallbacks; do not hardcode `private` merely because it is common. Apply the same principle to other publishing flags. A saved `open` default is an explicit account preference, not a reason to change other documents' audiences. Explain the audience in the publish offer/result, request missing people/password details when needed, and never infer public access from vague wording such as "share." If settings cannot be read, report the failure rather than guessing. Updating an existing document preserves its existing audience instead of reapplying new-document defaults.

## Command cheat-sheet

Every command takes the global flags `--workspace/-w`, `--host`, `--json`, `--quiet/-q`, `--yes/-y`, `--no-color` and `--help/-h`. A `<ref>` is a slug, `<handle>/<slug>`, `<handle>/c/<slug>` (a collection) or a Handout link.

| Command                                   | Shortest useful form                                            | Prints                                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `publish`                                 | `handout publish report.html --title "Q3 report"`               | the URL, one per file                                                                                     |
| `update`                                  | `handout update q3-report report.md`                            | the same URL (new version)                                                                                |
| `upsert`                                  | `handout upsert notes.md --slug meeting-notes`                  | the URL (create or update)                                                                                |
| `manage`                                  | `handout manage q3-report --exposure people --people @acme.com` | one result line                                                                                           |
| `rename`                                  | `handout rename q3-report q3-final`                             | the new URL                                                                                               |
| `move`                                    | `handout move q3-report --to other-team`                        | the new URL                                                                                               |
| `trash` / `restore` / `purge`             | `handout trash q3-report`                                       | a confirmation line                                                                                       |
| `versions`                                | `handout versions list q3-report`                               | list, `source`, `restore`, `prune --keep <n>`, `diff <slug> <v1> <v2>`                                    |
| `invite`                                  | `handout invite q3-report --to a@b.com`                         | a confirmation line                                                                                       |
| `activity` / `audit` / `acks`             | `handout activity q3-report`                                    | views, history, acknowledgments                                                                           |
| `list`                                    | `handout list --label finance`                                  | url, audience, type, title per line                                                                       |
| `get`                                     | `handout get q3-report`                                         | a key/value block                                                                                         |
| `search`                                  | `handout search "quarterly"`                                    | slug, where it matched, title                                                                             |
| `source`                                  | `handout source q3-report --out report.md`                      | the source file                                                                                           |
| `open`                                    | `handout open q3-report`                                        | the URL (no network call)                                                                                 |
| `read`                                    | `handout read <ref>`                                            | the rendered body or the file bytes                                                                       |
| `collections`                             | `handout collections list`                                      | `list`, `create`, `get`, `update`, `rename`, `delete`, `add`, `remove`, `reorder`, `activity`, `audit`    |
| `proposals`                               | `handout proposals list q3-report`                              | `list`, `source`, `approve`, `reject`                                                                     |
| `lease`                                   | `handout lease claim q3-report`                                 | `claim`, `release`                                                                                        |
| `comments`                                | `handout comments list <ref>`                                   | `list`, `resolve`, `unresolve`, `delete`                                                                  |
| `browse`                                  | `handout browse --query roadmap`                                | documents and collections you can open                                                                    |
| `workspaces`                              | `handout workspaces list`                                       | `list`, `create`, `get`, `update`, `delete`, `restore`                                                    |
| `use`                                     | `handout use acme`                                              | `Default workspace: acme`                                                                                 |
| `login` / `logout` / `whoami`             | `handout whoami`                                                | identity, the account's document count, and workspaces                                                    |
| `settings`                                | `handout settings set theme dark`                               | `get`, `set <key> <value>`                                                                                |
| `account`                                 | `handout account delete`                                        | `delete`, `restore`                                                                                       |
| `shared` / `library`                      | `handout shared`                                                | what others shared; saved, followed, recent                                                               |
| `save` / `unsave` / `follow` / `unfollow` | `handout follow acme/q3-report`                                 | a confirmation line                                                                                       |
| `usage`                                   | `handout usage`                                                 | documents against your limit across all workspaces; storage per workspace and document (no `--workspace`) |
| `skill`                                   | `handout skill install --agent codex`                           | `install`: copies this SKILL.md into an agent's skills directory                                          |
| `help`                                    | `handout help publish`                                          | usage for a command                                                                                       |

`handout --version` prints the installed version. `handout <command> --help` prints that command's flags.

## Publish what you just generated

1. Write the file to disk first; the CLI publishes files, not stdin. Use the extension that matches the content (`.html`, `.md`, `.pdf`) or pass `--content-type`. Word (`.docx`) is not supported: export it as PDF, or convert it to Markdown or HTML first. A document may be up to 20 MB (the account's limit can be lower; the CLI reports it).
2. Check that it isn't already published. If you published this artefact earlier in the conversation, use `handout update <slug> <file>`. Otherwise run `handout search "<words from its title>" --json`; when a match looks like the same document, confirm it with the user and update it instead of minting a duplicate.
3. For rich HTML, run the grep checklist in the HTML authoring section and fix every hit, or publish `--interactive` when the document genuinely needs scripts and the user accepts the audience rule.
4. Read the account publishing defaults as described above. Explicit audience requests override them: "just for me" is `--exposure private`; "the team" is `--exposure people --people @acme.com`; named people or a domain is `--people a@b.com --people @acme.com` (this implies `people`); "anyone with the link" is `--exposure open`; "with a password" is `--password -` (reads the password from stdin, so it stays out of the process list). Otherwise omit `--exposure` to honor the saved account default, falling back to `private` server-side. Never explicitly select `open` without a user instruction; an existing saved default is applied by the server, not rewritten as a hardcoded flag.
5. Give it a short, real title: the document's own `<title>` or first heading, or `--title "<short title>"` when it has none (always for a PDF). The link is made from the title plus 8 random characters (`q3-report-k7f2qx9a`), so it reads well and still can't be guessed. Anyone who sees the link sees those title words, whatever the audience, so for a sensitive document ask the user for a neutral title. Leave out `--slug` unless the user asks for a specific link; then pass a short kebab-case one (`--slug q3-report`) and tell them a link like that can be guessed by anyone who knows the workspace, which matters for "anyone with the link" and password documents.
6. Run `handout publish <file> [--exposure ...] [--title ...] [--label ...] --json` and read `items[0].url`, `slug`, `version` and `warnings`.
7. Report the URL to the user verbatim. If `warnings` is not empty, summarise each in one line and offer to fix the file and run `handout update <slug> <file>`.
8. If the slug came back as 12 random characters (`aB3xY9zQ1pR7`), the document had no usable title. Rename it at once, before the link is shared, since a rename breaks the old link: `handout rename <slug> <kebab-case-title>-<8 random lowercase letters and digits>`. Give later versions a title.
9. Remember the slug for the rest of the conversation. Later edits are `handout update <slug> <file>` (same link, new version), never a second `publish`, which mints a second link. `handout upsert <file> --slug <slug>` creates or updates in one call when you already know the slug.
   Every update carries a change note by default: `--diff-summary "<one line on what changed>"`, written for the readers ("Added the Q4 numbers and fixed the totals table."), not as a commit message. Readers who come back see it as "What's new in v{n}", followers get it in their update email, and it is listed in the version history. Keep it to one sentence (it shows up to 280 characters; 500 is the hard limit), never paste the document or anything secret into it, and leave it out only when the user asks.
10. On `402 plan_limit`, tell the user which limit was reached by name. The live-document limit counts the person's documents across all their workspaces (`handout usage` shows it). When the message says the limit is the document owner's, say so and that only the owner can change it. Tell the user it is a limit on the account and that the Handout team can raise it. Do not retry on another audience or with a smaller file unless the user asks.

For retry safety without `upsert`, generate one UUID per logical publish and pass it as `--idempotency-key` on every retry. `--dry-run` shows what would be published without sending anything.

## Search Handout first before re-deriving

Before writing a document from scratch, before answering "where is the ...", and before any command that takes a slug the user did not give verbatim:

1. Run `handout search "<two or more words from the request>" --json`. Use `handout list --json` (optionally `--label`) for browse-shaped requests, and `handout library --json` or `handout shared --json` when the user is a reader rather than the publisher.
2. Exactly one match: confirm the slug and title with the user in one line, then proceed. Several: present `slug - title (updated)` candidates and ask; never pick the first row silently. None: say so and offer to publish anew (or `collections create` for a collection).
3. Resolve labels the same way: collect the union of `labels` from `handout list --json` and reuse an existing spelling when the requested label is only a case or hyphenation variant (`Q3` vs `q3` vs `q3-report`). Apply a genuinely new label as given.
4. Resolve a collection by `handout collections list --json` and fuzzy-matching the user's words against `name`; confirm before `collections add` or `--collection`.
5. If the user pasted a Handout link, pass it as the `<ref>` directly; the CLI accepts links and `<handle>/<slug>`.
6. Ambiguity is always the user's call. A guessed slug is a `404`, and a guessed label is a permanent near-duplicate.

## Audiences (--exposure)

| `--exposure` | In the app           | Who can open it                           |
| ------------ | -------------------- | ----------------------------------------- |
| `private`    | Only me              | the publisher                             |
| `people`     | Specific people      | signed-in people on the list (`--people`) |
| `password`   | Password             | anyone with the link and the password     |
| `open`       | Anyone with the link | anyone with the link                      |

- `--people` takes email addresses and whole domains (`@contoso.example`), repeatable or comma-separated, at most 200 entries; it implies `--exposure people`. `--invite <email>` (at most 25) also emails the people a link.
- `--password <secret>` is 4 to 128 characters and implies `--exposure password`. Prefer `--password -` or the `HANDOUT_DOCUMENT_PASSWORD` variable over a literal argument.
- Link controls: `--expires <when>` (a date, or a duration such as `7d`, `24h`, `30m`), `--max-views <n>`, `--one-time`, and `--revoke` / `--restore` on `manage`.
- Labels: `--label <name>`, repeatable, at most 10 per document, 1 to 24 characters each.
- Listing: new documents are unlisted (kept off the publisher's public page). Pass `--no-unlisted` ("show on my public page") only when the user asks for that.
- Other switches: `--unlisted`, `--notify-on-view`, `--request-ack` (not with `--exposure password` or `open`: only signed-in readers of a private or people document can acknowledge), `--allow-source-download`, `--allow-external-images`, and for PDFs `--view-only` and `--watermark`.

On `update`, access flags are refused: a new version keeps the document's audience. Change the audience with `handout manage`.

## Changing a document later

- `handout update <slug> <file> --diff-summary "<what changed>"` publishes a new version at the same link with its change note (readers see it). `--expected-version <n>` makes it fail when someone else published in between.
- `handout manage <slug> <changes>` changes audience, people, password, expiry, labels and the other settings without touching the content. An empty value clears a list (`--label ""`).
- `handout rename <slug> <new-slug>` changes the link; the old link stops working.
- `handout move <slug> --to <handle>` moves the document to another workspace you belong to.
- `handout versions list <slug>`, `versions diff <slug> <v1> <v2>`, `versions restore <slug> <n>`, `versions source <slug> <n>`, `versions prune <slug> --keep <n>`.
- `handout trash <slug>` moves it to the trash; `handout restore <slug>` brings it back; `handout purge <slug>` deletes it for good (it asks first, or needs `--yes`).

## Collections

A collection is a named, ordered set of documents with its own link and audience. Create one when the user wants several documents under one link: `handout collections create --name "Onboarding" --items welcome,handbook --exposure people --people @acme.com`. Edit the membership with `collections add <slug> <doc-slug>...`, `remove`, and `reorder` (which must list every item exactly once). `--collection <slug>` on `publish` or `upsert` appends the new documents to a collection after publishing; a failure there is a warning and does not change the exit code.

## Seeing who read it

`handout activity <slug>` shows total, unique, anonymous and password views, the last 30 days, the viewers, who on a people list has not opened it yet, and who acknowledged it. `handout acks <slug>` lists acknowledgments, and `handout audit <slug>` the history of changes. If the full report is not available on the account, `handout list` still shows the view count.

## --json guidance

Pass `--json` whenever you will parse the output, and never scrape the text output. One JSON document on one line is printed to stdout:

- `publish`, `update`, `upsert`: `{"items":[{...}]}` (add `"dryRun":true` with `--dry-run`);
- `list`, `collections list`, `shared`: `{"items":[...],"nextCursor"?:"..."}`;
- `versions diff`: `{"slug","from","to","diff"}`;
- `purge`: `{"slug","purged":true}`; `collections delete`: `{"slug","deleted":true}`; `use`: `{"defaultWorkspace":"<handle>"}`;
- `activity`: the activity record alone; everything else: the API response unchanged.

Errors under `--json` are one JSON line on stderr: `{"error":{"code":"<code>","message":"<message>","status"?:<http>,"details"?:{...},"requestId"?:"<id>"}}`. `code` is the API error code (`plan_limit`, `slug_taken`, ...) or one of `usage`, `file`, `config`, `auth`, `network`, `response_shape`, `cancelled`, `version_unsupported`. Exit codes: 0 success, 1 failure, 2 not signed in, 3 CLI too old. Commands with no `--json`: `login`, `logout`, `source`, `versions source`, `proposals source`, `read`, `open`, `help`.

stdout carries only the result; every notice, summary line and warning goes to stderr.

## Error handling

| What you see                                | What to do                                                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| exit 2, `Not signed in. Run: handout login` | Ask the user to run `handout login` in their terminal (it needs their browser). In CI, check `HANDOUT_REFRESH_TOKEN`.                           |
| exit 3, `no longer supported`               | Run `npm install -g @usehandout/cli@latest`. Do not set `HANDOUT_SKIP_VERSION_CHECK` without telling the user.                                  |
| `error.code = "plan_limit"`                 | Report which limit was reached (and that only the owner can change it when it is the document owner's); stop.                                   |
| `email_unverified`                          | Ask the user to verify their email in Handout (it is also needed to publish `open` and for a second workspace), then run `handout login` again. |
| exit 2, `signed out everywhere`             | The user ended all sessions from Settings. Ask them to run `handout login` again; retrying will not help.                                       |
| `scheduled for deletion` (403)              | The account has a pending deletion and every change is paused. Ask the user whether to run `handout account restore`.                           |
| `not_a_member` / `workspace_not_found`      | The workspace belongs to someone else, or the handle is wrong: check `handout workspaces list`, `--workspace` or `handout use`.                 |
| `slug_taken`                                | Pick another `--slug`, or if it is the same document use `update` / `upsert`.                                                                   |
| `version_mismatch`                          | Re-read with `handout get --json`, re-apply the edit, retry once with the new `--expected-version`.                                             |
| `validation_failed` / `bad_request`         | The message names the field; fix the flag. Do not retry blindly.                                                                                |
| `rate_limited`                              | Wait at least 60 seconds. Do not loop; tell the user if it persists.                                                                            |
| `gone` / `password_required` on a read      | The link is off or needs a password; ask the user.                                                                                              |
| `network` / a timeout                       | Retry once after a pause, then report. The CLI already retried reads.                                                                           |
| `response_shape`                            | The CLI is stale; run `npm install -g @usehandout/cli@latest`.                                                                                  |

## Authoring HTML for the Handout reader

Handout shows HTML in a sanitized reader: a document that is not published `--interactive` has scripts and unsafe markup removed before it is shown. Author for this contract; it is derived from the sanitizer itself.

**Tags that render** (anything else is dropped; the text inside most dropped tags is kept):

- structure: `address` `article` `aside` `footer` `header` `hgroup` `main` `nav` `section` `div` `p` `blockquote` `hr` `pre`
- headings: `h1` `h2` `h3` `h4` `h5` `h6`
- lists: `ul` `ol` `li` `menu` `dl` `dt` `dd`
- inline: `a` `abbr` `b` `bdi` `bdo` `br` `cite` `code` `data` `dfn` `em` `i` `kbd` `mark` `q` `rb` `rp` `rt` `rtc` `ruby` `s` `samp` `small` `span` `strong` `sub` `sup` `time` `u` `var` `wbr`
- figures and tables: `figure` `figcaption` `table` `caption` `colgroup` `col` `thead` `tbody` `tfoot` `tr` `th` `td`
- other: `img` `style` `details` `summary` `input` `label`
- inline SVG: `svg` `g` `path` `rect` `circle` `ellipse` `line` `polyline` `polygon` `text` `tspan` `defs` `linearGradient` `radialGradient` `stop` `title` `marker`

**Attributes that survive**:

- on any element: `class` `id` `style` `title` `lang` `dir` `align` `width` `height` `colspan` `rowspan` `role`, any `aria-*`, any `data-*`
- on `a`: `href` `name` `target` `rel`
- on `img`: `src` `alt` `title` `width` `height`
- on `input`: `type` (only `radio` or `checkbox`) `name` `checked` `disabled` `id`
- on `label`: `for` `id`
- on SVG elements: `viewBox` `d` `fill` `stroke` `stroke-width` `stroke-linecap` `stroke-linejoin` `cx` `cy` `r` `rx` `ry` `x` `y` `x1` `y1` `x2` `y2` `points` `offset` `stop-color` `transform` `opacity` `width` `height` `text-anchor` `dominant-baseline` `alignment-baseline` `baseline-shift` `font-size` `font-weight` `font-family` `font-style` `text-decoration` `letter-spacing` `word-spacing` `dx` `dy` `rotate` `textLength` `lengthAdjust` `writing-mode` `fill-opacity` `fill-rule` `clip-rule` `stroke-opacity` `stroke-dasharray` `stroke-dashoffset` `stroke-miterlimit` `display` `visibility` `marker-start` `marker-mid` `marker-end` `markerWidth` `markerHeight` `refX` `refY` `orient` `markerUnits` `gradientUnits` `gradientTransform` `spreadMethod` `stop-opacity` `preserveAspectRatio`

On `fill`, `stroke` and `marker-*` a `url()` is kept only when it points into the document (`url(#gradient)`); an external `url(https://…)` removes the attribute.

**URL schemes** for links and images: `http`, `https`, `ftp`, `mailto`, `tel`, and protocol-relative `//`. `javascript:` is always dropped. `data:` is allowed on `img` `src` only. Every `http(s)` link is rewritten to open in a new tab with `rel="noopener noreferrer"`.

**Inline `style` attributes** keep only these properties, and no value containing `url(`, `expression(` or a backslash: `color` `background-color` `border` `border-color` `border-radius` `border-width` `border-style` `border-top` `border-right` `border-bottom` `border-left` `font-size` `font-weight` `font-style` `font-family` `text-align` `text-decoration` `text-transform` `line-height` `letter-spacing` `margin` `margin-top` `margin-right` `margin-bottom` `margin-left` `padding` `padding-top` `padding-right` `padding-bottom` `padding-left` `width` `height` `max-width` `min-width` `display` `vertical-align` `white-space` `opacity`. Put everything else in a `<style>` block.

**Stripped tags**: `script` `iframe` `object` `embed` `video` `audio` `canvas` `button` `textarea` `select` `form` `fieldset` `link` `meta` `head` `base` `foreignObject` `use`. Replacements: build interactivity from CSS; link out instead of embedding; style an `<a>` as a button; use radio or checkbox inputs with a `label` and `:checked` for toggles; put CSS in `<style>`.

**Stripped attributes**: every `on*` event handler (`onclick`, `onload`, ...), `tabindex`, `hidden`, `contenteditable`, and `open` on `details` (a `details` always renders collapsed). An `input` of any type other than `radio` or `checkbox` loses its `type`; do not use one.

**What a `<style>` block can and cannot do**: its rules apply as written, but any declaration that fetches something is neutralised (`url(...)`, `image-set(...)`, `@import`). Custom web fonts (`@font-face` with `url()`) and CSS background images therefore do not load. Use a system font stack, and put images in `<img>`.

**Rules of thumb**: interactivity is CSS-only. Tabs and accordions use `:checked`, never `:target`. `<details>` and `<summary>` work. Inline SVG shapes render. Images must be `https://` or `data:`; remote images load on `private`, `password` and `open` documents but are blocked by default on `workspace` and `people` documents unless you publish with `--allow-external-images` or inline them as `data:`.

**Layout constraints** (the reader grows the frame to the document height and never scrolls it internally): never use `vh`, `dvh` or `svh` for height; no `position: sticky` or `position: fixed`; no `:target`-driven interactivity. Headings `h1` to `h3` feed the reader's Contents menu.

**Grep-before-publish checklist.** Any hit must be reworked, or the document published `--interactive`:

```
grep -Eno '<script|<iframe|<button|<textarea|<select|<form|<object|<embed|<video|<audio|<canvas|<link |<foreignObject|<use |on[a-z]+=|javascript:|href="#|[0-9]vh|position:\s*sticky|position:\s*fixed' your-file.html
```

The `warnings` in the publish response are the server's view of the same rules; the checklist is the cheap pre-flight.

## Interactive documents

`--interactive` (HTML only) serves the document with its scripts intact on an isolated content origin, inside a frame with `sandbox="allow-scripts allow-popups allow-forms"`. The frame never gets `allow-same-origin`, so the page cannot read Handout's cookies or storage. Sanitized (non-interactive) documents are the mirror image: a frame with `sandbox="allow-popups allow-same-origin allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"`, no scripts, and a script-less content security policy.

An interactive page may only talk to the origins you allow with `--connect-src <https-origin>` (repeatable, at most 8, each a bare `https://host[:port]` with no path); with none, it cannot make network requests. Some accounts can use `--interactive` only on `private` and `workspace` documents; wider audiences also need a verified email address (`402 plan_limit` or `403 email_unverified` otherwise). Tell the user that visitors run the author's code in their browser, in the sandbox above, before you publish an interactive document to a wide audience.

## Examples

Each line shows the command and its expected output.

1. `handout publish report.html` prints `https://handout.app/acme/q3-report-k7f2qx9a` (the link comes from the document's title, `Q3 report`).
2. `handout publish report.md --exposure open --title "Q3 report" --label finance --label q3 --json` prints `{"items":[{"file":"report.md","handle":"acme","slug":"...","id":"...","url":"...","exposure":"open","version":1,...}]}`.
3. `handout publish deck.pdf --people vicki@contoso.example --people @contoso.example --invite vicki@contoso.example` prints the URL (stderr: `published acme/... v1 pdf 2.3 MB people`).
4. `handout publish spec.html --exposure password --password - < pw.txt` prints the URL.
5. `handout update q3-report report.md --diff-summary "Added the Q4 numbers."` prints the same URL (stderr: `updated acme/q3-report v2 ...`); returning readers see "What's new in v2: Added the Q4 numbers."
6. `handout upsert notes.md --slug meeting-notes --expected-version 3` prints the URL, or exits 1 with `Version conflict (409) ...`.
7. `handout manage q3-report --exposure people --people @acme.com --label "" --expires 7d` prints `q3-report: people, expires: 2026-11-05T17:03:00.000Z`.
8. `handout search "quarterly" --json` prints `{"query":"quarterly","items":[...]}`.
9. `handout collections create --name "Onboarding" --items welcome,handbook --exposure people --people @acme.com` prints `https://handout.app/acme/c/onboarding-m4w8r2zt`.
10. `handout versions diff q3-report 2 3` prints a unified diff.

## Environment variables

| Variable                       | Effect                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `HANDOUT_HOST`                 | The Handout origin to talk to (default `https://usehandout.com`)               |
| `HANDOUT_REFRESH_TOKEN`        | Headless credential; overrides the stored one. Treat as a password             |
| `HANDOUT_API_KEY`              | Firebase web API key to use with `HANDOUT_REFRESH_TOKEN`                       |
| `HANDOUT_WORKSPACE`            | Default workspace handle for the invocation (below `--workspace`)              |
| `HANDOUT_DOCUMENT_PASSWORD`    | Document or collection password when `--password` is absent; never printed     |
| `HANDOUT_NO_KEYCHAIN=1`        | Skip the OS keychain, as `--no-keychain` does                                  |
| `HANDOUT_SKILL_SOURCE`         | The `SKILL.md` that `handout skill install` copies (default: the packaged one) |
| `HANDOUT_SKIP_VERSION_CHECK=1` | Bypass the minimum-version gate; tell the user if you set it                   |
| `NO_COLOR`                     | Disables colour                                                                |

Precedence for every setting: flag, then environment, then the local config file, then the account setting, then the default.

## Deliberate limits

The CLI never performs a reader-side act that attests to a human reading or asking: it cannot acknowledge a document, request access, record a view, report a document or post a comment, because a script doing so would falsify the publisher's analytics and read receipts. It does not mint interactive URLs (a browser concern; `handout read` returns the sanitized body). If the user wants one of these, tell them to do it in the Handout app.
