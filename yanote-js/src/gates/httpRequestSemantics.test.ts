import { describe, expect, it } from "vitest";
import { computeCoverage } from "../coverage/coverage.js";
import { computeHttpRequestConformance, type HttpRequestConformanceDiagnostic } from "../coverage/httpRequestConformance.js";
import type { HttpEvent } from "../model/httpEvent.js";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";
import type { HttpOperationContract } from "../spec/openapi.js";
import { evaluateGateFailures } from "./evaluator.js";
import {
  classifyHttpRequestDiagnostic,
  evaluateHttpRequestSemanticFailures,
  isFailClosedHttpRequestTruth,
  isHttpRequestSemanticFailureCode
} from "./httpRequestSemantics.js";
import { resolveGatePolicy } from "./policy.js";

describe("http request semantic classifier", () => {
  it("maps raw request diagnostics to stable fail-closed semantic failures without leaking retained values", () => {
    const diagnostic: HttpRequestConformanceDiagnostic = {
      operationKey: "http GET /orders",
      method: "GET",
      route: "/orders",
      suite: "suite-orders",
      location: "query",
      name: "count",
      required: true,
      style: "form",
      truth: "captured-invalid",
      message: "Observed retained value does not satisfy the supported first-scalar OpenAPI contract.",
      reason: "Observed value 'secret-raw-value' is not a supported integer wire value.",
      observedValues: ["secret-raw-value"]
    };

    const failure = classifyHttpRequestDiagnostic(diagnostic);
    expect(failure).toMatchObject({
      failureClass: "semantic",
      code: "SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER",
      exitCode: 5,
      severity: "error",
      operationKey: "http GET /orders"
    });
    expect(failure?.reason).toContain("query parameter 'count' for http GET /orders failed supported request-parameter validation");
    expect(failure?.reason).not.toContain("secret-raw-value");
    expect(isFailClosedHttpRequestTruth(diagnostic.truth)).toBe(true);
    expect(isHttpRequestSemanticFailureCode(failure?.code ?? "")).toBe(true);
  });

  it("fails closed on invalid, unavailable, and unsupported request drift before threshold math", async () => {
    const operation = { kind: "http", method: "GET", route: "/orders" } as const;
    const observed = buildObservedHttpCase({
      operation,
      contract: {
        declaredStatuses: ["204"],
        parameters: [
          { in: "query", name: "count", required: true },
          { in: "header", name: "x-auth", required: true },
          { in: "query", name: "filter", required: false }
        ],
        requestParameters: [
          {
            name: "count",
            in: "query",
            required: true,
            style: "form",
            explode: true,
            declaredSupport: {
              support: "supported",
              shape: "scalar",
              schema: { type: "integer", minimum: 1 }
            },
            scalar: {
              support: "supported",
              schema: { type: "integer", minimum: 1 }
            }
          },
          {
            name: "x-auth",
            in: "header",
            required: true,
            style: "simple",
            explode: false,
            declaredSupport: {
              support: "supported",
              shape: "scalar",
              schema: { type: "string", minLength: 3 }
            },
            scalar: {
              support: "supported",
              schema: { type: "string", minLength: 3 }
            }
          },
          {
            name: "filter",
            in: "query",
            required: false,
            style: "spaceDelimited",
            explode: false,
            declaredSupport: {
              support: "unsupported",
              reason: "style"
            },
            scalar: {
              support: "unsupported",
              reason: "style"
            }
          }
        ],
        responseBodies: []
      },
      event: {
        kind: "http",
        method: "GET",
        route: "/orders",
        status: 204,
        queryKeys: ["count", "filter"],
        headerKeys: ["x-auth"],
        queryParams: {
          count: { state: "captured", values: ["zero"] },
          filter: { state: "captured", values: ["archived draft"] }
        },
        requestHeaders: {
          "x-auth": { state: "redacted", reason: "sensitive" }
        },
        testRunId: "run-request-drift",
        testSuite: "suite-request-drift"
      }
    });

    expect(observed.coverage.dimensions.operations.percent).toBe(100);
    expect(observed.coverage.dimensions.status.percent).toBe(100);
    expect(observed.coverage.dimensions.parameters.percent).toBe(100);

    const policy = await resolveGatePolicy({
      defaultProfile: "ci",
      cliOverrides: {
        minCoverage: 100,
        minAggregate: 100
      }
    });

    const semantic = evaluateHttpRequestSemanticFailures(observed.requestConformance.diagnostics);
    expect(semantic.map((failure) => failure.code)).toEqual([
      "SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER",
      "SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER",
      "SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER"
    ]);

    const failures = evaluateGateFailures({
      coverage: observed.coverage,
      policy,
      httpRequestDiagnostics: observed.requestConformance.diagnostics
    });

    expect(failures.map((failure) => failure.code)).toEqual([
      "SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER",
      "SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER",
      "SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER"
    ]);
    expect(failures.every((failure) => failure.failureClass === "semantic" && failure.severity === "error")).toBe(true);
  });

  it("keeps fully valid request semantics green when coverage stays fully observed", async () => {
    const operation = { kind: "http", method: "GET", route: "/orders" } as const;
    const observed = buildObservedHttpCase({
      operation,
      contract: {
        declaredStatuses: ["204"],
        parameters: [
          { in: "query", name: "count", required: true },
          { in: "header", name: "x-auth", required: true }
        ],
        requestParameters: [
          {
            name: "count",
            in: "query",
            required: true,
            style: "form",
            explode: true,
            declaredSupport: {
              support: "supported",
              shape: "scalar",
              schema: { type: "integer", minimum: 1 }
            },
            scalar: {
              support: "supported",
              schema: { type: "integer", minimum: 1 }
            }
          },
          {
            name: "x-auth",
            in: "header",
            required: true,
            style: "simple",
            explode: false,
            declaredSupport: {
              support: "supported",
              shape: "scalar",
              schema: { type: "string", minLength: 3 }
            },
            scalar: {
              support: "supported",
              schema: { type: "string", minLength: 3 }
            }
          }
        ],
        responseBodies: []
      },
      event: {
        kind: "http",
        method: "GET",
        route: "/orders",
        status: 204,
        queryKeys: ["count"],
        headerKeys: ["x-auth"],
        queryParams: {
          count: { state: "captured", values: ["3"] }
        },
        requestHeaders: {
          "x-auth": { state: "captured", values: ["abc-123"] }
        },
        testRunId: "run-request-valid",
        testSuite: "suite-request-valid"
      }
    });

    expect(observed.requestConformance.diagnostics.map((diagnostic) => diagnostic.truth)).toEqual(["captured-valid", "captured-valid"]);

    const policy = await resolveGatePolicy({
      defaultProfile: "ci",
      cliOverrides: {
        minCoverage: 100,
        minAggregate: 100
      }
    });

    const failures = evaluateGateFailures({
      coverage: observed.coverage,
      policy,
      httpRequestDiagnostics: observed.requestConformance.diagnostics
    });

    expect(failures).toEqual([]);
  });
});

function buildObservedHttpCase(input: {
  operation: Extract<OperationKey, { kind: "http" }>;
  contract: HttpOperationContract;
  event: HttpEvent;
}) {
  const operationKey = serializeOperationKey(input.operation);
  const operationContractsByKey = new Map([[operationKey, input.contract]]);
  const coverage = computeCoverage([input.operation], [input.event], [], {
    operationContractsByKey
  });
  const requestConformance = computeHttpRequestConformance([input.operation], [input.event], {
    operationContractsByKey
  });

  return {
    coverage,
    requestConformance,
    operationKey
  };
}
