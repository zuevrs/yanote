import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import type { AsyncEvent, AsyncHeaderEvidence, JsonValue } from "../model/asyncEvent.js";
import {
  formatKafkaMessageIdentity,
  serializeOperationKey,
  type AsyncAction,
  type AsyncOperationContract,
  type AsyncOperationKey,
  type AsyncProtocol,
  type KafkaMessageContract,
  type KafkaMessageSelectionRule
} from "../model/operationKey.js";
import type { AsyncApiSemanticsBundle } from "../spec/asyncapi.js";

export type AsyncSchemaConformanceDiagnosticKind =
  | "missing-payload"
  | "invalid-payload"
  | "unsupported-content-type"
  | "unsupported-schema-format"
  | "missing-header"
  | "invalid-header"
  | "unavailable-header"
  | "unverifiable-headers";

export type AsyncSchemaValidationKind = "payload" | "headers" | "contentType" | "schemaFormat";

export type AsyncSchemaConformanceDiagnostic = {
  kind: AsyncSchemaConformanceDiagnosticKind;
  validationKind: AsyncSchemaValidationKind;
  operationKey: string;
  channel: string;
  action: AsyncAction;
  messageName?: string;
  schemaId?: string;
  pointer?: string;
  reason: string;
  message: string;
};

export type AsyncRoutingCoverageDiagnosticKind = "unmatched" | "mismatched" | "ambiguous";

export type AsyncRoutingCoverageDiagnostic =
  | {
      kind: "unmatched";
      message: string;
      channel: string;
      action: AsyncAction;
      observedMessage?: string;
    }
  | {
      kind: "mismatched";
      message: string;
      channel: string;
      action: AsyncAction;
      observedMessage?: string;
      expectedMessage?: string;
      reason?: string;
    }
  | {
      kind: "ambiguous";
      message: string;
      operationKey: string;
      channel: string;
      action: AsyncAction;
      observedMessage?: string;
      reason: string;
      candidates: string[];
    };

export type AsyncResolvedMessageContract =
  | {
      kind: "none";
    }
  | {
      kind: "selected";
      message: KafkaMessageContract;
      identity: string;
    }
  | {
      kind: "mismatched";
      diagnostic: Extract<AsyncRoutingCoverageDiagnostic, { kind: "mismatched" }>;
    }
  | {
      kind: "ambiguous";
      diagnostic: Extract<AsyncRoutingCoverageDiagnostic, { kind: "ambiguous" }>;
    };

export type AsyncSchemaConformanceResult = {
  diagnostics: AsyncSchemaConformanceDiagnostic[];
  matchedOperationKeys: string[];
  validatedOperationKeys: string[];
};

type MatchedAsyncContract = {
  operationKey: string;
  contract: AsyncOperationContract;
};

type PayloadValidationPlan =
  | {
      kind: "none";
    }
  | {
      kind: "unsupported";
      diagnostic: AsyncSchemaConformanceDiagnostic;
    }
  | {
      kind: "validator";
      validator: ValidateFunction;
      schemaId?: string;
    };

type HeaderValidationPlan =
  | {
      kind: "none";
    }
  | {
      kind: "unsupported";
      diagnostic: AsyncSchemaConformanceDiagnostic;
    }
  | {
      kind: "validator";
      validator: ValidateFunction;
      schemaId?: string;
      requiredHeaderKeys: string[];
      declaredHeaderKeys: Set<string>;
    };

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  strictTypes: true
});

