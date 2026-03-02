import { Command, CommanderError } from "commander";
import { TOOL_VERSION } from "./version.js";
import { discoverSpecs } from "./spec/discover.js";
import { loadOpenApiOperations } from "./spec/openapi.js";
import { loadAsyncApiOperations } from "./spec/asyncapi.js";
import { readHttpEventsJsonl } from "./events/readJsonl.js";
import { computeCoverage } from "./coverage/coverage.js";
import { buildReport } from "./report/report.js";
import { writeYanoteReport } from "./report/writeReport.js";
import { computeRegression, readBaseline } from "./baseline/baseline.js";

export type CliResult = {
  code: number;
  stdout: string;
  stderr: string;
};

function createProgram(io?: { out?: (chunk: string) => void; err?: (chunk: string) => void }) {
  const program = new Command();
  program.name("yanote");
  program.version(TOOL_VERSION);

  program.exitOverride();
  program.configureOutput({
    writeOut: io?.out ?? (() => {}),
    writeErr: io?.err ?? (() => {})
  });

  program
    .command("report")
    .description("Compute coverage over spec operations using events.jsonl")
    .requiredOption("--spec <path>", "Spec file or directory (OpenAPI/AsyncAPI)")
    .requiredOption("--events <path>", "Path to events.jsonl")
    .requiredOption("--out <dir>", "Output directory")
    .option("--min-coverage <percent>", "Minimum coverage percent (integer)")
    .option("--baseline <path>", "Baseline file path")
    .option("--fail-on-regression", "Fail if coverage regressed vs baseline", false)
    .option("--exclude <pattern...>", "Exclude route patterns (repeatable)")
    .action(async function (opts: any) {
      const cmd = this as unknown as Command;

      const { openapi, asyncapi } = await discoverSpecs(opts.spec);
      if (!openapi) {
        cmd.error("No OpenAPI spec found (provide --spec <openapi-file> or a dir containing openapi*.yaml)", {
          exitCode: 2
        });
      }

      const [openApiOps, asyncApiOpsRes, eventsRes] = await Promise.all([
        loadOpenApiOperations(openapi),
        asyncapi ? loadAsyncApiOperations(asyncapi) : Promise.resolve([]),
        readHttpEventsJsonl(opts.events)
      ]);

      const operations = [...openApiOps, ...asyncApiOpsRes];
      const exclude: string[] = Array.isArray(opts.exclude) ? opts.exclude : [];

      const coverage = computeCoverage(operations, eventsRes.items, exclude);
      const report = buildReport(coverage, { toolVersion: TOOL_VERSION });
      await writeYanoteReport(opts.out, report);

      const failures: { exitCode: number; message: string }[] = [];

      if (opts.baseline) {
        const baseline = await readBaseline(opts.baseline);
        const regressed = computeRegression(baseline, coverage.coveredOperations);
        if (regressed.length > 0 && opts.failOnRegression) {
          failures.push({
            exitCode: 4,
            message: `Regression: missing ${regressed.length} previously covered operation(s)`
          });
        }
      }

      if (opts.minCoverage != null) {
        const min = Number.parseInt(String(opts.minCoverage), 10);
        if (!Number.isFinite(min)) {
          cmd.error("--min-coverage must be an integer", { exitCode: 2 });
        }
        if (report.summary.coveragePercent < min) {
          failures.push({
            exitCode: 3,
            message: `Min coverage failed: ${report.summary.coveragePercent}% < ${min}%`
          });
        }
      }

      if (failures.length > 0) {
        const exitCode = failures.some((f) => f.exitCode === 4) ? 4 : failures[0].exitCode;
        const message = failures.map((f) => f.message).join("\n");
        cmd.error(message, { exitCode });
      }
    });

  return program;
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
  } catch (err) {
    if (err instanceof CommanderError) {
      return { code: err.exitCode, stdout, stderr };
    }
    stderr += String(err instanceof Error ? err.message : err);
    return { code: 2, stdout, stderr };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line no-console
  runCli(process.argv.slice(2)).then((res) => {
    if (res.stdout) process.stdout.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
    process.exitCode = res.code;
  });
}

