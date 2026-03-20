import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import type { AsyncEvent } from "../model/asyncEvent.js";
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

  it("surfaces unsupported content types explicitly instead of silently passing", async () => {
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
      validatedOperationKeys: [],
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
      ]
    });
  });

  it("surfaces unsupported schema formats and header-unverifiable contracts explicitly", async () => {
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
      validatedOperationKeys: [],
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
      ]
    });
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
