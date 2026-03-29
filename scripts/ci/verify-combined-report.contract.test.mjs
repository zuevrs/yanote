import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/verify-combined-report.sh");

async function loadScriptSource() {
  return readFile(scriptPath, "utf8");
}

test("combined-report verifier uses the stable .tmp proof bundle and canonical child-input paths", async () => {
  const source = await loadScriptSource();
  assert.match(source, /ARTIFACT_DIR="\.tmp\/m015-s03-combined-proof"/);
  assert.match(source, /HTTP_FIXTURE_SPEC="scripts\/ci\/fixtures\/m015-s03-combined-http\.openapi\.yaml"/);
  assert.match(source, /HTTP_FIXTURE_EVENTS="scripts\/ci\/fixtures\/m015-s03-combined-http\.events\.jsonl"/);
  assert.match(source, /RETAINED_ASYNC_REPORT_PATH="\.yanote-ci\/live-rabbitmq-proof\/yanote-async-report\.json"/);
  assert.match(source, /RETAINED_ASYNC_HTML_PATH="\.yanote-ci\/live-rabbitmq-proof\/yanote-async-report\.html"/);
  assert.match(source, /MANIFEST_PATH="\$\{ARTIFACT_DIR\}\/artifact-manifest\.txt"/);
  assert.match(source, /SOURCE_PATHS_PATH="\$\{ARTIFACT_DIR\}\/artifact-source-paths\.txt"/);
  assert.match(source, /rm -rf "\$\{ARTIFACT_DIR\}"/);
});

test("combined-report verifier runs the dist report and combined-report entrypoints with retained stdout and stderr", async () => {
  const source = await loadScriptSource();
  assert.match(source, /\[\[ -f "yanote-js\/dist\/yanote\.cjs" \]\] \|\| fail "Missing yanote-js\/dist\/yanote\.cjs\. Run 'npm -C yanote-js run build' before rerunning this proof\."/);
  assert.match(
    source,
    /node yanote-js\/dist\/yanote\.cjs report \\\n      --spec "\$\{HTTP_FIXTURE_SPEC\}" \\\n      --events "\$\{HTTP_FIXTURE_EVENTS\}" \\\n      --out "\$\{HTTP_OUT_DIR\}"/
  );
  assert.match(
    source,
    /node yanote-js\/dist\/yanote\.cjs combined-report \\\n      --report "\$\{HTTP_JSON_PATH\}" \\\n      --async-report "\$\{RETAINED_ASYNC_REPORT_PATH\}" \\\n      --out "\$\{COMBINED_OUT_DIR\}"/
  );
  assert.match(source, /HTTP_STDOUT_PATH="\$\{HTTP_REPORT_DIR\}\/http-report\.stdout"/);
  assert.match(source, /HTTP_STDERR_PATH="\$\{HTTP_REPORT_DIR\}\/http-report\.stderr"/);
  assert.match(source, /COMBINED_STDOUT_PATH="\$\{COMBINED_REPORT_DIR\}\/combined-report\.stdout"/);
  assert.match(source, /COMBINED_STDERR_PATH="\$\{COMBINED_REPORT_DIR\}\/combined-report\.stderr"/);
  assert.match(source, /Missing retained async child report at \$\{RETAINED_ASYNC_REPORT_PATH\}\. Rerun bash scripts\/ci\/verify-rabbitmq-live-proof\.sh to regenerate the canonical S02 async proof\./);
});

test("combined-report verifier pins the happy-path summary, AMQP attribution, and child drill-down paths", async () => {
  const source = await loadScriptSource();
  assert.match(source, /combined-report stdout must contain exactly one final YANOTE_COMBINED_SUMMARY line\./);
  assert.match(source, /summary_lines = \[line for line in combined_stdout\.splitlines\(\) if line\.startswith\("YANOTE_COMBINED_SUMMARY "\)\]/);
  assert.match(source, /Combined summary line is missing token \{token!r\}/);
  assert.match(source, /"status=ok"/);
  assert.match(source, /"http_status=ok"/);
  assert.match(source, /"async_status=ok"/);
  assert.match(source, /"protocols=amqp"/);
  assert.match(source, /Combined stdout is missing expected fragment: \{fragment\}/);
  assert.match(source, /"HTTP Child\\n- status: ok"/);
  assert.match(source, /"Async Child\\n- status: ok"/);
  assert.match(source, /"- protocols: amqp"/);
  assert.match(source, /"- http json: \{http_json_path\}"/);
  assert.match(source, /"- async json: \{async_json_path\}"/);
  assert.match(source, /Unexpected combined HTTP artifact refs/);
  assert.match(source, /Unexpected combined async artifact refs/);
  assert.match(source, /Expected combined async protocols \['amqp'\]/);
});

test("combined-report verifier records rerun context and the full pinned proof-bundle layout", async () => {
  const source = await loadScriptSource();
  assert.match(source, /printf 'http_fixture_spec=%s\\n' "\$\{HTTP_FIXTURE_SPEC\}" >>"\$\{SOURCE_PATHS_PATH\}"/);
  assert.match(source, /printf 'retained_async_report=%s\\n' "\$\{RETAINED_ASYNC_REPORT_PATH\}" >>"\$\{SOURCE_PATHS_PATH\}"/);
  assert.match(source, /http_command=host:node yanote-js\/dist\/yanote\.cjs report --spec \$\{HTTP_FIXTURE_SPEC\} --events \$\{HTTP_FIXTURE_EVENTS\} --out \$\{HTTP_OUT_DIR\}/);
  assert.match(source, /combined_command=host:node yanote-js\/dist\/yanote\.cjs combined-report --report \$\{HTTP_JSON_PATH\} --async-report \$\{RETAINED_ASYNC_REPORT_PATH\} --out \$\{COMBINED_OUT_DIR\}/);
  assert.match(source, /summary_token=YANOTE_COMBINED_SUMMARY/);
  assert.match(source, /observability=http-report\.stdout,http-report\.stderr,combined-report\.stdout,combined-report\.stderr/);
  assert.match(
    source,
    /expected_files = sorted\(\[[\s\S]*"artifact-manifest\.txt",[\s\S]*"artifact-source-paths\.txt",[\s\S]*"combined-report\/out\/yanote-combined-report\.html",[\s\S]*"combined-report\/out\/yanote-combined-report\.json",[\s\S]*"http-report\/out\/yanote-report\.html",[\s\S]*"http-report\/out\/yanote-report\.json",[\s\S]*\]\)/
  );
});
