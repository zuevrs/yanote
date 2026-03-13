import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import { loadAsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncCoverage } from "../coverage/asyncCoverage.js";
import {
  ASYNC_REPORT_PHASE,
  ASYNC_REPORT_SCHEMA_VERSION,
  buildAsyncReport,
  type AsyncYanoteReport
} from "./asyncReport.js";

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
          unmatched: 0,
          mismatched: 0
        },
        items: []
      }
    };

    expect(report).toEqual(expected);
    expect((report as Record<string, unknown>).governance).toBeUndefined();
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
    expect(report.coverage.channels).toEqual({
      state: "COVERED",
      percent: 100,
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
    });
    expect(report.coverage.operations).toEqual({
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
        },
        {
          operationKey: "kafka receive users.deleted",
          channel: "users.deleted",
          action: "receive",
          operation: { state: "COVERED" },
          messageContract: { name: "UserDeleted", state: "UNCOVERED" },
          suites: ["suite-a"]
        }
      ]
    });
    expect(report.coverage.messages).toEqual({
      state: "PARTIAL",
      percent: 50,
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
    });
    expect(report.diagnostics).toEqual({
      counts: {
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
