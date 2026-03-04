import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/assert-java21.sh");

async function loadScriptSource() {
  return readFile(scriptPath, "utf8");
}

test("java assertion script inspects runtime via java -version", async () => {
  const source = await loadScriptSource();
  assert.match(source, /java -version/);
});

test("java assertion script validates major version is 21", async () => {
  const source = await loadScriptSource();
  assert.match(source, /major[^\\n]*21|21[^\\n]*major/);
});

test("java assertion script prints actionable setup-java guidance", async () => {
  const source = await loadScriptSource();
  assert.match(source, /actions\/setup-java/);
  assert.match(source, /java-version/);
});
