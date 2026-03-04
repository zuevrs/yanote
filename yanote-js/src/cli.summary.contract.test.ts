import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

async function makeFixture(specYaml: string, eventsJsonl: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-summary-"));
  const specPath = path.join(dir, "openapi.yaml");
  const eventsPath = path.join(dir, "events.jsonl");
  const outDir = path.join(dir, "out");

  await writeFile(specPath, specYaml, "utf8");
  await writeFile(eventsPath, eventsJsonl, "utf8");

  return { dir, specPath, eventsPath, outDir };
}

describe("cli summary contract", () => {
  it("prints fixed section order, plain text, and one final machine summary line", async () => {
    const fixture = await makeFixture(
      [
        "openapi: 3.0.0",
        "info:",
        "  title: summary-order",
        "  version: 1.0.0",
        "paths:",
        "  /health:",
        "    get:",
        "      responses:",
        "        '200':",
        "          description: ok",
        "  /users/{id}:",
        "    get:",
        "      responses:",
        "        '200':",
        "          description: ok"
      ].join("\n"),
      '{"kind":"http","method":"GET","route":"/health","test.run_id":"r1","test.suite":"suite"}\n'
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
        "--profile",
        "local"
      ]);
      expect(result.code).toBe(0);

      const output = result.stdout;
      const summaryIndex = output.indexOf("Summary\n");
      const dimensionsIndex = output.indexOf("\nCoverage Dimensions\n");
      const issuesIndex = output.indexOf("\nTop Issues\n");
      const pathIndex = output.indexOf("\nReport Path\n");
      const machineIndex = output.lastIndexOf("\nYANOTE_SUMMARY ");

      expect(summaryIndex).toBeGreaterThanOrEqual(0);
      expect(dimensionsIndex).toBeGreaterThan(summaryIndex);
      expect(issuesIndex).toBeGreaterThan(dimensionsIndex);
      expect(pathIndex).toBeGreaterThan(issuesIndex);
      expect(machineIndex).toBeGreaterThan(pathIndex);

      const lines = output.trimEnd().split("\n");
      expect(lines[lines.length - 1].startsWith("YANOTE_SUMMARY ")).toBe(true);
      expect((output.match(/YANOTE_SUMMARY /g) ?? []).length).toBe(1);
      expect(output).not.toMatch(/\[[0-9;]*m/);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("sorts and truncates top issues with explicit tail marker", async () => {
    const fixture = await makeFixture(
      [
        "openapi: 3.0.0",
        "info:",
        "  title: summary-issues",
        "  version: 1.0.0",
        "paths:",
        "  /f:",
        "    get:",
        "      responses: {'200': {description: ok}}",
        "  /e:",
        "    get:",
        "      responses: {'200': {description: ok}}",
        "  /d:",
        "    get:",
        "      responses: {'200': {description: ok}}",
        "  /c:",
        "    get:",
        "      responses: {'200': {description: ok}}",
        "  /b:",
        "    get:",
        "      responses: {'200': {description: ok}}",
        "  /a:",
        "    get:",
        "      responses: {'200': {description: ok}}"
      ].join("\n"),
      ""
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
        "--profile",
        "local"
      ]);
      expect(result.code).toBe(0);

      const section = result.stdout.split("Top Issues\n")[1]?.split("\n\nReport Path\n")[0] ?? "";
      const issueLines = section.split("\n").filter((line) => line.startsWith("- "));

      expect(issueLines.some((line) => line.includes("http GET /a"))).toBe(true);
      expect(result.stdout).toContain("... +");
      expect(result.stdout).toContain("see report");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});
