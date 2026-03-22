import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import type { AsyncEvent, JsonValue } from "../model/asyncEvent.js";
import type { KafkaMessageContract } from "../model/operationKey.js";
import { loadAsyncApiSemanticsBundle, type AsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncSchemaConformance } from "./asyncSchemaConformance.js";

const OPERATION_KEY = "kafka send orders.created";

describe("computeAsyncSchemaConformance contract", () => {
  it("validates routed payloads against sanitized AsyncAPI payload schemas after routing match", async () => {
    const bundle = withoutHeaderValidation(await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"));
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-valid.fixture.jsonl");

    expect(computeAsyncSchemaConformance(bundle, events.items)).toEqual({
      matchedOperationKeys: [OPERATION_KEY],
      validatedOperationKeys: [OPERATION_KEY],
      diagnostics: []
    });
  });

  it("keeps routing and message drift separate from schema diagnostics", async () => {
    const bundle = withoutHeaderValidation(await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"));
    const unmatched = await readAsyncEventsJsonl("test/fixtures/async-events/action-mismatch.fixture.jsonl");

    expect(computeAsyncSchemaConformance(bundle, unmatched.items)).toEqual({
      matchedOperationKeys: [],
      validatedOperationKeys: [],
      diagnostics: []
    });

    const wrongMessage: AsyncEvent[] = [
      {
        kind: "kafka",
        action: "send",
        channel: "orders.created",
        message: "LegacyOrderCreatedEnvelope",
        payload: {
          eventId: "evt-inline",
          order: {
            id: "ord-inline"
          }
        },
        headers: {
          tenantId: {
            state: "captured",
            value: "tenant-acme"
          },
          traceId: {
            state: "captured",
            value: "trace-inline"
          }
        },
        testRunId: "run-inline",
        testSuite: "suite-inline"
      }
    ];

    expect(computeAsyncSchemaConformance(bundle, wrongMessage)).toEqual({
      matchedOperationKeys: [OPERATION_KEY],
      validatedOperationKeys: [],
      diagnostics: []
    });
  });

  it("surfaces unsupported content types explicitly without regressing header validation", async () => {
    const bundle = withMessageOverride(
      await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      (message) => ({
        ...message,
        contentType: "application/xml"
      })
    );
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-unsupported-format.fixture.jsonl");

    expect(computeAsyncSchemaConformance(bundle, events.items)).toEqual({
      matchedOperationKeys: [OPERATION_KEY],
      validatedOperationKeys: [OPERATION_KEY],
      diagnostics: [
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
      ]
    });
  });

  it("surfaces unsupported schema formats without regressing header validation", async () => {
    const bundle = withMessageOverride(
      await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      (message) => ({
        ...message,
        schemaFormat: "application/vnd.apache.avro;version=1.11.0"
      })
    );
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-unsupported-format.fixture.jsonl");

    expect(computeAsyncSchemaConformance(bundle, events.items)).toEqual({
      matchedOperationKeys: [OPERATION_KEY],
      validatedOperationKeys: [OPERATION_KEY],
      diagnostics: [
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
      ]
    });
  });

  it("surfaces missing required headers from retained evidence instead of a broad unverifiable bucket", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-missing-header.fixture.jsonl");

    expect(computeAsyncSchemaConformance(bundle, events.items)).toEqual({
      matchedOperationKeys: [OPERATION_KEY],
      validatedOperationKeys: [OPERATION_KEY],
      diagnostics: [
        {
          kind: "missing-header",
          validationKind: "headers",
          operationKey: OPERATION_KEY,
          channel: "orders.created",
          action: "send",
          messageName: "OrderCreatedEnvelope",
          schemaId: "OrderEventHeaders",
          pointer: "/traceId",
          reason: "Observed kafka evidence did not include required header 'traceId'.",
          message: "Observed kafka evidence is missing a required header for AsyncAPI header validation"
        }
      ]
    });
  });

  it("surfaces unavailable retained headers distinctly when values were redacted or omitted", async () => {
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
          reason: "Observed kafka header 'traceId' was retained as redacted evidence (reason: sensitive), so its value could not be validated.",
          message: "Observed kafka header value was unavailable for AsyncAPI header validation"
        }
      ]
    });
  });

  it("surfaces invalid retained header values against AsyncAPI header constraints", async () => {
    const bundle = withHeaderPattern(
      await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      /^trace-[0-9]+$/
    );
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-invalid-header.fixture.jsonl");

    expect(computeAsyncSchemaConformance(bundle, events.items)).toEqual({
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
          message: "Observed kafka headers did not conform to the retained AsyncAPI header schema"
        }
      ]
    });
  });

  it("keeps genuinely unsupported header schemas explicit", async () => {
    const bundle = withMessageOverride(
      await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      (message) => ({
        ...message,
        headersSchema: undefined,
        headersSchemaId: "OrderEventHeaders",
        headerValidationCapability: "unverifiable"
      })
    );
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-valid.fixture.jsonl");

    expect(computeAsyncSchemaConformance(bundle, events.items)).toEqual({
      matchedOperationKeys: [OPERATION_KEY],
      validatedOperationKeys: [OPERATION_KEY],
      diagnostics: [
        {
          kind: "unverifiable-headers",
          validationKind: "headers",
          operationKey: OPERATION_KEY,
          channel: "orders.created",
          action: "send",
          messageName: "OrderCreatedEnvelope",
          schemaId: "OrderEventHeaders",
          reason: "Retained AsyncAPI header schema could not be normalized into a validation-ready JSON Schema.",
          message: "Retained AsyncAPI header schema is outside the current kafka header-validation scope"
        }
      ]
    });
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

function withHeaderPattern(bundle: AsyncApiSemanticsBundle, pattern: RegExp): AsyncApiSemanticsBundle {
  return withMessageOverride(bundle, (message) => ({
    ...message,
    headersSchema: {
      ...(cloneJsonValue(message.headersSchema ?? {}) as Record<string, JsonValue>),
      properties: {
        ...((cloneJsonValue((message.headersSchema as Record<string, JsonValue> | undefined)?.properties ?? {}) as Record<string, JsonValue>)),
        traceId: {
          type: "string",
          pattern: pattern.source
        }
      }
    }
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
