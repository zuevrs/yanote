import { describe, expect, it } from "vitest";
import { serializeOperationKey, type KafkaOperationContract } from "../model/operationKey.js";
import { loadAsyncApiSemanticsBundle } from "./asyncapi.js";

const expectedContracts = [
  {
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
  },
  {
    operation: {
      kind: "kafka",
      action: "receive",
      channel: "users.deleted"
    },
    message: {
      name: "UserDeleted",
      contentType: "application/json",
      payloadSchema: {
        type: "object",
        "x-parser-schema-id": "<anonymous-schema-2>"
      },
      payloadSchemaId: "<anonymous-schema-2>",
      headerValidationCapability: "none",
      selectionHints: [{ kind: "message", value: "UserDeleted" }]
    },
    messageSelection: {
      mode: "single",
      precedence: [{ kind: "message" }]
    }
  }
] satisfies KafkaOperationContract[];

const expectedSchemaDepthContracts = [
  {
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
  }
] satisfies KafkaOperationContract[];

const expectedTraitDeclarationV2Contracts = [
  {
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
  }
] satisfies KafkaOperationContract[];

const expectedTraitDeclarationV3Contracts = [
  {
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
  }
] satisfies KafkaOperationContract[];

const expectedHeaderRuntimeContracts = [
  {
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
  }
] satisfies KafkaOperationContract[];

const expectedAmqpContracts = [
  {
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
  }
] satisfies KafkaOperationContract[];

const expectedKeys = expectedContracts.map((contract) => serializeOperationKey(contract.operation));
const expectedSchemaDepthKeys = expectedSchemaDepthContracts.map((contract) => serializeOperationKey(contract.operation));
const expectedTraitDeclarationV2Keys = expectedTraitDeclarationV2Contracts.map((contract) => serializeOperationKey(contract.operation));
const expectedTraitDeclarationV3Keys = expectedTraitDeclarationV3Contracts.map((contract) => serializeOperationKey(contract.operation));
const expectedHeaderRuntimeKeys = expectedHeaderRuntimeContracts.map((contract) => serializeOperationKey(contract.operation));
const expectedAmqpKeys = expectedAmqpContracts.map((contract) => serializeOperationKey(contract.operation));

