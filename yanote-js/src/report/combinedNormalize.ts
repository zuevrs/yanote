import type { CombinedYanoteReport } from "./combinedReport.js";

const DECIMALS = 2;
const MULTIPLIER = 10 ** DECIMALS;

export function roundCoverage(value: number): number {
  return Math.round(value * MULTIPLIER) / MULTIPLIER;
}

export function normalizeCombinedReport(report: CombinedYanoteReport): CombinedYanoteReport {
  return {
    ...report,
    phase: {
      id: report.phase.id,
      slug: report.phase.slug
    },
    overview: {
      totalChildren: report.overview.totalChildren,
      okChildren: report.overview.okChildren,
      partialChildren: report.overview.partialChildren,
      invalidChildren: report.overview.invalidChildren,
      childStatuses: {
        http: report.overview.childStatuses.http,
        async: report.overview.childStatuses.async
      }
    },
    children: {
      http: {
        ...report.children.http,
        provenance: normalizeChildProvenance(report.children.http.provenance),
        issues: [...report.children.http.issues].sort((left, right) => left.localeCompare(right)),
        summary: {
          ...report.children.http.summary,
          operationCoveragePercent: roundCoverage(report.children.http.summary.operationCoveragePercent),
          aggregateCoveragePercent: normalizeNullablePercent(report.children.http.summary.aggregateCoveragePercent),
          deprecatedOperations: {
            ...report.children.http.summary.deprecatedOperations,
            operationCoveragePercent: roundCoverage(report.children.http.summary.deprecatedOperations.operationCoveragePercent)
          },
          payloadConformance: {
            request: { ...report.children.http.summary.payloadConformance.request },
            response: { ...report.children.http.summary.payloadConformance.response },
            diagnostics: { ...report.children.http.summary.payloadConformance.diagnostics }
          },
          requestConformance: {
            observedOperations: report.children.http.summary.requestConformance.observedOperations,
            observedParameters: report.children.http.summary.requestConformance.observedParameters,
            counts: { ...report.children.http.summary.requestConformance.counts }
          },
          securityConformance: {
            declaredOperations: report.children.http.summary.securityConformance.declaredOperations,
            observedOperations: report.children.http.summary.securityConformance.observedOperations,
            observedEvaluations: report.children.http.summary.securityConformance.observedEvaluations,
            counts: { ...report.children.http.summary.securityConformance.counts }
          },
          semanticDiagnostics: { ...report.children.http.summary.semanticDiagnostics },
          governanceDiagnostics: { ...report.children.http.summary.governanceDiagnostics }
        }
      },
      async: {
        ...report.children.async,
        provenance: normalizeChildProvenance(report.children.async.provenance),
        issues: [...report.children.async.issues].sort((left, right) => left.localeCompare(right)),
        summary: {
          protocols: [...report.children.async.summary.protocols].sort((left, right) => left.localeCompare(right)),
          totalChannels: report.children.async.summary.totalChannels,
          coveredChannels: report.children.async.summary.coveredChannels,
          channelCoveragePercent: normalizeNullablePercent(report.children.async.summary.channelCoveragePercent),
          totalOperations: report.children.async.summary.totalOperations,
          coveredOperations: report.children.async.summary.coveredOperations,
          operationCoveragePercent: normalizeNullablePercent(report.children.async.summary.operationCoveragePercent),
          totalMessages: report.children.async.summary.totalMessages,
          coveredMessages: report.children.async.summary.coveredMessages,
          messageCoveragePercent: normalizeNullablePercent(report.children.async.summary.messageCoveragePercent),
          bindingSupport: { ...report.children.async.summary.bindingSupport },
          declaredSemantics: { ...report.children.async.summary.declaredSemantics },
          runtimeSemantics: {
            ...report.children.async.summary.runtimeSemantics,
            semanticCoveragePercent: normalizeNullablePercent(report.children.async.summary.runtimeSemantics.semanticCoveragePercent)
          },
          diagnostics: { ...report.children.async.summary.diagnostics }
        }
      }
    }
  };
}

function normalizeChildProvenance(
  provenance: CombinedYanoteReport["children"]["http"]["provenance"]
): CombinedYanoteReport["children"]["http"]["provenance"] {
  return {
    generatedAt: provenance.generatedAt,
    toolVersion: provenance.toolVersion,
    specSource: {
      kind: provenance.specSource.kind,
      reference: provenance.specSource.reference
    },
    artifacts: [...provenance.artifacts].sort(compareArtifacts)
  };
}

function compareArtifacts(
  left: CombinedYanoteReport["children"]["http"]["provenance"]["artifacts"][number],
  right: CombinedYanoteReport["children"]["http"]["provenance"]["artifacts"][number]
): number {
  if (left.kind !== right.kind) {
    return artifactKindRank(left.kind) - artifactKindRank(right.kind);
  }

  return left.path.localeCompare(right.path);
}

function artifactKindRank(value: "json" | "html"): number {
  switch (value) {
    case "json":
      return 0;
    case "html":
      return 1;
  }
}

function normalizeNullablePercent(value: number | null): number | null {
  return typeof value === "number" ? roundCoverage(value) : value;
}
