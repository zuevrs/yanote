import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import stringify from "json-stable-stringify";
import { normalizeAsyncReport } from "./asyncNormalize.js";
import type { AsyncYanoteReport } from "./asyncReport.js";
import { validateAsyncReport } from "./asyncSchema.js";

export async function writeAsyncYanoteReport(outDir: string, report: AsyncYanoteReport): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "yanote-async-report.json");

  const normalized = normalizeAsyncReport(report);
  const validation = validateAsyncReport(normalized);
  if (!validation.ok) {
    throw new Error(`Invalid async report schema: ${validation.errors.join("; ")}`);
  }

  const serialized = stringify(normalized, { space: 2 }) + "\n";
  await writeFile(outPath, serialized, "utf8");
  return outPath;
}
