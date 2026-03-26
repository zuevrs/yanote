import type {
  HttpPayloadConformanceCode,
  HttpPayloadConformanceDiagnostic,
  HttpPayloadConformanceResult,
  HttpPayloadConformanceState
} from "../coverage/httpPayloadConformance.js";
import type {
  HttpRequestConformanceDiagnostic,
  HttpRequestConformanceResult,
  HttpRequestConformanceTruth
} from "../coverage/httpRequestConformance.js";
import type {
  HttpSecurityConformanceDiagnostic,
  HttpSecurityConformanceResult,
  HttpSecurityConformanceTruth,
  HttpSecuritySchemeSummary
} from "../coverage/httpSecurityConformance.js";
import type { PayloadCaptureReason, PayloadCaptureState } from "../model/payloadCapture.js";
import type { CoverageDimensionState, DeclaredStatusToken } from "../coverage/dimensions.js";
import type { CoverageResult } from "../coverage/coverage.js";
import type { AppliedExclusionRule, UnmatchedExclusionRuleWarning } from "../gates/exclusions.js";
import type { GovernanceFailure } from "../gates/failureOrder.js";
import { sortFailuresByPrecedence } from "../gates/failureOrder.js";
import { classifyHttpSecurityDiagnostic, evaluateHttpSecuritySemanticFailures } from "../gates/httpSecuritySemantics.js";
import { evaluateHttpPayloadSemanticFailures } from "../gates/httpPayloadSemantics.js";
import type { SemanticDiagnostic } from "../spec/diagnostics.js";
import type { SpecSourceProvenance } from "../spec/specSource.js";
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

export type HttpRequestTruthAggregate = {
  capturedValid: number;
  capturedInvalid: number;
  redacted: number;
  omitted: number;
  unsupported: number;
};

export type HttpSecurityTruthAggregate = {
  satisfied: number;
  missing: number;
  unavailable: number;
  unsupported: number;
  optional: number;
  clear: number;
};

