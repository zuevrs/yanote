import { describe, expect, it } from "vitest";
import { computeCoverage } from "../coverage/coverage.js";
import { computeHttpSecurityConformance, type HttpSecurityConformanceDiagnostic } from "../coverage/httpSecurityConformance.js";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { loadOpenApiCoverageModel } from "../spec/openapi.js";
import { evaluateGateFailures } from "./evaluator.js";
import { resolveGatePolicy } from "./policy.js";
import {
  classifyHttpSecurityDiagnostic,
  evaluateHttpSecuritySemanticFailures,
  isFailClosedHttpSecurityTruth,
  isHttpSecuritySemanticFailureCode
} from "./httpSecuritySemantics.js";

async function loadSecurityFixture() {
  const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-security-api-key.yaml");
  const events = (await readHttpEventsJsonl("test/fixtures/events/http-security-api-key.fixture.jsonl")).items;

  return {
    model,
    events
  };
}

describe("http security semantic classifier", () => {
  it("maps security diagnostics to stable fail-closed semantic failures without echoing retained secrets", () => {
    const diagnostic: HttpSecurityConformanceDiagnostic = {
      operationKey: "http GET /orders",
      method: "GET",
      route: "/orders",
      suite: "suite-orders",
      truth: "missing",
      branchIndex: 0,
      branchKind: "requirement",
      message: "Required header apiKey 'X-Api-Key' had retained raw value 'header-secret-123'.",
      schemeName: "headerKey",
      schemeType: "apiKey",
      schemeLocation: "header",
      schemeKeyName: "X-Api-Key"
    };

    const failure = classifyHttpSecurityDiagnostic(diagnostic);
    expect(failure).toMatchObject({
      failureClass: "semantic",
      code: "SEMANTIC_HTTP_MISSING_SECURITY",
      exitCode: 5,
      severity: "error",
      operationKey: "http GET /orders"
    });
    expect(failure?.reason).toContain("required header apiKey 'X-Api-Key' for security scheme 'headerKey' on http GET /orders was not retained in request evidence");
    expect(failure?.reason).not.toContain("header-secret-123");
    expect(failure?.hint).not.toContain("header-secret-123");
    expect(isFailClosedHttpSecurityTruth(diagnostic.truth)).toBe(true);
    expect(isHttpSecuritySemanticFailureCode(failure?.code ?? "")).toBe(true);
  });

  it("classifies missing, unavailable, and unsupported security drift from the shared fixture while keeping satisfied, optional, and clear cases green", async () => {
    const { model, events } = await loadSecurityFixture();
    const security = computeHttpSecurityConformance(model.operations, events, {
      operationContractsByKey: model.operationContractsByKey
    });

    const failures = evaluateHttpSecuritySemanticFailures(security.diagnostics);

    expect(failures.map((failure) => failure.code)).toEqual([
      "SEMANTIC_HTTP_MISSING_SECURITY",
      "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
      "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
      "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
      "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
      "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
      "SEMANTIC_HTTP_UNSUPPORTED_SECURITY"
    ]);
    expect(failures.map((failure) => failure.operationKey)).toEqual([
      "http GET /or-and-missing",
      "http GET /redacted",
      "http GET /unavailable",
      "http GET /unsupported-http",
      "http GET /unsupported-location",
      "http GET /unsupported-oauth",
      "http GET /unsupported-openid"
    ]);
  });

  it("short-circuits on security semantic failures before threshold math and stays green for satisfied, optional, and cleared security", async () => {
    const { model, events } = await loadSecurityFixture();
    const failingEvents = events.filter((event) => event.testSuite === "suite-redacted");
    const policy = await resolveGatePolicy({
      defaultProfile: "ci",
      cliOverrides: {
        minCoverage: 100,
        minAggregate: 100
      }
    });

    const failingCoverage = computeCoverage(model.operations, failingEvents, [], {
      operationContractsByKey: model.operationContractsByKey
    });
    const failingSecurity = computeHttpSecurityConformance(model.operations, failingEvents, {
      operationContractsByKey: model.operationContractsByKey
    });
    const failingGate = evaluateGateFailures({
      coverage: failingCoverage,
      policy,
      httpSecurityDiagnostics: failingSecurity.diagnostics
    });

    expect(failingCoverage.dimensions.operations.percent).toBeLessThan(100);
    expect(failingGate.map((failure) => failure.code)).toEqual(["SEMANTIC_HTTP_UNAVAILABLE_SECURITY"]);

    const greenOperations = model.operations.filter((operation) =>
      ["http GET /clear", "http GET /optional", "http GET /or-and-satisfied", "http GET /override-query", "http GET /root-inherited"].includes(
        `${operation.kind} ${operation.method} ${operation.route}`
      )
    );
    const greenEvents = events.filter((event) =>
      ["suite-clear", "suite-optional", "suite-or-satisfied", "suite-override", "suite-root"].includes(event.testSuite ?? "")
    );
    const greenCoverage = computeCoverage(greenOperations, greenEvents, [], {
      operationContractsByKey: model.operationContractsByKey
    });
    const greenSecurity = computeHttpSecurityConformance(greenOperations, greenEvents, {
      operationContractsByKey: model.operationContractsByKey
    });
    const greenGate = evaluateGateFailures({
      coverage: greenCoverage,
      policy,
      httpSecurityDiagnostics: greenSecurity.diagnostics
    });

    expect(greenCoverage.dimensions.operations.percent).toBe(100);
    expect(greenGate.filter((failure) => failure.failureClass === "semantic")).toEqual([]);
    expect(greenGate.map((failure) => failure.code)).toEqual(["GATE_AGGREGATE_SKIPPED"]);
  });
});
