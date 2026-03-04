import { describe, expect, it } from "vitest";
import { computeParameterCoverage } from "./parameterCoverage.js";

describe("computeParameterCoverage", () => {
  it("scores required parameters while optional parameters stay informational", () => {
    const result = computeParameterCoverage({
      parameters: [
        { name: "id", in: "path", required: true },
        { name: "filter", in: "query", required: true },
        { name: "sort", in: "query", required: false },
        { name: "Authorization", in: "header", required: true },
        { name: "X-Trace", in: "header", required: false }
      ],
      evidence: {
        operationObserved: true,
        queryKeys: ["filter"],
        headerKeys: ["x-trace"]
      }
    });

    expect(result.state).toBe("PARTIAL");
    expect(result.required).toEqual({
      total: 3,
      covered: 2,
      missing: [{ name: "Authorization", in: "header", required: true }]
    });
    expect(result.optional).toEqual({
      total: 2,
      covered: 1,
      missing: [{ name: "sort", in: "query", required: false }]
    });
  });

  it("scores path/query/header locations independently and deterministically", () => {
    const result = computeParameterCoverage({
      parameters: [
        { name: "z", in: "query", required: true },
        { name: "a", in: "query", required: true },
        { name: "Trace", in: "header", required: false },
        { name: "id", in: "path", required: true }
      ],
      evidence: {
        operationObserved: true,
        queryKeys: ["a"],
        headerKeys: []
      }
    });

    expect(result.byLocation.path).toEqual({
      requiredTotal: 1,
      requiredCovered: 1,
      missingRequired: [],
      optionalTotal: 0,
      optionalCovered: 0,
      missingOptional: []
    });

    expect(result.byLocation.query).toEqual({
      requiredTotal: 2,
      requiredCovered: 1,
      missingRequired: ["z"],
      optionalTotal: 0,
      optionalCovered: 0,
      missingOptional: []
    });

    expect(result.byLocation.header).toEqual({
      requiredTotal: 0,
      requiredCovered: 0,
      missingRequired: [],
      optionalTotal: 1,
      optionalCovered: 0,
      missingOptional: ["Trace"]
    });
  });

  it("emits N/A when no parameters are defined", () => {
    const result = computeParameterCoverage({
      parameters: [],
      evidence: {
        operationObserved: false,
        queryKeys: [],
        headerKeys: []
      }
    });

    expect(result.state).toBe("N/A");
    expect(result.required.total).toBe(0);
    expect(result.optional.total).toBe(0);
  });
});
