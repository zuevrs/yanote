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
import type { AsyncYanoteReport } from "./asyncReport.js";

export function renderAsyncYanoteReportHtml(report: AsyncYanoteReport): string {
  const sections: HtmlSection[] = [
    {
      id: "overview",
      title: "Overview",
      summary: "Document metadata and the JSON-centered delivery contract for the async surface.",
      content: renderStack([
        renderMetricGrid([
          { label: "Status", value: renderStatusPill(report.status) },
          { label: "Total channels", value: escapeHtml(formatNumber(report.summary.totalChannels)) },
          { label: "Covered channels", value: escapeHtml(formatNumber(report.summary.coveredChannels)) },
          { label: "Channel coverage", value: escapeHtml(formatPercent(report.summary.channelCoveragePercent)) },
          { label: "Total operations", value: escapeHtml(formatNumber(report.summary.totalOperations)) },
          { label: "Covered operations", value: escapeHtml(formatNumber(report.summary.coveredOperations)) },
          { label: "Operation coverage", value: escapeHtml(formatPercent(report.summary.operationCoveragePercent)) },
          { label: "Total messages", value: escapeHtml(formatNumber(report.summary.totalMessages)) },
          { label: "Covered messages", value: escapeHtml(formatNumber(report.summary.coveredMessages)) },
          { label: "Message coverage", value: escapeHtml(formatPercent(report.summary.messageCoveragePercent)) }
        ]),
        renderDefinitionList([
          { term: "Schema version", description: renderCode(report.schemaVersion) },
          { term: "Generated at", description: renderCode(report.generatedAt) },
          { term: "Tool version", description: renderCode(report.toolVersion) },
          { term: "Phase", description: `${renderCode(report.phase.id)} <span class="muted">${escapeHtml(report.phase.slug)}</span>` },
          {
            term: "Report artifact",
            description: `${renderCode("yanote-async-report.json")} remains the machine-facing report path; ${renderCode("yanote-async-report.html")} is the sibling human artifact.`
          }
        ])
      ])
    },
    {
      id: "provenance",
      title: "Provenance",
      summary: "Sanitized source identity copied from the canonical normalized async report truth.",
      content: renderDefinitionList([
        { term: "specSource kind", description: renderCode(report.specSource.kind) },
        { term: "specSource reference", description: renderCode(report.specSource.reference) }
      ])
    },
    {
      id: "async-coverage-summary",
      title: "Async coverage summary",
      summary: "Top-level channel, operation, and message truth from the same normalized DTO as JSON.",
      content: renderStack([
        renderTable({
          caption: "Async coverage dimensions",
          headers: ["Dimension", "State", "Percent", "Covered", "Total"],
          rows: [
            [
              "Channels",
              renderStatusPill(report.coverage.channels.state),
              escapeHtml(formatPercent(report.coverage.channels.percent)),
              escapeHtml(formatNumber(report.summary.coveredChannels)),
              escapeHtml(formatNumber(report.summary.totalChannels))
            ],
            [
              "Operations",
              renderStatusPill(report.coverage.operations.state),
              escapeHtml(formatPercent(report.coverage.operations.percent)),
              escapeHtml(formatNumber(report.summary.coveredOperations)),
              escapeHtml(formatNumber(report.summary.totalOperations))
            ],
            [
              "Messages",
              renderStatusPill(report.coverage.messages.state),
              escapeHtml(formatPercent(report.coverage.messages.percent)),
              escapeHtml(formatNumber(report.summary.coveredMessages)),
              escapeHtml(formatNumber(report.summary.totalMessages))
            ]
          ]
        })
      ])
    },
    {
      id: "channel-coverage",
      title: "Channel coverage",
      summary: "Per-channel action coverage without HTTP request, response, or security wording.",
      content: renderTable({
        caption: "Coverage by channel",
        headers: ["Channel", "State", "Covered actions", "Missing actions"],
        rows: report.coverage.channels.items.map((entry) => [
          renderCode(entry.channel),
          renderStatusPill(entry.state),
          renderChipList(entry.coveredActions, "None"),
          renderChipList(entry.missingActions, "None")
        ]),
        emptyMessage: "No channels were present in the normalized async report."
      })
    },
    {
      id: "operation-coverage",
      title: "Operation coverage",
      summary: "Stable async operation truth, including message-contract selection details and covered suites.",
      content: renderTable({
        caption: "Coverage by async operation",
        headers: ["Operation", "Operation state", "Message contract", "Contract state", "Suites"],
        rows: report.coverage.operations.items.map((entry) => [
          renderOperationCell(entry.operationKey, entry.channel, entry.action),
          renderStatusPill(entry.operation.state),
          renderMessageContractCell(entry.messageContract),
          renderStatusPill(entry.messageContract.state),
          renderChipList(entry.suites)
        ]),
        emptyMessage: "No async operations were present in the normalized report."
      })
    },
    {
      id: "message-coverage",
      title: "Message coverage",
      summary: "Declared async message truth derived from canonical operation and message coverage arrays.",
      content: renderTable({
        caption: "Coverage by async message",
        headers: ["Operation", "Message", "State", "Suites"],
        rows: report.coverage.messages.items.map((entry) => [
          renderOperationCell(entry.operationKey, entry.channel, entry.action),
          renderCode(entry.message),
          renderStatusPill(entry.state),
          renderChipList(entry.suites)
        ]),
        emptyMessage: "No async messages were present in the normalized report."
      })
    },
    {
      id: "diagnostics",
      title: "Diagnostics",
      summary: "Schema-safe async diagnostics without payload dumps, raw headers, or credential values.",
      content: renderStack([
        renderTable({
          caption: "Async diagnostic counts",
          headers: [
            "Unsupported content type",
            "Unsupported schema format",
            "Missing payload",
            "Invalid payload",
            "Missing header",
            "Unavailable header",
            "Invalid header",
            "Unverifiable headers",
            "Ambiguous",
            "Mismatched",
            "Unmatched"
          ],
          rows: [[
            escapeHtml(formatNumber(report.diagnostics.counts["unsupported-content-type"])),
            escapeHtml(formatNumber(report.diagnostics.counts["unsupported-schema-format"])),
            escapeHtml(formatNumber(report.diagnostics.counts["missing-payload"])),
            escapeHtml(formatNumber(report.diagnostics.counts["invalid-payload"])),
            escapeHtml(formatNumber(report.diagnostics.counts["missing-header"])),
            escapeHtml(formatNumber(report.diagnostics.counts["unavailable-header"])),
            escapeHtml(formatNumber(report.diagnostics.counts["invalid-header"])),
            escapeHtml(formatNumber(report.diagnostics.counts["unverifiable-headers"])),
            escapeHtml(formatNumber(report.diagnostics.counts.ambiguous)),
            escapeHtml(formatNumber(report.diagnostics.counts.mismatched)),
            escapeHtml(formatNumber(report.diagnostics.counts.unmatched))
          ]]
        }),
        renderTable({
          caption: "Async diagnostics",
          headers: ["Kind", "Scope", "Schema or contract", "Observed truth", "Message"],
          rows: report.diagnostics.items.map((item) => [
            renderCode(item.kind),
            renderDiagnosticScope(item),
            renderDiagnosticSubject(item),
            renderDiagnosticObservedTruth(item),
            escapeHtml(item.message)
          ]),
          emptyMessage: "No async diagnostics were present in the normalized report."
        })
      ])
    }
  ];

  return renderHtmlDocument({
    title: "Yanote async report",
    heading: "Yanote async report",
    summary: "Offline HTML artifact derived from the same normalized canonical truth as yanote-async-report.json.",
    sections
  });
}

