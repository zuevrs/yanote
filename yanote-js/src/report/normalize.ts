import type { YanoteReport } from "./report.js";

const DECIMALS = 2;
const MULTIPLIER = 10 ** DECIMALS;

export function roundCoverage(value: number): number {
  return Math.round(value * MULTIPLIER) / MULTIPLIER;
}

export function normalizeReport(report: YanoteReport): YanoteReport {
  const perOperation = [...report.coverage.perOperation]
    .map((entry) => ({
      ...entry,
      status: {
        ...entry.status,
        declared: [...entry.status.declared].sort((left, right) => left.localeCompare(right)),
        covered: [...entry.status.covered].sort((left, right) => left.localeCompare(right)),
        missing: [...entry.status.missing].sort((left, right) => left.localeCompare(right))
      },
      parameters: {
        ...entry.parameters,
        required: {
          ...entry.parameters.required,
          missing: [...entry.parameters.required.missing].sort((left, right) => left.localeCompare(right))
        },
        optional: {
          ...entry.parameters.optional,
          missing: [...entry.parameters.optional.missing].sort((left, right) => left.localeCompare(right))
        }
      },
      suites: [...entry.suites].sort((left, right) => left.localeCompare(right))
    }))
    .sort((left, right) => left.operationKey.localeCompare(right.operationKey));

  const httpPayloadPerOperation = [...report.httpPayloadConformance.perOperation]
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
            ...content,
            mediaTypes: [...content.mediaTypes].sort((left, right) => left.localeCompare(right))
          }))
          .sort((left, right) => left.declaredStatus.localeCompare(right.declaredStatus, undefined, { numeric: true }))
      },
      suites: [...entry.suites].sort((left, right) => left.localeCompare(right))
    }))
    .sort((left, right) => left.operationKey.localeCompare(right.operationKey));

  const httpPayloadDiagnostics = [...report.httpPayloadConformance.diagnostics.items]
    .map((item) => ({
      ...item,
      declaredMediaTypes: [...item.declaredMediaTypes].sort((left, right) => left.localeCompare(right)),
      errors: item.errors ? [...item.errors].sort((left, right) => left.localeCompare(right)) : undefined
    }))
    .sort(comparePayloadDiagnostics);

  const httpRequestPerOperation = [...report.httpRequestConformance.perOperation]
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

  const httpRequestDiagnostics = [...report.httpRequestConformance.diagnostics.items]
    .map((item) => ({
      ...item,
      observedValues: item.observedValues ? [...item.observedValues] : undefined
    }))
    .sort(compareRequestDiagnostics);

  const httpSecurityPerOperation = [...report.httpSecurityConformance.perOperation]
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

  const httpSecurityDiagnostics = [...report.httpSecurityConformance.diagnostics.items].sort(compareSecurityDiagnostics);

  return {
    ...report,
    summary: {
      ...report.summary,
      operationCoveragePercent: roundCoverage(report.summary.operationCoveragePercent),
      aggregateCoveragePercent:
        typeof report.summary.aggregateCoveragePercent === "number"
          ? roundCoverage(report.summary.aggregateCoveragePercent)
          : report.summary.aggregateCoveragePercent
    },
    coverage: {
      ...report.coverage,
      operations: {
        ...report.coverage.operations,
        percent:
          typeof report.coverage.operations.percent === "number"
            ? roundCoverage(report.coverage.operations.percent)
            : report.coverage.operations.percent
      },
      status: {
        ...report.coverage.status,
        percent:
          typeof report.coverage.status.percent === "number"
            ? roundCoverage(report.coverage.status.percent)
            : report.coverage.status.percent
      },
      parameters: {
        ...report.coverage.parameters,
        percent:
          typeof report.coverage.parameters.percent === "number"
            ? roundCoverage(report.coverage.parameters.percent)
            : report.coverage.parameters.percent
      },
      aggregate: {
        ...report.coverage.aggregate,
        percent:
          typeof report.coverage.aggregate.percent === "number"
            ? roundCoverage(report.coverage.aggregate.percent)
            : report.coverage.aggregate.percent
      },
      perOperation
    },
    httpPayloadConformance: {
      summary: {
        request: {
          ...report.httpPayloadConformance.summary.request
        },
        response: {
          ...report.httpPayloadConformance.summary.response
        }
      },
      perOperation: httpPayloadPerOperation,
      diagnostics: {
        counts: {
          ...report.httpPayloadConformance.diagnostics.counts
        },
        items: httpPayloadDiagnostics
      }
    },
    httpRequestConformance: {
      summary: {
        observedOperations: report.httpRequestConformance.summary.observedOperations,
        observedParameters: report.httpRequestConformance.summary.observedParameters,
        counts: {
          ...report.httpRequestConformance.summary.counts
        }
      },
      perOperation: httpRequestPerOperation,
      diagnostics: {
        counts: {
          ...report.httpRequestConformance.diagnostics.counts
        },
        items: httpRequestDiagnostics
      }
    },
    httpSecurityConformance: {
      summary: {
        declaredOperations: report.httpSecurityConformance.summary.declaredOperations,
        observedOperations: report.httpSecurityConformance.summary.observedOperations,
        observedEvaluations: report.httpSecurityConformance.summary.observedEvaluations,
        counts: {
          ...report.httpSecurityConformance.summary.counts
        }
      },
      perOperation: httpSecurityPerOperation,
      diagnostics: {
        counts: {
          ...report.httpSecurityConformance.diagnostics.counts
        },
        items: httpSecurityDiagnostics
      }
    },
    diagnostics: {
      counts: {
        ...report.diagnostics.counts
      },
      items: [...report.diagnostics.items]
        .map((item) => ({
          ...item,
          candidates: item.candidates ? [...item.candidates].sort((left, right) => left.localeCompare(right)) : undefined
        }))
        .sort(compareDiagnostics)
    },
    governance: {
      exclusions: {
        appliedRules: [...report.governance.exclusions.appliedRules]
          .map((rule) => ({
            ...rule,
            matchedOperationKeys: [...rule.matchedOperationKeys].sort((left, right) => left.localeCompare(right))
          }))
          .sort((left, right) => {
            if (left.pattern !== right.pattern) return left.pattern.localeCompare(right.pattern);
            return left.id.localeCompare(right.id);
          }),
        unmatchedRules: [...report.governance.exclusions.unmatchedRules].sort((left, right) => {
          if (left.pattern !== right.pattern) return left.pattern.localeCompare(right.pattern);
          return left.id.localeCompare(right.id);
        })
      },
      diagnostics: [...report.governance.diagnostics].sort((left, right) => {
        const severity = governanceSeverityRank(left.severity) - governanceSeverityRank(right.severity);
        if (severity !== 0) return severity;
        const klass = governanceClassRank(left.class) - governanceClassRank(right.class);
        if (klass !== 0) return klass;
        const semantic = governanceSemanticCodeRank(left) - governanceSemanticCodeRank(right);
        if (semantic !== 0) return semantic;
        if (left.code !== right.code) return left.code.localeCompare(right.code);
        if ((left.operationKey ?? "") !== (right.operationKey ?? "")) {
          return (left.operationKey ?? "").localeCompare(right.operationKey ?? "");
        }
        return left.message.localeCompare(right.message);
      })
    }
  };
}

