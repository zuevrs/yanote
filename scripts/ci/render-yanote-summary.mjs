#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_MAX_ISSUES = 5;
const ASYNC_REPORT_BASENAME = "yanote-async-report.json";
const COMBINED_REPORT_BASENAME = "yanote-combined-report.json";
const ASYNC_DIAGNOSTIC_CODE_BY_KIND = {
  "unsupported-content-type": "ASYNC_SEMANTIC_UNSUPPORTED_CONTENT_TYPE",
  "unsupported-schema-format": "ASYNC_SEMANTIC_UNSUPPORTED_SCHEMA_FORMAT",
  "missing-payload": "ASYNC_SEMANTIC_MISSING_PAYLOAD",
  "invalid-payload": "ASYNC_SEMANTIC_INVALID_PAYLOAD",
  "unverifiable-headers": "ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS",
  mismatched: "ASYNC_SEMANTIC_MESSAGE_MISMATCH",
  unmatched: "ASYNC_SEMANTIC_UNMATCHED_EVIDENCE"
};
const ASYNC_DIAGNOSTIC_PRECEDENCE = {
  "unsupported-content-type": 1,
  "unsupported-schema-format": 2,
  "missing-payload": 3,
  "invalid-payload": 4,
  "unverifiable-headers": 5,
  mismatched: 6,
  unmatched: 7
};

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "N/A";
  }
  return `${Number(value).toFixed(2)}%`;
}

