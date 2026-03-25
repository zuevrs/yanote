import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

async function createRequestEvidenceFixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-request-evidence-"));
  const specPath = path.join(dir, "openapi.yaml");
  const eventsPath = path.join(dir, "events.jsonl");
  const outDir = path.join(dir, "out");

  await writeFile(
    specPath,
    [
      "openapi: 3.0.0",
      "info:",
      "  title: request evidence cli",
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
      "        - name: meta",
      "          in: query",
      "          required: false",
      "          schema:",
      "            type: object",
      "            properties:",
      "              enabled:",
      "                type: boolean",
      "        - name: token",
      "          in: query",
      "          required: false",
      "          schema: { type: string }",
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
      "        - name: prefs",
      "          in: cookie",
      "          required: true",
      "          schema:",
      "            type: string",
      "            minLength: 3",
      "        - name: session",
      "          in: cookie",
      "          required: true",
      "          schema: { type: string }",
      "        - name: theme",
      "          in: cookie",
      "          required: false",
      "          schema: { type: string }",
      "      responses:",
      "        '200':",
      "          description: ok"
    ].join("\n"),
    "utf8"
  );

  await writeFile(
    eventsPath,
    `${JSON.stringify({
      kind: "http",
      ts: 1772450020001,
      method: "GET",
      route: "/evidence/users/user-42",
      status: 200,
      queryKeys: ["meta", "token", "verbose"],
      headerKeys: ["x-trace-id"],
      pathParams: {
        id: { state: "captured", values: ["user-42"] }
      },
      queryParams: {
        meta: { state: "captured", values: ["opaque"] },
        token: { state: "captured", values: ["one", "two"] },
        verbose: { state: "captured", values: ["maybe"] }
      },
      requestHeaders: {
        "x-trace-id": { state: "captured", values: ["120"] }
      },
      cookies: {
        prefs: { state: "captured", values: ["ab"] },
        session: { state: "redacted", reason: "sensitive" },
        theme: { state: "omitted", reason: "unavailable" }
      },
      "test.run_id": "run-request-evidence",
      "test.suite": "suite-request-evidence"
    })}\n`,
    "utf8"
  );

  return { dir, specPath, eventsPath, outDir };
}

describe("cli request evidence", () => {
  it("fails closed with typed request-semantic issues while keeping request summaries and diagnostics secret-safe", async () => {
    const fixture = await createRequestEvidenceFixture();

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
        "local",
        "--verbose"
      ]);

      expect(result.code).toBe(5);
      expect(result.stdout).toContain("HTTP Request Conformance");
      expect(result.stdout).toContain("- observations: operations=1 parameters=8");
      expect(result.stdout).toContain(
        "- truths: captured-valid=2 captured-invalid=2 redacted=1 omitted=1 unsupported=2"
      );
      expect(result.stdout).toContain(
        "- high: SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER - cookie 'prefs' for http GET /evidence/users/{param} failed supported request-parameter validation."
      );
      expect(result.stdout).toContain(
        "- high: SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER - cookie 'session' for http GET /evidence/users/{param} was unavailable for request-semantic verification because retained evidence was redacted (reason: sensitive)."
      );
      expect(result.stdout).toContain(
        "- high: SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER - query parameter 'meta' for http GET /evidence/users/{param} falls outside the published supported request serialization subset."
      );
      expect(result.stdout).toContain("primary=SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER");
      expect(result.stdout).not.toContain("query:meta - unsupported");
      expect(result.stdout).not.toContain("query:verbose - captured-invalid");
      expect(result.stdout).not.toContain("cookie:session - redacted");
      expect(result.stdout).not.toContain("cookie:theme - omitted");

      expect(result.stderr).toContain("YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER");
      expect(result.stderr).toContain(
        "YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER"
      );
      expect(result.stderr).toContain(
        "YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER"
      );

      expect(result.stdout).not.toContain("user-42");
      expect(result.stdout).not.toContain("opaque");
      expect(result.stdout).not.toContain("two");
      expect(result.stdout).not.toContain("maybe");
      expect(result.stderr).not.toContain("user-42");
      expect(result.stderr).not.toContain("opaque");
      expect(result.stderr).not.toContain("two");
      expect(result.stderr).not.toContain("maybe");

      const reportRaw = await readFile(path.join(fixture.outDir, "yanote-report.json"), "utf8");
      expect(reportRaw).toContain('"httpRequestConformance"');
      expect(reportRaw).toContain('"capturedValid": 2');
      expect(reportRaw).toContain('"redacted": 1');
      expect(reportRaw).toContain('"omitted": 1');
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});
