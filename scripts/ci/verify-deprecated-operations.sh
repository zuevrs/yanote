#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

ARTIFACT_DIR=".yanote-ci/deprecated-operations-proof"
BUILD_LOG_PATH="${ARTIFACT_DIR}/yanote-js-build.log"
CLI_REPORT_DIR="${ARTIFACT_DIR}/cli-report"
REPORT_STDOUT_PATH="${CLI_REPORT_DIR}/stdout.txt"
REPORT_STDERR_PATH="${CLI_REPORT_DIR}/stderr.txt"
REPORT_EXIT_CODE_PATH="${CLI_REPORT_DIR}/exit-code.txt"
REPORT_OUT_DIR="${CLI_REPORT_DIR}/out"
REPORT_JSON_PATH="${REPORT_OUT_DIR}/yanote-report.json"
REPORT_HTML_PATH="${REPORT_OUT_DIR}/yanote-report.html"
MANIFEST_NAME="artifact-manifest.txt"
MANIFEST_PATH="${ARTIFACT_DIR}/${MANIFEST_NAME}"
FIXTURE_SPEC="yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml"
FIXTURE_EVENTS="yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl"

print_artifacts() {
  echo "Artifacts retained at: ${ARTIFACT_DIR}" >&2
  echo "  build_log: ${BUILD_LOG_PATH}" >&2
  echo "  manifest: ${MANIFEST_PATH}" >&2
  echo "  stdout: ${REPORT_STDOUT_PATH}" >&2
  echo "  stderr: ${REPORT_STDERR_PATH}" >&2
  echo "  report_json: ${REPORT_JSON_PATH}" >&2
  echo "  report_html: ${REPORT_HTML_PATH}" >&2
}

