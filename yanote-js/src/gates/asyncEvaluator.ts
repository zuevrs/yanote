import {
  compareAsyncCoverageDiagnostics,
  type AsyncCoverageDiagnostic,
  type AsyncCoverageResult
} from "../coverage/asyncCoverage.js";
import {
  compareRuntimeSemanticDiagnostics,
  type AsyncRuntimeSemanticDiagnostic
} from "../coverage/asyncSemanticConformance.js";
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
  const defaultProtocol = resolveAsyncCoverageProtocol(coverage);
  const runtimeFailures = [...coverage.runtimeSemantics.diagnostics]
    .sort(compareRuntimeSemanticDiagnostics)
    .map((diagnostic) => toRuntimeSemanticFailure(diagnostic));
  const coverageFailures = [...coverage.diagnostics]
    .sort(compareAsyncCoverageDiagnostics)
    .map((diagnostic) => toSemanticFailure(diagnostic, defaultProtocol));

  return [...runtimeFailures, ...coverageFailures];
}

function toRuntimeSemanticFailure(diagnostic: AsyncRuntimeSemanticDiagnostic): GovernanceFailure {
  const operationKey = normalizeOperationKey(diagnostic.operationKey);
  const semantic = normalizeRuntimeSemantic(diagnostic.semantic);
  const state = normalizeRuntimeState(diagnostic.state);
  const location = normalizeOptionalText(diagnostic.location);
  const messageName = normalizeOptionalText(diagnostic.messageName);
  const replyChannelAddress = normalizeOptionalText(diagnostic.replyChannelAddress);
  const reason = normalizeOptionalText(diagnostic.reason);

  if (!operationKey || !semantic || !state || !location || !reason) {
    return buildRuntimeSemanticFailClosedFailure(diagnostic, operationKey);
  }

  const context = formatRuntimeSemanticContext({
    operationKey,
    semantic,
    location,
    messageName,
    replyChannelAddress
  });

  switch (`${semantic}:${state}`) {
    case "correlationId:missing":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_CORRELATION_ID_MISSING",
        reason: `${context} is missing retained header-backed runtime proof: ${reason}`,
        hint: "Retain the declared Kafka header needed for AsyncAPI correlationId runtime proof or remove the header-backed declaration intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey
      };
    case "correlationId:unavailable":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_CORRELATION_ID_UNAVAILABLE",
        reason: `${context} could not be proven from retained header evidence: ${reason}`,
        hint: "Adjust Kafka header retention or redaction so AsyncAPI correlationId proof stays available, or stop relying on it intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey
      };
    case "correlationId:unsupported":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_CORRELATION_ID_UNSUPPORTED",
        reason: `${context} is outside the supported runtime-proof subset: ${reason}`,
        hint: "Keep AsyncAPI correlationId declarations within the supported $message.header#/... subset before relying on runtime proof.",
        exitCode: 5,
        severity: "error",
        operationKey
      };
    case "reply.address:missing":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_REPLY_ADDRESS_MISSING",
        reason: `${context} is missing retained header-backed runtime proof: ${reason}`,
        hint: "Retain the declared Kafka reply header needed for AsyncAPI reply.address runtime proof or remove the declaration intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey
      };
    case "reply.address:unavailable":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_REPLY_ADDRESS_UNAVAILABLE",
        reason: `${context} could not be proven from retained header evidence: ${reason}`,
        hint: "Adjust Kafka reply-header retention or redaction so AsyncAPI reply.address proof stays available, or stop relying on it intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey
      };
    case "reply.address:unsupported":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_REPLY_ADDRESS_UNSUPPORTED",
        reason: `${context} is outside the supported runtime-proof subset: ${reason}`,
        hint: "Keep AsyncAPI reply.address declarations within the supported $message.header#/... subset before relying on runtime proof.",
        exitCode: 5,
        severity: "error",
        operationKey
      };
    case "reply.address:mismatched":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_REPLY_ADDRESS_MISMATCH",
        reason: `${context} contradicted retained header evidence: ${reason}`,
        hint: "Emit the declared AsyncAPI reply channel address in retained Kafka header evidence or update the AsyncAPI reply contract intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey
      };
    default:
      return buildRuntimeSemanticFailClosedFailure(diagnostic, operationKey);
  }
}

function buildRuntimeSemanticFailClosedFailure(
  diagnostic: Partial<AsyncRuntimeSemanticDiagnostic>,
  operationKey: string | undefined
): GovernanceFailure {
  const fragments = [
    normalizeOptionalText(diagnostic.semantic),
    normalizeOptionalText(diagnostic.state),
    normalizeOptionalText(diagnostic.location)
  ].filter((value): value is string => value !== undefined);
  const detail = fragments.length > 0 ? ` details=[${fragments.join(", ")}].` : "";

  return {
    failureClass: "semantic",
    code: "ASYNC_SEMANTIC_RUNTIME_FAIL_CLOSED",
    reason: `${formatRuntimeSemanticFallbackPrefix(operationKey)} could not be mapped safely.${detail}`,
    hint: "Inspect async runtime semantic diagnostics and keep malformed or unknown runtime-proof outcomes fail-closed before relying on gate output.",
    exitCode: 5,
    severity: "error",
    ...(operationKey ? { operationKey } : {})
  };
}

function formatRuntimeSemanticContext(input: {
  operationKey: string;
  semantic: "correlationId" | "reply.address";
  location: string;
  messageName?: string;
  replyChannelAddress?: string;
}): string {
  return [
    `Async evidence ${input.operationKey}`,
    input.semantic === "correlationId"
      ? `could not prove declared correlationId${input.messageName ? ` for message ${input.messageName}` : ""}`
      : `could not prove declared reply.address${
          input.replyChannelAddress ? ` expected=${input.replyChannelAddress}` : ""
        }`,
    `at ${input.location}`
  ].join(" ");
}

