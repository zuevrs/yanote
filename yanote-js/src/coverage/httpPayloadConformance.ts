import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { match } from "path-to-regexp";
import type { DeclaredStatusToken } from "./dimensions.js";
import type { HttpEvent, JsonValue } from "../model/httpEvent.js";
import type { PayloadCaptureReason, PayloadCaptureState } from "../model/payloadCapture.js";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";
import type {
  HttpMediaTypeContract,
  HttpOperationContract,
  HttpResponseBodyContract,
  JsonSchemaContract
} from "../spec/openapi.js";

type HttpOperation = Extract<OperationKey, { kind: "http" }>;

type TemplateMatcher = {
  operation: HttpOperation;
  matches: (route: string) => boolean;
};

type ValidatorCacheEntry =
  | {
      kind: "validator";
      validator: ValidateFunction<JsonValue>;
    }
  | {
      kind: "unsupported-format";
      schemaPath: string;
      format: string;
    }
  | {
      kind: "unsupported";
      errors: string[];
    };

type TargetAccumulator = {
  observedCount: number;
  validCount: number;
  invalidCount: number;
  skippedCount: number;
  observedMediaTypes: Set<string>;
};

type OperationAccumulator = {
  operationKey: string;
  method: string;
  route: string;
  suites: Set<string>;
  request: TargetAccumulator;
  response: TargetAccumulator;
};

export type HttpPayloadConformanceState = "COVERED" | "PARTIAL" | "UNCOVERED" | "SKIPPED" | "N/A";

export type HttpPayloadConformanceCode =
  | "VALID"
  | "INVALID_BODY"
  | "MISSING_BODY"
  | "MISSING_CONTENT_TYPE"
  | "MEDIA_TYPE_MISMATCH"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "UNSUPPORTED_SCHEMA_FORMAT"
  | "UNSUPPORTED_SCHEMA"
  | "NO_DECLARED_CONTENT"
  | "RECORDER_OMITTED";

export type HttpPayloadConformanceDiagnostic = {
  operationKey: string;
  method: string;
  route: string;
  target: "request" | "response";
  suite: string;
  state: "COVERED" | "UNCOVERED" | "SKIPPED";
  code: HttpPayloadConformanceCode;
  message: string;
  declaredStatus?: DeclaredStatusToken;
  observedStatus?: number;
  observedMediaType?: string;
  declaredMediaTypes: string[];
  captureState?: PayloadCaptureState;
  captureReason?: PayloadCaptureReason;
  errors?: string[];
};
export type HttpPayloadTargetSummary = {
  state: HttpPayloadConformanceState;
  observedCount: number;
  validCount: number;
  invalidCount: number;
  skippedCount: number;
  declaredMediaTypes: string[];
  observedMediaTypes: string[];
};

export type HttpPayloadResponseSummary = HttpPayloadTargetSummary & {
  declaredContent: Array<{
    declaredStatus: DeclaredStatusToken;
    mediaTypes: string[];
  }>;
};

export type HttpPayloadConformancePerOperation = {
  operationKey: string;
  method: string;
  route: string;
  request: HttpPayloadTargetSummary;
  response: HttpPayloadResponseSummary;
  suites: string[];
};

export type HttpPayloadConformanceResult = {
  perOperation: HttpPayloadConformancePerOperation[];
  diagnostics: HttpPayloadConformanceDiagnostic[];
};

export type ComputeHttpPayloadConformanceOptions = {
  operationContractsByKey?: ReadonlyMap<string, HttpOperationContract>;
};

const SUPPORTED_PAYLOAD_SCHEMA_FORMATS = new Set(["email"]);

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: true
});
addFormats(ajv, [...SUPPORTED_PAYLOAD_SCHEMA_FORMATS]);

