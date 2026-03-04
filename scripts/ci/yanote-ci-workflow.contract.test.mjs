import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const workflowPath = path.resolve(".github/workflows/yanote-ci.yml");

async function loadWorkflowSource() {
  return readFile(workflowPath, "utf8");
}

test("workflow defines stable required check job names", async () => {
  const source = await loadWorkflowSource();
  assert.match(source, /^\s*build-and-test:\s*$/m);
  assert.match(source, /^\s*yanote-validation:\s*$/m);
});

test("workflow supports pull request and merge-group triggers", async () => {
  const source = await loadWorkflowSource();
  assert.match(source, /^\s*pull_request:\s*$/m);
  assert.match(source, /^\s*merge_group:\s*$/m);
});

test("workflow pins Java 21 in required jobs", async () => {
  const source = await loadWorkflowSource();
  assert.match(source, /java-version:\s*['"]?21['"]?/);
});
