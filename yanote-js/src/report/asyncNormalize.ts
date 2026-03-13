import type { AsyncAction, AsyncCoverageDiagnostic } from "../coverage/asyncCoverage.js";
import type { AsyncYanoteReport } from "./asyncReport.js";

const DECIMALS = 2;
const MULTIPLIER = 10 ** DECIMALS;

export function roundCoverage(value: number): number {
  return Math.round(value * MULTIPLIER) / MULTIPLIER;
}

export function normalizeAsyncReport(report: AsyncYanoteReport): AsyncYanoteReport {
  return {
    ...report,
    summary: {
      ...report.summary,
      channelCoveragePercent: normalizeNullablePercent(report.summary.channelCoveragePercent),
      operationCoveragePercent: normalizeNullablePercent(report.summary.operationCoveragePercent),
      messageCoveragePercent: normalizeNullablePercent(report.summary.messageCoveragePercent)
    },
    coverage: {
      channels: {
        ...report.coverage.channels,
        percent: normalizeNullablePercent(report.coverage.channels.percent),
        items: [...report.coverage.channels.items]
          .map((entry) => ({
            ...entry,
            coveredActions: [...entry.coveredActions].sort(compareAsyncAction),
            missingActions: [...entry.missingActions].sort(compareAsyncAction)
          }))
          .sort((left, right) => left.channel.localeCompare(right.channel))
      },
      operations: {
        ...report.coverage.operations,
        percent: normalizeNullablePercent(report.coverage.operations.percent),
        items: [...report.coverage.operations.items]
          .map((entry) => ({
            ...entry,
            suites: [...entry.suites].sort((left, right) => left.localeCompare(right))
          }))
          .sort((left, right) => left.operationKey.localeCompare(right.operationKey))
      },
      messages: {
        ...report.coverage.messages,
        percent: normalizeNullablePercent(report.coverage.messages.percent),
        items: [...report.coverage.messages.items]
          .map((entry) => ({
            ...entry,
            suites: [...entry.suites].sort((left, right) => left.localeCompare(right))
          }))
          .sort((left, right) => {
            if (left.operationKey !== right.operationKey) return left.operationKey.localeCompare(right.operationKey);
            return left.message.localeCompare(right.message);
          })
      }
    },
    diagnostics: {
      counts: {
        unmatched: report.diagnostics.counts.unmatched,
        mismatched: report.diagnostics.counts.mismatched
      },
      items: [...report.diagnostics.items].sort(compareDiagnostics)
    }
  };
}

function normalizeNullablePercent(value: number | null): number | null {
  return typeof value === "number" ? roundCoverage(value) : value;
}

function compareDiagnostics(left: AsyncCoverageDiagnostic, right: AsyncCoverageDiagnostic): number {
  const kind = diagnosticKindRank(left.kind) - diagnosticKindRank(right.kind);
  if (kind !== 0) return kind;
  if (left.channel !== right.channel) return left.channel.localeCompare(right.channel);
  const action = compareAsyncAction(left.action, right.action);
  if (action !== 0) return action;
  const leftObserved = left.observedMessage ?? "";
  const rightObserved = right.observedMessage ?? "";
  if (leftObserved !== rightObserved) return leftObserved.localeCompare(rightObserved);
  const leftExpected = left.expectedMessage ?? "";
  const rightExpected = right.expectedMessage ?? "";
  if (leftExpected !== rightExpected) return leftExpected.localeCompare(rightExpected);
  return left.message.localeCompare(right.message);
}

function diagnosticKindRank(kind: AsyncCoverageDiagnostic["kind"]): number {
  return kind === "mismatched" ? 0 : 1;
}

function compareAsyncAction(left: AsyncAction, right: AsyncAction): number {
  return asyncActionRank(left) - asyncActionRank(right);
}

function asyncActionRank(value: AsyncAction): number {
  return value === "send" ? 0 : 1;
}
