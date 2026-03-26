import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import type { JsonValue } from "../model/asyncEvent.js";
import type { KafkaMessageContract } from "../model/operationKey.js";
import { loadAsyncApiSemanticsBundle, type AsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncCoverage } from "../coverage/asyncCoverage.js";
import {
  ASYNC_REPORT_PHASE,
  ASYNC_REPORT_SCHEMA_VERSION,
  buildAsyncReport,
  type AsyncYanoteReport
} from "./asyncReport.js";

const OPERATION_KEY = "kafka send orders.created";
const V3_ASYNC_SPEC_SOURCE = {
  kind: "local-file" as const,
  reference: "test/fixtures/asyncapi/v3.yaml"
};
const SCHEMA_DEPTH_ASYNC_SPEC_SOURCE = {
  kind: "local-file" as const,
  reference: "test/fixtures/asyncapi/schema-depth-v3.yaml"
};
const MULTI_MESSAGE_ASYNC_SPEC_SOURCE = {
  kind: "local-file" as const,
  reference: "test/fixtures/asyncapi/multi-message-resolvable.yaml"
};
const AMQP_BASIC_ASYNC_SPEC_SOURCE = {
  kind: "local-file" as const,
  reference: "test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml"
};

describe("async report", () => {
  it("builds a deterministic async report artifact without reusing the HTTP coverage surface", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/partial.fixture.jsonl");
    const coverage = computeAsyncCoverage(bundle, events.items);

    const report = buildAsyncReport(coverage, {
      toolVersion: "test",
      specSource: V3_ASYNC_SPEC_SOURCE,
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number")
    });

    const expected: AsyncYanoteReport = {
      schemaVersion: ASYNC_REPORT_SCHEMA_VERSION,
      generatedAt: "1970-01-01T00:00:00.000Z",
      toolVersion: "test",
      specSource: V3_ASYNC_SPEC_SOURCE,
      phase: ASYNC_REPORT_PHASE,
      protocols: ["kafka"],
      status: "partial",
      summary: {
        totalChannels: 2,
        coveredChannels: 1,
        channelCoveragePercent: 50,
        totalOperations: 2,
        coveredOperations: 1,
        operationCoveragePercent: 50,
        totalMessages: 2,
        coveredMessages: 1,
        messageCoveragePercent: 50
      },
      coverage: {
        channels: {
          state: "PARTIAL",
          percent: 50,
          items: [
            {
              channel: "users.signedup",
              state: "COVERED",
              coveredActions: ["send"],
              missingActions: []
            },
            {
              channel: "users.deleted",
              state: "UNCOVERED",
              coveredActions: [],
              missingActions: ["receive"]
            }
          ]
        },
        operations: {
          state: "PARTIAL",
          percent: 50,
          items: [
            {
              operationKey: "kafka send users.signedup",
              channel: "users.signedup",
              action: "send",
              operation: { state: "COVERED" },
              messageContract: { name: "UserSignedUp", selectionMode: "single", state: "COVERED" },
              suites: ["suite-a", "suite-b"]
            },
            {
              operationKey: "kafka receive users.deleted",
              channel: "users.deleted",
              action: "receive",
              operation: { state: "UNCOVERED" },
              messageContract: { name: "UserDeleted", selectionMode: "single", state: "UNCOVERED" },
              suites: []
            }
          ]
        },
        messages: {
          state: "PARTIAL",
          percent: 50,
          items: [
            {
              operationKey: "kafka receive users.deleted",
              channel: "users.deleted",
              action: "receive",
              message: "UserDeleted [payload: <anonymous-schema-2>]",
              state: "UNCOVERED",
              suites: []
            },
            {
              operationKey: "kafka send users.signedup",
              channel: "users.signedup",
              action: "send",
              message: "UserSignedUp [payload: <anonymous-schema-1>]",
              state: "COVERED",
              suites: ["suite-a", "suite-b"]
            }
          ]
        }
      },
      bindingSupport: {
        summary: {
          totalOperations: 0,
          totalBindings: 0,
          supportedBindings: 0,
          declaredOnlyBindings: 0,
          deferredBindings: 0,
          invalidBindings: 0
        },
        operations: []
      },
      declaredSemantics: {
        summary: {
          totalOperations: 0,
          operationsWithCorrelationId: 0,
          messageCorrelationIds: 0,
          operationsWithReply: 0
        },
        operations: []
      },
      runtimeSemantics: {
        summary: {
          totalOperations: 0,
          satisfiedOperations: 0,
          unsatisfiedOperations: 0,
          totalSemantics: 0,
          satisfiedSemantics: 0,
          unsatisfiedSemantics: 0,
          semanticCoveragePercent: null
        },
        operations: [],
        diagnostics: {
          counts: {
            missing: 0,
            unavailable: 0,
            unsupported: 0,
            mismatched: 0
          },
          items: []
        }
      },
      diagnostics: {
        counts: {
          "unsupported-content-type": 0,
          "unsupported-schema-format": 0,
          "missing-payload": 0,
          "invalid-payload": 0,
          "missing-header": 0,
          "unavailable-header": 0,
          "invalid-header": 0,
          "unverifiable-headers": 0,
          ambiguous: 0,
          unmatched: 0,
          mismatched: 0
        },
        items: []
      }
    };

    expect(report).toEqual(expected);
    expect((report as Record<string, unknown>).governance).toBeUndefined();
  });

  it("builds a truthful AMQP async report artifact and keeps Kafka-only additive sections empty", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/amqp-basic.fixture.jsonl");
    const coverage = computeAsyncCoverage(bundle, events.items);

    const report = buildAsyncReport(coverage, {
      toolVersion: "test",
      specSource: AMQP_BASIC_ASYNC_SPEC_SOURCE,
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number"),
      operationContractsByKey: bundle.operationContractsByKey
    });

    expect(report.protocols).toEqual(["amqp"]);
    expect(report.status).toBe("ok");
    expect(report.summary).toEqual({
      totalChannels: 1,
      coveredChannels: 1,
      channelCoveragePercent: 100,
      totalOperations: 1,
      coveredOperations: 1,
      operationCoveragePercent: 100,
      totalMessages: 1,
      coveredMessages: 1,
      messageCoveragePercent: 100
    });
    expect(report.coverage.operations.items).toEqual([
      {
        operationKey: "amqp send users.signedup",
        channel: "users.signedup",
        action: "send",
        operation: { state: "COVERED" },
        messageContract: {
          name: "UserSignedUp",
          selectionMode: "single",
          state: "COVERED"
        },
        suites: ["suite-amqp-basic"]
      }
    ]);
    expect(report.bindingSupport).toEqual({
      summary: {
        totalOperations: 0,
        totalBindings: 0,
        supportedBindings: 0,
        declaredOnlyBindings: 0,
        deferredBindings: 0,
        invalidBindings: 0
      },
      operations: []
    });
    expect(report.declaredSemantics).toEqual({
      summary: {
        totalOperations: 0,
        operationsWithCorrelationId: 0,
        messageCorrelationIds: 0,
        operationsWithReply: 0
      },
      operations: []
    });
    expect(report.runtimeSemantics).toEqual({
      summary: {
        totalOperations: 0,
        satisfiedOperations: 0,
        unsatisfiedOperations: 0,
        totalSemantics: 0,
        satisfiedSemantics: 0,
        unsatisfiedSemantics: 0,
        semanticCoveragePercent: null
      },
      operations: [],
      diagnostics: {
        counts: {
          missing: 0,
          unavailable: 0,
          unsupported: 0,
          mismatched: 0
        },
        items: []
      }
    });
    expect(report.diagnostics).toEqual({
      counts: {
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 0,
        mismatched: 0
      },
      items: []
    });
  });

  it("publishes declared correlationId and reply semantics additively without changing async coverage numerators", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/trait-declarations-inline-v3.yaml");
    const coverage = computeAsyncCoverage(bundle, []);

    const report = buildAsyncReport(coverage, {
      toolVersion: "test",
      specSource: {
        kind: "local-file",
        reference: "test/fixtures/asyncapi/trait-declarations-inline-v3.yaml"
      },
      operationContractsByKey: bundle.operationContractsByKey
    });

    expect(report.summary).toEqual({
      totalChannels: 1,
      coveredChannels: 0,
      channelCoveragePercent: 0,
      totalOperations: 1,
      coveredOperations: 0,
      operationCoveragePercent: 0,
      totalMessages: 1,
      coveredMessages: 0,
      messageCoveragePercent: 0
    });
    expect(report.coverage.operations.items).toEqual([
      {
        operationKey: "kafka send orders.command",
        channel: "orders.command",
        action: "send",
        operation: { state: "UNCOVERED" },
        messageContract: {
          name: "OrderCommand",
          selectionMode: "single",
          state: "UNCOVERED"
        },
        suites: []
      }
    ]);
    expect(report.declaredSemantics).toEqual({
      summary: {
        totalOperations: 1,
        operationsWithCorrelationId: 1,
        messageCorrelationIds: 1,
        operationsWithReply: 1
      },
      operations: [
        {
          operationKey: "kafka send orders.command",
          channel: "orders.command",
          action: "send",
          correlationIds: [
            {
              message: "OrderCommand",
              location: "$message.header#/correlation_id"
            }
          ],
          reply: {
            address: {
              location: "$message.header#/reply_to"
            }
          }
        }
      ]
    });
    expect(report.runtimeSemantics).toEqual({
      summary: {
        totalOperations: 1,
        satisfiedOperations: 0,
        unsatisfiedOperations: 1,
        totalSemantics: 2,
        satisfiedSemantics: 0,
        unsatisfiedSemantics: 2,
        semanticCoveragePercent: 0
      },
      operations: [
        {
          operationKey: "kafka send orders.command",
          channel: "orders.command",
          action: "send",
          state: "UNSATISFIED",
          correlationIds: [
            {
              message: expect.stringContaining("OrderCommand"),
              location: "$message.header#/correlation_id",
              state: "UNSATISFIED",
              header: "correlation_id",
              messageName: "OrderCommand",
              suites: []
            }
          ],
          reply: {
            address: {
              location: "$message.header#/reply_to",
              state: "UNSATISFIED",
              header: "reply_to",
              suites: []
            }
          }
        }
      ],
      diagnostics: {
        counts: {
          missing: 0,
          unavailable: 0,
          unsupported: 0,
          mismatched: 0
        },
        items: []
      }
    });
    expect(report.diagnostics.counts).toEqual({
      "unsupported-content-type": 0,
      "unsupported-schema-format": 0,
      "missing-payload": 0,
      "invalid-payload": 0,
      "missing-header": 0,
      "unavailable-header": 0,
      "invalid-header": 0,
      "unverifiable-headers": 0,
      ambiguous: 0,
      unmatched: 0,
      mismatched: 0
    });
  });

  it("publishes header-backed runtime semantics additively and keeps retained header values out of the artifact", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-inline-v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/header-runtime-failures.fixture.jsonl");
    const coverage = computeAsyncCoverage(bundle, events.items);

    const report = buildAsyncReport(coverage, {
      toolVersion: "test",
      specSource: {
        kind: "local-file",
        reference: "test/fixtures/asyncapi/header-runtime-inline-v3.yaml"
      },
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number"),
      operationContractsByKey: bundle.operationContractsByKey
    });

    expect(report.status).toBe("partial");
    expect(report.summary).toEqual({
      totalChannels: 1,
      coveredChannels: 1,
      channelCoveragePercent: 100,
      totalOperations: 1,
      coveredOperations: 1,
      operationCoveragePercent: 100,
      totalMessages: 1,
      coveredMessages: 1,
      messageCoveragePercent: 100
    });
    expect(report.diagnostics).toEqual({
      counts: {
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 0,
        mismatched: 0
      },
      items: []
    });
    expect(report.runtimeSemantics).toEqual({
      summary: {
        totalOperations: 1,
        satisfiedOperations: 0,
        unsatisfiedOperations: 1,
        totalSemantics: 2,
        satisfiedSemantics: 1,
        unsatisfiedSemantics: 1,
        semanticCoveragePercent: 50
      },
      operations: [
        {
          operationKey: "kafka send orders.command",
          channel: "orders.command",
          action: "send",
          state: "PARTIAL",
          correlationIds: [
            {
              message: expect.stringContaining("OrderCommand"),
              location: "$message.header#/correlation_id",
              state: "SATISFIED",
              header: "correlation_id",
              messageName: "OrderCommand",
              suites: ["suite-header-runtime-mismatch"]
            }
          ],
          reply: {
            address: {
              location: "$message.header#/reply_to",
              state: "UNSATISFIED",
              header: "reply_to",
              replyChannelAddress: "orders.reply",
              suites: []
            }
          }
        }
      ],
      diagnostics: {
        counts: {
          missing: 2,
          unavailable: 2,
          unsupported: 0,
          mismatched: 1
        },
        items: [
          {
            semantic: "correlationId",
            state: "missing",
            operationKey: "kafka send orders.command",
            channel: "orders.command",
            action: "send",
            location: "$message.header#/correlation_id",
            header: "correlation_id",
            messageName: "OrderCommand",
            reason:
              "Observed kafka evidence did not retain header 'correlation_id' required by declared correlationId location '$message.header#/correlation_id'.",
            message: "Observed kafka evidence is missing retained header evidence required to prove AsyncAPI correlationId"
          },
          {
            semantic: "correlationId",
            state: "unavailable",
            operationKey: "kafka send orders.command",
            channel: "orders.command",
            action: "send",
            location: "$message.header#/correlation_id",
            header: "correlation_id",
            messageName: "OrderCommand",
            reason:
              "Observed kafka header 'correlation_id' required by declared correlationId location '$message.header#/correlation_id' was unavailable because retained header evidence was redacted (sensitive).",
            message: "Observed kafka header value was unavailable for AsyncAPI correlationId runtime proof"
          },
          {
            semantic: "reply.address",
            state: "missing",
            operationKey: "kafka send orders.command",
            channel: "orders.command",
            action: "send",
            location: "$message.header#/reply_to",
            header: "reply_to",
            replyChannelAddress: "orders.reply",
            reason:
              "Observed kafka evidence did not retain header 'reply_to' required by declared reply.address location '$message.header#/reply_to'.",
            message: "Observed kafka evidence is missing retained header evidence required to prove AsyncAPI reply.address"
          },
          {
            semantic: "reply.address",
            state: "unavailable",
            operationKey: "kafka send orders.command",
            channel: "orders.command",
            action: "send",
            location: "$message.header#/reply_to",
            header: "reply_to",
            replyChannelAddress: "orders.reply",
            reason:
              "Observed kafka header 'reply_to' required by declared reply.address location '$message.header#/reply_to' was unavailable because retained header evidence was omitted (unsupported).",
            message: "Observed kafka header value was unavailable for AsyncAPI reply.address runtime proof"
          },
          {
            semantic: "reply.address",
            state: "mismatched",
            operationKey: "kafka send orders.command",
            channel: "orders.command",
            action: "send",
            location: "$message.header#/reply_to",
            header: "reply_to",
            replyChannelAddress: "orders.reply",
            reason: "Observed kafka header 'reply_to' did not match declared AsyncAPI reply channel address 'orders.reply'.",
            message: "Observed kafka reply.address header did not match the declared AsyncAPI reply channel address"
          }
        ]
      }
    });

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("corr-runtime-mismatch");
    expect(serialized).not.toContain("orders.deadletter");
  });

  it("reports schema-depth payload failures without changing routing coverage", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");
    const [invalidEvents, missingEvents] = await Promise.all([
      readAsyncEventsJsonl("test/fixtures/async-events/schema-invalid.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-missing-payload.fixture.jsonl")
    ]);
    const coverage = computeAsyncCoverage(bundle, [...invalidEvents.items, ...missingEvents.items]);

    const report = buildAsyncReport(coverage, {
      toolVersion: "test",
      specSource: SCHEMA_DEPTH_ASYNC_SPEC_SOURCE,
      eventTimestamps: [...invalidEvents.items, ...missingEvents.items]
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number")
    });

    expect(report.status).toBe("partial");
    expect(report.summary).toEqual({
      totalChannels: 1,
      coveredChannels: 1,
      channelCoveragePercent: 100,
      totalOperations: 1,
      coveredOperations: 1,
      operationCoveragePercent: 100,
      totalMessages: 1,
      coveredMessages: 1,
      messageCoveragePercent: 100
    });
    expect(report.diagnostics).toEqual({
      counts: {
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 1,
        "invalid-payload": 1,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 0,
        mismatched: 0
      },
      items: [
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
      ]
    });
  });

  it("reports typed header drift without regressing payload semantics", async () => {
    const missingBundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");
    const unavailableBundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");
    const invalidBundle = withHeaderPattern(
      await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      /^trace-[0-9]+$/
    );
    const [missingEvents, unavailableEvents, invalidEvents] = await Promise.all([
      readAsyncEventsJsonl("test/fixtures/async-events/schema-missing-header.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-unavailable-header.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-invalid-header.fixture.jsonl")
    ]);

    const coverage = computeAsyncCoverage(missingBundle, missingEvents.items);
    const unavailableCoverage = computeAsyncCoverage(unavailableBundle, unavailableEvents.items);
    const invalidCoverage = computeAsyncCoverage(invalidBundle, invalidEvents.items);

    expect(buildAsyncReport(coverage, { toolVersion: "test", specSource: SCHEMA_DEPTH_ASYNC_SPEC_SOURCE }).diagnostics).toEqual({
      counts: {
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 1,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 0,
        mismatched: 0
      },
      items: [
        {
          kind: "missing-header",
          validationKind: "headers",
          operationKey: OPERATION_KEY,
          channel: "orders.created",
          action: "send",
          messageName: "OrderCreatedEnvelope",
          schemaId: "OrderEventHeaders",
          pointer: "/traceId",
          reason: "Observed async evidence did not include required header 'traceId'.",
          message: "Observed async evidence is missing a required header for AsyncAPI header validation"
        }
      ]
    });

    expect(buildAsyncReport(unavailableCoverage, { toolVersion: "test", specSource: SCHEMA_DEPTH_ASYNC_SPEC_SOURCE }).diagnostics).toEqual({
      counts: {
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 0,
        "unavailable-header": 1,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 0,
        mismatched: 0
      },
      items: [
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

    expect(buildAsyncReport(invalidCoverage, { toolVersion: "test", specSource: SCHEMA_DEPTH_ASYNC_SPEC_SOURCE }).diagnostics).toEqual({
      counts: {
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 1,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 0,
        mismatched: 0
      },
      items: [
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
  });

  it("reports unsupported schema-material diagnostics as typed async artifact failures", async () => {
    const bundle = withMessageOverride(
      await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      (message) => ({
        ...message,
        contentType: "application/xml"
      })
    );
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-unsupported-format.fixture.jsonl");
    const coverage = computeAsyncCoverage(bundle, events.items);

    const report = buildAsyncReport(coverage, {
      toolVersion: "test",
      specSource: SCHEMA_DEPTH_ASYNC_SPEC_SOURCE,
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number")
    });

    expect(report.status).toBe("partial");
    expect(report.coverage.channels.state).toBe("COVERED");
    expect(report.coverage.operations.state).toBe("COVERED");
    expect(report.coverage.messages.state).toBe("COVERED");
    expect(report.diagnostics).toEqual({
      counts: {
        "unsupported-content-type": 1,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 0,
        mismatched: 0
      },
      items: [
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

  it("keeps mismatched and unmatched async drift explicit in the separate report surface", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/drift.fixture.jsonl");
    const coverage = computeAsyncCoverage(bundle, events.items);

    const report = buildAsyncReport(coverage, {
      toolVersion: "test",
      specSource: V3_ASYNC_SPEC_SOURCE,
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number")
    });

    expect(report.status).toBe("partial");
    expect(report.summary).toEqual({
      totalChannels: 2,
      coveredChannels: 2,
      channelCoveragePercent: 100,
      totalOperations: 2,
      coveredOperations: 2,
      operationCoveragePercent: 100,
      totalMessages: 2,
      coveredMessages: 1,
      messageCoveragePercent: 50
    });
    expect(report.diagnostics).toEqual({
      counts: {
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 1,
        mismatched: 1
      },
      items: [
        {
          kind: "mismatched",
          channel: "users.deleted",
          action: "receive",
          observedMessage: "LegacyUserDeleted",
          expectedMessage: "UserDeleted",
          reason: "Observed async message name did not match the declared AsyncAPI message contract.",
          message: "Observed async message contract did not match the canonical AsyncAPI message contract"
        },
        {
          kind: "unmatched",
          channel: "users.unknown",
          action: "send",
          observedMessage: "UserUnknown",
          message: "No canonical async operation matched the observed kafka evidence"
        }
      ]
    });
  });

  it("reports runtime-ambiguous multi-message evidence as a typed async diagnostic", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/multi-message-resolvable.yaml");
    const coverage = computeAsyncCoverage(bundle, [
      {
        kind: "kafka",
        action: "send",
        channel: "users.lifecycle",
        message: "UserLifecycleEvent",
        payload: { userId: "user-2" },
        testRunId: "run-2",
        testSuite: "suite-runtime-ambiguous"
      }
    ]);

    const report = buildAsyncReport(coverage, { toolVersion: "test", specSource: MULTI_MESSAGE_ASYNC_SPEC_SOURCE });

    expect(report.status).toBe("partial");
    expect(report.coverage.operations.items).toEqual([
      expect.objectContaining({
        operationKey: "kafka send users.lifecycle",
        messageContract: expect.objectContaining({
          selectionMode: "runtime",
          state: "UNCOVERED",
          selectedMessages: []
        })
      })
    ]);
    expect(report.diagnostics).toEqual({
      counts: {
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 1,
        unmatched: 0,
        mismatched: 0
      },
      items: [
        expect.objectContaining({
          kind: "ambiguous",
          operationKey: "kafka send users.lifecycle",
          channel: "users.lifecycle",
          action: "send",
          observedMessage: "UserLifecycleEvent",
          candidates: expect.arrayContaining([
            expect.stringContaining("selectors: yanote.event.kind=deleted"),
            expect.stringContaining("selectors: yanote.event.kind=signed-up")
          ])
        })
      ]
    });
  });
});

function withHeaderPattern(bundle: AsyncApiSemanticsBundle, pattern: RegExp): AsyncApiSemanticsBundle {
  return withMessageOverride(bundle, (message) => ({
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
