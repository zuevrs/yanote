import { describe, expect, it } from "vitest";
import { computeAsyncCoverage } from "../coverage/asyncCoverage.js";
import { computeCoverage } from "../coverage/coverage.js";
import { computeHttpPayloadConformance } from "../coverage/httpPayloadConformance.js";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { loadAsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { loadOpenApiCoverageModel } from "../spec/openapi.js";
import {
  AMQP_ASYNC_EVENTS_FIXTURE_PATH,
  AMQP_ASYNCAPI_FIXTURE_PATH,
  HTTP_PAYLOAD_EVENTS_FIXTURE_PATH,
  HTTP_PAYLOAD_OPENAPI_FIXTURE_PATH
} from "../testFixturePaths.js";
import type { AsyncYanoteReport } from "./asyncReport.js";
import { buildAsyncReport } from "./asyncReport.js";
import { buildCombinedReport, resolveCombinedReportStatus } from "./combinedReport.js";
import type { YanoteReport } from "./report.js";
import { buildReport } from "./report.js";

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

async function buildAmqpAsyncFixtureReport(): Promise<AsyncYanoteReport> {
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

describe("combined report builder", () => {
  it("keeps child attribution explicit and preserves AMQP additive async truth", async () => {
    const httpReport = await buildHttpFixtureReport();
    const asyncReport = await buildAmqpAsyncFixtureReport();

    const combined = buildCombinedReport({
      toolVersion: "test",
      http: {
        report: httpReport,
        reportPath: "fixtures/http/yanote-report.json"
      },
      async: {
        report: asyncReport,
        reportPath: "fixtures/async/yanote-async-report.json"
      }
    });

    expect(combined.overview.childStatuses).toEqual({
      http: httpReport.status,
      async: asyncReport.status
    });
    expect(combined.status).toBe(resolveCombinedReportStatus(httpReport.status, asyncReport.status));
    expect(combined.children.http.provenance.artifacts).toEqual([
      { kind: "json", path: "fixtures/http/yanote-report.json" },
      { kind: "html", path: "fixtures/http/yanote-report.html" }
    ]);
    expect(combined.children.async.provenance.artifacts).toEqual([
      { kind: "json", path: "fixtures/async/yanote-async-report.json" },
      { kind: "html", path: "fixtures/async/yanote-async-report.html" }
    ]);
    expect(combined.children.async.summary.protocols).toEqual(["amqp"]);
    expect(combined.children.async.summary.bindingSupport).toEqual({
      totalOperations: 0,
      totalBindings: 0,
      supportedBindings: 0,
      declaredOnlyBindings: 0,
      deferredBindings: 0,
      invalidBindings: 0
    });
    expect(combined.children.async.summary.runtimeSemantics.totalOperations).toBe(0);
    expect(combined.children.async.summary.runtimeSemantics.semanticCoveragePercent).toBe(null);
    expect(combined.children.http.summary.aggregateCoveragePercent).toBe(httpReport.summary.aggregateCoveragePercent);
    expect(Object.hasOwn(combined.children.async.summary, "aggregateCoveragePercent")).toBe(false);
  });

  it("derives ok, partial, and invalid combined statuses from the child pair without blending child states", async () => {
    const httpReport = await buildHttpFixtureReport();
    const asyncReport = await buildAmqpAsyncFixtureReport();

    const okCombined = buildCombinedReport({
      toolVersion: "test",
      http: { report: { ...httpReport, status: "ok" }, reportPath: "http/ok.json" },
      async: { report: { ...asyncReport, status: "ok" }, reportPath: "async/ok.json" }
    });
    expect(okCombined.status).toBe("ok");
    expect(okCombined.overview).toMatchObject({ okChildren: 2, partialChildren: 0, invalidChildren: 0 });

    const partialCombined = buildCombinedReport({
      toolVersion: "test",
      http: { report: { ...httpReport, status: "partial" }, reportPath: "http/partial.json" },
      async: { report: { ...asyncReport, status: "ok" }, reportPath: "async/ok.json" }
    });
    expect(partialCombined.status).toBe("partial");
    expect(partialCombined.overview).toMatchObject({ okChildren: 1, partialChildren: 1, invalidChildren: 0 });

    const invalidCombined = buildCombinedReport({
      toolVersion: "test",
      http: { report: { ...httpReport, status: "invalid" }, reportPath: "http/invalid.json" },
      async: { report: { ...asyncReport, status: "ok" }, reportPath: "async/ok.json" }
    });
    expect(invalidCombined.status).toBe("invalid");
    expect(invalidCombined.overview).toMatchObject({ okChildren: 1, partialChildren: 0, invalidChildren: 1 });
  });

  it("fails closed on malformed child status values and missing child report paths", async () => {
    const httpReport = await buildHttpFixtureReport();
    const asyncReport = await buildAmqpAsyncFixtureReport();

    expect(() =>
      buildCombinedReport({
        toolVersion: "test",
        http: { report: { ...httpReport, status: "mystery" }, reportPath: "http/report.json" },
        async: { report: asyncReport, reportPath: "async/report.json" }
      })
    ).toThrow(/Invalid http child report schema/);

    expect(() =>
      buildCombinedReport({
        toolVersion: "test",
        http: { report: httpReport, reportPath: "   " },
        async: { report: asyncReport, reportPath: "async/report.json" }
      })
    ).toThrow(/Missing child reportPath/);
  });
});
