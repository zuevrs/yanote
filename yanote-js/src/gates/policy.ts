import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { type ExclusionRuleConfig, type GatePolicyConfig, type GateProfile, validateGatePolicyConfig } from "./policy.schema.js";

export type ExclusionPolicyRule = {
  pattern: string;
  rationale: string;
  owner: string;
  expiresOn: string;
  allowBroadWildcard: boolean;
  allowCriticalOverride: boolean;
  source: "policy-file" | "cli";
};

export type GatePolicy = {
  profile: GateProfile;
  thresholds: {
    minCoverage: number;
    warningBand: number;
    aggregate: {
      enabled: boolean;
      minCoverage: number;
      warningBand: number;
    };
    criticalOperations: string[];
  };
  regression: {
    failOnRegression: boolean;
  };
  enforcement: {
    thresholdFailuresAreErrors: boolean;
    regressionFailuresAreErrors: boolean;
  };
  exclusions: {
    rules: ExclusionPolicyRule[];
  };
};

export type ResolveGatePolicyInput = {
  defaultProfile?: GateProfile;
  profile?: GateProfile;
  policyPath?: string;
  cliOverrides?: {
    minCoverage?: number;
    minAggregate?: number | null;
    failOnRegression?: boolean;
    excludePatterns?: string[];
    criticalOperations?: string[];
  };
};

const BASE_CI_POLICY: GatePolicy = {
  profile: "ci",
  thresholds: {
    minCoverage: 95,
    warningBand: 93,
    aggregate: {
      enabled: false,
      minCoverage: 85,
      warningBand: 83
    },
    criticalOperations: []
  },
  regression: {
    failOnRegression: true
  },
  enforcement: {
    thresholdFailuresAreErrors: true,
    regressionFailuresAreErrors: true
  },
  exclusions: {
    rules: []
  }
};

const BASE_LOCAL_POLICY: GatePolicy = {
  profile: "local",
  thresholds: {
    minCoverage: 95,
    warningBand: 93,
    aggregate: {
      enabled: false,
      minCoverage: 85,
      warningBand: 83
    },
    criticalOperations: []
  },
  regression: {
    failOnRegression: false
  },
  enforcement: {
    thresholdFailuresAreErrors: false,
    regressionFailuresAreErrors: false
  },
  exclusions: {
    rules: []
  }
};

export const CI_DEFAULT_POLICY: GatePolicy = clonePolicy(BASE_CI_POLICY);
export const LOCAL_DEFAULT_POLICY: GatePolicy = clonePolicy(BASE_LOCAL_POLICY);

export async function resolveGatePolicy(input: ResolveGatePolicyInput): Promise<GatePolicy> {
  const fileConfig = input.policyPath ? await readAndValidatePolicyFile(input.policyPath) : undefined;

  const effectiveProfile = input.profile ?? fileConfig?.profile ?? input.defaultProfile ?? "ci";
  const base = effectiveProfile === "local" ? clonePolicy(LOCAL_DEFAULT_POLICY) : clonePolicy(CI_DEFAULT_POLICY);

  const withFile = applyConfig(base, fileConfig);
  const withCli = applyCliOverrides(withFile, input.cliOverrides);

  withCli.profile = effectiveProfile;
  withCli.thresholds.warningBand = clampPercent(withCli.thresholds.minCoverage - 2);
  withCli.thresholds.aggregate.warningBand = clampPercent(withCli.thresholds.aggregate.minCoverage - 2);
  withCli.thresholds.criticalOperations = dedupeStrings(withCli.thresholds.criticalOperations);

  return withCli;
}

