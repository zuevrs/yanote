import type { CoverageDimensionState } from "../coverage/dimensions.js";
import type {
  AsyncCoverageDiagnostic,
  AsyncCoverageResult,
  AsyncCoverageSummary,
  AsyncMessageCoverage,
  AsyncOperationCoverage
} from "../coverage/asyncCoverage.js";
import { normalizeAsyncReport, roundCoverage } from "./asyncNormalize.js";
import { ASYNC_REPORT_PHASE, ASYNC_REPORT_SCHEMA_VERSION, validateAsyncReport } from "./asyncSchema.js";

export { normalizeAsyncReport, roundCoverage, ASYNC_REPORT_PHASE, ASYNC_REPORT_SCHEMA_VERSION, validateAsyncReport };

export type AsyncReportStatus = "ok" | "partial" | "invalid";

export type AsyncYanoteReport = {
  schemaVersion: string;
  generatedAt: string;
  toolVersion: string;
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
          state: "COVERED" | "UNCOVERED" | "N/A";
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
  diagnostics: {
    counts: {
      unmatched: number;
      mismatched: number;
    };
    items: AsyncCoverageDiagnostic[];
  };
};

export function buildAsyncReport(
  coverage: AsyncCoverageResult,
  opts: {
    toolVersion: string;
    eventTimestamps?: number[];
  }
): AsyncYanoteReport {
  const diagnostics = [...coverage.diagnostics];
  const counts = countAsyncDiagnostics(diagnostics);

  const report: AsyncYanoteReport = {
    schemaVersion: ASYNC_REPORT_SCHEMA_VERSION,
    generatedAt: resolveGeneratedAt(opts.eventTimestamps),
    toolVersion: opts.toolVersion,
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
          messageContract: entry.messageContract.name
            ? {
                name: entry.messageContract.name,
                state: entry.messageContract.state
              }
            : {
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

export function countAsyncDiagnostics(diagnostics: AsyncCoverageDiagnostic[]): AsyncYanoteReport["diagnostics"]["counts"] {
  let unmatched = 0;
  let mismatched = 0;

  for (const diagnostic of diagnostics) {
    if (diagnostic.kind === "unmatched") unmatched += 1;
    if (diagnostic.kind === "mismatched") mismatched += 1;
  }

  return { unmatched, mismatched };
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

function resolveAsyncReportStatus(
  coverage: AsyncCoverageResult,
  counts: AsyncYanoteReport["diagnostics"]["counts"]
): AsyncReportStatus {
  if (counts.mismatched > 0 || counts.unmatched > 0) {
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

export type AsyncReportOperationItem = AsyncOperationCoverage;
export type AsyncReportMessageItem = AsyncMessageCoverage;
