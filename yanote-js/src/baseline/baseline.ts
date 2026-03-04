import { readFile, writeFile } from "node:fs/promises";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";

type BaselineFileV1 = {
  format: 1;
  covered: OperationKey[];
};

export type BaselineDimensionsSnapshot = {
  operations: number | null;
  status: number | null;
  parameters: number | null;
  aggregate: number | null;
};

export type BaselineFile = {
  format: 2;
  generatedAt: string;
  covered: string[];
  dimensions: BaselineDimensionsSnapshot;
};

export type RegressionComparison = {
  missingCoveredOperations: string[];
  removedSpecOperations: string[];
  dimensionRegressions: Array<{
    dimension: keyof BaselineDimensionsSnapshot;
    baseline: number;
    current: number;
  }>;
};

export async function readBaseline(filePath: string): Promise<BaselineFile> {
  const raw = await readFile(filePath, "utf8");
  const obj = JSON.parse(raw) as unknown;

  if (isBaselineFileV2(obj)) {
    return normalizeBaseline(obj);
  }

  if (isBaselineFileV1(obj)) {
    return {
      format: 2,
      generatedAt: "1970-01-01T00:00:00.000Z",
      covered: [...new Set(obj.covered.map((operation) => serializeOperationKey(operation)))].sort((left, right) =>
        left.localeCompare(right)
      ),
      dimensions: {
        operations: null,
        status: null,
        parameters: null,
        aggregate: null
      }
    };
  }

  throw new Error(
    "Incompatible baseline format: expected format=2 with covered operations and dimensions. Regenerate baseline via explicit baseline update."
  );
}

export async function writeBaseline(filePath: string, baseline: BaselineFile): Promise<void> {
  const normalized = normalizeBaseline(baseline);
  const serialized = `${JSON.stringify(normalized, null, 2)}\n`;
  await writeFile(filePath, serialized, "utf8");
}

export function createBaselineSnapshot(input: {
  coveredOperations: OperationKey[];
  dimensions: BaselineDimensionsSnapshot;
  generatedAt?: string;
}): BaselineFile {
  return normalizeBaseline({
    format: 2,
    generatedAt: input.generatedAt ?? "1970-01-01T00:00:00.000Z",
    covered: input.coveredOperations.map((operation) => serializeOperationKey(operation)),
    dimensions: {
      operations: input.dimensions.operations,
      status: input.dimensions.status,
      parameters: input.dimensions.parameters,
      aggregate: input.dimensions.aggregate
    }
  });
}

export function compareRegressionAgainstBaseline(input: {
  baseline: BaselineFile;
  currentCovered: OperationKey[];
  currentOperations: OperationKey[];
  currentDimensions: BaselineDimensionsSnapshot;
}): RegressionComparison {
  const baseline = normalizeBaseline(input.baseline);
  const currentCovered = new Set(input.currentCovered.map((operation) => serializeOperationKey(operation)));
  const currentOperations = new Set(input.currentOperations.map((operation) => serializeOperationKey(operation)));

  const missingCoveredOperations: string[] = [];
  const removedSpecOperations: string[] = [];

  for (const baselineOperation of baseline.covered) {
    if (!currentOperations.has(baselineOperation)) {
      removedSpecOperations.push(baselineOperation);
      continue;
    }
    if (!currentCovered.has(baselineOperation)) {
      missingCoveredOperations.push(baselineOperation);
    }
  }

  const dimensionRegressions: RegressionComparison["dimensionRegressions"] = [];
  const dimensions: Array<keyof BaselineDimensionsSnapshot> = ["operations", "status", "parameters", "aggregate"];
  for (const dimension of dimensions) {
    const baselineValue = baseline.dimensions[dimension];
    const currentValue = input.currentDimensions[dimension];
    if (typeof baselineValue !== "number" || typeof currentValue !== "number") continue;
    if (currentValue < baselineValue) {
      dimensionRegressions.push({
        dimension,
        baseline: baselineValue,
        current: currentValue
      });
    }
  }

  return {
    missingCoveredOperations: missingCoveredOperations.sort((left, right) => left.localeCompare(right)),
    removedSpecOperations: removedSpecOperations.sort((left, right) => left.localeCompare(right)),
    dimensionRegressions: dimensionRegressions.sort((left, right) => {
      if (left.dimension !== right.dimension) return left.dimension.localeCompare(right.dimension);
      if (left.baseline !== right.baseline) return left.baseline - right.baseline;
      return left.current - right.current;
    })
  };
}

export function computeRegression(baseline: BaselineFile, currentCovered: OperationKey[]): OperationKey[] {
  const comparison = compareRegressionAgainstBaseline({
    baseline,
    currentCovered,
    currentOperations: currentCovered,
    currentDimensions: {
      operations: null,
      status: null,
      parameters: null,
      aggregate: null
    }
  });
  return comparison.missingCoveredOperations.map((operationKey) => deserializeOperationKey(operationKey));
}

function isBaselineFileV1(value: unknown): value is BaselineFileV1 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as BaselineFileV1;
  return candidate.format === 1 && Array.isArray(candidate.covered);
}

function isBaselineFileV2(value: unknown): value is BaselineFile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as BaselineFile;
  if (candidate.format !== 2) return false;
  if (typeof candidate.generatedAt !== "string" || candidate.generatedAt.trim().length === 0) return false;
  if (!Array.isArray(candidate.covered) || !candidate.covered.every((entry) => typeof entry === "string")) return false;
  if (!candidate.dimensions || typeof candidate.dimensions !== "object") return false;

  return (
    isNullableNumber(candidate.dimensions.operations) &&
    isNullableNumber(candidate.dimensions.status) &&
    isNullableNumber(candidate.dimensions.parameters) &&
    isNullableNumber(candidate.dimensions.aggregate)
  );
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function normalizeBaseline(baseline: BaselineFile): BaselineFile {
  return {
    format: 2,
    generatedAt: baseline.generatedAt,
    covered: [...new Set(baseline.covered)].sort((left, right) => left.localeCompare(right)),
    dimensions: {
      operations: baseline.dimensions.operations,
      status: baseline.dimensions.status,
      parameters: baseline.dimensions.parameters,
      aggregate: baseline.dimensions.aggregate
    }
  };
}

function deserializeOperationKey(serialized: string): OperationKey {
  if (serialized.startsWith("http ")) {
    const rest = serialized.slice("http ".length);
    const splitAt = rest.indexOf(" ");
    if (splitAt > 0) {
      const method = rest.slice(0, splitAt);
      const route = rest.slice(splitAt + 1);
      return { kind: "http", method, route };
    }
  }

  if (serialized.startsWith("asyncapi ")) {
    const rest = serialized.slice("asyncapi ".length);
    const splitAt = rest.indexOf(" ");
    if (splitAt > 0) {
      const action = rest.slice(0, splitAt);
      const channel = rest.slice(splitAt + 1);
      if (action === "send" || action === "receive") {
        return { kind: "asyncapi", action, channel };
      }
    }
  }

  return { kind: "unknown", raw: serialized };
}

