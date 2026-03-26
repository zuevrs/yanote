export type FailureClass = "input" | "semantic" | "gate" | "runtime";
export type GateFailureKind = "regression" | "threshold";
export type FailureSeverity = "error" | "warning";

export type GovernanceFailure = {
  failureClass: FailureClass;
  code: string;
  reason: string;
  hint: string;
  exitCode: number;
  severity: FailureSeverity;
  gateKind?: GateFailureKind;
  operationKey?: string;
};

const FAILURE_CLASS_RANK: Record<FailureClass, number> = {
  input: 0,
  semantic: 1,
  gate: 2,
  runtime: 3
};

const GATE_KIND_RANK: Record<GateFailureKind, number> = {
  regression: 0,
  threshold: 1
};

const SEMANTIC_CODE_RANK: Record<string, number> = {
  ASYNC_SEMANTIC_SPEC_INVALID: 0,
  ASYNC_SEMANTIC_CORRELATION_ID_MISSING: 1,
  ASYNC_SEMANTIC_CORRELATION_ID_UNAVAILABLE: 2,
  ASYNC_SEMANTIC_CORRELATION_ID_UNSUPPORTED: 3,
  ASYNC_SEMANTIC_REPLY_ADDRESS_MISSING: 4,
  ASYNC_SEMANTIC_REPLY_ADDRESS_UNAVAILABLE: 5,
  ASYNC_SEMANTIC_REPLY_ADDRESS_UNSUPPORTED: 6,
  ASYNC_SEMANTIC_REPLY_ADDRESS_MISMATCH: 7,
  ASYNC_SEMANTIC_RUNTIME_FAIL_CLOSED: 8,
  ASYNC_SEMANTIC_UNSUPPORTED_CONTENT_TYPE: 20,
  ASYNC_SEMANTIC_UNSUPPORTED_SCHEMA_FORMAT: 21,
  ASYNC_SEMANTIC_MISSING_PAYLOAD: 22,
  ASYNC_SEMANTIC_INVALID_PAYLOAD: 23,
  ASYNC_SEMANTIC_MISSING_HEADER: 24,
  ASYNC_SEMANTIC_UNAVAILABLE_HEADER: 25,
  ASYNC_SEMANTIC_INVALID_HEADER: 26,
  ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS: 27,
  ASYNC_SEMANTIC_AMBIGUOUS_MESSAGE: 28,
  ASYNC_SEMANTIC_MESSAGE_MISMATCH: 29,
  ASYNC_SEMANTIC_UNMATCHED_EVIDENCE: 30,
  SEMANTIC_HTTP_MISSING_SECURITY: 40,
  SEMANTIC_HTTP_UNAVAILABLE_SECURITY: 41,
  SEMANTIC_HTTP_UNSUPPORTED_SECURITY: 42,
  SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER: 50,
  SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER: 51,
  SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER: 52,
  SEMANTIC_HTTP_INVALID_BODY: 60,
  SEMANTIC_HTTP_MISSING_BODY: 61,
  SEMANTIC_HTTP_MISSING_CONTENT_TYPE: 62,
  SEMANTIC_HTTP_MEDIA_TYPE_MISMATCH: 63,
  SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE: 64,
  SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT: 65,
  SEMANTIC_HTTP_UNSUPPORTED_SCHEMA: 66,
  SEMANTIC_SPEC_INVALID: 70,
  SEMANTIC_FAIL_CLOSED: 99
};

export function sortFailuresByPrecedence(failures: GovernanceFailure[]): GovernanceFailure[] {
  return [...failures].sort((left, right) => {
    const severity = severityRank(left.severity) - severityRank(right.severity);
    if (severity !== 0) return severity;

    const classRank = FAILURE_CLASS_RANK[left.failureClass] - FAILURE_CLASS_RANK[right.failureClass];
    if (classRank !== 0) return classRank;

    const gateKind = gateRank(left) - gateRank(right);
    if (gateKind !== 0) return gateKind;

    const semanticRank = semanticCodeRank(left) - semanticCodeRank(right);
    if (semanticRank !== 0) return semanticRank;

    if (left.code !== right.code) return left.code.localeCompare(right.code);

    const leftOperationKey = left.operationKey ?? "";
    const rightOperationKey = right.operationKey ?? "";
    if (leftOperationKey !== rightOperationKey) return leftOperationKey.localeCompare(rightOperationKey);

    if (left.reason !== right.reason) return left.reason.localeCompare(right.reason);

    return left.hint.localeCompare(right.hint);
  });
}

export function selectPrimaryFailure(failures: GovernanceFailure[]): GovernanceFailure | undefined {
  const ordered = sortFailuresByPrecedence(failures);
  return ordered.find((failure) => failure.severity === "error");
}

function severityRank(severity: FailureSeverity): number {
  return severity === "error" ? 0 : 1;
}

function gateRank(failure: GovernanceFailure): number {
  if (failure.failureClass !== "gate") return 0;
  if (!failure.gateKind) return 2;
  return GATE_KIND_RANK[failure.gateKind];
}

function semanticCodeRank(failure: GovernanceFailure): number {
  if (failure.failureClass !== "semantic") return 0;
  return SEMANTIC_CODE_RANK[failure.code] ?? 100;
}
