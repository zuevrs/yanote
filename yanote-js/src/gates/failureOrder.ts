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

export function sortFailuresByPrecedence(failures: GovernanceFailure[]): GovernanceFailure[] {
  return [...failures].sort((left, right) => {
    const severity = severityRank(left.severity) - severityRank(right.severity);
    if (severity !== 0) return severity;

    const classRank = FAILURE_CLASS_RANK[left.failureClass] - FAILURE_CLASS_RANK[right.failureClass];
    if (classRank !== 0) return classRank;

    const gateKind = gateRank(left) - gateRank(right);
    if (gateKind !== 0) return gateKind;

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
