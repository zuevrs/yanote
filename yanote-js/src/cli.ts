import { Command, CommanderError } from "commander";
import {
  compareRegressionAgainstBaseline,
  createBaselineSnapshot,
  readBaseline,
  type BaselineDimensionsSnapshot,
  writeBaseline
} from "./baseline/baseline.js";
import { computeCoverage, type CoverageResult } from "./coverage/coverage.js";
import { readHttpEventsJsonl } from "./events/readJsonl.js";
import { applyExclusionRules, compileExclusionRules, type ExclusionApplicationResult } from "./gates/exclusions.js";
import { evaluateGateFailures } from "./gates/evaluator.js";
import {
  selectPrimaryFailure,
  sortFailuresByPrecedence,
  type FailureClass,
  type GovernanceFailure
} from "./gates/failureOrder.js";
import { resolveGatePolicy, type GateProfile } from "./gates/policy.js";
import { buildReport, type YanoteReport } from "./report/report.js";
import { writeYanoteReport } from "./report/writeReport.js";
import { discoverSpecs } from "./spec/discover.js";
import { loadOpenApiCoverageModel } from "./spec/openapi.js";
import { TOOL_VERSION } from "./version.js";

export type CliResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type CliFailure = GovernanceFailure;

type SummaryIssue = {
  severityRank: number;
  severityLabel: "high" | "medium" | "low";
  sortKey: string;
  text: string;
};

const EXIT = {
  INPUT: 2,
  GATE_THRESHOLD: 3,
  GATE_REGRESSION: 4,
  SEMANTIC: 5,
  RUNTIME: 6
} as const;

class CliFailureError extends Error {
  constructor(public readonly failure: CliFailure) {
    super(failure.reason);
  }
}

function createProgram(io?: { out?: (chunk: string) => void; err?: (chunk: string) => void }) {
  const writeOut = io?.out ?? (() => {});
  const writeErr = io?.err ?? (() => {});

  const program = new Command();
  program.name("yanote");
  program.version(TOOL_VERSION);

  program.exitOverride();
  program.configureOutput({
    writeOut,
    writeErr
  });

  program
    .command("report")
    .description("Compute deterministic operation coverage from OpenAPI and events.jsonl")
    .requiredOption("--spec <path>", "Spec file or directory (OpenAPI)")
    .requiredOption("--events <path>", "Path to events.jsonl")
    .requiredOption("--out <dir>", "Output directory")
    .option("--policy <path>", "Gate policy YAML file path")
    .option("--profile <profile>", "Gate profile (ci|local)")
    .option("--min-coverage <percent>", "Minimum operation coverage percent")
    .option("--min-aggregate <percent>", "Minimum aggregate coverage percent when aggregate gate is enabled")
    .option("--critical-operation <operationKey...>", "Critical operation key(s), repeatable")
    .option("--baseline <path>", "Baseline file path")
    .option("--update-baseline <path>", "Write baseline v2 snapshot explicitly")
    .option("--fail-on-regression", "Fail if coverage regressed vs baseline", false)
    .option("--exclude <pattern...>", "Exclude route patterns (repeatable)")
    .option("--verbose", "Print additional issue details", false)
    .action(async (opts: any) => {
      await executeReportCommand(opts, writeOut, writeErr);
    });

  return program;
}

