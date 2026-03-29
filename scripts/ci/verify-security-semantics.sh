#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-m012-s02-security-semantics.XXXXXX")"
ANALYZER_BUILD_LOG_PATH="${TMP_DIR}/analyzer-build.log"
REPORT_STDOUT_PATH="${TMP_DIR}/report.stdout"
REPORT_STDERR_PATH="${TMP_DIR}/report.stderr"
REPORT_OUT_DIR="${TMP_DIR}/report-out"
REPORT_JSON_PATH="${REPORT_OUT_DIR}/yanote-report.json"
FIXTURE_SPEC="yanote-js/test/fixtures/openapi/http-security-api-key.yaml"
FIXTURE_EVENTS="yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl"
KEEP_TEMP="${YANOTE_KEEP_TEMP:-false}"

print_artifacts() {
  echo "Artifacts retained at: ${TMP_DIR}" >&2
  echo "  analyzer_build_log: ${ANALYZER_BUILD_LOG_PATH}" >&2
  echo "  report_stdout: ${REPORT_STDOUT_PATH}" >&2
  echo "  report_stderr: ${REPORT_STDERR_PATH}" >&2
  echo "  report_json: ${REPORT_JSON_PATH}" >&2
}

show_failure_tail() {
  local file
  for file in "${ANALYZER_BUILD_LOG_PATH}" "${REPORT_STDERR_PATH}"; do
    if [[ -s "${file}" ]]; then
      echo "--- $(basename "${file}") (tail) ---" >&2
      tail -n 80 "${file}" >&2 || true
    fi
  done
}

fail() {
  local message="$1"
  echo "ERROR: ${message}" >&2
  KEEP_TEMP="true"
  show_failure_tail
  print_artifacts
  exit 1
}

cleanup() {
  if [[ "${KEEP_TEMP}" != "true" ]]; then
    rm -rf "${TMP_DIR}"
  else
    print_artifacts
  fi
}
trap cleanup EXIT

run_report() {
  local exit_code=0
  mkdir -p "${REPORT_OUT_DIR}"
  if (
    cd "${ROOT_DIR}" && \
    node yanote-js/dist/yanote.cjs report \
      --spec "${FIXTURE_SPEC}" \
      --events "${FIXTURE_EVENTS}" \
      --out "${REPORT_OUT_DIR}" \
      --profile local \
      --verbose
  ) >"${REPORT_STDOUT_PATH}" 2>"${REPORT_STDERR_PATH}"; then
    exit_code=0
  else
    exit_code=$?
  fi

  if [[ "${exit_code}" -ne 5 ]]; then
    fail "yanote report exited with ${exit_code}; expected fail-closed exit 5 for the focused security semantics proof."
  fi
}

echo "Building yanote-js analyzer for focused security proof..."
if ! (
  cd "${ROOT_DIR}" && \
  npm -C yanote-js ci && \
  npm -C yanote-js run build
) >"${ANALYZER_BUILD_LOG_PATH}" 2>&1; then
  fail "yanote-js build failed for the focused security proof."
fi

echo "Running yanote report against focused security fixtures..."
run_report

[[ -f "${REPORT_JSON_PATH}" ]] || fail "yanote report did not produce yanote-report.json."

if ! grep -q '^HTTP Security Conformance$' "${REPORT_STDOUT_PATH}"; then
  fail "yanote report stdout is missing the HTTP Security Conformance section."
fi
if ! grep -q '^Top Issues$' "${REPORT_STDOUT_PATH}"; then
  fail "yanote report stdout is missing the Top Issues section."
fi
if ! grep -q '^YANOTE_SUMMARY ' "${REPORT_STDOUT_PATH}"; then
  fail "yanote report stdout is missing the final YANOTE_SUMMARY line."
fi
if ! grep -q 'YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_MISSING_SECURITY' "${REPORT_STDERR_PATH}"; then
  fail "yanote report stderr is missing the primary SEMANTIC_HTTP_MISSING_SECURITY failure line."
fi
if ! grep -q 'YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNAVAILABLE_SECURITY' "${REPORT_STDERR_PATH}"; then
  fail "yanote report stderr is missing the expected unavailable secondary failures."
fi
if ! grep -q 'YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SECURITY' "${REPORT_STDERR_PATH}"; then
  fail "yanote report stderr is missing the expected unsupported secondary failures."
fi

python3 - "${REPORT_STDOUT_PATH}" "${REPORT_STDERR_PATH}" "${REPORT_JSON_PATH}" "${ROOT_DIR}/${FIXTURE_EVENTS}" <<'PY' || fail "Focused security proof assertions failed."
import json
import pathlib
import re
import sys

