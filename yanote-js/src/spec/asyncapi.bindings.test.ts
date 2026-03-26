import { describe, expect, it } from "vitest";
import { serializeOperationKey } from "../model/operationKey.js";
import { buildAsyncApiSemantics, loadAsyncApiSemanticsBundle } from "./asyncapi.js";

describe("asyncapi kafka binding support extraction", () => {
  it("retains supported, declared-only, and deferred kafka bindings without changing canonical operation keys", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml");

    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.diagnostics).toEqual([]);
    expect(bundle.operations.map((operation) => serializeOperationKey(operation))).toEqual([
      "kafka send orders.command",
      "kafka receive orders.consumer",
      "kafka send users.lifecycle"
    ]);

    expect(bundle.operationContractsByKey.get("kafka send orders.command")?.bindingSupport).toEqual([
      {
        scope: "channel",
        field: "topic",
        status: "supported",
        source: "channel.bindings.kafka.topic",
        value: "orders.actual"
      },
      {
        scope: "channel",
        field: "partitions",
        status: "deferred",
        source: "channel.bindings.kafka.partitions"
      },
      {
        scope: "channel",
        field: "replicas",
        status: "deferred",
        source: "channel.bindings.kafka.replicas"
      },
      {
        scope: "channel",
        field: "topicConfiguration",
        status: "deferred",
        source: "channel.bindings.kafka.topicConfiguration"
      },
      {
        scope: "operation",
        field: "groupId",
        status: "declared-only",
        source: "operation.bindings.kafka.groupId"
      },
      {
        scope: "operation",
        field: "clientId",
        status: "declared-only",
        source: "operation.bindings.kafka.clientId"
      },
      {
        scope: "message",
        messageName: "OrderCommand",
        field: "key",
        status: "declared-only",
        source: "message.bindings.kafka.key"
      },
      {
        scope: "message",
        messageName: "OrderCommand",
        field: "schemaIdLocation",
        status: "deferred",
        source: "message.bindings.kafka.schemaIdLocation"
      },
      {
        scope: "message",
        messageName: "OrderCommand",
        field: "schemaLookupStrategy",
        status: "deferred",
        source: "message.bindings.kafka.schemaLookupStrategy"
      }
    ]);

    expect(bundle.operationContractsByKey.get("kafka receive orders.consumer")?.bindingSupport).toEqual([
      {
        scope: "operation",
        field: "groupId",
        status: "declared-only",
        source: "operation.bindings.kafka.groupId"
      },
      {
        scope: "operation",
        field: "clientId",
        status: "declared-only",
        source: "operation.bindings.kafka.clientId"
      },
      {
        scope: "message",
        messageName: "OrderConsumerEvent",
        field: "key",
        status: "declared-only",
        source: "message.bindings.kafka.key"
      }
    ]);

    expect(bundle.operationContractsByKey.get("kafka send users.lifecycle")?.bindingSupport).toEqual([
      {
        scope: "message",
        messageName: "UserLifecycleEvent",
        field: "schemaIdLocation",
        status: "deferred",
        source: "message.bindings.kafka.schemaIdLocation"
      },
      {
        scope: "message",
        messageName: "UserLifecycleEvent",
        field: "schemaIdLocation",
        status: "deferred",
        source: "message.bindings.kafka.schemaIdLocation"
      },
      {
        scope: "message",
        messageName: "UserLifecycleEvent",
        field: "schemaIdPayloadEncoding",
        status: "deferred",
        source: "message.bindings.kafka.schemaIdPayloadEncoding"
      },
      {
        scope: "message",
        messageName: "UserLifecycleEvent",
        field: "schemaIdPayloadEncoding",
        status: "deferred",
        source: "message.bindings.kafka.schemaIdPayloadEncoding"
      },
      {
        scope: "message",
        messageName: "UserLifecycleEvent",
        field: "schemaLookupStrategy",
        status: "deferred",
        source: "message.bindings.kafka.schemaLookupStrategy"
      },
      {
        scope: "message",
        messageName: "UserLifecycleEvent",
        field: "schemaLookupStrategy",
        status: "deferred",
        source: "message.bindings.kafka.schemaLookupStrategy"
      }
    ]);
  });

  it("fails closed on malformed supported-topic declarations instead of rewriting kafka identity", () => {
    const bundle = buildAsyncApiSemantics({
      asyncapi: "3.0.0",
      servers: {
        kafkaLocal: {
          protocol: "kafka"
        }
      },
      channels: {
        orderCommands: {
          address: "orders.command",
          bindings: {
            kafka: {
              topic: "   "
            }
          }
        }
      },
      operations: {
        sendOrderCommand: {
          action: "send",
          channel: {
            $ref: "#/channels/orderCommands"
          },
          messages: [
            {
              name: "OrderCommand"
            }
          ]
        }
      }
    });

    expect(bundle.hasInvalid).toBe(true);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "invalid",
        message: "AsyncAPI kafka channel binding topic must be a non-empty string when declared",
        async: {
          runtime: "kafka",
          asyncapiVersion: "3.0.0",
          protocol: "kafka",
          action: "send",
          channel: "orders.command"
        }
      }
    ]);
    expect(bundle.operations.map((operation) => serializeOperationKey(operation))).toEqual(["kafka send orders.command"]);
    expect(bundle.operationContractsByKey.get("kafka send orders.command")?.bindingSupport).toEqual([
      {
        scope: "channel",
        field: "topic",
        status: "invalid",
        source: "channel.bindings.kafka.topic",
        reason: "Kafka topic bindings must be declared as a non-empty string."
      }
    ]);
  });

  it("classifies incomplete schema-registry metadata as invalid instead of silently omitting it", () => {
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
          channel: {
            $ref: "#/channels/orderCommands"
          },
          messages: [
            {
              name: "OrderCommand",
              bindings: {
                kafka: {
                  schemaIdPayloadEncoding: "4"
                }
              }
            }
          ]
        }
      }
    });

    expect(bundle.hasInvalid).toBe(true);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "invalid",
        message:
          "AsyncAPI kafka message binding schemaIdPayloadEncoding requires schemaIdLocation='payload' to classify schema-registry metadata",
        async: {
          runtime: "kafka",
          asyncapiVersion: "3.0.0",
          protocol: "kafka",
          action: "send",
          channel: "orders.command",
          message: "OrderCommand"
        }
      }
    ]);
    expect(bundle.operationContractsByKey.get("kafka send orders.command")?.bindingSupport).toEqual([
      {
        scope: "message",
        messageName: "OrderCommand",
        field: "schemaIdPayloadEncoding",
        status: "invalid",
        source: "message.bindings.kafka.schemaIdPayloadEncoding",
        reason: "schemaIdPayloadEncoding is only valid when schemaIdLocation is 'payload'."
      }
    ]);
  });

  it("keeps operations without kafka bindings free of additive binding rows", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");

    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.operationContractsByKey.get("kafka send users.signedup")?.bindingSupport ?? []).toEqual([]);
    expect(bundle.operationContractsByKey.get("kafka receive users.deleted")?.bindingSupport ?? []).toEqual([]);
  });
});
