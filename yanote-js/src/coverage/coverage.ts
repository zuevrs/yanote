import type { HttpEvent } from "../model/httpEvent.js";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";

export type CoverageResult = {
  allOperations: OperationKey[];
  coveredOperations: OperationKey[];
  uncoveredOperations: OperationKey[];
  suitesByOperation: Map<string, Set<string>>;
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

  const suitesByOperation = new Map<string, Set<string>>();
  for (const ev of events) {
    const key: OperationKey = { kind: "http", method: ev.method, route: ev.route };
    const sk = serializeOperationKey(key);
    if (!opByKey.has(sk)) continue;
    const suite = ev.testSuite?.trim() ? ev.testSuite : "unknown";
    const set = suitesByOperation.get(sk) ?? new Set<string>();
    set.add(suite);
    suitesByOperation.set(sk, set);
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
    suitesByOperation
  };
}

function normalizeAndFilterOperations(operations: OperationKey[], excludePatterns: string[]): OperationKey[] {
  const out: OperationKey[] = [];
  const seen = new Set<string>();

  for (const op of operations) {
    if (!op || typeof op !== "object") continue;
    if (op.kind === "http") {
      if (typeof op.method !== "string" || typeof op.route !== "string") continue;

      const method = op.method.toUpperCase();
      const route = op.route;
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

