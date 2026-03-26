import { describe, expect, it } from "vitest";
import type { AsyncEvent } from "../model/asyncEvent.js";
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
              selectionMode: "single",
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
              selectionMode: "single",
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
      },
      runtimeSemantics: {
        summary: { total: 0, satisfied: 0, percent: null },
        items: [],
        diagnostics: []
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
              selectionMode: "single",
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
              selectionMode: "single",
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
            suites: ["suite-a"]
          }
        ]
      },
      runtimeSemantics: {
        summary: { total: 0, satisfied: 0, percent: null },
        items: [],
        diagnostics: []
      },
      diagnostics: [
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
              selectionMode: "single",
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
            message: "OrderCreatedEnvelope [payload: OrderCreatedPayload; headers: OrderEventHeaders]",
            state: "COVERED",
            suites: ["suite-schema-invalid", "suite-schema-missing"]
          }
        ]
      },
      runtimeSemantics: {
        summary: { total: 0, satisfied: 0, percent: null },
        items: [],
        diagnostics: []
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
        }
      ]
    });
  });

  it("adds truthful runtime semantics additively without changing legacy coverage numerators", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/header-runtime-inline-v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/header-runtime-covered.fixture.jsonl");

    const coverage = computeAsyncCoverage(bundle, events.items);

    expect(coverage.channels.summary).toEqual({ total: 1, covered: 1, percent: 100 });
    expect(coverage.operations.summary).toEqual({ total: 1, covered: 1, percent: 100 });
    expect(coverage.messages.summary).toEqual({ total: 1, covered: 1, percent: 100 });
    expect(coverage.diagnostics).toEqual([]);
    expect(coverage.runtimeSemantics).toEqual({
      summary: { total: 2, satisfied: 2, percent: 100 },
      items: [
        {
          operationKey: "kafka send orders.command",
          channel: "orders.command",
          action: "send",
          semantic: "correlationId",
          state: "SATISFIED",
          location: "$message.header#/correlation_id",
          header: "correlation_id",
          messageName: "OrderCommand",
          message: expect.stringContaining("OrderCommand"),
          suites: ["suite-header-runtime-covered"]
        },
        {
          operationKey: "kafka send orders.command",
          channel: "orders.command",
          action: "send",
          semantic: "reply.address",
          state: "SATISFIED",
          location: "$message.header#/reply_to",
          header: "reply_to",
          replyChannelAddress: "orders.reply",
          suites: ["suite-header-runtime-covered"]
        }
      ],
      diagnostics: []
    });
  });

  it("resolves runtime-selected multi-message contracts and fails closed when evidence stays ambiguous", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/multi-message-resolvable.yaml");
    const selectedEvent: AsyncEvent = {
      kind: "kafka",
      action: "send",
      channel: "users.lifecycle",
      message: "UserLifecycleEvent",
      payload: {
        userId: "user-1",
        deletedAt: "2026-03-22T00:00:00.000Z"
      },
      headers: {
        "yanote.event.kind": { state: "captured", value: "deleted" },
        traceId: { state: "captured", value: "trace-1" }
      },
      testRunId: "run-1",
      testSuite: "suite-runtime-selected"
    };
    const ambiguousEvent: AsyncEvent = {
      kind: "kafka",
      action: "send",
      channel: "users.lifecycle",
      message: "UserLifecycleEvent",
      payload: {
        userId: "user-2"
      },
      testRunId: "run-2",
      testSuite: "suite-runtime-ambiguous"
    };

    const selectedCoverage = computeAsyncCoverage(bundle, [selectedEvent]);
    expect(selectedCoverage.operations.items).toHaveLength(1);
    expect(selectedCoverage.operations.items[0]).toMatchObject({
      operationKey: "kafka send users.lifecycle",
      operation: { state: "COVERED" },
      messageContract: {
        selectionMode: "runtime",
        state: "PARTIAL",
        declaredMessages: expect.arrayContaining([
          expect.stringContaining("selectors: yanote.event.kind=deleted"),
          expect.stringContaining("selectors: yanote.event.kind=signed-up")
        ]),
        selectedMessages: [expect.stringContaining("selectors: yanote.event.kind=deleted")]
      }
    });
    expect(selectedCoverage.messages.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operationKey: "kafka send users.lifecycle",
          state: "COVERED",
          message: expect.stringContaining("selectors: yanote.event.kind=deleted")
        }),
        expect.objectContaining({
          operationKey: "kafka send users.lifecycle",
          state: "UNCOVERED",
          message: expect.stringContaining("selectors: yanote.event.kind=signed-up")
        })
      ])
    );
    expect(selectedCoverage.runtimeSemantics.summary).toEqual({ total: 0, satisfied: 0, percent: null });
    expect(selectedCoverage.runtimeSemantics.items).toEqual([]);
    expect(selectedCoverage.runtimeSemantics.diagnostics).toEqual([]);
    expect(selectedCoverage.diagnostics).toEqual([]);

    const ambiguousCoverage = computeAsyncCoverage(bundle, [ambiguousEvent]);
    expect(ambiguousCoverage.operations.items[0]).toMatchObject({
      operationKey: "kafka send users.lifecycle",
      operation: { state: "COVERED" },
      messageContract: {
        selectionMode: "runtime",
        state: "UNCOVERED",
        selectedMessages: []
      }
    });
    expect(ambiguousCoverage.messages.items.every((entry) => entry.state === "UNCOVERED")).toBe(true);
    expect(ambiguousCoverage.runtimeSemantics.summary).toEqual({ total: 0, satisfied: 0, percent: null });
    expect(ambiguousCoverage.runtimeSemantics.items).toEqual([]);
    expect(ambiguousCoverage.runtimeSemantics.diagnostics).toEqual([]);
    expect(ambiguousCoverage.diagnostics).toEqual([
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
    ]);
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
    runtimeSemantics: {
      summary: coverage.runtimeSemantics.summary,
      items: coverage.runtimeSemantics.items.map((entry) => ({ ...entry, suites: [...entry.suites] })),
      diagnostics: coverage.runtimeSemantics.diagnostics
    },
    diagnostics: coverage.diagnostics
  };
}
