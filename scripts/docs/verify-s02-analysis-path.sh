#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-s02-analysis.XXXXXX")"
BUILD_LOG_PATH="${TMP_DIR}/build.log"
ANALYZER_BUILD_LOG_PATH="${TMP_DIR}/analyzer-build.log"
APP_LOG_PATH="${TMP_DIR}/example-service.log"
TEST_LOG_PATH="${TMP_DIR}/restassured-test.log"
HAPPY_STDOUT_PATH="${TMP_DIR}/report-happy.stdout"
HAPPY_STDERR_PATH="${TMP_DIR}/report-happy.stderr"
GATE_STDOUT_PATH="${TMP_DIR}/report-gate.stdout"
GATE_STDERR_PATH="${TMP_DIR}/report-gate.stderr"
EVENTS_PATH="${TMP_DIR}/events.jsonl"
HAPPY_OUT_DIR="${TMP_DIR}/report-happy"
GATE_OUT_DIR="${TMP_DIR}/report-gate"
APP_PID=""
KEEP_TEMP="false"

EXPECTED_RUN_ID="${YANOTE_EXPECTED_RUN_ID:-manual-run-s02}"
EXPECTED_SUITE="${YANOTE_EXPECTED_SUITE:-restassured-suite}"
EXPECTED_OPERATIONS="${YANOTE_EXPECTED_OPERATIONS:-4}"
EXPECTED_OPERATION_PERCENT="${YANOTE_EXPECTED_OPERATION_PERCENT:-100}"
EXPECTED_STATUS_PERCENT="${YANOTE_EXPECTED_STATUS_PERCENT:-75}"
EXPECTED_PARAMETER_PERCENT="${YANOTE_EXPECTED_PARAMETER_PERCENT:-100}"
EXPECTED_AGGREGATE_PERCENT="${YANOTE_EXPECTED_AGGREGATE_PERCENT:-93.75}"
EXPECTED_GATE_EXIT="${YANOTE_EXPECTED_GATE_EXIT:-3}"
EXPECTED_GATE_CODE="${YANOTE_EXPECTED_GATE_CODE:-GATE_MIN_AGGREGATE}"

reserve_port() {
  python3 - <<'PY'
import socket
sock = socket.socket()
sock.bind(("127.0.0.1", 0))
print(sock.getsockname()[1])
sock.close()
PY
}

PORT="${YANOTE_PORT:-$(reserve_port)}"
BASE_URL="http://127.0.0.1:${PORT}"

print_failure_artifacts() {
  echo "Verification failed. Retained failure artifacts:" >&2
  echo "  temp_dir: ${TMP_DIR}" >&2
  echo "  build_log: ${BUILD_LOG_PATH}" >&2
  echo "  analyzer_build_log: ${ANALYZER_BUILD_LOG_PATH}" >&2
  echo "  app_log: ${APP_LOG_PATH}" >&2
  echo "  test_log: ${TEST_LOG_PATH}" >&2
  echo "  events_file: ${EVENTS_PATH}" >&2
  echo "  happy_stdout: ${HAPPY_STDOUT_PATH}" >&2
  echo "  happy_stderr: ${HAPPY_STDERR_PATH}" >&2
  echo "  gate_stdout: ${GATE_STDOUT_PATH}" >&2
  echo "  gate_stderr: ${GATE_STDERR_PATH}" >&2
  echo "  happy_report_dir: ${HAPPY_OUT_DIR}" >&2
  echo "  gate_report_dir: ${GATE_OUT_DIR}" >&2
}

show_failure_tail() {
  local file
  for file in \
    "${BUILD_LOG_PATH}" \
    "${ANALYZER_BUILD_LOG_PATH}" \
    "${APP_LOG_PATH}" \
    "${TEST_LOG_PATH}" \
    "${HAPPY_STDERR_PATH}" \
    "${GATE_STDERR_PATH}"; do
    if [[ -s "${file}" ]]; then
      echo "--- $(basename "${file}") (tail) ---" >&2
      tail -n 60 "${file}" >&2 || true
    fi
  done
}

fail() {
  local message="$1"
  echo "ERROR: ${message}" >&2
  KEEP_TEMP="true"
  show_failure_tail
  print_failure_artifacts
  exit 1
}

cleanup() {
  if [[ -n "${APP_PID}" ]] && kill -0 "${APP_PID}" >/dev/null 2>&1; then
    kill "${APP_PID}" >/dev/null 2>&1 || true
    wait "${APP_PID}" >/dev/null 2>&1 || true
  fi

  if [[ "${KEEP_TEMP}" != "true" ]]; then
    rm -rf "${TMP_DIR}"
  fi
}
trap cleanup EXIT

echo "Building example service/test classes..."
if ! "${ROOT_DIR}/gradlew" --no-daemon :examples:springmvc-service:bootJar :examples:tests-restassured:testClasses >"${BUILD_LOG_PATH}" 2>&1; then
  fail "Gradle example build failed."
fi

echo "Building yanote-js analyzer..."
if ! bash -lc "cd '${ROOT_DIR}' && npm -C yanote-js ci && npm -C yanote-js run build" >"${ANALYZER_BUILD_LOG_PATH}" 2>&1; then
  fail "yanote-js build failed."
