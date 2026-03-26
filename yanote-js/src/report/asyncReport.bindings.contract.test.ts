import { describe, expect, it } from "vitest";
import { loadAsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncCoverage } from "../coverage/asyncCoverage.js";
import { buildAsyncReport, validateAsyncReport } from "./asyncReport.js";
import { renderAsyncYanoteReportHtml } from "./asyncReportHtml.js";

describe("async report kafka binding support contract", () => {
  it("publishes a strict additive bindingSupport section without changing legacy async coverage numerators", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml");
    const coverage = computeAsyncCoverage(bundle, []);

    const baseline = buildAsyncReport(coverage, {
      toolVersion: "test",
      specSource: {
        kind: "local-file",
        reference: "test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml"
      }
    });

    const report = buildAsyncReport(coverage, {
      toolVersion: "test",
      specSource: {
        kind: "local-file",
        reference: "test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml"
      },
      operationContractsByKey: bundle.operationContractsByKey
    });

    expect(report.summary).toEqual(baseline.summary);
    expect(report.coverage).toEqual(baseline.coverage);
    expect(report.bindingSupport).toEqual({
      summary: {
        totalOperations: 3,
        totalBindings: 18,
        supportedBindings: 1,
        declaredOnlyBindings: 6,
        deferredBindings: 11,
        invalidBindings: 0
      },
      operations: [
        {
          operationKey: "kafka receive orders.consumer",
          channel: "orders.consumer",
          action: "receive",
          bindings: [
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
          ]
        },
        {
          operationKey: "kafka send orders.command",
          channel: "orders.command",
          action: "send",
          bindings: [
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
          ]
        },
        {
          operationKey: "kafka send users.lifecycle",
          channel: "users.lifecycle",
          action: "send",
          bindings: [
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
          ]
        }
      ]
    });

    const html = renderAsyncYanoteReportHtml(report);

    expect(html).toContain("Kafka Binding Support");
    expect(html).toContain("Operations with bindings");
    expect(html).toContain("Supported now");
    expect(html).toContain("Declared-only");
    expect(html).toContain("Deferred");
    expect(html).toContain("orders.actual");
    expect(html).toContain("channel.bindings.kafka.topic");
    expect(html).toContain("message.bindings.kafka.schemaLookupStrategy");
    expect(html).toContain("These counts do not change async coverage numerators");
    expect(validateAsyncReport(report)).toEqual({ ok: true });
  });

  it("fails closed when a malformed binding status reaches the HTML delivery path", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml");
    const coverage = computeAsyncCoverage(bundle, []);
    const report = buildAsyncReport(coverage, {
      toolVersion: "test",
      specSource: {
        kind: "local-file",
        reference: "test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml"
      },
      operationContractsByKey: bundle.operationContractsByKey
    });

    const malformed = structuredClone(report) as typeof report & {
      bindingSupport: {
        operations: Array<{
          bindings: Array<{ status: string }>;
        }>;
      };
    };
    malformed.bindingSupport.operations[0]!.bindings[0]!.status = "mystery-status";

    expect(() => renderAsyncYanoteReportHtml(malformed as any)).toThrow(/Unknown kafka binding support status: mystery-status/);
  });
});
