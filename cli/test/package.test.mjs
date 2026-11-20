// Release checks for the published package, run by .github/workflows/release.yml before
// `npm stage publish` (and by Handout's own export tests). No dependencies: node:test only.
//
//   node --test "cli/test/*.test.mjs"
//
// RELEASE_TAG, when set (the pushed tag, e.g. skill-v1.3.0), must name this package's version.

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const CLI = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOT = dirname(CLI);
const pkg = JSON.parse(await readFile(join(CLI, "package.json"), "utf8"));

function run(file, args, env = {}) {
  return new Promise((done) => {
    execFile(
      file,
      args,
      { env: { ...process.env, HANDOUT_SKIP_VERSION_CHECK: "1", ...env }, encoding: "utf8" },
      (error, stdout, stderr) =>
        done({ code: error === null ? 0 : (error.code ?? 1), stdout, stderr }),
    );
  });
}

let home;
before(async () => {
  home = await mkdtemp(join(tmpdir(), "handout-package-test-"));
});
after(async () => {
  await rm(home, { recursive: true, force: true });
});

describe("the package", () => {
  it("is @usehandout/cli with the handout bin, Node 24+, and nothing but the bundle, skill and keychain binding", () => {
    assert.equal(pkg.name, "@usehandout/cli");
    assert.deepEqual(pkg.bin, { handout: "handout.mjs" });
    assert.equal(pkg.engines.node, ">=24");
    assert.deepEqual(pkg.files, ["handout.mjs", "SKILL.md", "setup/SKILL.md", "NOTICE"]);
    assert.equal(pkg.license, "Apache-2.0");
    assert.equal(pkg.repository.url, "git+https://github.com/usehandout/handout.git");
    assert.equal(pkg.dependencies, undefined, "the bundle has no required runtime dependencies");
    // The OS keychain binding is optional (an install never fails without it) and pinned exactly:
    // a new version of a native binary is a reviewed change, never a range resolved at install.
    assert.deepEqual(pkg.optionalDependencies, { "@napi-rs/keyring": "2.1.2" });
    for (const version of Object.values(pkg.optionalDependencies)) {
      assert.match(version, /^\d+\.\d+\.\d+$/, "exact version pins only");
    }
    assert.equal(pkg.scripts, undefined, "no install scripts");
    assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  });

  it("matches the pushed tag", { skip: process.env.RELEASE_TAG === undefined }, () => {
    assert.equal(process.env.RELEASE_TAG, `skill-v${pkg.version}`);
  });

  it("packs exactly the files it should", async () => {
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const packed = await new Promise((done) => {
      execFile(
        npm,
        ["pack", "--dry-run", "--json"],
        { cwd: CLI, encoding: "utf8", shell: process.platform === "win32" },
        (error, stdout, stderr) => done({ error, stdout, stderr }),
      );
    });
    assert.equal(packed.error, null, packed.stderr);
    const files = JSON.parse(packed.stdout)[0]
      .files.map((f) => f.path)
      .sort();
    assert.deepEqual(files, [
      "LICENSE",
      "NOTICE",
      "README.md",
      "SKILL.md",
      "handout.mjs",
      "package.json",
      "setup/SKILL.md",
    ]);
  });
});

describe("the CLI", () => {
  it("reports the package version", async () => {
    const result = await run(process.execPath, [join(CLI, "handout.mjs"), "--version"]);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.stdout.trim(), `handout ${pkg.version}`);
  });

  for (const [agent, parts] of [
    ["claude", [".claude", "skills"]],
    ["codex", [".agents", "skills"]],
  ]) {
    it(`skill install --agent ${agent} copies the packaged SKILL.md and setup skill`, async () => {
      const env = { HOME: home, USERPROFILE: home };
      const result = await run(
        process.execPath,
        [join(CLI, "handout.mjs"), "skill", "install", "--agent", agent],
        env,
      );
      assert.equal(result.code, 0, result.stderr);
      const installed = await readFile(join(home, ...parts, "handout", "SKILL.md"), "utf8");
      assert.equal(installed, await readFile(join(CLI, "SKILL.md"), "utf8"));
      const setup = await readFile(join(home, ...parts, "handout-setup", "SKILL.md"), "utf8");
      assert.equal(setup, await readFile(join(CLI, "setup", "SKILL.md"), "utf8"));
      assert.match(setup, /^---\nname: handout-setup\n/);
    });
  }

  it("setup print-instructions prints the marked block and writes nothing", async () => {
    const env = { HOME: home, USERPROFILE: home };
    const result = await run(
      process.execPath,
      [join(CLI, "handout.mjs"), "setup", "print-instructions", "--agent", "claude", "--json"],
      env,
    );
    assert.equal(result.code, 0, result.stderr);
    const data = JSON.parse(result.stdout);
    assert.match(data.block, /^<!-- handout:begin v\d+ -->\n[\s\S]+\n<!-- handout:end -->$/);
    assert.equal(data.status, "new-file");
    await assert.rejects(readFile(join(home, ".claude", "CLAUDE.md"), "utf8"));
  });
});

describe("the Claude Code plugin", () => {
  it("ships the same SKILL.md as the package, at the same version", async () => {
    const plugin = join(ROOT, "plugins", "handout");
    assert.equal(
      await readFile(join(plugin, "skills", "handout", "SKILL.md"), "utf8"),
      await readFile(join(CLI, "SKILL.md"), "utf8"),
    );
    const manifest = JSON.parse(
      await readFile(join(plugin, ".claude-plugin", "plugin.json"), "utf8"),
    );
    assert.equal(manifest.name, "handout");
    assert.equal(manifest.version, pkg.version);
  });

  it("ships the setup skill as /handout:setup: the package's file with name: setup", async () => {
    const plugin = join(ROOT, "plugins", "handout");
    const packaged = await readFile(join(CLI, "setup", "SKILL.md"), "utf8");
    assert.equal(
      await readFile(join(plugin, "skills", "setup", "SKILL.md"), "utf8"),
      packaged.replace(/^---\nname: handout-setup\n/, "---\nname: setup\n"),
    );
  });

  it("is listed in the usehandout marketplace", async () => {
    const marketplace = JSON.parse(
      await readFile(join(ROOT, ".claude-plugin", "marketplace.json"), "utf8"),
    );
    assert.equal(marketplace.name, "usehandout");
    assert.deepEqual(
      marketplace.plugins.map((p) => [p.name, p.source]),
      [["handout", "./plugins/handout"]],
    );
  });
});
