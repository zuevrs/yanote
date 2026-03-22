import type {
  HttpPayloadConformanceCode,
  HttpPayloadConformanceDiagnostic,
  HttpPayloadConformanceResult,
  HttpPayloadConformanceState
} from "../coverage/httpPayloadConformance.js";
import type { PayloadCaptureReason, PayloadCaptureState } from "../model/payloadCapture.js";
import type { CoverageDimensionState, DeclaredStatusToken } from "../coverage/dimensions.js";
import type { CoverageResult } from "../coverage/coverage.js";
import type { AppliedExclusionRule, UnmatchedExclusionRuleWarning } from "../gates/exclusions.js";
import type { GovernanceFailure } from "../gates/failureOrder.js";
import { evaluateHttpPayloadSemanticFailures } from "../gates/httpPayloadSemantics.js";
import type { SemanticDiagnostic } from "../spec/diagnostics.js";
import { REPORT_SCHEMA_VERSION } from "./schema.js";

export type ReportStatus = "ok" | "partial" | "invalid";

export type HttpPayloadTargetAggregate = {
  coveredOperations: number;
  partialOperations: number;
  uncoveredOperations: number;
  skippedOperations: number;
  notApplicableOperations: number;
  observedCount: number;
  validCount: number;
  invalidCount: number;
  skippedCount: number;
};

export type YanoteReport = {
  schemaVersion: string;
  generatedAt: string;
  toolVersion: string;
  phase: {
    id: string;
    slug: string;
  };
  status: ReportStatus;
  summary: {
    totalOperations: number;
    coveredOperations: number;
    operationCoveragePercent: number;
    aggregateCoveragePercent: number | null;
    aggregateExplanation?: string;
  };
  coverage: {
    operations: {
      state: CoverageDimensionState;
      percent: number | null;
    };
    status: {
      state: CoverageDimensionState;
      percent: number | null;
    };
    parameters: {
      state: CoverageDimensionState;
      percent: number | null;
    };
    aggregate: {
      state: CoverageDimensionState;
      percent: number | null;
      explanation?: string;
    };
    perOperation: Array<{
      operationKey: string;
      method: string;
      route: string;
      operation: {
        state: "COVERED" | "UNCOVERED";
      };
      status: {
        state: CoverageDimensionState;
        declared: string[];
        covered: string[];
        missing: string[];
      };
      parameters: {
        state: CoverageDimensionState;
        required: {
          total: number;
          covered: number;
          missing: string[];
        };
        optional: {
          total: number;
          covered: number;
          missing: string[];
        };
      };
      suites: string[];
    }>;
  };
  httpPayloadConformance: {
    summary: {
      request: HttpPayloadTargetAggregate;
      response: HttpPayloadTargetAggregate;
    };
    perOperation: Array<{
      operationKey: string;
      method: string;
      route: string;
      request: {
        state: HttpPayloadConformanceState;
        observedCount: number;
        validCount: number;
        invalidCount: number;
        skippedCount: number;
        declaredMediaTypes: string[];
        observedMediaTypes: string[];
      };
      response: {
        state: HttpPayloadConformanceState;
        observedCount: number;
        validCount: number;
        invalidCount: number;
        skippedCount: number;
        declaredMediaTypes: string[];
        observedMediaTypes: string[];
        declaredContent: Array<{
          declaredStatus: DeclaredStatusToken;
          mediaTypes: string[];
        }>;
      };
      suites: string[];
    }>;
    diagnostics: {
      counts: {
        covered: number;
        uncovered: number;
        skipped: number;
      };
      items: Array<{
        operationKey: string;
        method: string;
        route: string;
        target: "request" | "response";
        suite: string;
        state: "COVERED" | "UNCOVERED" | "SKIPPED";
        code: HttpPayloadConformanceCode;
        message: string;
        declaredStatus?: DeclaredStatusToken;
        observedStatus?: number;
        observedMediaType?: string;
        declaredMediaTypes: string[];
        captureState?: PayloadCaptureState;
        captureReason?: PayloadCaptureReason;
        errors?: string[];
      }>;
    };
  };
  diagnostics: {
    counts: {
      invalid: number;
      ambiguous: number;
      unmatched: number;
    };
    items: SemanticDiagnostic[];
  };
  governance: {
    exclusions: {
      appliedRules: Array<{
        id: string;
        pattern: string;
        rationale: string;
        owner: string;
        expiresOn: string;
        allowBroadWildcard: boolean;
        allowCriticalOverride: boolean;
        source: "policy-file" | "cli";
        matchedOperationCount: number;
        matchedOperationKeys: string[];
        usedCriticalOverride: boolean;
      }>;
      unmatchedRules: Array<{
        id: string;
        pattern: string;
        rationale: string;
        owner: string;
        expiresOn: string;
        source: "policy-file" | "cli";
        message: string;
      }>;
    };
    diagnostics: Array<{
      severity: "error" | "warning";
      class: "input" | "semantic" | "gate" | "runtime";
      code: string;
      message: string;
      operationKey?: string;
    }>;
  };
};