show_failure_tail() {
  local file
  for file in "${BUILD_LOG_PATH}" "${REPORT_STDERR_PATH}" "${REPORT_STDOUT_PATH}"; do
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

run_report() {
  local exit_code=0
  mkdir -p "${CLI_REPORT_DIR}" "${REPORT_OUT_DIR}"

  if node yanote-js/dist/yanote.cjs report \
    --spec "${FIXTURE_SPEC}" \
    --events "${FIXTURE_EVENTS}" \
    --out "${REPORT_OUT_DIR}" \
    --profile local >"${REPORT_STDOUT_PATH}" 2>"${REPORT_STDERR_PATH}"; then
    exit_code=0
  else
    exit_code=$?
  fi

  printf '%s\n' "${exit_code}" >"${REPORT_EXIT_CODE_PATH}"

  if [[ "${exit_code}" -ne 0 ]]; then
    fail "yanote report exited with ${exit_code}; expected success for the deprecated-operations proof."
  fi
}

rm -rf "${ARTIFACT_DIR}"
mkdir -p "${CLI_REPORT_DIR}" "${REPORT_OUT_DIR}"

echo "Building yanote-js CLI for deprecated-operations proof..."
if ! npm -C yanote-js run build >"${BUILD_LOG_PATH}" 2>&1; then
  fail "yanote-js build failed for the deprecated-operations proof."
fi

[[ -f "yanote-js/dist/yanote.cjs" ]] || fail "yanote-js build did not produce dist/yanote.cjs."

echo "Running yanote report against deprecated-operation fixtures..."
run_report

[[ -f "${REPORT_JSON_PATH}" ]] || fail "yanote report did not produce yanote-report.json."
[[ -f "${REPORT_HTML_PATH}" ]] || fail "yanote report did not produce yanote-report.html."
if [[ -s "${REPORT_STDERR_PATH}" ]]; then
  fail "yanote report stderr should remain empty for the deprecated-operations proof."
fi
if ! grep -q '^YANOTE_SUMMARY ' "${REPORT_STDOUT_PATH}"; then
  fail "yanote report stdout is missing the final YANOTE_SUMMARY line."
fi

python3 - "${ARTIFACT_DIR}" "${REPORT_STDOUT_PATH}" "${REPORT_JSON_PATH}" "${FIXTURE_SPEC}" <<'PY' || fail "Deprecated-operations proof assertions failed."
import json
import pathlib
import sys

artifact_dir = pathlib.Path(sys.argv[1])
stdout_path = pathlib.Path(sys.argv[2])
report_path = pathlib.Path(sys.argv[3])
fixture_spec = sys.argv[4]

stdout = stdout_path.read_text(encoding="utf-8")
report = json.loads(report_path.read_text(encoding="utf-8"))
summary_lines = [line for line in stdout.splitlines() if line.startswith("YANOTE_SUMMARY ")]
if len(summary_lines) != 1:
    raise SystemExit(f"Expected exactly one YANOTE_SUMMARY line, got {len(summary_lines)}")
summary_line = summary_lines[0]

required_stdout_fragments = [
    "- status: partial",
    "- operations: 2/3 (66.67%)",
    "- deprecated operations: covered=0/1 uncovered=1 (0.00%)",
    f"- spec source: local-file ({fixture_spec})",
    "- low: http GET /legacy-users - deprecated operation is uncovered",
]
for fragment in required_stdout_fragments:
    if fragment not in stdout:
        raise SystemExit(f"stdout is missing expected fragment: {fragment}")

for token in [
    "status=partial",
    "operations=66.67",
    "deprecated_operations=0.00",
    "deprecated_total=1",
    "deprecated_covered=0",
    "deprecated_uncovered=1",
    "spec_source_kind=local-file",
    f'spec_source_ref="{fixture_spec}"',
    "covered=2/3",
    "primary=none",
]:
    if token not in summary_line:
        raise SystemExit(f"YANOTE_SUMMARY is missing token {token!r}")

for forbidden in ["YANOTE_ASYNC_SUMMARY", "yanote-async-report.json", "<html", "dashboard"]:
    if forbidden in stdout:
        raise SystemExit(f"stdout leaked non-HTTP proof surface {forbidden!r}")

if report.get("status") != "partial":
    raise SystemExit(f"Expected report status 'partial', got {report.get('status')!r}")
summary = report.get("summary", {})
if summary.get("totalOperations") != 3:
    raise SystemExit(f"Expected totalOperations=3, got {summary.get('totalOperations')!r}")
if summary.get("coveredOperations") != 2:
    raise SystemExit(f"Expected coveredOperations=2, got {summary.get('coveredOperations')!r}")
if summary.get("operationCoveragePercent") != 66.67:
    raise SystemExit(f"Expected operationCoveragePercent=66.67, got {summary.get('operationCoveragePercent')!r}")
if summary.get("aggregateCoveragePercent") is not None:
    raise SystemExit("Expected aggregateCoveragePercent to remain null")
if summary.get("aggregateExplanation") != "aggregate is N/A because weighted dimensions include N/A":
    raise SystemExit(f"Unexpected aggregateExplanation: {summary.get('aggregateExplanation')!r}")
if summary.get("deprecatedOperations") != {
    "totalOperations": 1,
    "coveredOperations": 0,
    "uncoveredOperations": 1,
    "operationCoveragePercent": 0,
}:
    raise SystemExit(f"Unexpected deprecatedOperations summary: {summary.get('deprecatedOperations')!r}")
if report.get("specSource") != {"kind": "local-file", "reference": fixture_spec}:
    raise SystemExit(f"Unexpected specSource: {report.get('specSource')!r}")

expected_per_operation = [
    {"operationKey": "http GET /legacy-users", "deprecated": True},
    {"operationKey": "http GET /users", "deprecated": False},
    {"operationKey": "http POST /users", "deprecated": False},
]
actual_per_operation = [
    {"operationKey": entry.get("operationKey"), "deprecated": entry.get("deprecated")}
    for entry in report.get("coverage", {}).get("perOperation", [])
]
if actual_per_operation != expected_per_operation:
    raise SystemExit(f"Unexpected perOperation deprecated flags: {actual_per_operation!r}")

PY

cat >"${MANIFEST_PATH}" <<EOF
created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
artifact_dir=${ARTIFACT_DIR}
command=host:node yanote-js/dist/yanote.cjs report --spec ${FIXTURE_SPEC} --events ${FIXTURE_EVENTS} --out ${REPORT_OUT_DIR} --profile local
stdout=cli-report/stdout.txt
stderr=cli-report/stderr.txt
exit_code_file=cli-report/exit-code.txt
report_json=cli-report/out/yanote-report.json
report_html=cli-report/out/yanote-report.html
legacy_operations=2/3
deprecated_operations=0/1
deprecated_total=1
deprecated_covered=0
deprecated_uncovered=1
http_only=true
html_artifacts_present=true
async_artifacts_present=false
dashboard_artifacts_present=false
EOF

python3 - "${ARTIFACT_DIR}" <<'PY' || fail "Deprecated-operations proof bundle layout check failed."
import pathlib
import sys

artifact_dir = pathlib.Path(sys.argv[1])
expected_files = sorted([
    "artifact-manifest.txt",
    "cli-report/exit-code.txt",
    "cli-report/out/yanote-report.html",
    "cli-report/out/yanote-report.json",
    "cli-report/stderr.txt",
    "cli-report/stdout.txt",
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

echo "Deprecated-operations proof bundle ready at ${ARTIFACT_DIR}."
print_artifacts