async function executeReportCommand(opts: any, writeOut: (chunk: string) => void, writeErr: (chunk: string) => void): Promise<void> {
  let coverage: CoverageResult | undefined;
  let report: YanoteReport | undefined;
  let reportPath: string | undefined;
  let summaryIssues: SummaryIssue[] = [];
  const failureCandidates: CliFailure[] = [];

  try {
    const minCoverage = parsePercentOption(opts.minCoverage, "--min-coverage", "INPUT_MIN_COVERAGE_INVALID");
    const minAggregate = parsePercentOption(opts.minAggregate, "--min-aggregate", "INPUT_MIN_AGGREGATE_INVALID");
    const criticalOperations = parseStringList(opts.criticalOperation);
    const profile = parseProfile(opts.profile);

    const policy = await loadPolicy({
      profile,
      policyPath: opts.policy,
      cliOverrides: {
        minCoverage,
        minAggregate,
        failOnRegression: Boolean(opts.failOnRegression),
        excludePatterns: parseStringList(opts.exclude),
        criticalOperations
      }
    });

    const { openapi } = await discoverSpecs(opts.spec);
    if (!openapi) {
      throw new CliFailureError(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_SPEC_NOT_FOUND",
          "No OpenAPI spec found.",
          "Provide --spec with a valid OpenAPI file or directory."
        )
      );
    }

    const openapiModel = await loadCoverageModel(openapi);
    const events = await loadEvents(opts.events);
    if (events.invalidLines > 0) {
      const lineInfo =
        events.invalidLineNumbers.length > 0 ? ` at line(s) ${events.invalidLineNumbers.join(",")}` : "";
      failureCandidates.push(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_EVENTS_INVALID_LINES",
          `${events.invalidLines} invalid JSONL line(s) detected${lineInfo}.`,
          "Fix malformed events evidence and rerun report."
        )
      );
    }

    const compiledExclusions = compileExclusionRules(policy.exclusions.rules);
    const exclusionResult = applyExclusionRules(openapiModel.operations, compiledExclusions, {
      criticalOperationKeys: policy.thresholds.criticalOperations
    });
    summaryIssues = [...summaryIssues, ...toExclusionSummaryIssues(exclusionResult)];

    coverage = computeCoverage(exclusionResult.includedOperations, events.items, [], {
      operationContractsByKey: openapiModel.operationContractsByKey
    });

    let regressionComparison:
      | ReturnType<typeof compareRegressionAgainstBaseline>
      | undefined;
    if (opts.baseline) {
      const baseline = await loadBaseline(String(opts.baseline));
      regressionComparison = compareRegressionAgainstBaseline({
        baseline,
        currentCovered: coverage.coveredOperations,
        currentOperations: coverage.allOperations,
        currentDimensions: toBaselineDimensions(coverage)
      });
    }

    const gateDiagnostics = evaluateGateFailures({
      coverage,
      policy,
      comparison: regressionComparison
    });
    for (const diagnostic of gateDiagnostics) {
      if (diagnostic.severity === "error") {
        failureCandidates.push(diagnostic);
      } else {
        summaryIssues.push(toSummaryIssueFromFailure(diagnostic));
      }
    }

    report = buildReport(coverage, {
      toolVersion: TOOL_VERSION,
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number"),
      governance: {
        exclusions: {
          appliedRules: exclusionResult.appliedExclusions,
          unmatchedRules: exclusionResult.unmatchedRules
        },
        diagnostics: gateDiagnostics
      }
    });

    try {
      reportPath = await writeYanoteReport(opts.out, report);
    } catch (error) {
      failureCandidates.push(classifyFailure(error));
    }

    if (report.status === "invalid") {
      failureCandidates.push(
        makeFailure(
          EXIT.SEMANTIC,
          "semantic",
          "SEMANTIC_FAIL_CLOSED",
          "Semantic diagnostics require fail-closed exit.",
          "Resolve invalid or ambiguous operation semantics, then rerun report."
        )
      );
    }

    const primaryNow = selectPrimaryFailure(failureCandidates);
    if (!primaryNow && coverage && opts.updateBaseline) {
      await writeBaseline(
        String(opts.updateBaseline),
        createBaselineSnapshot({
          coveredOperations: coverage.coveredOperations,
          dimensions: toBaselineDimensions(coverage),
          generatedAt: report.generatedAt
        })
      );
    }
  } catch (error) {
    failureCandidates.push(classifyFailure(error));
  }

  const orderedFailures = sortFailuresByPrecedence(failureCandidates);
  const primaryFailure = selectPrimaryFailure(orderedFailures);
  const secondaryFailures = primaryFailure
    ? orderedFailures.filter((failure) => failure.severity === "error" && failure !== primaryFailure)
    : [];

  const summary = formatSummaryOutput({
    report,
    coverage,
    reportPath,
    failures: orderedFailures,
    extraIssues: summaryIssues,
    verbose: Boolean(opts.verbose)
  });
  writeOut(summary);

  if (primaryFailure) {
    writeErr(formatFailureOutput(primaryFailure, secondaryFailures));
    throw new CommanderError(primaryFailure.exitCode, primaryFailure.code, primaryFailure.reason);
  }
}

