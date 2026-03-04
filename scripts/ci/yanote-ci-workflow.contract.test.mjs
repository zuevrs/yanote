import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const workflowPath = path.resolve(".github/workflows/yanote-ci.yml");
const gradleHelperPath = path.resolve("scripts/ci/run-yanote-gradle-check.sh");

async function loadWorkflowSource() {
  return readFile(workflowPath, "utf8");
}

async function loadGradleHelperSource() {
  return readFile(gradleHelperPath, "utf8");
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

test("workflow runs Java 21 assertion in required jobs", async () => {
  const source = await loadWorkflowSource();
  const assertionCalls = source.match(/bash scripts\/ci\/assert-java21\.sh/g) ?? [];
  assert.ok(
    assertionCalls.length >= 2,
    "Expected Java assertion script to run in both required checks."
  );
  assert.match(source, /Setup Java 21[\s\S]*?bash scripts\/ci\/assert-java21\.sh/);
});

test("workflow delegates validation execution to Gradle parity helper", async () => {
  const source = await loadWorkflowSource();
  assert.match(
    source,
    /- name:\s*Run Yanote validation[\s\S]*?run:\s*bash scripts\/ci\/run-yanote-gradle-check\.sh/
  );
});

test("gradle parity helper executes rooted yanoteCheck invocation", async () => {
  const source = await loadGradleHelperSource();
  assert.match(source, /\.\/gradlew\b[\s\S]*\byanoteCheck\b/);
});

test("workflow no longer runs direct CLI report command as primary validation path", async () => {
  const source = await loadWorkflowSource();
  assert.doesNotMatch(source, /node\s+yanote-js\/dist\/yanote\.cjs\s+report/);
});

test("workflow keeps always-on triage sequence after validation execution", async () => {
  const source = await loadWorkflowSource();
  assert.match(
    source,
    /- name:\s*Collect Yanote artifacts[\s\S]*?if:\s*\$\{\{\s*always\(\)\s*\}\}/
  );
  assert.match(
    source,
    /- name:\s*Render Yanote GitHub summary[\s\S]*?if:\s*\$\{\{\s*always\(\)\s*\}\}/
  );
  assert.match(
    source,
    /- name:\s*Upload Yanote artifacts[\s\S]*?if:\s*\$\{\{\s*always\(\)\s*\}\}/
  );
  assert.match(
    source,
    /- name:\s*Enforce Yanote validation result[\s\S]*?if:\s*\$\{\{\s*always\(\)\s*&&/
  );
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
