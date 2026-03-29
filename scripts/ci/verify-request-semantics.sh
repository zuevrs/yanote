#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-m011-s02-request-semantics.XXXXXX")"
BUILD_LOG_PATH="${TMP_DIR}/build.log"
ANALYZER_BUILD_LOG_PATH="${TMP_DIR}/analyzer-build.log"
APP_LOG_PATH="${TMP_DIR}/example-service.log"
TEST_LOG_PATH="${TMP_DIR}/restassured-test.log"
REPORT_STDOUT_PATH="${TMP_DIR}/report.stdout"
REPORT_STDERR_PATH="${TMP_DIR}/report.stderr"
EVENTS_PATH="${TMP_DIR}/events.jsonl"
REPORT_OUT_DIR="${TMP_DIR}/report-out"
REPORT_JSON_PATH="${REPORT_OUT_DIR}/yanote-report.json"
HOST_GRADLE_HOME="${TMP_DIR}/gradle-home"
FALLBACK_GRADLE_HOME="${HOME}/.gradle"
FALLBACK_GRADLE_DIST_HOME="${FALLBACK_GRADLE_HOME}/wrapper/dists"
FALLBACK_GRADLE_CACHE_HOME="${FALLBACK_GRADLE_HOME}/caches"
APP_PID=""
KEEP_TEMP="${YANOTE_KEEP_TEMP:-false}"

EXPECTED_RUN_ID="${YANOTE_EXPECTED_RUN_ID:-m011-request-semantics-run}"
EXPECTED_SUITE="${YANOTE_EXPECTED_SUITE:-m011-request-semantics-suite}"
EXPECTED_OPERATION_KEY="http GET /request-evidence/users/{param}"
EXPECTED_ROUTE="/request-evidence/users/{param}"
AUTHORIZATION_SECRET="Bearer proof-secret-token"
SESSION_SECRET="proof-session-secret"
UNSUPPORTED_META="opaque"
TAG_ONE="alpha"
TAG_TWO="bravo"

mkdir -p "${HOST_GRADLE_HOME}"
if [[ -d "${FALLBACK_GRADLE_CACHE_HOME}" ]]; then
  ln -s "${FALLBACK_GRADLE_CACHE_HOME}" "${HOST_GRADLE_HOME}/caches"
fi
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

wait_for_port() {
  python3 - "$1" "$2" <<'PY'
import socket
import sys
import time

host = sys.argv[1]
port = int(sys.argv[2])
for _ in range(90):
    try:
        with socket.create_connection((host, port), timeout=1):
            raise SystemExit(0)
    except OSError:
        time.sleep(1)
raise SystemExit(1)
PY
}

print_artifacts() {
  echo "Artifacts retained at: ${TMP_DIR}" >&2
  echo "  build_log: ${BUILD_LOG_PATH}" >&2
  echo "  analyzer_build_log: ${ANALYZER_BUILD_LOG_PATH}" >&2
  echo "  app_log: ${APP_LOG_PATH}" >&2
  echo "  test_log: ${TEST_LOG_PATH}" >&2
  echo "  report_stdout: ${REPORT_STDOUT_PATH}" >&2
  echo "  report_stderr: ${REPORT_STDERR_PATH}" >&2
  echo "  events_file: ${EVENTS_PATH}" >&2
  echo "  report_json: ${REPORT_JSON_PATH}" >&2
}

show_failure_tail() {
  local file
  for file in \
    "${BUILD_LOG_PATH}" \
    "${ANALYZER_BUILD_LOG_PATH}" \
    "${APP_LOG_PATH}" \
    "${TEST_LOG_PATH}" \
    "${REPORT_STDERR_PATH}"; do
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
  if [[ -n "${APP_PID}" ]] && kill -0 "${APP_PID}" >/dev/null 2>&1; then
    kill "${APP_PID}" >/dev/null 2>&1 || true
    wait "${APP_PID}" >/dev/null 2>&1 || true
  fi

  if [[ "${KEEP_TEMP}" != "true" ]]; then
    rm -rf "${TMP_DIR}"
  else
    print_artifacts
  fi
}
trap cleanup EXIT

