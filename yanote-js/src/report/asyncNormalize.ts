import type { AsyncAction } from "../coverage/asyncCoverage.js";
import { compareAsyncCoverageDiagnostics } from "../coverage/asyncCoverage.js";
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
            messageContract: {
              ...entry.messageContract,
              ...(entry.messageContract.declaredMessages
                ? { declaredMessages: [...entry.messageContract.declaredMessages].sort((left, right) => left.localeCompare(right)) }
                : {}),
              ...(entry.messageContract.selectedMessages
                ? { selectedMessages: [...entry.messageContract.selectedMessages].sort((left, right) => left.localeCompare(right)) }
                : {})
            },
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
        "unsupported-content-type": report.diagnostics.counts["unsupported-content-type"],
        "unsupported-schema-format": report.diagnostics.counts["unsupported-schema-format"],
        "missing-payload": report.diagnostics.counts["missing-payload"],
        "invalid-payload": report.diagnostics.counts["invalid-payload"],
        "missing-header": report.diagnostics.counts["missing-header"],
        "unavailable-header": report.diagnostics.counts["unavailable-header"],
        "invalid-header": report.diagnostics.counts["invalid-header"],
        "unverifiable-headers": report.diagnostics.counts["unverifiable-headers"],
        ambiguous: report.diagnostics.counts.ambiguous,
        mismatched: report.diagnostics.counts.mismatched,
        unmatched: report.diagnostics.counts.unmatched
      },
      items: [...report.diagnostics.items].sort(compareAsyncCoverageDiagnostics)
    }
  };
}

function normalizeNullablePercent(value: number | null): number | null {
  return typeof value === "number" ? roundCoverage(value) : value;
}

function compareAsyncAction(left: AsyncAction, right: AsyncAction): number {
  return asyncActionRank(left) - asyncActionRank(right);
}

function asyncActionRank(value: AsyncAction): number {
  return value === "send" ? 0 : 1;
}
