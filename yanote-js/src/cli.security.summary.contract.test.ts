import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

function extractSection(output: string, heading: string, nextHeading: string): string {
  return output.split(`${heading}\n`)[1]?.split(`\n\n${nextHeading}\n`)[0] ?? "";
}

describe("cli security summary contract", () => {
  it("prints a dedicated security block, additive machine tokens, and truncated deduped top issues", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "yanote-js-security-summary-"));

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
        "local"
      ]);

      expect(result.code).toBe(5);

      const output = result.stdout;
      const summaryIndex = output.indexOf("Summary\n");
      const dimensionsIndex = output.indexOf("\nCoverage Dimensions\n");
      const payloadIndex = output.indexOf("\nHTTP Payload Conformance\n");
      const requestIndex = output.indexOf("\nHTTP Request Conformance\n");
      const securityIndex = output.indexOf("\nHTTP Security Conformance\n");
      const issuesIndex = output.indexOf("\nTop Issues\n");
      const pathIndex = output.indexOf("\nReport Path\n");
      const machineIndex = output.lastIndexOf("\nYANOTE_SUMMARY ");

      expect(summaryIndex).toBeGreaterThanOrEqual(0);
      expect(dimensionsIndex).toBeGreaterThan(summaryIndex);
      expect(payloadIndex).toBeGreaterThan(dimensionsIndex);
      expect(requestIndex).toBeGreaterThan(payloadIndex);
      expect(securityIndex).toBeGreaterThan(requestIndex);
      expect(issuesIndex).toBeGreaterThan(securityIndex);
      expect(pathIndex).toBeGreaterThan(issuesIndex);
      expect(machineIndex).toBeGreaterThan(pathIndex);

      expect(output).toContain("- operations: 12/12 (100.00%)");
      expect(output).toContain("- status: 100.00% (COVERED)");
      expect(output).toContain("- parameters: N/A (N/A)");
      expect(output).toContain("- aggregate: N/A (N/A); aggregate is N/A because weighted dimensions include N/A");
      expect(output).toContain("- observations: declared=12 observed_operations=12 evaluations=12");
      expect(output).toContain(
        "- truths: satisfied=3 missing=1 unavailable=2 unsupported=4 optional=1 clear=1"
      );
      expect(output).toContain(
        "- diagnostics: satisfied=3 missing=1 unavailable=2 unsupported=4 optional=1 clear=1"
      );

      const issuesSection = extractSection(output, "Top Issues", "Report Path");
      const issueLines = issuesSection.split("\n").filter((line) => line.startsWith("- "));
      expect(issueLines).toEqual([
        "- high: SEMANTIC_HTTP_MISSING_SECURITY - required query apiKey 'api_key' for security scheme 'queryKey' on http GET /or-and-missing was not retained in request evidence.",
        "- high: SEMANTIC_HTTP_UNAVAILABLE_SECURITY - required header apiKey 'X-Api-Key' for security scheme 'headerKey' on http GET /redacted was unavailable for security verification because retained evidence was redacted (reason: sensitive).",
        "- high: SEMANTIC_HTTP_UNAVAILABLE_SECURITY - required query apiKey 'api_key' for security scheme 'queryKey' on http GET /unavailable was unavailable for security verification because retained evidence was omitted (reason: unavailable).",
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - security scheme 'basicAuth' on http GET /unsupported-http uses unsupported OpenAPI security type 'http' within Yanote's truthful apiKey-only subset.",
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - required path apiKey 'secret' for security scheme 'pathKey' on http GET /unsupported-location uses unsupported apiKey location 'path'."
      ]);
      expect(issuesSection).toContain("... +2 more; see report");
      expect(issuesSection).not.toContain("security branch=");
      expect(issuesSection).not.toContain("/optional");
      expect(issuesSection).not.toContain("/clear");

      const lines = output.trimEnd().split("\n");
      const summaryLine = lines.at(-1) ?? "";
      expect(summaryLine.startsWith("YANOTE_SUMMARY ")).toBe(true);
      expect((output.match(/YANOTE_SUMMARY /g) ?? []).length).toBe(1);
      expect(summaryLine).toContain("operations=100.00");
      expect(summaryLine).toContain("status_dimension=100.00");
      expect(summaryLine).toContain("parameters=NA");
      expect(summaryLine).toContain("aggregate=NA");
      expect(summaryLine).toContain("covered=12/12");
      expect(summaryLine).toContain("request_observed_operations=12");
      expect(summaryLine).toContain("request_observed_parameters=0");
      expect(summaryLine).toContain(
        "request_truths=captured_valid:0,captured_invalid:0,redacted:0,omitted:0,unsupported:0"
      );
      expect(summaryLine).toContain("security_declared_operations=12");
      expect(summaryLine).toContain("security_observed_operations=12");
      expect(summaryLine).toContain("security_observed_evaluations=12");
      expect(summaryLine).toContain(
        "security_truths=satisfied:3,missing:1,unavailable:2,unsupported:4,optional:1,clear:1"
      );
      expect(summaryLine).toContain("primary=SEMANTIC_HTTP_MISSING_SECURITY");
      expect(summaryLine).toContain("class_counts=input:0,semantic:7,gate:0,runtime:0");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
