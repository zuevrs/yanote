import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import type { AsyncEvent } from "../model/asyncEvent.js";
import { loadAsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncSemanticConformance } from "./asyncSemanticConformance.js";

describe("computeAsyncSemanticConformance", () => {
  it("proves declared correlationId and reply.address from retained kafka headers", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-inline-v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/header-runtime-covered.fixture.jsonl");

    const conformance = computeAsyncSemanticConformance(bundle, events.items);

    expect(conformance.summary).toEqual({ total: 2, satisfied: 2, percent: 100 });
    expect(conformance.items).toEqual([
      {
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        semantic: "correlationId",
        state: "SATISFIED",
        location: "$message.header#/correlation_id",
        header: "correlation_id",
        messageName: "OrderCommand",
        message: expect.stringContaining("OrderCommand"),
        suites: ["suite-header-runtime-covered"]
      },
      {
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        semantic: "reply.address",
        state: "SATISFIED",
        location: "$message.header#/reply_to",
        header: "reply_to",
        replyChannelAddress: "orders.reply",
        suites: ["suite-header-runtime-covered"]
      }
    ]);
    expect(conformance.diagnostics).toEqual([]);
  });

  it("fails closed for missing, unavailable, and mismatched retained-header evidence", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-inline-v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/header-runtime-failures.fixture.jsonl");

    const conformance = computeAsyncSemanticConformance(bundle, events.items);

    expect(conformance.summary).toEqual({ total: 2, satisfied: 1, percent: 50 });
    expect(conformance.items).toEqual([
      {
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        semantic: "correlationId",
        state: "SATISFIED",
        location: "$message.header#/correlation_id",
        header: "correlation_id",
        messageName: "OrderCommand",
        message: expect.stringContaining("OrderCommand"),
        suites: ["suite-header-runtime-mismatch"]
      },
      {
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        semantic: "reply.address",
        state: "UNSATISFIED",
        location: "$message.header#/reply_to",
        header: "reply_to",
        replyChannelAddress: "orders.reply",
        suites: []
      }
    ]);
    expect(conformance.diagnostics).toEqual([
      {
        semantic: "correlationId",
        state: "missing",
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        location: "$message.header#/correlation_id",
        header: "correlation_id",
        messageName: "OrderCommand",
        reason:
          "Observed kafka evidence did not retain header 'correlation_id' required by declared correlationId location '$message.header#/correlation_id'.",
        message: "Observed kafka evidence is missing retained header evidence required to prove AsyncAPI correlationId"
      },
      {
        semantic: "correlationId",
        state: "unavailable",
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        location: "$message.header#/correlation_id",
        header: "correlation_id",
        messageName: "OrderCommand",
        reason:
          "Observed kafka header 'correlation_id' required by declared correlationId location '$message.header#/correlation_id' was unavailable because retained header evidence was redacted (sensitive).",
        message: "Observed kafka header value was unavailable for AsyncAPI correlationId runtime proof"
      },
      {
        semantic: "reply.address",
        state: "missing",
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        location: "$message.header#/reply_to",
        header: "reply_to",
        replyChannelAddress: "orders.reply",
        reason:
          "Observed kafka evidence did not retain header 'reply_to' required by declared reply.address location '$message.header#/reply_to'.",
        message: "Observed kafka evidence is missing retained header evidence required to prove AsyncAPI reply.address"
      },
      {
        semantic: "reply.address",
        state: "unavailable",
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        location: "$message.header#/reply_to",
        header: "reply_to",
        replyChannelAddress: "orders.reply",
        reason:
          "Observed kafka header 'reply_to' required by declared reply.address location '$message.header#/reply_to' was unavailable because retained header evidence was omitted (unsupported).",
        message: "Observed kafka header value was unavailable for AsyncAPI reply.address runtime proof"
      },
      {
        semantic: "reply.address",
        state: "mismatched",
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        location: "$message.header#/reply_to",
        header: "reply_to",
        replyChannelAddress: "orders.reply",
        reason: "Observed kafka header 'reply_to' did not match declared AsyncAPI reply channel address 'orders.reply'.",
        message: "Observed kafka reply.address header did not match the declared AsyncAPI reply channel address"
      }
    ]);
  });

  it("fails closed when retained headers are provided in simplified raw-string form", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-inline-v3.yaml");
    const rawHeaderEvent = {
      kind: "kafka",
      action: "send",
      channel: "orders.command",
      message: "OrderCommand",
      headers: {
        correlation_id: "corr-raw",
        reply_to: "orders.reply"
      },
      testRunId: "run-header-runtime-raw",
      testSuite: "suite-header-runtime-raw"
    } as unknown as AsyncEvent;

    const conformance = computeAsyncSemanticConformance(bundle, [rawHeaderEvent]);

    expect(conformance.summary).toEqual({ total: 2, satisfied: 0, percent: 0 });
    expect(conformance.diagnostics).toEqual([
      {
        semantic: "correlationId",
        state: "unavailable",
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        location: "$message.header#/correlation_id",
        header: "correlation_id",
        messageName: "OrderCommand",
        reason:
          "Observed kafka header 'correlation_id' required by declared correlationId location '$message.header#/correlation_id' was unavailable because retained header evidence did not normalize to the expected { state, value | reason } shape.",
        message: "Observed kafka header value was unavailable for AsyncAPI correlationId runtime proof"
      },
      {
        semantic: "reply.address",
        state: "unavailable",
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        location: "$message.header#/reply_to",
        header: "reply_to",
        replyChannelAddress: "orders.reply",
        reason:
          "Observed kafka header 'reply_to' required by declared reply.address location '$message.header#/reply_to' was unavailable because retained header evidence did not normalize to the expected { state, value | reason } shape.",
        message: "Observed kafka header value was unavailable for AsyncAPI reply.address runtime proof"
      }
    ]);
  });

  it("treats supported-shape unsupported runtime-expression locations as explicit fail-closed runtime diagnostics", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-unsupported-v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/header-runtime-covered.fixture.jsonl");

    const conformance = computeAsyncSemanticConformance(bundle, events.items);

    expect(conformance.summary).toEqual({ total: 2, satisfied: 0, percent: 0 });
    expect(conformance.items).toEqual([
      {
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        semantic: "correlationId",
        state: "UNSATISFIED",
        location: "$message.payload#/meta/correlation_id",
        messageName: "OrderCommand",
        message: expect.stringContaining("OrderCommand"),
        suites: []
      },
      {
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        semantic: "reply.address",
        state: "UNSATISFIED",
        location: "$message.payload#/meta/reply_to",
        replyChannelAddress: "orders.reply",
        suites: []
      }
    ]);
    expect(conformance.diagnostics).toEqual([
      {
        semantic: "correlationId",
        state: "unsupported",
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        location: "$message.payload#/meta/correlation_id",
        messageName: "OrderCommand",
        reason:
          "Declared runtime expression '$message.payload#/meta/correlation_id' is outside the supported $message.header#/... subset.",
        message: "Declared AsyncAPI correlationId location is outside the supported kafka header-backed runtime-proof scope"
      },
      {
        semantic: "reply.address",
        state: "unsupported",
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        location: "$message.payload#/meta/reply_to",
        replyChannelAddress: "orders.reply",
        reason:
          "Declared runtime expression '$message.payload#/meta/reply_to' is outside the supported $message.header#/... subset.",
        message: "Declared AsyncAPI reply.address location is outside the supported kafka header-backed runtime-proof scope"
      }
    ]);
  });
});
