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

test("fail-closed diagnostics keep deterministic class ordering and grouped rendering", async () => {
  const source = await loadPreflightSource();
  assert.match(source, /DIAGNOSTIC_CLASS_ORDER=\(input policy auth transient\)/);
  assert.match(source, /render_diagnostics\(\)/);
  assert.match(source, /render_group/);
  assert.match(source, /LC_ALL=C sort/);
  assert.match(source, /diagnostic-class=\$\{class_name\} code=\$\{code\}/);
});

test("preflight source preserves exact fail-closed codes for runtime-tested rejection paths", async () => {
  const source = await loadPreflightSource();
  for (const code of [
    "missing-tag",
    "invalid-tag-format",
    "prerelease-tag",
    "non-annotated-tag",
    "unsigned-tag",
    "main-lineage",
    "snapshot-version",
    "release-freeze",
    "missing-credentials",
    "retry-eligibility",
  ]) {
    assert.match(source, new RegExp(code));
  }
});

test("preflight source preserves deterministic retry-eligibility outputs", async () => {
  const source = await loadPreflightSource();
  assert.match(source, /retry-eligible=/);
  assert.match(source, /retry_reason=/);
  assert.match(source, /retry-reason=/);
  assert.match(source, /transient-network/);
  assert.match(source, /non-transient/);
});

test("jreleaser contract targets Maven Central and enforces signing rules", async () => {
  const config = await loadJreleaserConfig();
  assert.match(config, /mavenCentral/);
  assert.match(config, /applyMavenCentralRules/);
  assert.match(config, /signing/);
});
