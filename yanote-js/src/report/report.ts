import type { CoverageDimensionState } from "../coverage/dimensions.js";
import type { CoverageResult } from "../coverage/coverage.js";
import type { AppliedExclusionRule, UnmatchedExclusionRuleWarning } from "../gates/exclusions.js";
import type { GovernanceFailure } from "../gates/failureOrder.js";
import type { SemanticDiagnostic } from "../spec/diagnostics.js";
import { REPORT_SCHEMA_VERSION } from "./schema.js";

export type ReportStatus = "ok" | "partial" | "invalid";

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
  const status = resolveReportStatus(coverage, counts);

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
    diagnostics: {
      counts,
      items: diagnostics
    },
    governance: {
      exclusions: {
        appliedRules: sortAppliedRules(opts.governance?.exclusions?.appliedRules ?? []),
        unmatchedRules: sortUnmatchedRules(opts.governance?.exclusions?.unmatchedRules ?? [])
      },
      diagnostics: sortGovernanceDiagnostics(opts.governance?.diagnostics ?? [])
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

function resolveReportStatus(
  coverage: CoverageResult,
  counts: YanoteReport["diagnostics"]["counts"]
): ReportStatus {
  if (counts.invalid > 0 || counts.ambiguous > 0) return "invalid";
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

      const leftCandidates = left.candidates ? left.candidates.join("|") : "";
      const rightCandidates = right.candidates ? right.candidates.join("|") : "";
      if (leftCandidates !== rightCandidates) return leftCandidates.localeCompare(rightCandidates);

      return left.message.localeCompare(right.message);
    });
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