fi

BOOT_JAR="$("${ROOT_DIR}/examples/resolve-springmvc-boot-jar.sh")"
if [[ -z "${BOOT_JAR}" || ! -f "${BOOT_JAR}" ]]; then
  fail "Unable to locate Spring Boot example jar in examples/springmvc-service/build/libs."
fi

echo "Starting example service on ${BASE_URL}..."
rm -f "${EVENTS_PATH}"
java \
  -Dserver.port="${PORT}" \
  -Dyanote.recorder.enabled=true \
  -Dyanote.recorder.events-path="${EVENTS_PATH}" \
  -jar "${BOOT_JAR}" >"${APP_LOG_PATH}" 2>&1 &
APP_PID=$!

for _ in $(seq 1 90); do
  if curl --noproxy '*' --silent --fail "${BASE_URL}/health" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "${APP_PID}" >/dev/null 2>&1; then
    fail "Example service exited before becoming ready."
  fi
  sleep 1
done

if ! curl --noproxy '*' --silent --fail "${BASE_URL}/health" >/dev/null 2>&1; then
  fail "Example service did not become ready within 90 seconds."
fi

echo "Running RestAssured example test with --rerun-tasks to force fresh events..."
if ! (
  cd "${ROOT_DIR}" && \
  YANOTE_RUN_ID="${EXPECTED_RUN_ID}" \
  YANOTE_SUITE="${EXPECTED_SUITE}" \
  YANOTE_BASE_URI="${BASE_URL}" \
  YANOTE_EVENTS_PATH="${EVENTS_PATH}" \
  ./gradlew --no-daemon :examples:tests-restassured:test --rerun-tasks
) >"${TEST_LOG_PATH}" 2>&1; then
  fail "RestAssured example test failed."
fi

if [[ ! -f "${EVENTS_PATH}" ]]; then
  fail "RestAssured test did not create events.jsonl."
fi

if [[ ! -s "${EVENTS_PATH}" ]]; then
  fail "RestAssured test created events.jsonl but left it empty."
fi

EVENT_SUMMARY="$(python3 - "${EVENTS_PATH}" "${EXPECTED_RUN_ID}" "${EXPECTED_SUITE}" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_run = sys.argv[2]
expected_suite = sys.argv[3]
records = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

if len(records) != 4:
    raise SystemExit(f"Expected exactly 4 recorded events, got {len(records)}")

routes = sorted(record.get("route") for record in records)
expected_routes = ["/admin/ping", "/users", "/users", "/users/{id}"]
if routes != expected_routes:
    raise SystemExit(f"Expected routes {expected_routes!r}, got {routes!r}")

for record in records:
    if record.get("test.run_id") != expected_run:
        raise SystemExit(f"Expected test.run_id={expected_run!r}, got {record.get('test.run_id')!r}")
    if record.get("test.suite") != expected_suite:
        raise SystemExit(f"Expected test.suite={expected_suite!r}, got {record.get('test.suite')!r}")
    if record.get("route") == "/health":
        raise SystemExit("Found unexpected /health event in the final events file")

print(f"events={len(records)} routes={','.join(routes)} run_id={expected_run} suite={expected_suite}")
PY
)" || fail "Recorded events drifted from the documented test-tagging contract."

echo "Running happy-path analyzer command..."
if ! (
  cd "${ROOT_DIR}" && \
  node yanote-js/dist/yanote.cjs report \
    --spec examples/openapi/demo-openapi.yaml \
    --events "${EVENTS_PATH}" \
    --out "${HAPPY_OUT_DIR}" \
    --min-coverage 100
) >"${HAPPY_STDOUT_PATH}" 2>"${HAPPY_STDERR_PATH}"; then
  fail "Happy-path analyzer command failed."
fi

HAPPY_SUMMARY="$(python3 - "${HAPPY_OUT_DIR}/yanote-report.json" "${EXPECTED_OPERATIONS}" "${EXPECTED_OPERATION_PERCENT}" "${EXPECTED_STATUS_PERCENT}" "${EXPECTED_PARAMETER_PERCENT}" "${EXPECTED_AGGREGATE_PERCENT}" "${EXPECTED_SUITE}" <<'PY'
import json
import math
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_operations = int(sys.argv[2])
expected_operation_percent = float(sys.argv[3])
expected_status_percent = float(sys.argv[4])
expected_parameter_percent = float(sys.argv[5])
expected_aggregate_percent = float(sys.argv[6])
expected_suite = sys.argv[7]

if not path.exists():
    raise SystemExit(f"Missing report file: {path}")

report = json.loads(path.read_text(encoding="utf-8"))
summary = report.get("summary", {})
coverage = report.get("coverage", {})
if summary.get("totalOperations") != expected_operations:
    raise SystemExit(f"Expected totalOperations={expected_operations}, got {summary.get('totalOperations')!r}")
if summary.get("coveredOperations") != expected_operations:
    raise SystemExit(f"Expected coveredOperations={expected_operations}, got {summary.get('coveredOperations')!r}")
