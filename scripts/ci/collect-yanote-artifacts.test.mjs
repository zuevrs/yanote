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

  await writeFile(
    path.join(asyncBundleDir, "artifact-manifest.txt"),
    "proof_status=success\nreport_found=true\nartifact_count=15\n",
    "utf8"
  );
  await writeFile(path.join(asyncBundleDir, "artifact-source-paths.txt"), "temp_dir=/tmp/proof\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "single-service-proof.log"), "single\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "two-service-test.log"), "two-service\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "01-producer.events.jsonl"), '{"kind":"kafka","service":"producer"}\n', "utf8");
  await writeFile(path.join(asyncBundleDir, "02-consumer.events.jsonl"), '{"kind":"kafka","service":"consumer"}\n', "utf8");
  await writeFile(path.join(asyncBundleDir, "merge.log"), "merged\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "merged-two-service.events.jsonl"), '{"kind":"kafka"}\n', "utf8");
  await writeFile(path.join(asyncBundleDir, "async-report.stdout"), "Summary\nYANOTE_ASYNC_SUMMARY status=ok\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "async-report.stderr"), "", "utf8");
  await writeFile(path.join(asyncBundleDir, "yanote-async-report.json"), '{"status":"ok"}\n', "utf8");
  await writeFile(
    path.join(asyncBundleDir, "runtime-selected-async-report.stdout"),
    "Summary\nYANOTE_ASYNC_SUMMARY status=partial\n",
    "utf8"
  );
  await writeFile(path.join(asyncBundleDir, "runtime-selected-async-report.stderr"), "", "utf8");
  await writeFile(
    path.join(asyncBundleDir, "runtime-selected-yanote-async-report.json"),
    '{"status":"partial"}\n',
    "utf8"
  );
  await writeFile(
    path.join(asyncBundleDir, "schema-failure-async-report.stdout"),
    "Summary\nYANOTE_ASYNC_SUMMARY status=error\n",
    "utf8"
  );
  await writeFile(
    path.join(asyncBundleDir, "schema-failure-async-report.stderr"),
    'YANOTE_ERROR code=ASYNC_SEMANTIC_INVALID_PAYLOAD class=semantic reason="invalid-payload must be object"\n',
    "utf8"
  );
  await writeFile(
    path.join(asyncBundleDir, "schema-failure-yanote-async-report.json"),
    '{"status":"error"}\n',
    "utf8"
  );
}

async function seedV1E2eBundle(workDir) {
  const v1BundleDir = path.join(workDir, ".yanote-ci/v1-e2e");
  await mkdir(path.join(v1BundleDir, "out"), { recursive: true });

  await writeFile(path.join(v1BundleDir, "artifact-manifest.txt"), "happy_path_report_found=true\nsemantic_red_primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA\n", "utf8");
  await writeFile(path.join(v1BundleDir, "artifact-source-paths.txt"), "events.jsonl=report:/data/yanote/events.jsonl\nout/yanote-report.json=report:/data/yanote/out/yanote-report.json\n", "utf8");
  await writeFile(path.join(v1BundleDir, "compose.log"), "compose log\n", "utf8");
  await writeFile(path.join(v1BundleDir, "events.jsonl"), '{"kind":"http"}\n', "utf8");
  await writeFile(path.join(v1BundleDir, "semantic-red.stdout"), "Summary\nprimary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA\n", "utf8");
  await writeFile(path.join(v1BundleDir, "semantic-red.stderr"), "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA\n", "utf8");
  await writeFile(path.join(v1BundleDir, "semantic-red-yanote-report.json"), '{"status":"partial"}\n', "utf8");
  await writeFile(path.join(v1BundleDir, "out", "yanote-report.json"), '{"status":"ok"}\n', "utf8");
  await writeFile(path.join(workDir, ".yanote-ci/delivery-proof-exit-code.txt"), "1\n", "utf8");
  await writeFile(path.join(workDir, ".yanote-ci/delivery-proof-should-run.txt"), "true\n", "utf8");
  await writeFile(path.join(workDir, ".yanote-ci/delivery-proof-scope.txt"), "should_run=true\nreason=path_match\n", "utf8");
  await writeFile(path.join(workDir, ".yanote-ci/delivery-proof-changed-files.txt"), "examples/docker-compose.yml\n", "utf8");
}

test("collects the widened async proof bundle and replaces stale copied directories deterministically", async () => {
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

    await mkdir(path.join(outDir, "live-kafka-proof"), { recursive: true });
    await writeFile(path.join(outDir, "live-kafka-proof", "stale.txt"), "stale", "utf8");

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
      "01-producer.events.jsonl",
      "02-consumer.events.jsonl",
      "artifact-manifest.txt",
      "artifact-source-paths.txt",
      "async-report.stderr",
      "async-report.stdout",
      "merge.log",
      "merged-two-service.events.jsonl",
      "runtime-selected-async-report.stderr",
      "runtime-selected-async-report.stdout",
      "runtime-selected-yanote-async-report.json",
      "schema-failure-async-report.stderr",
      "schema-failure-async-report.stdout",
      "schema-failure-yanote-async-report.json",
      "single-service-proof.log",
      "two-service-test.log",
      "yanote-async-report.json"
    ]);

    assert.deepEqual((await readdir(path.join(outDir, "v1-e2e"))).sort(), [
      "artifact-manifest.txt",
      "artifact-source-paths.txt",
      "compose.log",
      "events.jsonl",
      "out",
      "semantic-red-yanote-report.json",
      "semantic-red.stderr",
      "semantic-red.stdout"
    ]);

    assert.deepEqual((await readdir(path.join(outDir, "v1-e2e", "out"))).sort(), ["yanote-report.json"]);

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
