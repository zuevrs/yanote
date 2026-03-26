import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeAsyncCoverage } from "./coverage/asyncCoverage.js";
import { computeCoverage } from "./coverage/coverage.js";
import { computeHttpPayloadConformance } from "./coverage/httpPayloadConformance.js";
import { readAsyncEventsJsonl } from "./events/readAsyncEventsJsonl.js";
import { readHttpEventsJsonl } from "./events/readJsonl.js";
import { buildAsyncReport, type AsyncYanoteReport } from "./report/asyncReport.js";
import { type YanoteReport, buildReport } from "./report/report.js";
import { writeAsyncYanoteReport } from "./report/writeAsyncReport.js";
import { writeYanoteReport } from "./report/writeReport.js";
import { loadAsyncApiSemanticsBundle } from "./spec/asyncapi.js";
import { loadOpenApiCoverageModel } from "./spec/openapi.js";
import {
  AMQP_ASYNC_EVENTS_FIXTURE_PATH,
  AMQP_ASYNCAPI_FIXTURE_PATH,
  HTTP_PAYLOAD_EVENTS_FIXTURE_PATH,
  HTTP_PAYLOAD_OPENAPI_FIXTURE_PATH
} from "./testFixturePaths.js";
import { runCli } from "./cli.js";

const HTTP_SPEC_PATH = HTTP_PAYLOAD_OPENAPI_FIXTURE_PATH;
const HTTP_EVENTS_PATH = HTTP_PAYLOAD_EVENTS_FIXTURE_PATH;
const ASYNC_SPEC_PATH = AMQP_ASYNCAPI_FIXTURE_PATH;
const ASYNC_EVENTS_PATH = AMQP_ASYNC_EVENTS_FIXTURE_PATH;

async function buildHttpFixtureReport(): Promise<YanoteReport> {
  const model = await loadOpenApiCoverageModel(HTTP_SPEC_PATH);
  const events = await readHttpEventsJsonl(HTTP_EVENTS_PATH);
  const coverage = computeCoverage(model.operations, events.items, [], {
    operationContractsByKey: model.operationContractsByKey
  });
  const payloadConformance = computeHttpPayloadConformance(model.operations, events.items, {
    operationContractsByKey: model.operationContractsByKey
  });

  return buildReport(coverage, {
    toolVersion: "test",
    specSource: {
      kind: "local-file",
      reference: HTTP_SPEC_PATH
    },
    eventTimestamps: events.items.map((event) => event.ts).filter((timestamp): timestamp is number => typeof timestamp === "number"),
    payloadConformance
  });
}

async function buildAsyncFixtureReport(): Promise<AsyncYanoteReport> {
  const bundle = await loadAsyncApiSemanticsBundle(ASYNC_SPEC_PATH);
  const events = await readAsyncEventsJsonl(ASYNC_EVENTS_PATH);
  const coverage = computeAsyncCoverage(bundle, events.items);

  return buildAsyncReport(coverage, {
    toolVersion: "test",
    specSource: {
      kind: "local-file",
      reference: ASYNC_SPEC_PATH
    },
    eventTimestamps: events.items.map((event) => event.ts).filter((timestamp): timestamp is number => typeof timestamp === "number"),
    operationContractsByKey: bundle.operationContractsByKey
  });
}

async function createCombinedChildFixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-combined-contract-"));
  const httpDir = path.join(dir, "http-child");
  const asyncDir = path.join(dir, "async-child");
  const outDir = path.join(dir, "combined-out");
  const httpReportPath = await writeYanoteReport(
    httpDir,
    {
      ...(await buildHttpFixtureReport()),
      status: "ok"
    }
  );
  const asyncReportPath = await writeAsyncYanoteReport(asyncDir, await buildAsyncFixtureReport());

  return {
    dir,
    httpReportPath,
    asyncReportPath,
    outDir
  };
}

