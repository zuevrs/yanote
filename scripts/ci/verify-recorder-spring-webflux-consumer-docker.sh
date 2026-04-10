#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FIXTURE_DIR="${ROOT_DIR}/test/fixtures/recorder-spring-webflux-smoke"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-webflux-docker.XXXXXX")"
PUBLISH_LOG_PATH="${TMP_DIR}/publish.log"
BUILD_LOG_PATH="${TMP_DIR}/build.log"
DOCKER_LOG_PATH="${TMP_DIR}/container.log"
RESPONSE_PATH="${TMP_DIR}/response.json"
EVENTS_DIR="${TMP_DIR}/events"
EVENTS_PATH="${EVENTS_DIR}/events.jsonl"
DOCKER_CONTEXT_DIR="${TMP_DIR}/docker-context"

YANOTE_GROUP="$(grep -E '^group=' "${ROOT_DIR}/gradle.properties" | head -n 1 | cut -d= -f2-)"
YANOTE_VERSION="$(grep -E '^version=' "${ROOT_DIR}/gradle.properties" | head -n 1 | cut -d= -f2-)"
ACTUAL_SERVICE_NAME="${YANOTE_SERVICE_NAME:-recorder-spring-webflux-consumer-docker}"
EXPECTED_RUN_ID="${YANOTE_EXPECTED_RUN_ID:-webflux-docker-run}"
EXPECTED_SUITE="${YANOTE_EXPECTED_SUITE:-webflux-docker-suite}"
REQUEST_FLAVOR="${YANOTE_REQUEST_FLAVOR:-amber}"
AUTHORIZATION_SECRET="Bearer docker-proof-secret-token"
SESSION_SECRET="docker-proof-session-secret"
HOST_GRADLE_HOME="${TMP_DIR}/gradle-home"
FALLBACK_GRADLE_DIST_HOME="${HOME}/.gradle/wrapper/dists"
FALLBACK_GRADLE_MODULES_CACHE="${HOME}/.gradle/caches/modules-2"
FALLBACK_GRADLE_JARS_CACHE="${HOME}/.gradle/caches/jars-9"
STARTUP_TIMEOUT_SECONDS="${YANOTE_STARTUP_TIMEOUT_SECONDS:-120}"
PUBLISH_RETRY_MAX_ATTEMPTS="${YANOTE_PUBLISH_RETRY_MAX_ATTEMPTS:-2}"
KEEP_TEMP="false"
CONTAINER_ID=""
IMAGE_TAG="yanote-webflux-smoke:$(date +%s)-$$"
BOOTSTRAP_PHASE="init"

mkdir -p "${HOST_GRADLE_HOME}" "${EVENTS_DIR}" "${DOCKER_CONTEXT_DIR}"
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
HEALTH_PATH="/health"
REQUEST_PATH="/payload-evidence/users/user-42?expand=true&tags=alpha&tags=bravo"
REQUEST_BODY='{"name":"Ada","meta":{"source":"docker-proof"}}'

healthcheck_ready() {
  curl --noproxy '*' --fail --silent --show-error "${BASE_URL}${HEALTH_PATH}" >/dev/null 2>&1
}

container_is_running() {
  [[ -n "${CONTAINER_ID}" ]] || return 1
  local state
  state="$(docker inspect --format '{{.State.Running}}' "${CONTAINER_ID}" 2>/dev/null || true)"
  [[ "${state}" == "true" ]]
}

wait_for_port_readiness() {
  local attempt

  BOOTSTRAP_PHASE="readiness"
  for attempt in $(seq 1 "${STARTUP_TIMEOUT_SECONDS}"); do
    if healthcheck_ready; then
      return 0
    fi

    if ! container_is_running; then
      fail "Dockerized WebFlux consumer fixture exited before answering health checks on ${BASE_URL}${HEALTH_PATH}."
    fi

    sleep 1
  done

  fail "Dockerized WebFlux consumer fixture did not answer health checks on ${BASE_URL}${HEALTH_PATH} within ${STARTUP_TIMEOUT_SECONDS} seconds."
}

