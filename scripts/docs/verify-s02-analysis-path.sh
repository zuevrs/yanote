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
FIXTURE_UNSUPPORTED_DIR="${TMP_DIR}/fixture-unsupported-media"
FIXTURE_INVALID_DIR="${TMP_DIR}/fixture-invalid"
FIXTURE_MISSING_DIR="${TMP_DIR}/fixture-missing"
FIXTURE_PARTIAL_DIR="${TMP_DIR}/fixture-partial"
FIXTURE_SCHEMA_DIR="${TMP_DIR}/fixture-unsupported-schema"
SCHEMA_SPEC_PATH="${FIXTURE_SCHEMA_DIR}/unsupported-schema.yaml"
SCHEMA_EVENTS_PATH="${FIXTURE_SCHEMA_DIR}/unsupported-schema.fixture.jsonl"
APP_PID=""
KEEP_TEMP="false"

EXPECTED_RUN_ID="${YANOTE_EXPECTED_RUN_ID:-manual-run-s02}"
EXPECTED_SUITE="${YANOTE_EXPECTED_SUITE:-restassured-suite}"
EXPECTED_OPERATIONS="${YANOTE_EXPECTED_OPERATIONS:-4}"
EXPECTED_OPERATION_PERCENT="${YANOTE_EXPECTED_OPERATION_PERCENT:-100}"
EXPECTED_STATUS_PERCENT="${YANOTE_EXPECTED_STATUS_PERCENT:-100}"
EXPECTED_PARAMETER_PERCENT="${YANOTE_EXPECTED_PARAMETER_PERCENT:-100}"
EXPECTED_AGGREGATE_PERCENT="${YANOTE_EXPECTED_AGGREGATE_PERCENT:-100}"
EXPECTED_REPORT_STATUS="${YANOTE_EXPECTED_REPORT_STATUS:-ok}"
EXPECTED_PAYLOAD_COVERED="${YANOTE_EXPECTED_PAYLOAD_COVERED:-2}"
EXPECTED_PAYLOAD_UNCOVERED="${YANOTE_EXPECTED_PAYLOAD_UNCOVERED:-0}"
EXPECTED_PAYLOAD_SKIPPED="${YANOTE_EXPECTED_PAYLOAD_SKIPPED:-3}"
HOST_GRADLE_HOME="${TMP_DIR}/gradle-home"
FALLBACK_GRADLE_DIST_HOME="${HOME}/.gradle/wrapper/dists"

mkdir -p "${HOST_GRADLE_HOME}"
if [[ -d "${FALLBACK_GRADLE_DIST_HOME}" ]]; then
  mkdir -p "${HOST_GRADLE_HOME}/wrapper"
  ln -s "${FALLBACK_GRADLE_DIST_HOME}" "${HOST_GRADLE_HOME}/wrapper/dists"
fi
export GRADLE_USER_HOME="${HOST_GRADLE_HOME}"
export YANOTE_GRADLE_HOME="${HOST_GRADLE_HOME}"

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
  echo "  fixture_unsupported_media_dir: ${FIXTURE_UNSUPPORTED_DIR}" >&2
  echo "  fixture_invalid_dir: ${FIXTURE_INVALID_DIR}" >&2
  echo "  fixture_missing_dir: ${FIXTURE_MISSING_DIR}" >&2
  echo "  fixture_partial_dir: ${FIXTURE_PARTIAL_DIR}" >&2
  echo "  fixture_unsupported_schema_dir: ${FIXTURE_SCHEMA_DIR}" >&2
}