describe("cli combined-report contract", () => {
  it("prints fixed section order, plain text, and one final combined machine summary line", async () => {
    const fixture = await createCombinedChildFixture();

    try {
      const result = await runCli([
        "combined-report",
        "--report",
        fixture.httpReportPath,
        "--async-report",
        fixture.asyncReportPath,
        "--out",
        fixture.outDir
      ]);
      expect(result.code).toBe(0);

      const output = result.stdout;
      const summaryIndex = output.indexOf("Summary\n");
      const httpIndex = output.indexOf("\nHTTP Child\n");
      const asyncIndex = output.indexOf("\nAsync Child\n");
      const issuesIndex = output.indexOf("\nTop Issues\n");
      const childReportsIndex = output.indexOf("\nChild Reports\n");
      const pathIndex = output.indexOf("\nReport Path\n");
      const machineIndex = output.lastIndexOf("\nYANOTE_COMBINED_SUMMARY ");

      expect(summaryIndex).toBeGreaterThanOrEqual(0);
      expect(httpIndex).toBeGreaterThan(summaryIndex);
      expect(asyncIndex).toBeGreaterThan(httpIndex);
      expect(issuesIndex).toBeGreaterThan(asyncIndex);
      expect(childReportsIndex).toBeGreaterThan(issuesIndex);
      expect(pathIndex).toBeGreaterThan(childReportsIndex);
      expect(machineIndex).toBeGreaterThan(pathIndex);

      const summaryLine = output.trimEnd().split("\n").at(-1) ?? "";
      const combinedReportPath = path.join(fixture.outDir, "yanote-combined-report.json");
      const reportPathSection = output.split("\nReport Path\n")[1]?.split("\n\nYANOTE_COMBINED_SUMMARY ")[0]?.trim();

      expect(summaryLine.startsWith("YANOTE_COMBINED_SUMMARY ")).toBe(true);
      expect((output.match(/YANOTE_COMBINED_SUMMARY /g) ?? []).length).toBe(1);
      expect(output).toContain("- protocols: amqp");
      expect(output).toContain(`- http json: ${fixture.httpReportPath}`);
      expect(output).toContain(`- async json: ${fixture.asyncReportPath}`);
      expect(output).not.toMatch(/\u001b\[[0-9;]*m/);
      expect(reportPathSection).toBe(combinedReportPath);
      expect(summaryLine).toContain(`http_report=${fixture.httpReportPath}`);
      expect(summaryLine).toContain(`async_report=${fixture.asyncReportPath}`);
      expect(summaryLine).toContain(`report=${combinedReportPath}`);
      expect(summaryLine).toContain("http_status=ok");
      expect(summaryLine).toContain("async_status=ok");
      expect(summaryLine).toContain("primary=none");
      expect(summaryLine).toContain("child=none");
      expect(summaryLine).not.toContain("yanote-combined-report.html");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("keeps one primary combined error line and deterministic secondary ordering when the child file types are swapped", async () => {
    const fixture = await createCombinedChildFixture();

    try {
      const result = await runCli([
        "combined-report",
        "--report",
        fixture.asyncReportPath,
        "--async-report",
        fixture.httpReportPath,
        "--out",
        fixture.outDir
      ]);

      expect(result.code).toBe(2);
      const stderrLines = result.stderr.trim().split("\n");
      expect(stderrLines[0]).toContain(
        `YANOTE_COMBINED_ERROR class=input code=INPUT_COMBINED_CHILD_SCHEMA_INVALID child=http path="${fixture.asyncReportPath}" report=none`
      );
      expect(stderrLines[1]).toContain(
        `YANOTE_COMBINED_ERROR_SECONDARY class=input code=INPUT_COMBINED_CHILD_SCHEMA_INVALID child=async path="${fixture.httpReportPath}" report=none`
      );
      expect(stderrLines.filter((line) => line.startsWith("YANOTE_COMBINED_ERROR "))).toHaveLength(1);
      expect(result.stdout).toContain("primary=INPUT_COMBINED_CHILD_SCHEMA_INVALID");
      expect(result.stdout).toContain("child=http");
      expect(result.stdout.trimEnd().split("\n").at(-1)?.startsWith("YANOTE_COMBINED_SUMMARY ")).toBe(true);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("keeps child attribution and report=none visible on malformed JSON input failures", async () => {
    const fixture = await createCombinedChildFixture();
    const invalidHttpPath = path.join(fixture.dir, "invalid-http-child.json");
    await writeFile(invalidHttpPath, "{not-json", "utf8");

    try {
      const result = await runCli([
        "combined-report",
        "--report",
        invalidHttpPath,
        "--async-report",
        fixture.asyncReportPath,
        "--out",
        fixture.outDir
      ]);

      expect(result.code).toBe(2);
      expect(result.stderr).toContain(
        `YANOTE_COMBINED_ERROR class=input code=INPUT_COMBINED_CHILD_JSON_INVALID child=http path="${invalidHttpPath}" report=none`
      );
      expect(result.stdout).toContain(`- http json: ${invalidHttpPath}`);
      expect(result.stdout).toContain(`- async json: ${fixture.asyncReportPath}`);
      expect(result.stdout).toContain("Report Path\nnone");
      expect(result.stdout).toContain("primary=INPUT_COMBINED_CHILD_JSON_INVALID");
      expect(result.stdout).toContain("child=http");
      expect((result.stdout.match(/YANOTE_COMBINED_SUMMARY /g) ?? []).length).toBe(1);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});
