import { match } from "path-to-regexp";
import type { HttpEvent, HttpRequestEvidence, HttpRequestEvidenceReason, HttpRequestEvidenceState } from "../model/httpEvent.js";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";
import type {
  HttpOperationContract,
  HttpOperationSecurityContract,
  HttpSecurityRequirementContract,
  HttpSecuritySchemeContract
} from "../spec/openapi.js";

type HttpOperation = Extract<OperationKey, { kind: "http" }>;

type TemplateMatcher = {
  operation: HttpOperation;
  matches: (route: string) => boolean;
};

type SecurityBranchKind = "requirement" | "optional" | "clear";

type BranchDefinition = {
  branchIndex: number;
  kind: SecurityBranchKind;
  requirement?: HttpSecurityRequirementContract;
};

type BranchAccumulator = {
  branchIndex: number;
  kind: SecurityBranchKind;
  requirement?: HttpSecurityRequirementContract;
  observedCount: number;
  suites: Set<string>;
  truths: HttpSecurityTruthCounts;
};

type OperationAccumulator = {
  operationKey: string;
  method: string;
  route: string;
  observedCount: number;
  suites: Set<string>;
  overallTruths: HttpSecurityTruthCounts;
  branches: Map<number, BranchAccumulator>;
};

type BranchEvaluation = {
  branchIndex: number;
  kind: SecurityBranchKind;
  truth: HttpSecurityConformanceTruth;
  schemeName?: string;
  schemeType?: HttpSecuritySchemeContract["type"];
  schemeLocation?: string;
  schemeKeyName?: string;
  evidenceState?: HttpRequestEvidenceState;
  evidenceReason?: HttpRequestEvidenceReason;
  message: string;
};

export type HttpSecurityConformanceTruth = "satisfied" | "missing" | "unavailable" | "unsupported" | "optional" | "clear";

export type HttpSecurityTruthCounts = Record<HttpSecurityConformanceTruth, number>;

export type HttpSecurityConformanceDiagnostic = {
  operationKey: string;
  method: string;
  route: string;
  suite: string;
  truth: HttpSecurityConformanceTruth;
  branchIndex: number;
  branchKind: SecurityBranchKind;
  message: string;
  schemeName?: string;
  schemeType?: HttpSecuritySchemeContract["type"];
  schemeLocation?: string;
  schemeKeyName?: string;
  evidenceState?: HttpRequestEvidenceState;
  evidenceReason?: HttpRequestEvidenceReason;
};

export type HttpSecuritySchemeSummary = {
  schemeName: string;
  type: HttpSecuritySchemeContract["type"];
  location?: string;
  keyName?: string;
  scopes: string[];
};

export type HttpSecurityBranchSummary = {
  branchIndex: number;
  kind: SecurityBranchKind;
  observedCount: number;
  truths: HttpSecurityTruthCounts;
  schemes: HttpSecuritySchemeSummary[];
  suites: string[];
};

export type HttpSecurityConformancePerOperation = {
  operationKey: string;
  method: string;
  route: string;
  observedCount: number;
  suites: string[];
  overallTruths: HttpSecurityTruthCounts;
  branches: HttpSecurityBranchSummary[];
};

export type HttpSecurityConformanceResult = {
  perOperation: HttpSecurityConformancePerOperation[];
  diagnostics: HttpSecurityConformanceDiagnostic[];
};

export type ComputeHttpSecurityConformanceOptions = {
  operationContractsByKey?: ReadonlyMap<string, HttpOperationContract>;
};

const FAILURE_PRIORITY: Record<Extract<HttpSecurityConformanceTruth, "unsupported" | "unavailable" | "missing">, number> = {
  unsupported: 0,
  unavailable: 1,
  missing: 2
};

