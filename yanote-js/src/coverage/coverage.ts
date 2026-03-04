import { match } from "path-to-regexp";
import {
  computeParameterCoverage
} from "./parameterCoverage.js";
import { computeStatusCoverage } from "./statusCoverage.js";
import type { CoverageDimensionState, ParameterCoverageResult, ParameterDefinition, StatusCoverageResult } from "./dimensions.js";
import type { HttpEvent } from "../model/httpEvent.js";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";
import type { SemanticDiagnostic } from "../spec/diagnostics.js";

type HttpOperation = Extract<OperationKey, { kind: "http" }>;

type TemplateMatcher = {
  operation: HttpOperation;
  key: string;
  matches: (route: string) => boolean;
};

type OperationEvidence = {
  observed: boolean;
  statuses: Set<number>;
  queryKeys: Set<string>;
  headerKeys: Set<string>;
  suites: Set<string>;
};

export type HttpOperationContract = {
  declaredStatuses: string[];
  parameters: ParameterDefinition[];
};

export type CoverageDimensionSummary = {
  state: CoverageDimensionState;
  percent: number | null;
  explanation?: string;
};

export type PerOperationCoverage = {
  operationKey: string;
  method: string;
  route: string;
  operation: {
    state: "COVERED" | "UNCOVERED";
  };
  status: StatusCoverageResult;
  parameters: ParameterCoverageResult;
  suites: string[];
};

export type CoverageResult = {
  allOperations: OperationKey[];
  coveredOperations: OperationKey[];
  uncoveredOperations: OperationKey[];
  suitesByOperation: Map<string, Set<string>>;
  diagnostics: SemanticDiagnostic[];
  dimensions: {
    operations: CoverageDimensionSummary;
    status: CoverageDimensionSummary;
    parameters: CoverageDimensionSummary;
    aggregate: CoverageDimensionSummary;
  };
  perOperation: PerOperationCoverage[];
};

export type ComputeCoverageOptions = {
  operationContractsByKey?: ReadonlyMap<string, HttpOperationContract>;
};

export function computeCoverage(
  operations: OperationKey[],
  events: HttpEvent[],
  excludePatterns: string[] = [],
  options: ComputeCoverageOptions = {}
): CoverageResult {
  const normalizedOps = normalizeAndFilterOperations(operations, excludePatterns);
  const httpOperations = normalizedOps.filter((operation): operation is HttpOperation => operation.kind === "http");

  const operationByKey = new Map<string, HttpOperation>();
  for (const operation of httpOperations) {
    operationByKey.set(serializeOperationKey(operation), operation);
  }

  const templateMatchers = buildTemplateMatchers(httpOperations);
  const evidenceByOperation = new Map<string, OperationEvidence>();
  const diagnostics: SemanticDiagnostic[] = [];

  for (const event of events) {
    if (typeof event.method !== "string" || typeof event.route !== "string") continue;

    const eventMethod = event.method.toUpperCase();
    const eventRoute = event.route;
    const exactKey = serializeOperationKey({ kind: "http", method: eventMethod, route: eventRoute });
    const exactOperation = operationByKey.get(exactKey);

    if (exactOperation) {
      recordOperationEvidence(evidenceByOperation, exactKey, event);
      continue;
    }

    const fallbackCandidates = findFallbackCandidates(templateMatchers, eventMethod, eventRoute);
    if (fallbackCandidates.length === 1) {
      recordOperationEvidence(evidenceByOperation, serializeOperationKey(fallbackCandidates[0]), event);
      continue;
    }

    if (fallbackCandidates.length > 1) {
      diagnostics.push({
        kind: "ambiguous",
        method: eventMethod,
        route: eventRoute,
        candidates: fallbackCandidates.map((candidate) => `${candidate.method} ${candidate.route}`),
        message: "Multiple operation templates matched event route"
      });
      continue;
    }

    diagnostics.push({
      kind: "unmatched",
      method: eventMethod,
      route: eventRoute,
      message: "No operation matched event route"
    });
  }

  const coveredOperations: OperationKey[] = [];
  const uncoveredOperations: OperationKey[] = [];

  for (const operation of httpOperations) {
    const operationKey = serializeOperationKey(operation);
    const evidence = evidenceByOperation.get(operationKey);
    if (evidence?.observed) coveredOperations.push(operation);
    else uncoveredOperations.push(operation);
  }

  const perOperation: PerOperationCoverage[] = httpOperations.map((operation) => {
    const operationKey = serializeOperationKey(operation);
    const contract = options.operationContractsByKey?.get(operationKey);
    const evidence = evidenceByOperation.get(operationKey) ?? createOperationEvidence();

    const status = computeStatusCoverage({
      declaredStatuses: contract?.declaredStatuses ?? [],
      observedStatuses: Array.from(evidence.statuses).sort((left, right) => left - right)
    });

    const parameters = computeParameterCoverage({
      parameters: contract?.parameters ?? [],
      evidence: {
        operationObserved: evidence.observed,
        queryKeys: Array.from(evidence.queryKeys).sort((left, right) => left.localeCompare(right)),
        headerKeys: Array.from(evidence.headerKeys).sort((left, right) => left.localeCompare(right))
      }
    });

    return {
      operationKey,
      method: operation.method,
      route: operation.route,
      operation: {
        state: evidence.observed ? "COVERED" : "UNCOVERED"
      },
      status,
      parameters,
      suites: Array.from(evidence.suites).sort((left, right) => left.localeCompare(right))
    };
  });

  const suitesByOperation = new Map<string, Set<string>>();
  for (const entry of perOperation) {
    if (entry.suites.length === 0) continue;
    suitesByOperation.set(entry.operationKey, new Set(entry.suites));
  }

  const dimensions = computeDimensionSummaries(perOperation, coveredOperations.length, httpOperations.length);

  return {
    allOperations: httpOperations,
    coveredOperations,
    uncoveredOperations,
    suitesByOperation,
    diagnostics,
    dimensions,
    perOperation
  };
}

