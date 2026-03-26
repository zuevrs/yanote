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

function createDefaultReportDocument() {
  return {
    status: "ok",
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
  };
}

async function seedAsyncProofSources(workDir, options = {}) {
  const {
    includeSingleServiceLog = true,
    includeProducerEvents = true,
    includeConsumerEvents = true,
    includeMergeLog = true,
    includeMergedEvents = true,
    includeAsyncStdout = true,
    includeAsyncStderr = true,
    includeReport = true,
    includeReportHtml = true,
    includeRuntimeSelectedAsyncStdout = true,
    includeRuntimeSelectedAsyncStderr = true,
    includeRuntimeSelectedReport = true,
    includeRuntimeSelectedReportHtml = true,
    includeSchemaFailureAsyncStdout = true,
    includeSchemaFailureAsyncStderr = true,
    includeSchemaFailureReport = true,
    includeSchemaFailureReportHtml = true,
    reportDocument = createDefaultReportDocument(),
    producerEventLine = '{"kind":"kafka","service":"producer"}\n',
    consumerEventLine = '{"kind":"kafka","service":"consumer"}\n',
    mergedEventLines = '{"kind":"kafka","service":"producer"}\n{"kind":"kafka","service":"consumer"}\n',
    asyncStdoutContent = "Summary\nYANOTE_ASYNC_SUMMARY status=ok\n",
    asyncStderrContent = "",
    runtimeSelectedAsyncStdoutContent = "Summary\nYANOTE_ASYNC_SUMMARY status=partial\n",
    runtimeSelectedAsyncStderrContent = "",
    runtimeSelectedReportContent = '{"status":"partial"}\n',
    runtimeSelectedReportHtmlContent = "<html><body>runtime selected html</body></html>\n",
    schemaFailureAsyncStdoutContent = "Summary\nYANOTE_ASYNC_SUMMARY status=error\n",
    schemaFailureAsyncStderrContent = 'YANOTE_ERROR code=ASYNC_SEMANTIC_INVALID_PAYLOAD class=semantic reason="invalid-payload must be object"\n',
    schemaFailureReportContent = '{"status":"error"}\n',
    schemaFailureReportHtmlContent = "<html><body>schema failure html</body></html>\n"
  } = options;

  const tmpDir = path.join(workDir, "proof-temp");
  const reportDir = path.join(tmpDir, "async-report");
  const runtimeSelectedReportDir = path.join(tmpDir, "runtime-selected-async-report");
  const schemaFailureReportDir = path.join(tmpDir, "schema-failure-async-report");
  await mkdir(reportDir, { recursive: true });
  await mkdir(runtimeSelectedReportDir, { recursive: true });
  await mkdir(schemaFailureReportDir, { recursive: true });

  const paths = {
    singleServiceLog: path.join(tmpDir, "single-service-proof.log"),
    twoServiceLog: path.join(tmpDir, "two-service-test.log"),
    producerEvents: path.join(tmpDir, "01-producer.events.jsonl"),
    consumerEvents: path.join(tmpDir, "02-consumer.events.jsonl"),
    mergeLog: path.join(tmpDir, "merge.log"),
    mergedEvents: path.join(tmpDir, "merged-two-service.events.jsonl"),
    asyncStdout: path.join(tmpDir, "async-report.stdout"),
    asyncStderr: path.join(tmpDir, "async-report.stderr"),
    asyncReport: path.join(reportDir, "yanote-async-report.json"),
    asyncReportHtml: path.join(reportDir, "yanote-async-report.html"),
    runtimeSelectedAsyncStdout: path.join(tmpDir, "runtime-selected-async-report.stdout"),
    runtimeSelectedAsyncStderr: path.join(tmpDir, "runtime-selected-async-report.stderr"),
    runtimeSelectedAsyncReport: path.join(runtimeSelectedReportDir, "yanote-async-report.json"),
    runtimeSelectedAsyncReportHtml: path.join(runtimeSelectedReportDir, "yanote-async-report.html"),
    schemaFailureAsyncStdout: path.join(tmpDir, "schema-failure-async-report.stdout"),
    schemaFailureAsyncStderr: path.join(tmpDir, "schema-failure-async-report.stderr"),
    schemaFailureAsyncReport: path.join(schemaFailureReportDir, "yanote-async-report.json"),
    schemaFailureAsyncReportHtml: path.join(schemaFailureReportDir, "yanote-async-report.html")
  };

  if (includeSingleServiceLog) {
    await writeFile(paths.singleServiceLog, "single-service ok\n", "utf8");
  }
  await writeFile(paths.twoServiceLog, "two-service ok\n", "utf8");

  if (includeProducerEvents) {
    await writeFile(paths.producerEvents, producerEventLine, "utf8");
  }
  if (includeConsumerEvents) {
    await writeFile(paths.consumerEvents, consumerEventLine, "utf8");
  }
  if (includeMergeLog) {
    await writeFile(paths.mergeLog, "merged successfully\n", "utf8");
  }
  if (includeMergedEvents) {
    await writeFile(paths.mergedEvents, mergedEventLines, "utf8");
  }
  if (includeAsyncStdout) {
    await writeFile(paths.asyncStdout, asyncStdoutContent, "utf8");
  }
  if (includeAsyncStderr) {
    await writeFile(paths.asyncStderr, asyncStderrContent, "utf8");
  }
  if (includeReport) {
    await writeFile(paths.asyncReport, JSON.stringify(reportDocument) + "\n", "utf8");
  }
  if (includeReportHtml) {
    await writeFile(paths.asyncReportHtml, "<html><body>async report html</body></html>\n", "utf8");
  }
  if (includeRuntimeSelectedAsyncStdout) {
    await writeFile(paths.runtimeSelectedAsyncStdout, runtimeSelectedAsyncStdoutContent, "utf8");
  }
  if (includeRuntimeSelectedAsyncStderr) {
    await writeFile(paths.runtimeSelectedAsyncStderr, runtimeSelectedAsyncStderrContent, "utf8");
  }
  if (includeRuntimeSelectedReport) {
    await writeFile(paths.runtimeSelectedAsyncReport, runtimeSelectedReportContent, "utf8");
  }
  if (includeRuntimeSelectedReportHtml) {
    await writeFile(paths.runtimeSelectedAsyncReportHtml, runtimeSelectedReportHtmlContent, "utf8");
  }
  if (includeSchemaFailureAsyncStdout) {
    await writeFile(paths.schemaFailureAsyncStdout, schemaFailureAsyncStdoutContent, "utf8");
  }
  if (includeSchemaFailureAsyncStderr) {
    await writeFile(paths.schemaFailureAsyncStderr, schemaFailureAsyncStderrContent, "utf8");
  }
  if (includeSchemaFailureReport) {
    await writeFile(paths.schemaFailureAsyncReport, schemaFailureReportContent, "utf8");
  }
  if (includeSchemaFailureReportHtml) {
    await writeFile(paths.schemaFailureAsyncReportHtml, schemaFailureReportHtmlContent, "utf8");
  }

  return {
    tmpDir,
    paths,
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
      YANOTE_ASYNC_SOURCE_ASYNC_REPORT: paths.asyncReport,
      YANOTE_ASYNC_SOURCE_ASYNC_REPORT_HTML: paths.asyncReportHtml,
      YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_STDOUT: paths.runtimeSelectedAsyncStdout,
      YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_STDERR: paths.runtimeSelectedAsyncStderr,
      YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_REPORT: paths.runtimeSelectedAsyncReport,
      YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_REPORT_HTML: paths.runtimeSelectedAsyncReportHtml,
      YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_STDOUT: paths.schemaFailureAsyncStdout,
      YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_STDERR: paths.schemaFailureAsyncStderr,
      YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_REPORT: paths.schemaFailureAsyncReport,
      YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_REPORT_HTML: paths.schemaFailureAsyncReportHtml
    }
  };
}

