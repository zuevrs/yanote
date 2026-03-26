#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

ARTIFACT_DIR=".yanote-ci/static-html-reports-proof"
BUILD_LOG_PATH="${ARTIFACT_DIR}/yanote-js-build.log"
MANIFEST_NAME="artifact-manifest.txt"
MANIFEST_PATH="${ARTIFACT_DIR}/${MANIFEST_NAME}"

HTTP_REPORT_DIR="${ARTIFACT_DIR}/http-report"
HTTP_STDOUT_PATH="${HTTP_REPORT_DIR}/stdout.txt"
HTTP_STDERR_PATH="${HTTP_REPORT_DIR}/stderr.txt"
HTTP_EXIT_CODE_PATH="${HTTP_REPORT_DIR}/exit-code.txt"
HTTP_OUT_DIR="${HTTP_REPORT_DIR}/out"
HTTP_JSON_PATH="${HTTP_OUT_DIR}/yanote-report.json"
HTTP_HTML_PATH="${HTTP_OUT_DIR}/yanote-report.html"
HTTP_FIXTURE_SPEC="yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml"
HTTP_FIXTURE_EVENTS="yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl"

ASYNC_REPORT_DIR="${ARTIFACT_DIR}/async-report"
ASYNC_STDOUT_PATH="${ASYNC_REPORT_DIR}/stdout.txt"
ASYNC_STDERR_PATH="${ASYNC_REPORT_DIR}/stderr.txt"
ASYNC_EXIT_CODE_PATH="${ASYNC_REPORT_DIR}/exit-code.txt"
ASYNC_OUT_DIR="${ASYNC_REPORT_DIR}/out"
ASYNC_JSON_PATH="${ASYNC_OUT_DIR}/yanote-async-report.json"
ASYNC_HTML_PATH="${ASYNC_OUT_DIR}/yanote-async-report.html"
ASYNC_FIXTURE_SPEC="yanote-js/test/fixtures/asyncapi/v3.yaml"
ASYNC_FIXTURE_EVENTS="yanote-js/test/fixtures/async-events/partial.fixture.jsonl"

print_artifacts() {
  echo "Artifacts retained at: ${ARTIFACT_DIR}" >&2
  echo "  build_log: ${BUILD_LOG_PATH}" >&2
  echo "  manifest: ${MANIFEST_PATH}" >&2
  echo "  http_stdout: ${HTTP_STDOUT_PATH}" >&2
  echo "  http_stderr: ${HTTP_STDERR_PATH}" >&2
  echo "  http_json: ${HTTP_JSON_PATH}" >&2
  echo "  http_html: ${HTTP_HTML_PATH}" >&2
  echo "  async_stdout: ${ASYNC_STDOUT_PATH}" >&2
  echo "  async_stderr: ${ASYNC_STDERR_PATH}" >&2
  echo "  async_json: ${ASYNC_JSON_PATH}" >&2
  echo "  async_html: ${ASYNC_HTML_PATH}" >&2
}

show_failure_tail() {
  local file
  for file in "${BUILD_LOG_PATH}" "${HTTP_STDERR_PATH}" "${HTTP_STDOUT_PATH}" "${ASYNC_STDERR_PATH}" "${ASYNC_STDOUT_PATH}"; do
    if [[ -s "${file}" ]]; then
      echo "--- $(basename "${file}") (tail) ---" >&2
      tail -n 80 "${file}" >&2 || true
    fi
  done
}

fail() {
  local message="$1"
  echo "ERROR: ${message}" >&2
  show_failure_tail
  print_artifacts
  exit 1
}

