import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { serializeOperationKey } from "../model/operationKey.js";
import { loadOpenApiCoverageModel } from "./openapi.js";

function getSecurity(model: Awaited<ReturnType<typeof loadOpenApiCoverageModel>>, method: string, route: string) {
  const operationKey = serializeOperationKey({ kind: "http", method, route });
  const contract = model.operationContractsByKey.get(operationKey);
  expect(contract).toBeDefined();
  expect(contract?.security).toBeDefined();
  return contract?.security;
}

describe("OpenAPI security extraction", () => {
  it("resolves inherited, overridden, cleared, optional, OR, AND, and unsupported security contracts deterministically", async () => {
    const model = await loadOpenApiCoverageModel("test/fixtures/openapi/http-security-api-key.yaml");

    expect(model.operations).toEqual([
      { kind: "http", method: "GET", route: "/root-inherited" },
      { kind: "http", method: "GET", route: "/override-query" },
      { kind: "http", method: "GET", route: "/clear" },
      { kind: "http", method: "GET", route: "/optional" },
      { kind: "http", method: "GET", route: "/or-and-satisfied" },
      { kind: "http", method: "GET", route: "/or-and-missing" },
      { kind: "http", method: "GET", route: "/redacted" },
      { kind: "http", method: "GET", route: "/unavailable" },
      { kind: "http", method: "GET", route: "/unsupported-http" },
      { kind: "http", method: "GET", route: "/unsupported-oauth" },
      { kind: "http", method: "GET", route: "/unsupported-openid" },
      { kind: "http", method: "GET", route: "/unsupported-location" }
    ]);

    expect(getSecurity(model, "GET", "/root-inherited")).toEqual({
      source: "root",
      cleared: false,
      requirements: [
        {
          schemes: [
            {
              scheme: {
                schemeName: "headerKey",
                type: "apiKey",
                in: "header",
                keyName: "X-Api-Key"
              },
              scopes: []
            }
          ]
        }
      ]
    });

    expect(getSecurity(model, "GET", "/override-query")).toEqual({
      source: "operation",
      cleared: false,
      requirements: [
        {
          schemes: [
            {
              scheme: {
                schemeName: "queryKey",
                type: "apiKey",
                in: "query",
                keyName: "api_key"
              },
              scopes: []
            }
          ]
        }
      ]
    });

    expect(getSecurity(model, "GET", "/clear")).toEqual({
      source: "operation",
      cleared: true,
      requirements: []
    });

    expect(getSecurity(model, "GET", "/optional")).toEqual({
      source: "operation",
      cleared: false,
      requirements: [
        {
          schemes: []
        },
        {
          schemes: [
            {
              scheme: {
                schemeName: "cookieKey",
                type: "apiKey",
                in: "cookie",
                keyName: "session"
              },
              scopes: []
            }
          ]
        }
      ]
    });

    expect(getSecurity(model, "GET", "/or-and-satisfied")).toEqual({
      source: "operation",
      cleared: false,
      requirements: [
        {
          schemes: [
            {
              scheme: {
                schemeName: "headerKey",
                type: "apiKey",
                in: "header",
                keyName: "X-Api-Key"
              },
              scopes: []
            },
            {
              scheme: {
                schemeName: "queryKey",
                type: "apiKey",
                in: "query",
                keyName: "api_key"
              },
              scopes: []
            }
          ]
        },
        {
          schemes: [
            {
              scheme: {
                schemeName: "cookieKey",
                type: "apiKey",
                in: "cookie",
                keyName: "session"
              },
              scopes: []
            }
          ]
        }
      ]
    });

    expect(getSecurity(model, "GET", "/unsupported-http")).toEqual({
      source: "operation",
      cleared: false,
      requirements: [
        {
          schemes: [
            {
              scheme: {
                schemeName: "basicAuth",
                type: "http",
                scheme: "basic"
              },
              scopes: []
            }
          ]
        }
      ]
    });

    expect(getSecurity(model, "GET", "/unsupported-oauth")).toEqual({
      source: "operation",
      cleared: false,
      requirements: [
        {
          schemes: [
            {
              scheme: {
                schemeName: "oauthKey",
                type: "oauth2"
              },
              scopes: ["read"]
            }
          ]
        }
      ]
    });

    expect(getSecurity(model, "GET", "/unsupported-openid")).toEqual({
      source: "operation",
      cleared: false,
      requirements: [
        {
          schemes: [
            {
              scheme: {
                schemeName: "oidcAuth",
                type: "openIdConnect"
              },
              scopes: []
            }
          ]
        }
      ]
    });

    expect(getSecurity(model, "GET", "/unsupported-location")).toEqual({
      source: "operation",
      cleared: false,
      requirements: [
        {
          schemes: [
            {
              scheme: {
                schemeName: "pathKey",
                type: "apiKey",
                in: "path",
                keyName: "secret"
              },
              scopes: []
            }
          ]
        }
      ]
    });
  });

  it("rejects missing security scheme references with path and method context", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-openapi-security-missing-"));
    const specPath = path.join(dir, "missing-security.yaml");

    await writeFile(
      specPath,
      [
        "openapi: 3.0.0",
        "info:",
        "  title: missing security ref",
        "  version: 1.0.0",
        "paths:",
        "  /missing:",
        "    get:",
        "      security:",
        "        - unknownAuth: []",
        "      responses:",
        "        '200':",
        "          description: ok"
      ].join("\n"),
      "utf8"
    );

    try {
      await expect(loadOpenApiCoverageModel(specPath)).rejects.toThrow(
        "OpenAPI semantic extraction failed: GET /missing: operation security references missing security scheme 'unknownAuth'."
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects referenced apiKey schemes that cannot be evaluated truthfully", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-openapi-security-invalid-"));
    const specPath = path.join(dir, "invalid-security.yaml");

    await writeFile(
      specPath,
      [
        "openapi: 3.0.0",
        "info:",
        "  title: invalid security ref",
        "  version: 1.0.0",
        "components:",
        "  securitySchemes:",
        "    brokenKey:",
        "      type: apiKey",
        "      name: X-Broken-Key",
        "paths:",
        "  /broken:",
        "    get:",
        "      security:",
        "        - brokenKey: []",
        "      responses:",
        "        '200':",
        "          description: ok"
      ].join("\n"),
      "utf8"
    );

    try {
      await expect(loadOpenApiCoverageModel(specPath)).rejects.toThrow(
        "OpenAPI semantic extraction failed: GET /broken: apiKey security scheme 'brokenKey' must declare a non-empty 'in' location."
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
