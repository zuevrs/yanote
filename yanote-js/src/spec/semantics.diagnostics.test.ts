import { describe, expect, it } from "vitest";
import { serializeOperationKey } from "../model/operationKey.js";
import { loadAsyncApiSemanticsBundle } from "./asyncapi.js";
import type { SemanticDiagnostic } from "./diagnostics.js";
import { buildHttpSemantics } from "./semantics.js";

describe("semantic diagnostics", () => {
  it("emits invalid diagnostics with path/method context for malformed content", () => {
    const bundle = buildHttpSemantics({
      paths: {
        "/users": {
          get: {},
          post: "invalid-operation"
        },
        "/broken": "invalid-path-item"
      }
    });

    expect(bundle.operations).toEqual([{ kind: "http", method: "GET", route: "/users" }]);
    expect(bundle.hasInvalid).toBe(true);

    expect(bundle.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "invalid",
          method: "POST",
          route: "/users"
        }),
        expect.objectContaining({
          kind: "invalid",
          route: "/broken"
        })
      ])
    );
  });

  it("deduplicates equivalent templated routes in insertion order", () => {
    const bundle = buildHttpSemantics({
      paths: {
        "/pets/{id}": { get: {} },
        "/pets/{name}": { get: {} },
        "/pets/{id}/owners/{ownerId}": { get: {} },
        "/pets/{petId}/owners/{id}": { get: {} }
      }
    });

    expect(bundle.operations).toEqual([
      { kind: "http", method: "GET", route: "/pets/{param}" },
      { kind: "http", method: "GET", route: "/pets/{param}/owners/{param}" }
    ]);
    expect(bundle.diagnostics).toEqual([]);
  });

  it("accepts structured async diagnostic context for kafka contract failures", () => {
    const diagnostic = {
      kind: "invalid",
      message: "Unsupported async protocol for the current scope boundary",
      async: {
        runtime: "kafka",
        protocol: "amqp",
        asyncapiVersion: "3.0.0",
        action: "send",
        channel: "users.signedup"
      }
    } satisfies SemanticDiagnostic;

    expect(diagnostic.async).toEqual({
      runtime: "kafka",
      protocol: "amqp",
      asyncapiVersion: "3.0.0",
      action: "send",
      channel: "users.signedup"
    });
  });

  it("keeps valid async semantics bundles deterministic across repeated loads", async () => {
    const first = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");
    const second = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");

    expect(snapshotAsyncBundle(first)).toEqual(snapshotAsyncBundle(second));
  });

  it("keeps invalid async semantic diagnostics deterministic across repeated loads", async () => {
    const first = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/invalid.yaml");
    const second = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/invalid.yaml");

    expect(first.diagnostics).toEqual(second.diagnostics);
    expect(first.hasInvalid).toBe(true);
    expect(second.hasInvalid).toBe(true);
  });

  it("is deterministic across repeated builds", () => {
    const spec = {
      paths: {
        "/orders/{orderId}": { get: {}, post: {} },
        "/orders/{id}": { post: "invalid-operation" },
        "/broken": "invalid-path-item"
      }
    };

    const first = buildHttpSemantics(spec);
    const second = buildHttpSemantics(spec);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});

function snapshotAsyncBundle(bundle: Awaited<ReturnType<typeof loadAsyncApiSemanticsBundle>>) {
  return {
    operations: bundle.operations.map((operation) => serializeOperationKey(operation)),
    operationContractsByKey: Array.from(bundle.operationContractsByKey.entries()),
    diagnostics: bundle.diagnostics,
    hasInvalid: bundle.hasInvalid
  };
}
