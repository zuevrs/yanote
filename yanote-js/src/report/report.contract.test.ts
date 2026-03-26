import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeCoverage } from "../coverage/coverage.js";
import { computeHttpPayloadConformance } from "../coverage/httpPayloadConformance.js";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { loadOpenApiCoverageModel } from "../spec/openapi.js";
import type { YanoteReport } from "./report.js";
import { buildReport } from "./report.js";
import { normalizeReport, roundCoverage } from "./normalize.js";
import { REPORT_SCHEMA_VERSION, validateReport } from "./schema.js";

function localFileSpecSource(reference: string) {
  return {
    kind: "local-file" as const,
    reference
  };
}

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
    specSource: localFileSpecSource("test/fixtures/openapi/http-payload.yaml"),
    eventTimestamps: events.items
      .map((event) => event.ts)
      .filter((timestamp): timestamp is number => typeof timestamp === "number"),
    payloadConformance
  });
}

async function buildDeprecatedFixtureReport(): Promise<YanoteReport> {
  const specPath = "test/fixtures/openapi/http-deprecated-operations.yaml";
  const eventsPath = "test/fixtures/events/http-deprecated-operations.fixture.jsonl";
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
    specSource: localFileSpecSource(specPath),
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
    specSource: localFileSpecSource("test/fixtures/openapi/http-payload-format-media.yaml"),
    eventTimestamps: items.map((event) => event.ts).filter((timestamp): timestamp is number => typeof timestamp === "number"),
    payloadConformance
  });
}

async function buildFullObservationPayloadTruthReport(
  scenario: "invalid-body" | "unsupported-media" | "unsupported-schema"
): Promise<YanoteReport> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "yanote-report-contract-truth-"));
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
      ts: 1772449310001,
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
      ts: 1772449310002,
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
      ts: 1772449310003,
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
      specSource: localFileSpecSource(specPath),
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number"),
      payloadConformance
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function summarizePayloadStates(report: YanoteReport) {
  return report.httpPayloadConformance.perOperation
    .filter((entry) => entry.request.state !== "N/A" || entry.response.state !== "N/A")
    .map((entry) => ({
      operationKey: entry.operationKey,
      request: entry.request.state,
      response: entry.response.state,
      suites: entry.suites
    }));
}

