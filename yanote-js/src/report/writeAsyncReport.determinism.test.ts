import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ASYNC_REPORT_PHASE,
  ASYNC_REPORT_SCHEMA_VERSION,
  type AsyncYanoteReport
} from "./asyncReport.js";
import { writeAsyncYanoteReport } from "./writeAsyncReport.js";

function makeReport(): AsyncYanoteReport {
  return {
    schemaVersion: ASYNC_REPORT_SCHEMA_VERSION,
    generatedAt: "1970-01-01T00:00:00.000Z",
    toolVersion: "test",
    specSource: {
      kind: "local-file",
      reference: "test/fixtures/asyncapi/determinism.yaml"
    },
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
      totalMessages: 3,
      coveredMessages: 2,
      messageCoveragePercent: 66.67
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
            messageContract: {
              name: "UserSignedUp",
              selectionMode: "single",
              state: "COVERED",
              declaredMessages: ["UserSignedUp"],
              selectedMessages: ["UserSignedUp"]
            },
            suites: ["suite-b", "suite-a"]
          },
          {
            operationKey: "kafka receive users.deleted",
            channel: "users.deleted",
            action: "receive",
            operation: { state: "UNCOVERED" },
            messageContract: {
              name: "UserDeleted",
              selectionMode: "runtime",
              state: "PARTIAL",
              declaredMessages: ["LegacyUserDeleted", "UserDeleted"],
              selectedMessages: ["UserDeleted"]
            },
            suites: []
          }
        ]
      },
      messages: {
        state: "PARTIAL",
        percent: 66.67,
        items: [
          {
            operationKey: "kafka send users.signedup",
            channel: "users.signedup",
            action: "send",
            message: "UserSignedUp [payload: <anonymous-schema-1>]",
            state: "COVERED",
            suites: ["suite-b", "suite-a"]
          },
          {
            operationKey: "kafka receive users.deleted",
            channel: "users.deleted",
            action: "receive",
            message: "LegacyUserDeleted",
            state: "UNCOVERED",
            suites: []
          },
          {
            operationKey: "kafka receive users.deleted",
            channel: "users.deleted",
            action: "receive",
            message: "UserDeleted",
            state: "COVERED",
            suites: ["suite-c"]
          }
        ]
      }
    },
    bindingSupport: {
      summary: {
        totalOperations: 2,
        totalBindings: 4,
        supportedBindings: 1,
        declaredOnlyBindings: 1,
        deferredBindings: 2,
        invalidBindings: 0
      },
      operations: [
        {
          operationKey: "kafka send users.signedup",
          channel: "users.signedup",
          action: "send",
          bindings: [
            {
              scope: "channel",
              field: "topic",
              status: "supported",
              source: "channel.bindings.kafka.topic",
              value: "users.signups"
            },
            {
              scope: "operation",
              field: "groupId",
              status: "declared-only",
              source: "operation.bindings.kafka.groupId"
            }
          ]
        },
        {
          operationKey: "kafka receive users.deleted",
          channel: "users.deleted",
          action: "receive",
          bindings: [
            {
              scope: "channel",
              field: "replicas",
              status: "deferred",
              source: "channel.bindings.kafka.replicas"
            },
            {
              scope: "message",
              messageName: "UserDeleted",
              field: "schemaLookupStrategy",
              status: "deferred",
              source: "message.bindings.kafka.schemaLookupStrategy"
            }
          ]
        }
      ]
    },
    declaredSemantics: {
      summary: {
        totalOperations: 2,
        operationsWithCorrelationId: 2,
        messageCorrelationIds: 3,
        operationsWithReply: 1
      },
      operations: [
        {
          operationKey: "kafka send users.signedup",
          channel: "users.signedup",
          action: "send",
          correlationIds: [
            {
              message: "UserSignedUp",
              location: "$message.header#/correlation_id"
            }
          ]
        },
        {
          operationKey: "kafka receive users.deleted",
          channel: "users.deleted",
          action: "receive",
          correlationIds: [
            {
              message: "UserDeleted",
              location: "$message.header#/correlation_id"
            },
            {
              message: "LegacyUserDeleted",
              location: "$message.header#/legacy_correlation_id"
            }
          ],
          reply: {
            address: {
              location: "$message.header#/reply_to"
            }
          }
        }
      ]
    },
    runtimeSemantics: {
      summary: {
        totalOperations: 2,
        satisfiedOperations: 1,
        unsatisfiedOperations: 1,
        totalSemantics: 3,
        satisfiedSemantics: 2,
        unsatisfiedSemantics: 1,
        semanticCoveragePercent: 66.67
      },
      operations: [
        {
          operationKey: "kafka send users.signedup",
          channel: "users.signedup",
          action: "send",
          state: "SATISFIED",
          correlationIds: [
            {
              message: "UserSignedUp",
              location: "$message.header#/correlation_id",
              state: "SATISFIED",
              suites: ["suite-b", "suite-a"],
              header: "correlation_id",
              messageName: "UserSignedUp"
            }
          ]
        },
        {
          operationKey: "kafka receive users.deleted",
          channel: "users.deleted",
          action: "receive",
          state: "UNSATISFIED",
          correlationIds: [
            {
              message: "LegacyUserDeleted",
              location: "$message.header#/legacy_correlation_id",
              state: "UNSATISFIED",
              suites: [],
              header: "legacy_correlation_id",
              messageName: "LegacyUserDeleted"
            },
            {
              message: "UserDeleted",
              location: "$message.header#/correlation_id",
              state: "SATISFIED",
              suites: ["suite-c"],
              header: "correlation_id",
              messageName: "UserDeleted"
            }
          ],
          reply: {
            address: {
              location: "$message.header#/reply_to",
              state: "UNSATISFIED",
              suites: [],
              header: "reply_to",
              replyChannelAddress: "users.reply"
            }
          }
        }
      ],
      diagnostics: {
        counts: {
          missing: 1,
          unavailable: 0,
          unsupported: 0,
          mismatched: 1
        },
        items: [
          {
            semantic: "reply.address",
            state: "mismatched",
            operationKey: "kafka receive users.deleted",
            channel: "users.deleted",
            action: "receive",
            location: "$message.header#/reply_to",
            header: "reply_to",
            replyChannelAddress: "users.reply",
            reason: "Observed kafka header 'reply_to' did not match declared AsyncAPI reply channel address 'users.reply'.",
            message: "Observed kafka reply.address header did not match the declared AsyncAPI reply channel address"
          },
          {
            semantic: "correlationId",
            state: "missing",
            operationKey: "kafka send users.signedup",
            channel: "users.signedup",
            action: "send",
            location: "$message.header#/correlation_id",
            header: "correlation_id",
            messageName: "UserSignedUp",
            reason:
              "Observed kafka evidence did not retain header 'correlation_id' required by declared correlationId location '$message.header#/correlation_id'.",
            message: "Observed kafka evidence is missing retained header evidence required to prove AsyncAPI correlationId"
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
        "missing-header": 1,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        mismatched: 1,
        unmatched: 0
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
          kind: "missing-header",
          validationKind: "headers",
          operationKey: "kafka send orders.created",
          channel: "orders.created",
          action: "send",
          messageName: "OrderCreatedEnvelope",
          schemaId: "OrderEventHeaders",
          pointer: "/traceId",
          reason: "Observed kafka evidence did not include required header 'traceId'.",
          message: "Observed kafka evidence is missing a required header for AsyncAPI header validation"
        }
      ]
    }
  };
}

