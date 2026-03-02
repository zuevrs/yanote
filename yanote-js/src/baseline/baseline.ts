import { readFile } from "node:fs/promises";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";

export type BaselineFile = {
  format: 1;
  covered: OperationKey[];
};

export async function readBaseline(filePath: string): Promise<BaselineFile> {
  const raw = await readFile(filePath, "utf8");
  const obj = JSON.parse(raw);
  if (!obj || obj.format !== 1 || !Array.isArray(obj.covered)) {
    throw new Error("Invalid baseline format");
  }
  return obj as BaselineFile;
}

export function computeRegression(baseline: BaselineFile, currentCovered: OperationKey[]): OperationKey[] {
  const current = new Set(currentCovered.map(serializeOperationKey));
  const missing: OperationKey[] = [];
  for (const op of baseline.covered) {
    if (!op || typeof op !== "object") continue;
    const sk = serializeOperationKey(op as any);
    if (!current.has(sk)) missing.push(op);
  }
  return missing;
}

