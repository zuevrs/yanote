import {
  compareDeclaredStatusToken,
  normalizeDeclaredStatusToken,
  type DeclaredStatusToken,
  type StatusCoverageResult
} from "./dimensions.js";

export function computeStatusCoverage(input: {
  declaredStatuses: string[];
  observedStatuses: number[];
}): StatusCoverageResult {
  const declaredStatuses = normalizeDeclaredStatuses(input.declaredStatuses);
  if (declaredStatuses.length === 0) {
    return {
      state: "N/A",
      declaredStatuses: [],
      coveredStatuses: [],
      missingStatuses: []
    };
  }

  const observedStatuses = Array.from(new Set(input.observedStatuses.filter((status) => Number.isInteger(status)))).sort(
    (left, right) => left - right
  );

  const coveredStatuses = declaredStatuses.filter((token) => isDeclaredStatusCovered(token, observedStatuses, declaredStatuses));
  const missingStatuses = declaredStatuses.filter((token) => !coveredStatuses.includes(token));
  const state =
    coveredStatuses.length === declaredStatuses.length
      ? "COVERED"
      : coveredStatuses.length === 0
        ? "UNCOVERED"
        : "PARTIAL";

  return {
    state,
    declaredStatuses,
    coveredStatuses,
    missingStatuses
  };
}

function normalizeDeclaredStatuses(input: string[]): DeclaredStatusToken[] {
  const unique = new Set<DeclaredStatusToken>();
  for (const raw of input) {
    const normalized = normalizeDeclaredStatusToken(raw);
    if (normalized) unique.add(normalized);
  }
  return Array.from(unique).sort(compareDeclaredStatusToken);
}

function isDeclaredStatusCovered(
  declared: DeclaredStatusToken,
  observedStatuses: number[],
  allDeclared: DeclaredStatusToken[]
): boolean {
  if (declared === "default") {
    return observedStatuses.some((status) => !matchesAnyNonDefaultToken(status, allDeclared));
  }

  return observedStatuses.some((status) => matchesStatusToken(status, declared));
}

function matchesAnyNonDefaultToken(status: number, tokens: DeclaredStatusToken[]): boolean {
  return tokens.some((token) => token !== "default" && matchesStatusToken(status, token));
}

function matchesStatusToken(status: number, token: DeclaredStatusToken): boolean {
  if (token === "default") return true;
  if (token.endsWith("XX")) {
    const statusPrefix = Math.trunc(status / 100);
    return statusPrefix === Number(token[0]);
  }
  return Number(token) === status;
}
