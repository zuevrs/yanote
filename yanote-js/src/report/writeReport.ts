import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import stringify from "json-stable-stringify";
import { normalizeReport } from "./normalize.js";
import type { YanoteReport } from "./report.js";
import { renderYanoteReportHtml } from "./reportHtml.js";
import { validateReport } from "./schema.js";

export async function writeYanoteReport(outDir: string, report: YanoteReport): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "yanote-report.json");
  const htmlPath = path.join(outDir, "yanote-report.html");

  const normalized = normalizeReport(report);
  const validation = validateReport(normalized);
  if (!validation.ok) {
    throw new Error(`Invalid report schema: ${validation.errors.join("; ")}`);
  }

  const serialized = stringify(normalized, { space: 2 }) + "\n";
  const html = renderYanoteReportHtml(normalized);

  await Promise.all([writeFile(outPath, serialized, "utf8"), writeFile(htmlPath, html, "utf8")]);
  return outPath;
}
