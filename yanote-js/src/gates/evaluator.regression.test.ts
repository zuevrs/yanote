import { describe, expect, it } from "vitest";
import { compareRegressionAgainstBaseline, type BaselineFile } from "../baseline/baseline.js";

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
});
