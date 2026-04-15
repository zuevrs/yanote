import Ajv, { type ErrorObject } from "ajv";

export const COMBINED_REPORT_SCHEMA_VERSION = "1.0.0";
export const COMBINED_REPORT_PHASE = {
  id: "04",
  slug: "combined-http-async-report-surface"
} as const;

const SPEC_SOURCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "reference"],
  properties: {
    kind: {
      enum: ["local-file", "local-directory", "remote-url"]
    },
    reference: { type: "string", minLength: 1 }
  }
} as const;

const ARTIFACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "path"],
  properties: {
    kind: { enum: ["json", "html"] },
    path: { type: "string", minLength: 1 }
  }
} as const;

const CHILD_PROVENANCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["generatedAt", "toolVersion", "specSource", "artifacts"],
  properties: {
    generatedAt: { type: "string", minLength: 1 },
    toolVersion: { type: "string", minLength: 1 },
    specSource: SPEC_SOURCE_SCHEMA,
    artifacts: {
      type: "array",
      minItems: 2,
      items: ARTIFACT_SCHEMA
    }
  }
} as const;

const HTTP_PAYLOAD_TARGET_SCHEMA = {
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
} as const;

const REQUEST_COUNTS_SCHEMA = {
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
} as const;

const SECURITY_COUNTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["satisfied", "missing", "unavailable", "unsupported", "optional", "clear"],
  properties: {
    satisfied: { type: "integer", minimum: 0 },
    missing: { type: "integer", minimum: 0 },
    unavailable: { type: "integer", minimum: 0 },
    unsupported: { type: "integer", minimum: 0 },
    optional: { type: "integer", minimum: 0 },
    clear: { type: "integer", minimum: 0 }
  }
} as const;

const HTTP_CHILD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "status", "provenance", "issues", "summary"],
  properties: {
    kind: { const: "http" },
    status: { enum: ["ok", "partial", "invalid"] },
    provenance: CHILD_PROVENANCE_SCHEMA,
    issues: {
      type: "array",
      items: { type: "string", minLength: 1 }
    },
    summary: {
      type: "object",
      additionalProperties: false,
      required: [
        "totalOperations",
        "coveredOperations",
        "operationCoveragePercent",
        "aggregateCoveragePercent",
        "deprecatedOperations",
        "payloadConformance",
        "requestConformance",
        "securityConformance",
        "semanticDiagnostics",
        "governanceDiagnostics"
      ],
      properties: {
        totalOperations: { type: "integer", minimum: 0 },
        coveredOperations: { type: "integer", minimum: 0 },
        operationCoveragePercent: { type: "number" },
        aggregateCoveragePercent: { anyOf: [{ type: "number" }, { type: "null" }] },
        aggregateExplanation: { type: "string" },
        deprecatedOperations: {
          type: "object",
          additionalProperties: false,
          required: ["totalOperations", "coveredOperations", "uncoveredOperations", "operationCoveragePercent"],
          properties: {
            totalOperations: { type: "integer", minimum: 0 },
            coveredOperations: { type: "integer", minimum: 0 },
            uncoveredOperations: { type: "integer", minimum: 0 },
            operationCoveragePercent: { type: "number" }
          }
        },
        payloadConformance: {
          type: "object",
          additionalProperties: false,
          required: ["request", "response", "diagnostics"],
          properties: {
            request: HTTP_PAYLOAD_TARGET_SCHEMA,
            response: HTTP_PAYLOAD_TARGET_SCHEMA,
            diagnostics: {
              type: "object",
              additionalProperties: false,
              required: ["covered", "uncovered", "skipped"],
              properties: {
                covered: { type: "integer", minimum: 0 },
                uncovered: { type: "integer", minimum: 0 },
                skipped: { type: "integer", minimum: 0 }
              }
            }
          }
        },
        requestConformance: {
          type: "object",
          additionalProperties: false,
          required: ["observedOperations", "observedParameters", "counts"],
          properties: {
            observedOperations: { type: "integer", minimum: 0 },
            observedParameters: { type: "integer", minimum: 0 },
            counts: REQUEST_COUNTS_SCHEMA
          }
        },
        securityConformance: {
          type: "object",
          additionalProperties: false,
          required: ["declaredOperations", "observedOperations", "observedEvaluations", "counts"],
          properties: {
            declaredOperations: { type: "integer", minimum: 0 },
            observedOperations: { type: "integer", minimum: 0 },
            observedEvaluations: { type: "integer", minimum: 0 },
            counts: SECURITY_COUNTS_SCHEMA
          }
        },
        semanticDiagnostics: {
          type: "object",
          additionalProperties: false,
          required: ["invalid", "ambiguous", "unmatched"],
          properties: {
            invalid: { type: "integer", minimum: 0 },
            ambiguous: { type: "integer", minimum: 0 },
            unmatched: { type: "integer", minimum: 0 }
          }
        },
        governanceDiagnostics: {
          type: "object",
          additionalProperties: false,
          required: ["errors", "warnings"],
          properties: {
            errors: { type: "integer", minimum: 0 },
            warnings: { type: "integer", minimum: 0 }
          }
        }
      }
    }
  }
} as const;

