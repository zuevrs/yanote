import { describe, expect, it } from "vitest";
import { computeStatusCoverage } from "./statusCoverage.js";

describe("computeStatusCoverage", () => {
  it("uses declared statuses as denominator, not observed statuses", () => {
    const result = computeStatusCoverage({
      declaredStatuses: ["200", "404"],
      observedStatuses: [200, 200]
    });

    expect(result).toEqual({
      state: "PARTIAL",
      declaredStatuses: ["200", "404"],
      coveredStatuses: ["200"],
      missingStatuses: ["404"]
    });
  });

  it("supports explicit, wildcard range, and default matching deterministically", () => {
    const result = computeStatusCoverage({
      declaredStatuses: ["default", "201", "2xx"],
      observedStatuses: [503, 201]
    });

    expect(result).toEqual({
      state: "COVERED",
      declaredStatuses: ["201", "2XX", "default"],
      coveredStatuses: ["201", "2XX", "default"],
      missingStatuses: []
    });
  });

  it("requires unmatched observed statuses to satisfy default coverage", () => {
    const result = computeStatusCoverage({
      declaredStatuses: ["default", "2XX"],
      observedStatuses: [201]
    });

    expect(result).toEqual({
      state: "PARTIAL",
      declaredStatuses: ["2XX", "default"],
      coveredStatuses: ["2XX"],
      missingStatuses: ["default"]
    });
  });

  it("emits N/A when no declared statuses exist", () => {
    const result = computeStatusCoverage({
      declaredStatuses: [],
      observedStatuses: [200]
    });

    expect(result).toEqual({
      state: "N/A",
      declaredStatuses: [],
      coveredStatuses: [],
      missingStatuses: []
    });
  });
});
