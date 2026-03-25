import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeCoverage } from "../coverage/coverage.js";
import { computeHttpRequestConformance } from "../coverage/httpRequestConformance.js";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { loadOpenApiCoverageModel } from "../spec/openapi.js";
import { normalizeReport } from "./normalize.js";
import { buildReport } from "./report.js";
import { validateReport } from "./schema.js";

async function buildRequestEvidenceReport() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-report-request-evidence-"));
  const specPath = path.join(dir, "openapi.yaml");
  const eventsPath = path.join(dir, "events.jsonl");

  await writeFile(
    specPath,
    [
      "openapi: 3.0.0",
      "info:",
      "  title: request evidence contract",
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
      "        - name: content",
      "          in: query",
      "          required: false",
      "          content:",
      "            application/json:",
      "              schema:",
      "                type: string",
      "        - name: meta",
      "          in: query",
      "          required: false",
      "          schema:",
      "            type: object",
      "            properties:",
      "              enabled:",
      "                type: boolean",
      "        - name: scores",
      "          in: query",
      "          required: false",
      "          schema:",
      "            type: array",
      "            items:",
      "              type: integer",
      "              minimum: 1",
      "        - name: tags",
      "          in: query",
      "          required: false",
      "          schema:",
      "            type: array",
      "            items:",
      "              type: string",
      "              minLength: 2",
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
      "        - name: prefs-list",
      "          in: cookie",
      "          required: false",
      "          schema:",
      "            type: array",
      "            items:",
      "              type: string",
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
      ts: 1772450010001,
      method: "GET",
      route: "/evidence/users/user-42",
      status: 200,
      queryKeys: ["meta", "scores", "tags", "token", "verbose"],
      headerKeys: ["x-trace-id"],
      pathParams: {
        id: { state: "captured", values: ["user-42"] }
      },
      queryParams: {
        meta: { state: "captured", values: ["opaque"] },
        scores: { state: "captured", values: ["5", "zero"] },
        tags: { state: "captured", values: ["red", "blue"] },
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

  try {
    const model = await loadOpenApiCoverageModel(specPath);
    const events = await readHttpEventsJsonl(eventsPath);
    const coverage = computeCoverage(model.operations, events.items, [], {
      operationContractsByKey: model.operationContractsByKey
    });
    const requestConformance = computeHttpRequestConformance(model.operations, events.items, {
      operationContractsByKey: model.operationContractsByKey
    });

    return normalizeReport(
      buildReport(coverage, {
        toolVersion: "test",
        eventTimestamps: events.items
          .map((event) => event.ts)
          .filter((timestamp): timestamp is number => typeof timestamp === "number"),
        requestConformance
      })
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("report request evidence contract", () => {
  it("serializes additive request evidence and repeated-query-array truth on a dedicated schema-valid surface", async () => {
    const report = await buildRequestEvidenceReport();

    expect(validateReport(report).ok).toBe(true);
    expect(report.status).toBe("ok");
    expect(report.coverage.operations).toEqual({ state: "COVERED", percent: 100 });
    expect(report.coverage.status).toEqual({ state: "COVERED", percent: 100 });
    expect(report.coverage.parameters).toEqual({ state: "COVERED", percent: 100 });
    expect(report.summary.operationCoveragePercent).toBe(100);
    expect(report.httpRequestConformance.summary).toEqual({
      observedOperations: 1,
      observedParameters: 10,
      counts: {
        capturedValid: 3,
        capturedInvalid: 3,
        redacted: 1,
        omitted: 1,
        unsupported: 2
      }
    });
    expect(report.httpRequestConformance.perOperation).toEqual([
      {
        operationKey: "http GET /evidence/users/{param}",
        method: "GET",
        route: "/evidence/users/{param}",
        observedCount: 1,
        counts: {
          capturedValid: 3,
          capturedInvalid: 3,
          redacted: 1,
          omitted: 1,
          unsupported: 2
        },
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            style: "simple",
            explode: false,
            declaredSupport: "supported",
            declaredSupportShape: "scalar",
            scalarSupport: "supported",
            observedCount: 1,
            counts: {
              capturedValid: 1,
              capturedInvalid: 0,
              redacted: 0,
              omitted: 0,
              unsupported: 0
            },
            suites: ["suite-request-evidence"]
          },
          {
            name: "content",
            in: "query",
            required: false,
            style: "form",
            explode: true,
            declaredSupport: "unsupported",
            declaredSupportReason: "content",
            scalarSupport: "unsupported",
            scalarSupportReason: "schema",
            observedCount: 0,
            counts: {
              capturedValid: 0,
              capturedInvalid: 0,
              redacted: 0,
              omitted: 0,
              unsupported: 0
            },
            suites: []
          },
          {
            name: "meta",
            in: "query",
            required: false,
            style: "form",
            explode: true,
            declaredSupport: "unsupported",
            declaredSupportReason: "schema",
            scalarSupport: "unsupported",
            scalarSupportReason: "schema",
            observedCount: 1,
            counts: {
              capturedValid: 0,
              capturedInvalid: 0,
              redacted: 0,
              omitted: 0,
              unsupported: 1
            },
            suites: ["suite-request-evidence"]
          },
          {
            name: "scores",
            in: "query",
            required: false,
            style: "form",
            explode: true,
            declaredSupport: "supported",
            declaredSupportShape: "array",
            scalarSupport: "unsupported",
            scalarSupportReason: "schema",
            observedCount: 1,
            counts: {
              capturedValid: 0,
              capturedInvalid: 1,
              redacted: 0,
              omitted: 0,
              unsupported: 0
            },
            suites: ["suite-request-evidence"]
          },
          {
            name: "tags",
            in: "query",
            required: false,
            style: "form",
            explode: true,
            declaredSupport: "supported",
            declaredSupportShape: "array",
            scalarSupport: "unsupported",
            scalarSupportReason: "schema",
            observedCount: 1,
            counts: {
              capturedValid: 1,
              capturedInvalid: 0,
              redacted: 0,
              omitted: 0,
              unsupported: 0
            },
            suites: ["suite-request-evidence"]
          },
          {
            name: "token",
            in: "query",
            required: false,
            style: "form",
            explode: true,
            declaredSupport: "supported",
            declaredSupportShape: "scalar",
            scalarSupport: "supported",
            observedCount: 1,
            counts: {
              capturedValid: 0,
              capturedInvalid: 0,
              redacted: 0,
              omitted: 0,
              unsupported: 1
            },
            suites: ["suite-request-evidence"]
          },
          {
            name: "verbose",
            in: "query",
            required: false,
            style: "form",
            explode: true,
            declaredSupport: "supported",
            declaredSupportShape: "scalar",
            scalarSupport: "supported",
            observedCount: 1,
            counts: {
              capturedValid: 0,
              capturedInvalid: 1,
              redacted: 0,
              omitted: 0,
              unsupported: 0
            },
            suites: ["suite-request-evidence"]
          },
          {
            name: "X-Trace-Id",
            in: "header",
            required: true,
            style: "simple",
            explode: false,
            declaredSupport: "supported",
            declaredSupportShape: "scalar",
            scalarSupport: "supported",
            observedCount: 1,
            counts: {
              capturedValid: 1,
              capturedInvalid: 0,
              redacted: 0,
              omitted: 0,
              unsupported: 0
            },
            suites: ["suite-request-evidence"]
          },
          {
            name: "prefs",
            in: "cookie",
            required: true,
            style: "form",
            explode: true,
            declaredSupport: "supported",
            declaredSupportShape: "scalar",
            scalarSupport: "supported",
            observedCount: 1,
            counts: {
              capturedValid: 0,
              capturedInvalid: 1,
              redacted: 0,
              omitted: 0,
              unsupported: 0
            },
            suites: ["suite-request-evidence"]
          },
          {
            name: "prefs-list",
            in: "cookie",
            required: false,
            style: "form",
            explode: true,
            declaredSupport: "unsupported",
            declaredSupportReason: "style",
            scalarSupport: "unsupported",
            scalarSupportReason: "schema",
            observedCount: 0,
            counts: {
              capturedValid: 0,
              capturedInvalid: 0,
              redacted: 0,
              omitted: 0,
              unsupported: 0
            },
            suites: []
          },
          {
            name: "session",
            in: "cookie",
            required: true,
            style: "form",
            explode: true,
            declaredSupport: "supported",
            declaredSupportShape: "scalar",
            scalarSupport: "supported",
            observedCount: 1,
            counts: {
              capturedValid: 0,
              capturedInvalid: 0,
              redacted: 1,
              omitted: 0,
              unsupported: 0
            },
            suites: ["suite-request-evidence"]
          },
          {
            name: "theme",
            in: "cookie",
            required: false,
            style: "form",
            explode: true,
            declaredSupport: "supported",
            declaredSupportShape: "scalar",
            scalarSupport: "supported",
            observedCount: 1,
            counts: {
              capturedValid: 0,
              capturedInvalid: 0,
              redacted: 0,
              omitted: 1,
              unsupported: 0
            },
            suites: ["suite-request-evidence"]
          }
        ],
        suites: ["suite-request-evidence"]
      }
    ]);
    expect(
      report.httpRequestConformance.diagnostics.items.map((diagnostic) => ({
        location: diagnostic.location,
        name: diagnostic.name,
        truth: diagnostic.truth,
        observedValues: diagnostic.observedValues,
        evidenceReason: diagnostic.evidenceReason
      }))
    ).toEqual([
      { location: "path", name: "id", truth: "captured-valid", observedValues: ["user-42"], evidenceReason: undefined },
      { location: "query", name: "meta", truth: "unsupported", observedValues: ["opaque"], evidenceReason: undefined },
      {
        location: "query",
        name: "scores",
        truth: "captured-invalid",
        observedValues: ["5", "zero"],
        evidenceReason: undefined
      },
      {
        location: "query",
        name: "tags",
        truth: "captured-valid",
        observedValues: ["red", "blue"],
        evidenceReason: undefined
      },
      { location: "query", name: "token", truth: "unsupported", observedValues: ["one", "two"], evidenceReason: undefined },
      { location: "query", name: "verbose", truth: "captured-invalid", observedValues: ["maybe"], evidenceReason: undefined },
      {
        location: "header",
        name: "X-Trace-Id",
        truth: "captured-valid",
        observedValues: ["120"],
        evidenceReason: undefined
      },
      { location: "cookie", name: "prefs", truth: "captured-invalid", observedValues: ["ab"], evidenceReason: undefined },
      { location: "cookie", name: "session", truth: "redacted", observedValues: undefined, evidenceReason: "sensitive" },
      { location: "cookie", name: "theme", truth: "omitted", observedValues: undefined, evidenceReason: "unavailable" }
    ]);
    expect(report).toHaveProperty("httpRequestConformance");
    expect(report.coverage).not.toHaveProperty("httpRequestConformance");
  });
});
