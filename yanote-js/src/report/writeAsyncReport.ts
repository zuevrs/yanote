import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import stringify from "json-stable-stringify";
import { normalizeAsyncReport } from "./asyncNormalize.js";
import type { AsyncYanoteReport } from "./asyncReport.js";
import { renderAsyncYanoteReportHtml } from "./asyncReportHtml.js";
import { validateAsyncReport } from "./asyncSchema.js";

export async function writeAsyncYanoteReport(outDir: string, report: AsyncYanoteReport): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "yanote-async-report.json");
  const htmlPath = path.join(outDir, "yanote-async-report.html");

  const normalized = normalizeAsyncReport(report);
  const validation = validateAsyncReport(normalized);
  if (!validation.ok) {
    throw new Error(`Invalid async report schema: ${validation.errors.join("; ")}`);
  }

  const serialized = stringify(normalized, { space: 2 }) + "\n";
  const html = renderAsyncYanoteReportHtml(normalized);

  await Promise.all([writeFile(outPath, serialized, "utf8"), writeFile(htmlPath, html, "utf8")]);
  return outPath;
}
