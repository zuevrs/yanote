import type { PayloadCaptureReason, PayloadCaptureState } from "./payloadCapture.js";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type HttpEvent = {
  kind: "http";
  ts?: number;
  method: string;
  route: string;
  status?: number;
  requestBody?: JsonValue;
  requestBodyState?: PayloadCaptureState;
  requestBodyReason?: PayloadCaptureReason;
  requestContentType?: string | null;
  responseBody?: JsonValue;
  responseBodyState?: PayloadCaptureState;
  responseBodyReason?: PayloadCaptureReason;
  responseContentType?: string | null;
  service?: string | null;
  instance?: string | null;
  error?: boolean;
  queryKeys: string[];
  headerKeys: string[];
  testRunId: string;
  testSuite: string;
};

export function normalizeSuite(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  const s = value.trim();
  return s.length === 0 ? "unknown" : s;
}

export function normalizeRunId(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  const s = value.trim();
  return s.length === 0 ? "unknown" : s;
}

export function normalizeMethod(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  return s.toUpperCase();
}

export function normalizeOptionalHttpText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length === 0 ? undefined : normalized;
}

export function normalizeJsonValue(value: unknown): JsonValue | undefined {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (Array.isArray(value)) {
    const normalizedItems: JsonValue[] = [];
    for (const item of value) {
      const normalized = normalizeJsonValue(item);
      if (normalized === undefined) return undefined;
      normalizedItems.push(normalized);
    }
    return normalizedItems;
  }
  if (!isPlainRecord(value)) return undefined;

  const normalizedEntries: Record<string, JsonValue> = {};
  for (const [key, entry] of Object.entries(value)) {
    const normalized = normalizeJsonValue(entry);
    if (normalized === undefined) return undefined;
    normalizedEntries[key] = normalized;
  }
  return normalizedEntries;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
