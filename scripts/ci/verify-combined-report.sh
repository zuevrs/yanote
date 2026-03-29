#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

ARTIFACT_DIR=".tmp/m015-s03-combined-proof"
MANIFEST_PATH="${ARTIFACT_DIR}/artifact-manifest.txt"
SOURCE_PATHS_PATH="${ARTIFACT_DIR}/artifact-source-paths.txt"

HTTP_REPORT_DIR="${ARTIFACT_DIR}/http-report"
HTTP_STDOUT_PATH="${HTTP_REPORT_DIR}/http-report.stdout"
HTTP_STDERR_PATH="${HTTP_REPORT_DIR}/http-report.stderr"
HTTP_EXIT_CODE_PATH="${HTTP_REPORT_DIR}/http-report.exit-code.txt"
HTTP_OUT_DIR="${HTTP_REPORT_DIR}/out"
HTTP_JSON_PATH="${HTTP_OUT_DIR}/yanote-report.json"
HTTP_HTML_PATH="${HTTP_OUT_DIR}/yanote-report.html"
HTTP_FIXTURE_SPEC="scripts/ci/fixtures/m015-s03-combined-http.openapi.yaml"
HTTP_FIXTURE_EVENTS="scripts/ci/fixtures/m015-s03-combined-http.events.jsonl"

COMBINED_REPORT_DIR="${ARTIFACT_DIR}/combined-report"
COMBINED_STDOUT_PATH="${COMBINED_REPORT_DIR}/combined-report.stdout"
COMBINED_STDERR_PATH="${COMBINED_REPORT_DIR}/combined-report.stderr"
COMBINED_EXIT_CODE_PATH="${COMBINED_REPORT_DIR}/combined-report.exit-code.txt"
COMBINED_OUT_DIR="${COMBINED_REPORT_DIR}/out"
COMBINED_JSON_PATH="${COMBINED_OUT_DIR}/yanote-combined-report.json"
COMBINED_HTML_PATH="${COMBINED_OUT_DIR}/yanote-combined-report.html"

RETAINED_ASYNC_REPORT_PATH=".yanote-ci/live-rabbitmq-proof/yanote-async-report.json"
RETAINED_ASYNC_HTML_PATH=".yanote-ci/live-rabbitmq-proof/yanote-async-report.html"

REPORT_TIMEOUT_SECONDS="${YANOTE_REPORT_TIMEOUT_SECONDS:-120}"
COMBINED_TIMEOUT_SECONDS="${YANOTE_COMBINED_TIMEOUT_SECONDS:-120}"

print_artifacts() {
  echo "Artifacts retained at: ${ARTIFACT_DIR}" >&2
  echo "  manifest: ${MANIFEST_PATH}" >&2
  echo "  source_paths: ${SOURCE_PATHS_PATH}" >&2
  echo "  http_fixture_spec: ${HTTP_FIXTURE_SPEC}" >&2
  echo "  http_fixture_events: ${HTTP_FIXTURE_EVENTS}" >&2
  echo "  retained_async_json: ${RETAINED_ASYNC_REPORT_PATH}" >&2
  echo "  retained_async_html: ${RETAINED_ASYNC_HTML_PATH}" >&2
  echo "  http_stdout: ${HTTP_STDOUT_PATH}" >&2
  echo "  http_stderr: ${HTTP_STDERR_PATH}" >&2
  echo "  http_json: ${HTTP_JSON_PATH}" >&2
  echo "  http_html: ${HTTP_HTML_PATH}" >&2
  echo "  combined_stdout: ${COMBINED_STDOUT_PATH}" >&2
  echo "  combined_stderr: ${COMBINED_STDERR_PATH}" >&2
  echo "  combined_json: ${COMBINED_JSON_PATH}" >&2
  echo "  combined_html: ${COMBINED_HTML_PATH}" >&2
}

