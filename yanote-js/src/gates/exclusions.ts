import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";
import type { ExclusionPolicyRule } from "./policy.js";

export type CompiledExclusionRule = Omit<ExclusionPolicyRule, "source"> & {
  id: string;
  source: ExclusionPolicyRule["source"];
  matcher: (route: string) => boolean;
};

export type AppliedExclusionRule = Omit<CompiledExclusionRule, "matcher"> & {
  matchedOperationKeys: string[];
  matchedOperationCount: number;
  usedCriticalOverride: boolean;
};

export type UnmatchedExclusionRuleWarning = Omit<CompiledExclusionRule, "matcher"> & {
  message: string;
};

export type ExclusionApplicationResult = {
  includedOperations: OperationKey[];
  excludedOperations: OperationKey[];
  appliedExclusions: AppliedExclusionRule[];
  unmatchedRules: UnmatchedExclusionRuleWarning[];
  diagnostics: string[];
};

export function compileExclusionRules(rules: ExclusionPolicyRule[]): CompiledExclusionRule[] {
  return rules.map((rule, index) => {
    validateRule(rule, index);
    const id = `rule-${index + 1}`;
    const pattern = rule.pattern.trim();
    const regex = buildWildcardRegex(pattern);
    return {
      id,
      pattern,
      rationale: rule.rationale.trim(),
      owner: rule.owner.trim(),
      expiresOn: rule.expiresOn.trim(),
      allowBroadWildcard: Boolean(rule.allowBroadWildcard),
      allowCriticalOverride: Boolean(rule.allowCriticalOverride),
      source: rule.source,
      matcher: (route: string) => regex.test(route)
    };
  });
}

export function applyExclusionRules(
  operations: OperationKey[],
  rules: CompiledExclusionRule[],
  options: { criticalOperationKeys?: string[] } = {}
): ExclusionApplicationResult {
  const criticalOperationKeys = new Set(options.criticalOperationKeys ?? []);
  const includedOperations: OperationKey[] = [];
  const excludedOperations: OperationKey[] = [];
  const diagnostics: string[] = [];

  const matchedByRule = new Map<string, Set<string>>();
  const usedCriticalOverrideByRule = new Set<string>();

  for (const operation of operations) {
    if (operation.kind !== "http") {
      includedOperations.push(operation);
      continue;
    }

    const operationKey = serializeOperationKey(operation);
    let excluded = false;
    for (const rule of rules) {
      if (!rule.matcher(operation.route)) continue;

      if (criticalOperationKeys.has(operationKey) && !rule.allowCriticalOverride) {
        diagnostics.push(
          `Critical operation ${operationKey} matched exclusion pattern ${rule.pattern} but allowCriticalOverride is false.`
        );
        continue;
      }

      if (criticalOperationKeys.has(operationKey) && rule.allowCriticalOverride) {
        usedCriticalOverrideByRule.add(rule.id);
      }

      if (!matchedByRule.has(rule.id)) {
        matchedByRule.set(rule.id, new Set<string>());
      }
      matchedByRule.get(rule.id)?.add(operationKey);
      excludedOperations.push(operation);
      excluded = true;
      break;
    }

    if (!excluded) {
      includedOperations.push(operation);
    }
  }

  const appliedExclusions: AppliedExclusionRule[] = [];
  const unmatchedRules: UnmatchedExclusionRuleWarning[] = [];

  for (const rule of rules) {
    const matched = Array.from(matchedByRule.get(rule.id) ?? []).sort((left, right) => left.localeCompare(right));
    if (matched.length > 0) {
      appliedExclusions.push({
        id: rule.id,
        pattern: rule.pattern,
        rationale: rule.rationale,
        owner: rule.owner,
        expiresOn: rule.expiresOn,
        allowBroadWildcard: rule.allowBroadWildcard,
        allowCriticalOverride: rule.allowCriticalOverride,
        source: rule.source,
        matchedOperationKeys: matched,
        matchedOperationCount: matched.length,
        usedCriticalOverride: usedCriticalOverrideByRule.has(rule.id)
      });
      continue;
    }

    unmatchedRules.push({
      id: rule.id,
      pattern: rule.pattern,
      rationale: rule.rationale,
      owner: rule.owner,
      expiresOn: rule.expiresOn,
      allowBroadWildcard: rule.allowBroadWildcard,
      allowCriticalOverride: rule.allowCriticalOverride,
      source: rule.source,
      message: `Exclusion pattern ${rule.pattern} matched zero operations.`
    });
  }

  return {
    includedOperations: sortOperationsByKey(includedOperations),
    excludedOperations: sortOperationsByKey(excludedOperations),
    appliedExclusions,
    unmatchedRules,
    diagnostics: diagnostics.sort((left, right) => left.localeCompare(right))
  };
}

function validateRule(rule: ExclusionPolicyRule, index: number): void {
  if (!rule.pattern || !rule.pattern.trim()) {
    throw new Error(`Invalid exclusion rule #${index + 1}: pattern is required.`);
  }
  if (!rule.rationale || !rule.rationale.trim()) {
    throw new Error(`Invalid exclusion rule #${index + 1}: rationale is required.`);
  }
  if (!rule.owner || !rule.owner.trim()) {
    throw new Error(`Invalid exclusion rule #${index + 1}: owner is required.`);
  }
  if (!rule.expiresOn || !rule.expiresOn.trim()) {
    throw new Error(`Invalid exclusion rule #${index + 1}: expiresOn/reviewOn is required.`);
  }
  if (isBroadWildcardPattern(rule.pattern) && !rule.allowBroadWildcard) {
    throw new Error(
      `Invalid exclusion rule #${index + 1}: broad wildcard pattern ${rule.pattern} requires allowBroadWildcard=true.`
    );
  }
}

function isBroadWildcardPattern(pattern: string): boolean {
  if (!pattern.includes("*")) return false;
  const literal = pattern.replace(/\*/g, "").replace(/[\/{}:._-]/g, "").trim();
  return literal.length === 0;
}

function buildWildcardRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function sortOperationsByKey(operations: OperationKey[]): OperationKey[] {
  return [...operations].sort((left, right) => {
    const leftKey = serializeOperationKey(left);
    const rightKey = serializeOperationKey(right);
    return leftKey.localeCompare(rightKey);
  });
}