export function computeAsyncSchemaConformance(
  bundle: AsyncApiSemanticsBundle,
  events: AsyncEvent[]
): AsyncSchemaConformanceResult {
  const contractsByMatchKey = new Map<string, MatchedAsyncContract>();
  const payloadValidationPlans = new Map<string, PayloadValidationPlan>();
  const headerValidationPlans = new Map<string, HeaderValidationPlan>();

  for (const operation of bundle.operations) {
    if (!isAsyncOperationKey(operation)) {
      continue;
    }

    const operationKey = serializeOperationKey(operation);
    const contract = bundle.operationContractsByKey.get(operationKey) ?? { operation };
    contractsByMatchKey.set(matchKey(operation.kind, operation.action, operation.channel), {
      operationKey,
      contract
    });
  }

  const diagnostics: AsyncSchemaConformanceDiagnostic[] = [];
  const seenDiagnostics = new Set<string>();
  const matchedOperationKeys = new Set<string>();
  const validatedOperationKeys = new Set<string>();

  for (const event of events) {
    const matched = contractsByMatchKey.get(matchKey(event.kind, event.action, event.channel));
    if (!matched) {
      continue;
    }

    matchedOperationKeys.add(matched.operationKey);

    const resolution = resolveAsyncMessageContract(matched.contract, matched.operationKey, event);
    if (resolution.kind !== "selected") {
      continue;
    }

    const message = resolution.message;

    const headerPlan = getHeaderValidationPlan(matched, message, resolution.identity, headerValidationPlans);
    if (headerPlan.kind === "unsupported") {
      appendDiagnostic(diagnostics, seenDiagnostics, headerPlan.diagnostic);
    } else if (headerPlan.kind === "validator") {
      validatedOperationKeys.add(matched.operationKey);
      validateHeaders(diagnostics, seenDiagnostics, matched, message, headerPlan, event);
    }

    const payloadPlan = getPayloadValidationPlan(matched, message, resolution.identity, payloadValidationPlans);
    if (payloadPlan.kind === "none") {
      continue;
    }

    if (payloadPlan.kind === "unsupported") {
      appendDiagnostic(diagnostics, seenDiagnostics, payloadPlan.diagnostic);
      continue;
    }

    validatedOperationKeys.add(matched.operationKey);

    if (event.payload === undefined) {
      appendDiagnostic(diagnostics, seenDiagnostics, {
        kind: "missing-payload",
        validationKind: "payload",
        operationKey: matched.operationKey,
        channel: matched.contract.operation.channel,
        action: matched.contract.operation.action,
        messageName: message.name,
        schemaId: payloadPlan.schemaId,
        pointer: "/",
        reason: "Observed async evidence did not include a payload.",
        message: "Observed async evidence is missing the payload required for AsyncAPI schema validation"
      });
      continue;
    }

    const valid = payloadPlan.validator(event.payload);
    if (valid) {
      continue;
    }

    for (const error of sortAjvErrors(payloadPlan.validator.errors ?? [])) {
      appendDiagnostic(diagnostics, seenDiagnostics, {
        kind: "invalid-payload",
        validationKind: "payload",
        operationKey: matched.operationKey,
        channel: matched.contract.operation.channel,
        action: matched.contract.operation.action,
        messageName: message.name,
        schemaId: payloadPlan.schemaId,
        pointer: toJsonPointer(error),
        reason: toAjvReason(error),
        message: "Observed async payload did not conform to the retained AsyncAPI payload schema"
      });
    }
  }

  return {
    diagnostics: [...diagnostics].sort(compareDiagnostics),
    matchedOperationKeys: [...matchedOperationKeys].sort((left, right) => left.localeCompare(right)),
    validatedOperationKeys: [...validatedOperationKeys].sort((left, right) => left.localeCompare(right))
  };
}