export function computeHttpSecurityConformance(
  operations: OperationKey[],
  events: HttpEvent[],
  options: ComputeHttpSecurityConformanceOptions = {}
): HttpSecurityConformanceResult {
  const httpOperations = normalizeOperations(operations);
  const operationByKey = new Map<string, HttpOperation>();
  const accumulators = new Map<string, OperationAccumulator>();

  for (const operation of httpOperations) {
    const operationKey = serializeOperationKey(operation);
    const contract = options.operationContractsByKey?.get(operationKey);
    const branchDefinitions = buildBranchDefinitions(contract?.security);

    operationByKey.set(operationKey, operation);
    accumulators.set(operationKey, createOperationAccumulator(operationKey, operation, branchDefinitions));
  }

  const templateMatchers = buildTemplateMatchers(httpOperations);
  const diagnostics: HttpSecurityConformanceDiagnostic[] = [];

  for (const event of events) {
    const operation = resolveOperation(operationByKey, templateMatchers, event);
    if (!operation) continue;

    const operationKey = serializeOperationKey(operation);
    const accumulator = accumulators.get(operationKey);
    if (!accumulator) continue;

    const branchDefinitions = Array.from(accumulator.branches.values()).map((branch) => ({
      branchIndex: branch.branchIndex,
      kind: branch.kind,
      requirement: branch.requirement
    }));
    if (branchDefinitions.length === 0) {
      accumulator.observedCount += 1;
      accumulator.suites.add(normalizeSuite(event.testSuite));
      continue;
    }

    const suite = normalizeSuite(event.testSuite);
    accumulator.observedCount += 1;
    accumulator.suites.add(suite);

    const branchEvaluations = branchDefinitions.map((branch) => evaluateBranch(event, branch));
    for (const branchEvaluation of branchEvaluations) {
      const branchAccumulator = accumulator.branches.get(branchEvaluation.branchIndex);
      if (!branchAccumulator) continue;

      branchAccumulator.observedCount += 1;
      branchAccumulator.suites.add(suite);
      branchAccumulator.truths[branchEvaluation.truth] += 1;
    }

    const overall = selectOverallEvaluation(branchEvaluations);
    accumulator.overallTruths[overall.truth] += 1;
    diagnostics.push(createDiagnostic(operation, operationKey, suite, overall));
  }

  return {
    perOperation: httpOperations.map((operation) => {
      const operationKey = serializeOperationKey(operation);
      const accumulator = accumulators.get(operationKey) ?? createOperationAccumulator(operationKey, operation, []);

      return {
        operationKey,
        method: operation.method,
        route: operation.route,
        observedCount: accumulator.observedCount,
        suites: Array.from(accumulator.suites).sort((left, right) => left.localeCompare(right)),
        overallTruths: { ...accumulator.overallTruths },
        branches: Array.from(accumulator.branches.values())
          .sort((left, right) => left.branchIndex - right.branchIndex)
          .map((branch) => ({
            branchIndex: branch.branchIndex,
            kind: branch.kind,
            observedCount: branch.observedCount,
            truths: { ...branch.truths },
            schemes: summarizeBranchSchemes(branch),
            suites: Array.from(branch.suites).sort((left, right) => left.localeCompare(right))
          }))
      };
    }),
    diagnostics: diagnostics.sort(compareDiagnostics)
  };
}

function buildBranchDefinitions(security: HttpOperationSecurityContract | undefined): BranchDefinition[] {
  if (!security) {
    return [];
  }

  if (security.cleared && security.requirements.length === 0) {
    return [{ branchIndex: 0, kind: "clear" }];
  }

  if (security.source === "implicit-open" && security.requirements.length === 0) {
    return [];
  }

  return security.requirements.map((requirement, branchIndex) => ({
    branchIndex,
    kind: requirement.schemes.length === 0 ? "optional" : "requirement",
    requirement
  }));
}

