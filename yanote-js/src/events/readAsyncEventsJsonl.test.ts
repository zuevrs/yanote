import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "./readAsyncEventsJsonl.js";

describe("readAsyncEventsJsonl", () => {
  it("streams jsonl, ignores invalid lines, and normalizes kafka evidence metadata", async () => {
    const res = await readAsyncEventsJsonl("test/fixtures/async-events/events.fixture.jsonl");

    expect(res.invalidLines).toBe(1);
    expect(res.invalidLineNumbers).toEqual([2]);
    expect(res.items).toEqual([
      {
        kind: "kafka",
        ts: 1710000000000,
        action: "send",
        channel: "users.signedup",
        message: "UserSignedUp",
        service: "accounts-service",
        instance: null,
        error: false,
        testRunId: "run-1",
        testSuite: "unknown"
      },
      {
        kind: "kafka",
        ts: undefined,
        action: "receive",
        channel: "users.deleted",
        message: undefined,
        service: undefined,
        instance: undefined,
        error: undefined,
        testRunId: "unknown",
        testSuite: "suite-a"
      }
    ]);
  });

  it("drops malformed kafka evidence fields instead of leaking arbitrary structures", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-jsonl-"));
    const file = path.join(dir, "events.jsonl");

    const lines = [
      JSON.stringify({
        kind: "kafka",
        action: "receive",
        channel: "/users/events",
        message: ["bad"],
        service: 42,
        instance: { host: "bad" },
        error: "nope",
        "test.run_id": null,
        "test.suite": "  "
      }),
      JSON.stringify({
        kind: "kafka",
        action: "publish",
        channel: "users.invalid"
      }),
      JSON.stringify({
        kind: "kafka",
        action: "send",
        channel: "   "
      })
    ];

    try {
      await writeFile(file, `${lines.join("\n")}\n`, "utf8");

      const result = await readAsyncEventsJsonl(file);
      expect(result.invalidLines).toBe(0);
      expect(result.items).toEqual([
        {
          kind: "kafka",
          ts: undefined,
          action: "receive",
          channel: "/users/events",
          message: undefined,
          service: undefined,
          instance: undefined,
          error: undefined,
          testRunId: "unknown",
          testSuite: "unknown"
        }
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
