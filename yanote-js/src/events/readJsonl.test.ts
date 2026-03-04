import { describe, expect, it } from "vitest";
import { readHttpEventsJsonl } from "./readJsonl.js";

describe("readHttpEventsJsonl", () => {
  it("streams jsonl, ignores invalid lines, normalizes suites", async () => {
    const res = await readHttpEventsJsonl("test/fixtures/events/events.fixture.jsonl");
    expect(res.invalidLines).toBe(1);
    expect(res.invalidLineNumbers).toEqual([2]);
    expect(res.items).toHaveLength(1);
    expect(res.items[0]).toMatchObject({
      kind: "http",
      method: "GET",
      route: "/users/{id}",
      testRunId: "run-1",
      testSuite: "unknown"
    });
  });
});

