import { describe, expect, it } from "vitest";
import type { HttpEvent } from "../model/httpEvent.js";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";
import { computeCoverage } from "../coverage/coverage.js";
import { computeHttpPayloadConformance } from "../coverage/httpPayloadConformance.js";
import type { HttpOperationContract } from "../spec/openapi.js";
import { evaluateGateFailures, evaluateThresholdGate } from "./evaluator.js";
import { resolveGatePolicy } from "./policy.js";

function sampleCoverage(): ReturnType<typeof computeCoverage> {
  const operations: OperationKey[] = [
    { kind: "http", method: "GET", route: "/a" },
    { kind: "http", method: "GET", route: "/b" },
    { kind: "http", method: "GET", route: "/c" }
  ];

  const events: HttpEvent[] = [
    {
      kind: "http",
      method: "GET",
      route: "/a",
      queryKeys: [],
      headerKeys: [],
      testRunId: "run-1",
      testSuite: "suite-a"
    },
    {
      kind: "http",
      method: "GET",
      route: "/b",
      queryKeys: [],
      headerKeys: [],
      testRunId: "run-1",
      testSuite: "suite-a"
    }
  ];

  return computeCoverage(operations, events, []);
}

function buildObservedHttpCase(input: {
  operation: Extract<OperationKey, { kind: "http" }>;
  contract: HttpOperationContract;
  event: HttpEvent;
}) {
  const operationKey = serializeOperationKey(input.operation);
  const coverage = computeCoverage([input.operation], [input.event], [], {
    operationContractsByKey: new Map([[operationKey, input.contract]])
  });
  const payloadConformance = computeHttpPayloadConformance([input.operation], [input.event], {
    operationContractsByKey: new Map([[operationKey, input.contract]])
  });

  return {
    coverage,
    payloadConformance,
    operationKey
  };
}

describe("threshold evaluator", () => {
  it("uses raw decimals for comparison and skips aggregate gate when aggregate is N/A", async () => {
    const coverage = sampleCoverage();
    const policy = await resolveGatePolicy({
      defaultProfile: "ci",
      cliOverrides: {
        minCoverage: 66.668,
        minAggregate: 80
      }
    });

    const failures = evaluateThresholdGate({ coverage, policy });
    expect(failures.map((failure) => failure.code)).toContain("GATE_MIN_COVERAGE");
    expect(failures.map((failure) => failure.code)).toContain("GATE_AGGREGATE_SKIPPED");
  });

  it("hard-fails critical operation coverage loss regardless of profile softness", async () => {
    const coverage = sampleCoverage();
    const policy = await resolveGatePolicy({
      profile: "local",
      cliOverrides: {
        criticalOperations: ["http GET /c"]
      }
    });

    const failures = evaluateThresholdGate({ coverage, policy });
    const critical = failures.find((failure) => failure.code === "GATE_CRITICAL_OPERATION_COVERAGE_LOSS");
    expect(critical).toBeDefined();
    expect(critical?.severity).toBe("error");
  });

  it("fails closed on invalid payload drift even when operation, status, and parameter coverage stay at 100%", async () => {
    const operation = { kind: "http", method: "POST", route: "/orders" } as const;
    const observed = buildObservedHttpCase({
      operation,
      contract: {
        declaredStatuses: ["201"],
        parameters: [{ in: "header", name: "x-trace-id", required: true }],
        requestBody: {
          required: true,
          content: [
            {
              mediaType: "application/json",
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["sku", "quantity"],
                properties: {
                  sku: { type: "string" },
                  quantity: { type: "integer", minimum: 1 }
                }
              }
            }
          ]
        },
        responseBodies: [
          {
            declaredStatus: "201",
            content: [
              {
                mediaType: "application/json",
                schema: {
                  type: "object",
                  additionalProperties: false,
                  required: ["id"],
                  properties: {
                    id: { type: "string" }
                  }
                }
              }
            ]
          }
        ]
      },
      event: {
        kind: "http",
        method: "POST",
        route: "/orders",
        status: 201,
        requestBody: { sku: "sku-1", quantity: 0 },
        requestContentType: "application/json",
        responseBody: { id: "order-1" },
        responseContentType: "application/json",
        queryKeys: [],
        headerKeys: ["x-trace-id", "content-type"],
        testRunId: "run-invalid",
        testSuite: "suite-invalid"
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
    const failures = evaluateGateFailures({
      coverage: observed.coverage,
      policy,
      httpPayloadDiagnostics: observed.payloadConformance.diagnostics
    });

    expect(failures.map((failure) => failure.code)).toEqual(["SEMANTIC_HTTP_INVALID_BODY"]);
    expect(failures.every((failure) => failure.failureClass === "semantic" && failure.severity === "error")).toBe(true);
  });

  it("keeps unsupported media drift ahead of threshold math on fully observed payloads", async () => {
    const operation = { kind: "http", method: "POST", route: "/notes" } as const;
    const observed = buildObservedHttpCase({
      operation,
      contract: {
        declaredStatuses: ["202"],
        parameters: [{ in: "query", name: "source", required: true }],
        requestBody: {
          required: true,
          content: [{ mediaType: "text/plain", schema: { type: "string" } }]
        },
        responseBodies: [{ declaredStatus: "202", content: [{ mediaType: "text/plain", schema: { type: "string" } }] }]
      },
      event: {
        kind: "http",
        method: "POST",
        route: "/notes",
        status: 202,
        requestBody: "hello",
        requestContentType: "text/plain; charset=utf-8",
        responseBody: "accepted",
        responseContentType: "text/plain",
        queryKeys: ["source"],
        headerKeys: ["content-type"],
        testRunId: "run-unsupported",
        testSuite: "suite-unsupported"
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
    const failures = evaluateGateFailures({
      coverage: observed.coverage,
      policy,
      httpPayloadDiagnostics: observed.payloadConformance.diagnostics
    });

    expect(failures.map((failure) => failure.code)).toEqual([
      "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
      "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE"
    ]);
    expect(failures.every((failure) => failure.failureClass === "semantic")).toBe(true);
  });
});