export function buildReport(
  coverage: CoverageResult,
  opts: {
    toolVersion: string;
    eventTimestamps?: number[];
    payloadConformance?: HttpPayloadConformanceResult;
    governance?: {
      exclusions?: {
        appliedRules: AppliedExclusionRule[];
        unmatchedRules: UnmatchedExclusionRuleWarning[];
      };
      diagnostics?: GovernanceFailure[];
    };
  }
): YanoteReport {
  const diagnostics = sortDiagnostics(coverage.diagnostics);
  const counts = countDiagnostics(diagnostics);
  const payloadSemanticDiagnostics = evaluateHttpPayloadSemanticFailures(opts.payloadConformance?.diagnostics ?? []);
  const governanceDiagnostics = mergeGovernanceDiagnostics(payloadSemanticDiagnostics, opts.governance?.diagnostics ?? []);
  const status = resolveReportStatus(coverage, counts, payloadSemanticDiagnostics.length > 0);

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt: resolveGeneratedAt(opts.eventTimestamps),
    toolVersion: opts.toolVersion,
    phase: {
      id: "02",
      slug: "coverage-metrics-and-cli-reporting"
    },
    status,
    summary: {
      totalOperations: coverage.allOperations.length,
      coveredOperations: coverage.coveredOperations.length,
      operationCoveragePercent: coverage.dimensions.operations.percent ?? 0,
      aggregateCoveragePercent: coverage.dimensions.aggregate.percent,
      aggregateExplanation: coverage.dimensions.aggregate.explanation
    },
    coverage: {
      operations: {
        state: coverage.dimensions.operations.state,
        percent: coverage.dimensions.operations.percent
      },
      status: {
        state: coverage.dimensions.status.state,
        percent: coverage.dimensions.status.percent
      },
      parameters: {
        state: coverage.dimensions.parameters.state,
        percent: coverage.dimensions.parameters.percent
      },
      aggregate: {
        state: coverage.dimensions.aggregate.state,
        percent: coverage.dimensions.aggregate.percent,
        explanation: coverage.dimensions.aggregate.explanation
      },
      perOperation: coverage.perOperation.map((entry) => ({
        operationKey: entry.operationKey,
        method: entry.method,
        route: entry.route,
        operation: {
          state: entry.operation.state
        },
        status: {
          state: entry.status.state,
          declared: [...entry.status.declaredStatuses],
          covered: [...entry.status.coveredStatuses],
          missing: [...entry.status.missingStatuses]
        },
        parameters: {
          state: entry.parameters.state,
          required: {
            total: entry.parameters.required.total,
            covered: entry.parameters.required.covered,
            missing: entry.parameters.required.missing.map((parameter) => `${parameter.in}:${parameter.name}`)
          },
          optional: {
            total: entry.parameters.optional.total,
            covered: entry.parameters.optional.covered,
            missing: entry.parameters.optional.missing.map((parameter) => `${parameter.in}:${parameter.name}`)
          }
        },
        suites: [...entry.suites]
      }))
    },
    httpPayloadConformance: buildHttpPayloadConformanceSection(coverage, opts.payloadConformance),
    diagnostics: {
      counts,
      items: diagnostics
    },
    governance: {
      exclusions: {
        appliedRules: sortAppliedRules(opts.governance?.exclusions?.appliedRules ?? []),
        unmatchedRules: sortUnmatchedRules(opts.governance?.exclusions?.unmatchedRules ?? [])
      },
      diagnostics: sortGovernanceDiagnostics(governanceDiagnostics)
    }
  };
}

function resolveGeneratedAt(eventTimestamps: number[] | undefined): string {
  const timestamps = (eventTimestamps ?? []).filter((value): value is number => Number.isFinite(value));
  if (timestamps.length === 0) {
    return "1970-01-01T00:00:00.000Z";
  }

  const min = Math.min(...timestamps);
  return new Date(min).toISOString();
}

