import {
  compareParameterDefinition,
  type ParameterCoverageResult,
  type ParameterDefinition,
  type ParameterEvidence,
  type ParameterLocation
} from "./dimensions.js";

const LOCATIONS: ParameterLocation[] = ["path", "query", "header"];

export function computeParameterCoverage(input: {
  parameters: ParameterDefinition[];
  evidence: ParameterEvidence;
}): ParameterCoverageResult {
  const parameters = normalizeParameters(input.parameters);
  if (parameters.length === 0) {
    return {
      state: "N/A",
      required: {
        total: 0,
        covered: 0,
        missing: []
      },
      optional: {
        total: 0,
        covered: 0,
        missing: []
      },
      byLocation: emptyLocationCoverage()
    };
  }

  const querySet = new Set(input.evidence.queryKeys);
  const headerSet = new Set(input.evidence.headerKeys.map((key) => key.toLowerCase()));

  const missingRequired: ParameterDefinition[] = [];
  const missingOptional: ParameterDefinition[] = [];

  const byLocation = emptyLocationCoverage();

  let requiredTotal = 0;
  let requiredCovered = 0;
  let optionalTotal = 0;
  let optionalCovered = 0;

  for (const parameter of parameters) {
    const covered = isParameterCovered(parameter, querySet, headerSet, input.evidence.operationObserved);
    const locationStats = byLocation[parameter.in];

    if (parameter.required) {
      requiredTotal += 1;
      locationStats.requiredTotal += 1;
      if (covered) {
        requiredCovered += 1;
        locationStats.requiredCovered += 1;
      } else {
        missingRequired.push(parameter);
        locationStats.missingRequired.push(parameter.name);
      }
      continue;
    }

    optionalTotal += 1;
    locationStats.optionalTotal += 1;
    if (covered) {
      optionalCovered += 1;
      locationStats.optionalCovered += 1;
    } else {
      missingOptional.push(parameter);
      locationStats.missingOptional.push(parameter.name);
    }
  }

  for (const location of LOCATIONS) {
    byLocation[location].missingRequired.sort((left, right) => left.localeCompare(right));
    byLocation[location].missingOptional.sort((left, right) => left.localeCompare(right));
  }

  const state =
    requiredTotal === 0
      ? "COVERED"
      : requiredCovered === requiredTotal
        ? "COVERED"
        : requiredCovered === 0
          ? "UNCOVERED"
          : "PARTIAL";

  return {
    state,
    required: {
      total: requiredTotal,
      covered: requiredCovered,
      missing: missingRequired
    },
    optional: {
      total: optionalTotal,
      covered: optionalCovered,
      missing: missingOptional
    },
    byLocation
  };
}

function normalizeParameters(parameters: ParameterDefinition[]): ParameterDefinition[] {
  const deduped = new Map<string, ParameterDefinition>();
  for (const parameter of parameters) {
    const key = `${parameter.in}:${parameter.name}`;
    deduped.set(key, {
      name: parameter.name,
      in: parameter.in,
      required: parameter.in === "path" ? true : Boolean(parameter.required)
    });
  }
  return Array.from(deduped.values()).sort(compareParameterDefinition);
}

function isParameterCovered(
  parameter: ParameterDefinition,
  querySet: Set<string>,
  headerSet: Set<string>,
  operationObserved: boolean
): boolean {
  if (parameter.in === "path") {
    return operationObserved;
  }

  if (parameter.in === "query") {
    return querySet.has(parameter.name);
  }

  return headerSet.has(parameter.name.toLowerCase());
}

function emptyLocationCoverage(): ParameterCoverageResult["byLocation"] {
  return {
    path: {
      requiredTotal: 0,
      requiredCovered: 0,
      missingRequired: [],
      optionalTotal: 0,
      optionalCovered: 0,
      missingOptional: []
    },
    query: {
      requiredTotal: 0,
      requiredCovered: 0,
      missingRequired: [],
      optionalTotal: 0,
      optionalCovered: 0,
      missingOptional: []
    },
    header: {
      requiredTotal: 0,
      requiredCovered: 0,
      missingRequired: [],
      optionalTotal: 0,
      optionalCovered: 0,
      missingOptional: []
    }
  };
}
