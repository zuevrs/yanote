import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { YanoteReport } from "./report.js";
import { writeYanoteReport } from "./writeReport.js";
import { REPORT_SCHEMA_VERSION } from "./schema.js";

function makeReport(): YanoteReport {
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt: "1970-01-01T00:00:00.000Z",
    toolVersion: "test",
    phase: {
      id: "02",
      slug: "coverage-metrics-and-cli-reporting"
    },
    status: "partial",
    summary: {
      totalOperations: 2,
      coveredOperations: 1,
      operationCoveragePercent: 50,
      aggregateCoveragePercent: null,
      aggregateExplanation: "aggregate is N/A because weighted dimensions include N/A"
    },
    coverage: {
      operations: { state: "PARTIAL", percent: 50 },
      status: { state: "N/A", percent: null },
      parameters: { state: "N/A", percent: null },
      aggregate: { state: "N/A", percent: null, explanation: "aggregate is N/A because weighted dimensions include N/A" },
      perOperation: [
        {
          operationKey: "http GET /b",
          method: "GET",
          route: "/b",
          operation: { state: "UNCOVERED" },
          status: { state: "N/A", declared: [], covered: [], missing: [] },
          parameters: {
            state: "N/A",
            required: { total: 0, covered: 0, missing: [] },
            optional: { total: 0, covered: 0, missing: [] }
          },
          suites: []
        },
        {
          operationKey: "http GET /a",
          method: "GET",
          route: "/a",
          operation: { state: "COVERED" },
          status: { state: "N/A", declared: [], covered: [], missing: [] },
          parameters: {
            state: "N/A",
            required: { total: 0, covered: 0, missing: [] },
            optional: { total: 0, covered: 0, missing: [] }
          },
          suites: ["suite-2", "suite-1"]
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
          notApplicableOperations: 2,
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
          notApplicableOperations: 2,
          observedCount: 0,
          validCount: 0,
          invalidCount: 0,
          skippedCount: 0
        }
      },
      perOperation: [
        {
          operationKey: "http GET /b",
          method: "GET",
          route: "/b",
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
          suites: []
        },
        {
          operationKey: "http GET /a",
          method: "GET",
          route: "/a",
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
          suites: ["suite-2", "suite-1"]
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
          operationKey: "http GET /b",
          method: "GET",
          route: "/b",
          observedCount: 0,
          counts: {
            capturedValid: 0,
            capturedInvalid: 0,
            redacted: 0,
            omitted: 0,
            unsupported: 0
          },
          parameters: [],
          suites: []
        },
        {
          operationKey: "http GET /a",
          method: "GET",
          route: "/a",
          observedCount: 0,
          counts: {
            capturedValid: 0,
            capturedInvalid: 0,
            redacted: 0,
            omitted: 0,
            unsupported: 0
          },
          parameters: [
            {
              name: "tags",
              in: "query",
              required: false,
              style: "form",
              explode: true,
              declaredSupport: "supported",
              declaredSupportShape: "array",
              scalarSupport: "unsupported",
              scalarSupportReason: "schema",
              observedCount: 0,
              counts: {
                capturedValid: 0,
                capturedInvalid: 0,
                redacted: 0,
                omitted: 0,
                unsupported: 0
              },
              suites: ["suite-2", "suite-1"]
            }
          ],
          suites: ["suite-2", "suite-1"]
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
        declaredOperations: 2,
        observedOperations: 1,
        observedEvaluations: 2,
        counts: {
          satisfied: 0,
          missing: 1,
          unavailable: 1,
          unsupported: 0,
          optional: 0,
          clear: 0
        }
      },
      perOperation: [
        {
          operationKey: "http GET /b",
          method: "GET",
          route: "/b",
          observedCount: 0,
          overallTruths: {
            satisfied: 0,
            missing: 0,
            unavailable: 0,
            unsupported: 0,
            optional: 0,
            clear: 0
          },
          branches: [
            {
              branchIndex: 0,
              kind: "clear",
              observedCount: 0,
              truths: {
                satisfied: 0,
                missing: 0,
                unavailable: 0,
                unsupported: 0,
                optional: 0,
                clear: 0
              },
              schemes: [],
              suites: []
            }
          ],
          suites: []
        },
        {
          operationKey: "http GET /a",
          method: "GET",
          route: "/a",
          observedCount: 2,
          overallTruths: {
            satisfied: 0,
            missing: 1,
            unavailable: 1,
            unsupported: 0,
            optional: 0,
            clear: 0
          },
          branches: [
            {
              branchIndex: 1,
              kind: "optional",
              observedCount: 2,
              truths: {
                satisfied: 0,
                missing: 0,
                unavailable: 0,
                unsupported: 0,
                optional: 2,
                clear: 0
              },
              schemes: [],
              suites: ["suite-2", "suite-1"]
            },
            {
              branchIndex: 0,
              kind: "requirement",
              observedCount: 2,
              truths: {
                satisfied: 0,
                missing: 1,
                unavailable: 1,
                unsupported: 0,
                optional: 0,
                clear: 0
              },
              schemes: [
                {
                  schemeName: "queryKey",
                  type: "apiKey",
                  location: "query",
                  keyName: "api_key",
                  scopes: ["beta", "alpha"]
                },
                {
                  schemeName: "headerKey",
                  type: "apiKey",
                  location: "header",
                  keyName: "X-Api-Key",
                  scopes: []
                }
              ],
              suites: ["suite-2", "suite-1"]
            }
          ],
          suites: ["suite-2", "suite-1"]
        }
      ],
      diagnostics: {
        counts: {
          satisfied: 0,
          missing: 1,
          unavailable: 1,
          unsupported: 0,
          optional: 0,
          clear: 0
        },
        items: [
          {
            operationKey: "http GET /a",
            method: "GET",
            route: "/a",
            suite: "suite-2",
            truth: "unavailable",
            branchIndex: 0,
            branchKind: "requirement",
            message: "Required header apiKey 'X-Api-Key' for security scheme 'headerKey' was unavailable.",
            schemeName: "headerKey",
            schemeType: "apiKey",
            schemeLocation: "header",
            schemeKeyName: "X-Api-Key",
            evidenceState: "redacted",
            evidenceReason: "sensitive",
            semanticCode: "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
            semanticMessage:
              "required header apiKey 'X-Api-Key' for security scheme 'headerKey' on http GET /a was unavailable for security verification because retained evidence was redacted (reason: sensitive)."
          },
          {
            operationKey: "http GET /a",
            method: "GET",
            route: "/a",
            suite: "suite-1",
            truth: "missing",
            branchIndex: 0,
            branchKind: "requirement",
            message: "Required query apiKey 'api_key' for security scheme 'queryKey' was not retained in request evidence.",
            schemeName: "queryKey",
            schemeType: "apiKey",
            schemeLocation: "query",
            schemeKeyName: "api_key",
            semanticCode: "SEMANTIC_HTTP_MISSING_SECURITY",
            semanticMessage:
              "required query apiKey 'api_key' for security scheme 'queryKey' on http GET /a was not retained in request evidence."
          }
        ]
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
}

describe("writeYanoteReport determinism", () => {
  it("fails fast with actionable schema validation error", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-report-"));
    try {
      const invalid = {
        ...makeReport(),
        schemaVersion: "bad"
      } as YanoteReport;

      await expect(writeYanoteReport(dir, invalid)).rejects.toThrow(/Invalid report schema/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("writes byte-equivalent JSON for equivalent report DTOs", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-report-"));
    try {
      const report = makeReport();
      const firstPath = await writeYanoteReport(dir, report);
      const firstBytes = await readFile(firstPath, "utf8");

      const secondPath = await writeYanoteReport(dir, {
        ...report,
        coverage: {
          ...report.coverage,
          perOperation: [...report.coverage.perOperation].reverse()
        },
        httpSecurityConformance: {
          ...report.httpSecurityConformance,
          perOperation: [...report.httpSecurityConformance.perOperation]
            .map((entry) => ({
              ...entry,
              branches: [...entry.branches].reverse(),
              suites: [...entry.suites].reverse()
            }))
            .reverse(),
          diagnostics: {
            ...report.httpSecurityConformance.diagnostics,
            items: [...report.httpSecurityConformance.diagnostics.items].reverse()
          }
        }
      });
      const secondBytes = await readFile(secondPath, "utf8");

      expect(firstBytes).toBe(secondBytes);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("preserves canonical key ordering and trailing newline", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-report-"));
    try {
      const outPath = await writeYanoteReport(dir, makeReport());
      const bytes = await readFile(outPath, "utf8");
      expect(bytes.endsWith("\n")).toBe(true);

      const parsed = JSON.parse(bytes);
      expect(Object.keys(parsed).slice(0, 4)).toEqual(["coverage", "diagnostics", "generatedAt", "governance"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
