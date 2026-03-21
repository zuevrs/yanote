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

  it("pins HTTP semantic precedence ahead of generic fail-closed wrappers and gate failures", () => {
    const failures: GovernanceFailure[] = [
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
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
        reason: "response payload for http POST /orders declared-status=201 media=application/json declares JSON content without a usable validation schema.",
        hint: "schema",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_MISSING_BODY",
        reason: "request payload for http POST /orders media=application/json is missing a required body.",
        hint: "missing body",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_INVALID_BODY",
        reason: "request payload for http POST /orders media=application/json failed JSON schema validation.",
        hint: "invalid body",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
        reason: "request payload for http POST /notes media=text/plain uses a declared media type outside JSON payload conformance support.",
        hint: "unsupported media",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /notes"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_FAIL_CLOSED",
        reason: "generic semantic fail-closed wrapper",
        hint: "generic",
        exitCode: 5,
        severity: "error"
      }
    ];

    const ordered = sortFailuresByPrecedence(failures);
    expect(ordered.map((failure) => failure.code)).toEqual([
      "SEMANTIC_HTTP_INVALID_BODY",
      "SEMANTIC_HTTP_MISSING_BODY",
      "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
      "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
      "SEMANTIC_FAIL_CLOSED",
      "GATE_MIN_COVERAGE"
    ]);
    expect(selectPrimaryFailure(failures)?.code).toBe("SEMANTIC_HTTP_INVALID_BODY");
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
