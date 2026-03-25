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

function createHttpSemanticReportFixture() {
  return {
    schemaVersion: "1.0.0",
    generatedAt: "2026-03-21T00:00:00.000Z",
    toolVersion: "0.0.0",
    phase: { id: "02", slug: "coverage-metrics-and-cli-reporting" },
    status: "partial",
    summary: {
      totalOperations: 1,
      coveredOperations: 1,
      operationCoveragePercent: 100,
      aggregateCoveragePercent: 100
    },
    coverage: {
      operations: { state: "COVERED", percent: 100 },
      status: { state: "COVERED", percent: 100 },
      parameters: { state: "COVERED", percent: 100 },
      aggregate: { state: "COVERED", percent: 100 },
      perOperation: [{ operationKey: "http POST /compile-fail/{param}", operation: { state: "COVERED" } }]
    },
    diagnostics: {
      counts: { invalid: 0, ambiguous: 0, unmatched: 0 },
      items: []
    },
    httpPayloadConformance: {
      summary: {
        request: {
          coveredOperations: 0,
          partialOperations: 0,
          uncoveredOperations: 0,
          skippedOperations: 1,
          notApplicableOperations: 0,
          observedCount: 1,
          validCount: 0,
          invalidCount: 0,
          skippedCount: 1
        },
        response: {
          coveredOperations: 0,
          partialOperations: 0,
          uncoveredOperations: 0,
          skippedOperations: 1,
          notApplicableOperations: 0,
          observedCount: 1,
          validCount: 0,
          invalidCount: 0,
          skippedCount: 1
        }
      },
      diagnostics: {
        counts: { covered: 0, uncovered: 0, skipped: 2 },
        items: []
      }
    },
    governance: {
      exclusions: { appliedRules: [], unmatchedRules: [] },
      diagnostics: [
        {
          severity: "error",
          class: "semantic",
          code: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
          message:
            "request payload for http POST /compile-fail/{param} media=application/json declares JSON content without a usable validation schema."
        },
        {
          severity: "error",
          class: "semantic",
          code: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
          message:
            "response payload for http POST /compile-fail/{param} declared-status=202 observed-status=202 media=application/json declares JSON content without a usable validation schema."
        }
      ]
    },
    rawPayload: "SECRET_HTTP_SEMANTIC_PAYLOAD_MUST_NOT_APPEAR",
    requestBody: "SECRET_HTTP_REQUEST_BODY_MUST_NOT_APPEAR",
    responseBody: "SECRET_HTTP_RESPONSE_BODY_MUST_NOT_APPEAR"
  };
}

