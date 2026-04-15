import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  HTTP_PAYLOAD_OPENAPI_FIXTURE_PATH,
  JMS_ASYNC_EVENTS_FIXTURE_PATH,
  JMS_ASYNCAPI_FIXTURE_PATH
} from "./testFixturePaths.js";
import { runCli } from "./cli.js";

const HTTP_SPEC_PATH = HTTP_PAYLOAD_OPENAPI_FIXTURE_PATH;
const HTTP_EVENTS_PATH = HTTP_PAYLOAD_EVENTS_FIXTURE_PATH;
const AMQP_ASYNC_SPEC_PATH = AMQP_ASYNCAPI_FIXTURE_PATH;
const AMQP_ASYNC_EVENTS_PATH = AMQP_ASYNC_EVENTS_FIXTURE_PATH;
const JMS_ASYNC_SPEC_PATH = JMS_ASYNCAPI_FIXTURE_PATH;
const JMS_ASYNC_EVENTS_PATH = JMS_ASYNC_EVENTS_FIXTURE_PATH;

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
  const bundle = await loadAsyncApiSemanticsBundle(AMQP_ASYNC_SPEC_PATH);
  const events = await readAsyncEventsJsonl(AMQP_ASYNC_EVENTS_PATH);
  const coverage = computeAsyncCoverage(bundle, events.items);

  return buildAsyncReport(coverage, {
    toolVersion: "test",
    specSource: {
      kind: "local-file",
      reference: AMQP_ASYNC_SPEC_PATH
    },
    eventTimestamps: events.items.map((event) => event.ts).filter((timestamp): timestamp is number => typeof timestamp === "number"),
    operationContractsByKey: bundle.operationContractsByKey
  });
}

async function buildJmsAsyncFixtureReport(): Promise<AsyncYanoteReport> {
  const bundle = await loadAsyncApiSemanticsBundle(JMS_ASYNC_SPEC_PATH);
  const events = await readAsyncEventsJsonl(JMS_ASYNC_EVENTS_PATH);
  const coverage = computeAsyncCoverage(bundle, events.items);

  return buildAsyncReport(coverage, {
    toolVersion: "test",
    specSource: {
      kind: "local-file",
      reference: JMS_ASYNC_SPEC_PATH
    },
    eventTimestamps: events.items.map((event) => event.ts).filter((timestamp): timestamp is number => typeof timestamp === "number"),
    operationContractsByKey: bundle.operationContractsByKey
  });
}

async function createCombinedChildFixture(options?: {
  httpReport?: YanoteReport;
  asyncReport?: AsyncYanoteReport;
  removeChildHtmlSiblings?: boolean;
}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-combined-"));
  const httpDir = path.join(dir, "http-child");
  const asyncDir = path.join(dir, "async-child");
  const outDir = path.join(dir, "combined-out");
  const httpReport =
    options?.httpReport ??
    ({
      ...(await buildHttpFixtureReport()),
      status: "ok"
    } satisfies YanoteReport);
  const asyncReport = options?.asyncReport ?? (await buildAsyncFixtureReport());

  const httpReportPath = await writeYanoteReport(httpDir, httpReport);
  const asyncReportPath = await writeAsyncYanoteReport(asyncDir, asyncReport);

  if (options?.removeChildHtmlSiblings) {
    await Promise.all([
      rm(path.join(httpDir, "yanote-report.html"), { force: true }),
      rm(path.join(asyncDir, "yanote-async-report.html"), { force: true })
    ]);
  }

  return {
    dir,
    httpReportPath,
    asyncReportPath,
    outDir
  };
}

