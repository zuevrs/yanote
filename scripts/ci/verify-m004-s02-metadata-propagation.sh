#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-m004-s02-metadata.XXXXXX")"
TEST_LOG_PATH="${TMP_DIR}/example-test.log"
ANALYZER_BUILD_LOG_PATH="${TMP_DIR}/analyzer-build.log"
ASYNC_STDOUT_PATH="${TMP_DIR}/async-report.stdout"
ASYNC_STDERR_PATH="${TMP_DIR}/async-report.stderr"
EVENTS_PATH="${TMP_DIR}/events.jsonl"
OUT_DIR="${TMP_DIR}/async-report"
KEEP_TEMP="false"

EXPECTED_RUN_ID="${YANOTE_EXPECTED_RUN_ID:-m004-s02-run}"
EXPECTED_SUITE="${YANOTE_EXPECTED_SUITE:-m004-s02-suite}"
EXPECTED_FIRST_CHANNEL="users.created"
EXPECTED_REPUBLISHED_CHANNEL="users.created.republished"
EXPECTED_FIRST_MESSAGE="UserCreated"
EXPECTED_REPUBLISHED_MESSAGE="UserRepublished"
EXPECTED_HTTP_ROUTE="/users"
EXPECTED_SERVICE="examples-service"

print_failure_artifacts() {
  echo "Verification failed. Retained failure artifacts:" >&2
  echo "  temp_dir: ${TMP_DIR}" >&2
  echo "  test_log: ${TEST_LOG_PATH}" >&2
  echo "  analyzer_build_log: ${ANALYZER_BUILD_LOG_PATH}" >&2
  echo "  events_file: ${EVENTS_PATH}" >&2
  echo "  async_stdout: ${ASYNC_STDOUT_PATH}" >&2
  echo "  async_stderr: ${ASYNC_STDERR_PATH}" >&2
  echo "  async_report_dir: ${OUT_DIR}" >&2
}

show_failure_tail() {
  local file
  for file in \
    "${TEST_LOG_PATH}" \
    "${ANALYZER_BUILD_LOG_PATH}" \
    "${ASYNC_STDOUT_PATH}" \
    "${ASYNC_STDERR_PATH}"; do
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
  print_failure_artifacts
  exit 1
}

cleanup() {
  if [[ "${KEEP_TEMP}" != "true" ]]; then
    rm -rf "${TMP_DIR}"
  fi
}
trap cleanup EXIT

echo "Running example service HTTP -> Kafka -> Kafka republish proof with a real broker..."
if ! (
  cd "${ROOT_DIR}" && \
  YANOTE_EVENTS_PATH="${EVENTS_PATH}" \
  YANOTE_RUN_ID="${EXPECTED_RUN_ID}" \
  YANOTE_SUITE="${EXPECTED_SUITE}" \
  ./gradlew --no-daemon :examples:springmvc-service:test \
    --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' \
    --rerun-tasks
) >"${TEST_LOG_PATH}" 2>&1; then
  fail "Example service republish integration test failed."
fi

if [[ ! -f "${EVENTS_PATH}" ]]; then
  fail "Example service test did not create events.jsonl."
fi

if [[ ! -s "${EVENTS_PATH}" ]]; then
  fail "Example service test created events.jsonl but left it empty."
fi

EVENT_SUMMARY="$(python3 - "${EVENTS_PATH}" "${EXPECTED_RUN_ID}" "${EXPECTED_SUITE}" "${EXPECTED_FIRST_CHANNEL}" "${EXPECTED_REPUBLISHED_CHANNEL}" "${EXPECTED_FIRST_MESSAGE}" "${EXPECTED_REPUBLISHED_MESSAGE}" "${EXPECTED_HTTP_ROUTE}" "${EXPECTED_SERVICE}" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_run = sys.argv[2]
expected_suite = sys.argv[3]
expected_first_channel = sys.argv[4]
expected_republished_channel = sys.argv[5]
expected_first_message = sys.argv[6]
expected_republished_message = sys.argv[7]
expected_http_route = sys.argv[8]
expected_service = sys.argv[9]
records = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

if len(records) != 5:
    raise SystemExit(f"Expected exactly 5 mixed events, got {len(records)}")

http_records = [record for record in records if record.get("kind") == "http"]
kafka_records = [record for record in records if record.get("kind") == "kafka"]
if len(http_records) != 1:
    raise SystemExit(f"Expected exactly 1 HTTP event, got {len(http_records)}")
if len(kafka_records) != 4:
    raise SystemExit(f"Expected exactly 4 Kafka events, got {len(kafka_records)}")

http_record = http_records[0]
if http_record.get("route") != expected_http_route:
    raise SystemExit(f"Expected HTTP route {expected_http_route!r}, got {http_record.get('route')!r}")
if http_record.get("service") != expected_service:
    raise SystemExit(f"Expected HTTP service {expected_service!r}, got {http_record.get('service')!r}")
