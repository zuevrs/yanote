import { createReadStream } from "node:fs";
import readline from "node:readline";
import {
  normalizeAsyncAction,
  normalizeAsyncHeaders,
  normalizeChannel,
  normalizeJsonValue,
  normalizeMessageContract,
  type AsyncEvent
} from "../model/asyncEvent.js";
import { normalizeRunId, normalizeSuite } from "../model/httpEvent.js";
import {
  normalizePayloadCaptureReason,
  normalizePayloadCaptureState
} from "../model/payloadCapture.js";

export type ReadAsyncJsonlResult<T> = {
  items: T[];
  invalidLines: number;
  invalidLineNumbers: number[];
};

export async function readAsyncEventsJsonl(filePath: string): Promise<ReadAsyncJsonlResult<AsyncEvent>> {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const items: AsyncEvent[] = [];
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

    if (!obj || obj.kind !== "kafka") continue;

    const action = normalizeAsyncAction(obj.action);
    const channel = normalizeChannel(obj.channel);
    if (!action || !channel) continue;

    items.push({
      kind: "kafka",
      ts: typeof obj.ts === "number" ? obj.ts : undefined,
      action,
      channel,
      message: normalizeMessageContract(obj.message),
      service: typeof obj.service === "string" ? obj.service : obj.service === null ? null : undefined,
      instance: typeof obj.instance === "string" ? obj.instance : obj.instance === null ? null : undefined,
      payload: normalizeJsonValue(obj.payload),
      payloadState: normalizePayloadCaptureState(obj.payloadState),
      payloadReason: normalizePayloadCaptureReason(obj.payloadReason),
      headers: normalizeAsyncHeaders(obj.headers),
      error: typeof obj.error === "boolean" ? obj.error : undefined,
      testRunId: normalizeRunId(obj["test.run_id"]),
      testSuite: normalizeSuite(obj["test.suite"])
    });
  }

  return { items, invalidLines, invalidLineNumbers };
}
