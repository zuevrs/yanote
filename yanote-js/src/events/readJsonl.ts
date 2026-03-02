import { createReadStream } from "node:fs";
import readline from "node:readline";
import { normalizeMethod, normalizeRunId, normalizeSuite, type HttpEvent } from "../model/httpEvent.js";

export type ReadJsonlResult<T> = {
  items: T[];
  invalidLines: number;
};

export async function readHttpEventsJsonl(filePath: string): Promise<ReadJsonlResult<HttpEvent>> {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const items: HttpEvent[] = [];
  let invalidLines = 0;

  for await (const line of rl) {
    if (!line || !line.trim()) continue;
    let obj: any;
    try {
      obj = JSON.parse(line);
    } catch {
      invalidLines += 1;
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
      testRunId,
      testSuite
    };
    items.push(event);
  }

  return { items, invalidLines };
}

