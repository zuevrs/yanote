import { describe, expect, it } from "vitest";
import { discoverSpecs } from "./discover.js";
import { resolveSpecSource } from "./specSource.js";

describe("discoverSpecs", () => {
  it("treats a direct file path as openapi by default", async () => {
    const source = await resolveSpecSource("test/fixtures/openapi/simple.yaml");

    try {
      const res = await discoverSpecs(source);
      expect(res.openapi).toContain("simple.yaml");
    } finally {
      await source.cleanup();
    }
  });

  it("treats asyncapi*.yaml as asyncapi when given a file path", async () => {
    const source = await resolveSpecSource("test/fixtures/asyncapi/v3.yaml");

    try {
      const res = await discoverSpecs(source);
      expect(res.asyncapi).toContain("v3.yaml");
    } finally {
      await source.cleanup();
    }
  });
});
