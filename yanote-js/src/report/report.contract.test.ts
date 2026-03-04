import { describe, expect, it } from "vitest";
import type { YanoteReport } from "./report.js";
import { normalizeReport, roundCoverage } from "./normalize.js";
import { REPORT_SCHEMA_VERSION, validateReport } from "./schema.js";

const baseReport: YanoteReport = {
  schemaVersion: REPORT_SCHEMA_VERSION,
  generatedAt: "1970-01-01T00:00:00.000Z",
  toolVersion: "test",
  phase: {
    id: "02",
    slug: "coverage-metrics-and-cli-reporting"
  },
  status: "ok",
  summary: {
    totalOperations: 1,
    coveredOperations: 1,
    operationCoveragePercent: 100,
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
  diagnostics: {
    counts: {
      invalid: 0,
      ambiguous: 0,
      unmatched: 0
    },
    items: []
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

  it("normalizes ordering and rounds coverage values deterministically", () => {
    const normalized = normalizeReport({
      ...baseReport,
      summary: {
        ...baseReport.summary,
        operationCoveragePercent: 33.3333,
        aggregateCoveragePercent: 16.6666
      },
      coverage: {
        ...baseReport.coverage,
        perOperation: [
          {
            ...baseReport.coverage.perOperation[0],
            operationKey: "http GET /z",
            route: "/z",
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
      }
    });

    expect(normalized.summary.operationCoveragePercent).toBe(roundCoverage(33.3333));
    expect(normalized.summary.aggregateCoveragePercent).toBe(roundCoverage(16.6666));
    expect(normalized.coverage.perOperation.map((entry) => entry.operationKey)).toEqual(["http GET /a", "http GET /z"]);
    expect(normalized.coverage.perOperation[1].suites).toEqual(["suite-a", "suite-b"]);
    expect(normalized.coverage.perOperation[1].status.declared).toEqual(["200", "404"]);
    expect(normalized.diagnostics.items.map((item) => item.kind)).toEqual(["invalid", "ambiguous", "unmatched"]);
  });
});