if http_record.get("test.run_id") != expected_run:
    raise SystemExit(f"Expected HTTP test.run_id {expected_run!r}, got {http_record.get('test.run_id')!r}")
if http_record.get("test.suite") != expected_suite:
    raise SystemExit(f"Expected HTTP test.suite {expected_suite!r}, got {http_record.get('test.suite')!r}")
if http_record.get("status") != 201:
    raise SystemExit(f"Expected HTTP status 201, got {http_record.get('status')!r}")
if http_record.get("error") is not False:
    raise SystemExit(f"Expected HTTP error=false, got {http_record.get('error')!r}")
if http_record.get("requestBodyState") != "captured" or http_record.get("requestBodyReason") is not None:
    raise SystemExit(f"Expected captured HTTP request provenance, got {http_record!r}")
if http_record.get("responseBodyState") != "captured" or http_record.get("responseBodyReason") is not None:
    raise SystemExit(f"Expected captured HTTP response provenance, got {http_record!r}")
expected_http_request = {"name": "alice", "email": "alice@example.com"}
expected_http_response = {
    "id": "user-alice",
    "name": "alice",
    "email": "alice@example.com",
    "created": True,
}
if http_record.get("requestBody") != expected_http_request:
    raise SystemExit(f"Expected HTTP requestBody {expected_http_request!r}, got {http_record.get('requestBody')!r}")
if http_record.get("responseBody") != expected_http_response:
    raise SystemExit(f"Expected HTTP responseBody {expected_http_response!r}, got {http_record.get('responseBody')!r}")

def find_single(action, channel):
    matches = [record for record in kafka_records if record.get("action") == action and record.get("channel") == channel]
    if len(matches) != 1:
        raise SystemExit(
            f"Expected exactly 1 Kafka record for action={action!r} channel={channel!r}, got {len(matches)}"
        )
    return matches[0]

expected_kafka_payload = {"name": "alice", "email": "alice@example.com"}
expected_records = [
    (find_single("send", expected_first_channel), expected_first_message),
    (find_single("receive", expected_first_channel), expected_first_message),
    (find_single("send", expected_republished_channel), expected_republished_message),
    (find_single("receive", expected_republished_channel), expected_republished_message),
]
for record, expected_message in expected_records:
    if record.get("message") != expected_message:
        raise SystemExit(f"Expected Kafka message {expected_message!r}, got {record.get('message')!r}")
    if record.get("service") != expected_service:
        raise SystemExit(f"Expected Kafka service {expected_service!r}, got {record.get('service')!r}")
    if record.get("test.run_id") != expected_run:
        raise SystemExit(f"Expected Kafka test.run_id {expected_run!r}, got {record.get('test.run_id')!r}")
    if record.get("test.suite") != expected_suite:
        raise SystemExit(f"Expected Kafka test.suite {expected_suite!r}, got {record.get('test.suite')!r}")
    if record.get("error") is not False:
        raise SystemExit(f"Expected Kafka error=false, got {record.get('error')!r}")
    if record.get("payloadState") != "captured" or record.get("payloadReason") is not None:
        raise SystemExit(f"Expected captured Kafka payload provenance, got {record!r}")
    if record.get("payload") != expected_kafka_payload:
        raise SystemExit(f"Expected Kafka payload {expected_kafka_payload!r}, got {record.get('payload')!r}")
    headers = record.get("headers")
    if not isinstance(headers, dict):
        raise SystemExit(f"Expected retained Kafka headers map, got {headers!r}")
    if headers.get("yanote.message") != {"state": "captured", "value": expected_message}:
        raise SystemExit(f"Expected retained yanote.message header for {expected_message!r}, got {headers.get('yanote.message')!r}")
    if headers.get("yanote.test.run_id") != {"state": "captured", "value": expected_run}:
        raise SystemExit(f"Expected retained yanote.test.run_id header {expected_run!r}, got {headers.get('yanote.test.run_id')!r}")
    if headers.get("yanote.test.suite") != {"state": "captured", "value": expected_suite}:
        raise SystemExit(f"Expected retained yanote.test.suite header {expected_suite!r}, got {headers.get('yanote.test.suite')!r}")

first_messages = {record.get("message") for record in kafka_records if record.get("channel") == expected_first_channel}
republished_messages = {record.get("message") for record in kafka_records if record.get("channel") == expected_republished_channel}
if first_messages != {expected_first_message}:
    raise SystemExit(f"Expected only {expected_first_message!r} on {expected_first_channel!r}, got {sorted(first_messages)!r}")
if republished_messages != {expected_republished_message}:
    raise SystemExit(
        f"Expected only {expected_republished_message!r} on {expected_republished_channel!r}, got {sorted(republished_messages)!r}"
    )

print(
    "events={events} channels={channels} suite={suite} run={run}".format(
        events=len(records),
        channels=','.join(sorted({expected_first_channel, expected_republished_channel})),
        suite=expected_suite,
        run=expected_run,
    )
)
PY
)" || fail "Live republish evidence drifted from the expected raw JSONL attribution contract."

