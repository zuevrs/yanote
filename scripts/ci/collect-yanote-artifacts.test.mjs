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
    [
      "proof_status=success",
      "report_found=true",
      "report_html_found=true",
      "runtime_selected_report_html_found=true",
      "schema_failure_report_html_found=true",
      "artifact_count=18"
    ].join("\n") + "\n",
    "utf8"
  );
  await writeFile(
    path.join(asyncBundleDir, "artifact-source-paths.txt"),
    [
      "temp_dir=/tmp/proof",
      "yanote-async-report.html=/tmp/proof/async-report/yanote-async-report.html",
      "runtime-selected-yanote-async-report.html=/tmp/proof/runtime-selected-async-report/yanote-async-report.html",
      "schema-failure-yanote-async-report.html=/tmp/proof/schema-failure-async-report/yanote-async-report.html"
    ].join("\n") + "\n",
    "utf8"
  );
  await writeFile(path.join(asyncBundleDir, "single-service-proof.log"), "single\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "two-service-test.log"), "two-service\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "01-producer.events.jsonl"), '{"kind":"kafka","service":"producer"}\n', "utf8");
  await writeFile(path.join(asyncBundleDir, "02-consumer.events.jsonl"), '{"kind":"kafka","service":"consumer"}\n', "utf8");
  await writeFile(path.join(asyncBundleDir, "merge.log"), "merged\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "merged-two-service.events.jsonl"), '{"kind":"kafka"}\n', "utf8");
  await writeFile(path.join(asyncBundleDir, "async-report.stdout"), "Summary\nYANOTE_ASYNC_SUMMARY status=ok\n", "utf8");
  await writeFile(path.join(asyncBundleDir, "async-report.stderr"), "", "utf8");
  await writeFile(
    path.join(asyncBundleDir, "yanote-async-report.json"),
    '{"status":"ok","specSource":{"kind":"local-file","reference":"test/fixtures/asyncapi/v3.yaml"}}\n',
    "utf8"
  );
  await writeFile(path.join(asyncBundleDir, "yanote-async-report.html"), "<html><body>async html</body></html>\n", "utf8");
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
    path.join(asyncBundleDir, "runtime-selected-yanote-async-report.html"),
    "<html><body>runtime selected html</body></html>\n",
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
  await writeFile(
    path.join(asyncBundleDir, "schema-failure-yanote-async-report.html"),
    "<html><body>schema failure html</body></html>\n",
    "utf8"
  );
}

