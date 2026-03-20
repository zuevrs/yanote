import {
  compareAsyncCoverageDiagnostics,
  type AsyncCoverageDiagnostic,
  type AsyncCoverageResult
} from "../coverage/asyncCoverage.js";
import type { GovernanceFailure } from "./failureOrder.js";
import type { GatePolicy } from "./policy.js";

export type AsyncBaselineDimensionsSnapshot = {
  channels: number | null;
  operations: number | null;
  messages: number | null;
};

export type AsyncRegressionComparison = {
  missingCoveredOperations: string[];
  removedSpecOperations: string[];
  dimensionRegressions: Array<{
    dimension: keyof AsyncBaselineDimensionsSnapshot;
    baseline: number;
    current: number;
  }>;
};

export function evaluateAsyncThresholdGate(input: {
  coverage: AsyncCoverageResult;
  policy: GatePolicy;
}): GovernanceFailure[] {
  const failures: GovernanceFailure[] = [];
  const operations = computeRawOperationCoverage(input.coverage);
  const thresholdSeverity = input.policy.enforcement.thresholdFailuresAreErrors ? "error" : "warning";

  if (typeof operations === "number" && operations < input.policy.thresholds.minCoverage) {
    failures.push({
      failureClass: "gate",
      gateKind: "threshold",
      code: "ASYNC_GATE_MIN_COVERAGE",
      reason: `Async operation coverage ${operations.toFixed(4)}% is below required ${input.policy.thresholds.minCoverage.toFixed(4)}%.`,
      hint: "Increase async operation coverage or lower threshold intentionally.",
      exitCode: 3,
      severity: thresholdSeverity
    });
  } else if (
    typeof operations === "number" &&
    operations < input.policy.thresholds.warningBand &&
    operations >= input.policy.thresholds.minCoverage
  ) {
    failures.push({
      failureClass: "gate",
      gateKind: "threshold",
      code: "ASYNC_GATE_MIN_COVERAGE_WARNING",
      reason: `Async operation coverage ${operations.toFixed(4)}% entered warning band ${input.policy.thresholds.warningBand.toFixed(4)}%.`,
      hint: "Raise async operation coverage to stay above warning band.",
      exitCode: 3,
      severity: "warning"
    });
  }

  const allOperations = new Set(input.coverage.operations.items.map((entry) => entry.operationKey));
  const coveredOperations = new Set(
    input.coverage.operations.items
      .filter((entry) => entry.operation.state === "COVERED")
      .map((entry) => entry.operationKey)
  );

  for (const operationKey of input.policy.thresholds.criticalOperations) {
    if (!allOperations.has(operationKey)) continue;
    if (coveredOperations.has(operationKey)) continue;
    failures.push({
      failureClass: "gate",
      gateKind: "threshold",
      code: "ASYNC_GATE_CRITICAL_OPERATION_COVERAGE_LOSS",
      reason: `Critical async operation ${operationKey} is uncovered.`,
      hint: "Restore async coverage for the critical operation or remove it from the critical list intentionally.",
      exitCode: 3,
      severity: "error",
      operationKey
    });
  }

  return failures;
}

export function evaluateAsyncRegressionGate(input: {
  comparison: AsyncRegressionComparison;
  policy: GatePolicy;
}): GovernanceFailure[] {
  const failures: GovernanceFailure[] = [];
  const regressionSeverity = input.policy.enforcement.regressionFailuresAreErrors ? "error" : "warning";

  for (const operationKey of [...input.comparison.missingCoveredOperations].sort((left, right) => left.localeCompare(right))) {
    failures.push({
      failureClass: "gate",
      gateKind: "regression",
      code: "ASYNC_GATE_REGRESSION_COVERAGE_LOSS",
      reason: `Previously covered async operation ${operationKey} regressed to uncovered.`,
      hint: "Restore async evidence or regenerate the async baseline intentionally.",
      exitCode: 4,
      severity: regressionSeverity,
      operationKey
    });
  }

  for (const regression of [...input.comparison.dimensionRegressions].sort(compareDimensionRegression)) {
    failures.push({
      failureClass: "gate",
      gateKind: "regression",
      code: "ASYNC_GATE_REGRESSION_DIMENSION",
      reason: `Async coverage dimension ${regression.dimension} regressed from ${regression.baseline.toFixed(2)} to ${regression.current.toFixed(2)}.`,
      hint: "Dimension regressions stay warning-level while async coverage matures.",
      exitCode: 4,
      severity: "warning",
      operationKey: regression.dimension
    });
  }

  return failures;
}

