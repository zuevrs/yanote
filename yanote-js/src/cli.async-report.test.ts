import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

async function createOutDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-async-"));
  return {
    dir,
    outDir: path.join(dir, "out")
  };
}

describe("cli async-report", () => {
  it("writes a separate deterministic async artifact and exits 0 for local warning-level gates", async () => {
    const fixture = await createOutDir();

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        "test/fixtures/asyncapi/v3.yaml",
        "--events",
        "test/fixtures/async-events/partial.fixture.jsonl",
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(0);
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("YANOTE_ASYNC_SUMMARY");

      const reportPath = path.join(fixture.outDir, "yanote-async-report.json");
      const report = JSON.parse(await readFile(reportPath, "utf8"));

      expect(report.schemaVersion).toBe("1.0.0");
      expect(report.phase).toEqual({ id: "03", slug: "async-report-and-gate-surface" });
      expect(report.status).toBe("partial");
      expect(report.summary).toEqual({
        totalChannels: 2,
        coveredChannels: 1,
        channelCoveragePercent: 50,
        totalOperations: 2,
        coveredOperations: 1,
        operationCoveragePercent: 50,
        totalMessages: 2,
        coveredMessages: 1,
        messageCoveragePercent: 50
      });
      expect(report.governance).toBeUndefined();
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("exits 3 for async threshold failures and still writes the async artifact", async () => {
    const fixture = await createOutDir();

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        "test/fixtures/asyncapi/v3.yaml",
        "--events",
        "test/fixtures/async-events/partial.fixture.jsonl",
        "--out",
        fixture.outDir,
        "--min-coverage",
        "80"
      ]);

      expect(result.code).toBe(3);
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR class=gate code=ASYNC_GATE_MIN_COVERAGE");

      const reportPath = path.join(fixture.outDir, "yanote-async-report.json");
      const report = JSON.parse(await readFile(reportPath, "utf8"));
      expect(report.status).toBe("partial");
      expect(result.stdout).toContain(`report=${reportPath}`);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed on async drift with semantic error ordering and a written async artifact", async () => {
    const fixture = await createOutDir();

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        "test/fixtures/asyncapi/v3.yaml",
        "--events",
        "test/fixtures/async-events/drift.fixture.jsonl",
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(5);
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_MESSAGE_MISMATCH");
      expect(result.stderr).toContain(
        "YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_UNMATCHED_EVIDENCE"
      );
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_MESSAGE_MISMATCH");

      const report = JSON.parse(await readFile(path.join(fixture.outDir, "yanote-async-report.json"), "utf8"));
      expect(report.status).toBe("partial");
      expect(report.diagnostics.counts).toEqual({ unmatched: 1, mismatched: 1 });
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});