export function resolveAsyncMessageContract(
  contract: AsyncOperationContract,
  operationKey: string,
  event: AsyncEvent
): AsyncResolvedMessageContract {
  if (contract.message) {
    if (event.message && event.message !== contract.message.name) {
      return {
        kind: "mismatched",
        diagnostic: {
          kind: "mismatched",
          channel: contract.operation.channel,
          action: contract.operation.action,
          observedMessage: event.message,
          expectedMessage: contract.message.name,
          reason: "Observed async message name did not match the declared AsyncAPI message contract.",
          message: "Observed async message contract did not match the canonical AsyncAPI message contract"
        }
      };
    }

    return {
      kind: "selected",
      message: contract.message,
      identity: formatKafkaMessageIdentity(contract.message)
    };
  }

  const declaredMessages = contract.messages ?? [];
  if (declaredMessages.length === 0) {
    return { kind: "none" };
  }

  const precedence = contract.messageSelection?.precedence ?? [{ kind: "message" }];
  let candidates = declaredMessages;
  const blockers: string[] = [];

  for (const rule of precedence) {
    if (candidates.length <= 1) {
      break;
    }

    const resolution = applySelectionRule(candidates, rule, event);
    if (resolution.kind === "skip") {
      blockers.push(resolution.reason);
      continue;
    }

    if (resolution.kind === "mismatched") {
      return {
        kind: "mismatched",
        diagnostic: {
          kind: "mismatched",
          channel: contract.operation.channel,
          action: contract.operation.action,
          observedMessage: event.message,
          reason: resolution.reason,
          message: resolution.message,
          ...(resolution.expectedMessage ? { expectedMessage: resolution.expectedMessage } : {})
        }
      };
    }

    candidates = resolution.candidates;
  }

  if (candidates.length === 1) {
    return {
      kind: "selected",
      message: candidates[0],
      identity: formatKafkaMessageIdentity(candidates[0])
    };
  }

  const candidateIdentities = candidates
    .map((message) => formatKafkaMessageIdentity(message))
    .sort((left, right) => left.localeCompare(right));
  const fallbackReason =
    blockers.length > 0
      ? `Runtime evidence was insufficient to choose safely: ${blockers.join("; ")}.`
      : "Runtime evidence did not retain enough discriminating message metadata to choose one declared contract safely.";

  return {
    kind: "ambiguous",
    diagnostic: {
      kind: "ambiguous",
      operationKey,
      channel: contract.operation.channel,
      action: contract.operation.action,
      observedMessage: event.message,
      reason: fallbackReason,
      candidates: candidateIdentities,
      message: "Observed async evidence did not identify one declared AsyncAPI message contract safely"
    }
  };
}

function applySelectionRule(
  candidates: KafkaMessageContract[],
  rule: KafkaMessageSelectionRule,
  event: AsyncEvent
):
  | { kind: "skip"; reason: string }
  | { kind: "mismatched"; reason: string; message: string; expectedMessage?: string }
  | { kind: "filtered"; candidates: KafkaMessageContract[] } {
  if (rule.kind === "message") {
    if (!event.message) {
      return {
        kind: "skip",
        reason: "message name was not retained"
      };
    }

    const filtered = candidates.filter((candidate) => hasMessageHint(candidate, event.message ?? ""));
    if (filtered.length === 0) {
      const expected = uniqueMessageNames(candidates);
      return {
        kind: "mismatched",
        expectedMessage: expected.length === 1 ? expected[0] : undefined,
        reason: `Observed async message '${event.message}' did not match any declared AsyncAPI message selector.`,
        message: "Observed async message selection did not match any declared AsyncAPI message contract"
      };
    }

    return {
      kind: "filtered",
      candidates: filtered
    };
  }

  const headerEvidence = event.headers?.[rule.header];
  if (!headerEvidence) {
    return {
      kind: "skip",
      reason: `retained header '${rule.header}' was missing`
    };
  }

  if (headerEvidence.state !== "captured" || !headerEvidence.value) {
    const reasonSuffix = headerEvidence.reason ? ` (${headerEvidence.state}: ${headerEvidence.reason})` : ` (${headerEvidence.state})`;
    return {
      kind: "skip",
      reason: `retained header '${rule.header}' was unavailable${reasonSuffix}`
    };
  }

  const filtered = candidates.filter((candidate) => hasHeaderHint(candidate, rule.header, headerEvidence.value ?? ""));
  if (filtered.length === 0) {
    return {
      kind: "mismatched",
      reason: `Observed async header '${rule.header}' did not match any declared AsyncAPI message selector.`,
      message: "Observed async header selection did not match any declared AsyncAPI message contract"
    };
  }

  return {
    kind: "filtered",
    candidates: filtered
  };
}

function hasMessageHint(message: KafkaMessageContract, expected: string): boolean {
  return (
    message.selectionHints?.some((hint) => hint.kind === "message" && hint.value === expected) ?? false
  );
}

