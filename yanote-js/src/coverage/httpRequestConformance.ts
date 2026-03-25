import { match } from "path-to-regexp";
import type {
  HttpRequestParameterContract,
  HttpRequestParameterLocation,
  HttpScalarSchemaContract
} from "./dimensions.js";
import type {
  HttpEvent,
  HttpRequestEvidence,
  HttpRequestEvidenceReason,
  HttpRequestEvidenceState
} from "../model/httpEvent.js";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";
import type { HttpOperationContract } from "../spec/openapi.js";

type HttpOperation = Extract<OperationKey, { kind: "http" }>;

type TemplateMatcher = {
  operation: HttpOperation;
  matches: (route: string) => boolean;
};

type OperationAccumulator = {
  operationKey: string;
  method: string;
  route: string;
  observedCount: number;
  suites: Set<string>;
  parameters: Map<string, ParameterAccumulator>;
};

type ParameterAccumulator = {
  contract: HttpRequestParameterContract;
  observedCount: number;
  suites: Set<string>;
  truths: HttpRequestTruthCounts;
};

export type HttpRequestConformanceTruth = "captured-valid" | "captured-invalid" | "redacted" | "omitted" | "unsupported";

export type HttpRequestTruthCounts = Record<HttpRequestConformanceTruth, number>;

export type HttpRequestConformanceDiagnostic = {
  operationKey: string;
  method: string;
  route: string;
  suite: string;
  location: HttpRequestParameterLocation;
  name: string;
  required: boolean;
  style: string;
  truth: HttpRequestConformanceTruth;
  message: string;
  reason?: string;
  observedValues?: string[];
  evidenceState?: HttpRequestEvidenceState;
  evidenceReason?: HttpRequestEvidenceReason;
};

export type HttpRequestParameterConformanceSummary = {
  name: string;
  in: HttpRequestParameterLocation;
  required: boolean;
  style: string;
  explode: boolean;
  declaredSupport: "supported" | "unsupported";
  declaredSupportShape?: "scalar" | "array";
  declaredSupportReason?: "content" | "style" | "explode" | "schema";
  scalarSupport: "supported" | "unsupported";
  scalarSupportReason?: "style" | "schema";
  observedCount: number;
  truths: HttpRequestTruthCounts;
  suites: string[];
};

export type HttpRequestConformancePerOperation = {
  operationKey: string;
  method: string;
  route: string;
  observedCount: number;
  suites: string[];
  parameters: HttpRequestParameterConformanceSummary[];
};

export type HttpRequestConformanceResult = {
  perOperation: HttpRequestConformancePerOperation[];
  diagnostics: HttpRequestConformanceDiagnostic[];
};

export type ComputeHttpRequestConformanceOptions = {
  operationContractsByKey?: ReadonlyMap<string, HttpOperationContract>;
};

const HTTP_REQUEST_TRUTHS: HttpRequestConformanceTruth[] = [
  "captured-valid",
  "captured-invalid",
  "redacted",
  "omitted",
  "unsupported"
];

const LOCATION_LABELS: Record<HttpRequestParameterLocation, string> = {
  path: "path parameter",
  query: "query parameter",
  header: "request header",
  cookie: "cookie"
};

