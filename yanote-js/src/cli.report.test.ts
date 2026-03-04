import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCli } from "./cli.js";

describe("cli report", () => {
  it("writes schema-valid report and exits 0 for deterministic success", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "yanote-js-out-"));
    const res = await runCli([
      "report",
      "--spec",
      "test/fixtures/openapi/simple.yaml",
      "--events",
      "test/fixtures/events/events.fixture.jsonl",
      "--out",
      outDir,
      "--exclude",
      "/health"
    ]);

    expect(res.code).toBe(0);

    const reportPath = path.join(outDir, "yanote-report.json");
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    expect(report.schemaVersion).toBe("1.0.0");
    expect(report.summary.totalOperations).toBeGreaterThan(0);
    expect(report.coverage.perOperation[0]).toHaveProperty("operationKey");
  });

  it("exits 3 for min-coverage gate failures and still writes report snapshot", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "yanote-js-out-"));
    const res = await runCli([
      "report",
      "--spec",
      "test/fixtures/openapi/simple.yaml",
      "--events",
      "test/fixtures/events/events.fixture.jsonl",
      "--out",
      outDir,
      "--exclude",
      "/health",
      "--min-coverage",
      "100"
    ]);

    expect(res.code).toBe(3);
    expect(res.stderr).toContain("class=gate");

    const reportPath = path.join(outDir, "yanote-report.json");
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    expect(report.status).toBe("partial");
  });

  it("exits 4 for regression gate failures", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "yanote-js-out-"));
    const res = await runCli([
      "report",
      "--spec",
      "test/fixtures/openapi/simple.yaml",
      "--events",
      "test/fixtures/events/events.fixture.jsonl",
      "--out",
      outDir,
      "--exclude",
      "/health",
      "--baseline",
      "test/fixtures/baseline/baseline.json",
      "--fail-on-regression"
    ]);

    expect(res.code).toBe(4);
    expect(res.stderr).toContain("code=GATE_REGRESSION");
  });
});
