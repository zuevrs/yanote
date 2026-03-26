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
import type { CombinedYanoteReport } from "./combinedReport.js";

export function renderCombinedYanoteReportHtml(report: CombinedYanoteReport): string {
  const sections: HtmlSection[] = [
    {
      id: "overview",
      title: "Overview",
      summary: "Top-level combined status with explicit HTTP-vs-async attribution and no synthesized blended denominator.",
      content: renderStack([
        renderMetricGrid([
          { label: "Combined status", value: renderStatusPill(report.status) },
          { label: "HTTP child", value: renderStatusPill(report.overview.childStatuses.http) },
          { label: "Async child", value: renderStatusPill(report.overview.childStatuses.async) },
          { label: "Children", value: escapeHtml(formatNumber(report.overview.totalChildren)) },
          { label: "Green children", value: escapeHtml(formatNumber(report.overview.okChildren)) },
          { label: "Partial children", value: escapeHtml(formatNumber(report.overview.partialChildren)) },
          { label: "Invalid children", value: escapeHtml(formatNumber(report.overview.invalidChildren)) }
        ]),
        renderDefinitionList([
          { term: "Schema version", description: renderCode(report.schemaVersion) },
          { term: "Generated at", description: renderCode(report.generatedAt) },
          { term: "Tool version", description: renderCode(report.toolVersion) },
          { term: "Phase", description: `${renderCode(report.phase.id)} <span class="muted">${escapeHtml(report.phase.slug)}</span>` },
          {
            term: "Combined artifacts",
            description: `${renderCode("yanote-combined-report.json")} remains the machine-facing report path; ${renderCode(
              "yanote-combined-report.html"
            )} is the sibling human artifact.`
          }
        ])
      ])
    },
    {
      id: "http-child",
      title: "HTTP child summary",
      summary: "Canonical HTTP truth stays HTTP-specific: operation coverage, payload/request/security summaries, provenance, and drill-down paths.",
      content: renderStack([
        renderDefinitionList([
          { term: "Child status", description: renderStatusPill(report.children.http.status) },
          { term: "Child generated at", description: renderCode(report.children.http.provenance.generatedAt) },
          { term: "Child tool version", description: renderCode(report.children.http.provenance.toolVersion) },
          { term: "specSource kind", description: renderCode(report.children.http.provenance.specSource.kind) },
          { term: "specSource reference", description: renderCode(report.children.http.provenance.specSource.reference) }
        ]),
        renderTable({
          caption: "HTTP child drill-down artifacts",
          headers: ["Format", "Path"],
          rows: report.children.http.provenance.artifacts.map((artifact) => [escapeHtml(artifact.kind), renderArtifactPath(artifact.path)])
        }),
        renderMetricGrid([
          { label: "Total operations", value: escapeHtml(formatNumber(report.children.http.summary.totalOperations)) },
          { label: "Covered operations", value: escapeHtml(formatNumber(report.children.http.summary.coveredOperations)) },
          { label: "Operation coverage", value: escapeHtml(formatPercent(report.children.http.summary.operationCoveragePercent)) },
          { label: "Aggregate coverage", value: escapeHtml(formatPercent(report.children.http.summary.aggregateCoveragePercent)) },
          {
            label: "Aggregate note",
            value: escapeHtml(report.children.http.summary.aggregateExplanation ?? "None"),
            note: "Copied from the HTTP child without inventing a cross-surface denominator."
          },
          {
            label: "Deprecated coverage",
            value: escapeHtml(formatPercent(report.children.http.summary.deprecatedOperations.operationCoveragePercent))
          }
        ]),
        renderTable({
          caption: "HTTP child summary truth",
          headers: ["Surface", "Key truth"],
          rows: [
            [
              "Deprecated operations",
              escapeHtml(
                `${report.children.http.summary.deprecatedOperations.coveredOperations}/${report.children.http.summary.deprecatedOperations.totalOperations} covered; uncovered=${report.children.http.summary.deprecatedOperations.uncoveredOperations}`
              )
            ],
            [
              "Request payload",
              escapeHtml(renderPayloadSummary(report.children.http.summary.payloadConformance.request))
            ],
            [
              "Response payload",
              escapeHtml(renderPayloadSummary(report.children.http.summary.payloadConformance.response))
            ],
            [
              "Request parameters",
              escapeHtml(
                `observed operations=${report.children.http.summary.requestConformance.observedOperations}; observed parameters=${report.children.http.summary.requestConformance.observedParameters}; ${renderRequestCounts(
                  report.children.http.summary.requestConformance.counts
                )}`
              )
            ],
            [
              "Security truth",
              escapeHtml(
                `declared operations=${report.children.http.summary.securityConformance.declaredOperations}; observed operations=${report.children.http.summary.securityConformance.observedOperations}; observed evaluations=${report.children.http.summary.securityConformance.observedEvaluations}; ${renderSecurityCounts(
                  report.children.http.summary.securityConformance.counts
                )}`
              )
            ],
            [
              "Diagnostics",
              escapeHtml(
                `semantic invalid=${report.children.http.summary.semanticDiagnostics.invalid}; ambiguous=${report.children.http.summary.semanticDiagnostics.ambiguous}; unmatched=${report.children.http.summary.semanticDiagnostics.unmatched}; governance errors=${report.children.http.summary.governanceDiagnostics.errors}; governance warnings=${report.children.http.summary.governanceDiagnostics.warnings}`
              )
            ]
          ]
        }),
        renderTable({
          caption: "HTTP child issues",
          headers: ["Issue"],
          rows: report.children.http.issues.map((issue) => [escapeHtml(issue)]),
          emptyMessage: "No HTTP child issues were retained in the normalized combined report."
        })
      ])
    },
    {
      id: "async-child",
      title: "Async child summary",
      summary: "Canonical async truth stays async-specific: protocols, channel/operation/message coverage, declared/runtime semantics, provenance, and drill-down paths.",
      content: renderStack([
        renderDefinitionList([
          { term: "Child status", description: renderStatusPill(report.children.async.status) },
          { term: "Child generated at", description: renderCode(report.children.async.provenance.generatedAt) },
          { term: "Child tool version", description: renderCode(report.children.async.provenance.toolVersion) },
          { term: "specSource kind", description: renderCode(report.children.async.provenance.specSource.kind) },
          { term: "specSource reference", description: renderCode(report.children.async.provenance.specSource.reference) }
        ]),
        renderTable({
          caption: "Async child drill-down artifacts",
          headers: ["Format", "Path"],
          rows: report.children.async.provenance.artifacts.map((artifact) => [escapeHtml(artifact.kind), renderArtifactPath(artifact.path)])
        }),
        renderMetricGrid([
          { label: "Protocols", value: renderChipList(report.children.async.summary.protocols, "None") },
          { label: "Total channels", value: escapeHtml(formatNumber(report.children.async.summary.totalChannels)) },
          { label: "Covered channels", value: escapeHtml(formatNumber(report.children.async.summary.coveredChannels)) },
          { label: "Channel coverage", value: escapeHtml(formatPercent(report.children.async.summary.channelCoveragePercent)) },
          { label: "Total operations", value: escapeHtml(formatNumber(report.children.async.summary.totalOperations)) },
          { label: "Covered operations", value: escapeHtml(formatNumber(report.children.async.summary.coveredOperations)) },
          { label: "Operation coverage", value: escapeHtml(formatPercent(report.children.async.summary.operationCoveragePercent)) },
          { label: "Total messages", value: escapeHtml(formatNumber(report.children.async.summary.totalMessages)) },
          { label: "Covered messages", value: escapeHtml(formatNumber(report.children.async.summary.coveredMessages)) },
          { label: "Message coverage", value: escapeHtml(formatPercent(report.children.async.summary.messageCoveragePercent)) }
        ]),
        renderTable({
          caption: "Async additive truth",
          headers: ["Surface", "Key truth"],
          rows: [
            [
              "Protocols",
              renderChipList(report.children.async.summary.protocols, "None")
            ],
            [
              "Binding support",
              escapeHtml(
                `operations=${report.children.async.summary.bindingSupport.totalOperations}; bindings=${report.children.async.summary.bindingSupport.totalBindings}; supported=${report.children.async.summary.bindingSupport.supportedBindings}; declared-only=${report.children.async.summary.bindingSupport.declaredOnlyBindings}; deferred=${report.children.async.summary.bindingSupport.deferredBindings}; invalid=${report.children.async.summary.bindingSupport.invalidBindings}`
              )
            ],
            [
              "Declared semantics",
              escapeHtml(
                `operations=${report.children.async.summary.declaredSemantics.totalOperations}; correlationId operations=${report.children.async.summary.declaredSemantics.operationsWithCorrelationId}; message correlationIds=${report.children.async.summary.declaredSemantics.messageCorrelationIds}; reply operations=${report.children.async.summary.declaredSemantics.operationsWithReply}`
              )
            ],
            [
              "Runtime semantics",
              escapeHtml(
                `operations=${report.children.async.summary.runtimeSemantics.totalOperations}; satisfied operations=${report.children.async.summary.runtimeSemantics.satisfiedOperations}; unsatisfied operations=${report.children.async.summary.runtimeSemantics.unsatisfiedOperations}; total semantics=${report.children.async.summary.runtimeSemantics.totalSemantics}; satisfied semantics=${report.children.async.summary.runtimeSemantics.satisfiedSemantics}; unsatisfied semantics=${report.children.async.summary.runtimeSemantics.unsatisfiedSemantics}; runtime proof=${formatPercent(
                  report.children.async.summary.runtimeSemantics.semanticCoveragePercent
                )}`
              )
            ],
            [
              "Diagnostics",
              escapeHtml(renderAsyncDiagnostics(report.children.async.summary.diagnostics))
            ]
          ]
        }),
        renderTable({
          caption: "Async child issues",
          headers: ["Issue"],
          rows: report.children.async.issues.map((issue) => [escapeHtml(issue)]),
          emptyMessage: "No async child issues were retained in the normalized combined report."
        })
      ])
    }
  ];

  return renderHtmlDocument({
    title: "Yanote combined report",
    heading: "Yanote combined report",
    summary:
      "Offline HTML artifact derived from canonical HTTP and async child reports while keeping their denominators, provenance, and drill-down paths separate.",
    sections
  });
}