function hasHeaderHint(message: KafkaMessageContract, header: string, expected: string): boolean {
  return (
    message.selectionHints?.some(
      (hint) => hint.kind === "header" && hint.header === header && hint.value === expected
    ) ?? false
  );
}

function uniqueMessageNames(messages: KafkaMessageContract[]): string[] {
  return [...new Set(messages.map((message) => message.name))].sort((left, right) => left.localeCompare(right));
}

function getPayloadValidationPlan(
  matched: MatchedAsyncContract,
  message: KafkaMessageContract,
  messageIdentity: string,
  cache: Map<string, PayloadValidationPlan>
): PayloadValidationPlan {
  const cacheKey = validationCacheKey(matched.operationKey, messageIdentity, "payload");
  const existing = cache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const plan = buildPayloadValidationPlan(matched, message);
  cache.set(cacheKey, plan);
  return plan;
}

function buildPayloadValidationPlan(matched: MatchedAsyncContract, message: KafkaMessageContract): PayloadValidationPlan {
  if (message.payloadSchema === undefined) {
    return { kind: "none" };
  }

  if (!isSupportedContentType(message.contentType)) {
    return {
      kind: "unsupported",
      diagnostic: {
        kind: "unsupported-content-type",
        validationKind: "contentType",
        operationKey: matched.operationKey,
        channel: matched.contract.operation.channel,
        action: matched.contract.operation.action,
        messageName: message.name,
        schemaId: message.payloadSchemaId,
        reason: `Unsupported AsyncAPI payload content type: ${message.contentType ?? "(empty)"}.`,
        message: "Retained AsyncAPI payload content type is outside the current schema-validation scope"
      }
    };
  }

  if (!isSupportedSchemaFormat(message.schemaFormat)) {
    return {
      kind: "unsupported",
      diagnostic: {
        kind: "unsupported-schema-format",
        validationKind: "schemaFormat",
        operationKey: matched.operationKey,
        channel: matched.contract.operation.channel,
        action: matched.contract.operation.action,
        messageName: message.name,
        schemaId: message.payloadSchemaId,
        reason: `Unsupported AsyncAPI payload schema format: ${message.schemaFormat ?? "(empty)"}.`,
        message: "Retained AsyncAPI payload schema format is outside the current schema-validation scope"
      }
    };
  }

  try {
    return {
      kind: "validator",
      validator: ajv.compile(toAjvSchema(message.payloadSchema)),
      schemaId: message.payloadSchemaId
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      kind: "unsupported",
      diagnostic: {
        kind: "unsupported-schema-format",
        validationKind: "schemaFormat",
        operationKey: matched.operationKey,
        channel: matched.contract.operation.channel,
        action: matched.contract.operation.action,
        messageName: message.name,
        schemaId: message.payloadSchemaId,
        reason: `AsyncAPI payload schema could not be compiled for validation: ${errorMessage}.`,
        message: "Retained AsyncAPI payload schema is outside the current schema-validation scope"
      }
    };
  }
}

function getHeaderValidationPlan(
  matched: MatchedAsyncContract,
  message: KafkaMessageContract,
  messageIdentity: string,
  cache: Map<string, HeaderValidationPlan>
): HeaderValidationPlan {
  const cacheKey = validationCacheKey(matched.operationKey, messageIdentity, "headers");
  const existing = cache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const plan = buildHeaderValidationPlan(matched, message);
  cache.set(cacheKey, plan);
  return plan;
}

