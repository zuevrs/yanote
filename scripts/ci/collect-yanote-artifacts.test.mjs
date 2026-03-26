import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/collect-yanote-artifacts.sh");

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

async function seedKafkaBundle(workDir) {
  const bundleDir = path.join(workDir, ".yanote-ci/live-kafka-proof");
  await mkdir(bundleDir, { recursive: true });

  await writeFile(
    path.join(bundleDir, "artifact-manifest.txt"),
    [
      "proof_status=success",
      "report_found=true",
      "report_html_found=true",
      "runtime_selected_report_found=true",
      "runtime_selected_report_html_found=true",
      "schema_failure_report_found=true",
      "schema_failure_report_html_found=true",
      "report_status=ok",
      "report_channels=2/2",
      "report_operations=2/2",
      "report_messages=2/2",
      "report_supported_bindings=2/2",
      "report_declared_only_bindings=0",
      "report_deferred_bindings=0",
      "report_invalid_bindings=0",
      "report_binding_total_operations=2",
      "report_message_correlation_ids=2",
      "report_operations_with_correlation_id=2/2",
      "report_operations_with_reply=2/2",
      "report_runtime_satisfied_operations=2/2",
      "report_runtime_satisfied_semantics=4/4",
      "report_runtime_unsatisfied_operations=0",
      "report_runtime_unsatisfied_semantics=0",
      "report_runtime_semantic_coverage_percent=100",
      "artifact_count=18"
    ].join("\n") + "\n",
    "utf8"
  );
  await writeFile(
    path.join(bundleDir, "artifact-source-paths.txt"),
    [
      "temp_dir=/tmp/proof",
      "yanote-async-report.json=/tmp/proof/async-report/yanote-async-report.json",
      "yanote-async-report.html=/tmp/proof/async-report/yanote-async-report.html",
      "runtime-selected-yanote-async-report.json=/tmp/proof/runtime-selected-async-report/yanote-async-report.json",
      "runtime-selected-yanote-async-report.html=/tmp/proof/runtime-selected-async-report/yanote-async-report.html",
      "schema-failure-yanote-async-report.json=/tmp/proof/schema-failure-async-report/yanote-async-report.json",
      "schema-failure-yanote-async-report.html=/tmp/proof/schema-failure-async-report/yanote-async-report.html",
      "report_supported_bindings=2/2",
      "report_operations_with_correlation_id=2/2",
      "report_operations_with_reply=2/2",
      "report_runtime_satisfied_semantics=4/4"
    ].join("\n") + "\n",
    "utf8"
  );

  await writeFile(path.join(bundleDir, "single-service-proof.log"), "single\n", "utf8");
  await writeFile(path.join(bundleDir, "two-service-test.log"), "two-service\n", "utf8");
  await writeFile(path.join(bundleDir, "01-producer.events.jsonl"), '{"kind":"kafka","service":"producer"}\n', "utf8");
  await writeFile(path.join(bundleDir, "02-consumer.events.jsonl"), '{"kind":"kafka","service":"consumer"}\n', "utf8");
  await writeFile(path.join(bundleDir, "merge.log"), "merged\n", "utf8");
  await writeFile(path.join(bundleDir, "merged-two-service.events.jsonl"), '{"kind":"kafka"}\n', "utf8");
  await writeFile(path.join(bundleDir, "async-report.stdout"), "Summary\nYANOTE_ASYNC_SUMMARY status=ok protocols=kafka\n", "utf8");
  await writeFile(path.join(bundleDir, "async-report.stderr"), "", "utf8");
  await writeJson(path.join(bundleDir, "yanote-async-report.json"), {
    status: "ok",
    protocols: ["kafka"],
    specSource: { kind: "local-file", reference: "test/fixtures/asyncapi/v3.yaml" },
    summary: {
      totalChannels: 2,
      coveredChannels: 2,
      totalOperations: 2,
      coveredOperations: 2,
      totalMessages: 2,
      coveredMessages: 2
    },
    bindingSupport: {
      summary: {
        supportedBindings: 2,
        totalBindings: 2,
        declaredOnlyBindings: 0,
        deferredBindings: 0,
        invalidBindings: 0,
        totalOperations: 2
      }
    },
    declaredSemantics: {
      summary: {
        messageCorrelationIds: 2,
        operationsWithCorrelationId: 2,
        operationsWithReply: 2,
        totalOperations: 2
      }
    },
    runtimeSemantics: {
      summary: {
        satisfiedOperations: 2,
        totalOperations: 2,
        satisfiedSemantics: 4,
        totalSemantics: 4,
        semanticCoveragePercent: 100,
        unsatisfiedOperations: 0,
        unsatisfiedSemantics: 0
      }
    }
  });
  await writeFile(path.join(bundleDir, "yanote-async-report.html"), "<html><body>async html</body></html>\n", "utf8");
  await writeFile(path.join(bundleDir, "runtime-selected-async-report.stdout"), "Summary\nYANOTE_ASYNC_SUMMARY status=partial\n", "utf8");
  await writeFile(path.join(bundleDir, "runtime-selected-async-report.stderr"), "", "utf8");
  await writeJson(path.join(bundleDir, "runtime-selected-yanote-async-report.json"), { status: "partial" });
  await writeFile(path.join(bundleDir, "runtime-selected-yanote-async-report.html"), "<html><body>runtime selected html</body></html>\n", "utf8");
  await writeFile(path.join(bundleDir, "schema-failure-async-report.stdout"), "Summary\nYANOTE_ASYNC_SUMMARY status=error\n", "utf8");
  await writeFile(path.join(bundleDir, "schema-failure-async-report.stderr"), 'YANOTE_ERROR code=ASYNC_SEMANTIC_INVALID_PAYLOAD class=semantic reason="invalid-payload must be object"\n', "utf8");
  await writeJson(path.join(bundleDir, "schema-failure-yanote-async-report.json"), { status: "error" });
  await writeFile(path.join(bundleDir, "schema-failure-yanote-async-report.html"), "<html><body>schema failure html</body></html>\n", "utf8");
}