show_failure_tail() {
  local file
  for file in \
    "${BUILD_LOG_PATH}" \
    "${ANALYZER_BUILD_LOG_PATH}" \
    "${APP_LOG_PATH}" \
    "${TEST_LOG_PATH}" \
    "${HAPPY_STDERR_PATH}" \
    "${GATE_STDERR_PATH}" \
    "${FIXTURE_UNSUPPORTED_DIR}/stderr" \
    "${FIXTURE_INVALID_DIR}/stderr" \
    "${FIXTURE_MISSING_DIR}/stderr" \
    "${FIXTURE_PARTIAL_DIR}/stderr" \
    "${FIXTURE_SCHEMA_DIR}/stderr"; do
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

run_report_command() {
  local spec_path="$1"
  local events_path="$2"
  local out_dir="$3"
  local stdout_path="$4"
  local stderr_path="$5"
  shift 5

  mkdir -p "${out_dir}" "$(dirname "${stdout_path}")" "$(dirname "${stderr_path}")"

  if ! (
    cd "${ROOT_DIR}" && \
    node yanote-js/dist/yanote.cjs report \
      --spec "${spec_path}" \
      --events "${events_path}" \
      --out "${out_dir}" \
      "$@"
  ) >"${stdout_path}" 2>"${stderr_path}"; then
    fail "Analyzer report command failed for spec ${spec_path} and events ${events_path}."
  fi
}

run_report_command_expect_exit() {
  local expected_exit="$1"
  local spec_path="$2"
  local events_path="$3"
  local out_dir="$4"
  local stdout_path="$5"
  local stderr_path="$6"
  shift 6

  mkdir -p "${out_dir}" "$(dirname "${stdout_path}")" "$(dirname "${stderr_path}")"

  local status
  set +e
  (
    cd "${ROOT_DIR}" && \
    node yanote-js/dist/yanote.cjs report \
      --spec "${spec_path}" \
      --events "${events_path}" \
      --out "${out_dir}" \
      "$@"
  ) >"${stdout_path}" 2>"${stderr_path}"
  status=$?
  set -e

  if [[ "${status}" -ne "${expected_exit}" ]]; then
    fail "Expected analyzer report command to exit ${expected_exit}, got ${status} for spec ${spec_path} and events ${events_path}."
  fi
}

ensure_summary_output() {
  local stdout_path="$1"

  if ! grep -q '^Summary$' "${stdout_path}"; then
    fail "Analyzer stdout ${stdout_path} is missing the Summary section."
  fi
  if ! grep -q '^HTTP Payload Conformance$' "${stdout_path}"; then
    fail "Analyzer stdout ${stdout_path} is missing the HTTP Payload Conformance section."
  fi
  if ! grep -q '^YANOTE_SUMMARY ' "${stdout_path}"; then
    fail "Analyzer stdout ${stdout_path} is missing the final YANOTE_SUMMARY line."
  fi
}

echo "Building example service/test classes..."
if ! "${ROOT_DIR}/gradlew" --no-daemon -g "${HOST_GRADLE_HOME}" :examples:springmvc-service:bootJar :examples:tests-restassured:testClasses >"${BUILD_LOG_PATH}" 2>&1; then
  fail "Gradle example build failed."
fi

echo "Building yanote-js analyzer..."
if ! bash -lc "cd '${ROOT_DIR}' && npm -C yanote-js ci && npm -C yanote-js run build" >"${ANALYZER_BUILD_LOG_PATH}" 2>&1; then
  fail "yanote-js build failed."
fi

BOOT_JAR="$(${ROOT_DIR}/examples/resolve-springmvc-boot-jar.sh)"
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
  ./gradlew --no-daemon -g "${HOST_GRADLE_HOME}" :examples:tests-restassured:test --rerun-tasks
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

post_users = None
for record in records:
    if record.get("test.run_id") != expected_run:
        raise SystemExit(f"Expected test.run_id={expected_run!r}, got {record.get('test.run_id')!r}")
    if record.get("test.suite") != expected_suite:
        raise SystemExit(f"Expected test.suite={expected_suite!r}, got {record.get('test.suite')!r}")
    if record.get("route") == "/health":
        raise SystemExit("Found unexpected /health event in the final events file")
    if record.get("method") == "POST" and record.get("route") == "/users":
        post_users = record

if post_users is None:
    raise SystemExit("Missing POST /users event in recorded events")

if post_users.get("status") != 201:
    raise SystemExit(f"Expected POST /users status 201, got {post_users.get('status')!r}")
if post_users.get("requestContentType") != "application/json":
    raise SystemExit(f"Expected POST /users requestContentType 'application/json', got {post_users.get('requestContentType')!r}")
if post_users.get("responseContentType") != "application/json":
    raise SystemExit(f"Expected POST /users responseContentType 'application/json', got {post_users.get('responseContentType')!r}")
expected_request = {"name": "alice", "email": "alice@example.com"}
if post_users.get("requestBody") != expected_request:
    raise SystemExit(f"Unexpected POST /users requestBody: {post_users.get('requestBody')!r}")
expected_response = {
    "id": "user-alice",
    "name": "alice",
    "email": "alice@example.com",
    "created": True,
}
if post_users.get("responseBody") != expected_response:
    raise SystemExit(f"Unexpected POST /users responseBody: {post_users.get('responseBody')!r}")

print(
    "events={count} routes={routes} run_id={run_id} suite={suite} payload_route={payload_route}".format(
        count=len(records),
        routes=','.join(routes),
        run_id=expected_run,
        suite=expected_suite,
        payload_route=post_users["route"],
    )
)
PY
)" || fail "Recorded events drifted from the documented test-tagging contract."

echo "Running happy-path analyzer command..."
run_report_command \
  "examples/openapi/demo-openapi.yaml" \
  "${EVENTS_PATH}" \
  "${HAPPY_OUT_DIR}" \
  "${HAPPY_STDOUT_PATH}" \
  "${HAPPY_STDERR_PATH}" \
  --min-coverage 100

ensure_summary_output "${HAPPY_STDOUT_PATH}"
if [[ -s "${HAPPY_STDERR_PATH}" ]]; then
  fail "Happy-path analyzer command unexpectedly wrote to stderr."
fi

HAPPY_SUMMARY="$(python3 - "${HAPPY_OUT_DIR}/yanote-report.json" "${EXPECTED_OPERATIONS}" "${EXPECTED_OPERATION_PERCENT}" "${EXPECTED_STATUS_PERCENT}" "${EXPECTED_PARAMETER_PERCENT}" "${EXPECTED_AGGREGATE_PERCENT}" "${EXPECTED_SUITE}" "${EXPECTED_REPORT_STATUS}" "${EXPECTED_PAYLOAD_COVERED}" "${EXPECTED_PAYLOAD_UNCOVERED}" "${EXPECTED_PAYLOAD_SKIPPED}" <<'PY'
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
expected_report_status = sys.argv[8]
expected_payload_covered = int(sys.argv[9])
expected_payload_uncovered = int(sys.argv[10])
expected_payload_skipped = int(sys.argv[11])

if not path.exists():
    raise SystemExit(f"Missing report file: {path}")

report = json.loads(path.read_text(encoding="utf-8"))
summary = report.get("summary", {})
coverage = report.get("coverage", {})
payload = report.get("httpPayloadConformance", {})
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

