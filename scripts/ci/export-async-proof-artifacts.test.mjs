import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/export-async-proof-artifacts.sh");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function seedAsyncProofSources(workDir, options = {}) {
  const {
    includeProducerEvents = true,
    includeConsumerEvents = true,
    includeMergeLog = true,
    includeMergedEvents = true,
    includeAsyncStdout = true,
    includeAsyncStderr = true,
    includeReport = true
  } = options;

  const tmpDir = path.join(workDir, "proof-temp");
  const reportDir = path.join(tmpDir, "async-report");
  await mkdir(reportDir, { recursive: true });

  const paths = {
    singleServiceLog: path.join(tmpDir, "single-service-proof.log"),
    twoServiceLog: path.join(tmpDir, "two-service-test.log"),
    producerEvents: path.join(tmpDir, "01-producer.events.jsonl"),
    consumerEvents: path.join(tmpDir, "02-consumer.events.jsonl"),
    mergeLog: path.join(tmpDir, "merge.log"),
    mergedEvents: path.join(tmpDir, "merged-two-service.events.jsonl"),
    asyncStdout: path.join(tmpDir, "async-report.stdout"),
    asyncStderr: path.join(tmpDir, "async-report.stderr"),
    asyncReport: path.join(reportDir, "yanote-async-report.json")
  };

  await writeFile(paths.singleServiceLog, "single-service ok\n", "utf8");
  await writeFile(paths.twoServiceLog, "two-service ok\n", "utf8");

  if (includeProducerEvents) {
    await writeFile(paths.producerEvents, '{"kind":"kafka","service":"producer"}\n', "utf8");
  }
  if (includeConsumerEvents) {
    await writeFile(paths.consumerEvents, '{"kind":"kafka","service":"consumer"}\n', "utf8");
  }
  if (includeMergeLog) {
    await writeFile(paths.mergeLog, "merged successfully\n", "utf8");
  }
  if (includeMergedEvents) {
    await writeFile(
      paths.mergedEvents,
      '{"kind":"kafka","service":"producer"}\n{"kind":"kafka","service":"consumer"}\n',
      "utf8"
    );
  }
  if (includeAsyncStdout) {
    await writeFile(paths.asyncStdout, "Summary\nYANOTE_ASYNC_SUMMARY status=ok\n", "utf8");
  }
  if (includeAsyncStderr) {
    await writeFile(paths.asyncStderr, "", "utf8");
  }
  if (includeReport) {
    await writeFile(paths.asyncReport, '{"status":"ok"}\n', "utf8");
  }

  return {
    tmpDir,
    env: {
      YANOTE_ASYNC_SOURCE_TEMP_DIR: tmpDir,
      YANOTE_ASYNC_SOURCE_SINGLE_SERVICE_LOG: paths.singleServiceLog,
      YANOTE_ASYNC_SOURCE_TWO_SERVICE_LOG: paths.twoServiceLog,
      YANOTE_ASYNC_SOURCE_PRODUCER_EVENTS: paths.producerEvents,
      YANOTE_ASYNC_SOURCE_CONSUMER_EVENTS: paths.consumerEvents,
      YANOTE_ASYNC_SOURCE_MERGE_LOG: paths.mergeLog,
      YANOTE_ASYNC_SOURCE_MERGED_EVENTS: paths.mergedEvents,
      YANOTE_ASYNC_SOURCE_ASYNC_STDOUT: paths.asyncStdout,
      YANOTE_ASYNC_SOURCE_ASYNC_STDERR: paths.asyncStderr,
      YANOTE_ASYNC_SOURCE_ASYNC_REPORT: paths.asyncReport
    }
  };
}

