import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CI_DEFAULT_POLICY, LOCAL_DEFAULT_POLICY, resolveGatePolicy } from "./policy.js";

async function withTempPolicy(content: string, run: (filePath: string) => Promise<void>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-policy-"));
  const filePath = path.join(dir, "gate-policy.yaml");
  try {
    await writeFile(filePath, content, "utf8");
    await run(filePath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("gate policy resolver", () => {
  it("keeps explicit and stable CI defaults", async () => {
    const policy = await resolveGatePolicy({ defaultProfile: "ci" });

    expect(CI_DEFAULT_POLICY.profile).toBe("ci");
    expect(CI_DEFAULT_POLICY.thresholds.minCoverage).toBe(95);
    expect(CI_DEFAULT_POLICY.thresholds.aggregate.minCoverage).toBe(85);
    expect(policy.thresholds.warningBand).toBe(93);
    expect(policy.thresholds.aggregate.warningBand).toBe(83);
    expect(policy.enforcement.thresholdFailuresAreErrors).toBe(true);
  });

  it("supports local profile with softer enforcement defaults", async () => {
    const policy = await resolveGatePolicy({ profile: "local" });

    expect(LOCAL_DEFAULT_POLICY.profile).toBe("local");
    expect(policy.enforcement.thresholdFailuresAreErrors).toBe(false);
    expect(policy.enforcement.regressionFailuresAreErrors).toBe(false);
  });

  it("resolves precedence as cli > policy file > defaults", async () => {
    await withTempPolicy(
      [
        "profile: ci",
        "thresholds:",
        "  minCoverage: 90",
        "  aggregateEnabled: true",
        "  minAggregate: 70",
        "  criticalOperations:",
        "    - http GET /orders/{param}",
        "regression:",
        "  failOnRegression: false",
        "exclusions:",
        "  rules:",
        "    - pattern: /internal/*",
        "      rationale: Internal rollout",
        "      owner: governance",
        "      expiresOn: 2099-01-01"
      ].join("\n"),
      async (policyPath) => {
        const policy = await resolveGatePolicy({
          policyPath,
          cliOverrides: {
            minCoverage: 97,
            minAggregate: 88,
            failOnRegression: true,
            excludePatterns: ["/cli/*"]
          }
        });

        expect(policy.thresholds.minCoverage).toBe(97);
        expect(policy.thresholds.aggregate.enabled).toBe(true);
        expect(policy.thresholds.aggregate.minCoverage).toBe(88);
        expect(policy.regression.failOnRegression).toBe(true);
        expect(policy.exclusions.rules).toHaveLength(2);
        expect(policy.exclusions.rules[0]).toMatchObject({
          pattern: "/internal/*",
          source: "policy-file"
        });
        expect(policy.exclusions.rules[1]).toMatchObject({
          pattern: "/cli/*",
          source: "cli"
        });
      }
    );
  });

  it("fails with actionable diagnostics for invalid policy shape", async () => {
    await withTempPolicy(
      [
        "exclusions:",
        "  rules:",
        "    - pattern: /internal/*",
        "      owner: governance",
        "      expiresOn: 2099-01-01"
      ].join("\n"),
      async (policyPath) => {
        await expect(resolveGatePolicy({ policyPath })).rejects.toThrow("Invalid gate policy config");
      }
    );
  });
});
