import { Command, CommanderError } from "commander";
import { computeCoverage, type CoverageResult } from "./coverage/coverage.js";
import { readHttpEventsJsonl } from "./events/readJsonl.js";
import { computeRegression, readBaseline } from "./baseline/baseline.js";
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

type FailureClass = "input" | "semantic" | "gate" | "runtime";

type CliFailure = {
  exitCode: number;
  failureClass: FailureClass;
  code: string;
  reason: string;
  hint: string;
};

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
    .option("--min-coverage <percent>", "Minimum operation coverage percent (integer)")
    .option("--baseline <path>", "Baseline file path")
    .option("--fail-on-regression", "Fail if coverage regressed vs baseline", false)
    .option("--exclude <pattern...>", "Exclude route patterns (repeatable)")
    .option("--verbose", "Print additional issue details", false)
    .action(async (opts: any) => {
      let coverage: CoverageResult | undefined;
      let report: YanoteReport | undefined;
      let reportPath: string | undefined;
      let failure: CliFailure | undefined;

      try {
        const minCoverage = parseMinCoverage(opts.minCoverage);

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
        const excludePatterns: string[] = Array.isArray(opts.exclude) ? opts.exclude : [];

        coverage = computeCoverage(openapiModel.operations, events.items, excludePatterns, {
          operationContractsByKey: openapiModel.operationContractsByKey
        });

        report = buildReport(coverage, {
          toolVersion: TOOL_VERSION,
          eventTimestamps: events.items
            .map((event) => event.ts)
            .filter((timestamp): timestamp is number => typeof timestamp === "number")
        });

        reportPath = await writeYanoteReport(opts.out, report);

        if (report.status === "invalid") {
          failure = makeFailure(
            EXIT.SEMANTIC,
            "semantic",
            "SEMANTIC_FAIL_CLOSED",
            "Semantic diagnostics require fail-closed exit.",
            "Resolve invalid or ambiguous operation semantics, then rerun report."
          );
        }

        if (!failure && opts.baseline) {
          const baseline = await loadBaseline(opts.baseline);
          const regressed = computeRegression(baseline, coverage.coveredOperations);
          if (regressed.length > 0 && opts.failOnRegression) {
            failure = makeFailure(
              EXIT.GATE_REGRESSION,
              "gate",
              "GATE_REGRESSION",
              `Coverage regressed for ${regressed.length} previously covered operation(s).`,
              "Update tests or baseline to restore covered operations before merging."
            );
          }
        }

        if (!failure && minCoverage != null && report.summary.operationCoveragePercent < minCoverage) {
          failure = makeFailure(
            EXIT.GATE_THRESHOLD,
            "gate",
            "GATE_MIN_COVERAGE",
            `Operation coverage ${report.summary.operationCoveragePercent}% is below required ${minCoverage}%.`,
            "Increase endpoint coverage or lower --min-coverage threshold intentionally."
          );
        }
      } catch (error) {
        failure = classifyFailure(error);
      }

      const summary = formatSummaryOutput({
        report,
        coverage,
        reportPath,
        failure,
        verbose: Boolean(opts.verbose)
      });
      writeOut(summary);

      if (failure) {
        writeErr(formatFailureOutput(failure));
        throw new CommanderError(failure.exitCode, failure.code, failure.reason);
      }
    });

  return program;
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

async function loadBaseline(baselinePath: string) {
  try {
    return await readBaseline(baselinePath);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid baseline format")) {
      throw new CliFailureError(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_BASELINE_INVALID",
          "Baseline file format is invalid.",
          "Provide a baseline JSON file with format=1 and covered operations list."
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

function parseMinCoverage(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  const parsed = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(parsed)) {
    throw new CliFailureError(
      makeFailure(
        EXIT.INPUT,
        "input",
        "INPUT_MIN_COVERAGE_INVALID",
        "--min-coverage must be an integer.",
        "Use values like --min-coverage 80."
      )
    );
  }
  return parsed;
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
  failure?: CliFailure;
  verbose: boolean;
}): string {
  const status = input.report?.status ?? "invalid";
  const summary = input.report?.summary;
  const dimensions = input.report?.coverage;

  const totalOperations = summary?.totalOperations ?? 0;
  const coveredOperations = summary?.coveredOperations ?? 0;

  const issues = collectIssues(input.report, input.coverage, input.failure);
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
      `report=${input.reportPath ?? "none"}`
    ].join(" ")
  );

  return `${lines.join("\n")}\n`;
}

function collectIssues(report: YanoteReport | undefined, coverage: CoverageResult | undefined, failure: CliFailure | undefined): SummaryIssue[] {
  const issues: SummaryIssue[] = [];

  if (report) {
    for (const diagnostic of report.diagnostics.items) {
      const severity = diagnosticSeverity(diagnostic.kind);
      const key = `${diagnostic.method ?? ""} ${diagnostic.route ?? ""}`.trim();
      const candidates = diagnostic.candidates?.length ? ` candidates=[${diagnostic.candidates.join(",")}]` : "";
      issues.push({
        severityRank: severity.rank,
        severityLabel: severity.label,
        sortKey: key,
        text: `${key || "<global>"} - ${diagnostic.message}${candidates}`
      });
    }
  }

  if (coverage) {
    for (const entry of coverage.perOperation.filter((item) => item.operation.state === "UNCOVERED")) {
      issues.push({
        severityRank: 2,
        severityLabel: "low",
        sortKey: entry.operationKey,
        text: `${entry.operationKey} - operation is uncovered`
      });
    }
  }

  if (!report && failure) {
    issues.push({
      severityRank: 0,
      severityLabel: "high",
      sortKey: failure.code,
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

function diagnosticSeverity(kind: "invalid" | "ambiguous" | "unmatched"): { rank: number; label: "high" | "medium" | "low" } {
  if (kind === "invalid") return { rank: 0, label: "high" };
  if (kind === "ambiguous") return { rank: 1, label: "medium" };
  return { rank: 2, label: "low" };
}

function formatFailureOutput(failure: CliFailure): string {
  return `YANOTE_ERROR class=${failure.failureClass} code=${failure.code} reason=${quote(failure.reason)} hint=${quote(failure.hint)}\n`;
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
    hint
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
      )
    );
    return { code: EXIT.RUNTIME, stdout, stderr };
  }
}