wait_for_recorded_event() {
  local attempt

  BOOTSTRAP_PHASE="validation"
  for attempt in $(seq 1 30); do
    if [[ -s "${EVENTS_PATH}" ]]; then
      return 0
    fi

    if ! container_is_running; then
      fail "Dockerized WebFlux consumer fixture exited before recorder output appeared."
    fi

    sleep 0.2
  done

  if [[ ! -f "${EVENTS_PATH}" ]]; then
    fail "Recorder did not create events.jsonl."
  fi

  fail "Recorder created events.jsonl but left it empty."
}

drain_readiness_events() {
  local attempt

  BOOTSTRAP_PHASE="readiness-drain"
  for attempt in $(seq 1 10); do
    rm -f "${EVENTS_PATH}"
    sleep 0.2
  done
}

print_failure_artifacts() {
  echo "Verification failed. Retained failure artifacts:" >&2
  echo "  phase: ${BOOTSTRAP_PHASE}" >&2
  echo "  readiness_port: ${PORT}" >&2
  echo "  temp_dir: ${TMP_DIR}" >&2
  echo "  gradle_home: ${HOST_GRADLE_HOME}" >&2
  echo "  publish_log: ${PUBLISH_LOG_PATH}" >&2
  echo "  build_log: ${BUILD_LOG_PATH}" >&2
  echo "  docker_log: ${DOCKER_LOG_PATH}" >&2
  echo "  events_file: ${EVENTS_PATH}" >&2
  echo "  response_file: ${RESPONSE_PATH}" >&2
}

show_failure_tail() {
  if [[ -s "${PUBLISH_LOG_PATH}" ]]; then
    echo "--- publish.log (tail) ---" >&2
    tail -n 40 "${PUBLISH_LOG_PATH}" >&2 || true
  fi
  if [[ -s "${BUILD_LOG_PATH}" ]]; then
    echo "--- build.log (tail) ---" >&2
    tail -n 60 "${BUILD_LOG_PATH}" >&2 || true
  fi
  if [[ -n "${CONTAINER_ID}" ]]; then
    docker logs "${CONTAINER_ID}" >"${DOCKER_LOG_PATH}" 2>&1 || true
  fi
  if [[ -s "${DOCKER_LOG_PATH}" ]]; then
    echo "--- container.log (tail) ---" >&2
    tail -n 80 "${DOCKER_LOG_PATH}" >&2 || true
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
  if [[ -n "${CONTAINER_ID}" ]]; then
    docker logs "${CONTAINER_ID}" >"${DOCKER_LOG_PATH}" 2>&1 || true
    docker rm -f "${CONTAINER_ID}" >/dev/null 2>&1 || true
  fi
  docker image rm -f "${IMAGE_TAG}" >/dev/null 2>&1 || true

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

run_publish_with_retry() {
  local attempt

  : >"${PUBLISH_LOG_PATH}"
  BOOTSTRAP_PHASE="publish"

  for attempt in $(seq 1 "${PUBLISH_RETRY_MAX_ATTEMPTS}"); do
    echo "[publish attempt ${attempt}/${PUBLISH_RETRY_MAX_ATTEMPTS}] Publishing ${YANOTE_GROUP}:yanote-core:${YANOTE_VERSION} and recorder module to mavenLocal..." | tee -a "${PUBLISH_LOG_PATH}"

    if "${ROOT_DIR}/gradlew" --no-daemon -g "${HOST_GRADLE_HOME}" :yanote-core:publishToMavenLocal :yanote-recorder-spring-webflux:publishToMavenLocal >>"${PUBLISH_LOG_PATH}" 2>&1; then
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

build_fixture_jar() {
  : >"${BUILD_LOG_PATH}"
  BOOTSTRAP_PHASE="build"

  if ! (
    cd "${ROOT_DIR}" && \
    "${ROOT_DIR}/gradlew" --no-daemon -g "${HOST_GRADLE_HOME}" -p "${FIXTURE_DIR}" -PyanoteVersion="${YANOTE_VERSION}" clean bootJar
  ) >"${BUILD_LOG_PATH}" 2>&1; then
    fail "Gradle bootJar build for Dockerized WebFlux consumer fixture failed."
  fi

  local jar_path
  jar_path="$(find "${FIXTURE_DIR}/build/libs" -maxdepth 1 -type f -name '*.jar' ! -name '*-plain.jar' | head -n 1)"
  if [[ -z "${jar_path}" || ! -f "${jar_path}" ]]; then
    fail "Unable to find built bootJar under ${FIXTURE_DIR}/build/libs."
  fi

  cp "${jar_path}" "${DOCKER_CONTEXT_DIR}/app.jar"
  cat >"${DOCKER_CONTEXT_DIR}/Dockerfile" <<'EOF'
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY app.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
EOF
}

build_docker_image() {
  BOOTSTRAP_PHASE="docker-build"
  if ! docker build -t "${IMAGE_TAG}" "${DOCKER_CONTEXT_DIR}" >/dev/null; then
    fail "Docker build for WebFlux consumer fixture failed."
  fi
}

start_container() {
  BOOTSTRAP_PHASE="docker-run"
  CONTAINER_ID="$(docker run -d \
    -p "127.0.0.1:${PORT}:8080" \
    -e SERVER_PORT=8080 \
    -e YANOTE_EVENTS_PATH=/data/yanote/events.jsonl \
    -e YANOTE_SERVICE_NAME="${ACTUAL_SERVICE_NAME}" \
    -v "${EVENTS_DIR}:/data/yanote" \
    "${IMAGE_TAG}")"

  if [[ -z "${CONTAINER_ID}" ]]; then
    fail "Dockerized WebFlux consumer fixture did not return a container id."
  fi
}

if [[ -z "${YANOTE_GROUP}" || -z "${YANOTE_VERSION}" ]]; then
  fail "Unable to resolve group/version from gradle.properties."
fi

if [[ ! -d "${FIXTURE_DIR}" ]]; then
  fail "Fixture directory is missing: ${FIXTURE_DIR}"
fi

run_publish_with_retry
build_fixture_jar
build_docker_image
start_container

echo "Waiting for Dockerized WebFlux consumer fixture to open port ${PORT}..."
wait_for_port_readiness
drain_readiness_events

echo "Sending proof request to ${BASE_URL}${REQUEST_PATH}..."
BOOTSTRAP_PHASE="request"
if ! curl --noproxy '*' --fail --silent --show-error \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-Test-Run-Id: ${EXPECTED_RUN_ID}" \
  -H "X-Test-Suite: ${EXPECTED_SUITE}" \
  -H "X-Request-Flavor: ${REQUEST_FLAVOR}" \
  -H "Authorization: ${AUTHORIZATION_SECRET}" \
  -b "clientMode=compact; SESSION=${SESSION_SECRET}" \
  --data "${REQUEST_BODY}" \
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
    "name": "Ada",
    "metaProvided": True,
}, f"Unexpected response payload: {response!r}")

