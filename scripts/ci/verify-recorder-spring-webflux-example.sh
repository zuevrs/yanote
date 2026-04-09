#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-webflux-example.XXXXXX")"
BUILD_LOG_PATH="${TMP_DIR}/build.log"
APP_LOG_PATH="${TMP_DIR}/app.log"
RESPONSE_PATH="${TMP_DIR}/response.json"
EVENTS_PATH="${TMP_DIR}/events/events.jsonl"
HOST_GRADLE_HOME="${TMP_DIR}/gradle-home"
FALLBACK_GRADLE_HOME="${HOME}/.gradle"
FALLBACK_GRADLE_DIST_HOME="${FALLBACK_GRADLE_HOME}/wrapper/dists"
FALLBACK_GRADLE_CACHE_HOME="${FALLBACK_GRADLE_HOME}/caches"
APP_PID=""
KEEP_TEMP="${YANOTE_KEEP_TEMP:-false}"
BOOTSTRAP_PHASE="init"

ACTUAL_SERVICE_NAME="${EXAMPLE_SERVICE_NAME:-examples-webflux-service-proof}"
EXPECTED_RUN_ID="${YANOTE_EXPECTED_RUN_ID:-webflux-proof-run}"
EXPECTED_SUITE="${YANOTE_EXPECTED_SUITE:-webflux-proof-suite}"
REQUEST_FLAVOR="${YANOTE_REQUEST_FLAVOR:-amber}"
AUTHORIZATION_SECRET="Bearer proof-secret-token"
SESSION_SECRET="proof-session-secret"
STARTUP_TIMEOUT_SECONDS="${YANOTE_STARTUP_TIMEOUT_SECONDS:-90}"

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
REQUEST_PATH="/request-evidence/users/user-42?expand=true&tags=alpha&tags=bravo"

is_port_open() {
  python3 - "${PORT}" <<'PY'
import socket
import sys

port = int(sys.argv[1])
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(0.2)
try:
    sock.connect(("127.0.0.1", port))
except OSError:
    raise SystemExit(1)
finally:
    sock.close()
PY
}

wait_for_port_readiness() {
  local attempt

  BOOTSTRAP_PHASE="readiness"
  for attempt in $(seq 1 "${STARTUP_TIMEOUT_SECONDS}"); do
    if is_port_open; then
      return 0
    fi

    if ! kill -0 "${APP_PID}" >/dev/null 2>&1; then
      fail "WebFlux example exited before opening port ${PORT}."
    fi

    sleep 1
  done

  fail "WebFlux example did not open port ${PORT} within ${STARTUP_TIMEOUT_SECONDS} seconds."
}

wait_for_recorded_event() {
  local attempt

  BOOTSTRAP_PHASE="validation"
  for attempt in $(seq 1 30); do
    if [[ -s "${EVENTS_PATH}" ]]; then
      return 0
    fi

    if ! kill -0 "${APP_PID}" >/dev/null 2>&1; then
      fail "WebFlux example exited before recorder output appeared."
    fi

    sleep 0.2
  done

  if [[ ! -f "${EVENTS_PATH}" ]]; then
    fail "Recorder did not create events.jsonl."
  fi

  fail "Recorder created events.jsonl but left it empty."
}

print_failure_artifacts() {
  echo "Verification failed. Retained failure artifacts:" >&2
  echo "  phase: ${BOOTSTRAP_PHASE}" >&2
  echo "  readiness_port: ${PORT}" >&2
  echo "  temp_dir: ${TMP_DIR}" >&2
  echo "  gradle_home: ${HOST_GRADLE_HOME}" >&2
  echo "  build_log: ${BUILD_LOG_PATH}" >&2
  echo "  app_log: ${APP_LOG_PATH}" >&2
  echo "  events_file: ${EVENTS_PATH}" >&2
  echo "  response_file: ${RESPONSE_PATH}" >&2
}

show_failure_tail() {
  if [[ -s "${BUILD_LOG_PATH}" ]]; then
    echo "--- build.log (tail) ---" >&2
    tail -n 60 "${BUILD_LOG_PATH}" >&2 || true
  fi
  if [[ -s "${APP_LOG_PATH}" ]]; then
    echo "--- app.log (tail) ---" >&2
    tail -n 80 "${APP_LOG_PATH}" >&2 || true
  fi
}