async function readAndValidatePolicyFile(filePath: string): Promise<GatePolicyConfig> {
  const raw = await readFile(filePath, "utf8");

  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid policy YAML: ${reason}`);
  }

  const validation = validateGatePolicyConfig(parsed);
  if (!validation.ok) {
    throw new Error(`Invalid gate policy config: ${validation.errors.join("; ")}`);
  }

  return validation.value;
}

function applyConfig(base: GatePolicy, config: GatePolicyConfig | undefined): GatePolicy {
  const next = clonePolicy(base);
  if (!config) return next;

  if (typeof config.thresholds?.minCoverage === "number") {
    next.thresholds.minCoverage = clampPercent(config.thresholds.minCoverage);
  }
  if (typeof config.thresholds?.warningBand === "number") {
    next.thresholds.warningBand = clampPercent(config.thresholds.warningBand);
  }
  if (typeof config.thresholds?.aggregateEnabled === "boolean") {
    next.thresholds.aggregate.enabled = config.thresholds.aggregateEnabled;
  }
  if (typeof config.thresholds?.minAggregate === "number") {
    next.thresholds.aggregate.minCoverage = clampPercent(config.thresholds.minAggregate);
  } else if (config.thresholds?.minAggregate === null) {
    next.thresholds.aggregate.enabled = false;
  }
  if (Array.isArray(config.thresholds?.criticalOperations)) {
    next.thresholds.criticalOperations = dedupeStrings([
      ...next.thresholds.criticalOperations,
      ...config.thresholds.criticalOperations.map((value) => value.trim()).filter((value) => value.length > 0)
    ]);
  }

  if (typeof config.regression?.failOnRegression === "boolean") {
    next.regression.failOnRegression = config.regression.failOnRegression;
    next.enforcement.regressionFailuresAreErrors = config.regression.failOnRegression;
  }

  if (Array.isArray(config.exclusions?.rules)) {
    next.exclusions.rules = [...next.exclusions.rules, ...config.exclusions.rules.map(normalizeConfigRule)];
  }

  return next;
}

function applyCliOverrides(
  base: GatePolicy,
  cli: ResolveGatePolicyInput["cliOverrides"] | undefined
): GatePolicy {
  const next = clonePolicy(base);
  if (!cli) return next;

  if (typeof cli.minCoverage === "number") {
    next.thresholds.minCoverage = clampPercent(cli.minCoverage);
    next.enforcement.thresholdFailuresAreErrors = true;
  }
  if (typeof cli.minAggregate === "number") {
    next.thresholds.aggregate.minCoverage = clampPercent(cli.minAggregate);
    next.thresholds.aggregate.enabled = true;
    next.enforcement.thresholdFailuresAreErrors = true;
  } else if (cli.minAggregate === null) {
    next.thresholds.aggregate.enabled = false;
  }
  if (cli.failOnRegression === true) {
    next.regression.failOnRegression = true;
    next.enforcement.regressionFailuresAreErrors = true;
  }

  if (Array.isArray(cli.criticalOperations) && cli.criticalOperations.length > 0) {
    next.thresholds.criticalOperations = dedupeStrings([
      ...next.thresholds.criticalOperations,
      ...cli.criticalOperations.map((value) => value.trim()).filter((value) => value.length > 0)
    ]);
  }

  if (Array.isArray(cli.excludePatterns) && cli.excludePatterns.length > 0) {
    const ruleOverrides: ExclusionPolicyRule[] = cli.excludePatterns
      .map((pattern) => pattern.trim())
      .filter((pattern) => pattern.length > 0)
      .map((pattern) => ({
        pattern,
        rationale: "CLI --exclude override",
        owner: "cli",
        expiresOn: "9999-12-31",
        allowBroadWildcard: false,
        allowCriticalOverride: false,
        source: "cli" as const
      }));
    next.exclusions.rules = [...next.exclusions.rules, ...ruleOverrides];
  }

  return next;
}

function normalizeConfigRule(rule: ExclusionRuleConfig): ExclusionPolicyRule {
  return {
    pattern: rule.pattern.trim(),
    rationale: rule.rationale.trim(),
    owner: rule.owner.trim(),
    expiresOn: (rule.expiresOn ?? rule.reviewOn ?? "").trim(),
    allowBroadWildcard: Boolean(rule.allowBroadWildcard),
    allowCriticalOverride: Boolean(rule.allowCriticalOverride),
    source: "policy-file"
  };
}

function clonePolicy(policy: GatePolicy): GatePolicy {
  return {
    profile: policy.profile,
    thresholds: {
      minCoverage: policy.thresholds.minCoverage,
      warningBand: policy.thresholds.warningBand,
      aggregate: {
        enabled: policy.thresholds.aggregate.enabled,
        minCoverage: policy.thresholds.aggregate.minCoverage,
        warningBand: policy.thresholds.aggregate.warningBand
      },
      criticalOperations: [...policy.thresholds.criticalOperations]
    },
    regression: {
      failOnRegression: policy.regression.failOnRegression
    },
    enforcement: {
      thresholdFailuresAreErrors: policy.enforcement.thresholdFailuresAreErrors,
      regressionFailuresAreErrors: policy.enforcement.regressionFailuresAreErrors
    },
    exclusions: {
      rules: policy.exclusions.rules.map((rule) => ({ ...rule }))
    }
  };
}

function dedupeStrings(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
