import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
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
              messageContract: { name: "UserSignedUp", state: "COVERED" },
              suites: ["suite-a", "suite-b"]
            },
            {
              operationKey: "kafka receive users.deleted",
              channel: "users.deleted",
              action: "receive",
              operation: { state: "UNCOVERED" },
              messageContract: { name: "UserDeleted", state: "UNCOVERED" },
              suites: []
            }
          ]
        },
        messages: {
          state: "PARTIAL",
          percent: 50,
          items: [
            {
              operationKey: "kafka send users.signedup",
              channel: "users.signedup",
              action: "send",
              message: "UserSignedUp",
              state: "COVERED",
              suites: ["suite-a", "suite-b"]
            },
            {
              operationKey: "kafka receive users.deleted",
              channel: "users.deleted",
              action: "receive",
              message: "UserDeleted",
              state: "UNCOVERED",
              suites: []
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
          "unverifiable-headers": 0,
          unmatched: 0,
          mismatched: 0
        },
        items: []
      }
    };

    expect(report).toEqual(expected);
    expect((report as Record<string, unknown>).governance).toBeUndefined();
  });

  it("reports schema-depth payload failures and header capability gaps without changing routing coverage", async () => {
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
        "unverifiable-headers": 1,
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
        "unverifiable-headers": 1,
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
        "unverifiable-headers": 0,
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
});

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
