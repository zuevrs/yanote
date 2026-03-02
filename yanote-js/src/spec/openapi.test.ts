import { describe, expect, it } from "vitest";
import { loadOpenApiOperations } from "./openapi.js";

describe("openapi loader", () => {
  it("extracts http operation keys", async () => {
    const ops = await loadOpenApiOperations("test/fixtures/openapi/simple.yaml");
    expect(ops).toContainEqual({ kind: "http", method: "GET", route: "/health" });
    expect(ops).toContainEqual({ kind: "http", method: "GET", route: "/users/{id}" });
    expect(ops).toContainEqual({ kind: "http", method: "POST", route: "/users" });
  });
});