function summarizePayloadDiagnostics(report: YanoteReport) {
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

const baseReport: YanoteReport = {
  schemaVersion: REPORT_SCHEMA_VERSION,
  generatedAt: "1970-01-01T00:00:00.000Z",
  toolVersion: "test",
  specSource: localFileSpecSource("test/fixtures/openapi/base.yaml"),
  phase: {
    id: "02",
    slug: "coverage-metrics-and-cli-reporting"
  },
  status: "ok",
  summary: {
    totalOperations: 1,
    coveredOperations: 1,
    operationCoveragePercent: 100,
    deprecatedOperations: {
      totalOperations: 0,
      coveredOperations: 0,
      uncoveredOperations: 0,
      operationCoveragePercent: 0
    },
    aggregateCoveragePercent: null,
    aggregateExplanation: "aggregate is N/A because weighted dimensions include N/A"
  },
  coverage: {
    operations: { state: "COVERED", percent: 100 },
    status: { state: "N/A", percent: null },
    parameters: { state: "N/A", percent: null },
    aggregate: { state: "N/A", percent: null, explanation: "aggregate is N/A because weighted dimensions include N/A" },
    perOperation: [
      {
        operationKey: "http GET /users/{param}",
        method: "GET",
        route: "/users/{param}",
        deprecated: false,
        operation: { state: "COVERED" },
        status: { state: "N/A", declared: [], covered: [], missing: [] },
        parameters: {
          state: "N/A",
          required: { total: 0, covered: 0, missing: [] },
          optional: { total: 0, covered: 0, missing: [] }
        },
        suites: ["suite-a"]
      }
    ]
  },
  httpPayloadConformance: {
    summary: {
      request: {
        coveredOperations: 0,
        partialOperations: 0,
        uncoveredOperations: 0,
        skippedOperations: 0,
        notApplicableOperations: 1,
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
        notApplicableOperations: 1,
        observedCount: 0,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 0
      }
    },
    perOperation: [
      {
        operationKey: "http GET /users/{param}",
        method: "GET",
        route: "/users/{param}",
        request: {
          state: "N/A",
          observedCount: 0,
          validCount: 0,
          invalidCount: 0,
          skippedCount: 0,
          declaredMediaTypes: [],
          observedMediaTypes: []
        },
        response: {
          state: "N/A",
          observedCount: 0,
          validCount: 0,
          invalidCount: 0,
          skippedCount: 0,
          declaredMediaTypes: [],
          observedMediaTypes: [],
          declaredContent: []
        },
        suites: ["suite-a"]
      }
    ],
    diagnostics: {
      counts: {
        covered: 0,
        uncovered: 0,
        skipped: 0
      },
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
    perOperation: [
      {
        operationKey: "http GET /users/{param}",
        method: "GET",
        route: "/users/{param}",
        observedCount: 0,
        counts: {
          capturedValid: 0,
          capturedInvalid: 0,
          redacted: 0,
          omitted: 0,
          unsupported: 0
        },
        parameters: [],
        suites: ["suite-a"]
      }
    ],
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
      declaredOperations: 0,
      observedOperations: 0,
      observedEvaluations: 0,
      counts: {
        satisfied: 0,
        missing: 0,
        unavailable: 0,
        unsupported: 0,
        optional: 0,
        clear: 0
      }
    },
    perOperation: [
      {
        operationKey: "http GET /users/{param}",
        method: "GET",
        route: "/users/{param}",
        observedCount: 0,
        overallTruths: {
          satisfied: 0,
          missing: 0,
          unavailable: 0,
          unsupported: 0,
          optional: 0,
          clear: 0
        },
        branches: [],
        suites: ["suite-a"]
      }
    ],
    diagnostics: {
      counts: {
        satisfied: 0,
        missing: 0,
        unavailable: 0,
        unsupported: 0,
        optional: 0,
        clear: 0
      },
      items: []
    }
  },
  diagnostics: {
    counts: {
      invalid: 0,
      ambiguous: 0,
      unmatched: 0
    },
    items: []
  },
  governance: {
    exclusions: {
      appliedRules: [],
      unmatchedRules: []
    },
    diagnostics: []
  }
};

describe("report schema contract", () => {
  it("requires v1 contract fields and rejects unknown fields", () => {
    const withUnknown = {
      ...baseReport,
      unknownField: true
    } as any;

    const invalid = validateReport(withUnknown);
    expect(invalid.ok).toBe(false);

    const valid = validateReport(baseReport);
    expect(valid.ok).toBe(true);
  });

  it("validates schemaVersion independently from toolVersion", () => {
    const wrongSchema = {
      ...baseReport,
      schemaVersion: "999.0.0",
      toolVersion: "0.1.0"
    };

    const result = validateReport(wrongSchema);
    expect(result.ok).toBe(false);

    const rightSchemaDifferentTool = {
      ...baseReport,
      schemaVersion: REPORT_SCHEMA_VERSION,
      toolVersion: "2.0.0"
    };

    expect(validateReport(rightSchemaDifferentTool).ok).toBe(true);
  });

  it("accepts additive deprecated summary truth without changing legacy coverage numerators or specSource", async () => {
    const report = normalizeReport(await buildDeprecatedFixtureReport());

    expect(validateReport(report).ok).toBe(true);
    expect(report.specSource).toEqual({
      kind: "local-file",
      reference: "test/fixtures/openapi/http-deprecated-operations.yaml"
    });
    expect(report.summary.totalOperations).toBe(3);
    expect(report.summary.coveredOperations).toBe(2);
    expect(report.summary.operationCoveragePercent).toBe(66.67);
    expect(report.summary.deprecatedOperations).toEqual({
      totalOperations: 1,
      coveredOperations: 0,
      uncoveredOperations: 1,
      operationCoveragePercent: 0
    });
    expect(report.coverage.operations).toEqual({ state: "PARTIAL", percent: 66.67 });
    expect(report.coverage.perOperation.map((entry) => ({ operationKey: entry.operationKey, deprecated: entry.deprecated }))).toEqual([
      { operationKey: "http GET /legacy-users", deprecated: true },
      { operationKey: "http GET /users", deprecated: false },
      { operationKey: "http POST /users", deprecated: false }
    ]);
  });

  it("normalizes ordering and rounds coverage values deterministically", () => {
    const normalized = normalizeReport({
      ...baseReport,
      summary: {
        ...baseReport.summary,
        operationCoveragePercent: 33.3333,
        deprecatedOperations: {
          totalOperations: 3,
          coveredOperations: 2,
          uncoveredOperations: 1,
          operationCoveragePercent: 66.6666
        },
        aggregateCoveragePercent: 16.6666
      },
      coverage: {
        ...baseReport.coverage,
        perOperation: [
          {
            ...baseReport.coverage.perOperation[0],
            operationKey: "http GET /z",
            route: "/z",
            deprecated: true,
            suites: ["suite-b", "suite-a"],
            status: { state: "PARTIAL", declared: ["404", "200"], covered: ["200"], missing: ["404"] }
          },
          {
            ...baseReport.coverage.perOperation[0],
            operationKey: "http GET /a",
            route: "/a",
            suites: ["suite-c"]
          }
        ]
      },
      httpPayloadConformance: {
        summary: {
          request: {
            coveredOperations: 1,
            partialOperations: 0,
            uncoveredOperations: 0,
            skippedOperations: 1,
            notApplicableOperations: 0,
            observedCount: 2,
            validCount: 1,
            invalidCount: 0,
            skippedCount: 1
          },
          response: {
            coveredOperations: 1,
            partialOperations: 0,
            uncoveredOperations: 0,
            skippedOperations: 1,
            notApplicableOperations: 0,
            observedCount: 2,
            validCount: 1,
            invalidCount: 0,
            skippedCount: 1
          }
        },
        perOperation: [
          {
            ...baseReport.httpPayloadConformance.perOperation[0],
            operationKey: "http GET /z",
            route: "/z",
            suites: ["suite-b", "suite-a"],
            request: {
              ...baseReport.httpPayloadConformance.perOperation[0].request,
              state: "SKIPPED",
              declaredMediaTypes: ["text/plain", "application/json"],
              observedMediaTypes: ["text/plain", "application/json"]
            },
            response: {
              ...baseReport.httpPayloadConformance.perOperation[0].response,
              state: "COVERED",
              declaredMediaTypes: ["application/json", "application/problem+json"],
              observedMediaTypes: ["application/json"],
              declaredContent: [
                { declaredStatus: "415", mediaTypes: ["application/problem+json", "application/json"] },
                { declaredStatus: "201", mediaTypes: ["application/json"] }
              ]
            }
          },
          {
            ...baseReport.httpPayloadConformance.perOperation[0],
            operationKey: "http GET /a",
            route: "/a",
            suites: ["suite-c"]
          }
        ],
        diagnostics: {
          counts: { covered: 1, uncovered: 0, skipped: 1 },
          items: [
            {
              operationKey: "http GET /z",
              method: "GET",
              route: "/z",
              target: "response",
              suite: "suite-b",
              state: "COVERED",
              code: "VALID",
              message: "ok",
              declaredStatus: "201",
              observedStatus: 201,
              observedMediaType: "application/json",
              declaredMediaTypes: ["application/json"]
            },
            {
              operationKey: "http GET /a",
              method: "GET",
              route: "/a",
              target: "request",
              suite: "suite-a",
              state: "SKIPPED",
              code: "UNSUPPORTED_MEDIA_TYPE",
              message: "skip",
              observedMediaType: "text/plain",
              declaredMediaTypes: ["text/plain", "application/json"],
              errors: ["/b error", "/a error"]
            }
          ]
        }
      },
      diagnostics: {
        counts: { invalid: 1, ambiguous: 1, unmatched: 1 },
        items: [
          { kind: "unmatched", method: "GET", route: "/z", message: "unmatched" },
          {
            kind: "ambiguous",
            method: "GET",
            route: "/a",
            message: "ambiguous",
            candidates: ["GET /z", "GET /a"]
          },
          { kind: "invalid", method: "POST", route: "/x", message: "invalid" }
        ]
      },
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
              allowCriticalOverride: false,
              source: "policy-file",
              matchedOperationCount: 1,
              matchedOperationKeys: ["http GET /z", "http GET /a"],
              usedCriticalOverride: false
            },
            {
              id: "rule-1",
              pattern: "/a/*",
              rationale: "temp",
              owner: "qa",
              expiresOn: "2099-01-01",
              allowBroadWildcard: false,
              allowCriticalOverride: false,
              source: "policy-file",
              matchedOperationCount: 1,
              matchedOperationKeys: ["http GET /a"],
              usedCriticalOverride: true
            }
          ],
          unmatchedRules: [
            {
              id: "rule-3",
              pattern: "/zz/*",
              rationale: "temp",
              owner: "qa",
              expiresOn: "2099-01-01",
              source: "policy-file",
              message: "none"
            }
          ]
        },
        diagnostics: [
          { severity: "warning", class: "gate", code: "WARN_B", message: "b" },
          {
            severity: "error",
            class: "semantic",
            code: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
            message: "unsupported schema",
            operationKey: "http POST /compile-fail"
          },
          {
            severity: "error",
            class: "semantic",
            code: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT",
            message: "unsupported schema format",
            operationKey: "http POST /custom-format"
          },
          { severity: "error", class: "input", code: "ERR_A", message: "a", operationKey: "http GET /z" }
        ]
      }
    });

    expect(normalized.summary.operationCoveragePercent).toBe(roundCoverage(33.3333));
    expect(normalized.summary.deprecatedOperations.operationCoveragePercent).toBe(roundCoverage(66.6666));
    expect(normalized.summary.aggregateCoveragePercent).toBe(roundCoverage(16.6666));
    expect(normalized.coverage.perOperation.map((entry) => entry.operationKey)).toEqual(["http GET /a", "http GET /z"]);
    expect(normalized.coverage.perOperation.map((entry) => entry.deprecated)).toEqual([false, true]);
    expect(normalized.coverage.perOperation[1].suites).toEqual(["suite-a", "suite-b"]);
    expect(normalized.coverage.perOperation[1].status.declared).toEqual(["200", "404"]);
    expect(normalized.httpPayloadConformance.perOperation.map((entry) => entry.operationKey)).toEqual(["http GET /a", "http GET /z"]);
    expect(normalized.httpPayloadConformance.perOperation[1].request.declaredMediaTypes).toEqual([
      "application/json",
      "text/plain"
    ]);
    expect(normalized.httpPayloadConformance.perOperation[1].response.declaredContent).toEqual([
      { declaredStatus: "201", mediaTypes: ["application/json"] },
      { declaredStatus: "415", mediaTypes: ["application/json", "application/problem+json"] }
    ]);
    expect(normalized.httpPayloadConformance.diagnostics.items[0].declaredMediaTypes).toEqual([
      "application/json",
      "text/plain"
    ]);
    expect(normalized.httpPayloadConformance.diagnostics.items[0].errors).toEqual(["/a error", "/b error"]);
    expect(normalized.diagnostics.items.map((item) => item.kind)).toEqual(["invalid", "ambiguous", "unmatched"]);
    expect(normalized.governance.exclusions.appliedRules.map((rule) => rule.id)).toEqual(["rule-1", "rule-2"]);
    expect(normalized.governance.diagnostics.map((item) => item.code)).toEqual([
      "ERR_A",
      "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT",
      "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
      "WARN_B"
    ]);
  });

  it("keeps the shared S03 format/media matrix schema-valid while surfacing invalid-format and unsupported-format truth", async () => {
    const report = normalizeReport(
      await buildFormatMediaFixtureReport([
        "test/fixtures/events/http-payload-valid-format.fixture.jsonl",
        "test/fixtures/events/http-payload-invalid-format.fixture.jsonl",
        "test/fixtures/events/http-payload-unsupported-format.fixture.jsonl",
        "test/fixtures/events/http-payload-media-specificity.fixture.jsonl"
      ])
    );

    expect(validateReport(report).ok).toBe(true);
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
    expect(summarizePayloadStates(report)).toEqual([
      { operationKey: "http POST /custom-format", request: "SKIPPED", response: "COVERED", suites: ["suite-format-unsupported"] },
      { operationKey: "http POST /incidents", request: "UNCOVERED", response: "COVERED", suites: ["suite-media-specificity"] },
      { operationKey: "http POST /subscribers", request: "COVERED", response: "COVERED", suites: ["suite-format-valid"] },
      { operationKey: "http POST /verifications", request: "UNCOVERED", response: "COVERED", suites: ["suite-format-invalid"] }
    ]);
    expect(summarizePayloadDiagnostics(report)).toEqual([
      {
        operationKey: "http POST /custom-format",
        target: "request",
        state: "SKIPPED",
        code: "UNSUPPORTED_SCHEMA_FORMAT",
        suite: "suite-format-unsupported",
        declaredStatus: undefined,
        observedStatus: undefined,
        observedMediaType: "application/json",
        errors: [
          "/properties/externalId declares unsupported schema format \"yanote-customer-id\" outside Yanote's supported payload format allowlist."
        ]
      },
      {
        operationKey: "http POST /custom-format",
        target: "response",
        state: "COVERED",
        code: "VALID",
        suite: "suite-format-unsupported",
        declaredStatus: "202",
        observedStatus: 202,
        observedMediaType: "application/json",
        errors: undefined
      },
      {
        operationKey: "http POST /incidents",
        target: "request",
        state: "UNCOVERED",
        code: "INVALID_BODY",
        suite: "suite-media-specificity",
        declaredStatus: undefined,
        observedStatus: undefined,
        observedMediaType: "application/problem+json",
        errors: ["/ must have required property 'detail'"]
      },
      {
        operationKey: "http POST /incidents",
        target: "response",
        state: "COVERED",
        code: "VALID",
        suite: "suite-media-specificity",
        declaredStatus: "202",
        observedStatus: 202,
        observedMediaType: "application/problem+json",
        errors: undefined
      },
      {
        operationKey: "http POST /subscribers",
        target: "request",
        state: "COVERED",
        code: "VALID",
        suite: "suite-format-valid",
        declaredStatus: undefined,
        observedStatus: undefined,
        observedMediaType: "application/json",
        errors: undefined
      },
      {
        operationKey: "http POST /subscribers",
        target: "response",
        state: "COVERED",
        code: "VALID",
        suite: "suite-format-valid",
        declaredStatus: "201",
        observedStatus: 201,
        observedMediaType: "application/json",
        errors: undefined
      },
      {
        operationKey: "http POST /verifications",
        target: "request",
        state: "UNCOVERED",
        code: "INVALID_BODY",
        suite: "suite-format-invalid",
        declaredStatus: undefined,
        observedStatus: undefined,
        observedMediaType: "application/json",
        errors: ["/email must match format \"email\""]
      },
      {
        operationKey: "http POST /verifications",
        target: "response",
        state: "COVERED",
        code: "VALID",
        suite: "suite-format-invalid",
        declaredStatus: "202",
        observedStatus: 202,
        observedMediaType: "application/json",
        errors: undefined
      }
    ]);
    expect(report.governance.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "SEMANTIC_HTTP_INVALID_BODY",
      "SEMANTIC_HTTP_INVALID_BODY",
      "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT"
    ]);
    expect(report.governance.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
      "request payload for http POST /incidents media=application/problem+json failed JSON schema validation.",
      "request payload for http POST /verifications media=application/json failed JSON schema validation.",
      "request payload for http POST /custom-format media=application/json declares a schema format outside Yanote's supported payload format allowlist."
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
      states: [{ operationKey: "http POST /notes", request: "SKIPPED", response: "SKIPPED", suites: ["suite-notes"] }],
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
      name: "invalid bodies",
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
      states: [
        { operationKey: "http GET /audits", request: "N/A", response: "UNCOVERED", suites: ["suite-invalid-response"] },
        { operationKey: "http POST /users", request: "UNCOVERED", response: "COVERED", suites: ["suite-invalid-request"] }
      ],
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
      states: [
        {
          operationKey: "http GET /audits",
          request: "N/A",
          response: "UNCOVERED",
          suites: ["suite-missing-response", "suite-missing-response-content-type"]
        },
        { operationKey: "http POST /drafts", request: "N/A", response: "COVERED", suites: ["suite-optional-request"] },
        { operationKey: "http POST /profiles", request: "UNCOVERED", response: "N/A", suites: ["suite-missing-request"] },
        {
          operationKey: "http POST /users",
          request: "UNCOVERED",
          response: "COVERED",
          suites: ["suite-missing-request-content-type"]
        }
      ],
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
      name: "partial request and response evidence",
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
      states: [{ operationKey: "http POST /orders", request: "PARTIAL", response: "PARTIAL", suites: ["suite-orders"] }],
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
  ])("validates the richer payload drift matrix for $name without changing the report contract", async ({
    eventsPath,
    coverage,
    requestSummary,
    responseSummary,
    diagnosticsCounts,
    states,
    diagnostics
  }) => {
    const report = normalizeReport(await buildPayloadFixtureReport(eventsPath));

    expect(validateReport(report).ok).toBe(true);
    expect(report.coverage.operations).toEqual(coverage);
    expect(report.summary.operationCoveragePercent).toBe(coverage.percent);
    expect(report.httpPayloadConformance.summary.request).toEqual(requestSummary);
    expect(report.httpPayloadConformance.summary.response).toEqual(responseSummary);
    expect(report.httpPayloadConformance.diagnostics.counts).toEqual(diagnosticsCounts);
    expect(report.httpPayloadConformance.perOperation).toHaveLength(report.coverage.perOperation.length);
    expect(summarizePayloadStates(report)).toEqual(states);
    expect(summarizePayloadDiagnostics(report)).toEqual(diagnostics);
    expect(report.httpPayloadConformance).toHaveProperty("summary");
    expect(report.summary).not.toHaveProperty("payloadCoveragePercent");
    expect(report.coverage).not.toHaveProperty("httpPayloadConformance");
  });

  it.each([
    {
      name: "invalid-body",
      code: "SEMANTIC_HTTP_INVALID_BODY",
      messages: ["request payload for http POST /users/{param} media=application/json failed JSON schema validation."],
      payloadStates: [{ operationKey: "http POST /users/{param}", request: "UNCOVERED", response: "COVERED", suites: ["suite-invalid-body"] }]
    },
    {
      name: "unsupported-media",
      code: "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
      messages: [
        "request payload for http POST /notes/{param} media=text/plain uses a declared media type outside JSON payload conformance support.",
        "response payload for http POST /notes/{param} declared-status=202 observed-status=202 media=text/plain uses a declared media type outside JSON payload conformance support."
      ],
      payloadStates: [
        { operationKey: "http POST /notes/{param}", request: "SKIPPED", response: "SKIPPED", suites: ["suite-unsupported-media"] }
      ]
    },
    {
      name: "unsupported-schema",
      code: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
      messages: [
        "request payload for http POST /compile-fail/{param} media=application/json declares JSON content without a usable validation schema.",
        "response payload for http POST /compile-fail/{param} declared-status=202 observed-status=202 media=application/json declares JSON content without a usable validation schema."
      ],
      payloadStates: [
        {
          operationKey: "http POST /compile-fail/{param}",
          request: "SKIPPED",
          response: "SKIPPED",
          suites: ["suite-unsupported-schema"]
        }
      ]
    }
  ])("keeps full-observation $name payload drift schema-valid while surfacing semantic truth", async ({
    name,
    code,
    messages,
    payloadStates
  }) => {
    const report = normalizeReport(await buildFullObservationPayloadTruthReport(name as "invalid-body" | "unsupported-media" | "unsupported-schema"));

    expect(validateReport(report).ok).toBe(true);
    expect(report.status).toBe("partial");
    expect(report.coverage.operations).toEqual({ state: "COVERED", percent: 100 });
    expect(report.coverage.status).toEqual({ state: "COVERED", percent: 100 });
    expect(report.coverage.parameters).toEqual({ state: "COVERED", percent: 100 });
    expect(report.coverage.aggregate).toEqual({ state: "COVERED", percent: 100, explanation: undefined });
    expect(report.summary.operationCoveragePercent).toBe(100);
    expect(report.summary.aggregateCoveragePercent).toBe(100);
    expect(report.governance.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(messages.map(() => code));
    expect(report.governance.diagnostics.map((diagnostic) => diagnostic.message)).toEqual(messages);
    expect(summarizePayloadStates(report)).toEqual(payloadStates);
  });

  it("accepts unsupported-schema diagnostics through the same top-level httpPayloadConformance contract", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "yanote-report-contract-"));
    const specPath = path.join(tempDir, "unsupported-schema.yaml");
    const eventsPath = path.join(tempDir, "unsupported-schema.fixture.jsonl");

    await writeFile(
      specPath,
      [
        "openapi: 3.0.0",
        "info:",
        "  title: unsupported schema fixture",
        "  version: 1.0.0",
        "paths:",
        "  /compile-fail:",
        "    post:",
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
      ].join("\n"),
      "utf8"
    );

    await writeFile(
      eventsPath,
      [
        JSON.stringify({
          kind: "http",
          ts: 1772449205657,
          method: "POST",
          route: "/compile-fail",
          status: 202,
          requestBody: "hello",
          requestContentType: "application/json",
          responseBody: "ok",
          responseContentType: "application/json",
          queryKeys: [],
          headerKeys: ["content-type"],
          "test.run_id": "run-schema",
          "test.suite": "suite-schema"
        })
      ].join("\n"),
      "utf8"
    );

    try {
      const model = await loadOpenApiCoverageModel(specPath);
      const events = await readHttpEventsJsonl(eventsPath);
      const coverage = computeCoverage(model.operations, events.items, [], {
        operationContractsByKey: model.operationContractsByKey
      });
      const payloadConformance = computeHttpPayloadConformance(model.operations, events.items, {
        operationContractsByKey: model.operationContractsByKey
      });
      const report = normalizeReport(
        buildReport(coverage, {
          toolVersion: "test",
          specSource: localFileSpecSource(specPath),
          eventTimestamps: events.items
            .map((event) => event.ts)
            .filter((timestamp): timestamp is number => typeof timestamp === "number"),
          payloadConformance
        })
      );

      expect(validateReport(report).ok).toBe(true);
      expect(report.status).toBe("partial");
      expect(report.coverage.operations).toEqual({ state: "COVERED", percent: 100 });
      expect(report.httpPayloadConformance.summary.request).toEqual({
        coveredOperations: 0,
        partialOperations: 0,
        uncoveredOperations: 0,
        skippedOperations: 1,
        notApplicableOperations: 0,
        observedCount: 1,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 1
      });
      expect(report.httpPayloadConformance.summary.response).toEqual({
        coveredOperations: 0,
        partialOperations: 0,
        uncoveredOperations: 0,
        skippedOperations: 1,
        notApplicableOperations: 0,
        observedCount: 1,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 1
      });
      expect(report.httpPayloadConformance.diagnostics.counts).toEqual({ covered: 0, uncovered: 0, skipped: 2 });
      expect(summarizePayloadStates(report)).toEqual([
        {
          operationKey: "http POST /compile-fail",
          request: "SKIPPED",
          response: "SKIPPED",
          suites: ["suite-schema"]
        }
      ]);
      expect(summarizePayloadDiagnostics(report)).toEqual([
        {
          operationKey: "http POST /compile-fail",
          target: "request",
          state: "SKIPPED",
          code: "UNSUPPORTED_SCHEMA",
          suite: "suite-schema",
          declaredStatus: undefined,
          observedStatus: undefined,
          observedMediaType: "application/json",
          errors: [expect.stringContaining("Invalid regular expression")]
        },
        {
          operationKey: "http POST /compile-fail",
          target: "response",
          state: "SKIPPED",
          code: "UNSUPPORTED_SCHEMA",
          suite: "suite-schema",
          declaredStatus: "202",
          observedStatus: 202,
          observedMediaType: "application/json",
          errors: [expect.stringContaining("Invalid regular expression")]
        }
      ]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
