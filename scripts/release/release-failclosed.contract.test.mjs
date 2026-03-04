import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const preflightScriptPath = path.resolve("scripts/release/preflight.sh");
const jreleaserConfigPath = path.resolve("jreleaser.yml");

async function loadPreflightSource() {
  return readFile(preflightScriptPath, "utf8");
}

async function loadJreleaserConfig() {
  return readFile(jreleaserConfigPath, "utf8");
}

test("fail-closed diagnostics encode deterministic class ordering", async () => {
  const source = await loadPreflightSource();
  assert.match(source, /DIAGNOSTIC_CLASS_ORDER/);
  assert.match(source, /input/);
  assert.match(source, /policy/);
  assert.match(source, /auth/);
  assert.match(source, /transient/);
});

test("preflight emits deterministic retry-eligibility diagnostics", async () => {
  const source = await loadPreflightSource();
  assert.match(source, /retry-eligible/);
  assert.match(source, /retry_reason|retry-reason/);
});

test("jreleaser contract targets Maven Central and enforces signing rules", async () => {
  const config = await loadJreleaserConfig();
  assert.match(config, /mavenCentral/);
  assert.match(config, /applyMavenCentralRules/);
  assert.match(config, /signing/);
});