run_http_report() {
  local exit_code=0
  mkdir -p "${HTTP_REPORT_DIR}" "${HTTP_OUT_DIR}"

  if node yanote-js/dist/yanote.cjs report \
    --spec "${HTTP_FIXTURE_SPEC}" \
    --events "${HTTP_FIXTURE_EVENTS}" \
    --out "${HTTP_OUT_DIR}" \
    --profile local >"${HTTP_STDOUT_PATH}" 2>"${HTTP_STDERR_PATH}"; then
    exit_code=0
  else
    exit_code=$?
  fi

  printf '%s\n' "${exit_code}" >"${HTTP_EXIT_CODE_PATH}"

  if [[ "${exit_code}" -ne 0 ]]; then
    fail "yanote report exited with ${exit_code}; expected success for the static HTML proof."
  fi
}

run_async_report() {
  local exit_code=0
  mkdir -p "${ASYNC_REPORT_DIR}" "${ASYNC_OUT_DIR}"

  if node yanote-js/dist/yanote.cjs async-report \
    --spec "${ASYNC_FIXTURE_SPEC}" \
    --events "${ASYNC_FIXTURE_EVENTS}" \
    --out "${ASYNC_OUT_DIR}" \
    --profile local >"${ASYNC_STDOUT_PATH}" 2>"${ASYNC_STDERR_PATH}"; then
    exit_code=0
  else
    exit_code=$?
  fi

  printf '%s\n' "${exit_code}" >"${ASYNC_EXIT_CODE_PATH}"

  if [[ "${exit_code}" -ne 0 ]]; then
    fail "yanote async-report exited with ${exit_code}; expected success for the static HTML proof."
  fi
}

rm -rf "${ARTIFACT_DIR}"
mkdir -p "${HTTP_REPORT_DIR}" "${HTTP_OUT_DIR}" "${ASYNC_REPORT_DIR}" "${ASYNC_OUT_DIR}"

echo "Building yanote-js CLI for static HTML proof..."
if ! npm -C yanote-js run build >"${BUILD_LOG_PATH}" 2>&1; then
  fail "yanote-js build failed for the static HTML proof."
fi

[[ -f "yanote-js/dist/yanote.cjs" ]] || fail "yanote-js build did not produce dist/yanote.cjs."

echo "Running yanote report against deprecated HTTP fixtures..."
run_http_report

echo "Running yanote async-report against partial AsyncAPI fixtures..."
run_async_report

[[ -f "${HTTP_JSON_PATH}" ]] || fail "yanote report did not produce yanote-report.json."
[[ -f "${HTTP_HTML_PATH}" ]] || fail "yanote report did not produce yanote-report.html."
[[ -f "${ASYNC_JSON_PATH}" ]] || fail "yanote async-report did not produce yanote-async-report.json."
[[ -f "${ASYNC_HTML_PATH}" ]] || fail "yanote async-report did not produce yanote-async-report.html."

if [[ -s "${HTTP_STDERR_PATH}" ]]; then
  fail "yanote report stderr should remain empty for the static HTML proof."
fi
if [[ -s "${ASYNC_STDERR_PATH}" ]]; then
  fail "yanote async-report stderr should remain empty for the static HTML proof."
fi
if ! grep -q '^YANOTE_SUMMARY ' "${HTTP_STDOUT_PATH}"; then
  fail "yanote report stdout is missing the final YANOTE_SUMMARY line."
fi
if ! grep -q '^YANOTE_ASYNC_SUMMARY ' "${ASYNC_STDOUT_PATH}"; then
  fail "yanote async-report stdout is missing the final YANOTE_ASYNC_SUMMARY line."
fi

python3 - \
  "${HTTP_STDOUT_PATH}" \
  "${HTTP_STDERR_PATH}" \
  "${HTTP_JSON_PATH}" \
  "${HTTP_HTML_PATH}" \
  "${HTTP_FIXTURE_SPEC}" \
  "${ASYNC_STDOUT_PATH}" \
  "${ASYNC_STDERR_PATH}" \
  "${ASYNC_JSON_PATH}" \
  "${ASYNC_HTML_PATH}" \
  "${ASYNC_FIXTURE_SPEC}" <<'PY' || fail "Static HTML proof assertions failed."
