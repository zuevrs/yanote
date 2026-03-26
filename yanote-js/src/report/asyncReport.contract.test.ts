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
import { renderAsyncYanoteReportHtml } from "./asyncReportHtml.js";

const baseReport: AsyncYanoteReport = {
  schemaVersion: ASYNC_REPORT_SCHEMA_VERSION,
  generatedAt: "1970-01-01T00:00:00.000Z",
  toolVersion: "test",
  specSource: {
    kind: "local-file",
    reference: "test/fixtures/asyncapi/base.yaml"
  },
  phase: ASYNC_REPORT_PHASE,
  protocols: ["kafka"],
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
      totalOperations: 1,
      operationsWithCorrelationId: 1,
      messageCorrelationIds: 1,
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
      totalOperations: 1,
      satisfiedOperations: 1,
      unsatisfiedOperations: 0,
      totalSemantics: 2,
      satisfiedSemantics: 2,
      unsatisfiedSemantics: 0,
      semanticCoveragePercent: 100
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
            suites: ["suite-a"],
            header: "correlation_id",
            messageName: "UserSignedUp"
          }
        ],
        reply: {
          address: {
            location: "$message.header#/reply_to",
            state: "SATISFIED",
            suites: ["suite-a"],
            header: "reply_to",
            replyChannelAddress: "users.reply"
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

  it("renders an async-only HTML surface from normalized canonical truth", () => {
    const html = renderAsyncYanoteReportHtml(
      normalizeAsyncReport({
        ...baseReport,
        specSource: {
          kind: "local-file",
          reference: 'test/fixtures/<unsafe>&"async".yaml'
        },
        declaredSemantics: {
          summary: {
            totalOperations: 1,
            operationsWithCorrelationId: 1,
            messageCorrelationIds: 1,
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
              operationKey: "kafka send users.signedup",
              channel: "users.signedup",
              action: "send",
              state: "PARTIAL",
              correlationIds: [
                {
                  message: "UserSignedUp",
                  location: "$message.header#/correlation_id",
                  state: "SATISFIED",
                  suites: ["suite-a"],
                  header: "correlation_id",
                  messageName: "UserSignedUp"
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
              missing: 0,
              unavailable: 1,
              unsupported: 0,
              mismatched: 0
            },
            items: [
              {
                semantic: "reply.address",
                state: "unavailable",
                operationKey: "kafka send users.signedup",
                channel: "users.signedup",
                action: "send",
                location: "$message.header#/reply_to",
                header: "reply_to",
                replyChannelAddress: "users.reply",
                reason:
                  "Observed kafka header 'reply_to' required by declared reply.address location '$message.header#/reply_to' was unavailable because retained header evidence was redacted (sensitive).",
                message: "Observed kafka header value was unavailable for AsyncAPI reply.address runtime proof"
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
            ambiguous: 1,
            unmatched: 0,
            mismatched: 0
          },
          items: [
            {
              kind: "ambiguous",
              operationKey: "kafka send users.signedup",
              channel: "users.signedup",
              action: "send",
              observedMessage: "UserLifecycleEvent",
              reason: "Runtime selection remained ambiguous.",
              candidates: ["UserSignedUp", "UserLifecycleEvent"],
              message: "AsyncAPI message selection remained ambiguous, so the kafka operation was not normalized"
            }
          ]
        }
      })
    );

    expect(html).toContain("Yanote async report");
    expect(html).toContain("Async coverage summary");
    expect(html).toContain("Protocols");
    expect(html).toContain("&lt;protocol&gt; &lt;action&gt; &lt;channel&gt;");
    expect(html).toContain("Declared semantics");
    expect(html).toContain("Runtime semantics");
    expect(html).toContain("Runtime semantics by async operation");
    expect(html).toContain("Runtime semantic diagnostic counts");
    expect(html).toContain("Runtime semantic diagnostics");
    expect(html).toContain("Declared correlationId");
    expect(html).toContain("$message.header#/correlation_id");
    expect(html).toContain("$message.header#/reply_to");
    expect(html).toContain("Channel coverage");
    expect(html).toContain("Operation coverage");
    expect(html).toContain("Message coverage");
    expect(html).toContain("Provenance");
    expect(html).toContain("&lt;unsafe&gt;&amp;&quot;async&quot;.yaml");
    expect(html).not.toContain("corr-unsafe");
    expect(html).not.toContain("users.deadletter");
    expect(html).not.toContain("HTTP security conformance");
    expect(html).not.toContain("HTTP request conformance");
    expect(html).not.toContain("Deprecated operations");
    expect(html).not.toContain("Governance");
  });

  it("renders Kafka-only additive sections truthfully empty for AMQP protocol reports", () => {
    const amqpReport = normalizeAsyncReport({
      ...baseReport,
      protocols: ["amqp"],
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
              operationKey: "amqp send users.signedup",
              channel: "users.signedup",
              action: "send",
              operation: { state: "COVERED" },
              messageContract: { name: "UserSignedUp", state: "COVERED" },
              suites: ["suite-amqp"]
            }
          ]
        },
        messages: {
          state: "COVERED",
          percent: 100,
          items: [
            {
              operationKey: "amqp send users.signedup",
              channel: "users.signedup",
              action: "send",
              message: "UserSignedUp",
              state: "COVERED",
              suites: ["suite-amqp"]
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
      }
    });

    const html = renderAsyncYanoteReportHtml(amqpReport);

    expect(html).toContain("Protocols");
    expect(html).toContain("amqp");
    expect(html).toContain("Kafka Binding Support");
    expect(html).toContain("intentionally empty for AMQP inputs");
    expect(html).toContain("Current normalized report protocol is amqp");
    expect(html).toContain("amqp send users.signedup");
  });

  it("validates schemaVersion independently from toolVersion and requires the widened diagnostic union", () => {
    const wrongSchema = {
      ...baseReport,
      schemaVersion: "999.0.0",
      toolVersion: "0.1.0"
    };

    expect(validateAsyncReport(wrongSchema).ok).toBe(false);
    const missingProtocols = {
      ...baseReport
    } as any;
    delete missingProtocols.protocols;

    expect(validateAsyncReport(missingProtocols).ok).toBe(false);

    const missingDeclaredSemantics = {
      ...baseReport,
      declaredSemantics: {
        summary: {
          totalOperations: 1,
          operationsWithCorrelationId: 1,
          operationsWithReply: 1
        },
        operations: []
      }
    } as any;

    expect(validateAsyncReport(missingDeclaredSemantics).ok).toBe(false);

    const missingRuntimeSemantics = {
      ...baseReport,
      runtimeSemantics: {
        summary: {
          totalOperations: 1,
          satisfiedOperations: 1,
          unsatisfiedOperations: 0,
          totalSemantics: 2,
          satisfiedSemantics: 2,
          unsatisfiedSemantics: 0
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
      }
    } as any;

    expect(validateAsyncReport(missingRuntimeSemantics).ok).toBe(false);

    const invalidRuntimeOperationState = {
      ...baseReport,
      runtimeSemantics: {
        ...baseReport.runtimeSemantics,
        operations: [
          {
            ...baseReport.runtimeSemantics.operations[0],
            state: "BROKEN"
          }
        ]
      }
    } as any;

    expect(validateAsyncReport(invalidRuntimeOperationState).ok).toBe(false);

    const missingCount = {
      ...baseReport,
      diagnostics: {
        ...baseReport.diagnostics,
        counts: {
          "unsupported-content-type": 0,
          "unsupported-schema-format": 0,
          "missing-payload": 0,
          "invalid-payload": 0,
          "missing-header": 0,
          "unavailable-header": 0,
          ambiguous: 0,
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
            operationKey: "kafka send orders.created",
            channel: "orders.created",
            action: "send",
            messageName: "OrderCreatedEnvelope",
            schemaId: "OrderEventHeaders",
            pointer: "/traceId",
            reason: "pattern: must match pattern '^trace-[0-9]+$'",
            message: "Observed kafka headers did not conform to the retained AsyncAPI header schema"
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
                message: "UserSignedUpB",
                location: "$message.header#/b"
              },
              {
                message: "UserSignedUpA",
                location: "$message.header#/a"
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
          semanticCoveragePercent: 66.6667
        },
        operations: [
          {
            operationKey: "kafka send users.signedup",
            channel: "users.signedup",
            action: "send",
            state: "SATISFIED",
            correlationIds: [
              {
                message: "UserSignedUpB",
                location: "$message.header#/b",
                state: "SATISFIED",
                suites: ["suite-b", "suite-a"],
                header: "b"
              },
              {
                message: "UserSignedUpA",
                location: "$message.header#/a",
                state: "SATISFIED",
                suites: ["suite-c", "suite-a"],
                header: "a"
              }
            ]
          },
          {
            operationKey: "kafka receive users.deleted",
            channel: "users.deleted",
            action: "receive",
            state: "UNSATISFIED",
            correlationIds: [],
            reply: {
              address: {
                location: "$message.header#/reply_to",
                state: "UNSATISFIED",
                suites: ["suite-c", "suite-a"],
                header: "reply_to",
                replyChannelAddress: "users.reply"
              }
            }
          }
        ],
        diagnostics: {
          counts: {
            missing: 1,
            unavailable: 1,
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
              location: "$message.header#/a",
              header: "a",
              messageName: "UserSignedUpA",
              reason: "Observed kafka evidence did not retain header 'a' required by declared correlationId location '$message.header#/a'.",
              message: "Observed kafka evidence is missing retained header evidence required to prove AsyncAPI correlationId"
            },
            {
              semantic: "reply.address",
              state: "unavailable",
              operationKey: "kafka receive users.deleted",
              channel: "users.deleted",
              action: "receive",
              location: "$message.header#/reply_to",
              header: "reply_to",
              replyChannelAddress: "users.reply",
              reason:
                "Observed kafka header 'reply_to' required by declared reply.address location '$message.header#/reply_to' was unavailable because retained header evidence was redacted (sensitive).",
              message: "Observed kafka header value was unavailable for AsyncAPI reply.address runtime proof"
            }
          ]
        }
      },
      diagnostics: {
        counts: {
          "unsupported-content-type": 1,
          "unsupported-schema-format": 0,
          "missing-payload": 0,
          "invalid-payload": 0,
          "missing-header": 1,
          "unavailable-header": 0,
          "invalid-header": 0,
          "unverifiable-headers": 0,
          ambiguous: 0,
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
    expect(normalized.declaredSemantics.operations.map((entry) => entry.operationKey)).toEqual([
      "kafka receive users.deleted",
      "kafka send users.signedup"
    ]);
    expect(normalized.declaredSemantics.operations[1].correlationIds).toEqual([
      {
        message: "UserSignedUpA",
        location: "$message.header#/a"
      },
      {
        message: "UserSignedUpB",
        location: "$message.header#/b"
      }
    ]);
    expect(normalized.runtimeSemantics.summary.semanticCoveragePercent).toBe(roundCoverage(66.6667));
    expect(normalized.runtimeSemantics.operations.map((entry) => entry.operationKey)).toEqual([
      "kafka receive users.deleted",
      "kafka send users.signedup"
    ]);
    expect(normalized.runtimeSemantics.operations[0]).toEqual({
      operationKey: "kafka receive users.deleted",
      channel: "users.deleted",
      action: "receive",
      state: "UNSATISFIED",
      correlationIds: [],
      reply: {
        address: {
          location: "$message.header#/reply_to",
          state: "UNSATISFIED",
          suites: ["suite-a", "suite-c"],
          header: "reply_to",
          replyChannelAddress: "users.reply"
        }
      }
    });
    expect(normalized.runtimeSemantics.operations[1].correlationIds).toEqual([
      {
        message: "UserSignedUpA",
        location: "$message.header#/a",
        state: "SATISFIED",
        suites: ["suite-a", "suite-c"],
        header: "a"
      },
      {
        message: "UserSignedUpB",
        location: "$message.header#/b",
        state: "SATISFIED",
        suites: ["suite-a", "suite-b"],
        header: "b"
      }
    ]);
    expect(normalized.runtimeSemantics.diagnostics.counts).toEqual({
      missing: 1,
      unavailable: 1,
      unsupported: 0,
      mismatched: 1
    });
    expect(normalized.runtimeSemantics.diagnostics.items.map((entry) => entry.state)).toEqual([
      "missing",
      "unavailable",
      "mismatched"
    ]);
    expect(normalized.diagnostics.counts).toEqual({
      "unsupported-content-type": 1,
      "unsupported-schema-format": 0,
      "missing-payload": 0,
      "invalid-payload": 0,
      "missing-header": 1,
      "unavailable-header": 0,
      "invalid-header": 0,
      "unverifiable-headers": 0,
      ambiguous: 0,
      mismatched: 1,
      unmatched: 1
    });
    expect(normalized.diagnostics.items.map((entry) => entry.kind)).toEqual([
      "unsupported-content-type",
      "missing-header",
      "mismatched",
      "unmatched"
    ]);
  });
});