function recordOperationEvidence(
  evidenceByOperation: Map<string, OperationEvidence>,
  operationKey: string,
  event: HttpEvent
): void {
  const evidence = evidenceByOperation.get(operationKey) ?? createOperationEvidence();
  evidence.observed = true;

  const suite = typeof event.testSuite === "string" && event.testSuite.trim().length > 0 ? event.testSuite.trim() : "unknown";
  evidence.suites.add(suite);

  if (typeof event.status === "number" && Number.isInteger(event.status)) {
    evidence.statuses.add(event.status);
  }

  for (const key of Array.isArray(event.queryKeys) ? event.queryKeys : []) {
    if (typeof key !== "string" || key.trim().length === 0) continue;
    evidence.queryKeys.add(key.trim());
  }

  for (const key of Array.isArray(event.headerKeys) ? event.headerKeys : []) {
    if (typeof key !== "string" || key.trim().length === 0) continue;
    evidence.headerKeys.add(key.trim().toLowerCase());
  }

  evidenceByOperation.set(operationKey, evidence);
}

function createOperationEvidence(): OperationEvidence {
  return {
    observed: false,
    statuses: new Set<number>(),
    queryKeys: new Set<string>(),
    headerKeys: new Set<string>(),
    suites: new Set<string>()
  };
}

function computeDimensionSummaries(
  perOperation: PerOperationCoverage[],
  coveredOperations: number,
  totalOperations: number
): CoverageResult["dimensions"] {
  const operations = summarizeDimension(coveredOperations, totalOperations);

  let statusDeclared = 0;
  let statusCovered = 0;
  let requiredParametersTotal = 0;
  let requiredParametersCovered = 0;

  for (const entry of perOperation) {
    statusDeclared += entry.status.declaredStatuses.length;
    statusCovered += entry.status.coveredStatuses.length;
    requiredParametersTotal += entry.parameters.required.total;
    requiredParametersCovered += entry.parameters.required.covered;
  }

  const status = summarizeDimension(statusCovered, statusDeclared);
  const parameters = summarizeDimension(requiredParametersCovered, requiredParametersTotal);

  const aggregate = summarizeAggregate(operations.percent, status.percent, parameters.percent);

  return {
    operations,
    status,
    parameters,
    aggregate
  };
}

