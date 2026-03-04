import { describe, expect, it } from "vitest";
import type { HttpEvent } from "../model/httpEvent.js";
import type { OperationKey } from "../model/operationKey.js";
import { computeCoverage } from "../coverage/coverage.js";
import { evaluateThresholdGate } from "./evaluator.js";
import { resolveGatePolicy } from "./policy.js";

function sampleCoverage(): ReturnType<typeof computeCoverage> {
  const operations: OperationKey[] = [
    { kind: "http", method: "GET", route: "/a" },
    { kind: "http", method: "GET", route: "/b" },
    { kind: "http", method: "GET", route: "/c" }
  ];

  const events: HttpEvent[] = [
    {
      kind: "http",
      method: "GET",
      route: "/a",
      queryKeys: [],
      headerKeys: [],
      testRunId: "run-1",
      testSuite: "suite-a"
    },
    {
      kind: "http",
      method: "GET",
      route: "/b",
      queryKeys: [],
      headerKeys: [],
      testRunId: "run-1",
      testSuite: "suite-a"
    }
  ];

  return computeCoverage(operations, events, []);
}

describe("threshold evaluator", () => {
  it("uses raw decimals for comparison and skips aggregate gate when aggregate is N/A", async () => {
    const coverage = sampleCoverage();
    const policy = await resolveGatePolicy({
      defaultProfile: "ci",
      cliOverrides: {
        minCoverage: 66.668,
        minAggregate: 80
      }
    });

    const failures = evaluateThresholdGate({ coverage, policy });
    expect(failures.map((failure) => failure.code)).toContain("GATE_MIN_COVERAGE");
    expect(failures.map((failure) => failure.code)).toContain("GATE_AGGREGATE_SKIPPED");
  });

  it("hard-fails critical operation coverage loss regardless of profile softness", async () => {
    const coverage = sampleCoverage();
    const policy = await resolveGatePolicy({
      profile: "local",
      cliOverrides: {
        criticalOperations: ["http GET /c"]
      }
    });

    const failures = evaluateThresholdGate({ coverage, policy });
    const critical = failures.find((failure) => failure.code === "GATE_CRITICAL_OPERATION_COVERAGE_LOSS");
    expect(critical).toBeDefined();
    expect(critical?.severity).toBe("error");
  });
});
