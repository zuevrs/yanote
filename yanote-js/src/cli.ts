import { Command, CommanderError } from "commander";
import {
  compareRegressionAgainstBaseline,
  createBaselineSnapshot,
  readBaseline,
  type BaselineDimensionsSnapshot,
  writeBaseline
} from "./baseline/baseline.js";
import {
  computeAsyncCoverage,
  type AsyncCoverageDiagnostic,
  type AsyncCoverageResult
} from "./coverage/asyncCoverage.js";
import { computeCoverage, type CoverageResult } from "./coverage/coverage.js";
import { computeHttpPayloadConformance, type HttpPayloadConformanceResult } from "./coverage/httpPayloadConformance.js";
import { computeHttpRequestConformance, type HttpRequestConformanceResult } from "./coverage/httpRequestConformance.js";
import { computeHttpSecurityConformance, type HttpSecurityConformanceResult } from "./coverage/httpSecurityConformance.js";
import { readAsyncEventsJsonl } from "./events/readAsyncEventsJsonl.js";
import { readHttpEventsJsonl } from "./events/readJsonl.js";
import { applyExclusionRules, compileExclusionRules, type ExclusionApplicationResult } from "./gates/exclusions.js";
import { evaluateAsyncGateFailures } from "./gates/asyncEvaluator.js";
import { evaluateGateFailures } from "./gates/evaluator.js";
import { classifyHttpPayloadDiagnostic } from "./gates/httpPayloadSemantics.js";
import {
  classifyHttpRequestDiagnostic,
  isHttpRequestSemanticFailureCode
} from "./gates/httpRequestSemantics.js";
import {
  classifyHttpSecurityDiagnostic,
  isHttpSecuritySemanticFailureCode
} from "./gates/httpSecuritySemantics.js";
import {
  selectPrimaryFailure,
  sortFailuresByPrecedence,
  type FailureClass,
  type GovernanceFailure
} from "./gates/failureOrder.js";
import { resolveGatePolicy, type GateProfile } from "./gates/policy.js";
import { buildAsyncReport, type AsyncYanoteReport } from "./report/asyncReport.js";
import { buildReport, type YanoteReport } from "./report/report.js";
import { writeAsyncYanoteReport } from "./report/writeAsyncReport.js";
import { writeYanoteReport } from "./report/writeReport.js";
import { loadAsyncApiSemanticsBundle } from "./spec/asyncapi.js";
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

  program
    .command("async-report")
    .description("Compute deterministic async coverage from AsyncAPI and kafka evidence")
    .requiredOption("--spec <path>", "Spec file or directory (AsyncAPI)")
    .requiredOption("--events <path>", "Path to async events.jsonl")
    .requiredOption("--out <dir>", "Output directory")
    .option("--policy <path>", "Gate policy YAML file path")
    .option("--profile <profile>", "Gate profile (ci|local)")
    .option("--min-coverage <percent>", "Minimum async operation coverage percent")
    .option("--critical-operation <operationKey...>", "Critical async operation key(s), repeatable")
    .option("--verbose", "Print additional issue details", false)
    .action(async (opts: any) => {
      await executeAsyncReportCommand(opts, writeOut, writeErr);
    });

  return program;
}

