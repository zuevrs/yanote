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
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("normalizes missing or malformed evidence fields to empty arrays", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-jsonl-"));
    const file = path.join(dir, "events.jsonl");

    const lines = [
      '{"kind":"http","method":"GET","route":"/users/{id}","test.run_id":"run-1","test.suite":"suite-1"}',
      '{"kind":"http","method":"GET","route":"/users/{id}","queryKeys":"bad","headerKeys":42}',
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
      expect(result.items[1].queryKeys).toEqual([]);
      expect(result.items[1].headerKeys).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