function renderArtifactPath(value: string): string {
  const href = escapeHtml(encodeURI(value));
  return `<a href="${href}">${renderCode(value)}</a>`;
}

function renderPayloadSummary(
  summary: CombinedYanoteReport["children"]["http"]["summary"]["payloadConformance"]["request"]
): string {
  return [
    `covered=${summary.coveredOperations}`,
    `partial=${summary.partialOperations}`,
    `uncovered=${summary.uncoveredOperations}`,
    `skipped=${summary.skippedOperations}`,
    `n/a=${summary.notApplicableOperations}`,
    `observed=${summary.observedCount}`,
    `valid=${summary.validCount}`,
    `invalid=${summary.invalidCount}`
  ].join("; ");
}

function renderRequestCounts(
  counts: CombinedYanoteReport["children"]["http"]["summary"]["requestConformance"]["counts"]
): string {
  return [
    `captured-valid=${counts.capturedValid}`,
    `captured-invalid=${counts.capturedInvalid}`,
    `redacted=${counts.redacted}`,
    `omitted=${counts.omitted}`,
    `unsupported=${counts.unsupported}`
  ].join("; ");
}

function renderSecurityCounts(
  counts: CombinedYanoteReport["children"]["http"]["summary"]["securityConformance"]["counts"]
): string {
  return [
    `satisfied=${counts.satisfied}`,
    `missing=${counts.missing}`,
    `unavailable=${counts.unavailable}`,
    `unsupported=${counts.unsupported}`,
    `optional=${counts.optional}`,
    `clear=${counts.clear}`
  ].join("; ");
}

function renderAsyncDiagnostics(
  counts: CombinedYanoteReport["children"]["async"]["summary"]["diagnostics"]
): string {
  return [
    `unsupported-content-type=${counts["unsupported-content-type"]}`,
    `unsupported-schema-format=${counts["unsupported-schema-format"]}`,
    `missing-payload=${counts["missing-payload"]}`,
    `invalid-payload=${counts["invalid-payload"]}`,
    `missing-header=${counts["missing-header"]}`,
    `unavailable-header=${counts["unavailable-header"]}`,
    `invalid-header=${counts["invalid-header"]}`,
    `unverifiable-headers=${counts["unverifiable-headers"]}`,
    `ambiguous=${counts.ambiguous}`,
    `mismatched=${counts.mismatched}`,
    `unmatched=${counts.unmatched}`
  ].join("; ");
}