export function computeHttpPayloadConformance(
  operations: OperationKey[],
  events: HttpEvent[],
  options: ComputeHttpPayloadConformanceOptions = {}
): HttpPayloadConformanceResult {
  const httpOperations = normalizeOperations(operations);
  const operationByKey = new Map<string, HttpOperation>();
  const accumulators = new Map<string, OperationAccumulator>();

  for (const operation of httpOperations) {
    const operationKey = serializeOperationKey(operation);
    operationByKey.set(operationKey, operation);
    accumulators.set(operationKey, createOperationAccumulator(operationKey, operation));
  }

  const templateMatchers = buildTemplateMatchers(httpOperations);
  const validatorCache = new Map<string, ValidatorCacheEntry>();
  const diagnostics: HttpPayloadConformanceDiagnostic[] = [];

  for (const event of events) {
    const operation = resolveOperation(operationByKey, templateMatchers, event);
    if (!operation) continue;

    const operationKey = serializeOperationKey(operation);
    const accumulator = accumulators.get(operationKey);
    if (!accumulator) continue;

    const contract = options.operationContractsByKey?.get(operationKey);
    if (!contract) continue;

    const suite = normalizeSuite(event.testSuite);
    accumulator.suites.add(suite);

    const requestDiagnostic = evaluateRequestPayload({
      event,
      suite,
      operation,
      operationKey,
      contract,
      validatorCache
    });
    if (requestDiagnostic) {
      diagnostics.push(requestDiagnostic);
      recordTargetOutcome(accumulator.request, requestDiagnostic);
    }

    const responseDiagnostic = evaluateResponsePayload({
      event,
      suite,
      operation,
      operationKey,
      contract,
      validatorCache
    });
    if (responseDiagnostic) {
      diagnostics.push(responseDiagnostic);
      recordTargetOutcome(accumulator.response, responseDiagnostic);
    }
  }

  return {
    perOperation: httpOperations.map((operation) => {
      const operationKey = serializeOperationKey(operation);
      const contract = options.operationContractsByKey?.get(operationKey);
      const accumulator = accumulators.get(operationKey) ?? createOperationAccumulator(operationKey, operation);

      return {
        operationKey,
        method: operation.method,
        route: operation.route,
        request: {
          state: summarizeTargetState(accumulator.request),
          observedCount: accumulator.request.observedCount,
          validCount: accumulator.request.validCount,
          invalidCount: accumulator.request.invalidCount,
          skippedCount: accumulator.request.skippedCount,
          declaredMediaTypes: dedupeAndSort(contract?.requestBody?.content.map((entry) => entry.mediaType) ?? []),
          observedMediaTypes: Array.from(accumulator.request.observedMediaTypes).sort((left, right) => left.localeCompare(right))
        },
        response: {
          state: summarizeTargetState(accumulator.response),
          observedCount: accumulator.response.observedCount,
          validCount: accumulator.response.validCount,
          invalidCount: accumulator.response.invalidCount,
          skippedCount: accumulator.response.skippedCount,
          declaredMediaTypes: dedupeAndSort(
            (contract?.responseBodies ?? []).flatMap((entry) => entry.content.map((content) => content.mediaType))
          ),
          observedMediaTypes: Array.from(accumulator.response.observedMediaTypes).sort((left, right) => left.localeCompare(right)),
          declaredContent: (contract?.responseBodies ?? []).map((entry) => ({
            declaredStatus: entry.declaredStatus,
            mediaTypes: dedupeAndSort(entry.content.map((content) => content.mediaType))
          }))
        },
        suites: Array.from(accumulator.suites).sort((left, right) => left.localeCompare(right))
      };
    }),
    diagnostics: diagnostics.sort(compareDiagnostics)
  };
}

