import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/verify-m016-s01-standalone-analyzer.sh");

async function loadScriptSource() {
  return readFile(scriptPath, "utf8");
}

test("standalone staged-bundle verifier uses the stable retained proof directory and official archive contract", async () => {
  const source = await loadScriptSource();
  assert.match(source, /ARTIFACT_DIR="\$\{YANOTE_STANDALONE_PROOF_DIR:-\.yanote-ci\/m016-s01-standalone-analyzer-proof\}"/);
  assert.match(source, /ARCHIVE_RELATIVE_PATH="build\/distributions\/yanote-analyzer\.zip"/);
  assert.match(source, /MANIFEST_NAME="artifact-manifest\.txt"/);
  assert.match(source, /SOURCE_PATHS_NOTE_NAME="artifact-source-paths\.txt"/);
  assert.match(source, /ARCHIVE_CONTENTS_PATH="\$\{ARTIFACT_ROOT\}\/archive-contents\.txt"/);
  assert.match(source, /BUNDLE_LAYOUT_PATH="\$\{ARTIFACT_ROOT\}\/bundle-layout\.txt"/);
  assert.match(source, /rm -rf "\$\{ARTIFACT_ROOT\}"/);
});

test("standalone staged-bundle verifier rebuilds distStandaloneAnalyzer and extracts the official bundle before executing the launcher", async () => {
  const source = await loadScriptSource();
  assert.match(source, /\.\/gradlew distStandaloneAnalyzer --stacktrace/);
  assert.match(source, /if \[\[ ! -f "\$\{ARCHIVE_PATH\}" \]\]; then\n  fail "Missing standalone analyzer archive at \$\{ARCHIVE_RELATIVE_PATH\}\. Run \.\/gradlew distStandaloneAnalyzer to regenerate the official staged bundle before rerunning this proof\."/);
  assert.match(source, /if ! unzip -Z1 "\$\{ARCHIVE_PATH\}" > "\$\{ARCHIVE_CONTENTS_PATH\}"/);
  assert.match(source, /assert_archive_entry 'yanote-analyzer\/'/);
  assert.match(source, /assert_archive_entry 'yanote-analyzer\/bin\/yanote'/);
  assert.match(source, /assert_archive_entry 'yanote-analyzer\/lib\/yanote\.cjs'/);
  assert.match(source, /if ! unzip -q "\$\{ARCHIVE_PATH\}" -d "\$\{EXTRACT_DIR\}"/);
  assert.match(source, /\[\[ -x "\$\{LAUNCHER_PATH\}" \]\] \|\| fail "Missing extracted standalone launcher at \$\{LAUNCHER_PATH\}\."/);
  assert.match(source, /\[\[ -f "\$\{RUNTIME_PATH\}" \]\] \|\| fail "Missing extracted bundled runtime at \$\{RUNTIME_PATH\}\."/);
  assert.match(source, /\[\[ -f "\$\{VERSION_PATH\}" \]\] \|\| fail "Missing extracted standalone version metadata at \$\{VERSION_PATH\}\."/);
});

test("standalone staged-bundle verifier proves version and report from the extracted launcher instead of the raw yanote.cjs seam", async () => {
  const source = await loadScriptSource();
  assert.match(source, /"\$\{LAUNCHER_PATH\}" --version/);
  assert.match(
    source,
    /"\$\{LAUNCHER_PATH\}" report \\\n    --spec "\$\{SPEC_FIXTURE_PATH\}" \\\n    --events "\$\{EVENTS_FIXTURE_PATH\}" \\\n    --out "\$\{REPORT_OUT_DIR\}" \\\n    --profile local/
  );
  assert.match(source, /printf 'version_command=host:%s --version\\n' "\$\{LAUNCHER_PATH\}"/);
  assert.match(source, /printf 'report_command=host:%s report --spec %s --events %s --out %s --profile local\\n' "\$\{LAUNCHER_PATH\}" "\$\{SPEC_FIXTURE_PATH\}" "\$\{EVENTS_FIXTURE_PATH\}" "\$\{REPORT_OUT_DIR\}"/);
  assert.match(source, /Expected --version to print \{expected_version!r\}, got \{version_stdout!r\}/);
  assert.match(source, /Expected report status 'partial', got \{report.get\('status'\)!r\}/);
  assert.match(source, /Expected totalOperations=4, got \{summary.get\('totalOperations'\)!r\}/);
  assert.match(source, /Expected coveredOperations=4, got \{summary.get\('coveredOperations'\)!r\}/);
  assert.match(source, /Expected operationCoveragePercent=100, got \{summary.get\('operationCoveragePercent'\)!r\}/);
  assert.match(source, /Expected exactly one YANOTE_SUMMARY line, got \{len\(summary_lines\)\}/);
  assert.doesNotMatch(source, /node yanote-js\/dist\/yanote\.cjs report/);
  assert.doesNotMatch(source, /npm -C yanote-js run build/);
});

test("standalone staged-bundle verifier retains high-signal observability and pinned proof-bundle files", async () => {
  const source = await loadScriptSource();
  assert.match(source, /printf 'archive=%s\\n' "\$\{ARCHIVE_RELATIVE_PATH\}"/);
  assert.match(source, /printf 'bundle_layout=%s\\n' "\$\{BUNDLE_LAYOUT_PATH\}"/);
  assert.match(source, /printf 'spec_fixture=%s\\n' "\$\{SPEC_FIXTURE_PATH\}"/);
  assert.match(source, /printf 'events_fixture=%s\\n' "\$\{EVENTS_FIXTURE_PATH\}"/);
  assert.match(source, /printf 'report_json=%s\\n' "\$\{REPORT_JSON_PATH\}"/);
  assert.match(source, /printf 'report_html=%s\\n' "\$\{REPORT_HTML_PATH\}"/);
  assert.match(source, /printf 'source_paths_note=%s\\n' "\$\{SOURCE_PATHS_NOTE_NAME\}"/);
  assert.match(source, /printf 'observability=%s\\n' 'distStandaloneAnalyzer\.stdout\.log,distStandaloneAnalyzer\.stderr\.log,archive-contents\.txt,bundle-layout\.txt,version\/version\.stdout,version\/version\.stderr,report\/report\.stdout,report\/report\.stderr,report\/out\/yanote-report\.json,report\/out\/yanote-report\.html'/);
  assert.match(source, /if \[\[ ! -f "\$\{REPORT_JSON_PATH\}" \]\]; then\n  fail "Extracted standalone launcher did not retain yanote-report\.json at \$\{REPORT_JSON_PATH\}\."/);
  assert.match(source, /if \[\[ ! -f "\$\{REPORT_HTML_PATH\}" \]\]; then\n  fail "Extracted standalone launcher did not retain yanote-report\.html at \$\{REPORT_HTML_PATH\}\."/);
  assert.match(source, /Standalone staged-bundle proof passed: \$\{PROOF_SUMMARY\}/);
});