if report.get("status") != expected_report_status:
    raise SystemExit(f"Expected report status {expected_report_status!r}, got {report.get('status')!r}")
if report.get("diagnostics", {}).get("counts", {}).get("unmatched") != 0:
    raise SystemExit("Expected zero unmatched diagnostics in happy-path report")
if report.get("governance", {}).get("exclusions", {}).get("unmatchedRules") != []:
    raise SystemExit("Expected no unmatched exclusion rules in happy-path report")

operations = {entry.get("operationKey"): entry for entry in coverage.get("perOperation", [])}
post_users = operations.get("http POST /users")
if post_users is None:
    raise SystemExit("Missing http POST /users entry in perOperation coverage")
missing = post_users.get("status", {}).get("missing")
if missing != []:
    raise SystemExit(f"Expected POST /users missing status [], got {missing!r}")

payload_by_operation = {entry.get("operationKey"): entry for entry in payload.get("perOperation", [])}
payload_post_users = payload_by_operation.get("http POST /users")
if payload_post_users is None:
    raise SystemExit("Missing http POST /users entry in payload conformance")
if payload_post_users.get("request", {}).get("state") != "COVERED":
    raise SystemExit(f"Expected POST /users request payload COVERED, got {payload_post_users.get('request', {}).get('state')!r}")
if payload_post_users.get("response", {}).get("state") != "COVERED":
    raise SystemExit(f"Expected POST /users response payload COVERED, got {payload_post_users.get('response', {}).get('state')!r}")
if payload_post_users.get("request", {}).get("observedMediaTypes") != ["application/json"]:
    raise SystemExit(f"Unexpected POST /users request observedMediaTypes: {payload_post_users.get('request', {}).get('observedMediaTypes')!r}")
if payload_post_users.get("response", {}).get("observedMediaTypes") != ["application/json"]:
    raise SystemExit(f"Unexpected POST /users response observedMediaTypes: {payload_post_users.get('response', {}).get('observedMediaTypes')!r}")

payload_summary = payload.get("summary", {})
request_summary = payload_summary.get("request", {})
response_summary = payload_summary.get("response", {})
expected_request_summary = {
    "coveredOperations": 1,
    "partialOperations": 0,
    "uncoveredOperations": 0,
    "skippedOperations": 0,
    "notApplicableOperations": 3,
    "observedCount": 1,
    "validCount": 1,
    "invalidCount": 0,
    "skippedCount": 0,
}
expected_response_summary = {
    "coveredOperations": 1,
    "partialOperations": 0,
    "uncoveredOperations": expected_payload_uncovered,
    "skippedOperations": expected_payload_skipped,
    "notApplicableOperations": 0,
    "observedCount": 4,
    "validCount": 1,
    "invalidCount": 0,
    "skippedCount": expected_payload_skipped,
}
if request_summary != expected_request_summary:
    raise SystemExit(f"Unexpected request payload summary: {request_summary!r}")
if response_summary != expected_response_summary:
    raise SystemExit(f"Unexpected response payload summary: {response_summary!r}")

payload_counts = payload.get("diagnostics", {}).get("counts", {})
expected_counts = {
    "covered": expected_payload_covered,
    "uncovered": expected_payload_uncovered,
    "skipped": expected_payload_skipped,
}
if payload_counts != expected_counts:
    raise SystemExit(f"Unexpected payload diagnostic counts: {payload_counts!r}")

response_issues = [
    item for item in payload.get("diagnostics", {}).get("items", [])
    if item.get("target") == "response" and item.get("state") == "SKIPPED"
]
if len(response_issues) != expected_payload_skipped:
    raise SystemExit(f"Expected {expected_payload_skipped} skipped response payload diagnostics, got {len(response_issues)}")
for item in response_issues:
    if item.get("code") != "NO_DECLARED_CONTENT":
        raise SystemExit(f"Expected NO_DECLARED_CONTENT for skipped response payload diagnostics, got {item.get('code')!r}")

for key, entry in operations.items():
    suites = entry.get("suites") or []
    if suites != [expected_suite]:
        raise SystemExit(f"Expected suites [{expected_suite!r}] for {key}, got {suites!r}")

print(
    "operations={ops}/{ops} operation_percent={op:.2f} status_percent={status:.2f} parameters_percent={params:.2f} aggregate_percent={agg:.2f} payload_request={payload_request} payload_response={payload_response} suite={suite}".format(
        ops=expected_operations,
        op=summary["operationCoveragePercent"],
        status=coverage["status"]["percent"],
        params=coverage["parameters"]["percent"],
        agg=coverage["aggregate"]["percent"],
        payload_request=payload_post_users["request"]["state"],
        payload_response=payload_post_users["response"]["state"],
        suite=expected_suite,
    )
)
PY
)" || fail "Happy-path report content drifted from the documented interpretation contract."

if ! grep -q 'payload_diagnostics=covered:'"${EXPECTED_PAYLOAD_COVERED}"',uncovered:'"${EXPECTED_PAYLOAD_UNCOVERED}"',skipped:'"${EXPECTED_PAYLOAD_SKIPPED}" "${HAPPY_STDOUT_PATH}"; then
  fail "Happy-path analyzer stdout is missing the expected payload diagnostics machine summary."
fi

mkdir -p "${FIXTURE_SCHEMA_DIR}"
cat >"${SCHEMA_SPEC_PATH}" <<'YAML'
openapi: 3.0.0
info:
  title: unsupported schema fixture
  version: 1.0.0
