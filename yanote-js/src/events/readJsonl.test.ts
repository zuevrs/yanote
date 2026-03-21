import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
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
        requestBodyState: undefined,
        requestBodyReason: undefined,
        requestContentType: "application/json",
        responseBody: {
          id: "user-1",
          created: true
        },
        responseBodyState: undefined,
        responseBodyReason: undefined,
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
        requestBodyState: undefined,
        requestBodyReason: undefined,
        requestContentType: undefined,
        responseBody: ["ok", { region: "eu-central" }],
        responseBodyState: undefined,
        responseBodyReason: undefined,
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

  it("normalizes additive http payload provenance while keeping legacy files readable", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-http-jsonl-"));
    const file = path.join(dir, "events.jsonl");

    const lines = [
      JSON.stringify({
        kind: "http",
        ts: 1710000000000,
        method: "post",
        route: "/users",
        requestBody: { email: "ada@example.com" },
        requestBodyState: " CAPTURED ",
        requestBodyReason: "unsupported",
        requestContentType: "application/json",
        responseBodyState: " omitted ",
        responseBodyReason: " POLICY-FILTERED ",
        responseContentType: "application/json",
        "test.run_id": "run-new",
        "test.suite": "suite-new"
      }),
      JSON.stringify({
        kind: "http",
        ts: 1710000000001,
        method: "GET",
        route: "/legacy",
        status: 200,
        responseBody: { ok: true },
        responseContentType: "application/json",
        "test.run_id": "run-legacy",
        "test.suite": "suite-legacy"
      })
    ];

    try {
      await writeFile(file, `${lines.join("\n")}\n`, "utf8");

      const result = await readHttpEventsJsonl(file);
      expect(result.invalidLines).toBe(0);
      expect(result.items).toEqual([
        {
          kind: "http",
          ts: 1710000000000,
          method: "POST",
          route: "/users",
          status: undefined,
          requestBody: { email: "ada@example.com" },
          requestBodyState: "captured",
          requestBodyReason: "unsupported",
          requestContentType: "application/json",
          responseBody: undefined,
          responseBodyState: "omitted",
          responseBodyReason: "policy-filtered",
          responseContentType: "application/json",
          service: undefined,
          instance: undefined,
          error: undefined,
          queryKeys: [],
          headerKeys: [],
          testRunId: "run-new",
          testSuite: "suite-new"
        },
        {
          kind: "http",
          ts: 1710000000001,
          method: "GET",
          route: "/legacy",
          status: 200,
          requestBody: undefined,
          requestBodyState: undefined,
          requestBodyReason: undefined,
          requestContentType: undefined,
          responseBody: { ok: true },
          responseBodyState: undefined,
          responseBodyReason: undefined,
          responseContentType: "application/json",
          service: undefined,
          instance: undefined,
          error: undefined,
          queryKeys: [],
          headerKeys: [],
          testRunId: "run-legacy",
          testSuite: "suite-legacy"
        }
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("drops malformed nested payload structures instead of leaking arbitrary values", () => {
    expect(normalizeJsonValue({ ok: [1, true, null, { nested: "value" }] })).toEqual({
      ok: [1, true, null, { nested: "value" }]
    });
    expect(normalizeJsonValue({ bad: new Date("2026-03-21T00:00:00.000Z") })).toBeUndefined();
    expect(normalizeJsonValue(["ok", { bad: new Map([["x", 1]]) }])).toBeUndefined();
  });
});
