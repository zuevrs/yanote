import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCli } from "./cli.js";

describe("cli report", () => {
  it("writes yanote-report.json and exits 0 on success", async () => {
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
    expect(report.summary.totalOperations).toBeGreaterThan(0);
  });

  it("exits 3 when min coverage fails (still writes report)", async () => {
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
    const reportPath = path.join(outDir, "yanote-report.json");
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    expect(report.summary.coveredOperations).toBeGreaterThanOrEqual(0);
  });

  it("exits 4 when regression fails", async () => {
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
  });
});

