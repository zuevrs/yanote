import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

async function createFixture(specYaml: string, eventsJsonl: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-failclosed-"));
  const specPath = path.join(dir, "openapi.yaml");
  const eventsPath = path.join(dir, "events.jsonl");
  const outDir = path.join(dir, "out");
  await writeFile(specPath, specYaml, "utf8");
  await writeFile(eventsPath, eventsJsonl, "utf8");
  return { dir, specPath, eventsPath, outDir };
}

describe("cli fail-closed contract", () => {
  it("fails closed with typed input diagnostics for invalid JSONL evidence", async () => {
    const fixture = await createFixture(
      [
        "openapi: 3.0.0",
        "info: { title: failclosed, version: 1.0.0 }",
        "paths:",
        "  /health:",
        "    get:",
        "      responses:",
        "        '200': { description: ok }"
      ].join("\n"),
      ['{"kind":"http","method":"GET","route":"/health"}', "not-json"].join("\n")
    );

    try {
      const result = await runCli(["report", "--spec", fixture.specPath, "--events", fixture.eventsPath, "--out", fixture.outDir]);
      expect(result.code).toBe(2);
      expect(result.stderr).toContain("class=input");
      expect(result.stderr).toContain("INPUT_EVENTS_INVALID_LINES");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed for incompatible baseline schema", async () => {
    const fixture = await createFixture(
      [
        "openapi: 3.0.0",
        "info: { title: baseline-invalid, version: 1.0.0 }",
        "paths:",
        "  /health:",
        "    get:",
        "      responses:",
        "        '200': { description: ok }"
      ].join("\n"),
      '{"kind":"http","method":"GET","route":"/health"}'
    );
    const baselinePath = path.join(fixture.dir, "baseline.json");
    await writeFile(
      baselinePath,
      JSON.stringify(
        {
          format: 2,
          generatedAt: "2026-03-04T00:00:00.000Z",
          covered: [{ wrong: "shape" }],
          dimensions: {
            operations: 100,
            status: 100,
            parameters: 100,
            aggregate: 100
          }
        },
        null,
        2
      ),
      "utf8"
    );

    try {
      const result = await runCli([
        "report",
        "--spec",
        fixture.specPath,
        "--events",
        fixture.eventsPath,
        "--out",
        fixture.outDir,
        "--baseline",
        baselinePath
      ]);
      expect(result.code).toBe(2);
      expect(result.stderr).toContain("INPUT_BASELINE_INVALID");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("keeps one primary error line and deterministic secondary ordering", async () => {
    const fixture = await createFixture(
      [
        "openapi: 3.0.0",
        "info: { title: multifailure, version: 1.0.0 }",
        "paths:",
        "  /a:",
        "    get:",
        "      responses:",
        "        '200': { description: ok }",
        "  /b:",
        "    get:",
        "      responses:",
        "        '200': { description: ok }"
      ].join("\n"),
      ['{"kind":"http","method":"GET","route":"/a"}', "not-json"].join("\n")
    );

    try {
      const result = await runCli([
        "report",
        "--spec",
        fixture.specPath,
        "--events",
        fixture.eventsPath,
        "--out",
        fixture.outDir,
        "--min-coverage",
        "100"
      ]);

      expect(result.code).toBe(2);
      const stderrLines = result.stderr.trim().split("\n");
      expect(stderrLines[0]).toContain("YANOTE_ERROR class=input code=INPUT_EVENTS_INVALID_LINES");
      expect(stderrLines[1]).toContain("YANOTE_ERROR_SECONDARY class=gate code=GATE_MIN_COVERAGE");
      expect(stderrLines.filter((line) => line.startsWith("YANOTE_ERROR "))).toHaveLength(1);
      expect(result.stdout).toContain("primary=INPUT_EVENTS_INVALID_LINES");
      expect(result.stdout).toContain("class_counts=input:1,semantic:0,gate:1,runtime:0");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});
