import { describe, expect, it } from "vitest";
import { loadOpenApiOperations } from "../spec/openapi.js";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { computeCoverage } from "../coverage/coverage.js";
import { buildReport } from "./report.js";

describe("report", () => {
  it("builds report with summary and uncovered list", async () => {
    const operations = await loadOpenApiOperations("test/fixtures/openapi/simple.yaml");
    const events = await readHttpEventsJsonl("test/fixtures/events/events.fixture.jsonl");

    const coverage = computeCoverage(operations, events.items, ["/health"]);
    const report = buildReport(coverage, { toolVersion: "test" });

    expect(report.summary.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(report.operations.uncovered.length).toBeGreaterThan(0);
    expect(report.operations.all.length).toBeGreaterThan(0);
  });
});

