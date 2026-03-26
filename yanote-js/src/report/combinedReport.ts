import path from "node:path";
import type { SpecSourceProvenance } from "../spec/specSource.js";
import {
  ASYNC_REPORT_PHASE,
  ASYNC_REPORT_SCHEMA_VERSION,
  normalizeAsyncReport,
  type AsyncYanoteReport,
  type AsyncReportStatus,
  validateAsyncReport
} from "./asyncReport.js";
import { normalizeReport } from "./normalize.js";
import type {
  HttpPayloadTargetAggregate,
  HttpRequestTruthAggregate,
  HttpSecurityTruthAggregate,
  ReportStatus,
  YanoteReport
} from "./report.js";
import { REPORT_SCHEMA_VERSION, validateReport } from "./schema.js";
import {
  COMBINED_REPORT_PHASE,
  COMBINED_REPORT_SCHEMA_VERSION,
  validateCombinedReport
} from "./combinedSchema.js";
import { normalizeCombinedReport } from "./combinedNormalize.js";

export {
  COMBINED_REPORT_PHASE,
  COMBINED_REPORT_SCHEMA_VERSION,
  REPORT_SCHEMA_VERSION,
  ASYNC_REPORT_PHASE,
  ASYNC_REPORT_SCHEMA_VERSION,
  validateCombinedReport
};

export type CombinedReportStatus = "ok" | "partial" | "invalid";
export type CombinedReportChildKind = "http" | "async";

export type CombinedChildArtifact = {
  kind: "json" | "html";
  path: string;
};

export type CombinedChildOverview = {
  kind: CombinedReportChildKind;
  status: ReportStatus | AsyncReportStatus;
  provenance: {
    generatedAt: string;
    toolVersion: string;
    specSource: SpecSourceProvenance;
    artifacts: CombinedChildArtifact[];
  };
  issues: string[];
};

export type CombinedHttpChild = CombinedChildOverview & {
  kind: "http";
  status: ReportStatus;
  summary: {
    totalOperations: number;
    coveredOperations: number;
    operationCoveragePercent: number;
    aggregateCoveragePercent: number | null;
    aggregateExplanation?: string;
    deprecatedOperations: {
      totalOperations: number;
      coveredOperations: number;
      uncoveredOperations: number;
      operationCoveragePercent: number;
    };
    payloadConformance: {
      request: HttpPayloadTargetAggregate;
      response: HttpPayloadTargetAggregate;
      diagnostics: {
        covered: number;
        uncovered: number;
        skipped: number;
      };
    };
    requestConformance: {
      observedOperations: number;
      observedParameters: number;
      counts: HttpRequestTruthAggregate;
    };
    securityConformance: {
      declaredOperations: number;
      observedOperations: number;
      observedEvaluations: number;
      counts: HttpSecurityTruthAggregate;
    };
    semanticDiagnostics: YanoteReport["diagnostics"]["counts"];
    governanceDiagnostics: {
      errors: number;
      warnings: number;
    };
  };
};

export type CombinedAsyncChild = CombinedChildOverview & {
  kind: "async";
  status: AsyncReportStatus;
  summary: {
    protocols: AsyncYanoteReport["protocols"];
    totalChannels: number;
    coveredChannels: number;
    channelCoveragePercent: number | null;
    totalOperations: number;
    coveredOperations: number;
    operationCoveragePercent: number | null;
    totalMessages: number;
    coveredMessages: number;
    messageCoveragePercent: number | null;
    bindingSupport: AsyncYanoteReport["bindingSupport"]["summary"];
    declaredSemantics: AsyncYanoteReport["declaredSemantics"]["summary"];
    runtimeSemantics: AsyncYanoteReport["runtimeSemantics"]["summary"];
    diagnostics: AsyncYanoteReport["diagnostics"]["counts"];
  };
};

export type CombinedYanoteReport = {
  schemaVersion: string;
  generatedAt: string;
  toolVersion: string;
  phase: {
    id: string;
    slug: string;
  };
  status: CombinedReportStatus;
  overview: {
    totalChildren: number;
    okChildren: number;
    partialChildren: number;
    invalidChildren: number;
    childStatuses: {
      http: ReportStatus;
      async: AsyncReportStatus;
    };
  };
  children: {
    http: CombinedHttpChild;
    async: CombinedAsyncChild;
  };
};

