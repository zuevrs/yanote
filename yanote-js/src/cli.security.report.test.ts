import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

function extractSection(output: string, heading: string, nextHeading: string): string {
  return output.split(`${heading}\n`)[1]?.split(`\n\n${nextHeading}\n`)[0] ?? "";
}

describe("cli security report", () => {
  it("surfaces additive security truth through stdout, stderr, and yanote-report.json without leaking secrets", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "yanote-js-security-report-"));

    try {
      const result = await runCli([
        "report",
        "--spec",
        "test/fixtures/openapi/http-security-api-key.yaml",
        "--events",
        "test/fixtures/events/http-security-api-key.fixture.jsonl",
        "--out",
        outDir,
        "--profile",
        "local",
        "--verbose"
      ]);

      expect(result.code).toBe(5);
      expect(result.stdout).toContain("- status: partial");
      expect(result.stdout).toContain("- operations: 12/12 (100.00%)");
      expect(result.stdout).toContain("- status: 100.00% (COVERED)");
      expect(result.stdout).toContain("- parameters: N/A (N/A)");
      expect(result.stdout).toContain("- aggregate: N/A (N/A); aggregate is N/A because weighted dimensions include N/A");
      expect(result.stdout).toContain("HTTP Security Conformance");
      expect(result.stdout).toContain("- observations: declared=12 observed_operations=12 evaluations=12");
      expect(result.stdout).toContain(
        "- truths: satisfied=3 missing=1 unavailable=2 unsupported=4 optional=1 clear=1"
      );
      expect(result.stdout).toContain(
        "- diagnostics: satisfied=3 missing=1 unavailable=2 unsupported=4 optional=1 clear=1"
      );

      const issuesSection = extractSection(result.stdout, "Top Issues", "Report Path");
      const issueLines = issuesSection.split("\n").filter((line) => line.startsWith("- "));
      expect(issueLines).toEqual([
        "- high: SEMANTIC_HTTP_MISSING_SECURITY - required query apiKey 'api_key' for security scheme 'queryKey' on http GET /or-and-missing was not retained in request evidence.",
        "- high: SEMANTIC_HTTP_UNAVAILABLE_SECURITY - required header apiKey 'X-Api-Key' for security scheme 'headerKey' on http GET /redacted was unavailable for security verification because retained evidence was redacted (reason: sensitive).",
        "- high: SEMANTIC_HTTP_UNAVAILABLE_SECURITY - required query apiKey 'api_key' for security scheme 'queryKey' on http GET /unavailable was unavailable for security verification because retained evidence was omitted (reason: unavailable).",
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - security scheme 'basicAuth' on http GET /unsupported-http uses unsupported OpenAPI security type 'http' within Yanote's truthful apiKey-only subset.",
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - required path apiKey 'secret' for security scheme 'pathKey' on http GET /unsupported-location uses unsupported apiKey location 'path'.",
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - security scheme 'oauthKey' on http GET /unsupported-oauth uses unsupported OpenAPI security type 'oauth2' within Yanote's truthful apiKey-only subset.",
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - security scheme 'oidcAuth' on http GET /unsupported-openid uses unsupported OpenAPI security type 'openIdConnect' within Yanote's truthful apiKey-only subset."
      ]);
      expect(issuesSection).not.toContain("security branch=");
      expect(issuesSection).not.toContain("/optional");
      expect(issuesSection).not.toContain("/clear");

      const stderrLines = result.stderr.trim().split("\n");
      expect(stderrLines).toHaveLength(7);
      expect(stderrLines[0]).toContain("YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_MISSING_SECURITY");
      expect(stderrLines[1]).toContain("YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNAVAILABLE_SECURITY");
      expect(stderrLines[2]).toContain("YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNAVAILABLE_SECURITY");
      expect(stderrLines[3]).toContain("YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SECURITY");

      const summaryLine = result.stdout.trimEnd().split("\n").at(-1) ?? "";
      expect(summaryLine.startsWith("YANOTE_SUMMARY ")).toBe(true);
      expect(summaryLine).toContain("operations=100.00");
      expect(summaryLine).toContain("status_dimension=100.00");
      expect(summaryLine).toContain("parameters=NA");
      expect(summaryLine).toContain("aggregate=NA");
      expect(summaryLine).toContain("covered=12/12");
      expect(summaryLine).toContain("request_observed_operations=12");
      expect(summaryLine).toContain("security_declared_operations=12");
      expect(summaryLine).toContain("security_observed_operations=12");
      expect(summaryLine).toContain("security_observed_evaluations=12");
      expect(summaryLine).toContain(
        "security_truths=satisfied:3,missing:1,unavailable:2,unsupported:4,optional:1,clear:1"
      );
      expect(summaryLine).toContain("primary=SEMANTIC_HTTP_MISSING_SECURITY");
      expect(summaryLine).toContain("class_counts=input:0,semantic:7,gate:0,runtime:0");

      const report = JSON.parse(await readFile(path.join(outDir, "yanote-report.json"), "utf8"));
      expect(report.coverage.operations).toEqual({ state: "COVERED", percent: 100 });
      expect(report.coverage.status).toEqual({ state: "COVERED", percent: 100 });
      expect(report.coverage.parameters).toEqual({ state: "N/A", percent: null });
      expect(report.httpSecurityConformance.summary).toEqual({
        declaredOperations: 12,
        observedOperations: 12,
        observedEvaluations: 12,
        counts: {
          satisfied: 3,
          missing: 1,
          unavailable: 2,
          unsupported: 4,
          optional: 1,
          clear: 1
        }
      });
      expect(report.governance.diagnostics.map((item: { code: string }) => item.code)).toEqual([
        "SEMANTIC_HTTP_MISSING_SECURITY",
        "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
        "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
        "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
        "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
        "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
        "SEMANTIC_HTTP_UNSUPPORTED_SECURITY"
      ]);

      for (const secret of [
        "header-secret-123",
        "query-secret-456",
        "header-and-789",
        "query-and-789",
        "Basic dXNlcjpzZWNyZXQ=",
        "oauth-secret",
        "oidc-secret",
        "path-secret-xyz"
      ]) {
        expect(result.stdout).not.toContain(secret);
        expect(result.stderr).not.toContain(secret);
      }
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