export function computeHttpRequestConformance(
  operations: OperationKey[],
  events: HttpEvent[],
  options: ComputeHttpRequestConformanceOptions = {}
): HttpRequestConformanceResult {
  const httpOperations = normalizeOperations(operations);
  const operationByKey = new Map<string, HttpOperation>();
  const accumulators = new Map<string, OperationAccumulator>();

  for (const operation of httpOperations) {
    const operationKey = serializeOperationKey(operation);
    operationByKey.set(operationKey, operation);
    accumulators.set(
      operationKey,
      createOperationAccumulator(operationKey, operation, options.operationContractsByKey?.get(operationKey)?.requestParameters ?? [])
    );
  }

  const templateMatchers = buildTemplateMatchers(httpOperations);
  const diagnostics: HttpRequestConformanceDiagnostic[] = [];

  for (const event of events) {
    const operation = resolveOperation(operationByKey, templateMatchers, event);
    if (!operation) continue;

    const operationKey = serializeOperationKey(operation);
    const accumulator = accumulators.get(operationKey);
    if (!accumulator) continue;

    const contract = options.operationContractsByKey?.get(operationKey);
    const suite = normalizeSuite(event.testSuite);
    accumulator.observedCount += 1;
    accumulator.suites.add(suite);

    for (const parameter of contract?.requestParameters ?? []) {
      const diagnostic = evaluateRequestParameter({
        event,
        suite,
        operation,
        operationKey,
        parameter
      });
      if (!diagnostic) continue;

      diagnostics.push(diagnostic);
      const parameterAccumulator = accumulator.parameters.get(parameterKey(parameter));
      if (!parameterAccumulator) continue;
      parameterAccumulator.observedCount += 1;
      parameterAccumulator.suites.add(suite);
      parameterAccumulator.truths[diagnostic.truth] += 1;
    }
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
        parameters: Array.from(accumulator.parameters.values())
          .map((parameterAccumulator) => ({
            name: parameterAccumulator.contract.name,
            in: parameterAccumulator.contract.in,
            required: parameterAccumulator.contract.required,
            style: parameterAccumulator.contract.style,
            explode: parameterAccumulator.contract.explode,
            declaredSupport: parameterAccumulator.contract.declaredSupport.support,
            ...(parameterAccumulator.contract.declaredSupport.support === "supported"
              ? { declaredSupportShape: parameterAccumulator.contract.declaredSupport.shape }
              : { declaredSupportReason: parameterAccumulator.contract.declaredSupport.reason }),
            scalarSupport: parameterAccumulator.contract.scalar.support,
            ...(parameterAccumulator.contract.scalar.support === "unsupported"
              ? { scalarSupportReason: parameterAccumulator.contract.scalar.reason }
              : {}),
            observedCount: parameterAccumulator.observedCount,
            truths: { ...parameterAccumulator.truths },
            suites: Array.from(parameterAccumulator.suites).sort((left, right) => left.localeCompare(right))
          }))
          .sort(compareParameterSummaries)
      };
    }),
    diagnostics: diagnostics.sort(compareDiagnostics)
  };
}

function evaluateRequestParameter(input: {
  event: HttpEvent;
  suite: string;
  operation: HttpOperation;
  operationKey: string;
  parameter: HttpRequestParameterContract;
}): HttpRequestConformanceDiagnostic | null {
  const evidence = lookupParameterEvidence(input.event, input.parameter);
  if (!evidence) return null;

  if (evidence.state === "redacted" || evidence.state === "omitted") {
    return {
      operationKey: input.operationKey,
      method: input.operation.method,
      route: input.operation.route,
      suite: input.suite,
      location: input.parameter.in,
      name: input.parameter.name,
      required: input.parameter.required,
      style: input.parameter.style,
      truth: evidence.state,
      message: buildUnavailableMessage(input.parameter),
      reason: buildUnavailableReason(input.parameter, evidence),
      evidenceState: evidence.state,
      evidenceReason: evidence.reason
    };
  }

  const observedValues = evidence.values ?? [];
  if (input.parameter.declaredSupport.support === "unsupported") {
    return {
      operationKey: input.operationKey,
      method: input.operation.method,
      route: input.operation.route,
      suite: input.suite,
      location: input.parameter.in,
      name: input.parameter.name,
      required: input.parameter.required,
      style: input.parameter.style,
      truth: "unsupported",
      message: "Observed retained value falls outside the current first-scalar OpenAPI support subset.",
      reason: buildUnsupportedContractReason(input.parameter),
      observedValues: [...observedValues],
      evidenceState: evidence.state
    };
  }

  if (input.parameter.declaredSupport.shape === "scalar") {
    return evaluateSupportedScalarParameter(input, evidence, observedValues);
  }

  return evaluateSupportedRepeatedQueryArrayParameter(input, evidence, observedValues);
}

