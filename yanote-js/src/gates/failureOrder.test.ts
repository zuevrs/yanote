import { describe, expect, it } from "vitest";
import { selectPrimaryFailure, sortFailuresByPrecedence, type GovernanceFailure } from "./failureOrder.js";

describe("failure precedence ordering", () => {
  it("sorts by class precedence and gate-internal regression > threshold", () => {
    const failures: GovernanceFailure[] = [
      {
        failureClass: "runtime",
        code: "RUNTIME_WRITE",
        reason: "runtime",
        hint: "runtime",
        exitCode: 6,
        severity: "error"
      },
      {
        failureClass: "gate",
        gateKind: "threshold",
        code: "GATE_MIN_COVERAGE",
        reason: "threshold",
        hint: "threshold",
        exitCode: 3,
        severity: "error"
      },
      {
        failureClass: "input",
        code: "INPUT_POLICY_INVALID",
        reason: "input",
        hint: "input",
        exitCode: 2,
        severity: "error"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_FAIL_CLOSED",
        reason: "semantic",
        hint: "semantic",
        exitCode: 5,
        severity: "error"
      },
      {
        failureClass: "gate",
        gateKind: "regression",
        code: "GATE_REGRESSION_COVERAGE_LOSS",
        reason: "regression",
        hint: "regression",
        exitCode: 4,
        severity: "error",
        operationKey: "http GET /a"
      }
    ];

    const ordered = sortFailuresByPrecedence(failures);
    expect(ordered.map((failure) => failure.code)).toEqual([
      "INPUT_POLICY_INVALID",
      "SEMANTIC_FAIL_CLOSED",
      "GATE_REGRESSION_COVERAGE_LOSS",
      "GATE_MIN_COVERAGE",
      "RUNTIME_WRITE"
    ]);
    expect(selectPrimaryFailure(failures)?.code).toBe("INPUT_POLICY_INVALID");
  });

  it("returns undefined primary when only warnings exist", () => {
    const warningOnly: GovernanceFailure[] = [
      {
        failureClass: "gate",
        gateKind: "threshold",
        code: "GATE_MIN_COVERAGE_WARNING",
        reason: "warning",
        hint: "warning",
        exitCode: 3,
        severity: "warning"
      }
    ];

    expect(selectPrimaryFailure(warningOnly)).toBeUndefined();
  });
});
