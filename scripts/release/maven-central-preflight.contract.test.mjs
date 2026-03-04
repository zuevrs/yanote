import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const preflightScriptPath = path.resolve("scripts/release/preflight.sh");

async function loadPreflightSource() {
  return readFile(preflightScriptPath, "utf8");
}

test("preflight enforces stable semver release tags", async () => {
  const source = await loadPreflightSource();
  assert.match(source, /v[0-9]+\.[0-9]+\.[0-9]+/);
  assert.match(source, /-beta/);
  assert.match(source, /-rc/);
});

test("preflight verifies signed tags and ancestry from main", async () => {
  const source = await loadPreflightSource();
  assert.match(source, /verify_release_tag_signature/);
  assert.match(source, /git verify-tag/);
  assert.match(source, /git fetch --force --tags/);
  assert.match(source, /git cat-file -t/);
  assert.match(source, /RELEASE_TAG_SIGNING_PUBLIC_KEY/);
  assert.match(source, /gpg --batch --import/);
  assert.match(source, /gpg --import-ownertrust/);
  assert.match(source, /merge-base --is-ancestor/);
  assert.match(source, /origin\/main|main/);
});

test("preflight blocks snapshots and missing Central or signing credentials", async () => {
  const source = await loadPreflightSource();
  assert.match(source, /SNAPSHOT/);
  assert.match(source, /JRELEASER_MAVENCENTRAL_USERNAME/);
  assert.match(source, /JRELEASER_MAVENCENTRAL_PASSWORD/);
  assert.match(source, /JRELEASER_GPG_SECRET_KEY/);
  assert.match(source, /JRELEASER_GPG_PUBLIC_KEY/);
  assert.match(source, /JRELEASER_GPG_PASSPHRASE/);
});