show_failure_tail() {
  local file
  for file in \
    "${HTTP_STDERR_PATH}" \
    "${HTTP_STDOUT_PATH}" \
    "${COMBINED_STDERR_PATH}" \
    "${COMBINED_STDOUT_PATH}"; do
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

run_with_timeout() {
  local timeout_seconds="$1"
  local stdout_path="$2"
  local stderr_path="$3"
  shift 3

  python3 - "$timeout_seconds" "$stdout_path" "$stderr_path" "$@" <<'PY'
import os
import subprocess
import sys


timeout_seconds = int(sys.argv[1])
stdout_path = sys.argv[2]
stderr_path = sys.argv[3]
command = sys.argv[4:]

with open(stdout_path, "wb") as stdout_file, open(stderr_path, "wb") as stderr_file:
    try:
        completed = subprocess.run(
            command,
            stdout=stdout_file,
            stderr=stderr_file,
            timeout=timeout_seconds,
            cwd=os.getcwd(),
            env=os.environ.copy(),
            check=False,
        )
    except subprocess.TimeoutExpired:
        stderr_file.write(
            f"YANOTE_TIMEOUT seconds={timeout_seconds} command={' '.join(command)}\n".encode("utf-8")
        )
        raise SystemExit(124)

raise SystemExit(completed.returncode)
PY
}

run_http_report() {
  local exit_code=0

  if run_with_timeout \
    "${REPORT_TIMEOUT_SECONDS}" \
    "${HTTP_STDOUT_PATH}" \
    "${HTTP_STDERR_PATH}" \
    node yanote-js/dist/yanote.cjs report \
      --spec "${HTTP_FIXTURE_SPEC}" \
      --events "${HTTP_FIXTURE_EVENTS}" \
      --out "${HTTP_OUT_DIR}"; then
    exit_code=0
  else
    exit_code=$?
  fi

  printf '%s\n' "${exit_code}" >"${HTTP_EXIT_CODE_PATH}"

  if [[ "${exit_code}" -eq 124 ]]; then
    fail "node yanote-js/dist/yanote.cjs report timed out after ${REPORT_TIMEOUT_SECONDS}s; inspect ${HTTP_STDOUT_PATH} and ${HTTP_STDERR_PATH}."
  fi
  if [[ "${exit_code}" -ne 0 ]]; then
    fail "node yanote-js/dist/yanote.cjs report exited with ${exit_code}; inspect ${HTTP_STDOUT_PATH} and ${HTTP_STDERR_PATH}."
  fi
}

run_combined_report() {
  local exit_code=0

  if run_with_timeout \
    "${COMBINED_TIMEOUT_SECONDS}" \
    "${COMBINED_STDOUT_PATH}" \
    "${COMBINED_STDERR_PATH}" \
    node yanote-js/dist/yanote.cjs combined-report \
      --report "${HTTP_JSON_PATH}" \
      --async-report "${RETAINED_ASYNC_REPORT_PATH}" \
      --out "${COMBINED_OUT_DIR}"; then
    exit_code=0
  else
    exit_code=$?
  fi

  printf '%s\n' "${exit_code}" >"${COMBINED_EXIT_CODE_PATH}"

  if [[ "${exit_code}" -eq 124 ]]; then
    fail "node yanote-js/dist/yanote.cjs combined-report timed out after ${COMBINED_TIMEOUT_SECONDS}s; inspect ${COMBINED_STDOUT_PATH} and ${COMBINED_STDERR_PATH}."
  fi
  if [[ "${exit_code}" -ne 0 ]]; then
    fail "node yanote-js/dist/yanote.cjs combined-report exited with ${exit_code}; inspect ${COMBINED_STDOUT_PATH} and ${COMBINED_STDERR_PATH}."
  fi
}

rm -rf "${ARTIFACT_DIR}"
mkdir -p "${HTTP_OUT_DIR}" "${COMBINED_OUT_DIR}"

[[ -f "yanote-js/dist/yanote.cjs" ]] || fail "Missing yanote-js/dist/yanote.cjs. Run 'npm -C yanote-js run build' before rerunning this proof."
[[ -f "${HTTP_FIXTURE_SPEC}" ]] || fail "Missing HTTP proof spec fixture at ${HTTP_FIXTURE_SPEC}."
[[ -f "${HTTP_FIXTURE_EVENTS}" ]] || fail "Missing HTTP proof events fixture at ${HTTP_FIXTURE_EVENTS}."
[[ -f "${RETAINED_ASYNC_REPORT_PATH}" ]] || fail "Missing retained async child report at ${RETAINED_ASYNC_REPORT_PATH}. Rerun bash scripts/ci/verify-rabbitmq-live-proof.sh to regenerate the canonical S02 async proof."
[[ -f "${RETAINED_ASYNC_HTML_PATH}" ]] || fail "Missing retained async child HTML at ${RETAINED_ASYNC_HTML_PATH}. Rerun bash scripts/ci/verify-rabbitmq-live-proof.sh to restore the canonical drill-down artifact."

printf 'artifact_dir=%s\n' "${ARTIFACT_DIR}" >"${SOURCE_PATHS_PATH}"
printf 'http_fixture_spec=%s\n' "${HTTP_FIXTURE_SPEC}" >>"${SOURCE_PATHS_PATH}"
printf 'http_fixture_events=%s\n' "${HTTP_FIXTURE_EVENTS}" >>"${SOURCE_PATHS_PATH}"
printf 'retained_async_report=%s\n' "${RETAINED_ASYNC_REPORT_PATH}" >>"${SOURCE_PATHS_PATH}"
printf 'retained_async_html=%s\n' "${RETAINED_ASYNC_HTML_PATH}" >>"${SOURCE_PATHS_PATH}"
printf 'generated_http_report=%s\n' "${HTTP_JSON_PATH}" >>"${SOURCE_PATHS_PATH}"
printf 'generated_http_html=%s\n' "${HTTP_HTML_PATH}" >>"${SOURCE_PATHS_PATH}"
printf 'combined_report=%s\n' "${COMBINED_JSON_PATH}" >>"${SOURCE_PATHS_PATH}"
printf 'combined_html=%s\n' "${COMBINED_HTML_PATH}" >>"${SOURCE_PATHS_PATH}"

echo "Running report dist entrypoint against dedicated green HTTP fixtures..."
run_http_report

[[ -f "${HTTP_JSON_PATH}" ]] || fail "report did not retain yanote-report.json at ${HTTP_JSON_PATH}."
[[ -f "${HTTP_HTML_PATH}" ]] || fail "report did not retain yanote-report.html at ${HTTP_HTML_PATH}."
[[ ! -s "${HTTP_STDERR_PATH}" ]] || fail "report unexpectedly wrote to stderr on the green HTTP happy path."
if ! grep -q '^YANOTE_SUMMARY ' "${HTTP_STDOUT_PATH}"; then
  fail "report stdout is missing the final YANOTE_SUMMARY line."
fi

echo "Running combined-report dist entrypoint against the generated HTTP child plus retained AMQP async child..."
run_combined_report

[[ -f "${COMBINED_JSON_PATH}" ]] || fail "combined-report did not retain yanote-combined-report.json at ${COMBINED_JSON_PATH}."
[[ -f "${COMBINED_HTML_PATH}" ]] || fail "combined-report did not retain yanote-combined-report.html at ${COMBINED_HTML_PATH}."
[[ ! -s "${COMBINED_STDERR_PATH}" ]] || fail "combined-report unexpectedly wrote to stderr on the combined happy path."
if [[ "$(grep -c '^YANOTE_COMBINED_SUMMARY ' "${COMBINED_STDOUT_PATH}")" -ne 1 ]]; then
  fail "combined-report stdout must contain exactly one final YANOTE_COMBINED_SUMMARY line."
fi
if ! tail -n 1 "${COMBINED_STDOUT_PATH}" | grep -q '^YANOTE_COMBINED_SUMMARY '; then
  fail "combined-report stdout is missing the final YANOTE_COMBINED_SUMMARY line as its last line."
fi

PROOF_SUMMARY="$(python3 - "${HTTP_JSON_PATH}" "${HTTP_HTML_PATH}" "${HTTP_STDOUT_PATH}" "${RETAINED_ASYNC_REPORT_PATH}" "${RETAINED_ASYNC_HTML_PATH}" "${COMBINED_JSON_PATH}" "${COMBINED_HTML_PATH}" "${COMBINED_STDOUT_PATH}" <<'PY'
import json
import pathlib
import sys

http_json_path = pathlib.Path(sys.argv[1])
http_html_path = pathlib.Path(sys.argv[2])
http_stdout_path = pathlib.Path(sys.argv[3])
async_json_path = pathlib.Path(sys.argv[4])
async_html_path = pathlib.Path(sys.argv[5])
combined_json_path = pathlib.Path(sys.argv[6])
combined_html_path = pathlib.Path(sys.argv[7])
combined_stdout_path = pathlib.Path(sys.argv[8])

http_report = json.loads(http_json_path.read_text(encoding="utf-8"))
combined_report = json.loads(combined_json_path.read_text(encoding="utf-8"))
combined_stdout = combined_stdout_path.read_text(encoding="utf-8")
combined_html = combined_html_path.read_text(encoding="utf-8")
http_stdout = http_stdout_path.read_text(encoding="utf-8")

if http_report.get("status") != "ok":
    raise SystemExit(f"Expected generated HTTP child status 'ok', got {http_report.get('status')!r}")
if http_report.get("summary", {}).get("totalOperations") != 1:
    raise SystemExit(f"Expected generated HTTP child totalOperations=1, got {http_report.get('summary', {}).get('totalOperations')!r}")
if http_report.get("summary", {}).get("coveredOperations") != 1:
    raise SystemExit(f"Expected generated HTTP child coveredOperations=1, got {http_report.get('summary', {}).get('coveredOperations')!r}")
if http_report.get("summary", {}).get("operationCoveragePercent") != 100:
    raise SystemExit(
        f"Expected generated HTTP child operationCoveragePercent=100, got {http_report.get('summary', {}).get('operationCoveragePercent')!r}"
    )

if combined_report.get("status") != "ok":
    raise SystemExit(f"Expected combined report status 'ok', got {combined_report.get('status')!r}")
if combined_report.get("overview") != {
    "totalChildren": 2,
    "okChildren": 2,
    "partialChildren": 0,
    "invalidChildren": 0,
    "childStatuses": {
        "http": "ok",
        "async": "ok",
    },
}:
    raise SystemExit(f"Unexpected combined overview: {combined_report.get('overview')!r}")

http_child = combined_report.get("children", {}).get("http", {})
async_child = combined_report.get("children", {}).get("async", {})
if http_child.get("status") != "ok":
    raise SystemExit(f"Expected combined HTTP child status 'ok', got {http_child.get('status')!r}")
if async_child.get("status") != "ok":
    raise SystemExit(f"Expected combined async child status 'ok', got {async_child.get('status')!r}")
if async_child.get("summary", {}).get("protocols") != ["amqp"]:
    raise SystemExit(f"Expected combined async protocols ['amqp'], got {async_child.get('summary', {}).get('protocols')!r}")

http_artifacts = {artifact["kind"]: artifact["path"] for artifact in http_child.get("provenance", {}).get("artifacts", [])}
async_artifacts = {artifact["kind"]: artifact["path"] for artifact in async_child.get("provenance", {}).get("artifacts", [])}
if http_artifacts != {
    "json": str(http_json_path),
    "html": str(http_html_path),
}:
    raise SystemExit(f"Unexpected combined HTTP artifact refs: {http_artifacts!r}")
if async_artifacts != {
    "json": str(async_json_path),
    "html": str(async_html_path),
}:
    raise SystemExit(f"Unexpected combined async artifact refs: {async_artifacts!r}")

summary_lines = [line for line in combined_stdout.splitlines() if line.startswith("YANOTE_COMBINED_SUMMARY ")]
if len(summary_lines) != 1:
    raise SystemExit(f"Expected exactly one YANOTE_COMBINED_SUMMARY line, got {len(summary_lines)}")
summary_line = summary_lines[0]
for token in [
    "status=ok",
    "http_status=ok",
    "async_status=ok",
    "ok_children=2",
    "partial_children=0",
    "invalid_children=0",
    f"http_report={http_json_path}",
    f"async_report={async_json_path}",
    "protocols=amqp",
    f"report={combined_json_path}",
    "primary=none",
    "child=none",
]:
    if token not in summary_line:
        raise SystemExit(f"Combined summary line is missing token {token!r}")

for fragment in [
    "Summary\n- status: ok",
    "HTTP Child\n- status: ok",
    "Async Child\n- status: ok",
    "- protocols: amqp",
    f"- http json: {http_json_path}",
    f"- http html: {http_html_path}",
    f"- async json: {async_json_path}",
    f"- async html: {async_html_path}",
    "Report Path",
    str(combined_json_path),
]:
    if fragment not in combined_stdout:
        raise SystemExit(f"Combined stdout is missing expected fragment: {fragment}")

if "YANOTE_COMBINED_ERROR" in combined_stdout:
    raise SystemExit("Combined stdout leaked error markers on the happy path")
if "YANOTE_COMBINED_SUMMARY" in combined_html:
    raise SystemExit("Combined HTML should not embed CLI machine-summary output")
if "Yanote combined report" not in combined_html:
    raise SystemExit("Combined HTML is missing the combined report heading")
if "Async child summary" not in combined_html:
    raise SystemExit("Combined HTML is missing the async child section")
if "HTTP child summary" not in combined_html:
    raise SystemExit("Combined HTML is missing the HTTP child section")
if "amqp" not in combined_html:
    raise SystemExit("Combined HTML is missing the async protocols attribution")
if str(async_json_path) not in combined_stdout:
    raise SystemExit("Combined stdout does not point back to the retained async child report")
if str(http_json_path) not in combined_stdout:
    raise SystemExit("Combined stdout does not point back to the generated HTTP child report")
if "status=ok" not in http_stdout:
    raise SystemExit("HTTP stdout is missing the green machine-summary status token")

print(
    "http_status=ok http_operations=1/1 combined_status=ok async_protocols=amqp http_child=%s async_child=%s report=%s"
    % (http_json_path, async_json_path, combined_json_path)
)
PY
)" || fail "Combined proof assertions failed."

