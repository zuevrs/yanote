import { describe, expect, it } from "vitest";
import type { HttpEvent } from "../model/httpEvent.js";
import type { OperationKey } from "../model/operationKey.js";
import { computeCoverage } from "./coverage.js";

function event(method: string, route: string, suite = "suite-a"): HttpEvent {
  return {
    kind: "http",
    method,
    route,
    testRunId: "run-1",
    testSuite: suite
  };
}

describe("computeCoverage matching", () => {
  it("prefers exact canonical route equality before template fallback", () => {
    const operations: OperationKey[] = [{ kind: "http", method: "GET", route: "/users/{param}" }];
    const events: HttpEvent[] = [event("GET", "/users/{param}")];

    const result = computeCoverage(operations, events, []);

    expect(result.coveredOperations).toEqual([{ kind: "http", method: "GET", route: "/users/{param}" }]);
    expect(result.diagnostics).toEqual([]);
  });

  it("falls back from concrete routes to deterministic same-method template matching", () => {
    const operations: OperationKey[] = [{ kind: "http", method: "GET", route: "/users/{param}" }];
    const events: HttpEvent[] = [event("GET", "/users/123", "suite-fallback")];

    const result = computeCoverage(operations, events, []);

    expect(result.coveredOperations).toEqual([{ kind: "http", method: "GET", route: "/users/{param}" }]);
    expect(Array.from(result.suitesByOperation.get("http GET /users/{param}") ?? [])).toEqual(["suite-fallback"]);
    expect(result.diagnostics).toEqual([]);
  });

  it("emits ambiguous and unmatched diagnostics without heuristic auto-selection", () => {
    const operations: OperationKey[] = [
      { kind: "http", method: "GET", route: "/reports/{param}" },
      { kind: "http", method: "GET", route: "/{param}/2024" }
    ];
    const events: HttpEvent[] = [event("GET", "/reports/2024"), event("GET", "/unknown/route")];

    const result = computeCoverage(operations, events, []);

    expect(result.coveredOperations).toEqual([]);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "ambiguous",
          method: "GET",
          route: "/reports/2024",
          candidates: ["GET /reports/{param}", "GET /{param}/2024"]
        }),
        expect.objectContaining({
          kind: "unmatched",
          method: "GET",
          route: "/unknown/route"
        })
      ])
    );
  });
});
