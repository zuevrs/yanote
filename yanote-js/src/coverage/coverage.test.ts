import { describe, expect, it } from "vitest";
import { computeCoverage, type HttpOperationContract } from "./coverage.js";
import type { OperationKey } from "../model/operationKey.js";
import type { HttpEvent } from "../model/httpEvent.js";
import { serializeOperationKey } from "../model/operationKey.js";

describe("computeCoverage", () => {
  it("keeps deterministic canonical operation denominator", () => {
    const operations: OperationKey[] = [
      { kind: "http", method: "get", route: "/users/{id}" },
      { kind: "http", method: "GET", route: "/users/{name}" },
      { kind: "http", method: "POST", route: "/users" }
    ];

    const events: HttpEvent[] = [
      {
        kind: "http",
        method: "GET",
        route: "/users/123",
        status: 200,
        queryKeys: [],
        headerKeys: [],
        testRunId: "run-1",
        testSuite: "suite-a"
      }
    ];

    const first = computeCoverage(operations, events, []);
    const second = computeCoverage(operations, events, []);

    expect(first.allOperations).toEqual([
      { kind: "http", method: "GET", route: "/users/{param}" },
      { kind: "http", method: "POST", route: "/users" }
    ]);
    expect(first.coveredOperations).toEqual([{ kind: "http", method: "GET", route: "/users/{param}" }]);
    expect(first.uncoveredOperations).toEqual([{ kind: "http", method: "POST", route: "/users" }]);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("computes status and parameter dimensions per operation with explicit N/A", () => {
    const operations: OperationKey[] = [
      { kind: "http", method: "GET", route: "/users/{param}" },
      { kind: "http", method: "GET", route: "/health" }
    ];

    const contracts = new Map<string, HttpOperationContract>([
      [
        serializeOperationKey({ kind: "http", method: "GET", route: "/users/{param}" }),
        {
          declaredStatuses: ["200", "404"],
          parameters: [
            { name: "id", in: "path", required: true },
            { name: "expand", in: "query", required: true }
          ]
        }
      ],
      [serializeOperationKey({ kind: "http", method: "GET", route: "/health" }), { declaredStatuses: [], parameters: [] }]
    ]);

    const events: HttpEvent[] = [
      {
        kind: "http",
        method: "GET",
        route: "/users/123",
        status: 200,
        queryKeys: ["expand"],
        headerKeys: [],
        testRunId: "run-1",
        testSuite: "suite-users"
      }
    ];

    const result = computeCoverage(operations, events, [], { operationContractsByKey: contracts });
    const users = result.perOperation.find((entry) => entry.route === "/users/{param}");
    const health = result.perOperation.find((entry) => entry.route === "/health");

    expect(users?.status.state).toBe("PARTIAL");
    expect(users?.parameters.state).toBe("COVERED");
    expect(health?.status.state).toBe("N/A");
    expect(health?.parameters.state).toBe("N/A");
  });

  it("reports aggregate as N/A when any weighted dimension is N/A", () => {
    const operations: OperationKey[] = [{ kind: "http", method: "GET", route: "/health" }];

    const contracts = new Map<string, HttpOperationContract>([
      [serializeOperationKey({ kind: "http", method: "GET", route: "/health" }), { declaredStatuses: [], parameters: [] }]
    ]);

    const events: HttpEvent[] = [
      {
        kind: "http",
        method: "GET",
        route: "/health",
        status: 200,
        queryKeys: [],
        headerKeys: [],
        testRunId: "run-1",
        testSuite: "suite-health"
      }
    ];

    const result = computeCoverage(operations, events, [], { operationContractsByKey: contracts });

    expect(result.dimensions.operations).toEqual({ state: "COVERED", percent: 100 });
    expect(result.dimensions.status).toEqual({ state: "N/A", percent: null });
    expect(result.dimensions.parameters).toEqual({ state: "N/A", percent: null });
    expect(result.dimensions.aggregate).toEqual({
      state: "N/A",
      percent: null,
      explanation: "aggregate is N/A because weighted dimensions include N/A"
    });
  });
});
