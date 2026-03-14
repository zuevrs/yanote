#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_MAX_ISSUES = 5;
const ASYNC_REPORT_BASENAME = "yanote-async-report.json";

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

function formatAsyncClassCounts(failures, machineSummary) {
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

function collectAsyncIssues(report, failures, fallbackPrimaryFailure) {
  const issues = [];

  failures.forEach((failure, index) => {
    issues.push({
      severityRank: failure.kind === "primary" ? 0 : 1,
      categoryRank: 0,
      severity: failure.kind === "primary" ? "high" : "medium",
      sortKey: `failure:${failure.kind}:${failure.failureClass}:${failure.code}:${String(index).padStart(2, "0")}`,
      text: failure.text
    });
  });

  for (const diagnostic of report?.diagnostics?.items ?? []) {
    const severity = diagnostic.kind === "mismatched" ? "high" : "medium";
    issues.push({
      severityRank: severity === "high" ? 0 : 1,
      categoryRank: 1,
      severity,
      sortKey: `diagnostic:${diagnostic.kind}:${safeString(diagnostic.action)}:${safeString(diagnostic.channel)}:${safeString(diagnostic.message)}`,
      text: `${safeString(diagnostic.action)} ${safeString(diagnostic.channel)} - ${safeString(diagnostic.message)}`
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

  if (machineSummary?.primary && machineSummary.primary !== "none") {
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

function renderAsyncSummary({ report, reportPath, stdoutText, stderrText, artifactNames, maxIssues, exitCode }) {
  const failures = [
    ...parseTypedFailures(stderrText, "YANOTE_ASYNC_ERROR", "YANOTE_ASYNC_ERROR_SECONDARY"),
    ...parseTypedFailures(stdoutText, "YANOTE_ASYNC_ERROR", "YANOTE_ASYNC_ERROR_SECONDARY")
  ];
  const machineSummary = findMachineLine(stdoutText, "YANOTE_ASYNC_SUMMARY") ?? findMachineLine(stderrText, "YANOTE_ASYNC_SUMMARY");
  const fallbackPrimaryFailure = resolveAsyncPrimaryFailure([], machineSummary, failures, exitCode);
  const issues = collectAsyncIssues(report, failures, fallbackPrimaryFailure);
  const shownIssues = issues.slice(0, maxIssues);
  const hiddenCount = Math.max(0, issues.length - shownIssues.length);
  const primaryFailure = resolveAsyncPrimaryFailure(issues, machineSummary, failures, exitCode);
  const metrics = buildAsyncMetrics(report, machineSummary);
  const classCounts = formatAsyncClassCounts(failures, machineSummary);
  const reportName = resolveAsyncReportName(report, reportPath, machineSummary);
  const summarySource = resolveAsyncSummarySource(report, machineSummary, failures);
  const status = safeString(report?.status ?? machineSummary?.status, exitCode === 0 ? "ok" : "unknown");

  const lines = [];
  lines.push("## Yanote Async Summary");
  lines.push(`- status: ${status}`);
  lines.push(`- channels: ${metrics.channels.covered}/${metrics.channels.total} (${formatPercent(metrics.channels.percent)})`);
  lines.push(`- operations: ${metrics.operations.covered}/${metrics.operations.total} (${formatPercent(metrics.operations.percent)})`);
  lines.push(`- messages: ${metrics.messages.covered}/${metrics.messages.total} (${formatPercent(metrics.messages.percent)})`);
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

async function listArtifactNames(artifactsDir) {
  if (!artifactsDir) return [];
  try {
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
  const artifactNames = await listArtifactNames(input?.artifactsDir);
  const asyncContext = isAsyncContext({
    report,
    reportPath: input?.reportPath,
    stdoutText,
    stderrText
  });

  if (!reportExists && !asyncContext) {
    if (!input?.reportPath) {
      throw new Error("Unable to read report file: provide --report for HTTP summaries or async stderr/stdout logs for async fallback.");
    }
    throw new Error(
      `Unable to read report file at ${input.reportPath}: ${safeString(missingError?.message, "unknown read failure")}`
    );
  }

  const markdown = asyncContext
    ? renderAsyncSummary({
        report,
        reportPath: input?.reportPath,
        stdoutText,
        stderrText,
        artifactNames,
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