import json
import pathlib
import sys

http_stdout_path = pathlib.Path(sys.argv[1])
http_stderr_path = pathlib.Path(sys.argv[2])
http_json_path = pathlib.Path(sys.argv[3])
http_html_path = pathlib.Path(sys.argv[4])
http_fixture_spec = sys.argv[5]
async_stdout_path = pathlib.Path(sys.argv[6])
async_stderr_path = pathlib.Path(sys.argv[7])
async_json_path = pathlib.Path(sys.argv[8])
async_html_path = pathlib.Path(sys.argv[9])
async_fixture_spec = sys.argv[10]

http_stdout = http_stdout_path.read_text(encoding="utf-8")
http_stderr = http_stderr_path.read_text(encoding="utf-8")
http_report = json.loads(http_json_path.read_text(encoding="utf-8"))
http_html = http_html_path.read_text(encoding="utf-8")
async_stdout = async_stdout_path.read_text(encoding="utf-8")
async_stderr = async_stderr_path.read_text(encoding="utf-8")
async_report = json.loads(async_json_path.read_text(encoding="utf-8"))
async_html = async_html_path.read_text(encoding="utf-8")

if http_stderr != "":
    raise SystemExit("HTTP stderr was expected to be empty")
if async_stderr != "":
    raise SystemExit("Async stderr was expected to be empty")

http_summary_lines = [line for line in http_stdout.splitlines() if line.startswith("YANOTE_SUMMARY ")]
if len(http_summary_lines) != 1:
    raise SystemExit(f"Expected exactly one YANOTE_SUMMARY line, got {len(http_summary_lines)}")
http_summary_line = http_summary_lines[0]

async_summary_lines = [line for line in async_stdout.splitlines() if line.startswith("YANOTE_ASYNC_SUMMARY ")]
if len(async_summary_lines) != 1:
    raise SystemExit(f"Expected exactly one YANOTE_ASYNC_SUMMARY line, got {len(async_summary_lines)}")
async_summary_line = async_summary_lines[0]

for fragment in [
    "- status: partial",
    "- operations: 2/3 (66.67%)",
    "- deprecated operations: covered=0/1 uncovered=1 (0.00%)",
    f"- spec source: local-file ({http_fixture_spec})",
    "- low: http GET /legacy-users - deprecated operation is uncovered",
]:
    if fragment not in http_stdout:
        raise SystemExit(f"HTTP stdout is missing expected fragment: {fragment}")

for token in [
    "status=partial",
    "operations=66.67",
    "deprecated_operations=0.00",
    "deprecated_total=1",
    "deprecated_covered=0",
    "deprecated_uncovered=1",
    "spec_source_kind=local-file",
    f'spec_source_ref="{http_fixture_spec}"',
    "covered=2/3",
    "primary=none",
]:
    if token not in http_summary_line:
        raise SystemExit(f"HTTP YANOTE_SUMMARY is missing token {token!r}")

for fragment in [
    "- status: partial",
    "- channels: 1/2 (50.00%)",
    "- operations: 1/2 (50.00%)",
    "- messages: 1/2 (50.00%)",
    f"- spec source: local-file ({async_fixture_spec})",
    "- low: users.deleted - channel is uncovered",
    "- low: kafka receive users.deleted - async operation is uncovered",
]:
    if fragment not in async_stdout:
        raise SystemExit(f"Async stdout is missing expected fragment: {fragment}")

for token in [
    "status=partial",
    "channels=50.00",
    "operations=50.00",
    "messages=50.00",
    "covered_channels=1/2",
    "covered_operations=1/2",
    "covered_messages=1/2",
    "spec_source_kind=local-file",
    f'spec_source_ref="{async_fixture_spec}"',
    "primary=none",
    'primary_reason="none"',
]:
    if token not in async_summary_line:
        raise SystemExit(f"Async YANOTE_ASYNC_SUMMARY is missing token {token!r}")