function formatRuntimeSemanticFallbackPrefix(operationKey: string | undefined): string {
  return operationKey
    ? `Async runtime semantic diagnostic for ${operationKey}`
    : "Async runtime semantic diagnostic";
}

function normalizeRuntimeSemantic(value: AsyncRuntimeSemanticDiagnostic["semantic"] | undefined):
  | "correlationId"
  | "reply.address"
  | undefined {
  return value === "correlationId" || value === "reply.address" ? value : undefined;
}

function normalizeRuntimeState(value: AsyncRuntimeSemanticDiagnostic["state"] | undefined):
  | "missing"
  | "unavailable"
  | "unsupported"
  | "mismatched"
  | undefined {
  switch (value) {
    case "missing":
    case "unavailable":
    case "unsupported":
    case "mismatched":
      return value;
    default:
      return undefined;
  }
}

function normalizeOperationKey(value: string | undefined): string | undefined {
  return normalizeOptionalText(value);
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toSemanticFailure(
  diagnostic: AsyncCoverageDiagnostic,
  defaultProtocol: "kafka" | "amqp" | "jms" | null
): GovernanceFailure {
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
    case "missing-header":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_MISSING_HEADER",
        reason: `${formatAsyncOperation(diagnostic.operationKey)} is missing required header from schema ${formatSchemaId(
          diagnostic.schemaId
        )}${formatPointer(diagnostic.pointer)}: ${diagnostic.reason}`,
        hint: "Retain the required Kafka header in async evidence or stop declaring it required intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey: diagnostic.operationKey
      };
    case "unavailable-header":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_UNAVAILABLE_HEADER",
        reason: `${formatAsyncOperation(diagnostic.operationKey)} could not validate header from schema ${formatSchemaId(
          diagnostic.schemaId
        )}${formatPointer(diagnostic.pointer)}: ${diagnostic.reason}`,
        hint: "Adjust Kafka header redaction/retention policy or stop depending on unavailable header values intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey: diagnostic.operationKey
      };
    case "invalid-header":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_INVALID_HEADER",
        reason: `${formatAsyncOperation(diagnostic.operationKey)} failed header validation against schema ${formatSchemaId(
          diagnostic.schemaId
        )}${formatPointer(diagnostic.pointer)}: ${diagnostic.reason}`,
        hint: "Align emitted Kafka header values with the retained AsyncAPI header schema or update the AsyncAPI contract intentionally.",
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
        hint: "Keep AsyncAPI header contracts within the retained Kafka header-validation scope before relying on them for conformance.",
        exitCode: 5,
        severity: "error",
        operationKey: diagnostic.operationKey
      };
    case "ambiguous":
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_AMBIGUOUS_MESSAGE",
        reason: `${formatAsyncOperation(diagnostic.operationKey)} could not deterministically select one declared message contract: ${diagnostic.reason} candidates=[${diagnostic.candidates.join(", ")}].`,
        hint: "Retain explicit message metadata or discriminating Kafka headers so one AsyncAPI message contract can be chosen safely.",
        exitCode: 5,
        severity: "error",
        operationKey: diagnostic.operationKey
      };
    case "mismatched": {
      const observed = diagnostic.observedMessage ?? "(unknown)";
      const expected = diagnostic.expectedMessage ?? "(unknown)";
      const observedOperation = formatObservedAsyncEvidence(defaultProtocol, diagnostic.action, diagnostic.channel);
      const operationKey = formatObservedAsyncOperationKey(defaultProtocol, diagnostic.action, diagnostic.channel);
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_MESSAGE_MISMATCH",
        reason: `${observedOperation} reported message ${observed}, expected ${expected}.`,
        hint: "Align the emitted message contract with AsyncAPI or update the AsyncAPI contract intentionally.",
        exitCode: 5,
        severity: "error",
        operationKey
      };
    }
    case "unmatched": {
      const observedOperation = formatObservedAsyncEvidence(defaultProtocol, diagnostic.action, diagnostic.channel);
      const operationKey = formatObservedAsyncOperationKey(defaultProtocol, diagnostic.action, diagnostic.channel);
      return {
        failureClass: "semantic",
        code: "ASYNC_SEMANTIC_UNMATCHED_EVIDENCE",
        reason: `${observedOperation} did not match any canonical AsyncAPI operation.`,
        hint: "Add the missing AsyncAPI operation or stop emitting unmatched async evidence.",
        exitCode: 5,
        severity: "error",
        operationKey
      };
    }
  }
}

function resolveAsyncCoverageProtocol(coverage: AsyncCoverageResult): "kafka" | "amqp" | "jms" | null {
  const protocols = new Set<"kafka" | "amqp" | "jms">();

  for (const entry of coverage.operations.items) {
    if (entry.operationKey.startsWith("kafka ")) {
      protocols.add("kafka");
      continue;
    }

    if (entry.operationKey.startsWith("amqp ")) {
      protocols.add("amqp");
      continue;
    }

    if (entry.operationKey.startsWith("jms ")) {
      protocols.add("jms");
    }
  }

  if (protocols.size !== 1) {
    return null;
  }

  return Array.from(protocols)[0] ?? null;
}

function formatObservedAsyncEvidence(
  protocol: "kafka" | "amqp" | "jms" | null,
  action: string,
  channel: string
): string {
  return protocol ? `Observed async evidence ${protocol} ${action} ${channel}` : `Observed async evidence ${action} ${channel}`;
}

function formatObservedAsyncOperationKey(
  protocol: "kafka" | "amqp" | "jms" | null,
  action: string,
  channel: string
): string {
  return protocol ? `${protocol} ${action} ${channel}` : `${action} ${channel}`;
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
