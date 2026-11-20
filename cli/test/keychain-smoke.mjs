// Keychain smoke test of the INSTALLED package, run by .github/workflows/release.yml on macOS,
// Windows and Linux before the package is staged on npm. No dependencies: Node built-ins only.
//
//   HANDOUT_KEYCHAIN_SMOKE=1 node cli/test/keychain-smoke.mjs <dir of the installed @usehandout/cli>
//
// It proves that `npm install` brought the platform's keychain binding (an optional dependency),
// and that the installed `handout` moves a 1.5.0-era login into the real OS keychain exactly once
// and removes it on logout. The login is shaped like a real one: about 1,600 bytes of JSON written
// the way 1.5.0 wrote it, an expired ID token (so the first command refreshes it), and the 1.5.0
// config's `credentials: "file"`. The credential is for a loopback host served by this script
// (which also answers the token refresh), so it can never collide with a real sign-in; it uses
// dev-only values and deletes what it writes. It touches the real keychain, so it refuses to run
// without HANDOUT_KEYCHAIN_SMOKE=1.

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

if (process.env.HANDOUT_KEYCHAIN_SMOKE !== "1") {
  process.stderr.write(
    "keychain-smoke: set HANDOUT_KEYCHAIN_SMOKE=1 (it uses the real keychain)\n",
  );
  process.exit(2);
}
const pkgDir = process.argv[2];
if (pkgDir === undefined) {
  process.stderr.write("usage: keychain-smoke.mjs <dir of the installed @usehandout/cli>\n");
  process.exit(2);
}
const CLI = resolve(pkgDir, "handout.mjs");
await stat(CLI);

// The binding as the installed CLI resolves it: from the package's own location.
const { Entry } = createRequire(CLI)("@napi-rs/keyring");
const NOTICE =
  "Your Handout login moved to the system keychain. To keep it in a file instead, run handout login --no-keychain.";

/** About the size of a real Firebase ID token (a JWT) and refresh token. */
const idToken = (tag) => `dev-only-smoke-${tag}-id-token.${"i".repeat(1000)}.${"s".repeat(60)}`;
const REFRESH_TOKEN = `dev-only-smoke-refresh-token-${"r".repeat(270)}`;
const REFRESHED_ID_TOKEN = idToken("refreshed");