test("exports a deterministic allowlisted async bundle when the report exists", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-export-"));
  try {
    const outDir = path.join(workDir, ".yanote-ci/live-kafka-proof");
    const { tmpDir, env } = await seedAsyncProofSources(workDir, { includeReport: true });

    const result = spawnSync("bash", [scriptPath, outDir], {
      cwd: workDir,
      encoding: "utf8",
      env: {
        ...process.env,
        ...env,
        YANOTE_ASYNC_PROOF_STATUS: "success"
      }
    });

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual((await readdir(outDir)).sort(), [
      "01-producer.events.jsonl",
      "02-consumer.events.jsonl",
      "artifact-manifest.txt",
      "artifact-source-paths.txt",
      "async-report.stderr",
      "async-report.stdout",
      "merge.log",
      "merged-two-service.events.jsonl",
      "single-service-proof.log",
      "two-service-test.log",
      "yanote-async-report.json"
    ]);

    const manifest = await readFile(path.join(outDir, "artifact-manifest.txt"), "utf8");
    assert.match(manifest, /proof_status=success/);
    assert.match(manifest, /report_found=true/);
    assert.match(manifest, /artifact_count=9/);
    assert.match(manifest, /missing_artifacts=none/);
    assert.match(manifest, /source_paths_note=artifact-source-paths.txt/);
    assert.match(manifest, new RegExp(`destination=${escapeRegExp(outDir)}`));

    const sourcePaths = await readFile(path.join(outDir, "artifact-source-paths.txt"), "utf8");
    assert.match(sourcePaths, new RegExp(`temp_dir=${escapeRegExp(tmpDir)}`));
    assert.match(sourcePaths, /single-service-proof\.log=.*single-service-proof\.log/);
    assert.match(sourcePaths, /merged-two-service\.events\.jsonl=.*merged-two-service\.events\.jsonl/);
    assert.match(sourcePaths, /yanote-async-report\.json=.*yanote-async-report\.json/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("retains a deterministic failure bundle without inventing a missing async report", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-export-"));
  try {
    const outDir = path.join(workDir, ".yanote-ci/live-kafka-proof");
    const { env } = await seedAsyncProofSources(workDir, {
      includeMergeLog: false,
      includeMergedEvents: false,
      includeAsyncStdout: false,
      includeAsyncStderr: false,
      includeReport: false
    });

    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "yanote-async-report.json"), "stale", "utf8");

    const result = spawnSync("bash", [scriptPath, outDir], {
      cwd: workDir,
      encoding: "utf8",
      env: {
        ...process.env,
        ...env,
        YANOTE_ASYNC_PROOF_STATUS: "failure"
      }
    });

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual((await readdir(outDir)).sort(), [
      "01-producer.events.jsonl",
      "02-consumer.events.jsonl",
      "artifact-manifest.txt",
      "artifact-source-paths.txt",
      "single-service-proof.log",
      "two-service-test.log"
    ]);

    const manifest = await readFile(path.join(outDir, "artifact-manifest.txt"), "utf8");
    assert.match(manifest, /proof_status=failure/);
    assert.match(manifest, /report_found=false/);
    assert.match(manifest, /report_source=none/);
    assert.match(manifest, /artifact_count=4/);
    assert.match(manifest, /missing_artifacts=.*merge\.log/);
    assert.match(manifest, /missing_artifacts=.*merged-two-service\.events\.jsonl/);
    assert.match(manifest, /missing_artifacts=.*async-report\.stdout/);
    assert.match(manifest, /missing_artifacts=.*async-report\.stderr/);
    assert.match(manifest, /missing_artifacts=.*yanote-async-report\.json/);

    const sourcePaths = await readFile(path.join(outDir, "artifact-source-paths.txt"), "utf8");
    assert.match(sourcePaths, /merge\.log=none/);
    assert.match(sourcePaths, /merged-two-service\.events\.jsonl=none/);
    assert.match(sourcePaths, /async-report\.stdout=none/);
    assert.match(sourcePaths, /async-report\.stderr=none/);
    assert.match(sourcePaths, /yanote-async-report\.json=none/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