export type YanoteReport = {
  schemaVersion: string;
  generatedAt: string;
  toolVersion: string;
  specSource: SpecSourceProvenance;
  phase: {
    id: string;
    slug: string;
  };
  status: ReportStatus;
  summary: {
    totalOperations: number;
    coveredOperations: number;
    operationCoveragePercent: number;
    deprecatedOperations: {
      totalOperations: number;
      coveredOperations: number;
      uncoveredOperations: number;
      operationCoveragePercent: number;
    };
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
      deprecated: boolean;
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
  httpRequestConformance: {
    summary: {
      observedOperations: number;
      observedParameters: number;
      counts: HttpRequestTruthAggregate;
    };
    perOperation: Array<{
      operationKey: string;
      method: string;
      route: string;
      observedCount: number;
      counts: HttpRequestTruthAggregate;
      parameters: Array<{
        name: string;
        in: "path" | "query" | "header" | "cookie";
        required: boolean;
        style: string;
        explode: boolean;
        declaredSupport: "supported" | "unsupported";
        declaredSupportShape?: "scalar" | "array";
        declaredSupportReason?: "content" | "style" | "explode" | "schema";
        scalarSupport: "supported" | "unsupported";
        scalarSupportReason?: "style" | "schema";
        observedCount: number;
        counts: HttpRequestTruthAggregate;
        suites: string[];
      }>;
      suites: string[];
    }>;
    diagnostics: {
      counts: HttpRequestTruthAggregate;
      items: Array<{
        operationKey: string;
        method: string;
        route: string;
        suite: string;
        location: "path" | "query" | "header" | "cookie";
        name: string;
        required: boolean;
        style: string;
        truth: HttpRequestConformanceTruth;
        message: string;
        reason?: string;
        observedValues?: string[];
        evidenceState?: "captured" | "redacted" | "omitted";
        evidenceReason?: "sensitive" | "oversized" | "unsupported" | "unavailable";
      }>;
    };
  };
  httpSecurityConformance: {
    summary: {
      declaredOperations: number;
      observedOperations: number;
      observedEvaluations: number;
      counts: HttpSecurityTruthAggregate;
    };
    perOperation: Array<{
      operationKey: string;
      method: string;
      route: string;
      observedCount: number;
      overallTruths: HttpSecurityTruthAggregate;
      branches: Array<{
        branchIndex: number;
        kind: "requirement" | "optional" | "clear";
        observedCount: number;
        truths: HttpSecurityTruthAggregate;
        schemes: Array<{
          schemeName: string;
          type: "apiKey" | "http" | "oauth2" | "openIdConnect" | "mutualTLS" | "unsupported";
          location?: string;
          keyName?: string;
          scopes: string[];
        }>;
        suites: string[];
      }>;
      suites: string[];
    }>;
    diagnostics: {
      counts: HttpSecurityTruthAggregate;
      items: Array<{
        operationKey: string;
        method: string;
        route: string;
        suite: string;
        truth: HttpSecurityConformanceTruth;
        branchIndex: number;
        branchKind: "requirement" | "optional" | "clear";
        message: string;
        schemeName?: string;
        schemeType?: "apiKey" | "http" | "oauth2" | "openIdConnect" | "mutualTLS" | "unsupported";
        schemeLocation?: string;
        schemeKeyName?: string;
        evidenceState?: "captured" | "redacted" | "omitted";
        evidenceReason?: "sensitive" | "oversized" | "unsupported" | "unavailable";
        semanticCode?: "SEMANTIC_HTTP_MISSING_SECURITY" | "SEMANTIC_HTTP_UNAVAILABLE_SECURITY" | "SEMANTIC_HTTP_UNSUPPORTED_SECURITY";
        semanticMessage?: string;
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
    specSource: SpecSourceProvenance;
    eventTimestamps?: number[];
    payloadConformance?: HttpPayloadConformanceResult;
    requestConformance?: HttpRequestConformanceResult;
    securityConformance?: HttpSecurityConformanceResult;
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
  const securitySemanticDiagnostics = evaluateHttpSecuritySemanticFailures(opts.securityConformance?.diagnostics ?? []);
  const payloadSemanticDiagnostics = evaluateHttpPayloadSemanticFailures(opts.payloadConformance?.diagnostics ?? []);
  const governanceDiagnostics = mergeGovernanceDiagnostics(
    [...securitySemanticDiagnostics, ...payloadSemanticDiagnostics],
    opts.governance?.diagnostics ?? []
  );
  const status = resolveReportStatus(coverage, counts, governanceDiagnostics);

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt: resolveGeneratedAt(opts.eventTimestamps),
    toolVersion: opts.toolVersion,
    specSource: {
      kind: opts.specSource.kind,
      reference: opts.specSource.reference
    },
    phase: {
      id: "02",
      slug: "coverage-metrics-and-cli-reporting"
    },
    status,
    summary: {
      totalOperations: coverage.allOperations.length,
      coveredOperations: coverage.coveredOperations.length,
      operationCoveragePercent: coverage.dimensions.operations.percent ?? 0,
      deprecatedOperations: summarizeDeprecatedOperations(coverage),
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
        deprecated: entry.deprecated,
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
    httpRequestConformance: buildHttpRequestConformanceSection(coverage, opts.requestConformance),
    httpSecurityConformance: buildHttpSecurityConformanceSection(coverage, opts.securityConformance),
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

function summarizeDeprecatedOperations(coverage: CoverageResult): YanoteReport["summary"]["deprecatedOperations"] {
  const deprecatedOperations = coverage.perOperation.filter((entry) => entry.deprecated);
  const totalOperations = deprecatedOperations.length;
  const coveredOperations = deprecatedOperations.filter((entry) => entry.operation.state === "COVERED").length;
  const uncoveredOperations = totalOperations - coveredOperations;

  return {
    totalOperations,
    coveredOperations,
    uncoveredOperations,
    operationCoveragePercent: totalOperations === 0 ? 0 : roundCoveragePercent((coveredOperations / totalOperations) * 100)
  };
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

function buildHttpRequestConformanceSection(
  coverage: CoverageResult,
  requestConformance: HttpRequestConformanceResult | undefined
): YanoteReport["httpRequestConformance"] {
  const perOperation = sortRequestPerOperation(
    requestConformance?.perOperation.map((entry) => ({
      operationKey: entry.operationKey,
      method: entry.method,
      route: entry.route,
      observedCount: entry.observedCount,
      counts: summarizeRequestTruths(entry.parameters.map((parameter) => parameter.truths)),
      parameters: entry.parameters.map((parameter) => ({
        name: parameter.name,
        in: parameter.in,
        required: parameter.required,
        style: parameter.style,
        explode: parameter.explode,
        declaredSupport: parameter.declaredSupport,
        ...(parameter.declaredSupport === "supported"
          ? { declaredSupportShape: parameter.declaredSupportShape }
          : { declaredSupportReason: parameter.declaredSupportReason }),
        scalarSupport: parameter.scalarSupport,
        ...(parameter.scalarSupport === "unsupported" ? { scalarSupportReason: parameter.scalarSupportReason } : {}),
        observedCount: parameter.observedCount,
        counts: toRequestTruthAggregate(parameter.truths),
        suites: [...parameter.suites]
      })),
      suites: [...entry.suites]
    })) ??
      coverage.perOperation.map((entry) => ({
        operationKey: entry.operationKey,
        method: entry.method,
        route: entry.route,
        observedCount: 0,
        counts: createEmptyRequestTruthAggregate(),
        parameters: [],
        suites: [...entry.suites]
      }))
  );

  const diagnostics = sortRequestDiagnostics(requestConformance?.diagnostics ?? []);
  const counts = diagnostics.reduce<HttpRequestTruthAggregate>((summary, diagnostic) => {
    incrementRequestTruthCount(summary, diagnostic.truth);
    return summary;
  }, createEmptyRequestTruthAggregate());

  return {
    summary: {
      observedOperations: perOperation.filter((entry) => entry.observedCount > 0).length,
      observedParameters: diagnostics.length,
      counts: { ...counts }
    },
    perOperation,
    diagnostics: {
      counts: { ...counts },
      items: diagnostics
    }
  };
}

function buildHttpSecurityConformanceSection(
  coverage: CoverageResult,
  securityConformance: HttpSecurityConformanceResult | undefined
): YanoteReport["httpSecurityConformance"] {
  const perOperation = sortSecurityPerOperation(
    securityConformance?.perOperation.map((entry) => ({
      operationKey: entry.operationKey,
      method: entry.method,
      route: entry.route,
      observedCount: entry.observedCount,
      overallTruths: { ...entry.overallTruths },
      branches: entry.branches.map((branch) => ({
        branchIndex: branch.branchIndex,
        kind: branch.kind,
        observedCount: branch.observedCount,
        truths: { ...branch.truths },
        schemes: branch.schemes.map((scheme) => ({
          schemeName: scheme.schemeName,
          type: scheme.type,
          ...(scheme.location ? { location: scheme.location } : {}),
          ...(scheme.keyName ? { keyName: scheme.keyName } : {}),
          scopes: [...scheme.scopes]
        })),
        suites: [...branch.suites]
      })),
      suites: [...entry.suites]
    })) ??
      coverage.perOperation.map((entry) => ({
        operationKey: entry.operationKey,
        method: entry.method,
        route: entry.route,
        observedCount: 0,
        overallTruths: createEmptySecurityTruthAggregate(),
        branches: [],
        suites: [...entry.suites]
      }))
  );

  const diagnostics = sortSecurityDiagnostics(securityConformance?.diagnostics ?? []);
  const counts = diagnostics.reduce<HttpSecurityTruthAggregate>((summary, diagnostic) => {
    incrementSecurityTruthCount(summary, diagnostic.truth);
    return summary;
  }, createEmptySecurityTruthAggregate());

  return {
    summary: {
      declaredOperations: perOperation.filter((entry) => entry.branches.length > 0).length,
      observedOperations: perOperation.filter((entry) => entry.observedCount > 0).length,
      observedEvaluations: sumSecurityTruthAggregate(counts),
      counts: { ...counts }
    },
    perOperation,
    diagnostics: {
      counts: { ...counts },
      items: diagnostics
    }
  };
}

function createEmptyRequestTruthAggregate(): HttpRequestTruthAggregate {
  return {
    capturedValid: 0,
    capturedInvalid: 0,
    redacted: 0,
    omitted: 0,
    unsupported: 0
  };
}

function incrementRequestTruthCount(summary: HttpRequestTruthAggregate, truth: HttpRequestConformanceTruth, amount = 1): void {
  if (truth === "captured-valid") summary.capturedValid += amount;
  else if (truth === "captured-invalid") summary.capturedInvalid += amount;
  else if (truth === "redacted") summary.redacted += amount;
  else if (truth === "omitted") summary.omitted += amount;
  else summary.unsupported += amount;
}

function summarizeRequestTruths(
  parameterTruths: Array<{
    "captured-valid": number;
    "captured-invalid": number;
    redacted: number;
    omitted: number;
    unsupported: number;
  }>
): HttpRequestTruthAggregate {
  const summary = createEmptyRequestTruthAggregate();

  for (const truths of parameterTruths) {
    summary.capturedValid += truths["captured-valid"];
    summary.capturedInvalid += truths["captured-invalid"];
    summary.redacted += truths.redacted;
    summary.omitted += truths.omitted;
    summary.unsupported += truths.unsupported;
  }

  return summary;
}

function toRequestTruthAggregate(truths: {
  "captured-valid": number;
  "captured-invalid": number;
  redacted: number;
  omitted: number;
  unsupported: number;
}): HttpRequestTruthAggregate {
  return {
    capturedValid: truths["captured-valid"],
    capturedInvalid: truths["captured-invalid"],
    redacted: truths.redacted,
    omitted: truths.omitted,
    unsupported: truths.unsupported
  };
}

function sortRequestPerOperation(
  perOperation: YanoteReport["httpRequestConformance"]["perOperation"]
): YanoteReport["httpRequestConformance"]["perOperation"] {
  return [...perOperation]
    .map((entry) => ({
      ...entry,
      counts: { ...entry.counts },
      parameters: [...entry.parameters]
        .map((parameter) => ({
          ...parameter,
          counts: { ...parameter.counts },
          suites: [...parameter.suites].sort((left, right) => left.localeCompare(right))
        }))
        .sort(compareRequestParameterSummaries),
      suites: [...entry.suites].sort((left, right) => left.localeCompare(right))
    }))
    .sort((left, right) => left.operationKey.localeCompare(right.operationKey));
}

function sortRequestDiagnostics(
  diagnostics: HttpRequestConformanceDiagnostic[]
): YanoteReport["httpRequestConformance"]["diagnostics"]["items"] {
  return [...diagnostics]
    .map((diagnostic) => ({
      ...diagnostic,
      observedValues: diagnostic.observedValues ? [...diagnostic.observedValues] : undefined
    }))
    .sort(compareRequestDiagnostics);
}

function compareRequestParameterSummaries(
  left: YanoteReport["httpRequestConformance"]["perOperation"][number]["parameters"][number],
  right: YanoteReport["httpRequestConformance"]["perOperation"][number]["parameters"][number]
): number {
  const locationDelta = requestLocationRank(left.in) - requestLocationRank(right.in);
  if (locationDelta !== 0) return locationDelta;
  return left.name.localeCompare(right.name);
}

function compareRequestDiagnostics(left: HttpRequestConformanceDiagnostic, right: HttpRequestConformanceDiagnostic): number {
  if (left.operationKey !== right.operationKey) return left.operationKey.localeCompare(right.operationKey);

  const locationDelta = requestLocationRank(left.location) - requestLocationRank(right.location);
  if (locationDelta !== 0) return locationDelta;

  if (left.name !== right.name) return left.name.localeCompare(right.name);
  const truthDelta = requestTruthRank(left.truth) - requestTruthRank(right.truth);
  if (truthDelta !== 0) return truthDelta;
  if ((left.reason ?? "") !== (right.reason ?? "")) return (left.reason ?? "").localeCompare(right.reason ?? "");
  if ((left.observedValues ?? []).join("\u0000") !== (right.observedValues ?? []).join("\u0000")) {
    return (left.observedValues ?? []).join("\u0000").localeCompare((right.observedValues ?? []).join("\u0000"));
  }
  return left.suite.localeCompare(right.suite);
}

function requestLocationRank(value: "path" | "query" | "header" | "cookie"): number {
  if (value === "path") return 0;
  if (value === "query") return 1;
  if (value === "header") return 2;
  return 3;
}

function requestTruthRank(value: HttpRequestConformanceTruth): number {
  if (value === "captured-valid") return 0;
  if (value === "captured-invalid") return 1;
  if (value === "redacted") return 2;
  if (value === "omitted") return 3;
  return 4;
}

function createEmptySecurityTruthAggregate(): HttpSecurityTruthAggregate {
  return {
    satisfied: 0,
    missing: 0,
    unavailable: 0,
    unsupported: 0,
    optional: 0,
    clear: 0
  };
}

function incrementSecurityTruthCount(
  summary: HttpSecurityTruthAggregate,
  truth: HttpSecurityConformanceTruth,
  amount = 1
): void {
  if (truth === "satisfied") summary.satisfied += amount;
  else if (truth === "missing") summary.missing += amount;
  else if (truth === "unavailable") summary.unavailable += amount;
  else if (truth === "unsupported") summary.unsupported += amount;
  else if (truth === "optional") summary.optional += amount;
  else summary.clear += amount;
}

function sumSecurityTruthAggregate(summary: HttpSecurityTruthAggregate): number {
  return summary.satisfied + summary.missing + summary.unavailable + summary.unsupported + summary.optional + summary.clear;
}

function sortSecurityPerOperation(
  perOperation: YanoteReport["httpSecurityConformance"]["perOperation"]
): YanoteReport["httpSecurityConformance"]["perOperation"] {
  return [...perOperation]
    .map((entry) => ({
      ...entry,
      overallTruths: { ...entry.overallTruths },
      branches: [...entry.branches]
        .map((branch) => ({
          ...branch,
          truths: { ...branch.truths },
          schemes: [...branch.schemes]
            .map((scheme) => ({
              ...scheme,
              scopes: [...scheme.scopes].sort((left, right) => left.localeCompare(right))
            }))
            .sort(compareSecuritySchemeSummaries),
          suites: [...branch.suites].sort((left, right) => left.localeCompare(right))
        }))
        .sort((left, right) => left.branchIndex - right.branchIndex),
      suites: [...entry.suites].sort((left, right) => left.localeCompare(right))
    }))
    .sort((left, right) => left.operationKey.localeCompare(right.operationKey));
}

function sortSecurityDiagnostics(
  diagnostics: HttpSecurityConformanceDiagnostic[]
): YanoteReport["httpSecurityConformance"]["diagnostics"]["items"] {
  return [...diagnostics]
    .map((diagnostic) => {
      const semantic = classifyHttpSecurityDiagnostic(diagnostic);
      return {
        ...diagnostic,
        ...(semantic
          ? {
              semanticCode: semantic.code,
              semanticMessage: semantic.reason
            }
          : {})
      };
    })
    .sort(compareSecurityDiagnostics);
}

function compareSecuritySchemeSummaries(
  left: HttpSecuritySchemeSummary,
  right: HttpSecuritySchemeSummary
): number {
  if (left.schemeName !== right.schemeName) return left.schemeName.localeCompare(right.schemeName);
  if (left.type !== right.type) return left.type.localeCompare(right.type);
  if ((left.location ?? "") !== (right.location ?? "")) return (left.location ?? "").localeCompare(right.location ?? "");
  if ((left.keyName ?? "") !== (right.keyName ?? "")) return (left.keyName ?? "").localeCompare(right.keyName ?? "");
  return left.scopes.join("\u0000").localeCompare(right.scopes.join("\u0000"));
}

function compareSecurityDiagnostics(
  left: YanoteReport["httpSecurityConformance"]["diagnostics"]["items"][number],
  right: YanoteReport["httpSecurityConformance"]["diagnostics"]["items"][number]
): number {
  if (left.operationKey !== right.operationKey) return left.operationKey.localeCompare(right.operationKey);
  if (left.branchIndex !== right.branchIndex) return left.branchIndex - right.branchIndex;

  const truthDelta = securityTruthRank(left.truth) - securityTruthRank(right.truth);
  if (truthDelta !== 0) return truthDelta;

  if ((left.schemeName ?? "") !== (right.schemeName ?? "")) {
    return (left.schemeName ?? "").localeCompare(right.schemeName ?? "");
  }

  if ((left.schemeType ?? "") !== (right.schemeType ?? "")) {
    return (left.schemeType ?? "").localeCompare(right.schemeType ?? "");
  }

  if ((left.schemeLocation ?? "") !== (right.schemeLocation ?? "")) {
    return (left.schemeLocation ?? "").localeCompare(right.schemeLocation ?? "");
  }

  if ((left.schemeKeyName ?? "") !== (right.schemeKeyName ?? "")) {
    return (left.schemeKeyName ?? "").localeCompare(right.schemeKeyName ?? "");
  }

  if ((left.evidenceState ?? "") !== (right.evidenceState ?? "")) {
    return (left.evidenceState ?? "").localeCompare(right.evidenceState ?? "");
  }

  if ((left.evidenceReason ?? "") !== (right.evidenceReason ?? "")) {
    return (left.evidenceReason ?? "").localeCompare(right.evidenceReason ?? "");
  }

  return left.suite.localeCompare(right.suite);
}

function securityTruthRank(value: HttpSecurityConformanceTruth): number {
  if (value === "clear") return 0;
  if (value === "optional") return 1;
  if (value === "satisfied") return 2;
  if (value === "missing") return 3;
  if (value === "unavailable") return 4;
  return 5;
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

function roundCoveragePercent(value: number): number {
  return Math.round(value * 100) / 100;
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
  governanceDiagnostics: GovernanceFailure[]
): ReportStatus {
  if (counts.invalid > 0 || counts.ambiguous > 0) return "invalid";
  if (governanceDiagnostics.some((diagnostic) => diagnostic.failureClass === "semantic" && diagnostic.severity === "error")) {
    return "partial";
  }
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
  return sortFailuresByPrecedence(diagnostics).map((diagnostic) => ({
    severity: diagnostic.severity,
    class: diagnostic.failureClass,
    code: diagnostic.code,
    message: diagnostic.reason,
    operationKey: diagnostic.operationKey
  }));
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