/** @type {{ url: string | undefined, authorization: string | undefined }[]} */
const seen = [];
let refreshes = 0;
let port = 0;
const server = createServer((req, res) => {
  const json = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (req.url === "/config.json") {
    // The emulator host sends the loopback host's token refresh back to this server.
    json(200, {
      firebase: { apiKey: "dev-only-smoke-api-key", authEmulatorHost: `127.0.0.1:${port}` },
    });
    return;
  }
  if (req.url?.startsWith("/securetoken.googleapis.com/v1/token")) {
    refreshes += 1;
    json(200, { id_token: REFRESHED_ID_TOKEN, refresh_token: REFRESH_TOKEN, expires_in: "3600" });
    return;
  }
  // The version check's manifest request is answered 404 too (the check then stays silent).
  if (req.url?.startsWith("/api/")) {
    seen.push({ url: req.url, authorization: req.headers.authorization });
  }
  json(404, { error: { code: "not_found", message: "keychain smoke" } });
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const address = server.address();
assert.ok(address !== null && typeof address === "object");
port = address.port;
const HOST = `http://127.0.0.1:${port}`;
const entry = new Entry("handout", HOST, { linux: { store: "secret-service" } });

const credential = {
  v: 1,
  appHost: HOST,
  apiKey: "dev-only-smoke-api-key",
  uid: "dev-only-smoke-uid-0000000000",
  email: "dev-only-smoke@example.invalid",
  idToken: idToken("expired"),
  idTokenExpiresAt: Date.now() - 86_400_000,
  refreshToken: REFRESH_TOKEN,
};
/** The file exactly as CLI 1.5.0 wrote it. */
const fileText = `${JSON.stringify(credential, null, 2)}\n`;
assert.ok(Buffer.byteLength(fileText) > 1550, "the smoke login must be realistic in size");

const home = await mkdtemp(join(tmpdir(), "handout-keychain-smoke-"));
const configDir = join(home, "handout");
const configFile = join(configDir, "config.json");
const file = join(
  configDir,
  `credentials-${createHash("sha256").update(HOST).digest("hex").slice(0, 16)}.json`,
);
const env = {
  ...process.env,
  XDG_CONFIG_HOME: home,
  HANDOUT_SKIP_VERSION_CHECK: "1",
  HANDOUT_NO_KEYCHAIN: "",
  HANDOUT_REFRESH_TOKEN: "",
};

function handout(args) {
  return new Promise((done) => {
    execFile(
      process.execPath,
      [CLI, ...args, "--host", HOST],
      { env, encoding: "utf8" },
      (error, stdout, stderr) =>
        done({ code: error === null ? 0 : (error.code ?? 1), stdout, stderr }),
    );
  });
}

function keychainCredential() {
  const stored = entry.getSecret();
  assert.ok(stored !== null, "the keychain holds no credential");
  return JSON.parse(Buffer.from(stored).toString("utf8"));
}

try {
  await mkdir(configDir, { recursive: true, mode: 0o700 });
  await writeFile(file, fileText, { mode: 0o600 });
  await writeFile(configFile, `${JSON.stringify({ v: 1, credentials: "file" }, null, 2)}\n`);

  // The first command moves the login into the keychain, refreshes the expired ID token and
  // keeps the refreshed one there (the /api/me 404 is expected).
  const first = await handout(["whoami"]);
  assert.equal(first.stderr.split(NOTICE).length - 1, 1, `not one notice:\n${first.stderr}`);
  assert.equal(refreshes, 1, "the expired ID token was not refreshed");
  assert.deepEqual(
    seen.map((call) => [call.url, call.authorization === `Bearer ${REFRESHED_ID_TOKEN}`]),
    [["/api/me", true]],
    "the API call did not carry the refreshed ID token",
  );
  await assert.rejects(readFile(file), { code: "ENOENT" }, "the file was not deleted");
  assert.equal(keychainCredential().idToken, REFRESHED_ID_TOKEN, "the refresh left the keychain");
  assert.deepEqual(
    JSON.parse(await readFile(configFile, "utf8")),
    { v: 1 },
    "the 1.5.0 config key stayed",
  );

  // A second run reads the keychain and says nothing more.
  const again = await handout(["whoami"]);
  assert.ok(!again.stderr.includes(NOTICE), "the notice showed twice");
  assert.equal(refreshes, 1, "the second run refreshed again");
  assert.equal(seen.length, 2);
  assert.equal(seen[1]?.authorization, `Bearer ${REFRESHED_ID_TOKEN}`, "second run lost the token");

  // A half-finished move (the file back beside the keychain entry) completes silently.
  await writeFile(file, fileText, { mode: 0o600 });
  const healed = await handout(["whoami"]);
  assert.ok(!healed.stderr.includes(NOTICE), "the notice showed for a half-finished move");
  await assert.rejects(readFile(file), { code: "ENOENT" }, "the left-over file was not deleted");
  // The left-over copy wins (its ID token has expired), so the run refreshes it into the keychain.
  assert.equal(refreshes, 2, "the healed login was not refreshed");
  assert.equal(keychainCredential().idToken, REFRESHED_ID_TOKEN, "the healed login is stale");
  assert.equal(keychainCredential().refreshToken, REFRESH_TOKEN);

  // Logout removes it from the keychain.
  const logout = await handout(["logout"]);
  assert.equal(logout.code, 0, logout.stderr);
  assert.equal(logout.stdout.trim(), `Signed out of ${HOST}`);
  assert.equal(entry.getSecret(), null, "the keychain still holds the credential");
  process.stdout.write(`keychain-smoke: ok on ${process.platform}-${process.arch}\n`);
} finally {
  try {
    entry.deleteCredential();
  } catch {
    // already gone
  }
  server.close();
  await rm(home, { recursive: true, force: true });
}
