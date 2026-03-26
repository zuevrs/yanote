import { describe, expect, it } from "vitest";
import { serializeOperationKey } from "../model/operationKey.js";
import { buildAsyncApiSemantics, loadAsyncApiOperations, loadAsyncApiSemanticsBundle } from "./asyncapi.js";

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

  it("serializes amqp identities with the protocol-scoped operation key", () => {
    expect(
      serializeOperationKey({
        kind: "amqp",
        action: "send",
        channel: "users.signedup"
      })
    ).toBe("amqp send users.signedup");
  });

  it("accepts the supported amqp subset with protocol-attributed diagnostics and identities", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml");

    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.diagnostics).toEqual([]);
    expect(bundle.operations.map((operation) => serializeOperationKey(operation))).toEqual(["amqp send users.signedup"]);
    expect(bundle.operationContractsByKey.get("amqp send users.signedup")).toEqual({
      operation: {
        kind: "amqp",
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

  it("retains declared correlation and reply metadata beside the unchanged kafka identity", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/trait-declarations-inline-v3.yaml");

    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.diagnostics).toEqual([]);
    expect(bundle.operations.map((operation) => serializeOperationKey(operation))).toEqual(["kafka send orders.command"]);
    expect(bundle.operationContractsByKey.get("kafka send orders.command")).toEqual({
      operation: {
        kind: "kafka",
        action: "send",
        channel: "orders.command"
      },
      declaredReply: {
        address: {
          location: "$message.header#/reply_to"
        }
      },
      message: {
        name: "OrderCommand",
        declaredCorrelationId: {
          location: "$message.header#/correlation_id"
        },
        contentType: "application/json",
        payloadSchema: {
          type: "object",
          "x-parser-schema-id": "<anonymous-schema-1>"
        },
        payloadSchemaId: "<anonymous-schema-1>",
        headerValidationCapability: "none",
        selectionHints: [{ kind: "message", value: "OrderCommand" }]
      },
      messageSelection: {
        mode: "single",
        precedence: [{ kind: "message" }]
      }
    });
  });

  it("retains resolved reply-channel address metadata beside the unchanged kafka identity", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-inline-v3.yaml");

    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.diagnostics).toEqual([]);
    expect(bundle.operations.map((operation) => serializeOperationKey(operation))).toEqual(["kafka send orders.command"]);
    expect(bundle.operationContractsByKey.get("kafka send orders.command")).toEqual({
      operation: {
        kind: "kafka",
        action: "send",
        channel: "orders.command"
      },
      declaredReply: {
        address: {
          location: "$message.header#/reply_to"
        },
        channel: {
          address: "orders.reply"
        }
      },
      message: {
        name: "OrderCommand",
        declaredCorrelationId: {
          location: "$message.header#/correlation_id"
        },
        contentType: "application/json",
        payloadSchema: {
          type: "object",
          "x-parser-schema-id": "<anonymous-schema-1>"
        },
        payloadSchemaId: "<anonymous-schema-1>",
        headerValidationCapability: "none",
        selectionHints: [{ kind: "message", value: "OrderCommand" }]
      },
      messageSelection: {
        mode: "single",
        precedence: [{ kind: "message" }]
      }
    });
  });

  it("retains supported-shape unsupported payload locations for later runtime fail-closed evaluation", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-unsupported-v3.yaml");

    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.diagnostics).toEqual([]);
    expect(bundle.operations.map((operation) => serializeOperationKey(operation))).toEqual(["kafka send orders.command"]);
    expect(bundle.operationContractsByKey.get("kafka send orders.command")).toEqual({
      operation: {
        kind: "kafka",
        action: "send",
        channel: "orders.command"
      },
      declaredReply: {
        address: {
          location: "$message.payload#/meta/reply_to"
        },
        channel: {
          address: "orders.reply"
        }
      },
      message: {
        name: "OrderCommand",
        declaredCorrelationId: {
          location: "$message.payload#/meta/correlation_id"
        },
        contentType: "application/json",
        payloadSchema: {
          type: "object",
          "x-parser-schema-id": "<anonymous-schema-1>"
        },
        payloadSchemaId: "<anonymous-schema-1>",
        headerValidationCapability: "none",
        selectionHints: [{ kind: "message", value: "OrderCommand" }]
      },
      messageSelection: {
        mode: "single",
        precedence: [{ kind: "message" }]
      }
    });
  });

  it("surfaces explicit invalid diagnostics for parser-surviving malformed declaration shells instead of silently retaining them", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-malformed-v3.yaml");

    expect(bundle.hasInvalid).toBe(true);
    expect(bundle.operations.map((operation) => serializeOperationKey(operation))).toEqual(["kafka send orders.command"]);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "invalid",
        message:
          "AsyncAPI correlationId location must resolve to a non-empty $message.header#/... or $message.payload#/... path",
        async: {
          runtime: "kafka",
          asyncapiVersion: "3.0.0",
          protocol: "kafka",
          action: "send",
          channel: "orders.command",
          message: "OrderCommand"
        }
      },
      {
        kind: "invalid",
        message: "AsyncAPI reply.address location must resolve to a non-empty $message.header#/... or $message.payload#/... path",
        async: {
          runtime: "kafka",
          asyncapiVersion: "3.0.0",
          protocol: "kafka",
          action: "send",
          channel: "orders.command"
        }
      }
    ]);
    expect(bundle.operationContractsByKey.get("kafka send orders.command")).toEqual({
      operation: {
        kind: "kafka",
        action: "send",
        channel: "orders.command"
      },
      message: {
        name: "OrderCommand",
        contentType: "application/json",
        payloadSchema: {
          type: "object",
          "x-parser-schema-id": "<anonymous-schema-1>"
        },
        payloadSchemaId: "<anonymous-schema-1>",
        headerValidationCapability: "none",
        selectionHints: [{ kind: "message", value: "OrderCommand" }]
      },
      messageSelection: {
        mode: "single",
        precedence: [{ kind: "message" }]
      }
    });
  });

  it("classifies raw malformed declaration shells as invalid instead of silently dropping them", () => {
    const bundle = buildAsyncApiSemantics({
      asyncapi: "3.0.0",
      servers: {
        kafkaLocal: {
          protocol: "kafka"
        }
      },
      channels: {
        orderCommands: {
          address: "orders.command"
        }
      },
      operations: {
        sendOrderCommand: {
          action: "send",
          channel: "orders.command",
          reply: {},
          messages: [
            {
              name: "OrderCommand",
              correlationId: "nope"
            }
          ]
        }
      }
    });

    expect(bundle.hasInvalid).toBe(true);
    expect(bundle.operations.map((operation) => serializeOperationKey(operation))).toEqual(["kafka send orders.command"]);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "invalid",
        message: "AsyncAPI correlationId declaration must be an object with a non-empty runtime-expression path",
        async: {
          runtime: "kafka",
          asyncapiVersion: "3.0.0",
          protocol: "kafka",
          action: "send",
          channel: "orders.command",
          message: "OrderCommand"
        }
      },
      {
        kind: "invalid",
        message: "AsyncAPI reply declaration must include reply.address.location",
        async: {
          runtime: "kafka",
          asyncapiVersion: "3.0.0",
          protocol: "kafka",
          action: "send",
          channel: "orders.command"
        }
      }
    ]);
    expect(bundle.operationContractsByKey.get("kafka send orders.command")).toEqual({
      operation: {
        kind: "kafka",
        action: "send",
        channel: "orders.command"
      },
      message: {
        name: "OrderCommand",
        headerValidationCapability: "none",
        selectionHints: [{ kind: "message", value: "OrderCommand" }]
      },
      messageSelection: {
        mode: "single",
        precedence: [{ kind: "message" }]
      }
    });
  });

  it("retains parser-merged trait declarations as additive metadata instead of leaking trait blobs", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/trait-declarations-trait-v2.yaml");

    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.diagnostics).toEqual([]);
    expect(bundle.operations.map((operation) => serializeOperationKey(operation))).toEqual(["kafka send orders.command"]);
    expect(bundle.operationContractsByKey.get("kafka send orders.command")).toEqual({
      operation: {
        kind: "kafka",
        action: "send",
        channel: "orders.command"
      },
      message: {
        name: "OrderCommand",
        declaredCorrelationId: {
          location: "$message.header#/correlation_id"
        },
        contentType: "application/json",
        payloadSchema: {
          type: "object",
          "x-parser-schema-id": "<anonymous-schema-1>"
        },
        payloadSchemaId: "<anonymous-schema-1>",
        headerValidationCapability: "none",
        selectionHints: [{ kind: "message", value: "OrderCommand" }]
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

  it("surfaces structured async diagnostics when a document uses an unsupported rabbitmq protocol alias", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/unsupported-rabbitmq.yaml");

    expect(bundle.operations).toEqual([]);
    expect(bundle.hasInvalid).toBe(true);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "invalid",
        message: "Unsupported AsyncAPI protocol: rabbitmq. Supported protocols: amqp, kafka.",
        async: {
          runtime: "asyncapi",
          asyncapiVersion: "3.0.0",
          protocol: "rabbitmq"
        }
      }
    ]);
  });

  it("surfaces structured async diagnostics when a document uses an unsupported mqtt protocol", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/unsupported-mqtt.yaml");

    expect(bundle.operations).toEqual([]);
    expect(bundle.hasInvalid).toBe(true);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "invalid",
        message: "Unsupported AsyncAPI protocol: mqtt. Supported protocols: amqp, kafka.",
        async: {
          runtime: "asyncapi",
          asyncapiVersion: "3.0.0",
          protocol: "mqtt"
        }
      }
    ]);
  });

  it("fails closed when an AsyncAPI document mixes supported protocols across servers", () => {
    const bundle = buildAsyncApiSemantics({
      asyncapi: "3.0.0",
      servers: {
        kafkaLocal: {
          protocol: "kafka"
        },
        rabbitmqLocal: {
          protocol: "amqp"
        }
      },
      channels: {
        usersSignedUp: {
          address: "users.signedup"
        }
      },
      operations: {
        sendUserSignedUp: {
          action: "send",
          channel: {
            $ref: "#/channels/usersSignedUp"
          }
        }
      }
    });

    expect(bundle.operations).toEqual([]);
    expect(bundle.hasInvalid).toBe(true);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "invalid",
        message:
          "Mixed AsyncAPI protocols are not supported: amqp, kafka. Declare exactly one supported protocol (amqp, kafka).",
        async: {
          runtime: "asyncapi",
          asyncapiVersion: "3.0.0",
          protocol: "amqp, kafka"
        }
      }
    ]);
  });

  it("rejects unsupported AsyncAPI version documents before protocol-aware normalization starts", async () => {
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

  it("expects unsupported async protocols to be rejected while the supported amqp subset is accepted", async () => {
    await expect(loadAsyncApiOperations("test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml")).resolves.toEqual([
      {
        kind: "amqp",
        action: "send",
        channel: "users.signedup"
      }
    ]);
    await expect(loadAsyncApiOperations("test/fixtures/asyncapi/unsupported-rabbitmq.yaml")).rejects.toThrow(
      /unsupported|rabbitmq|protocol/i
    );
    await expect(loadAsyncApiOperations("test/fixtures/asyncapi/unsupported-mqtt.yaml")).rejects.toThrow(
      /unsupported|mqtt|protocol/i
    );
  });
});

async function expectParserBoundaryToReject(specPath: string, pattern: RegExp): Promise<void> {
  await expect(loadAsyncApiSemanticsBundle(specPath)).rejects.toThrow(pattern);
  await expect(loadAsyncApiOperations(specPath)).rejects.toThrow(pattern);
}