function evaluateRequestPayload(input: {
  event: HttpEvent;
  suite: string;
  operation: HttpOperation;
  operationKey: string;
  contract: HttpOperationContract;
  validatorCache: Map<string, ValidatorCacheEntry>;
}): HttpPayloadConformanceDiagnostic | null {
  const observedMediaType = normalizeObservedMediaType(input.event.requestContentType);
  const hasObservedBody = input.event.requestBody !== undefined;
  const requestBody = input.contract.requestBody;
  const recorderOmission = resolveRecorderOmission({
    target: "request",
    body: input.event.requestBody,
    captureState: input.event.requestBodyState,
    captureReason: input.event.requestBodyReason,
    observedMediaType,
    declaredMediaTypes: dedupeAndSort(requestBody?.content.map((entry) => entry.mediaType) ?? [])
  });
  if (recorderOmission) {
    return createDiagnostic({
      input,
      target: "request",
      state: "SKIPPED",
      code: "RECORDER_OMITTED",
      message: buildRecorderOmissionMessage("request", recorderOmission.captureReason),
      observedMediaType,
      declaredMediaTypes: recorderOmission.declaredMediaTypes,
      captureState: recorderOmission.captureState,
      captureReason: recorderOmission.captureReason
    });
  }

  const hasObservedEvidence = observedMediaType !== undefined || hasObservedBody;

  if (!requestBody) {
    if (!hasObservedEvidence) return null;

    return createDiagnostic({
      input,
      target: "request",
      state: "SKIPPED",
      code: "NO_DECLARED_CONTENT",
      message: "Operation does not declare a request body contract.",
      observedMediaType,
      declaredMediaTypes: []
    });
  }

  const declaredMediaTypes = dedupeAndSort(requestBody.content.map((entry) => entry.mediaType));
  if (!hasObservedEvidence) {
    if (!requestBody.required) return null;

    return createDiagnostic({
      input,
      target: "request",
      state: "UNCOVERED",
      code: "MISSING_BODY",
      message: "Operation declares a required request body but no request payload body or content type was captured.",
      declaredMediaTypes
    });
  }

  if (requestBody.content.length === 0) {
    return createDiagnostic({
      input,
      target: "request",
      state: "SKIPPED",
      code: "NO_DECLARED_CONTENT",
      message: "Operation does not declare request content for payload conformance.",
      observedMediaType,
      declaredMediaTypes
    });
  }

  return evaluatePayloadAgainstContent({
    input,
    target: "request",
    observedMediaType,
    observedBody: input.event.requestBody,
    content: requestBody.content,
    validatorKeyPrefix: `${input.operationKey}\u0000request`
  });
}

