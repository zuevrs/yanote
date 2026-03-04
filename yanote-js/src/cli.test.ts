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
    expect(res.stdout).toContain("Compute coverage");
    expect(res.stdout).toContain("report");
  });

  it("fails closed when semantic state is invalid", async () => {
    const fixture = await createCliFixture(
      [
        "openapi: 3.0.0",
        "info:",
        "  title: invalid",
        "  version: 1.0.0",
        "paths:",
        "  /broken: \"invalid-path-item\""
      ].join("\n"),
      ['{"kind":"http","method":"GET","route":"/broken","test.run_id":"r1","test.suite":"s1"}'].join("\n")
    );

    try {
      const res = await runCli(["report", "--spec", fixture.specPath, "--events", fixture.eventsPath, "--out", fixture.outDir]);
      expect(res.code).not.toBe(0);
      expect(res.stderr.toLowerCase()).toContain("semantic");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed when matching diagnostics contain ambiguity", async () => {
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
      expect(res.code).not.toBe(0);
      expect(res.stderr.toLowerCase()).toContain("ambiguous");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("succeeds for deterministic non-ambiguous report flows", async () => {
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
      expect(reportRaw).toContain('"coveragePercent"');
      expect(reportRaw).toContain('"/users/{param}"');
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});

