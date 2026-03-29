import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/verify-remote-spec.sh");

async function loadScriptSource() {
  return readFile(scriptPath, "utf8");
}

test("remote-spec verifier writes the retained proof bundle into the stable CI path", async () => {
  const source = await loadScriptSource();
  assert.match(source, /ARTIFACT_DIR="\.yanote-ci\/remote-spec-proof"/);
  assert.match(source, /SOURCE_PATHS_NOTE_NAME="artifact-source-paths\.txt"/);
  assert.match(source, /MANIFEST_NAME="artifact-manifest\.txt"/);
  assert.match(source, /rm -rf "\$\{ARTIFACT_DIR\}"/);
});

test("remote-spec verifier rebuilds the real analyzer and serves the fixture over localhost", async () => {
  const source = await loadScriptSource();
  assert.match(source, /\.\/gradlew distNodeAnalyzer --stacktrace >"\$\{BUILD_LOG_PATH\}" 2>&1/);
  assert.match(source, /python3 -m http\.server "\$\{PORT\}" --bind 127\.0\.0\.1 --directory "\$\{REMOTE_SERVE_DIR\}"/);
  assert.match(source, /REMOTE_SPEC_URL="http:\/\/127\.0\.0\.1:\$\{PORT\}\/simple\.yaml"/);
});

test("remote-spec verifier runs the three CLI source kinds through the real report entrypoint", async () => {
  const source = await loadScriptSource();
  assert.match(source, /run_cli_case "cli-local-file" "\$\{LOCAL_FILE_FIXTURE_PATH\}" "local-file" "\$\{LOCAL_FILE_FIXTURE_PATH\}"/);
  assert.match(source, /run_cli_case "cli-local-directory" "\$\{LOCAL_DIRECTORY_FIXTURE_DIR\}" "local-directory" "\$\{LOCAL_DIRECTORY_FIXTURE_DIR\}"/);
  assert.match(source, /run_cli_case "cli-remote-url" "\$\{REMOTE_SPEC_URL\}" "remote-url" "\$\{REMOTE_SPEC_URL\}"/);
  assert.match(source, /node "\$\{ANALYZER_PATH\}" report \\\n    --spec "\$\{spec_input\}" \\\n    --events "\$\{FIXTURE_EVENTS\}" \\\n    --out "\$\{out_dir\}" \\\n    --profile local/);
});

test("remote-spec verifier reuses the Gradle helper for remote check and report surfaces", async () => {
  const source = await loadScriptSource();
  assert.match(source, /run_gradle_case "gradle-remote-check" "yanoteCheck"/);
  assert.match(source, /run_gradle_case "gradle-remote-report" "yanoteReport"/);
  assert.match(source, /YANOTE_GRADLE_TASK="\$\{gradle_task\}"/);
  assert.match(source, /YANOTE_SKIP_DIST_NODE_ANALYZER=true/);
  assert.match(source, /INPUT_SPEC_PATH="\$\{REMOTE_SPEC_URL\}"/);
  assert.match(source, /grep -Fq 'report --spec <remote-url>' "\$\{args_path\}"/);
  assert.match(source, /grep -Fq "spec_source_ref=\$\{REMOTE_SPEC_URL\}" "\$\{args_path\}"/);
});

test("remote-spec verifier records deterministic manifest and source-path notes with sanitized provenance only", async () => {
  const source = await loadScriptSource();
  assert.match(source, /cli-local-file\.stdout=host:node \$\{ANALYZER_PATH\} report --spec \$\{LOCAL_FILE_FIXTURE_PATH\}/);
  assert.match(source, /cli-remote-url\.stdout=host:node \$\{ANALYZER_PATH\} report --spec \$\{REMOTE_SPEC_URL\}/);
  assert.match(source, /gradle-remote-check\.args=\$\{ARTIFACT_DIR\}\/gradle-remote-check\/out\/yanote-check-command\.args/);
  assert.match(source, /gradle-remote-report\.args=\$\{ARTIFACT_DIR\}\/gradle-remote-report\/out\/yanote-report-command\.args/);
  assert.match(source, /remote_spec_url=\$\{REMOTE_SPEC_URL\}/);
  assert.match(source, /sanitized_remote_only=true/);
  assert.match(source, /source_paths_note=\$\{SOURCE_PATHS_NOTE_NAME\}/);
});

test("remote-spec verifier scans the retained bundle for forbidden secret-like tokens", async () => {
  const source = await loadScriptSource();
  assert.match(source, /forbidden = \["proof-user", "proof-secret", "proof-token", "proof-fragment"\]/);
  assert.match(source, /ensure_no_file_leak "\$\{args_path\}" "\$\{label\} args" "proof-user" "proof-secret" "proof-token" "proof-fragment"/);
});