function buildHttpPayloadConformanceSection(
  coverage: CoverageResult,
  payloadConformance: HttpPayloadConformanceResult | undefined
): YanoteReport["httpPayloadConformance"] {
  const perOperation = sortPayloadPerOperation(
    payloadConformance?.perOperation.map((entry) => ({
      operationKey: entry.operationKey,
      method: entry.method,
      route: entry.route,
      request: {
        state: entry.request.state,
        observedCount: entry.request.observedCount,
        validCount: entry.request.validCount,
        invalidCount: entry.request.invalidCount,
        skippedCount: entry.request.skippedCount,
        declaredMediaTypes: [...entry.request.declaredMediaTypes],
        observedMediaTypes: [...entry.request.observedMediaTypes]
      },
      response: {
        state: entry.response.state,
        observedCount: entry.response.observedCount,
        validCount: entry.response.validCount,
        invalidCount: entry.response.invalidCount,
        skippedCount: entry.response.skippedCount,
        declaredMediaTypes: [...entry.response.declaredMediaTypes],
        observedMediaTypes: [...entry.response.observedMediaTypes],
        declaredContent: entry.response.declaredContent.map((content) => ({
          declaredStatus: content.declaredStatus,
          mediaTypes: [...content.mediaTypes]
        }))
      },
      suites: [...entry.suites]
    })) ??
      coverage.perOperation.map((entry) => ({
        operationKey: entry.operationKey,
        method: entry.method,
        route: entry.route,
        request: {
          state: "N/A" as const,
          observedCount: 0,
          validCount: 0,
          invalidCount: 0,
          skippedCount: 0,
          declaredMediaTypes: [],
          observedMediaTypes: []
        },
        response: {
          state: "N/A" as const,
          observedCount: 0,
          validCount: 0,
          invalidCount: 0,
          skippedCount: 0,
          declaredMediaTypes: [],
          observedMediaTypes: [],
          declaredContent: []
        },
        suites: [...entry.suites]
      }))
  );

  const diagnostics = sortPayloadDiagnostics(payloadConformance?.diagnostics ?? []);

  return {
    summary: {
      request: summarizePayloadTarget(perOperation.map((entry) => entry.request)),
      response: summarizePayloadTarget(perOperation.map((entry) => entry.response))
    },
    perOperation,
    diagnostics: {
      counts: countPayloadDiagnostics(diagnostics),
      items: diagnostics
    }
  };
}

function summarizePayloadTarget(
  targets: Array<YanoteReport["httpPayloadConformance"]["perOperation"][number]["request"]>
): HttpPayloadTargetAggregate {
  const summary: HttpPayloadTargetAggregate = {
    coveredOperations: 0,
    partialOperations: 0,
    uncoveredOperations: 0,
    skippedOperations: 0,
    notApplicableOperations: 0,
    observedCount: 0,
    validCount: 0,
    invalidCount: 0,
    skippedCount: 0
  };

  for (const target of targets) {
    if (target.state === "COVERED") summary.coveredOperations += 1;
    else if (target.state === "PARTIAL") summary.partialOperations += 1;
    else if (target.state === "UNCOVERED") summary.uncoveredOperations += 1;
    else if (target.state === "SKIPPED") summary.skippedOperations += 1;
    else summary.notApplicableOperations += 1;

    summary.observedCount += target.observedCount;
    summary.validCount += target.validCount;
    summary.invalidCount += target.invalidCount;
    summary.skippedCount += target.skippedCount;
  }

  return summary;
}

function countPayloadDiagnostics(
  diagnostics: HttpPayloadConformanceDiagnostic[]
): YanoteReport["httpPayloadConformance"]["diagnostics"]["counts"] {
  let covered = 0;
  let uncovered = 0;
  let skipped = 0;

  for (const diagnostic of diagnostics) {
    if (diagnostic.state === "COVERED") covered += 1;
    else if (diagnostic.state === "UNCOVERED") uncovered += 1;
    else skipped += 1;
  }

  return { covered, uncovered, skipped };
}

