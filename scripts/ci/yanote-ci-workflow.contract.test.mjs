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

test("workflow adds push path for main and release refs", async () => {
  const source = await loadWorkflowSource();
  assert.match(source, /^\s*push:\s*$/m);
  assert.match(source, /-\s*main\s*$/m);
  assert.match(source, /-\s*release\/\*\*\s*$/m);
});

test("workflow runs full v1 e2e job only on push main/release refs", async () => {
  const source = await loadWorkflowSource();
  assert.match(source, /^\s*v1-e2e:\s*$/m);
  assert.match(source, /github\.event_name\s*==\s*['"]push['"]/);
  assert.match(source, /github\.ref\s*==\s*['"]refs\/heads\/main['"]/);
  assert.match(source, /startsWith\(github\.ref,\s*['"]refs\/heads\/release\/['"]\)/);
  assert.match(source, /run:\s*bash scripts\/ci\/run-v1-e2e\.sh/);
});
