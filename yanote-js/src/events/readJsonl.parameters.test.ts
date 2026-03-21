import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readHttpEventsJsonl } from "./readJsonl.js";

describe("readHttpEventsJsonl parameter evidence", () => {
  it("preserves query key case identity and normalizes header keys", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-jsonl-"));
    const file = path.join(dir, "events.jsonl");

    const lines = [
      JSON.stringify({
        kind: "http",
        method: "get",
        route: "/users/123",
        status: 200,
        requestBody: {
          filters: ["active"]
        },
        requestContentType: " application/json ",
        responseBody: {
          id: "user-123"
        },
        responseContentType: "application/json",
        queryKeys: ["userId", "UserId", "z", "userId", "  "],
        headerKeys: ["X-Trace-Id", "x-trace-id", "Authorization", " authorization ", ""]
      })
    ];

    try {
      await writeFile(file, `${lines.join("\n")}\n`, "utf8");

      const result = await readHttpEventsJsonl(file);
      expect(result.invalidLines).toBe(0);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].queryKeys).toEqual(["userId", "UserId", "z"]);
      expect(result.items[0].headerKeys).toEqual(["authorization", "x-trace-id"]);
      expect(result.items[0].requestContentType).toBe("application/json");
      expect(result.items[0].responseBody).toEqual({ id: "user-123" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("normalizes missing or malformed evidence fields to empty arrays and dropped payload metadata", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-jsonl-"));
    const file = path.join(dir, "events.jsonl");

    const lines = [
      '{"kind":"http","method":"GET","route":"/users/{id}","test.run_id":"run-1","test.suite":"suite-1"}',
      '{"kind":"http","method":"GET","route":"/users/{id}","queryKeys":"bad","headerKeys":42,"requestContentType":{},"responseContentType":[],"requestBody":{"kept":true}}',
      'this is not json',
      '{"kind":"http","method":"GET"}'
    ];

    try {
      await writeFile(file, `${lines.join("\n")}\n`, "utf8");

      const result = await readHttpEventsJsonl(file);
      expect(result.invalidLines).toBe(1);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].queryKeys).toEqual([]);
      expect(result.items[0].headerKeys).toEqual([]);
      expect(result.items[0].requestBody).toBeUndefined();
      expect(result.items[0].responseBody).toBeUndefined();
      expect(result.items[1].queryKeys).toEqual([]);
      expect(result.items[1].headerKeys).toEqual([]);
      expect(result.items[1].requestBody).toEqual({ kept: true });
      expect(result.items[1].requestContentType).toBeUndefined();
      expect(result.items[1].responseContentType).toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