function sortPayloadPerOperation(
  perOperation: YanoteReport["httpPayloadConformance"]["perOperation"]
): YanoteReport["httpPayloadConformance"]["perOperation"] {
  return [...perOperation]
    .map((entry) => ({
      ...entry,
      request: {
        ...entry.request,
        declaredMediaTypes: [...entry.request.declaredMediaTypes].sort((left, right) => left.localeCompare(right)),
        observedMediaTypes: [...entry.request.observedMediaTypes].sort((left, right) => left.localeCompare(right))
      },
      response: {
        ...entry.response,
        declaredMediaTypes: [...entry.response.declaredMediaTypes].sort((left, right) => left.localeCompare(right)),
        observedMediaTypes: [...entry.response.observedMediaTypes].sort((left, right) => left.localeCompare(right)),
        declaredContent: [...entry.response.declaredContent]
          .map((content) => ({
            declaredStatus: content.declaredStatus,
            mediaTypes: [...content.mediaTypes].sort((left, right) => left.localeCompare(right))
          }))
          .sort((left, right) => compareDeclaredStatuses(left.declaredStatus, right.declaredStatus))
      },
      suites: [...entry.suites].sort((left, right) => left.localeCompare(right))
    }))
    .sort((left, right) => left.operationKey.localeCompare(right.operationKey));
}

function sortPayloadDiagnostics(
  diagnostics: HttpPayloadConformanceDiagnostic[]
): YanoteReport["httpPayloadConformance"]["diagnostics"]["items"] {
  return [...diagnostics]
    .map((diagnostic) => ({
      ...diagnostic,
      declaredMediaTypes: [...diagnostic.declaredMediaTypes].sort((left, right) => left.localeCompare(right)),
      errors: diagnostic.errors ? [...diagnostic.errors].sort((left, right) => left.localeCompare(right)) : undefined
    }))
    .sort(comparePayloadDiagnostics);
}

function comparePayloadDiagnostics(left: HttpPayloadConformanceDiagnostic, right: HttpPayloadConformanceDiagnostic): number {
  if (left.operationKey !== right.operationKey) return left.operationKey.localeCompare(right.operationKey);
  if (left.target !== right.target) return left.target.localeCompare(right.target);

  const leftStatus = `${left.declaredStatus ?? ""}\u0000${left.observedStatus ?? ""}`;
  const rightStatus = `${right.declaredStatus ?? ""}\u0000${right.observedStatus ?? ""}`;
  if (leftStatus !== rightStatus) return leftStatus.localeCompare(rightStatus);

  if (left.code !== right.code) return left.code.localeCompare(right.code);
  if ((left.observedMediaType ?? "") !== (right.observedMediaType ?? "")) {
    return (left.observedMediaType ?? "").localeCompare(right.observedMediaType ?? "");
  }

  return left.suite.localeCompare(right.suite);
}

function compareDeclaredStatuses(left: DeclaredStatusToken, right: DeclaredStatusToken): number {
  return left.localeCompare(right, undefined, { numeric: true });
}

function countDiagnostics(diagnostics: SemanticDiagnostic[]): YanoteReport["diagnostics"]["counts"] {
  let invalid = 0;
  let ambiguous = 0;
  let unmatched = 0;

  for (const diagnostic of diagnostics) {
    if (diagnostic.kind === "invalid") invalid += 1;
    else if (diagnostic.kind === "ambiguous") ambiguous += 1;
    else if (diagnostic.kind === "unmatched") unmatched += 1;
  }

  return { invalid, ambiguous, unmatched };
}

function mergeGovernanceDiagnostics(
  payloadSemanticDiagnostics: GovernanceFailure[],
  governanceDiagnostics: GovernanceFailure[]
): GovernanceFailure[] {
  const deduped = new Map<string, GovernanceFailure>();

  for (const diagnostic of [...payloadSemanticDiagnostics, ...governanceDiagnostics]) {
    const key = [
      diagnostic.failureClass,
      diagnostic.code,
      diagnostic.severity,
      diagnostic.reason,
      diagnostic.hint,
      String(diagnostic.exitCode),
      diagnostic.gateKind ?? "",
      diagnostic.operationKey ?? ""
    ].join("\u0000");

    if (!deduped.has(key)) {
      deduped.set(key, diagnostic);
    }
  }

  return [...deduped.values()];
}

function resolveReportStatus(
  coverage: CoverageResult,
  counts: YanoteReport["diagnostics"]["counts"],
  hasPayloadSemanticFailure: boolean
): ReportStatus {
  if (counts.invalid > 0 || counts.ambiguous > 0) return "invalid";
  if (hasPayloadSemanticFailure) return "partial";
  if (coverage.uncoveredOperations.length > 0) return "partial";
  if (coverage.dimensions.aggregate.state !== "COVERED") return "partial";
  if (counts.unmatched > 0) return "partial";
  return "ok";
}