stdout_path = pathlib.Path(sys.argv[1])
stderr_path = pathlib.Path(sys.argv[2])
report_path = pathlib.Path(sys.argv[3])
fixture_path = pathlib.Path(sys.argv[4])

stdout = stdout_path.read_text(encoding="utf-8")
stderr = stderr_path.read_text(encoding="utf-8")
report = json.loads(report_path.read_text(encoding="utf-8"))
fixture_records = [json.loads(line) for line in fixture_path.read_text(encoding="utf-8").splitlines() if line.strip()]

summary_lines = [line for line in stdout.splitlines() if line.startswith("YANOTE_SUMMARY ")]
if len(summary_lines) != 1:
    raise SystemExit(f"Expected exactly one YANOTE_SUMMARY line, got {len(summary_lines)}")
summary_line = summary_lines[0]

required_stdout_fragments = [
    "- status: partial",
    "- operations: 12/12 (100.00%)",
    "- status: 100.00% (COVERED)",
    "- parameters: N/A (N/A)",
    "- aggregate: N/A (N/A); aggregate is N/A because weighted dimensions include N/A"
]
for fragment in required_stdout_fragments:
    if fragment not in stdout:
        raise SystemExit(f"stdout is missing expected summary fragment: {fragment}")

security_heading = "HTTP Security Conformance"
security_block = stdout.split(f"\n{security_heading}\n", 1)
if len(security_block) != 2:
    raise SystemExit("Expected HTTP Security Conformance block in stdout")
security_lines = security_block[1].split("\n\n", 1)[0].splitlines()
expected_security_lines = [
    "- observations: declared=12 observed_operations=12 evaluations=12",
    "- truths: satisfied=3 missing=1 unavailable=2 unsupported=4 optional=1 clear=1",
    "- diagnostics: satisfied=3 missing=1 unavailable=2 unsupported=4 optional=1 clear=1"
]
if security_lines != expected_security_lines:
    raise SystemExit(f"Unexpected security section lines: {security_lines!r}")

def extract_section(text: str, heading: str, next_heading: str) -> str:
    start = text.split(f"{heading}\n", 1)
    if len(start) != 2:
        raise SystemExit(f"Missing section heading {heading!r}")
    return start[1].split(f"\n\n{next_heading}\n", 1)[0]

issues_section = extract_section(stdout, "Top Issues", "Report Path")
issue_lines = [line for line in issues_section.splitlines() if line.startswith("- ")]
expected_issue_lines = [
    "- high: SEMANTIC_HTTP_MISSING_SECURITY - required query apiKey 'api_key' for security scheme 'queryKey' on http GET /or-and-missing was not retained in request evidence.",
    "- high: SEMANTIC_HTTP_UNAVAILABLE_SECURITY - required header apiKey 'X-Api-Key' for security scheme 'headerKey' on http GET /redacted was unavailable for security verification because retained evidence was redacted (reason: sensitive).",
    "- high: SEMANTIC_HTTP_UNAVAILABLE_SECURITY - required query apiKey 'api_key' for security scheme 'queryKey' on http GET /unavailable was unavailable for security verification because retained evidence was omitted (reason: unavailable).",
    "- high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - security scheme 'basicAuth' on http GET /unsupported-http uses unsupported OpenAPI security type 'http' within Yanote's truthful apiKey-only subset.",
    "- high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - required path apiKey 'secret' for security scheme 'pathKey' on http GET /unsupported-location uses unsupported apiKey location 'path'.",
    "- high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - security scheme 'oauthKey' on http GET /unsupported-oauth uses unsupported OpenAPI security type 'oauth2' within Yanote's truthful apiKey-only subset.",
    "- high: SEMANTIC_HTTP_UNSUPPORTED_SECURITY - security scheme 'oidcAuth' on http GET /unsupported-openid uses unsupported OpenAPI security type 'openIdConnect' within Yanote's truthful apiKey-only subset."
]
if issue_lines != expected_issue_lines:
    raise SystemExit(f"Unexpected Top Issues lines: {issue_lines!r}")

stderr_lines = [line for line in stderr.splitlines() if line.strip()]
if len(stderr_lines) != 7:
    raise SystemExit(f"Expected 7 stderr diagnostics, got {len(stderr_lines)}")
