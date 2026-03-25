import { describe, expect, it } from "vitest";
import { computeCoverage } from "../coverage/coverage.js";
import { computeHttpSecurityConformance } from "../coverage/httpSecurityConformance.js";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { loadOpenApiCoverageModel } from "../spec/openapi.js";
import { normalizeReport } from "./normalize.js";
import { buildReport } from "./report.js";
import { REPORT_SCHEMA_VERSION, validateReport } from "./schema.js";

async function buildSecurityFixtureReport() {
  const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-security-api-key.yaml");
  const events = await readHttpEventsJsonl("test/fixtures/events/http-security-api-key.fixture.jsonl");
  const coverage = computeCoverage(model.operations, events.items, [], {
    operationContractsByKey: model.operationContractsByKey
  });
  const securityConformance = computeHttpSecurityConformance(model.operations, events.items, {
    operationContractsByKey: model.operationContractsByKey
  });

  return normalizeReport(
    buildReport(coverage, {
      toolVersion: "test",
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number"),
      securityConformance
    })
  );
}

describe("report security contract", () => {
  it("serializes additive httpSecurityConformance truth without mutating legacy coverage numerators", async () => {
    const report = await buildSecurityFixtureReport();

    expect(report.schemaVersion).toBe(REPORT_SCHEMA_VERSION);
    expect(validateReport(report).ok).toBe(true);
    expect(report.status).toBe("partial");
    expect(report.summary.totalOperations).toBe(12);
    expect(report.summary.coveredOperations).toBe(12);
    expect(report.summary.operationCoveragePercent).toBe(100);
    expect(report.summary.aggregateCoveragePercent).toBeNull();
    expect(report.coverage.operations).toEqual({ state: "COVERED", percent: 100 });
    expect(report.coverage.status).toEqual({ state: "COVERED", percent: 100 });
    expect(report.coverage.parameters).toEqual({ state: "N/A", percent: null });
    expect(report.coverage.aggregate).toEqual({
      state: "N/A",
      percent: null,
      explanation: "aggregate is N/A because weighted dimensions include N/A"
    });
    expect(report.coverage).not.toHaveProperty("security");
    expect(report.httpSecurityConformance.summary).toEqual({
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
    });
    expect(report.httpSecurityConformance.perOperation).toHaveLength(report.coverage.perOperation.length);
    expect(report.httpSecurityConformance.diagnostics.counts).toEqual({
      satisfied: 3,
      missing: 1,
      unavailable: 2,
      unsupported: 4,
      optional: 1,
      clear: 1
    });

    expect(
      report.httpSecurityConformance.diagnostics.items.map((item) => ({
        operationKey: item.operationKey,
        truth: item.truth,
        semanticCode: item.semanticCode ?? null
      }))
    ).toEqual([
      { operationKey: "http GET /clear", truth: "clear", semanticCode: null },
      { operationKey: "http GET /optional", truth: "optional", semanticCode: null },
      { operationKey: "http GET /or-and-missing", truth: "missing", semanticCode: "SEMANTIC_HTTP_MISSING_SECURITY" },
      { operationKey: "http GET /or-and-satisfied", truth: "satisfied", semanticCode: null },
      { operationKey: "http GET /override-query", truth: "satisfied", semanticCode: null },
      { operationKey: "http GET /redacted", truth: "unavailable", semanticCode: "SEMANTIC_HTTP_UNAVAILABLE_SECURITY" },
      { operationKey: "http GET /root-inherited", truth: "satisfied", semanticCode: null },
      { operationKey: "http GET /unavailable", truth: "unavailable", semanticCode: "SEMANTIC_HTTP_UNAVAILABLE_SECURITY" },
      { operationKey: "http GET /unsupported-http", truth: "unsupported", semanticCode: "SEMANTIC_HTTP_UNSUPPORTED_SECURITY" },
      { operationKey: "http GET /unsupported-location", truth: "unsupported", semanticCode: "SEMANTIC_HTTP_UNSUPPORTED_SECURITY" },
      { operationKey: "http GET /unsupported-oauth", truth: "unsupported", semanticCode: "SEMANTIC_HTTP_UNSUPPORTED_SECURITY" },
      { operationKey: "http GET /unsupported-openid", truth: "unsupported", semanticCode: "SEMANTIC_HTTP_UNSUPPORTED_SECURITY" }
    ]);

    expect(report.governance.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "SEMANTIC_HTTP_MISSING_SECURITY",
      "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
      "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
      "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
      "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
      "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
      "SEMANTIC_HTTP_UNSUPPORTED_SECURITY"
    ]);
    expect(report.governance.diagnostics.map((diagnostic) => diagnostic.operationKey)).toEqual([
      "http GET /or-and-missing",
      "http GET /redacted",
      "http GET /unavailable",
      "http GET /unsupported-http",
      "http GET /unsupported-location",
      "http GET /unsupported-oauth",
      "http GET /unsupported-openid"
    ]);
  });

  it("surfaces effective security branches and scheme ordering without leaking retained secret values", async () => {
    const report = await buildSecurityFixtureReport();

    const optional = report.httpSecurityConformance.perOperation.find((entry) => entry.operationKey === "http GET /optional");
    expect(optional).toMatchObject({
      observedCount: 1,
      overallTruths: {
        satisfied: 0,
        missing: 0,
        unavailable: 0,
        unsupported: 0,
        optional: 1,
        clear: 0
      },
      branches: [
        {
          branchIndex: 0,
          kind: "optional",
          observedCount: 1,
          truths: {
            satisfied: 0,
            missing: 0,
            unavailable: 0,
            unsupported: 0,
            optional: 1,
            clear: 0
          },
          schemes: []
        },
        {
          branchIndex: 1,
          kind: "requirement",
          observedCount: 1,
          truths: {
            satisfied: 0,
            missing: 1,
            unavailable: 0,
            unsupported: 0,
            optional: 0,
            clear: 0
          },
          schemes: [
            {
              schemeName: "cookieKey",
              type: "apiKey",
              location: "cookie",
              keyName: "session",
              scopes: []
            }
          ]
        }
      ]
    });

    const orSatisfied = report.httpSecurityConformance.perOperation.find((entry) => entry.operationKey === "http GET /or-and-satisfied");
    expect(orSatisfied?.branches[0]?.schemes).toEqual([
      {
        schemeName: "headerKey",
        type: "apiKey",
        location: "header",
        keyName: "X-Api-Key",
        scopes: []
      },
      {
        schemeName: "queryKey",
        type: "apiKey",
        location: "query",
        keyName: "api_key",
        scopes: []
      }
    ]);

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("header-secret-123");
    expect(serialized).not.toContain("query-secret-456");
    expect(serialized).not.toContain("header-and-789");
    expect(serialized).not.toContain("query-and-789");
    expect(serialized).not.toContain("Basic dXNlcjpzZWNyZXQ=");
    expect(serialized).not.toContain("oauth-secret");
    expect(serialized).not.toContain("oidc-secret");
    expect(serialized).not.toContain("path-secret-xyz");
  });
});