async function loadCoverageModel(specPath: string) {
  try {
    return await loadOpenApiCoverageModel(specPath);
  } catch (error) {
    if (error instanceof Error && error.message.includes("semantic extraction failed")) {
      throw new CliFailureError(
        makeFailure(
          EXIT.SEMANTIC,
          "semantic",
          "SEMANTIC_SPEC_INVALID",
          "OpenAPI semantic extraction failed.",
          "Fix invalid OpenAPI operations and rerun coverage analysis."
        )
      );
    }

    if (isFsInputError(error)) {
      throw new CliFailureError(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_SPEC_READ_FAILED",
          fsErrorReason(error, "Unable to read OpenAPI spec."),
          "Check --spec path and file permissions."
        )
      );
    }

    throw error;
  }
}

async function loadEvents(eventsPath: string) {
  try {
    return await readHttpEventsJsonl(eventsPath);
  } catch (error) {
    if (isFsInputError(error)) {
      throw new CliFailureError(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_EVENTS_READ_FAILED",
          fsErrorReason(error, "Unable to read events file."),
          "Check --events path and ensure the file is readable JSONL."
        )
      );
    }

    throw error;
  }
}

async function loadBaselineFromPath(baselinePath: string) {
  try {
    return await readBaseline(baselinePath);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Incompatible baseline format")) {
      throw new CliFailureError(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_BASELINE_INVALID",
          "Baseline file format is incompatible.",
          "Regenerate baseline via --update-baseline with current analyzer version."
        )
      );
    }

    if (isFsInputError(error)) {
      throw new CliFailureError(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_BASELINE_READ_FAILED",
          fsErrorReason(error, "Unable to read baseline file."),
          "Check --baseline path and file permissions."
        )
      );
    }

    throw error;
  }
}

async function loadPolicy(input: {
  profile?: GateProfile;
  policyPath?: string;
  cliOverrides?: {
    minCoverage?: number;
    minAggregate?: number;
    failOnRegression?: boolean;
    excludePatterns?: string[];
    criticalOperations?: string[];
  };
}) {
  try {
    return await resolveGatePolicy({
      defaultProfile: "ci",
      profile: input.profile,
      policyPath: input.policyPath,
      cliOverrides: input.cliOverrides
    });
  } catch (error) {
    if (isFsInputError(error)) {
      throw new CliFailureError(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_POLICY_READ_FAILED",
          fsErrorReason(error, "Unable to read policy file."),
          "Check --policy path and file permissions."
        )
      );
    }

    if (error instanceof Error && (error.message.includes("Invalid policy YAML") || error.message.includes("Invalid gate policy config"))) {
      throw new CliFailureError(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_POLICY_INVALID",
          "Policy file is invalid.",
          "Fix policy YAML shape and rerun."
        )
      );
    }

    throw error;
  }
}

async function loadBaseline(baselinePath: string) {
  return loadBaselineFromPath(baselinePath);
}

function parsePercentOption(raw: unknown, optionName: string, code: string): number | undefined {
  if (raw == null) return undefined;
  const parsed = Number.parseFloat(String(raw));
  if (!Number.isFinite(parsed)) {
    throw new CliFailureError(
      makeFailure(EXIT.INPUT, "input", code, `${optionName} must be a number.`, `Use values like ${optionName} 80.`)
    );
  }
  if (parsed < 0 || parsed > 100) {
    throw new CliFailureError(
      makeFailure(
        EXIT.INPUT,
        "input",
        code,
        `${optionName} must be between 0 and 100.`,
        `Use values like ${optionName} 95.`
      )
    );
  }
  return parsed;
}