echo "Building yanote-js analyzer..."
if ! bash -lc "cd '${ROOT_DIR}' && npm -C yanote-js ci && npm -C yanote-js run build" >"${ANALYZER_BUILD_LOG_PATH}" 2>&1; then
  fail "yanote-js build failed."
fi

echo "Running async-report directly against the live republish events file..."
if ! (
  cd "${ROOT_DIR}" && \
  node yanote-js/dist/yanote.cjs async-report \
    --spec yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml \
    --events "${EVENTS_PATH}" \
    --out "${OUT_DIR}" \
    --min-coverage 100
) >"${ASYNC_STDOUT_PATH}" 2>"${ASYNC_STDERR_PATH}"; then
  fail "async-report failed on the live republish evidence."
fi

if [[ -s "${ASYNC_STDERR_PATH}" ]]; then
  fail "async-report unexpectedly wrote to stderr on the happy path."
fi
if ! grep -q '^Summary$' "${ASYNC_STDOUT_PATH}"; then
  fail "async-report stdout is missing the Summary section."
fi
if ! grep -q '^YANOTE_ASYNC_SUMMARY ' "${ASYNC_STDOUT_PATH}"; then
  fail "async-report stdout is missing the final YANOTE_ASYNC_SUMMARY line."
fi

REPORT_SUMMARY="$(python3 - "${OUT_DIR}/yanote-async-report.json" "${EXPECTED_SUITE}" <<'PY'
import json
import math
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_suite = sys.argv[2]
if not path.exists():
    raise SystemExit(f"Missing async report file: {path}")

report = json.loads(path.read_text(encoding="utf-8"))
summary = report.get("summary", {})
coverage = report.get("coverage", {})

expected_operations = {
    "kafka send users.created": "UserCreated",
    "kafka receive users.created": "UserCreated",
    "kafka send users.created.republished": "UserRepublished",
    "kafka receive users.created.republished": "UserRepublished",
}

def expect_close(actual, expected, label):
    if not math.isclose(float(actual), float(expected), abs_tol=1e-6):
        raise SystemExit(f"Unexpected {label}={actual!r}; expected {expected!r}")

if report.get("status") != "ok":
    raise SystemExit(f"Expected report status 'ok', got {report.get('status')!r}")
if summary.get("totalChannels") != 2 or summary.get("coveredChannels") != 2:
    raise SystemExit(f"Unexpected channel summary: {summary!r}")
if summary.get("totalOperations") != 4 or summary.get("coveredOperations") != 4:
    raise SystemExit(f"Unexpected operation summary: {summary!r}")
if summary.get("totalMessages") != 4 or summary.get("coveredMessages") != 4:
    raise SystemExit(f"Unexpected message summary: {summary!r}")
expect_close(summary.get("channelCoveragePercent"), 100, "channelCoveragePercent")
expect_close(summary.get("operationCoveragePercent"), 100, "operationCoveragePercent")
expect_close(summary.get("messageCoveragePercent"), 100, "messageCoveragePercent")

if report.get("diagnostics", {}).get("counts") != {
    "unsupported-content-type": 0,
    "unsupported-schema-format": 0,
    "missing-payload": 0,
    "invalid-payload": 0,
    "missing-header": 0,
    "unavailable-header": 0,
    "invalid-header": 0,
    "unverifiable-headers": 0,
    "ambiguous": 0,
    "unmatched": 0,
    "mismatched": 0,
}:
    raise SystemExit(f"Expected widened zero async diagnostics contract, got {report.get('diagnostics')!r}")

operations = {entry["operationKey"]: entry for entry in coverage.get("operations", {}).get("items", [])}
if set(operations) != set(expected_operations):
    raise SystemExit(f"Unexpected async operation keys: {sorted(operations)!r}")
for key, expected_message in expected_operations.items():
    entry = operations[key]
    if entry.get("operation", {}).get("state") != "COVERED":
        raise SystemExit(f"Expected covered operation for {key}, got {entry!r}")
    if entry.get("messageContract", {}).get("name") != expected_message:
        raise SystemExit(f"Expected {expected_message!r} message contract for {key}, got {entry!r}")
    if entry.get("messageContract", {}).get("state") != "COVERED":
        raise SystemExit(f"Expected covered message contract for {key}, got {entry!r}")
    if entry.get("suites") != [expected_suite]:
        raise SystemExit(f"Expected suites [{expected_suite!r}] for {key}, got {entry.get('suites')!r}")

print(
    "channels=2/2 operations=4/4 messages=4/4 suite={suite} report={report}".format(
        suite=expected_suite,
        report=path,
    )
)
PY
)" || fail "async-report artifact drifted from the expected single-service republish acceptance surface."

echo "Republish metadata proof passed: ${EVENT_SUMMARY}"
echo "Async analyzer proof passed: ${REPORT_SUMMARY}"
