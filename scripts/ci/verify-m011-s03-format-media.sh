#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-m011-s03-format-media.XXXXXX")"
BUILD_LOG_PATH="${TMP_DIR}/yanote-js-build.log"
SCENARIOS_DIR="${TMP_DIR}/scenarios"
KEEP_TEMP="${YANOTE_KEEP_TEMP:-false}"

print_artifacts() {
  echo "Artifacts retained at: ${TMP_DIR}" >&2
  echo "  build_log: ${BUILD_LOG_PATH}" >&2
  local scenario_dir
  for scenario_dir in "${SCENARIOS_DIR}"/*; do
    [[ -d "${scenario_dir}" ]] || continue
    echo "  scenario: $(basename "${scenario_dir}")" >&2
    echo "    stdout: ${scenario_dir}/report.stdout" >&2
    echo "    stderr: ${scenario_dir}/report.stderr" >&2
    echo "    exit_code: ${scenario_dir}/exit-code.txt" >&2
    echo "    report_json: ${scenario_dir}/out/yanote-report.json" >&2
  done
}

show_failure_tail() {
  if [[ -s "${BUILD_LOG_PATH}" ]]; then
    echo "--- $(basename "${BUILD_LOG_PATH}") (tail) ---" >&2
    tail -n 80 "${BUILD_LOG_PATH}" >&2 || true
  fi

  local file
  while IFS= read -r file; do
    [[ -s "${file}" ]] || continue
    echo "--- ${file#${TMP_DIR}/} (tail) ---" >&2
    tail -n 80 "${file}" >&2 || true
  done < <(find "${SCENARIOS_DIR}" -type f \( -name 'report.stderr' -o -name 'report.stdout' \) 2>/dev/null | sort)
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
  local scenario="$1"
  local events_fixture="$2"
  local scenario_dir="${SCENARIOS_DIR}/${scenario}"
  local out_dir="${scenario_dir}/out"
  local stdout_path="${scenario_dir}/report.stdout"
  local stderr_path="${scenario_dir}/report.stderr"
  local exit_code_path="${scenario_dir}/exit-code.txt"
  local report_json_path="${out_dir}/yanote-report.json"
  local exit_code=0

  mkdir -p "${scenario_dir}" "${out_dir}"

  if (
    cd "${ROOT_DIR}" && \
    node yanote-js/dist/yanote.cjs report \
      --spec yanote-js/test/fixtures/openapi/http-payload-format-media.yaml \
      --events "yanote-js/test/fixtures/events/${events_fixture}" \
      --out "${out_dir}" \
      --profile local
  ) >"${stdout_path}" 2>"${stderr_path}"; then
    exit_code=0
  else
    exit_code=$?
  fi

  printf '%s\n' "${exit_code}" >"${exit_code_path}"

  [[ -f "${report_json_path}" ]] || fail "${scenario} did not produce yanote-report.json."

  python3 - "${scenario}" "${stdout_path}" "${stderr_path}" "${report_json_path}" "${exit_code_path}" <<'PY' \
    || fail "${scenario} assertions failed."
import json
import pathlib
import sys

scenario, stdout_path, stderr_path, report_path, exit_code_path = sys.argv[1:6]
stdout = pathlib.Path(stdout_path).read_text(encoding="utf-8")
stderr = pathlib.Path(stderr_path).read_text(encoding="utf-8")
report_text = pathlib.Path(report_path).read_text(encoding="utf-8")
report = json.loads(report_text)
exit_code = int(pathlib.Path(exit_code_path).read_text(encoding="utf-8").strip())
summary_lines = [line for line in stdout.splitlines() if line.startswith("YANOTE_SUMMARY ")]

if len(summary_lines) != 1:
    raise SystemExit(f"Expected exactly one YANOTE_SUMMARY line for {scenario}, got {len(summary_lines)}")

summary_line = summary_lines[0]
if "Top Issues\n" not in stdout or "\n\nReport Path\n" not in stdout:
    raise SystemExit(f"Missing Top Issues or Report Path section in stdout for {scenario}")

top_issues = stdout.split("Top Issues\n", 1)[1].split("\n\nReport Path\n", 1)[0]
payload_items = report["httpPayloadConformance"]["diagnostics"]["items"]
payload_counts = report["httpPayloadConformance"]["diagnostics"]["counts"]
governance_codes = [item["code"] for item in report["governance"]["diagnostics"]]


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def payload_item(operation_key: str, target: str):
    for item in payload_items:
        if item["operationKey"] == operation_key and item["target"] == target:
            return item
    raise SystemExit(f"Missing payload diagnostic for {operation_key} {target} in {scenario}")


def ensure_absent(*needles: str) -> None:
    for needle in needles:
        if needle in stdout or needle in stderr or needle in report_text:
            raise SystemExit(f"Scenario {scenario} leaked raw payload value {needle!r}")


if scenario == "valid-format":
    expect(exit_code == 0, f"Expected exit 0 for {scenario}, got {exit_code}")
    expect(stderr == "", f"Expected empty stderr for {scenario}, got {stderr!r}")
    expect("primary=none" in summary_line, f"Expected primary=none in summary for {scenario}")
    expect("SEMANTIC_HTTP_" not in stdout, f"Did not expect semantic failures in stdout for {scenario}")
    expect(report["status"] == "partial", f"Expected partial status for {scenario}, got {report['status']!r}")
    expect(
        "- request: covered=1 partial=0 uncovered=0 skipped=0 n/a=3 observations=1 valid=1 invalid=0 skipped_observations=0" in stdout,
        f"Missing green request summary for {scenario}",
    )
    expect(
        "- response: covered=1 partial=0 uncovered=0 skipped=0 n/a=3 observations=1 valid=1 invalid=0 skipped_observations=0" in stdout,
        f"Missing green response summary for {scenario}",
    )
    expect(payload_counts == {"covered": 2, "uncovered": 0, "skipped": 0}, f"Unexpected payload counts for {scenario}: {payload_counts!r}")
    expect([item["code"] for item in payload_items] == ["VALID", "VALID"], f"Unexpected payload codes for {scenario}: {payload_items!r}")
    expect(not any(code.startswith("SEMANTIC_HTTP_") for code in governance_codes), f"Unexpected semantic governance codes for {scenario}: {governance_codes!r}")
    request_item = payload_item("http POST /subscribers", "request")
    response_item = payload_item("http POST /subscribers", "response")
    expect(request_item["observedMediaType"] == "application/json", f"Unexpected request media type for {scenario}: {request_item['observedMediaType']!r}")
    expect(response_item["observedMediaType"] == "application/json", f"Unexpected response media type for {scenario}: {response_item['observedMediaType']!r}")
    expect(request_item.get("errors") in (None, []), f"Expected no request errors for {scenario}, got {request_item.get('errors')!r}")
    expect(response_item.get("errors") in (None, []), f"Expected no response errors for {scenario}, got {response_item.get('errors')!r}")
    ensure_absent("ada@example.com", "sub-1")
elif scenario == "invalid-format":
    expect(exit_code == 5, f"Expected exit 5 for {scenario}, got {exit_code}")
    expect(
        "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_INVALID_BODY" in stderr,
        f"Missing invalid-body stderr line for {scenario}",
    )
    expect("YANOTE_ERROR_SECONDARY" not in stderr, f"Did not expect a secondary stderr line for {scenario}")
    expect("primary=SEMANTIC_HTTP_INVALID_BODY" in summary_line, f"Missing primary semantic token for {scenario}")
    expect(
        "- high: SEMANTIC_HTTP_INVALID_BODY - request payload for http POST /verifications media=application/json failed JSON schema validation." in top_issues,
        f"Missing invalid-format Top Issue for {scenario}",
    )
    expect("request - INVALID_BODY:" not in stdout, f"Raw invalid-body diagnostic duplicated into stdout for {scenario}")
    expect(report["status"] == "partial", f"Expected partial status for {scenario}, got {report['status']!r}")
    expect(governance_codes == ["SEMANTIC_HTTP_INVALID_BODY"], f"Unexpected governance codes for {scenario}: {governance_codes!r}")
    expect(payload_counts == {"covered": 1, "uncovered": 1, "skipped": 0}, f"Unexpected payload counts for {scenario}: {payload_counts!r}")
    request_item = payload_item("http POST /verifications", "request")
    response_item = payload_item("http POST /verifications", "response")
    expect(request_item["code"] == "INVALID_BODY", f"Unexpected request code for {scenario}: {request_item['code']!r}")
    expect(request_item["state"] == "UNCOVERED", f"Unexpected request state for {scenario}: {request_item['state']!r}")
    expect(request_item["observedMediaType"] == "application/json", f"Unexpected request media for {scenario}: {request_item['observedMediaType']!r}")
    expect(request_item.get("errors") == ["/email must match format \"email\""], f"Unexpected request errors for {scenario}: {request_item.get('errors')!r}")
    expect(response_item["code"] == "VALID", f"Unexpected response code for {scenario}: {response_item['code']!r}")
    expect(response_item["observedMediaType"] == "application/json", f"Unexpected response media for {scenario}: {response_item['observedMediaType']!r}")
    ensure_absent("not-an-email")
elif scenario == "unsupported-format":
    expect(exit_code == 5, f"Expected exit 5 for {scenario}, got {exit_code}")
    expect(
        "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT" in stderr,
        f"Missing unsupported-format stderr line for {scenario}",
    )
    expect("YANOTE_ERROR_SECONDARY" not in stderr, f"Did not expect a secondary stderr line for {scenario}")
    expect(
        "primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT" in summary_line,
        f"Missing primary semantic token for {scenario}",
    )
    expect(
        "- high: SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT - request payload for http POST /custom-format media=application/json declares a schema format outside Yanote's supported payload format allowlist." in top_issues,
        f"Missing unsupported-format Top Issue for {scenario}",
    )
    expect(
        "request - UNSUPPORTED_SCHEMA_FORMAT:" not in stdout,
        f"Raw unsupported-format diagnostic duplicated into stdout for {scenario}",
    )
    expect(governance_codes == ["SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT"], f"Unexpected governance codes for {scenario}: {governance_codes!r}")
    expect(payload_counts == {"covered": 1, "uncovered": 0, "skipped": 1}, f"Unexpected payload counts for {scenario}: {payload_counts!r}")
    request_item = payload_item("http POST /custom-format", "request")
    response_item = payload_item("http POST /custom-format", "response")
    expect(request_item["code"] == "UNSUPPORTED_SCHEMA_FORMAT", f"Unexpected request code for {scenario}: {request_item['code']!r}")
    expect(request_item["state"] == "SKIPPED", f"Unexpected request state for {scenario}: {request_item['state']!r}")
    expect(request_item["observedMediaType"] == "application/json", f"Unexpected request media for {scenario}: {request_item['observedMediaType']!r}")
    expect(
        request_item.get("errors") == [
            "/properties/externalId declares unsupported schema format \"yanote-customer-id\" outside Yanote's supported payload format allowlist."
        ],
        f"Unexpected request errors for {scenario}: {request_item.get('errors')!r}",
    )
    expect(response_item["code"] == "VALID", f"Unexpected response code for {scenario}: {response_item['code']!r}")
    expect(response_item["observedMediaType"] == "application/json", f"Unexpected response media for {scenario}: {response_item['observedMediaType']!r}")
    ensure_absent("cust-123")
elif scenario == "media-specificity":
    expect(exit_code == 5, f"Expected exit 5 for {scenario}, got {exit_code}")
    expect(
        "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_INVALID_BODY" in stderr,
        f"Missing media-specific invalid-body stderr line for {scenario}",
    )
    expect("YANOTE_ERROR_SECONDARY" not in stderr, f"Did not expect a secondary stderr line for {scenario}")
    expect("primary=SEMANTIC_HTTP_INVALID_BODY" in summary_line, f"Missing primary semantic token for {scenario}")
    expect(
        "application/problem+json failed JSON schema validation." in top_issues,
        f"Missing most-specific media Top Issue for {scenario}",
    )
    expect("request - INVALID_BODY:" not in stdout, f"Raw invalid-body diagnostic duplicated into stdout for {scenario}")
    expect(governance_codes == ["SEMANTIC_HTTP_INVALID_BODY"], f"Unexpected governance codes for {scenario}: {governance_codes!r}")
    expect(payload_counts == {"covered": 1, "uncovered": 1, "skipped": 0}, f"Unexpected payload counts for {scenario}: {payload_counts!r}")
    request_item = payload_item("http POST /incidents", "request")
    response_item = payload_item("http POST /incidents", "response")
    expect(request_item["code"] == "INVALID_BODY", f"Unexpected request code for {scenario}: {request_item['code']!r}")
    expect(request_item["state"] == "UNCOVERED", f"Unexpected request state for {scenario}: {request_item['state']!r}")
    expect(request_item["observedMediaType"] == "application/problem+json", f"Unexpected request media for {scenario}: {request_item['observedMediaType']!r}")
    expect(request_item.get("errors") == ["/ must have required property 'detail'"], f"Unexpected request errors for {scenario}: {request_item.get('errors')!r}")
    expect(response_item["code"] == "VALID", f"Unexpected response code for {scenario}: {response_item['code']!r}")
    expect(response_item["observedMediaType"] == "application/problem+json", f"Unexpected response media for {scenario}: {response_item['observedMediaType']!r}")
    expect(all(item.get("observedMediaType") != "application/*+json" for item in payload_items), f"Wildcard media unexpectedly won for {scenario}")
    ensure_absent("storage outage", "Ticket created")
else:
    raise SystemExit(f"Unknown scenario {scenario!r}")
PY

  echo "Verified ${scenario} scenario." >&2
}

mkdir -p "${SCENARIOS_DIR}"

echo "Building yanote-js for retained S03 format/media verification..."
if ! (
  cd "${ROOT_DIR}" && \
  npm -C yanote-js ci && \
  npm -C yanote-js run build
) >"${BUILD_LOG_PATH}" 2>&1; then
  fail "yanote-js build failed."
fi

[[ -f "${ROOT_DIR}/yanote-js/dist/yanote.cjs" ]] || fail "yanote-js build did not produce dist/yanote.cjs."

echo "Running green supported-format proof..."
run_report "valid-format" "http-payload-valid-format.fixture.jsonl"

echo "Running invalid email fail-closed proof..."
run_report "invalid-format" "http-payload-invalid-format.fixture.jsonl"

echo "Running unsupported schema-format fail-closed proof..."
run_report "unsupported-format" "http-payload-unsupported-format.fixture.jsonl"

echo "Running most-specific media selection fail-closed proof..."
run_report "media-specificity" "http-payload-media-specificity.fixture.jsonl"

echo "S03 retained format/media verifier passed."
if [[ "${KEEP_TEMP}" == "true" ]]; then
  print_artifacts
fi