function evaluateSupportedScalarParameter(
  input: {
    suite: string;
    operation: HttpOperation;
    operationKey: string;
    parameter: HttpRequestParameterContract & {
      declaredSupport: Extract<HttpRequestParameterContract["declaredSupport"], { support: "supported"; shape: "scalar" }>;
    };
  },
  evidence: HttpRequestEvidence,
  observedValues: string[]
): HttpRequestConformanceDiagnostic {
  if (observedValues.length !== 1) {
    return {
      operationKey: input.operationKey,
      method: input.operation.method,
      route: input.operation.route,
      suite: input.suite,
      location: input.parameter.in,
      name: input.parameter.name,
      required: input.parameter.required,
      style: input.parameter.style,
      truth: "unsupported",
      message: "Observed retained value falls outside the current first-scalar OpenAPI support subset.",
      reason: `Observed ${LOCATION_LABELS[input.parameter.in]} '${input.parameter.name}' retained ${observedValues.length} values; first-scalar validation only supports a single retained value.`,
      observedValues: [...observedValues],
      evidenceState: evidence.state
    };
  }

  const observedValue = observedValues[0]!;
  const validation = validateObservedScalar(observedValue, input.parameter.declaredSupport.schema);
  if (validation.valid) {
    return {
      operationKey: input.operationKey,
      method: input.operation.method,
      route: input.operation.route,
      suite: input.suite,
      location: input.parameter.in,
      name: input.parameter.name,
      required: input.parameter.required,
      style: input.parameter.style,
      truth: "captured-valid",
      message: "Observed retained value satisfies the supported first-scalar OpenAPI contract.",
      observedValues: [observedValue],
      evidenceState: evidence.state
    };
  }

  return {
    operationKey: input.operationKey,
    method: input.operation.method,
    route: input.operation.route,
    suite: input.suite,
    location: input.parameter.in,
    name: input.parameter.name,
    required: input.parameter.required,
    style: input.parameter.style,
    truth: "captured-invalid",
    message: "Observed retained value does not satisfy the supported first-scalar OpenAPI contract.",
    reason: validation.reason,
    observedValues: [observedValue],
    evidenceState: evidence.state
  };
}

function evaluateSupportedRepeatedQueryArrayParameter(
  input: {
    suite: string;
    operation: HttpOperation;
    operationKey: string;
    parameter: HttpRequestParameterContract & {
      declaredSupport: Extract<HttpRequestParameterContract["declaredSupport"], { support: "supported"; shape: "array" }>;
    };
  },
  evidence: HttpRequestEvidence,
  observedValues: string[]
): HttpRequestConformanceDiagnostic {
  if (observedValues.length === 0) {
    return {
      operationKey: input.operationKey,
      method: input.operation.method,
      route: input.operation.route,
      suite: input.suite,
      location: input.parameter.in,
      name: input.parameter.name,
      required: input.parameter.required,
      style: input.parameter.style,
      truth: "unsupported",
      message: "Observed retained value falls outside the current first-scalar OpenAPI support subset.",
      reason: `Observed ${LOCATION_LABELS[input.parameter.in]} '${input.parameter.name}' retained no values; repeated query-array validation requires at least one retained value.`,
      observedValues: [],
      evidenceState: evidence.state
    };
  }

  for (const [index, observedValue] of observedValues.entries()) {
    const validation = validateObservedScalar(observedValue, input.parameter.declaredSupport.items);
    if (!validation.valid) {
      return {
        operationKey: input.operationKey,
        method: input.operation.method,
        route: input.operation.route,
        suite: input.suite,
        location: input.parameter.in,
        name: input.parameter.name,
        required: input.parameter.required,
        style: input.parameter.style,
        truth: "captured-invalid",
        message: "Observed retained values do not satisfy the supported repeated query-array OpenAPI contract.",
        reason: `Observed ${LOCATION_LABELS[input.parameter.in]} '${input.parameter.name}' retained item ${index + 1} failed validation. ${validation.reason}`,
        observedValues: [...observedValues],
        evidenceState: evidence.state
      };
    }
  }

  return {
    operationKey: input.operationKey,
    method: input.operation.method,
    route: input.operation.route,
    suite: input.suite,
    location: input.parameter.in,
    name: input.parameter.name,
    required: input.parameter.required,
    style: input.parameter.style,
    truth: "captured-valid",
    message: "Observed retained values satisfy the supported repeated query-array OpenAPI contract.",
    observedValues: [...observedValues],
    evidenceState: evidence.state
  };
}

function lookupParameterEvidence(event: HttpEvent, parameter: HttpRequestParameterContract): HttpRequestEvidence | undefined {
  switch (parameter.in) {
    case "path":
      return event.pathParams?.[parameter.name];
    case "query":
      return event.queryParams?.[parameter.name];
    case "header":
      return event.requestHeaders?.[parameter.name.toLowerCase()];
    case "cookie":
      return event.cookies?.[parameter.name];
  }
}