async function seedRabbitMqBundle(workDir) {
  const bundleDir = path.join(workDir, ".yanote-ci/live-rabbitmq-proof");
  await mkdir(bundleDir, { recursive: true });

  const optionalArtifacts = [
    "single-service-proof.log",
    "runtime-selected-async-report.stdout",
    "runtime-selected-async-report.stderr",
    "runtime-selected-yanote-async-report.json",
    "runtime-selected-yanote-async-report.html",
    "schema-failure-async-report.stdout",
    "schema-failure-async-report.stderr",
    "schema-failure-yanote-async-report.json",
    "schema-failure-yanote-async-report.html"
  ].join(",");

  await writeFile(
    path.join(bundleDir, "artifact-manifest.txt"),
    [
      "proof_status=success",
      `optional_artifacts=${optionalArtifacts}`,
      "report_found=true",
      "report_html_found=true",
      "runtime_selected_report_found=false",
      "runtime_selected_report_html_found=false",
      "schema_failure_report_found=false",
      "schema_failure_report_html_found=false",
      "report_spec_source_kind=local-file",
      "report_spec_source_ref=yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml",
      "report_status=ok",
      "report_channels=1/1",
      "report_operations=2/2",
      "report_messages=2/2",
      "report_supported_bindings=0/0",
      "report_declared_only_bindings=0",
      "report_deferred_bindings=0",
      "report_invalid_bindings=0",
      "report_binding_total_operations=0",
      "report_message_correlation_ids=2",
      "report_operations_with_correlation_id=2/2",
      "report_operations_with_reply=2/2",
      "report_runtime_satisfied_operations=0/0",
      "report_runtime_satisfied_semantics=0/0",
      "report_runtime_unsatisfied_operations=0",
      "report_runtime_unsatisfied_semantics=0",
      "report_runtime_semantic_coverage_percent=none",
      "artifact_count=11"
    ].join("\n") + "\n",
    "utf8"
  );
  await writeFile(
    path.join(bundleDir, "artifact-source-paths.txt"),
    [
      "temp_dir=/tmp/rabbit-proof",
      `optional_artifacts=${optionalArtifacts}`,
      "yanote-async-report.json=/tmp/rabbit-proof/async-report/yanote-async-report.json",
      "yanote-async-report.html=/tmp/rabbit-proof/async-report/yanote-async-report.html",
      "single-service-proof.log=none",
      "runtime-selected-async-report.stdout=none",
      "runtime-selected-async-report.stderr=none",
      "runtime-selected-yanote-async-report.json=none",
      "runtime-selected-yanote-async-report.html=none",
      "schema-failure-async-report.stdout=none",
      "schema-failure-async-report.stderr=none",
      "schema-failure-yanote-async-report.json=none",
      "schema-failure-yanote-async-report.html=none",
      "report_spec_source_kind=local-file",
      "report_spec_source_ref=yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml",
      "report_channels=1/1",
      "report_operations=2/2",
      "report_messages=2/2",
      "report_supported_bindings=0/0",
      "report_runtime_satisfied_semantics=0/0",
      "report_runtime_semantic_coverage_percent=none"
    ].join("\n") + "\n",
    "utf8"
  );

  await writeFile(path.join(bundleDir, "two-service-test.log"), "two-service\n", "utf8");
  await writeFile(path.join(bundleDir, "01-producer.events.jsonl"), '{"kind":"amqp","service":"producer"}\n', "utf8");
  await writeFile(path.join(bundleDir, "02-consumer.events.jsonl"), '{"kind":"amqp","service":"consumer"}\n', "utf8");
  await writeFile(path.join(bundleDir, "merge.log"), "merged\n", "utf8");
  await writeFile(path.join(bundleDir, "merged-two-service.events.jsonl"), '{"kind":"amqp"}\n', "utf8");
  await writeFile(path.join(bundleDir, "async-report.stdout"), "Summary\nYANOTE_ASYNC_SUMMARY status=ok protocols=amqp\n", "utf8");
  await writeFile(path.join(bundleDir, "async-report.stderr"), "", "utf8");
  await writeJson(path.join(bundleDir, "yanote-async-report.json"), {
    status: "ok",
    protocols: ["amqp"],
    specSource: { kind: "local-file", reference: "yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml" },
    summary: {
      totalChannels: 1,
      coveredChannels: 1,
      channelCoveragePercent: 100,
      totalOperations: 2,
      coveredOperations: 2,
      operationCoveragePercent: 100,
      totalMessages: 2,
      coveredMessages: 2,
      messageCoveragePercent: 100
    },
    coverage: {
      channels: { state: "COVERED", percent: 100, items: [] },
      operations: { state: "COVERED", percent: 100, items: [] },
      messages: { state: "COVERED", percent: 100, items: [] }
    },
    diagnostics: {
      counts: {
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "unverifiable-headers": 0,
        unmatched: 0,
        mismatched: 0
      },
      items: []
    },
    bindingSupport: {
      summary: {
        supportedBindings: 0,
        totalBindings: 0,
        declaredOnlyBindings: 0,
        deferredBindings: 0,
        invalidBindings: 0,
        totalOperations: 0
      }
    },
    declaredSemantics: {
      summary: {
        messageCorrelationIds: 2,
        operationsWithCorrelationId: 2,
        operationsWithReply: 2,
        totalOperations: 2
      }
    },
    runtimeSemantics: {
      summary: {
        satisfiedOperations: 0,
        totalOperations: 0,
        satisfiedSemantics: 0,
        totalSemantics: 0,
        semanticCoveragePercent: null,
        unsatisfiedOperations: 0,
        unsatisfiedSemantics: 0
      }
    }
  });
  await writeFile(path.join(bundleDir, "yanote-async-report.html"), "<html><body>rabbitmq async html</body></html>\n", "utf8");
}