function evaluateBranch(event: HttpEvent, branch: BranchDefinition): BranchEvaluation {
  if (branch.kind === "clear") {
    return {
      branchIndex: branch.branchIndex,
      kind: "clear",
      truth: "clear",
      message: "Operation explicitly clears inherited OpenAPI security requirements with security: []."
    };
  }

  if (branch.kind === "optional") {
    return {
      branchIndex: branch.branchIndex,
      kind: "optional",
      truth: "optional",
      message: "Security requirement branch is optional via an empty Security Requirement Object ({})."
    };
  }

  const requirement = branch.requirement;
  if (!requirement) {
    return {
      branchIndex: branch.branchIndex,
      kind: "requirement",
      truth: "unsupported",
      message: "Security requirement branch could not be evaluated because the extracted requirement is missing."
    };
  }

  const failures: BranchEvaluation[] = [];
  for (const schemeEntry of requirement.schemes) {
    const evaluation = evaluateScheme(event, branch.branchIndex, schemeEntry.scheme);
    if (evaluation.truth === "satisfied") {
      continue;
    }
    failures.push(evaluation);
  }

  if (failures.length === 0) {
    return {
      branchIndex: branch.branchIndex,
      kind: "requirement",
      truth: "satisfied",
      message:
        requirement.schemes.length === 1
          ? "Retained request evidence satisfies the supported security requirement branch."
          : "Retained request evidence satisfies every supported scheme in the security requirement branch."
    };
  }

  return failures.sort(compareBranchFailures)[0]!;
}

function evaluateScheme(
  event: HttpEvent,
  branchIndex: number,
  scheme: HttpSecuritySchemeContract
): BranchEvaluation {
  if (scheme.type !== "apiKey") {
    return {
      branchIndex,
      kind: "requirement",
      truth: "unsupported",
      schemeName: scheme.schemeName,
      schemeType: scheme.type,
      message: buildUnsupportedSchemeTypeMessage(scheme)
    };
  }

  if (scheme.in !== "query" && scheme.in !== "header" && scheme.in !== "cookie") {
    return {
      branchIndex,
      kind: "requirement",
      truth: "unsupported",
      schemeName: scheme.schemeName,
      schemeType: scheme.type,
      schemeLocation: scheme.in,
      schemeKeyName: scheme.keyName,
      message: `apiKey security scheme '${scheme.schemeName}' uses unsupported location '${scheme.in}'. Only query, header, and cookie apiKey locations are currently supported.`
    };
  }

  const evidence = lookupSecurityEvidence(event, scheme);
  if (!evidence) {
    return {
      branchIndex,
      kind: "requirement",
      truth: "missing",
      schemeName: scheme.schemeName,
      schemeType: scheme.type,
      schemeLocation: scheme.in,
      schemeKeyName: scheme.keyName,
      message: `Required ${scheme.in} apiKey '${scheme.keyName}' for security scheme '${scheme.schemeName}' was not retained in request evidence.`
    };
  }

  if (evidence.state === "redacted" || evidence.state === "omitted") {
    return {
      branchIndex,
      kind: "requirement",
      truth: "unavailable",
      schemeName: scheme.schemeName,
      schemeType: scheme.type,
      schemeLocation: scheme.in,
      schemeKeyName: scheme.keyName,
      evidenceState: evidence.state,
      evidenceReason: evidence.reason,
      message: buildUnavailableMessage(scheme, evidence)
    };
  }

  return {
    branchIndex,
    kind: "requirement",
    truth: "satisfied",
    schemeName: scheme.schemeName,
    schemeType: scheme.type,
    schemeLocation: scheme.in,
    schemeKeyName: scheme.keyName,
    message: `Required ${scheme.in} apiKey '${scheme.keyName}' for security scheme '${scheme.schemeName}' was retained in request evidence.`
  };
}

function selectOverallEvaluation(branchEvaluations: BranchEvaluation[]): BranchEvaluation {
  const clear = branchEvaluations.find((branch) => branch.truth === "clear");
  if (clear) {
    return clear;
  }

  const satisfied = branchEvaluations.find((branch) => branch.truth === "satisfied");
  if (satisfied) {
    return satisfied;
  }

  const optional = branchEvaluations.find((branch) => branch.truth === "optional");
  if (optional) {
    return optional;
  }

  return [...branchEvaluations].sort(compareOverallEvaluations)[0]!;
}

