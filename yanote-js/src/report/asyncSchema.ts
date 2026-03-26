import Ajv, { type ErrorObject } from "ajv";

export const ASYNC_REPORT_SCHEMA_VERSION = "1.0.0";
export const ASYNC_REPORT_PHASE = {
  id: "03",
  slug: "async-report-and-gate-surface"
} as const;

const ROUTING_DIAGNOSTIC_SCHEMA = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "message", "channel", "action"],
      properties: {
        kind: { const: "unmatched" },
        message: { type: "string", minLength: 1 },
        channel: { type: "string", minLength: 1 },
        action: { enum: ["send", "receive"] },
        observedMessage: { type: "string" }
      }
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "message", "channel", "action"],
      properties: {
        kind: { const: "mismatched" },
        message: { type: "string", minLength: 1 },
        channel: { type: "string", minLength: 1 },
        action: { enum: ["send", "receive"] },
        observedMessage: { type: "string" },
        expectedMessage: { type: "string" },
        reason: { type: "string", minLength: 1 }
      }
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "message", "operationKey", "channel", "action", "reason", "candidates"],
      properties: {
        kind: { const: "ambiguous" },
        message: { type: "string", minLength: 1 },
        operationKey: { type: "string", minLength: 1 },
        channel: { type: "string", minLength: 1 },
        action: { enum: ["send", "receive"] },
        observedMessage: { type: "string" },
        reason: { type: "string", minLength: 1 },
        candidates: {
          type: "array",
          minItems: 1,
          items: { type: "string", minLength: 1 }
        }
      }
    }
  ]
} as const;

const SCHEMA_DIAGNOSTIC_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "validationKind", "operationKey", "message", "channel", "action", "reason"],
  properties: {
    kind: {
      enum: [
        "missing-payload",
        "invalid-payload",
        "unsupported-content-type",
        "unsupported-schema-format",
        "missing-header",
        "invalid-header",
        "unavailable-header",
        "unverifiable-headers"
      ]
    },
    validationKind: { enum: ["payload", "headers", "contentType", "schemaFormat"] },
    operationKey: { type: "string", minLength: 1 },
    message: { type: "string", minLength: 1 },
    channel: { type: "string", minLength: 1 },
    action: { enum: ["send", "receive"] },
    messageName: { type: "string", minLength: 1 },
    schemaId: { type: "string", minLength: 1 },
    pointer: { type: "string", minLength: 1 },
    reason: { type: "string", minLength: 1 }
  }
} as const;

const RUNTIME_SEMANTIC_DIAGNOSTIC_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["semantic", "state", "operationKey", "channel", "action", "location", "reason", "message"],
  properties: {
    semantic: { enum: ["correlationId", "reply.address"] },
    state: { enum: ["missing", "unavailable", "unsupported", "mismatched"] },
    operationKey: { type: "string", minLength: 1 },
    channel: { type: "string", minLength: 1 },
    action: { enum: ["send", "receive"] },
    location: { type: "string", minLength: 1 },
    header: { type: "string", minLength: 1 },
    messageName: { type: "string", minLength: 1 },
    replyChannelAddress: { type: "string", minLength: 1 },
    reason: { type: "string", minLength: 1 },
    message: { type: "string", minLength: 1 }
  }
} as const;

