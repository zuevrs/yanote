import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const preflightScriptPath = path.resolve("scripts/release/preflight.sh");

async function loadPreflightSource() {
  return readFile(preflightScriptPath, "utf8");
}

test("preflight source pins the stable release-tag gate and exact tag diagnostics", async () => {
  const source = await loadPreflightSource();
  assert.match(source, /\^v\(\[0-9\]\+\)\\\.\(\[0-9\]\+\)\\\.\(\[0-9\]\+\)\$/);
  assert.match(source, /prerelease-tag/);
  assert.match(source, /non-annotated-tag/);
  assert.match(source, /unsigned-tag/);
  assert.match(source, /main-lineage/);
  assert.match(source, /invalid-tag-format/);
  assert.match(source, /missing-tag-ref/);
});

test("preflight source enforces snapshot, signing-key, freeze, and credential policy", async () => {
  const source = await loadPreflightSource();
  assert.match(source, /snapshot-version/);
  assert.match(source, /release-freeze/);
  assert.match(source, /missing-credentials/);
  assert.match(source, /invalid-signing-public-key/);
  assert.match(source, /untrusted-signing-public-key/);
  assert.match(source, /RELEASE_TAG_SIGNING_PUBLIC_KEY/);
  assert.match(source, /JRELEASER_MAVENCENTRAL_USERNAME/);
  assert.match(source, /JRELEASER_MAVENCENTRAL_PASSWORD/);
  assert.match(source, /JRELEASER_GPG_SECRET_KEY/);
  assert.match(source, /JRELEASER_GPG_PUBLIC_KEY/);
  assert.match(source, /JRELEASER_GPG_PASSPHRASE/);
});

test("preflight source emits the runtime output contract consumed by later release steps", async () => {
  const source = await loadPreflightSource();
  assert.match(source, /release-tag=/);
  assert.match(source, /project-version=/);
  assert.match(source, /tag-signing-key-fingerprint=/);
  assert.match(source, /retry-eligible=/);
  assert.match(source, /retry_reason=/);
  assert.match(source, /preflight-status=pass/);
  assert.match(source, /classify_retry_eligibility/);
});