function buildHeaderValidationPlan(matched: MatchedAsyncContract, message: KafkaMessageContract): HeaderValidationPlan {
  if (!message.headersSchemaId && message.headersSchema === undefined) {
    return { kind: "none" };
  }

  if (message.headerValidationCapability === "unverifiable" || message.headersSchema === undefined) {
    return {
      kind: "unsupported",
      diagnostic: buildUnsupportedHeaderDiagnostic(
        matched,
        message,
        "Retained AsyncAPI header schema could not be normalized into a validation-ready JSON Schema."
      )
    };
  }

  try {
    const schema = toAjvSchema(message.headersSchema);
    const metadata = extractHeaderSchemaMetadata(message.headersSchema);

    return {
      kind: "validator",
      validator: ajv.compile(schema),
      schemaId: message.headersSchemaId,
      requiredHeaderKeys: metadata.requiredHeaderKeys,
      declaredHeaderKeys: metadata.declaredHeaderKeys
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      kind: "unsupported",
      diagnostic: buildUnsupportedHeaderDiagnostic(
        matched,
        message,
        `AsyncAPI header schema could not be compiled for validation: ${errorMessage}.`
      )
    };
  }
}

function validateHeaders(
  diagnostics: AsyncSchemaConformanceDiagnostic[],
  seenDiagnostics: Set<string>,
  matched: MatchedAsyncContract,
  message: KafkaMessageContract,
  plan: Extract<HeaderValidationPlan, { kind: "validator" }>,
  event: AsyncEvent
): void {
  const capturedHeaders = collectCapturedHeaders(event.headers);
  const unavailableHeaders = collectUnavailableHeaders(event.headers);

  for (const headerKey of [...plan.declaredHeaderKeys].sort((left, right) => left.localeCompare(right))) {
    const unavailableEvidence = unavailableHeaders.get(headerKey);
    if (!unavailableEvidence) {
      continue;
    }

    appendDiagnostic(
      diagnostics,
      seenDiagnostics,
      buildUnavailableHeaderDiagnostic(matched, message, plan.schemaId, headerKey, unavailableEvidence)
    );
  }

  for (const headerKey of [...plan.requiredHeaderKeys].sort((left, right) => left.localeCompare(right))) {
    if (Object.hasOwn(capturedHeaders, headerKey) || unavailableHeaders.has(headerKey)) {
      continue;
    }

    appendDiagnostic(diagnostics, seenDiagnostics, {
      kind: "missing-header",
      validationKind: "headers",
      operationKey: matched.operationKey,
      channel: matched.contract.operation.channel,
      action: matched.contract.operation.action,
      messageName: message.name,
      schemaId: plan.schemaId,
      pointer: toHeaderPointer(headerKey),
      reason: `Observed async evidence did not include required header '${headerKey}'.`,
      message: "Observed async evidence is missing a required header for AsyncAPI header validation"
    });
  }

  const valid = plan.validator(capturedHeaders);
  if (valid) {
    return;
  }

  for (const error of sortAjvErrors(plan.validator.errors ?? [])) {
    if (shouldSkipHeaderAjvError(error, unavailableHeaders)) {
      continue;
    }

    appendDiagnostic(diagnostics, seenDiagnostics, {
      kind: "invalid-header",
      validationKind: "headers",
      operationKey: matched.operationKey,
      channel: matched.contract.operation.channel,
      action: matched.contract.operation.action,
      messageName: message.name,
      schemaId: plan.schemaId,
      pointer: toJsonPointer(error),
      reason: toAjvReason(error),
      message: "Observed async headers did not conform to the retained AsyncAPI header schema"
    });
  }
}

function buildUnsupportedHeaderDiagnostic(
  matched: MatchedAsyncContract,
  message: KafkaMessageContract,
  reason: string
): AsyncSchemaConformanceDiagnostic {
  return {
    kind: "unverifiable-headers",
    validationKind: "headers",
    operationKey: matched.operationKey,
    channel: matched.contract.operation.channel,
    action: matched.contract.operation.action,
    messageName: message.name,
    schemaId: message.headersSchemaId,
    reason,
    message: "Retained AsyncAPI header schema is outside the current async header-validation scope"
  };
}