const ASYNC_REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "generatedAt",
    "toolVersion",
    "specSource",
    "phase",
    "status",
    "summary",
    "coverage",
    "bindingSupport",
    "declaredSemantics",
    "runtimeSemantics",
    "diagnostics"
  ],
  properties: {
    schemaVersion: { const: ASYNC_REPORT_SCHEMA_VERSION },
    generatedAt: { type: "string", minLength: 1 },
    toolVersion: { type: "string", minLength: 1 },
    specSource: {
      type: "object",
      additionalProperties: false,
      required: ["kind", "reference"],
      properties: {
        kind: { enum: ["local-file", "local-directory", "remote-url"] },
        reference: { type: "string", minLength: 1 }
      }
    },
    phase: {
      type: "object",
      additionalProperties: false,
      required: ["id", "slug"],
      properties: {
        id: { const: ASYNC_REPORT_PHASE.id },
        slug: { const: ASYNC_REPORT_PHASE.slug }
      }
    },
    status: { enum: ["ok", "partial", "invalid"] },
    summary: {
      type: "object",
      additionalProperties: false,
      required: [
        "totalChannels",
        "coveredChannels",
        "channelCoveragePercent",
        "totalOperations",
        "coveredOperations",
        "operationCoveragePercent",
        "totalMessages",
        "coveredMessages",
        "messageCoveragePercent"
      ],
      properties: {
        totalChannels: { type: "integer", minimum: 0 },
        coveredChannels: { type: "integer", minimum: 0 },
        channelCoveragePercent: { anyOf: [{ type: "number" }, { type: "null" }] },
        totalOperations: { type: "integer", minimum: 0 },
        coveredOperations: { type: "integer", minimum: 0 },
        operationCoveragePercent: { anyOf: [{ type: "number" }, { type: "null" }] },
        totalMessages: { type: "integer", minimum: 0 },
        coveredMessages: { type: "integer", minimum: 0 },
        messageCoveragePercent: { anyOf: [{ type: "number" }, { type: "null" }] }
      }
    },
    coverage: {
      type: "object",
      additionalProperties: false,
      required: ["channels", "operations", "messages"],
      properties: {
        channels: coverageSectionSchema({
          type: "object",
          additionalProperties: false,
          required: ["channel", "state", "coveredActions", "missingActions"],
          properties: {
            channel: { type: "string", minLength: 1 },
            state: { enum: ["COVERED", "UNCOVERED"] },
            coveredActions: { type: "array", items: { enum: ["send", "receive"] } },
            missingActions: { type: "array", items: { enum: ["send", "receive"] } }
          }
        }),
        operations: coverageSectionSchema({
          type: "object",
          additionalProperties: false,
          required: ["operationKey", "channel", "action", "operation", "messageContract", "suites"],
          properties: {
            operationKey: { type: "string", minLength: 1 },
            channel: { type: "string", minLength: 1 },
            action: { enum: ["send", "receive"] },
            operation: {
              type: "object",
              additionalProperties: false,
              required: ["state"],
              properties: {
                state: { enum: ["COVERED", "UNCOVERED"] }
              }
            },
            messageContract: {
              type: "object",
              additionalProperties: false,
              required: ["state"],
              properties: {
                name: { type: "string", minLength: 1 },
                state: { enum: ["COVERED", "PARTIAL", "UNCOVERED", "N/A"] },
                selectionMode: { enum: ["single", "runtime"] },
                declaredMessages: { type: "array", items: { type: "string", minLength: 1 } },
                selectedMessages: { type: "array", items: { type: "string", minLength: 1 } }
              }
            },
            suites: { type: "array", items: { type: "string" } }
          }
        }),
        messages: coverageSectionSchema({
          type: "object",
          additionalProperties: false,
          required: ["operationKey", "channel", "action", "message", "state", "suites"],
          properties: {
            operationKey: { type: "string", minLength: 1 },
            channel: { type: "string", minLength: 1 },
            action: { enum: ["send", "receive"] },
            message: { type: "string", minLength: 1 },
            state: { enum: ["COVERED", "UNCOVERED"] },
            suites: { type: "array", items: { type: "string" } }
          }
        })
      }
    },
    bindingSupport: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "operations"],
      properties: {
        summary: {
          type: "object",
          additionalProperties: false,
          required: [
            "totalOperations",
            "totalBindings",
            "supportedBindings",
            "declaredOnlyBindings",
            "deferredBindings",
            "invalidBindings"
          ],
          properties: {
            totalOperations: { type: "integer", minimum: 0 },
            totalBindings: { type: "integer", minimum: 0 },
            supportedBindings: { type: "integer", minimum: 0 },
            declaredOnlyBindings: { type: "integer", minimum: 0 },
            deferredBindings: { type: "integer", minimum: 0 },
            invalidBindings: { type: "integer", minimum: 0 }
          }
        },
        operations: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["operationKey", "channel", "action", "bindings"],
            properties: {
              operationKey: { type: "string", minLength: 1 },
              channel: { type: "string", minLength: 1 },
              action: { enum: ["send", "receive"] },
              bindings: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["scope", "field", "status", "source"],
                  properties: {
                    scope: { enum: ["channel", "operation", "message"] },
                    field: {
                      enum: [
                        "topic",
                        "partitions",
                        "replicas",
                        "topicConfiguration",
                        "groupId",
                        "clientId",
                        "key",
                        "schemaIdLocation",
                        "schemaIdPayloadEncoding",
                        "schemaLookupStrategy"
                      ]
                    },
                    status: { enum: ["supported", "declared-only", "deferred", "invalid"] },
                    source: { type: "string", minLength: 1 },
                    messageName: { type: "string", minLength: 1 },
                    value: { type: "string", minLength: 1 },
                    reason: { type: "string", minLength: 1 }
                  }
                }
              }
            }
          }
        }
      }
    },
    declaredSemantics: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "operations"],
      properties: {
        summary: {
          type: "object",
          additionalProperties: false,
          required: [
            "totalOperations",
            "operationsWithCorrelationId",
            "messageCorrelationIds",
            "operationsWithReply"
          ],
          properties: {
            totalOperations: { type: "integer", minimum: 0 },
            operationsWithCorrelationId: { type: "integer", minimum: 0 },
            messageCorrelationIds: { type: "integer", minimum: 0 },
            operationsWithReply: { type: "integer", minimum: 0 }
          }
        },
        operations: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["operationKey", "channel", "action", "correlationIds"],
            properties: {
              operationKey: { type: "string", minLength: 1 },
              channel: { type: "string", minLength: 1 },
              action: { enum: ["send", "receive"] },
              correlationIds: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["message", "location"],
                  properties: {
                    message: { type: "string", minLength: 1 },
                    location: { type: "string", minLength: 1 }
                  }
                }
              },
              reply: {
                type: "object",
                additionalProperties: false,
                required: ["address"],
                properties: {
                  address: {
                    type: "object",
                    additionalProperties: false,
                    required: ["location"],
                    properties: {
                      location: { type: "string", minLength: 1 }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    runtimeSemantics: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "operations", "diagnostics"],
      properties: {
        summary: {
          type: "object",
          additionalProperties: false,
          required: [
            "totalOperations",
            "satisfiedOperations",
            "unsatisfiedOperations",
            "totalSemantics",
            "satisfiedSemantics",
            "unsatisfiedSemantics",
            "semanticCoveragePercent"
          ],
          properties: {
            totalOperations: { type: "integer", minimum: 0 },
            satisfiedOperations: { type: "integer", minimum: 0 },
            unsatisfiedOperations: { type: "integer", minimum: 0 },
            totalSemantics: { type: "integer", minimum: 0 },
            satisfiedSemantics: { type: "integer", minimum: 0 },
            unsatisfiedSemantics: { type: "integer", minimum: 0 },
            semanticCoveragePercent: { anyOf: [{ type: "number" }, { type: "null" }] }
          }
        },
        operations: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["operationKey", "channel", "action", "state", "correlationIds"],
            properties: {
              operationKey: { type: "string", minLength: 1 },
              channel: { type: "string", minLength: 1 },
              action: { enum: ["send", "receive"] },
              state: { enum: ["SATISFIED", "PARTIAL", "UNSATISFIED"] },
              correlationIds: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["message", "location", "state", "suites"],
                  properties: {
                    message: { type: "string", minLength: 1 },
                    location: { type: "string", minLength: 1 },
                    state: { enum: ["SATISFIED", "UNSATISFIED"] },
                    suites: { type: "array", items: { type: "string" } },
                    header: { type: "string", minLength: 1 },
                    messageName: { type: "string", minLength: 1 }
                  }
                }
              },
              reply: {
                type: "object",
                additionalProperties: false,
                required: ["address"],
                properties: {
                  address: {
                    type: "object",
                    additionalProperties: false,
                    required: ["location", "state", "suites"],
                    properties: {
                      location: { type: "string", minLength: 1 },
                      state: { enum: ["SATISFIED", "UNSATISFIED"] },
                      suites: { type: "array", items: { type: "string" } },
                      header: { type: "string", minLength: 1 },
                      replyChannelAddress: { type: "string", minLength: 1 }
                    }
                  }
                }
              }
            }
          }
        },
        diagnostics: {
          type: "object",
          additionalProperties: false,
          required: ["counts", "items"],
          properties: {
            counts: {
              type: "object",
              additionalProperties: false,
              required: ["missing", "unavailable", "unsupported", "mismatched"],
              properties: {
                missing: { type: "integer", minimum: 0 },
                unavailable: { type: "integer", minimum: 0 },
                unsupported: { type: "integer", minimum: 0 },
                mismatched: { type: "integer", minimum: 0 }
              }
            },
            items: {
              type: "array",
              items: RUNTIME_SEMANTIC_DIAGNOSTIC_SCHEMA
            }
          }
        }
      }
    },
    diagnostics: {
      type: "object",
      additionalProperties: false,
      required: ["counts", "items"],
      properties: {
        counts: {
          type: "object",
          additionalProperties: false,
          required: [
            "unsupported-content-type",
            "unsupported-schema-format",
            "missing-payload",
            "invalid-payload",
            "missing-header",
            "unavailable-header",
            "invalid-header",
            "unverifiable-headers",
            "ambiguous",
            "unmatched",
            "mismatched"
          ],
          properties: {
            "unsupported-content-type": { type: "integer", minimum: 0 },
            "unsupported-schema-format": { type: "integer", minimum: 0 },
            "missing-payload": { type: "integer", minimum: 0 },
            "invalid-payload": { type: "integer", minimum: 0 },
            "missing-header": { type: "integer", minimum: 0 },
            "unavailable-header": { type: "integer", minimum: 0 },
            "invalid-header": { type: "integer", minimum: 0 },
            "unverifiable-headers": { type: "integer", minimum: 0 },
            ambiguous: { type: "integer", minimum: 0 },
            unmatched: { type: "integer", minimum: 0 },
            mismatched: { type: "integer", minimum: 0 }
          }
        },
        items: {
          type: "array",
          items: {
            oneOf: [ROUTING_DIAGNOSTIC_SCHEMA, SCHEMA_DIAGNOSTIC_SCHEMA]
          }
        }
      }
    }
  }
} as const;

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  strictTypes: true
});

const validator = ajv.compile(ASYNC_REPORT_SCHEMA);

export function validateAsyncReport(report: unknown): { ok: true } | { ok: false; errors: string[] } {
  const valid = validator(report);
  if (valid) {
    return { ok: true };
  }

  return {
    ok: false,
    errors: formatAjvErrors(validator.errors ?? [])
  };
}

function coverageSectionSchema(itemSchema: object) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["state", "percent", "items"],
    properties: {
      state: { enum: ["COVERED", "PARTIAL", "UNCOVERED", "N/A"] },
      percent: { anyOf: [{ type: "number" }, { type: "null" }] },
      items: {
        type: "array",
        items: itemSchema
      }
    }
  } as const;
}

function formatAjvErrors(errors: ErrorObject[]): string[] {
  return errors.map((error) => {
    const path = error.instancePath || "/";
    return `${path} ${error.message ?? "validation error"}`;
  });
}