export function buildCombinedReport(input: {
  toolVersion: string;
  http: {
    report: unknown;
    reportPath: string;
    htmlPath?: string;
  };
  async: {
    report: unknown;
    reportPath: string;
    htmlPath?: string;
  };
}): CombinedYanoteReport {
  assertNonEmptyString(input.toolVersion, "combined toolVersion");

  const httpReport = normalizeHttpChild(input.http.report);
  const asyncReport = normalizeAsyncChild(input.async.report);
  const httpStatus = assertKnownHttpStatus(httpReport.status);
  const asyncStatus = assertKnownAsyncStatus(asyncReport.status);

  const report: CombinedYanoteReport = {
    schemaVersion: COMBINED_REPORT_SCHEMA_VERSION,
    generatedAt: resolveCombinedGeneratedAt([httpReport.generatedAt, asyncReport.generatedAt]),
    toolVersion: input.toolVersion,
    phase: COMBINED_REPORT_PHASE,
    status: resolveCombinedReportStatus(httpStatus, asyncStatus),
    overview: buildCombinedOverview(httpStatus, asyncStatus),
    children: {
      http: {
        kind: "http",
        status: httpStatus,
        provenance: {
          generatedAt: httpReport.generatedAt,
          toolVersion: httpReport.toolVersion,
          specSource: {
            kind: httpReport.specSource.kind,
            reference: httpReport.specSource.reference
          },
          artifacts: buildArtifactReferences(input.http.reportPath, input.http.htmlPath, "yanote-report.html")
        },
        issues: collectHttpIssues(httpReport),
        summary: {
          totalOperations: httpReport.summary.totalOperations,
          coveredOperations: httpReport.summary.coveredOperations,
          operationCoveragePercent: httpReport.summary.operationCoveragePercent,
          aggregateCoveragePercent: httpReport.summary.aggregateCoveragePercent,
          ...(httpReport.summary.aggregateExplanation ? { aggregateExplanation: httpReport.summary.aggregateExplanation } : {}),
          deprecatedOperations: {
            totalOperations: httpReport.summary.deprecatedOperations.totalOperations,
            coveredOperations: httpReport.summary.deprecatedOperations.coveredOperations,
            uncoveredOperations: httpReport.summary.deprecatedOperations.uncoveredOperations,
            operationCoveragePercent: httpReport.summary.deprecatedOperations.operationCoveragePercent
          },
          payloadConformance: {
            request: { ...httpReport.httpPayloadConformance.summary.request },
            response: { ...httpReport.httpPayloadConformance.summary.response },
            diagnostics: { ...httpReport.httpPayloadConformance.diagnostics.counts }
          },
          requestConformance: {
            observedOperations: httpReport.httpRequestConformance.summary.observedOperations,
            observedParameters: httpReport.httpRequestConformance.summary.observedParameters,
            counts: { ...httpReport.httpRequestConformance.summary.counts }
          },
          securityConformance: {
            declaredOperations: httpReport.httpSecurityConformance.summary.declaredOperations,
            observedOperations: httpReport.httpSecurityConformance.summary.observedOperations,
            observedEvaluations: httpReport.httpSecurityConformance.summary.observedEvaluations,
            counts: { ...httpReport.httpSecurityConformance.summary.counts }
          },
          semanticDiagnostics: { ...httpReport.diagnostics.counts },
          governanceDiagnostics: summarizeGovernanceDiagnostics(httpReport)
        }
      },
      async: {
        kind: "async",
        status: asyncStatus,
        provenance: {
          generatedAt: asyncReport.generatedAt,
          toolVersion: asyncReport.toolVersion,
          specSource: {
            kind: asyncReport.specSource.kind,
            reference: asyncReport.specSource.reference
          },
          artifacts: buildArtifactReferences(input.async.reportPath, input.async.htmlPath, "yanote-async-report.html")
        },
        issues: collectAsyncIssues(asyncReport),
        summary: {
          protocols: [...asyncReport.protocols],
          totalChannels: asyncReport.summary.totalChannels,
          coveredChannels: asyncReport.summary.coveredChannels,
          channelCoveragePercent: asyncReport.summary.channelCoveragePercent,
          totalOperations: asyncReport.summary.totalOperations,
          coveredOperations: asyncReport.summary.coveredOperations,
          operationCoveragePercent: asyncReport.summary.operationCoveragePercent,
          totalMessages: asyncReport.summary.totalMessages,
          coveredMessages: asyncReport.summary.coveredMessages,
          messageCoveragePercent: asyncReport.summary.messageCoveragePercent,
          bindingSupport: { ...asyncReport.bindingSupport.summary },
          declaredSemantics: { ...asyncReport.declaredSemantics.summary },
          runtimeSemantics: { ...asyncReport.runtimeSemantics.summary },
          diagnostics: { ...asyncReport.diagnostics.counts }
        }
      }
    }
  };

  const normalized = normalizeCombinedReport(report);
  const validation = validateCombinedReport(normalized);
  if (!validation.ok) {
    throw new Error(`Invalid combined report schema: ${validation.errors.join("; ")}`);
  }

  return normalized;
}

export function resolveCombinedReportStatus(httpStatus: ReportStatus, asyncStatus: AsyncReportStatus): CombinedReportStatus {
  if (httpStatus === "invalid" || asyncStatus === "invalid") {
    return "invalid";
  }

  if (httpStatus === "partial" || asyncStatus === "partial") {
    return "partial";
  }

  return "ok";
}

function buildCombinedOverview(httpStatus: ReportStatus, asyncStatus: AsyncReportStatus): CombinedYanoteReport["overview"] {
  const statuses: CombinedReportStatus[] = [httpStatus, asyncStatus];

  return {
    totalChildren: statuses.length,
    okChildren: statuses.filter((status) => status === "ok").length,
    partialChildren: statuses.filter((status) => status === "partial").length,
    invalidChildren: statuses.filter((status) => status === "invalid").length,
    childStatuses: {
      http: httpStatus,
      async: asyncStatus
    }
  };
}