function buildUnavailableHeaderDiagnostic(
  matched: MatchedAsyncContract,
  message: KafkaMessageContract,
  schemaId: string | undefined,
  headerKey: string,
  evidence: AsyncHeaderEvidence
): AsyncSchemaConformanceDiagnostic {
  const reasonSuffix = evidence.reason ? ` (reason: ${evidence.reason})` : "";
  return {
    kind: "unavailable-header",
    validationKind: "headers",
    operationKey: matched.operationKey,
    channel: matched.contract.operation.channel,
    action: matched.contract.operation.action,
    messageName: message.name,
    schemaId,
    pointer: toHeaderPointer(headerKey),
    reason: `Observed async header '${headerKey}' was retained as ${evidence.state} evidence${reasonSuffix}, so its value could not be validated.`,
    message: "Observed async header value was unavailable for AsyncAPI header validation"
  };
}

function collectCapturedHeaders(headers: AsyncEvent["headers"]): Record<string, string> {
  const captured: Record<string, string> = {};

  for (const [key, evidence] of Object.entries(headers ?? {})) {
    if (evidence.state !== "captured" || !evidence.value) {
      continue;
    }
    captured[key] = evidence.value;
  }

  return captured;
}

function collectUnavailableHeaders(headers: AsyncEvent["headers"]): Map<string, AsyncHeaderEvidence> {
  const unavailable = new Map<string, AsyncHeaderEvidence>();

  for (const [key, evidence] of Object.entries(headers ?? {})) {
    if (evidence.state === "captured") {
      continue;
    }
    unavailable.set(key, evidence);
  }

  return unavailable;
}

function extractHeaderSchemaMetadata(value: JsonValue): {
  requiredHeaderKeys: string[];
  declaredHeaderKeys: Set<string>;
} {
  const sanitized = stripParserKeywords(value);
  if (!isRecord(sanitized)) {
    return {
      requiredHeaderKeys: [],
      declaredHeaderKeys: new Set<string>()
    };
  }

  const requiredHeaderKeys = Array.isArray(sanitized.required)
    ? sanitized.required.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];

  const declaredHeaderKeys = new Set<string>(requiredHeaderKeys);
  if (isRecord(sanitized.properties)) {
    for (const key of Object.keys(sanitized.properties)) {
      if (key.trim().length === 0) {
        continue;
      }
      declaredHeaderKeys.add(key);
    }
  }

  return {
    requiredHeaderKeys: [...new Set(requiredHeaderKeys)].sort((left, right) => left.localeCompare(right)),
    declaredHeaderKeys
  };
}

function shouldSkipHeaderAjvError(error: ErrorObject, _unavailableHeaders: Map<string, AsyncHeaderEvidence>): boolean {
  if (error.keyword !== "required" || typeof error.params?.missingProperty !== "string") {
    return false;
  }

  return true;
}

function appendDiagnostic(
  diagnostics: AsyncSchemaConformanceDiagnostic[],
  seenDiagnostics: Set<string>,
  diagnostic: AsyncSchemaConformanceDiagnostic
): void {
  const key = [
    diagnostic.kind,
    diagnostic.validationKind,
    diagnostic.operationKey,
    diagnostic.channel,
    diagnostic.action,
    diagnostic.messageName ?? "",
    diagnostic.schemaId ?? "",
    diagnostic.pointer ?? "",
    diagnostic.reason,
    diagnostic.message
  ].join("\u0000");

  if (seenDiagnostics.has(key)) {
    return;
  }

  seenDiagnostics.add(key);
  diagnostics.push(diagnostic);
}

function toAjvSchema(value: JsonValue): object | boolean {
  const sanitized = stripParserKeywords(value);
  if (typeof sanitized === "boolean") {
    return sanitized;
  }

  if (!isRecord(sanitized)) {
    throw new Error("AsyncAPI schema must normalize to an object or boolean JSON Schema.");
  }

  return sanitized;
}

function stripParserKeywords(value: JsonValue): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripParserKeywords(item));
  }

  const next: Record<string, JsonValue> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key.startsWith("x-parser-")) {
      continue;
    }

    next[key] = stripParserKeywords(nestedValue);
  }
  return next;
}

function isSupportedContentType(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  const base = normalized.split(";", 1)[0]?.trim() ?? normalized;
  return base === "application/json" || base.endsWith("+json");
}

function isSupportedSchemaFormat(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.includes("json");
}

