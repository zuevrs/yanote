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
        code: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT",
        reason:
          "request payload for http POST /custom-format media=application/json declares a schema format outside Yanote's supported payload format allowlist.",
        hint: "unsupported format",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /custom-format"
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
      "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT",
      "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
      "SEMANTIC_FAIL_CLOSED",
      "GATE_MIN_COVERAGE"
    ]);
    expect(selectPrimaryFailure(failures)?.code).toBe("SEMANTIC_HTTP_INVALID_BODY");
  });

  it("orders request semantic failures ahead of payload semantics, generic fail-closed wrappers, and gate failures", () => {
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
        code: "SEMANTIC_HTTP_INVALID_BODY",
        reason: "request payload for http POST /orders media=application/json failed JSON schema validation.",
        hint: "invalid body",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER",
        reason: "query parameter 'filter' for http POST /orders falls outside the published supported request serialization subset.",
        hint: "unsupported request",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER",
        reason: "query parameter 'count' for http POST /orders failed supported request-parameter validation.",
        hint: "invalid request",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER",
        reason: "request header 'x-auth' for http POST /orders was unavailable for request-semantic verification because retained evidence was redacted.",
        hint: "unavailable request",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
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
      "SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER",
      "SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER",
      "SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER",
      "SEMANTIC_HTTP_INVALID_BODY",
      "SEMANTIC_FAIL_CLOSED",
      "GATE_MIN_COVERAGE"
    ]);
    expect(selectPrimaryFailure(failures)?.code).toBe("SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER");
  });

  it("orders security semantic failures ahead of request, payload, generic fail-closed wrappers, and gate failures", () => {
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
        code: "SEMANTIC_HTTP_INVALID_BODY",
        reason: "request payload for http POST /orders media=application/json failed JSON schema validation.",
        hint: "invalid body",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER",
        reason: "query parameter 'count' for http POST /orders failed supported request-parameter validation.",
        hint: "invalid request",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
        reason: "security scheme 'basicAuth' on http POST /orders uses unsupported OpenAPI security type 'http' within Yanote's truthful apiKey-only subset.",
        hint: "unsupported security",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
        reason: "required header apiKey 'X-Api-Key' for security scheme 'headerKey' on http POST /orders was unavailable for security verification because retained evidence was redacted (reason: sensitive).",
        hint: "unavailable security",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
      },
      {
        failureClass: "semantic",
        code: "SEMANTIC_HTTP_MISSING_SECURITY",
        reason: "required query apiKey 'api_key' for security scheme 'queryKey' on http POST /orders was not retained in request evidence.",
        hint: "missing security",
        exitCode: 5,
        severity: "error",
        operationKey: "http POST /orders"
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
      "SEMANTIC_HTTP_MISSING_SECURITY",
      "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
      "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
      "SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER",
      "SEMANTIC_HTTP_INVALID_BODY",
      "SEMANTIC_FAIL_CLOSED",
      "GATE_MIN_COVERAGE"
    ]);
    expect(selectPrimaryFailure(failures)?.code).toBe("SEMANTIC_HTTP_MISSING_SECURITY");
  });

  it("keeps async spec-invalid first, then typed runtime semantic failures, then generic drift and gate failures", () => {
    const failures: GovernanceFailure[] = [
      {
        failureClass: "gate",
        gateKind: "threshold",
        code: "ASYNC_GATE_MIN_COVERAGE",
        reason: "threshold",
        hint: "threshold",
        exitCode: 3,
        severity: "error"
      },
      {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_MESSAGE_MISMATCH",
        reason: "message mismatch",
        hint: "message mismatch",
        exitCode: 5,
        severity: "error",
        operationKey: "kafka send orders.command"
      },
      {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_CORRELATION_ID_MISSING",
        reason: "correlation missing b",
        hint: "correlation missing b",
        exitCode: 5,
        severity: "error",
        operationKey: "kafka send z-topic"
      },
      {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_SPEC_INVALID",
        reason: "spec invalid",
        hint: "spec invalid",
        exitCode: 5,
        severity: "error",
        operationKey: "kafka send orders.command"
      },
      {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_REPLY_ADDRESS_UNAVAILABLE",
        reason: "reply unavailable",
        hint: "reply unavailable",
        exitCode: 5,
        severity: "error",
        operationKey: "kafka send orders.command"
      },
      {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_CORRELATION_ID_MISSING",
        reason: "correlation missing a",
        hint: "correlation missing a",
        exitCode: 5,
        severity: "error",
        operationKey: "kafka send a-topic"
      }
    ];

    const ordered = sortFailuresByPrecedence(failures);
    expect(ordered.map((failure) => failure.code)).toEqual([
      "ASYNC_SEMANTIC_SPEC_INVALID",
      "ASYNC_SEMANTIC_CORRELATION_ID_MISSING",
      "ASYNC_SEMANTIC_CORRELATION_ID_MISSING",
      "ASYNC_SEMANTIC_REPLY_ADDRESS_UNAVAILABLE",
      "ASYNC_SEMANTIC_MESSAGE_MISMATCH",
      "ASYNC_GATE_MIN_COVERAGE"
    ]);
    expect(ordered.slice(1, 3).map((failure) => failure.operationKey)).toEqual([
      "kafka send a-topic",
      "kafka send z-topic"
    ]);
    expect(selectPrimaryFailure(failures)?.code).toBe("ASYNC_SEMANTIC_SPEC_INVALID");
  });

  it("keeps malformed async runtime failures in a stable fail-closed bucket ahead of generic async drift and gate failures", () => {
    const failures: GovernanceFailure[] = [
      {
        failureClass: "gate",
        gateKind: "regression",
        code: "ASYNC_GATE_REGRESSION_COVERAGE_LOSS",
        reason: "regression",
        hint: "regression",
        exitCode: 4,
        severity: "error",
        operationKey: "kafka send orders.command"
      },
      {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_MESSAGE_MISMATCH",
        reason: "message mismatch",
        hint: "message mismatch",
        exitCode: 5,
        severity: "error",
        operationKey: "kafka send orders.command"
      },
      {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_RUNTIME_FAIL_CLOSED",
        reason: "runtime fail-closed",
        hint: "runtime fail-closed",
        exitCode: 5,
        severity: "error"
      }
    ];

    const ordered = sortFailuresByPrecedence(failures);
    expect(ordered.map((failure) => failure.code)).toEqual([
      "ASYNC_SEMANTIC_RUNTIME_FAIL_CLOSED",
      "ASYNC_SEMANTIC_MESSAGE_MISMATCH",
      "ASYNC_GATE_REGRESSION_COVERAGE_LOSS"
    ]);
    expect(selectPrimaryFailure(failures)?.code).toBe("ASYNC_SEMANTIC_RUNTIME_FAIL_CLOSED");
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