function normalizeHttpChild(report: unknown): YanoteReport {
  const validation = validateReport(report);
  if (!validation.ok) {
    throw new Error(`Invalid http child report schema: ${validation.errors.join("; ")}`);
  }

  return normalizeReport(report as YanoteReport);
}

function normalizeAsyncChild(report: unknown): AsyncYanoteReport {
  const validation = validateAsyncReport(report);
  if (!validation.ok) {
    throw new Error(`Invalid async child report schema: ${validation.errors.join("; ")}`);
  }

  return normalizeAsyncReport(report as AsyncYanoteReport);
}

function buildArtifactReferences(reportPath: string, htmlPath: string | undefined, defaultHtmlFileName: string): CombinedChildArtifact[] {
  assertNonEmptyString(reportPath, "child reportPath");
  const resolvedHtmlPath = htmlPath ?? deriveSiblingHtmlPath(reportPath, defaultHtmlFileName);
  assertNonEmptyString(resolvedHtmlPath, "child htmlPath");

  return [
    { kind: "json", path: reportPath },
    { kind: "html", path: resolvedHtmlPath }
  ];
}

function deriveSiblingHtmlPath(reportPath: string, fallbackFileName: string): string {
  if (reportPath.endsWith(".json")) {
    return `${reportPath.slice(0, -5)}.html`;
  }

  return path.join(path.dirname(reportPath), fallbackFileName);
}

function summarizeGovernanceDiagnostics(report: YanoteReport): CombinedHttpChild["summary"]["governanceDiagnostics"] {
  return {
    errors: report.governance.diagnostics.filter((item) => item.severity === "error").length,
    warnings: report.governance.diagnostics.filter((item) => item.severity === "warning").length
  };
}

function collectHttpIssues(report: YanoteReport): string[] {
  const issues: string[] = [];

  if (report.status !== "ok") {
    issues.push(`status=${report.status}`);
  }

  const semanticDiagnostics = sumCounts(Object.values(report.diagnostics.counts));
  if (semanticDiagnostics > 0) {
    issues.push(`${semanticDiagnostics} semantic diagnostics retained`);
  }

  const payloadDiagnostics = report.httpPayloadConformance.diagnostics.items.length;
  if (payloadDiagnostics > 0) {
    issues.push(`${payloadDiagnostics} payload diagnostics retained`);
  }

  const requestDiagnostics = report.httpRequestConformance.diagnostics.items.length;
  if (requestDiagnostics > 0) {
    issues.push(`${requestDiagnostics} request diagnostics retained`);
  }

  const securityDiagnostics = report.httpSecurityConformance.diagnostics.items.length;
  if (securityDiagnostics > 0) {
    issues.push(`${securityDiagnostics} security diagnostics retained`);
  }

  const governanceErrors = report.governance.diagnostics.filter((item) => item.severity === "error").length;
  if (governanceErrors > 0) {
    issues.push(`${governanceErrors} governance errors retained`);
  }

  const governanceWarnings = report.governance.diagnostics.filter((item) => item.severity === "warning").length;
  if (governanceWarnings > 0) {
    issues.push(`${governanceWarnings} governance warnings retained`);
  }

  return issues;
}

function collectAsyncIssues(report: AsyncYanoteReport): string[] {
  const issues: string[] = [];

  if (report.status !== "ok") {
    issues.push(`status=${report.status}`);
  }

  const asyncDiagnostics = sumCounts(Object.values(report.diagnostics.counts));
  if (asyncDiagnostics > 0) {
    issues.push(`${asyncDiagnostics} async diagnostics retained`);
  }

  const runtimeDiagnostics = report.runtimeSemantics.diagnostics.items.length;
  if (runtimeDiagnostics > 0) {
    issues.push(`${runtimeDiagnostics} runtime semantic diagnostics retained`);
  }

  if (report.bindingSupport.summary.invalidBindings > 0) {
    issues.push(`${report.bindingSupport.summary.invalidBindings} invalid kafka binding declarations retained`);
  }

  return issues;
}

function resolveCombinedGeneratedAt(values: string[]): string {
  const timestamps = values
    .map((value) => Date.parse(value))
    .filter((value): value is number => Number.isFinite(value));

  if (timestamps.length === 0) {
    return "1970-01-01T00:00:00.000Z";
  }

  return new Date(Math.min(...timestamps)).toISOString();
}

function assertKnownHttpStatus(value: string): ReportStatus {
  switch (value) {
    case "ok":
    case "partial":
    case "invalid":
      return value;
    default:
      throw new Error(`Unknown http child status: ${String(value)}`);
  }
}

function assertKnownAsyncStatus(value: string): AsyncReportStatus {
  switch (value) {
    case "ok":
    case "partial":
    case "invalid":
      return value;
    default:
      throw new Error(`Unknown async child status: ${String(value)}`);
  }
}

function assertNonEmptyString(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`Missing ${label}`);
  }
}

function sumCounts(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
