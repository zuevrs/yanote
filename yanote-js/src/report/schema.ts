import Ajv, { type ErrorObject } from "ajv";

export const REPORT_SCHEMA_VERSION = "1.0.0";

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "generatedAt", "toolVersion", "phase", "status", "summary", "coverage", "diagnostics"],
  properties: {
    schemaVersion: { const: REPORT_SCHEMA_VERSION },
    generatedAt: { type: "string", minLength: 1 },
    toolVersion: { type: "string", minLength: 1 },
    phase: {
      type: "object",
      additionalProperties: false,
      required: ["id", "slug"],
      properties: {
        id: { type: "string", minLength: 1 },
        slug: { type: "string", minLength: 1 }
      }
    },
    status: { enum: ["ok", "partial", "invalid"] },
    summary: {
      type: "object",
      additionalProperties: false,
      required: ["totalOperations", "coveredOperations", "operationCoveragePercent", "aggregateCoveragePercent"],
      properties: {
        totalOperations: { type: "integer", minimum: 0 },
        coveredOperations: { type: "integer", minimum: 0 },
        operationCoveragePercent: { type: "number" },
        aggregateCoveragePercent: { anyOf: [{ type: "number" }, { type: "null" }] },
        aggregateExplanation: { type: "string" }
      }
    },
    coverage: {
      type: "object",
      additionalProperties: false,
      required: ["operations", "status", "parameters", "aggregate", "perOperation"],
      properties: {
        operations: {
          type: "object",
          additionalProperties: false,
          required: ["state", "percent"],
          properties: {
            state: { enum: ["COVERED", "PARTIAL", "UNCOVERED", "N/A"] },
            percent: { anyOf: [{ type: "number" }, { type: "null" }] }
          }
        },
        status: {
          type: "object",
          additionalProperties: false,
          required: ["state", "percent"],
          properties: {
            state: { enum: ["COVERED", "PARTIAL", "UNCOVERED", "N/A"] },
            percent: { anyOf: [{ type: "number" }, { type: "null" }] }
          }
        },
        parameters: {
          type: "object",
          additionalProperties: false,
          required: ["state", "percent"],
          properties: {
            state: { enum: ["COVERED", "PARTIAL", "UNCOVERED", "N/A"] },
            percent: { anyOf: [{ type: "number" }, { type: "null" }] }
          }
        },
        aggregate: {
          type: "object",
          additionalProperties: false,
          required: ["state", "percent"],
          properties: {
            state: { enum: ["COVERED", "PARTIAL", "UNCOVERED", "N/A"] },
            percent: { anyOf: [{ type: "number" }, { type: "null" }] },
            explanation: { type: "string" }
          }
        },
        perOperation: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["operationKey", "method", "route", "operation", "status", "parameters"],
            properties: {
              operationKey: { type: "string", minLength: 1 },
              method: { type: "string", minLength: 1 },
              route: { type: "string", minLength: 1 },
              operation: {
                type: "object",
                additionalProperties: false,
                required: ["state"],
                properties: {
                  state: { enum: ["COVERED", "UNCOVERED"] }
                }
              },
              status: {
                type: "object",
                additionalProperties: false,
                required: ["state", "declared", "covered", "missing"],
                properties: {
                  state: { enum: ["COVERED", "PARTIAL", "UNCOVERED", "N/A"] },
                  declared: { type: "array", items: { type: "string" } },
                  covered: { type: "array", items: { type: "string" } },
                  missing: { type: "array", items: { type: "string" } }
                }
              },
              parameters: {
                type: "object",
                additionalProperties: false,
                required: ["state", "required", "optional"],
                properties: {
                  state: { enum: ["COVERED", "PARTIAL", "UNCOVERED", "N/A"] },
                  required: {
                    type: "object",
                    additionalProperties: false,
                    required: ["total", "covered", "missing"],
                    properties: {
                      total: { type: "integer", minimum: 0 },
                      covered: { type: "integer", minimum: 0 },
                      missing: { type: "array", items: { type: "string" } }
                    }
                  },
                  optional: {
                    type: "object",
                    additionalProperties: false,
                    required: ["total", "covered", "missing"],
                    properties: {
                      total: { type: "integer", minimum: 0 },
                      covered: { type: "integer", minimum: 0 },
                      missing: { type: "array", items: { type: "string" } }
                    }
                  }
                }
              },
              suites: {
                type: "array",
                items: { type: "string" }
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
          required: ["invalid", "ambiguous", "unmatched"],
          properties: {
            invalid: { type: "integer", minimum: 0 },
            ambiguous: { type: "integer", minimum: 0 },
            unmatched: { type: "integer", minimum: 0 }
          }
        },
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["kind", "message"],
            properties: {
              kind: { enum: ["invalid", "ambiguous", "unmatched"] },
              message: { type: "string", minLength: 1 },
              method: { type: "string" },
              route: { type: "string" },
              candidates: { type: "array", items: { type: "string" } }
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

const validator = ajv.compile(REPORT_SCHEMA);

export function validateReport(report: unknown): { ok: true } | { ok: false; errors: string[] } {
  const valid = validator(report);
  if (valid) {
    return { ok: true };
  }

  return {
    ok: false,
    errors: formatAjvErrors(validator.errors ?? [])
  };
}

function formatAjvErrors(errors: ErrorObject[]): string[] {
  return errors.map((error) => {
    const path = error.instancePath || "/";
    return `${path} ${error.message ?? "validation error"}`;
  });
}