paths:
  /compile-fail/{id}:
    post:
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: string
              pattern: "["
      responses:
        '202':
          description: accepted
          content:
            application/json:
              schema:
                type: string
                pattern: "["
YAML

cat >"${SCHEMA_EVENTS_PATH}" <<'JSONL'
{"kind":"http","ts":1772449205657,"method":"POST","route":"/compile-fail/123","status":202,"requestBody":"hello","requestContentType":"application/json","responseBody":"ok","responseContentType":"application/json","queryKeys":[],"headerKeys":["content-type"],"pathParams":{"id":"123"},"test.run_id":"run-schema","test.suite":"suite-schema"}
JSONL

echo "Running fixture-backed analyzer matrix..."
run_report_command_expect_exit 5 \
  "yanote-js/test/fixtures/openapi/http-payload.yaml" \
  "yanote-js/test/fixtures/events/http-payload-unsupported.fixture.jsonl" \
  "${FIXTURE_UNSUPPORTED_DIR}/report" \
  "${FIXTURE_UNSUPPORTED_DIR}/stdout" \
  "${FIXTURE_UNSUPPORTED_DIR}/stderr" \
  --profile local
run_report_command_expect_exit 5 \
  "yanote-js/test/fixtures/openapi/http-payload.yaml" \
  "yanote-js/test/fixtures/events/http-payload-invalid.fixture.jsonl" \
  "${FIXTURE_INVALID_DIR}/report" \
  "${FIXTURE_INVALID_DIR}/stdout" \
  "${FIXTURE_INVALID_DIR}/stderr" \
  --profile local
run_report_command_expect_exit 5 \
  "yanote-js/test/fixtures/openapi/http-payload.yaml" \
  "yanote-js/test/fixtures/events/http-payload-missing.fixture.jsonl" \
  "${FIXTURE_MISSING_DIR}/report" \
  "${FIXTURE_MISSING_DIR}/stdout" \
  "${FIXTURE_MISSING_DIR}/stderr" \
  --profile local
run_report_command_expect_exit 5 \
  "yanote-js/test/fixtures/openapi/http-payload.yaml" \
  "yanote-js/test/fixtures/events/http-payload-partial.fixture.jsonl" \
  "${FIXTURE_PARTIAL_DIR}/report" \
  "${FIXTURE_PARTIAL_DIR}/stdout" \
  "${FIXTURE_PARTIAL_DIR}/stderr" \
  --profile local
run_report_command_expect_exit 5 \
  "${SCHEMA_SPEC_PATH}" \
  "${SCHEMA_EVENTS_PATH}" \
  "${FIXTURE_SCHEMA_DIR}/report" \
  "${FIXTURE_SCHEMA_DIR}/stdout" \
  "${FIXTURE_SCHEMA_DIR}/stderr" \
  --profile local

ensure_summary_output "${FIXTURE_UNSUPPORTED_DIR}/stdout"
ensure_summary_output "${FIXTURE_INVALID_DIR}/stdout"
ensure_summary_output "${FIXTURE_MISSING_DIR}/stdout"
ensure_summary_output "${FIXTURE_PARTIAL_DIR}/stdout"
ensure_summary_output "${FIXTURE_SCHEMA_DIR}/stdout"

for fixture_stderr in \
  "${FIXTURE_UNSUPPORTED_DIR}/stderr" \
  "${FIXTURE_INVALID_DIR}/stderr" \
  "${FIXTURE_MISSING_DIR}/stderr" \
  "${FIXTURE_PARTIAL_DIR}/stderr" \
  "${FIXTURE_SCHEMA_DIR}/stderr"; do
  if [[ ! -s "${fixture_stderr}" ]]; then
    fail "Fixture-backed analyzer command is missing the expected semantic stderr at ${fixture_stderr}."
  fi
done

echo "Running retained semantic red-path analyzer command against full-observation unsupported-schema fixture..."
run_report_command_expect_exit 5 \
  "${SCHEMA_SPEC_PATH}" \
  "${SCHEMA_EVENTS_PATH}" \
  "${GATE_OUT_DIR}" \
  "${GATE_STDOUT_PATH}" \
  "${GATE_STDERR_PATH}" \
  --profile local
ensure_summary_output "${GATE_STDOUT_PATH}"
if ! grep -q 'YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA' "${GATE_STDERR_PATH}"; then
  fail "Retained semantic red-path stderr is missing the expected semantic failure line."
fi
if ! grep -q 'primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA' "${GATE_STDOUT_PATH}"; then
  fail "Retained semantic red-path stdout is missing the expected semantic primary failure."
fi

MATRIX_SUMMARY="$(python3 - "${TMP_DIR}" <<'PY'
import json
import math
import pathlib
import sys

tmp_dir = pathlib.Path(sys.argv[1])