test("exports a deterministic widened async bundle when happy-path, runtime-selected, and schema-failure HTML siblings exist", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-export-"));
  try {
    const outDir = path.join(workDir, ".yanote-ci/live-kafka-proof");
    const { tmpDir, env } = await seedAsyncProofSources(workDir);

    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "stale.txt"), "stale", "utf8");
    await writeFile(path.join(outDir, "schema-failure-yanote-async-report.json"), "stale", "utf8");

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
      "runtime-selected-async-report.stderr",
      "runtime-selected-async-report.stdout",
      "runtime-selected-yanote-async-report.html",
      "runtime-selected-yanote-async-report.json",
      "schema-failure-async-report.stderr",
      "schema-failure-async-report.stdout",
      "schema-failure-yanote-async-report.html",
      "schema-failure-yanote-async-report.json",
      "single-service-proof.log",
      "two-service-test.log",
      "yanote-async-report.html",
      "yanote-async-report.json"
    ]);

    const manifest = await readFile(path.join(outDir, "artifact-manifest.txt"), "utf8");
    assert.match(manifest, /proof_status=success/);
    assert.match(manifest, /optional_artifacts=none/);
    assert.match(manifest, /report_found=true/);
    assert.match(manifest, /report_html_found=true/);
    assert.match(manifest, /runtime_selected_report_found=true/);
    assert.match(manifest, /runtime_selected_report_source=.*runtime-selected-async-report\/yanote-async-report\.json/);
    assert.match(manifest, /runtime_selected_report_html_found=true/);
    assert.match(manifest, /schema_failure_report_found=true/);
    assert.match(manifest, /schema_failure_report_source=.*schema-failure-async-report\/yanote-async-report\.json/);
    assert.match(manifest, /schema_failure_report_html_found=true/);
    assert.match(manifest, /report_spec_source_kind=local-file/);
    assert.match(manifest, /report_spec_source_ref=test\/fixtures\/asyncapi\/v3\.yaml/);
    assert.match(manifest, /report_status=ok/);
    assert.match(manifest, /report_channels=2\/2/);
    assert.match(manifest, /report_operations=2\/2/);
    assert.match(manifest, /report_messages=2\/2/);
    assert.match(manifest, /report_supported_bindings=2\/2/);
    assert.match(manifest, /report_declared_only_bindings=0/);
    assert.match(manifest, /report_deferred_bindings=0/);
    assert.match(manifest, /report_invalid_bindings=0/);
    assert.match(manifest, /report_binding_total_operations=2/);
    assert.match(manifest, /report_message_correlation_ids=2/);
    assert.match(manifest, /report_operations_with_correlation_id=2\/2/);
    assert.match(manifest, /report_operations_with_reply=2\/2/);
    assert.match(manifest, /report_runtime_satisfied_operations=2\/2/);
    assert.match(manifest, /report_runtime_satisfied_semantics=4\/4/);
    assert.match(manifest, /report_runtime_unsatisfied_operations=0/);
    assert.match(manifest, /report_runtime_unsatisfied_semantics=0/);
    assert.match(manifest, /report_runtime_semantic_coverage_percent=100/);
    assert.match(manifest, /artifact_count=18/);
    assert.match(manifest, /missing_artifacts=none/);
    assert.match(manifest, /artifacts=.*yanote-async-report\.html/);
    assert.match(manifest, /artifacts=.*runtime-selected-yanote-async-report\.html/);
    assert.match(manifest, /artifacts=.*schema-failure-yanote-async-report\.html/);
    assert.match(manifest, /source_paths_note=artifact-source-paths.txt/);
    assert.match(manifest, new RegExp(`destination=${escapeRegExp(outDir)}`));

    const sourcePaths = await readFile(path.join(outDir, "artifact-source-paths.txt"), "utf8");
    assert.match(sourcePaths, new RegExp(`temp_dir=${escapeRegExp(tmpDir)}`));
    assert.match(sourcePaths, /optional_artifacts=none/);
    assert.match(sourcePaths, /single-service-proof\.log=.*single-service-proof\.log/);
    assert.match(sourcePaths, /merged-two-service\.events\.jsonl=.*merged-two-service\.events\.jsonl/);
    assert.match(sourcePaths, /yanote-async-report\.json=.*async-report\/yanote-async-report\.json/);
    assert.match(sourcePaths, /yanote-async-report\.html=.*async-report\/yanote-async-report\.html/);
    assert.match(
      sourcePaths,
      /runtime-selected-yanote-async-report\.json=.*runtime-selected-async-report\/yanote-async-report\.json/
    );
    assert.match(
      sourcePaths,
      /runtime-selected-yanote-async-report\.html=.*runtime-selected-async-report\/yanote-async-report\.html/
    );
    assert.match(
      sourcePaths,
      /schema-failure-yanote-async-report\.json=.*schema-failure-async-report\/yanote-async-report\.json/
    );
    assert.match(
      sourcePaths,
      /schema-failure-yanote-async-report\.html=.*schema-failure-async-report\/yanote-async-report\.html/
    );
    assert.match(sourcePaths, /report_spec_source_kind=local-file/);
    assert.match(sourcePaths, /report_spec_source_ref=test\/fixtures\/asyncapi\/v3\.yaml/);
    assert.match(sourcePaths, /report_status=ok/);
    assert.match(sourcePaths, /report_channels=2\/2/);
    assert.match(sourcePaths, /report_operations=2\/2/);
    assert.match(sourcePaths, /report_messages=2\/2/);
    assert.match(sourcePaths, /report_supported_bindings=2\/2/);
    assert.match(sourcePaths, /report_declared_only_bindings=0/);
    assert.match(sourcePaths, /report_deferred_bindings=0/);
    assert.match(sourcePaths, /report_invalid_bindings=0/);
    assert.match(sourcePaths, /report_binding_total_operations=2/);
    assert.match(sourcePaths, /report_message_correlation_ids=2/);
    assert.match(sourcePaths, /report_operations_with_correlation_id=2\/2/);
    assert.match(sourcePaths, /report_operations_with_reply=2\/2/);
    assert.match(sourcePaths, /report_runtime_satisfied_operations=2\/2/);
    assert.match(sourcePaths, /report_runtime_satisfied_semantics=4\/4/);
    assert.match(sourcePaths, /report_runtime_unsatisfied_operations=0/);
    assert.match(sourcePaths, /report_runtime_unsatisfied_semantics=0/);
    assert.match(sourcePaths, /report_runtime_semantic_coverage_percent=100/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("allows AMQP success bundles to omit Kafka-only companions and single-service artifacts while recording explicit none markers", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-export-"));
  try {
    const outDir = path.join(workDir, ".yanote-ci/live-rabbitmq-proof");
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
    const { tmpDir, env } = await seedAsyncProofSources(workDir, {
      includeSingleServiceLog: false,
      includeRuntimeSelectedAsyncStdout: false,
      includeRuntimeSelectedAsyncStderr: false,
      includeRuntimeSelectedReport: false,
      includeRuntimeSelectedReportHtml: false,
      includeSchemaFailureAsyncStdout: false,
      includeSchemaFailureAsyncStderr: false,
      includeSchemaFailureReport: false,
      includeSchemaFailureReportHtml: false,
      producerEventLine: '{"kind":"amqp","service":"producer"}\n',
      consumerEventLine: '{"kind":"amqp","service":"consumer"}\n',
      mergedEventLines: '{"kind":"amqp","service":"producer"}\n{"kind":"amqp","service":"consumer"}\n',
      asyncStdoutContent: "Summary\nYANOTE_ASYNC_SUMMARY status=ok protocols=amqp\n",
      reportDocument: {
        status: "ok",
        specSource: {
          kind: "local-file",
          reference: "yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml"
        },
        summary: {
          totalChannels: 1,
          coveredChannels: 1,
          totalOperations: 2,
          coveredOperations: 2,
          totalMessages: 2,
          coveredMessages: 2
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
      }
    });

    const result = spawnSync("bash", [scriptPath, outDir], {
      cwd: workDir,
      encoding: "utf8",
      env: {
        ...process.env,
        ...env,
        YANOTE_ASYNC_PROOF_STATUS: "success",
        YANOTE_ASYNC_OPTIONAL_ARTIFACTS: optionalArtifacts
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
      "two-service-test.log",
      "yanote-async-report.html",
      "yanote-async-report.json"
    ]);

    const manifest = await readFile(path.join(outDir, "artifact-manifest.txt"), "utf8");
    assert.match(manifest, /proof_status=success/);
    assert.match(manifest, /optional_artifacts=single-service-proof\.log,runtime-selected-async-report\.stdout,runtime-selected-async-report\.stderr,runtime-selected-yanote-async-report\.json,runtime-selected-yanote-async-report\.html,schema-failure-async-report\.stdout,schema-failure-async-report\.stderr,schema-failure-yanote-async-report\.json,schema-failure-yanote-async-report\.html/);
    assert.match(manifest, /report_found=true/);
    assert.match(manifest, /report_html_found=true/);
    assert.match(manifest, /runtime_selected_report_found=false/);
    assert.match(manifest, /runtime_selected_report_source=none/);
    assert.match(manifest, /schema_failure_report_found=false/);
    assert.match(manifest, /schema_failure_report_source=none/);
    assert.match(manifest, /report_spec_source_ref=yanote-js\/test\/fixtures\/asyncapi\/spring-rabbitmq-two-service\.yaml/);
    assert.match(manifest, /report_channels=1\/1/);
    assert.match(manifest, /report_operations=2\/2/);
    assert.match(manifest, /report_messages=2\/2/);
    assert.match(manifest, /report_supported_bindings=0\/0/);
    assert.match(manifest, /report_binding_total_operations=0/);
    assert.match(manifest, /report_message_correlation_ids=2/);
    assert.match(manifest, /report_operations_with_correlation_id=2\/2/);
    assert.match(manifest, /report_operations_with_reply=2\/2/);
    assert.match(manifest, /report_runtime_satisfied_operations=0\/0/);
    assert.match(manifest, /report_runtime_satisfied_semantics=0\/0/);
    assert.match(manifest, /report_runtime_semantic_coverage_percent=none/);
    assert.match(manifest, /artifact_count=9/);
    assert.match(manifest, /artifacts=.*two-service-test\.log/);
    assert.match(manifest, /artifacts=.*yanote-async-report\.html/);
    assert.match(manifest, /missing_artifacts=.*single-service-proof\.log/);
    assert.match(manifest, /missing_artifacts=.*runtime-selected-yanote-async-report\.json/);
    assert.match(manifest, /missing_artifacts=.*schema-failure-yanote-async-report\.html/);
    assert.match(manifest, new RegExp(`destination=${escapeRegExp(outDir)}`));

    const sourcePaths = await readFile(path.join(outDir, "artifact-source-paths.txt"), "utf8");
    assert.match(sourcePaths, new RegExp(`temp_dir=${escapeRegExp(tmpDir)}`));
    assert.match(sourcePaths, /optional_artifacts=single-service-proof\.log,runtime-selected-async-report\.stdout,runtime-selected-async-report\.stderr,runtime-selected-yanote-async-report\.json,runtime-selected-yanote-async-report\.html,schema-failure-async-report\.stdout,schema-failure-async-report\.stderr,schema-failure-yanote-async-report\.json,schema-failure-yanote-async-report\.html/);
    assert.match(sourcePaths, /single-service-proof\.log=none/);
    assert.match(sourcePaths, /runtime-selected-async-report\.stdout=none/);
    assert.match(sourcePaths, /runtime-selected-async-report\.stderr=none/);
    assert.match(sourcePaths, /runtime-selected-yanote-async-report\.json=none/);
    assert.match(sourcePaths, /runtime-selected-yanote-async-report\.html=none/);
    assert.match(sourcePaths, /schema-failure-async-report\.stdout=none/);
    assert.match(sourcePaths, /schema-failure-async-report\.stderr=none/);
    assert.match(sourcePaths, /schema-failure-yanote-async-report\.json=none/);
    assert.match(sourcePaths, /schema-failure-yanote-async-report\.html=none/);
    assert.match(sourcePaths, /report_spec_source_ref=yanote-js\/test\/fixtures\/asyncapi\/spring-rabbitmq-two-service\.yaml/);
    assert.match(sourcePaths, /report_status=ok/);
    assert.match(sourcePaths, /report_channels=1\/1/);
    assert.match(sourcePaths, /report_operations=2\/2/);
    assert.match(sourcePaths, /report_messages=2\/2/);
    assert.match(sourcePaths, /report_supported_bindings=0\/0/);
    assert.match(sourcePaths, /report_binding_total_operations=0/);
    assert.match(sourcePaths, /report_message_correlation_ids=2/);
    assert.match(sourcePaths, /report_operations_with_correlation_id=2\/2/);
    assert.match(sourcePaths, /report_operations_with_reply=2\/2/);
    assert.match(sourcePaths, /report_runtime_satisfied_operations=0\/0/);
    assert.match(sourcePaths, /report_runtime_satisfied_semantics=0\/0/);
    assert.match(sourcePaths, /report_runtime_semantic_coverage_percent=none/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("fails closed on success exports when the happy-path HTML sibling is missing", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-export-"));
  try {
    const outDir = path.join(workDir, ".yanote-ci/live-kafka-proof");
    const { env } = await seedAsyncProofSources(workDir, { includeReportHtml: false });

    const result = spawnSync("bash", [scriptPath, outDir], {
      cwd: workDir,
      encoding: "utf8",
      env: {
        ...process.env,
        ...env,
        YANOTE_ASYNC_PROOF_STATUS: "success"
      }
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing allowlisted async proof artifact for success export: yanote-async-report\.html/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("retains a deterministic failure bundle without inventing HTML artifacts when the proof aborts early", async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "yanote-async-export-"));
  try {
    const outDir = path.join(workDir, ".yanote-ci/live-kafka-proof");
    const { env } = await seedAsyncProofSources(workDir, {
      includeMergeLog: false,
      includeMergedEvents: false,
      includeAsyncStdout: false,
      includeAsyncStderr: false,
      includeReport: false,
      includeReportHtml: false,
      includeRuntimeSelectedAsyncStdout: false,
      includeRuntimeSelectedAsyncStderr: false,
      includeRuntimeSelectedReport: false,
      includeRuntimeSelectedReportHtml: false,
      includeSchemaFailureAsyncStdout: false,
      includeSchemaFailureAsyncStderr: false,
      includeSchemaFailureReport: false,
      includeSchemaFailureReportHtml: false
    });

    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "yanote-async-report.json"), "stale", "utf8");
    await writeFile(path.join(outDir, "yanote-async-report.html"), "stale", "utf8");
    await writeFile(path.join(outDir, "schema-failure-yanote-async-report.json"), "stale", "utf8");
    await writeFile(path.join(outDir, "schema-failure-yanote-async-report.html"), "stale", "utf8");

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
    assert.match(manifest, /optional_artifacts=none/);
    assert.match(manifest, /report_found=false/);
    assert.match(manifest, /report_source=none/);
    assert.match(manifest, /report_html_found=false/);
    assert.match(manifest, /report_html_source=none/);
    assert.match(manifest, /runtime_selected_report_found=false/);
    assert.match(manifest, /runtime_selected_report_html_found=false/);
    assert.match(manifest, /schema_failure_report_found=false/);
    assert.match(manifest, /schema_failure_report_html_found=false/);
    assert.match(manifest, /report_spec_source_kind=none/);
    assert.match(manifest, /report_spec_source_ref=none/);
    assert.match(manifest, /report_supported_bindings=0\/0/);
    assert.match(manifest, /report_message_correlation_ids=0/);
    assert.match(manifest, /report_operations_with_correlation_id=0\/0/);
    assert.match(manifest, /report_operations_with_reply=0\/0/);
    assert.match(manifest, /report_runtime_satisfied_semantics=0\/0/);
    assert.match(manifest, /report_runtime_semantic_coverage_percent=0/);
    assert.match(manifest, /artifact_count=4/);
    assert.match(manifest, /missing_artifacts=.*merge\.log/);
    assert.match(manifest, /missing_artifacts=.*merged-two-service\.events\.jsonl/);
    assert.match(manifest, /missing_artifacts=.*async-report\.stdout/);
    assert.match(manifest, /missing_artifacts=.*async-report\.stderr/);
    assert.match(manifest, /missing_artifacts=.*yanote-async-report\.json/);
    assert.match(manifest, /missing_artifacts=.*yanote-async-report\.html/);
    assert.match(manifest, /missing_artifacts=.*runtime-selected-async-report\.stdout/);
    assert.match(manifest, /missing_artifacts=.*runtime-selected-async-report\.stderr/);
    assert.match(manifest, /missing_artifacts=.*runtime-selected-yanote-async-report\.json/);
    assert.match(manifest, /missing_artifacts=.*runtime-selected-yanote-async-report\.html/);
    assert.match(manifest, /missing_artifacts=.*schema-failure-async-report\.stdout/);
    assert.match(manifest, /missing_artifacts=.*schema-failure-async-report\.stderr/);
    assert.match(manifest, /missing_artifacts=.*schema-failure-yanote-async-report\.json/);
    assert.match(manifest, /missing_artifacts=.*schema-failure-yanote-async-report\.html/);

    const sourcePaths = await readFile(path.join(outDir, "artifact-source-paths.txt"), "utf8");
    assert.match(sourcePaths, /optional_artifacts=none/);
    assert.match(sourcePaths, /merge\.log=none/);
    assert.match(sourcePaths, /merged-two-service\.events\.jsonl=none/);
    assert.match(sourcePaths, /async-report\.stdout=none/);
    assert.match(sourcePaths, /async-report\.stderr=none/);
    assert.match(sourcePaths, /yanote-async-report\.json=none/);
    assert.match(sourcePaths, /yanote-async-report\.html=none/);
    assert.match(sourcePaths, /runtime-selected-async-report\.stdout=none/);
    assert.match(sourcePaths, /runtime-selected-async-report\.stderr=none/);
    assert.match(sourcePaths, /runtime-selected-yanote-async-report\.json=none/);
    assert.match(sourcePaths, /runtime-selected-yanote-async-report\.html=none/);
    assert.match(sourcePaths, /schema-failure-async-report\.stdout=none/);
    assert.match(sourcePaths, /schema-failure-async-report\.stderr=none/);
    assert.match(sourcePaths, /schema-failure-yanote-async-report\.json=none/);
    assert.match(sourcePaths, /schema-failure-yanote-async-report\.html=none/);
    assert.match(sourcePaths, /report_spec_source_kind=none/);
    assert.match(sourcePaths, /report_spec_source_ref=none/);
    assert.match(sourcePaths, /report_status=unknown/);
    assert.match(sourcePaths, /report_channels=0\/0/);
    assert.match(sourcePaths, /report_operations=0\/0/);
    assert.match(sourcePaths, /report_messages=0\/0/);
    assert.match(sourcePaths, /report_supported_bindings=0\/0/);
    assert.match(sourcePaths, /report_declared_only_bindings=0/);
    assert.match(sourcePaths, /report_deferred_bindings=0/);
    assert.match(sourcePaths, /report_invalid_bindings=0/);
    assert.match(sourcePaths, /report_binding_total_operations=0/);
    assert.match(sourcePaths, /report_message_correlation_ids=0/);
    assert.match(sourcePaths, /report_operations_with_correlation_id=0\/0/);
    assert.match(sourcePaths, /report_operations_with_reply=0\/0/);
    assert.match(sourcePaths, /report_runtime_satisfied_operations=0\/0/);
    assert.match(sourcePaths, /report_runtime_satisfied_semantics=0\/0/);
    assert.match(sourcePaths, /report_runtime_unsatisfied_operations=0/);
    assert.match(sourcePaths, /report_runtime_unsatisfied_semantics=0/);
    assert.match(sourcePaths, /report_runtime_semantic_coverage_percent=0/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