ensure_file_contains_no_secret() {
  local file="$1"
  local label="$2"
  if [[ -f "${file}" ]] && grep -Fq "${AUTHORIZATION_SECRET}" "${file}"; then
    fail "${label} leaked Authorization value."
  fi
  if [[ -f "${file}" ]] && grep -Fq "${SESSION_SECRET}" "${file}"; then
    fail "${label} leaked SESSION cookie value."
  fi
}

ensure_file_contains_none() {
  local file="$1"
  local label="$2"
  shift 2
  local needle
  for needle in "$@"; do
    if [[ -f "${file}" ]] && grep -Fq "${needle}" "${file}"; then
      fail "${label} leaked retained request value '${needle}'."
    fi
  done
}

run_report() {
  local exit_code=0
  mkdir -p "${REPORT_OUT_DIR}"
  if (
    cd "${ROOT_DIR}" && \
    node yanote-js/dist/yanote.cjs report \
      --spec examples/openapi/request-evidence-openapi.yaml \
      --events "${EVENTS_PATH}" \
      --out "${REPORT_OUT_DIR}" \
      --min-coverage 100
  ) >"${REPORT_STDOUT_PATH}" 2>"${REPORT_STDERR_PATH}"; then
    exit_code=0
  else
    exit_code=$?
  fi

  if [[ "${exit_code}" -ne 5 ]]; then
    fail "yanote report exited with ${exit_code}; expected fail-closed exit 5 for unsupported request semantics."
  fi
}

echo "Building focused Spring MVC request-semantics proof assets..."
if ! (
  cd "${ROOT_DIR}" && \
  ./gradlew --no-daemon -g "${HOST_GRADLE_HOME}" \
    :examples:springmvc-service:bootJar \
    :examples:tests-restassured:testClasses \
    :examples:tests-restassured:resolveTestRuntimeClasspath
) >"${BUILD_LOG_PATH}" 2>&1; then
  fail "Gradle build for focused request-semantics proof failed."
fi

echo "Building yanote-js analyzer..."
if ! (
  cd "${ROOT_DIR}" && \
  npm -C yanote-js ci && \
  npm -C yanote-js run build
) >"${ANALYZER_BUILD_LOG_PATH}" 2>&1; then
  fail "yanote-js build failed."
fi

BOOT_JAR="$(${ROOT_DIR}/examples/resolve-springmvc-boot-jar.sh)"
if [[ -z "${BOOT_JAR}" || ! -f "${BOOT_JAR}" ]]; then
  fail "Unable to locate Spring Boot example jar in examples/springmvc-service/build/libs."
fi

echo "Starting focused Spring MVC request-semantics proof service on ${BASE_URL}..."
rm -f "${EVENTS_PATH}"
java \
  -Dserver.port="${PORT}" \
  -Dyanote.recorder.enabled=true \
  -Dyanote.recorder.events-path="${EVENTS_PATH}" \
  -Dexample.kafka.enabled=false \
  -jar "${BOOT_JAR}" >"${APP_LOG_PATH}" 2>&1 &
APP_PID=$!

if ! wait_for_port 127.0.0.1 "${PORT}"; then
  if ! kill -0 "${APP_PID}" >/dev/null 2>&1; then
    fail "Example service exited before becoming ready."
  fi
  fail "Example service did not become ready within 90 seconds."
fi

echo "Running focused RestAssured request-semantics proof..."
if ! (
  cd "${ROOT_DIR}" && \
  YANOTE_RUN_ID="${EXPECTED_RUN_ID}" \
  YANOTE_SUITE="${EXPECTED_SUITE}" \
  YANOTE_BASE_URI="${BASE_URL}" \
  YANOTE_EVENTS_PATH="${EVENTS_PATH}" \
  ./gradlew --no-daemon -g "${HOST_GRADLE_HOME}" :examples:tests-restassured:test \
    --tests 'dev.yanote.examples.tests.HttpRequestEvidenceE2eTest' \
    --rerun-tasks
) >"${TEST_LOG_PATH}" 2>&1; then
  fail "Focused RestAssured request-semantics proof failed."
