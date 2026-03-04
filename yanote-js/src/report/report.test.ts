import { describe, expect, it } from "vitest";
import { computeCoverage } from "../coverage/coverage.js";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import type { GovernanceFailure } from "../gates/failureOrder.js";
import { loadOpenApiCoverageModel } from "../spec/openapi.js";
import { REPORT_SCHEMA_VERSION } from "./schema.js";
import { buildReport } from "./report.js";

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
        .filter((timestamp): timestamp is number => typeof timestamp === "number")
    });

    expect(report.schemaVersion).toBe(REPORT_SCHEMA_VERSION);
    expect(report.phase).toEqual({ id: "02", slug: "coverage-metrics-and-cli-reporting" });
    expect(report.summary.operationCoveragePercent).toBeGreaterThanOrEqual(0);
    expect(report.coverage.perOperation.every((entry) => entry.operationKey && entry.method && entry.route)).toBe(true);
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
      "GATE_MIN_COVERAGE_WARNING"
    ]);
  });
});
