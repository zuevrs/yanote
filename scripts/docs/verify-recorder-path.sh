#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FIXTURE_DIR="${ROOT_DIR}/test/fixtures/recorder-spring-smoke"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-s01-recorder.XXXXXX")"
PUBLISH_LOG_PATH="${TMP_DIR}/publish.log"
APP_LOG_PATH="${TMP_DIR}/fixture.log"
RESPONSE_PATH="${TMP_DIR}/response.json"
EVENTS_PATH="${TMP_DIR}/events/events.jsonl"

YANOTE_GROUP="$(grep -E '^group=' "${ROOT_DIR}/gradle.properties" | head -n 1 | cut -d= -f2-)"
YANOTE_VERSION="$(grep -E '^version=' "${ROOT_DIR}/gradle.properties" | head -n 1 | cut -d= -f2-)"
ACTUAL_SERVICE_NAME="${YANOTE_SERVICE_NAME:-recorder-spring-smoke}"
EXPECTED_METHOD="${YANOTE_EXPECTED_METHOD:-GET}"
EXPECTED_ROUTE="${YANOTE_EXPECTED_ROUTE:-/orders/{orderId}}"
EXPECTED_STATUS="${YANOTE_EXPECTED_STATUS:-200}"
EXPECTED_SERVICE_NAME="${YANOTE_EXPECTED_SERVICE_NAME:-${ACTUAL_SERVICE_NAME}}"
HOST_GRADLE_HOME="${TMP_DIR}/gradle-home"
FALLBACK_GRADLE_DIST_HOME="${HOME}/.gradle/wrapper/dists"
FALLBACK_GRADLE_MODULES_CACHE="${HOME}/.gradle/caches/modules-2"
FALLBACK_GRADLE_JARS_CACHE="${HOME}/.gradle/caches/jars-9"
STARTUP_TIMEOUT_SECONDS="${YANOTE_STARTUP_TIMEOUT_SECONDS:-90}"
PUBLISH_RETRY_MAX_ATTEMPTS="${YANOTE_PUBLISH_RETRY_MAX_ATTEMPTS:-2}"
KEEP_TEMP="false"
APP_PID=""
BOOTSTRAP_PHASE="init"

mkdir -p "${HOST_GRADLE_HOME}"
if [[ -d "${FALLBACK_GRADLE_DIST_HOME}" ]]; then
  mkdir -p "${HOST_GRADLE_HOME}/wrapper"
  ln -s "${FALLBACK_GRADLE_DIST_HOME}" "${HOST_GRADLE_HOME}/wrapper/dists"
fi
if [[ -d "${FALLBACK_GRADLE_MODULES_CACHE}" ]]; then
  mkdir -p "${HOST_GRADLE_HOME}/caches"
  ln -s "${FALLBACK_GRADLE_MODULES_CACHE}" "${HOST_GRADLE_HOME}/caches/modules-2"
fi
if [[ -d "${FALLBACK_GRADLE_JARS_CACHE}" ]]; then
  mkdir -p "${HOST_GRADLE_HOME}/caches"
  ln -s "${FALLBACK_GRADLE_JARS_CACHE}" "${HOST_GRADLE_HOME}/caches/jars-9"
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
REQUEST_PATH="/orders/42?expand=true"

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
      fail "Spring smoke fixture exited before opening port ${PORT}."
    fi

    sleep 1
  done

  fail "Spring smoke fixture did not open port ${PORT} within ${STARTUP_TIMEOUT_SECONDS} seconds."
}

print_failure_artifacts() {
  echo "Verification failed. Retained failure artifacts:" >&2
  echo "  phase: ${BOOTSTRAP_PHASE}" >&2
  echo "  readiness_port: ${PORT}" >&2
  echo "  temp_dir: ${TMP_DIR}" >&2
  echo "  gradle_home: ${HOST_GRADLE_HOME}" >&2
  echo "  publish_log: ${PUBLISH_LOG_PATH}" >&2
  echo "  app_log: ${APP_LOG_PATH}" >&2
  echo "  events_file: ${EVENTS_PATH}" >&2
  echo "  response_file: ${RESPONSE_PATH}" >&2
}

