import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const workflowPath = path.resolve(".github/workflows/yanote-ci.yml");
const branchProtectionPath = path.resolve(".github/BRANCH_PROTECTION.md");
const gradleHelperPath = path.resolve("scripts/ci/run-yanote-gradle-check.sh");

async function loadWorkflowSource() {
  return readFile(workflowPath, "utf8");
}

async function loadBranchProtectionSource() {
  return readFile(branchProtectionPath, "utf8");
}

async function loadGradleHelperSource() {
  return readFile(gradleHelperPath, "utf8");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractJobBlock(source, jobName, nextJobName) {
  const current = escapeRegex(jobName);
  const next = nextJobName ? `^  ${escapeRegex(nextJobName)}:\s*$` : "$";
  const regex = new RegExp(`^  ${current}:\\s*$([\\s\\S]*?)(?=${next})`, "m");
  const match = source.match(regex);
  assert.ok(match, `Expected workflow to contain job block for ${jobName}.`);
  return match[1];
}

test("workflow defines stable required check job names", async () => {
  const source = await loadWorkflowSource();
  assert.match(source, /^\s*build-and-test:\s*$/m);
  assert.match(source, /^\s*yanote-validation:\s*$/m);
});

test("branch protection keeps the required check names stable", async () => {
  const source = await loadBranchProtectionSource();
  assert.match(source, /- `build-and-test`/);
  assert.match(source, /- `yanote-validation`/);
  assert.match(source, /Do not rename these jobs/);
});

test("workflow keeps required-check dependency topology stable", async () => {
  const source = await loadWorkflowSource();
  assert.match(source, /^\s*yanote-validation:\s*$[\s\S]*?^\s*needs:\s*build-and-test\s*$/m);
  assert.match(source, /^\s*v1-e2e:\s*$[\s\S]*?^\s*needs:\s*yanote-validation\s*$/m);
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

test("build-and-test checks out full history for path-sensitive proof decisions", async () => {
  const source = await loadWorkflowSource();
  const buildJob = extractJobBlock(source, "build-and-test", "yanote-validation");
  assert.match(buildJob, /uses:\s*actions\/checkout@v5[\s\S]*?fetch-depth:\s*0/);
});

test("workflow runs script and release contract suites in CI", async () => {
  const source = await loadWorkflowSource();
  const buildJob = extractJobBlock(source, "build-and-test", "yanote-validation");
  assert.match(buildJob, /- name:\s*Run script and release contract suites/);
  assert.match(buildJob, /node --test scripts\/ci\/\*\.test\.mjs scripts\/release\/\*\.test\.mjs/);
});

test("workflow determines delivery-sensitive scope from PR changes and merge_group", async () => {
  const source = await loadWorkflowSource();
  const buildJob = extractJobBlock(source, "build-and-test", "yanote-validation");
  assert.match(buildJob, /- name:\s*Determine delivery-sensitive proof scope/);
  assert.match(buildJob, /id:\s*detect-delivery-proof/);
  assert.match(buildJob, /case "\$\{GITHUB_EVENT_NAME\}" in/);
  assert.match(buildJob, /merge_group\)[\s\S]*?should_run=true/);
  assert.match(buildJob, /pull_request\)[\s\S]*?github\.event\.pull_request\.base\.sha/);
  assert.match(buildJob, /git diff --name-only/);
  assert.match(buildJob, /examples\/\|scripts\/ci\/\|yanote-recorder-spring-mvc\/\|yanote-recorder-spring-kafka\/\|yanote-gradle-plugin\//);
});

test("workflow runs delivery-sensitive v1 e2e proof inside build-and-test without adding a required job", async () => {
  const source = await loadWorkflowSource();
  const buildJob = extractJobBlock(source, "build-and-test", "yanote-validation");
  assert.match(buildJob, /- name:\s*Run delivery-sensitive v1 e2e proof/);
  assert.match(buildJob, /id:\s*run-delivery-proof/);
  assert.match(buildJob, /bash scripts\/ci\/run-v1-e2e\.sh/);
  assert.match(buildJob, /delivery-proof-exit-code\.txt/);
  assert.doesNotMatch(source, /^\s*delivery-sensitive-v1-e2e:\s*$/m);
});

test("workflow keeps always-on async triage in build-and-test before combined enforcement", async () => {
  const source = await loadWorkflowSource();
  const buildJob = extractJobBlock(source, "build-and-test", "yanote-validation");

  assert.match(
    buildJob,
    /- name:\s*Run live Kafka proof stack[\s\S]*?- name:\s*Collect build-and-test artifacts[\s\S]*?- name:\s*Render async GitHub summary[\s\S]*?- name:\s*Upload build-and-test artifacts[\s\S]*?- name:\s*Enforce build-and-test proof results/
  );
  assert.match(buildJob, /id:\s*run-live-kafka-proof/);
  assert.match(buildJob, /echo "exit_code=\$\{exit_code\}" >> "\$\{GITHUB_OUTPUT\}"/);
  assert.match(buildJob, /- name:\s*Collect build-and-test artifacts[\s\S]*?if:\s*\$\{\{\s*always\(\)\s*\}\}/);
  assert.match(buildJob, /- name:\s*Render async GitHub summary[\s\S]*?if:\s*\$\{\{\s*always\(\)\s*\}\}/);
  assert.match(buildJob, /- name:\s*Render async GitHub summary[\s\S]*?yanote-async-report\.json/);
  assert.match(buildJob, /- name:\s*Render async GitHub summary[\s\S]*?--artifacts-dir "\$\{YANOTE_ARTIFACT_DIR\}\/live-kafka-proof"/);
  assert.match(buildJob, /- name:\s*Upload build-and-test artifacts[\s\S]*?name:\s*build-and-test-artifacts/);
  assert.match(
    buildJob,
    /- name:\s*Enforce build-and-test proof results[\s\S]*?steps\.run-live-kafka-proof\.outputs\.exit_code != '0' \|\| steps\.run-delivery-proof\.outputs\.exit_code != '0'/
  );
});

test("workflow keeps yanote-validation as the HTTP validation job with always-on HTTP triage", async () => {
  const source = await loadWorkflowSource();
  const validationJob = extractJobBlock(source, "yanote-validation", "v1-e2e");

  assert.match(
    validationJob,
    /- name:\s*Run Yanote validation[\s\S]*?- name:\s*Collect Yanote artifacts[\s\S]*?- name:\s*Render Yanote GitHub summary[\s\S]*?- name:\s*Upload Yanote artifacts[\s\S]*?- name:\s*Enforce Yanote validation result/
  );
  assert.match(validationJob, /run:\s*bash scripts\/ci\/run-yanote-gradle-check\.sh/);
  assert.match(validationJob, /- name:\s*Collect Yanote artifacts[\s\S]*?if:\s*\$\{\{\s*always\(\)\s*\}\}/);
  assert.match(validationJob, /- name:\s*Render Yanote GitHub summary[\s\S]*?yanote-report\.json/);
  assert.match(
    validationJob,
    /- name:\s*Enforce Yanote validation result[\s\S]*?if:\s*\$\{\{\s*always\(\)\s*&&\s*steps\.run-yanote\.outputs\.exit_code != '0'\s*\}\}/
  );
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

test("branch protection documents the split between async proof, delivery proof, HTTP validation, and widened summary surfaces", async () => {
  const source = await loadBranchProtectionSource();
  assert.match(source, /`build-and-test`.*runs `run-v1-e2e\.sh` when delivery-sensitive files changed/);
  assert.match(source, /`build-and-test`.*always runs earlier delivery proof on the merge group/);
  assert.match(source, /`build-and-test` runs the authoritative live Kafka proof/);
  assert.match(source, /`build-and-test-artifacts`/);
  assert.match(source, /sanitized `specSource`/);
  assert.match(source, /`yanote-async-report\.json`\/`yanote-async-report\.html`/);
  assert.match(source, /runtime-selected and schema-failure JSON\+HTML companions/);
  assert.match(source, /retains `v1-e2e\/` plus delivery-proof scope files/);
  assert.match(source, /`yanote-validation` remains the HTTP validation job/);
  assert.match(source, /`yanote-validation-artifacts`/);
  assert.match(source, /additive deprecated-operation counts/);
  assert.match(source, /`yanote-report\.json`\/`yanote-report\.html`/);
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