def load_json(path: pathlib.Path):
    if not path.exists():
        raise SystemExit(f"Missing artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_text(path: pathlib.Path) -> str:
    if not path.exists():
        raise SystemExit(f"Missing artifact: {path}")
    return path.read_text(encoding="utf-8")


def assert_close(actual, expected, label):
    if not math.isclose(float(actual), float(expected), abs_tol=1e-6):
        raise SystemExit(f"Unexpected {label}: expected {expected!r}, got {actual!r}")


def summarize_states(report, operation_keys):
    result = {}
    for operation_key in operation_keys:
        entry = next((item for item in report["httpPayloadConformance"]["perOperation"] if item["operationKey"] == operation_key), None)
        result[operation_key] = {
            "request": entry["request"]["state"] if entry else None,
            "response": entry["response"]["state"] if entry else None,
            "suites": entry["suites"] if entry else [],
        }
    return result


def summarize_diagnostics(report):
    return [
        {
            "operationKey": item["operationKey"],
            "target": item["target"],
            "state": item["state"],
            "code": item["code"],
            "suite": item["suite"],
            "declaredStatus": item.get("declaredStatus"),
            "observedStatus": item.get("observedStatus"),
            "observedMediaType": item.get("observedMediaType"),
            "errors": item.get("errors"),
        }
        for item in report["httpPayloadConformance"]["diagnostics"]["items"]
    ]


def assert_stdout(stdout: str, *, request_line: str, response_line: str, diagnostics_line: str, machine_counts: str, label: str):
    required = [
        "Summary\n",
        "HTTP Payload Conformance\n",
        request_line,
        response_line,
        diagnostics_line,
        machine_counts,
        "YANOTE_SUMMARY ",
    ]
    for fragment in required:
        if fragment not in stdout:
            raise SystemExit(f"{label} stdout missing expected fragment: {fragment!r}")


cases = {
    "fixture-unsupported-media": {
        "status": "partial",
        "totalOperations": 6,
        "coveragePercent": 16.67,
        "requestSummary": {
            "coveredOperations": 0,
            "partialOperations": 0,
            "uncoveredOperations": 0,
            "skippedOperations": 1,
            "notApplicableOperations": 5,
            "observedCount": 1,
            "validCount": 0,
            "invalidCount": 0,
            "skippedCount": 1,
        },
        "responseSummary": {
            "coveredOperations": 0,
            "partialOperations": 0,
            "uncoveredOperations": 0,
            "skippedOperations": 1,
            "notApplicableOperations": 5,
            "observedCount": 1,
            "validCount": 0,
            "invalidCount": 0,
            "skippedCount": 1,
        },
        "counts": {"covered": 0, "uncovered": 0, "skipped": 2},
        "states": {
            "http POST /notes": {"request": "SKIPPED", "response": "SKIPPED", "suites": ["suite-notes"]}
        },
        "diagnostics": [
            {
                "operationKey": "http POST /notes",
                "target": "request",
                "state": "SKIPPED",
                "code": "UNSUPPORTED_MEDIA_TYPE",
                "suite": "suite-notes",
                "declaredStatus": None,
                "observedStatus": None,
                "observedMediaType": "text/plain",
                "errors": None,
            },
            {
                "operationKey": "http POST /notes",
                "target": "response",
                "state": "SKIPPED",
                "code": "UNSUPPORTED_MEDIA_TYPE",
                "suite": "suite-notes",
                "declaredStatus": "202",
                "observedStatus": 202,
                "observedMediaType": "text/plain",
                "errors": None,
            },
        ],
        "stdout": {
            "request": "- request: covered=0 partial=0 uncovered=0 skipped=1 n/a=5 observations=1 valid=0 invalid=0 skipped_observations=1",
            "response": "- response: covered=0 partial=0 uncovered=0 skipped=1 n/a=5 observations=1 valid=0 invalid=0 skipped_observations=1",
            "diagnostics": "- diagnostics: covered=0 uncovered=0 skipped=2",
            "machine": "payload_diagnostics=covered:0,uncovered:0,skipped:2",
        },
    },
    "fixture-invalid": {
        "status": "partial",
        "totalOperations": 6,
        "coveragePercent": 33.33,
        "requestSummary": {
            "coveredOperations": 0,
            "partialOperations": 0,
            "uncoveredOperations": 1,
            "skippedOperations": 0,
            "notApplicableOperations": 5,
            "observedCount": 1,
            "validCount": 0,
            "invalidCount": 1,
            "skippedCount": 0,
        },
        "responseSummary": {
            "coveredOperations": 1,
            "partialOperations": 0,
            "uncoveredOperations": 1,
            "skippedOperations": 0,
            "notApplicableOperations": 4,
            "observedCount": 2,
            "validCount": 1,
            "invalidCount": 1,
            "skippedCount": 0,
        },
        "counts": {"covered": 1, "uncovered": 2, "skipped": 0},
        "states": {
            "http GET /audits": {"request": "N/A", "response": "UNCOVERED", "suites": ["suite-invalid-response"]},
            "http POST /users": {"request": "UNCOVERED", "response": "COVERED", "suites": ["suite-invalid-request"]},
        },
        "diagnostics": [
            {
                "operationKey": "http GET /audits",
                "target": "response",
                "state": "UNCOVERED",
                "code": "INVALID_BODY",
                "suite": "suite-invalid-response",
                "declaredStatus": "200",
                "observedStatus": 200,
                "observedMediaType": "application/json",
                "errors": ["/entries/0 must be string"],
            },
            {
                "operationKey": "http POST /users",
                "target": "request",
                "state": "UNCOVERED",
                "code": "INVALID_BODY",
                "suite": "suite-invalid-request",
                "declaredStatus": None,
                "observedStatus": None,
                "observedMediaType": "application/json",
                "errors": ["/ must have required property 'profile'"],
            },
            {
                "operationKey": "http POST /users",
                "target": "response",
                "state": "COVERED",
                "code": "VALID",
                "suite": "suite-invalid-request",
                "declaredStatus": "201",
                "observedStatus": 201,
                "observedMediaType": "application/json",
                "errors": None,
            },
        ],
        "stdout": {
            "request": "- request: covered=0 partial=0 uncovered=1 skipped=0 n/a=5 observations=1 valid=0 invalid=1 skipped_observations=0",
            "response": "- response: covered=1 partial=0 uncovered=1 skipped=0 n/a=4 observations=2 valid=1 invalid=1 skipped_observations=0",
            "diagnostics": "- diagnostics: covered=1 uncovered=2 skipped=0",
            "machine": "payload_diagnostics=covered:1,uncovered:2,skipped:0",
        },
    },
    "fixture-missing": {
        "status": "partial",
        "totalOperations": 6,
        "coveragePercent": 66.67,
        "requestSummary": {
            "coveredOperations": 0,
            "partialOperations": 0,
            "uncoveredOperations": 2,
            "skippedOperations": 0,
            "notApplicableOperations": 4,
            "observedCount": 2,
            "validCount": 0,
            "invalidCount": 2,
            "skippedCount": 0,
        },
        "responseSummary": {
            "coveredOperations": 2,
            "partialOperations": 0,
            "uncoveredOperations": 1,
            "skippedOperations": 0,
            "notApplicableOperations": 3,
            "observedCount": 4,
            "validCount": 2,
            "invalidCount": 2,
            "skippedCount": 0,
        },
        "counts": {"covered": 2, "uncovered": 4, "skipped": 0},
        "states": {
            "http GET /audits": {
                "request": "N/A",
                "response": "UNCOVERED",
                "suites": ["suite-missing-response", "suite-missing-response-content-type"],
            },
            "http POST /drafts": {"request": "N/A", "response": "COVERED", "suites": ["suite-optional-request"]},
            "http POST /profiles": {"request": "UNCOVERED", "response": "N/A", "suites": ["suite-missing-request"]},
            "http POST /users": {
                "request": "UNCOVERED",
                "response": "COVERED",
                "suites": ["suite-missing-request-content-type"],
            },
        },
        "diagnostics": [
            {
                "operationKey": "http GET /audits",
                "target": "response",
                "state": "UNCOVERED",
                "code": "MISSING_BODY",
                "suite": "suite-missing-response",
                "declaredStatus": "200",
                "observedStatus": 200,
                "observedMediaType": None,
                "errors": None,
            },
            {
                "operationKey": "http GET /audits",
                "target": "response",
                "state": "UNCOVERED",
                "code": "MISSING_CONTENT_TYPE",
                "suite": "suite-missing-response-content-type",
                "declaredStatus": "200",
                "observedStatus": 200,
                "observedMediaType": None,
                "errors": None,
            },
            {
                "operationKey": "http POST /drafts",
                "target": "response",
                "state": "COVERED",
                "code": "VALID",
                "suite": "suite-optional-request",
                "declaredStatus": "202",
                "observedStatus": 202,
                "observedMediaType": "application/json",
                "errors": None,
            },
            {
                "operationKey": "http POST /profiles",
                "target": "request",
                "state": "UNCOVERED",
                "code": "MISSING_BODY",
                "suite": "suite-missing-request",
                "declaredStatus": None,
                "observedStatus": None,
                "observedMediaType": None,
                "errors": None,
            },
            {
                "operationKey": "http POST /users",
                "target": "request",
                "state": "UNCOVERED",
                "code": "MISSING_CONTENT_TYPE",
                "suite": "suite-missing-request-content-type",
                "declaredStatus": None,
                "observedStatus": None,
                "observedMediaType": None,
                "errors": None,
            },
            {
                "operationKey": "http POST /users",
                "target": "response",
                "state": "COVERED",
                "code": "VALID",
                "suite": "suite-missing-request-content-type",
                "declaredStatus": "201",
                "observedStatus": 201,
                "observedMediaType": "application/json",
                "errors": None,
            },
        ],
        "stdout": {
            "request": "- request: covered=0 partial=0 uncovered=2 skipped=0 n/a=4 observations=2 valid=0 invalid=2 skipped_observations=0",
            "response": "- response: covered=2 partial=0 uncovered=1 skipped=0 n/a=3 observations=4 valid=2 invalid=2 skipped_observations=0",
            "diagnostics": "- diagnostics: covered=2 uncovered=4 skipped=0",
            "machine": "payload_diagnostics=covered:2,uncovered:4,skipped:0",
        },
    },
    "fixture-partial": {
        "status": "partial",
        "totalOperations": 6,
        "coveragePercent": 16.67,
        "requestSummary": {
            "coveredOperations": 0,
            "partialOperations": 1,
            "uncoveredOperations": 0,
            "skippedOperations": 0,
            "notApplicableOperations": 5,
            "observedCount": 2,
            "validCount": 1,
            "invalidCount": 1,
            "skippedCount": 0,
        },
        "responseSummary": {
            "coveredOperations": 0,
            "partialOperations": 1,
            "uncoveredOperations": 0,
            "skippedOperations": 0,
            "notApplicableOperations": 5,
            "observedCount": 2,
            "validCount": 1,
            "invalidCount": 1,
            "skippedCount": 0,
        },
        "counts": {"covered": 2, "uncovered": 2, "skipped": 0},
        "states": {
            "http POST /orders": {"request": "PARTIAL", "response": "PARTIAL", "suites": ["suite-orders"]}
        },
        "diagnostics": [
            {
                "operationKey": "http POST /orders",
                "target": "request",
                "state": "UNCOVERED",
                "code": "INVALID_BODY",
                "suite": "suite-orders",
                "declaredStatus": None,
                "observedStatus": None,
                "observedMediaType": "application/json",
                "errors": ["/quantity must be >= 1"],
            },
            {
                "operationKey": "http POST /orders",
                "target": "request",
                "state": "COVERED",
                "code": "VALID",
                "suite": "suite-orders",
                "declaredStatus": None,
                "observedStatus": None,
                "observedMediaType": "application/json",
                "errors": None,
            },
            {
                "operationKey": "http POST /orders",
                "target": "response",
                "state": "UNCOVERED",
                "code": "INVALID_BODY",
                "suite": "suite-orders",
                "declaredStatus": "201",
                "observedStatus": 201,
                "observedMediaType": "application/json",
                "errors": ["/ must have required property 'status'"],
            },
            {
                "operationKey": "http POST /orders",
                "target": "response",
                "state": "COVERED",
                "code": "VALID",
                "suite": "suite-orders",
                "declaredStatus": "201",
                "observedStatus": 201,
                "observedMediaType": "application/json",
                "errors": None,
            },
        ],
        "stdout": {
            "request": "- request: covered=0 partial=1 uncovered=0 skipped=0 n/a=5 observations=2 valid=1 invalid=1 skipped_observations=0",
            "response": "- response: covered=0 partial=1 uncovered=0 skipped=0 n/a=5 observations=2 valid=1 invalid=1 skipped_observations=0",
            "diagnostics": "- diagnostics: covered=2 uncovered=2 skipped=0",
            "machine": "payload_diagnostics=covered:2,uncovered:2,skipped:0",
        },
    },
    "fixture-unsupported-schema": {
        "status": "partial",
        "totalOperations": 1,
        "coveragePercent": 100.0,
        "requestSummary": {
            "coveredOperations": 0,
            "partialOperations": 0,
            "uncoveredOperations": 0,
            "skippedOperations": 1,
            "notApplicableOperations": 0,
            "observedCount": 1,
            "validCount": 0,
            "invalidCount": 0,
            "skippedCount": 1,
        },
        "responseSummary": {
            "coveredOperations": 0,
            "partialOperations": 0,
            "uncoveredOperations": 0,
            "skippedOperations": 1,
            "notApplicableOperations": 0,
            "observedCount": 1,
            "validCount": 0,
            "invalidCount": 0,
            "skippedCount": 1,
        },
        "counts": {"covered": 0, "uncovered": 0, "skipped": 2},
        "states": {
            "http POST /compile-fail/{param}": {"request": "SKIPPED", "response": "SKIPPED", "suites": ["suite-schema"]}
        },
        "diagnostics": [
            {
                "operationKey": "http POST /compile-fail/{param}",
                "target": "request",
                "state": "SKIPPED",
                "code": "UNSUPPORTED_SCHEMA",
                "suite": "suite-schema",
                "declaredStatus": None,
                "observedStatus": None,
                "observedMediaType": "application/json",
                "errors": ["Invalid regular expression"],
            },
            {
                "operationKey": "http POST /compile-fail/{param}",
                "target": "response",
                "state": "SKIPPED",
                "code": "UNSUPPORTED_SCHEMA",
                "suite": "suite-schema",
                "declaredStatus": "202",
                "observedStatus": 202,
                "observedMediaType": "application/json",
                "errors": ["Invalid regular expression"],
            },
        ],
        "stdout": {
            "request": "- request: covered=0 partial=0 uncovered=0 skipped=1 n/a=0 observations=1 valid=0 invalid=0 skipped_observations=1",
            "response": "- response: covered=0 partial=0 uncovered=0 skipped=1 n/a=0 observations=1 valid=0 invalid=0 skipped_observations=1",
            "diagnostics": "- diagnostics: covered=0 uncovered=0 skipped=2",
            "machine": "payload_diagnostics=covered:0,uncovered:0,skipped:2",
        },
    },
}

expected_fixture_failures = {
    "fixture-unsupported-media": {
        "primary": "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
        "stderr": [
            "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
            "YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
        ],
    },
    "fixture-invalid": {
        "primary": "SEMANTIC_HTTP_INVALID_BODY",
        "stderr": [
            "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_INVALID_BODY",
            "YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_INVALID_BODY",
        ],
    },
    "fixture-missing": {
        "primary": "SEMANTIC_HTTP_MISSING_BODY",
        "stderr": [
            "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_MISSING_BODY",
            "YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_MISSING_CONTENT_TYPE",
        ],
    },
    "fixture-partial": {
        "primary": "SEMANTIC_HTTP_INVALID_BODY",
        "stderr": [
            "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_INVALID_BODY",
            "YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_INVALID_BODY",
        ],
    },
    "fixture-unsupported-schema": {
        "primary": "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
        "stderr": [
            "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
            "YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA",
        ],
    },
}

for label, expected in cases.items():
    report = load_json(tmp_dir / label / "report" / "yanote-report.json")
    stdout = load_text(tmp_dir / label / "stdout")
    stderr = load_text(tmp_dir / label / "stderr")
    if not stderr:
        raise SystemExit(f"{label} unexpectedly omitted semantic stderr output")
    assert_stdout(
        stdout,
        request_line=expected["stdout"]["request"],
        response_line=expected["stdout"]["response"],
        diagnostics_line=expected["stdout"]["diagnostics"],
        machine_counts=expected["stdout"]["machine"],
        label=label,
    )
    failure_expectations = expected_fixture_failures[label]
    if f"primary={failure_expectations['primary']}" not in stdout:
        raise SystemExit(f"{label} stdout is missing primary={failure_expectations['primary']}")
    for fragment in failure_expectations["stderr"]:
        if fragment not in stderr:
            raise SystemExit(f"{label} stderr missing expected fragment: {fragment!r}")
    if report["status"] != expected["status"]:
        raise SystemExit(f"Unexpected {label} report status: {report['status']!r}")
    if report["summary"]["totalOperations"] != expected["totalOperations"]:
        raise SystemExit(f"Unexpected {label} totalOperations: {report['summary']['totalOperations']!r}")
    assert_close(report["coverage"]["operations"]["percent"], expected["coveragePercent"], f"{label} coverage percent")
    if report["httpPayloadConformance"]["summary"]["request"] != expected["requestSummary"]:
        raise SystemExit(f"Unexpected {label} request summary: {report['httpPayloadConformance']['summary']['request']!r}")
    if report["httpPayloadConformance"]["summary"]["response"] != expected["responseSummary"]:
        raise SystemExit(f"Unexpected {label} response summary: {report['httpPayloadConformance']['summary']['response']!r}")
    if report["httpPayloadConformance"]["diagnostics"]["counts"] != expected["counts"]:
        raise SystemExit(f"Unexpected {label} diagnostic counts: {report['httpPayloadConformance']['diagnostics']['counts']!r}")
    states = summarize_states(report, list(expected["states"].keys()))
    if states != expected["states"]:
        raise SystemExit(f"Unexpected {label} payload states: {states!r}")

    actual_diagnostics = summarize_diagnostics(report)
    if len(actual_diagnostics) != len(expected["diagnostics"]):
        raise SystemExit(f"Unexpected {label} diagnostic length: {len(actual_diagnostics)}")
    for actual, wanted in zip(actual_diagnostics, expected["diagnostics"]):
        for key in [
            "operationKey",
            "target",
            "state",
            "code",
            "suite",
            "declaredStatus",
            "observedStatus",
            "observedMediaType",
        ]:
            if actual.get(key) != wanted.get(key):
                raise SystemExit(f"Unexpected {label} diagnostic field {key}: expected {wanted.get(key)!r}, got {actual.get(key)!r}")
        expected_errors = wanted.get("errors")
        actual_errors = actual.get("errors")
        if expected_errors is None:
            if actual_errors is not None:
                raise SystemExit(f"Unexpected {label} diagnostic errors: {actual_errors!r}")
        else:
            if actual_errors is None or len(actual_errors) != len(expected_errors):
                raise SystemExit(f"Unexpected {label} diagnostic errors: {actual_errors!r}")
            for actual_error, expected_fragment in zip(actual_errors, expected_errors):
                if expected_fragment not in actual_error:
                    raise SystemExit(f"Unexpected {label} diagnostic error text: {actual_error!r}")

gate_report = load_json(tmp_dir / "report-gate" / "yanote-report.json")
gate_stdout = load_text(tmp_dir / "report-gate.stdout")
gate_stderr = load_text(tmp_dir / "report-gate.stderr")
assert_stdout(
    gate_stdout,
    request_line=cases["fixture-unsupported-schema"]["stdout"]["request"],
    response_line=cases["fixture-unsupported-schema"]["stdout"]["response"],
    diagnostics_line=cases["fixture-unsupported-schema"]["stdout"]["diagnostics"],
    machine_counts=cases["fixture-unsupported-schema"]["stdout"]["machine"],
    label="gate",
)
if gate_report["status"] != "partial":
    raise SystemExit(f"Unexpected gate report status: {gate_report['status']!r}")
if gate_report["summary"]["coveredOperations"] != 1 or gate_report["summary"]["totalOperations"] != 1:
    raise SystemExit(f"Unexpected gate covered/total operations: {gate_report['summary']!r}")
assert_close(gate_report["summary"]["operationCoveragePercent"], 100.0, "gate operation coverage percent")
assert_close(gate_report["summary"]["aggregateCoveragePercent"], 100.0, "gate aggregate coverage percent")
for dimension in ["operations", "status", "parameters", "aggregate"]:
    assert_close(gate_report["coverage"][dimension]["percent"], 100.0, f"gate {dimension} percent")
    if gate_report["coverage"][dimension]["state"] != "COVERED":
        raise SystemExit(f"Unexpected gate {dimension} state: {gate_report['coverage'][dimension]['state']!r}")
if gate_report["httpPayloadConformance"]["diagnostics"]["counts"] != cases["fixture-unsupported-schema"]["counts"]:
    raise SystemExit(f"Unexpected gate diagnostic counts: {gate_report['httpPayloadConformance']['diagnostics']['counts']!r}")
if "primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA" not in gate_stdout:
    raise SystemExit("Gate stdout is missing the expected semantic primary")
if "YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA" not in gate_stderr:
    raise SystemExit("Gate stderr is missing the expected semantic YANOTE_ERROR line")

print(
    "fixtures=unsupported-media,invalid,missing,partial,unsupported-schema red_path=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA payload_matrix=validated"
)
PY
)" || fail "Fixture-backed report matrix drifted from the documented payload interpretation contract."

echo "Analysis proof passed: ${EVENT_SUMMARY}; ${HAPPY_SUMMARY}; ${MATRIX_SUMMARY}"
