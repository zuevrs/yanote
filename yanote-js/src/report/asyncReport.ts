import type { CoverageDimensionState } from "../coverage/dimensions.js";
import type { SpecSourceProvenance } from "../spec/specSource.js";
import type {
  AsyncCoverageDiagnostic,
  AsyncCoverageDiagnosticKind,
  AsyncCoverageResult,
  AsyncCoverageSummary,
  AsyncMessageCoverage,
  AsyncOperationCoverage
} from "../coverage/asyncCoverage.js";
import type {
  AsyncRuntimeSemanticDiagnostic,
  AsyncRuntimeSemanticFailureState
} from "../coverage/asyncSemanticConformance.js";
import type { KafkaOperationContract } from "../model/operationKey.js";
import { normalizeAsyncReport, roundCoverage } from "./asyncNormalize.js";
import { ASYNC_REPORT_PHASE, ASYNC_REPORT_SCHEMA_VERSION, validateAsyncReport } from "./asyncSchema.js";

export { normalizeAsyncReport, roundCoverage, ASYNC_REPORT_PHASE, ASYNC_REPORT_SCHEMA_VERSION, validateAsyncReport };

export type AsyncReportStatus = "ok" | "partial" | "invalid";

export type AsyncDiagnosticCounts = Record<AsyncCoverageDiagnosticKind, number>;

export type AsyncDeclaredSemanticsReport = {
  summary: {
    totalOperations: number;
    operationsWithCorrelationId: number;
    messageCorrelationIds: number;
    operationsWithReply: number;
  };
  operations: Array<{
    operationKey: string;
    channel: string;
    action: "send" | "receive";
    correlationIds: Array<{
      message: string;
      location: string;
    }>;
    reply?: {
      address: {
        location: string;
      };
    };
  }>;
};

export type AsyncRuntimeSemanticDiagnosticCounts = Record<AsyncRuntimeSemanticFailureState, number>;

export type AsyncRuntimeSemanticsReport = {
  summary: {
    totalOperations: number;
    satisfiedOperations: number;
    unsatisfiedOperations: number;
    totalSemantics: number;
    satisfiedSemantics: number;
    unsatisfiedSemantics: number;
    semanticCoveragePercent: number | null;
  };
  operations: Array<{
    operationKey: string;
    channel: string;
    action: "send" | "receive";
    state: "SATISFIED" | "PARTIAL" | "UNSATISFIED";
    correlationIds: Array<{
      message: string;
      location: string;
      state: "SATISFIED" | "UNSATISFIED";
      suites: string[];
      header?: string;
      messageName?: string;
    }>;
    reply?: {
      address: {
        location: string;
        state: "SATISFIED" | "UNSATISFIED";
        suites: string[];
        header?: string;
        replyChannelAddress?: string;
      };
    };
  }>;
  diagnostics: {
    counts: AsyncRuntimeSemanticDiagnosticCounts;
    items: AsyncRuntimeSemanticDiagnostic[];
  };
};

export type AsyncBindingSupportReport = {
  summary: {
    totalOperations: number;
    totalBindings: number;
    supportedBindings: number;
    declaredOnlyBindings: number;
    deferredBindings: number;
    invalidBindings: number;
  };
  operations: Array<{
    operationKey: string;
    channel: string;
    action: "send" | "receive";
    bindings: KafkaOperationContract["bindingSupport"] extends Array<infer T> ? T[] : never;
  }>;
};

export type AsyncYanoteReport = {
  schemaVersion: string;
  generatedAt: string;
  toolVersion: string;
  specSource: SpecSourceProvenance;
  phase: {
    id: string;
    slug: string;
  };
  status: AsyncReportStatus;
  summary: {
    totalChannels: number;
    coveredChannels: number;
    channelCoveragePercent: number | null;
    totalOperations: number;
    coveredOperations: number;
    operationCoveragePercent: number | null;
    totalMessages: number;
    coveredMessages: number;
    messageCoveragePercent: number | null;
  };
  coverage: {
    channels: {
      state: CoverageDimensionState;
      percent: number | null;
      items: Array<{
        channel: string;
        state: "COVERED" | "UNCOVERED";
        coveredActions: Array<"send" | "receive">;
        missingActions: Array<"send" | "receive">;
      }>;
    };
    operations: {
      state: CoverageDimensionState;
      percent: number | null;
      items: Array<{
        operationKey: string;
        channel: string;
        action: "send" | "receive";
        operation: {
          state: "COVERED" | "UNCOVERED";
        };
        messageContract: {
          name?: string;
          state: "COVERED" | "PARTIAL" | "UNCOVERED" | "N/A";
          selectionMode?: "single" | "runtime";
          declaredMessages?: string[];
          selectedMessages?: string[];
        };
        suites: string[];
      }>;
    };
    messages: {
      state: CoverageDimensionState;
      percent: number | null;
      items: Array<{
        operationKey: string;
        channel: string;
        action: "send" | "receive";
        message: string;
        state: "COVERED" | "UNCOVERED";
        suites: string[];
      }>;
    };
  };
  bindingSupport: AsyncBindingSupportReport;
  declaredSemantics: AsyncDeclaredSemanticsReport;
  runtimeSemantics: AsyncRuntimeSemanticsReport;
  diagnostics: {
    counts: AsyncDiagnosticCounts;
    items: AsyncCoverageDiagnostic[];
  };
};

