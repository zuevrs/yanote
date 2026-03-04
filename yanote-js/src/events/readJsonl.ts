import { createReadStream } from "node:fs";
import readline from "node:readline";
import { normalizeMethod, normalizeRunId, normalizeSuite, type HttpEvent } from "../model/httpEvent.js";

export type ReadJsonlResult<T> = {
  items: T[];
  invalidLines: number;
  invalidLineNumbers: number[];
};

export async function readHttpEventsJsonl(filePath: string): Promise<ReadJsonlResult<HttpEvent>> {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const items: HttpEvent[] = [];
  let invalidLines = 0;
  const invalidLineNumbers: number[] = [];
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber += 1;
    if (!line || !line.trim()) continue;
    let obj: any;
    try {
      obj = JSON.parse(line);
    } catch {
      invalidLines += 1;
      invalidLineNumbers.push(lineNumber);
      continue;
    }

    if (!obj || obj.kind !== "http") continue;

    const method = normalizeMethod(obj.method);
    const route = typeof obj.route === "string" ? obj.route : null;
    if (!method || !route) continue;

    const testRunId = normalizeRunId(obj["test.run_id"]);
    const testSuite = normalizeSuite(obj["test.suite"]);

    const event: HttpEvent = {
      kind: "http",
      ts: typeof obj.ts === "number" ? obj.ts : undefined,
      method,
      route,
      status: typeof obj.status === "number" ? obj.status : undefined,
      service: typeof obj.service === "string" ? obj.service : obj.service ?? undefined,
      instance: typeof obj.instance === "string" ? obj.instance : obj.instance ?? undefined,
      error: typeof obj.error === "boolean" ? obj.error : undefined,
      queryKeys: normalizeQueryKeys(obj.queryKeys),
      headerKeys: normalizeHeaderKeys(obj.headerKeys),
      testRunId,
      testSuite
    };
    items.push(event);
  }

  return { items, invalidLines, invalidLineNumbers };
}

function normalizeQueryKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const key of value) {
    if (typeof key !== "string") continue;
    const normalized = key.trim();
    if (!normalized) continue;
    seen.add(normalized);
  }
  return Array.from(seen).sort((left, right) => left.localeCompare(right));
}

function normalizeHeaderKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const key of value) {
    if (typeof key !== "string") continue;
    const normalized = key.trim().toLowerCase();
    if (!normalized) continue;
    seen.add(normalized);
  }
  return Array.from(seen).sort((left, right) => left.localeCompare(right));
}