cat >"${MANIFEST_PATH}" <<EOF
created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
artifact_dir=${ARTIFACT_DIR}
http_command=host:node yanote-js/dist/yanote.cjs report --spec ${HTTP_FIXTURE_SPEC} --events ${HTTP_FIXTURE_EVENTS} --out ${HTTP_OUT_DIR}
http_stdout=http-report/http-report.stdout
http_stderr=http-report/http-report.stderr
http_exit_code=http-report/http-report.exit-code.txt
http_report_json=http-report/out/yanote-report.json
http_report_html=http-report/out/yanote-report.html
http_status=ok
http_operations=1/1
combined_command=host:node yanote-js/dist/yanote.cjs combined-report --report ${HTTP_JSON_PATH} --async-report ${RETAINED_ASYNC_REPORT_PATH} --out ${COMBINED_OUT_DIR}
combined_stdout=combined-report/combined-report.stdout
combined_stderr=combined-report/combined-report.stderr
combined_exit_code=combined-report/combined-report.exit-code.txt
combined_report_json=combined-report/out/yanote-combined-report.json
combined_report_html=combined-report/out/yanote-combined-report.html
combined_status=ok
combined_async_protocols=amqp
retained_async_report=${RETAINED_ASYNC_REPORT_PATH}
retained_async_html=${RETAINED_ASYNC_HTML_PATH}
observability=http-report.stdout,http-report.stderr,combined-report.stdout,combined-report.stderr
summary_token=YANOTE_COMBINED_SUMMARY
proof_summary=${PROOF_SUMMARY}
EOF

python3 - "${ARTIFACT_DIR}" <<'PY' || fail "Unexpected combined proof bundle layout."
import pathlib
import sys

artifact_dir = pathlib.Path(sys.argv[1])
expected_files = sorted([
    "artifact-manifest.txt",
    "artifact-source-paths.txt",
    "combined-report/combined-report.exit-code.txt",
    "combined-report/combined-report.stderr",
    "combined-report/combined-report.stdout",
    "combined-report/out/yanote-combined-report.html",
    "combined-report/out/yanote-combined-report.json",
    "http-report/http-report.exit-code.txt",
    "http-report/http-report.stderr",
    "http-report/http-report.stdout",
    "http-report/out/yanote-report.html",
    "http-report/out/yanote-report.json",
])
actual_files = sorted(
    str(path.relative_to(artifact_dir))
    for path in artifact_dir.rglob("*")
    if path.is_file()
)
if actual_files != expected_files:
    raise SystemExit(f"Unexpected proof bundle layout: {actual_files!r}")
PY

echo "Combined dist proof passed: ${PROOF_SUMMARY}"
print_artifacts