export function buildAsyncReport(
  coverage: AsyncCoverageResult,
  opts: {
    toolVersion: string;
    specSource: SpecSourceProvenance;
    eventTimestamps?: number[];
    operationContractsByKey?: ReadonlyMap<string, KafkaOperationContract>;
  }
): AsyncYanoteReport {
  const diagnostics = [...coverage.diagnostics];
  const counts = countAsyncDiagnostics(diagnostics);

  const report: AsyncYanoteReport = {
    schemaVersion: ASYNC_REPORT_SCHEMA_VERSION,
    generatedAt: resolveGeneratedAt(opts.eventTimestamps),
    toolVersion: opts.toolVersion,
    specSource: {
      kind: opts.specSource.kind,
      reference: opts.specSource.reference
    },
    phase: ASYNC_REPORT_PHASE,
    status: resolveAsyncReportStatus(coverage, counts),
    summary: buildAsyncReportSummary(coverage),
    coverage: {
      channels: {
        state: resolveAsyncCoverageState(coverage.channels.summary),
        percent: coverage.channels.summary.percent,
        items: coverage.channels.items.map((entry) => ({
          channel: entry.channel,
          state: entry.state,
          coveredActions: [...entry.coveredActions],
          missingActions: [...entry.missingActions]
        }))
      },
      operations: {
        state: resolveAsyncCoverageState(coverage.operations.summary),
        percent: coverage.operations.summary.percent,
        items: coverage.operations.items.map((entry) => ({
          operationKey: entry.operationKey,
          channel: entry.channel,
          action: entry.action,
          operation: {
            state: entry.operation.state
          },
          messageContract: {
            ...(entry.messageContract.name ? { name: entry.messageContract.name } : {}),
            ...(entry.messageContract.selectionMode ? { selectionMode: entry.messageContract.selectionMode } : {}),
            ...(entry.messageContract.declaredMessages
              ? { declaredMessages: [...entry.messageContract.declaredMessages] }
              : {}),
            ...(entry.messageContract.selectedMessages
              ? { selectedMessages: [...entry.messageContract.selectedMessages] }
              : {}),
            state: entry.messageContract.state
          },
          suites: [...entry.suites]
        }))
      },
      messages: {
        state: resolveAsyncCoverageState(coverage.messages.summary),
        percent: coverage.messages.summary.percent,
        items: coverage.messages.items.map((entry) => ({
          operationKey: entry.operationKey,
          channel: entry.channel,
          action: entry.action,
          message: entry.message,
          state: entry.state,
          suites: [...entry.suites]
        }))
      }
    },
    bindingSupport: buildBindingSupportReport(opts.operationContractsByKey),
    declaredSemantics: buildDeclaredSemanticsReport(opts.operationContractsByKey),
    runtimeSemantics: buildRuntimeSemanticsReport(coverage),
    diagnostics: {
      counts,
      items: diagnostics.map((entry) => ({ ...entry }))
    }
  };

  const validation = validateAsyncReport(report);
  if (!validation.ok) {
    throw new Error(`Invalid async report schema: ${validation.errors.join("; ")}`);
  }

  return report;
}

export function resolveAsyncCoverageState(summary: AsyncCoverageSummary): CoverageDimensionState {
  if (summary.total === 0) return "N/A";
  if (summary.covered === 0) return "UNCOVERED";
  if (summary.covered === summary.total) return "COVERED";
  return "PARTIAL";
}

export function countAsyncDiagnostics(diagnostics: AsyncCoverageDiagnostic[]): AsyncDiagnosticCounts {
  const counts = createEmptyAsyncDiagnosticCounts();

  for (const diagnostic of diagnostics) {
    counts[diagnostic.kind] += 1;
  }

  return counts;
}

export function buildAsyncReportSummary(coverage: AsyncCoverageResult): AsyncYanoteReport["summary"] {
  return {
    totalChannels: coverage.channels.summary.total,
    coveredChannels: coverage.channels.summary.covered,
    channelCoveragePercent: coverage.channels.summary.percent,
    totalOperations: coverage.operations.summary.total,
    coveredOperations: coverage.operations.summary.covered,
    operationCoveragePercent: coverage.operations.summary.percent,
    totalMessages: coverage.messages.summary.total,
    coveredMessages: coverage.messages.summary.covered,
    messageCoveragePercent: coverage.messages.summary.percent
  };
}

