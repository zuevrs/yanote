import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeCoverage } from "../coverage/coverage.js";
import { computeHttpPayloadConformance } from "../coverage/httpPayloadConformance.js";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import type { GovernanceFailure } from "../gates/failureOrder.js";
import { loadOpenApiCoverageModel } from "../spec/openapi.js";
import { REPORT_SCHEMA_VERSION } from "./schema.js";
import { buildReport, type YanoteReport } from "./report.js";

async function buildPayloadFixtureReport(eventsPath: string): Promise<YanoteReport> {
  const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload.yaml");
  const events = await readHttpEventsJsonl(eventsPath);

  const coverage = computeCoverage(model.operations, events.items, [], {
    operationContractsByKey: model.operationContractsByKey
  });
  const payloadConformance = computeHttpPayloadConformance(model.operations, events.items, {
    operationContractsByKey: model.operationContractsByKey
  });

  return buildReport(coverage, {
    toolVersion: "test",
    eventTimestamps: events.items
      .map((event) => event.ts)
      .filter((timestamp): timestamp is number => typeof timestamp === "number"),
    payloadConformance
  });
}

async function buildFormatMediaFixtureReport(eventsPaths: string[]): Promise<YanoteReport> {
  const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload-format-media.yaml");
  const eventBatches = await Promise.all(eventsPaths.map((eventsPath) => readHttpEventsJsonl(eventsPath)));
  const items = eventBatches.flatMap((batch) => batch.items);

  const coverage = computeCoverage(model.operations, items, [], {
    operationContractsByKey: model.operationContractsByKey
  });
  const payloadConformance = computeHttpPayloadConformance(model.operations, items, {
    operationContractsByKey: model.operationContractsByKey
  });

  return buildReport(coverage, {
    toolVersion: "test",
    eventTimestamps: items.map((event) => event.ts).filter((timestamp): timestamp is number => typeof timestamp === "number"),
    payloadConformance
  });
}