function sortDiagnostics(diagnostics: SemanticDiagnostic[]): SemanticDiagnostic[] {
  return [...diagnostics]
    .map((diagnostic) => ({
      ...diagnostic,
      candidates: diagnostic.candidates ? [...diagnostic.candidates].sort((left, right) => left.localeCompare(right)) : diagnostic.candidates
    }))
    .sort((left, right) => {
      const severity = severityRank(left.kind) - severityRank(right.kind);
      if (severity !== 0) return severity;

      const leftKey = `${left.method ?? ""} ${left.route ?? ""}`.trim();
      const rightKey = `${right.method ?? ""} ${right.route ?? ""}`.trim();
      if (leftKey !== rightKey) return leftKey.localeCompare(rightKey);

      const leftAsync = asyncDiagnosticSortKey(left);
      const rightAsync = asyncDiagnosticSortKey(right);
      if (leftAsync !== rightAsync) return leftAsync.localeCompare(rightAsync);

      const leftCandidates = left.candidates ? left.candidates.join("|") : "";
      const rightCandidates = right.candidates ? right.candidates.join("|") : "";
      if (leftCandidates !== rightCandidates) return leftCandidates.localeCompare(rightCandidates);

      return left.message.localeCompare(right.message);
    });
}

function asyncDiagnosticSortKey(diagnostic: SemanticDiagnostic): string {
  if (!diagnostic.async) return "";

  return [
    diagnostic.async.runtime ?? "",
    diagnostic.async.asyncapiVersion ?? "",
    diagnostic.async.protocol ?? "",
    diagnostic.async.channel ?? "",
    diagnostic.async.action ?? "",
    diagnostic.async.message ?? ""
  ].join("|");
}

function severityRank(kind: SemanticDiagnostic["kind"]): number {
  if (kind === "invalid") return 0;
  if (kind === "ambiguous") return 1;
  return 2;
}

function sortAppliedRules(appliedRules: AppliedExclusionRule[]): YanoteReport["governance"]["exclusions"]["appliedRules"] {
  return [...appliedRules]
    .map((rule) => ({
      id: rule.id,
      pattern: rule.pattern,
      rationale: rule.rationale,
      owner: rule.owner,
      expiresOn: rule.expiresOn,
      allowBroadWildcard: rule.allowBroadWildcard,
      allowCriticalOverride: rule.allowCriticalOverride,
      source: rule.source,
      matchedOperationCount: rule.matchedOperationCount,
      matchedOperationKeys: [...rule.matchedOperationKeys].sort((left, right) => left.localeCompare(right)),
      usedCriticalOverride: rule.usedCriticalOverride
    }))
    .sort((left, right) => {
      if (left.pattern !== right.pattern) return left.pattern.localeCompare(right.pattern);
      return left.id.localeCompare(right.id);
    });
}

function sortUnmatchedRules(
  unmatchedRules: UnmatchedExclusionRuleWarning[]
): YanoteReport["governance"]["exclusions"]["unmatchedRules"] {
  return [...unmatchedRules]
    .map((rule) => ({
      id: rule.id,
      pattern: rule.pattern,
      rationale: rule.rationale,
      owner: rule.owner,
      expiresOn: rule.expiresOn,
      source: rule.source,
      message: rule.message
    }))
    .sort((left, right) => {
      if (left.pattern !== right.pattern) return left.pattern.localeCompare(right.pattern);
      return left.id.localeCompare(right.id);
    });
}

function sortGovernanceDiagnostics(
  diagnostics: GovernanceFailure[]
): YanoteReport["governance"]["diagnostics"] {
  return [...diagnostics]
    .map((diagnostic) => ({
      severity: diagnostic.severity,
      class: diagnostic.failureClass,
      code: diagnostic.code,
      message: diagnostic.reason,
      operationKey: diagnostic.operationKey
    }))
    .sort((left, right) => {
      const severityDelta = governanceSeverityRank(left.severity) - governanceSeverityRank(right.severity);
      if (severityDelta !== 0) return severityDelta;
      const classDelta = governanceClassRank(left.class) - governanceClassRank(right.class);
      if (classDelta !== 0) return classDelta;
      if (left.code !== right.code) return left.code.localeCompare(right.code);
      return (left.operationKey ?? "").localeCompare(right.operationKey ?? "");
    });
}

function governanceSeverityRank(severity: "error" | "warning"): number {
  return severity === "error" ? 0 : 1;
}

function governanceClassRank(failureClass: "input" | "semantic" | "gate" | "runtime"): number {
  if (failureClass === "input") return 0;
  if (failureClass === "semantic") return 1;
  if (failureClass === "gate") return 2;
  return 3;
}