function buildUnsupportedSchemeTypeMessage(scheme: HttpSecuritySchemeContract): string {
  switch (scheme.type) {
    case "http":
      return `Security scheme '${scheme.schemeName}' uses OpenAPI type 'http', which is outside the current truthful apiKey-only conformance subset.`;
    case "oauth2":
      return `Security scheme '${scheme.schemeName}' uses OpenAPI type 'oauth2', which is outside the current truthful apiKey-only conformance subset.`;
    case "openIdConnect":
      return `Security scheme '${scheme.schemeName}' uses OpenAPI type 'openIdConnect', which is outside the current truthful apiKey-only conformance subset.`;
    case "mutualTLS":
      return `Security scheme '${scheme.schemeName}' uses OpenAPI type 'mutualTLS', which is outside the current truthful apiKey-only conformance subset.`;
    case "unsupported":
      return scheme.rawType
        ? `Security scheme '${scheme.schemeName}' uses unsupported OpenAPI type '${scheme.rawType}'.`
        : `Security scheme '${scheme.schemeName}' uses an unsupported OpenAPI security type.`;
    case "apiKey":
      return `Security scheme '${scheme.schemeName}' is unsupported in the current truthful apiKey-only conformance subset.`;
  }
}

function buildUnavailableMessage(scheme: Extract<HttpSecuritySchemeContract, { type: "apiKey" }>, evidence: HttpRequestEvidence): string {
  const reasonSuffix = evidence.reason ? ` (reason: ${evidence.reason})` : "";
  return `Required ${scheme.in} apiKey '${scheme.keyName}' for security scheme '${scheme.schemeName}' was retained as ${evidence.state} evidence${reasonSuffix}, so presence could not be proven.`;
}

function lookupSecurityEvidence(
  event: HttpEvent,
  scheme: Extract<HttpSecuritySchemeContract, { type: "apiKey"; in: string }>
): HttpRequestEvidence | undefined {
  switch (scheme.in) {
    case "query":
      return event.queryParams?.[scheme.keyName];
    case "header":
      return event.requestHeaders?.[scheme.keyName.toLowerCase()];
    case "cookie":
      return event.cookies?.[scheme.keyName];
    default:
      return undefined;
  }
}

function createDiagnostic(
  operation: HttpOperation,
  operationKey: string,
  suite: string,
  evaluation: BranchEvaluation
): HttpSecurityConformanceDiagnostic {
  return {
    operationKey,
    method: operation.method,
    route: operation.route,
    suite,
    truth: evaluation.truth,
    branchIndex: evaluation.branchIndex,
    branchKind: evaluation.kind,
    message: evaluation.message,
    ...(evaluation.schemeName ? { schemeName: evaluation.schemeName } : {}),
    ...(evaluation.schemeType ? { schemeType: evaluation.schemeType } : {}),
    ...(evaluation.schemeLocation ? { schemeLocation: evaluation.schemeLocation } : {}),
    ...(evaluation.schemeKeyName ? { schemeKeyName: evaluation.schemeKeyName } : {}),
    ...(evaluation.evidenceState ? { evidenceState: evaluation.evidenceState } : {}),
    ...(evaluation.evidenceReason ? { evidenceReason: evaluation.evidenceReason } : {})
  };
}

function createOperationAccumulator(
  operationKey: string,
  operation: HttpOperation,
  branches: BranchDefinition[]
): OperationAccumulator {
  return {
    operationKey,
    method: operation.method,
    route: operation.route,
    observedCount: 0,
    suites: new Set<string>(),
    overallTruths: createEmptyTruthCounts(),
    branches: new Map(
      branches.map((branch) => [
        branch.branchIndex,
        {
          branchIndex: branch.branchIndex,
          kind: branch.kind,
          requirement: branch.requirement,
          observedCount: 0,
          suites: new Set<string>(),
          truths: createEmptyTruthCounts()
        } satisfies BranchAccumulator
      ])
    )
  };
}

function createEmptyTruthCounts(): HttpSecurityTruthCounts {
  return {
    satisfied: 0,
    missing: 0,
    unavailable: 0,
    unsupported: 0,
    optional: 0,
    clear: 0
  };
}

function summarizeBranchSchemes(branch: BranchAccumulator): HttpSecuritySchemeSummary[] {
  if (!branch.requirement) {
    return [];
  }

  return branch.requirement.schemes.map((schemeEntry) => ({
    schemeName: schemeEntry.scheme.schemeName,
    type: schemeEntry.scheme.type,
    location: schemeEntry.scheme.type === "apiKey" ? schemeEntry.scheme.in : undefined,
    keyName: schemeEntry.scheme.type === "apiKey" ? schemeEntry.scheme.keyName : undefined,
    scopes: [...schemeEntry.scopes]
  }));
}