describe("asyncapi parity contract", () => {
  it("keeps message-contract metadata beside the kafka identity instead of inside the serialized key", () => {
    expect(expectedKeys).toEqual(["kafka send users.signedup", "kafka receive users.deleted"]);
    expect(expectedContracts.map((contract) => contract.message?.name)).toEqual(["UserSignedUp", "UserDeleted"]);
    expect(expectedContracts.map((contract) => contract.message?.contentType)).toEqual(["application/json", "application/json"]);
    expect(expectedContracts.map((contract) => contract.message?.payloadSchemaId)).toEqual([
      "<anonymous-schema-1>",
      "<anonymous-schema-2>"
    ]);
    expect(expectedContracts.map((contract) => contract.message?.headerValidationCapability)).toEqual(["none", "none"]);
    expect(expectedContracts.map((contract) => contract.messageSelection?.mode)).toEqual(["single", "single"]);
  });

  it("expects equivalent AsyncAPI v2 and v3 fixtures to normalize into the same kafka operation contracts", async () => {
    const v2 = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v2.yaml");
    const v3 = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");

    expect(v2.hasInvalid).toBe(false);
    expect(v3.hasInvalid).toBe(false);
    expect(v2.diagnostics).toEqual([]);
    expect(v3.diagnostics).toEqual([]);

    expect(serializedOperationKeys(v2)).toEqual(expectedKeys);
    expect(serializedOperationKeys(v3)).toEqual(expectedKeys);
    expect(serializedOperationKeys(v2)).toEqual(serializedOperationKeys(v3));

    expect(contractKeysInOrder(v2)).toEqual(expectedKeys);
    expect(contractKeysInOrder(v3)).toEqual(expectedKeys);

    expect(contractsInOrder(v2)).toEqual(expectedContracts);
    expect(contractsInOrder(v3)).toEqual(expectedContracts);
  });

  it("expects schema-depth fixtures to preserve identical routing keys and retained metadata across AsyncAPI versions", async () => {
    const v2 = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v2.yaml");
    const v3 = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");

    expect(v2.hasInvalid).toBe(false);
    expect(v3.hasInvalid).toBe(false);
    expect(v2.diagnostics).toEqual([]);
    expect(v3.diagnostics).toEqual([]);

    expect(serializedOperationKeys(v2)).toEqual(expectedSchemaDepthKeys);
    expect(serializedOperationKeys(v3)).toEqual(expectedSchemaDepthKeys);
    expect(serializedOperationKeys(v2)).toEqual(serializedOperationKeys(v3));

    expect(contractKeysInOrder(v2)).toEqual(expectedSchemaDepthKeys);
    expect(contractKeysInOrder(v3)).toEqual(expectedSchemaDepthKeys);

    expect(contractsInOrder(v2)).toEqual(expectedSchemaDepthContracts);
    expect(contractsInOrder(v3)).toEqual(expectedSchemaDepthContracts);
  });

  it("expects inline and trait-applied v2 declarations to normalize into the same retained kafka contract", async () => {
    const inline = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/trait-declarations-inline-v2.yaml");
    const trait = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/trait-declarations-trait-v2.yaml");

    expect(inline.hasInvalid).toBe(false);
    expect(trait.hasInvalid).toBe(false);
    expect(inline.diagnostics).toEqual([]);
    expect(trait.diagnostics).toEqual([]);

    expect(serializedOperationKeys(inline)).toEqual(expectedTraitDeclarationV2Keys);
    expect(serializedOperationKeys(trait)).toEqual(expectedTraitDeclarationV2Keys);
    expect(serializedOperationKeys(inline)).toEqual(serializedOperationKeys(trait));

    expect(contractKeysInOrder(inline)).toEqual(expectedTraitDeclarationV2Keys);
    expect(contractKeysInOrder(trait)).toEqual(expectedTraitDeclarationV2Keys);

    expect(contractsInOrder(inline)).toEqual(expectedTraitDeclarationV2Contracts);
    expect(contractsInOrder(trait)).toEqual(expectedTraitDeclarationV2Contracts);
  });

  it("expects inline and trait-applied v3 declarations to normalize into the same retained kafka contract", async () => {
    const inline = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/trait-declarations-inline-v3.yaml");
    const trait = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/trait-declarations-trait-v3.yaml");

    expect(inline.hasInvalid).toBe(false);
    expect(trait.hasInvalid).toBe(false);
    expect(inline.diagnostics).toEqual([]);
    expect(trait.diagnostics).toEqual([]);

    expect(serializedOperationKeys(inline)).toEqual(expectedTraitDeclarationV3Keys);
    expect(serializedOperationKeys(trait)).toEqual(expectedTraitDeclarationV3Keys);
    expect(serializedOperationKeys(inline)).toEqual(serializedOperationKeys(trait));

    expect(contractKeysInOrder(inline)).toEqual(expectedTraitDeclarationV3Keys);
    expect(contractKeysInOrder(trait)).toEqual(expectedTraitDeclarationV3Keys);

    expect(contractsInOrder(inline)).toEqual(expectedTraitDeclarationV3Contracts);
    expect(contractsInOrder(trait)).toEqual(expectedTraitDeclarationV3Contracts);
  });

  it("expects inline and trait-applied header-runtime declarations to normalize into the same retained kafka contract", async () => {
    const inline = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-inline-v3.yaml");
    const trait = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-trait-v3.yaml");

    expect(inline.hasInvalid).toBe(false);
    expect(trait.hasInvalid).toBe(false);
    expect(inline.diagnostics).toEqual([]);
    expect(trait.diagnostics).toEqual([]);

    expect(serializedOperationKeys(inline)).toEqual(expectedHeaderRuntimeKeys);
    expect(serializedOperationKeys(trait)).toEqual(expectedHeaderRuntimeKeys);
    expect(serializedOperationKeys(inline)).toEqual(serializedOperationKeys(trait));

    expect(contractKeysInOrder(inline)).toEqual(expectedHeaderRuntimeKeys);
    expect(contractKeysInOrder(trait)).toEqual(expectedHeaderRuntimeKeys);

    expect(contractsInOrder(inline)).toEqual(expectedHeaderRuntimeContracts);
    expect(contractsInOrder(trait)).toEqual(expectedHeaderRuntimeContracts);
  });

  it("preserves kafka keys while emitting protocol-scoped amqp keys for the supported rabbitmq subset", async () => {
    const kafka = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");
    const amqp = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml");

    expect(kafka.hasInvalid).toBe(false);
    expect(amqp.hasInvalid).toBe(false);
    expect(kafka.diagnostics).toEqual([]);
    expect(amqp.diagnostics).toEqual([]);

    expect(serializedOperationKeys(kafka)).toEqual(expectedKeys);
    expect(serializedOperationKeys(amqp)).toEqual(expectedAmqpKeys);
    expect(contractKeysInOrder(amqp)).toEqual(expectedAmqpKeys);
    expect(contractsInOrder(amqp)).toEqual(expectedAmqpContracts);
  });

  it("preserves the canonical kafka operation key when multi-message runtime selection metadata is attached", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/multi-message-resolvable.yaml");

    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.diagnostics).toEqual([]);
    expect(serializedOperationKeys(bundle)).toEqual(["kafka send users.lifecycle"]);
    expect(contractKeysInOrder(bundle)).toEqual(["kafka send users.lifecycle"]);
    expect(bundle.operationContractsByKey.get("kafka send users.lifecycle")).toMatchObject({
      messageSelection: {
        mode: "runtime",
        precedence: [{ kind: "message" }, { kind: "header", header: "yanote.event.kind" }]
      }
    });
  });
});

function serializedOperationKeys(bundle: Awaited<ReturnType<typeof loadAsyncApiSemanticsBundle>>): string[] {
  return bundle.operations.map((operation) => serializeOperationKey(operation));
}

function contractKeysInOrder(bundle: Awaited<ReturnType<typeof loadAsyncApiSemanticsBundle>>): string[] {
  return Array.from(bundle.operationContractsByKey.keys());
}

function contractsInOrder(bundle: Awaited<ReturnType<typeof loadAsyncApiSemanticsBundle>>): KafkaOperationContract[] {
  return bundle.operations.map((operation) => {
    const key = serializeOperationKey(operation);
    const contract = bundle.operationContractsByKey.get(key);
    if (!contract) {
      throw new Error(`Missing async contract for ${key}`);
    }

    return contract;
  });
}