function sortAjvErrors(errors: ErrorObject[]): ErrorObject[] {
  return [...errors].sort((left, right) => {
    const leftPointer = toJsonPointer(left);
    const rightPointer = toJsonPointer(right);
    if (leftPointer !== rightPointer) {
      return leftPointer.localeCompare(rightPointer);
    }

    const leftReason = toAjvReason(left);
    const rightReason = toAjvReason(right);
    if (leftReason !== rightReason) {
      return leftReason.localeCompare(rightReason);
    }

    return left.keyword.localeCompare(right.keyword);
  });
}

function compareDiagnostics(left: AsyncSchemaConformanceDiagnostic, right: AsyncSchemaConformanceDiagnostic): number {
  if (left.operationKey !== right.operationKey) {
    return left.operationKey.localeCompare(right.operationKey);
  }

  const kind = diagnosticKindRank(left.kind) - diagnosticKindRank(right.kind);
  if (kind !== 0) {
    return kind;
  }

  const validationKind = validationKindRank(left.validationKind) - validationKindRank(right.validationKind);
  if (validationKind !== 0) {
    return validationKind;
  }

  const leftSchemaId = left.schemaId ?? "";
  const rightSchemaId = right.schemaId ?? "";
  if (leftSchemaId !== rightSchemaId) {
    return leftSchemaId.localeCompare(rightSchemaId);
  }

  const leftPointer = left.pointer ?? "";
  const rightPointer = right.pointer ?? "";
  if (leftPointer !== rightPointer) {
    return leftPointer.localeCompare(rightPointer);
  }

  if (left.reason !== right.reason) {
    return left.reason.localeCompare(right.reason);
  }

  return left.message.localeCompare(right.message);
}

function diagnosticKindRank(kind: AsyncSchemaConformanceDiagnosticKind): number {
  switch (kind) {
    case "unsupported-content-type":
      return 0;
    case "unsupported-schema-format":
      return 1;
    case "missing-payload":
      return 2;
    case "invalid-payload":
      return 3;
    case "missing-header":
      return 4;
    case "unavailable-header":
      return 5;
    case "invalid-header":
      return 6;
    case "unverifiable-headers":
      return 7;
  }
}

function validationKindRank(kind: AsyncSchemaValidationKind): number {
  switch (kind) {
    case "contentType":
      return 0;
    case "schemaFormat":
      return 1;
    case "payload":
      return 2;
    case "headers":
      return 3;
  }
}

function toJsonPointer(error: ErrorObject): string {
  let pointer = error.instancePath || "/";
  if (error.keyword === "required" && typeof error.params?.missingProperty === "string") {
    pointer = appendJsonPointer(pointer, error.params.missingProperty);
  }

  if (error.keyword === "additionalProperties" && typeof error.params?.additionalProperty === "string") {
    pointer = appendJsonPointer(pointer, error.params.additionalProperty);
  }

  return pointer;
}

function toAjvReason(error: ErrorObject): string {
  const message = (error.message ?? "validation error").replace(/"([^"]+)"/g, "'$1'");
  return `${error.keyword}: ${message}`;
}

function toHeaderPointer(headerKey: string): string {
  return appendJsonPointer("/", headerKey);
}

function appendJsonPointer(base: string, segment: string): string {
  const escaped = segment.replace(/~/g, "~0").replace(/\//g, "~1");
  if (base === "/") {
    return `/${escaped}`;
  }

  return `${base}/${escaped}`;
}

function validationCacheKey(operationKey: string, messageIdentity: string, kind: "payload" | "headers"): string {
  return `${operationKey}\u0000${messageIdentity}\u0000${kind}`;
}

function matchKey(protocol: AsyncProtocol, action: AsyncAction, channel: string): string {
  return `${protocol}\u0000${action}\u0000${channel}`;
}

function isAsyncOperationKey(value: AsyncOperationKey | OperationKeyLike): value is AsyncOperationKey {
  return value.kind === "kafka" || value.kind === "amqp";
}

type OperationKeyLike = {
  kind: string;
  action?: AsyncAction;
  channel?: string;
};

function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
