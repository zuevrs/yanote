import type { PayloadCaptureReason, PayloadCaptureState } from "./payloadCapture.js";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type HttpRequestEvidenceState = "captured" | "redacted" | "omitted";
export type HttpRequestEvidenceReason = "sensitive" | "oversized" | "unsupported" | "unavailable";

export type HttpRequestEvidence = {
  state: HttpRequestEvidenceState;
  values?: string[];
  reason?: HttpRequestEvidenceReason;
};

export type HttpRequestEvidenceMap = Record<string, HttpRequestEvidence>;

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
  pathParams?: HttpRequestEvidenceMap;
  queryParams?: HttpRequestEvidenceMap;
  requestHeaders?: HttpRequestEvidenceMap;
  cookies?: HttpRequestEvidenceMap;
  service?: string | null;
  instance?: string | null;
  error?: boolean;
  queryKeys: string[];
  headerKeys: string[];
  testRunId: string;
  testSuite: string;
};

const HTTP_REQUEST_EVIDENCE_STATES = new Set<HttpRequestEvidenceState>(["captured", "redacted", "omitted"]);
const HTTP_REQUEST_EVIDENCE_REASONS = new Set<HttpRequestEvidenceReason>([
  "sensitive",
  "oversized",
  "unsupported",
  "unavailable"
]);

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

export function normalizeHttpRequestEvidenceState(value: unknown): HttpRequestEvidenceState | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase() as HttpRequestEvidenceState;
  return HTTP_REQUEST_EVIDENCE_STATES.has(normalized) ? normalized : undefined;
}

export function normalizeHttpRequestEvidenceReason(value: unknown): HttpRequestEvidenceReason | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase() as HttpRequestEvidenceReason;
  return HTTP_REQUEST_EVIDENCE_REASONS.has(normalized) ? normalized : undefined;
}

export function normalizeHttpRequestEvidence(value: unknown): HttpRequestEvidence | undefined {
  if (!isPlainRecord(value)) return undefined;

  const state = normalizeHttpRequestEvidenceState(value.state);
  if (!state) return undefined;

  if (state === "captured") {
    const values = normalizeHttpRequestEvidenceValues(value.values);
    if (!values || values.length === 0) return undefined;
    return { state, values };
  }

  const reason = normalizeHttpRequestEvidenceReason(value.reason);
  if (!reason) return undefined;
  return { state, reason };
}

export function normalizeHttpRequestEvidenceMap(
  value: unknown,
  options: { lowercaseKeys?: boolean } = {}
): HttpRequestEvidenceMap | undefined {
  if (!isPlainRecord(value)) return undefined;

  const normalizedEntries = Object.entries(value)
    .map(([key, entryValue]) => {
      const normalizedKey = normalizeHttpRequestEvidenceKey(key, Boolean(options.lowercaseKeys));
      const normalizedValue = normalizeHttpRequestEvidence(entryValue);
      if (!normalizedKey || !normalizedValue) return undefined;
      return [normalizedKey, normalizedValue] as const;
    })
    .filter((entry): entry is readonly [string, HttpRequestEvidence] => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));

  if (normalizedEntries.length === 0) return undefined;
  return Object.fromEntries(normalizedEntries);
}

export function getCapturedRequestEvidenceKeys(
  value: HttpRequestEvidenceMap | undefined,
  options: { lowercaseKeys?: boolean } = {}
): string[] {
  if (!value) return [];

  const keys = Object.entries(value)
    .filter(([, evidence]) => evidence.state === "captured")
    .map(([key]) => (options.lowercaseKeys ? key.toLowerCase() : key));

  return Array.from(new Set(keys)).sort((left, right) => left.localeCompare(right));
}

function normalizeHttpRequestEvidenceKey(value: unknown, lowercase: boolean): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (normalized.length === 0) return undefined;
  return lowercase ? normalized.toLowerCase() : normalized;
}

function normalizeHttpRequestEvidenceValues(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const normalized = value.filter((entry): entry is string => typeof entry === "string");
  return normalized.length > 0 ? [...normalized] : undefined;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
