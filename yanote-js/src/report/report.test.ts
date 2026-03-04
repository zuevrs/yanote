import { describe, expect, it } from "vitest";
import { computeCoverage } from "../coverage/coverage.js";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { loadOpenApiCoverageModel } from "../spec/openapi.js";
import { REPORT_SCHEMA_VERSION } from "./schema.js";
import { buildReport } from "./report.js";

describe("report", () => {
  it("builds schema-aligned report with deterministic operation identity fields", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/simple.yaml");
    const events = await readHttpEventsJsonl("test/fixtures/events/events.fixture.jsonl");

    const coverage = computeCoverage(model.operations, events.items, ["/health"], {
      operationContractsByKey: model.operationContractsByKey
    });

    const report = buildReport(coverage, {
      toolVersion: "test",
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number")
    });

    expect(report.schemaVersion).toBe(REPORT_SCHEMA_VERSION);
    expect(report.phase).toEqual({ id: "02", slug: "coverage-metrics-and-cli-reporting" });
    expect(report.summary.operationCoveragePercent).toBeGreaterThanOrEqual(0);
    expect(report.coverage.perOperation.every((entry) => entry.operationKey && entry.method && entry.route)).toBe(true);
    expect(["ok", "partial", "invalid"]).toContain(report.status);
  });
});
