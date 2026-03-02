import type { CoverageResult } from "../coverage/coverage.js";
import type { OperationKey } from "../model/operationKey.js";

export type YanoteReport = {
  meta: {
    generatedAt: string;
    toolVersion: string;
  };
  summary: {
    totalOperations: number;
    coveredOperations: number;
    coveragePercent: number;
  };
  operations: {
    all: OperationKey[];
    covered: OperationKey[];
    uncovered: OperationKey[];
  };
  suitesByOperation?: Record<string, string[]>;
};

export function buildReport(
  coverage: CoverageResult,
  opts: { toolVersion: string; generatedAt?: Date }
): YanoteReport {
  const total = coverage.allOperations.length;
  const covered = coverage.coveredOperations.length;
  const coveragePercent = total === 0 ? 100 : Math.round((covered / total) * 10000) / 100;

  const suitesByOperation: Record<string, string[]> = {};
  for (const [key, suites] of coverage.suitesByOperation.entries()) {
    suitesByOperation[key] = Array.from(suites).sort();
  }

  return {
    meta: {
      generatedAt: (opts.generatedAt ?? new Date()).toISOString(),
      toolVersion: opts.toolVersion
    },
    summary: {
      totalOperations: total,
      coveredOperations: covered,
      coveragePercent
    },
    operations: {
      all: coverage.allOperations,
      covered: coverage.coveredOperations,
      uncovered: coverage.uncoveredOperations
    },
    suitesByOperation
  };
}