function summarizeDimension(covered: number, total: number): CoverageDimensionSummary {
  if (total === 0) {
    return { state: "N/A", percent: null };
  }

  const percent = roundPercent((covered / total) * 100);
  return {
    state: stateFromPercent(percent),
    percent
  };
}

function summarizeAggregate(
  operationsPercent: number | null,
  statusPercent: number | null,
  parameterPercent: number | null
): CoverageDimensionSummary {
  if (operationsPercent == null || statusPercent == null || parameterPercent == null) {
    return {
      state: "N/A",
      percent: null,
      explanation: "aggregate is N/A because weighted dimensions include N/A"
    };
  }

  const weighted = roundPercent(operationsPercent * 0.6 + statusPercent * 0.25 + parameterPercent * 0.15);
  return {
    state: stateFromPercent(weighted),
    percent: weighted
  };
}

function stateFromPercent(percent: number): CoverageDimensionState {
  if (percent >= 100) return "COVERED";
  if (percent <= 0) return "UNCOVERED";
  return "PARTIAL";
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildTemplateMatchers(operations: HttpOperation[]): TemplateMatcher[] {
  const matchers: TemplateMatcher[] = [];

  for (const operation of operations) {
    if (!operation.route.includes("{")) continue;

    const key = serializeOperationKey(operation);
    const pattern = toPathToRegexpPattern(operation.route);
    const routeMatcher = match<Record<string, string>>(pattern, {
      end: true,
      decode: decodeURIComponent
    });

    matchers.push({
      operation,
      key,
      matches: (route: string) => routeMatcher(route) !== false
    });
  }

  return matchers;
}

function findFallbackCandidates(matchers: TemplateMatcher[], method: string, route: string): HttpOperation[] {
  return matchers
    .filter((matcher) => matcher.operation.method === method && matcher.matches(route))
    .map((matcher) => matcher.operation)
    .sort(compareHttpOperations);
}

function toPathToRegexpPattern(route: string): string {
  let index = 0;
  return route.replace(/\{[^/}]+\}/g, () => `:param${index++}`);
}

function normalizeAndFilterOperations(operations: OperationKey[], excludePatterns: string[]): HttpOperation[] {
  const out: HttpOperation[] = [];
  const seen = new Set<string>();

  for (const operation of operations) {
    if (!operation || typeof operation !== "object") continue;
    if (operation.kind !== "http") continue;
    if (typeof operation.method !== "string" || typeof operation.route !== "string") continue;

    const method = operation.method.toUpperCase();
    const route = normalizeTemplatedRoute(operation.route);
    if (isExcluded(route, excludePatterns)) continue;

    const normalized: HttpOperation = { kind: "http", method, route };
    const key = serializeOperationKey(normalized);
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(normalized);
  }

  return out;
}

function normalizeTemplatedRoute(route: string): string {
  return route.trim().replace(/\{[^/}]+\}/g, "{param}");
}

function isExcluded(route: string, excludePatterns: string[] | undefined): boolean {
  if (!excludePatterns) return false;
  for (const pattern of excludePatterns) {
    if (matchesExclusionPattern(route, pattern)) return true;
  }
  return false;
}

export function matchesExclusionPattern(route: string, rawPattern: string | undefined): boolean {
  if (!rawPattern || !rawPattern.trim()) return false;
  const pattern = rawPattern.trim();
  if (route === pattern || route.startsWith(pattern)) return true;
  if (!pattern.includes("*")) return false;
  return wildcardMatch(route, pattern);
}

function wildcardMatch(route: string, pattern: string): boolean {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  const re = new RegExp(`^${escaped}$`);
  return re.test(route);
}

function compareHttpOperations(left: HttpOperation, right: HttpOperation): number {
  const leftKey = `${left.method} ${left.route}`;
  const rightKey = `${right.method} ${right.route}`;
  if (leftKey < rightKey) return -1;
  if (leftKey > rightKey) return 1;
  return 0;
}
