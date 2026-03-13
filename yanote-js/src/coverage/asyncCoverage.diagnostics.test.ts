import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import { loadAsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncCoverage } from "./asyncCoverage.js";

describe("computeAsyncCoverage diagnostics", () => {
  it("keeps unmatched and mismatched async diagnostics deterministic across repeated runs", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/drift.fixture.jsonl");

    const first = computeAsyncCoverage(bundle, events.items);
    const second = computeAsyncCoverage(bundle, events.items);

    expect(first.diagnostics).toEqual(second.diagnostics);
    expect(first.diagnostics).toEqual([
      {
        kind: "mismatched",
        channel: "users.deleted",
        action: "receive",
        observedMessage: "LegacyUserDeleted",
        expectedMessage: "UserDeleted",
        message: "Observed async message contract did not match the canonical AsyncAPI message contract"
      },
      {
        kind: "unmatched",
        channel: "users.unknown",
        action: "send",
        observedMessage: "UserUnknown",
        message: "No canonical async operation matched the observed kafka evidence"
      }
    ]);
  });

  it("keeps channel coverage separate from action drift on known channels", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/action-mismatch.fixture.jsonl");

    const coverage = computeAsyncCoverage(bundle, events.items);

    expect(coverage.channels.items).toEqual([
      {
        channel: "users.signedup",
        state: "UNCOVERED",
        coveredActions: [],
        missingActions: ["send"]
      },
      {
        channel: "users.deleted",
        state: "COVERED",
        coveredActions: [],
        missingActions: ["receive"]
      }
    ]);
    expect(coverage.operations.summary).toEqual({ total: 2, covered: 0, percent: 0 });
    expect(coverage.messages.summary).toEqual({ total: 2, covered: 0, percent: 0 });
    expect(coverage.diagnostics).toEqual([
      {
        kind: "unmatched",
        channel: "users.deleted",
        action: "send",
        observedMessage: "UserDeleted",
        message: "No canonical async operation matched the observed kafka evidence"
      }
    ]);
  });
});