export function resolveGeneratedAt(eventTimestamps: number[] | undefined): string {
  const timestamps = (eventTimestamps ?? []).filter((value): value is number => Number.isFinite(value));
  if (timestamps.length === 0) {
    return "1970-01-01T00:00:00.000Z";
  }

  const min = Math.min(...timestamps);
  return new Date(min).toISOString();
}

function buildBindingSupportReport(
  operationContractsByKey: ReadonlyMap<string, KafkaOperationContract> | undefined
): AsyncBindingSupportReport {
  const operations = Array.from(operationContractsByKey?.entries() ?? [])
    .map(([operationKey, contract]) => buildBindingSupportOperation(operationKey, contract))
    .filter((entry): entry is AsyncBindingSupportReport["operations"][number] => entry !== null)
    .sort((left, right) => left.operationKey.localeCompare(right.operationKey));
  const bindings = operations.flatMap((entry) => entry.bindings);

  return {
    summary: {
      totalOperations: operations.length,
      totalBindings: bindings.length,
      supportedBindings: bindings.filter((entry) => entry.status === "supported").length,
      declaredOnlyBindings: bindings.filter((entry) => entry.status === "declared-only").length,
      deferredBindings: bindings.filter((entry) => entry.status === "deferred").length,
      invalidBindings: bindings.filter((entry) => entry.status === "invalid").length
    },
    operations
  };
}

function buildBindingSupportOperation(
  operationKey: string,
  contract: KafkaOperationContract
): AsyncBindingSupportReport["operations"][number] | null {
  const bindings = [...(contract.bindingSupport ?? [])];
  if (bindings.length === 0) {
    return null;
  }

  return {
    operationKey,
    channel: contract.operation.channel,
    action: contract.operation.action,
    bindings
  };
}

function buildDeclaredSemanticsReport(
  operationContractsByKey: ReadonlyMap<string, KafkaOperationContract> | undefined
): AsyncDeclaredSemanticsReport {
  const operations = Array.from(operationContractsByKey?.entries() ?? [])
    .map(([operationKey, contract]) => buildDeclaredSemanticsOperation(operationKey, contract))
    .filter((entry): entry is AsyncDeclaredSemanticsReport["operations"][number] => entry !== null)
    .sort(compareDeclaredSemanticsOperation);

  return {
    summary: {
      totalOperations: operations.length,
      operationsWithCorrelationId: operations.filter((entry) => entry.correlationIds.length > 0).length,
      messageCorrelationIds: operations.reduce((total, entry) => total + entry.correlationIds.length, 0),
      operationsWithReply: operations.filter((entry) => entry.reply !== undefined).length
    },
    operations
  };
}

function buildDeclaredSemanticsOperation(
  operationKey: string,
  contract: KafkaOperationContract
): AsyncDeclaredSemanticsReport["operations"][number] | null {
  const correlationIds = collectDeclaredCorrelationIds(contract);
  const reply = contract.declaredReply
    ? {
        address: {
          location: contract.declaredReply.address.location
        }
      }
    : undefined;

  if (correlationIds.length === 0 && !reply) {
    return null;
  }

  return {
    operationKey,
    channel: contract.operation.channel,
    action: contract.operation.action,
    correlationIds,
    ...(reply ? { reply } : {})
  };
}

function collectDeclaredCorrelationIds(
  contract: KafkaOperationContract
): AsyncDeclaredSemanticsReport["operations"][number]["correlationIds"] {
  const messages = contract.message ? [contract.message] : contract.messages ?? [];
  const unique = new Map<string, AsyncDeclaredSemanticsReport["operations"][number]["correlationIds"][number]>();

  for (const message of messages) {
    const location = message.declaredCorrelationId?.location;
    if (!location) {
      continue;
    }

    unique.set(`${message.name}\u0000${location}`, {
      message: message.name,
      location
    });
  }

  return Array.from(unique.values()).sort(compareDeclaredCorrelationId);
}

function resolveAsyncReportStatus(coverage: AsyncCoverageResult, counts: AsyncDiagnosticCounts): AsyncReportStatus {
  if (hasAsyncDiagnostics(counts) || coverage.runtimeSemantics.diagnostics.length > 0) {
    return "partial";
  }

  if (resolveAsyncCoverageState(coverage.channels.summary) !== "COVERED") {
    return "partial";
  }

  if (resolveAsyncCoverageState(coverage.operations.summary) !== "COVERED") {
    return "partial";
  }

  if (resolveAsyncCoverageState(coverage.messages.summary) !== "COVERED") {
    return "partial";
  }

  return "ok";
}

function hasAsyncDiagnostics(counts: AsyncDiagnosticCounts): boolean {
  return Object.values(counts).some((count) => count > 0);
}

