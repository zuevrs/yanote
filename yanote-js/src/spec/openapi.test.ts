import { describe, expect, it } from "vitest";
import { loadOpenApiOperations } from "./openapi.js";

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
});

