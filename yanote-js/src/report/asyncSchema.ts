import Ajv, { type ErrorObject } from "ajv";

export const ASYNC_REPORT_SCHEMA_VERSION = "1.0.0";
export const ASYNC_REPORT_PHASE = {
  id: "03",
  slug: "async-report-and-gate-surface"
} as const;

const ASYNC_REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "generatedAt", "toolVersion", "phase", "status", "summary", "coverage", "diagnostics"],
  properties: {
    schemaVersion: { const: ASYNC_REPORT_SCHEMA_VERSION },
    generatedAt: { type: "string", minLength: 1 },
    toolVersion: { type: "string", minLength: 1 },
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
                state: { enum: ["COVERED", "UNCOVERED", "N/A"] }
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
    diagnostics: {
      type: "object",
      additionalProperties: false,
      required: ["counts", "items"],
      properties: {
        counts: {
          type: "object",
          additionalProperties: false,
          required: ["unmatched", "mismatched"],
          properties: {
            unmatched: { type: "integer", minimum: 0 },
            mismatched: { type: "integer", minimum: 0 }
          }
        },
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["kind", "message", "channel", "action"],
            properties: {
              kind: { enum: ["unmatched", "mismatched"] },
              message: { type: "string", minLength: 1 },
              channel: { type: "string", minLength: 1 },
              action: { enum: ["send", "receive"] },
              observedMessage: { type: "string" },
              expectedMessage: { type: "string" }
            }
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