fail() {
  local message="$1"
  echo "ERROR [${BOOTSTRAP_PHASE}]: ${message}" >&2
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
    rm -rf "${TMP_DIR}" || true
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

echo "Building WebFlux example classes..."
BOOTSTRAP_PHASE="build"
if ! (
  cd "${ROOT_DIR}" && \
  ./gradlew --no-daemon -g "${HOST_GRADLE_HOME}" :examples:webflux-service:classes
) >"${BUILD_LOG_PATH}" 2>&1; then
  fail "Gradle build for WebFlux example failed."
fi

echo "Starting WebFlux example on ${BASE_URL}..."
BOOTSTRAP_PHASE="bootRun"
(
  cd "${ROOT_DIR}"
  EXAMPLE_SERVER_PORT="${PORT}" \
  YANOTE_EVENTS_PATH="${EVENTS_PATH}" \
  EXAMPLE_SERVICE_NAME="${ACTUAL_SERVICE_NAME}" \
  ./gradlew --no-daemon -g "${HOST_GRADLE_HOME}" :examples:webflux-service:bootRun
) >"${APP_LOG_PATH}" 2>&1 &
APP_PID=$!

echo "Waiting for WebFlux example to open port ${PORT}..."
wait_for_port_readiness

echo "Sending proof request to ${BASE_URL}${REQUEST_PATH}..."
BOOTSTRAP_PHASE="request"
if ! curl --noproxy '*' --fail --silent --show-error \
  -H "X-Test-Run-Id: ${EXPECTED_RUN_ID}" \
  -H "X-Test-Suite: ${EXPECTED_SUITE}" \
  -H "X-Request-Flavor: ${REQUEST_FLAVOR}" \
  -H "Authorization: ${AUTHORIZATION_SECRET}" \
  -b "clientMode=compact; SESSION=${SESSION_SECRET}" \
  "${BASE_URL}${REQUEST_PATH}" >"${RESPONSE_PATH}"; then
  fail "HTTP proof request failed."
fi

BOOTSTRAP_PHASE="validation"
wait_for_recorded_event

SUMMARY="$(python3 - "${EVENTS_PATH}" "${RESPONSE_PATH}" "${ACTUAL_SERVICE_NAME}" "${EXPECTED_RUN_ID}" "${EXPECTED_SUITE}" "${REQUEST_FLAVOR}" <<'PY'
import json
import pathlib
import sys


def expect(condition, message):
    if not condition:
        raise SystemExit(message)


def expect_state(container, key, expected_state, expected_values=None, expected_reason=None):
    expect(container is not None and key in container, f"Expected evidence entry for {key!r}")
    node = container[key]
    expect(isinstance(node, dict), f"Expected evidence object for {key!r}, got {node!r}")
    expect(node.get("state") == expected_state, f"Expected {key!r} state {expected_state!r}, got {node.get('state')!r}")
    if expected_values is None:
        expect(node.get("values") in (None, []), f"Expected {key!r} to omit retained values, got {node.get('values')!r}")
    else:
        expect(node.get("values") == expected_values, f"Expected {key!r} values {expected_values!r}, got {node.get('values')!r}")
    if expected_reason is None:
        expect(node.get("reason") is None, f"Expected {key!r} to omit reason, got {node.get('reason')!r}")
    else:
        expect(node.get("reason") == expected_reason, f"Expected {key!r} reason {expected_reason!r}, got {node.get('reason')!r}")


events_path = pathlib.Path(sys.argv[1])
response_path = pathlib.Path(sys.argv[2])
expected_service = sys.argv[3]
expected_run_id = sys.argv[4]
expected_suite = sys.argv[5]
expected_request_flavor = sys.argv[6]

lines = [line for line in events_path.read_text(encoding="utf-8").splitlines() if line.strip()]
expect(len(lines) == 1, f"Expected exactly one JSONL record, got {len(lines)}")
record = json.loads(lines[0])
response = json.loads(response_path.read_text(encoding="utf-8"))

expect(response == {
    "userId": "user-42",
    "expand": True,
    "tags": ["alpha", "bravo"],
    "requestFlavor": expected_request_flavor,
    "clientMode": "compact",
    "authorizationProvided": True,
    "sessionProvided": True,
}, f"Unexpected response payload: {response!r}")

expected_pairs = {
    "method": "GET",
    "route": "/request-evidence/users/{userId}",
    "status": 200,
    "service": expected_service,
    "test.run_id": expected_run_id,
    "test.suite": expected_suite,
}
for key, expected in expected_pairs.items():
    actual = record.get(key)
    expect(actual == expected, f"Expected {key}={expected!r}, got {actual!r}")

expect_state(record.get("pathParams"), "userId", "captured", ["user-42"])
expect_state(record.get("queryParams"), "expand", "captured", ["true"])
expect_state(record.get("queryParams"), "tags", "captured", ["alpha", "bravo"])
expect_state(record.get("requestHeaders"), "x-request-flavor", "captured", [expected_request_flavor])
expect_state(record.get("requestHeaders"), "authorization", "redacted", expected_reason="sensitive")
expect_state(record.get("cookies"), "clientMode", "captured", ["compact"])
expect_state(record.get("cookies"), "SESSION", "redacted", expected_reason="sensitive")

request_headers = record.get("requestHeaders") or {}
expect("x-test-run-id" not in request_headers, "Recorder should not retain x-test-run-id in requestHeaders")
expect("x-test-suite" not in request_headers, "Recorder should not retain x-test-suite in requestHeaders")
expect("cookie" not in request_headers, "Recorder should not retain raw Cookie header evidence")

for key in (
    "requestBody",
    "requestBodyState",
    "requestBodyReason",
    "requestContentType",
    "responseBody",
    "responseBodyState",
    "responseBodyReason",
    "responseContentType",
):
    expect(record.get(key) is None, f"Expected {key} to stay null/absent, got {record.get(key)!r}")

serialized = json.dumps(record, sort_keys=True)
for secret in ("Bearer proof-secret-token", "proof-session-secret"):
    expect(secret not in serialized, f"Sensitive value leaked into events.jsonl: {secret}")

print(
    "method={method} route={route} status={status} service={service} test.run_id={run_id} test.suite={suite}".format(
        method=record["method"],
        route=record["route"],
        status=record["status"],
        service=record["service"],
        run_id=record["test.run_id"],
        suite=record["test.suite"],
    )
)
PY
)" || fail "Recorded JSONL fields drifted from the WebFlux proof contract."

ensure_file_contains_no_secret "${EVENTS_PATH}" "events.jsonl"

echo "WebFlux recorder proof passed: ${SUMMARY}"