function validateObservedScalar(
  observedValue: string,
  schema: HttpScalarSchemaContract
): { valid: true } | { valid: false; reason: string } {
  const parsed = parseObservedScalar(observedValue, schema.type);
  if (!parsed.ok) {
    return { valid: false, reason: parsed.reason };
  }

  if (schema.enum && !schema.enum.some((entry) => entry === parsed.value)) {
    return {
      valid: false,
      reason: `Observed value '${observedValue}' is not one of the declared enum values.`
    };
  }

  switch (schema.type) {
    case "string": {
      const scalarValue = parsed.value;
      if (typeof scalarValue !== "string") {
        return { valid: false, reason: `Observed value '${observedValue}' is not a supported string wire value.` };
      }

      if (schema.minLength !== undefined && scalarValue.length < schema.minLength) {
        return {
          valid: false,
          reason: `Observed value '${observedValue}' is shorter than the declared minLength ${schema.minLength}.`
        };
      }

      if (schema.maxLength !== undefined && scalarValue.length > schema.maxLength) {
        return {
          valid: false,
          reason: `Observed value '${observedValue}' is longer than the declared maxLength ${schema.maxLength}.`
        };
      }

      if (schema.pattern !== undefined && !(new RegExp(schema.pattern).test(scalarValue))) {
        return {
          valid: false,
          reason: `Observed value '${observedValue}' does not match the declared pattern ${schema.pattern}.`
        };
      }

      return { valid: true };
    }
    case "boolean":
      return { valid: true };
    case "integer":
    case "number": {
      const scalarValue = parsed.value;
      if (typeof scalarValue !== "number") {
        return { valid: false, reason: `Observed value '${observedValue}' is not a supported numeric wire value.` };
      }

      if (schema.minimum !== undefined && scalarValue < schema.minimum) {
        return {
          valid: false,
          reason: `Observed value '${observedValue}' is below the declared minimum ${schema.minimum}.`
        };
      }

      if (schema.maximum !== undefined && scalarValue > schema.maximum) {
        return {
          valid: false,
          reason: `Observed value '${observedValue}' is above the declared maximum ${schema.maximum}.`
        };
      }

      if (schema.exclusiveMinimum !== undefined && scalarValue <= schema.exclusiveMinimum) {
        return {
          valid: false,
          reason: `Observed value '${observedValue}' is not greater than the declared exclusiveMinimum ${schema.exclusiveMinimum}.`
        };
      }

      if (schema.exclusiveMaximum !== undefined && scalarValue >= schema.exclusiveMaximum) {
        return {
          valid: false,
          reason: `Observed value '${observedValue}' is not less than the declared exclusiveMaximum ${schema.exclusiveMaximum}.`
        };
      }

      if (schema.multipleOf !== undefined && !isMultipleOf(scalarValue, schema.multipleOf)) {
        return {
          valid: false,
          reason: `Observed value '${observedValue}' is not a multiple of the declared multipleOf ${schema.multipleOf}.`
        };
      }

      return { valid: true };
    }
  }
}

function parseObservedScalar(
  observedValue: string,
  type: HttpScalarSchemaContract["type"]
):
  | { ok: true; value: string | number | boolean }
  | {
      ok: false;
      reason: string;
    } {
  switch (type) {
    case "string":
      return { ok: true, value: observedValue };
    case "boolean":
      if (observedValue === "true") return { ok: true, value: true };
      if (observedValue === "false") return { ok: true, value: false };
      return {
        ok: false,
        reason: `Observed value '${observedValue}' is not a supported boolean wire value ('true' or 'false').`
      };
    case "integer":
      if (!/^-?(?:0|[1-9]\d*)$/.test(observedValue)) {
        return {
          ok: false,
          reason: `Observed value '${observedValue}' is not a supported integer wire value.`
        };
      }
      return { ok: true, value: Number(observedValue) };
    case "number":
      if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(observedValue)) {
        return {
          ok: false,
          reason: `Observed value '${observedValue}' is not a supported numeric wire value.`
        };
      }
      return { ok: true, value: Number(observedValue) };
  }
}

function isMultipleOf(value: number, multipleOf: number): boolean {
  const quotient = value / multipleOf;
  return Math.abs(quotient - Math.round(quotient)) < 1e-9;
}

function buildUnavailableMessage(parameter: HttpRequestParameterContract): string {
  if (parameter.declaredSupport.support === "supported" && parameter.declaredSupport.shape === "array") {
    return `Observed ${LOCATION_LABELS[parameter.in]} value was unavailable for repeated query-array validation.`;
  }

  if (parameter.declaredSupport.support === "unsupported") {
    return `Observed ${LOCATION_LABELS[parameter.in]} value was unavailable for supported-subset validation.`;
  }

  return `Observed ${LOCATION_LABELS[parameter.in]} value was unavailable for first-scalar validation.`;
}

