import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCli } from "./cli.js";

async function createCliFixture(specYaml: string, eventsJsonl: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-"));
  const specPath = path.join(dir, "openapi.yaml");
  const eventsPath = path.join(dir, "events.jsonl");
  const outDir = path.join(dir, "out");

  await writeFile(specPath, specYaml, "utf8");
  await writeFile(eventsPath, eventsJsonl, "utf8");

  return { dir, specPath, eventsPath, outDir };
}

describe("cli", () => {
  it("prints help", async () => {
    const res = await runCli(["--help"]);
    expect(res.code).toBe(0);
    expect(res.stdout).toContain("Compute deterministic operation coverage");
    expect(res.stdout).toContain("report [options]");
  });

  it("uses typed input failure for invalid min coverage", async () => {
    const res = await runCli([
      "report",
      "--spec",
      "test/fixtures/openapi/simple.yaml",
      "--events",
      "test/fixtures/events/events.fixture.jsonl",
      "--out",
      "./tmp",
      "--min-coverage",
      "not-an-int"
    ]);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain("class=input");
    expect(res.stdout).toContain("YANOTE_SUMMARY");
  });

  it("fails closed on semantic ambiguity with typed semantic error", async () => {
    const fixture = await createCliFixture(
      [
        "openapi: 3.0.0",
        "info:",
        "  title: ambiguous",
        "  version: 1.0.0",
        "paths:",
        "  /reports/{id}:",
        "    get:",
        "      responses:",
        "        '200':",
        "          description: ok",
        "  /{team}/2024:",
        "    get:",
        "      responses:",
        "        '200':",
        "          description: ok"
      ].join("\n"),
      ['{"kind":"http","method":"GET","route":"/reports/2024","test.run_id":"r1","test.suite":"s1"}'].join("\n")
    );

    try {
      const res = await runCli(["report", "--spec", fixture.specPath, "--events", fixture.eventsPath, "--out", fixture.outDir]);
      expect(res.code).toBe(5);
      expect(res.stderr).toContain("class=semantic");
      expect(res.stdout.trimEnd().split("\n").at(-1)?.startsWith("YANOTE_SUMMARY ")).toBe(true);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("emits runtime typed failure when report path is not writable", async () => {
    const res = await runCli([
      "report",
      "--spec",
      "test/fixtures/openapi/simple.yaml",
      "--events",
      "test/fixtures/events/events.fixture.jsonl",
      "--out",
      "/dev/null/yanote-out"
    ]);

    expect(res.code).toBe(6);
    expect(res.stderr).toContain("class=runtime");
    expect(res.stdout).toContain("YANOTE_SUMMARY");
  });

  it("succeeds for deterministic report flows and emits machine summary line once", async () => {
    const fixture = await createCliFixture(
      [
        "openapi: 3.0.0",
        "info:",
        "  title: deterministic",
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
      [
        '{"kind":"http","method":"GET","route":"/health","test.run_id":"r1","test.suite":"s1"}',
        '{"kind":"http","method":"GET","route":"/users/123","test.run_id":"r1","test.suite":"s1"}'
      ].join("\n")
    );

    try {
      const res = await runCli(["report", "--spec", fixture.specPath, "--events", fixture.eventsPath, "--out", fixture.outDir]);
      expect(res.code).toBe(0);

      const reportRaw = await readFile(path.join(fixture.outDir, "yanote-report.json"), "utf8");
      expect(reportRaw).toContain('"schemaVersion"');
      expect(reportRaw).toContain('"/users/{param}"');

      const summaryCount = (res.stdout.match(/YANOTE_SUMMARY/g) ?? []).length;
      expect(summaryCount).toBe(1);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});