describe("writeAsyncYanoteReport determinism", () => {
  it("fails fast with actionable schema validation error", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-report-"));
    try {
      const invalid = {
        ...makeReport(),
        schemaVersion: "bad"
      } as AsyncYanoteReport;

      await expect(writeAsyncYanoteReport(dir, invalid)).rejects.toThrow(/Invalid async report schema/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("writes byte-equivalent JSON and HTML for equivalent async report DTOs", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-report-"));
    try {
      const report = makeReport();
      const firstPath = await writeAsyncYanoteReport(dir, report);
      const firstBytes = await readFile(firstPath, "utf8");
      const firstHtmlBytes = await readFile(path.join(dir, "yanote-async-report.html"), "utf8");

      const secondPath = await writeAsyncYanoteReport(dir, {
        ...report,
        coverage: {
          channels: {
            ...report.coverage.channels,
            items: [...report.coverage.channels.items].reverse()
          },
          operations: {
            ...report.coverage.operations,
            items: [...report.coverage.operations.items]
              .map((entry) => ({
                ...entry,
                messageContract: {
                  ...entry.messageContract,
                  declaredMessages: entry.messageContract.declaredMessages
                    ? [...entry.messageContract.declaredMessages].reverse()
                    : undefined,
                  selectedMessages: entry.messageContract.selectedMessages
                    ? [...entry.messageContract.selectedMessages].reverse()
                    : undefined
                },
                suites: [...entry.suites].reverse()
              }))
              .reverse()
          },
          messages: {
            ...report.coverage.messages,
            items: [...report.coverage.messages.items]
              .map((entry) => ({
                ...entry,
                suites: [...entry.suites].reverse()
              }))
              .reverse()
          }
        },
        bindingSupport: {
          ...report.bindingSupport,
          operations: [...report.bindingSupport.operations]
            .map((entry) => ({
              ...entry,
              bindings: [...entry.bindings].reverse()
            }))
            .reverse()
        },
        declaredSemantics: {
          ...report.declaredSemantics,
          operations: [...report.declaredSemantics.operations]
            .map((entry) => ({
              ...entry,
              correlationIds: [...entry.correlationIds].reverse()
            }))
            .reverse()
        },
        runtimeSemantics: {
          ...report.runtimeSemantics,
          operations: [...report.runtimeSemantics.operations]
            .map((entry) => ({
              ...entry,
              correlationIds: [...entry.correlationIds]
                .map((correlationId) => ({
                  ...correlationId,
                  suites: [...correlationId.suites].reverse()
                }))
                .reverse(),
              reply: entry.reply
                ? {
                    address: {
                      ...entry.reply.address,
                      suites: [...entry.reply.address.suites].reverse()
                    }
                  }
                : undefined
            }))
            .reverse(),
          diagnostics: {
            ...report.runtimeSemantics.diagnostics,
            items: [...report.runtimeSemantics.diagnostics.items].reverse()
          }
        },
        diagnostics: {
          ...report.diagnostics,
          items: [...report.diagnostics.items].reverse()
        }
      });
      const secondBytes = await readFile(secondPath, "utf8");
      const secondHtmlBytes = await readFile(path.join(dir, "yanote-async-report.html"), "utf8");

      expect(firstBytes).toBe(secondBytes);
      expect(firstHtmlBytes).toBe(secondHtmlBytes);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("writes a self-contained sibling HTML artifact with explicit provenance and async-only sections", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-report-"));
    try {
      const report = makeReport();
      report.specSource.reference = 'test/fixtures/<unsafe>&"async".yaml';
      report.diagnostics.items[0] = {
        ...report.diagnostics.items[0],
        message: 'Observed <unsafe> async message & contract drift.'
      };

      const outPath = await writeAsyncYanoteReport(dir, report);
      const htmlPath = path.join(dir, "yanote-async-report.html");
      const html = await readFile(htmlPath, "utf8");

      expect(outPath).toBe(path.join(dir, "yanote-async-report.json"));
      expect(html).toContain("<!doctype html>");
      expect(html).toContain("Skip to main content");
      expect(html).toContain("Provenance");
      expect(html).toContain("Protocols");
      expect(html).toContain("kafka");
      expect(html).toContain("Declared semantics");
      expect(html).toContain("Runtime semantics");
      expect(html).toContain("Runtime semantic diagnostics");
      expect(html).toContain("$message.header#/correlation_id");
      expect(html).toContain("$message.header#/reply_to");
      expect(html).toContain("Async coverage summary");
      expect(html).toContain("Channel coverage");
      expect(html).toContain("Message coverage");
      expect(html).toContain("OrderEventHeaders");
      expect(html).toContain("&lt;unsafe&gt;&amp;&quot;async&quot;.yaml");
      expect(html).toContain("Observed &lt;unsafe&gt; async message &amp; contract drift.");
      expect(html).not.toContain("corr-runtime-mismatch");
      expect(html).not.toContain("users.deadletter");
      expect(html).not.toContain("HTTP security conformance");
      expect(html).not.toContain("HTTP request conformance");
      expect(html).not.toContain("Deprecated operations");
      expect(html).not.toContain("Governance");
      expect(html).not.toContain("<script");
      expect(html).not.toMatch(/<(?:img|iframe)\b/i);
      expect(html).not.toMatch(/\b(?:src|href)=['"]https?:\/\//i);
      expect(html).not.toMatch(/url\(/i);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("preserves canonical key ordering and trailing newline", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-report-"));
    try {
      const outPath = await writeAsyncYanoteReport(dir, makeReport());
      const bytes = await readFile(outPath, "utf8");
      const htmlBytes = await readFile(path.join(dir, "yanote-async-report.html"), "utf8");
      expect(outPath).toBe(path.join(dir, "yanote-async-report.json"));
      expect(htmlBytes).toContain("Yanote async report");
      expect(bytes.endsWith("\n")).toBe(true);

      const parsed = JSON.parse(bytes);
      expect(Object.keys(parsed).slice(0, 4)).toEqual(["bindingSupport", "coverage", "declaredSemantics", "diagnostics"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