function buildRuntimeSemanticsReport(coverage: AsyncCoverageResult): AsyncRuntimeSemanticsReport {
  const operationsByKey = new Map<string, AsyncRuntimeSemanticsReport["operations"][number]>();

  for (const item of coverage.runtimeSemantics.items) {
    const operation = operationsByKey.get(item.operationKey) ?? {
      operationKey: item.operationKey,
      channel: item.channel,
      action: item.action,
      state: "UNSATISFIED",
      correlationIds: []
    };

    if (item.semantic === "correlationId") {
      operation.correlationIds.push({
        message: item.message ?? item.messageName ?? "(unknown-message)",
        location: item.location,
        state: item.state,
        suites: [...item.suites],
        ...(item.header ? { header: item.header } : {}),
        ...(item.messageName ? { messageName: item.messageName } : {})
      });
    } else {
      operation.reply = {
        address: {
          location: item.location,
          state: item.state,
          suites: [...item.suites],
          ...(item.header ? { header: item.header } : {}),
          ...(item.replyChannelAddress ? { replyChannelAddress: item.replyChannelAddress } : {})
        }
      };
    }

    operationsByKey.set(item.operationKey, operation);
  }

  const operations = [...operationsByKey.values()].map((operation) => ({
    ...operation,
    state: resolveRuntimeSemanticsOperationState(operation)
  }));
  const satisfiedOperations = operations.filter((operation) => operation.state === "SATISFIED").length;
  const totalOperations = operations.length;
  const totalSemantics = coverage.runtimeSemantics.summary.total;
  const satisfiedSemantics = coverage.runtimeSemantics.summary.satisfied;
  const diagnosticCounts = countRuntimeSemanticDiagnostics(coverage.runtimeSemantics.diagnostics);

  return {
    summary: {
      totalOperations,
      satisfiedOperations,
      unsatisfiedOperations: totalOperations - satisfiedOperations,
      totalSemantics,
      satisfiedSemantics,
      unsatisfiedSemantics: totalSemantics - satisfiedSemantics,
      semanticCoveragePercent: coverage.runtimeSemantics.summary.percent
    },
    operations,
    diagnostics: {
      counts: diagnosticCounts,
      items: coverage.runtimeSemantics.diagnostics.map((entry) => ({ ...entry }))
    }
  };
}

function resolveRuntimeSemanticsOperationState(
  operation: Omit<AsyncRuntimeSemanticsReport["operations"][number], "state">
): AsyncRuntimeSemanticsReport["operations"][number]["state"] {
  const semantics = [
    ...operation.correlationIds.map((entry) => entry.state),
    ...(operation.reply ? [operation.reply.address.state] : [])
  ];

  if (semantics.every((state) => state === "SATISFIED")) {
    return "SATISFIED";
  }

  if (semantics.every((state) => state === "UNSATISFIED")) {
    return "UNSATISFIED";
  }

  return "PARTIAL";
}

function countRuntimeSemanticDiagnostics(
  diagnostics: AsyncRuntimeSemanticDiagnostic[]
): AsyncRuntimeSemanticDiagnosticCounts {
  const counts = createEmptyRuntimeSemanticDiagnosticCounts();

  for (const diagnostic of diagnostics) {
    counts[diagnostic.state] += 1;
  }

  return counts;
}

function createEmptyAsyncDiagnosticCounts(): AsyncDiagnosticCounts {
  return {
    "unsupported-content-type": 0,
    "unsupported-schema-format": 0,
    "missing-payload": 0,
    "invalid-payload": 0,
    "missing-header": 0,
    "unavailable-header": 0,
    "invalid-header": 0,
    "unverifiable-headers": 0,
    ambiguous: 0,
    mismatched: 0,
    unmatched: 0
  };
}

function createEmptyRuntimeSemanticDiagnosticCounts(): AsyncRuntimeSemanticDiagnosticCounts {
  return {
    missing: 0,
    unavailable: 0,
    unsupported: 0,
    mismatched: 0
  };
}

function compareDeclaredSemanticsOperation(
  left: AsyncDeclaredSemanticsReport["operations"][number],
  right: AsyncDeclaredSemanticsReport["operations"][number]
): number {
  return left.operationKey.localeCompare(right.operationKey);
}

function compareDeclaredCorrelationId(
  left: AsyncDeclaredSemanticsReport["operations"][number]["correlationIds"][number],
  right: AsyncDeclaredSemanticsReport["operations"][number]["correlationIds"][number]
): number {
  if (left.message !== right.message) {
    return left.message.localeCompare(right.message);
  }

  return left.location.localeCompare(right.location);
}

export type AsyncReportOperationItem = AsyncOperationCoverage;
export type AsyncReportMessageItem = AsyncMessageCoverage;
