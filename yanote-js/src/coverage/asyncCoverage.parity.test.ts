import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import { loadAsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncCoverage } from "./asyncCoverage.js";

describe("asyncCoverage parity", () => {
  it("keeps equivalent AsyncAPI v2 and v3 contracts on the same async coverage semantics", async () => {
    const [v2, v3] = await Promise.all([
      loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v2.yaml"),
      loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml")
    ]);
    const [partialEvents, driftEvents] = await Promise.all([
      readAsyncEventsJsonl("test/fixtures/async-events/partial.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/drift.fixture.jsonl")
    ]);

    const v2Partial = computeAsyncCoverage(v2, partialEvents.items);
    const v3Partial = computeAsyncCoverage(v3, partialEvents.items);
    const v2Drift = computeAsyncCoverage(v2, driftEvents.items);
    const v3Drift = computeAsyncCoverage(v3, driftEvents.items);

    expect(snapshotCoverage(v2Partial)).toEqual(snapshotCoverage(v3Partial));
    expect(snapshotCoverage(v2Drift)).toEqual(snapshotCoverage(v3Drift));
  });
});

function snapshotCoverage(coverage: ReturnType<typeof computeAsyncCoverage>) {
  return {
    channels: coverage.channels,
    operations: coverage.operations,
    messages: coverage.messages,
    diagnostics: coverage.diagnostics
  };
}