if not math.isclose(float(summary.get("operationCoveragePercent", -1)), expected_operation_percent, abs_tol=1e-6):
    raise SystemExit(f"Unexpected operationCoveragePercent={summary.get('operationCoveragePercent')!r}")
if not math.isclose(float(coverage.get("status", {}).get("percent", -1)), expected_status_percent, abs_tol=1e-6):
    raise SystemExit(f"Unexpected status percent={coverage.get('status', {}).get('percent')!r}")
if not math.isclose(float(coverage.get("parameters", {}).get("percent", -1)), expected_parameter_percent, abs_tol=1e-6):
    raise SystemExit(f"Unexpected parameters percent={coverage.get('parameters', {}).get('percent')!r}")
if not math.isclose(float(coverage.get("aggregate", {}).get("percent", -1)), expected_aggregate_percent, abs_tol=1e-6):
    raise SystemExit(f"Unexpected aggregate percent={coverage.get('aggregate', {}).get('percent')!r}")

if report.get("status") != "partial":
    raise SystemExit(f"Expected report status 'partial', got {report.get('status')!r}")
if report.get("diagnostics", {}).get("counts", {}).get("unmatched") != 0:
    raise SystemExit("Expected zero unmatched diagnostics in happy-path report")
if report.get("governance", {}).get("exclusions", {}).get("unmatchedRules") != []:
    raise SystemExit("Expected no unmatched exclusion rules in happy-path report")

operations = {entry.get("operationKey"): entry for entry in coverage.get("perOperation", [])}
post_users = operations.get("http POST /users")
if post_users is None:
    raise SystemExit("Missing http POST /users entry in perOperation coverage")
missing = post_users.get("status", {}).get("missing")
if missing != ["201"]:
    raise SystemExit(f"Expected POST /users missing status ['201'], got {missing!r}")

for key, entry in operations.items():
    suites = entry.get("suites") or []
    if suites != [expected_suite]:
        raise SystemExit(f"Expected suites [{expected_suite!r}] for {key}, got {suites!r}")

print(
    "operations={ops}/{ops} operation_percent={op:.2f} status_percent={status:.2f} parameters_percent={params:.2f} aggregate_percent={agg:.2f} suite={suite}".format(
        ops=expected_operations,
        op=summary["operationCoveragePercent"],
        status=coverage["status"]["percent"],
        params=coverage["parameters"]["percent"],
        agg=coverage["aggregate"]["percent"],
        suite=expected_suite,
    )
)
PY
)" || fail "Happy-path report content drifted from the documented interpretation contract."

if ! grep -q '^Summary$' "${HAPPY_STDOUT_PATH}"; then
  fail "Happy-path analyzer stdout is missing the Summary section."
fi
if ! grep -q '^YANOTE_SUMMARY ' "${HAPPY_STDOUT_PATH}"; then
  fail "Happy-path analyzer stdout is missing the final YANOTE_SUMMARY line."
fi
if [[ -s "${HAPPY_STDERR_PATH}" ]]; then
  fail "Happy-path analyzer command unexpectedly wrote to stderr."
fi

echo "Running gate-failure analyzer command..."
set +e
(
  cd "${ROOT_DIR}" && \
  node yanote-js/dist/yanote.cjs report \
    --spec examples/openapi/demo-openapi.yaml \
    --events "${EVENTS_PATH}" \
    --out "${GATE_OUT_DIR}" \
    --min-aggregate 100
) >"${GATE_STDOUT_PATH}" 2>"${GATE_STDERR_PATH}"
GATE_EXIT_CODE=$?
set -e

if [[ "${GATE_EXIT_CODE}" -ne "${EXPECTED_GATE_EXIT}" ]]; then
  fail "Expected gate-failure exit code ${EXPECTED_GATE_EXIT}, got ${GATE_EXIT_CODE}."
fi
if [[ ! -f "${GATE_OUT_DIR}/yanote-report.json" ]]; then
  fail "Gate-failure analyzer run did not persist yanote-report.json."
fi
if ! grep -q "${EXPECTED_GATE_CODE}" "${GATE_STDERR_PATH}"; then
  fail "Gate-failure stderr is missing ${EXPECTED_GATE_CODE}."
fi
if ! grep -q '^YANOTE_ERROR class=gate code='"${EXPECTED_GATE_CODE}" "${GATE_STDERR_PATH}"; then
  fail "Gate-failure stderr is missing the expected YANOTE_ERROR line."
fi
if ! grep -q '^YANOTE_SUMMARY ' "${GATE_STDOUT_PATH}"; then
  fail "Gate-failure stdout is missing the final YANOTE_SUMMARY line."
fi
if ! grep -q 'primary='"${EXPECTED_GATE_CODE}" "${GATE_STDOUT_PATH}"; then
  fail "Gate-failure stdout is missing the expected primary failure code."
fi

echo "Analysis proof passed: ${EVENT_SUMMARY}; ${HAPPY_SUMMARY}"
echo "Gate proof passed: exit=${GATE_EXIT_CODE} code=${EXPECTED_GATE_CODE} report=${GATE_OUT_DIR}/yanote-report.json"