function createHttpSecurityReportFixture() {
  return {
    schemaVersion: "1.0.0",
    generatedAt: "2026-03-25T00:00:00.000Z",
    toolVersion: "0.0.0",
    phase: { id: "02", slug: "coverage-metrics-and-cli-reporting" },
    status: "partial",
    summary: {
      totalOperations: 12,
      coveredOperations: 12,
      operationCoveragePercent: 100,
      aggregateCoveragePercent: null,
      aggregateExplanation: "aggregate is N/A because weighted dimensions include N/A"
    },
    coverage: {
      operations: { state: "COVERED", percent: 100 },
      status: { state: "COVERED", percent: 100 },
      parameters: { state: "N/A", percent: null },
      aggregate: { state: "N/A", percent: null, explanation: "aggregate is N/A because weighted dimensions include N/A" },
      perOperation: []
    },
    diagnostics: {
      counts: { invalid: 0, ambiguous: 0, unmatched: 0 },
      items: []
    },
    httpPayloadConformance: {
      summary: {
        request: {
          coveredOperations: 0,
          partialOperations: 0,
          uncoveredOperations: 0,
          skippedOperations: 0,
          notApplicableOperations: 12,
          observedCount: 0,
          validCount: 0,
          invalidCount: 0,
          skippedCount: 0
        },
        response: {
          coveredOperations: 0,
          partialOperations: 0,
          uncoveredOperations: 0,
          skippedOperations: 0,
          notApplicableOperations: 12,
          observedCount: 0,
          validCount: 0,
          invalidCount: 0,
          skippedCount: 0
        }
      },
      diagnostics: {
        counts: { covered: 0, uncovered: 0, skipped: 0 },
        items: []
      }
    },
    httpRequestConformance: {
      summary: {
        observedOperations: 0,
        observedParameters: 0,
        counts: {
          capturedValid: 0,
          capturedInvalid: 0,
          redacted: 0,
          omitted: 0,
          unsupported: 0
        }
      },
      diagnostics: {
        counts: {
          capturedValid: 0,
          capturedInvalid: 0,
          redacted: 0,
          omitted: 0,
          unsupported: 0
        },
        items: []
      }
    },
    httpSecurityConformance: {
      summary: {
        declaredOperations: 12,
        observedOperations: 12,
        observedEvaluations: 12,
        counts: {
          satisfied: 3,
          missing: 1,
          unavailable: 2,
          unsupported: 4,
          optional: 1,
          clear: 1
        }
      },
      diagnostics: {
        counts: {
          satisfied: 3,
          missing: 1,
          unavailable: 2,
          unsupported: 4,
          optional: 1,
          clear: 1
        },
        items: []
      }
    },
    governance: {
      exclusions: { appliedRules: [], unmatchedRules: [] },
      diagnostics: [
        {
          severity: "error",
          class: "semantic",
          code: "SEMANTIC_HTTP_MISSING_SECURITY",
          message:
            "required query apiKey 'api_key' for security scheme 'queryKey' on http GET /or-and-missing was not retained in request evidence."
        },
        {
          severity: "error",
          class: "semantic",
          code: "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
          message:
            "required header apiKey 'X-Api-Key' for security scheme 'headerKey' on http GET /redacted was unavailable for security verification because retained evidence was redacted (reason: sensitive)."
        },
        {
          severity: "error",
          class: "semantic",
          code: "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
          message:
            "required query apiKey 'api_key' for security scheme 'queryKey' on http GET /unavailable was unavailable for security verification because retained evidence was omitted (reason: unavailable)."
        },
        {
          severity: "error",
          class: "semantic",
          code: "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
          message:
            "security scheme 'basicAuth' on http GET /unsupported-http uses unsupported OpenAPI security type 'http' within Yanote's truthful apiKey-only subset."
        },
        {
          severity: "error",
          class: "semantic",
          code: "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
          message:
            "required path apiKey 'secret' for security scheme 'pathKey' on http GET /unsupported-location uses unsupported apiKey location 'path'."
        },
        {
          severity: "error",
          class: "semantic",
          code: "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
          message:
            "security scheme 'oauthKey' on http GET /unsupported-oauth uses unsupported OpenAPI security type 'oauth2' within Yanote's truthful apiKey-only subset."
        },
        {
          severity: "error",
          class: "semantic",
          code: "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
          message:
            "security scheme 'oidcAuth' on http GET /unsupported-openid uses unsupported OpenAPI security type 'openIdConnect' within Yanote's truthful apiKey-only subset."
        }
      ]
    },
    rawPayload: "SECRET_HTTP_SECURITY_PAYLOAD_MUST_NOT_APPEAR"
  };
}

function createAsyncHappyPathReportFixture() {
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
      counts: {
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "unverifiable-headers": 0,
        unmatched: 0,
        mismatched: 0
      },
      items: []
    },
    rawPayload: "SECRET_ASYNC_PAYLOAD_MUST_NOT_APPEAR"
  };
}

