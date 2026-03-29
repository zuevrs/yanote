import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/verify-static-html-reports.sh");

async function loadScriptSource() {
  return readFile(scriptPath, "utf8");
}

test("static-html verifier writes the retained proof bundle into the stable CI path", async () => {
  const source = await loadScriptSource();
  assert.match(source, /ARTIFACT_DIR="\.yanote-ci\/static-html-reports-proof"/);
  assert.match(source, /HTTP_REPORT_DIR="\$\{ARTIFACT_DIR\}\/http-report"/);
  assert.match(source, /ASYNC_REPORT_DIR="\$\{ARTIFACT_DIR\}\/async-report"/);
  assert.match(source, /MANIFEST_NAME="artifact-manifest\.txt"/);
  assert.match(source, /HTTP_STDOUT_PATH="\$\{HTTP_REPORT_DIR\}\/stdout\.txt"/);
  assert.match(source, /ASYNC_STDOUT_PATH="\$\{ASYNC_REPORT_DIR\}\/stdout\.txt"/);
  assert.match(source, /HTTP_HTML_PATH="\$\{HTTP_OUT_DIR\}\/yanote-report\.html"/);
  assert.match(source, /ASYNC_HTML_PATH="\$\{ASYNC_OUT_DIR\}\/yanote-async-report\.html"/);
  assert.match(source, /rm -rf "\$\{ARTIFACT_DIR\}"/);
});

test("static-html verifier rebuilds the real CLI and runs the supported HTTP and async entrypoints", async () => {
  const source = await loadScriptSource();
  assert.match(source, /npm -C yanote-js run build >"\$\{BUILD_LOG_PATH\}" 2>&1/);
  assert.match(source, /\[\[ -f "yanote-js\/dist\/yanote\.cjs" \]\] \|\| fail "yanote-js build did not produce dist\/yanote\.cjs\."/);
  assert.match(
    source,
    /node yanote-js\/dist\/yanote\.cjs report \\\n    --spec "\$\{HTTP_FIXTURE_SPEC\}" \\\n    --events "\$\{HTTP_FIXTURE_EVENTS\}" \\\n    --out "\$\{HTTP_OUT_DIR\}" \\\n    --profile local >"\$\{HTTP_STDOUT_PATH\}" 2>"\$\{HTTP_STDERR_PATH\}"/
  );
  assert.match(
    source,
    /node yanote-js\/dist\/yanote\.cjs async-report \\\n    --spec "\$\{ASYNC_FIXTURE_SPEC\}" \\\n    --events "\$\{ASYNC_FIXTURE_EVENTS\}" \\\n    --out "\$\{ASYNC_OUT_DIR\}" \\\n    --profile local >"\$\{ASYNC_STDOUT_PATH\}" 2>"\$\{ASYNC_STDERR_PATH\}"/
  );
});

test("static-html verifier asserts canonical counts, sanitized provenance, and domain separation for both retained artifacts", async () => {
  const source = await loadScriptSource();
  assert.match(source, /"- operations: 2\/3 \(66\.67%\)"/);
  assert.match(source, /"- deprecated operations: covered=0\/1 uncovered=1 \(0\.00%\)"/);
  assert.match(source, /"deprecated_operations=0\.00"/);
  assert.match(source, /"yanote-report\.html"/);
  assert.match(source, /"http GET \/legacy-users"/);
  assert.match(source, /"- channels: 1\/2 \(50\.00%\)"/);
  assert.match(source, /"- operations: 1\/2 \(50\.00%\)"/);
  assert.match(source, /"- messages: 1\/2 \(50\.00%\)"/);
  assert.match(source, /"covered_channels=1\/2"/);
  assert.match(source, /"yanote-async-report\.html"/);
  assert.match(source, /http_domain_forbidden = \[[\s\S]*"Async coverage summary"[\s\S]*"Channel coverage"[\s\S]*\]/);
  assert.match(source, /async_domain_forbidden = \[[\s\S]*"Deprecated operations"[\s\S]*"HTTP payload conformance"[\s\S]*"HTTP security conformance"[\s\S]*\]/);
});

test("static-html verifier fails on secret-like markers, raw event shapes, external assets, and out-of-scope terms", async () => {
  const source = await loadScriptSource();
  assert.match(source, /html_forbidden_fragments = \[[\s\S]*"<script"[\s\S]*"<link "[\s\S]*"https:\/\/"[\s\S]*\]/);
  assert.match(source, /forbidden_markers = \[[\s\S]*"SECRET_"[\s\S]*"observedValues"[\s\S]*"requestBody"[\s\S]*"responseBody"[\s\S]*"test\.run_id"[\s\S]*"combined-report"[\s\S]*"dashboard"[\s\S]*\]/);
  assert.match(source, /sensitive_markers=absent/);
  assert.match(source, /event_dump_markers=absent/);
  assert.match(source, /out_of_scope_terms=absent/);
});

test("static-html verifier records rerun commands, retained artifact paths, and the full pinned bundle layout", async () => {
  const source = await loadScriptSource();
  assert.match(source, /http_command=host:node yanote-js\/dist\/yanote\.cjs report --spec \$\{HTTP_FIXTURE_SPEC\} --events \$\{HTTP_FIXTURE_EVENTS\} --out \$\{HTTP_OUT_DIR\} --profile local/);
  assert.match(source, /async_command=host:node yanote-js\/dist\/yanote\.cjs async-report --spec \$\{ASYNC_FIXTURE_SPEC\} --events \$\{ASYNC_FIXTURE_EVENTS\} --out \$\{ASYNC_OUT_DIR\} --profile local/);
  assert.match(source, /http_report_json=http-report\/out\/yanote-report\.json/);
  assert.match(source, /http_report_html=http-report\/out\/yanote-report\.html/);
  assert.match(source, /async_report_json=async-report\/out\/yanote-async-report\.json/);
  assert.match(source, /async_report_html=async-report\/out\/yanote-async-report\.html/);
  assert.match(source, /expected_files = sorted\(\[[\s\S]*"artifact-manifest\.txt",[\s\S]*"async-report\/out\/yanote-async-report\.html",[\s\S]*"async-report\/out\/yanote-async-report\.json",[\s\S]*"http-report\/out\/yanote-report\.html",[\s\S]*"http-report\/out\/yanote-report\.json",[\s\S]*"yanote-js-build\.log",[\s\S]*\]\)/);
});
