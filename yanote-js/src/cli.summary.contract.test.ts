import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

async function makeSharedFormatMediaFixture(eventFixturePaths: string[]) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-summary-format-media-"));
  const eventsPath = path.join(dir, "events.jsonl");
  const outDir = path.join(dir, "out");
  const events = (await Promise.all(eventFixturePaths.map((fixturePath) => readFile(fixturePath, "utf8")))).join("");

  await writeFile(eventsPath, events, "utf8");

  return {
    dir,
    specPath: "test/fixtures/openapi/http-payload-format-media.yaml",
    eventsPath,
    outDir
  };
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
      const payloadIndex = output.indexOf("\nHTTP Payload Conformance\n");
      const requestIndex = output.indexOf("\nHTTP Request Conformance\n");
      const issuesIndex = output.indexOf("\nTop Issues\n");
      const pathIndex = output.indexOf("\nReport Path\n");
      const machineIndex = output.lastIndexOf("\nYANOTE_SUMMARY ");

      expect(summaryIndex).toBeGreaterThanOrEqual(0);
      expect(dimensionsIndex).toBeGreaterThan(summaryIndex);
      expect(payloadIndex).toBeGreaterThan(dimensionsIndex);
      expect(requestIndex).toBeGreaterThan(payloadIndex);
      expect(issuesIndex).toBeGreaterThan(requestIndex);
      expect(pathIndex).toBeGreaterThan(issuesIndex);
      expect(machineIndex).toBeGreaterThan(pathIndex);

      const lines = output.trimEnd().split("\n");
      expect(lines[lines.length - 1].startsWith("YANOTE_SUMMARY ")).toBe(true);
      expect((output.match(/YANOTE_SUMMARY /g) ?? []).length).toBe(1);
      expect(output).toContain("- observations: operations=1 parameters=0");
      expect(output).toContain("- truths: captured-valid=0 captured-invalid=0 redacted=0 omitted=0 unsupported=0");
      expect(output).not.toMatch(/\u001b\[[0-9;]*m/);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("adds deterministic request-conformance machine tokens without changing legacy percentages on green runs", async () => {
    const fixture = await makeFixture(
      [
        "openapi: 3.0.0",
        "info:",
        "  title: summary-request-tokens",
        "  version: 1.0.0",
        "paths:",
        "  /evidence/users/{id}:",
        "    get:",
        "      parameters:",
        "        - name: id",
        "          in: path",
        "          required: true",
        "          schema:",
        "            type: string",
        "            pattern: '^user-[0-9]+$'",
        "        - name: verbose",
        "          in: query",
        "          required: false",
        "          schema: { type: boolean }",
        "        - name: X-Trace-Id",
        "          in: header",
        "          required: true",
        "          schema:",
        "            type: integer",
        "            minimum: 100",
        "        - name: session",
        "          in: cookie",
        "          required: true",
        "          schema:",
        "            type: string",
        "            minLength: 3",
        "      responses:",
        "        '200':",
        "          description: ok"
      ].join("\n"),
      `${JSON.stringify({
        kind: "http",
        ts: 1772450030001,
        method: "GET",
        route: "/evidence/users/user-42",
        status: 200,
        queryKeys: ["verbose"],
        headerKeys: ["x-trace-id"],
        pathParams: {
          id: { state: "captured", values: ["user-42"] }
        },
        queryParams: {
          verbose: { state: "captured", values: ["true"] }
        },
        requestHeaders: {
          "x-trace-id": { state: "captured", values: ["120"] }
        },
        cookies: {
          session: { state: "captured", values: ["abc123"] }
        },
        "test.run_id": "run-summary-request",
        "test.suite": "suite-summary-request"
      })}\n`
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
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("- operations: 1/1 (100.00%)");
      expect(result.stdout).toContain("- observations: operations=1 parameters=4");
      expect(result.stdout).toContain(
        "- truths: captured-valid=4 captured-invalid=0 redacted=0 omitted=0 unsupported=0"
      );

      const summaryLine = result.stdout.trimEnd().split("\n").at(-1) ?? "";
      expect(summaryLine).toContain("request_observed_operations=1");
      expect(summaryLine).toContain("request_observed_parameters=4");
      expect(summaryLine).toContain(
        "request_truths=captured_valid:4,captured_invalid:0,redacted:0,omitted:0,unsupported:0"
      );
      expect(summaryLine).toContain("operations=100.00");
      expect(summaryLine).toContain("parameters=100.00");
      expect(summaryLine).toContain("primary=none");
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

  it("uses one semantic primary issue in Top Issues and the machine summary for fully observed unsupported-schema drift", async () => {
    const fixture = await makeFixture(
      [
        "openapi: 3.0.0",
        "info:",
        "  title: summary-semantic-truth",
        "  version: 1.0.0",
        "paths:",
        "  /compile-fail/{id}:",
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
        "              type: string",
        "              pattern: '['",
        "      responses:",
        "        '202':",
        "          description: accepted",
        "          content:",
        "            application/json:",
        "              schema:",
        "                type: string",
        "                pattern: '['"
      ].join("\n"),
      `${JSON.stringify({
        kind: "http",
        ts: 1772449340001,
        method: "POST",
        route: "/compile-fail/123",
        status: 202,
        requestBody: "hello",
        requestContentType: "application/json",
        responseBody: "accepted",
        responseContentType: "application/json",
        queryKeys: [],
        headerKeys: ["content-type"],
        "test.run_id": "run-unsupported-schema",
        "test.suite": "suite-unsupported-schema"
      })}\n`
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
      const section = result.stdout.split("Top Issues\n")[1]?.split("\n\nReport Path\n")[0] ?? "";
      const issueLines = section.split("\n").filter((line) => line.startsWith("- "));
      expect(issueLines).toEqual([
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SCHEMA - request payload for http POST /compile-fail/{param} media=application/json declares JSON content without a usable validation schema.",
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SCHEMA - response payload for http POST /compile-fail/{param} declared-status=202 observed-status=202 media=application/json declares JSON content without a usable validation schema."
      ]);
      expect(section).not.toContain("request - UNSUPPORTED_SCHEMA:");
      expect(section).not.toContain("response - UNSUPPORTED_SCHEMA:");
      expect(result.stdout).toContain("primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA");
      expect(result.stdout).toContain("- status: partial");
      expect(result.stdout).toContain("- operations: 1/1 (100.00%)");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("keeps shared S03 Top Issues deduped and reuses the existing YANOTE_SUMMARY tokens for richer payload counts", async () => {
    const fixture = await makeSharedFormatMediaFixture([
      "test/fixtures/events/http-payload-valid-format.fixture.jsonl",
      "test/fixtures/events/http-payload-invalid-format.fixture.jsonl",
      "test/fixtures/events/http-payload-unsupported-format.fixture.jsonl",
      "test/fixtures/events/http-payload-media-specificity.fixture.jsonl"
    ]);

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
      const section = result.stdout.split("Top Issues\n")[1]?.split("\n\nReport Path\n")[0] ?? "";
      const issueLines = section.split("\n").filter((line) => line.startsWith("- "));
      expect(issueLines).toEqual([
        "- high: SEMANTIC_HTTP_INVALID_BODY - request payload for http POST /incidents media=application/problem+json failed JSON schema validation.",
        "- high: SEMANTIC_HTTP_INVALID_BODY - request payload for http POST /verifications media=application/json failed JSON schema validation.",
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT - request payload for http POST /custom-format media=application/json declares a schema format outside Yanote's supported payload format allowlist."
      ]);
      expect(section).not.toContain("request - INVALID_BODY:");
      expect(section).not.toContain("request - UNSUPPORTED_SCHEMA_FORMAT:");

      const summaryLine = result.stdout.trimEnd().split("\n").at(-1) ?? "";
      expect(summaryLine.startsWith("YANOTE_SUMMARY ")).toBe(true);
      expect(summaryLine).toContain("operations=100.00");
      expect(summaryLine).toContain("covered=4/4");
      expect(summaryLine).toContain("diagnostics=0");
      expect(summaryLine).toContain("payload_diagnostics=covered:5,uncovered:2,skipped:1");
      expect(summaryLine).toContain("request_observed_operations=4");
      expect(summaryLine).toContain(
        "request_truths=captured_valid:0,captured_invalid:0,redacted:0,omitted:0,unsupported:0"
      );
      expect(summaryLine).toContain("primary=SEMANTIC_HTTP_INVALID_BODY");
      expect(summaryLine).toContain("class_counts=input:0,semantic:3,gate:0,runtime:0");
      expect(summaryLine).not.toContain("unsupported_schema_format=");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("keeps benign NO_DECLARED_CONTENT out of Top Issues and preserves a green summary", async () => {
    const fixture = await makeFixture(
      [
        "openapi: 3.0.0",
        "info:",
        "  title: summary-no-declared-content",
        "  version: 1.0.0",
        "paths:",
        "  /audit-log/{id}:",
        "    post:",
        "      parameters:",
        "        - name: id",
        "          in: path",
        "          required: true",
        "          schema: { type: string }",
        "      responses:",
        "        '204':",
        "          description: no content"
      ].join("\n"),
      `${JSON.stringify({
        kind: "http",
        ts: 1772449340002,
        method: "POST",
        route: "/audit-log/123",
        status: 204,
        requestBody: { ignored: true },
        requestContentType: "application/json",
        responseBody: { ignored: true },
        responseContentType: "application/json",
        queryKeys: [],
        headerKeys: ["content-type"],
        "test.run_id": "run-no-declared-content",
        "test.suite": "suite-no-declared-content"
      })}\n`
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
      expect(result.stderr).toBe("");
      const section = result.stdout.split("Top Issues\n")[1]?.split("\n\nReport Path\n")[0] ?? "";
      expect(section.trim()).toBe("- none");
      expect(result.stdout).toContain("- status: ok");
      expect(result.stdout).toContain("- operations: 1/1 (100.00%)");
      expect(result.stdout).toContain("primary=none");
      expect(result.stdout).not.toContain("NO_DECLARED_CONTENT");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});
