import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
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
import { buildAsyncReport, type AsyncYanoteReport } from "./asyncReport.js";
import { buildCombinedReport, type CombinedYanoteReport } from "./combinedReport.js";
import { buildReport, type YanoteReport } from "./report.js";
import { writeCombinedYanoteReport } from "./writeCombinedReport.js";

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

function disorderReport(report: CombinedYanoteReport): CombinedYanoteReport {
  return {
    ...report,
    children: {
      http: {
        ...report.children.http,
        issues: [...report.children.http.issues].reverse(),
        provenance: {
          ...report.children.http.provenance,
          artifacts: [...report.children.http.provenance.artifacts].reverse()
        }
      },
      async: {
        ...report.children.async,
        issues: [...report.children.async.issues].reverse(),
        provenance: {
          ...report.children.async.provenance,
          artifacts: [...report.children.async.provenance.artifacts].reverse()
        },
        summary: {
          ...report.children.async.summary,
          protocols: [...report.children.async.summary.protocols].reverse()
        }
      }
    }
  };
}

describe("writeCombinedYanoteReport determinism", () => {
  it("writes stable combined JSON and HTML artifacts from canonical child reports", async () => {
    const base = buildCombinedReport({
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

    const report = disorderReport(base);
    const firstDir = await mkdtemp(path.join(os.tmpdir(), "yanote-combined-report-1-"));
    const secondDir = await mkdtemp(path.join(os.tmpdir(), "yanote-combined-report-2-"));

    try {
      const firstPath = await writeCombinedYanoteReport(firstDir, report);
      const secondPath = await writeCombinedYanoteReport(secondDir, report);
      expect(path.basename(firstPath)).toBe("yanote-combined-report.json");
      expect(path.basename(secondPath)).toBe("yanote-combined-report.json");

      const [firstJson, secondJson, firstHtml, secondHtml] = await Promise.all([
        readFile(firstPath, "utf8"),
        readFile(secondPath, "utf8"),
        readFile(path.join(firstDir, "yanote-combined-report.html"), "utf8"),
        readFile(path.join(secondDir, "yanote-combined-report.html"), "utf8")
      ]);

      expect(firstJson).toBe(secondJson);
      expect(firstHtml).toBe(secondHtml);
      expect(firstJson).toContain('"kind": "json"');
      expect(firstJson).toContain('"protocols": [');
      expect(firstJson).toContain('"amqp"');
    } finally {
      await Promise.all([
        rm(firstDir, { recursive: true, force: true }),
        rm(secondDir, { recursive: true, force: true })
      ]);
    }
  });

  it("fails closed instead of emitting partial artifacts when the combined schema is malformed", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "yanote-combined-report-invalid-"));
    const report = buildCombinedReport({
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

    const invalid = {
      ...report,
      children: {
        ...report.children,
        http: {
          ...report.children.http,
          provenance: {
            ...report.children.http.provenance,
            artifacts: [
              {
                kind: "json",
                path: ""
              },
              ...report.children.http.provenance.artifacts.slice(1)
            ]
          }
        }
      }
    } as CombinedYanoteReport;

    try {
      await expect(writeCombinedYanoteReport(outDir, invalid)).rejects.toThrow(/Invalid combined report schema/);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
