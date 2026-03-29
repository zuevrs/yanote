#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-s02-analysis.XXXXXX")"
ANALYZER_GUIDE_PATH="${ROOT_DIR}/docs/guides/analyzer-coverage.md"
ARCHIVE_PATH="${ROOT_DIR}/build/distributions/yanote-analyzer.zip"
EXTRACT_DIR="${TMP_DIR}/extract"
BUNDLE_DIR="${EXTRACT_DIR}/yanote-analyzer"
LAUNCHER_PATH="${BUNDLE_DIR}/bin/yanote"
VERSION_STDOUT_PATH="${TMP_DIR}/version.stdout"
VERSION_STDERR_PATH="${TMP_DIR}/version.stderr"
REPORT_STDOUT_PATH="${TMP_DIR}/report.stdout"
REPORT_STDERR_PATH="${TMP_DIR}/report.stderr"
REPORT_OUT_DIR="${TMP_DIR}/out"
REPORT_JSON_PATH="${REPORT_OUT_DIR}/yanote-report.json"
REPORT_HTML_PATH="${REPORT_OUT_DIR}/yanote-report.html"
SPEC_PATH="${ROOT_DIR}/yanote-js/test/fixtures/openapi/simple.yaml"
EVENTS_PATH="${ROOT_DIR}/yanote-js/test/fixtures/events/events.ci.fixture.jsonl"
KEEP_TEMP="false"

fail() {
  echo "ERROR: $1" >&2
  KEEP_TEMP="true"
  if [[ -s "${VERSION_STDERR_PATH}" ]]; then
    echo "--- version.stderr (tail) ---" >&2
    tail -n 40 "${VERSION_STDERR_PATH}" >&2 || true
  fi
  if [[ -s "${REPORT_STDERR_PATH}" ]]; then
    echo "--- report.stderr (tail) ---" >&2
    tail -n 60 "${REPORT_STDERR_PATH}" >&2 || true
  fi
  echo "Retained artifacts: ${TMP_DIR}" >&2
  exit 1
}

cleanup() {
  if [[ "${KEEP_TEMP}" != "true" ]]; then
    rm -rf "${TMP_DIR}"
  fi
}
trap cleanup EXIT

require_file() {
  local path="$1"
  [[ -f "$path" ]] || fail "Missing required file: ${path}"
}

require_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  grep -Fq -- "$needle" "$path" || fail "${path} is missing ${label}: ${needle}"
}

reject_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if grep -Fq -- "$needle" "$path"; then
    fail "${path} still contains stale ${label}: ${needle}"
  fi
}

require_file "${ANALYZER_GUIDE_PATH}"
require_file "${ARCHIVE_PATH}"
require_file "${SPEC_PATH}"
require_file "${EVENTS_PATH}"

require_contains "${ANALYZER_GUIDE_PATH}" 'yanote-analyzer.zip' "standalone bundle wording"
require_contains "${ANALYZER_GUIDE_PATH}" './gradlew distStandaloneAnalyzer' "repo-local bundle build command"
require_contains "${ANALYZER_GUIDE_PATH}" 'build/distributions/yanote-analyzer.zip' "standalone archive path"
require_contains "${ANALYZER_GUIDE_PATH}" './yanote-analyzer/bin/yanote' "standalone launcher path"
require_contains "${ANALYZER_GUIDE_PATH}" '"${YANOTE}" report' "launcher-based report command"
require_contains "${ANALYZER_GUIDE_PATH}" '../release-and-support.md' "release/support boundary link"
reject_contains "${ANALYZER_GUIDE_PATH}" 'node yanote-js/dist/yanote.cjs report' "raw analyzer report command"
reject_contains "${ANALYZER_GUIDE_PATH}" 'npm -C yanote-js ci' "source-build install command"
reject_contains "${ANALYZER_GUIDE_PATH}" 'npm -C yanote-js run build' "source-build install command"

rm -rf "${EXTRACT_DIR}"
mkdir -p "${EXTRACT_DIR}" "${REPORT_OUT_DIR}"
if ! unzip -q "${ARCHIVE_PATH}" -d "${EXTRACT_DIR}"; then
  fail "Failed to extract standalone analyzer archive from ${ARCHIVE_PATH}."
fi

