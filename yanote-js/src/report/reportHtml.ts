import {
  escapeHtml,
  formatNumber,
  formatPercent,
  renderChipList,
  renderCode,
  renderDefinitionList,
  renderHtmlDocument,
  renderMetricGrid,
  renderStack,
  renderStatusPill,
  renderTable,
  type HtmlSection
} from "./htmlDocument.js";
import type { HttpRequestTruthAggregate, HttpSecurityTruthAggregate, YanoteReport } from "./report.js";

export function renderYanoteReportHtml(report: YanoteReport): string {
  const sections: HtmlSection[] = [
    {
      id: "overview",
      title: "Overview",
      summary: "Document metadata and the JSON-centered delivery contract.",
      content: renderStack([
        renderMetricGrid([
          { label: "Status", value: renderStatusPill(report.status) },
          { label: "Total operations", value: escapeHtml(formatNumber(report.summary.totalOperations)) },
          { label: "Covered operations", value: escapeHtml(formatNumber(report.summary.coveredOperations)) },
          { label: "Operation coverage", value: escapeHtml(formatPercent(report.summary.operationCoveragePercent)) }
        ]),
        renderDefinitionList([
          { term: "Schema version", description: renderCode(report.schemaVersion) },
          { term: "Generated at", description: renderCode(report.generatedAt) },
          { term: "Tool version", description: renderCode(report.toolVersion) },
          { term: "Phase", description: `${renderCode(report.phase.id)} <span class="muted">${escapeHtml(report.phase.slug)}</span>` },
          { term: "Report artifact", description: `${renderCode("yanote-report.json")} remains the machine-facing report path; ${renderCode("yanote-report.html")} is the sibling human artifact.` }
        ])
      ])
    },
    {
      id: "provenance",
      title: "Provenance",
      summary: "Sanitized source identity copied from the canonical normalized report truth.",
      content: renderStack([
        renderDefinitionList([
          { term: "specSource kind", description: renderCode(report.specSource.kind) },
          { term: "specSource reference", description: renderCode(report.specSource.reference) }
        ])
      ])
    },
    {
      id: "coverage-summary",
      title: "Coverage summary",
      summary: "Top-level HTTP coverage and aggregate dimension truth.",
      content: renderStack([
        renderMetricGrid([
          { label: "Aggregate coverage", value: escapeHtml(formatPercent(report.summary.aggregateCoveragePercent)) },
          {
            label: "Aggregate note",
            value: escapeHtml(report.summary.aggregateExplanation ?? "None"),
            note: "Explanation is omitted from the HTML only when absent from the canonical DTO."
          },
          {
            label: "Deprecated coverage",
            value: escapeHtml(formatPercent(report.summary.deprecatedOperations.operationCoveragePercent))
          },
          {
            label: "Deprecated uncovered",
            value: escapeHtml(formatNumber(report.summary.deprecatedOperations.uncoveredOperations))
          }
        ]),
        renderTable({
          caption: "Coverage dimensions",
          headers: ["Dimension", "State", "Percent", "Notes"],
          rows: [
            ["Operations", renderStatusPill(report.coverage.operations.state), escapeHtml(formatPercent(report.coverage.operations.percent)), ""],
            ["Status", renderStatusPill(report.coverage.status.state), escapeHtml(formatPercent(report.coverage.status.percent)), ""],
            [
              "Parameters",
              renderStatusPill(report.coverage.parameters.state),
              escapeHtml(formatPercent(report.coverage.parameters.percent)),
              ""
            ],
            [
              "Aggregate",
              renderStatusPill(report.coverage.aggregate.state),
              escapeHtml(formatPercent(report.coverage.aggregate.percent)),
              escapeHtml(report.coverage.aggregate.explanation ?? "")
            ]
          ]
        })
      ])
    },
    {
      id: "deprecated-operations",
      title: "Deprecated operations",
      summary: "Explicit deprecated-operation truth derived from the same normalized summary and per-operation coverage arrays as JSON.",
      content: renderStack([
        renderMetricGrid([
          {
            label: "Deprecated total",
            value: escapeHtml(formatNumber(report.summary.deprecatedOperations.totalOperations))
          },
          {
            label: "Deprecated covered",
            value: escapeHtml(formatNumber(report.summary.deprecatedOperations.coveredOperations))
          },
          {
            label: "Deprecated uncovered",
            value: escapeHtml(formatNumber(report.summary.deprecatedOperations.uncoveredOperations))
          },
          {
            label: "Deprecated coverage",
            value: escapeHtml(formatPercent(report.summary.deprecatedOperations.operationCoveragePercent))
          }
        ]),
        renderTable({
          caption: "Deprecated per-operation coverage",
          headers: ["Operation", "Operation state", "Status state", "Required params", "Optional params", "Suites"],
          rows: report.coverage.perOperation
            .filter((entry) => entry.deprecated)
            .map((entry) => [
              renderOperationCell(entry.method, entry.route, entry.operationKey),
              renderStatusPill(entry.operation.state),
              renderStatusPill(entry.status.state),
              escapeHtml(renderParameterCoverageSummary(entry.parameters.required.total, entry.parameters.required.covered)),
              escapeHtml(renderParameterCoverageSummary(entry.parameters.optional.total, entry.parameters.optional.covered)),
              renderChipList(entry.suites)
            ]),
          emptyMessage: "No deprecated operations were present in the normalized report."
        })
      ])
    },
    {
      id: "per-operation-coverage",
      title: "Per-operation coverage",
      summary: "Stable operation-level HTTP coverage, including status and parameter support summaries.",
      content: renderTable({
        caption: "Coverage by operation",
        headers: ["Operation", "Deprecated", "Operation", "Status", "Declared status coverage", "Required params", "Optional params", "Suites"],
        rows: report.coverage.perOperation.map((entry) => [
          renderOperationCell(entry.method, entry.route, entry.operationKey),
          escapeHtml(entry.deprecated ? "Yes" : "No"),
          renderStatusPill(entry.operation.state),
          renderStatusPill(entry.status.state),
          escapeHtml(`${entry.status.covered.length}/${entry.status.declared.length} covered; missing: ${entry.status.missing.join(", ") || "none"}`),
          escapeHtml(renderMissingCoverageSummary(entry.parameters.required.total, entry.parameters.required.covered, entry.parameters.required.missing)),
          escapeHtml(renderMissingCoverageSummary(entry.parameters.optional.total, entry.parameters.optional.covered, entry.parameters.optional.missing)),
          renderChipList(entry.suites)
        ])
      })
    },
    {
      id: "http-payload-conformance",
      title: "HTTP payload conformance",
      summary: "Request and response payload truth, kept separate from observation coverage and rendered without raw payload dumps.",
      content: renderStack([
        renderTable({
          caption: "Payload summary by target",
          headers: [
            "Target",
            "Covered ops",
            "Partial ops",
            "Uncovered ops",
            "Skipped ops",
            "N/A ops",
            "Observed",
            "Valid",
            "Invalid",
            "Skipped"
          ],
          rows: [
            renderPayloadSummaryRow("Request", report.httpPayloadConformance.summary.request),
            renderPayloadSummaryRow("Response", report.httpPayloadConformance.summary.response)
          ]
        }),
        renderTable({
          caption: "Payload conformance per operation",
          headers: ["Operation", "Request state", "Request counts", "Response state", "Response counts", "Suites"],
          rows: report.httpPayloadConformance.perOperation.map((entry) => [
            renderOperationCell(entry.method, entry.route, entry.operationKey),
            renderStatusPill(entry.request.state),
            escapeHtml(renderObservedCounts(entry.request.observedCount, entry.request.validCount, entry.request.invalidCount, entry.request.skippedCount)),
            renderStatusPill(entry.response.state),
            escapeHtml(renderObservedCounts(entry.response.observedCount, entry.response.validCount, entry.response.invalidCount, entry.response.skippedCount)),
            renderChipList(entry.suites)
          ])
        }),
        renderTable({
          caption: "Payload diagnostics",
          headers: ["Operation", "Target", "State", "Code", "Status", "Media types", "Message"],
          rows: report.httpPayloadConformance.diagnostics.items.map((item) => [
            renderOperationCell(item.method, item.route, item.operationKey),
            escapeHtml(item.target),
            renderStatusPill(item.state),
            renderCode(item.code),
            escapeHtml(`declared=${item.declaredStatus ?? "none"}; observed=${item.observedStatus ?? "none"}`),
            escapeHtml(`declared=${item.declaredMediaTypes.join(", ") || "none"}; observed=${item.observedMediaType ?? "none"}`),
            escapeHtml(item.message)
          ]),
          emptyMessage: "No payload diagnostics were present in the normalized report."
        })
      ])
    },
    {
      id: "http-request-conformance",
      title: "HTTP request conformance",
      summary: "Request-parameter truth with support metadata and diagnostic messages, excluding retained observed values.",
      content: renderStack([
        renderMetricGrid([
          {
            label: "Observed operations",
            value: escapeHtml(formatNumber(report.httpRequestConformance.summary.observedOperations))
          },
          {
            label: "Observed parameters",
            value: escapeHtml(formatNumber(report.httpRequestConformance.summary.observedParameters))
          },
          {
            label: "Captured valid",
            value: escapeHtml(formatNumber(report.httpRequestConformance.summary.counts.capturedValid))
          },
          {
            label: "Redacted",
            value: escapeHtml(formatNumber(report.httpRequestConformance.summary.counts.redacted))
          }
        ]),
        renderTable({
          caption: "Request truth counts",
          headers: ["Captured valid", "Captured invalid", "Redacted", "Omitted", "Unsupported"],
          rows: [[
            escapeHtml(formatNumber(report.httpRequestConformance.summary.counts.capturedValid)),
            escapeHtml(formatNumber(report.httpRequestConformance.summary.counts.capturedInvalid)),
            escapeHtml(formatNumber(report.httpRequestConformance.summary.counts.redacted)),
            escapeHtml(formatNumber(report.httpRequestConformance.summary.counts.omitted)),
            escapeHtml(formatNumber(report.httpRequestConformance.summary.counts.unsupported))
          ]]
        }),
        renderTable({
          caption: "Request conformance per operation",
          headers: ["Operation", "Observed", "Truth counts", "Parameters", "Suites"],
          rows: report.httpRequestConformance.perOperation.map((entry) => [
            renderOperationCell(entry.method, entry.route, entry.operationKey),
            escapeHtml(formatNumber(entry.observedCount)),
            escapeHtml(renderRequestTruthCounts(entry.counts)),
            escapeHtml(formatNumber(entry.parameters.length)),
            renderChipList(entry.suites)
          ])
        }),
        renderTable({
          caption: "Request parameter support",
          headers: ["Operation", "Parameter", "Required", "Style", "Support", "Observed", "Truth counts", "Suites"],
          rows: report.httpRequestConformance.perOperation.flatMap((entry) =>
            entry.parameters.map((parameter) => [
              renderOperationCell(entry.method, entry.route, entry.operationKey),
              `<div class="cell-stack"><strong>${escapeHtml(parameter.name)}</strong><span class="muted">${escapeHtml(parameter.in)}</span></div>`,
              escapeHtml(parameter.required ? "Yes" : "No"),
              escapeHtml(`${parameter.style}; explode=${parameter.explode ? "true" : "false"}`),
              escapeHtml(renderRequestParameterSupport(parameter)),
              escapeHtml(formatNumber(parameter.observedCount)),
              escapeHtml(renderRequestTruthCounts(parameter.counts)),
              renderChipList(parameter.suites)
            ])
          ),
          emptyMessage: "No request parameter rows were present in the normalized report."
        }),
        renderTable({
          caption: "Request diagnostics",
          headers: ["Operation", "Parameter", "Truth", "Evidence", "Message"],
          rows: report.httpRequestConformance.diagnostics.items.map((item) => [
            renderOperationCell(item.method, item.route, item.operationKey),
            `<div class="cell-stack"><strong>${escapeHtml(item.name)}</strong><span class="muted">${escapeHtml(item.location)}</span></div>`,
            renderStatusPill(item.truth),
            escapeHtml(`state=${item.evidenceState ?? "none"}; reason=${item.evidenceReason ?? item.reason ?? "none"}`),
            escapeHtml(item.message)
          ]),
          emptyMessage: "No request diagnostics were present in the normalized report."
        })
      ])
    },
    {
      id: "http-security-conformance",
      title: "HTTP security conformance",
      summary: "Security truth with stable section labels for per-operation, per-branch, and diagnostic output from the canonical normalized report.",
      content: renderStack([
        renderMetricGrid([
          {
            label: "Declared operations",
            value: escapeHtml(formatNumber(report.httpSecurityConformance.summary.declaredOperations))
          },
          {
            label: "Observed operations",
            value: escapeHtml(formatNumber(report.httpSecurityConformance.summary.observedOperations))
          },
          {
            label: "Observed evaluations",
            value: escapeHtml(formatNumber(report.httpSecurityConformance.summary.observedEvaluations))
          },
          {
            label: "Missing truth",
            value: escapeHtml(formatNumber(report.httpSecurityConformance.summary.counts.missing))
          }
        ]),
        renderTable({
          caption: "Security truth counts",
          headers: ["Satisfied", "Missing", "Unavailable", "Unsupported", "Optional", "Clear"],
          rows: [[
            escapeHtml(formatNumber(report.httpSecurityConformance.summary.counts.satisfied)),
            escapeHtml(formatNumber(report.httpSecurityConformance.summary.counts.missing)),
            escapeHtml(formatNumber(report.httpSecurityConformance.summary.counts.unavailable)),
            escapeHtml(formatNumber(report.httpSecurityConformance.summary.counts.unsupported)),
            escapeHtml(formatNumber(report.httpSecurityConformance.summary.counts.optional)),
            escapeHtml(formatNumber(report.httpSecurityConformance.summary.counts.clear))
          ]]
        }),
        renderTable({
          caption: "Security conformance per operation",
          headers: ["Operation", "Observed", "Truth counts", "Branches", "Suites"],
          rows: report.httpSecurityConformance.perOperation.map((entry) => [
            renderOperationCell(entry.method, entry.route, entry.operationKey),
            escapeHtml(formatNumber(entry.observedCount)),
            escapeHtml(renderSecurityTruthCounts(entry.overallTruths)),
            escapeHtml(formatNumber(entry.branches.length)),
            renderChipList(entry.suites)
          ])
        }),
        renderTable({
          caption: "Security branches",
          headers: ["Operation", "Branch", "Truth counts", "Schemes", "Suites"],
          rows: report.httpSecurityConformance.perOperation.flatMap((entry) =>
            entry.branches.map((branch) => [
              renderOperationCell(entry.method, entry.route, entry.operationKey),
              escapeHtml(`#${branch.branchIndex} (${branch.kind})`),
              escapeHtml(renderSecurityTruthCounts(branch.truths)),
              renderChipList(
                branch.schemes.map((scheme) =>
                  [scheme.schemeName, scheme.type, scheme.location, scheme.keyName, scheme.scopes.length > 0 ? `scopes=${scheme.scopes.join(",")}` : undefined]
                    .filter((value): value is string => Boolean(value))
                    .join(" · ")
                )
              ),
              renderChipList(branch.suites)
            ])
          ),
          emptyMessage: "No security branches were present in the normalized report."
        }),
        renderTable({
          caption: "Security diagnostics",
          headers: ["Operation", "Branch", "Truth", "Scheme", "Evidence", "Message"],
          rows: report.httpSecurityConformance.diagnostics.items.map((item) => [
            renderOperationCell(item.method, item.route, item.operationKey),
            escapeHtml(`#${item.branchIndex} (${item.branchKind})`),
            renderStatusPill(item.truth),
            escapeHtml([
              item.schemeName,
              item.schemeType,
              item.schemeLocation,
              item.schemeKeyName
            ].filter((value): value is string => Boolean(value)).join(" · ") || "none"),
            escapeHtml(`state=${item.evidenceState ?? "none"}; reason=${item.evidenceReason ?? "none"}`),
            escapeHtml(item.semanticMessage ?? item.message)
          ]),
          emptyMessage: "No security diagnostics were present in the normalized report."
        })
      ])
    },
    {
      id: "diagnostics",
      title: "Diagnostics",
      summary: "Schema-safe semantic diagnostics without raw event bodies or credential values.",
      content: renderStack([
        renderTable({
          caption: "Semantic diagnostic counts",
          headers: ["Invalid", "Ambiguous", "Unmatched"],
          rows: [[
            escapeHtml(formatNumber(report.diagnostics.counts.invalid)),
            escapeHtml(formatNumber(report.diagnostics.counts.ambiguous)),
            escapeHtml(formatNumber(report.diagnostics.counts.unmatched))
          ]]
        }),
        renderTable({
          caption: "Semantic diagnostics",
          headers: ["Kind", "Operation", "Candidates", "Message"],
          rows: report.diagnostics.items.map((item) => [
            renderStatusPill(item.kind),
            escapeHtml(`${item.method ?? ""} ${item.route ?? ""}`.trim() || "N/A"),
            renderChipList(item.candidates ?? []),
            escapeHtml(item.message)
          ]),
          emptyMessage: "No semantic diagnostics were present in the normalized report."
        })
      ])
    },
    {
      id: "governance",
      title: "Governance",
      summary: "Exclusions and governance diagnostics preserved from the canonical report without dumping raw objects.",
      content: renderStack([
        renderTable({
          caption: "Applied exclusion rules",
          headers: ["Rule", "Pattern", "Owner", "Expires", "Matches", "Critical override"],
          rows: report.governance.exclusions.appliedRules.map((rule) => [
            renderCode(rule.id),
            renderCode(rule.pattern),
            escapeHtml(rule.owner),
            renderCode(rule.expiresOn),
            escapeHtml(`${rule.matchedOperationCount}: ${rule.matchedOperationKeys.join(", ") || "none"}`),
            escapeHtml(rule.usedCriticalOverride ? "Yes" : "No")
          ]),
          emptyMessage: "No exclusion rules were applied."
        }),
        renderTable({
          caption: "Unmatched exclusion rules",
          headers: ["Rule", "Pattern", "Owner", "Expires", "Message"],
          rows: report.governance.exclusions.unmatchedRules.map((rule) => [
            renderCode(rule.id),
            renderCode(rule.pattern),
            escapeHtml(rule.owner),
            renderCode(rule.expiresOn),
            escapeHtml(rule.message)
          ]),
          emptyMessage: "No exclusion rules were unmatched."
        }),
        renderTable({
          caption: "Governance diagnostics",
          headers: ["Severity", "Class", "Code", "Operation", "Message"],
          rows: report.governance.diagnostics.map((item) => [
            renderStatusPill(item.severity),
            escapeHtml(item.class),
            renderCode(item.code),
            escapeHtml(item.operationKey ?? "N/A"),
            escapeHtml(item.message)
          ]),
          emptyMessage: "No governance diagnostics were present in the normalized report."
        })
      ])
    }
  ];

  return renderHtmlDocument({
    title: "Yanote HTTP report",
    heading: "Yanote HTTP report",
    summary: "Offline HTML artifact derived from the same normalized canonical truth as yanote-report.json.",
    sections
  });
}