function compareOverallEvaluations(left: BranchEvaluation, right: BranchEvaluation): number {
  const leftPriority = FAILURE_PRIORITY[left.truth as Extract<HttpSecurityConformanceTruth, "unsupported" | "unavailable" | "missing">];
  const rightPriority = FAILURE_PRIORITY[right.truth as Extract<HttpSecurityConformanceTruth, "unsupported" | "unavailable" | "missing">];
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  if (left.branchIndex !== right.branchIndex) {
    return left.branchIndex - right.branchIndex;
  }

  return compareBranchFailures(left, right);
}

function compareBranchFailures(left: BranchEvaluation, right: BranchEvaluation): number {
  const leftPriority = FAILURE_PRIORITY[left.truth as Extract<HttpSecurityConformanceTruth, "unsupported" | "unavailable" | "missing">];
  const rightPriority = FAILURE_PRIORITY[right.truth as Extract<HttpSecurityConformanceTruth, "unsupported" | "unavailable" | "missing">];
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  if ((left.schemeName ?? "") !== (right.schemeName ?? "")) {
    return (left.schemeName ?? "").localeCompare(right.schemeName ?? "");
  }

  if ((left.schemeLocation ?? "") !== (right.schemeLocation ?? "")) {
    return (left.schemeLocation ?? "").localeCompare(right.schemeLocation ?? "");
  }

  return (left.schemeKeyName ?? "").localeCompare(right.schemeKeyName ?? "");
}

function normalizeOperations(operations: OperationKey[]): HttpOperation[] {
  const out: HttpOperation[] = [];
  const seen = new Set<string>();

  for (const operation of operations) {
    if (!operation || typeof operation !== "object") continue;
    if (operation.kind !== "http") continue;
    if (typeof operation.method !== "string" || typeof operation.route !== "string") continue;

    const normalized: HttpOperation = {
      kind: "http",
      method: operation.method.toUpperCase(),
      route: normalizeTemplatedRoute(operation.route)
    };
    const key = serializeOperationKey(normalized);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }

  return out;
}

function buildTemplateMatchers(operations: HttpOperation[]): TemplateMatcher[] {
  return operations
    .filter((operation) => operation.route.includes("{"))
    .map((operation) => {
      let index = 0;
      const routeMatcher = match<Record<string, string>>(operation.route.replace(/\{[^/}]+\}/g, () => `:param${index++}`), {
        end: true,
        decode: decodeURIComponent
      });

      return {
        operation,
        matches: (route: string) => routeMatcher(route) !== false
      };
    });
}

function resolveOperation(
  operationByKey: Map<string, HttpOperation>,
  templateMatchers: TemplateMatcher[],
  event: HttpEvent
): HttpOperation | undefined {
  const method = typeof event.method === "string" ? event.method.toUpperCase() : undefined;
  const route = typeof event.route === "string" ? event.route : undefined;
  if (!method || !route) return undefined;

  const exact = operationByKey.get(serializeOperationKey({ kind: "http", method, route }));
  if (exact) return exact;

  const matches = templateMatchers.filter((matcher) => matcher.operation.method === method && matcher.matches(route));
  if (matches.length !== 1) return undefined;
  return matches[0].operation;
}

function normalizeTemplatedRoute(route: string): string {
  return route.trim().replace(/\{[^/}]+\}/g, "{param}");
}

function normalizeSuite(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "unknown";
}

function compareDiagnostics(left: HttpSecurityConformanceDiagnostic, right: HttpSecurityConformanceDiagnostic): number {
  if (left.operationKey !== right.operationKey) return left.operationKey.localeCompare(right.operationKey);
  if (left.branchIndex !== right.branchIndex) return left.branchIndex - right.branchIndex;
  if (left.truth !== right.truth) return left.truth.localeCompare(right.truth);
  if ((left.schemeName ?? "") !== (right.schemeName ?? "")) {
    return (left.schemeName ?? "").localeCompare(right.schemeName ?? "");
  }
  return left.suite.localeCompare(right.suite);
}
