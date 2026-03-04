import { describe, expect, it } from "vitest";
import type { OperationKey } from "../model/operationKey.js";
import { compileExclusionRules, applyExclusionRules } from "./exclusions.js";
import type { ExclusionPolicyRule } from "./policy.js";

const operations: OperationKey[] = [
  { kind: "http", method: "GET", route: "/health" },
  { kind: "http", method: "GET", route: "/users/{param}" },
  { kind: "http", method: "POST", route: "/users" }
];

describe("exclusion rule engine", () => {
  it("requires rationale/owner/expiry metadata", () => {
    const invalidRule = {
      pattern: "/users/*",
      rationale: "",
      owner: "security",
      expiresOn: "2099-01-01",
      allowBroadWildcard: false,
      allowCriticalOverride: false,
      source: "policy-file"
    } as ExclusionPolicyRule;

    expect(() => compileExclusionRules([invalidRule])).toThrow("rationale is required");
  });

  it("rejects broad wildcard rules without explicit override", () => {
    const broadRule = {
      pattern: "*",
      rationale: "temporary",
      owner: "governance",
      expiresOn: "2099-01-01",
      allowBroadWildcard: false,
      allowCriticalOverride: false,
      source: "policy-file"
    } as ExclusionPolicyRule;

    expect(() => compileExclusionRules([broadRule])).toThrow("allowBroadWildcard=true");
  });

  it("emits grouped applied exclusions and unmatched-rule diagnostics deterministically", () => {
    const rules: ExclusionPolicyRule[] = [
      {
        pattern: "/users/*",
        rationale: "Internal beta route",
        owner: "governance",
        expiresOn: "2099-01-01",
        allowBroadWildcard: false,
        allowCriticalOverride: false,
        source: "policy-file"
      },
      {
        pattern: "/never/*",
        rationale: "No-op rule to ensure stale detection",
        owner: "governance",
        expiresOn: "2099-01-01",
        allowBroadWildcard: false,
        allowCriticalOverride: false,
        source: "policy-file"
      }
    ];

    const compiled = compileExclusionRules(rules);
    const applied = applyExclusionRules(operations, compiled);

    expect(applied.appliedExclusions).toHaveLength(1);
    expect(applied.appliedExclusions[0].pattern).toBe("/users/*");
    expect(applied.appliedExclusions[0].matchedOperationKeys).toEqual(["http GET /users/{param}"]);
    expect(applied.unmatchedRules).toHaveLength(1);
    expect(applied.unmatchedRules[0].pattern).toBe("/never/*");
    expect(applied.includedOperations.map((op) => `${op.kind}:${(op as any).route ?? ""}`)).toEqual([
      "http:/health",
      "http:/users"
    ]);
  });

  it("protects critical operations unless explicit per-rule override is present", () => {
    const criticalOperation = "http GET /users/{param}";
    const baseRule: ExclusionPolicyRule = {
      pattern: "/users/*",
      rationale: "Cleanup",
      owner: "governance",
      expiresOn: "2099-01-01",
      allowBroadWildcard: false,
      allowCriticalOverride: false,
      source: "policy-file"
    };

    const withoutOverride = applyExclusionRules(operations, compileExclusionRules([baseRule]), {
      criticalOperationKeys: [criticalOperation]
    });
    expect(withoutOverride.excludedOperations.map((op) => `${op.kind}:${(op as any).route ?? ""}`)).toEqual([]);
    expect(withoutOverride.diagnostics.join("\n")).toContain("allowCriticalOverride is false");

    const withOverride = applyExclusionRules(
      operations,
      compileExclusionRules([{ ...baseRule, allowCriticalOverride: true }]),
      {
        criticalOperationKeys: [criticalOperation]
      }
    );
    expect(withOverride.excludedOperations.map((op) => `${op.kind}:${(op as any).route ?? ""}`)).toEqual(["http:/users/{param}"]);
    expect(withOverride.appliedExclusions[0].usedCriticalOverride).toBe(true);
  });
});
