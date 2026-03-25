import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readHttpEventsJsonl } from "./readJsonl.js";

describe("readHttpEventsJsonl request evidence", () => {
  it("keeps legacy fixtures readable without inventing additive request evidence", async () => {
    const result = await readHttpEventsJsonl("test/fixtures/events/http-payload.fixture.jsonl");

    expect(result.invalidLines).toBe(1);
    expect(result.items[0]).toMatchObject({
      method: "POST",
      route: "/users",
      queryKeys: ["expand", "include"],
      headerKeys: ["accept", "content-type", "x-trace-id"]
    });
    expect(result.items[0]?.pathParams).toBeUndefined();
    expect(result.items[0]?.queryParams).toBeUndefined();
    expect(result.items[0]?.requestHeaders).toBeUndefined();
    expect(result.items[0]?.cookies).toBeUndefined();
  });

  it("normalizes additive request evidence and derives legacy key arrays from captured query/header evidence", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-http-request-evidence-"));
    const file = path.join(dir, "events.jsonl");

    const lines = [
      JSON.stringify({
        kind: "http",
        ts: 1710000002000,
        method: "get",
        route: "/evidence/users/123",
        status: 200,
        pathParams: {
          id: { state: " captured ", values: ["123"] }
        },
        queryParams: {
          expand: { state: "captured", values: ["roles"] },
          token: { state: "redacted", reason: "sensitive" }
        },
        requestHeaders: {
          "X-Trace-Id": { state: "captured", values: ["trace-1"] },
          Authorization: { state: "redacted", reason: "sensitive" }
        },
        cookies: {
          prefs: { state: "captured", values: ["compact"] },
          SESSION: { state: "omitted", reason: "unavailable" }
        },
        "test.run_id": "run-evidence",
        "test.suite": "suite-evidence"
      })
    ];

    try {
      await writeFile(file, `${lines.join("\n")}\n`, "utf8");

      const result = await readHttpEventsJsonl(file);
      expect(result.invalidLines).toBe(0);
      expect(result.items).toEqual([
        {
          kind: "http",
          ts: 1710000002000,
          method: "GET",
          route: "/evidence/users/123",
          status: 200,
          requestBody: undefined,
          requestBodyState: undefined,
          requestBodyReason: undefined,
          requestContentType: undefined,
          responseBody: undefined,
          responseBodyState: undefined,
          responseBodyReason: undefined,
          responseContentType: undefined,
          pathParams: {
            id: { state: "captured", values: ["123"] }
          },
          queryParams: {
            expand: { state: "captured", values: ["roles"] },
            token: { state: "redacted", reason: "sensitive" }
          },
          requestHeaders: {
            authorization: { state: "redacted", reason: "sensitive" },
            "x-trace-id": { state: "captured", values: ["trace-1"] }
          },
          cookies: {
            prefs: { state: "captured", values: ["compact"] },
            SESSION: { state: "omitted", reason: "unavailable" }
          },
          service: undefined,
          instance: undefined,
          error: undefined,
          queryKeys: ["expand"],
          headerKeys: ["x-trace-id"],
          testRunId: "run-evidence",
          testSuite: "suite-evidence"
        }
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