function parseProfile(raw: unknown): GateProfile | undefined {
  if (raw == null) return undefined;
  if (raw === "ci" || raw === "local") return raw;
  throw new CliFailureError(
    makeFailure(
      EXIT.INPUT,
      "input",
      "INPUT_PROFILE_INVALID",
      "--profile must be either ci or local.",
      "Use values like --profile ci."
    )
  );
}

function parseStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((value) => String(value).trim()).filter((value) => value.length > 0);
}

function classifyFailure(error: unknown): CliFailure {
  if (error instanceof CliFailureError) {
    return error.failure;
  }

  if (error instanceof CommanderError) {
    return makeFailure(EXIT.RUNTIME, "runtime", "RUNTIME_COMMANDER", error.message, "Rerun with --verbose for details.");
  }

  if (isFsRuntimeError(error)) {
    return makeFailure(
      EXIT.RUNTIME,
      "runtime",
      "RUNTIME_REPORT_WRITE_FAILED",
      fsErrorReason(error, "Unable to write report artifact."),
      "Check --out path permissions and available disk space."
    );
  }

  if (error instanceof Error) {
    return makeFailure(
      EXIT.RUNTIME,
      "runtime",
      "RUNTIME_UNEXPECTED",
      error.message,
      "Inspect stderr details and rerun with deterministic inputs."
    );
  }

  return makeFailure(
    EXIT.RUNTIME,
    "runtime",
    "RUNTIME_UNKNOWN",
    String(error),
    "Inspect stderr details and rerun with deterministic inputs."
  );
}

function formatSummaryOutput(input: {
  report?: YanoteReport;
  coverage?: CoverageResult;
  reportPath?: string;
  failures: CliFailure[];
  extraIssues: SummaryIssue[];
  verbose: boolean;
}): string {
  const primaryFailure = selectPrimaryFailure(input.failures);
  const status = input.report?.status ?? (primaryFailure ? "invalid" : "ok");
  const summary = input.report?.summary;
  const dimensions = input.report?.coverage;

  const totalOperations = summary?.totalOperations ?? 0;
  const coveredOperations = summary?.coveredOperations ?? 0;

  const issues = collectIssues(input.report, input.coverage, input.failures, input.extraIssues);
  const maxIssues = input.verbose ? issues.length : 5;
  const shownIssues = issues.slice(0, maxIssues);
  const hiddenCount = Math.max(0, issues.length - shownIssues.length);

  const lines: string[] = [];
  lines.push("Summary");
  lines.push(`- status: ${status}`);
  lines.push(`- operations: ${coveredOperations}/${totalOperations} (${formatPercent(summary?.operationCoveragePercent ?? null)})`);

  lines.push("");
  lines.push("Coverage Dimensions");
  lines.push(`- operations: ${formatPercent(dimensions?.operations.percent ?? null)} (${dimensions?.operations.state ?? "N/A"})`);
  lines.push(`- status: ${formatPercent(dimensions?.status.percent ?? null)} (${dimensions?.status.state ?? "N/A"})`);
  lines.push(`- parameters: ${formatPercent(dimensions?.parameters.percent ?? null)} (${dimensions?.parameters.state ?? "N/A"})`);

  const aggregateInfo = dimensions?.aggregate.explanation ? `; ${dimensions.aggregate.explanation}` : "";
  lines.push(
    `- aggregate: ${formatPercent(dimensions?.aggregate.percent ?? null)} (${dimensions?.aggregate.state ?? "N/A"})${aggregateInfo}`
  );

  lines.push("");
  lines.push("Top Issues");
  if (shownIssues.length === 0) {
    lines.push("- none");
  } else {
    for (const issue of shownIssues) {
      lines.push(`- ${issue.severityLabel}: ${issue.text}`);
    }
  }
  if (hiddenCount > 0) {
    lines.push(`... +${hiddenCount} more; see report`);
  }

  lines.push("");
  lines.push("Report Path");
  lines.push(input.reportPath ?? "none");

  lines.push("");
  lines.push(
    [
      "YANOTE_SUMMARY",
      `status=${status}`,
      `operations=${formatMachinePercent(summary?.operationCoveragePercent ?? null)}`,
      `status_dimension=${formatMachinePercent(dimensions?.status.percent ?? null)}`,
      `parameters=${formatMachinePercent(dimensions?.parameters.percent ?? null)}`,
      `aggregate=${formatMachinePercent(dimensions?.aggregate.percent ?? null)}`,
      `covered=${coveredOperations}/${totalOperations}`,
      `diagnostics=${input.report?.diagnostics.items.length ?? 0}`,
      `report=${input.reportPath ?? "none"}`,
      `primary=${primaryFailure?.code ?? "none"}`,
      `class_counts=${formatClassCounts(input.failures)}`
    ].join(" ")
  );

  return `${lines.join("\n")}\n`;
}

