import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

function pickPayloadStates(
  report: any,
  operationKeys: string[]
): Record<string, { request: string | undefined; response: string | undefined; suites: string[] }> {
  return Object.fromEntries(
    operationKeys.map((operationKey) => {
      const entry = report.httpPayloadConformance.perOperation.find((item: any) => item.operationKey === operationKey);
      return [operationKey, { request: entry?.request.state, response: entry?.response.state, suites: entry?.suites ?? [] }];
    })
  );
}

async function createFullObservationPayloadTruthFixture(
  scenario: "invalid-body" | "unsupported-media" | "unsupported-schema" | "no-declared-content"
) {
  const dir = await mkdtemp(path.join(os.tmpdir(), `yanote-cli-truth-${scenario}-`));
  const specPath = path.join(dir, `${scenario}.yaml`);
  const eventsPath = path.join(dir, `${scenario}.fixture.jsonl`);
  const outDir = path.join(dir, "out");

  const specByScenario = {
    "invalid-body": [
      "openapi: 3.0.0",
      "info:",
      "  title: invalid body truth fixture",
      "  version: 1.0.0",
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
    "unsupported-media": [
      "openapi: 3.0.0",
      "info:",
      "  title: unsupported media truth fixture",
      "  version: 1.0.0",
      "paths:",
      "  /notes/{id}:",
      "    post:",
      "      parameters:",
      "        - name: id",
      "          in: path",
      "          required: true",
      "          schema: { type: string }",
      "      requestBody:",
      "        required: true",
      "        content:",
      "          text/plain:",
      "            schema:",
      "              type: string",
      "      responses:",
      "        '202':",
      "          description: accepted",
      "          content:",
      "            text/plain:",
      "              schema:",
      "                type: string"
    ].join("\n"),
    "unsupported-schema": [
      "openapi: 3.0.0",
      "info:",
      "  title: unsupported schema truth fixture",
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
    "no-declared-content": [
      "openapi: 3.0.0",
      "info:",
      "  title: no declared content truth fixture",
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
    ].join("\n")
  } as const;

  const eventByScenario = {
    "invalid-body": {
      kind: "http",
      ts: 1772449320001,
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
    },
    "unsupported-media": {
      kind: "http",
      ts: 1772449320002,
      method: "POST",
      route: "/notes/123",
      status: 202,
      requestBody: "hello",
      requestContentType: "text/plain",
      responseBody: "accepted",
      responseContentType: "text/plain",
      queryKeys: [],
      headerKeys: ["content-type"],
      "test.run_id": "run-unsupported-media",
      "test.suite": "suite-unsupported-media"
    },
    "unsupported-schema": {
      kind: "http",
      ts: 1772449320003,
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
    },
    "no-declared-content": {
      kind: "http",
      ts: 1772449320004,
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
    }
  } as const;

  await writeFile(specPath, specByScenario[scenario], "utf8");
  await writeFile(eventsPath, `${JSON.stringify(eventByScenario[scenario])}\n`, "utf8");

  return { dir, specPath, eventsPath, outDir };
}

async function createSharedFormatMediaFixture(eventFixturePaths: string[]) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-format-media-"));
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

describe("cli report", () => {
  it("writes schema-valid report and exits 0 for deterministic success", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "yanote-js-out-"));
    const res = await runCli([
      "report",
      "--spec",
      "test/fixtures/openapi/simple.yaml",
      "--events",
      "test/fixtures/events/events.valid.fixture.jsonl",
      "--out",
      outDir,
      "--profile",
      "local",
      "--exclude",
      "/health"
    ]);

    expect(res.code).toBe(0);

    const reportPath = path.join(outDir, "yanote-report.json");
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    expect(report.schemaVersion).toBe("1.0.0");
    expect(report.summary.totalOperations).toBeGreaterThan(0);
    expect(report.coverage.perOperation[0]).toHaveProperty("operationKey");
    expect(report.httpPayloadConformance).toHaveProperty("summary");
    expect(report.governance.exclusions.appliedRules.length).toBeGreaterThanOrEqual(1);
    expect(report.governance.exclusions.appliedRules[0]).toHaveProperty("matchedOperationCount");
    expect(report.governance.exclusions.unmatchedRules).toEqual([]);
  });

  it("exits 3 for min-coverage gate failures and still writes report snapshot", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "yanote-js-out-"));
    const res = await runCli([
      "report",
      "--spec",
      "test/fixtures/openapi/simple.yaml",
      "--events",
      "test/fixtures/events/events.valid.fixture.jsonl",
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
      "test/fixtures/events/events.valid.fixture.jsonl",
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

  it.each([
    {
      name: "unsupported media",
      fixture: "http-payload-unsupported.fixture.jsonl",
      semanticCode: "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
      operationCoveragePercent: 16.67,
      requestLine:
        "- request: covered=0 partial=0 uncovered=0 skipped=1 n/a=5 observations=1 valid=0 invalid=0 skipped_observations=1",
      responseLine:
        "- response: covered=0 partial=0 uncovered=0 skipped=1 n/a=5 observations=1 valid=0 invalid=0 skipped_observations=1",
      diagnosticsLine: "- diagnostics: covered=0 uncovered=0 skipped=2",
      machineCounts: "payload_diagnostics=covered:0,uncovered:0,skipped:2",
      payloadSummary: {
        request: {
          coveredOperations: 0,
          partialOperations: 0,
          uncoveredOperations: 0,
          skippedOperations: 1,
          notApplicableOperations: 5,
          observedCount: 1,
          validCount: 0,
          invalidCount: 0,
          skippedCount: 1
        },
        response: {
          coveredOperations: 0,
          partialOperations: 0,
          uncoveredOperations: 0,
          skippedOperations: 1,
          notApplicableOperations: 5,
          observedCount: 1,
          validCount: 0,
          invalidCount: 0,
          skippedCount: 1
        },
        counts: { covered: 0, uncovered: 0, skipped: 2 }
      },
      states: {
        "http POST /notes": { request: "SKIPPED", response: "SKIPPED", suites: ["suite-notes"] }
      }
    },
    {
      name: "invalid request and response bodies",
      fixture: "http-payload-invalid.fixture.jsonl",
      semanticCode: "SEMANTIC_HTTP_INVALID_BODY",
      operationCoveragePercent: 33.33,
      requestLine:
        "- request: covered=0 partial=0 uncovered=1 skipped=0 n/a=5 observations=1 valid=0 invalid=1 skipped_observations=0",
      responseLine:
        "- response: covered=1 partial=0 uncovered=1 skipped=0 n/a=4 observations=2 valid=1 invalid=1 skipped_observations=0",
      diagnosticsLine: "- diagnostics: covered=1 uncovered=2 skipped=0",
      machineCounts: "payload_diagnostics=covered:1,uncovered:2,skipped:0",
      payloadSummary: {
        request: {
          coveredOperations: 0,
          partialOperations: 0,
          uncoveredOperations: 1,
          skippedOperations: 0,
          notApplicableOperations: 5,
          observedCount: 1,
          validCount: 0,
          invalidCount: 1,
          skippedCount: 0
        },
        response: {
          coveredOperations: 1,
          partialOperations: 0,
          uncoveredOperations: 1,
          skippedOperations: 0,
          notApplicableOperations: 4,
          observedCount: 2,
          validCount: 1,
          invalidCount: 1,
          skippedCount: 0
        },
        counts: { covered: 1, uncovered: 2, skipped: 0 }
      },
      states: {
        "http GET /audits": { request: "N/A", response: "UNCOVERED", suites: ["suite-invalid-response"] },
        "http POST /users": { request: "UNCOVERED", response: "COVERED", suites: ["suite-invalid-request"] }
      }
    },
    {
      name: "missing body and content type evidence",
      fixture: "http-payload-missing.fixture.jsonl",
      semanticCode: "SEMANTIC_HTTP_MISSING_BODY",
      operationCoveragePercent: 66.67,
      requestLine:
        "- request: covered=0 partial=0 uncovered=2 skipped=0 n/a=4 observations=2 valid=0 invalid=2 skipped_observations=0",
      responseLine:
        "- response: covered=2 partial=0 uncovered=1 skipped=0 n/a=3 observations=4 valid=2 invalid=2 skipped_observations=0",
      diagnosticsLine: "- diagnostics: covered=2 uncovered=4 skipped=0",
      machineCounts: "payload_diagnostics=covered:2,uncovered:4,skipped:0",
      payloadSummary: {
        request: {
          coveredOperations: 0,
          partialOperations: 0,
          uncoveredOperations: 2,
          skippedOperations: 0,
          notApplicableOperations: 4,
          observedCount: 2,
          validCount: 0,
          invalidCount: 2,
          skippedCount: 0
        },
        response: {
          coveredOperations: 2,
          partialOperations: 0,
          uncoveredOperations: 1,
          skippedOperations: 0,
          notApplicableOperations: 3,
          observedCount: 4,
          validCount: 2,
          invalidCount: 2,
          skippedCount: 0
        },
        counts: { covered: 2, uncovered: 4, skipped: 0 }
      },
      states: {
        "http GET /audits": {
          request: "N/A",
          response: "UNCOVERED",
          suites: ["suite-missing-response", "suite-missing-response-content-type"]
        },
        "http POST /drafts": { request: "N/A", response: "COVERED", suites: ["suite-optional-request"] },
        "http POST /profiles": { request: "UNCOVERED", response: "N/A", suites: ["suite-missing-request"] },
        "http POST /users": {
          request: "UNCOVERED",
          response: "COVERED",
          suites: ["suite-missing-request-content-type"]
        }
      }
    },
    {
      name: "partial payload evidence",
      fixture: "http-payload-partial.fixture.jsonl",
      semanticCode: "SEMANTIC_HTTP_INVALID_BODY",
      operationCoveragePercent: 16.67,
      requestLine:
        "- request: covered=0 partial=1 uncovered=0 skipped=0 n/a=5 observations=2 valid=1 invalid=1 skipped_observations=0",
      responseLine:
        "- response: covered=0 partial=1 uncovered=0 skipped=0 n/a=5 observations=2 valid=1 invalid=1 skipped_observations=0",
      diagnosticsLine: "- diagnostics: covered=2 uncovered=2 skipped=0",
      machineCounts: "payload_diagnostics=covered:2,uncovered:2,skipped:0",
      payloadSummary: {
        request: {
          coveredOperations: 0,
          partialOperations: 1,
          uncoveredOperations: 0,
          skippedOperations: 0,
          notApplicableOperations: 5,
          observedCount: 2,
          validCount: 1,
          invalidCount: 1,
          skippedCount: 0
        },
        response: {
          coveredOperations: 0,
          partialOperations: 1,
          uncoveredOperations: 0,
          skippedOperations: 0,
          notApplicableOperations: 5,
          observedCount: 2,
          validCount: 1,
          invalidCount: 1,
          skippedCount: 0
        },
        counts: { covered: 2, uncovered: 2, skipped: 0 }
      },
      states: {
        "http POST /orders": { request: "PARTIAL", response: "PARTIAL", suites: ["suite-orders"] }
      }
    }
  ])("surfaces $name in report artifacts and stdout without changing observation coverage semantics", async ({
    fixture,
    semanticCode,
    operationCoveragePercent,
    requestLine,
    responseLine,
    diagnosticsLine,
    machineCounts,
    payloadSummary,
    states
  }) => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "yanote-js-out-"));

    try {
      const res = await runCli([
        "report",
        "--spec",
        "test/fixtures/openapi/http-payload.yaml",
        "--events",
        `test/fixtures/events/${fixture}`,
        "--out",
        outDir,
        "--profile",
        "local"
      ]);

      expect(res.code).toBe(5);
      expect(res.stderr).toContain(`class=semantic code=${semanticCode}`);
      expect(res.stdout).toContain("HTTP Payload Conformance");
      expect(res.stdout).toContain(requestLine);
      expect(res.stdout).toContain(responseLine);
      expect(res.stdout).toContain(diagnosticsLine);
      expect(res.stdout).toContain(machineCounts);
      expect(res.stdout).toContain(`primary=${semanticCode}`);

      const report = JSON.parse(await readFile(path.join(outDir, "yanote-report.json"), "utf8"));
      expect(report.status).toBe("partial");
      expect(report.summary.totalOperations).toBe(6);
      expect(report.coverage.operations.percent).toBe(operationCoveragePercent);
      expect(report.httpPayloadConformance.summary.request).toEqual(payloadSummary.request);
      expect(report.httpPayloadConformance.summary.response).toEqual(payloadSummary.response);
      expect(report.httpPayloadConformance.diagnostics.counts).toEqual(payloadSummary.counts);
      expect(report.governance.diagnostics.map((item: any) => item.code)).toContain(semanticCode);
      expect(pickPayloadStates(report, Object.keys(states))).toEqual(states);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it.each([
    {
      name: "invalid-body",
      scenario: "invalid-body",
      semanticCode: "SEMANTIC_HTTP_INVALID_BODY",
      operationKey: "http POST /users/{param}",
      summaryRequestLine:
        "- request: covered=0 partial=0 uncovered=1 skipped=0 n/a=0 observations=1 valid=0 invalid=1 skipped_observations=0",
      summaryResponseLine:
        "- response: covered=1 partial=0 uncovered=0 skipped=0 n/a=0 observations=1 valid=1 invalid=0 skipped_observations=0",
      topIssue: "- high: SEMANTIC_HTTP_INVALID_BODY - request payload for http POST /users/{param} media=application/json failed JSON schema validation.",
      forbiddenIssueFragment: "request - INVALID_BODY:",
      requestState: "UNCOVERED",
      responseState: "COVERED"
    },
    {
      name: "unsupported-media",
      scenario: "unsupported-media",
      semanticCode: "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
      operationKey: "http POST /notes/{param}",
      summaryRequestLine:
        "- request: covered=0 partial=0 uncovered=0 skipped=1 n/a=0 observations=1 valid=0 invalid=0 skipped_observations=1",
      summaryResponseLine:
        "- response: covered=0 partial=0 uncovered=0 skipped=1 n/a=0 observations=1 valid=0 invalid=0 skipped_observations=1",
      topIssue:
        "- high: SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE - request payload for http POST /notes/{param} media=text/plain uses a declared media type outside JSON payload conformance support.",
      forbiddenIssueFragment: "request - UNSUPPORTED_MEDIA_TYPE:",
      requestState: "SKIPPED",
      responseState: "SKIPPED"
    },
    {
      name: "unsupported-schema",
      scenario: "unsupported-schema",
      semanticCode: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
      operationKey: "http POST /compile-fail/{param}",
      summaryRequestLine:
        "- request: covered=0 partial=0 uncovered=0 skipped=1 n/a=0 observations=1 valid=0 invalid=0 skipped_observations=1",
      summaryResponseLine:
        "- response: covered=0 partial=0 uncovered=0 skipped=1 n/a=0 observations=1 valid=0 invalid=0 skipped_observations=1",
      topIssue:
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SCHEMA - request payload for http POST /compile-fail/{param} media=application/json declares JSON content without a usable validation schema.",
      forbiddenIssueFragment: "request - UNSUPPORTED_SCHEMA:",
      requestState: "SKIPPED",
      responseState: "SKIPPED"
    }
  ])("fails closed for fully observed $name payload drift without duplicating the primary issue", async ({
    scenario,
    semanticCode,
    operationKey,
    summaryRequestLine,
    summaryResponseLine,
    topIssue,
    forbiddenIssueFragment,
    requestState,
    responseState
  }) => {
    const fixture = await createFullObservationPayloadTruthFixture(
      scenario as "invalid-body" | "unsupported-media" | "unsupported-schema"
    );

    try {
      const res = await runCli([
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

      expect(res.code).toBe(5);
      expect(res.stderr).toContain(`YANOTE_ERROR class=semantic code=${semanticCode}`);
      expect(res.stdout).toContain("- status: partial");
      expect(res.stdout).toContain("- operations: 1/1 (100.00%)");
      expect(res.stdout).toContain("- status: 100.00% (COVERED)");
      expect(res.stdout).toContain("- parameters: 100.00% (COVERED)");
      expect(res.stdout).toContain("- aggregate: 100.00% (COVERED)");
      expect(res.stdout).toContain(summaryRequestLine);
      expect(res.stdout).toContain(summaryResponseLine);
      expect(res.stdout).toContain(topIssue);
      expect(res.stdout).not.toContain(forbiddenIssueFragment);
      expect(res.stdout).toContain(`primary=${semanticCode}`);

      const report = JSON.parse(await readFile(path.join(fixture.outDir, "yanote-report.json"), "utf8"));
      expect(report.status).toBe("partial");
      expect(report.coverage.operations).toEqual({ state: "COVERED", percent: 100 });
      expect(report.coverage.status).toEqual({ state: "COVERED", percent: 100 });
      expect(report.coverage.parameters).toEqual({ state: "COVERED", percent: 100 });
      expect(report.coverage.aggregate).toEqual({ state: "COVERED", percent: 100 });
      expect(report.governance.diagnostics.map((item: any) => item.code)).toContain(semanticCode);
      expect(pickPayloadStates(report, [operationKey])).toEqual({
        [operationKey]: {
          request: requestState,
          response: responseState,
          suites:
            scenario === "invalid-body"
              ? ["suite-invalid-body"]
              : scenario === "unsupported-media"
                ? ["suite-unsupported-media"]
                : ["suite-unsupported-schema"]
        }
      });
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("keeps fully observed NO_DECLARED_CONTENT paths green and out of Top Issues", async () => {
    const fixture = await createFullObservationPayloadTruthFixture("no-declared-content");

    try {
      const res = await runCli([
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

      expect(res.code).toBe(0);
      expect(res.stderr).toBe("");
      expect(res.stdout).toContain("- status: ok");
      expect(res.stdout).toContain("- operations: 1/1 (100.00%)");
      expect(res.stdout).toContain("- status: 100.00% (COVERED)");
      expect(res.stdout).toContain("- parameters: 100.00% (COVERED)");
      expect(res.stdout).toContain("- aggregate: 100.00% (COVERED)");
      expect(res.stdout).toContain("- none");
      expect(res.stdout).toContain("primary=none");
      expect(res.stdout).not.toContain("NO_DECLARED_CONTENT");

      const report = JSON.parse(await readFile(path.join(fixture.outDir, "yanote-report.json"), "utf8"));
      expect(report.status).toBe("ok");
      expect(report.httpPayloadConformance.diagnostics.items.map((item: any) => item.code)).toEqual([
        "NO_DECLARED_CONTENT",
        "NO_DECLARED_CONTENT"
      ]);
      expect(report.governance.diagnostics).toEqual([]);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("surfaces the shared S03 format/media fixtures through stdout, stderr, and report artifacts without raw diagnostic duplication", async () => {
    const fixture = await createSharedFormatMediaFixture([
      "test/fixtures/events/http-payload-valid-format.fixture.jsonl",
      "test/fixtures/events/http-payload-invalid-format.fixture.jsonl",
      "test/fixtures/events/http-payload-unsupported-format.fixture.jsonl",
      "test/fixtures/events/http-payload-media-specificity.fixture.jsonl"
    ]);

    try {
      const res = await runCli([
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

      expect(res.code).toBe(5);
      expect(res.stderr).toContain("YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_INVALID_BODY");
      expect(res.stderr).toContain(
        "YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT"
      );
      expect(res.stdout).toContain("- operations: 4/4 (100.00%)");
      expect(res.stdout).toContain(
        "- request: covered=1 partial=0 uncovered=2 skipped=1 n/a=0 observations=4 valid=1 invalid=2 skipped_observations=1"
      );
      expect(res.stdout).toContain(
        "- response: covered=4 partial=0 uncovered=0 skipped=0 n/a=0 observations=4 valid=4 invalid=0 skipped_observations=0"
      );
      expect(res.stdout).toContain("- diagnostics: covered=5 uncovered=2 skipped=1");
      expect(res.stdout).toContain("primary=SEMANTIC_HTTP_INVALID_BODY");
      expect(res.stdout).not.toContain("request - INVALID_BODY:");
      expect(res.stdout).not.toContain("request - UNSUPPORTED_SCHEMA_FORMAT:");

      const report = JSON.parse(await readFile(path.join(fixture.outDir, "yanote-report.json"), "utf8"));
      expect(report.status).toBe("partial");
      expect(report.coverage.operations).toEqual({ state: "COVERED", percent: 100 });
      expect(report.governance.diagnostics.map((item: any) => item.code)).toEqual([
        "SEMANTIC_HTTP_INVALID_BODY",
        "SEMANTIC_HTTP_INVALID_BODY",
        "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT"
      ]);
      expect(pickPayloadStates(report, [
        "http POST /subscribers",
        "http POST /verifications",
        "http POST /custom-format",
        "http POST /incidents"
      ])).toEqual({
        "http POST /subscribers": { request: "COVERED", response: "COVERED", suites: ["suite-format-valid"] },
        "http POST /verifications": { request: "UNCOVERED", response: "COVERED", suites: ["suite-format-invalid"] },
        "http POST /custom-format": { request: "SKIPPED", response: "COVERED", suites: ["suite-format-unsupported"] },
        "http POST /incidents": { request: "UNCOVERED", response: "COVERED", suites: ["suite-media-specificity"] }
      });
      expect(
        report.httpPayloadConformance.diagnostics.items
          .filter((item: any) => item.operationKey === "http POST /incidents")
          .map((item: any) => ({ target: item.target, code: item.code, observedMediaType: item.observedMediaType }))
      ).toEqual([
        { target: "request", code: "INVALID_BODY", observedMediaType: "application/problem+json" },
        { target: "response", code: "VALID", observedMediaType: "application/problem+json" }
      ]);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("surfaces critical-operation exclusion override usage in report artifacts", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "yanote-js-out-"));
    const policyPath = path.join(outDir, "policy.yaml");
    await writeFile(
      policyPath,
      [
        "profile: ci",
        "thresholds:",
        "  criticalOperations:",
        "    - http GET /users/{param}",
        "exclusions:",
        "  rules:",
        "    - pattern: /users/*",
        "      rationale: Temporary maintenance window",
        "      owner: api-team",
        "      expiresOn: 2099-12-31",
        "      allowCriticalOverride: true"
      ].join("\n"),
      "utf8"
    );

    try {
      const res = await runCli([
        "report",
        "--spec",
        "test/fixtures/openapi/simple.yaml",
        "--events",
        "test/fixtures/events/events.valid.fixture.jsonl",
        "--out",
        outDir,
        "--policy",
        policyPath
      ]);

      expect(res.code).toBe(3);
      const report = JSON.parse(await readFile(path.join(outDir, "yanote-report.json"), "utf8"));
      expect(report.governance.exclusions.appliedRules.length).toBeGreaterThan(0);
      expect(report.governance.exclusions.appliedRules[0].usedCriticalOverride).toBe(true);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
