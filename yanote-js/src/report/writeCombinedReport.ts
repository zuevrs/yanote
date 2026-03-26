import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import stringify from "json-stable-stringify";
import { normalizeCombinedReport } from "./combinedNormalize.js";
import type { CombinedYanoteReport } from "./combinedReport.js";
import { renderCombinedYanoteReportHtml } from "./combinedReportHtml.js";
import { validateCombinedReport } from "./combinedSchema.js";

export async function writeCombinedYanoteReport(outDir: string, report: CombinedYanoteReport): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "yanote-combined-report.json");
  const htmlPath = path.join(outDir, "yanote-combined-report.html");

  const normalized = normalizeCombinedReport(report);
  const validation = validateCombinedReport(normalized);
  if (!validation.ok) {
    throw new Error(`Invalid combined report schema: ${validation.errors.join("; ")}`);
  }

  const serialized = stringify(normalized, { space: 2 }) + "\n";
  const html = renderCombinedYanoteReportHtml(normalized);

  await Promise.all([writeFile(outPath, serialized, "utf8"), writeFile(htmlPath, html, "utf8")]);
  return outPath;
}
