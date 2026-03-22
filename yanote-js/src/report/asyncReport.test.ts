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

describe("async report", () => {
  it("builds a deterministic async report artifact without reusing the HTTP coverage surface", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/partial.fixture.jsonl");
    const coverage = computeAsyncCoverage(bundle, events.items);

    const report = buildAsyncReport(coverage, {
      toolVersion: "test",
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number")
    });

    const expected: AsyncYanoteReport = {
      schemaVersion: ASYNC_REPORT_SCHEMA_VERSION,
      generatedAt: "1970-01-01T00:00:00.000Z",
      toolVersion: "test",
      phase: ASYNC_REPORT_PHASE,
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

  it("reports schema-depth payload failures without changing routing coverage", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");
    const [invalidEvents, missingEvents] = await Promise.all([
      readAsyncEventsJsonl("test/fixtures/async-events/schema-invalid.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-missing-payload.fixture.jsonl")
    ]);
    const coverage = computeAsyncCoverage(bundle, [...invalidEvents.items, ...missingEvents.items]);

    const report = buildAsyncReport(coverage, {
      toolVersion: "test",
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

    expect(buildAsyncReport(coverage, { toolVersion: "test" }).diagnostics).toEqual({
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
          reason: "Observed kafka evidence did not include required header 'traceId'.",
          message: "Observed kafka evidence is missing a required header for AsyncAPI header validation"
        }
      ]
    });

    expect(buildAsyncReport(unavailableCoverage, { toolVersion: "test" }).diagnostics).toEqual({
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
          reason: "Observed kafka header 'traceId' was retained as redacted evidence (reason: sensitive), so its value could not be validated.",
          message: "Observed kafka header value was unavailable for AsyncAPI header validation"
        }
      ]
    });

    expect(buildAsyncReport(invalidCoverage, { toolVersion: "test" }).diagnostics).toEqual({
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
          message: "Observed kafka headers did not conform to the retained AsyncAPI header schema"
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

    const report = buildAsyncReport(coverage, { toolVersion: "test" });

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
