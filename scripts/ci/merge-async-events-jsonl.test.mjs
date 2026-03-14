import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/merge-async-events-jsonl.mjs");

test("merge helper concatenates service files in deterministic path order and keeps each file line-stable", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-merge-events-"));

  try {
    const producerPath = path.join(workDir, "01-producer.events.jsonl");
    const consumerPath = path.join(workDir, "02-consumer.events.jsonl");
    const mergedPath = path.join(workDir, "merged", "async-events.jsonl");

    await writeFile(
      producerPath,
      [
        '{"service":"producer-service","line":"producer-1"}',
        '{"service":"producer-service","line":"producer-2"}'
      ].join("\n"),
      "utf8"
    );
    await writeFile(
      consumerPath,
      [
        '{"service":"consumer-service","line":"consumer-1"}',
        '{"service":"consumer-service","line":"consumer-2"}'
      ].join("\n"),
      "utf8"
    );

    const result = spawnSync(
      process.execPath,
      [scriptPath, "--out", mergedPath, consumerPath, producerPath],
      { cwd: path.resolve("."), encoding: "utf8" }
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /merged_files=2/);
    assert.match(result.stdout, /01-producer\.events\.jsonl.*,.*02-consumer\.events\.jsonl/);

    const merged = await readFile(mergedPath, "utf8");
    assert.equal(
      merged,
      [
        '{"service":"producer-service","line":"producer-1"}',
        '{"service":"producer-service","line":"producer-2"}',
        '{"service":"consumer-service","line":"consumer-1"}',
        '{"service":"consumer-service","line":"consumer-2"}'
      ].join("\n")
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("merge helper fails with actionable stderr when called without input files", () => {
  const result = spawnSync(process.execPath, [scriptPath, "--out", "ignored.jsonl"], {
    cwd: path.resolve("."),
    encoding: "utf8"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Provide at least one input events file path to merge/);
});
