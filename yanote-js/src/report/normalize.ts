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
        if (left.code !== right.code) return left.code.localeCompare(right.code);
        return (left.operationKey ?? "").localeCompare(right.operationKey ?? "");
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

  const leftCandidates = left.candidates ? left.candidates.join("|") : "";
  const rightCandidates = right.candidates ? right.candidates.join("|") : "";
  if (leftCandidates !== rightCandidates) return leftCandidates.localeCompare(rightCandidates);

  return left.message.localeCompare(right.message);
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
