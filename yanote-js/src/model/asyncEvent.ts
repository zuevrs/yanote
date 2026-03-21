import type { PayloadCaptureReason, PayloadCaptureState } from "./payloadCapture.js";
import type { AsyncAction } from "./operationKey.js";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type AsyncEvent = {
  kind: "kafka";
  ts?: number;
  action: AsyncAction;
  channel: string;
  message?: string;
  service?: string | null;
  instance?: string | null;
  payload?: JsonValue;
  payloadState?: PayloadCaptureState;
  payloadReason?: PayloadCaptureReason;
  error?: boolean;
  testRunId: string;
  testSuite: string;
};

export function normalizeAsyncAction(value: unknown): AsyncAction | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "send" || normalized === "receive") return normalized;
  return null;
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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
