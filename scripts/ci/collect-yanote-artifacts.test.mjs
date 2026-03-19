import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/collect-yanote-artifacts.sh");

async function seedAsyncBundle(workDir) {
  const asyncBundleDir = path.join(workDir, ".yanote-ci/live-kafka-proof");
  await mkdir(asyncBundleDir, { recursive: true });

  await writeFile(path.join(asyncBundleDir, "artifact-manifest.txt"), "proof_status=failure\nreport_found=false\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "artifact-source-paths.txt"), "temp_dir=/tmp/proof\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "single-service-proof.log"), "single\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "merged-two-service.events.jsonl"), '{"kind":"kafka"}\n', "utf8");
  await writeFile(path.join(asyncBundleDir, "async-report.stderr"), "YANOTE_ASYNC_ERROR code=ASYNC_GATE\n", "utf8");
}

async function seedV1E2eBundle(workDir) {
  const v1BundleDir = path.join(workDir, ".yanote-ci/v1-e2e");
  await mkdir(path.join(v1BundleDir, "out"), { recursive: true });

  await writeFile(path.join(v1BundleDir, "compose.log"), "compose log\n", "utf8");
  await writeFile(path.join(v1BundleDir, "out", "yanote-report.json"), '{"status":"partial"}\n', "utf8");
  await writeFile(path.join(workDir, ".yanote-ci/delivery-proof-exit-code.txt"), "1\n", "utf8");
  await writeFile(path.join(workDir, ".yanote-ci/delivery-proof-should-run.txt"), "true\n", "utf8");
  await writeFile(path.join(workDir, ".yanote-ci/delivery-proof-scope.txt"), "should_run=true\nreason=path_match\n", "utf8");
  await writeFile(path.join(workDir, ".yanote-ci/delivery-proof-changed-files.txt"), "examples/docker-compose.yml\n", "utf8");
}

test("collects exported async and v1 e2e proof bundles alongside deterministic HTTP artifact names", async () => {
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
    await seedAsyncBundle(workDir);
    await seedV1E2eBundle(workDir);

    const result = spawnSync("bash", [scriptPath, outDir], { cwd: workDir, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);

    assert.deepEqual((await readdir(outDir)).sort(), [
      "artifact-manifest.txt",
      "delivery-proof-changed-files.txt",
      "delivery-proof-exit-code.txt",
      "delivery-proof-scope.txt",
      "delivery-proof-should-run.txt",
      "live-kafka-proof",
      "v1-e2e",
      "yanote-check-command.args",
      "yanote-report.json",
      "yanote-report.source-path.txt",
      "yanote-validation.stderr.log"
    ]);

    assert.deepEqual((await readdir(path.join(outDir, "live-kafka-proof"))).sort(), [
      "artifact-manifest.txt",
      "artifact-source-paths.txt",
      "async-report.stderr",
      "merged-two-service.events.jsonl",
      "single-service-proof.log"
    ]);

    assert.deepEqual((await readdir(path.join(outDir, "v1-e2e"))).sort(), [
      "compose.log",
      "out"
    ]);

    const manifest = await readFile(path.join(outDir, "artifact-manifest.txt"), "utf8");
    assert.match(manifest, /report_found=true/);
    assert.match(manifest, /report_source=build\/yanote\/aggregate\/check\/yanote-report\.json/);
    assert.match(manifest, /async_bundle_found=true/);
    assert.match(manifest, /async_bundle_source=\.yanote-ci\/live-kafka-proof/);
    assert.match(manifest, /v1_e2e_bundle_found=true/);
    assert.match(manifest, /v1_e2e_bundle_source=\.yanote-ci\/v1-e2e/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("writes deterministic collector manifest when neither HTTP report nor proof bundles exist", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-artifacts-"));
  try {
    const outDir = path.join(workDir, ".yanote-ci/artifacts");
    const result = spawnSync("bash", [scriptPath, outDir], { cwd: workDir, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);

    assert.deepEqual((await readdir(outDir)).sort(), ["artifact-manifest.txt"]);

    const manifest = await readFile(path.join(outDir, "artifact-manifest.txt"), "utf8");
    assert.match(manifest, /report_found=false/);
    assert.match(manifest, /report_source=none/);
    assert.match(manifest, /async_bundle_found=false/);
    assert.match(manifest, /async_bundle_source=none/);
    assert.match(manifest, /v1_e2e_bundle_found=false/);
    assert.match(manifest, /v1_e2e_bundle_source=none/);
    assert.match(manifest, /created_at=/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
