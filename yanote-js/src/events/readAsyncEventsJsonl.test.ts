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
        payload: undefined,
        payloadState: undefined,
        payloadReason: undefined,
        headers: undefined,
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
        payload: undefined,
        payloadState: undefined,
        payloadReason: undefined,
        headers: undefined,
        error: undefined,
        testRunId: "unknown",
        testSuite: "suite-a"
      }
    ]);
  });

  it("normalizes additive kafka payload provenance while keeping legacy files readable", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-provenance-"));
    const file = path.join(dir, "events.jsonl");

    const lines = [
      JSON.stringify({
        kind: "kafka",
        ts: 1710000001100,
        action: " SEND ",
        channel: " users.created ",
        message: " UserCreated ",
        payload: { id: "alice" },
        payloadState: " captured ",
        payloadReason: "oversized",
        headers: {
          " trace-id ": {
            state: " captured ",
            value: " trace-123 "
          },
          authorization: {
            state: "redacted",
            reason: " sensitive "
          },
          "binary-header": {
            state: " omitted ",
            reason: " unsupported "
          }
        },
        "test.run_id": "run-new",
        "test.suite": "suite-new"
      }),
      JSON.stringify({
        kind: "kafka",
        ts: 1710000001101,
        action: "receive",
        channel: "users.legacy",
        message: "LegacyEvent",
        payload: { ok: true },
        "test.run_id": "run-legacy",
        "test.suite": "suite-legacy"
      })
    ];

    try {
      await writeFile(file, `${lines.join("\n")}\n`, "utf8");

      const result = await readAsyncEventsJsonl(file);
      expect(result.invalidLines).toBe(0);
      expect(result.items).toEqual([
        {
          kind: "kafka",
          ts: 1710000001100,
          action: "send",
          channel: "users.created",
          message: "UserCreated",
          service: undefined,
          instance: undefined,
          payload: { id: "alice" },
          payloadState: "captured",
          payloadReason: "oversized",
          headers: {
            authorization: {
              state: "redacted",
              reason: "sensitive"
            },
            "binary-header": {
              state: "omitted",
              reason: "unsupported"
            },
            "trace-id": {
              state: "captured",
              value: "trace-123"
            }
          },
          error: undefined,
          testRunId: "run-new",
          testSuite: "suite-new"
        },
        {
          kind: "kafka",
          ts: 1710000001101,
          action: "receive",
          channel: "users.legacy",
          message: "LegacyEvent",
          service: undefined,
          instance: undefined,
          payload: { ok: true },
          payloadState: undefined,
          payloadReason: undefined,
          headers: undefined,
          error: undefined,
          testRunId: "run-legacy",
          testSuite: "suite-legacy"
        }
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("accepts AMQP evidence alongside Kafka while ignoring non-async entries", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-mixed-"));
    const file = path.join(dir, "events.jsonl");

    const lines = [
      JSON.stringify({
        kind: "amqp",
        ts: 1710000000150,
        action: " RECEIVE ",
        channel: " users.queue ",
        message: " UserQueued ",
        service: "billing-service",
        instance: null,
        payload: { userId: "alice" },
        payloadState: " captured ",
        headers: {
          " content-type ": {
            state: " captured ",
            value: " application/json "
          },
          authorization: {
            state: " redacted ",
            reason: " sensitive "
          }
        },
        error: true,
        "test.run_id": "run-amqp",
        "test.suite": "suite-amqp"
      }),
      JSON.stringify({
        kind: "kafka",
        action: "send",
        channel: "users.created",
        message: "LegacyKafka",
        "test.run_id": "run-kafka",
        "test.suite": "suite-kafka"
      }),
      JSON.stringify({
        kind: "http",
        method: "GET",
        route: "/users"
      }),
      "not-json"
    ];

    try {
      await writeFile(file, `${lines.join("\n")}\n`, "utf8");

      const result = await readAsyncEventsJsonl(file);
      expect(result.invalidLines).toBe(1);
      expect(result.invalidLineNumbers).toEqual([4]);
      expect(result.items).toEqual([
        {
          kind: "amqp",
          ts: 1710000000150,
          action: "receive",
          channel: "users.queue",
          message: "UserQueued",
          service: "billing-service",
          instance: null,
          payload: { userId: "alice" },
          payloadState: "captured",
          payloadReason: undefined,
          headers: {
            authorization: {
              state: "redacted",
              reason: "sensitive"
            },
            "content-type": {
              state: "captured",
              value: "application/json"
            }
          },
          error: true,
          testRunId: "run-amqp",
          testSuite: "suite-amqp"
        },
        {
          kind: "kafka",
          ts: undefined,
          action: "send",
          channel: "users.created",
          message: "LegacyKafka",
          service: undefined,
          instance: undefined,
          payload: undefined,
          payloadState: undefined,
          payloadReason: undefined,
          headers: undefined,
          error: undefined,
          testRunId: "run-kafka",
          testSuite: "suite-kafka"
        }
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("keeps payload-bearing kafka evidence while ignoring invalid and non-kafka lines", async () => {
    const result = await readAsyncEventsJsonl("test/fixtures/async-events/payload-bearing.fixture.jsonl");

    expect(result.invalidLines).toBe(1);
    expect(result.invalidLineNumbers).toEqual([2]);
    expect(result.items).toEqual([
      {
        kind: "kafka",
        ts: 1710000000200,
        action: "send",
        channel: "users.created",
        message: "UserCreated",
        service: "accounts-service",
        instance: undefined,
        payload: {
          user: {
            id: "alice",
            roles: ["admin"]
          },
          active: true
        },
        payloadState: undefined,
        payloadReason: undefined,
        headers: undefined,
        error: undefined,
        testRunId: "run-payload-1",
        testSuite: "suite-payload"
      },
      {
        kind: "kafka",
        ts: undefined,
        action: "receive",
        channel: "users.deleted",
        message: undefined,
        service: undefined,
        instance: undefined,
        payload: "alice",
        payloadState: undefined,
        payloadReason: undefined,
        headers: undefined,
        error: undefined,
        testRunId: "unknown",
        testSuite: "suite-payload"
      },
      {
        kind: "kafka",
        ts: undefined,
        action: "send",
        channel: "users.compacted",
        message: undefined,
        service: undefined,
        instance: undefined,
        payload: ["alice", { deleted: false }, 3],
        payloadState: undefined,
        payloadReason: undefined,
        headers: undefined,
        error: undefined,
        testRunId: "run-payload-2",
        testSuite: "suite-payload"
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
        payload: {
          user: {
            id: "42"
          },
          flags: [true, false],
          active: true
        },
        headers: {
          "trace-id": {
            state: "captured",
            value: ["bad"]
          },
          authorization: {
            state: "redacted",
            value: "should-drop",
            reason: 42
          }
        },
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
          payload: {
            user: {
              id: "42"
            },
            flags: [true, false],
            active: true
          },
          payloadState: undefined,
          payloadReason: undefined,
          headers: {
            authorization: {
              state: "redacted"
            }
          },
          error: undefined,
          testRunId: "unknown",
          testSuite: "unknown"
        }
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("retains header evidence states while dropping malformed header entries", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-headers-"));
    const file = path.join(dir, "events.jsonl");

    const lines = [
      JSON.stringify({
        kind: "kafka",
        action: "send",
        channel: "users.created",
        headers: {
          "trace-id": {
            state: " captured ",
            value: " trace-123 "
          },
          authorization: {
            state: "redacted",
            value: "should-not-survive",
            reason: " sensitive "
          },
          "oversized-header": {
            state: "omitted",
            reason: " oversized "
          },
          "bad-captured": {
            state: "captured"
          },
          "bad-state": {
            state: "unknown",
            value: "x"
          },
          "   ": {
            state: "captured",
            value: "x"
          }
        },
        "test.run_id": "run-headers",
        "test.suite": "suite-headers"
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
          action: "send",
          channel: "users.created",
          message: undefined,
          service: undefined,
          instance: undefined,
          payload: undefined,
          payloadState: undefined,
          payloadReason: undefined,
          headers: {
            authorization: {
              state: "redacted",
              reason: "sensitive"
            },
            "oversized-header": {
              state: "omitted",
              reason: "oversized"
            },
            "trace-id": {
              state: "captured",
              value: "trace-123"
            }
          },
          error: undefined,
          testRunId: "run-headers",
          testSuite: "suite-headers"
        }
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
