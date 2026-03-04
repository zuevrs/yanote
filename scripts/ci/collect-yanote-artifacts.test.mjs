import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/collect-yanote-artifacts.sh");

test("collects deterministic report and diagnostics artifact names", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-artifacts-"));
  try {
    const sourceDir = path.join(workDir, "build/yanote/aggregate/check");
    const ciLogsDir = path.join(workDir, ".yanote-ci");
    const outDir = path.join(workDir, ".yanote-ci/artifacts");
    await mkdir(sourceDir, { recursive: true });
    await mkdir(ciLogsDir, { recursive: true });

    await writeFile(path.join(sourceDir, "yanote-report.json"), '{"status":"partial"}', "utf8");
    await writeFile(path.join(sourceDir, "yanote-check-command.args"), "report --profile ci", "utf8");
    await writeFile(path.join(ciLogsDir, "yanote-validation.stderr.log"), "stderr output", "utf8");

    const result = spawnSync("bash", [scriptPath, outDir], { cwd: workDir, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);

    const artifacts = (await readdir(outDir)).sort();
    assert.deepEqual(
      artifacts,
      [
        "artifact-manifest.txt",
        "yanote-check-command.args",
        "yanote-report.json",
        "yanote-report.source-path.txt",
        "yanote-validation.stderr.log"
      ]
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("writes deterministic manifest when no report snapshot exists", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-artifacts-"));
  try {
    const outDir = path.join(workDir, ".yanote-ci/artifacts");
    const result = spawnSync("bash", [scriptPath, outDir], { cwd: workDir, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);

    const manifest = await readFile(path.join(outDir, "artifact-manifest.txt"), "utf8");
    assert.match(manifest, /report_found=false/);
    assert.match(manifest, /created_at=/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