describe("cli combined-report", () => {
  it("composes canonical child reports into one combined artifact without requiring child HTML siblings", async () => {
    const fixture = await createCombinedChildFixture({ removeChildHtmlSiblings: true });

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
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("Summary");
      expect(result.stdout).toContain("- status: ok");
      expect(result.stdout).toContain(`- http json: ${fixture.httpReportPath}`);
      expect(result.stdout).toContain(`- async json: ${fixture.asyncReportPath}`);
      expect(result.stdout).toContain(`- http html: ${path.join(path.dirname(fixture.httpReportPath), "yanote-report.html")}`);
      expect(result.stdout).toContain(
        `- async html: ${path.join(path.dirname(fixture.asyncReportPath), "yanote-async-report.html")}`
      );

      const combinedReportPath = path.join(fixture.outDir, "yanote-combined-report.json");
      const summaryLine = result.stdout.trimEnd().split("\n").at(-1) ?? "";
      const combined = JSON.parse(await readFile(combinedReportPath, "utf8"));

      expect(summaryLine.startsWith("YANOTE_COMBINED_SUMMARY ")).toBe(true);
      expect((result.stdout.match(/YANOTE_COMBINED_SUMMARY /g) ?? []).length).toBe(1);
      expect(summaryLine).toContain("status=ok");
      expect(summaryLine).toContain(`http_report=${fixture.httpReportPath}`);
      expect(summaryLine).toContain(`async_report=${fixture.asyncReportPath}`);
      expect(summaryLine).toContain(`report=${combinedReportPath}`);
      expect(summaryLine).toContain("protocols=amqp");
      expect(summaryLine).toContain("primary=none");
      expect(summaryLine).toContain("child=none");
      expect(combined.status).toBe("ok");
      expect(combined.children.http.provenance.artifacts).toContainEqual({ kind: "json", path: fixture.httpReportPath });
      expect(combined.children.async.provenance.artifacts).toContainEqual({ kind: "json", path: fixture.asyncReportPath });
      expect(combined.children.async.summary.protocols).toEqual(["amqp"]);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("composes a JMS async child report without fabricating Kafka-only combined semantics", async () => {
    const fixture = await createCombinedChildFixture({ asyncReport: await buildJmsAsyncFixtureReport() });

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
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("- status: ok");

      const combinedReportPath = path.join(fixture.outDir, "yanote-combined-report.json");
      const summaryLine = result.stdout.trimEnd().split("\n").at(-1) ?? "";
      const combined = JSON.parse(await readFile(combinedReportPath, "utf8"));

      expect(summaryLine).toContain(`report=${combinedReportPath}`);
      expect(summaryLine).toContain("protocols=jms");
      expect(combined.children.async.summary.protocols).toEqual(["jms"]);
      expect(combined.children.async.summary.bindingSupport).toEqual({
        totalOperations: 0,
        totalBindings: 0,
        supportedBindings: 0,
        declaredOnlyBindings: 0,
        deferredBindings: 0,
        invalidBindings: 0
      });
      expect(combined.children.async.summary.runtimeSemantics.totalOperations).toBe(0);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("prints child-attributed top issues when one child report is partial", async () => {
    const fixture = await createCombinedChildFixture({
      httpReport: {
        ...(await buildHttpFixtureReport()),
        status: "partial"
      }
    });

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
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("- status: partial");
      expect(result.stdout).toContain("- http child: partial");
      expect(result.stdout).toContain("Top Issues");
      expect(result.stdout).toContain("- medium: http - status=partial");

      const summaryLine = result.stdout.trimEnd().split("\n").at(-1) ?? "";
      expect(summaryLine).toContain("status=partial");
      expect(summaryLine).toContain("http_status=partial");
      expect(summaryLine).toContain("async_status=ok");
      expect(summaryLine).toContain("primary=none");
      expect(summaryLine).toContain("child=none");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed with an attributed typed input error when the HTTP child report path is missing", async () => {
    const fixture = await createCombinedChildFixture();
    const missingHttpPath = path.join(fixture.dir, "missing-http-child.json");

    try {
      const result = await runCli([
        "combined-report",
        "--report",
        missingHttpPath,
        "--async-report",
        fixture.asyncReportPath,
        "--out",
        fixture.outDir
      ]);

      expect(result.code).toBe(2);
      expect(result.stderr).toContain("YANOTE_COMBINED_ERROR class=input code=INPUT_COMBINED_CHILD_READ_FAILED child=http");
      expect(result.stderr).toContain(`path="${missingHttpPath}"`);
      expect(result.stderr).toContain("report=none");
      expect(result.stdout).toContain("Report Path\nnone");
      expect(result.stdout).toContain("primary=INPUT_COMBINED_CHILD_READ_FAILED");
      expect(result.stdout).toContain("child=http");
      expect(result.stdout).toContain(`- http json: ${missingHttpPath}`);
      expect(result.stdout).toContain(`- async json: ${fixture.asyncReportPath}`);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed with a typed runtime error when the combined output path is not writable as a directory", async () => {
    const fixture = await createCombinedChildFixture();
    const occupiedOutPath = path.join(fixture.dir, "occupied-out-path");
    await writeFile(occupiedOutPath, "not-a-directory", "utf8");

    try {
      const result = await runCli([
        "combined-report",
        "--report",
        fixture.httpReportPath,
        "--async-report",
        fixture.asyncReportPath,
        "--out",
        occupiedOutPath
      ]);

      expect(result.code).toBe(6);
      expect(result.stderr).toContain(
        "YANOTE_COMBINED_ERROR class=runtime code=RUNTIME_COMBINED_REPORT_WRITE_FAILED child=combined"
      );
      expect(result.stderr).toContain("report=none");
      expect(result.stdout).toContain("Report Path\nnone");
      expect(result.stdout).toContain("primary=RUNTIME_COMBINED_REPORT_WRITE_FAILED");
      expect(result.stdout).toContain("child=combined");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});
