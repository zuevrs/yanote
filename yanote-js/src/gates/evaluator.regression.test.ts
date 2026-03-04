import { describe, expect, it } from "vitest";
import { compareRegressionAgainstBaseline, type BaselineFile } from "../baseline/baseline.js";
import type { HttpEvent } from "../model/httpEvent.js";
import type { OperationKey } from "../model/operationKey.js";
import { computeCoverage } from "../coverage/coverage.js";
import { evaluateGateFailures, evaluateRegressionGate } from "./evaluator.js";
import { resolveGatePolicy } from "./policy.js";

describe("regression comparison contract", () => {
  it("detects covered-operation loss while ignoring removed spec operations", () => {
    const baseline: BaselineFile = {
      format: 2,
      generatedAt: "2026-03-04T00:00:00.000Z",
      covered: ["http GET /a", "http GET /b", "http GET /removed"],
      dimensions: {
        operations: 80,
        status: 70,
        parameters: 60,
        aggregate: 75
      }
    };

    const comparison = compareRegressionAgainstBaseline({
      baseline,
      currentCovered: [{ kind: "http", method: "GET", route: "/a" }],
      currentOperations: [
        { kind: "http", method: "GET", route: "/a" },
        { kind: "http", method: "GET", route: "/b" }
      ],
      currentDimensions: {
        operations: 70,
        status: 80,
        parameters: 50,
        aggregate: 74
      }
    });

    expect(comparison.missingCoveredOperations).toEqual(["http GET /b"]);
    expect(comparison.removedSpecOperations).toEqual(["http GET /removed"]);
    expect(comparison.dimensionRegressions.map((entry) => entry.dimension)).toEqual(["aggregate", "operations", "parameters"]);
  });

  it("emits hard-fail for covered-operation loss and warning-level dimension regressions", async () => {
    const baseline: BaselineFile = {
      format: 2,
      generatedAt: "2026-03-04T00:00:00.000Z",
      covered: ["http GET /a", "http GET /b"],
      dimensions: {
        operations: 90,
        status: 80,
        parameters: 70,
        aggregate: 85
      }
    };

    const comparison = compareRegressionAgainstBaseline({
      baseline,
      currentCovered: [{ kind: "http", method: "GET", route: "/a" }],
      currentOperations: [
        { kind: "http", method: "GET", route: "/a" },
        { kind: "http", method: "GET", route: "/b" }
      ],
      currentDimensions: {
        operations: 75,
        status: 85,
        parameters: 68,
        aggregate: 81
      }
    });

    const policy = await resolveGatePolicy({
      defaultProfile: "ci"
    });
    const failures = evaluateRegressionGate({ comparison, policy });

    expect(failures.some((failure) => failure.code === "GATE_REGRESSION_COVERAGE_LOSS" && failure.severity === "error")).toBe(
      true
    );
    expect(failures.some((failure) => failure.code === "GATE_REGRESSION_DIMENSION" && failure.severity === "warning")).toBe(true);
  });

  it("integrates threshold and regression evaluations in one combined output", async () => {
    const operations: OperationKey[] = [
      { kind: "http", method: "GET", route: "/a" },
      { kind: "http", method: "GET", route: "/b" }
    ];
    const events: HttpEvent[] = [
      {
        kind: "http",
        method: "GET",
        route: "/a",
        queryKeys: [],
        headerKeys: [],
        testRunId: "run-1",
        testSuite: "suite"
      }
    ];

    const coverage = computeCoverage(operations, events, []);
    const policy = await resolveGatePolicy({
      defaultProfile: "ci",
      cliOverrides: {
        minCoverage: 80
      }
    });
    const comparison = compareRegressionAgainstBaseline({
      baseline: {
        format: 2,
        generatedAt: "2026-03-04T00:00:00.000Z",
        covered: ["http GET /a", "http GET /b"],
        dimensions: {
          operations: 100,
          status: null,
          parameters: null,
          aggregate: null
        }
      },
      currentCovered: coverage.coveredOperations,
      currentOperations: coverage.allOperations,
      currentDimensions: {
        operations: coverage.dimensions.operations.percent,
        status: coverage.dimensions.status.percent,
        parameters: coverage.dimensions.parameters.percent,
        aggregate: coverage.dimensions.aggregate.percent
      }
    });

    const failures = evaluateGateFailures({
      coverage,
      policy,
      comparison
    });

    expect(failures.map((failure) => failure.code)).toEqual(
      expect.arrayContaining(["GATE_REGRESSION_COVERAGE_LOSS", "GATE_MIN_COVERAGE"])
    );
  });
});
