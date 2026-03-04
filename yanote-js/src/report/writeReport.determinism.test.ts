import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { YanoteReport } from "./report.js";
import { writeYanoteReport } from "./writeReport.js";
import { REPORT_SCHEMA_VERSION } from "./schema.js";

function makeReport(): YanoteReport {
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt: "1970-01-01T00:00:00.000Z",
    toolVersion: "test",
    phase: {
      id: "02",
      slug: "coverage-metrics-and-cli-reporting"
    },
    status: "partial",
    summary: {
      totalOperations: 2,
      coveredOperations: 1,
      operationCoveragePercent: 50,
      aggregateCoveragePercent: null,
      aggregateExplanation: "aggregate is N/A because weighted dimensions include N/A"
    },
    coverage: {
      operations: { state: "PARTIAL", percent: 50 },
      status: { state: "N/A", percent: null },
      parameters: { state: "N/A", percent: null },
      aggregate: { state: "N/A", percent: null, explanation: "aggregate is N/A because weighted dimensions include N/A" },
      perOperation: [
        {
          operationKey: "http GET /b",
          method: "GET",
          route: "/b",
          operation: { state: "UNCOVERED" },
          status: { state: "N/A", declared: [], covered: [], missing: [] },
          parameters: {
            state: "N/A",
            required: { total: 0, covered: 0, missing: [] },
            optional: { total: 0, covered: 0, missing: [] }
          },
          suites: []
        },
        {
          operationKey: "http GET /a",
          method: "GET",
          route: "/a",
          operation: { state: "COVERED" },
          status: { state: "N/A", declared: [], covered: [], missing: [] },
          parameters: {
            state: "N/A",
            required: { total: 0, covered: 0, missing: [] },
            optional: { total: 0, covered: 0, missing: [] }
          },
          suites: ["suite-2", "suite-1"]
        }
      ]
    },
    diagnostics: {
      counts: {
        invalid: 0,
        ambiguous: 0,
        unmatched: 0
      },
      items: []
    }
  };
}

describe("writeYanoteReport determinism", () => {
  it("fails fast with actionable schema validation error", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-report-"));
    try {
      const invalid = {
        ...makeReport(),
        schemaVersion: "bad"
      } as YanoteReport;

      await expect(writeYanoteReport(dir, invalid)).rejects.toThrow(/Invalid report schema/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("writes byte-equivalent JSON for equivalent report DTOs", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-report-"));
    try {
      const report = makeReport();
      const firstPath = await writeYanoteReport(dir, report);
      const firstBytes = await readFile(firstPath, "utf8");

      const secondPath = await writeYanoteReport(dir, {
        ...report,
        coverage: {
          ...report.coverage,
          perOperation: [...report.coverage.perOperation].reverse()
        }
      });
      const secondBytes = await readFile(secondPath, "utf8");

      expect(firstBytes).toBe(secondBytes);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("preserves canonical key ordering and trailing newline", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-report-"));
    try {
      const outPath = await writeYanoteReport(dir, makeReport());
      const bytes = await readFile(outPath, "utf8");
      expect(bytes.endsWith("\n")).toBe(true);

      const parsed = JSON.parse(bytes);
      expect(Object.keys(parsed).slice(0, 4)).toEqual(["coverage", "diagnostics", "generatedAt", "phase"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
