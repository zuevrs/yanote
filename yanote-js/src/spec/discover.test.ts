import { describe, expect, it } from "vitest";
import { discoverSpecs } from "./discover.js";

describe("discoverSpecs", () => {
  it("treats a direct file path as openapi by default", async () => {
    const res = await discoverSpecs("test/fixtures/openapi/simple.yaml");
    expect(res.openapi).toContain("simple.yaml");
  });

  it("treats asyncapi*.yaml as asyncapi when given a file path", async () => {
    const res = await discoverSpecs("test/fixtures/asyncapi/v3.yaml");
    expect(res.asyncapi).toContain("v3.yaml");
  });
});