expected_stderr_codes = [
    "SEMANTIC_HTTP_MISSING_SECURITY",
    "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
    "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
    "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
    "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
    "SEMANTIC_HTTP_UNSUPPORTED_SECURITY",
    "SEMANTIC_HTTP_UNSUPPORTED_SECURITY"
]
actual_stderr_codes = []
for index, line in enumerate(stderr_lines):
    match = re.search(r"code=(SEMANTIC_HTTP_[A-Z_]+)", line)
    if match is None:
        raise SystemExit(f"stderr line is missing a semantic code: {line!r}")
    actual_stderr_codes.append(match.group(1))
    expected_prefix = "YANOTE_ERROR " if index == 0 else "YANOTE_ERROR_SECONDARY "
    if not line.startswith(expected_prefix):
        raise SystemExit(f"stderr line {index} should start with {expected_prefix!r}, got {line!r}")
if actual_stderr_codes != expected_stderr_codes:
    raise SystemExit(f"Unexpected stderr code ordering: {actual_stderr_codes!r}")

for token in [
    "operations=100.00",
    "status_dimension=100.00",
    "parameters=NA",
    "aggregate=NA",
    "covered=12/12",
    "request_observed_operations=12",
    "security_declared_operations=12",
    "security_observed_operations=12",
    "security_observed_evaluations=12",
    "security_truths=satisfied:3,missing:1,unavailable:2,unsupported:4,optional:1,clear:1",
    "primary=SEMANTIC_HTTP_MISSING_SECURITY",
    "class_counts=input:0,semantic:7,gate:0,runtime:0"
]:
    if token not in summary_line:
        raise SystemExit(f"YANOTE_SUMMARY is missing token {token!r}")

if report.get("status") != "partial":
    raise SystemExit(f"Expected report status 'partial', got {report.get('status')!r}")
if report.get("summary", {}).get("totalOperations") != 12:
    raise SystemExit(f"Expected totalOperations=12, got {report.get('summary', {}).get('totalOperations')!r}")
if report.get("summary", {}).get("coveredOperations") != 12:
    raise SystemExit(f"Expected coveredOperations=12, got {report.get('summary', {}).get('coveredOperations')!r}")
if report.get("summary", {}).get("operationCoveragePercent") != 100:
    raise SystemExit(f"Expected operationCoveragePercent=100, got {report.get('summary', {}).get('operationCoveragePercent')!r}")
if report.get("summary", {}).get("aggregateCoveragePercent") is not None:
    raise SystemExit("Expected aggregateCoveragePercent to remain null")

expected_coverage = {
    "operations": {"state": "COVERED", "percent": 100},
    "status": {"state": "COVERED", "percent": 100},
    "parameters": {"state": "N/A", "percent": None},
    "aggregate": {
        "state": "N/A",
        "percent": None,
        "explanation": "aggregate is N/A because weighted dimensions include N/A"
    }
}
for key, expected in expected_coverage.items():
    if report.get("coverage", {}).get(key) != expected:
        raise SystemExit(f"Expected coverage[{key!r}]={expected!r}, got {report.get('coverage', {}).get(key)!r}")
if "security" in report.get("coverage", {}):
    raise SystemExit("Legacy coverage should not gain a security numerator")

expected_security_summary = {
    "declaredOperations": 12,
    "observedOperations": 12,
    "observedEvaluations": 12,
    "counts": {
        "satisfied": 3,
        "missing": 1,
        "unavailable": 2,
        "unsupported": 4,
        "optional": 1,
        "clear": 1
    }
}
if report.get("httpSecurityConformance", {}).get("summary") != expected_security_summary:
    raise SystemExit(
        f"Expected security summary {expected_security_summary!r}, got {report.get('httpSecurityConformance', {}).get('summary')!r}"
    )
if report.get("httpSecurityConformance", {}).get("diagnostics", {}).get("counts") != expected_security_summary["counts"]:
    raise SystemExit("Security diagnostic counts did not match summary counts")

governance_codes = [item.get("code") for item in report.get("governance", {}).get("diagnostics", [])]
if governance_codes != expected_stderr_codes:
    raise SystemExit(f"Unexpected governance diagnostic ordering: {governance_codes!r}")

forbidden_values: list[str] = []
seen = set()

def collect_values(node):
    if isinstance(node, dict):
        values = node.get("values")
        if isinstance(values, list):
            for value in values:
                if isinstance(value, str) and value not in seen:
                    seen.add(value)
                    forbidden_values.append(value)
        for child in node.values():
            collect_values(child)
    elif isinstance(node, list):
        for child in node:
            collect_values(child)

for record in fixture_records:
    collect_values(record)

serialized_report = json.dumps(report, sort_keys=True)
for payload_name, payload in {
    "stdout": stdout,
    "stderr": stderr,
    "report": serialized_report,
}.items():
    for value in forbidden_values:
        if value in payload:
            raise SystemExit(f"{payload_name} leaked fixture value {value!r}")
PY

echo "Focused security semantics verifier passed."
if [[ "${KEEP_TEMP}" == "true" ]]; then
  print_artifacts
fi
