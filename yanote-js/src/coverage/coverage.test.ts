import { describe, expect, it } from "vitest";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { loadOpenApiCoverageModel, type HttpOperationContract } from "../spec/openapi.js";
import { computeCoverage } from "./coverage.js";
import type { OperationKey } from "../model/operationKey.js";
import type { HttpEvent } from "../model/httpEvent.js";
import { serializeOperationKey } from "../model/operationKey.js";

describe("computeCoverage", () => {
  it("keeps deterministic canonical operation denominator", () => {
    const operations: OperationKey[] = [
      { kind: "http", method: "get", route: "/users/{id}" },
      { kind: "http", method: "GET", route: "/users/{name}" },
      { kind: "http", method: "POST", route: "/users" }
    ];

    const events: HttpEvent[] = [
      {
        kind: "http",
        method: "GET",
        route: "/users/123",
        status: 200,
        queryKeys: [],
        headerKeys: [],
        testRunId: "run-1",
        testSuite: "suite-a"
      }
    ];

    const first = computeCoverage(operations, events, []);
    const second = computeCoverage(operations, events, []);

    expect(first.allOperations).toEqual([
      { kind: "http", method: "GET", route: "/users/{param}" },
      { kind: "http", method: "POST", route: "/users" }
    ]);
    expect(first.coveredOperations).toEqual([{ kind: "http", method: "GET", route: "/users/{param}" }]);
    expect(first.uncoveredOperations).toEqual([{ kind: "http", method: "POST", route: "/users" }]);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("computes status and parameter dimensions per operation with explicit N/A", () => {
    const operations: OperationKey[] = [
      { kind: "http", method: "GET", route: "/users/{param}" },
      { kind: "http", method: "GET", route: "/health" }
    ];

    const contracts = new Map<string, HttpOperationContract>([
      [
        serializeOperationKey({ kind: "http", method: "GET", route: "/users/{param}" }),
        {
          declaredStatuses: ["200", "404"],
          parameters: [
            { name: "id", in: "path", required: true },
            { name: "expand", in: "query", required: true }
          ],
          responseBodies: []
        }
      ],
      [serializeOperationKey({ kind: "http", method: "GET", route: "/health" }), { declaredStatuses: [], parameters: [], responseBodies: [] }]
    ]);

    const events: HttpEvent[] = [
      {
        kind: "http",
        method: "GET",
        route: "/users/123",
        status: 200,
        queryKeys: ["expand"],
        headerKeys: [],
        testRunId: "run-1",
        testSuite: "suite-users"
      }
    ];

    const result = computeCoverage(operations, events, [], { operationContractsByKey: contracts });
    const users = result.perOperation.find((entry) => entry.route === "/users/{param}");
    const health = result.perOperation.find((entry) => entry.route === "/health");

    expect(users?.status.state).toBe("PARTIAL");
    expect(users?.parameters.state).toBe("COVERED");
    expect(health?.status.state).toBe("N/A");
    expect(health?.parameters.state).toBe("N/A");
  });

  it("reports aggregate as N/A when any weighted dimension is N/A", () => {
    const operations: OperationKey[] = [{ kind: "http", method: "GET", route: "/health" }];

    const contracts = new Map<string, HttpOperationContract>([
      [serializeOperationKey({ kind: "http", method: "GET", route: "/health" }), { declaredStatuses: [], parameters: [], responseBodies: [] }]
    ]);

    const events: HttpEvent[] = [
      {
        kind: "http",
        method: "GET",
        route: "/health",
        status: 200,
        queryKeys: [],
        headerKeys: [],
        testRunId: "run-1",
        testSuite: "suite-health"
      }
    ];

    const result = computeCoverage(operations, events, [], { operationContractsByKey: contracts });

    expect(result.dimensions.operations).toEqual({ state: "COVERED", percent: 100 });
    expect(result.dimensions.status).toEqual({ state: "N/A", percent: null });
    expect(result.dimensions.parameters).toEqual({ state: "N/A", percent: null });
    expect(result.dimensions.aggregate).toEqual({
      state: "N/A",
      percent: null,
      explanation: "aggregate is N/A because weighted dimensions include N/A"
    });
  });

  it("keeps observation coverage numerators unchanged when payload contracts are present", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload.yaml");
    const validEvents = (await readHttpEventsJsonl("test/fixtures/events/http-payload-valid.fixture.jsonl")).items;
    const unsupportedEvents = (await readHttpEventsJsonl("test/fixtures/events/http-payload-unsupported.fixture.jsonl")).items;
    const events = [...validEvents, ...unsupportedEvents];

    const strippedContracts = new Map<string, HttpOperationContract>(
      Array.from(model.operationContractsByKey.entries()).map(([key, contract]) => [
        key,
        {
          declaredStatuses: [...contract.declaredStatuses],
          parameters: [...contract.parameters],
          responseBodies: []
        }
      ])
    );

    const withPayloadContracts = computeCoverage(model.operations, events, [], {
      operationContractsByKey: model.operationContractsByKey
    });
    const withoutPayloadContracts = computeCoverage(model.operations, events, [], {
      operationContractsByKey: strippedContracts
    });

    expect(withPayloadContracts).toEqual(withoutPayloadContracts);
    expect(withPayloadContracts.dimensions.operations).toEqual({ state: "PARTIAL", percent: 33.33 });
    expect(withPayloadContracts.dimensions.status).toEqual({ state: "PARTIAL", percent: 28.57 });
    expect(withPayloadContracts.dimensions.parameters).toEqual({ state: "N/A", percent: null });
    expect(withPayloadContracts.dimensions.aggregate).toEqual({
      state: "N/A",
      percent: null,
      explanation: "aggregate is N/A because weighted dimensions include N/A"
    });
  });

  it("threads deprecated operation truth onto per-operation coverage without shrinking the default denominator", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-deprecated-operations.yaml");
    const events = (await readHttpEventsJsonl("test/fixtures/events/http-deprecated-operations.fixture.jsonl")).items;

    const withoutDeprecatedContracts = new Map<string, HttpOperationContract>(
      Array.from(model.operationContractsByKey.entries()).map(([key, contract]) => [
        key,
        {
          declaredStatuses: [...contract.declaredStatuses],
          parameters: [...contract.parameters],
          requestParameters: contract.requestParameters ? [...contract.requestParameters] : undefined,
          requestBody: contract.requestBody,
          responseBodies: [...contract.responseBodies],
          security: contract.security
        }
      ])
    );

    const withDeprecatedContracts = computeCoverage(model.operations, events, [], {
      operationContractsByKey: model.operationContractsByKey
    });
    const withoutDeprecatedMetadata = computeCoverage(model.operations, events, [], {
      operationContractsByKey: withoutDeprecatedContracts
    });

    expect(withDeprecatedContracts.coveredOperations).toEqual([
      { kind: "http", method: "GET", route: "/users" },
      { kind: "http", method: "POST", route: "/users" }
    ]);
    expect(withDeprecatedContracts.uncoveredOperations).toEqual([{ kind: "http", method: "GET", route: "/legacy-users" }]);
    expect(withDeprecatedContracts.dimensions.operations).toEqual({ state: "PARTIAL", percent: 66.67 });
    expect(withDeprecatedContracts.dimensions.status).toEqual({ state: "PARTIAL", percent: 66.67 });
    expect(withDeprecatedContracts.dimensions.parameters).toEqual({ state: "N/A", percent: null });
    expect(withDeprecatedContracts.dimensions.aggregate).toEqual({
      state: "N/A",
      percent: null,
      explanation: "aggregate is N/A because weighted dimensions include N/A"
    });
    expect(withDeprecatedContracts.perOperation).toMatchObject([
      {
        operationKey: "http GET /users",
        method: "GET",
        route: "/users",
        deprecated: false,
        operation: { state: "COVERED" },
        status: {
          state: "COVERED",
          declaredStatuses: ["200"],
          coveredStatuses: ["200"],
          missingStatuses: []
        },
        parameters: {
          state: "N/A",
          required: { covered: 0, total: 0, missing: [] },
          optional: { covered: 0, total: 0, missing: [] }
        },
        suites: ["suite-users-read"]
      },
      {
        operationKey: "http POST /users",
        method: "POST",
        route: "/users",
        deprecated: false,
        operation: { state: "COVERED" },
        status: {
          state: "COVERED",
          declaredStatuses: ["201"],
          coveredStatuses: ["201"],
          missingStatuses: []
        },
        parameters: {
          state: "N/A",
          required: { covered: 0, total: 0, missing: [] },
          optional: { covered: 0, total: 0, missing: [] }
        },
        suites: ["suite-users-create"]
      },
      {
        operationKey: "http GET /legacy-users",
        method: "GET",
        route: "/legacy-users",
        deprecated: true,
        operation: { state: "UNCOVERED" },
        status: {
          state: "UNCOVERED",
          declaredStatuses: ["200"],
          coveredStatuses: [],
          missingStatuses: ["200"]
        },
        parameters: {
          state: "N/A",
          required: { covered: 0, total: 0, missing: [] },
          optional: { covered: 0, total: 0, missing: [] }
        },
        suites: []
      }
    ]);
    expect(
      withDeprecatedContracts.perOperation.map(({ deprecated, ...entry }) => entry)
    ).toEqual(withoutDeprecatedMetadata.perOperation.map(({ deprecated: _deprecated, ...entry }) => entry));
    expect(withoutDeprecatedMetadata.dimensions).toEqual(withDeprecatedContracts.dimensions);
  });
});
