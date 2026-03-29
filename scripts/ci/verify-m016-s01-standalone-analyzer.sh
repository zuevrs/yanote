#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

ARTIFACT_DIR="${YANOTE_STANDALONE_PROOF_DIR:-.yanote-ci/m016-s01-standalone-analyzer-proof}"
ARTIFACT_ROOT="${ARTIFACT_DIR}"
if [[ "${ARTIFACT_ROOT}" != /* ]]; then
  ARTIFACT_ROOT="${ROOT_DIR}/${ARTIFACT_ROOT}"
fi

ARCHIVE_RELATIVE_PATH="build/distributions/yanote-analyzer.zip"
ARCHIVE_PATH="${ROOT_DIR}/${ARCHIVE_RELATIVE_PATH}"
MANIFEST_NAME="artifact-manifest.txt"
SOURCE_PATHS_NOTE_NAME="artifact-source-paths.txt"
MANIFEST_PATH="${ARTIFACT_ROOT}/${MANIFEST_NAME}"
SOURCE_PATHS_PATH="${ARTIFACT_ROOT}/${SOURCE_PATHS_NOTE_NAME}"
DIST_STDOUT_PATH="${ARTIFACT_ROOT}/distStandaloneAnalyzer.stdout.log"
DIST_STDERR_PATH="${ARTIFACT_ROOT}/distStandaloneAnalyzer.stderr.log"
DIST_EXIT_CODE_PATH="${ARTIFACT_ROOT}/distStandaloneAnalyzer.exit-code.txt"
ARCHIVE_CONTENTS_PATH="${ARTIFACT_ROOT}/archive-contents.txt"
BUNDLE_LAYOUT_PATH="${ARTIFACT_ROOT}/bundle-layout.txt"
EXTRACT_DIR="${ARTIFACT_ROOT}/extract"
EXTRACTED_BUNDLE_DIR="${EXTRACT_DIR}/yanote-analyzer"
LAUNCHER_PATH="${EXTRACTED_BUNDLE_DIR}/bin/yanote"
RUNTIME_PATH="${EXTRACTED_BUNDLE_DIR}/lib/yanote.cjs"
VERSION_PATH="${EXTRACTED_BUNDLE_DIR}/VERSION"
PACKAGE_JSON_PATH="${EXTRACTED_BUNDLE_DIR}/package.json"
RUN_DIR="${ARTIFACT_ROOT}/run-from-extracted-bundle"
VERSION_DIR="${ARTIFACT_ROOT}/version"
VERSION_STDOUT_PATH="${VERSION_DIR}/version.stdout"
VERSION_STDERR_PATH="${VERSION_DIR}/version.stderr"
VERSION_EXIT_CODE_PATH="${VERSION_DIR}/version.exit-code.txt"
REPORT_DIR="${ARTIFACT_ROOT}/report"
REPORT_OUT_DIR="${REPORT_DIR}/out"
REPORT_STDOUT_PATH="${REPORT_DIR}/report.stdout"
REPORT_STDERR_PATH="${REPORT_DIR}/report.stderr"
REPORT_EXIT_CODE_PATH="${REPORT_DIR}/report.exit-code.txt"
REPORT_JSON_PATH="${REPORT_OUT_DIR}/yanote-report.json"
REPORT_HTML_PATH="${REPORT_OUT_DIR}/yanote-report.html"
SPEC_FIXTURE_RELATIVE_PATH="yanote-js/test/fixtures/openapi/simple.yaml"
EVENTS_FIXTURE_RELATIVE_PATH="yanote-js/test/fixtures/events/events.ci.fixture.jsonl"
SPEC_FIXTURE_PATH="${ROOT_DIR}/${SPEC_FIXTURE_RELATIVE_PATH}"
EVENTS_FIXTURE_PATH="${ROOT_DIR}/${EVENTS_FIXTURE_RELATIVE_PATH}"

YANOTE_SKIP_DIST_STANDALONE_ANALYZER="${YANOTE_SKIP_DIST_STANDALONE_ANALYZER:-false}"
DIST_TIMEOUT_SECONDS="${YANOTE_DIST_STANDALONE_TIMEOUT_SECONDS:-300}"
VERSION_TIMEOUT_SECONDS="${YANOTE_STANDALONE_VERSION_TIMEOUT_SECONDS:-60}"
REPORT_TIMEOUT_SECONDS="${YANOTE_STANDALONE_REPORT_TIMEOUT_SECONDS:-120}"

PROOF_STATUS="running"
DIST_EXIT_CODE="not-run"
VERSION_EXIT_CODE="not-run"
REPORT_EXIT_CODE="not-run"
EXPECTED_VERSION="unknown"
VERSION_OUTPUT="none"
REPORT_STATUS="not-run"
REPORT_JSON_FOUND="false"
REPORT_HTML_FOUND="false"
SUMMARY_TOKEN_STATUS="absent"
PROOF_SUMMARY="pending"
EXTRACTED_LAYOUT_READY="false"

print_artifacts() {
  echo "Artifacts retained at: ${ARTIFACT_ROOT}" >&2
  echo "  manifest: ${MANIFEST_PATH}" >&2
  echo "  source_paths: ${SOURCE_PATHS_PATH}" >&2
  echo "  dist_stdout: ${DIST_STDOUT_PATH}" >&2
  echo "  dist_stderr: ${DIST_STDERR_PATH}" >&2
  echo "  archive_contents: ${ARCHIVE_CONTENTS_PATH}" >&2
  echo "  bundle_layout: ${BUNDLE_LAYOUT_PATH}" >&2
  echo "  launcher: ${LAUNCHER_PATH}" >&2
  echo "  runtime: ${RUNTIME_PATH}" >&2
  echo "  version_metadata: ${VERSION_PATH}" >&2
  echo "  version_stdout: ${VERSION_STDOUT_PATH}" >&2
  echo "  version_stderr: ${VERSION_STDERR_PATH}" >&2
  echo "  report_stdout: ${REPORT_STDOUT_PATH}" >&2
  echo "  report_stderr: ${REPORT_STDERR_PATH}" >&2
  echo "  report_json: ${REPORT_JSON_PATH}" >&2
  echo "  report_html: ${REPORT_HTML_PATH}" >&2
}

show_failure_tail() {
  local file
  for file in \
    "${DIST_STDERR_PATH}" \
    "${DIST_STDOUT_PATH}" \
    "${VERSION_STDERR_PATH}" \
    "${VERSION_STDOUT_PATH}" \
    "${REPORT_STDERR_PATH}" \
    "${REPORT_STDOUT_PATH}"; do
    if [[ -s "${file}" ]]; then
      echo "--- $(basename "${file}") (tail) ---" >&2
      tail -n 80 "${file}" >&2 || true
    fi
  done
}

write_source_paths_note() {
  {
    printf 'artifact_dir=%s\n' "${ARTIFACT_ROOT}"
    printf 'archive=%s\n' "${ARCHIVE_RELATIVE_PATH}"
    printf 'dist_stdout=%s\n' "${DIST_STDOUT_PATH}"
    printf 'dist_stderr=%s\n' "${DIST_STDERR_PATH}"
    printf 'archive_contents=%s\n' "${ARCHIVE_CONTENTS_PATH}"
    printf 'bundle_layout=%s\n' "${BUNDLE_LAYOUT_PATH}"
    printf 'extracted_bundle=%s\n' "${EXTRACTED_BUNDLE_DIR}"
    printf 'launcher=%s\n' "${LAUNCHER_PATH}"
    printf 'runtime=%s\n' "${RUNTIME_PATH}"
    printf 'version_metadata=%s\n' "${VERSION_PATH}"
    printf 'package_json=%s\n' "${PACKAGE_JSON_PATH}"
    printf 'run_dir=%s\n' "${RUN_DIR}"
    printf 'spec_fixture=%s\n' "${SPEC_FIXTURE_PATH}"
    printf 'events_fixture=%s\n' "${EVENTS_FIXTURE_PATH}"
    printf 'version_command=host:%s --version\n' "${LAUNCHER_PATH}"
    printf 'report_command=host:%s report --spec %s --events %s --out %s --profile local\n' "${LAUNCHER_PATH}" "${SPEC_FIXTURE_PATH}" "${EVENTS_FIXTURE_PATH}" "${REPORT_OUT_DIR}"
    printf 'version_stdout=%s\n' "${VERSION_STDOUT_PATH}"
    printf 'version_stderr=%s\n' "${VERSION_STDERR_PATH}"
    printf 'report_stdout=%s\n' "${REPORT_STDOUT_PATH}"
    printf 'report_stderr=%s\n' "${REPORT_STDERR_PATH}"
    printf 'report_json=%s\n' "${REPORT_JSON_PATH}"
    printf 'report_html=%s\n' "${REPORT_HTML_PATH}"
  } > "${SOURCE_PATHS_PATH}"
}

write_manifest() {
  {
    printf 'created_at=%s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    printf 'proof_status=%s\n' "${PROOF_STATUS}"
    printf 'artifact_dir=%s\n' "${ARTIFACT_ROOT}"
    printf 'archive=%s\n' "${ARCHIVE_RELATIVE_PATH}"
    printf 'source_paths_note=%s\n' "${SOURCE_PATHS_NOTE_NAME}"
    printf 'dist_exit_code=%s\n' "${DIST_EXIT_CODE}"
    printf 'version_exit_code=%s\n' "${VERSION_EXIT_CODE}"
    printf 'report_exit_code=%s\n' "${REPORT_EXIT_CODE}"
    printf 'expected_version=%s\n' "${EXPECTED_VERSION}"
    printf 'version_output=%s\n' "${VERSION_OUTPUT}"
    printf 'report_status=%s\n' "${REPORT_STATUS}"
    printf 'report_json_found=%s\n' "${REPORT_JSON_FOUND}"
    printf 'report_html_found=%s\n' "${REPORT_HTML_FOUND}"
    printf 'summary_token_status=%s\n' "${SUMMARY_TOKEN_STATUS}"
    printf 'extracted_layout_ready=%s\n' "${EXTRACTED_LAYOUT_READY}"
    printf 'proof_summary=%s\n' "${PROOF_SUMMARY}"
    printf 'observability=%s\n' 'distStandaloneAnalyzer.stdout.log,distStandaloneAnalyzer.stderr.log,archive-contents.txt,bundle-layout.txt,version/version.stdout,version/version.stderr,report/report.stdout,report/report.stderr,report/out/yanote-report.json,report/out/yanote-report.html'
    printf 'version_command=host:%s --version\n' "${LAUNCHER_PATH}"
    printf 'report_command=host:%s report --spec %s --events %s --out %s --profile local\n' "${LAUNCHER_PATH}" "${SPEC_FIXTURE_PATH}" "${EVENTS_FIXTURE_PATH}" "${REPORT_OUT_DIR}"
  } > "${MANIFEST_PATH}"
}

fail() {
  local message="$1"
  PROOF_STATUS="failure"
  write_manifest
  echo "ERROR: ${message}" >&2
  show_failure_tail
  print_artifacts
  exit 1
}

run_with_timeout() {
  local timeout_seconds="$1"
  local working_dir="$2"
  local stdout_path="$3"
  local stderr_path="$4"
  shift 4

  python3 - "$timeout_seconds" "$working_dir" "$stdout_path" "$stderr_path" "$@" <<'PY'
import os
import subprocess
import sys


timeout_seconds = int(sys.argv[1])
working_dir = sys.argv[2]
stdout_path = sys.argv[3]
stderr_path = sys.argv[4]
command = sys.argv[5:]

with open(stdout_path, "wb") as stdout_file, open(stderr_path, "wb") as stderr_file:
    try:
        completed = subprocess.run(
            command,
            cwd=working_dir,
            stdout=stdout_file,
            stderr=stderr_file,
            timeout=timeout_seconds,
            env=os.environ.copy(),
            check=False,
        )
    except subprocess.TimeoutExpired:
        stderr_file.write(
            f"YANOTE_TIMEOUT seconds={timeout_seconds} cwd={working_dir} command={' '.join(command)}\n".encode("utf-8")
        )
        raise SystemExit(124)

raise SystemExit(completed.returncode)
PY
}

assert_archive_entry() {
  local entry="$1"
  if ! grep -Fxq "${entry}" "${ARCHIVE_CONTENTS_PATH}"; then
    fail "Malformed standalone analyzer archive at ${ARCHIVE_RELATIVE_PATH}: missing ${entry}."
  fi
}

rm -rf "${ARTIFACT_ROOT}"
mkdir -p "${ARTIFACT_ROOT}" "${VERSION_DIR}" "${REPORT_OUT_DIR}" "${RUN_DIR}"
: > "${DIST_STDOUT_PATH}"
: > "${DIST_STDERR_PATH}"
: > "${VERSION_STDOUT_PATH}"
: > "${VERSION_STDERR_PATH}"
: > "${REPORT_STDOUT_PATH}"
: > "${REPORT_STDERR_PATH}"
write_source_paths_note
write_manifest

[[ -f "${SPEC_FIXTURE_PATH}" ]] || fail "Missing proof spec fixture at ${SPEC_FIXTURE_PATH}."
[[ -f "${EVENTS_FIXTURE_PATH}" ]] || fail "Missing proof events fixture at ${EVENTS_FIXTURE_PATH}."

if [[ "${YANOTE_SKIP_DIST_STANDALONE_ANALYZER}" != "true" ]]; then
  echo "Building the official standalone analyzer archive..."
  if run_with_timeout \
    "${DIST_TIMEOUT_SECONDS}" \
    "${ROOT_DIR}" \
    "${DIST_STDOUT_PATH}" \
    "${DIST_STDERR_PATH}" \
    ./gradlew distStandaloneAnalyzer --stacktrace; then
    DIST_EXIT_CODE="0"
  else
    DIST_EXIT_CODE="$?"
  fi
  printf '%s\n' "${DIST_EXIT_CODE}" > "${DIST_EXIT_CODE_PATH}"
  write_manifest

  if [[ "${DIST_EXIT_CODE}" == "124" ]]; then
    fail "./gradlew distStandaloneAnalyzer timed out after ${DIST_TIMEOUT_SECONDS}s; inspect ${DIST_STDOUT_PATH} and ${DIST_STDERR_PATH}."
  fi
  if [[ "${DIST_EXIT_CODE}" != "0" ]]; then
    fail "./gradlew distStandaloneAnalyzer exited with ${DIST_EXIT_CODE}; inspect ${DIST_STDOUT_PATH} and ${DIST_STDERR_PATH}."
  fi
else
  DIST_EXIT_CODE="skipped"
  printf '%s\n' "${DIST_EXIT_CODE}" > "${DIST_EXIT_CODE_PATH}"
  write_manifest
fi

if [[ ! -f "${ARCHIVE_PATH}" ]]; then
  fail "Missing standalone analyzer archive at ${ARCHIVE_RELATIVE_PATH}. Run ./gradlew distStandaloneAnalyzer to regenerate the official staged bundle before rerunning this proof."
fi

if ! unzip -Z1 "${ARCHIVE_PATH}" > "${ARCHIVE_CONTENTS_PATH}" 2>> "${DIST_STDERR_PATH}"; then
  fail "Malformed standalone analyzer archive at ${ARCHIVE_RELATIVE_PATH}; unzip could not read the archive structure."
fi

assert_archive_entry 'yanote-analyzer/'
assert_archive_entry 'yanote-analyzer/bin/yanote'
assert_archive_entry 'yanote-analyzer/lib/yanote.cjs'
assert_archive_entry 'yanote-analyzer/VERSION'
assert_archive_entry 'yanote-analyzer/package.json'
assert_archive_entry 'yanote-analyzer/package-lock.json'

rm -rf "${EXTRACT_DIR}"
mkdir -p "${EXTRACT_DIR}"
if ! unzip -q "${ARCHIVE_PATH}" -d "${EXTRACT_DIR}" 2>> "${DIST_STDERR_PATH}"; then
  fail "Malformed standalone analyzer archive at ${ARCHIVE_RELATIVE_PATH}; extraction failed before launcher verification."
fi

[[ -d "${EXTRACTED_BUNDLE_DIR}" ]] || fail "Malformed standalone analyzer archive at ${ARCHIVE_RELATIVE_PATH}: missing extracted bundle root ${EXTRACTED_BUNDLE_DIR}."
[[ -x "${LAUNCHER_PATH}" ]] || fail "Missing extracted standalone launcher at ${LAUNCHER_PATH}."
[[ -f "${RUNTIME_PATH}" ]] || fail "Missing extracted bundled runtime at ${RUNTIME_PATH}."
[[ -f "${VERSION_PATH}" ]] || fail "Missing extracted standalone version metadata at ${VERSION_PATH}."
[[ -f "${PACKAGE_JSON_PATH}" ]] || fail "Missing extracted standalone package metadata at ${PACKAGE_JSON_PATH}."

python3 - "${EXTRACTED_BUNDLE_DIR}" "${BUNDLE_LAYOUT_PATH}" <<'PY'
from pathlib import Path
import sys

bundle_dir = Path(sys.argv[1])
out_path = Path(sys.argv[2])
entries = []
for path in sorted(bundle_dir.rglob('*')):
    rel = path.relative_to(bundle_dir)
    if rel.parts and len(rel.parts) <= 2:
        suffix = '/' if path.is_dir() else ''
        entries.append(f"{rel.as_posix()}{suffix}")
out_path.write_text("\n".join(entries) + "\n", encoding="utf-8")
PY
EXTRACTED_LAYOUT_READY="true"
write_manifest
write_source_paths_note

echo "Running the extracted standalone launcher --version from the retained proof workspace..."
if run_with_timeout \
  "${VERSION_TIMEOUT_SECONDS}" \
  "${RUN_DIR}" \
  "${VERSION_STDOUT_PATH}" \
  "${VERSION_STDERR_PATH}" \
  "${LAUNCHER_PATH}" --version; then
  VERSION_EXIT_CODE="0"
else
  VERSION_EXIT_CODE="$?"
fi
printf '%s\n' "${VERSION_EXIT_CODE}" > "${VERSION_EXIT_CODE_PATH}"
write_manifest

if [[ "${VERSION_EXIT_CODE}" == "124" ]]; then
  fail "Extracted standalone launcher timed out on --version after ${VERSION_TIMEOUT_SECONDS}s; inspect ${VERSION_STDOUT_PATH} and ${VERSION_STDERR_PATH}."
fi
if [[ "${VERSION_EXIT_CODE}" != "0" ]]; then
  fail "Extracted standalone launcher exited with ${VERSION_EXIT_CODE} for --version; inspect ${VERSION_STDOUT_PATH} and ${VERSION_STDERR_PATH}."
fi

echo "Running the extracted standalone launcher report command against stable fixture inputs..."
if run_with_timeout \
  "${REPORT_TIMEOUT_SECONDS}" \
  "${RUN_DIR}" \
  "${REPORT_STDOUT_PATH}" \
  "${REPORT_STDERR_PATH}" \
  "${LAUNCHER_PATH}" report \
    --spec "${SPEC_FIXTURE_PATH}" \
    --events "${EVENTS_FIXTURE_PATH}" \
    --out "${REPORT_OUT_DIR}" \
    --profile local; then
  REPORT_EXIT_CODE="0"
else
  REPORT_EXIT_CODE="$?"
fi
printf '%s\n' "${REPORT_EXIT_CODE}" > "${REPORT_EXIT_CODE_PATH}"
write_manifest

if [[ "${REPORT_EXIT_CODE}" == "124" ]]; then
  fail "Extracted standalone launcher timed out on report after ${REPORT_TIMEOUT_SECONDS}s; inspect ${REPORT_STDOUT_PATH}, ${REPORT_STDERR_PATH}, and ${REPORT_OUT_DIR}."
fi
if [[ "${REPORT_EXIT_CODE}" != "0" ]]; then
  fail "Extracted standalone launcher exited with ${REPORT_EXIT_CODE} for report; inspect ${REPORT_STDOUT_PATH}, ${REPORT_STDERR_PATH}, and ${REPORT_OUT_DIR}."
fi

if [[ ! -f "${REPORT_JSON_PATH}" ]]; then
  fail "Extracted standalone launcher did not retain yanote-report.json at ${REPORT_JSON_PATH}."
fi
if [[ ! -f "${REPORT_HTML_PATH}" ]]; then
  fail "Extracted standalone launcher did not retain yanote-report.html at ${REPORT_HTML_PATH}."
fi
REPORT_JSON_FOUND="true"
REPORT_HTML_FOUND="true"

PROOF_SUMMARY="$(python3 - "${VERSION_PATH}" "${VERSION_STDOUT_PATH}" "${VERSION_STDERR_PATH}" "${REPORT_JSON_PATH}" "${REPORT_HTML_PATH}" "${REPORT_STDOUT_PATH}" "${REPORT_STDERR_PATH}" "${SPEC_FIXTURE_PATH}" <<'PY'
import json
from pathlib import Path
import sys

version_path = Path(sys.argv[1])
version_stdout_path = Path(sys.argv[2])
version_stderr_path = Path(sys.argv[3])
report_json_path = Path(sys.argv[4])
report_html_path = Path(sys.argv[5])
report_stdout_path = Path(sys.argv[6])
report_stderr_path = Path(sys.argv[7])
spec_fixture_path = sys.argv[8]

expected_version = version_path.read_text(encoding='utf-8').strip()
if not expected_version:
    raise SystemExit(f"Extracted standalone version metadata at {version_path} is empty")
if expected_version == '0.0.0':
    raise SystemExit(f"Extracted standalone version metadata at {version_path} is invalid: 0.0.0")

version_stdout = version_stdout_path.read_text(encoding='utf-8').strip()
version_stderr = version_stderr_path.read_text(encoding='utf-8')
if version_stdout != expected_version:
    raise SystemExit(f"Expected --version to print {expected_version!r}, got {version_stdout!r}")
if version_stderr != '':
    raise SystemExit('Expected --version stderr to remain empty on the happy path')

report_stdout = report_stdout_path.read_text(encoding='utf-8')
report_stderr = report_stderr_path.read_text(encoding='utf-8')
report = json.loads(report_json_path.read_text(encoding='utf-8'))
report_html = report_html_path.read_text(encoding='utf-8')

if report_stderr != '':
    raise SystemExit('Expected report stderr to remain empty on the happy path')

summary_lines = [line for line in report_stdout.splitlines() if line.startswith('YANOTE_SUMMARY ')]
if len(summary_lines) != 1:
    raise SystemExit(f"Expected exactly one YANOTE_SUMMARY line, got {len(summary_lines)}")
summary_line = summary_lines[0]
non_empty_lines = [line for line in report_stdout.splitlines() if line.strip()]
if not non_empty_lines or non_empty_lines[-1] != summary_line:
    raise SystemExit('Expected YANOTE_SUMMARY to be the final non-empty report stdout line')

for token in [
    'status=partial',
    'operations=100.00',
    f'spec_source_ref="{spec_fixture_path}"',
    f'report={report_json_path}',
    'primary=none',
]:
    if token not in summary_line:
        raise SystemExit(f"Expected report summary line to contain {token!r}")

if report.get('toolVersion') != expected_version:
    raise SystemExit(f"Expected toolVersion {expected_version!r}, got {report.get('toolVersion')!r}")
if report.get('status') != 'partial':
    raise SystemExit(f"Expected report status 'partial', got {report.get('status')!r}")
summary = report.get('summary', {})
if summary.get('totalOperations') != 4:
    raise SystemExit(f"Expected totalOperations=4, got {summary.get('totalOperations')!r}")
if summary.get('coveredOperations') != 4:
    raise SystemExit(f"Expected coveredOperations=4, got {summary.get('coveredOperations')!r}")
if summary.get('operationCoveragePercent') != 100:
    raise SystemExit(f"Expected operationCoveragePercent=100, got {summary.get('operationCoveragePercent')!r}")
if report.get('specSource') != {'kind': 'local-file', 'reference': spec_fixture_path}:
    raise SystemExit(f"Unexpected specSource payload: {report.get('specSource')!r}")

for fragment in ['yanote-report.html', 'specSource reference', spec_fixture_path, expected_version]:
    if fragment not in report_html:
        raise SystemExit(f"Expected report HTML to contain {fragment!r}")

print(
    'version=%s report_status=%s operations=%s/%s report=%s html=%s'
    % (
        expected_version,
        report.get('status'),
        summary.get('coveredOperations'),
        summary.get('totalOperations'),
        report_json_path,
        report_html_path,
    )
)
PY
)" || fail "Extracted standalone launcher proof assertions failed."

EXPECTED_VERSION="$(python3 - "${VERSION_PATH}" <<'PY'
from pathlib import Path
import sys
print(Path(sys.argv[1]).read_text(encoding='utf-8').strip())
PY
)"
VERSION_OUTPUT="$(python3 - "${VERSION_STDOUT_PATH}" <<'PY'
from pathlib import Path
import sys
print(Path(sys.argv[1]).read_text(encoding='utf-8').strip())
PY
)"
REPORT_STATUS="partial"
SUMMARY_TOKEN_STATUS="present"
PROOF_STATUS="success"
write_manifest
write_source_paths_note

echo "Standalone staged-bundle proof passed: ${PROOF_SUMMARY}"
print_artifacts
