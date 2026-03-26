import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
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

  it("normalizes nullable/exclusive OpenAPI 3.0 schemas and strips media-type parameters deterministically", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "yanote-openapi-normalize-"));
    const specPath = path.join(tempDir, "normalize.yaml");

    await writeFile(
      specPath,
      [
        "openapi: 3.0.0",
        "info:",
        "  title: normalize",
        "  version: 1.0.0",
        "paths:",
        "  /widgets/{id}:",
        "    post:",
        "      parameters:",
        "        - name: id",
        "          in: path",
        "          required: true",
        "          schema: { type: string }",
        "      requestBody:",
        "        required: true",
        "        content:",
        "          Application/JSON; Charset=UTF-8:",
        "            schema:",
        "              type: integer",
        "              minimum: 1",
        "              exclusiveMinimum: true",
        "              nullable: true",
        "      responses:",
        "        '202':",
        "          description: accepted",
        "          content:",
        "            application/*+json; charset=utf-8:",
        "              schema:",
        "                type: string",
        "                maxLength: 10",
        "                maximum: 5",
        "                exclusiveMaximum: true"
      ].join("\n"),
      "utf8"
    );

    try {
      const model = await loadOpenApiCoverageModel(specPath);
      const operationKey = serializeOperationKey({ kind: "http", method: "POST", route: "/widgets/{param}" });
      const contract = model.operationContractsByKey.get(operationKey);

      expect(contract?.requestBody).toMatchObject({
        required: true,
        content: [{ mediaType: "application/json" }]
      });
      expect(contract?.requestBody?.content[0]?.schema).toEqual({
        type: ["integer", "null"],
        exclusiveMinimum: 1
      });
      expect(contract?.responseBodies).toMatchObject([
        {
          declaredStatus: "202",
          content: [{ mediaType: "application/*+json" }]
        }
      ]);
      expect(contract?.responseBodies[0]?.content[0]?.schema).toEqual({
        type: "string",
        maxLength: 10,
        exclusiveMaximum: 5
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("extracts shape-aware request support contracts without changing legacy coverage parameters", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "yanote-openapi-request-params-"));
    const specPath = path.join(tempDir, "request-params.yaml");

    await writeFile(
      specPath,
      [
        "openapi: 3.0.0",
        "info:",
        "  title: request params",
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
        "            pattern: ^user-[0-9]+$",
        "        - name: content",
        "          in: query",
        "          content:",
        "            application/json:",
        "              schema:",
        "                type: string",
        "        - name: expand",
        "          in: query",
        "          schema:",
        "            type: boolean",
        "        - name: ids",
        "          in: query",
        "          explode: false",
        "          schema:",
        "            type: array",
        "            items:",
        "              type: string",
        "        - name: meta",
        "          in: query",
        "          schema:",
        "            type: object",
        "            properties:",
        "              enabled:",
        "                type: boolean",
        "        - name: tags",
        "          in: query",
        "          schema:",
        "            type: array",
        "            items:",
        "              type: string",
        "        - name: x-batch",
        "          in: header",
        "          schema:",
        "            type: array",
        "            items:",
        "              type: string",
        "        - name: x-trace-id",
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
        "          schema:",
        "            type: array",
        "            items:",
        "              type: string",
        "      responses:",
        "        '200':",
        "          description: ok"
      ].join("\n"),
      "utf8"
    );

    try {
      const model = await loadOpenApiCoverageModel(specPath);
      const operationKey = serializeOperationKey({ kind: "http", method: "GET", route: "/evidence/users/{param}" });
      const contract = model.operationContractsByKey.get(operationKey);

      expect(contract?.parameters).toEqual([
        { name: "id", in: "path", required: true },
        { name: "content", in: "query", required: false },
        { name: "expand", in: "query", required: false },
        { name: "ids", in: "query", required: false },
        { name: "meta", in: "query", required: false },
        { name: "tags", in: "query", required: false },
        { name: "x-batch", in: "header", required: false },
        { name: "x-trace-id", in: "header", required: true }
      ]);

      expect(contract?.requestParameters).toEqual([
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
          name: "content",
          in: "query",
          required: false,
          style: "form",
          explode: true,
          declaredSupport: {
            support: "unsupported",
            reason: "content"
          },
          scalar: {
            support: "unsupported",
            reason: "schema"
          }
        },
        {
          name: "expand",
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
          name: "ids",
          in: "query",
          required: false,
          style: "form",
          explode: false,
          declaredSupport: {
            support: "unsupported",
            reason: "explode"
          },
          scalar: {
            support: "unsupported",
            reason: "schema"
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
          name: "tags",
          in: "query",
          required: false,
          style: "form",
          explode: true,
          declaredSupport: {
            support: "supported",
            shape: "array",
            items: { type: "string" }
          },
          scalar: {
            support: "unsupported",
            reason: "schema"
          }
        },
        {
          name: "x-batch",
          in: "header",
          required: false,
          style: "simple",
          explode: false,
          declaredSupport: {
            support: "unsupported",
            reason: "style"
          },
          scalar: {
            support: "unsupported",
            reason: "schema"
          }
        },
        {
          name: "x-trace-id",
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
          name: "prefs-list",
          in: "cookie",
          required: false,
          style: "form",
          explode: true,
          declaredSupport: {
            support: "unsupported",
            reason: "style"
          },
          scalar: {
            support: "unsupported",
            reason: "schema"
          }
        }
      ]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("keeps declared media ordering stable while preserving more-specific siblings", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-payload-format-media.yaml");
    const incidentsKey = serializeOperationKey({ kind: "http", method: "POST", route: "/incidents" });
    const incidents = model.operationContractsByKey.get(incidentsKey);

    expect(incidents?.requestBody).toMatchObject({
      required: true,
      content: [{ mediaType: "application/*+json" }, { mediaType: "application/problem+json" }]
    });
    expect(incidents?.requestBody?.content[0]?.schema).toMatchObject({
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string" }
      }
    });
    expect(incidents?.requestBody?.content[1]?.schema).toMatchObject({
      type: "object",
      required: ["title", "detail"],
      properties: {
        title: { type: "string" },
        detail: { type: "string" }
      }
    });
    expect(incidents?.responseBodies).toEqual([
      {
        declaredStatus: "202",
        content: [
          {
            mediaType: "application/*+json",
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["accepted"],
              properties: {
                accepted: { type: "boolean" }
              }
            }
          },
          {
            mediaType: "application/problem+json",
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["title", "detail"],
              properties: {
                title: { type: "string" },
                detail: { type: "string" }
              }
            }
          }
        ]
      }
    ]);
  });

  it("extracts deprecated operation metadata additively while keeping non-deprecated contracts false-compatible", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-deprecated-operations.yaml");
    const getUsersKey = serializeOperationKey({ kind: "http", method: "GET", route: "/users" });
    const postUsersKey = serializeOperationKey({ kind: "http", method: "POST", route: "/users" });
    const legacyUsersKey = serializeOperationKey({ kind: "http", method: "GET", route: "/legacy-users" });

    expect(model.operations).toEqual([
      { kind: "http", method: "GET", route: "/users" },
      { kind: "http", method: "POST", route: "/users" },
      { kind: "http", method: "GET", route: "/legacy-users" }
    ]);
    expect(model.operationContractsByKey.get(getUsersKey)?.deprecated ?? false).toBe(false);
    expect(model.operationContractsByKey.get(postUsersKey)?.deprecated ?? false).toBe(false);
    expect(model.operationContractsByKey.get(legacyUsersKey)).toMatchObject({
      deprecated: true,
      declaredStatuses: ["200"],
      parameters: [],
      responseBodies: [{ declaredStatus: "200", content: [] }]
    });
  });
});
