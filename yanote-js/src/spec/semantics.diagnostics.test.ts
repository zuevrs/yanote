import { describe, expect, it } from "vitest";
import { buildHttpSemantics } from "./semantics.js";

describe("buildHttpSemantics diagnostics", () => {
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