const ASYNC_CHILD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "status", "provenance", "issues", "summary"],
  properties: {
    kind: { const: "async" },
    status: { enum: ["ok", "partial", "invalid"] },
    provenance: CHILD_PROVENANCE_SCHEMA,
    issues: {
      type: "array",
      items: { type: "string", minLength: 1 }
    },
    summary: {
      type: "object",
      additionalProperties: false,
      required: [
        "protocols",
        "totalChannels",
        "coveredChannels",
        "channelCoveragePercent",
        "totalOperations",
        "coveredOperations",
        "operationCoveragePercent",
        "totalMessages",
        "coveredMessages",
        "messageCoveragePercent",
        "bindingSupport",
        "declaredSemantics",
        "runtimeSemantics",
        "diagnostics"
      ],
      properties: {
        protocols: {
          type: "array",
          items: { enum: ["kafka", "amqp", "jms"] }
        },
        totalChannels: { type: "integer", minimum: 0 },
        coveredChannels: { type: "integer", minimum: 0 },
        channelCoveragePercent: { anyOf: [{ type: "number" }, { type: "null" }] },
        totalOperations: { type: "integer", minimum: 0 },
        coveredOperations: { type: "integer", minimum: 0 },
        operationCoveragePercent: { anyOf: [{ type: "number" }, { type: "null" }] },
        totalMessages: { type: "integer", minimum: 0 },
        coveredMessages: { type: "integer", minimum: 0 },
        messageCoveragePercent: { anyOf: [{ type: "number" }, { type: "null" }] },
        bindingSupport: {
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
        declaredSemantics: {
          type: "object",
          additionalProperties: false,
          required: ["totalOperations", "operationsWithCorrelationId", "messageCorrelationIds", "operationsWithReply"],
          properties: {
            totalOperations: { type: "integer", minimum: 0 },
            operationsWithCorrelationId: { type: "integer", minimum: 0 },
            messageCorrelationIds: { type: "integer", minimum: 0 },
            operationsWithReply: { type: "integer", minimum: 0 }
          }
        },
        runtimeSemantics: {
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
        diagnostics: {
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
            "mismatched",
            "unmatched"
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
            mismatched: { type: "integer", minimum: 0 },
            unmatched: { type: "integer", minimum: 0 }
          }
        }
      }
    }
  }
} as const;

const COMBINED_REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "generatedAt", "toolVersion", "phase", "status", "overview", "children"],
  properties: {
    schemaVersion: { const: COMBINED_REPORT_SCHEMA_VERSION },
    generatedAt: { type: "string", minLength: 1 },
    toolVersion: { type: "string", minLength: 1 },
    phase: {
      type: "object",
      additionalProperties: false,
      required: ["id", "slug"],
      properties: {
        id: { const: COMBINED_REPORT_PHASE.id },
        slug: { const: COMBINED_REPORT_PHASE.slug }
      }
    },
    status: { enum: ["ok", "partial", "invalid"] },
    overview: {
      type: "object",
      additionalProperties: false,
      required: ["totalChildren", "okChildren", "partialChildren", "invalidChildren", "childStatuses"],
      properties: {
        totalChildren: { const: 2 },
        okChildren: { type: "integer", minimum: 0, maximum: 2 },
        partialChildren: { type: "integer", minimum: 0, maximum: 2 },
        invalidChildren: { type: "integer", minimum: 0, maximum: 2 },
        childStatuses: {
          type: "object",
          additionalProperties: false,
          required: ["http", "async"],
          properties: {
            http: { enum: ["ok", "partial", "invalid"] },
            async: { enum: ["ok", "partial", "invalid"] }
          }
        }
      }
    },
    children: {
      type: "object",
      additionalProperties: false,
      required: ["http", "async"],
      properties: {
        http: HTTP_CHILD_SCHEMA,
        async: ASYNC_CHILD_SCHEMA
      }
    }
  }
} as const;

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  strictTypes: true
});

const validator = ajv.compile(COMBINED_REPORT_SCHEMA);

export function validateCombinedReport(report: unknown): { ok: true } | { ok: false; errors: string[] } {
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
