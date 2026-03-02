import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { YanoteReport } from "./report.js";

export async function writeYanoteReport(outDir: string, report: YanoteReport): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "yanote-report.json");
  await writeFile(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return outPath;
}

