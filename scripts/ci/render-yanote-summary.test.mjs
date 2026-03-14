import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { renderSummary } from "./render-yanote-summary.mjs";

function createHttpReportFixture() {
  return {
    schemaVersion: "1.0.0",
    generatedAt: "2026-03-04T00:00:00.000Z",
    toolVersion: "0.0.0",
    phase: { id: "02", slug: "coverage-metrics-and-cli-reporting" },
    status: "partial",
    summary: {
      totalOperations: 6,
      coveredOperations: 1,
      operationCoveragePercent: 16.67,
      aggregateCoveragePercent: 33.33,
      aggregateExplanation: "status or parameters incomplete"
    },
    coverage: {
      operations: { state: "PARTIAL", percent: 16.67 },
      status: { state: "PARTIAL", percent: 20 },
      parameters: { state: "PARTIAL", percent: 10 },
      aggregate: { state: "PARTIAL", percent: 33.33, explanation: "status or parameters incomplete" },
      perOperation: [
        { operationKey: "http GET /z", operation: { state: "UNCOVERED" } },
        { operationKey: "http GET /a", operation: { state: "UNCOVERED" } },
        { operationKey: "http GET /m", operation: { state: "UNCOVERED" } }
      ]
    },
    diagnostics: {
      counts: { invalid: 1, ambiguous: 1, unmatched: 1 },
      items: [
        { kind: "unmatched", method: "GET", route: "/zzz", message: "no operation match" },
        { kind: "invalid", method: "GET", route: "/aaa", message: "invalid operation shape" },
        { kind: "ambiguous", method: "GET", route: "/mmm", message: "multiple operation candidates", candidates: ["x", "a"] }
      ]
    },
    governance: {
      exclusions: { appliedRules: [], unmatchedRules: [] },
      diagnostics: [
        { severity: "warning", class: "gate", code: "GATE_WARN", message: "warning message" },
        { severity: "error", class: "gate", code: "GATE_THRESHOLD", message: "coverage below threshold" }
      ]
    },
    rawPayload: "SECRET_HTTP_PAYLOAD_MUST_NOT_APPEAR"
  };
}

function createAsyncReportFixture() {
  return {
    schemaVersion: "1.0.0",
    generatedAt: "2026-03-14T00:00:00.000Z",
    toolVersion: "0.0.0",
    phase: { id: "03", slug: "async-report-and-gate-surface" },
    status: "partial",
    summary: {
      totalChannels: 2,
      coveredChannels: 1,
      channelCoveragePercent: 50,
      totalOperations: 2,
      coveredOperations: 1,
      operationCoveragePercent: 50,
      totalMessages: 2,
      coveredMessages: 1,
      messageCoveragePercent: 50
    },
    coverage: {
      channels: {
        state: "PARTIAL",
        percent: 50,
        items: [
          { channel: "users.created", state: "COVERED", coveredActions: ["send"], missingActions: [] },
          { channel: "users.deleted", state: "UNCOVERED", coveredActions: [], missingActions: ["receive"] }
        ]
      },
      operations: {
        state: "PARTIAL",
        percent: 50,
        items: [
          {
            operationKey: "kafka send users.created",
            channel: "users.created",
            action: "send",
            operation: { state: "COVERED" },
            messageContract: { name: "UserCreated", state: "COVERED" },
            suites: ["suite-a"]
          },
          {
            operationKey: "kafka receive users.deleted",
            channel: "users.deleted",
            action: "receive",
            operation: { state: "UNCOVERED" },
            messageContract: { name: "UserDeleted", state: "UNCOVERED" },
            suites: []
          }
        ]
      },
      messages: {
        state: "PARTIAL",
        percent: 50,
        items: [
          {
            operationKey: "kafka send users.created",
            channel: "users.created",
            action: "send",
            message: "UserCreated",
            state: "COVERED",
            suites: ["suite-a"]
          },
          {
            operationKey: "kafka receive users.deleted",
            channel: "users.deleted",
            action: "receive",
            message: "UserDeleted",
            state: "UNCOVERED",
            suites: []
          }
        ]
      }
    },
    diagnostics: {
      counts: { unmatched: 0, mismatched: 0 },
      items: []
    },
    rawPayload: "SECRET_ASYNC_PAYLOAD_MUST_NOT_APPEAR"
  };
}

async function writeArtifactFiles(dir, files) {
  await mkdir(dir, { recursive: true });
  await Promise.all(
    Object.entries(files).map(([name, content]) => writeFile(path.join(dir, name), content, "utf8"))
  );
}