show_failure_tail() {
  if [[ -s "${PUBLISH_LOG_PATH}" ]]; then
    echo "--- publish.log (tail) ---" >&2
    tail -n 40 "${PUBLISH_LOG_PATH}" >&2 || true
  fi
  if [[ -s "${APP_LOG_PATH}" ]]; then
    echo "--- fixture.log (tail) ---" >&2
    tail -n 60 "${APP_LOG_PATH}" >&2 || true
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

run_publish_with_retry() {
  local attempt

  : >"${PUBLISH_LOG_PATH}"
  BOOTSTRAP_PHASE="publish"

  for attempt in $(seq 1 "${PUBLISH_RETRY_MAX_ATTEMPTS}"); do
    echo "[publish attempt ${attempt}/${PUBLISH_RETRY_MAX_ATTEMPTS}] Publishing ${YANOTE_GROUP}:yanote-core:${YANOTE_VERSION} and recorder module to mavenLocal..." | tee -a "${PUBLISH_LOG_PATH}"

    if "${ROOT_DIR}/gradlew" --no-daemon -g "${HOST_GRADLE_HOME}" :yanote-core:publishToMavenLocal :yanote-recorder-spring-mvc:publishToMavenLocal >>"${PUBLISH_LOG_PATH}" 2>&1; then
      if (( attempt > 1 )); then
        echo "Publish recovered on retry ${attempt}/${PUBLISH_RETRY_MAX_ATTEMPTS}." >&2
      fi
      return 0
    fi

    if (( attempt >= PUBLISH_RETRY_MAX_ATTEMPTS )); then
      fail "Gradle publishToMavenLocal failed after ${attempt} attempt(s)."
    fi

    echo "Publish attempt ${attempt}/${PUBLISH_RETRY_MAX_ATTEMPTS} failed; retrying once with retained publish log ${PUBLISH_LOG_PATH}." >&2
  done
}

if [[ -z "${YANOTE_GROUP}" || -z "${YANOTE_VERSION}" ]]; then
  fail "Unable to resolve group/version from gradle.properties."
fi

if [[ ! -d "${FIXTURE_DIR}" ]]; then
  fail "Fixture directory is missing: ${FIXTURE_DIR}"
fi

run_publish_with_retry

echo "Starting Spring smoke fixture from published local artifacts..."
BOOTSTRAP_PHASE="bootRun"
(
  cd "${ROOT_DIR}"
  SERVER_PORT="${PORT}" \
  YANOTE_EVENTS_PATH="${EVENTS_PATH}" \
  YANOTE_SERVICE_NAME="${ACTUAL_SERVICE_NAME}" \
  "${ROOT_DIR}/gradlew" --no-daemon -g "${HOST_GRADLE_HOME}" -p "${FIXTURE_DIR}" -PyanoteVersion="${YANOTE_VERSION}" bootRun
) >"${APP_LOG_PATH}" 2>&1 &
APP_PID=$!

echo "Waiting for Spring smoke fixture to open port ${PORT}..."
wait_for_port_readiness

echo "Sending proof request to ${BASE_URL}${REQUEST_PATH}..."
BOOTSTRAP_PHASE="request"
if ! curl --noproxy '*' --fail --silent --show-error "${BASE_URL}${REQUEST_PATH}" >"${RESPONSE_PATH}"; then
  fail "HTTP proof request failed."
fi

BOOTSTRAP_PHASE="validation"
if [[ ! -f "${EVENTS_PATH}" ]]; then
  fail "Recorder did not create events.jsonl."
fi

if [[ ! -s "${EVENTS_PATH}" ]]; then
  fail "Recorder created events.jsonl but left it empty."
fi

SUMMARY="$(python3 - "${EVENTS_PATH}" "${EXPECTED_METHOD}" "${EXPECTED_ROUTE}" "${EXPECTED_STATUS}" "${EXPECTED_SERVICE_NAME}" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_method = sys.argv[2]
expected_route = sys.argv[3]
expected_status = int(sys.argv[4])
expected_service = sys.argv[5]

first_line = None
for raw_line in path.read_text(encoding="utf-8").splitlines():
    if raw_line.strip():
        first_line = raw_line
        break

if first_line is None:
    raise SystemExit("events.jsonl contains no JSONL records")

record = json.loads(first_line)

expected_pairs = {
    "method": expected_method,
    "route": expected_route,
    "status": expected_status,
    "service": expected_service,
}

for key, expected in expected_pairs.items():
    actual = record.get(key)
    if actual != expected:
        raise SystemExit(f"Expected {key}={expected!r}, got {actual!r}")

for key in ("test.run_id", "test.suite"):
    if key not in record:
        raise SystemExit(f"Expected {key} key to be present with null value")
    if record[key] is not None:
        raise SystemExit(f"Expected {key}=null, got {record[key]!r}")

if record.get("responseBodyState") != "captured":
    raise SystemExit(f"Expected responseBodyState='captured', got {record.get('responseBodyState')!r}")
if record.get("responseBodyReason") is not None:
    raise SystemExit(f"Expected responseBodyReason to be absent/null, got {record.get('responseBodyReason')!r}")
response_body = record.get("responseBody")
if response_body != {"orderId": "42", "expand": True, "status": "ok"}:
    raise SystemExit(f"Expected captured JSON response body, got {response_body!r}")
if "requestBodyState" in record and record["requestBodyState"] is not None:
    raise SystemExit(f"Expected requestBodyState to stay absent/null for empty GET request body, got {record['requestBodyState']!r}")

print(
    "method={method} route={route} status={status} service={service} responseBodyState={response_state} test.run_id={run_id} test.suite={suite}".format(
        method=record["method"],
        route=record["route"],
        status=record["status"],
        service=record["service"],
        response_state=record["responseBodyState"],
        run_id=record["test.run_id"],
        suite=record["test.suite"],
    )
)
PY
)" || fail "Recorded JSONL fields drifted from the documented contract."

echo "Recorder proof passed: ${SUMMARY}"