if http_report.get("status") != "partial":
    raise SystemExit(f"Expected HTTP report status 'partial', got {http_report.get('status')!r}")
http_summary = http_report.get("summary", {})
if http_summary.get("totalOperations") != 3:
    raise SystemExit(f"Expected HTTP totalOperations=3, got {http_summary.get('totalOperations')!r}")
if http_summary.get("coveredOperations") != 2:
    raise SystemExit(f"Expected HTTP coveredOperations=2, got {http_summary.get('coveredOperations')!r}")
if http_summary.get("operationCoveragePercent") != 66.67:
    raise SystemExit(f"Expected HTTP operationCoveragePercent=66.67, got {http_summary.get('operationCoveragePercent')!r}")
if http_summary.get("deprecatedOperations") != {
    "totalOperations": 1,
    "coveredOperations": 0,
    "uncoveredOperations": 1,
    "operationCoveragePercent": 0,
}:
    raise SystemExit(f"Unexpected HTTP deprecatedOperations summary: {http_summary.get('deprecatedOperations')!r}")
if http_report.get("specSource") != {"kind": "local-file", "reference": http_fixture_spec}:
    raise SystemExit(f"Unexpected HTTP specSource: {http_report.get('specSource')!r}")

if async_report.get("status") != "partial":
    raise SystemExit(f"Expected async report status 'partial', got {async_report.get('status')!r}")
async_summary = async_report.get("summary", {})
if async_summary != {
    "totalChannels": 2,
    "coveredChannels": 1,
    "channelCoveragePercent": 50,
    "totalOperations": 2,
    "coveredOperations": 1,
    "operationCoveragePercent": 50,
    "totalMessages": 2,
    "coveredMessages": 1,
    "messageCoveragePercent": 50,
}:
    raise SystemExit(f"Unexpected async summary: {async_summary!r}")
if async_report.get("specSource") != {"kind": "local-file", "reference": async_fixture_spec}:
    raise SystemExit(f"Unexpected async specSource: {async_report.get('specSource')!r}")

for fragment in [
    "yanote-report.html",
    "Deprecated operations",
    "HTTP payload conformance",
    "specSource reference",
    http_fixture_spec,
    "66.67%",
    "Deprecated total",
    "http GET /legacy-users",
]:
    if fragment not in http_html:
        raise SystemExit(f"HTTP HTML is missing expected fragment: {fragment}")

for fragment in [
    "yanote-async-report.html",
    "Async coverage summary",
    "Channel coverage",
    "Operation coverage",
    "Message coverage",
    "specSource reference",
    async_fixture_spec,
    "50%",
    "users.deleted",
]:
    if fragment not in async_html:
        raise SystemExit(f"Async HTML is missing expected fragment: {fragment}")

http_domain_forbidden = [
    "YANOTE_ASYNC_SUMMARY",
    "yanote-async-report.html",
    "Async coverage summary",
    "Channel coverage",
    "Message coverage",
]
for forbidden in http_domain_forbidden:
    if forbidden in http_html or forbidden in http_stdout:
        raise SystemExit(f"HTTP retained artifacts leaked async-only surface {forbidden!r}")

async_domain_forbidden = [
    "YANOTE_SUMMARY",
    "yanote-report.html",
    "Deprecated operations",
    "HTTP payload conformance",
    "HTTP request conformance",
    "HTTP security conformance",
]
for forbidden in async_domain_forbidden:
    if forbidden in async_html or forbidden in async_stdout:
        raise SystemExit(f"Async retained artifacts leaked HTTP-only surface {forbidden!r}")