fi

[[ -f "${EVENTS_PATH}" ]] || fail "Focused proof did not create events.jsonl."
[[ -s "${EVENTS_PATH}" ]] || fail "Focused proof created an empty events.jsonl."

python3 - "${EVENTS_PATH}" "${EXPECTED_RUN_ID}" "${EXPECTED_SUITE}" <<'PY' || fail "Raw events.jsonl request-semantics assertions failed."
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_run = sys.argv[2]
expected_suite = sys.argv[3]
records = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
tagged = [record for record in records if record.get("test.run_id") == expected_run and record.get("test.suite") == expected_suite]
if len(tagged) != 1:
    raise SystemExit(f"Expected exactly one tagged focused event, got {len(tagged)}")
record = tagged[0]
if record.get("method") != "GET":
    raise SystemExit(f"Expected GET event, got {record.get('method')!r}")
if record.get("route") != "/request-evidence/users/{userId}":
    raise SystemExit(f"Expected templated route '/request-evidence/users/{{userId}}', got {record.get('route')!r}")
if record.get("status") != 200:
    raise SystemExit(f"Expected status 200, got {record.get('status')!r}")

def assert_state(node, expected_state, expected_reason=None, expected_values=None):
    if not isinstance(node, dict):
        raise SystemExit(f"Expected evidence object, got {node!r}")
    if node.get("state") != expected_state:
        raise SystemExit(f"Expected evidence state {expected_state!r}, got {node.get('state')!r}")
    if expected_reason is None:
        if node.get("reason") is not None:
            raise SystemExit(f"Expected no evidence reason, got {node.get('reason')!r}")
    elif node.get("reason") != expected_reason:
        raise SystemExit(f"Expected evidence reason {expected_reason!r}, got {node.get('reason')!r}")
    if expected_values is not None:
        values = node.get("values")
        if values != expected_values:
            raise SystemExit(f"Expected captured values {expected_values!r}, got {values!r}")
    elif "values" in node and node.get("values") not in (None, []):
        raise SystemExit(f"Expected no retained values for {expected_state!r}, got {node.get('values')!r}")

assert_state(record["pathParams"]["userId"], "captured", expected_values=["user-42"])
assert_state(record["queryParams"]["expand"], "captured", expected_values=["true"])
assert_state(record["queryParams"]["tags"], "captured", expected_values=["alpha", "bravo"])
assert_state(record["queryParams"]["meta"], "captured", expected_values=["opaque"])
assert_state(record["requestHeaders"]["x-request-flavor"], "captured", expected_values=["amber"])
assert_state(record["requestHeaders"]["authorization"], "redacted", expected_reason="sensitive")
assert_state(record["cookies"]["clientMode"], "captured", expected_values=["compact"])
assert_state(record["cookies"]["SESSION"], "redacted", expected_reason="sensitive")

if "oversizedHint" in record.get("queryParams", {}):
    raise SystemExit("Did not expect oversizedHint evidence in the focused semantics proof")

request_headers = record.get("requestHeaders", {})
for banned_key in ("cookie", "x-test-run-id", "x-test-suite"):
    if banned_key in request_headers:
        raise SystemExit(f"Unexpected recorder header evidence for {banned_key!r}")

serialized = json.dumps(record, sort_keys=True)
for secret in ("Bearer proof-secret-token", "proof-session-secret"):
    if secret in serialized:
        raise SystemExit(f"Sensitive value leaked into raw events artifact: {secret}")
PY

ensure_file_contains_no_secret "${EVENTS_PATH}" "events.jsonl"

echo "Running yanote report against focused request-semantics spec..."
run_report

[[ -f "${REPORT_JSON_PATH}" ]] || fail "yanote report did not produce yanote-report.json."

if ! grep -q '^HTTP Request Conformance$' "${REPORT_STDOUT_PATH}"; then
  fail "yanote report stdout is missing the HTTP Request Conformance section."
