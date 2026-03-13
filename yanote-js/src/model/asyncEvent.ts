import type { AsyncAction } from "./operationKey.js";

export type AsyncEvent = {
  kind: "kafka";
  ts?: number;
  action: AsyncAction;
  channel: string;
  message?: string;
  service?: string | null;
  instance?: string | null;
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
