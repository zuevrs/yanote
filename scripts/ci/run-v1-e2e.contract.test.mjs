import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/run-v1-e2e.sh");

async function loadScriptSource() {
  return readFile(scriptPath, "utf8");
}

test("v1 e2e script uses deterministic compose file path", async () => {
  const source = await loadScriptSource();
  assert.match(source, /docker compose -f examples\/docker-compose\.yml/);
});

test("v1 e2e script propagates report service exit code", async () => {
  const source = await loadScriptSource();
  assert.match(source, /--exit-code-from report/);
});

test("v1 e2e script always tears down compose resources", async () => {
  const source = await loadScriptSource();
  assert.match(source, /docker compose -f examples\/docker-compose\.yml down/);
});