function compareDiagnostics(left: YanoteReport["diagnostics"]["items"][number], right: YanoteReport["diagnostics"]["items"][number]): number {
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
}

function asyncDiagnosticSortKey(diagnostic: YanoteReport["diagnostics"]["items"][number]): string {
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

function comparePayloadDiagnostics(
  left: YanoteReport["httpPayloadConformance"]["diagnostics"]["items"][number],
  right: YanoteReport["httpPayloadConformance"]["diagnostics"]["items"][number]
): number {
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

function compareRequestParameterSummaries(
  left: YanoteReport["httpRequestConformance"]["perOperation"][number]["parameters"][number],
  right: YanoteReport["httpRequestConformance"]["perOperation"][number]["parameters"][number]
): number {
  const locationDelta = requestLocationRank(left.in) - requestLocationRank(right.in);
  if (locationDelta !== 0) return locationDelta;
  return left.name.localeCompare(right.name);
}

function compareRequestDiagnostics(
  left: YanoteReport["httpRequestConformance"]["diagnostics"]["items"][number],
  right: YanoteReport["httpRequestConformance"]["diagnostics"]["items"][number]
): number {
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

function compareSecuritySchemeSummaries(
  left: YanoteReport["httpSecurityConformance"]["perOperation"][number]["branches"][number]["schemes"][number],
  right: YanoteReport["httpSecurityConformance"]["perOperation"][number]["branches"][number]["schemes"][number]
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

function securityTruthRank(value: YanoteReport["httpSecurityConformance"]["diagnostics"]["items"][number]["truth"]): number {
  if (value === "clear") return 0;
  if (value === "optional") return 1;
  if (value === "satisfied") return 2;
  if (value === "missing") return 3;
  if (value === "unavailable") return 4;
  return 5;
}

function requestLocationRank(value: "path" | "query" | "header" | "cookie"): number {
  if (value === "path") return 0;
  if (value === "query") return 1;
  if (value === "header") return 2;
  return 3;
}

function requestTruthRank(value: "captured-valid" | "captured-invalid" | "redacted" | "omitted" | "unsupported"): number {
  if (value === "captured-valid") return 0;
  if (value === "captured-invalid") return 1;
  if (value === "redacted") return 2;
  if (value === "omitted") return 3;
  return 4;
}

function severityRank(kind: "invalid" | "ambiguous" | "unmatched"): number {
  if (kind === "invalid") return 0;
  if (kind === "ambiguous") return 1;
  return 2;
}

function governanceSeverityRank(value: "error" | "warning"): number {
  return value === "error" ? 0 : 1;
}

function governanceClassRank(value: "input" | "semantic" | "gate" | "runtime"): number {
  if (value === "input") return 0;
  if (value === "semantic") return 1;
  if (value === "gate") return 2;
  return 3;
}

function governanceSemanticCodeRank(diagnostic: YanoteReport["governance"]["diagnostics"][number]): number {
  if (diagnostic.class !== "semantic") return 0;

  switch (diagnostic.code) {
    case "ASYNC_SEMANTIC_SPEC_INVALID":
      return 0;
    case "ASYNC_SEMANTIC_UNSUPPORTED_CONTENT_TYPE":
      return 1;
    case "ASYNC_SEMANTIC_UNSUPPORTED_SCHEMA_FORMAT":
      return 2;
    case "ASYNC_SEMANTIC_MISSING_PAYLOAD":
      return 3;
    case "ASYNC_SEMANTIC_INVALID_PAYLOAD":
      return 4;
    case "ASYNC_SEMANTIC_MISSING_HEADER":
      return 5;
    case "ASYNC_SEMANTIC_UNAVAILABLE_HEADER":
      return 6;
    case "ASYNC_SEMANTIC_INVALID_HEADER":
      return 7;
    case "ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS":
      return 8;
    case "ASYNC_SEMANTIC_AMBIGUOUS_MESSAGE":
      return 9;
    case "ASYNC_SEMANTIC_MESSAGE_MISMATCH":
      return 10;
    case "ASYNC_SEMANTIC_UNMATCHED_EVIDENCE":
      return 11;
    case "SEMANTIC_HTTP_MISSING_SECURITY":
      return 20;
    case "SEMANTIC_HTTP_UNAVAILABLE_SECURITY":
      return 21;
    case "SEMANTIC_HTTP_UNSUPPORTED_SECURITY":
      return 22;
    case "SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER":
      return 30;
    case "SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER":
      return 31;
    case "SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER":
      return 32;
    case "SEMANTIC_HTTP_INVALID_BODY":
      return 40;
    case "SEMANTIC_HTTP_MISSING_BODY":
      return 41;
    case "SEMANTIC_HTTP_MISSING_CONTENT_TYPE":
      return 42;
    case "SEMANTIC_HTTP_MEDIA_TYPE_MISMATCH":
      return 43;
    case "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE":
      return 44;
    case "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT":
      return 45;
    case "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA":
      return 46;
    case "SEMANTIC_SPEC_INVALID":
      return 50;
    case "SEMANTIC_FAIL_CLOSED":
      return 99;
    default:
      return 100;
  }
}