export function evaluateAsyncGateFailures(input: {
  coverage: AsyncCoverageResult;
  policy: GatePolicy;
  comparison?: AsyncRegressionComparison;
}): GovernanceFailure[] {
  const semantic = evaluateAsyncSemanticFailures(input.coverage);
  if (semantic.length > 0) {
    return semantic;
  }

  const threshold = evaluateAsyncThresholdGate({
    coverage: input.coverage,
    policy: input.policy
  });
  const regression =
    input.comparison != null
      ? evaluateAsyncRegressionGate({
          comparison: input.comparison,
          policy: input.policy
        })
      : [];

  return [...regression, ...threshold];
}

function evaluateAsyncSemanticFailures(coverage: AsyncCoverageResult): GovernanceFailure[] {
  return [...coverage.diagnostics].sort(compareAsyncCoverageDiagnostics).map((diagnostic) => toSemanticFailure(diagnostic));
}

function toSemanticFailure(diagnostic: AsyncCoverageDiagnostic): GovernanceFailure {
  switch (diagnostic.kind) {
    case "unsupported-content-type":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_UNSUPPORTED_CONTENT_TYPE",
        reason: `${formatAsyncOperation(diagnostic.operationKey)} cannot validate payload schema ${formatSchemaId(
          diagnostic.schemaId
        )} because ${diagnostic.reason}`,
        hint: "Use JSON-compatible AsyncAPI payload content types or widen validator support intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey: diagnostic.operationKey
      };
    case "unsupported-schema-format":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_UNSUPPORTED_SCHEMA_FORMAT",
        reason: `${formatAsyncOperation(diagnostic.operationKey)} cannot validate payload schema ${formatSchemaId(
          diagnostic.schemaId
        )} because ${diagnostic.reason}`,
        hint: "Use JSON Schema-compatible AsyncAPI payload formats or widen validator support intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey: diagnostic.operationKey
      };
    case "missing-payload":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_MISSING_PAYLOAD",
        reason: `${formatAsyncOperation(diagnostic.operationKey)} is missing payload required by schema ${formatSchemaId(
          diagnostic.schemaId
        )}${formatPointer(diagnostic.pointer)}: ${diagnostic.reason}`,
        hint: "Capture async payloads in evidence or stop declaring a payload schema for this operation intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey: diagnostic.operationKey
      };
    case "invalid-payload":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_INVALID_PAYLOAD",
        reason: `${formatAsyncOperation(diagnostic.operationKey)} failed payload validation against schema ${formatSchemaId(
          diagnostic.schemaId
        )}${formatPointer(diagnostic.pointer)}: ${diagnostic.reason}`,
        hint: "Align emitted async payloads with the retained AsyncAPI schema or update the AsyncAPI contract intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey: diagnostic.operationKey
      };
    case "unverifiable-headers":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS",
        reason: `${formatAsyncOperation(diagnostic.operationKey)} cannot verify header schema ${formatSchemaId(
          diagnostic.schemaId
        )}: ${diagnostic.reason}`,
        hint: "Capture Kafka headers in async evidence before relying on AsyncAPI header-schema conformance.",
        exitCode: 5,
        severity: "error",
        operationKey: diagnostic.operationKey
      };
    case "mismatched": {
      const observed = diagnostic.observedMessage ?? "(unknown)";
      const expected = diagnostic.expectedMessage ?? "(unknown)";
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_MESSAGE_MISMATCH",
        reason: `Observed async evidence ${diagnostic.action} ${diagnostic.channel} reported message ${observed}, expected ${expected}.`,
        hint: "Align the emitted message contract with AsyncAPI or update the AsyncAPI contract intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey: `${diagnostic.action} ${diagnostic.channel}`
      };
    }
    case "unmatched":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_UNMATCHED_EVIDENCE",
        reason: `Observed async evidence ${diagnostic.action} ${diagnostic.channel} did not match any canonical AsyncAPI operation.`,
        hint: "Add the missing AsyncAPI operation or stop emitting unmatched async evidence.",
        exitCode: 5,
        severity: "error",
        operationKey: `${diagnostic.action} ${diagnostic.channel}`
      };
  }
}

function formatAsyncOperation(operationKey: string): string {
  return `Async evidence ${operationKey}`;
}

function formatSchemaId(schemaId: string | undefined): string {
  return schemaId ?? "(unknown-schema)";
}

function formatPointer(pointer: string | undefined): string {
  if (!pointer) {
    return "";
  }

  return ` at ${pointer}`;
}

function computeRawOperationCoverage(coverage: AsyncCoverageResult): number | null {
  const total = coverage.operations.items.length;
  if (total === 0) return null;

  const covered = coverage.operations.items.filter((entry) => entry.operation.state === "COVERED").length;
  return (covered / total) * 100;
}

function compareDimensionRegression(
  left: AsyncRegressionComparison["dimensionRegressions"][number],
  right: AsyncRegressionComparison["dimensionRegressions"][number]
): number {
  if (left.dimension !== right.dimension) return left.dimension.localeCompare(right.dimension);
  if (left.baseline !== right.baseline) return left.baseline - right.baseline;
  return left.current - right.current;
}