function renderOperationCell(operationKey: string, channel: string, action: string): string {
  return `<div class="cell-stack"><strong>${escapeHtml(action)} ${escapeHtml(channel)}</strong><span class="muted">${renderCode(
    operationKey
  )}</span></div>`;
}

function renderMessageContractCell(
  contract: AsyncYanoteReport["coverage"]["operations"]["items"][number]["messageContract"]
): string {
  const blocks = [
    `<div><strong>Name:</strong> ${contract.name ? renderCode(contract.name) : escapeHtml("N/A")}</div>`,
    `<div><strong>Selection:</strong> ${escapeHtml(contract.selectionMode ?? "N/A")}</div>`
  ];

  if (contract.declaredMessages) {
    blocks.push(`<div><strong>Declared:</strong> ${escapeHtml(contract.declaredMessages.join(", ") || "none")}</div>`);
  }

  if (contract.selectedMessages) {
    blocks.push(`<div><strong>Selected:</strong> ${escapeHtml(contract.selectedMessages.join(", ") || "none")}</div>`);
  }

  return `<div class="cell-stack">${blocks.join("")}</div>`;
}

function renderDiagnosticScope(item: AsyncYanoteReport["diagnostics"]["items"][number]): string {
  const label = `${item.action} ${item.channel}`;
  const operationKey = "operationKey" in item ? item.operationKey : undefined;

  return `<div class="cell-stack"><strong>${escapeHtml(label)}</strong>${
    operationKey ? `<span class="muted">${renderCode(operationKey)}</span>` : ""
  }</div>`;
}

function renderDiagnosticSubject(item: AsyncYanoteReport["diagnostics"]["items"][number]): string {
  const values = [
    "schemaId" in item ? item.schemaId : undefined,
    "messageName" in item ? item.messageName : undefined,
    "expectedMessage" in item ? item.expectedMessage : undefined,
    "observedMessage" in item ? item.observedMessage : undefined
  ].filter((value): value is string => Boolean(value));

  if ("candidates" in item) {
    values.push(...item.candidates);
  }

  return values.length > 0 ? renderChipList(values, "None") : escapeHtml("None");
}

function renderDiagnosticObservedTruth(item: AsyncYanoteReport["diagnostics"]["items"][number]): string {
  const details = [
    "validationKind" in item ? `validation=${item.validationKind}` : undefined,
    "pointer" in item && item.pointer ? `pointer=${item.pointer}` : undefined,
    "reason" in item && item.reason ? `reason=${item.reason}` : undefined
  ].filter((value): value is string => Boolean(value));

  return escapeHtml(details.join("; ") || "None");
}