function safeString(value, fallback = "unknown") {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function sanitizeSpecSourceReference(value) {
  const reference = safeString(value, "none");
  if (reference === "none") {
    return reference;
  }

  try {
    const url = new URL(reference);
    if (url.protocol === "http:" || url.protocol === "https:") {
      url.username = "";
      url.password = "";
      url.search = "";
      url.hash = "";
      return url.toString();
    }
  } catch {
    // Non-URL references should pass through unchanged.
  }

  return reference;
}

function formatSpecSource(report) {
  const specSource = report?.specSource ?? {};
  const kind = safeString(specSource.kind, "none");
  const reference = sanitizeSpecSourceReference(specSource.reference);

  if (reference === "none") {
    return kind;
  }

  return `${kind} (${reference})`;
}

function formatDeprecatedOperations(report) {
  const deprecated = report?.summary?.deprecatedOperations ?? {};
  const totalOperations = Number(deprecated.totalOperations ?? 0);
  const coveredOperations = Number(deprecated.coveredOperations ?? 0);
  const uncoveredOperations = Number(deprecated.uncoveredOperations ?? 0);
  const operationCoveragePercent = totalOperations > 0
    ? Number(deprecated.operationCoveragePercent ?? 0)
    : null;

  return `covered=${coveredOperations}/${totalOperations} uncovered=${uncoveredOperations} (${formatPercent(operationCoveragePercent)})`;
}

function formatNamedArtifactStatuses(expectedArtifactNames, artifactNames) {
  const presentArtifacts = new Set(artifactNames);
  return expectedArtifactNames
    .map((name) => `${name} (${presentArtifacts.has(name) ? "present" : "missing"})`)
    .join(", ");
}

function parseKeyValuePayload(payload) {
  const parsed = {};
  const matcher = /([A-Za-z0-9_]+)=("[^"]*"|\S+)/g;

  for (const match of payload.matchAll(matcher)) {
    const key = match[1];
    const rawValue = match[2] ?? "";
    parsed[key] = rawValue.startsWith('"') && rawValue.endsWith('"')
      ? rawValue.slice(1, -1)
      : rawValue;
  }

  return parsed;
}

function parseFailureLine(line, primaryPrefix, secondaryPrefix) {
  if (line.startsWith(`${primaryPrefix} `)) {
    const fields = parseKeyValuePayload(line.slice(primaryPrefix.length + 1));
    return {
      kind: "primary",
      failureClass: safeString(fields.class),
      code: safeString(fields.code),
      reason: safeString(fields.reason),
      text: `${safeString(fields.code)} - ${safeString(fields.reason)}`
    };
  }

  if (line.startsWith(`${secondaryPrefix} `)) {
    const fields = parseKeyValuePayload(line.slice(secondaryPrefix.length + 1));
    return {
      kind: "secondary",
      failureClass: safeString(fields.class),
      code: safeString(fields.code),
      reason: safeString(fields.reason),
      text: `${safeString(fields.code)} - ${safeString(fields.reason)}`
    };
  }

  return null;
}

function parseTypedFailures(text, primaryPrefix, secondaryPrefix) {
  if (!text) return [];

  const seen = new Set();
  const failures = [];
  for (const line of text.split("\n")) {
    const parsed = parseFailureLine(line.trim(), primaryPrefix, secondaryPrefix);
    if (!parsed) continue;

    const dedupeKey = `${parsed.kind}:${parsed.failureClass}:${parsed.code}:${parsed.reason}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    failures.push(parsed);
  }

  return failures;
}

function parseYanoteErrorLine(stderrText) {
  const failures = parseTypedFailures(stderrText, "YANOTE_ERROR", "YANOTE_ERROR_SECONDARY");
  return failures[0]?.text ?? null;
}

function findMachineLine(text, prefix) {
  if (!text) return null;
  const lines = text.split("\n");
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index].trim();
    if (line.startsWith(`${prefix} `)) {
      return parseKeyValuePayload(line.slice(prefix.length + 1));
    }
  }
  return null;
}

function isAsyncReportShape(report) {
  return Boolean(
    report?.phase?.slug === "async-report-and-gate-surface" ||
      report?.summary?.totalChannels != null ||
      report?.summary?.coveredMessages != null ||
      report?.coverage?.channels ||
      report?.coverage?.messages
  );
}

function isAsyncContext({ report, reportPath, stdoutText, stderrText }) {
  if (report && isAsyncReportShape(report)) {
    return true;
  }

  if (path.basename(reportPath ?? "") === ASYNC_REPORT_BASENAME) {
    return true;
  }

  return stdoutText.includes("YANOTE_ASYNC_") || stderrText.includes("YANOTE_ASYNC_");
}

function isCombinedReportShape(report) {
  return Boolean(report?.overview?.childStatuses && report?.children?.http && report?.children?.async);
}

function isCombinedContext({ report, reportPath, stdoutText, stderrText }) {
  if (report && isCombinedReportShape(report)) {
    return true;
  }

  if (path.basename(reportPath ?? "") === COMBINED_REPORT_BASENAME) {
    return true;
  }

  return stdoutText.includes("YANOTE_COMBINED_") || stderrText.includes("YANOTE_COMBINED_");
}

function parseEqualsFile(text) {
  const parsed = {};
  if (!text) {
    return parsed;
  }

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    parsed[key] = value;
  }

  return parsed;
}

function parseCsvSet(value) {
  return new Set(
    String(value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item !== "none")
  );
}

function resolveArtifactMetadataValue(artifactMetadata, keys) {
  for (const key of keys) {
    const value = artifactMetadata?.manifest?.[key] ?? artifactMetadata?.sourcePaths?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "none";
}

function isRabbitMqArtifactsDir(artifactsDir, reportPath) {
  return [artifactsDir, reportPath].some((value) => typeof value === "string" && value.includes("live-rabbitmq-proof"));
}

function formatProtocolList(protocols) {
  return Array.isArray(protocols) && protocols.length > 0 ? protocols.join(", ") : "none";
}

function formatOptionalArtifactStatuses(expectedArtifactNames, artifactNames, optionalArtifacts = new Set()) {
  const presentArtifacts = new Set(artifactNames);
  return expectedArtifactNames
    .map((name) => {
      if (presentArtifacts.has(name)) {
        return `${name} (present)`;
      }
      if (optionalArtifacts.has(name)) {
        return `${name} (optional missing)`;
      }
      return `${name} (missing)`;
    })
    .join(", ");
}

async function loadArtifactMetadata(artifactsDir) {
  if (!artifactsDir) {
    return {
      manifest: {},
      sourcePaths: {},
      optionalArtifacts: new Set()
    };
  }

  const manifest = parseEqualsFile(await readOptionalText(path.join(artifactsDir, "artifact-manifest.txt")));
  const sourcePaths = parseEqualsFile(await readOptionalText(path.join(artifactsDir, "artifact-source-paths.txt")));

  return {
    manifest,
    sourcePaths,
    optionalArtifacts: new Set([
      ...parseCsvSet(manifest.optional_artifacts),
      ...parseCsvSet(sourcePaths.optional_artifacts)
    ])
  };
}

function collectHttpIssues(report) {
  const issues = [];

  for (const diagnostic of report.governance?.diagnostics ?? []) {
    const severity = diagnostic.severity === "error" ? "high" : "medium";
    issues.push({
      severityRank: severity === "high" ? 0 : 1,
      categoryRank: 0,
      severity,
      sortKey: `${safeString(diagnostic.class)}:${safeString(diagnostic.code)}:${safeString(diagnostic.operationKey, "")}`,
      text: `${safeString(diagnostic.code)} - ${safeString(diagnostic.message)}`
    });
  }

  for (const diagnostic of report.diagnostics?.items ?? []) {
    const kind = safeString(diagnostic.kind);
    const severity = kind === "invalid" ? "high" : kind === "ambiguous" ? "medium" : "low";
    const severityRank = severity === "high" ? 0 : severity === "medium" ? 1 : 2;
    const routeKey = `${safeString(diagnostic.method, "").toUpperCase()} ${safeString(diagnostic.route, "<global>")}`.trim();
    issues.push({
      severityRank,
      categoryRank: 1,
      severity,
      sortKey: `${kind}:${routeKey}:${safeString(diagnostic.message)}`,
      text: `${routeKey} - ${safeString(diagnostic.message)}`
    });
  }

  for (const entry of report.coverage?.perOperation ?? []) {
    if (entry?.operation?.state !== "UNCOVERED") {
      continue;
    }
    const operationKey = safeString(entry.operationKey);
    issues.push({
      severityRank: 2,
      categoryRank: 2,
      severity: "low",
      sortKey: operationKey,
      text: `${operationKey} - operation is uncovered`
    });
  }

  return sortAndDedupeIssues(issues);
}

function resolveHttpPrimaryFailure(report, issues, stderrText, exitCode) {
  if (!Number.isFinite(exitCode) || exitCode === 0) {
    return "none";
  }

  const governanceError = (report.governance?.diagnostics ?? []).find((item) => item.severity === "error");
  if (governanceError) {
    return `${safeString(governanceError.code)} - ${safeString(governanceError.message)}`;
  }

  const firstHighIssue = issues.find((issue) => issue.severity === "high");
  if (firstHighIssue) {
    return firstHighIssue.text;
  }

  const stderrFailure = parseYanoteErrorLine(stderrText);
  if (stderrFailure) {
    return stderrFailure;
  }

  return `RUNTIME_EXIT - command exited with code ${exitCode}`;
}

function sortAndDedupeIssues(issues) {
  return issues
    .sort((left, right) => {
      if (left.severityRank !== right.severityRank) {
        return left.severityRank - right.severityRank;
      }
      if (left.categoryRank !== right.categoryRank) {
        return left.categoryRank - right.categoryRank;
      }
      if (left.sortKey !== right.sortKey) {
        return left.sortKey.localeCompare(right.sortKey);
      }
      return left.text.localeCompare(right.text);
    })
    .filter((issue, index, all) => index === 0 || issue.text !== all[index - 1].text);
}

function parseMachinePercent(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  if (!normalized || normalized === "NA" || normalized === "N/A" || normalized === "none") {
    return null;
  }
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseCoveredRatio(value) {
  const match = String(value ?? "").trim().match(/^(\d+)\/(\d+)$/);
  if (!match) {
    return { covered: 0, total: 0 };
  }
  return {
    covered: Number(match[1]),
    total: Number(match[2])
  };
}

function hasHttpSecuritySummary(report) {
  const summary = report?.httpSecurityConformance?.summary;
  if (!summary) {
    return false;
  }

  return Number(summary.declaredOperations ?? 0) > 0 || Number(summary.observedOperations ?? 0) > 0 || Number(summary.observedEvaluations ?? 0) > 0;
}

function formatHttpSecurityObservationSummary(report) {
  const summary = report?.httpSecurityConformance?.summary;
  if (!summary) {
    return "declared=0 observed_operations=0 evaluations=0";
  }

  return `declared=${Number(summary.declaredOperations ?? 0)} observed_operations=${Number(summary.observedOperations ?? 0)} evaluations=${Number(summary.observedEvaluations ?? 0)}`;
}

function formatHttpSecurityTruthSummary(report) {
  const counts = report?.httpSecurityConformance?.summary?.counts;
  if (!counts) {
    return "satisfied=0 missing=0 unavailable=0 unsupported=0 optional=0 clear=0";
  }

  return [
    `satisfied=${Number(counts.satisfied ?? 0)}`,
    `missing=${Number(counts.missing ?? 0)}`,
    `unavailable=${Number(counts.unavailable ?? 0)}`,
    `unsupported=${Number(counts.unsupported ?? 0)}`,
    `optional=${Number(counts.optional ?? 0)}`,
    `clear=${Number(counts.clear ?? 0)}`
  ].join(" ");
}

function asyncDiagnosticPrecedence(kind) {
  return ASYNC_DIAGNOSTIC_PRECEDENCE[safeString(kind)] ?? 100;
}

function asyncDiagnosticIdentity(diagnostic) {
  if (typeof diagnostic?.operationKey === "string" && diagnostic.operationKey.trim().length > 0) {
    return diagnostic.operationKey.trim();
  }

  return `${safeString(diagnostic?.action)} ${safeString(diagnostic?.channel)}`;
}

function compareAsyncDiagnostics(left, right) {
  const precedence = asyncDiagnosticPrecedence(left?.kind) - asyncDiagnosticPrecedence(right?.kind);
  if (precedence !== 0) {
    return precedence;
  }

  const leftIdentity = asyncDiagnosticIdentity(left);
  const rightIdentity = asyncDiagnosticIdentity(right);
  if (leftIdentity !== rightIdentity) {
    return leftIdentity.localeCompare(rightIdentity);
  }

  const leftMessage = safeString(left?.message, "");
  const rightMessage = safeString(right?.message, "");
  if (leftMessage !== rightMessage) {
    return leftMessage.localeCompare(rightMessage);
  }

  return safeString(left?.reason, "").localeCompare(safeString(right?.reason, ""));
}

function formatAsyncOperation(operationKey) {
  return `Async evidence ${operationKey}`;
}

function formatAsyncSchemaId(schemaId) {
  return schemaId ?? "(unknown-schema)";
}

function formatAsyncPointer(pointer) {
  if (!pointer) {
    return "";
  }

  return ` at ${pointer}`;
}

function formatAsyncDiagnosticIssueText(diagnostic) {
  const actionChannel = `${safeString(diagnostic?.action)} ${safeString(diagnostic?.channel)}`;
  const schema = diagnostic?.schemaId ? ` schema=${diagnostic.schemaId}` : "";
  const pointer = diagnostic?.pointer ? ` pointer=${diagnostic.pointer}` : "";

  switch (diagnostic?.kind) {
    case "unsupported-content-type":
    case "unsupported-schema-format":
    case "missing-payload":
    case "invalid-payload":
    case "unverifiable-headers":
      return `${asyncDiagnosticIdentity(diagnostic)} - ${safeString(diagnostic.kind)}${schema}${pointer} reason=${safeString(
        diagnostic.reason
      )}`;
    case "mismatched":
      return `${actionChannel} - mismatched expected=${safeString(diagnostic.expectedMessage)} observed=${safeString(
        diagnostic.observedMessage
      )} reason=${safeString(diagnostic.message)}`;
    case "unmatched":
      return `${actionChannel} - unmatched reason=${safeString(diagnostic.message)}`;
    default:
      return `${actionChannel} - ${safeString(diagnostic?.message)}`;
  }
}

function formatAsyncFailureReasonFromDiagnostic(diagnostic) {
  switch (diagnostic?.kind) {
    case "unsupported-content-type":
      return `${formatAsyncOperation(asyncDiagnosticIdentity(diagnostic))} cannot validate payload schema ${formatAsyncSchemaId(
        diagnostic.schemaId
      )} because ${safeString(diagnostic.reason)}`;
    case "unsupported-schema-format":
      return `${formatAsyncOperation(asyncDiagnosticIdentity(diagnostic))} cannot validate payload schema ${formatAsyncSchemaId(
        diagnostic.schemaId
      )} because ${safeString(diagnostic.reason)}`;
    case "missing-payload":
      return `${formatAsyncOperation(asyncDiagnosticIdentity(diagnostic))} is missing payload required by schema ${formatAsyncSchemaId(
        diagnostic.schemaId
      )}${formatAsyncPointer(diagnostic.pointer)}: ${safeString(diagnostic.reason)}`;
    case "invalid-payload":
      return `${formatAsyncOperation(asyncDiagnosticIdentity(diagnostic))} failed payload validation against schema ${formatAsyncSchemaId(
        diagnostic.schemaId
      )}${formatAsyncPointer(diagnostic.pointer)}: ${safeString(diagnostic.reason)}`;
    case "unverifiable-headers":
      return `${formatAsyncOperation(asyncDiagnosticIdentity(diagnostic))} cannot verify header schema ${formatAsyncSchemaId(
        diagnostic.schemaId
      )}: ${safeString(diagnostic.reason)}`;
    case "mismatched":
      return `Observed async evidence ${safeString(diagnostic.action)} ${safeString(diagnostic.channel)} reported message ${safeString(
        diagnostic.observedMessage,
        "(unknown)"
      )}, expected ${safeString(diagnostic.expectedMessage, "(unknown)")}.`;
    case "unmatched":
      return `Observed async evidence ${safeString(diagnostic.action)} ${safeString(
        diagnostic.channel
      )} did not match any canonical AsyncAPI operation.`;
    default:
      return safeString(diagnostic?.message);
  }
}

function synthesizeAsyncFailuresFromReport(report, exitCode) {
  if (!report || !Number.isFinite(exitCode) || exitCode === 0) {
    return [];
  }

  return [...(report.diagnostics?.items ?? [])].sort(compareAsyncDiagnostics).map((diagnostic, index) => {
    const code = ASYNC_DIAGNOSTIC_CODE_BY_KIND[safeString(diagnostic.kind)] ?? "ASYNC_SEMANTIC_UNKNOWN";
    const reason = formatAsyncFailureReasonFromDiagnostic(diagnostic);
    return {
      kind: index === 0 ? "primary" : "secondary",
      failureClass: "semantic",
      code,
      reason,
      text: `${code} - ${reason}`
    };
  });
}

function countAsyncSemanticDiagnostics(report) {
  if (!report) {
    return 0;
  }

  if (Array.isArray(report.diagnostics?.items)) {
    return report.diagnostics.items.length;
  }

  return Object.values(report.diagnostics?.counts ?? {}).reduce((total, value) => {
    const numeric = Number(value);
    return total + (Number.isFinite(numeric) ? numeric : 0);
  }, 0);
}

function formatAsyncClassCounts(failures, machineSummary, report, exitCode) {
  if (machineSummary?.class_counts) {
    return safeString(machineSummary.class_counts, "input:0,semantic:0,gate:0,runtime:0");
  }

  const counts = {
    input: 0,
    semantic: 0,
    gate: 0,
    runtime: 0
  };

  for (const failure of failures) {
    if (Object.prototype.hasOwnProperty.call(counts, failure.failureClass)) {
      counts[failure.failureClass] += 1;
    }
  }

  const semanticCountFromReport = countAsyncSemanticDiagnostics(report);
  if (
    semanticCountFromReport > counts.semantic &&
    counts.input === 0 &&
    counts.gate === 0 &&
    counts.runtime === 0
  ) {
    counts.semantic = semanticCountFromReport;
  }

  const countedFailures = counts.input + counts.semantic + counts.gate + counts.runtime;
  if (countedFailures === 0 && Number.isFinite(exitCode) && exitCode !== 0) {
    counts.runtime = 1;
  }

  return `input:${counts.input},semantic:${counts.semantic},gate:${counts.gate},runtime:${counts.runtime}`;
}

function resolveAsyncReportName(report, reportPath, machineSummary) {
  if (report) {
    return path.basename(reportPath ?? ASYNC_REPORT_BASENAME);
  }

  const machineReport = safeString(machineSummary?.report, "none");
  if (machineReport === "none") {
    return "none";
  }

  return path.basename(machineReport);
}

function resolveAsyncSummarySource(report, machineSummary, failures) {
  if (report) {
    return "report file";
  }

  if (machineSummary || failures.length > 0) {
    return "YANOTE_ASYNC_* fallback";
  }

  return "exit-code fallback";
}

function collectAsyncIssues(report, failures, fallbackPrimaryFailure, options = {}) {
  const issues = [];

  failures.forEach((failure, index) => {
    if (options.omitSecondaryFailures === true && failure.kind !== "primary") {
      return;
    }

    issues.push({
      severityRank: failure.kind === "primary" ? 0 : 1,
      categoryRank: 0,
      severity: failure.kind === "primary" ? "high" : "medium",
      sortKey: `failure:${failure.kind}:${failure.failureClass}:${failure.code}:${String(index).padStart(2, "0")}`,
      text: failure.text
    });
  });

  for (const diagnostic of [...(report?.diagnostics?.items ?? [])].sort(compareAsyncDiagnostics)) {
    issues.push({
      severityRank: 1,
      categoryRank: 1,
      severity: "medium",
      sortKey: `diagnostic:${String(asyncDiagnosticPrecedence(diagnostic.kind)).padStart(2, "0")}:${asyncDiagnosticIdentity(
        diagnostic
      )}:${safeString(diagnostic.kind)}`,
      text: formatAsyncDiagnosticIssueText(diagnostic)
    });
  }

  for (const entry of report?.coverage?.channels?.items ?? []) {
    if (entry.state !== "UNCOVERED") continue;
    issues.push({
      severityRank: 2,
      categoryRank: 2,
      severity: "low",
      sortKey: `channel:${safeString(entry.channel)}`,
      text: `${safeString(entry.channel)} - channel is uncovered`
    });
  }

  for (const entry of report?.coverage?.operations?.items ?? []) {
    if (entry.operation?.state !== "UNCOVERED") continue;
    issues.push({
      severityRank: 2,
      categoryRank: 3,
      severity: "low",
      sortKey: `operation:${safeString(entry.operationKey)}`,
      text: `${safeString(entry.operationKey)} - async operation is uncovered`
    });
  }

  for (const entry of report?.coverage?.messages?.items ?? []) {
    if (entry.state !== "UNCOVERED") continue;
    issues.push({
      severityRank: 2,
      categoryRank: 4,
      severity: "low",
      sortKey: `message:${safeString(entry.operationKey)}:${safeString(entry.message)}`,
      text: `${safeString(entry.operationKey)} - async message ${safeString(entry.message)} is uncovered`
    });
  }

  if (issues.length === 0 && fallbackPrimaryFailure !== "none") {
    issues.push({
      severityRank: 0,
      categoryRank: 0,
      severity: "high",
      sortKey: `fallback:${fallbackPrimaryFailure}`,
      text: fallbackPrimaryFailure
    });
  }

  return sortAndDedupeIssues(issues);
}

function resolveAsyncPrimaryFailure(issues, machineSummary, failures, exitCode) {
  if (!Number.isFinite(exitCode) || exitCode === 0) {
    return "none";
  }

  const primaryFailure = failures.find((failure) => failure.kind === "primary") ?? failures[0];
  if (primaryFailure) {
    return primaryFailure.text;
  }

  const firstHighIssue = issues.find((issue) => issue.severity === "high");
  if (firstHighIssue) {
    return firstHighIssue.text;
  }

  const machinePrimaryReason = typeof machineSummary?.primary_reason === "string" ? machineSummary.primary_reason.trim() : "";
  if (machineSummary?.primary && machineSummary.primary !== "none") {
    if (machinePrimaryReason && machinePrimaryReason !== "none") {
      return `${safeString(machineSummary.primary)} - ${machinePrimaryReason}`;
    }
    return `${safeString(machineSummary.primary)} - see async proof logs`;
  }

  if (machineSummary?.report === "none") {
    return `RUNTIME_EXIT - command exited with code ${exitCode} before async report was written`;
  }

  return `RUNTIME_EXIT - command exited with code ${exitCode}`;
}

function buildAsyncMetrics(report, machineSummary) {
  return {
    channels: {
      covered: report?.summary?.coveredChannels ?? parseCoveredRatio(machineSummary?.covered_channels).covered,
      total: report?.summary?.totalChannels ?? parseCoveredRatio(machineSummary?.covered_channels).total,
      percent: report?.summary?.channelCoveragePercent ?? parseMachinePercent(machineSummary?.channels),
      state: safeString(report?.coverage?.channels?.state, "N/A")
    },
    operations: {
      covered: report?.summary?.coveredOperations ?? parseCoveredRatio(machineSummary?.covered_operations).covered,
      total: report?.summary?.totalOperations ?? parseCoveredRatio(machineSummary?.covered_operations).total,
      percent: report?.summary?.operationCoveragePercent ?? parseMachinePercent(machineSummary?.operations),
      state: safeString(report?.coverage?.operations?.state, "N/A")
    },
    messages: {
      covered: report?.summary?.coveredMessages ?? parseCoveredRatio(machineSummary?.covered_messages).covered,
      total: report?.summary?.totalMessages ?? parseCoveredRatio(machineSummary?.covered_messages).total,
      percent: report?.summary?.messageCoveragePercent ?? parseMachinePercent(machineSummary?.messages),
      state: safeString(report?.coverage?.messages?.state, "N/A")
    }
  };
}

function resolveAsyncProtocols(report) {
  if (!Array.isArray(report?.protocols)) {
    return [];
  }

  return report.protocols
    .map((protocol) => safeString(protocol, ""))
    .filter((protocol) => protocol.length > 0 && protocol !== "unknown");
}

function validateAsyncNumericFields(report, reportPath, artifactsDir) {
  if (!report) {
    return;
  }

  const requiredNumericFields = [
    ["summary.coveredChannels", report?.summary?.coveredChannels],
    ["summary.totalChannels", report?.summary?.totalChannels],
    ["summary.coveredOperations", report?.summary?.coveredOperations],
    ["summary.totalOperations", report?.summary?.totalOperations],
    ["summary.coveredMessages", report?.summary?.coveredMessages],
    ["summary.totalMessages", report?.summary?.totalMessages],
    ["bindingSupport.summary.supportedBindings", report?.bindingSupport?.summary?.supportedBindings],
    ["bindingSupport.summary.totalBindings", report?.bindingSupport?.summary?.totalBindings],
    ["bindingSupport.summary.declaredOnlyBindings", report?.bindingSupport?.summary?.declaredOnlyBindings],
    ["bindingSupport.summary.deferredBindings", report?.bindingSupport?.summary?.deferredBindings],
    ["bindingSupport.summary.invalidBindings", report?.bindingSupport?.summary?.invalidBindings],
    ["bindingSupport.summary.totalOperations", report?.bindingSupport?.summary?.totalOperations],
    ["declaredSemantics.summary.messageCorrelationIds", report?.declaredSemantics?.summary?.messageCorrelationIds],
    ["declaredSemantics.summary.operationsWithCorrelationId", report?.declaredSemantics?.summary?.operationsWithCorrelationId],
    ["declaredSemantics.summary.operationsWithReply", report?.declaredSemantics?.summary?.operationsWithReply],
    ["declaredSemantics.summary.totalOperations", report?.declaredSemantics?.summary?.totalOperations],
    ["runtimeSemantics.summary.satisfiedOperations", report?.runtimeSemantics?.summary?.satisfiedOperations],
    ["runtimeSemantics.summary.totalOperations", report?.runtimeSemantics?.summary?.totalOperations],
    ["runtimeSemantics.summary.satisfiedSemantics", report?.runtimeSemantics?.summary?.satisfiedSemantics],
    ["runtimeSemantics.summary.totalSemantics", report?.runtimeSemantics?.summary?.totalSemantics],
    ["runtimeSemantics.summary.semanticCoveragePercent", report?.runtimeSemantics?.summary?.semanticCoveragePercent],
    ["runtimeSemantics.summary.unsatisfiedOperations", report?.runtimeSemantics?.summary?.unsatisfiedOperations],
    ["runtimeSemantics.summary.unsatisfiedSemantics", report?.runtimeSemantics?.summary?.unsatisfiedSemantics]
  ];

  const invalidFields = requiredNumericFields
    .filter(([, value]) => !Number.isFinite(Number(value)))
    .map(([field]) => field);

  if (invalidFields.length > 0) {
    throw new Error(
      `Invalid async summary inputs at ${reportPath}: missing or non-numeric ${invalidFields.join(", ")}`
    );
  }

  if (isRabbitMqArtifactsDir(artifactsDir, reportPath) && !resolveAsyncProtocols(report).includes("amqp")) {
    throw new Error(`Invalid async summary inputs at ${reportPath}: missing protocols metadata for amqp bundle`);
  }
}

function validateAsyncArtifactFamily(report, reportPath, artifactNames, artifactsDirProvided, artifactMetadata) {
  if (!report || !artifactsDirProvided) {
    return;
  }

  const requiredArtifacts = ["yanote-async-report.json", "yanote-async-report.html"];
  const optionalArtifacts = artifactMetadata?.optionalArtifacts ?? new Set();
  const sourcePaths = artifactMetadata?.sourcePaths ?? {};
  const presentArtifacts = new Set(artifactNames);
  const missingArtifacts = requiredArtifacts.filter((name) => !presentArtifacts.has(name));

  const companionArtifacts = [
    "runtime-selected-yanote-async-report.json",
    "runtime-selected-yanote-async-report.html",
    "schema-failure-yanote-async-report.json",
    "schema-failure-yanote-async-report.html"
  ];

  for (const artifactName of companionArtifacts) {
    if (presentArtifacts.has(artifactName)) {
      continue;
    }

    const explicitlyOptional = optionalArtifacts.has(artifactName) && safeString(sourcePaths[artifactName], "none") === "none";
    if (!explicitlyOptional) {
      missingArtifacts.push(artifactName);
    }
  }

  if (missingArtifacts.length > 0) {
    throw new Error(
      `Invalid async artifact bundle at ${reportPath}: missing ${missingArtifacts.join(", ")}`
    );
  }
}

function buildAsyncSemanticMetrics(report) {
  return {
    bindingSupport: {
      supportedBindings: Number(report?.bindingSupport?.summary?.supportedBindings ?? 0),
      totalBindings: Number(report?.bindingSupport?.summary?.totalBindings ?? 0),
      declaredOnlyBindings: Number(report?.bindingSupport?.summary?.declaredOnlyBindings ?? 0),
      deferredBindings: Number(report?.bindingSupport?.summary?.deferredBindings ?? 0),
      invalidBindings: Number(report?.bindingSupport?.summary?.invalidBindings ?? 0),
      totalOperations: Number(report?.bindingSupport?.summary?.totalOperations ?? 0)
    },
    declaredSemantics: {
      messageCorrelationIds: Number(report?.declaredSemantics?.summary?.messageCorrelationIds ?? 0),
      operationsWithCorrelationId: Number(report?.declaredSemantics?.summary?.operationsWithCorrelationId ?? 0),
      operationsWithReply: Number(report?.declaredSemantics?.summary?.operationsWithReply ?? 0),
      totalOperations: Number(report?.declaredSemantics?.summary?.totalOperations ?? 0)
    },
    runtimeSemantics: {
      satisfiedOperations: Number(report?.runtimeSemantics?.summary?.satisfiedOperations ?? 0),
      totalOperations: Number(report?.runtimeSemantics?.summary?.totalOperations ?? 0),
      satisfiedSemantics: Number(report?.runtimeSemantics?.summary?.satisfiedSemantics ?? 0),
      totalSemantics: Number(report?.runtimeSemantics?.summary?.totalSemantics ?? 0),
      semanticCoveragePercent: Number(report?.runtimeSemantics?.summary?.semanticCoveragePercent ?? 0),
      unsatisfiedOperations: Number(report?.runtimeSemantics?.summary?.unsatisfiedOperations ?? 0),
      unsatisfiedSemantics: Number(report?.runtimeSemantics?.summary?.unsatisfiedSemantics ?? 0)
    }
  };
}

function formatAsyncBindingSupportSummary(metrics, report) {
  if (!report) {
    return "unavailable (report missing)";
  }

  return `supported=${metrics.supportedBindings}/${metrics.totalBindings} declared_only=${metrics.declaredOnlyBindings} deferred=${metrics.deferredBindings} invalid=${metrics.invalidBindings} operations=${metrics.totalOperations}`;
}

function formatAsyncDeclaredSemanticsSummary(metrics, report) {
  if (!report) {
    return "unavailable (report missing)";
  }

  return `correlation_operations=${metrics.operationsWithCorrelationId}/${metrics.totalOperations} reply_operations=${metrics.operationsWithReply}/${metrics.totalOperations} message_correlation_ids=${metrics.messageCorrelationIds}`;
}

function formatAsyncRuntimeSemanticsSummary(metrics, report) {
  if (!report) {
    return "unavailable (report missing)";
  }

  return `satisfied_operations=${metrics.satisfiedOperations}/${metrics.totalOperations} satisfied_semantics=${metrics.satisfiedSemantics}/${metrics.totalSemantics} unsatisfied_operations=${metrics.unsatisfiedOperations} unsatisfied_semantics=${metrics.unsatisfiedSemantics} (${formatPercent(metrics.semanticCoveragePercent)})`;
}

function findCombinedArtifactPath(child, kind) {
  const artifact = (child?.provenance?.artifacts ?? []).find((entry) => entry?.kind === kind);
  return safeString(artifact?.path, "none");
}

function resolveCombinedAsyncProtocols(report, machineSummary) {
  if (Array.isArray(report?.children?.async?.summary?.protocols)) {
    return report.children.async.summary.protocols
      .map((protocol) => safeString(protocol, ""))
      .filter((protocol) => protocol.length > 0 && protocol !== "unknown");
  }

  return String(machineSummary?.protocols ?? "")
    .split(",")
    .map((protocol) => protocol.trim())
    .filter((protocol) => protocol.length > 0 && protocol !== "none");
}

function validateCombinedSummaryInputs(report, reportPath) {
  if (!report) {
    return;
  }

  const asyncProtocols = resolveCombinedAsyncProtocols(report, null);
  if (!asyncProtocols.includes("amqp")) {
    throw new Error(`Invalid combined summary inputs at ${reportPath}: missing async child protocols metadata for amqp`);
  }

  for (const [childName, child] of Object.entries(report.children ?? {})) {
    for (const kind of ["json", "html"]) {
      const artifactPath = findCombinedArtifactPath(child, kind);
      if (artifactPath === "none") {
        throw new Error(`Invalid combined summary inputs at ${reportPath}: missing ${childName} child ${kind} provenance path`);
      }
    }
  }
}

function validateCombinedArtifactFamily(report, reportPath, artifactNames, artifactsDirProvided, artifactMetadata) {
  if (!report || !artifactsDirProvided) {
    return;
  }

  const requiredArtifacts = [
    "combined-report/out/yanote-combined-report.json",
    "combined-report/out/yanote-combined-report.html",
    "http-report/out/yanote-report.json",
    "http-report/out/yanote-report.html"
  ];
  const presentArtifacts = new Set(artifactNames);
  const missingArtifacts = requiredArtifacts.filter((name) => !presentArtifacts.has(name));

  const metadataRequirements = [
    ["combined report json", ["combined_report_json", "combined_report"]],
    ["combined report html", ["combined_report_html", "combined_html"]],
    ["http child report", ["http_report_json", "generated_http_report"]],
    ["http child html", ["http_report_html", "generated_http_html"]],
    ["async child report", ["retained_async_report"]],
    ["async child html", ["retained_async_html"]]
  ];

  for (const [label, keys] of metadataRequirements) {
    if (resolveArtifactMetadataValue(artifactMetadata, keys) === "none") {
      missingArtifacts.push(label);
    }
  }

  if (missingArtifacts.length > 0) {
    throw new Error(`Invalid combined artifact bundle at ${reportPath}: missing ${missingArtifacts.join(", ")}`);
  }
}

function collectCombinedIssues(report, fallbackPrimaryFailure) {
  const issues = [];

  for (const childName of ["http", "async"]) {
    const child = report?.children?.[childName] ?? {};
    const childStatus = safeString(child.status, "unknown");
    const childIssues = Array.isArray(child.issues) && child.issues.length > 0 ? child.issues : childStatus !== "ok" ? [`status=${childStatus}`] : [];

    for (const issue of childIssues) {
      const severity = childStatus === "invalid" ? "high" : "medium";
      issues.push({
        severityRank: severity === "high" ? 0 : 1,
        categoryRank: childName === "http" ? 0 : 1,
        severity,
        sortKey: `${childName}:${issue}`,
        text: `${childName} - ${issue}`
      });
    }
  }

  if (issues.length === 0 && fallbackPrimaryFailure !== "none") {
    issues.push({
      severityRank: 0,
      categoryRank: 0,
      severity: "high",
      sortKey: `fallback:${fallbackPrimaryFailure}`,
      text: fallbackPrimaryFailure
    });
  }

  return sortAndDedupeIssues(issues);
}

function resolveCombinedPrimaryFailure(issues, stdoutText, stderrText, exitCode) {
  if (!Number.isFinite(exitCode) || exitCode === 0) {
    return "none";
  }

  const failures = [
    ...parseTypedFailures(stderrText, "YANOTE_COMBINED_ERROR", "YANOTE_COMBINED_ERROR_SECONDARY"),
    ...parseTypedFailures(stdoutText, "YANOTE_COMBINED_ERROR", "YANOTE_COMBINED_ERROR_SECONDARY")
  ];
  const primaryFailure = failures.find((failure) => failure.kind === "primary") ?? failures[0];
  if (primaryFailure) {
    return primaryFailure.text;
  }

  const firstHighIssue = issues.find((issue) => issue.severity === "high");
  if (firstHighIssue) {
    return firstHighIssue.text;
  }

  const machineSummary = findMachineLine(stdoutText, "YANOTE_COMBINED_SUMMARY") ?? findMachineLine(stderrText, "YANOTE_COMBINED_SUMMARY");
  if (machineSummary?.primary && machineSummary.primary !== "none") {
    return `${safeString(machineSummary.primary)} - see combined proof logs`;
  }

  return `RUNTIME_EXIT - command exited with code ${exitCode}`;
}

function resolveCombinedSummarySource(report, stdoutText, stderrText) {
  if (report) {
    return "report file";
  }

  const machineSummary = findMachineLine(stdoutText, "YANOTE_COMBINED_SUMMARY") ?? findMachineLine(stderrText, "YANOTE_COMBINED_SUMMARY");
  if (machineSummary) {
    return "YANOTE_COMBINED_* fallback";
  }

  return "exit-code fallback";
}

function renderHttpSummary({ report, reportPath, stderrText, artifactNames, maxIssues, exitCode }) {
  const issues = collectHttpIssues(report);
  const shownIssues = issues.slice(0, maxIssues);
  const hiddenCount = Math.max(0, issues.length - shownIssues.length);
  const primaryFailure = resolveHttpPrimaryFailure(report, issues, stderrText, exitCode);

  const lines = [];
  lines.push("## Yanote Validation Summary");
  lines.push(`- status: ${safeString(report.status)}`);
  lines.push(
    `- operations: ${Number(report.summary?.coveredOperations ?? 0)}/${Number(report.summary?.totalOperations ?? 0)} (${formatPercent(report.summary?.operationCoveragePercent)})`
  );
  lines.push(`- aggregate: ${formatPercent(report.coverage?.aggregate?.percent)} (${safeString(report.coverage?.aggregate?.state, "N/A")})`);
  lines.push(`- status dimension: ${formatPercent(report.coverage?.status?.percent)} (${safeString(report.coverage?.status?.state, "N/A")})`);
  lines.push(`- parameters: ${formatPercent(report.coverage?.parameters?.percent)} (${safeString(report.coverage?.parameters?.state, "N/A")})`);
  lines.push(`- spec source: ${formatSpecSource(report)}`);
  lines.push(`- deprecated operations: ${formatDeprecatedOperations(report)}`);
  lines.push(`- report artifacts: ${formatNamedArtifactStatuses(["yanote-report.json", "yanote-report.html"], artifactNames)}`);
  if (hasHttpSecuritySummary(report)) {
    lines.push(`- security observations: ${formatHttpSecurityObservationSummary(report)}`);
    lines.push(`- security truths: ${formatHttpSecurityTruthSummary(report)}`);
  }
  lines.push(`- primary failure: ${primaryFailure}`);
  lines.push(`- report: ${path.basename(reportPath)}`);
  if (artifactNames.length > 0) {
    lines.push(`- artifacts: ${artifactNames.slice(0, 4).join(", ")}`);
  }
  lines.push("");
  lines.push("### Top Issues");
  if (shownIssues.length === 0) {
    lines.push("1. low: none");
  } else {
    shownIssues.forEach((issue, index) => {
      lines.push(`${index + 1}. ${issue.severity}: ${issue.text}`);
    });
  }
  if (hiddenCount > 0) {
    lines.push(`... +${hiddenCount} more issues in report artifacts`);
  }

  return `${lines.join("\n")}\n`;
}

function renderAsyncSummary({
  report,
  reportPath,
  stdoutText,
  stderrText,
  artifactNames,
  artifactsDirProvided,
  artifactMetadata,
  maxIssues,
  exitCode
}) {
  validateAsyncNumericFields(report, reportPath, artifactMetadata?.artifactsDir);
  validateAsyncArtifactFamily(report, reportPath, artifactNames, artifactsDirProvided, artifactMetadata);

  const parsedFailures = [
    ...parseTypedFailures(stderrText, "YANOTE_ASYNC_ERROR", "YANOTE_ASYNC_ERROR_SECONDARY"),
    ...parseTypedFailures(stdoutText, "YANOTE_ASYNC_ERROR", "YANOTE_ASYNC_ERROR_SECONDARY")
  ];
  const machineSummary = findMachineLine(stdoutText, "YANOTE_ASYNC_SUMMARY") ?? findMachineLine(stderrText, "YANOTE_ASYNC_SUMMARY");
  const synthesizedFailures = parsedFailures.length > 0 ? [] : synthesizeAsyncFailuresFromReport(report, exitCode);
  const failures = parsedFailures.length > 0 ? parsedFailures : synthesizedFailures;
  const fallbackPrimaryFailure = resolveAsyncPrimaryFailure([], machineSummary, failures, exitCode);
  const issues = collectAsyncIssues(report, failures, fallbackPrimaryFailure, {
    omitSecondaryFailures: synthesizedFailures.length > 0
  });
  const shownIssues = issues.slice(0, maxIssues);
  const hiddenCount = Math.max(0, issues.length - shownIssues.length);
  const primaryFailure = resolveAsyncPrimaryFailure(issues, machineSummary, failures, exitCode);
  const metrics = buildAsyncMetrics(report, machineSummary);
  const semanticMetrics = buildAsyncSemanticMetrics(report);
  const classCounts = formatAsyncClassCounts(failures, machineSummary, report, exitCode);
  const reportName = resolveAsyncReportName(report, reportPath, machineSummary);
  const summarySource = resolveAsyncSummarySource(report, machineSummary, failures);
  const status = safeString(report?.status ?? machineSummary?.status, exitCode === 0 ? "ok" : "unknown");
  const protocols = resolveAsyncProtocols(report);

  const lines = [];
  lines.push("## Yanote Async Summary");
  lines.push(`- status: ${status}`);
  lines.push(`- protocols: ${formatProtocolList(protocols)}`);
  lines.push(`- channels: ${metrics.channels.covered}/${metrics.channels.total} (${formatPercent(metrics.channels.percent)})`);
  lines.push(`- operations: ${metrics.operations.covered}/${metrics.operations.total} (${formatPercent(metrics.operations.percent)})`);
  lines.push(`- messages: ${metrics.messages.covered}/${metrics.messages.total} (${formatPercent(metrics.messages.percent)})`);
  lines.push(`- spec source: ${formatSpecSource(report)}`);
  lines.push(
    `- report artifacts: ${formatNamedArtifactStatuses(["yanote-async-report.json", "yanote-async-report.html"], artifactNames)}`
  );
  lines.push(
    `- retained async companions: ${formatOptionalArtifactStatuses([
      "runtime-selected-yanote-async-report.json",
      "runtime-selected-yanote-async-report.html",
      "schema-failure-yanote-async-report.json",
      "schema-failure-yanote-async-report.html"
    ], artifactNames, artifactMetadata?.optionalArtifacts ?? new Set())}`
  );
  lines.push(`- binding support: ${formatAsyncBindingSupportSummary(semanticMetrics.bindingSupport, report)}`);
  lines.push(`- declared semantics: ${formatAsyncDeclaredSemanticsSummary(semanticMetrics.declaredSemantics, report)}`);
  lines.push(`- runtime semantics: ${formatAsyncRuntimeSemanticsSummary(semanticMetrics.runtimeSemantics, report)}`);
  lines.push(`- primary failure: ${primaryFailure}`);
  lines.push(`- class counts: ${classCounts}`);
  lines.push(`- proof exit code: ${exitCode}`);
  lines.push(`- report: ${reportName}`);
  lines.push(`- summary source: ${summarySource}`);
  if (artifactNames.length > 0) {
    lines.push(`- artifacts: ${artifactNames.slice(0, 4).join(", ")}`);
  }
  lines.push("");
  lines.push("### Coverage Dimensions");
  lines.push(`- channels: ${formatPercent(metrics.channels.percent)} (${metrics.channels.state})`);
  lines.push(`- operations: ${formatPercent(metrics.operations.percent)} (${metrics.operations.state})`);
  lines.push(`- messages: ${formatPercent(metrics.messages.percent)} (${metrics.messages.state})`);
  lines.push("");
  lines.push("### Top Issues");
  if (shownIssues.length === 0) {
    lines.push("1. low: none");
  } else {
    shownIssues.forEach((issue, index) => {
      lines.push(`${index + 1}. ${issue.severity}: ${issue.text}`);
    });
  }
  if (hiddenCount > 0) {
    lines.push(`... +${hiddenCount} more issues in async artifacts`);
  }

  return `${lines.join("\n")}\n`;
}

function renderCombinedSummary({
  report,
  reportPath,
  stdoutText,
  stderrText,
  artifactNames,
  artifactsDirProvided,
  artifactMetadata,
  maxIssues,
  exitCode
}) {
  validateCombinedSummaryInputs(report, reportPath);
  validateCombinedArtifactFamily(report, reportPath, artifactNames, artifactsDirProvided, artifactMetadata);

  const primaryFailure = resolveCombinedPrimaryFailure([], stdoutText, stderrText, exitCode);
  const issues = collectCombinedIssues(report, primaryFailure);
  const shownIssues = issues.slice(0, maxIssues);
  const hiddenCount = Math.max(0, issues.length - shownIssues.length);
  const asyncProtocols = resolveCombinedAsyncProtocols(report, null);
  const combinedReportJsonPath = resolveArtifactMetadataValue(artifactMetadata, ["combined_report_json", "combined_report"]);
  const combinedReportHtmlPath = resolveArtifactMetadataValue(artifactMetadata, ["combined_report_html", "combined_html"]);
  const httpChildJsonPath = findCombinedArtifactPath(report?.children?.http, "json");
  const httpChildHtmlPath = findCombinedArtifactPath(report?.children?.http, "html");
  const asyncChildJsonPath = findCombinedArtifactPath(report?.children?.async, "json");
  const asyncChildHtmlPath = findCombinedArtifactPath(report?.children?.async, "html");

  const lines = [];
  lines.push("## Yanote Combined Summary");
  lines.push(`- status: ${safeString(report?.status, exitCode === 0 ? "ok" : "unknown")}`);
  lines.push(
    `- children: ok=${Number(report?.overview?.okChildren ?? 0)}/${Number(report?.overview?.totalChildren ?? 0)} partial=${Number(report?.overview?.partialChildren ?? 0)} invalid=${Number(report?.overview?.invalidChildren ?? 0)}`
  );
  lines.push(`- http child: ${safeString(report?.children?.http?.status, "unknown")}`);
  lines.push(`- async child: ${safeString(report?.children?.async?.status, "unknown")}`);
  lines.push(`- async protocols: ${formatProtocolList(asyncProtocols)}`);
  lines.push(
    `- combined report artifacts: ${formatNamedArtifactStatuses(["combined-report/out/yanote-combined-report.json", "combined-report/out/yanote-combined-report.html"], artifactNames)}`
  );
  lines.push(`- combined report paths: json=${combinedReportJsonPath} html=${combinedReportHtmlPath}`);
  lines.push(`- http child reports: json=${httpChildJsonPath} html=${httpChildHtmlPath}`);
  lines.push(`- async child reports: json=${asyncChildJsonPath} html=${asyncChildHtmlPath}`);
  lines.push(`- primary failure: ${exitCode === 0 ? "none" : resolveCombinedPrimaryFailure(issues, stdoutText, stderrText, exitCode)}`);
  lines.push(`- proof exit code: ${exitCode}`);
  lines.push(`- report: ${path.basename(reportPath)}`);
  lines.push(`- summary source: ${resolveCombinedSummarySource(report, stdoutText, stderrText)}`);
  if (artifactNames.length > 0) {
    lines.push(`- artifacts: ${artifactNames.slice(0, 4).join(", ")}`);
  }
  lines.push("");
  lines.push("### Top Issues");
  if (shownIssues.length === 0) {
    lines.push("1. low: none");
  } else {
    shownIssues.forEach((issue, index) => {
      lines.push(`${index + 1}. ${issue.severity}: ${issue.text}`);
    });
  }
  if (hiddenCount > 0) {
    lines.push(`... +${hiddenCount} more issues in combined artifacts`);
  }

  return `${lines.join("\n")}\n`;
}

async function loadReport(reportPath) {
  if (!reportPath) {
    return { exists: false, report: null, missingError: null };
  }

  let reportRaw;
  try {
    reportRaw = await readFile(reportPath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return { exists: false, report: null, missingError: error };
    }
    throw new Error(`Unable to read report file at ${reportPath}: ${safeString(error?.message, "unknown read failure")}`);
  }

  try {
    return { exists: true, report: JSON.parse(reportRaw), missingError: null };
  } catch (error) {
    throw new Error(`Unable to parse report JSON at ${reportPath}: ${safeString(error?.message, "invalid JSON")}`);
  }
}

async function listArtifactNames(artifactsDir, options = {}) {
  if (!artifactsDir) return [];

  const recursive = options.recursive === true;

  async function walk(currentDir, prefix = "") {
    const entries = await readdir(currentDir, { withFileTypes: true });
    const files = [];
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const relativeName = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await walk(absolutePath, relativeName)));
      } else if (entry.isFile()) {
        files.push(relativeName);
      }
    }
    return files;
  }

  try {
    if (recursive) {
      return await walk(artifactsDir);
    }

    const entries = await readdir(artifactsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

async function readOptionalText(filePath) {
  if (!filePath) return "";
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

export async function renderSummary(input) {
  const stdoutText = await readOptionalText(input?.stdoutPath);
  const stderrText = await readOptionalText(input?.stderrPath);
  const { exists: reportExists, report, missingError } = await loadReport(input?.reportPath);
  const maxIssues = Number.isFinite(Number(input?.maxIssues))
    ? Math.max(1, Number(input.maxIssues))
    : DEFAULT_MAX_ISSUES;
  const exitCode = Number.isFinite(Number(input?.exitCode)) ? Number(input.exitCode) : 0;
  const combinedContext = isCombinedContext({
    report,
    reportPath: input?.reportPath,
    stdoutText,
    stderrText
  });
  const asyncContext = !combinedContext && isAsyncContext({
    report,
    reportPath: input?.reportPath,
    stdoutText,
    stderrText
  });
  const artifactNames = await listArtifactNames(input?.artifactsDir, { recursive: combinedContext });
  const artifactMetadata = {
    ...(await loadArtifactMetadata(input?.artifactsDir)),
    artifactsDir: input?.artifactsDir ?? ""
  };

  if (!reportExists) {
    if (combinedContext) {
      throw new Error(`Invalid combined artifact bundle at ${input.reportPath}: missing yanote-combined-report.json`);
    }

    if (!asyncContext) {
      if (!input?.reportPath) {
        throw new Error("Unable to read report file: provide --report for HTTP summaries or async stderr/stdout logs for async fallback.");
      }
      throw new Error(
        `Unable to read report file at ${input.reportPath}: ${safeString(missingError?.message, "unknown read failure")}`
      );
    }
  }

  const markdown = combinedContext
    ? renderCombinedSummary({
        report,
        reportPath: input?.reportPath,
        stdoutText,
        stderrText,
        artifactNames,
        artifactsDirProvided: Boolean(input?.artifactsDir),
        artifactMetadata,
        maxIssues,
        exitCode
      })
    : asyncContext
      ? renderAsyncSummary({
          report,
          reportPath: input?.reportPath,
          stdoutText,
          stderrText,
          artifactNames,
          artifactsDirProvided: Boolean(input?.artifactsDir),
          artifactMetadata,
          maxIssues,
          exitCode
        })
      : renderHttpSummary({
          report,
          reportPath: input?.reportPath,
          stderrText,
          artifactNames,
          maxIssues,
          exitCode
        });

  if (input?.outputPath) {
    await writeFile(input.outputPath, markdown, "utf8");
  } else {
    process.stdout.write(markdown);
  }

  return markdown;
}

function parseArgs(argv) {
  const parsed = {
    reportPath: "",
    stdoutPath: "",
    stderrPath: "",
    artifactsDir: "",
    outputPath: process.env.GITHUB_STEP_SUMMARY ?? "",
    maxIssues: DEFAULT_MAX_ISSUES,
    exitCode: 0
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (token === "--report" && value) {
      parsed.reportPath = value;
      index += 1;
    } else if (token === "--stdout" && value) {
      parsed.stdoutPath = value;
      index += 1;
    } else if (token === "--stderr" && value) {
      parsed.stderrPath = value;
      index += 1;
    } else if (token === "--artifacts-dir" && value) {
      parsed.artifactsDir = value;
      index += 1;
    } else if (token === "--output" && value) {
      parsed.outputPath = value;
      index += 1;
    } else if (token === "--max-issues" && value) {
      parsed.maxIssues = Number(value);
      index += 1;
    } else if (token === "--exit-code" && value) {
      parsed.exitCode = Number(value);
      index += 1;
    } else if (token === "--help") {
      parsed.help = true;
    }
  }

  return parsed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(
      [
        "Usage:",
        "  node scripts/ci/render-yanote-summary.mjs [--report <path>] [--stdout <path>] [--stderr <path>] [--artifacts-dir <path>] [--output <path>] [--max-issues <n>] [--exit-code <n>]"
      ].join("\n")
    );
    return;
  }

  try {
    await renderSummary(args);
  } catch (error) {
    process.stderr.write(`${safeString(error?.message, "Unknown summary rendering error")}\n`);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
