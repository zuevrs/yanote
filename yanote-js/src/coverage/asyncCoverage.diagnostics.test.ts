import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import type { AsyncEvent } from "../model/asyncEvent.js";
import type { KafkaMessageContract } from "../model/operationKey.js";
import { loadAsyncApiSemanticsBundle, type AsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncCoverage } from "./asyncCoverage.js";

const OPERATION_KEY = "kafka send orders.created";

describe("computeAsyncCoverage diagnostics", () => {
  it("keeps schema and routing diagnostics deterministic across repeated runs", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");
    const [invalidEvents, missingEvents] = await Promise.all([
      readAsyncEventsJsonl("test/fixtures/async-events/schema-invalid.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-missing-payload.fixture.jsonl")
    ]);

    const routingDrift: AsyncEvent[] = [
      {
        kind: "kafka",
        action: "send",
        channel: "orders.created",
        message: "LegacyOrderCreatedEnvelope",
        payload: {
          eventId: "evt-public-mismatch",
          order: {
            id: "ord-public-mismatch",
            total: 10
          }
        },
        testRunId: "run-public-mismatch",
        testSuite: "suite-public-mismatch"
      },
      {
        kind: "kafka",
        action: "receive",
        channel: "orders.created",
        message: "OrderCreatedEnvelope",
        testRunId: "run-public-unmatched",
        testSuite: "suite-public-unmatched"
      }
    ];

    const events = [...invalidEvents.items, ...missingEvents.items, ...routingDrift];
    const first = computeAsyncCoverage(bundle, events);
    const second = computeAsyncCoverage(bundle, events);

    expect(first.diagnostics).toEqual(second.diagnostics);
    expect(first.diagnostics).toEqual([
      {
        kind: "missing-payload",
        validationKind: "payload",
        operationKey: OPERATION_KEY,
        channel: "orders.created",
        action: "send",
        messageName: "OrderCreatedEnvelope",
        schemaId: "OrderCreatedPayload",
        pointer: "/",
        reason: "Observed async evidence did not include a payload.",
        message: "Observed async evidence is missing the payload required for AsyncAPI schema validation"
      },
      {
        kind: "invalid-payload",
        validationKind: "payload",
        operationKey: OPERATION_KEY,
        channel: "orders.created",
        action: "send",
        messageName: "OrderCreatedEnvelope",
        schemaId: "OrderCreatedPayload",
        pointer: "/order/total",
        reason: "required: must have required property 'total'",
        message: "Observed async payload did not conform to the retained AsyncAPI payload schema"
      },
      {
        kind: "mismatched",
        channel: "orders.created",
        action: "send",
        observedMessage: "LegacyOrderCreatedEnvelope",
        expectedMessage: "OrderCreatedEnvelope",
        reason: "Observed async message name did not match the declared AsyncAPI message contract.",
        message: "Observed async message contract did not match the canonical AsyncAPI message contract"
      },
      {
        kind: "unmatched",
        channel: "orders.created",
        action: "receive",
        observedMessage: "OrderCreatedEnvelope",
        message: "No canonical async operation matched the observed kafka evidence"
      }
    ]);

    const serialized = JSON.stringify(first.diagnostics);
    expect(serialized).not.toContain("evt-101");
    expect(serialized).not.toContain("ord-101");
    expect(serialized).not.toContain("evt-public-mismatch");
    expect(serialized).not.toContain("ord-public-mismatch");
  });

  it("publishes runtime semantic diagnostics deterministically without leaking retained header values", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-inline-v3.yaml");
    const failures = await readAsyncEventsJsonl("test/fixtures/async-events/header-runtime-failures.fixture.jsonl");
    const rawHeaderEvent = {
      kind: "kafka",
      action: "send",
      channel: "orders.command",
      message: "OrderCommand",
      headers: {
        correlation_id: "corr-raw-leak",
        reply_to: "orders.private.reply"
      },
      testRunId: "run-header-runtime-raw",
      testSuite: "suite-header-runtime-raw"
    } as unknown as AsyncEvent;

    const first = computeAsyncCoverage(bundle, [...failures.items, rawHeaderEvent]);
    const second = computeAsyncCoverage(bundle, [...failures.items, rawHeaderEvent]);

    expect(first.runtimeSemantics.diagnostics).toEqual(second.runtimeSemantics.diagnostics);
    expect(first.runtimeSemantics.diagnostics).toEqual([
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
          "Observed kafka header 'correlation_id' required by declared correlationId location '$message.header#/correlation_id' was unavailable because retained header evidence did not normalize to the expected { state, value | reason } shape.",
        message: "Observed kafka header value was unavailable for AsyncAPI correlationId runtime proof"
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
          "Observed kafka header 'reply_to' required by declared reply.address location '$message.header#/reply_to' was unavailable because retained header evidence did not normalize to the expected { state, value | reason } shape.",
        message: "Observed kafka header value was unavailable for AsyncAPI reply.address runtime proof"
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

    const serialized = JSON.stringify(first.runtimeSemantics.diagnostics);
    expect(serialized).not.toContain("corr-runtime-mismatch");
    expect(serialized).not.toContain("corr-raw-leak");
    expect(serialized).not.toContain("orders.deadletter");
    expect(serialized).not.toContain("orders.private.reply");
  });

  it("publishes unsupported runtime-expression diagnostics without changing legacy coverage summaries", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-unsupported-v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/header-runtime-covered.fixture.jsonl");

    const coverage = computeAsyncCoverage(bundle, events.items);

    expect(coverage.channels.summary).toEqual({ total: 1, covered: 1, percent: 100 });
    expect(coverage.operations.summary).toEqual({ total: 1, covered: 1, percent: 100 });
    expect(coverage.messages.summary).toEqual({ total: 1, covered: 1, percent: 100 });
    expect(coverage.diagnostics).toEqual([]);
    expect(coverage.runtimeSemantics.diagnostics).toEqual([
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

  it("publishes unsupported content-type diagnostics without leaking payload bodies", async () => {
    const bundle = withMessageOverride(
      await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      (message) => ({
        ...message,
        contentType: "application/xml"
      })
    );
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-unsupported-format.fixture.jsonl");

    const coverage = computeAsyncCoverage(bundle, events.items);

    expect(coverage.diagnostics).toEqual([
      {
        kind: "unsupported-content-type",
        validationKind: "contentType",
        operationKey: OPERATION_KEY,
        channel: "orders.created",
        action: "send",
        messageName: "OrderCreatedEnvelope",
        schemaId: "OrderCreatedPayload",
        reason: "Unsupported AsyncAPI payload content type: application/xml.",
        message: "Retained AsyncAPI payload content type is outside the current schema-validation scope"
      }
    ]);

    expect(JSON.stringify(coverage.diagnostics)).not.toContain("evt-102");
    expect(JSON.stringify(coverage.diagnostics)).not.toContain("ord-102");
  });

  it("publishes unsupported schema-format diagnostics without changing routing coverage", async () => {
    const bundle = withMessageOverride(
      await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      (message) => ({
        ...message,
        schemaFormat: "application/vnd.apache.avro;version=1.11.0"
      })
    );
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-unsupported-format.fixture.jsonl");

    const coverage = computeAsyncCoverage(bundle, events.items);

    expect(coverage.channels.summary).toEqual({ total: 1, covered: 1, percent: 100 });
    expect(coverage.operations.summary).toEqual({ total: 1, covered: 1, percent: 100 });
    expect(coverage.messages.summary).toEqual({ total: 1, covered: 1, percent: 100 });
    expect(coverage.diagnostics).toEqual([
      {
        kind: "unsupported-schema-format",
        validationKind: "schemaFormat",
        operationKey: OPERATION_KEY,
        channel: "orders.created",
        action: "send",
        messageName: "OrderCreatedEnvelope",
        schemaId: "OrderCreatedPayload",
        reason: "Unsupported AsyncAPI payload schema format: application/vnd.apache.avro;version=1.11.0.",
        message: "Retained AsyncAPI payload schema format is outside the current schema-validation scope"
      }
    ]);
  });
});

function withMessageOverride(
  bundle: AsyncApiSemanticsBundle,
  transform: (message: KafkaMessageContract) => KafkaMessageContract
): AsyncApiSemanticsBundle {
  const contract = bundle.operationContractsByKey.get(OPERATION_KEY);
  if (!contract?.message) {
    throw new Error(`Expected kafka contract ${OPERATION_KEY} to expose a message contract.`);
  }

  const nextContracts = new Map(bundle.operationContractsByKey);
  nextContracts.set(OPERATION_KEY, {
    ...contract,
    message: transform({
      ...contract.message,
      ...(contract.message.payloadSchema !== undefined
        ? { payloadSchema: structuredClone(contract.message.payloadSchema) }
        : {})
    })
  });

  return {
    ...bundle,
    operationContractsByKey: nextContracts
  };
}
