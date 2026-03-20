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
        reason: "Observed kafka evidence did not include a payload.",
        message: "Observed kafka evidence is missing the payload required for AsyncAPI schema validation"
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
        message: "Observed kafka payload did not conform to the retained AsyncAPI payload schema"
      },
      {
        kind: "unverifiable-headers",
        validationKind: "headers",
        operationKey: OPERATION_KEY,
        channel: "orders.created",
        action: "send",
        messageName: "OrderCreatedEnvelope",
        schemaId: "OrderEventHeaders",
        reason: "Kafka evidence does not currently retain headers, so the AsyncAPI header schema cannot be verified.",
        message: "Retained AsyncAPI header schema cannot be verified from the observed kafka evidence"
      },
      {
        kind: "mismatched",
        channel: "orders.created",
        action: "send",
        observedMessage: "LegacyOrderCreatedEnvelope",
        expectedMessage: "OrderCreatedEnvelope",
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
      },
      {
        kind: "unverifiable-headers",
        validationKind: "headers",
        operationKey: OPERATION_KEY,
        channel: "orders.created",
        action: "send",
        messageName: "OrderCreatedEnvelope",
        schemaId: "OrderEventHeaders",
        reason: "Kafka evidence does not currently retain headers, so the AsyncAPI header schema cannot be verified.",
        message: "Retained AsyncAPI header schema cannot be verified from the observed kafka evidence"
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
      },
      {
        kind: "unverifiable-headers",
        validationKind: "headers",
        operationKey: OPERATION_KEY,
        channel: "orders.created",
        action: "send",
        messageName: "OrderCreatedEnvelope",
        schemaId: "OrderEventHeaders",
        reason: "Kafka evidence does not currently retain headers, so the AsyncAPI header schema cannot be verified.",
        message: "Retained AsyncAPI header schema cannot be verified from the observed kafka evidence"
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
