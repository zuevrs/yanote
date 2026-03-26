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
import {
  ASYNC_REPORT_PHASE,
  ASYNC_REPORT_SCHEMA_VERSION,
  validateAsyncReport,
  type AsyncYanoteReport,
  buildAsyncReport
} from "./asyncReport.js";
import { buildCombinedReport } from "./combinedReport.js";
import { renderCombinedYanoteReportHtml } from "./combinedReportHtml.js";
import { COMBINED_REPORT_PHASE, COMBINED_REPORT_SCHEMA_VERSION, validateCombinedReport } from "./combinedSchema.js";
import { REPORT_SCHEMA_VERSION, validateReport } from "./schema.js";
import { buildReport, type YanoteReport } from "./report.js";

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

describe("combined report contract", () => {
  it("uses a dedicated combined schema and keeps child contracts explicitly attributed", async () => {
    const combined = buildCombinedReport({
      toolVersion: "test",
      http: {
        report: await buildHttpFixtureReport(),
        reportPath: "proof/http/yanote-report.json"
      },
      async: {
        report: await buildAmqpAsyncFixtureReport(),
        reportPath: "proof/async/yanote-async-report.json"
      }
    });

    expect(combined.schemaVersion).toBe(COMBINED_REPORT_SCHEMA_VERSION);
    expect(combined.phase).toEqual(COMBINED_REPORT_PHASE);
    expect(validateCombinedReport(combined)).toEqual({ ok: true });
    expect(validateReport(combined).ok).toBe(false);
    expect(validateAsyncReport(combined).ok).toBe(false);
    expect(combined.children.http.summary.aggregateCoveragePercent).not.toBeUndefined();
    expect(Object.hasOwn(combined.children.async.summary, "aggregateCoveragePercent")).toBe(false);
    expect(combined.children.async.summary.protocols).toEqual(["amqp"]);
    expect(combined.children.async.summary.bindingSupport.totalBindings).toBe(0);
    expect(combined.children.async.summary.runtimeSemantics).toMatchObject({
      totalOperations: 0,
      totalSemantics: 0,
      semanticCoveragePercent: null
    });
  });

  it("renders escaped provenance and child drill-down paths in HTML without collapsing AMQP details into HTTP wording", async () => {
    const httpReport = await buildHttpFixtureReport();
    const asyncReport = await buildAmqpAsyncFixtureReport();
    const unsafeReference = 'fixtures/<unsafe>&"combined".yaml';

    const combined = buildCombinedReport({
      toolVersion: "test",
      http: {
        report: {
          ...httpReport,
          specSource: {
            kind: "local-file",
            reference: unsafeReference
          }
        },
        reportPath: 'proof/http/<unsafe>&"report".json'
      },
      async: {
        report: {
          ...asyncReport,
          specSource: {
            kind: "local-file",
            reference: unsafeReference
          }
        },
        reportPath: 'proof/async/<unsafe>&"report".json'
      }
    });

    const html = renderCombinedYanoteReportHtml(combined);
    expect(html).toContain("Yanote combined report");
    expect(html).toContain("HTTP child summary");
    expect(html).toContain("Async child summary");
    expect(html).toContain("amqp");
    expect(html).toContain("Binding support");
    expect(html).toContain("Runtime semantics");
    expect(html).toContain("proof/http/%3Cunsafe%3E&amp;%22report%22.json");
    expect(html).toContain("fixtures/&lt;unsafe&gt;&amp;&quot;combined&quot;.yaml");
    expect(html).not.toContain(`>${unsafeReference}<`);
  });

  it("rejects invented blended coverage fields or missing child artifact references", async () => {
    const combined = buildCombinedReport({
      toolVersion: "test",
      http: {
        report: await buildHttpFixtureReport(),
        reportPath: "proof/http/yanote-report.json"
      },
      async: {
        report: await buildAmqpAsyncFixtureReport(),
        reportPath: "proof/async/yanote-async-report.json"
      }
    });

    const withBlendedField = {
      ...combined,
      children: {
        ...combined.children,
        async: {
          ...combined.children.async,
          summary: {
            ...combined.children.async.summary,
            aggregateCoveragePercent: 50
          }
        }
      }
    };
    expect(validateCombinedReport(withBlendedField).ok).toBe(false);

    const withMissingArtifactPath = {
      ...combined,
      children: {
        ...combined.children,
        http: {
          ...combined.children.http,
          provenance: {
            ...combined.children.http.provenance,
            artifacts: [
              {
                kind: "json",
                path: ""
              },
              ...combined.children.http.provenance.artifacts.slice(1)
            ]
          }
        }
      }
    };
    expect(validateCombinedReport(withMissingArtifactPath).ok).toBe(false);
  });

  it("documents the child-phase lineage instead of pretending to be either child schema", () => {
    expect(REPORT_SCHEMA_VERSION).toBe("1.0.0");
    expect(ASYNC_REPORT_SCHEMA_VERSION).toBe("1.0.0");
    expect(ASYNC_REPORT_PHASE.id).toBe("03");
    expect(COMBINED_REPORT_PHASE.id).toBe("04");
  });
});
