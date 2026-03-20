import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import { loadAsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncCoverage } from "./asyncCoverage.js";

describe("computeAsyncCoverage contract", () => {
  it("keeps channel, operation, and message-contract coverage as separate deterministic surfaces", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/partial.fixture.jsonl");

    const coverage = computeAsyncCoverage(bundle, events.items);

    expect(snapshotCoverage(coverage)).toEqual({
      channels: {
        summary: { total: 2, covered: 1, percent: 50 },
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
        summary: { total: 2, covered: 1, percent: 50 },
        items: [
          {
            operationKey: "kafka send users.signedup",
            channel: "users.signedup",
            action: "send",
            state: "COVERED",
            messageContract: {
              name: "UserSignedUp",
              state: "COVERED"
            },
            suites: ["suite-a", "suite-b"]
          },
          {
            operationKey: "kafka receive users.deleted",
            channel: "users.deleted",
            action: "receive",
            state: "UNCOVERED",
            messageContract: {
              name: "UserDeleted",
              state: "UNCOVERED"
            },
            suites: []
          }
        ]
      },
      messages: {
        summary: { total: 2, covered: 1, percent: 50 },
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
      },
      diagnostics: []
    });
  });

  it("treats unmatched and mismatched async evidence as explicit drift instead of synthetic coverage", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/drift.fixture.jsonl");

    const coverage = computeAsyncCoverage(bundle, events.items);

    expect(snapshotCoverage(coverage)).toEqual({
      channels: {
        summary: { total: 2, covered: 2, percent: 100 },
        items: [
          {
            channel: "users.signedup",
            state: "COVERED",
            coveredActions: ["send"],
            missingActions: []
          },
          {
            channel: "users.deleted",
            state: "COVERED",
            coveredActions: ["receive"],
            missingActions: []
          }
        ]
      },
      operations: {
        summary: { total: 2, covered: 2, percent: 100 },
        items: [
          {
            operationKey: "kafka send users.signedup",
            channel: "users.signedup",
            action: "send",
            state: "COVERED",
            messageContract: {
              name: "UserSignedUp",
              state: "COVERED"
            },
            suites: ["suite-a"]
          },
          {
            operationKey: "kafka receive users.deleted",
            channel: "users.deleted",
            action: "receive",
            state: "COVERED",
            messageContract: {
              name: "UserDeleted",
              state: "UNCOVERED"
            },
            suites: ["suite-a"]
          }
        ]
      },
      messages: {
        summary: { total: 2, covered: 1, percent: 50 },
        items: [
          {
            operationKey: "kafka send users.signedup",
            channel: "users.signedup",
            action: "send",
            message: "UserSignedUp",
            state: "COVERED",
            suites: ["suite-a"]
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
      },
      diagnostics: [
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

  it("surfaces schema-depth diagnostics publicly while keeping routing-first coverage numerators unchanged", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");
    const [invalidEvents, missingPayloadEvents] = await Promise.all([
      readAsyncEventsJsonl("test/fixtures/async-events/schema-invalid.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-missing-payload.fixture.jsonl")
    ]);

    const coverage = computeAsyncCoverage(bundle, [...invalidEvents.items, ...missingPayloadEvents.items]);

    expect(snapshotCoverage(coverage)).toEqual({
      channels: {
        summary: { total: 1, covered: 1, percent: 100 },
        items: [
          {
            channel: "orders.created",
            state: "COVERED",
            coveredActions: ["send"],
            missingActions: []
          }
        ]
      },
      operations: {
        summary: { total: 1, covered: 1, percent: 100 },
        items: [
          {
            operationKey: "kafka send orders.created",
            channel: "orders.created",
            action: "send",
            state: "COVERED",
            messageContract: {
              name: "OrderCreatedEnvelope",
              state: "COVERED"
            },
            suites: ["suite-schema-invalid", "suite-schema-missing"]
          }
        ]
      },
      messages: {
        summary: { total: 1, covered: 1, percent: 100 },
        items: [
          {
            operationKey: "kafka send orders.created",
            channel: "orders.created",
            action: "send",
            message: "OrderCreatedEnvelope",
            state: "COVERED",
            suites: ["suite-schema-invalid", "suite-schema-missing"]
          }
        ]
      },
      diagnostics: [
        {
          kind: "missing-payload",
          validationKind: "payload",
          operationKey: "kafka send orders.created",
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
          operationKey: "kafka send orders.created",
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
          operationKey: "kafka send orders.created",
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

function snapshotCoverage(coverage: ReturnType<typeof computeAsyncCoverage>) {
  return {
    channels: {
      summary: coverage.channels.summary,
      items: coverage.channels.items.map((entry) => ({
        channel: entry.channel,
        state: entry.state,
        coveredActions: [...entry.coveredActions],
        missingActions: [...entry.missingActions]
      }))
    },
    operations: {
      summary: coverage.operations.summary,
      items: coverage.operations.items.map((entry) => ({
        operationKey: entry.operationKey,
        channel: entry.channel,
        action: entry.action,
        state: entry.operation.state,
        messageContract: entry.messageContract,
        suites: [...entry.suites]
      }))
    },
    messages: {
      summary: coverage.messages.summary,
      items: coverage.messages.items.map((entry) => ({
        operationKey: entry.operationKey,
        channel: entry.channel,
        action: entry.action,
        message: entry.message,
        state: entry.state,
        suites: [...entry.suites]
      }))
    },
    diagnostics: coverage.diagnostics
  };
}
