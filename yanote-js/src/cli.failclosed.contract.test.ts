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

  it("fails closed with exit 5 and semantic primary when fully observed payload drift is invalid", async () => {
    const fixture = await createFixture(
      [
        "openapi: 3.0.0",
        "info: { title: semantic-invalid-body, version: 1.0.0 }",
        "paths:",
        "  /users/{id}:",
        "    post:",
        "      parameters:",
        "        - name: id",
        "          in: path",
        "          required: true",
        "          schema: { type: string }",
        "      requestBody:",
        "        required: true",
        "        content:",
        "          application/json:",
        "            schema:",
        "              type: object",
        "              required: [profile]",
        "              properties:",
        "                profile:",
        "                  type: object",
        "                  required: [active]",
        "                  properties:",
        "                    active: { type: boolean }",
        "      responses:",
        "        '201':",
        "          description: created",
        "          content:",
        "            application/json:",
        "              schema:",
        "                type: object",
        "                required: [id]",
        "                properties:",
        "                  id: { type: string }"
      ].join("\n"),
      JSON.stringify({
        kind: "http",
        ts: 1772449330001,
        method: "POST",
        route: "/users/123",
        status: 201,
        requestBody: {},
        requestContentType: "application/json",
        responseBody: { id: "123" },
        responseContentType: "application/json",
        queryKeys: [],
        headerKeys: ["content-type"],
        "test.run_id": "run-invalid-body",
        "test.suite": "suite-invalid-body"
      })
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

      expect(result.code).toBe(5);
      expect(result.stderr).toContain("YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_INVALID_BODY");
      expect(result.stderr).not.toContain("YANOTE_ERROR_SECONDARY");
      expect(result.stdout).toContain("primary=SEMANTIC_HTTP_INVALID_BODY");
      expect(result.stdout).toContain("- status: partial");
      expect(result.stdout).toContain("- operations: 1/1 (100.00%)");
      expect(result.stdout).toContain("class_counts=input:0,semantic:1,gate:0,runtime:0");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("keeps request-semantic failures primary over payload semantics and avoids duplicate medium request issues", async () => {
    const fixture = await createFixture(
      [
        "openapi: 3.0.0",
        "info: { title: request-before-payload, version: 1.0.0 }",
        "paths:",
        "  /users/{id}:",
        "    post:",
        "      parameters:",
        "        - name: id",
        "          in: path",
        "          required: true",
        "          schema: { type: string }",
        "        - name: verbose",
        "          in: query",
        "          required: false",
        "          schema: { type: boolean }",
        "      requestBody:",
        "        required: true",
        "        content:",
        "          application/json:",
        "            schema:",
        "              type: object",
        "              required: [profile]",
        "              properties:",
        "                profile:",
        "                  type: object",
        "                  required: [active]",
        "                  properties:",
        "                    active: { type: boolean }",
        "      responses:",
        "        '201':",
        "          description: created"
      ].join("\n"),
      JSON.stringify({
        kind: "http",
        ts: 1772449330002,
        method: "POST",
        route: "/users/123",
        status: 201,
        queryKeys: ["verbose"],
        queryParams: {
          verbose: { state: "captured", values: ["maybe"] }
        },
        requestBody: {},
        requestContentType: "application/json",
        headerKeys: ["content-type"],
        "test.run_id": "run-request-before-payload",
        "test.suite": "suite-request-before-payload"
      })
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

      expect(result.code).toBe(5);
      const stderrLines = result.stderr.trim().split("\n");
      expect(stderrLines[0]).toContain(
        "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER"
      );
      expect(stderrLines[1]).toContain("YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_INVALID_BODY");

      const section = result.stdout.split("Top Issues\n")[1]?.split("\n\nReport Path\n")[0] ?? "";
      const issueLines = section.split("\n").filter((line) => line.startsWith("- "));
      expect(issueLines[0]).toContain("SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER");
      expect(issueLines).toContainEqual(
        expect.stringContaining("SEMANTIC_HTTP_INVALID_BODY - request payload for http POST /users/{param}")
      );
      expect(section).not.toContain("query:verbose - captured-invalid");
      expect(result.stdout).toContain("primary=SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed with SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT on the shared S03 unsupported-format fixture", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-failclosed-format-media-"));
    const outDir = path.join(dir, "out");

    try {
      const result = await runCli([
        "report",
        "--spec",
        "test/fixtures/openapi/http-payload-format-media.yaml",
        "--events",
        "test/fixtures/events/http-payload-unsupported-format.fixture.jsonl",
        "--out",
        outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(5);
      expect(result.stderr).toContain(
        "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT"
      );
      expect(result.stderr).not.toContain("YANOTE_ERROR_SECONDARY");
      expect(result.stderr).not.toContain("cust-123");
      expect(result.stdout).toContain("primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT");
      expect(result.stdout).toContain(
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT - request payload for http POST /custom-format media=application/json declares a schema format outside Yanote's supported payload format allowlist."
      );
      expect(result.stdout).not.toContain("request - UNSUPPORTED_SCHEMA_FORMAT:");
      expect(result.stdout).toContain("class_counts=input:0,semantic:1,gate:0,runtime:0");
    } finally {
      await rm(dir, { recursive: true, force: true });
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