test("renders the existing HTTP summary contract without payload leaks", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-summary-http-"));
  try {
    const artifactsDir = path.join(workDir, "artifacts");
    const reportPath = path.join(artifactsDir, "yanote-report.json");
    const summaryPath = path.join(workDir, "summary.md");
    const stderrPath = path.join(workDir, "yanote-validation.stderr.log");

    await writeArtifactFiles(artifactsDir, {
      "yanote-report.json": JSON.stringify(createHttpReportFixture()),
      "yanote-exit-code.txt": "3\n",
      "yanote-validation.stderr.log": 'YANOTE_ERROR class=gate code=GATE_THRESHOLD reason="coverage below threshold" hint="raise coverage"\n'
    });
    await writeFile(stderrPath, 'YANOTE_ERROR class=gate code=GATE_THRESHOLD reason="coverage below threshold" hint="raise coverage"\n', "utf8");

    const markdown = await renderSummary({
      reportPath,
      stderrPath,
      artifactsDir,
      outputPath: summaryPath,
      exitCode: 3
    });

    const expected = [
      "## Yanote Validation Summary",
      "- status: partial",
      "- operations: 1/6 (16.67%)",
      "- aggregate: 33.33% (PARTIAL)",
      "- status dimension: 20.00% (PARTIAL)",
      "- parameters: 10.00% (PARTIAL)",
      "- primary failure: GATE_THRESHOLD - coverage below threshold",
      "- report: yanote-report.json",
      "- artifacts: yanote-exit-code.txt, yanote-report.json, yanote-validation.stderr.log",
      "",
      "### Top Issues",
      "1. high: GATE_THRESHOLD - coverage below threshold",
      "2. high: GET /aaa - invalid operation shape",
      "3. medium: GATE_WARN - warning message",
      "4. medium: GET /mmm - multiple operation candidates",
      "5. low: GET /zzz - no operation match",
      "... +3 more issues in report artifacts",
      ""
    ].join("\n");

    assert.equal(markdown, expected);
    assert.equal(markdown.includes("SECRET_HTTP_PAYLOAD_MUST_NOT_APPEAR"), false);
    assert.equal(markdown.includes("rawPayload"), false);
    assert.equal(await readFile(summaryPath, "utf8"), markdown);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("renders async report artifacts with typed stderr failures and no payload leaks", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-summary-async-report-"));
  try {
    const artifactsDir = path.join(workDir, "live-kafka-proof");
    const reportPath = path.join(artifactsDir, "yanote-async-report.json");
    const summaryPath = path.join(workDir, "summary.md");
    const stdoutPath = path.join(artifactsDir, "async-report.stdout");
    const stderrPath = path.join(artifactsDir, "async-report.stderr");

    await writeArtifactFiles(artifactsDir, {
      "artifact-manifest.txt": "proof_status=failure\nreport_found=true\n",
      "artifact-source-paths.txt": "temp_dir=/tmp/yanote-proof\n",
      "yanote-async-report.json": JSON.stringify(createAsyncReportFixture()),
      "async-report.stdout": [
        "Summary",
        "- status: partial",
        "",
        "YANOTE_ASYNC_SUMMARY status=partial channels=50.00 operations=50.00 messages=50.00 covered_channels=1/2 covered_operations=1/2 covered_messages=1/2 diagnostics=0 report=/tmp/yanote-proof/yanote-async-report.json primary=ASYNC_SEMANTIC_MESSAGE_MISMATCH class_counts=input:0,semantic:1,gate:1,runtime:0",
        ""
      ].join("\n"),
      "async-report.stderr": [
        'YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_MESSAGE_MISMATCH reason="message mismatch on users.deleted" hint="fix contract"',
        'YANOTE_ASYNC_ERROR_SECONDARY class=gate code=ASYNC_GATE_MIN_COVERAGE reason="coverage below 100%" hint="raise coverage"',
        ""
      ].join("\n")
    });

    const markdown = await renderSummary({
      reportPath,
      stdoutPath,
      stderrPath,
      artifactsDir,
      outputPath: summaryPath,
      exitCode: 5
    });

    const expected = [
      "## Yanote Async Summary",
      "- status: partial",
      "- channels: 1/2 (50.00%)",
      "- operations: 1/2 (50.00%)",
      "- messages: 1/2 (50.00%)",
      "- primary failure: ASYNC_SEMANTIC_MESSAGE_MISMATCH - message mismatch on users.deleted",
      "- class counts: input:0,semantic:1,gate:1,runtime:0",
      "- proof exit code: 5",
      "- report: yanote-async-report.json",
      "- summary source: report file",
      "- artifacts: artifact-manifest.txt, artifact-source-paths.txt, async-report.stderr, async-report.stdout",
      "",
      "### Coverage Dimensions",
      "- channels: 50.00% (PARTIAL)",
      "- operations: 50.00% (PARTIAL)",
      "- messages: 50.00% (PARTIAL)",
      "",
      "### Top Issues",
      "1. high: ASYNC_SEMANTIC_MESSAGE_MISMATCH - message mismatch on users.deleted",
      "2. medium: ASYNC_GATE_MIN_COVERAGE - coverage below 100%",
      "3. low: users.deleted - channel is uncovered",
      "4. low: kafka receive users.deleted - async operation is uncovered",
      "5. low: kafka receive users.deleted - async message UserDeleted is uncovered",
      ""
    ].join("\n");

    assert.equal(markdown, expected);
    assert.equal(markdown.includes("SECRET_ASYNC_PAYLOAD_MUST_NOT_APPEAR"), false);
    assert.equal(markdown.includes("rawPayload"), false);
    assert.equal(await readFile(summaryPath, "utf8"), markdown);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("renders async no-report fallback from YANOTE_ASYNC stderr/stdout signals", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-summary-async-fallback-"));
  try {
    const artifactsDir = path.join(workDir, "live-kafka-proof");
    const reportPath = path.join(artifactsDir, "yanote-async-report.json");
    const summaryPath = path.join(workDir, "summary.md");
    const stdoutPath = path.join(artifactsDir, "async-report.stdout");
    const stderrPath = path.join(artifactsDir, "async-report.stderr");

    await writeArtifactFiles(artifactsDir, {
      "artifact-manifest.txt": "proof_status=failure\nreport_found=false\n",
      "artifact-source-paths.txt": "temp_dir=/tmp/yanote-proof\nyanote-async-report.json=none\n",
      "async-report.stdout": [
        "Summary",
        "- status: invalid",
        "",
        "YANOTE_ASYNC_SUMMARY status=invalid channels=NA operations=NA messages=NA covered_channels=0/0 covered_operations=0/0 covered_messages=0/0 diagnostics=0 report=none primary=ASYNC_SEMANTIC_SPEC_INVALID class_counts=input:0,semantic:1,gate:0,runtime:0",
        ""
      ].join("\n"),
      "async-report.stderr": [
        'YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_SPEC_INVALID reason="AsyncAPI document is invalid" hint="fix spec"',
        ""
      ].join("\n")
    });

    const markdown = await renderSummary({
      reportPath,
      stdoutPath,
      stderrPath,
      artifactsDir,
      outputPath: summaryPath,
      exitCode: 5
    });

    const expected = [
      "## Yanote Async Summary",
      "- status: invalid",
      "- channels: 0/0 (N/A)",
      "- operations: 0/0 (N/A)",
      "- messages: 0/0 (N/A)",
      "- primary failure: ASYNC_SEMANTIC_SPEC_INVALID - AsyncAPI document is invalid",
      "- class counts: input:0,semantic:1,gate:0,runtime:0",
      "- proof exit code: 5",
      "- report: none",
      "- summary source: YANOTE_ASYNC_* fallback",
      "- artifacts: artifact-manifest.txt, artifact-source-paths.txt, async-report.stderr, async-report.stdout",
      "",
      "### Coverage Dimensions",
      "- channels: N/A (N/A)",
      "- operations: N/A (N/A)",
      "- messages: N/A (N/A)",
      "",
      "### Top Issues",
      "1. high: ASYNC_SEMANTIC_SPEC_INVALID - AsyncAPI document is invalid",
      ""
    ].join("\n");

    assert.equal(markdown, expected);
    assert.equal(await readFile(summaryPath, "utf8"), markdown);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("fails with actionable diagnostics when the report is missing and no async fallback exists", async () => {
  const scriptPath = path.resolve("scripts/ci/render-yanote-summary.mjs");
  const missingPath = path.resolve("scripts/ci/does-not-exist/yanote-report.json");
  const outputPath = path.resolve("scripts/ci/summary.out.md");

  const result = spawnSync(
    "node",
    [scriptPath, "--report", missingPath, "--output", outputPath],
    {
      cwd: path.resolve("."),
      encoding: "utf8"
    }
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unable to read report file/);
});