fi
if ! grep -q '^Top Issues$' "${REPORT_STDOUT_PATH}"; then
  fail "yanote report stdout is missing the Top Issues section."
fi
if ! grep -q '^YANOTE_SUMMARY ' "${REPORT_STDOUT_PATH}"; then
  fail "yanote report stdout is missing the final YANOTE_SUMMARY line."
fi
if ! grep -q 'YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER' "${REPORT_STDERR_PATH}"; then
  fail "yanote report stderr is missing the unsupported request-semantic failure line."
fi
if grep -q 'YANOTE_ERROR_SECONDARY' "${REPORT_STDERR_PATH}"; then
  fail "yanote report stderr unexpectedly emitted secondary failures for the focused unsupported request proof."
fi

python3 - "${REPORT_JSON_PATH}" "${EXPECTED_OPERATION_KEY}" "${EXPECTED_ROUTE}" <<'PY' || fail "yanote-report.json request-semantics assertions failed."
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_operation_key = sys.argv[2]
expected_route = sys.argv[3]
report = json.loads(path.read_text(encoding="utf-8"))
if report.get("status") != "ok":
    raise SystemExit(f"Expected report status 'ok', got {report.get('status')!r}")
summary = report.get("httpRequestConformance", {}).get("summary", {})
expected_counts = {
    "capturedValid": 5,
    "capturedInvalid": 0,
    "redacted": 0,
    "omitted": 0,
    "unsupported": 1,
}
if summary.get("observedOperations") != 1:
    raise SystemExit(f"Expected observedOperations=1, got {summary.get('observedOperations')!r}")
if summary.get("observedParameters") != 6:
    raise SystemExit(f"Expected observedParameters=6, got {summary.get('observedParameters')!r}")
if summary.get("counts") != expected_counts:
    raise SystemExit(f"Expected request summary counts {expected_counts!r}, got {summary.get('counts')!r}")

per_operation = report.get("httpRequestConformance", {}).get("perOperation", [])
if len(per_operation) != 1:
    raise SystemExit(f"Expected exactly one request-conformance operation, got {len(per_operation)}")
operation = per_operation[0]
if operation.get("operationKey") != expected_operation_key:
    raise SystemExit(f"Expected operationKey {expected_operation_key!r}, got {operation.get('operationKey')!r}")
if operation.get("route") != expected_route:
    raise SystemExit(f"Expected normalized route {expected_route!r}, got {operation.get('route')!r}")
if operation.get("observedCount") != 1:
    raise SystemExit(f"Expected observedCount=1, got {operation.get('observedCount')!r}")
if operation.get("counts") != expected_counts:
    raise SystemExit(f"Expected per-operation counts {expected_counts!r}, got {operation.get('counts')!r}")

truth_by_parameter = {(item["in"], item["name"]): item for item in operation.get("parameters", [])}
expected_parameter_counts = {
    ("path", "userId"): {"capturedValid": 1, "capturedInvalid": 0, "redacted": 0, "omitted": 0, "unsupported": 0},
    ("query", "expand"): {"capturedValid": 1, "capturedInvalid": 0, "redacted": 0, "omitted": 0, "unsupported": 0},
    ("query", "tags"): {"capturedValid": 1, "capturedInvalid": 0, "redacted": 0, "omitted": 0, "unsupported": 0},
    ("query", "meta"): {"capturedValid": 0, "capturedInvalid": 0, "redacted": 0, "omitted": 0, "unsupported": 1},
    ("header", "X-Request-Flavor"): {"capturedValid": 1, "capturedInvalid": 0, "redacted": 0, "omitted": 0, "unsupported": 0},
    ("cookie", "clientMode"): {"capturedValid": 1, "capturedInvalid": 0, "redacted": 0, "omitted": 0, "unsupported": 0},
}
for key, expected in expected_parameter_counts.items():
    if key not in truth_by_parameter:
        raise SystemExit(f"Missing request-conformance parameter summary for {key!r}")
    actual = truth_by_parameter[key].get("counts")
    if actual != expected:
        raise SystemExit(f"Expected counts {expected!r} for {key!r}, got {actual!r}")

