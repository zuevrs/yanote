import { createReadStream } from "node:fs";
import readline from "node:readline";
import {
  getCapturedRequestEvidenceKeys,
  normalizeHttpRequestEvidenceMap,
  normalizeJsonValue,
  normalizeMethod,
  normalizeOptionalHttpText,
  normalizeRunId,
  normalizeSuite,
  type HttpEvent
} from "../model/httpEvent.js";
import {
  normalizePayloadCaptureReason,
  normalizePayloadCaptureState
} from "../model/payloadCapture.js";

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
    const pathParams = normalizeHttpRequestEvidenceMap(obj.pathParams);
    const queryParams = normalizeHttpRequestEvidenceMap(obj.queryParams);
    const requestHeaders = normalizeHttpRequestEvidenceMap(obj.requestHeaders, { lowercaseKeys: true });
    const cookies = normalizeHttpRequestEvidenceMap(obj.cookies);

    const queryKeys = normalizeQueryKeys(
      obj.queryKeys,
      Array.isArray(obj.queryKeys) ? undefined : getCapturedRequestEvidenceKeys(queryParams)
    );
    const headerKeys = normalizeHeaderKeys(
      obj.headerKeys,
      Array.isArray(obj.headerKeys) ? undefined : getCapturedRequestEvidenceKeys(requestHeaders, { lowercaseKeys: true })
    );

    const event: HttpEvent = {
      kind: "http",
      ts: typeof obj.ts === "number" ? obj.ts : undefined,
      method,
      route,
      status: typeof obj.status === "number" ? obj.status : undefined,
      requestBody: normalizeJsonValue(obj.requestBody),
      requestBodyState: normalizePayloadCaptureState(obj.requestBodyState),
      requestBodyReason: normalizePayloadCaptureReason(obj.requestBodyReason),
      requestContentType: normalizeOptionalHttpText(obj.requestContentType),
      responseBody: normalizeJsonValue(obj.responseBody),
      responseBodyState: normalizePayloadCaptureState(obj.responseBodyState),
      responseBodyReason: normalizePayloadCaptureReason(obj.responseBodyReason),
      responseContentType: normalizeOptionalHttpText(obj.responseContentType),
      ...(pathParams ? { pathParams } : {}),
      ...(queryParams ? { queryParams } : {}),
      ...(requestHeaders ? { requestHeaders } : {}),
      ...(cookies ? { cookies } : {}),
      service: typeof obj.service === "string" ? obj.service : obj.service ?? undefined,
      instance: typeof obj.instance === "string" ? obj.instance : obj.instance ?? undefined,
      error: typeof obj.error === "boolean" ? obj.error : undefined,
      queryKeys,
      headerKeys,
      testRunId,
      testSuite
    };
    items.push(event);
  }

  return { items, invalidLines, invalidLineNumbers };
}

function normalizeQueryKeys(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  const seen = new Set<string>();
  for (const key of value) {
    if (typeof key !== "string") continue;
    const normalized = key.trim();
    if (!normalized) continue;
    seen.add(normalized);
  }
  return Array.from(seen).sort((left, right) => left.localeCompare(right));
}

function normalizeHeaderKeys(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  const seen = new Set<string>();
  for (const key of value) {
    if (typeof key !== "string") continue;
    const normalized = key.trim().toLowerCase();
    if (!normalized) continue;
    seen.add(normalized);
  }
  return Array.from(seen).sort((left, right) => left.localeCompare(right));
}