async function seedV1E2eBundle(workDir) {
  const v1BundleDir = path.join(workDir, ".yanote-ci/v1-e2e");
  await mkdir(path.join(v1BundleDir, "out"), { recursive: true });

  await writeFile(
    path.join(v1BundleDir, "artifact-manifest.txt"),
    [
      "happy_path_report_found=true",
      "happy_path_report_html_found=true",
      "happy_path_spec_source_kind=local-file",
      "happy_path_spec_source_ref=examples/openapi/demo-openapi.yaml",
      "happy_path_deprecated_total=1",
      "happy_path_deprecated_covered=0",
      "happy_path_deprecated_uncovered=1",
      "request_semantics_primary=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER",
      "security_semantics_primary=SEMANTIC_HTTP_MISSING_SECURITY",
      "semantic_red_primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA"
    ].join("\n") + "\n",
    "utf8"
  );
  await writeFile(
    path.join(v1BundleDir, "artifact-source-paths.txt"),
    [
      "events.jsonl=report:/data/yanote/events.jsonl",
      "out/yanote-report.json=report:/data/yanote/out/yanote-report.json",
      "out/yanote-report.html=report:/data/yanote/out/yanote-report.html",
      "happy_path_spec_source_kind=local-file",
      "happy_path_spec_source_ref=examples/openapi/demo-openapi.yaml",
      "happy_path_deprecated_total=1",
      "happy_path_deprecated_covered=0",
      "happy_path_deprecated_uncovered=1",
      "request-semantics.events.jsonl=filtered:.yanote-ci/v1-e2e/events.jsonl route=/request-evidence/users/{userId}",
      "request-semantics.stdout=host:node yanote-js/dist/yanote.cjs report --spec examples/openapi/request-evidence-openapi.yaml --events .yanote-ci/v1-e2e/request-semantics.events.jsonl --out <temp> --min-coverage 100",
      "security_semantics_spec=yanote-js/test/fixtures/openapi/http-security-api-key.yaml",
      "security_semantics_events=yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl",
      "security-semantics.stdout=host:node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-security-api-key.yaml --events yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl --out <temp> --profile local --verbose"
    ].join("\n") + "\n",
    "utf8"
  );
  await writeFile(path.join(v1BundleDir, "compose.log"), "compose log\n", "utf8");
  await writeFile(path.join(v1BundleDir, "events.jsonl"), '{"kind":"http"}\n', "utf8");
  await writeFile(path.join(v1BundleDir, "request-semantics.events.jsonl"), '{"kind":"http","route":"/request-evidence/users/{userId}"}\n', "utf8");
  await writeFile(path.join(v1BundleDir, "request-semantics.stdout"), "Summary\nprimary=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER\n", "utf8");
  await writeFile(
    path.join(v1BundleDir, "request-semantics.stderr"),
    "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER\n",
    "utf8"
  );
  await writeFile(path.join(v1BundleDir, "request-semantics-yanote-report.json"), '{"status":"ok"}\n', "utf8");
  await writeFile(path.join(v1BundleDir, "security-semantics.stdout"), "Summary\nprimary=SEMANTIC_HTTP_MISSING_SECURITY\n", "utf8");
  await writeFile(
    path.join(v1BundleDir, "security-semantics.stderr"),
    [
      "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_MISSING_SECURITY",
      "YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
      "YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
      ""
    ].join("\n"),
    "utf8"
  );
  await writeFile(path.join(v1BundleDir, "security-semantics-yanote-report.json"), '{"status":"partial"}\n', "utf8");
  await writeFile(path.join(v1BundleDir, "semantic-red.stdout"), "Summary\nprimary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA\n", "utf8");
  await writeFile(path.join(v1BundleDir, "semantic-red.stderr"), "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA\n", "utf8");
  await writeFile(path.join(v1BundleDir, "semantic-red-yanote-report.json"), '{"status":"partial"}\n', "utf8");
  await writeFile(
    path.join(v1BundleDir, "out", "yanote-report.json"),
    JSON.stringify({
      status: "partial",
      specSource: { kind: "local-file", reference: "examples/openapi/demo-openapi.yaml" },
      summary: {
        deprecatedOperations: {
          totalOperations: 1,
          coveredOperations: 0,
          uncoveredOperations: 1,
          operationCoveragePercent: 0
        }
      }
    }) + "\n",
    "utf8"
  );
  await writeFile(path.join(v1BundleDir, "out", "yanote-report.html"), "<html><body>http html</body></html>\n", "utf8");
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

    await writeFile(
      path.join(sourceDir, "yanote-report.json"),
      JSON.stringify({
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
      }),
      "utf8"
    );
    await writeFile(path.join(sourceDir, "yanote-report.html"), "<html><body>top-level html</body></html>\n", "utf8");
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
      "artifact-source-paths.txt",
      "delivery-proof-changed-files.txt",
      "delivery-proof-exit-code.txt",
      "delivery-proof-scope.txt",
      "delivery-proof-should-run.txt",
      "live-kafka-proof",
      "v1-e2e",
      "yanote-check-command.args",
      "yanote-report.html",
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

    assert.deepEqual((await readdir(path.join(outDir, "v1-e2e"))).sort(), [
      "artifact-manifest.txt",
      "artifact-source-paths.txt",
      "compose.log",
      "events.jsonl",
      "out",
      "request-semantics-yanote-report.json",
      "request-semantics.events.jsonl",
      "request-semantics.stderr",
      "request-semantics.stdout",
      "security-semantics-yanote-report.json",
      "security-semantics.stderr",
      "security-semantics.stdout",
      "semantic-red-yanote-report.json",
      "semantic-red.stderr",
      "semantic-red.stdout"
    ]);

    assert.deepEqual((await readdir(path.join(outDir, "v1-e2e", "out"))).sort(), ["yanote-report.html", "yanote-report.json"]);

    const manifest = await readFile(path.join(outDir, "artifact-manifest.txt"), "utf8");
    assert.match(manifest, /report_found=true/);
    assert.match(manifest, /report_json_found=true/);
    assert.match(manifest, /report_html_found=true/);
    assert.match(manifest, /report_source=build\/yanote\/aggregate\/check\/yanote-report\.json/);
    assert.match(manifest, /report_html_source=build\/yanote\/aggregate\/check\/yanote-report\.html/);
    assert.match(manifest, /report_spec_source_kind=remote-url/);
    assert.match(manifest, /report_spec_source_ref=https:\/\/example\.test\/openapi\.yaml/);
    assert.match(manifest, /report_deprecated_total=1/);
    assert.match(manifest, /report_deprecated_covered=0/);
    assert.match(manifest, /report_deprecated_uncovered=1/);
    assert.match(manifest, /report_deprecated_percent=0/);
    assert.match(manifest, /async_bundle_found=true/);
    assert.match(manifest, /async_bundle_source=\.yanote-ci\/live-kafka-proof/);
    assert.match(manifest, /v1_e2e_bundle_found=true/);
    assert.match(manifest, /v1_e2e_bundle_source=\.yanote-ci\/v1-e2e/);
    assert.match(manifest, /source_paths_note=artifact-source-paths\.txt/);

    const sourcePaths = await readFile(path.join(outDir, "artifact-source-paths.txt"), "utf8");
    assert.match(sourcePaths, /yanote-report\.json=build\/yanote\/aggregate\/check\/yanote-report\.json/);
    assert.match(sourcePaths, /yanote-report\.html=build\/yanote\/aggregate\/check\/yanote-report\.html/);
    assert.match(sourcePaths, /report_spec_source_kind=remote-url/);
    assert.match(sourcePaths, /report_spec_source_ref=https:\/\/example\.test\/openapi\.yaml/);
    assert.match(sourcePaths, /report_deprecated_total=1/);
    assert.match(sourcePaths, /report_deprecated_covered=0/);
    assert.match(sourcePaths, /report_deprecated_uncovered=1/);

    const v1Manifest = await readFile(path.join(outDir, "v1-e2e", "artifact-manifest.txt"), "utf8");
    assert.match(v1Manifest, /happy_path_report_found=true/);
    assert.match(v1Manifest, /happy_path_report_html_found=true/);
    assert.match(v1Manifest, /happy_path_spec_source_kind=local-file/);
    assert.match(v1Manifest, /happy_path_spec_source_ref=examples\/openapi\/demo-openapi\.yaml/);
    assert.match(v1Manifest, /happy_path_deprecated_total=1/);
    assert.match(v1Manifest, /request_semantics_primary=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER/);
    assert.match(v1Manifest, /security_semantics_primary=SEMANTIC_HTTP_MISSING_SECURITY/);
    assert.match(v1Manifest, /semantic_red_primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA/);

    const v1SourcePaths = await readFile(path.join(outDir, "v1-e2e", "artifact-source-paths.txt"), "utf8");
    assert.match(v1SourcePaths, /out\/yanote-report\.json=report:\/data\/yanote\/out\/yanote-report\.json/);
    assert.match(v1SourcePaths, /out\/yanote-report\.html=report:\/data\/yanote\/out\/yanote-report\.html/);
    assert.match(v1SourcePaths, /happy_path_spec_source_kind=local-file/);
    assert.match(v1SourcePaths, /happy_path_spec_source_ref=examples\/openapi\/demo-openapi\.yaml/);
    assert.match(v1SourcePaths, /happy_path_deprecated_total=1/);
    assert.match(v1SourcePaths, /security_semantics_spec=yanote-js\/test\/fixtures\/openapi\/http-security-api-key\.yaml/);
    assert.match(v1SourcePaths, /security_semantics_events=yanote-js\/test\/fixtures\/events\/http-security-api-key\.fixture\.jsonl/);
    assert.match(v1SourcePaths, /security-semantics\.stdout=host:node yanote-js\/dist\/yanote\.cjs report --spec yanote-js\/test\/fixtures\/openapi\/http-security-api-key\.yaml --events yanote-js\/test\/fixtures\/events\/http-security-api-key\.fixture\.jsonl --out <temp> --profile local --verbose/);
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
    assert.match(sourcePaths, /v1-e2e=none/);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
