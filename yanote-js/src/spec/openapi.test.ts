import { describe, expect, it } from "vitest";
import { loadOpenApiCoverageModel, loadOpenApiOperations } from "./openapi.js";
import { serializeOperationKey } from "../model/operationKey.js";

describe("openapi loader", () => {
  it("returns stable canonical keys from normalized templated routes", async () => {
    const ops = await loadOpenApiOperations("test/fixtures/openapi/simple.yaml");
    expect(ops).toEqual([
      { kind: "http", method: "GET", route: "/health" },
      { kind: "http", method: "GET", route: "/users" },
      { kind: "http", method: "POST", route: "/users" },
      { kind: "http", method: "GET", route: "/users/{param}" }
    ]);
  });

  it("deduplicates duplicate canonical operations without order changes", async () => {
    const ops = await loadOpenApiOperations("test/fixtures/openapi/simple.yaml");
    const templatedGets = ops.filter((op) => op.kind === "http" && op.method === "GET" && op.route === "/users/{param}");

    expect(templatedGets).toHaveLength(1);
  });

  it("is deterministic across repeated loads of identical input", async () => {
    const first = await loadOpenApiOperations("test/fixtures/openapi/simple.yaml");
    const second = await loadOpenApiOperations("test/fixtures/openapi/simple.yaml");

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("retains required, optional, and response payload contracts on the canonical operation keys", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload.yaml");
    const postUsersKey = serializeOperationKey({ kind: "http", method: "POST", route: "/users" });
    const postProfilesKey = serializeOperationKey({ kind: "http", method: "POST", route: "/profiles" });
    const postDraftsKey = serializeOperationKey({ kind: "http", method: "POST", route: "/drafts" });
    const getAuditsKey = serializeOperationKey({ kind: "http", method: "GET", route: "/audits" });
    const postOrdersKey = serializeOperationKey({ kind: "http", method: "POST", route: "/orders" });
    const postUsers = model.operationContractsByKey.get(postUsersKey);
    const postProfiles = model.operationContractsByKey.get(postProfilesKey);
    const postDrafts = model.operationContractsByKey.get(postDraftsKey);
    const getAudits = model.operationContractsByKey.get(getAuditsKey);
    const postOrders = model.operationContractsByKey.get(postOrdersKey);

    expect(model.operations).toEqual([
      { kind: "http", method: "POST", route: "/users" },
      { kind: "http", method: "POST", route: "/notes" },
      { kind: "http", method: "POST", route: "/profiles" },
      { kind: "http", method: "POST", route: "/drafts" },
      { kind: "http", method: "GET", route: "/audits" },
      { kind: "http", method: "POST", route: "/orders" }
    ]);
    expect(postUsers).toMatchObject({
      declaredStatuses: ["201", "415"],
      parameters: [],
      requestBody: {
        required: true,
        content: [{ mediaType: "application/json" }]
      },
      responseBodies: [
        {
          declaredStatus: "201",
          content: [{ mediaType: "application/json" }]
        },
        {
          declaredStatus: "415",
          content: [{ mediaType: "application/problem+json" }]
        }
      ]
    });
    expect(postUsers?.requestBody?.content[0]?.schema).toMatchObject({
      type: "object",
      required: ["email", "profile"],
      properties: {
        email: { type: "string" },
        profile: {
          type: "object",
          required: ["active", "age", "tags"]
        }
      }
    });
    expect(postProfiles).toMatchObject({
      requestBody: {
        required: true,
        content: [{ mediaType: "application/json" }]
      },
      responseBodies: [{ declaredStatus: "204", content: [] }]
    });
    expect(postDrafts).toMatchObject({
      requestBody: {
        required: false,
        content: [{ mediaType: "application/json" }]
      },
      responseBodies: [{ declaredStatus: "202", content: [{ mediaType: "application/json" }] }]
    });
    expect(getAudits).toMatchObject({
      declaredStatuses: ["200"],
      requestBody: undefined,
      responseBodies: [{ declaredStatus: "200", content: [{ mediaType: "application/json" }] }]
    });
    expect(getAudits?.responseBodies[0]?.content[0]?.schema).toMatchObject({
      type: "object",
      required: ["entries"],
      properties: {
        entries: {
          type: "array",
          items: { type: "string" }
        }
      }
    });
    expect(postOrders).toMatchObject({
      declaredStatuses: ["201"],
      requestBody: {
        required: true,
        content: [{ mediaType: "application/json" }]
      },
      responseBodies: [{ declaredStatus: "201", content: [{ mediaType: "application/json" }] }]
    });
    expect(postOrders?.requestBody?.content[0]?.schema).toMatchObject({
      properties: {
        quantity: { type: "integer", minimum: 1 },
        sku: { type: "string" }
      },
      required: ["sku", "quantity"]
    });
  });
});