test("collects Kafka and RabbitMQ async bundles into deterministic directories", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-artifacts-"));
  try {
    const sourceDir = path.join(workDir, "build/yanote/aggregate/check");
    const ciLogsDir = path.join(workDir, ".yanote-ci");
    const outDir = path.join(workDir, ".yanote-ci/artifacts");
    await mkdir(sourceDir, { recursive: true });
    await mkdir(ciLogsDir, { recursive: true });

    await writeJson(path.join(sourceDir, "yanote-report.json"), {
      status: "partial",
      specSource: { kind: "remote-url", reference: "https://example.test/openapi.yaml" },
      summary: {
        deprecatedOperations: {
          totalOperations: 1,
          coveredOperations: 0,
          uncoveredOperations: 1,
          operationCoveragePercent: 0
        }
      }
    });
    await writeFile(path.join(sourceDir, "yanote-report.html"), "<html><body>top-level html</body></html>\n", "utf8");
    await writeFile(path.join(sourceDir, "yanote-check-command.args"), "report --profile ci", "utf8");
    await writeFile(path.join(ciLogsDir, "yanote-validation.stderr.log"), "stderr output", "utf8");
    await seedKafkaBundle(workDir);
    await seedRabbitMqBundle(workDir);

    const result = spawnSync("bash", [scriptPath, outDir], { cwd: workDir, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);

    assert.deepEqual((await readdir(outDir)).sort(), [
      "artifact-manifest.txt",
      "artifact-source-paths.txt",
      "live-kafka-proof",
      "live-rabbitmq-proof",
      "yanote-check-command.args",
      "yanote-report.html",
      "yanote-report.json",
      "yanote-report.source-path.txt",
      "yanote-validation.stderr.log"
    ]);

    const manifest = await readFile(path.join(outDir, "artifact-manifest.txt"), "utf8");
    assert.match(manifest, /async_bundle_found=true/);
    assert.match(manifest, /async_bundle_source=\.yanote-ci\/live-kafka-proof/);
    assert.match(manifest, /async_bundle_report_protocols=kafka/);
    assert.match(manifest, /kafka_bundle_found=true/);
    assert.match(manifest, /kafka_bundle_report_protocols=kafka/);
    assert.match(manifest, /rabbitmq_bundle_found=true/);
    assert.match(manifest, /rabbitmq_bundle_source=\.yanote-ci\/live-rabbitmq-proof/);
    assert.match(manifest, /rabbitmq_bundle_report_protocols=amqp/);
    assert.match(manifest, /rabbitmq_bundle_runtime_selected_report_found=false/);
    assert.match(manifest, /rabbitmq_bundle_schema_failure_report_found=false/);
    assert.match(manifest, /rabbitmq_bundle_report_supported_bindings=0\/0/);
    assert.match(manifest, /report_spec_source_kind=remote-url/);
    assert.match(manifest, /report_spec_source_ref=https:\/\/example\.test\/openapi\.yaml/);

    const sourcePaths = await readFile(path.join(outDir, "artifact-source-paths.txt"), "utf8");
    assert.match(sourcePaths, /live-kafka-proof-report-protocols=kafka/);
    assert.match(sourcePaths, /live-rabbitmq-proof=\.yanote-ci\/live-rabbitmq-proof/);
    assert.match(sourcePaths, /live-rabbitmq-proof-manifest=\.yanote-ci\/live-rabbitmq-proof\/artifact-manifest\.txt/);
    assert.match(sourcePaths, /live-rabbitmq-proof-source-paths=\.yanote-ci\/live-rabbitmq-proof\/artifact-source-paths\.txt/);
    assert.match(sourcePaths, /live-rabbitmq-proof-report-protocols=amqp/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("collects the early-failure Kafka proof bundle without inventing stale companion artifacts", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-artifacts-"));
  try {
    const asyncBundleDir = path.join(workDir, ".yanote-ci/live-kafka-proof");
    const outDir = path.join(workDir, ".yanote-ci/artifacts");
    await mkdir(asyncBundleDir, { recursive: true });

    await writeFile(
      path.join(asyncBundleDir, "artifact-manifest.txt"),
      [
        "proof_status=failure",
        "report_found=false",
        "report_html_found=false",
        "runtime_selected_report_found=false",
        "runtime_selected_report_html_found=false",
        "schema_failure_report_found=false",
        "schema_failure_report_html_found=false",
        "report_status=unknown",
        "report_channels=0/0",
        "report_operations=0/0",
        "report_messages=0/0",
        "report_supported_bindings=0/0",
        "report_message_correlation_ids=0",
        "report_operations_with_correlation_id=0/0",
        "report_operations_with_reply=0/0",
        "report_runtime_satisfied_semantics=0/0",
        "report_runtime_semantic_coverage_percent=0",
        "artifact_count=4"
      ].join("\n") + "\n",
      "utf8"
    );
    await writeFile(
      path.join(asyncBundleDir, "artifact-source-paths.txt"),
      [
        "temp_dir=/tmp/proof-failure",
        "yanote-async-report.json=none",
        "yanote-async-report.html=none",
        "runtime-selected-yanote-async-report.json=none",
        "runtime-selected-yanote-async-report.html=none",
        "schema-failure-yanote-async-report.json=none",
        "schema-failure-yanote-async-report.html=none"
      ].join("\n") + "\n",
      "utf8"
    );
    await writeFile(path.join(asyncBundleDir, "single-service-proof.log"), "single\n", "utf8");
    await writeFile(path.join(asyncBundleDir, "two-service-test.log"), "two\n", "utf8");
    await writeFile(path.join(asyncBundleDir, "01-producer.events.jsonl"), '{"kind":"kafka","service":"producer"}\n', "utf8");
    await writeFile(path.join(asyncBundleDir, "02-consumer.events.jsonl"), '{"kind":"kafka","service":"consumer"}\n', "utf8");

    await mkdir(path.join(outDir, "live-kafka-proof"), { recursive: true });
    await writeFile(path.join(outDir, "live-kafka-proof", "stale.txt"), "stale", "utf8");
    await writeFile(path.join(outDir, "stale-root.txt"), "stale", "utf8");

    const result = spawnSync("bash", [scriptPath, outDir], { cwd: workDir, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);

    assert.deepEqual((await readdir(outDir)).sort(), ["artifact-manifest.txt", "artifact-source-paths.txt", "live-kafka-proof"]);
    assert.deepEqual((await readdir(path.join(outDir, "live-kafka-proof"))).sort(), [
      "01-producer.events.jsonl",
      "02-consumer.events.jsonl",
      "artifact-manifest.txt",
      "artifact-source-paths.txt",
      "single-service-proof.log",
      "two-service-test.log"
    ]);

    const manifest = await readFile(path.join(outDir, "artifact-manifest.txt"), "utf8");
    assert.match(manifest, /async_bundle_found=true/);
    assert.match(manifest, /async_bundle_proof_status=failure/);
    assert.match(manifest, /async_bundle_report_found=false/);
    assert.match(manifest, /async_bundle_report_html_found=false/);
    assert.match(manifest, /async_bundle_runtime_selected_report_found=false/);
    assert.match(manifest, /async_bundle_schema_failure_report_found=false/);
    assert.match(manifest, /async_bundle_report_supported_bindings=0\/0/);
    assert.match(manifest, /async_bundle_report_runtime_satisfied_semantics=0\/0/);
    assert.match(manifest, /async_bundle_report_runtime_semantic_coverage_percent=0/);
    assert.match(manifest, /rabbitmq_bundle_found=false/);
    assert.match(manifest, /combined_bundle_found=false/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("writes deterministic collector manifest when no report or proof bundles exist", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-artifacts-"));
  try {
    const outDir = path.join(workDir, ".yanote-ci/artifacts");
    const result = spawnSync("bash", [scriptPath, outDir], { cwd: workDir, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);

    assert.deepEqual((await readdir(outDir)).sort(), ["artifact-manifest.txt", "artifact-source-paths.txt"]);

    const manifest = await readFile(path.join(outDir, "artifact-manifest.txt"), "utf8");
    assert.match(manifest, /report_found=false/);
    assert.match(manifest, /report_json_found=false/);
    assert.match(manifest, /report_html_found=false/);
    assert.match(manifest, /report_source=none/);
    assert.match(manifest, /report_html_source=none/);
    assert.match(manifest, /report_spec_source_kind=none/);
    assert.match(manifest, /report_spec_source_ref=none/);
    assert.match(manifest, /async_bundle_found=false/);
    assert.match(manifest, /async_bundle_source=none/);
    assert.match(manifest, /async_bundle_manifest_source=none/);
    assert.match(manifest, /async_bundle_source_paths_source=none/);
    assert.match(manifest, /async_bundle_proof_status=none/);
    assert.match(manifest, /async_bundle_report_found=false/);
    assert.match(manifest, /async_bundle_report_html_found=false/);
    assert.match(manifest, /async_bundle_runtime_selected_report_found=false/);
    assert.match(manifest, /async_bundle_schema_failure_report_found=false/);
    assert.match(manifest, /rabbitmq_bundle_found=false/);
    assert.match(manifest, /rabbitmq_bundle_source=none/);
    assert.match(manifest, /combined_bundle_found=false/);
    assert.match(manifest, /combined_bundle_source=none/);
    assert.match(manifest, /v1_e2e_bundle_found=false/);
    assert.match(manifest, /v1_e2e_bundle_source=none/);
    assert.match(manifest, /source_paths_note=artifact-source-paths\.txt/);
    assert.match(manifest, /created_at=/);

    const sourcePaths = await readFile(path.join(outDir, "artifact-source-paths.txt"), "utf8");
    assert.match(sourcePaths, /yanote-report\.json=none/);
    assert.match(sourcePaths, /yanote-report\.html=none/);
    assert.match(sourcePaths, /report_spec_source_kind=none/);
    assert.match(sourcePaths, /report_spec_source_ref=none/);
    assert.match(sourcePaths, /live-kafka-proof=none/);
    assert.match(sourcePaths, /live-kafka-proof-manifest=none/);
    assert.match(sourcePaths, /live-kafka-proof-source-paths=none/);
    assert.match(sourcePaths, /live-rabbitmq-proof=none/);
    assert.match(sourcePaths, /live-rabbitmq-proof-manifest=none/);
    assert.match(sourcePaths, /live-rabbitmq-proof-source-paths=none/);
    assert.match(sourcePaths, /combined-proof=none/);
    assert.match(sourcePaths, /combined-proof-manifest=none/);
    assert.match(sourcePaths, /combined-proof-source-paths=none/);
    assert.match(sourcePaths, /v1-e2e=none/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