async function buildFullObservationPayloadTruthReport(
  scenario: "invalid-body" | "unsupported-media" | "unsupported-schema"
): Promise<YanoteReport> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "yanote-report-truth-"));
  const specPath = path.join(tempDir, `${scenario}.yaml`);
  const eventsPath = path.join(tempDir, `${scenario}.fixture.jsonl`);

  const specByScenario = {
    "invalid-body": [
      "openapi: 3.0.0",
      "info:",
      "  title: invalid body truth fixture",
      "  version: 1.0.0",
      "paths:",
      "  /users/{id}:",
      "    post:",
      "      parameters:",
      "        - name: id",
      "          in: path",
      "          required: true",
      "          schema: { type: string }",
      "      requestBody:",
      "        required: true",
      "        content:",
      "          application/json:",
      "            schema:",
      "              type: object",
      "              required: [profile]",
      "              properties:",
      "                profile:",
      "                  type: object",
      "                  required: [active]",
      "                  properties:",
      "                    active: { type: boolean }",
      "      responses:",
      "        '201':",
      "          description: created",
      "          content:",
      "            application/json:",
      "              schema:",
      "                type: object",
      "                required: [id]",
      "                properties:",
      "                  id: { type: string }"
    ].join("\n"),
    "unsupported-media": [
      "openapi: 3.0.0",
      "info:",
      "  title: unsupported media truth fixture",
      "  version: 1.0.0",
      "paths:",
      "  /notes/{id}:",
      "    post:",
      "      parameters:",
      "        - name: id",
      "          in: path",
      "          required: true",
      "          schema: { type: string }",
      "      requestBody:",
      "        required: true",
      "        content:",
      "          text/plain:",
      "            schema:",
      "              type: string",
      "      responses:",
      "        '202':",
      "          description: accepted",
      "          content:",
      "            text/plain:",
      "              schema:",
      "                type: string"
    ].join("\n"),
    "unsupported-schema": [
      "openapi: 3.0.0",
      "info:",
      "  title: unsupported schema truth fixture",
      "  version: 1.0.0",
      "paths:",
      "  /compile-fail/{id}:",
      "    post:",
      "      parameters:",
      "        - name: id",
      "          in: path",
      "          required: true",
      "          schema: { type: string }",
      "      requestBody:",
      "        required: true",
      "        content:",
      "          application/json:",
      "            schema:",
      "              type: string",
      "              pattern: '['",
      "      responses:",
      "        '202':",
      "          description: accepted",
      "          content:",
      "            application/json:",
      "              schema:",
      "                type: string",
      "                pattern: '['"
    ].join("\n")
  } as const;

  const eventByScenario = {
    "invalid-body": {
      kind: "http",
      ts: 1772449300001,
      method: "POST",
      route: "/users/123",
      status: 201,
      requestBody: {},
      requestContentType: "application/json",
      responseBody: { id: "123" },
      responseContentType: "application/json",
      queryKeys: [],
      headerKeys: ["content-type"],
      "test.run_id": "run-invalid-body",
      "test.suite": "suite-invalid-body"
    },
    "unsupported-media": {
      kind: "http",
      ts: 1772449300002,
      method: "POST",
      route: "/notes/123",
      status: 202,
      requestBody: "hello",
      requestContentType: "text/plain",
      responseBody: "accepted",
      responseContentType: "text/plain",
      queryKeys: [],
      headerKeys: ["content-type"],
      "test.run_id": "run-unsupported-media",
      "test.suite": "suite-unsupported-media"
    },
    "unsupported-schema": {
      kind: "http",
      ts: 1772449300003,
      method: "POST",
      route: "/compile-fail/123",
      status: 202,
      requestBody: "hello",
      requestContentType: "application/json",
      responseBody: "accepted",
      responseContentType: "application/json",
      queryKeys: [],
      headerKeys: ["content-type"],
      "test.run_id": "run-unsupported-schema",
      "test.suite": "suite-unsupported-schema"
    }
  } as const;

  await writeFile(specPath, specByScenario[scenario], "utf8");
  await writeFile(eventsPath, `${JSON.stringify(eventByScenario[scenario])}\n`, "utf8");

  try {
    const model = await loadOpenApiCoverageModel(specPath);
    const events = await readHttpEventsJsonl(eventsPath);
    const coverage = computeCoverage(model.operations, events.items, [], {
      operationContractsByKey: model.operationContractsByKey
    });
    const payloadConformance = computeHttpPayloadConformance(model.operations, events.items, {
      operationContractsByKey: model.operationContractsByKey
    });

    return buildReport(coverage, {
      toolVersion: "test",
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number"),
      payloadConformance
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function pickPayloadStates(report: YanoteReport, operationKeys: string[]) {
  return Object.fromEntries(
    operationKeys.map((operationKey) => {
      const entry = report.httpPayloadConformance.perOperation.find((item) => item.operationKey === operationKey);
      return [operationKey, { request: entry?.request.state, response: entry?.response.state, suites: entry?.suites ?? [] }];
    })
  );
}

function pickPayloadDiagnostics(report: YanoteReport) {
  return report.httpPayloadConformance.diagnostics.items.map((item) => ({
    operationKey: item.operationKey,
    target: item.target,
    state: item.state,
    code: item.code,
    suite: item.suite,
    declaredStatus: item.declaredStatus,
    observedStatus: item.observedStatus,
    observedMediaType: item.observedMediaType,
    errors: item.errors
  }));
}

describe("report", () => {
  it("builds schema-aligned report with deterministic operation identity fields", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/simple.yaml");
    const events = await readHttpEventsJsonl("test/fixtures/events/events.fixture.jsonl");

    const coverage = computeCoverage(model.operations, events.items, ["/health"], {
      operationContractsByKey: model.operationContractsByKey
    });

    const report = buildReport(coverage, {
      toolVersion: "test",
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number"),
      payloadConformance: computeHttpPayloadConformance(coverage.allOperations, events.items, {
        operationContractsByKey: model.operationContractsByKey
      })
    });

    expect(report.schemaVersion).toBe(REPORT_SCHEMA_VERSION);
    expect(report.phase).toEqual({ id: "02", slug: "coverage-metrics-and-cli-reporting" });
    expect(report.summary.operationCoveragePercent).toBeGreaterThanOrEqual(0);
    expect(report.coverage.perOperation.every((entry) => entry.operationKey && entry.method && entry.route)).toBe(true);
    expect(report.httpPayloadConformance.summary.request.notApplicableOperations).toBe(report.coverage.perOperation.length);
    expect(report.httpPayloadConformance.diagnostics.counts).toEqual({ covered: 0, uncovered: 0, skipped: 0 });
    expect(["ok", "partial", "invalid"]).toContain(report.status);
    expect(report.governance.exclusions.appliedRules).toEqual([]);
    expect(report.governance.exclusions.unmatchedRules).toEqual([]);
  });

  it("includes exclusion transparency and governance diagnostics deterministically", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/simple.yaml");
    const events = await readHttpEventsJsonl("test/fixtures/events/events.valid.fixture.jsonl");
    const coverage = computeCoverage(model.operations, events.items, [], {
      operationContractsByKey: model.operationContractsByKey
    });

    const diagnostics: GovernanceFailure[] = [
      {
        failureClass: "gate",
        gateKind: "threshold",
        code: "GATE_MIN_COVERAGE_WARNING",
        reason: "warning",
        hint: "hint",
        exitCode: 3,
        severity: "warning"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
        reason: "unsupported schema",
        hint: "hint",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /compile-fail"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT",
        reason: "unsupported schema format",
        hint: "hint",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /custom-format"
      },
      {
        failureClass: "input",
        code: "INPUT_EVENTS_INVALID_LINES",
        reason: "error",
        hint: "hint",
        exitCode: 2,
        severity: "error"
      }
    ];

    const report = buildReport(coverage, {
      toolVersion: "test",
      payloadConformance: computeHttpPayloadConformance(model.operations, events.items, {
        operationContractsByKey: model.operationContractsByKey
      }),
      governance: {
        exclusions: {
          appliedRules: [
            {
              id: "rule-2",
              pattern: "/z/*",
              rationale: "temp",
              owner: "qa",
              expiresOn: "2099-01-01",
              allowBroadWildcard: false,
              allowCriticalOverride: true,
              source: "policy-file",
              matchedOperationCount: 1,
              matchedOperationKeys: ["http GET /z", "http GET /a"],
              usedCriticalOverride: true
            }
          ],
          unmatchedRules: [
            {
              id: "rule-3",
              pattern: "/none/*",
              rationale: "temp",
              owner: "qa",
              expiresOn: "2099-01-01",
              allowBroadWildcard: false,
              allowCriticalOverride: false,
              source: "policy-file",
              message: "no match"
            }
          ]
        },
        diagnostics
      }
    });

    expect(report.governance.exclusions.appliedRules[0].matchedOperationKeys).toEqual(["http GET /a", "http GET /z"]);
    expect(report.governance.exclusions.appliedRules[0].usedCriticalOverride).toBe(true);
    expect(report.governance.diagnostics.map((item) => item.code)).toEqual([
      "INPUT_EVENTS_INVALID_LINES",
      "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT",
      "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
      "GATE_MIN_COVERAGE_WARNING"
    ]);
  });

  it("serializes shared S03 format/media fixtures through governance without changing operation coverage numerators", async () => {
    const report = await buildFormatMediaFixtureReport([
      "test/fixtures/events/http-payload-valid-format.fixture.jsonl",
      "test/fixtures/events/http-payload-invalid-format.fixture.jsonl",
      "test/fixtures/events/http-payload-unsupported-format.fixture.jsonl",
      "test/fixtures/events/http-payload-media-specificity.fixture.jsonl"
    ]);

    expect(report.status).toBe("partial");
    expect(report.summary.totalOperations).toBe(4);
    expect(report.summary.coveredOperations).toBe(4);
    expect(report.summary.operationCoveragePercent).toBe(100);
    expect(report.coverage.operations).toEqual({ state: "COVERED", percent: 100 });
    expect(report.httpPayloadConformance.summary.request).toEqual({
      coveredOperations: 1,
      partialOperations: 0,
      uncoveredOperations: 2,
      skippedOperations: 1,
      notApplicableOperations: 0,
      observedCount: 4,
      validCount: 1,
      invalidCount: 2,
      skippedCount: 1
    });
    expect(report.httpPayloadConformance.summary.response).toEqual({
      coveredOperations: 4,
      partialOperations: 0,
      uncoveredOperations: 0,
      skippedOperations: 0,
      notApplicableOperations: 0,
      observedCount: 4,
      validCount: 4,
      invalidCount: 0,
      skippedCount: 0
    });
    expect(report.governance.diagnostics).toEqual([
      {
        severity: "error",
        class: "semantic",
        code: "SEMANTIC_HTTP_INVALID_BODY",
        message: "request payload for http POST /incidents media=application/problem+json failed JSON schema validation.",
        operationKey: "http POST /incidents"
      },
      {
        severity: "error",
        class: "semantic",
        code: "SEMANTIC_HTTP_INVALID_BODY",
        message: "request payload for http POST /verifications media=application/json failed JSON schema validation.",
        operationKey: "http POST /verifications"
      },
      {
        severity: "error",
        class: "semantic",
        code: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT",
        message:
          "request payload for http POST /custom-format media=application/json declares a schema format outside Yanote's supported payload format allowlist.",
        operationKey: "http POST /custom-format"
      }
    ]);
    expect(
      pickPayloadStates(report, [
        "http POST /subscribers",
        "http POST /verifications",
        "http POST /custom-format",
        "http POST /incidents"
      ])
    ).toEqual({
      "http POST /subscribers": { request: "COVERED", response: "COVERED", suites: ["suite-format-valid"] },
      "http POST /verifications": { request: "UNCOVERED", response: "COVERED", suites: ["suite-format-invalid"] },
      "http POST /custom-format": { request: "SKIPPED", response: "COVERED", suites: ["suite-format-unsupported"] },
      "http POST /incidents": { request: "UNCOVERED", response: "COVERED", suites: ["suite-media-specificity"] }
    });
    expect(
      report.httpPayloadConformance.diagnostics.items
        .filter((item) => item.operationKey === "http POST /incidents")
        .map((item) => ({ target: item.target, code: item.code, observedMediaType: item.observedMediaType }))
    ).toEqual([
      { target: "request", code: "INVALID_BODY", observedMediaType: "application/problem+json" },
      { target: "response", code: "VALID", observedMediaType: "application/problem+json" }
    ]);
  });

  it.each([
    {
      name: "unsupported media",
      eventsPath: "test/fixtures/events/http-payload-unsupported.fixture.jsonl",
      coverage: { state: "PARTIAL", percent: 16.67 },
      requestSummary: {
        coveredOperations: 0,
        partialOperations: 0,
        uncoveredOperations: 0,
        skippedOperations: 1,
        notApplicableOperations: 5,
        observedCount: 1,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 1
      },
      responseSummary: {
        coveredOperations: 0,
        partialOperations: 0,
        uncoveredOperations: 0,
        skippedOperations: 1,
        notApplicableOperations: 5,
        observedCount: 1,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 1
      },
      diagnosticsCounts: { covered: 0, uncovered: 0, skipped: 2 },
      states: {
        "http POST /notes": { request: "SKIPPED", response: "SKIPPED", suites: ["suite-notes"] }
      },
      diagnostics: [
        {
          operationKey: "http POST /notes",
          target: "request",
          state: "SKIPPED",
          code: "UNSUPPORTED_MEDIA_TYPE",
          suite: "suite-notes",
          declaredStatus: undefined,
          observedStatus: undefined,
          observedMediaType: "text/plain",
          errors: undefined
        },
        {
          operationKey: "http POST /notes",
          target: "response",
          state: "SKIPPED",
          code: "UNSUPPORTED_MEDIA_TYPE",
          suite: "suite-notes",
          declaredStatus: "202",
          observedStatus: 202,
          observedMediaType: "text/plain",
          errors: undefined
        }
      ]
    },
    {
      name: "invalid request and response bodies",
      eventsPath: "test/fixtures/events/http-payload-invalid.fixture.jsonl",
      coverage: { state: "PARTIAL", percent: 33.33 },
      requestSummary: {
        coveredOperations: 0,
        partialOperations: 0,
        uncoveredOperations: 1,
        skippedOperations: 0,
        notApplicableOperations: 5,
        observedCount: 1,
        validCount: 0,
        invalidCount: 1,
        skippedCount: 0
      },
      responseSummary: {
        coveredOperations: 1,
        partialOperations: 0,
        uncoveredOperations: 1,
        skippedOperations: 0,
        notApplicableOperations: 4,
        observedCount: 2,
        validCount: 1,
        invalidCount: 1,
        skippedCount: 0
      },
      diagnosticsCounts: { covered: 1, uncovered: 2, skipped: 0 },
      states: {
        "http GET /audits": { request: "N/A", response: "UNCOVERED", suites: ["suite-invalid-response"] },
        "http POST /users": { request: "UNCOVERED", response: "COVERED", suites: ["suite-invalid-request"] }
      },
      diagnostics: [
        {
          operationKey: "http GET /audits",
          target: "response",
          state: "UNCOVERED",
          code: "INVALID_BODY",
          suite: "suite-invalid-response",
          declaredStatus: "200",
          observedStatus: 200,
          observedMediaType: "application/json",
          errors: ["/entries/0 must be string"]
        },
        {
          operationKey: "http POST /users",
          target: "request",
          state: "UNCOVERED",
          code: "INVALID_BODY",
          suite: "suite-invalid-request",
          declaredStatus: undefined,
          observedStatus: undefined,
          observedMediaType: "application/json",
          errors: ["/ must have required property 'profile'"]
        },
        {
          operationKey: "http POST /users",
          target: "response",
          state: "COVERED",
          code: "VALID",
          suite: "suite-invalid-request",
          declaredStatus: "201",
          observedStatus: 201,
          observedMediaType: "application/json",
          errors: undefined
        }
      ]
    },
    {
      name: "missing body and content type evidence",
      eventsPath: "test/fixtures/events/http-payload-missing.fixture.jsonl",
      coverage: { state: "PARTIAL", percent: 66.67 },
      requestSummary: {
        coveredOperations: 0,
        partialOperations: 0,
        uncoveredOperations: 2,
        skippedOperations: 0,
        notApplicableOperations: 4,
        observedCount: 2,
        validCount: 0,
        invalidCount: 2,
        skippedCount: 0
      },
      responseSummary: {
        coveredOperations: 2,
        partialOperations: 0,
        uncoveredOperations: 1,
        skippedOperations: 0,
        notApplicableOperations: 3,
        observedCount: 4,
        validCount: 2,
        invalidCount: 2,
        skippedCount: 0
      },
      diagnosticsCounts: { covered: 2, uncovered: 4, skipped: 0 },
      states: {
        "http GET /audits": {
          request: "N/A",
          response: "UNCOVERED",
          suites: ["suite-missing-response", "suite-missing-response-content-type"]
        },
        "http POST /drafts": { request: "N/A", response: "COVERED", suites: ["suite-optional-request"] },
        "http POST /profiles": { request: "UNCOVERED", response: "N/A", suites: ["suite-missing-request"] },
        "http POST /users": {
          request: "UNCOVERED",
          response: "COVERED",
          suites: ["suite-missing-request-content-type"]
        }
      },
      diagnostics: [
        {
          operationKey: "http GET /audits",
          target: "response",
          state: "UNCOVERED",
          code: "MISSING_BODY",
          suite: "suite-missing-response",
          declaredStatus: "200",
          observedStatus: 200,
          observedMediaType: undefined,
          errors: undefined
        },
        {
          operationKey: "http GET /audits",
          target: "response",
          state: "UNCOVERED",
          code: "MISSING_CONTENT_TYPE",
          suite: "suite-missing-response-content-type",
          declaredStatus: "200",
          observedStatus: 200,
          observedMediaType: undefined,
          errors: undefined
        },
        {
          operationKey: "http POST /drafts",
          target: "response",
          state: "COVERED",
          code: "VALID",
          suite: "suite-optional-request",
          declaredStatus: "202",
          observedStatus: 202,
          observedMediaType: "application/json",
          errors: undefined
        },
        {
          operationKey: "http POST /profiles",
          target: "request",
          state: "UNCOVERED",
          code: "MISSING_BODY",
          suite: "suite-missing-request",
          declaredStatus: undefined,
          observedStatus: undefined,
          observedMediaType: undefined,
          errors: undefined
        },
        {
          operationKey: "http POST /users",
          target: "request",
          state: "UNCOVERED",
          code: "MISSING_CONTENT_TYPE",
          suite: "suite-missing-request-content-type",
          declaredStatus: undefined,
          observedStatus: undefined,
          observedMediaType: undefined,
          errors: undefined
        },
        {
          operationKey: "http POST /users",
          target: "response",
          state: "COVERED",
          code: "VALID",
          suite: "suite-missing-request-content-type",
          declaredStatus: "201",
          observedStatus: 201,
          observedMediaType: "application/json",
          errors: undefined
        }
      ]
    },
    {
      name: "partial payload conformance without touching observation coverage",
      eventsPath: "test/fixtures/events/http-payload-partial.fixture.jsonl",
      coverage: { state: "PARTIAL", percent: 16.67 },
      requestSummary: {
        coveredOperations: 0,
        partialOperations: 1,
        uncoveredOperations: 0,
        skippedOperations: 0,
        notApplicableOperations: 5,
        observedCount: 2,
        validCount: 1,
        invalidCount: 1,
        skippedCount: 0
      },
      responseSummary: {
        coveredOperations: 0,
        partialOperations: 1,
        uncoveredOperations: 0,
        skippedOperations: 0,
        notApplicableOperations: 5,
        observedCount: 2,
        validCount: 1,
        invalidCount: 1,
        skippedCount: 0
      },
      diagnosticsCounts: { covered: 2, uncovered: 2, skipped: 0 },
      states: {
        "http POST /orders": { request: "PARTIAL", response: "PARTIAL", suites: ["suite-orders"] }
      },
      diagnostics: [
        {
          operationKey: "http POST /orders",
          target: "request",
          state: "UNCOVERED",
          code: "INVALID_BODY",
          suite: "suite-orders",
          declaredStatus: undefined,
          observedStatus: undefined,
          observedMediaType: "application/json",
          errors: ["/quantity must be >= 1"]
        },
        {
          operationKey: "http POST /orders",
          target: "request",
          state: "COVERED",
          code: "VALID",
          suite: "suite-orders",
          declaredStatus: undefined,
          observedStatus: undefined,
          observedMediaType: "application/json",
          errors: undefined
        },
        {
          operationKey: "http POST /orders",
          target: "response",
          state: "UNCOVERED",
          code: "INVALID_BODY",
          suite: "suite-orders",
          declaredStatus: "201",
          observedStatus: 201,
          observedMediaType: "application/json",
          errors: ["/ must have required property 'status'"]
        },
        {
          operationKey: "http POST /orders",
          target: "response",
          state: "COVERED",
          code: "VALID",
          suite: "suite-orders",
          declaredStatus: "201",
          observedStatus: 201,
          observedMediaType: "application/json",
          errors: undefined
        }
      ]
    }
  ])("serializes $name through the dedicated httpPayloadConformance surface", async ({
    eventsPath,
    coverage,
    requestSummary,
    responseSummary,
    diagnosticsCounts,
    states,
    diagnostics
  }) => {
    const report = await buildPayloadFixtureReport(eventsPath);

    expect(report.status).toBe("partial");
    expect(report.summary.totalOperations).toBe(6);
    expect(report.coverage.operations).toEqual(coverage);
    expect(report.httpPayloadConformance.summary.request).toEqual(requestSummary);
    expect(report.httpPayloadConformance.summary.response).toEqual(responseSummary);
    expect(report.httpPayloadConformance.diagnostics.counts).toEqual(diagnosticsCounts);
    expect(report.coverage).not.toHaveProperty("payload");
    expect(report.httpPayloadConformance.perOperation).toHaveLength(report.coverage.perOperation.length);
    expect(pickPayloadStates(report, Object.keys(states))).toEqual(states);
    expect(pickPayloadDiagnostics(report)).toEqual(diagnostics);
  });

  it.each([
    {
      name: "invalid-body",
      code: "SEMANTIC_HTTP_INVALID_BODY",
      governanceMessage: "request payload for http POST /users/{param} media=application/json failed JSON schema validation.",
      requestState: "UNCOVERED",
      responseState: "COVERED"
    },
    {
      name: "unsupported-media",
      code: "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
      governanceMessage:
        "request payload for http POST /notes/{param} media=text/plain uses a declared media type outside JSON payload conformance support.",
      requestState: "SKIPPED",
      responseState: "SKIPPED"
    },
    {
      name: "unsupported-schema",
      code: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
      governanceMessage:
        "request payload for http POST /compile-fail/{param} media=application/json declares JSON content without a usable validation schema.",
      requestState: "SKIPPED",
      responseState: "SKIPPED"
    }
  ])("downgrades fully observed $name payload drift to partial without changing observation coverage", async ({
    name,
    code,
    governanceMessage,
    requestState,
    responseState
  }) => {
    const report = await buildFullObservationPayloadTruthReport(name as "invalid-body" | "unsupported-media" | "unsupported-schema");

    expect(report.status).toBe("partial");
    expect(report.coverage.operations).toEqual({ state: "COVERED", percent: 100 });
    expect(report.coverage.status).toEqual({ state: "COVERED", percent: 100 });
    expect(report.coverage.parameters).toEqual({ state: "COVERED", percent: 100 });
    expect(report.coverage.aggregate).toEqual({ state: "COVERED", percent: 100, explanation: undefined });
    expect(report.summary.operationCoveragePercent).toBe(100);
    expect(report.summary.aggregateCoveragePercent).toBe(100);
    expect(report.governance.diagnostics).toEqual([
      {
        severity: "error",
        class: "semantic",
        code,
        message: governanceMessage,
        operationKey: report.coverage.perOperation[0]?.operationKey
      },
      ...(name === "unsupported-media" || name === "unsupported-schema"
        ? [
            {
              severity: "error" as const,
              class: "semantic" as const,
              code,
              message:
                name === "unsupported-media"
                  ? "response payload for http POST /notes/{param} declared-status=202 observed-status=202 media=text/plain uses a declared media type outside JSON payload conformance support."
                  : "response payload for http POST /compile-fail/{param} declared-status=202 observed-status=202 media=application/json declares JSON content without a usable validation schema.",
              operationKey: report.coverage.perOperation[0]?.operationKey
            }
          ]
        : [])
    ]);
    expect(report.httpPayloadConformance.perOperation[0]).toMatchObject({
      request: { state: requestState },
      response: { state: responseState }
    });
  });
});