function collectIssues(
  report: YanoteReport | undefined,
  coverage: CoverageResult | undefined,
  failures: CliFailure[],
  extraIssues: SummaryIssue[]
): SummaryIssue[] {
  const issues: SummaryIssue[] = [...extraIssues];

  if (report) {
    for (const diagnostic of report.diagnostics.items) {
      const severity = diagnosticSeverity(diagnostic.kind);
      const key = `${diagnostic.method ?? ""} ${diagnostic.route ?? ""}`.trim();
      const candidates = diagnostic.candidates?.length ? ` candidates=[${diagnostic.candidates.join(",")}]` : "";
      issues.push({
        severityRank: severity.rank,
        severityLabel: severity.label,
        sortKey: `diag:${key}`,
        text: `${key || "<global>"} - ${diagnostic.message}${candidates}`
      });
    }
  }

  if (coverage) {
    for (const entry of coverage.perOperation.filter((item) => item.operation.state === "UNCOVERED")) {
      issues.push({
        severityRank: 2,
        severityLabel: "low",
        sortKey: `coverage:${entry.operationKey}`,
        text: `${entry.operationKey} - operation is uncovered`
      });
    }
  }

  for (const failure of failures.filter((item) => item.severity === "error")) {
    issues.push({
      severityRank: 0,
      severityLabel: "high",
      sortKey: `failure:${failure.failureClass}:${failure.code}:${failure.operationKey ?? ""}`,
      text: `${failure.code} - ${failure.reason}`
    });
  }

  return issues.sort((left, right) => {
    const severity = left.severityRank - right.severityRank;
    if (severity !== 0) return severity;
    if (left.sortKey !== right.sortKey) return left.sortKey.localeCompare(right.sortKey);
    return left.text.localeCompare(right.text);
  });
}

function toExclusionSummaryIssues(result: ExclusionApplicationResult): SummaryIssue[] {
  const issues: SummaryIssue[] = [];

  for (const rule of result.unmatchedRules) {
    issues.push({
      severityRank: 2,
      severityLabel: "low",
      sortKey: `exclude:unmatched:${rule.pattern}`,
      text: `${rule.pattern} - unmatched exclusion rule (${rule.owner}, ${rule.expiresOn})`
    });
  }

  for (const diagnostic of result.diagnostics) {
    issues.push({
      severityRank: 1,
      severityLabel: "medium",
      sortKey: `exclude:diagnostic:${diagnostic}`,
      text: diagnostic
    });
  }

  return issues;
}

function toSummaryIssueFromFailure(failure: CliFailure): SummaryIssue {
  const label = failure.severity === "error" ? "high" : "medium";
  const rank = failure.severity === "error" ? 0 : 1;
  return {
    severityRank: rank,
    severityLabel: label,
    sortKey: `failure:${failure.failureClass}:${failure.code}:${failure.operationKey ?? ""}`,
    text: `${failure.code} - ${failure.reason}`
  };
}