function evaluateResponsePayload(input: {
  event: HttpEvent;
  suite: string;
  operation: HttpOperation;
  operationKey: string;
  contract: HttpOperationContract;
  validatorCache: Map<string, ValidatorCacheEntry>;
}): HttpPayloadConformanceDiagnostic | null {
  const observedMediaType = normalizeObservedMediaType(input.event.responseContentType);
  const hasObservedBody = input.event.responseBody !== undefined;
  const observedStatus = typeof input.event.status === "number" ? input.event.status : undefined;
  const responseContract = selectResponseContract(input.contract.responseBodies, observedStatus);
  const recorderOmission = resolveRecorderOmission({
    target: "response",
    body: input.event.responseBody,
    captureState: input.event.responseBodyState,
    captureReason: input.event.responseBodyReason,
    observedMediaType,
    declaredMediaTypes: dedupeAndSort(responseContract?.content.map((entry) => entry.mediaType) ?? [])
  });
  if (recorderOmission) {
    return createDiagnostic({
      input,
      target: "response",
      state: "SKIPPED",
      code: "RECORDER_OMITTED",
      message: buildRecorderOmissionMessage("response", recorderOmission.captureReason),
      declaredStatus: responseContract?.declaredStatus,
      observedStatus,
      observedMediaType,
      declaredMediaTypes: recorderOmission.declaredMediaTypes,
      captureState: recorderOmission.captureState,
      captureReason: recorderOmission.captureReason
    });
  }

  const hasObservedEvidence = observedMediaType !== undefined || hasObservedBody;

  if (!responseContract) {
    if (!hasObservedEvidence) return null;

    return createDiagnostic({
      input,
      target: "response",
      state: "SKIPPED",
      code: "NO_DECLARED_CONTENT",
      message: "Operation does not declare response content for the observed status.",
      observedMediaType,
      declaredMediaTypes: [],
      declaredStatus: undefined,
      observedStatus
    });
  }

  const declaredMediaTypes = dedupeAndSort(responseContract.content.map((entry) => entry.mediaType));
  if (!hasObservedEvidence) {
    if (responseContract.content.length === 0) return null;

    return createDiagnostic({
      input,
      target: "response",
      state: "UNCOVERED",
      code: "MISSING_BODY",
      message: "Observed response status declares payload content but no response body or content type was captured.",
      declaredStatus: responseContract.declaredStatus,
      observedStatus,
      declaredMediaTypes
    });
  }

  if (responseContract.content.length === 0) {
    return createDiagnostic({
      input,
      target: "response",
      state: "SKIPPED",
      code: "NO_DECLARED_CONTENT",
      message: "Operation does not declare response content for the observed status.",
      observedMediaType,
      declaredMediaTypes,
      declaredStatus: responseContract.declaredStatus,
      observedStatus
    });
  }

  return evaluatePayloadAgainstContent({
    input,
    target: "response",
    observedMediaType,
    observedBody: input.event.responseBody,
    content: responseContract.content,
    declaredStatus: responseContract.declaredStatus,
    observedStatus,
    validatorKeyPrefix: `${input.operationKey}\u0000response\u0000${responseContract.declaredStatus}`
  });
}

function resolveRecorderOmission(input: {
  target: "request" | "response";
  body: JsonValue | undefined;
  captureState: PayloadCaptureState | undefined;
  captureReason: PayloadCaptureReason | undefined;
  observedMediaType: string | undefined;
  declaredMediaTypes: string[];
}): { captureState: "omitted"; captureReason?: PayloadCaptureReason; declaredMediaTypes: string[] } | null {
  if (input.body !== undefined) return null;
  if (input.captureState !== "omitted") return null;

  return {
    captureState: "omitted",
    captureReason: input.captureReason,
    declaredMediaTypes: input.declaredMediaTypes
  };
}

function buildRecorderOmissionMessage(target: "request" | "response", reason: PayloadCaptureReason | undefined): string {
  return reason ? `Recorder omitted ${target} payload evidence (${reason}).` : `Recorder omitted ${target} payload evidence.`;
}

