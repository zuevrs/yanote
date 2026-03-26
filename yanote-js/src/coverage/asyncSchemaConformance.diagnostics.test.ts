import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import type { JsonValue } from "../model/asyncEvent.js";
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
          message: "Observed async payload did not conform to the retained AsyncAPI payload schema"
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
          reason: "Observed async evidence did not include a payload.",
          message: "Observed async evidence is missing the payload required for AsyncAPI schema validation"
        }
      ]
    });
  });

  it("keeps combined payload diagnostics deterministic, ordered, deduplicated, and redacted", async () => {
    const bundle = withoutHeaderValidation(await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"));
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
      }
    ]);

    const serialized = JSON.stringify(result.diagnostics);
    expect(serialized).not.toContain("evt-100");
    expect(serialized).not.toContain("evt-101");
    expect(serialized).not.toContain("ord-100");
    expect(serialized).not.toContain("ord-101");
  });

  it("emits typed unavailable-header diagnostics with schema id, pointer, and redacted reason", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-unavailable-header.fixture.jsonl");

    expect(computeAsyncSchemaConformance(bundle, events.items)).toEqual({
      matchedOperationKeys: [OPERATION_KEY],
      validatedOperationKeys: [OPERATION_KEY],
      diagnostics: [
        {
          kind: "unavailable-header",
          validationKind: "headers",
          operationKey: OPERATION_KEY,
          channel: "orders.created",
          action: "send",
          messageName: "OrderCreatedEnvelope",
          schemaId: "OrderEventHeaders",
          pointer: "/traceId",
          reason: "Observed async header 'traceId' was retained as redacted evidence (reason: sensitive), so its value could not be validated.",
          message: "Observed async header value was unavailable for AsyncAPI header validation"
        }
      ]
    });
  });

  it("emits typed invalid-header diagnostics without leaking retained header values", async () => {
    const bundle = withMessageOverride(
      await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      (message) => ({
        ...message,
        headersSchema: {
          ...(cloneJsonValue(message.headersSchema ?? {}) as Record<string, JsonValue>),
          properties: {
            ...((cloneJsonValue((message.headersSchema as Record<string, JsonValue> | undefined)?.properties ?? {}) as Record<
              string,
              JsonValue
            >)),
            traceId: {
              type: "string",
              pattern: "^trace-[0-9]+$"
            }
          }
        }
      })
    );
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-invalid-header.fixture.jsonl");

    const result = computeAsyncSchemaConformance(bundle, events.items);

    expect(result).toEqual({
      matchedOperationKeys: [OPERATION_KEY],
      validatedOperationKeys: [OPERATION_KEY],
      diagnostics: [
        {
          kind: "invalid-header",
          validationKind: "headers",
          operationKey: OPERATION_KEY,
          channel: "orders.created",
          action: "send",
          messageName: "OrderCreatedEnvelope",
          schemaId: "OrderEventHeaders",
          pointer: "/traceId",
          reason: "pattern: must match pattern '^trace-[0-9]+$'",
          message: "Observed async headers did not conform to the retained AsyncAPI header schema"
        }
      ]
    });

    expect(JSON.stringify(result.diagnostics)).not.toContain("bad-trace");
  });
});

function withoutHeaderValidation(bundle: AsyncApiSemanticsBundle): AsyncApiSemanticsBundle {
  return withMessageOverride(bundle, (message) => ({
    ...message,
    headersSchema: undefined,
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
        ? { payloadSchema: cloneJsonValue(contract.message.payloadSchema) }
        : {}),
      ...(contract.message.headersSchema !== undefined
        ? { headersSchema: cloneJsonValue(contract.message.headersSchema) }
        : {})
    })
  });

  return {
    ...bundle,
    operationContractsByKey: nextContracts
  };
}

function cloneJsonValue<T extends JsonValue>(value: T): T {
  return structuredClone(value);
}
