import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import type { AsyncEvent, JsonValue } from "../model/asyncEvent.js";
import { serializeOperationKey, type AsyncAction, type KafkaMessageContract, type KafkaOperationContract } from "../model/operationKey.js";
import type { AsyncApiSemanticsBundle } from "../spec/asyncapi.js";

export type AsyncSchemaConformanceDiagnosticKind =
  | "missing-payload"
  | "invalid-payload"
  | "unsupported-content-type"
  | "unsupported-schema-format"
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

export type AsyncSchemaConformanceResult = {
  diagnostics: AsyncSchemaConformanceDiagnostic[];
  matchedOperationKeys: string[];
  validatedOperationKeys: string[];
};

type MatchedKafkaContract = {
  operationKey: string;
  contract: KafkaOperationContract;
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

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  strictTypes: true
});

export function computeAsyncSchemaConformance(
  bundle: AsyncApiSemanticsBundle,
  events: AsyncEvent[]
): AsyncSchemaConformanceResult {
  const contractsByMatchKey = new Map<string, MatchedKafkaContract>();
  const validationPlans = new Map<string, PayloadValidationPlan>();

  for (const operation of bundle.operations) {
    if (operation.kind !== "kafka") {
      continue;
    }

    const operationKey = serializeOperationKey(operation);
    const contract = bundle.operationContractsByKey.get(operationKey) ?? { operation };
    contractsByMatchKey.set(matchKey(operation.action, operation.channel), {
      operationKey,
      contract
    });
  }

  const diagnostics: AsyncSchemaConformanceDiagnostic[] = [];
  const seenDiagnostics = new Set<string>();
  const matchedOperationKeys = new Set<string>();
  const validatedOperationKeys = new Set<string>();

  for (const event of events) {
    const matched = contractsByMatchKey.get(matchKey(event.action, event.channel));
    if (!matched) {
      continue;
    }

    matchedOperationKeys.add(matched.operationKey);

    const message = matched.contract.message;
    if (!message) {
      continue;
    }

    if (message.name && event.message && event.message !== message.name) {
      continue;
    }

    if (message.headersSchemaId && message.headerValidationCapability === "unverifiable") {
      appendDiagnostic(diagnostics, seenDiagnostics, {
        kind: "unverifiable-headers",
        validationKind: "headers",
        operationKey: matched.operationKey,
        channel: matched.contract.operation.channel,
        action: matched.contract.operation.action,
        messageName: message.name,
        schemaId: message.headersSchemaId,
        reason: "Kafka evidence does not currently retain headers, so the AsyncAPI header schema cannot be verified.",
        message: "Retained AsyncAPI header schema cannot be verified from the observed kafka evidence"
      });
    }

    const plan = getPayloadValidationPlan(matched, message, validationPlans);
    if (plan.kind === "none") {
      continue;
    }

    if (plan.kind === "unsupported") {
      appendDiagnostic(diagnostics, seenDiagnostics, plan.diagnostic);
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
        schemaId: plan.schemaId,
        pointer: "/",
        reason: "Observed kafka evidence did not include a payload.",
        message: "Observed kafka evidence is missing the payload required for AsyncAPI schema validation"
      });
      continue;
    }

    const valid = plan.validator(event.payload);
    if (valid) {
      continue;
    }

    for (const error of sortAjvErrors(plan.validator.errors ?? [])) {
      appendDiagnostic(diagnostics, seenDiagnostics, {
        kind: "invalid-payload",
        validationKind: "payload",
        operationKey: matched.operationKey,
        channel: matched.contract.operation.channel,
        action: matched.contract.operation.action,
        messageName: message.name,
        schemaId: plan.schemaId,
        pointer: toJsonPointer(error),
        reason: toAjvReason(error),
        message: "Observed kafka payload did not conform to the retained AsyncAPI payload schema"
      });
    }
  }

  return {
    diagnostics: [...diagnostics].sort(compareDiagnostics),
    matchedOperationKeys: [...matchedOperationKeys].sort((left, right) => left.localeCompare(right)),
    validatedOperationKeys: [...validatedOperationKeys].sort((left, right) => left.localeCompare(right))
  };
}

function getPayloadValidationPlan(
  matched: MatchedKafkaContract,
  message: KafkaMessageContract,
  cache: Map<string, PayloadValidationPlan>
): PayloadValidationPlan {
  const existing = cache.get(matched.operationKey);
  if (existing) {
    return existing;
  }

  const plan = buildPayloadValidationPlan(matched, message);
  cache.set(matched.operationKey, plan);
  return plan;
}

function buildPayloadValidationPlan(matched: MatchedKafkaContract, message: KafkaMessageContract): PayloadValidationPlan {
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
    throw new Error("AsyncAPI payload schema must normalize to an object or boolean JSON Schema.");
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
    case "unverifiable-headers":
      return 4;
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

  return pointer;
}

function toAjvReason(error: ErrorObject): string {
  return `${error.keyword}: ${error.message ?? "validation error"}`;
}

function appendJsonPointer(base: string, segment: string): string {
  const escaped = segment.replace(/~/g, "~0").replace(/\//g, "~1");
  if (base === "/") {
    return `/${escaped}`;
  }

  return `${base}/${escaped}`;
}

function matchKey(action: AsyncAction, channel: string): string {
  return `${action}\u0000${channel}`;
}

function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