expected_pairs = {
    "method": "POST",
    "route": "/payload-evidence/users/{userId}",
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

expect(record.get("requestBody") == {"name": "Ada", "meta": {"source": "docker-proof"}}, f"Unexpected requestBody: {record.get('requestBody')!r}")
expect(record.get("requestBodyState") == "captured", f"Expected requestBodyState='captured', got {record.get('requestBodyState')!r}")
expect(record.get("requestBodyReason") is None, f"Expected requestBodyReason to be omitted, got {record.get('requestBodyReason')!r}")
expect(record.get("requestContentType") == "application/json", f"Expected requestContentType='application/json', got {record.get('requestContentType')!r}")
expect(record.get("responseBody") == response, f"Expected responseBody to match response payload, got {record.get('responseBody')!r}")
expect(record.get("responseBodyState") == "captured", f"Expected responseBodyState='captured', got {record.get('responseBodyState')!r}")
expect(record.get("responseBodyReason") is None, f"Expected responseBodyReason to be omitted, got {record.get('responseBodyReason')!r}")
expect(record.get("responseContentType") == "application/json", f"Expected responseContentType='application/json', got {record.get('responseContentType')!r}")

serialized = json.dumps(record, sort_keys=True)
for secret in ("Bearer docker-proof-secret-token", "docker-proof-session-secret"):
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
)" || fail "Recorded JSONL fields drifted from the Dockerized WebFlux consumer proof contract."

ensure_file_contains_no_secret "${EVENTS_PATH}" "events.jsonl"

echo "WebFlux consumer Docker proof passed: ${SUMMARY}"
