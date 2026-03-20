import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import type { KafkaMessageContract } from "../model/operationKey.js";
import { loadAsyncApiSemanticsBundle, type AsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncSchemaConformance } from "./asyncSchemaConformance.js";

const OPERATION_KEY = "kafka send orders.created";

describe("computeAsyncSchemaConformance diagnostics", () => {
  it("emits a redacted invalid-payload diagnostic with schema id, pointer, and reason", async () => {
    const bundle = withoutHeaderValidation(await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"));
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-invalid.fixture.jsonl");

    const result = computeAsyncSchemaConformance(bundle, events.items);

    expect(result).toEqual({
      matchedOperationKeys: [OPERATION_KEY],
      validatedOperationKeys: [OPERATION_KEY],
      diagnostics: [
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
        }
      ]
    });

    const serialized = JSON.stringify(result.diagnostics);
    expect(serialized).not.toContain("evt-101");
    expect(serialized).not.toContain("ord-101");
  });

  it("emits a redacted missing-payload observation-gap diagnostic", async () => {
    const bundle = withoutHeaderValidation(await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"));
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-missing-payload.fixture.jsonl");

    expect(computeAsyncSchemaConformance(bundle, events.items)).toEqual({
      matchedOperationKeys: [OPERATION_KEY],
      validatedOperationKeys: [OPERATION_KEY],
      diagnostics: [
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
        }
      ]
    });
  });

  it("keeps combined schema diagnostics deterministic, ordered, deduplicated, and redacted", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");
    const [valid, invalid, missing] = await Promise.all([
      readAsyncEventsJsonl("test/fixtures/async-events/schema-valid.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-invalid.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-missing-payload.fixture.jsonl")
    ]);

    const result = computeAsyncSchemaConformance(bundle, [...valid.items, ...invalid.items, ...missing.items, ...invalid.items]);

    expect(result.diagnostics).toEqual([
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
      }
    ]);

    const serialized = JSON.stringify(result.diagnostics);
    expect(serialized).not.toContain("evt-100");
    expect(serialized).not.toContain("evt-101");
    expect(serialized).not.toContain("ord-100");
    expect(serialized).not.toContain("ord-101");
  });
});

function withoutHeaderValidation(bundle: AsyncApiSemanticsBundle): AsyncApiSemanticsBundle {
  return withMessageOverride(bundle, (message) => ({
    ...message,
    headersSchemaId: undefined,
    headerValidationCapability: "none"
  }));
}

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
