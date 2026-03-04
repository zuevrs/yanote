import { match } from "path-to-regexp";
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

export type CoverageResult = {
  allOperations: OperationKey[];
  coveredOperations: OperationKey[];
  uncoveredOperations: OperationKey[];
  suitesByOperation: Map<string, Set<string>>;
  diagnostics: SemanticDiagnostic[];
};

export function computeCoverage(
  operations: OperationKey[],
  events: HttpEvent[],
  excludePatterns: string[] = []
): CoverageResult {
  const normalizedOps = normalizeAndFilterOperations(operations, excludePatterns);
  const opByKey = new Map<string, OperationKey>();
  for (const op of normalizedOps) {
    opByKey.set(serializeOperationKey(op), op);
  }

  const templateMatchers = buildTemplateMatchers(normalizedOps);
  const suitesByOperation = new Map<string, Set<string>>();
  const diagnostics: SemanticDiagnostic[] = [];

  for (const ev of events) {
    if (typeof ev.method !== "string" || typeof ev.route !== "string") continue;

    const eventMethod = ev.method.toUpperCase();
    const eventRoute = ev.route;
    const exactKey = serializeOperationKey({ kind: "http", method: eventMethod, route: eventRoute });
    const exactOperation = opByKey.get(exactKey);

    if (exactOperation?.kind === "http") {
      addSuiteMatch(suitesByOperation, exactKey, ev.testSuite);
      continue;
    }

    const fallbackCandidates = findFallbackCandidates(templateMatchers, eventMethod, eventRoute);
    if (fallbackCandidates.length === 1) {
      const selected = fallbackCandidates[0];
      addSuiteMatch(suitesByOperation, serializeOperationKey(selected), ev.testSuite);
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

  const coveredKeys = new Set(suitesByOperation.keys());
  const coveredOperations: OperationKey[] = [];
  const uncoveredOperations: OperationKey[] = [];

  for (const op of normalizedOps) {
    const sk = serializeOperationKey(op);
    if (coveredKeys.has(sk)) coveredOperations.push(op);
    else uncoveredOperations.push(op);
  }

  return {
    allOperations: normalizedOps,
    coveredOperations,
    uncoveredOperations,
    suitesByOperation,
    diagnostics
  };
}

function addSuiteMatch(suitesByOperation: Map<string, Set<string>>, operationKey: string, suiteName: string): void {
  const suite = suiteName?.trim() ? suiteName : "unknown";
  const set = suitesByOperation.get(operationKey) ?? new Set<string>();
  set.add(suite);
  suitesByOperation.set(operationKey, set);
}

function buildTemplateMatchers(operations: OperationKey[]): TemplateMatcher[] {
  const matchers: TemplateMatcher[] = [];

  for (const op of operations) {
    if (op.kind !== "http") continue;
    if (!op.route.includes("{")) continue;

    const key = serializeOperationKey(op);
    const pattern = toPathToRegexpPattern(op.route);
    const routeMatcher = match<Record<string, string>>(pattern, {
      end: true,
      decode: decodeURIComponent
    });

    matchers.push({
      operation: op,
      key,
      matches: (route: string) => routeMatcher(route) !== false
    });
  }

  return matchers;
}

function findFallbackCandidates(matchers: TemplateMatcher[], method: string, route: string): HttpOperation[] {
  return matchers
    .filter((matcher) => matcher.operation.method === method && matcher.matches(route))
    .map((matcher) => matcher.operation);
}

function toPathToRegexpPattern(route: string): string {
  let index = 0;
  return route.replace(/\{[^/}]+\}/g, () => `:param${index++}`);
}

function normalizeAndFilterOperations(operations: OperationKey[], excludePatterns: string[]): OperationKey[] {
  const out: OperationKey[] = [];
  const seen = new Set<string>();

  for (const op of operations) {
    if (!op || typeof op !== "object") continue;
    if (op.kind === "http") {
      if (typeof op.method !== "string" || typeof op.route !== "string") continue;

      const method = op.method.toUpperCase();
      const route = normalizeTemplatedRoute(op.route);
      if (isExcluded(route, excludePatterns)) continue;

      const norm: OperationKey = { kind: "http", method, route };
      const sk = serializeOperationKey(norm);
      if (seen.has(sk)) continue;
      seen.add(sk);
      out.push(norm);
      continue;
    }

    if ((op as any).kind === "asyncapi") {
      const action = (op as any).action;
      const channel = (op as any).channel;
      if ((action !== "send" && action !== "receive") || typeof channel !== "string") continue;
      const norm: OperationKey = { kind: "asyncapi", action, channel };
      const sk = serializeOperationKey(norm);
      if (seen.has(sk)) continue;
      seen.add(sk);
      out.push(norm);
      continue;
    }
  }

  return out;
}

function normalizeTemplatedRoute(route: string): string {
  return route.trim().replace(/\{[^/}]+\}/g, "{param}");
}

function isExcluded(route: string, excludePatterns: string[] | undefined): boolean {
  if (!excludePatterns) return false;
  for (const pattern of excludePatterns) {
    if (!pattern || !pattern.trim()) continue;
    if (route === pattern || route.startsWith(pattern)) return true;
    if (pattern.includes("*") && wildcardMatch(route, pattern)) return true;
  }
  return false;
}

function wildcardMatch(route: string, pattern: string): boolean {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  const re = new RegExp(`^${escaped}$`);
  return re.test(route);
}

