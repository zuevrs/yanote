import { describe, expect, it } from "vitest";
import { loadAsyncApiOperations } from "./asyncapi.js";

describe("asyncapi loader", () => {
  it("extracts operations from AsyncAPI v2", async () => {
    const ops = await loadAsyncApiOperations("test/fixtures/asyncapi/v2.yaml");
    expect(ops).toContainEqual({ kind: "asyncapi", action: "send", channel: "users.signedup" });
    expect(ops).toContainEqual({ kind: "asyncapi", action: "receive", channel: "users.deleted" });
  });

  it("extracts operations from AsyncAPI v3", async () => {
    const ops = await loadAsyncApiOperations("test/fixtures/asyncapi/v3.yaml");
    expect(ops).toContainEqual({ kind: "asyncapi", action: "receive", channel: "hello" });
  });
});

