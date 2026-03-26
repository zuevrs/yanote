import type { PayloadCaptureReason, PayloadCaptureState } from "./payloadCapture.js";
import type { AsyncAction, AsyncProtocol } from "./operationKey.js";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type AsyncHeaderCaptureState = "captured" | "redacted" | "omitted";
export type AsyncHeaderCaptureReason = "sensitive" | "oversized" | "unsupported";

export type AsyncHeaderEvidence = {
  state: AsyncHeaderCaptureState;
  value?: string;
  reason?: AsyncHeaderCaptureReason;
};

export type AsyncHeaders = Record<string, AsyncHeaderEvidence>;

export type AsyncEvent = {
  kind: AsyncProtocol;
  ts?: number;
  action: AsyncAction;
  channel: string;
  message?: string;
  service?: string | null;
  instance?: string | null;
  payload?: JsonValue;
  payloadState?: PayloadCaptureState;
  payloadReason?: PayloadCaptureReason;
  headers?: AsyncHeaders;
  error?: boolean;
  testRunId: string;
  testSuite: string;
};

const ASYNC_PROTOCOLS = new Set<AsyncProtocol>(["kafka", "amqp"]);
const ASYNC_HEADER_CAPTURE_STATES = new Set<AsyncHeaderCaptureState>([
  "captured",
  "redacted",
  "omitted"
]);
const ASYNC_HEADER_CAPTURE_REASONS = new Set<AsyncHeaderCaptureReason>([
  "sensitive",
  "oversized",
  "unsupported"
]);

export function normalizeAsyncAction(value: unknown): AsyncAction | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "send" || normalized === "receive") return normalized;
  return null;
}

export function normalizeAsyncKind(value: unknown): AsyncProtocol | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase() as AsyncProtocol;
  return ASYNC_PROTOCOLS.has(normalized) ? normalized : null;
}

export function normalizeChannel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeMessageContract(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeJsonValue(value: unknown): JsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    const normalizedItems: JsonValue[] = [];
    for (const item of value) {
      const normalizedItem = normalizeJsonValue(item);
      if (normalizedItem === undefined) {
        return undefined;
      }
      normalizedItems.push(normalizedItem);
    }
    return normalizedItems;
  }

  if (!isPlainRecord(value)) {
    return undefined;
  }

  const normalizedEntries: Record<string, JsonValue> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedNestedValue = normalizeJsonValue(nestedValue);
    if (normalizedNestedValue === undefined) {
      return undefined;
    }
    normalizedEntries[key] = normalizedNestedValue;
  }
  return normalizedEntries;
}

export function normalizeAsyncHeaders(value: unknown): AsyncHeaders | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }

  const normalizedEntries = Object.entries(value)
    .map(([key, entryValue]) => {
      const normalizedKey = normalizeHeaderKey(key);
      const normalizedValue = normalizeAsyncHeaderEvidence(entryValue);
      if (!normalizedKey || !normalizedValue) {
        return undefined;
      }
      return [normalizedKey, normalizedValue] as const;
    })
    .filter((entry): entry is readonly [string, AsyncHeaderEvidence] => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));

  if (normalizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(normalizedEntries);
}

export function normalizeAsyncHeaderEvidence(value: unknown): AsyncHeaderEvidence | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }

  const state = normalizeAsyncHeaderCaptureState(value.state);
  if (!state) {
    return undefined;
  }

  const normalizedValue = normalizeHeaderText(value.value);
  const normalizedReason = normalizeAsyncHeaderCaptureReason(value.reason);

  if (state === "captured") {
    if (!normalizedValue) {
      return undefined;
    }
    return { state, value: normalizedValue };
  }

  return {
    state,
    ...(normalizedReason ? { reason: normalizedReason } : {})
  };
}

export function normalizeAsyncHeaderCaptureState(value: unknown): AsyncHeaderCaptureState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toLowerCase() as AsyncHeaderCaptureState;
  return ASYNC_HEADER_CAPTURE_STATES.has(normalized) ? normalized : undefined;
}

export function normalizeAsyncHeaderCaptureReason(value: unknown): AsyncHeaderCaptureReason | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toLowerCase() as AsyncHeaderCaptureReason;
  return ASYNC_HEADER_CAPTURE_REASONS.has(normalized) ? normalized : undefined;
}

function normalizeHeaderKey(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeHeaderText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