function renderOperationCell(method: string, route: string, operationKey: string): string {
  return `<div class="cell-stack"><strong>${escapeHtml(method)} ${escapeHtml(route)}</strong><span class="muted">${renderCode(
    operationKey
  )}</span></div>`;
}

function renderParameterCoverageSummary(total: number, covered: number): string {
  return `${covered}/${total} covered`;
}

function renderMissingCoverageSummary(total: number, covered: number, missing: string[]): string {
  return `${covered}/${total} covered; missing: ${missing.join(", ") || "none"}`;
}

function renderObservedCounts(observed: number, valid: number, invalid: number, skipped: number): string {
  return `observed=${observed}; valid=${valid}; invalid=${invalid}; skipped=${skipped}`;
}

function renderPayloadSummaryRow(
  label: string,
  summary: YanoteReport["httpPayloadConformance"]["summary"]["request"]
): string[] {
  return [
    escapeHtml(label),
    escapeHtml(formatNumber(summary.coveredOperations)),
    escapeHtml(formatNumber(summary.partialOperations)),
    escapeHtml(formatNumber(summary.uncoveredOperations)),
    escapeHtml(formatNumber(summary.skippedOperations)),
    escapeHtml(formatNumber(summary.notApplicableOperations)),
    escapeHtml(formatNumber(summary.observedCount)),
    escapeHtml(formatNumber(summary.validCount)),
    escapeHtml(formatNumber(summary.invalidCount)),
    escapeHtml(formatNumber(summary.skippedCount))
  ];
}