function evaluatePayloadAgainstContent(input: {
  input: {
    event: HttpEvent;
    suite: string;
    operation: HttpOperation;
    operationKey: string;
    contract: HttpOperationContract;
    validatorCache: Map<string, ValidatorCacheEntry>;
  };
  target: "request" | "response";
  observedMediaType?: string;
  observedBody: JsonValue | undefined;
  content: HttpMediaTypeContract[];
  declaredStatus?: DeclaredStatusToken;
  observedStatus?: number;
  validatorKeyPrefix: string;
}): HttpPayloadConformanceDiagnostic {
  const declaredMediaTypes = dedupeAndSort(input.content.map((entry) => entry.mediaType));

  if (input.content.length === 0) {
    return createDiagnostic({
      input: input.input,
      target: input.target,
      state: "SKIPPED",
      code: "NO_DECLARED_CONTENT",
      message: `Operation does not declare ${input.target} content for payload conformance.`,
      declaredStatus: input.declaredStatus,
      observedStatus: input.observedStatus,
      observedMediaType: input.observedMediaType,
      declaredMediaTypes
    });
  }

  if (input.observedMediaType === undefined) {
    return createDiagnostic({
      input: input.input,
      target: input.target,
      state: "UNCOVERED",
      code: "MISSING_CONTENT_TYPE",
      message: `Observed ${input.target} payload evidence is missing content type.`,
      declaredStatus: input.declaredStatus,
      observedStatus: input.observedStatus,
      declaredMediaTypes
    });
  }

  const matchedMedia = findMatchingMediaType(input.content, input.observedMediaType);
  if (!matchedMedia) {
    return createDiagnostic({
      input: input.input,
      target: input.target,
      state: "UNCOVERED",
      code: "MEDIA_TYPE_MISMATCH",
      message: `Observed ${input.target} content type does not match the declared OpenAPI content map.`,
      declaredStatus: input.declaredStatus,
      observedStatus: input.observedStatus,
      observedMediaType: input.observedMediaType,
      declaredMediaTypes
    });
  }

  if (!isSupportedJsonMediaType(matchedMedia.mediaType)) {
    return createDiagnostic({
      input: input.input,
      target: input.target,
      state: "SKIPPED",
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: `Observed ${input.target} content type is declared but outside JSON payload conformance support.`,
      declaredStatus: input.declaredStatus,
      observedStatus: input.observedStatus,
      observedMediaType: input.observedMediaType,
      declaredMediaTypes
    });
  }

  if (matchedMedia.schema === undefined) {
    return createDiagnostic({
      input: input.input,
      target: input.target,
      state: "SKIPPED",
      code: "UNSUPPORTED_SCHEMA",
      message: `Observed ${input.target} content type is JSON but no usable schema was declared.`,
      declaredStatus: input.declaredStatus,
      observedStatus: input.observedStatus,
      observedMediaType: input.observedMediaType,
      declaredMediaTypes
    });
  }

  if (input.observedBody === undefined) {
    return createDiagnostic({
      input: input.input,
      target: input.target,
      state: "UNCOVERED",
      code: "MISSING_BODY",
      message: `Observed ${input.target} content type is JSON but no payload body was captured.`,
      declaredStatus: input.declaredStatus,
      observedStatus: input.observedStatus,
      observedMediaType: input.observedMediaType,
      declaredMediaTypes
    });
  }

  const validator = getOrCreateValidator(
    input.input.validatorCache,
    `${input.validatorKeyPrefix}\u0000${matchedMedia.mediaType}`,
    matchedMedia.schema
  );
  if (validator.kind === "unsupported-format") {
    return createDiagnostic({
      input: input.input,
      target: input.target,
      state: "SKIPPED",
      code: "UNSUPPORTED_SCHEMA_FORMAT",
      message: `Observed ${input.target} JSON payload declares unsupported schema format "${validator.format}" at ${validator.schemaPath}.`,
      declaredStatus: input.declaredStatus,
      observedStatus: input.observedStatus,
      observedMediaType: input.observedMediaType,
      declaredMediaTypes,
      errors: [
        `${validator.schemaPath} declares unsupported schema format "${validator.format}" outside Yanote's supported payload format allowlist.`
      ]
    });
  }

  if (validator.kind === "unsupported") {
    return createDiagnostic({
      input: input.input,
      target: input.target,
      state: "SKIPPED",
      code: "UNSUPPORTED_SCHEMA",
      message: `Observed ${input.target} content type is JSON but the declared schema could not be compiled for validation.`,
      declaredStatus: input.declaredStatus,
      observedStatus: input.observedStatus,
      observedMediaType: input.observedMediaType,
      declaredMediaTypes,
      errors: validator.errors
    });
  }

  const valid = validator.validator(input.observedBody);
  if (valid) {
    return createDiagnostic({
      input: input.input,
      target: input.target,
      state: "COVERED",
      code: "VALID",
      message: `Observed ${input.target} JSON payload matches the declared schema.`,
      declaredStatus: input.declaredStatus,
      observedStatus: input.observedStatus,
      observedMediaType: input.observedMediaType,
      declaredMediaTypes
    });
  }

  return createDiagnostic({
    input: input.input,
    target: input.target,
    state: "UNCOVERED",
    code: "INVALID_BODY",
    message: `Observed ${input.target} JSON payload does not satisfy the declared schema.`,
    declaredStatus: input.declaredStatus,
    observedStatus: input.observedStatus,
    observedMediaType: input.observedMediaType,
    declaredMediaTypes,
    errors: formatAjvErrors(validator.validator.errors ?? [])
  });
}

