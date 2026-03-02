import { describe, expect, it } from "vitest";
import { computeCoverage } from "./coverage.js";
import type { OperationKey } from "../model/operationKey.js";
import type { HttpEvent } from "../model/httpEvent.js";

describe("computeCoverage", () => {
  it("matches by method+route and dedups by (operation,suite)", () => {
    const operations: OperationKey[] = [
      { kind: "http", method: "GET", route: "/a" },
      { kind: "http", method: "POST", route: "/b" }
    ];

    const events: HttpEvent[] = [
      {
        kind: "http",
        method: "GET",
        route: "/a",
        testRunId: "r1",
        testSuite: "S1"
      },
      {
        kind: "http",
        method: "GET",
        route: "/a",
        testRunId: "r1",
        testSuite: "S1"
      }
    ];

    const res = computeCoverage(operations, events, []);
    expect(res.coveredOperations).toEqual([{ kind: "http", method: "GET", route: "/a" }]);
    expect(res.uncoveredOperations).toEqual([{ kind: "http", method: "POST", route: "/b" }]);

    const suites = res.suitesByOperation.get("http GET /a");
    expect(suites ? Array.from(suites) : []).toEqual(["S1"]);
  });
});

