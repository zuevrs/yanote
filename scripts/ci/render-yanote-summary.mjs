#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_MAX_ISSUES = 5;

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

function parseYanoteErrorLine(stderrText) {
  if (!stderrText) return null;
  const line = stderrText
    .split("\n")
    .find((item) => item.startsWith("YANOTE_ERROR "));
  if (!line) return null;

  const codeMatch = line.match(/\bcode=([A-Z0-9_]+)/);
  const reasonMatch = line.match(/\breason="([^"]+)"/);
  if (!codeMatch || !reasonMatch) return null;
  return `${codeMatch[1]} - ${reasonMatch[1]}`;
}

function collectIssues(report) {
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

function resolvePrimaryFailure(report, issues, stderrText, exitCode) {
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

export async function renderSummary(input) {
  const reportPath = input?.reportPath;
  if (!reportPath) {
    throw new Error("Unable to read report file: --report path is required.");
  }

  let reportRaw;
  try {
    reportRaw = await readFile(reportPath, "utf8");
  } catch (error) {
    throw new Error(`Unable to read report file at ${reportPath}: ${safeString(error?.message, "unknown read failure")}`);
  }

  let report;
  try {
    report = JSON.parse(reportRaw);
  } catch (error) {
    throw new Error(`Unable to parse report JSON at ${reportPath}: ${safeString(error?.message, "invalid JSON")}`);
  }

  let stderrText = "";
  if (input?.stderrPath) {
    try {
      stderrText = await readFile(input.stderrPath, "utf8");
    } catch {
      stderrText = "";
    }
  }

  const maxIssues = Number.isFinite(Number(input?.maxIssues))
    ? Math.max(1, Number(input.maxIssues))
    : DEFAULT_MAX_ISSUES;
  const issues = collectIssues(report);
  const shownIssues = issues.slice(0, maxIssues);
  const hiddenCount = Math.max(0, issues.length - shownIssues.length);
  const exitCode = Number.isFinite(Number(input?.exitCode)) ? Number(input.exitCode) : 0;
  const primaryFailure = resolvePrimaryFailure(report, issues, stderrText, exitCode);
  const artifactNames = await listArtifactNames(input?.artifactsDir);

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
  lines.push("");

  const markdown = `${lines.join("\n")}\n`;
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
        "  node scripts/ci/render-yanote-summary.mjs --report <path> [--stderr <path>] [--artifacts-dir <path>] [--output <path>] [--max-issues <n>] [--exit-code <n>]"
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