function diagnosticSeverity(kind: "invalid" | "ambiguous" | "unmatched"): { rank: number; label: "high" | "medium" | "low" } {
  if (kind === "invalid") return { rank: 0, label: "high" };
  if (kind === "ambiguous") return { rank: 1, label: "medium" };
  return { rank: 2, label: "low" };
}

function formatFailureOutput(primaryFailure: CliFailure, secondaryFailures: CliFailure[]): string {
  const lines = [formatFailureLine("YANOTE_ERROR", primaryFailure)];
  for (const failure of secondaryFailures) {
    lines.push(formatFailureLine("YANOTE_ERROR_SECONDARY", failure));
  }
  return `${lines.join("\n")}\n`;
}

function formatFailureLine(prefix: string, failure: CliFailure): string {
  return `${prefix} class=${failure.failureClass} code=${failure.code} reason=${quote(failure.reason)} hint=${quote(failure.hint)}`;
}

function makeFailure(
  exitCode: number,
  failureClass: FailureClass,
  code: string,
  reason: string,
  hint: string
): CliFailure {
  return {
    exitCode,
    failureClass,
    code,
    reason,
    hint,
    severity: "error"
  };
}

function quote(value: string): string {
  return `"${value.replace(/"/g, "'")}"`;
}

function formatPercent(value: number | null): string {
  if (value == null) return "N/A";
  return `${value.toFixed(2)}%`;
}

function formatMachinePercent(value: number | null): string {
  if (value == null) return "NA";
  return value.toFixed(2);
}

function formatClassCounts(failures: CliFailure[]): string {
  const counts: Record<FailureClass, number> = {
    input: 0,
    semantic: 0,
    gate: 0,
    runtime: 0
  };
  for (const failure of failures) {
    if (failure.severity !== "error") continue;
    counts[failure.failureClass] += 1;
  }
  return `input:${counts.input},semantic:${counts.semantic},gate:${counts.gate},runtime:${counts.runtime}`;
}

function fsErrorReason(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof (error as any).message === "string") {
    return (error as any).message;
  }
  return fallback;
}

function isFsInputError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as any).code;
  return code === "ENOENT" || code === "ENOTDIR" || code === "EACCES";
}

function isFsRuntimeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as any).code;
  return code === "EACCES" || code === "ENOSPC" || code === "EROFS" || code === "ENOTDIR";
}

function toBaselineDimensions(coverage: CoverageResult): BaselineDimensionsSnapshot {
  return {
    operations: coverage.allOperations.length > 0 ? (coverage.coveredOperations.length / coverage.allOperations.length) * 100 : null,
    status: (() => {
      let declared = 0;
      let covered = 0;
      for (const entry of coverage.perOperation) {
        declared += entry.status.declaredStatuses.length;
        covered += entry.status.coveredStatuses.length;
      }
      return declared > 0 ? (covered / declared) * 100 : null;
    })(),
    parameters: (() => {
      let declared = 0;
      let covered = 0;
      for (const entry of coverage.perOperation) {
        declared += entry.parameters.required.total;
        covered += entry.parameters.required.covered;
      }
      return declared > 0 ? (covered / declared) * 100 : null;
    })(),
    aggregate: coverage.dimensions.aggregate.percent
  };
}

export async function runCli(argv: string[]): Promise<CliResult> {
  let stdout = "";
  let stderr = "";

  const program = createProgram({
    out: (chunk) => {
      stdout += chunk;
    },
    err: (chunk) => {
      stderr += chunk;
    }
  });

  try {
    await program.parseAsync(argv, { from: "user" });
    return { code: 0, stdout, stderr };
  } catch (error) {
    if (error instanceof CommanderError) {
      return { code: error.exitCode, stdout, stderr };
    }

    stderr += formatFailureOutput(
      makeFailure(
        EXIT.RUNTIME,
        "runtime",
        "RUNTIME_UNCAUGHT",
        error instanceof Error ? error.message : String(error),
        "Inspect stderr and rerun with deterministic inputs."
      ),
      []
    );
    return { code: EXIT.RUNTIME, stdout, stderr };
  }
}
