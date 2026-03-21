import { describe, expect, it } from "vitest";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { loadOpenApiCoverageModel, type HttpOperationContract } from "../spec/openapi.js";
import { serializeOperationKey } from "../model/operationKey.js";
import type { HttpPayloadConformanceDiagnostic } from "../coverage/httpPayloadConformance.js";
import { computeHttpPayloadConformance } from "../coverage/httpPayloadConformance.js";
import {
  classifyHttpPayloadDiagnostic,
  evaluateHttpPayloadSemanticFailures,
  isFailClosedHttpPayloadCode,
  isHttpPayloadSemanticFailureCode
} from "./httpPayloadSemantics.js";

describe("http payload semantic classifier", () => {
  it("maps raw HTTP payload diagnostics to stable fail-closed semantic failures", () => {
    const diagnostic: HttpPayloadConformanceDiagnostic = {
      operationKey: "http POST /orders",
      method: "POST",
      route: "/orders",
      target: "request",
      suite: "suite-orders",
      state: "UNCOVERED",
      code: "INVALID_BODY",
      message: "Observed request JSON payload does not satisfy the declared schema.",
      observedMediaType: "application/json",
      declaredMediaTypes: ["application/json"]
    };

    const failure = classifyHttpPayloadDiagnostic(diagnostic);
    expect(failure).toMatchObject({
      failureClass: "semantic",
      code: "SEMANTIC_HTTP_INVALID_BODY",
      exitCode: 5,
      severity: "error",
      operationKey: "http POST /orders"
    });
    expect(failure?.reason).toContain("request payload for http POST /orders");
    expect(isFailClosedHttpPayloadCode(diagnostic.code)).toBe(true);
    expect(isHttpPayloadSemanticFailureCode(failure?.code ?? "")).toBe(true);
  });

  it("classifies invalid, missing, and unsupported payload drift from real fixtures deterministically", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload.yaml");
    const invalidEvents = (await readHttpEventsJsonl("test/fixtures/events/http-payload-invalid.fixture.jsonl")).items;
    const missingEvents = (await readHttpEventsJsonl("test/fixtures/events/http-payload-missing.fixture.jsonl")).items;
    const unsupportedEvents = (await readHttpEventsJsonl("test/fixtures/events/http-payload-unsupported.fixture.jsonl")).items;

    const invalid = evaluateHttpPayloadSemanticFailures(
      computeHttpPayloadConformance(model.operations, invalidEvents, {
        operationContractsByKey: model.operationContractsByKey
      }).diagnostics
    );
    const missing = evaluateHttpPayloadSemanticFailures(
      computeHttpPayloadConformance(model.operations, missingEvents, {
        operationContractsByKey: model.operationContractsByKey
      }).diagnostics
    );
    const unsupported = evaluateHttpPayloadSemanticFailures(
      computeHttpPayloadConformance(model.operations, unsupportedEvents, {
        operationContractsByKey: model.operationContractsByKey
      }).diagnostics
    );

    expect(invalid.map((failure) => failure.code)).toEqual([
      "SEMANTIC_HTTP_INVALID_BODY",
      "SEMANTIC_HTTP_INVALID_BODY"
    ]);
    expect(missing.map((failure) => failure.code)).toEqual([
      "SEMANTIC_HTTP_MISSING_BODY",
      "SEMANTIC_HTTP_MISSING_BODY",
      "SEMANTIC_HTTP_MISSING_CONTENT_TYPE",
      "SEMANTIC_HTTP_MISSING_CONTENT_TYPE"
    ]);
    expect(unsupported.map((failure) => failure.code)).toEqual([
      "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
      "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE"
    ]);
  });

  it("keeps NO_DECLARED_CONTENT diagnostics out of the fail-closed set", () => {
    const operation = { kind: "http", method: "POST", route: "/audit-log" } as const;
    const operationKey = serializeOperationKey(operation);
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

    const payload = computeHttpPayloadConformance(
      [operation],
      [
        {
          kind: "http",
          method: "POST",
          route: "/audit-log",
          status: 204,
          requestBody: { ignored: true },
          requestContentType: "application/json",
          responseBody: { ignored: true },
          responseContentType: "application/json",
          queryKeys: [],
          headerKeys: ["content-type"],
          testRunId: "run-no-declared-content",
          testSuite: "suite-no-declared-content"
        }
      ],
      { operationContractsByKey: contracts }
    );

    expect(payload.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(["NO_DECLARED_CONTENT", "NO_DECLARED_CONTENT"]);
    expect(evaluateHttpPayloadSemanticFailures(payload.diagnostics)).toEqual([]);
    expect(payload.perOperation[0]).toMatchObject({
      request: { state: "SKIPPED", skippedCount: 1 },
      response: { state: "SKIPPED", skippedCount: 1 }
    });
  });
});
