import { describe, expect, it } from "vitest";
import { normalizeJsonValue } from "../model/httpEvent.js";
import { readHttpEventsJsonl } from "./readJsonl.js";

describe("readHttpEventsJsonl", () => {
  it("streams payload-bearing jsonl, ignores invalid lines, and preserves supported json values", async () => {
    const res = await readHttpEventsJsonl("test/fixtures/events/http-payload.fixture.jsonl");

    expect(res.invalidLines).toBe(1);
    expect(res.invalidLineNumbers).toEqual([2]);
    expect(res.items).toEqual([
      {
        kind: "http",
        ts: 1772449192657,
        method: "POST",
        route: "/users",
        status: 201,
        requestBody: {
          email: "ada@example.com",
          profile: {
            active: true,
            age: 37,
            tags: ["admin", null]
          }
        },
        requestContentType: "application/json",
        responseBody: {
          id: "user-1",
          created: true
        },
        responseContentType: "application/json",
        service: undefined,
        instance: undefined,
        error: false,
        queryKeys: ["expand", "include"],
        headerKeys: ["accept", "content-type", "x-trace-id"],
        testRunId: "run-1",
        testSuite: "unknown"
      },
      {
        kind: "http",
        ts: 1772449192658,
        method: "GET",
        route: "/health",
        status: 200,
        requestBody: null,
        requestContentType: undefined,
        responseBody: ["ok", { region: "eu-central" }],
        responseContentType: "application/json",
        service: undefined,
        instance: undefined,
        error: undefined,
        queryKeys: [],
        headerKeys: [],
        testRunId: "run-1",
        testSuite: "suite-a"
      }
    ]);
  });

  it("drops malformed nested payload structures instead of leaking arbitrary values", () => {
    expect(normalizeJsonValue({ ok: [1, true, null, { nested: "value" }] })).toEqual({
      ok: [1, true, null, { nested: "value" }]
    });
    expect(normalizeJsonValue({ bad: new Date("2026-03-21T00:00:00.000Z") })).toBeUndefined();
    expect(normalizeJsonValue(["ok", { bad: new Map([["x", 1]]) }])).toBeUndefined();
  });
});
