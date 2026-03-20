import { describe, expect, it } from "vitest";
import { validateReport } from "./schema.js";
import {
  ASYNC_REPORT_PHASE,
  ASYNC_REPORT_SCHEMA_VERSION,
  normalizeAsyncReport,
  roundCoverage,
  type AsyncYanoteReport,
  validateAsyncReport
} from "./asyncReport.js";

const baseReport: AsyncYanoteReport = {
  schemaVersion: ASYNC_REPORT_SCHEMA_VERSION,
  generatedAt: "1970-01-01T00:00:00.000Z",
  toolVersion: "test",
  phase: ASYNC_REPORT_PHASE,
  status: "ok",
  summary: {
    totalChannels: 1,
    coveredChannels: 1,
    channelCoveragePercent: 100,
    totalOperations: 1,
    coveredOperations: 1,
    operationCoveragePercent: 100,
    totalMessages: 1,
    coveredMessages: 1,
    messageCoveragePercent: 100
  },
  coverage: {
    channels: {
      state: "COVERED",
      percent: 100,
      items: [
        {
          channel: "users.signedup",
          state: "COVERED",
          coveredActions: ["send"],
          missingActions: []
        }
      ]
    },
    operations: {
      state: "COVERED",
      percent: 100,
      items: [
        {
          operationKey: "kafka send users.signedup",
          channel: "users.signedup",
          action: "send",
          operation: { state: "COVERED" },
          messageContract: { name: "UserSignedUp", state: "COVERED" },
          suites: ["suite-a"]
        }
      ]
    },
    messages: {
      state: "COVERED",
      percent: 100,
      items: [
        {
          operationKey: "kafka send users.signedup",
          channel: "users.signedup",
          action: "send",
          message: "UserSignedUp",
          state: "COVERED",
          suites: ["suite-a"]
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

describe("async report schema contract", () => {
  it("requires the async v1 contract and stays separate from the HTTP report surface", () => {
    const valid = validateAsyncReport(baseReport);
    expect(valid.ok).toBe(true);

    const httpShape = validateReport(baseReport);
    expect(httpShape.ok).toBe(false);

    const withUnknown = {
      ...baseReport,
      governance: {}
    } as any;

    expect(validateAsyncReport(withUnknown).ok).toBe(false);
  });

  it("validates schemaVersion independently from toolVersion and requires the widened diagnostic union", () => {
    const wrongSchema = {
      ...baseReport,
      schemaVersion: "999.0.0",
      toolVersion: "0.1.0"
    };

    expect(validateAsyncReport(wrongSchema).ok).toBe(false);
    expect(
      validateAsyncReport({
        ...baseReport,
        schemaVersion: ASYNC_REPORT_SCHEMA_VERSION,
        toolVersion: "2.0.0"
      }).ok
    ).toBe(true);

    const missingCount = {
      ...baseReport,
      diagnostics: {
        ...baseReport.diagnostics,
        counts: {
          "unsupported-content-type": 0,
          "unsupported-schema-format": 0,
          "missing-payload": 0,
          "invalid-payload": 0,
          unmatched: 0,
          mismatched: 0
        }
      }
    } as any;

    expect(validateAsyncReport(missingCount).ok).toBe(false);

    const invalidSchemaDiagnostic = {
      ...baseReport,
      status: "partial",
      diagnostics: {
        counts: {
          "unsupported-content-type": 0,
          "unsupported-schema-format": 0,
          "missing-payload": 1,
          "invalid-payload": 0,
          "unverifiable-headers": 0,
          unmatched: 0,
          mismatched: 0
        },
        items: [
          {
            kind: "missing-payload",
            validationKind: "payload",
            operationKey: "kafka send orders.created",
            channel: "orders.created",
            action: "send",
            schemaId: "OrderCreatedPayload",
            pointer: "/",
            message: "Observed kafka evidence is missing the payload required for AsyncAPI schema validation"
          }
        ]
      }
    } as any;

    expect(validateAsyncReport(invalidSchemaDiagnostic).ok).toBe(false);

    const validSchemaDiagnostic = {
      ...baseReport,
      status: "partial",
      diagnostics: {
        counts: {
          "unsupported-content-type": 0,
          "unsupported-schema-format": 0,
          "missing-payload": 1,
          "invalid-payload": 0,
          "unverifiable-headers": 0,
          unmatched: 0,
          mismatched: 0
        },
        items: [
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
          }
        ]
      }
    } satisfies AsyncYanoteReport;

    expect(validateAsyncReport(validSchemaDiagnostic).ok).toBe(true);
  });

  it("normalizes ordering and rounds async coverage values deterministically", () => {
    const normalized = normalizeAsyncReport({
      ...baseReport,
      status: "partial",
      summary: {
        totalChannels: 2,
        coveredChannels: 1,
        channelCoveragePercent: 50.0001,
        totalOperations: 2,
        coveredOperations: 1,
        operationCoveragePercent: 50.5555,
        totalMessages: 2,
        coveredMessages: 1,
        messageCoveragePercent: 50.4444
      },
      coverage: {
        channels: {
          state: "PARTIAL",
          percent: 50.0001,
          items: [
            {
              channel: "users.signedup",
              state: "COVERED",
              coveredActions: ["receive", "send"],
              missingActions: []
            },
            {
              channel: "users.deleted",
              state: "UNCOVERED",
              coveredActions: [],
              missingActions: ["receive", "send"]
            }
          ]
        },
        operations: {
          state: "PARTIAL",
          percent: 50.5555,
          items: [
            {
              operationKey: "kafka send users.signedup",
              channel: "users.signedup",
              action: "send",
              operation: { state: "COVERED" },
              messageContract: { name: "UserSignedUp", state: "COVERED" },
              suites: ["suite-b", "suite-a"]
            },
            {
              operationKey: "kafka receive users.deleted",
              channel: "users.deleted",
              action: "receive",
              operation: { state: "UNCOVERED" },
              messageContract: { name: "UserDeleted", state: "UNCOVERED" },
              suites: ["suite-c"]
            }
          ]
        },
        messages: {
          state: "PARTIAL",
          percent: 50.4444,
          items: [
            {
              operationKey: "kafka send users.signedup",
              channel: "users.signedup",
              action: "send",
              message: "UserSignedUp",
              state: "COVERED",
              suites: ["suite-b", "suite-a"]
            },
            {
              operationKey: "kafka receive users.deleted",
              channel: "users.deleted",
              action: "receive",
              message: "UserDeleted",
              state: "UNCOVERED",
              suites: ["suite-c"]
            }
          ]
        }
      },
      diagnostics: {
        counts: {
          "unsupported-content-type": 1,
          "unsupported-schema-format": 0,
          "missing-payload": 1,
          "invalid-payload": 0,
          "unverifiable-headers": 0,
          unmatched: 1,
          mismatched: 1
        },
        items: [
          {
            kind: "unmatched",
            channel: "users.unknown",
            action: "send",
            observedMessage: "UserUnknown",
            message: "No canonical async operation matched the observed kafka evidence"
          },
          {
            kind: "mismatched",
            channel: "users.deleted",
            action: "receive",
            observedMessage: "LegacyUserDeleted",
            expectedMessage: "UserDeleted",
            message: "Observed async message contract did not match the canonical AsyncAPI message contract"
          },
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
            kind: "unsupported-content-type",
            validationKind: "contentType",
            operationKey: "kafka send orders.created",
            channel: "orders.created",
            action: "send",
            messageName: "OrderCreatedEnvelope",
            schemaId: "OrderCreatedPayload",
            reason: "Unsupported AsyncAPI payload content type: application/xml.",
            message: "Retained AsyncAPI payload content type is outside the current schema-validation scope"
          }
        ]
      }
    });

    expect(normalized.summary.channelCoveragePercent).toBe(roundCoverage(50.0001));
    expect(normalized.summary.operationCoveragePercent).toBe(roundCoverage(50.5555));
    expect(normalized.summary.messageCoveragePercent).toBe(roundCoverage(50.4444));
    expect(normalized.coverage.channels.items.map((entry) => entry.channel)).toEqual(["users.deleted", "users.signedup"]);
    expect(normalized.coverage.channels.items[0].missingActions).toEqual(["send", "receive"]);
    expect(normalized.coverage.operations.items.map((entry) => entry.operationKey)).toEqual([
      "kafka receive users.deleted",
      "kafka send users.signedup"
    ]);
    expect(normalized.coverage.operations.items[1].suites).toEqual(["suite-a", "suite-b"]);
    expect(normalized.coverage.messages.items.map((entry) => entry.operationKey)).toEqual([
      "kafka receive users.deleted",
      "kafka send users.signedup"
    ]);
    expect(normalized.diagnostics.counts).toEqual({
      "unsupported-content-type": 1,
      "unsupported-schema-format": 0,
      "missing-payload": 1,
      "invalid-payload": 0,
      "unverifiable-headers": 0,
      mismatched: 1,
      unmatched: 1
    });
    expect(normalized.diagnostics.items.map((entry) => entry.kind)).toEqual([
      "unsupported-content-type",
      "missing-payload",
      "mismatched",
      "unmatched"
    ]);
  });
});