function createAsyncDiagnosticReportFixture() {
  return {
    schemaVersion: "1.0.0",
    generatedAt: "2026-03-20T00:00:00.000Z",
    toolVersion: "0.0.0",
    phase: { id: "03", slug: "async-report-and-gate-surface" },
    status: "partial",
    summary: {
      totalChannels: 1,
      coveredChannels: 1,
      channelCoveragePercent: 100,
      totalOperations: 1,
      coveredOperations: 1,
      operationCoveragePercent: 100,
      totalMessages: 1,
      coveredMessages: 1,
      messageCoveragePercent: 100
    },
    coverage: {
      channels: {
        state: "COVERED",
        percent: 100,
        items: [{ channel: "orders.created", state: "COVERED", coveredActions: ["send"], missingActions: [] }]
      },
      operations: {
        state: "COVERED",
        percent: 100,
        items: [
          {
            operationKey: "kafka send orders.created",
            channel: "orders.created",
            action: "send",
            operation: { state: "COVERED" },
            messageContract: { name: "OrderCreated", state: "COVERED" },
            suites: ["suite-a"]
          }
        ]
      },
      messages: {
        state: "COVERED",
        percent: 100,
        items: [
          {
            operationKey: "kafka send orders.created",
            channel: "orders.created",
            action: "send",
            message: "OrderCreated",
            state: "COVERED",
            suites: ["suite-a"]
          }
        ]
      }
    },
    diagnostics: {
      counts: {
        "unsupported-content-type": 1,
        "unsupported-schema-format": 1,
        "missing-payload": 1,
        "invalid-payload": 1,
        "unverifiable-headers": 1,
        unmatched: 1,
        mismatched: 1
      },
      items: [
        {
          kind: "unmatched",
          channel: "payments.refunds",
          action: "send",
          message: "Observed async evidence did not match any canonical AsyncAPI operation.",
          observedMessage: "RefundRequested"
        },
        {
          kind: "invalid-payload",
          validationKind: "payload",
          operationKey: "kafka send orders.created",
          message: "OrderCreated",
          channel: "orders.created",
          action: "send",
          schemaId: "OrderCreatedPayload",
          pointer: "/id",
          reason: "must be integer"
        },
        {
          kind: "unsupported-schema-format",
          validationKind: "schemaFormat",
          operationKey: "kafka send orders.created",
          message: "OrderCreated",
          channel: "orders.created",
          action: "send",
          schemaId: "OrderCreatedPayload",
          reason: "Unsupported schema format avro for AsyncAPI payload validation."
        },
        {
          kind: "mismatched",
          channel: "orders.created",
          action: "receive",
          message: "Observed message OrderReplayed did not match AsyncAPI contract.",
          observedMessage: "OrderReplayed",
          expectedMessage: "OrderCreated"
        },
        {
          kind: "missing-payload",
          validationKind: "payload",
          operationKey: "kafka send orders.created",
          message: "OrderCreated",
          channel: "orders.created",
          action: "send",
          schemaId: "OrderCreatedPayload",
          pointer: "/",
          reason: "Observed kafka evidence did not include a payload."
        },
        {
          kind: "unsupported-content-type",
          validationKind: "contentType",
          operationKey: "kafka send orders.created",
          message: "OrderCreated",
          channel: "orders.created",
          action: "send",
          schemaId: "OrderCreatedPayload",
          reason: "Unsupported content type application/xml for AsyncAPI message payload validation."
        },
        {
          kind: "unverifiable-headers",
          validationKind: "headers",
          operationKey: "kafka send orders.created",
          message: "OrderCreated",
          channel: "orders.created",
          action: "send",
          schemaId: "OrderCreatedHeaders",
          reason: "Observed kafka evidence did not include headers."
        }
      ]
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

test("renders HTTP semantic summaries from report-first artifacts without payload leaks", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-summary-http-semantic-"));
  try {
    const artifactsDir = path.join(workDir, "artifacts");
    const reportPath = path.join(artifactsDir, "yanote-report.json");
    const summaryPath = path.join(workDir, "summary.md");
    const stderrPath = path.join(workDir, "yanote-validation.stderr.log");

    await writeArtifactFiles(artifactsDir, {
      "evidence.events.jsonl": '{"requestBody":"SECRET_EVENT_BODY_MUST_NOT_APPEAR"}\n',
      "yanote-report.json": JSON.stringify(createHttpSemanticReportFixture()),
      "yanote-validation.stderr.log": 'YANOTE_ERROR class=gate code=GATE_THRESHOLD reason="old threshold should not win" hint="stale artifact"\n'
    });
    await writeFile(
      stderrPath,
      'YANOTE_ERROR class=gate code=GATE_THRESHOLD reason="old threshold should not win" hint="stale artifact"\n',
      "utf8"
    );

    const markdown = await renderSummary({
      reportPath,
      stderrPath,
      artifactsDir,
      outputPath: summaryPath,
      exitCode: 5
    });

    const expected = [
      "## Yanote Validation Summary",
      "- status: partial",
      "- operations: 1/1 (100.00%)",
      "- aggregate: 100.00% (COVERED)",
      "- status dimension: 100.00% (COVERED)",
      "- parameters: 100.00% (COVERED)",
      "- primary failure: SEMANTIC_HTTP_UNSUPPORTED_SCHEMA - request payload for http POST /compile-fail/{param} media=application/json declares JSON content without a usable validation schema.",
      "- report: yanote-report.json",
      "- artifacts: evidence.events.jsonl, yanote-report.json, yanote-validation.stderr.log",
      "",
      "### Top Issues",
      "1. high: SEMANTIC_HTTP_UNSUPPORTED_SCHEMA - request payload for http POST /compile-fail/{param} media=application/json declares JSON content without a usable validation schema.",
      "2. high: SEMANTIC_HTTP_UNSUPPORTED_SCHEMA - response payload for http POST /compile-fail/{param} declared-status=202 observed-status=202 media=application/json declares JSON content without a usable validation schema.",
      ""
    ].join("\n");

    assert.equal(markdown, expected);
    assert.equal(markdown.includes("SECRET_HTTP_SEMANTIC_PAYLOAD_MUST_NOT_APPEAR"), false);
    assert.equal(markdown.includes("SECRET_HTTP_REQUEST_BODY_MUST_NOT_APPEAR"), false);
    assert.equal(markdown.includes("SECRET_HTTP_RESPONSE_BODY_MUST_NOT_APPEAR"), false);
    assert.equal(markdown.includes("SECRET_EVENT_BODY_MUST_NOT_APPEAR"), false);
    assert.equal(await readFile(summaryPath, "utf8"), markdown);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("renders HTTP security summaries from governance-driven report data without secret leaks", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-summary-http-security-"));
  try {
    const artifactsDir = path.join(workDir, "artifacts");
    const reportPath = path.join(artifactsDir, "yanote-report.json");
    const summaryPath = path.join(workDir, "summary.md");
    const stderrPath = path.join(workDir, "yanote-validation.stderr.log");

    await writeArtifactFiles(artifactsDir, {
      "evidence.events.jsonl": '{"requestHeaders":{"x-api-key":{"state":"captured","values":["SECRET_HEADER"]}}}\n',
      "yanote-report.json": JSON.stringify(createHttpSecurityReportFixture()),
      "yanote-validation.stderr.log": 'YANOTE_ERROR class=gate code=GATE_THRESHOLD reason="stale threshold should not win" hint="stale artifact"\n'
    });
    await writeFile(
      stderrPath,
      'YANOTE_ERROR class=gate code=GATE_THRESHOLD reason="stale threshold should not win" hint="stale artifact"\n',
      "utf8"
    );

    const markdown = await renderSummary({
      reportPath,
      stderrPath,
      artifactsDir,
      outputPath: summaryPath,
      exitCode: 5
    });

    const expected = [
      "## Yanote Validation Summary",
      "- status: partial",
      "- operations: 12/12 (100.00%)",
      "- aggregate: N/A (N/A)",
      "- status dimension: 100.00% (COVERED)",
      "- parameters: N/A (N/A)",
      "- security observations: declared=12 observed_operations=12 evaluations=12",
      "- security truths: satisfied=3 missing=1 unavailable=2 unsupported=4 optional=1 clear=1",
      "- primary failure: SEMANTIC_HTTP_MISSING_SECURITY - required query apiKey 'api_key' for security scheme 'queryKey' on http GET /or-and-missing was not retained in request evidence.",
      "- report: yanote-report.json",
      "- artifacts: evidence.events.jsonl, yanote-report.json, yanote-validation.stderr.log",
      "",
      "### Top Issues",
      "1. high: SEMANTIC_HTTP_MISSING_SECURITY - required query apiKey 'api_key' for security scheme 'queryKey' on http GET /or-and-missing was not retained in request evidence.",
      "2. high: SEMANTIC_HTTP_UNAVAILABLE_SECURITY - required header apiKey 'X-Api-Key' for security scheme 'headerKey' on http GET /redacted was unavailable for security verification because retained evidence was redacted (reason: sensitive).",
      "3. high: SEMANTIC_HTTP_UNAVAILABLE_SECURITY - required query apiKey 'api_key' for security scheme 'queryKey' on http GET /unavailable was unavailable for security verification because retained evidence was omitted (reason: unavailable).",
      "4. high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - required path apiKey 'secret' for security scheme 'pathKey' on http GET /unsupported-location uses unsupported apiKey location 'path'.",
      "5. high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - security scheme 'basicAuth' on http GET /unsupported-http uses unsupported OpenAPI security type 'http' within Yanote's truthful apiKey-only subset.",
      "... +2 more issues in report artifacts",
      ""
    ].join("\n");

    assert.equal(markdown, expected);
    assert.equal(markdown.includes("SECRET_HTTP_SECURITY_PAYLOAD_MUST_NOT_APPEAR"), false);
    assert.equal(markdown.includes("SECRET_HEADER"), false);
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
      "yanote-async-report.json": JSON.stringify(createAsyncHappyPathReportFixture()),
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

test("renders async report-only schema and routing diagnostics with explicit semantic precedence and no payload leaks", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-summary-async-diagnostics-"));
  try {
    const artifactsDir = path.join(workDir, "async-report");
    const reportPath = path.join(artifactsDir, "yanote-async-report.json");
    const summaryPath = path.join(workDir, "summary.md");

    await writeArtifactFiles(artifactsDir, {
      "yanote-async-report.json": JSON.stringify(createAsyncDiagnosticReportFixture())
    });

    const markdown = await renderSummary({
      reportPath,
      artifactsDir,
      outputPath: summaryPath,
      exitCode: 5
    });

    const expected = [
      "## Yanote Async Summary",
      "- status: partial",
      "- channels: 1/1 (100.00%)",
      "- operations: 1/1 (100.00%)",
      "- messages: 1/1 (100.00%)",
      "- primary failure: ASYNC_SEMANTIC_UNSUPPORTED_CONTENT_TYPE - Async evidence kafka send orders.created cannot validate payload schema OrderCreatedPayload because Unsupported content type application/xml for AsyncAPI message payload validation.",
      "- class counts: input:0,semantic:7,gate:0,runtime:0",
      "- proof exit code: 5",
      "- report: yanote-async-report.json",
      "- summary source: report file",
      "- artifacts: yanote-async-report.json",
      "",
      "### Coverage Dimensions",
      "- channels: 100.00% (COVERED)",
      "- operations: 100.00% (COVERED)",
      "- messages: 100.00% (COVERED)",
      "",
      "### Top Issues",
      "1. high: ASYNC_SEMANTIC_UNSUPPORTED_CONTENT_TYPE - Async evidence kafka send orders.created cannot validate payload schema OrderCreatedPayload because Unsupported content type application/xml for AsyncAPI message payload validation.",
      "2. medium: kafka send orders.created - unsupported-content-type schema=OrderCreatedPayload reason=Unsupported content type application/xml for AsyncAPI message payload validation.",
      "3. medium: kafka send orders.created - unsupported-schema-format schema=OrderCreatedPayload reason=Unsupported schema format avro for AsyncAPI payload validation.",
      "4. medium: kafka send orders.created - missing-payload schema=OrderCreatedPayload pointer=/ reason=Observed kafka evidence did not include a payload.",
      "5. medium: kafka send orders.created - invalid-payload schema=OrderCreatedPayload pointer=/id reason=must be integer",
      "... +3 more issues in async artifacts",
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

test("renders async no-report fallback from YANOTE_ASYNC summary signals using primary_reason", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-summary-async-fallback-"));
  try {
    const artifactsDir = path.join(workDir, "live-kafka-proof");
    const reportPath = path.join(artifactsDir, "yanote-async-report.json");
    const summaryPath = path.join(workDir, "summary.md");
    const stdoutPath = path.join(artifactsDir, "async-report.stdout");

    await writeArtifactFiles(artifactsDir, {
      "artifact-manifest.txt": "proof_status=failure\nreport_found=false\n",
      "artifact-source-paths.txt": "temp_dir=/tmp/yanote-proof\nyanote-async-report.json=none\n",
      "async-report.stdout": [
        "Summary",
        "- status: invalid",
        "",
        'YANOTE_ASYNC_SUMMARY status=invalid channels=NA operations=NA messages=NA covered_channels=0/0 covered_operations=0/0 covered_messages=0/0 diagnostics=0 report=none primary=ASYNC_SEMANTIC_SPEC_INVALID primary_reason="AsyncAPI document is invalid" class_counts=input:0,semantic:1,gate:0,runtime:0',
        ""
      ].join("\n")
    });

    const markdown = await renderSummary({
      reportPath,
      stdoutPath,
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
      "- artifacts: artifact-manifest.txt, artifact-source-paths.txt, async-report.stdout",
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
;
;
