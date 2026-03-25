import { describe, expect, it } from "vitest";
import { computeHttpRequestConformance } from "./httpRequestConformance.js";
import { serializeOperationKey } from "../model/operationKey.js";
import type { HttpEvent } from "../model/httpEvent.js";
import type { HttpOperationContract } from "../spec/openapi.js";

describe("computeHttpRequestConformance", () => {
  it("classifies supported scalar and repeated-query-array truth across valid, invalid, unavailable, and unsupported evidence", () => {
    const operation = { kind: "http", method: "GET", route: "/evidence/users/{param}" } as const;
    const operationKey = serializeOperationKey(operation);
    const contract: HttpOperationContract = {
      declaredStatuses: ["200"],
      parameters: [
        { name: "id", in: "path", required: true },
        { name: "meta", in: "query", required: false },
        { name: "optional", in: "query", required: false },
        { name: "scores", in: "query", required: false },
        { name: "tags", in: "query", required: false },
        { name: "token", in: "query", required: false },
        { name: "verbose", in: "query", required: false },
        { name: "X-Trace-Id", in: "header", required: true }
      ],
      requestParameters: [
        {
          name: "id",
          in: "path",
          required: true,
          style: "simple",
          explode: false,
          declaredSupport: {
            support: "supported",
            shape: "scalar",
            schema: { type: "string", pattern: "^user-[0-9]+$" }
          },
          scalar: {
            support: "supported",
            schema: { type: "string", pattern: "^user-[0-9]+$" }
          }
        },
        {
          name: "meta",
          in: "query",
          required: false,
          style: "form",
          explode: true,
          declaredSupport: {
            support: "unsupported",
            reason: "schema"
          },
          scalar: {
            support: "unsupported",
            reason: "schema"
          }
        },
        {
          name: "optional",
          in: "query",
          required: false,
          style: "form",
          explode: true,
          declaredSupport: {
            support: "supported",
            shape: "scalar",
            schema: { type: "string" }
          },
          scalar: {
            support: "supported",
            schema: { type: "string" }
          }
        },
        {
          name: "scores",
          in: "query",
          required: false,
          style: "form",
          explode: true,
          declaredSupport: {
            support: "supported",
            shape: "array",
            items: { type: "integer", minimum: 1 }
          },
          scalar: {
            support: "unsupported",
            reason: "schema"
          }
        },
        {
          name: "tags",
          in: "query",
          required: false,
          style: "form",
          explode: true,
          declaredSupport: {
            support: "supported",
            shape: "array",
            items: { type: "string", minLength: 2 }
          },
          scalar: {
            support: "unsupported",
            reason: "schema"
          }
        },
        {
          name: "token",
          in: "query",
          required: false,
          style: "form",
          explode: true,
          declaredSupport: {
            support: "supported",
            shape: "scalar",
            schema: { type: "string" }
          },
          scalar: {
            support: "supported",
            schema: { type: "string" }
          }
        },
        {
          name: "verbose",
          in: "query",
          required: false,
          style: "form",
          explode: true,
          declaredSupport: {
            support: "supported",
            shape: "scalar",
            schema: { type: "boolean" }
          },
          scalar: {
            support: "supported",
            schema: { type: "boolean" }
          }
        },
        {
          name: "X-Trace-Id",
          in: "header",
          required: true,
          style: "simple",
          explode: false,
          declaredSupport: {
            support: "supported",
            shape: "scalar",
            schema: { type: "integer", minimum: 100 }
          },
          scalar: {
            support: "supported",
            schema: { type: "integer", minimum: 100 }
          }
        },
        {
          name: "prefs",
          in: "cookie",
          required: true,
          style: "form",
          explode: true,
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
          name: "session",
          in: "cookie",
          required: true,
          style: "form",
          explode: true,
          declaredSupport: {
            support: "supported",
            shape: "scalar",
            schema: { type: "string" }
          },
          scalar: {
            support: "supported",
            schema: { type: "string" }
          }
        },
        {
          name: "theme",
          in: "cookie",
          required: false,
          style: "form",
          explode: true,
          declaredSupport: {
            support: "supported",
            shape: "scalar",
            schema: { type: "string" }
          },
          scalar: {
            support: "supported",
            schema: { type: "string" }
          }
        }
      ],
      responseBodies: []
    };

    const event: HttpEvent = {
      kind: "http",
      method: "GET",
      route: "/evidence/users/user-42",
      status: 200,
      queryKeys: ["verbose", "token", "meta", "tags", "scores"],
      headerKeys: ["x-trace-id"],
      testRunId: "run-1",
      testSuite: "suite-a",
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
      }
    };

    const result = computeHttpRequestConformance([operation], [event], {
      operationContractsByKey: new Map([[operationKey, contract]])
    });

    expect(result.diagnostics.map((diagnostic) => ({
      location: diagnostic.location,
      name: diagnostic.name,
      truth: diagnostic.truth,
      reason: diagnostic.reason,
      observedValues: diagnostic.observedValues
    }))).toEqual([
      {
        location: "path",
        name: "id",
        truth: "captured-valid",
        reason: undefined,
        observedValues: ["user-42"]
      },
      {
        location: "query",
        name: "meta",
        truth: "unsupported",
        reason: "Observed query parameter 'meta' uses an OpenAPI schema outside the supported first-scalar subset.",
        observedValues: ["opaque"]
      },
      {
        location: "query",
        name: "scores",
        truth: "captured-invalid",
        reason:
          "Observed query parameter 'scores' retained item 2 failed validation. Observed value 'zero' is not a supported integer wire value.",
        observedValues: ["5", "zero"]
      },
      {
        location: "query",
        name: "tags",
        truth: "captured-valid",
        reason: undefined,
        observedValues: ["red", "blue"]
      },
      {
        location: "query",
        name: "token",
        truth: "unsupported",
        reason:
          "Observed query parameter 'token' retained 2 values; first-scalar validation only supports a single retained value.",
        observedValues: ["one", "two"]
      },
      {
        location: "query",
        name: "verbose",
        truth: "captured-invalid",
        reason: "Observed value 'maybe' is not a supported boolean wire value ('true' or 'false').",
        observedValues: ["maybe"]
      },
      {
        location: "header",
        name: "X-Trace-Id",
        truth: "captured-valid",
        reason: undefined,
        observedValues: ["120"]
      },
      {
        location: "cookie",
        name: "prefs",
        truth: "captured-invalid",
        reason: "Observed value 'ab' is shorter than the declared minLength 3.",
        observedValues: ["ab"]
      },
      {
        location: "cookie",
        name: "session",
        truth: "redacted",
        reason: "Observed cookie 'session' was retained as redacted evidence (reason: sensitive), so its value could not be validated.",
        observedValues: undefined
      },
      {
        location: "cookie",
        name: "theme",
        truth: "omitted",
        reason: "Observed cookie 'theme' was retained as omitted evidence (reason: unavailable), so its value could not be validated.",
        observedValues: undefined
      }
    ]);

    expect(result.perOperation).toHaveLength(1);
    expect(result.perOperation[0]).toMatchObject({
      operationKey,
      method: "GET",
      route: "/evidence/users/{param}",
      observedCount: 1,
      suites: ["suite-a"]
    });

    const idSummary = getSummary(result, operationKey, "path", "id");
    expect(idSummary).toMatchObject({
      declaredSupport: "supported",
      declaredSupportShape: "scalar",
      observedCount: 1,
      truths: {
        "captured-valid": 1,
        "captured-invalid": 0,
        redacted: 0,
        omitted: 0,
        unsupported: 0
      }
    });

    const metaSummary = getSummary(result, operationKey, "query", "meta");
    expect(metaSummary).toMatchObject({
      declaredSupport: "unsupported",
      declaredSupportReason: "schema",
      scalarSupport: "unsupported",
      scalarSupportReason: "schema",
      observedCount: 1,
      truths: {
        unsupported: 1
      }
    });

    const scoresSummary = getSummary(result, operationKey, "query", "scores");
    expect(scoresSummary).toMatchObject({
      declaredSupport: "supported",
      declaredSupportShape: "array",
      scalarSupport: "unsupported",
      scalarSupportReason: "schema",
      observedCount: 1,
      truths: {
        "captured-valid": 0,
        "captured-invalid": 1,
        redacted: 0,
        omitted: 0,
        unsupported: 0
      }
    });

    const tagsSummary = getSummary(result, operationKey, "query", "tags");
    expect(tagsSummary).toMatchObject({
      declaredSupport: "supported",
      declaredSupportShape: "array",
      scalarSupport: "unsupported",
      scalarSupportReason: "schema",
      observedCount: 1,
      truths: {
        "captured-valid": 1,
        "captured-invalid": 0,
        redacted: 0,
        omitted: 0,
        unsupported: 0
      }
    });

    const optionalSummary = getSummary(result, operationKey, "query", "optional");
    expect(optionalSummary).toMatchObject({
      observedCount: 0,
      truths: {
        "captured-valid": 0,
        "captured-invalid": 0,
        redacted: 0,
        omitted: 0,
        unsupported: 0
      }
    });
  });
});

function getSummary(
  result: ReturnType<typeof computeHttpRequestConformance>,
  operationKey: string,
  location: "path" | "query" | "header" | "cookie",
  name: string
) {
  const operation = result.perOperation.find((entry) => entry.operationKey === operationKey);
  expect(operation).toBeDefined();
  const parameter = operation?.parameters.find((entry) => entry.in === location && entry.name === name);
  expect(parameter).toBeDefined();
  return parameter;
}
