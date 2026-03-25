import { describe, expect, it } from "vitest";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { serializeOperationKey } from "../model/operationKey.js";
import { loadOpenApiCoverageModel, type HttpOperationContract } from "../spec/openapi.js";
import { computeHttpPayloadConformance } from "./httpPayloadConformance.js";

describe("computeHttpPayloadConformance", () => {
  it("validates one supported JSON request and response flow end to end", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-payload-valid.fixture.jsonl")).items;

    const result = computeHttpPayloadConformance(model.operations, events, {
      operationContractsByKey: model.operationContractsByKey
    });

    const users = result.perOperation.find((entry) => entry.operationKey === "http POST /users");
    const notes = result.perOperation.find((entry) => entry.operationKey === "http POST /notes");
    const drafts = result.perOperation.find((entry) => entry.operationKey === "http POST /drafts");

    expect(users).toMatchObject({
      request: {
        state: "COVERED",
        observedCount: 1,
        validCount: 1,
        invalidCount: 0,
        skippedCount: 0,
        declaredMediaTypes: ["application/json"],
        observedMediaTypes: ["application/json"]
      },
      response: {
        state: "COVERED",
        observedCount: 1,
        validCount: 1,
        invalidCount: 0,
        skippedCount: 0,
        declaredMediaTypes: ["application/json", "application/problem+json"],
        observedMediaTypes: ["application/json"],
        declaredContent: [
          { declaredStatus: "201", mediaTypes: ["application/json"] },
          { declaredStatus: "415", mediaTypes: ["application/problem+json"] }
        ]
      },
      suites: ["suite-users"]
    });
    expect(notes?.request.state).toBe("N/A");
    expect(notes?.response.state).toBe("N/A");
    expect(drafts?.request.state).toBe("N/A");
    expect(drafts?.response.state).toBe("N/A");
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics[0]).toMatchObject({
      operationKey: "http POST /users",
      method: "POST",
      route: "/users",
      target: "request",
      suite: "suite-users",
      state: "COVERED",
      code: "VALID",
      message: "Observed request JSON payload matches the declared schema.",
      observedMediaType: "application/json",
      declaredMediaTypes: ["application/json"]
    });
    expect(result.diagnostics[1]).toMatchObject({
      operationKey: "http POST /users",
      method: "POST",
      route: "/users",
      target: "response",
      suite: "suite-users",
      state: "COVERED",
      code: "VALID",
      message: "Observed response JSON payload matches the declared schema.",
      declaredStatus: "201",
      observedStatus: 201,
      observedMediaType: "application/json",
      declaredMediaTypes: ["application/json"]
    });
  });

  it("emits explicit skipped diagnostics for declared but unsupported media types", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-payload-unsupported.fixture.jsonl")).items;

    const result = computeHttpPayloadConformance(model.operations, events, {
      operationContractsByKey: model.operationContractsByKey
    });

    const notes = result.perOperation.find((entry) => entry.operationKey === "http POST /notes");

    expect(notes).toMatchObject({
      request: {
        state: "SKIPPED",
        observedCount: 1,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 1,
        declaredMediaTypes: ["text/plain"],
        observedMediaTypes: ["text/plain"]
      },
      response: {
        state: "SKIPPED",
        observedCount: 1,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 1,
        declaredMediaTypes: ["text/plain"],
        observedMediaTypes: ["text/plain"],
        declaredContent: [{ declaredStatus: "202", mediaTypes: ["text/plain"] }]
      },
      suites: ["suite-notes"]
    });
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics[0]).toMatchObject({
      operationKey: "http POST /notes",
      method: "POST",
      route: "/notes",
      target: "request",
      suite: "suite-notes",
      state: "SKIPPED",
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "Observed request content type is declared but outside JSON payload conformance support.",
      observedMediaType: "text/plain",
      declaredMediaTypes: ["text/plain"]
    });
    expect(result.diagnostics[1]).toMatchObject({
      operationKey: "http POST /notes",
      method: "POST",
      route: "/notes",
      target: "response",
      suite: "suite-notes",
      state: "SKIPPED",
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "Observed response content type is declared but outside JSON payload conformance support.",
      declaredStatus: "202",
      observedStatus: 202,
      observedMediaType: "text/plain",
      declaredMediaTypes: ["text/plain"]
    });
  });

  it("surfaces invalid request and response payloads with Ajv error arrays", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-payload-invalid.fixture.jsonl")).items;

    const result = computeHttpPayloadConformance(model.operations, events, {
      operationContractsByKey: model.operationContractsByKey
    });

    expect(result.perOperation.find((entry) => entry.operationKey === "http POST /users")).toMatchObject({
      request: {
        state: "UNCOVERED",
        observedCount: 1,
        validCount: 0,
        invalidCount: 1,
        skippedCount: 0,
        observedMediaTypes: ["application/json"]
      },
      response: {
        state: "COVERED",
        observedCount: 1,
        validCount: 1,
        invalidCount: 0,
        skippedCount: 0,
        observedMediaTypes: ["application/json"]
      },
      suites: ["suite-invalid-request"]
    });
    expect(result.perOperation.find((entry) => entry.operationKey === "http GET /audits")).toMatchObject({
      request: {
        state: "N/A",
        observedCount: 0,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 0,
        observedMediaTypes: []
      },
      response: {
        state: "UNCOVERED",
        observedCount: 1,
        validCount: 0,
        invalidCount: 1,
        skippedCount: 0,
        observedMediaTypes: ["application/json"]
      },
      suites: ["suite-invalid-response"]
    });

    expect(result.diagnostics).toHaveLength(3);
    expect(result.diagnostics[0]).toMatchObject({
      operationKey: "http GET /audits",
      target: "response",
      state: "UNCOVERED",
      code: "INVALID_BODY",
      suite: "suite-invalid-response",
      declaredStatus: "200",
      observedStatus: 200,
      observedMediaType: "application/json",
      errors: ["/entries/0 must be string"]
    });
    expect(result.diagnostics[1]).toMatchObject({
      operationKey: "http POST /users",
      target: "request",
      state: "UNCOVERED",
      code: "INVALID_BODY",
      suite: "suite-invalid-request",
      observedMediaType: "application/json",
      errors: ["/ must have required property 'profile'"]
    });
    expect(result.diagnostics[2]).toMatchObject({
      operationKey: "http POST /users",
      target: "response",
      state: "COVERED",
      code: "VALID",
      suite: "suite-invalid-request",
      observedMediaType: "application/json"
    });
    expect(result.diagnostics[2]?.errors).toBeUndefined();
  });

  it("surfaces missing evidence deterministically and keeps optional request absence not applicable", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-payload-missing.fixture.jsonl")).items;

    const result = computeHttpPayloadConformance(model.operations, events, {
      operationContractsByKey: model.operationContractsByKey
    });

    expect(result.perOperation.find((entry) => entry.operationKey === "http POST /profiles")).toMatchObject({
      request: {
        state: "UNCOVERED",
        observedCount: 1,
        validCount: 0,
        invalidCount: 1,
        skippedCount: 0,
        observedMediaTypes: []
      },
      response: {
        state: "N/A",
        observedCount: 0,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 0,
        observedMediaTypes: [],
        declaredContent: [{ declaredStatus: "204", mediaTypes: [] }]
      },
      suites: ["suite-missing-request"]
    });
    expect(result.perOperation.find((entry) => entry.operationKey === "http POST /users")).toMatchObject({
      request: {
        state: "UNCOVERED",
        observedCount: 1,
        validCount: 0,
        invalidCount: 1,
        skippedCount: 0,
        observedMediaTypes: []
      },
      response: {
        state: "COVERED",
        observedCount: 1,
        validCount: 1,
        invalidCount: 0,
        skippedCount: 0,
        observedMediaTypes: ["application/json"]
      },
      suites: ["suite-missing-request-content-type"]
    });
    expect(result.perOperation.find((entry) => entry.operationKey === "http GET /audits")).toMatchObject({
      response: {
        state: "UNCOVERED",
        observedCount: 2,
        validCount: 0,
        invalidCount: 2,
        skippedCount: 0,
        observedMediaTypes: []
      },
      suites: ["suite-missing-response", "suite-missing-response-content-type"]
    });
    expect(result.perOperation.find((entry) => entry.operationKey === "http POST /drafts")).toMatchObject({
      request: {
        state: "N/A",
        observedCount: 0,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 0,
        observedMediaTypes: []
      },
      response: {
        state: "COVERED",
        observedCount: 1,
        validCount: 1,
        invalidCount: 0,
        skippedCount: 0,
        observedMediaTypes: ["application/json"]
      },
      suites: ["suite-optional-request"]
    });

    const uncoveredDiagnostics = result.diagnostics.filter((diagnostic) => diagnostic.state === "UNCOVERED");
    expect(uncoveredDiagnostics).toEqual([
      expect.objectContaining({
        operationKey: "http GET /audits",
        target: "response",
        suite: "suite-missing-response",
        code: "MISSING_BODY",
        declaredStatus: "200",
        observedStatus: 200,
        declaredMediaTypes: ["application/json"]
      }),
      expect.objectContaining({
        operationKey: "http GET /audits",
        target: "response",
        suite: "suite-missing-response-content-type",
        code: "MISSING_CONTENT_TYPE",
        declaredStatus: "200",
        observedStatus: 200,
        declaredMediaTypes: ["application/json"]
      }),
      expect.objectContaining({
        operationKey: "http POST /profiles",
        target: "request",
        suite: "suite-missing-request",
        code: "MISSING_BODY",
        declaredMediaTypes: ["application/json"]
      }),
      expect.objectContaining({
        operationKey: "http POST /users",
        target: "request",
        suite: "suite-missing-request-content-type",
        code: "MISSING_CONTENT_TYPE",
        declaredMediaTypes: ["application/json"]
      })
    ]);
    expect(result.diagnostics.find((diagnostic) => diagnostic.operationKey === "http POST /drafts" && diagnostic.target === "request")).toBeUndefined();
  });

  it("marks mixed valid and invalid observations as PARTIAL per target", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-payload-partial.fixture.jsonl")).items;

    const result = computeHttpPayloadConformance(model.operations, events, {
      operationContractsByKey: model.operationContractsByKey
    });

    expect(result.perOperation.find((entry) => entry.operationKey === "http POST /orders")).toMatchObject({
      request: {
        state: "PARTIAL",
        observedCount: 2,
        validCount: 1,
        invalidCount: 1,
        skippedCount: 0,
        declaredMediaTypes: ["application/json"],
        observedMediaTypes: ["application/json"]
      },
      response: {
        state: "PARTIAL",
        observedCount: 2,
        validCount: 1,
        invalidCount: 1,
        skippedCount: 0,
        declaredMediaTypes: ["application/json"],
        observedMediaTypes: ["application/json"],
        declaredContent: [{ declaredStatus: "201", mediaTypes: ["application/json"] }]
      },
      suites: ["suite-orders"]
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        operationKey: "http POST /orders",
        target: "request",
        state: "UNCOVERED",
        code: "INVALID_BODY",
        suite: "suite-orders",
        errors: ["/quantity must be >= 1"]
      }),
      expect.objectContaining({
        operationKey: "http POST /orders",
        target: "request",
        state: "COVERED",
        code: "VALID",
        suite: "suite-orders"
      }),
      expect.objectContaining({
        operationKey: "http POST /orders",
        target: "response",
        state: "UNCOVERED",
        code: "INVALID_BODY",
        suite: "suite-orders",
        errors: ["/ must have required property 'status'"]
      }),
      expect.objectContaining({
        operationKey: "http POST /orders",
        target: "response",
        state: "COVERED",
        code: "VALID",
        suite: "suite-orders"
      })
    ]);
  });

  it("emits explicit skipped diagnostics when JSON media has no usable schema", () => {
    const operations = [{ kind: "http", method: "POST", route: "/schema-less" }] as const;
    const operationKey = serializeOperationKey(operations[0]);
    const contracts = new Map<string, HttpOperationContract>([
      [
        operationKey,
        {
          declaredStatuses: ["202"],
          parameters: [],
          requestBody: {
            required: true,
            content: [{ mediaType: "application/json" }]
          },
          responseBodies: [
            {
              declaredStatus: "202",
              content: [{ mediaType: "application/json" }]
            }
          ]
        }
      ]
    ]);

    const result = computeHttpPayloadConformance(
      [...operations],
      [
        {
          kind: "http",
          method: "POST",
          route: "/schema-less",
          status: 202,
          requestBody: { hello: "world" },
          requestContentType: "application/json",
          responseBody: { ok: true },
          responseContentType: "application/json",
          queryKeys: [],
          headerKeys: [],
          testRunId: "run-1",
          testSuite: "suite-schema"
        }
      ],
      { operationContractsByKey: contracts }
    );

    expect(result.perOperation[0]).toMatchObject({
      request: { state: "SKIPPED", skippedCount: 1 },
      response: { state: "SKIPPED", skippedCount: 1 }
    });
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics[0]).toMatchObject({
      operationKey,
      method: "POST",
      route: "/schema-less",
      target: "request",
      suite: "suite-schema",
      state: "SKIPPED",
      code: "UNSUPPORTED_SCHEMA",
      message: "Observed request content type is JSON but no usable schema was declared.",
      observedMediaType: "application/json",
      declaredMediaTypes: ["application/json"]
    });
    expect(result.diagnostics[1]).toMatchObject({
      operationKey,
      method: "POST",
      route: "/schema-less",
      target: "response",
      suite: "suite-schema",
      state: "SKIPPED",
      code: "UNSUPPORTED_SCHEMA",
      message: "Observed response content type is JSON but no usable schema was declared.",
      declaredStatus: "202",
      observedStatus: 202,
      observedMediaType: "application/json",
      declaredMediaTypes: ["application/json"]
    });
  });

  it("converts schema compile failures into unsupported-schema diagnostics instead of throwing", () => {
    const operations = [{ kind: "http", method: "POST", route: "/compile-fail" }] as const;
    const operationKey = serializeOperationKey(operations[0]);
    const invalidRegexSchema = {
      type: "string",
      pattern: "["
    } as const;
    const contracts = new Map<string, HttpOperationContract>([
      [
        operationKey,
        {
          declaredStatuses: ["202"],
          parameters: [],
          requestBody: {
            required: true,
            content: [{ mediaType: "application/json", schema: invalidRegexSchema }]
          },
          responseBodies: [
            {
              declaredStatus: "202",
              content: [{ mediaType: "application/json", schema: invalidRegexSchema }]
            }
          ]
        }
      ]
    ]);

    const result = computeHttpPayloadConformance(
      [...operations],
      [
        {
          kind: "http",
          method: "POST",
          route: "/compile-fail",
          status: 202,
          requestBody: "hello",
          requestContentType: "application/json",
          responseBody: "ok",
          responseContentType: "application/json",
          queryKeys: [],
          headerKeys: [],
          testRunId: "run-5",
          testSuite: "suite-compile"
        }
      ],
      { operationContractsByKey: contracts }
    );

    expect(result.perOperation[0]).toMatchObject({
      request: { state: "SKIPPED", skippedCount: 1 },
      response: { state: "SKIPPED", skippedCount: 1 }
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        operationKey,
        target: "request",
        state: "SKIPPED",
        code: "UNSUPPORTED_SCHEMA",
        message: "Observed request content type is JSON but the declared schema could not be compiled for validation.",
        errors: [expect.stringContaining("Invalid regular expression")]
      }),
      expect.objectContaining({
        operationKey,
        target: "response",
        state: "SKIPPED",
        code: "UNSUPPORTED_SCHEMA",
        message: "Observed response content type is JSON but the declared schema could not be compiled for validation.",
        errors: [expect.stringContaining("Invalid regular expression")]
      })
    ]);
  });

  it("skips undeclared request and response content instead of falling through", () => {
    const operations = [{ kind: "http", method: "GET", route: "/no-content" }] as const;
    const operationKey = serializeOperationKey(operations[0]);
    const contracts = new Map<string, HttpOperationContract>([
      [
        operationKey,
        {
          declaredStatuses: ["204"],
          parameters: [],
          responseBodies: [{ declaredStatus: "204", content: [] }]
        }
      ]
    ]);

    const result = computeHttpPayloadConformance(
      [...operations],
      [
        {
          kind: "http",
          method: "GET",
          route: "/no-content",
          status: 204,
          requestBody: { probe: true },
          requestContentType: "application/json",
          responseBody: { ok: true },
          responseContentType: "application/json",
          queryKeys: [],
          headerKeys: [],
          testRunId: "run-6",
          testSuite: "suite-no-content"
        }
      ],
      { operationContractsByKey: contracts }
    );

    expect(result.perOperation[0]).toMatchObject({
      request: { state: "SKIPPED", skippedCount: 1 },
      response: { state: "SKIPPED", skippedCount: 1 }
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        operationKey,
        target: "request",
        state: "SKIPPED",
        code: "NO_DECLARED_CONTENT",
        message: "Operation does not declare a request body contract."
      }),
      expect.objectContaining({
        operationKey,
        target: "response",
        state: "SKIPPED",
        code: "NO_DECLARED_CONTENT",
        message: "Operation does not declare response content for the observed status.",
        declaredStatus: "204",
        observedStatus: 204
      })
    ]);
  });

  it("surfaces explicit drift diagnostics for invalid, missing, and unsupported payload paths", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload.yaml");
    const invalidEvents = (await readHttpEventsJsonl("test/fixtures/events/http-payload-invalid.fixture.jsonl")).items;
    const missingEvents = (await readHttpEventsJsonl("test/fixtures/events/http-payload-missing.fixture.jsonl")).items;

    const invalidResult = computeHttpPayloadConformance(model.operations, invalidEvents, {
      operationContractsByKey: model.operationContractsByKey
    });
    const missingResult = computeHttpPayloadConformance(model.operations, missingEvents, {
      operationContractsByKey: model.operationContractsByKey
    });

    const compileOperation = { kind: "http", method: "POST", route: "/compile-fail-verify" } as const;
    const compileKey = serializeOperationKey(compileOperation);
    const compileResult = computeHttpPayloadConformance(
      [compileOperation],
      [
        {
          kind: "http",
          method: "POST",
          route: "/compile-fail-verify",
          status: 202,
          requestBody: "hello",
          requestContentType: "application/json",
          responseBody: "ok",
          responseContentType: "application/json",
          queryKeys: [],
          headerKeys: [],
          testRunId: "run-7",
          testSuite: "suite-compile-verify"
        }
      ],
      {
        operationContractsByKey: new Map([
          [
            compileKey,
            {
              declaredStatuses: ["202"],
              parameters: [],
              requestBody: {
                required: true,
                content: [{ mediaType: "application/json", schema: { type: "string", pattern: "[" } }]
              },
              responseBodies: [
                {
                  declaredStatus: "202",
                  content: [{ mediaType: "application/json", schema: { type: "string", pattern: "[" } }]
                }
              ]
            }
          ]
        ])
      }
    );

    expect(invalidResult.diagnostics.map((diagnostic) => diagnostic.code)).toContain("INVALID_BODY");
    expect(missingResult.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining(["MISSING_BODY", "MISSING_CONTENT_TYPE"])
    );
    expect(compileResult.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(["UNSUPPORTED_SCHEMA", "UNSUPPORTED_SCHEMA"]);
    expect(compileResult.diagnostics.flatMap((diagnostic) => diagnostic.errors ?? [])).toEqual([
      expect.stringContaining("Invalid regular expression"),
      expect.stringContaining("Invalid regular expression")
    ]);
  });

  it("matches wildcard +json media types after normalizing observed content-type parameters", () => {
    const operations = [{ kind: "http", method: "PATCH", route: "/widgets/{id}" }] as const;
    const operationKey = serializeOperationKey({ kind: "http", method: "PATCH", route: "/widgets/{param}" });
    const contracts = new Map<string, HttpOperationContract>([
      [
        operationKey,
        {
          declaredStatuses: ["202"],
          parameters: [{ name: "id", in: "path", required: true }],
          requestBody: {
            required: true,
            content: [{ mediaType: "application/*+json", schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } } }]
          },
          responseBodies: [
            {
              declaredStatus: "202",
              content: [{ mediaType: "application/*+json", schema: { type: "object", required: ["ok"], properties: { ok: { type: "boolean" } } } }]
            }
          ]
        }
      ]
    ]);

    const result = computeHttpPayloadConformance(
      [...operations],
      [
        {
          kind: "http",
          method: "PATCH",
          route: "/widgets/123",
          status: 202,
          requestBody: { name: "widget" },
          requestContentType: "application/merge-patch+json; charset=utf-8",
          responseBody: { ok: true },
          responseContentType: "application/problem+json; charset=utf-8",
          queryKeys: [],
          headerKeys: ["content-type"],
          pathParams: { id: "123" },
          testRunId: "run-wildcard",
          testSuite: "suite-wildcard"
        }
      ],
      { operationContractsByKey: contracts }
    );

    expect(result.perOperation[0]).toMatchObject({
      request: {
        state: "COVERED",
        observedMediaTypes: ["application/merge-patch+json"]
      },
      response: {
        state: "COVERED",
        observedMediaTypes: ["application/problem+json"]
      },
      suites: ["suite-wildcard"]
    });
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(["VALID", "VALID"]);
  });

  it("surfaces recorder omission distinctly from missing-body drift", () => {
    const operations = [{ kind: "http", method: "POST", route: "/filtered" }] as const;
    const operationKey = serializeOperationKey(operations[0]);
    const contracts = new Map<string, HttpOperationContract>([
      [
        operationKey,
        {
          declaredStatuses: ["202"],
          parameters: [],
          requestBody: {
            required: true,
            content: [{ mediaType: "application/json", schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } } }]
          },
          responseBodies: [{ declaredStatus: "202", content: [] }]
        }
      ]
    ]);

    const result = computeHttpPayloadConformance(
      [...operations],
      [
        {
          kind: "http",
          method: "POST",
          route: "/filtered",
          status: 202,
          requestContentType: "application/json",
          requestBodyState: "omitted",
          requestBodyReason: "policy-filtered",
          queryKeys: [],
          headerKeys: ["content-type"],
          testRunId: "run-filtered",
          testSuite: "suite-filtered"
        }
      ],
      { operationContractsByKey: contracts }
    );

    expect(result.perOperation[0]).toMatchObject({
      request: {
        state: "SKIPPED",
        observedCount: 1,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 1
      },
      response: {
        state: "N/A"
      },
      suites: ["suite-filtered"]
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        operationKey,
        target: "request",
        state: "SKIPPED",
        code: "RECORDER_OMITTED",
        message: "Recorder omitted request payload evidence (policy-filtered).",
        captureState: "omitted",
        captureReason: "policy-filtered",
        observedMediaType: "application/json",
        declaredMediaTypes: ["application/json"]
      })
    ]);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).not.toContain("MISSING_BODY");
  });

  it("validates supported email formats explicitly instead of treating them as plain strings", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload-format-media.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-payload-valid-format.fixture.jsonl")).items;

    const result = computeHttpPayloadConformance(model.operations, events, {
      operationContractsByKey: model.operationContractsByKey
    });

    expect(result.perOperation.find((entry) => entry.operationKey === "http POST /subscribers")).toMatchObject({
      request: {
        state: "COVERED",
        observedCount: 1,
        validCount: 1,
        invalidCount: 0,
        skippedCount: 0,
        observedMediaTypes: ["application/json"]
      },
      response: {
        state: "COVERED",
        observedCount: 1,
        validCount: 1,
        invalidCount: 0,
        skippedCount: 0,
        observedMediaTypes: ["application/json"]
      },
      suites: ["suite-format-valid"]
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        operationKey: "http POST /subscribers",
        target: "request",
        state: "COVERED",
        code: "VALID",
        observedMediaType: "application/json"
      }),
      expect.objectContaining({
        operationKey: "http POST /subscribers",
        target: "response",
        state: "COVERED",
        code: "VALID",
        observedMediaType: "application/json"
      })
    ]);
  });

  it("fails invalid email payloads as INVALID_BODY once format validation is enabled", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload-format-media.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-payload-invalid-format.fixture.jsonl")).items;

    const result = computeHttpPayloadConformance(model.operations, events, {
      operationContractsByKey: model.operationContractsByKey
    });

    expect(result.perOperation.find((entry) => entry.operationKey === "http POST /verifications")).toMatchObject({
      request: {
        state: "UNCOVERED",
        observedCount: 1,
        validCount: 0,
        invalidCount: 1,
        skippedCount: 0,
        observedMediaTypes: ["application/json"]
      },
      response: {
        state: "COVERED",
        observedCount: 1,
        validCount: 1,
        invalidCount: 0,
        skippedCount: 0,
        observedMediaTypes: ["application/json"]
      },
      suites: ["suite-format-invalid"]
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        operationKey: "http POST /verifications",
        target: "request",
        state: "UNCOVERED",
        code: "INVALID_BODY",
        observedMediaType: "application/json",
        errors: [expect.stringContaining("must match format \"email\"")]
      }),
      expect.objectContaining({
        operationKey: "http POST /verifications",
        target: "response",
        state: "COVERED",
        code: "VALID",
        observedMediaType: "application/json"
      })
    ]);
  });

  it("prefers the most-specific declared media type without reordering declared media output", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload-format-media.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-payload-media-specificity.fixture.jsonl")).items;

    const result = computeHttpPayloadConformance(model.operations, events, {
      operationContractsByKey: model.operationContractsByKey
    });

    expect(result.perOperation.find((entry) => entry.operationKey === "http POST /incidents")).toMatchObject({
      request: {
        state: "UNCOVERED",
        observedCount: 1,
        validCount: 0,
        invalidCount: 1,
        skippedCount: 0,
        declaredMediaTypes: ["application/*+json", "application/problem+json"],
        observedMediaTypes: ["application/problem+json"]
      },
      response: {
        state: "COVERED",
        observedCount: 1,
        validCount: 1,
        invalidCount: 0,
        skippedCount: 0,
        declaredMediaTypes: ["application/*+json", "application/problem+json"],
        observedMediaTypes: ["application/problem+json"],
        declaredContent: [
          {
            declaredStatus: "202",
            mediaTypes: ["application/*+json", "application/problem+json"]
          }
        ]
      },
      suites: ["suite-media-specificity"]
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        operationKey: "http POST /incidents",
        target: "request",
        state: "UNCOVERED",
        code: "INVALID_BODY",
        observedMediaType: "application/problem+json",
        declaredMediaTypes: ["application/*+json", "application/problem+json"],
        errors: ["/ must have required property 'detail'"]
      }),
      expect.objectContaining({
        operationKey: "http POST /incidents",
        target: "response",
        state: "COVERED",
        code: "VALID",
        declaredStatus: "202",
        observedStatus: 202,
        observedMediaType: "application/problem+json",
        declaredMediaTypes: ["application/*+json", "application/problem+json"]
      })
    ]);
  });

  it("fails closed on declared unsupported schema formats without inflating invalid counts", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload-format-media.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-payload-unsupported-format.fixture.jsonl")).items;

    const result = computeHttpPayloadConformance(model.operations, events, {
      operationContractsByKey: model.operationContractsByKey
    });

    expect(result.perOperation.find((entry) => entry.operationKey === "http POST /custom-format")).toMatchObject({
      request: {
        state: "SKIPPED",
        observedCount: 1,
        validCount: 0,
        invalidCount: 0,
        skippedCount: 1,
        observedMediaTypes: ["application/json"]
      },
      response: {
        state: "COVERED",
        observedCount: 1,
        validCount: 1,
        invalidCount: 0,
        skippedCount: 0,
        observedMediaTypes: ["application/json"]
      },
      suites: ["suite-format-unsupported"]
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        operationKey: "http POST /custom-format",
        target: "request",
        state: "SKIPPED",
        code: "UNSUPPORTED_SCHEMA_FORMAT",
        message: expect.stringContaining("unsupported schema format \"yanote-customer-id\" at /properties/externalId"),
        observedMediaType: "application/json",
        errors: [expect.stringContaining("/properties/externalId")]
      }),
      expect.objectContaining({
        operationKey: "http POST /custom-format",
        target: "response",
        state: "COVERED",
        code: "VALID",
        observedMediaType: "application/json"
      })
    ]);
  });
});