[[ -x "${LAUNCHER_PATH}" ]] || fail "Standalone analyzer launcher is missing at ${LAUNCHER_PATH}."

if ! "${LAUNCHER_PATH}" --version >"${VERSION_STDOUT_PATH}" 2>"${VERSION_STDERR_PATH}"; then
  fail "Standalone launcher failed on --version."
fi

if [[ -s "${VERSION_STDERR_PATH}" ]]; then
  fail "Standalone launcher unexpectedly wrote to stderr for --version."
fi

VERSION_OUTPUT="$(tr -d '\r\n' < "${VERSION_STDOUT_PATH}")"
if [[ -z "${VERSION_OUTPUT}" || "${VERSION_OUTPUT}" == "0.0.0" ]]; then
  fail "Standalone launcher returned invalid version output: ${VERSION_OUTPUT}"
fi

if ! "${LAUNCHER_PATH}" report \
  --spec "${SPEC_PATH}" \
  --events "${EVENTS_PATH}" \
  --out "${REPORT_OUT_DIR}" \
  --profile local >"${REPORT_STDOUT_PATH}" 2>"${REPORT_STDERR_PATH}"; then
  fail "Standalone launcher report command failed."
fi

if [[ -s "${REPORT_STDERR_PATH}" ]]; then
  fail "Standalone launcher unexpectedly wrote to stderr for the happy-path report."
fi

[[ -f "${REPORT_JSON_PATH}" ]] || fail "Missing report JSON at ${REPORT_JSON_PATH}."
[[ -f "${REPORT_HTML_PATH}" ]] || fail "Missing report HTML at ${REPORT_HTML_PATH}."

grep -q '^Summary$' "${REPORT_STDOUT_PATH}" || fail "Report stdout is missing the Summary section."
grep -q '^HTTP Payload Conformance$' "${REPORT_STDOUT_PATH}" || fail "Report stdout is missing the HTTP Payload Conformance section."
grep -q '^YANOTE_SUMMARY ' "${REPORT_STDOUT_PATH}" || fail "Report stdout is missing the final YANOTE_SUMMARY line."

grep -Fq 'payload_diagnostics=covered:0,uncovered:0,skipped:0' "${REPORT_STDOUT_PATH}" || fail "Report stdout is missing the expected payload diagnostic summary for the stable fixture path."

python3 - "${REPORT_JSON_PATH}" "${REPORT_HTML_PATH}" "${VERSION_OUTPUT}" "${SPEC_PATH}" <<'PY'
import json
import pathlib
import sys

report_path = pathlib.Path(sys.argv[1])
html_path = pathlib.Path(sys.argv[2])
expected_version = sys.argv[3]
expected_spec = sys.argv[4]
report = json.loads(report_path.read_text(encoding='utf-8'))
html = html_path.read_text(encoding='utf-8')
summary = report.get('summary', {})

if report.get('toolVersion') != expected_version:
    raise SystemExit(f"Expected toolVersion {expected_version!r}, got {report.get('toolVersion')!r}")
if report.get('status') != 'partial':
    raise SystemExit(f"Expected report status 'partial', got {report.get('status')!r}")
if summary.get('totalOperations') != 4:
    raise SystemExit(f"Expected totalOperations=4, got {summary.get('totalOperations')!r}")
if summary.get('coveredOperations') != 4:
    raise SystemExit(f"Expected coveredOperations=4, got {summary.get('coveredOperations')!r}")
if summary.get('operationCoveragePercent') != 100:
    raise SystemExit(f"Expected operationCoveragePercent=100, got {summary.get('operationCoveragePercent')!r}")
if report.get('specSource') != {'kind': 'local-file', 'reference': expected_spec}:
    raise SystemExit(f"Unexpected specSource payload: {report.get('specSource')!r}")
counts = report.get('httpPayloadConformance', {}).get('diagnostics', {}).get('counts')
if counts != {'covered': 0, 'uncovered': 0, 'skipped': 0}:
    raise SystemExit(f"Unexpected payload diagnostic counts: {counts!r}")
for fragment in ['yanote-report.html', 'specSource reference', expected_spec, expected_version]:
    if fragment not in html:
        raise SystemExit(f"Expected report HTML to contain {fragment!r}")
PY

echo "S02 analysis path verification passed: analyzer guide points to the standalone bundle and the extracted launcher reports successfully from the official archive contract."