import Ajv, { type ErrorObject } from "ajv";

export type GateProfile = "ci" | "local";

export type ExclusionRuleConfig = {
  pattern: string;
  rationale: string;
  owner: string;
  expiresOn?: string;
  reviewOn?: string;
  allowBroadWildcard?: boolean;
  allowCriticalOverride?: boolean;
};

export type GatePolicyConfig = {
  profile?: GateProfile;
  thresholds?: {
    minCoverage?: number;
    aggregateEnabled?: boolean;
    minAggregate?: number | null;
    warningBand?: number;
    criticalOperations?: string[];
  };
  regression?: {
    failOnRegression?: boolean;
  };
  exclusions?: {
    rules?: ExclusionRuleConfig[];
  };
};

export const GATE_POLICY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    profile: { enum: ["ci", "local"] },
    thresholds: {
      type: "object",
      additionalProperties: false,
      properties: {
        minCoverage: { type: "number", minimum: 0, maximum: 100 },
        aggregateEnabled: { type: "boolean" },
        minAggregate: { anyOf: [{ type: "number", minimum: 0, maximum: 100 }, { type: "null" }] },
        warningBand: { type: "number", minimum: 0, maximum: 100 },
        criticalOperations: {
          type: "array",
          items: { type: "string", minLength: 1 }
        }
      }
    },
    regression: {
      type: "object",
      additionalProperties: false,
      properties: {
        failOnRegression: { type: "boolean" }
      }
    },
    exclusions: {
      type: "object",
      additionalProperties: false,
      properties: {
        rules: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["pattern", "rationale", "owner"],
            anyOf: [{ required: ["expiresOn"] }, { required: ["reviewOn"] }],
            properties: {
              pattern: { type: "string", minLength: 1 },
              rationale: { type: "string", minLength: 1 },
              owner: { type: "string", minLength: 1 },
              expiresOn: { type: "string", minLength: 1 },
              reviewOn: { type: "string", minLength: 1 },
              allowBroadWildcard: { type: "boolean" },
              allowCriticalOverride: { type: "boolean" }
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
  strictTypes: true,
  strictRequired: false
});

const validator = ajv.compile(GATE_POLICY_SCHEMA);

export function validateGatePolicyConfig(value: unknown): { ok: true; value: GatePolicyConfig } | { ok: false; errors: string[] } {
  const valid = validator(value);
  if (valid) {
    return { ok: true, value: value as GatePolicyConfig };
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