meta = truth_by_parameter[("query", "meta")]
if meta.get("declaredSupport") != "unsupported" or meta.get("declaredSupportReason") != "schema":
    raise SystemExit(f"Expected query meta to publish unsupported schema support metadata, got {meta!r}")

tags = truth_by_parameter[("query", "tags")]
if tags.get("declaredSupport") != "supported" or tags.get("declaredSupportShape") != "array":
    raise SystemExit(f"Expected query tags to publish supported array metadata, got {tags!r}")

diagnostics = report.get("httpRequestConformance", {}).get("diagnostics", {}).get("items", [])
if len(diagnostics) != 6:
    raise SystemExit(f"Expected 6 request-conformance diagnostics, got {len(diagnostics)}")
truths = {(item["location"], item["name"]): item["truth"] for item in diagnostics}
expected_truths = {
    ("path", "userId"): "captured-valid",
    ("query", "expand"): "captured-valid",
    ("query", "tags"): "captured-valid",
    ("query", "meta"): "unsupported",
    ("header", "X-Request-Flavor"): "captured-valid",
    ("cookie", "clientMode"): "captured-valid",
}
if truths != expected_truths:
    raise SystemExit(f"Expected diagnostic truths {expected_truths!r}, got {truths!r}")

unsupported = next((item for item in diagnostics if item["location"] == "query" and item["name"] == "meta"), None)
if unsupported is None:
    raise SystemExit("Missing unsupported query meta diagnostic")
if unsupported.get("observedValues") != ["opaque"]:
    raise SystemExit(f"Expected retained unsupported meta values ['opaque'], got {unsupported.get('observedValues')!r}")

codes = [item.get("code") for item in report.get("governance", {}).get("diagnostics", [])]
if codes != ["SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER"]:
    raise SystemExit(f"Expected one governance diagnostic for unsupported request semantics, got {codes!r}")

serialized = json.dumps(report, sort_keys=True)
for secret in ("Bearer proof-secret-token", "proof-session-secret"):
    if secret in serialized:
        raise SystemExit(f"Sensitive value leaked into report artifact: {secret}")
PY

ensure_file_contains_no_secret "${REPORT_JSON_PATH}" "yanote-report.json"
ensure_file_contains_no_secret "${REPORT_STDOUT_PATH}" "yanote report stdout"
ensure_file_contains_no_secret "${REPORT_STDERR_PATH}" "yanote report stderr"
ensure_file_contains_none "${REPORT_STDOUT_PATH}" "yanote report stdout" "${TAG_ONE}" "${TAG_TWO}" "${UNSUPPORTED_META}"
ensure_file_contains_none "${REPORT_STDERR_PATH}" "yanote report stderr" "${TAG_ONE}" "${TAG_TWO}" "${UNSUPPORTED_META}"

if ! grep -q -- '- status: ok' "${REPORT_STDOUT_PATH}"; then
  fail "yanote report stdout summary should remain status ok while surfacing fail-closed request semantics through governance."
fi
if ! grep -q -- '- observations: operations=1 parameters=6' "${REPORT_STDOUT_PATH}"; then
  fail "yanote report stdout is missing the expected request observation summary."
fi
if ! grep -q -- '- truths: captured-valid=5 captured-invalid=0 redacted=0 omitted=0 unsupported=1' "${REPORT_STDOUT_PATH}"; then
  fail "yanote report stdout is missing the expected request truth counts."
fi
if ! grep -q -- "- high: SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER - query parameter 'meta' for ${EXPECTED_OPERATION_KEY} falls outside the published supported request serialization subset." "${REPORT_STDOUT_PATH}"; then
  fail "yanote report stdout is missing the unsupported request-semantic Top Issue."
fi
if ! grep -q 'primary=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER' "${REPORT_STDOUT_PATH}"; then
  fail "YANOTE_SUMMARY is missing the unsupported request-semantic primary code."
fi

echo "Focused request-semantics verifier passed."
if [[ "${KEEP_TEMP}" == "true" ]]; then
  print_artifacts
fi
