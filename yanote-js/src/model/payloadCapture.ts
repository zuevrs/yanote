export type PayloadCaptureState = "captured" | "omitted";
export type PayloadCaptureReason = "malformed" | "oversized" | "unsupported" | "policy-filtered";

const PAYLOAD_CAPTURE_STATES = new Set<PayloadCaptureState>(["captured", "omitted"]);
const PAYLOAD_CAPTURE_REASONS = new Set<PayloadCaptureReason>([
  "malformed",
  "oversized",
  "unsupported",
  "policy-filtered"
]);

export function normalizePayloadCaptureState(value: unknown): PayloadCaptureState | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return PAYLOAD_CAPTURE_STATES.has(normalized as PayloadCaptureState)
    ? (normalized as PayloadCaptureState)
    : undefined;
}

export function normalizePayloadCaptureReason(value: unknown): PayloadCaptureReason | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return PAYLOAD_CAPTURE_REASONS.has(normalized as PayloadCaptureReason)
    ? (normalized as PayloadCaptureReason)
    : undefined;
}