function renderRequestTruthCounts(counts: HttpRequestTruthAggregate): string {
  return [
    `valid=${counts.capturedValid}`,
    `invalid=${counts.capturedInvalid}`,
    `redacted=${counts.redacted}`,
    `omitted=${counts.omitted}`,
    `unsupported=${counts.unsupported}`
  ].join("; ");
}

function renderRequestParameterSupport(
  parameter: YanoteReport["httpRequestConformance"]["perOperation"][number]["parameters"][number]
): string {
  const declared =
    parameter.declaredSupport === "supported"
      ? `declared=${parameter.declaredSupport} (${parameter.declaredSupportShape ?? "scalar"})`
      : `declared=${parameter.declaredSupport} (${parameter.declaredSupportReason ?? "unknown"})`;
  const scalar =
    parameter.scalarSupport === "supported"
      ? `scalar=${parameter.scalarSupport}`
      : `scalar=${parameter.scalarSupport} (${parameter.scalarSupportReason ?? "unknown"})`;
  return `${declared}; ${scalar}`;
}

function renderSecurityTruthCounts(counts: HttpSecurityTruthAggregate): string {
  return [
    `satisfied=${counts.satisfied}`,
    `missing=${counts.missing}`,
    `unavailable=${counts.unavailable}`,
    `unsupported=${counts.unsupported}`,
    `optional=${counts.optional}`,
    `clear=${counts.clear}`
  ].join("; ");
}