function createDiagnostic(input: {
  input: {
    suite: string;
    operation: HttpOperation;
    operationKey: string;
  };
  target: "request" | "response";
  state: "COVERED" | "UNCOVERED" | "SKIPPED";
  code: HttpPayloadConformanceCode;
  message: string;
  declaredStatus?: DeclaredStatusToken;
  observedStatus?: number;
  observedMediaType?: string;
  declaredMediaTypes: string[];
  captureState?: PayloadCaptureState;
  captureReason?: PayloadCaptureReason;
  errors?: string[];
}): HttpPayloadConformanceDiagnostic {
  return {
    operationKey: input.input.operationKey,
    method: input.input.operation.method,
    route: input.input.operation.route,
    target: input.target,
    suite: input.input.suite,
    state: input.state,
    code: input.code,
    message: input.message,
    declaredStatus: input.declaredStatus,
    observedStatus: input.observedStatus,
    observedMediaType: input.observedMediaType,
    declaredMediaTypes: input.declaredMediaTypes,
    captureState: input.captureState,
    captureReason: input.captureReason,
    errors: input.errors
  };
}

function recordTargetOutcome(target: TargetAccumulator, diagnostic: HttpPayloadConformanceDiagnostic): void {
  target.observedCount += 1;
  if (diagnostic.state === "COVERED") {
    target.validCount += 1;
  } else if (diagnostic.state === "UNCOVERED") {
    target.invalidCount += 1;
  } else {
    target.skippedCount += 1;
  }

  if (diagnostic.observedMediaType) {
    target.observedMediaTypes.add(diagnostic.observedMediaType);
  }
}

function summarizeTargetState(target: TargetAccumulator): HttpPayloadConformanceState {
  if (target.observedCount === 0) return "N/A";
  if (target.validCount > 0 && target.invalidCount === 0 && target.skippedCount === 0) return "COVERED";
  if (target.validCount > 0) return "PARTIAL";
  if (target.invalidCount > 0) return "UNCOVERED";
  if (target.skippedCount > 0) return "SKIPPED";
  return "N/A";
}

function createOperationAccumulator(operationKey: string, operation: HttpOperation): OperationAccumulator {
  return {
    operationKey,
    method: operation.method,
    route: operation.route,
    suites: new Set<string>(),
    request: createTargetAccumulator(),
    response: createTargetAccumulator()
  };
}

