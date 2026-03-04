import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { renderSummary } from "./render-yanote-summary.mjs";

function createReportFixture() {
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
    rawPayload: "SECRET_PAYLOAD_MUST_NOT_APPEAR"
  };
}

test("renders metrics, deterministic primary failure, and top 5 issues", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-summary-"));
  try {
    const reportPath = path.join(workDir, "yanote-report.json");
    const summaryPath = path.join(workDir, "summary.md");
    const stderrPath = path.join(workDir, "stderr.log");
    await writeFile(reportPath, JSON.stringify(createReportFixture()), "utf8");
    await writeFile(stderrPath, 'YANOTE_ERROR class=gate code=GATE_THRESHOLD reason="coverage below threshold" hint="raise coverage"', "utf8");

    const markdown = await renderSummary({
      reportPath,
      stderrPath,
      outputPath: summaryPath,
      exitCode: 3
    });

    assert.match(markdown, /- status: partial/);
    assert.match(markdown, /- operations: 1\/6 \(16\.67%\)/);
    assert.match(markdown, /- aggregate: 33\.33% \(PARTIAL\)/);
    assert.match(markdown, /- primary failure: GATE_THRESHOLD - coverage below threshold/);

    const issueLines = markdown.split("\n").filter((line) => /^[0-9]+\.\s/.test(line));
    assert.equal(issueLines.length, 5);
    assert.equal(issueLines[0], "1. high: GATE_THRESHOLD - coverage below threshold");
    assert.equal(issueLines[1], "2. high: GET /aaa - invalid operation shape");
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("keeps summary concise and never leaks raw payload fields", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-summary-"));
  try {
    const reportPath = path.join(workDir, "yanote-report.json");
    const summaryPath = path.join(workDir, "summary.md");
    await writeFile(reportPath, JSON.stringify(createReportFixture()), "utf8");

    const markdown = await renderSummary({
      reportPath,
      outputPath: summaryPath,
      exitCode: 0
    });

    assert.ok(markdown.split("\n").length <= 35, "Summary should remain within a single-screen footprint.");
    assert.equal(markdown.includes("SECRET_PAYLOAD_MUST_NOT_APPEAR"), false);
    assert.equal(markdown.includes("rawPayload"), false);

    const written = await readFile(summaryPath, "utf8");
    assert.equal(written, markdown);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("fails with actionable diagnostics when report input is missing", async () => {
  const scriptPath = path.resolve("scripts/ci/render-yanote-summary.mjs");
  const missingPath = path.resolve("scripts/ci/does-not-exist.json");
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
