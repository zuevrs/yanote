import type { BaselineDimensionsSnapshot, RegressionComparison } from "../baseline/baseline.js";
import type { CoverageResult } from "../coverage/coverage.js";
import { serializeOperationKey } from "../model/operationKey.js";
import type { GovernanceFailure } from "./failureOrder.js";
import type { GatePolicy } from "./policy.js";

export function evaluateThresholdGate(input: {
  coverage: CoverageResult;
  policy: GatePolicy;
}): GovernanceFailure[] {
  const failures: GovernanceFailure[] = [];
  const raw = computeRawCoverageMetrics(input.coverage);
  const thresholdSeverity = input.policy.enforcement.thresholdFailuresAreErrors ? "error" : "warning";

  if (typeof raw.operations === "number" && raw.operations < input.policy.thresholds.minCoverage) {
    failures.push({
      failureClass: "gate",
      gateKind: "threshold",
      code: "GATE_MIN_COVERAGE",
      reason: `Operation coverage ${raw.operations.toFixed(4)}% is below required ${input.policy.thresholds.minCoverage.toFixed(4)}%.`,
      hint: "Increase endpoint coverage or lower threshold intentionally.",
      exitCode: 3,
      severity: thresholdSeverity
    });
  } else if (
    typeof raw.operations === "number" &&
    raw.operations < input.policy.thresholds.warningBand &&
    raw.operations >= input.policy.thresholds.minCoverage
  ) {
    failures.push({
      failureClass: "gate",
      gateKind: "threshold",
      code: "GATE_MIN_COVERAGE_WARNING",
      reason: `Operation coverage ${raw.operations.toFixed(4)}% entered warning band ${input.policy.thresholds.warningBand.toFixed(4)}%.`,
      hint: "Raise operation coverage to stay above warning band.",
      exitCode: 3,
      severity: "warning"
    });
  }

  if (input.policy.thresholds.aggregate.enabled) {
    if (raw.aggregate == null) {
      failures.push({
        failureClass: "gate",
        gateKind: "threshold",
        code: "GATE_AGGREGATE_SKIPPED",
        reason: "Aggregate gate skipped because aggregate coverage is N/A.",
        hint: "Declare status and parameter contracts to evaluate aggregate gate.",
        exitCode: 3,
        severity: "warning"
      });
    } else if (raw.aggregate < input.policy.thresholds.aggregate.minCoverage) {
      failures.push({
        failureClass: "gate",
        gateKind: "threshold",
        code: "GATE_MIN_AGGREGATE",
        reason: `Aggregate coverage ${raw.aggregate.toFixed(4)}% is below required ${input.policy.thresholds.aggregate.minCoverage.toFixed(4)}%.`,
        hint: "Improve weighted dimensions or lower aggregate threshold intentionally.",
        exitCode: 3,
        severity: thresholdSeverity
      });
    } else if (
      raw.aggregate < input.policy.thresholds.aggregate.warningBand &&
      raw.aggregate >= input.policy.thresholds.aggregate.minCoverage
    ) {
      failures.push({
        failureClass: "gate",
        gateKind: "threshold",
        code: "GATE_MIN_AGGREGATE_WARNING",
        reason: `Aggregate coverage ${raw.aggregate.toFixed(4)}% entered warning band ${input.policy.thresholds.aggregate.warningBand.toFixed(4)}%.`,
        hint: "Raise aggregate coverage to stay above warning band.",
        exitCode: 3,
        severity: "warning"
      });
    }
  }

  const allOperations = new Set(input.coverage.allOperations.map((operation) => serializeOperationKey(operation)));
  const coveredOperations = new Set(input.coverage.coveredOperations.map((operation) => serializeOperationKey(operation)));

  for (const operationKey of input.policy.thresholds.criticalOperations) {
    if (!allOperations.has(operationKey)) continue;
    if (coveredOperations.has(operationKey)) continue;
    failures.push({
      failureClass: "gate",
      gateKind: "threshold",
      code: "GATE_CRITICAL_OPERATION_COVERAGE_LOSS",
      reason: `Critical operation ${operationKey} is uncovered.`,
      hint: "Restore coverage for critical operation or remove it from critical list intentionally.",
      exitCode: 3,
      severity: "error",
      operationKey
    });
  }

  return failures;
}

export function evaluateRegressionGate(input: {
  comparison: RegressionComparison;
  policy: GatePolicy;
}): GovernanceFailure[] {
  const failures: GovernanceFailure[] = [];
  const regressionSeverity = input.policy.enforcement.regressionFailuresAreErrors ? "error" : "warning";

  for (const operationKey of input.comparison.missingCoveredOperations) {
    failures.push({
      failureClass: "gate",
      gateKind: "regression",
      code: "GATE_REGRESSION_COVERAGE_LOSS",
      reason: `Previously covered operation ${operationKey} regressed to uncovered.`,
      hint: "Restore tests or regenerate baseline intentionally.",
      exitCode: 4,
      severity: regressionSeverity,
      operationKey
    });
  }

  for (const regression of input.comparison.dimensionRegressions) {
    failures.push({
      failureClass: "gate",
      gateKind: "regression",
      code: "GATE_REGRESSION_DIMENSION",
      reason: `Dimension ${regression.dimension} regressed from ${regression.baseline.toFixed(2)} to ${regression.current.toFixed(2)}.`,
      hint: "Dimension regressions are warning-level in Phase 3.",
      exitCode: 4,
      severity: "warning",
      operationKey: regression.dimension
    });
  }

  return failures;
}

export function evaluateGateFailures(input: {
  coverage: CoverageResult;
  policy: GatePolicy;
  comparison?: RegressionComparison;
}): GovernanceFailure[] {
  const threshold = evaluateThresholdGate({
    coverage: input.coverage,
    policy: input.policy
  });
  const regression =
    input.comparison != null
      ? evaluateRegressionGate({
          comparison: input.comparison,
          policy: input.policy
        })
      : [];
  return [...regression, ...threshold];
}

function computeRawCoverageMetrics(coverage: CoverageResult): BaselineDimensionsSnapshot {
  const operations =
    coverage.allOperations.length > 0 ? (coverage.coveredOperations.length / coverage.allOperations.length) * 100 : null;

  let statusDeclared = 0;
  let statusCovered = 0;
  let requiredParametersDeclared = 0;
  let requiredParametersCovered = 0;

  for (const entry of coverage.perOperation) {
    statusDeclared += entry.status.declaredStatuses.length;
    statusCovered += entry.status.coveredStatuses.length;
    requiredParametersDeclared += entry.parameters.required.total;
    requiredParametersCovered += entry.parameters.required.covered;
  }

  const status = statusDeclared > 0 ? (statusCovered / statusDeclared) * 100 : null;
  const parameters = requiredParametersDeclared > 0 ? (requiredParametersCovered / requiredParametersDeclared) * 100 : null;
  const aggregate =
    operations == null || status == null || parameters == null ? null : operations * 0.6 + status * 0.25 + parameters * 0.15;

  return {
    operations,
    status,
    parameters,
    aggregate
  };
}
