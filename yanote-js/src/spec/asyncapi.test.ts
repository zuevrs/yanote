import { describe, expect, it } from "vitest";
import { serializeOperationKey } from "../model/operationKey.js";
import { loadAsyncApiOperations, loadAsyncApiSemanticsBundle } from "./asyncapi.js";

describe("asyncapi contract", () => {
  it("serializes kafka identities without leaking message-contract metadata into the operation key", () => {
    expect(
      serializeOperationKey({
        kind: "kafka",
        action: "send",
        channel: "users.signedup"
      })
    ).toBe("kafka send users.signedup");
  });

  it("retains payload schema metadata beside the canonical kafka identity", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");

    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.diagnostics).toEqual([]);
    expect(bundle.operationContractsByKey.get("kafka send users.signedup")).toEqual({
      operation: {
        kind: "kafka",
        action: "send",
        channel: "users.signedup"
      },
      message: {
        name: "UserSignedUp",
        contentType: "application/json",
        payloadSchema: {
          type: "object",
          "x-parser-schema-id": "<anonymous-schema-1>"
        },
        payloadSchemaId: "<anonymous-schema-1>",
        headerValidationCapability: "none",
        selectionHints: [{ kind: "message", value: "UserSignedUp" }]
      },
      messageSelection: {
        mode: "single",
        precedence: [{ kind: "message" }]
      }
    });
  });

  it("retains schema-depth payload and header metadata beside the unchanged kafka routing key", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");

    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.diagnostics).toEqual([]);
    expect(bundle.operations.map((operation) => serializeOperationKey(operation))).toEqual(["kafka send orders.created"]);
    expect(bundle.operationContractsByKey.get("kafka send orders.created")).toEqual({
      operation: {
        kind: "kafka",
        action: "send",
        channel: "orders.created"
      },
      message: {
        name: "OrderCreatedEnvelope",
        contentType: "application/json",
        payloadSchema: {
          type: "object",
          required: ["eventId", "order"],
          properties: {
            eventId: {
              type: "string",
              "x-parser-schema-id": "<anonymous-schema-3>"
            },
            order: {
              type: "object",
              required: ["id", "total"],
              properties: {
                id: {
                  type: "string",
                  "x-parser-schema-id": "<anonymous-schema-5>"
                },
                total: {
                  type: "number",
                  "x-parser-schema-id": "<anonymous-schema-6>"
                }
              },
              "x-parser-schema-id": "<anonymous-schema-4>"
            }
          },
          "x-parser-schema-id": "OrderCreatedPayload"
        },
        payloadSchemaId: "OrderCreatedPayload",
        headersSchema: {
          type: "object",
          required: ["tenantId", "traceId"],
          properties: {
            tenantId: {
              type: "string",
              "x-parser-schema-id": "<anonymous-schema-1>"
            },
            traceId: {
              type: "string",
              "x-parser-schema-id": "<anonymous-schema-2>"
            }
          },
          "x-parser-schema-id": "OrderEventHeaders"
        },
        headersSchemaId: "OrderEventHeaders",
        headerValidationCapability: "supported",
        selectionHints: [{ kind: "message", value: "OrderCreatedEnvelope" }]
      },
      messageSelection: {
        mode: "single",
        precedence: [{ kind: "message" }]
      }
    });
  });

  it("retains multi-message candidates and deterministic selection precedence beside the canonical kafka key", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/multi-message-resolvable.yaml");

    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.diagnostics).toEqual([]);
    expect(bundle.operations.map((operation) => serializeOperationKey(operation))).toEqual(["kafka send users.lifecycle"]);
    expect(bundle.operationContractsByKey.get("kafka send users.lifecycle")).toMatchObject({
      operation: {
        kind: "kafka",
        action: "send",
        channel: "users.lifecycle"
      },
      messages: [
        {
          name: "UserLifecycleEvent",
          headerValidationCapability: "supported",
          selectionHints: [
            { kind: "message", value: "UserLifecycleEvent" },
            { kind: "header", header: "yanote.event.kind", value: "deleted" }
          ]
        },
        {
          name: "UserLifecycleEvent",
          headerValidationCapability: "supported",
          selectionHints: [
            { kind: "message", value: "UserLifecycleEvent" },
            { kind: "header", header: "yanote.event.kind", value: "signed-up" }
          ]
        }
      ],
      messageSelection: {
        mode: "runtime",
        precedence: [{ kind: "message" }, { kind: "header", header: "yanote.event.kind" }]
      }
    });
    expect(bundle.operationContractsByKey.get("kafka send users.lifecycle")?.message).toBeUndefined();
  });

  it("surfaces typed ambiguity diagnostics when multi-message contracts cannot be discriminated safely", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/multi-message-ambiguous.yaml");

    expect(bundle.operations).toEqual([]);
    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "ambiguous",
        message:
          "AsyncAPI v3 operation declares multiple messages without a deterministic message-name or retained-header discriminator",
        async: {
          runtime: "kafka",
          asyncapiVersion: "3.0.0",
          protocol: "kafka",
          action: "send",
          channel: "users.lifecycle"
        },
        candidates: [
          "UserLifecycleEvent [payload: UserLifecycleByEmailPayload]",
          "UserLifecycleEvent [payload: UserLifecycleByIdPayload]"
        ]
      }
    ]);
  });

  it("surfaces structured async diagnostics when a kafka-scoped contract is semantically invalid", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/invalid.yaml");

    expect(bundle.operations).toEqual([]);
    expect(bundle.hasInvalid).toBe(true);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "invalid",
        message: "AsyncAPI v3 operation channel must resolve to a non-empty address",
        async: {
          runtime: "kafka",
          asyncapiVersion: "3.0.0",
          protocol: "kafka",
          action: "send"
        }
      }
    ]);
  });

  it("surfaces structured async diagnostics when a document falls outside the kafka-only scope boundary", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/unsupported-rabbitmq.yaml");

    expect(bundle.operations).toEqual([]);
    expect(bundle.hasInvalid).toBe(true);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "invalid",
        message: "Unsupported AsyncAPI protocol: amqp. Only kafka is supported.",
        async: {
          runtime: "kafka",
          asyncapiVersion: "3.0.0",
          protocol: "amqp"
        }
      }
    ]);
  });

  it("rejects unsupported AsyncAPI version documents before kafka normalization starts", async () => {
    await expectParserBoundaryToReject(
      "test/fixtures/asyncapi/unsupported-version.yaml",
      /Version "4\.0\.0" is not supported/i
    );
  });

  it("rejects unresolved AsyncAPI message references instead of producing partial kafka operations", async () => {
    await expectParserBoundaryToReject(
      "test/fixtures/asyncapi/unresolved-message-ref.yaml",
      /MissingMessage.*does not exist|does not exist.*MissingMessage/i
    );
  });

  it("rejects malformed AsyncAPI channel references instead of normalizing them as kafka operations", async () => {
    await expectParserBoundaryToReject(
      "test/fixtures/asyncapi/malformed-channel-ref.yaml",
      /must always reference a channel/i
    );
  });

  it("fails closed when AsyncAPI multi-message contracts remain ambiguous", async () => {
    await expect(loadAsyncApiOperations("test/fixtures/asyncapi/multi-message-ambiguous.yaml")).rejects.toThrow(
      /ambiguous|deterministic|header discriminator|users\.lifecycle/i
    );
  });

  it("expects malformed kafka contracts to fail closed instead of silently disappearing", async () => {
    await expect(loadAsyncApiOperations("test/fixtures/asyncapi/invalid.yaml")).rejects.toThrow(
      /invalid|semantic|channel|kafka/i
    );
  });

  it("expects non-kafka async protocols to be rejected at the current scope boundary", async () => {
    await expect(loadAsyncApiOperations("test/fixtures/asyncapi/unsupported-rabbitmq.yaml")).rejects.toThrow(
      /unsupported|kafka|rabbitmq|amqp/i
    );
  });
});

async function expectParserBoundaryToReject(specPath: string, pattern: RegExp): Promise<void> {
  await expect(loadAsyncApiSemanticsBundle(specPath)).rejects.toThrow(pattern);
  await expect(loadAsyncApiOperations(specPath)).rejects.toThrow(pattern);
}
