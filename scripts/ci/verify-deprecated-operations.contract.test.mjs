import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/verify-deprecated-operations.sh");

async function loadScriptSource() {
  return readFile(scriptPath, "utf8");
}

test("deprecated-operations verifier writes the retained proof bundle into the stable CI path", async () => {
  const source = await loadScriptSource();
  assert.match(source, /ARTIFACT_DIR="\.yanote-ci\/deprecated-operations-proof"/);
  assert.match(source, /CLI_REPORT_DIR="\$\{ARTIFACT_DIR\}\/cli-report"/);
  assert.match(source, /MANIFEST_NAME="artifact-manifest\.txt"/);
  assert.match(source, /REPORT_STDOUT_PATH="\$\{CLI_REPORT_DIR\}\/stdout\.txt"/);
  assert.match(source, /REPORT_JSON_PATH="\$\{REPORT_OUT_DIR\}\/yanote-report\.json"/);
  assert.match(source, /REPORT_HTML_PATH="\$\{REPORT_OUT_DIR\}\/yanote-report\.html"/);
  assert.match(source, /rm -rf "\$\{ARTIFACT_DIR\}"/);
});

test("deprecated-operations verifier rebuilds the real CLI and runs the supported report entrypoint", async () => {
  const source = await loadScriptSource();
  assert.match(source, /npm -C yanote-js run build >"\$\{BUILD_LOG_PATH\}" 2>&1/);
  assert.match(source, /\[\[ -f "yanote-js\/dist\/yanote\.cjs" \]\] \|\| fail "yanote-js build did not produce dist\/yanote\.cjs\."/);
  assert.match(
    source,
    /node yanote-js\/dist\/yanote\.cjs report \\\n    --spec "\$\{FIXTURE_SPEC\}" \\\n    --events "\$\{FIXTURE_EVENTS\}" \\\n    --out "\$\{REPORT_OUT_DIR\}" \\\n    --profile local >"\$\{REPORT_STDOUT_PATH\}" 2>"\$\{REPORT_STDERR_PATH\}"/
  );
});

test("deprecated-operations verifier asserts additive deprecated truth without denominator drift", async () => {
  const source = await loadScriptSource();
  assert.match(source, /"- operations: 2\/3 \(66\.67%\)"/);
  assert.match(source, /"- deprecated operations: covered=0\/1 uncovered=1 \(0\.00%\)"/);
  assert.match(source, /"- low: http GET \/legacy-users - deprecated operation is uncovered"/);
  assert.match(source, /"deprecated_operations=0\.00"/);
  assert.match(source, /"deprecated_total=1"/);
  assert.match(source, /"deprecated_covered=0"/);
  assert.match(source, /"deprecated_uncovered=1"/);
  assert.match(source, /"covered=2\/3"/);
  assert.match(source, /if summary.get\("totalOperations"\) != 3:/);
  assert.match(source, /if summary.get\("coveredOperations"\) != 2:/);
  assert.match(source, /if summary.get\("operationCoveragePercent"\) != 66\.67:/);
  assert.match(source, /if summary.get\("aggregateCoveragePercent"\) is not None:/);
  assert.match(source, /if summary.get\("aggregateExplanation"\) != "aggregate is N\/A because weighted dimensions include N\/A":/);
  assert.match(source, /if summary.get\("deprecatedOperations"\) != \{[\s\S]*"totalOperations": 1,[\s\S]*"coveredOperations": 0,[\s\S]*"uncoveredOperations": 1,[\s\S]*"operationCoveragePercent": 0,[\s\S]*\}:/);
  assert.match(source, /expected_per_operation = \[[\s\S]*http GET \/legacy-users[\s\S]*deprecated": True[\s\S]*http GET \/users[\s\S]*deprecated": False[\s\S]*http POST \/users[\s\S]*deprecated": False[\s\S]*\]/);
});

test("deprecated-operations verifier keeps the retained proof bundle HTTP-only and layout-pinned while requiring the HTML sibling", async () => {
  const source = await loadScriptSource();
  assert.match(source, /for forbidden in \["YANOTE_ASYNC_SUMMARY", "yanote-async-report\.json", "<html", "dashboard"\]/);
  assert.match(source, /\[\[ -f "\$\{REPORT_HTML_PATH\}" \]\] \|\| fail "yanote report did not produce yanote-report\.html\."/);
  assert.match(source, /expected_files = sorted\(\[[\s\S]*"artifact-manifest\.txt",[\s\S]*"cli-report\/exit-code\.txt",[\s\S]*"cli-report\/out\/yanote-report\.html",[\s\S]*"cli-report\/out\/yanote-report\.json",[\s\S]*"cli-report\/stderr\.txt",[\s\S]*"cli-report\/stdout\.txt",[\s\S]*"yanote-js-build\.log",[\s\S]*\]\)/);
  assert.match(source, /report_html=cli-report\/out\/yanote-report\.html/);
  assert.match(source, /http_only=true/);
  assert.match(source, /html_artifacts_present=true/);
  assert.match(source, /async_artifacts_present=false/);
  assert.match(source, /dashboard_artifacts_present=false/);
});

test("deprecated-operations verifier records the command and retained artifact paths in the manifest", async () => {
  const source = await loadScriptSource();
  assert.match(source, /command=host:node yanote-js\/dist\/yanote\.cjs report --spec \$\{FIXTURE_SPEC\} --events \$\{FIXTURE_EVENTS\} --out \$\{REPORT_OUT_DIR\} --profile local/);
  assert.match(source, /stdout=cli-report\/stdout\.txt/);
  assert.match(source, /stderr=cli-report\/stderr\.txt/);
  assert.match(source, /exit_code_file=cli-report\/exit-code\.txt/);
  assert.match(source, /report_json=cli-report\/out\/yanote-report\.json/);
  assert.match(source, /report_html=cli-report\/out\/yanote-report\.html/);
  assert.match(source, /legacy_operations=2\/3/);
  assert.match(source, /deprecated_operations=0\/1/);
});