function createTargetAccumulator(): TargetAccumulator {
  return {
    observedCount: 0,
    validCount: 0,
    invalidCount: 0,
    skippedCount: 0,
    observedMediaTypes: new Set<string>()
  };
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

function normalizeObservedMediaType(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return normalized.split(";", 1)[0]?.trim() || undefined;
}

function findMatchingMediaType(content: HttpMediaTypeContract[], observedMediaType: string): HttpMediaTypeContract | undefined {
  let bestMatch: HttpMediaTypeContract | undefined;
  let bestSpecificity = Number.NEGATIVE_INFINITY;

  for (const entry of content) {
    const specificity = scoreMatchingMediaType(entry.mediaType, observedMediaType);
    if (specificity === null) continue;

    if (
      !bestMatch ||
      specificity > bestSpecificity ||
      (specificity === bestSpecificity && entry.mediaType.localeCompare(bestMatch.mediaType) < 0)
    ) {
      bestMatch = entry;
      bestSpecificity = specificity;
    }
  }

  return bestMatch;
}

function scoreMatchingMediaType(declaredMediaType: string, observedMediaType: string): number | null {
  if (declaredMediaType === observedMediaType) return 40;

  const declared = splitMediaType(declaredMediaType);
  const observed = splitMediaType(observedMediaType);
  if (!declared || !observed) return null;

  if (declared.type !== "*" && declared.type !== observed.type) return null;

  const typeSpecificity = declared.type === observed.type ? 2 : 1;
  if (declared.subtype === observed.subtype) return 30 + typeSpecificity;
  if (declared.subtype === "*") return 10 + typeSpecificity;

  if (declared.subtype.startsWith("*+")) {
    const suffix = declared.subtype.slice(2);
    return suffix.length > 0 && observed.subtype.endsWith(`+${suffix}`) ? 20 + typeSpecificity : null;
  }

  return null;
}

function splitMediaType(value: string): { type: string; subtype: string } | null {
  const [type, subtype, ...rest] = value.split("/").map((segment) => segment.trim());
  if (rest.length > 0) return null;
  if (!type || !subtype) return null;
  return { type, subtype };
}

function isSupportedJsonMediaType(mediaType: string): boolean {
  return mediaType === "application/json" || mediaType.endsWith("+json");
}

function selectResponseContract(
  responseBodies: HttpResponseBodyContract[],
  observedStatus: number | undefined
): HttpResponseBodyContract | undefined {
  if (!Number.isInteger(observedStatus)) return undefined;

  return (
    responseBodies.find((entry) => entry.declaredStatus === String(observedStatus)) ??
    responseBodies.find((entry) => entry.declaredStatus.endsWith("XX") && Number(entry.declaredStatus[0]) === Math.trunc(observedStatus / 100)) ??
    responseBodies.find((entry) => entry.declaredStatus === "default")
  );
}

function getOrCreateValidator(
  cache: Map<string, ValidatorCacheEntry>,
  cacheKey: string,
  schema: JsonSchemaContract
): ValidatorCacheEntry {
  const existing = cache.get(cacheKey);
  if (existing) return existing;

  const unsupportedFormat = findUnsupportedSchemaFormat(schema);
  if (unsupportedFormat) {
    const entry: ValidatorCacheEntry = {
      kind: "unsupported-format",
      schemaPath: unsupportedFormat.schemaPath,
      format: unsupportedFormat.format
    };
    cache.set(cacheKey, entry);
    return entry;
  }

  try {
    const validator = ajv.compile<JsonValue>(schema);
    const entry: ValidatorCacheEntry = {
      kind: "validator",
      validator
    };
    cache.set(cacheKey, entry);
    return entry;
  } catch (error) {
    const entry: ValidatorCacheEntry = {
      kind: "unsupported",
      errors: [formatSchemaCompileError(error)]
    };
    cache.set(cacheKey, entry);
    return entry;
  }
}

function findUnsupportedSchemaFormat(schema: JsonSchemaContract): { schemaPath: string; format: string } | null {
  return visitSchemaForUnsupportedFormat(schema, "");
}

function visitSchemaForUnsupportedFormat(
  schema: unknown,
  schemaPath: string
): { schemaPath: string; format: string } | null {
  if (typeof schema === "boolean") return null;
  if (!isRecord(schema)) return null;

  const format = normalizeDeclaredSchemaFormat(schema.format);
  if (format && !SUPPORTED_PAYLOAD_SCHEMA_FORMATS.has(format)) {
    return {
      schemaPath: schemaPath || "/",
      format
    };
  }

  const mapPaths: Array<[string, unknown]> = [
    ["properties", schema.properties],
    ["patternProperties", schema.patternProperties],
    ["$defs", schema.$defs],
    ["definitions", schema.definitions],
    ["dependentSchemas", schema.dependentSchemas]
  ];
  for (const [segment, value] of mapPaths) {
    const nested = visitSchemaMapForUnsupportedFormat(value, joinSchemaPath(schemaPath, segment));
    if (nested) return nested;
  }

  const childPaths: Array<[string, unknown]> = [
    ["items", schema.items],
    ["additionalItems", schema.additionalItems],
    ["additionalProperties", schema.additionalProperties],
    ["unevaluatedItems", schema.unevaluatedItems],
    ["unevaluatedProperties", schema.unevaluatedProperties],
    ["propertyNames", schema.propertyNames],
    ["contains", schema.contains],
    ["not", schema.not],
    ["if", schema.if],
    ["then", schema.then],
    ["else", schema.else]
  ];
  for (const [segment, value] of childPaths) {
    const nested = visitSchemaNodeForUnsupportedFormat(value, joinSchemaPath(schemaPath, segment));
    if (nested) return nested;
  }

  const arrayPaths: Array<[string, unknown]> = [
    ["allOf", schema.allOf],
    ["anyOf", schema.anyOf],
    ["oneOf", schema.oneOf],
    ["prefixItems", schema.prefixItems]
  ];
  for (const [segment, value] of arrayPaths) {
    const nested = visitSchemaArrayForUnsupportedFormat(value, joinSchemaPath(schemaPath, segment));
    if (nested) return nested;
  }

  return null;
}

function visitSchemaNodeForUnsupportedFormat(
  value: unknown,
  schemaPath: string
): { schemaPath: string; format: string } | null {
  if (Array.isArray(value)) {
    return visitSchemaArrayForUnsupportedFormat(value, schemaPath);
  }

  return visitSchemaForUnsupportedFormat(value, schemaPath);
}

function visitSchemaMapForUnsupportedFormat(
  value: unknown,
  schemaPath: string
): { schemaPath: string; format: string } | null {
  if (!isRecord(value)) return null;

  for (const [key, nestedSchema] of Object.entries(value)) {
    const nested = visitSchemaForUnsupportedFormat(nestedSchema, joinSchemaPath(schemaPath, escapeJsonPointer(key)));
    if (nested) return nested;
  }

  return null;
}

function visitSchemaArrayForUnsupportedFormat(
  value: unknown,
  schemaPath: string
): { schemaPath: string; format: string } | null {
  if (!Array.isArray(value)) return null;

  for (const [index, nestedSchema] of value.entries()) {
    const nested = visitSchemaForUnsupportedFormat(nestedSchema, joinSchemaPath(schemaPath, String(index)));
    if (nested) return nested;
  }

  return null;
}

function normalizeDeclaredSchemaFormat(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

function joinSchemaPath(basePath: string, segment: string): string {
  return `${basePath}/${segment}`;
}

function escapeJsonPointer(value: string): string {
  return value.replace(/~/g, "~0").replace(/\//g, "~1");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatSchemaCompileError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message.trim();
  return "schema compilation failed";
}

function formatAjvErrors(errors: readonly { instancePath?: string; message?: string }[]): string[] {
  return errors.map((error) => `${error.instancePath || "/"} ${error.message ?? "validation error"}`);
}

function normalizeSuite(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "unknown";
}

function dedupeAndSort(values: string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function compareDiagnostics(left: HttpPayloadConformanceDiagnostic, right: HttpPayloadConformanceDiagnostic): number {
  if (left.operationKey !== right.operationKey) return left.operationKey.localeCompare(right.operationKey);
  if (left.target !== right.target) return left.target.localeCompare(right.target);
  const leftStatus = `${left.declaredStatus ?? ""}\u0000${left.observedStatus ?? ""}`;
  const rightStatus = `${right.declaredStatus ?? ""}\u0000${right.observedStatus ?? ""}`;
  if (leftStatus !== rightStatus) return leftStatus.localeCompare(rightStatus);
  if (left.code !== right.code) return left.code.localeCompare(right.code);
  if ((left.observedMediaType ?? "") !== (right.observedMediaType ?? "")) {
    return (left.observedMediaType ?? "").localeCompare(right.observedMediaType ?? "");
  }
  return left.suite.localeCompare(right.suite);
}