async function executeReportCommand(opts: any, writeOut: (chunk: string) => void, writeErr: (chunk: string) => void): Promise<void> {
  let coverage: CoverageResult | undefined;
  let payloadConformance: HttpPayloadConformanceResult | undefined;
  let requestConformance: HttpRequestConformanceResult | undefined;
  let securityConformance: HttpSecurityConformanceResult | undefined;
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
    payloadConformance = computeHttpPayloadConformance(exclusionResult.includedOperations, events.items, {
      operationContractsByKey: openapiModel.operationContractsByKey
    });
    requestConformance = computeHttpRequestConformance(exclusionResult.includedOperations, events.items, {
      operationContractsByKey: openapiModel.operationContractsByKey
    });
    securityConformance = computeHttpSecurityConformance(exclusionResult.includedOperations, events.items, {
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
      comparison: regressionComparison,
      httpPayloadDiagnostics: payloadConformance.diagnostics,
      httpRequestDiagnostics: requestConformance.diagnostics,
      httpSecurityDiagnostics: securityConformance.diagnostics
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
      payloadConformance,
      requestConformance,
      securityConformance,
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

async function executeAsyncReportCommand(
  opts: any,
  writeOut: (chunk: string) => void,
  writeErr: (chunk: string) => void
): Promise<void> {
  let coverage: AsyncCoverageResult | undefined;
  let report: AsyncYanoteReport | undefined;
  let reportPath: string | undefined;
  let summaryIssues: SummaryIssue[] = [];
  const failureCandidates: CliFailure[] = [];

  try {
    const minCoverage = parsePercentOption(opts.minCoverage, "--min-coverage", "INPUT_MIN_COVERAGE_INVALID");
    const criticalOperations = parseStringList(opts.criticalOperation);
    const profile = parseProfile(opts.profile);

    const policy = await loadPolicy({
      profile,
      policyPath: opts.policy,
      cliOverrides: {
        minCoverage,
        criticalOperations
      }
    });

    const { asyncapi } = await discoverSpecs(opts.spec);
    if (!asyncapi) {
      throw new CliFailureError(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_ASYNC_SPEC_NOT_FOUND",
          "No AsyncAPI spec found.",
          "Provide --spec with a valid AsyncAPI file or directory."
        )
      );
    }

    const bundle = await loadAsyncCoverageModel(asyncapi);
    const events = await loadAsyncEvents(opts.events);
    if (events.invalidLines > 0) {
      const lineInfo =
        events.invalidLineNumbers.length > 0 ? ` at line(s) ${events.invalidLineNumbers.join(",")}` : "";
      failureCandidates.push(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_ASYNC_EVENTS_INVALID_LINES",
          `${events.invalidLines} invalid JSONL line(s) detected${lineInfo}.`,
          "Fix malformed async evidence and rerun async-report."
        )
      );
    }

    coverage = computeAsyncCoverage(bundle, events.items);

    const gateDiagnostics = evaluateAsyncGateFailures({
      coverage,
      policy
    });
    for (const diagnostic of gateDiagnostics) {
      if (diagnostic.severity === "error") {
        failureCandidates.push(diagnostic);
      } else {
        summaryIssues.push(toSummaryIssueFromFailure(diagnostic));
      }
    }

    report = buildAsyncReport(coverage, {
      toolVersion: TOOL_VERSION,
      eventTimestamps: events.items
        .map((event) => event.ts)
        .filter((timestamp): timestamp is number => typeof timestamp === "number")
    });

    try {
      reportPath = await writeAsyncYanoteReport(opts.out, report);
    } catch (error) {
      failureCandidates.push(classifyFailure(error));
    }
  } catch (error) {
    failureCandidates.push(classifyFailure(error));
  }

  const orderedFailures = sortFailuresByPrecedence(failureCandidates);
  const primaryFailure = selectPrimaryFailure(orderedFailures);
  const secondaryFailures = primaryFailure
    ? orderedFailures.filter((failure) => failure.severity === "error" && failure !== primaryFailure)
    : [];

  const summary = formatAsyncSummaryOutput({
    report,
    coverage,
    reportPath,
    failures: orderedFailures,
    extraIssues: summaryIssues,
    verbose: Boolean(opts.verbose)
  });
  writeOut(summary);

  if (primaryFailure) {
    writeErr(
      formatFailureOutput(primaryFailure, secondaryFailures, {
        primaryPrefix: "YANOTE_ASYNC_ERROR",
        secondaryPrefix: "YANOTE_ASYNC_ERROR_SECONDARY"
      })
    );
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

async function loadAsyncCoverageModel(specPath: string) {
  try {
    const bundle = await loadAsyncApiSemanticsBundle(specPath);
    const invalidDiagnostics = bundle.diagnostics.filter((diagnostic) => diagnostic.kind === "invalid");
    if (invalidDiagnostics.length > 0) {
      throw new CliFailureError(
        makeFailure(
          EXIT.SEMANTIC,
          "semantic",
          "ASYNC_SEMANTIC_SPEC_INVALID",
          `AsyncAPI semantic extraction failed: ${invalidDiagnostics.map((diagnostic) => diagnostic.message).join("; ")}`,
          "Fix invalid AsyncAPI operations and rerun async-report."
        )
      );
    }

    return bundle;
  } catch (error) {
    if (error instanceof CliFailureError) {
      throw error;
    }

    if (isFsInputError(error)) {
      throw new CliFailureError(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_ASYNC_SPEC_READ_FAILED",
          fsErrorReason(error, "Unable to read AsyncAPI spec."),
          "Check --spec path and file permissions."
        )
      );
    }

    if (
      error instanceof Error &&
      (error.message.includes("Invalid AsyncAPI document") || error.message.includes("AsyncAPI semantic extraction failed"))
    ) {
      throw new CliFailureError(
        makeFailure(
          EXIT.SEMANTIC,
          "semantic",
          "ASYNC_SEMANTIC_SPEC_INVALID",
          error.message,
          "Fix invalid AsyncAPI operations and rerun async-report."
        )
      );
    }

    throw error;
  }
}

async function loadAsyncEvents(eventsPath: string) {
  try {
    return await readAsyncEventsJsonl(eventsPath);
  } catch (error) {
    if (isFsInputError(error)) {
      throw new CliFailureError(
        makeFailure(
          EXIT.INPUT,
          "input",
          "INPUT_ASYNC_EVENTS_READ_FAILED",
          fsErrorReason(error, "Unable to read async events file."),
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

  const issues = prioritizePrimaryIssue(
    collectIssues(input.report, input.coverage, input.failures, input.extraIssues),
    primaryFailure
  );
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
  lines.push("HTTP Payload Conformance");
  lines.push(`- request: ${formatPayloadTargetSummary(input.report?.httpPayloadConformance.summary.request)}`);
  lines.push(`- response: ${formatPayloadTargetSummary(input.report?.httpPayloadConformance.summary.response)}`);
  lines.push(`- diagnostics: ${formatPayloadDiagnosticCounts(input.report?.httpPayloadConformance.diagnostics.counts)}`);

  lines.push("");
  lines.push("HTTP Request Conformance");
  lines.push(`- observations: ${formatRequestObservationSummary(input.report?.httpRequestConformance.summary)}`);
  lines.push(`- truths: ${formatRequestTruthCounts(input.report?.httpRequestConformance.summary.counts)}`);
  lines.push(`- diagnostics: ${formatRequestTruthCounts(input.report?.httpRequestConformance.diagnostics.counts)}`);

  if (shouldRenderSecuritySummary(input.report?.httpSecurityConformance.summary)) {
    lines.push("");
    lines.push("HTTP Security Conformance");
    lines.push(`- observations: ${formatSecurityObservationSummary(input.report?.httpSecurityConformance.summary)}`);
    lines.push(`- truths: ${formatSecurityTruthCounts(input.report?.httpSecurityConformance.summary.counts)}`);
    lines.push(`- diagnostics: ${formatSecurityTruthCounts(input.report?.httpSecurityConformance.diagnostics.counts)}`);
  }

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
      `payload_diagnostics=${formatPayloadDiagnosticCountsMachine(input.report?.httpPayloadConformance.diagnostics.counts)}`,
      `request_observed_operations=${input.report?.httpRequestConformance.summary.observedOperations ?? 0}`,
      `request_observed_parameters=${input.report?.httpRequestConformance.summary.observedParameters ?? 0}`,
      `request_truths=${formatRequestTruthCountsMachine(input.report?.httpRequestConformance.summary.counts)}`,
      `security_declared_operations=${input.report?.httpSecurityConformance.summary.declaredOperations ?? 0}`,
      `security_observed_operations=${input.report?.httpSecurityConformance.summary.observedOperations ?? 0}`,
      `security_observed_evaluations=${input.report?.httpSecurityConformance.summary.observedEvaluations ?? 0}`,
      `security_truths=${formatSecurityTruthCountsMachine(input.report?.httpSecurityConformance.summary.counts)}`,
      `report=${input.reportPath ?? "none"}`,
      `primary=${primaryFailure?.code ?? "none"}`,
      `class_counts=${formatClassCounts(input.failures)}`
    ].join(" ")
  );

  return `${lines.join("\n")}\n`;
}

function formatAsyncSummaryOutput(input: {
  report?: AsyncYanoteReport;
  coverage?: AsyncCoverageResult;
  reportPath?: string;
  failures: CliFailure[];
  extraIssues: SummaryIssue[];
  verbose: boolean;
}): string {
  const primaryFailure = selectPrimaryFailure(input.failures);
  const status = input.report?.status ?? (primaryFailure ? "invalid" : "ok");
  const summary = input.report?.summary;
  const dimensions = input.report?.coverage;

  const totalChannels = summary?.totalChannels ?? 0;
  const coveredChannels = summary?.coveredChannels ?? 0;
  const totalOperations = summary?.totalOperations ?? 0;
  const coveredOperations = summary?.coveredOperations ?? 0;
  const totalMessages = summary?.totalMessages ?? 0;
  const coveredMessages = summary?.coveredMessages ?? 0;

  const issues = prioritizePrimaryIssue(
    collectAsyncIssues(input.report, input.coverage, input.failures, input.extraIssues),
    primaryFailure
  );
  const maxIssues = input.verbose ? issues.length : 5;
  const shownIssues = issues.slice(0, maxIssues);
  const hiddenCount = Math.max(0, issues.length - shownIssues.length);

  const lines: string[] = [];
  lines.push("Summary");
  lines.push(`- status: ${status}`);
  lines.push(`- channels: ${coveredChannels}/${totalChannels} (${formatPercent(summary?.channelCoveragePercent ?? null)})`);
  lines.push(`- operations: ${coveredOperations}/${totalOperations} (${formatPercent(summary?.operationCoveragePercent ?? null)})`);
  lines.push(`- messages: ${coveredMessages}/${totalMessages} (${formatPercent(summary?.messageCoveragePercent ?? null)})`);

  lines.push("");
  lines.push("Coverage Dimensions");
  lines.push(`- channels: ${formatPercent(dimensions?.channels.percent ?? null)} (${dimensions?.channels.state ?? "N/A"})`);
  lines.push(`- operations: ${formatPercent(dimensions?.operations.percent ?? null)} (${dimensions?.operations.state ?? "N/A"})`);
  lines.push(`- messages: ${formatPercent(dimensions?.messages.percent ?? null)} (${dimensions?.messages.state ?? "N/A"})`);

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
      "YANOTE_ASYNC_SUMMARY",
      `status=${status}`,
      `channels=${formatMachinePercent(summary?.channelCoveragePercent ?? null)}`,
      `operations=${formatMachinePercent(summary?.operationCoveragePercent ?? null)}`,
      `messages=${formatMachinePercent(summary?.messageCoveragePercent ?? null)}`,
      `covered_channels=${coveredChannels}/${totalChannels}`,
      `covered_operations=${coveredOperations}/${totalOperations}`,
      `covered_messages=${coveredMessages}/${totalMessages}`,
      `diagnostics=${input.report?.diagnostics.items.length ?? 0}`,
      `report=${input.reportPath ?? "none"}`,
      `primary=${primaryFailure?.code ?? "none"}`,
      `primary_reason=${quote(primaryFailure?.reason ?? "none")}`,
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
  const payloadSemanticIssueKeys = new Set(
    failures
      .filter((failure) => failure.severity === "error" && failure.failureClass === "semantic")
      .map((failure) => toFailureIssueKey(failure))
  );
  const requestSemanticIssueKeys = new Set(
    failures
      .filter(
        (failure) =>
          failure.severity === "error" &&
          failure.failureClass === "semantic" &&
          isHttpRequestSemanticFailureCode(failure.code)
      )
      .map((failure) => toFailureIssueKey(failure))
  );
  const securitySemanticIssueKeys = new Set(
    failures
      .filter(
        (failure) =>
          failure.severity === "error" &&
          failure.failureClass === "semantic" &&
          isHttpSecuritySemanticFailureCode(failure.code)
      )
      .map((failure) => toFailureIssueKey(failure))
  );

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

    for (const diagnostic of report.httpPayloadConformance.diagnostics.items) {
      if (diagnostic.state === "COVERED") continue;

      const semanticFailure = classifyHttpPayloadDiagnostic(diagnostic);
      if (semanticFailure) {
        if (payloadSemanticIssueKeys.has(toFailureIssueKey(semanticFailure))) continue;

        const severity = payloadDiagnosticSeverity(diagnostic.state);
        const media = diagnostic.observedMediaType ? ` media=${diagnostic.observedMediaType}` : "";
        const declaredStatus = diagnostic.declaredStatus ? ` declaredStatus=${diagnostic.declaredStatus}` : "";
        issues.push({
          severityRank: severity.rank,
          severityLabel: severity.label,
          sortKey: `payload:${diagnostic.operationKey}:${diagnostic.target}:${diagnostic.code}`,
          text: `${diagnostic.operationKey} ${diagnostic.target} - ${diagnostic.code}: ${diagnostic.message}${declaredStatus}${media}`
        });
        continue;
      }

      if (diagnostic.code === "RECORDER_OMITTED") {
        const declaredStatus = diagnostic.declaredStatus ? ` declaredStatus=${diagnostic.declaredStatus}` : "";
        const media = diagnostic.observedMediaType ? ` media=${diagnostic.observedMediaType}` : "";
        const reason = diagnostic.captureReason ? ` reason=${diagnostic.captureReason}` : "";
        issues.push({
          severityRank: 1,
          severityLabel: "medium",
          sortKey: `payload:${diagnostic.operationKey}:${diagnostic.target}:${diagnostic.code}`,
          text: `${diagnostic.operationKey} ${diagnostic.target} - ${diagnostic.code}: ${diagnostic.message}${declaredStatus}${media}${reason}`
        });
      }
    }

    for (const diagnostic of report.httpRequestConformance.diagnostics.items) {
      if (diagnostic.truth === "captured-valid") continue;

      const semanticFailure = classifyHttpRequestDiagnostic(diagnostic);
      if (semanticFailure && requestSemanticIssueKeys.has(toFailureIssueKey(semanticFailure))) {
        continue;
      }

      const severity = requestDiagnosticSeverity(diagnostic.truth);
      const evidenceReason = diagnostic.evidenceReason ? ` reason=${diagnostic.evidenceReason}` : "";
      issues.push({
        severityRank: severity.rank,
        severityLabel: severity.label,
        sortKey: `request:${diagnostic.operationKey}:${diagnostic.location}:${diagnostic.name}:${diagnostic.truth}`,
        text: `${diagnostic.operationKey} ${diagnostic.location}:${diagnostic.name} - ${diagnostic.truth}: ${diagnostic.message}${evidenceReason}`
      });
    }

    for (const diagnostic of report.httpSecurityConformance.diagnostics.items) {
      if (diagnostic.truth === "satisfied" || diagnostic.truth === "optional" || diagnostic.truth === "clear") continue;

      const semanticFailure = classifyHttpSecurityDiagnostic(diagnostic);
      if (semanticFailure && securitySemanticIssueKeys.has(toFailureIssueKey(semanticFailure))) {
        continue;
      }

      const severity = securityDiagnosticSeverity(diagnostic.truth);
      const schemeName = diagnostic.schemeName ? ` scheme=${diagnostic.schemeName}` : "";
      const schemeLocation = diagnostic.schemeLocation ? ` location=${diagnostic.schemeLocation}` : "";
      const evidenceState = diagnostic.evidenceState ? ` evidence=${diagnostic.evidenceState}` : "";
      const evidenceReason = diagnostic.evidenceReason ? ` reason=${diagnostic.evidenceReason}` : "";
      issues.push({
        severityRank: severity.rank,
        severityLabel: severity.label,
        sortKey: `security:${diagnostic.operationKey}:${diagnostic.branchIndex}:${diagnostic.truth}:${diagnostic.schemeName ?? ""}`,
        text: `${diagnostic.operationKey} security branch=${diagnostic.branchIndex} (${diagnostic.branchKind}) - ${diagnostic.truth}: ${diagnostic.message}${schemeName}${schemeLocation}${evidenceState}${evidenceReason}`
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
      text: formatFailureSummaryText(failure)
    });
  }

  return issues.sort((left, right) => {
    const severity = left.severityRank - right.severityRank;
    if (severity !== 0) return severity;
    if (left.sortKey !== right.sortKey) return left.sortKey.localeCompare(right.sortKey);
    return left.text.localeCompare(right.text);
  });
}

function collectAsyncIssues(
  report: AsyncYanoteReport | undefined,
  coverage: AsyncCoverageResult | undefined,
  failures: CliFailure[],
  extraIssues: SummaryIssue[]
): SummaryIssue[] {
  const issues: SummaryIssue[] = [...extraIssues];
  const diagnostics = report?.diagnostics.items ?? coverage?.diagnostics ?? [];

  for (const [index, diagnostic] of diagnostics.entries()) {
    issues.push(toAsyncDiagnosticSummaryIssue(diagnostic, index));
  }

  if (report) {
    for (const entry of report.coverage.channels.items.filter((item) => item.state === "UNCOVERED")) {
      issues.push({
        severityRank: 2,
        severityLabel: "low",
        sortKey: `async-channel:${entry.channel}`,
        text: `${entry.channel} - channel is uncovered`
      });
    }

    for (const entry of report.coverage.operations.items.filter((item) => item.operation.state === "UNCOVERED")) {
      issues.push({
        severityRank: 2,
        severityLabel: "low",
        sortKey: `async-operation:${entry.operationKey}`,
        text: `${entry.operationKey} - async operation is uncovered`
      });
    }

    for (const entry of report.coverage.messages.items.filter((item) => item.state === "UNCOVERED")) {
      issues.push({
        severityRank: 2,
        severityLabel: "low",
        sortKey: `async-message:${entry.operationKey}:${entry.message}`,
        text: `${entry.operationKey} - async message ${entry.message} is uncovered`
      });
    }
  } else if (coverage) {
    for (const entry of coverage.operations.items.filter((item) => item.operation.state === "UNCOVERED")) {
      issues.push({
        severityRank: 2,
        severityLabel: "low",
        sortKey: `async-operation:${entry.operationKey}`,
        text: `${entry.operationKey} - async operation is uncovered`
      });
    }
  }

  for (const failure of failures.filter((item) => item.severity === "error")) {
    issues.push({
      severityRank: 0,
      severityLabel: "high",
      sortKey: `failure:${failure.failureClass}:${failure.code}:${failure.operationKey ?? ""}`,
      text: formatFailureSummaryText(failure)
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
    text: formatFailureSummaryText(failure)
  };
}

function prioritizePrimaryIssue(
  issues: SummaryIssue[],
  primaryFailure: CliFailure | undefined
): SummaryIssue[] {
  if (!primaryFailure) return issues;

  const primaryText = formatFailureSummaryText(primaryFailure);
  const primaryIndex = issues.findIndex(
    (issue) => issue.severityRank === 0 && issue.severityLabel === "high" && issue.text === primaryText
  );
  if (primaryIndex <= 0) return issues;

  const prioritized = [...issues];
  const [primaryIssue] = prioritized.splice(primaryIndex, 1);
  prioritized.unshift(primaryIssue);
  return prioritized;
}

function formatFailureSummaryText(failure: CliFailure): string {
  return `${failure.code} - ${failure.reason}`;
}

function toAsyncDiagnosticSummaryIssue(diagnostic: AsyncCoverageDiagnostic, index: number): SummaryIssue {
  const operationKey = "operationKey" in diagnostic ? diagnostic.operationKey : `${diagnostic.action} ${diagnostic.channel}`;
  const schema = "schemaId" in diagnostic && diagnostic.schemaId ? ` schema=${diagnostic.schemaId}` : "";
  const pointer = "pointer" in diagnostic && diagnostic.pointer ? ` pointer=${diagnostic.pointer}` : "";
  return {
    severityRank: 1,
    severityLabel: "medium",
    sortKey: `async-diagnostic:${index.toString().padStart(4, "0")}:${operationKey}:${diagnostic.kind}`,
    text: `${operationKey} - ${diagnostic.kind}${schema}${pointer} reason=${diagnostic.reason}`
  };
}

function toFailureIssueKey(failure: GovernanceFailure): string {
  return [failure.failureClass, failure.code, failure.operationKey ?? "", failure.reason].join("\u0000");
}

function diagnosticSeverity(kind: "invalid" | "ambiguous" | "unmatched"): { rank: number; label: "high" | "medium" | "low" } {
  if (kind === "invalid") return { rank: 0, label: "high" };
  if (kind === "ambiguous") return { rank: 1, label: "medium" };
  return { rank: 2, label: "low" };
}

function payloadDiagnosticSeverity(state: "UNCOVERED" | "SKIPPED"): { rank: number; label: "medium" | "low" } {
  if (state === "UNCOVERED") return { rank: 1, label: "medium" };
  return { rank: 2, label: "low" };
}

function requestDiagnosticSeverity(
  truth: YanoteReport["httpRequestConformance"]["diagnostics"]["items"][number]["truth"]
): { rank: number; label: "medium" | "low" } {
  if (truth === "captured-invalid" || truth === "unsupported") return { rank: 1, label: "medium" };
  return { rank: 2, label: "low" };
}

function securityDiagnosticSeverity(
  truth: YanoteReport["httpSecurityConformance"]["diagnostics"]["items"][number]["truth"]
): { rank: number; label: "medium" | "low" } {
  if (truth === "missing" || truth === "unavailable" || truth === "unsupported") {
    return { rank: 1, label: "medium" };
  }
  return { rank: 2, label: "low" };
}

function shouldRenderSecuritySummary(
  summary: YanoteReport["httpSecurityConformance"]["summary"] | undefined
): boolean {
  if (!summary) return false;
  return summary.declaredOperations > 0 || summary.observedOperations > 0 || summary.observedEvaluations > 0;
}

function formatSecurityObservationSummary(
  summary: YanoteReport["httpSecurityConformance"]["summary"] | undefined
): string {
  if (!summary) return "declared=0 observed_operations=0 evaluations=0";
  return `declared=${summary.declaredOperations} observed_operations=${summary.observedOperations} evaluations=${summary.observedEvaluations}`;
}

function formatSecurityTruthCounts(
  counts: YanoteReport["httpSecurityConformance"]["diagnostics"]["counts"] | undefined
): string {
  if (!counts) return "satisfied=0 missing=0 unavailable=0 unsupported=0 optional=0 clear=0";
  return [
    `satisfied=${counts.satisfied}`,
    `missing=${counts.missing}`,
    `unavailable=${counts.unavailable}`,
    `unsupported=${counts.unsupported}`,
    `optional=${counts.optional}`,
    `clear=${counts.clear}`
  ].join(" ");
}

function formatSecurityTruthCountsMachine(
  counts: YanoteReport["httpSecurityConformance"]["diagnostics"]["counts"] | undefined
): string {
  if (!counts) return "satisfied:0,missing:0,unavailable:0,unsupported:0,optional:0,clear:0";
  return [
    `satisfied:${counts.satisfied}`,
    `missing:${counts.missing}`,
    `unavailable:${counts.unavailable}`,
    `unsupported:${counts.unsupported}`,
    `optional:${counts.optional}`,
    `clear:${counts.clear}`
  ].join(",");
}

function formatPayloadTargetSummary(
  target: YanoteReport["httpPayloadConformance"]["summary"]["request"] | undefined
): string {
  if (!target) {
    return "covered=0 partial=0 uncovered=0 skipped=0 n/a=0 observations=0 valid=0 invalid=0 skipped_observations=0";
  }

  return [
    `covered=${target.coveredOperations}`,
    `partial=${target.partialOperations}`,
    `uncovered=${target.uncoveredOperations}`,
    `skipped=${target.skippedOperations}`,
    `n/a=${target.notApplicableOperations}`,
    `observations=${target.observedCount}`,
    `valid=${target.validCount}`,
    `invalid=${target.invalidCount}`,
    `skipped_observations=${target.skippedCount}`
  ].join(" ");
}

function formatPayloadDiagnosticCounts(
  counts: YanoteReport["httpPayloadConformance"]["diagnostics"]["counts"] | undefined
): string {
  if (!counts) return "covered=0 uncovered=0 skipped=0";
  return `covered=${counts.covered} uncovered=${counts.uncovered} skipped=${counts.skipped}`;
}

function formatPayloadDiagnosticCountsMachine(
  counts: YanoteReport["httpPayloadConformance"]["diagnostics"]["counts"] | undefined
): string {
  if (!counts) return "covered:0,uncovered:0,skipped:0";
  return `covered:${counts.covered},uncovered:${counts.uncovered},skipped:${counts.skipped}`;
}

function formatRequestObservationSummary(
  summary: YanoteReport["httpRequestConformance"]["summary"] | undefined
): string {
  if (!summary) return "operations=0 parameters=0";
  return `operations=${summary.observedOperations} parameters=${summary.observedParameters}`;
}

function formatRequestTruthCounts(
  counts: YanoteReport["httpRequestConformance"]["diagnostics"]["counts"] | undefined
): string {
  if (!counts) return "captured-valid=0 captured-invalid=0 redacted=0 omitted=0 unsupported=0";
  return [
    `captured-valid=${counts.capturedValid}`,
    `captured-invalid=${counts.capturedInvalid}`,
    `redacted=${counts.redacted}`,
    `omitted=${counts.omitted}`,
    `unsupported=${counts.unsupported}`
  ].join(" ");
}

function formatRequestTruthCountsMachine(
  counts: YanoteReport["httpRequestConformance"]["diagnostics"]["counts"] | undefined
): string {
  if (!counts) return "captured_valid:0,captured_invalid:0,redacted:0,omitted:0,unsupported:0";
  return [
    `captured_valid:${counts.capturedValid}`,
    `captured_invalid:${counts.capturedInvalid}`,
    `redacted:${counts.redacted}`,
    `omitted:${counts.omitted}`,
    `unsupported:${counts.unsupported}`
  ].join(",");
}

function formatFailureOutput(
  primaryFailure: CliFailure,
  secondaryFailures: CliFailure[],
  prefixes: { primaryPrefix: string; secondaryPrefix: string } = {
    primaryPrefix: "YANOTE_ERROR",
    secondaryPrefix: "YANOTE_ERROR_SECONDARY"
  }
): string {
  const lines = [formatFailureLine(prefixes.primaryPrefix, primaryFailure)];
  for (const failure of secondaryFailures) {
    lines.push(formatFailureLine(prefixes.secondaryPrefix, failure));
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

    const failure = makeFailure(
      EXIT.RUNTIME,
      "runtime",
      "RUNTIME_UNCAUGHT",
      error instanceof Error ? error.message : String(error),
      "Inspect stderr and rerun with deterministic inputs."
    );
    const prefixes =
      argv[0] === "async-report"
        ? {
            primaryPrefix: "YANOTE_ASYNC_ERROR",
            secondaryPrefix: "YANOTE_ASYNC_ERROR_SECONDARY"
          }
        : undefined;

    stderr += formatFailureOutput(failure, [], prefixes);
    return { code: EXIT.RUNTIME, stdout, stderr };
  }
}