html_forbidden_fragments = [
    "<script",
    "<img",
    "<iframe",
    "<object",
    "<embed",
    "<link ",
    "url(",
    "http://",
    "https://",
    "file://",
]
for html_name, html in {"http_html": http_html, "async_html": async_html}.items():
    lowered = html.lower()
    for forbidden in html_forbidden_fragments:
        if forbidden in lowered:
            raise SystemExit(f"{html_name} contains forbidden external/self-hosted asset marker {forbidden!r}")

forbidden_markers = [
    "SECRET_",
    "observedValues",
    "requestBody",
    "responseBody",
    "test.run_id",
    '"kind":"http"',
    '"kind":"kafka"',
    "Bearer ",
    "Authorization",
    "combined-report",
    "combined report",
    "combined dashboard",
    "dashboard",
]
for payload_name, payload in {
    "http_stdout": http_stdout,
    "http_stderr": http_stderr,
    "http_json": json.dumps(http_report, sort_keys=True),
    "http_html": http_html,
    "async_stdout": async_stdout,
    "async_stderr": async_stderr,
    "async_json": json.dumps(async_report, sort_keys=True),
    "async_html": async_html,
}.items():
    lowered = payload.lower()
    for forbidden in forbidden_markers:
        needle = forbidden.lower()
        if needle in lowered:
            raise SystemExit(f"{payload_name} contains forbidden marker {forbidden!r}")
PY

cat >"${MANIFEST_PATH}" <<EOF
created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
artifact_dir=${ARTIFACT_DIR}
build_log=yanote-js-build.log
http_command=host:node yanote-js/dist/yanote.cjs report --spec ${HTTP_FIXTURE_SPEC} --events ${HTTP_FIXTURE_EVENTS} --out ${HTTP_OUT_DIR} --profile local
http_stdout=http-report/stdout.txt
http_stderr=http-report/stderr.txt
http_exit_code_file=http-report/exit-code.txt
http_report_json=http-report/out/yanote-report.json
http_report_html=http-report/out/yanote-report.html
http_status=partial
http_operations=2/3
http_deprecated_operations=0/1
http_spec_source=local-file (${HTTP_FIXTURE_SPEC})
async_command=host:node yanote-js/dist/yanote.cjs async-report --spec ${ASYNC_FIXTURE_SPEC} --events ${ASYNC_FIXTURE_EVENTS} --out ${ASYNC_OUT_DIR} --profile local
async_stdout=async-report/stdout.txt
async_stderr=async-report/stderr.txt
async_exit_code_file=async-report/exit-code.txt
async_report_json=async-report/out/yanote-async-report.json
async_report_html=async-report/out/yanote-async-report.html
async_status=partial
async_channels=1/2
async_operations=1/2
async_messages=1/2
async_spec_source=local-file (${ASYNC_FIXTURE_SPEC})
html_assets=inline-only
surfaces=separate-http-and-async
provenance=sanitized-spec-source-retained
sensitive_markers=absent
event_dump_markers=absent
out_of_scope_terms=absent
EOF

python3 - "${ARTIFACT_DIR}" <<'PY' || fail "Static HTML proof bundle layout check failed."
import pathlib
import sys

artifact_dir = pathlib.Path(sys.argv[1])
expected_files = sorted([
    "artifact-manifest.txt",
    "async-report/exit-code.txt",
    "async-report/out/yanote-async-report.html",
    "async-report/out/yanote-async-report.json",
    "async-report/stderr.txt",
    "async-report/stdout.txt",
    "http-report/exit-code.txt",
    "http-report/out/yanote-report.html",
    "http-report/out/yanote-report.json",
    "http-report/stderr.txt",
    "http-report/stdout.txt",
    "yanote-js-build.log",
])
actual_files = sorted(
    str(path.relative_to(artifact_dir))
    for path in artifact_dir.rglob("*")
    if path.is_file()
)
if actual_files != expected_files:
    raise SystemExit(f"Unexpected proof bundle layout: {actual_files!r}")
PY

echo "Static HTML proof bundle ready at ${ARTIFACT_DIR}."
print_artifacts
