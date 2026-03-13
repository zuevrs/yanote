import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import { loadAsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncCoverage } from "../coverage/asyncCoverage.js";
import { sortFailuresByPrecedence } from "./failureOrder.js";
import { resolveGatePolicy } from "./policy.js";
import {
  evaluateAsyncGateFailures,
  evaluateAsyncRegressionGate,
  evaluateAsyncThresholdGate,
  type AsyncRegressionComparison
} from "./asyncEvaluator.js";

async function loadCoverage(fixture: string) {
  const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");
  const events = await readAsyncEventsJsonl(fixture);
  return computeAsyncCoverage(bundle, events.items);
}

describe("async gate evaluator contract", () => {
  it("fails closed on mismatched and unmatched async drift even when operation threshold is satisfied", async () => {
    const coverage = await loadCoverage("test/fixtures/async-events/drift.fixture.jsonl");
    const policy = await resolveGatePolicy({
      defaultProfile: "ci",
      cliOverrides: {
        minCoverage: 90
      }
    });

    const ordered = sortFailuresByPrecedence(
      evaluateAsyncGateFailures({
        coverage,
        policy
      })
    );

    expect(ordered.map((failure) => failure.code)).toEqual([
      "ASYNC_SEMANTIC_MESSAGE_MISMATCH",
      "ASYNC_SEMANTIC_UNMATCHED_EVIDENCE"
    ]);
    expect(ordered.every((failure) => failure.failureClass === "semantic" && failure.severity === "error")).toBe(true);
  });

  it("uses raw operation coverage decimals for threshold comparison and hard-fails critical async operations", async () => {
    const coverage = await loadCoverage("test/fixtures/async-events/partial.fixture.jsonl");
    const policy = await resolveGatePolicy({
      profile: "local",
      cliOverrides: {
        minCoverage: 50.001,
        criticalOperations: ["kafka receive users.deleted"]
      }
    });

    const failures = evaluateAsyncThresholdGate({ coverage, policy });

    expect(failures.map((failure) => failure.code)).toEqual(
      expect.arrayContaining(["ASYNC_GATE_MIN_COVERAGE", "ASYNC_GATE_CRITICAL_OPERATION_COVERAGE_LOSS"])
    );
    const critical = failures.find((failure) => failure.code === "ASYNC_GATE_CRITICAL_OPERATION_COVERAGE_LOSS");
    expect(critical?.severity).toBe("error");
  });

  it("keeps regression failures deterministic and ordered ahead of threshold warnings", async () => {
    const coverage = await loadCoverage("test/fixtures/async-events/partial.fixture.jsonl");
    const comparison: AsyncRegressionComparison = {
      missingCoveredOperations: ["kafka receive users.deleted"],
      removedSpecOperations: ["kafka send users.removed"],
      dimensionRegressions: [
        { dimension: "channels", baseline: 100, current: 50 },
        { dimension: "messages", baseline: 100, current: 50 },
        { dimension: "operations", baseline: 100, current: 50 }
      ]
    };
    const policy = await resolveGatePolicy({
      defaultProfile: "ci",
      cliOverrides: {
        minCoverage: 80
      }
    });

    const regression = evaluateAsyncRegressionGate({ comparison, policy });
    expect(regression.map((failure) => failure.code)).toEqual([
      "ASYNC_GATE_REGRESSION_COVERAGE_LOSS",
      "ASYNC_GATE_REGRESSION_DIMENSION",
      "ASYNC_GATE_REGRESSION_DIMENSION",
      "ASYNC_GATE_REGRESSION_DIMENSION"
    ]);

    const ordered = sortFailuresByPrecedence(
      evaluateAsyncGateFailures({
        coverage,
        policy,
        comparison
      })
    );
    expect(ordered.map((failure) => failure.code)).toEqual([
      "ASYNC_GATE_REGRESSION_COVERAGE_LOSS",
      "ASYNC_GATE_MIN_COVERAGE",
      "ASYNC_GATE_REGRESSION_DIMENSION",
      "ASYNC_GATE_REGRESSION_DIMENSION",
      "ASYNC_GATE_REGRESSION_DIMENSION"
    ]);
  });
});
