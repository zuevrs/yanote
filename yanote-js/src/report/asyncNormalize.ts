import type { AsyncAction } from "../coverage/asyncCoverage.js";
import { compareAsyncCoverageDiagnostics } from "../coverage/asyncCoverage.js";
import { compareRuntimeSemanticDiagnostics } from "../coverage/asyncSemanticConformance.js";
import type { AsyncYanoteReport } from "./asyncReport.js";

const DECIMALS = 2;
const MULTIPLIER = 10 ** DECIMALS;

export function roundCoverage(value: number): number {
  return Math.round(value * MULTIPLIER) / MULTIPLIER;
}

export function normalizeAsyncReport(report: AsyncYanoteReport): AsyncYanoteReport {
  return {
    ...report,
    specSource: {
      kind: report.specSource.kind,
      reference: report.specSource.reference
    },
    protocols: [...report.protocols].sort((left, right) => left.localeCompare(right)),
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
    bindingSupport: {
      summary: {
        totalOperations: report.bindingSupport.summary.totalOperations,
        totalBindings: report.bindingSupport.summary.totalBindings,
        supportedBindings: report.bindingSupport.summary.supportedBindings,
        declaredOnlyBindings: report.bindingSupport.summary.declaredOnlyBindings,
        deferredBindings: report.bindingSupport.summary.deferredBindings,
        invalidBindings: report.bindingSupport.summary.invalidBindings
      },
      operations: [...report.bindingSupport.operations]
        .map((entry) => ({
          ...entry,
          bindings: [...entry.bindings].sort(compareKafkaBindingSupport)
        }))
        .sort((left, right) => left.operationKey.localeCompare(right.operationKey))
    },
    declaredSemantics: {
      summary: {
        totalOperations: report.declaredSemantics.summary.totalOperations,
        operationsWithCorrelationId: report.declaredSemantics.summary.operationsWithCorrelationId,
        messageCorrelationIds: report.declaredSemantics.summary.messageCorrelationIds,
        operationsWithReply: report.declaredSemantics.summary.operationsWithReply
      },
      operations: [...report.declaredSemantics.operations]
        .map((entry) => ({
          ...entry,
          correlationIds: [...entry.correlationIds].sort((left, right) => {
            if (left.message !== right.message) {
              return left.message.localeCompare(right.message);
            }

            return left.location.localeCompare(right.location);
          }),
          ...(entry.reply
            ? {
                reply: {
                  address: {
                    location: entry.reply.address.location
                  }
                }
              }
            : {})
        }))
        .sort((left, right) => left.operationKey.localeCompare(right.operationKey))
    },
    runtimeSemantics: {
      summary: {
        totalOperations: report.runtimeSemantics.summary.totalOperations,
        satisfiedOperations: report.runtimeSemantics.summary.satisfiedOperations,
        unsatisfiedOperations: report.runtimeSemantics.summary.unsatisfiedOperations,
        totalSemantics: report.runtimeSemantics.summary.totalSemantics,
        satisfiedSemantics: report.runtimeSemantics.summary.satisfiedSemantics,
        unsatisfiedSemantics: report.runtimeSemantics.summary.unsatisfiedSemantics,
        semanticCoveragePercent: normalizeNullablePercent(report.runtimeSemantics.summary.semanticCoveragePercent)
      },
      operations: [...report.runtimeSemantics.operations]
        .map((entry) => ({
          ...entry,
          correlationIds: [...entry.correlationIds]
            .map((correlationId) => ({
              ...correlationId,
              suites: [...correlationId.suites].sort((left, right) => left.localeCompare(right))
            }))
            .sort((left, right) => {
              if (left.message !== right.message) {
                return left.message.localeCompare(right.message);
              }

              return left.location.localeCompare(right.location);
            }),
          ...(entry.reply
            ? {
                reply: {
                  address: {
                    ...entry.reply.address,
                    suites: [...entry.reply.address.suites].sort((left, right) => left.localeCompare(right))
                  }
                }
              }
            : {})
        }))
        .sort((left, right) => left.operationKey.localeCompare(right.operationKey)),
      diagnostics: {
        counts: {
          missing: report.runtimeSemantics.diagnostics.counts.missing,
          unavailable: report.runtimeSemantics.diagnostics.counts.unavailable,
          unsupported: report.runtimeSemantics.diagnostics.counts.unsupported,
          mismatched: report.runtimeSemantics.diagnostics.counts.mismatched
        },
        items: [...report.runtimeSemantics.diagnostics.items].sort(compareNormalizedRuntimeSemanticDiagnostics)
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

function compareKafkaBindingSupport(
  left: AsyncYanoteReport["bindingSupport"]["operations"][number]["bindings"][number],
  right: AsyncYanoteReport["bindingSupport"]["operations"][number]["bindings"][number]
): number {
  const scope = kafkaBindingScopeRank(left.scope) - kafkaBindingScopeRank(right.scope);
  if (scope !== 0) {
    return scope;
  }

  const field = kafkaBindingFieldRank(left.field) - kafkaBindingFieldRank(right.field);
  if (field !== 0) {
    return field;
  }

  const messageName = (left.messageName ?? "").localeCompare(right.messageName ?? "");
  if (messageName !== 0) {
    return messageName;
  }

  const status = kafkaBindingStatusRank(left.status) - kafkaBindingStatusRank(right.status);
  if (status !== 0) {
    return status;
  }

  const source = left.source.localeCompare(right.source);
  if (source !== 0) {
    return source;
  }

  const value = (left.value ?? "").localeCompare(right.value ?? "");
  if (value !== 0) {
    return value;
  }

  return (left.reason ?? "").localeCompare(right.reason ?? "");
}

function kafkaBindingScopeRank(value: AsyncYanoteReport["bindingSupport"]["operations"][number]["bindings"][number]["scope"]): number {
  switch (value) {
    case "channel":
      return 0;
    case "operation":
      return 1;
    case "message":
      return 2;
  }
}

function kafkaBindingFieldRank(value: AsyncYanoteReport["bindingSupport"]["operations"][number]["bindings"][number]["field"]): number {
  switch (value) {
    case "topic":
      return 0;
    case "partitions":
      return 1;
    case "replicas":
      return 2;
    case "topicConfiguration":
      return 3;
    case "groupId":
      return 4;
    case "clientId":
      return 5;
    case "key":
      return 6;
    case "schemaIdLocation":
      return 7;
    case "schemaIdPayloadEncoding":
      return 8;
    case "schemaLookupStrategy":
      return 9;
  }
}

function kafkaBindingStatusRank(value: AsyncYanoteReport["bindingSupport"]["operations"][number]["bindings"][number]["status"]): number {
  switch (value) {
    case "supported":
      return 0;
    case "declared-only":
      return 1;
    case "deferred":
      return 2;
    case "invalid":
      return 3;
  }
}

function compareAsyncAction(left: AsyncAction, right: AsyncAction): number {
  return asyncActionRank(left) - asyncActionRank(right);
}

function compareNormalizedRuntimeSemanticDiagnostics(
  left: AsyncYanoteReport["runtimeSemantics"]["diagnostics"]["items"][number],
  right: AsyncYanoteReport["runtimeSemantics"]["diagnostics"]["items"][number]
): number {
  const state = runtimeSemanticFailureStateRank(left.state) - runtimeSemanticFailureStateRank(right.state);
  if (state !== 0) {
    return state;
  }

  return compareRuntimeSemanticDiagnostics(left, right);
}

function runtimeSemanticFailureStateRank(value: AsyncYanoteReport["runtimeSemantics"]["diagnostics"]["items"][number]["state"]): number {
  switch (value) {
    case "missing":
      return 0;
    case "unavailable":
      return 1;
    case "unsupported":
      return 2;
    case "mismatched":
      return 3;
  }
}

function asyncActionRank(value: AsyncAction): number {
  return value === "send" ? 0 : 1;
}
