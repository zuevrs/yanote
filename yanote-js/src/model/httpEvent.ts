export type HttpEvent = {
  kind: "http";
  ts?: number;
  method: string;
  route: string;
  status?: number;
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
