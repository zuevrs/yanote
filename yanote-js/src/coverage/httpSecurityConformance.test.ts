import { describe, expect, it } from "vitest";
import { computeCoverage } from "./coverage.js";
import { computeHttpSecurityConformance } from "./httpSecurityConformance.js";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { loadOpenApiCoverageModel } from "../spec/openapi.js";

describe("computeHttpSecurityConformance", () => {
  it("evaluates truthful apiKey security conformance across inherited, optional, clear, AND, OR, unavailable, and unsupported branches", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-security-api-key.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-security-api-key.fixture.jsonl")).items;

    const result = computeHttpSecurityConformance(model.operations, events, {
      operationContractsByKey: model.operationContractsByKey
    });

    expect(result.diagnostics).toEqual([
      {
        operationKey: "http GET /clear",
        method: "GET",
        route: "/clear",
        suite: "suite-clear",
        truth: "clear",
        branchIndex: 0,
        branchKind: "clear",
        message: "Operation explicitly clears inherited OpenAPI security requirements with security: []."
      },
      {
        operationKey: "http GET /optional",
        method: "GET",
        route: "/optional",
        suite: "suite-optional",
        truth: "optional",
        branchIndex: 0,
        branchKind: "optional",
        message: "Security requirement branch is optional via an empty Security Requirement Object ({})."
      },
      {
        operationKey: "http GET /or-and-missing",
        method: "GET",
        route: "/or-and-missing",
        suite: "suite-or-missing",
        truth: "missing",
        branchIndex: 0,
        branchKind: "requirement",
        message: "Required query apiKey 'api_key' for security scheme 'queryKey' was not retained in request evidence.",
        schemeName: "queryKey",
        schemeType: "apiKey",
        schemeLocation: "query",
        schemeKeyName: "api_key"
      },
      {
        operationKey: "http GET /or-and-satisfied",
        method: "GET",
        route: "/or-and-satisfied",
        suite: "suite-or-satisfied",
        truth: "satisfied",
        branchIndex: 0,
        branchKind: "requirement",
        message: "Retained request evidence satisfies every supported scheme in the security requirement branch."
      },
      {
        operationKey: "http GET /override-query",
        method: "GET",
        route: "/override-query",
        suite: "suite-override",
        truth: "satisfied",
        branchIndex: 0,
        branchKind: "requirement",
        message: "Retained request evidence satisfies the supported security requirement branch."
      },
      {
        operationKey: "http GET /redacted",
        method: "GET",
        route: "/redacted",
        suite: "suite-redacted",
        truth: "unavailable",
        branchIndex: 0,
        branchKind: "requirement",
        message:
          "Required header apiKey 'X-Api-Key' for security scheme 'headerKey' was retained as redacted evidence (reason: sensitive), so presence could not be proven.",
        schemeName: "headerKey",
        schemeType: "apiKey",
        schemeLocation: "header",
        schemeKeyName: "X-Api-Key",
        evidenceState: "redacted",
        evidenceReason: "sensitive"
      },
      {
        operationKey: "http GET /root-inherited",
        method: "GET",
        route: "/root-inherited",
        suite: "suite-root",
        truth: "satisfied",
        branchIndex: 0,
        branchKind: "requirement",
        message: "Retained request evidence satisfies the supported security requirement branch."
      },
      {
        operationKey: "http GET /unavailable",
        method: "GET",
        route: "/unavailable",
        suite: "suite-unavailable",
        truth: "unavailable",
        branchIndex: 0,
        branchKind: "requirement",
        message:
          "Required query apiKey 'api_key' for security scheme 'queryKey' was retained as omitted evidence (reason: unavailable), so presence could not be proven.",
        schemeName: "queryKey",
        schemeType: "apiKey",
        schemeLocation: "query",
        schemeKeyName: "api_key",
        evidenceState: "omitted",
        evidenceReason: "unavailable"
      },
      {
        operationKey: "http GET /unsupported-http",
        method: "GET",
        route: "/unsupported-http",
        suite: "suite-http",
        truth: "unsupported",
        branchIndex: 0,
        branchKind: "requirement",
        message:
          "Security scheme 'basicAuth' uses OpenAPI type 'http', which is outside the current truthful apiKey-only conformance subset.",
        schemeName: "basicAuth",
        schemeType: "http"
      },
      {
        operationKey: "http GET /unsupported-location",
        method: "GET",
        route: "/unsupported-location",
        suite: "suite-location",
        truth: "unsupported",
        branchIndex: 0,
        branchKind: "requirement",
        message:
          "apiKey security scheme 'pathKey' uses unsupported location 'path'. Only query, header, and cookie apiKey locations are currently supported.",
        schemeName: "pathKey",
        schemeType: "apiKey",
        schemeLocation: "path",
        schemeKeyName: "secret"
      },
      {
        operationKey: "http GET /unsupported-oauth",
        method: "GET",
        route: "/unsupported-oauth",
        suite: "suite-oauth",
        truth: "unsupported",
        branchIndex: 0,
        branchKind: "requirement",
        message:
          "Security scheme 'oauthKey' uses OpenAPI type 'oauth2', which is outside the current truthful apiKey-only conformance subset.",
        schemeName: "oauthKey",
        schemeType: "oauth2"
      },
      {
        operationKey: "http GET /unsupported-openid",
        method: "GET",
        route: "/unsupported-openid",
        suite: "suite-openid",
        truth: "unsupported",
        branchIndex: 0,
        branchKind: "requirement",
        message:
          "Security scheme 'oidcAuth' uses OpenAPI type 'openIdConnect', which is outside the current truthful apiKey-only conformance subset.",
        schemeName: "oidcAuth",
        schemeType: "openIdConnect"
      }
    ]);

    const optional = result.perOperation.find((entry) => entry.operationKey === "http GET /optional");
    expect(optional).toMatchObject({
      observedCount: 1,
      suites: ["suite-optional"],
      overallTruths: {
        satisfied: 0,
        missing: 0,
        unavailable: 0,
        unsupported: 0,
        optional: 1,
        clear: 0
      },
      branches: [
        {
          branchIndex: 0,
          kind: "optional",
          observedCount: 1,
          truths: {
            optional: 1
          },
          schemes: []
        },
        {
          branchIndex: 1,
          kind: "requirement",
          observedCount: 1,
          truths: {
            missing: 1
          },
          schemes: [
            {
              schemeName: "cookieKey",
              type: "apiKey",
              location: "cookie",
              keyName: "session",
              scopes: []
            }
          ]
        }
      ]
    });

    const orSatisfied = result.perOperation.find((entry) => entry.operationKey === "http GET /or-and-satisfied");
    expect(orSatisfied).toMatchObject({
      observedCount: 1,
      overallTruths: {
        satisfied: 1,
        missing: 0,
        unavailable: 0,
        unsupported: 0,
        optional: 0,
        clear: 0
      },
      branches: [
        {
          branchIndex: 0,
          kind: "requirement",
          observedCount: 1,
          truths: {
            satisfied: 1
          },
          schemes: [
            {
              schemeName: "headerKey",
              type: "apiKey",
              location: "header",
              keyName: "X-Api-Key",
              scopes: []
            },
            {
              schemeName: "queryKey",
              type: "apiKey",
              location: "query",
              keyName: "api_key",
              scopes: []
            }
          ]
        },
        {
          branchIndex: 1,
          kind: "requirement",
          observedCount: 1,
          truths: {
            missing: 1
          },
          schemes: [
            {
              schemeName: "cookieKey",
              type: "apiKey",
              location: "cookie",
              keyName: "session",
              scopes: []
            }
          ]
        }
      ]
    });

    const unsupportedLocation = result.perOperation.find((entry) => entry.operationKey === "http GET /unsupported-location");
    expect(unsupportedLocation).toMatchObject({
      observedCount: 1,
      overallTruths: {
        satisfied: 0,
        missing: 0,
        unavailable: 0,
        unsupported: 1,
        optional: 0,
        clear: 0
      },
      branches: [
        {
          branchIndex: 0,
          kind: "requirement",
          observedCount: 1,
          truths: {
            unsupported: 1
          },
          schemes: [
            {
              schemeName: "pathKey",
              type: "apiKey",
              location: "path",
              keyName: "secret",
              scopes: []
            }
          ]
        }
      ]
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("header-secret-123");
    expect(serialized).not.toContain("query-secret-456");
    expect(serialized).not.toContain("header-and-789");
    expect(serialized).not.toContain("query-and-789");
    expect(serialized).not.toContain("Basic dXNlcjpzZWNyZXQ=");
    expect(serialized).not.toContain("oauth-secret");
    expect(serialized).not.toContain("oidc-secret");
    expect(serialized).not.toContain("path-secret-xyz");
  });

  it("does not change legacy coverage dimensions or per-operation status math", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-security-api-key.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-security-api-key.fixture.jsonl")).items;

    const coverage = computeCoverage(model.operations, events, [], {
      operationContractsByKey: model.operationContractsByKey
    });

    expect(coverage.dimensions).toEqual({
      operations: { state: "COVERED", percent: 100 },
      status: { state: "COVERED", percent: 100 },
      parameters: { state: "N/A", percent: null },
      aggregate: {
        state: "N/A",
        percent: null,
        explanation: "aggregate is N/A because weighted dimensions include N/A"
      }
    });

    expect(coverage.perOperation.every((entry) => entry.operation.state === "COVERED")).toBe(true);
    expect(coverage.perOperation.every((entry) => entry.status.state === "COVERED")).toBe(true);
    expect(coverage.perOperation.every((entry) => entry.parameters.state === "N/A")).toBe(true);
    expect(coverage).not.toHaveProperty("httpSecurityConformance");
  });
});