function buildUnavailableReason(parameter: HttpRequestParameterContract, evidence: HttpRequestEvidence): string {
  const reasonSuffix = evidence.reason ? ` (reason: ${evidence.reason})` : "";
  return `Observed ${LOCATION_LABELS[parameter.in]} '${parameter.name}' was retained as ${evidence.state} evidence${reasonSuffix}, so its value could not be validated.`;
}

function buildUnsupportedContractReason(parameter: HttpRequestParameterContract): string {
  if (parameter.declaredSupport.support !== "unsupported") {
    return `Observed ${LOCATION_LABELS[parameter.in]} '${parameter.name}' fell outside the declared request-support subset.`;
  }

  switch (parameter.declaredSupport.reason) {
    case "content":
      return `Observed ${LOCATION_LABELS[parameter.in]} '${parameter.name}' uses OpenAPI content serialization, which is outside the supported request subset.`;
    case "style":
      return `Observed ${LOCATION_LABELS[parameter.in]} '${parameter.name}' uses OpenAPI style '${parameter.style}', which is outside the supported first-scalar subset.`;
    case "explode":
      return `Observed ${LOCATION_LABELS[parameter.in]} '${parameter.name}' uses explode=${parameter.explode}, which is outside the supported repeated query-array subset.`;
    case "schema":
      return `Observed ${LOCATION_LABELS[parameter.in]} '${parameter.name}' uses an OpenAPI schema outside the supported first-scalar subset.`;
  }
}

function createOperationAccumulator(
  operationKey: string,
  operation: HttpOperation,
  parameters: HttpRequestParameterContract[]
): OperationAccumulator {
  return {
    operationKey,
    method: operation.method,
    route: operation.route,
    observedCount: 0,
    suites: new Set<string>(),
    parameters: new Map(parameters.map((parameter) => [parameterKey(parameter), createParameterAccumulator(parameter)]))
  };
}

function createParameterAccumulator(contract: HttpRequestParameterContract): ParameterAccumulator {
  return {
    contract,
    observedCount: 0,
    suites: new Set<string>(),
    truths: createEmptyTruthCounts()
  };
}

function createEmptyTruthCounts(): HttpRequestTruthCounts {
  return {
    "captured-valid": 0,
    "captured-invalid": 0,
    redacted: 0,
    omitted: 0,
    unsupported: 0
  };
}

function parameterKey(parameter: Pick<HttpRequestParameterContract, "in" | "name">): string {
  return `${parameter.in}:${parameter.name}`;
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

function compareParameterSummaries(
  left: Pick<HttpRequestParameterConformanceSummary, "in" | "name">,
  right: Pick<HttpRequestParameterConformanceSummary, "in" | "name">
): number {
  const locationOrder: Record<HttpRequestParameterLocation, number> = {
    path: 0,
    query: 1,
    header: 2,
    cookie: 3
  };

  const locationDelta = locationOrder[left.in] - locationOrder[right.in];
  if (locationDelta !== 0) return locationDelta;
  return left.name.localeCompare(right.name);
}

function compareDiagnostics(left: HttpRequestConformanceDiagnostic, right: HttpRequestConformanceDiagnostic): number {
  if (left.operationKey !== right.operationKey) return left.operationKey.localeCompare(right.operationKey);

  const locationOrder: Record<HttpRequestParameterLocation, number> = {
    path: 0,
    query: 1,
    header: 2,
    cookie: 3
  };
  const locationDelta = locationOrder[left.location] - locationOrder[right.location];
  if (locationDelta !== 0) return locationDelta;

  if (left.name !== right.name) return left.name.localeCompare(right.name);
  const truthDelta = HTTP_REQUEST_TRUTHS.indexOf(left.truth) - HTTP_REQUEST_TRUTHS.indexOf(right.truth);
  if (truthDelta !== 0) return truthDelta;
  if ((left.reason ?? "") !== (right.reason ?? "")) return (left.reason ?? "").localeCompare(right.reason ?? "");
  if ((left.observedValues ?? []).join("\u0000") !== (right.observedValues ?? []).join("\u0000")) {
    return (left.observedValues ?? []).join("\u0000").localeCompare((right.observedValues ?? []).join("\u0000"));
  }
  return left.suite.localeCompare(right.suite);
}
