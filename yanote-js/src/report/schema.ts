import Ajv, { type ErrorObject } from "ajv";

export const REPORT_SCHEMA_VERSION = "1.0.0";

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "generatedAt",
    "toolVersion",
    "phase",
    "status",
    "summary",
    "coverage",
    "httpPayloadConformance",
    "httpRequestConformance",
    "diagnostics",
    "governance"
  ],
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
    httpPayloadConformance: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "perOperation", "diagnostics"],
      properties: {
        summary: {
          type: "object",
          additionalProperties: false,
          required: ["request", "response"],
          properties: {
            request: { $ref: "#/$defs/httpPayloadTargetAggregate" },
            response: { $ref: "#/$defs/httpPayloadTargetAggregate" }
          }
        },
        perOperation: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["operationKey", "method", "route", "request", "response", "suites"],
            properties: {
              operationKey: { type: "string", minLength: 1 },
              method: { type: "string", minLength: 1 },
              route: { type: "string", minLength: 1 },
              request: { $ref: "#/$defs/httpPayloadTargetSummary" },
              response: { $ref: "#/$defs/httpPayloadResponseSummary" },
              suites: {
                type: "array",
                items: { type: "string" }
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
              required: ["covered", "uncovered", "skipped"],
              properties: {
                covered: { type: "integer", minimum: 0 },
                uncovered: { type: "integer", minimum: 0 },
                skipped: { type: "integer", minimum: 0 }
              }
            },
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "operationKey",
                  "method",
                  "route",
                  "target",
                  "suite",
                  "state",
                  "code",
                  "message",
                  "declaredMediaTypes"
                ],
                properties: {
                  operationKey: { type: "string", minLength: 1 },
                  method: { type: "string", minLength: 1 },
                  route: { type: "string", minLength: 1 },
                  target: { enum: ["request", "response"] },
                  suite: { type: "string", minLength: 1 },
                  state: { enum: ["COVERED", "UNCOVERED", "SKIPPED"] },
                  code: {
                    enum: [
                      "VALID",
                      "INVALID_BODY",
                      "MISSING_BODY",
                      "MISSING_CONTENT_TYPE",
                      "MEDIA_TYPE_MISMATCH",
                      "UNSUPPORTED_MEDIA_TYPE",
                      "UNSUPPORTED_SCHEMA_FORMAT",
                      "UNSUPPORTED_SCHEMA",
                      "NO_DECLARED_CONTENT",
                      "RECORDER_OMITTED"
                    ]
                  },
                  message: { type: "string", minLength: 1 },
                  declaredStatus: { type: "string" },
                  observedStatus: { type: "integer" },
                  observedMediaType: { type: "string" },
                  declaredMediaTypes: { type: "array", items: { type: "string" } },
                  captureState: { enum: ["captured", "omitted"] },
                  captureReason: { enum: ["malformed", "oversized", "unsupported", "policy-filtered"] },
                  errors: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      }
    },
    httpRequestConformance: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "perOperation", "diagnostics"],
      properties: {
        summary: {
          type: "object",
          additionalProperties: false,
          required: ["observedOperations", "observedParameters", "counts"],
          properties: {
            observedOperations: { type: "integer", minimum: 0 },
            observedParameters: { type: "integer", minimum: 0 },
            counts: { $ref: "#/$defs/httpRequestTruthAggregate" }
          }
        },
        perOperation: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["operationKey", "method", "route", "observedCount", "counts", "parameters", "suites"],
            properties: {
              operationKey: { type: "string", minLength: 1 },
              method: { type: "string", minLength: 1 },
              route: { type: "string", minLength: 1 },
              observedCount: { type: "integer", minimum: 0 },
              counts: { $ref: "#/$defs/httpRequestTruthAggregate" },
              parameters: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "name",
                    "in",
                    "required",
                    "style",
                    "explode",
                    "declaredSupport",
                    "scalarSupport",
                    "observedCount",
                    "counts",
                    "suites"
                  ],
                  properties: {
                    name: { type: "string", minLength: 1 },
                    in: { enum: ["path", "query", "header", "cookie"] },
                    required: { type: "boolean" },
                    style: { type: "string", minLength: 1 },
                    explode: { type: "boolean" },
                    declaredSupport: { enum: ["supported", "unsupported"] },
                    declaredSupportShape: { enum: ["scalar", "array"] },
                    declaredSupportReason: { enum: ["content", "style", "explode", "schema"] },
                    scalarSupport: { enum: ["supported", "unsupported"] },
                    scalarSupportReason: { enum: ["style", "schema"] },
                    observedCount: { type: "integer", minimum: 0 },
                    counts: { $ref: "#/$defs/httpRequestTruthAggregate" },
                    suites: { type: "array", items: { type: "string" } }
                  }
                }
              },
              suites: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        diagnostics: {
          type: "object",
          additionalProperties: false,
          required: ["counts", "items"],
          properties: {
            counts: { $ref: "#/$defs/httpRequestTruthAggregate" },
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "operationKey",
                  "method",
                  "route",
                  "suite",
                  "location",
                  "name",
                  "required",
                  "style",
                  "truth",
                  "message"
                ],
                properties: {
                  operationKey: { type: "string", minLength: 1 },
                  method: { type: "string", minLength: 1 },
                  route: { type: "string", minLength: 1 },
                  suite: { type: "string", minLength: 1 },
                  location: { enum: ["path", "query", "header", "cookie"] },
                  name: { type: "string", minLength: 1 },
                  required: { type: "boolean" },
                  style: { type: "string", minLength: 1 },
                  truth: { enum: ["captured-valid", "captured-invalid", "redacted", "omitted", "unsupported"] },
                  message: { type: "string", minLength: 1 },
                  reason: { type: "string" },
                  observedValues: { type: "array", items: { type: "string" } },
                  evidenceState: { enum: ["captured", "redacted", "omitted"] },
                  evidenceReason: { enum: ["sensitive", "oversized", "unsupported", "unavailable"] }
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
              async: {
                type: "object",
                additionalProperties: false,
                properties: {
                  runtime: { type: "string" },
                  channel: { type: "string" },
                  action: { enum: ["send", "receive"] },
                  message: { type: "string" },
                  asyncapiVersion: { type: "string" },
                  protocol: { type: "string" }
                }
              },
              candidates: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    },
    governance: {
      type: "object",
      additionalProperties: false,
      required: ["exclusions", "diagnostics"],
      properties: {
        exclusions: {
          type: "object",
          additionalProperties: false,
          required: ["appliedRules", "unmatchedRules"],
          properties: {
            appliedRules: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "id",
                  "pattern",
                  "rationale",
                  "owner",
                  "expiresOn",
                  "allowBroadWildcard",
                  "allowCriticalOverride",
                  "source",
                  "matchedOperationCount",
                  "matchedOperationKeys",
                  "usedCriticalOverride"
                ],
                properties: {
                  id: { type: "string", minLength: 1 },
                  pattern: { type: "string", minLength: 1 },
                  rationale: { type: "string", minLength: 1 },
                  owner: { type: "string", minLength: 1 },
                  expiresOn: { type: "string", minLength: 1 },
                  allowBroadWildcard: { type: "boolean" },
                  allowCriticalOverride: { type: "boolean" },
                  source: { enum: ["policy-file", "cli"] },
                  matchedOperationCount: { type: "integer", minimum: 0 },
                  matchedOperationKeys: { type: "array", items: { type: "string" } },
                  usedCriticalOverride: { type: "boolean" }
                }
              }
            },
            unmatchedRules: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["id", "pattern", "rationale", "owner", "expiresOn", "source", "message"],
                properties: {
                  id: { type: "string", minLength: 1 },
                  pattern: { type: "string", minLength: 1 },
                  rationale: { type: "string", minLength: 1 },
                  owner: { type: "string", minLength: 1 },
                  expiresOn: { type: "string", minLength: 1 },
                  source: { enum: ["policy-file", "cli"] },
                  message: { type: "string", minLength: 1 }
                }
              }
            }
          }
        },
        diagnostics: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["severity", "class", "code", "message"],
            properties: {
              severity: { enum: ["error", "warning"] },
              class: { enum: ["input", "semantic", "gate", "runtime"] },
              code: { type: "string", minLength: 1 },
              message: { type: "string", minLength: 1 },
              operationKey: { type: "string" }
            }
          }
        }
      }
    }
  },
  $defs: {
    httpRequestTruthAggregate: {
      type: "object",
      additionalProperties: false,
      required: ["capturedValid", "capturedInvalid", "redacted", "omitted", "unsupported"],
      properties: {
        capturedValid: { type: "integer", minimum: 0 },
        capturedInvalid: { type: "integer", minimum: 0 },
        redacted: { type: "integer", minimum: 0 },
        omitted: { type: "integer", minimum: 0 },
        unsupported: { type: "integer", minimum: 0 }
      }
    },
    httpPayloadTargetAggregate: {
      type: "object",
      additionalProperties: false,
      required: [
        "coveredOperations",
        "partialOperations",
        "uncoveredOperations",
        "skippedOperations",
        "notApplicableOperations",
        "observedCount",
        "validCount",
        "invalidCount",
        "skippedCount"
      ],
      properties: {
        coveredOperations: { type: "integer", minimum: 0 },
        partialOperations: { type: "integer", minimum: 0 },
        uncoveredOperations: { type: "integer", minimum: 0 },
        skippedOperations: { type: "integer", minimum: 0 },
        notApplicableOperations: { type: "integer", minimum: 0 },
        observedCount: { type: "integer", minimum: 0 },
        validCount: { type: "integer", minimum: 0 },
        invalidCount: { type: "integer", minimum: 0 },
        skippedCount: { type: "integer", minimum: 0 }
      }
    },
    httpPayloadTargetSummary: {
      type: "object",
      additionalProperties: false,
      required: [
        "state",
        "observedCount",
        "validCount",
        "invalidCount",
        "skippedCount",
        "declaredMediaTypes",
        "observedMediaTypes"
      ],
      properties: {
        state: { enum: ["COVERED", "PARTIAL", "UNCOVERED", "SKIPPED", "N/A"] },
        observedCount: { type: "integer", minimum: 0 },
        validCount: { type: "integer", minimum: 0 },
        invalidCount: { type: "integer", minimum: 0 },
        skippedCount: { type: "integer", minimum: 0 },
        declaredMediaTypes: { type: "array", items: { type: "string" } },
        observedMediaTypes: { type: "array", items: { type: "string" } }
      }
    },
    httpPayloadResponseSummary: {
      type: "object",
      additionalProperties: false,
      required: [
        "state",
        "observedCount",
        "validCount",
        "invalidCount",
        "skippedCount",
        "declaredMediaTypes",
        "observedMediaTypes",
        "declaredContent"
      ],
      properties: {
        state: { enum: ["COVERED", "PARTIAL", "UNCOVERED", "SKIPPED", "N/A"] },
        observedCount: { type: "integer", minimum: 0 },
        validCount: { type: "integer", minimum: 0 },
        invalidCount: { type: "integer", minimum: 0 },
        skippedCount: { type: "integer", minimum: 0 },
        declaredMediaTypes: { type: "array", items: { type: "string" } },
        observedMediaTypes: { type: "array", items: { type: "string" } },
        declaredContent: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["declaredStatus", "mediaTypes"],
            properties: {
              declaredStatus: { type: "string", minLength: 1 },
              mediaTypes: { type: "array", items: { type: "string" } }
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
