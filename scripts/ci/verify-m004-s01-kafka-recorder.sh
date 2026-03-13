#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-m004-s01-kafka.XXXXXX")"
TEST_LOG_PATH="${TMP_DIR}/example-test.log"
ANALYZER_BUILD_LOG_PATH="${TMP_DIR}/analyzer-build.log"
ASYNC_STDOUT_PATH="${TMP_DIR}/async-report.stdout"
ASYNC_STDERR_PATH="${TMP_DIR}/async-report.stderr"
EVENTS_PATH="${TMP_DIR}/events.jsonl"
OUT_DIR="${TMP_DIR}/async-report"
KEEP_TEMP="false"

EXPECTED_RUN_ID="${YANOTE_EXPECTED_RUN_ID:-m004-s01-run}"
EXPECTED_SUITE="${YANOTE_EXPECTED_SUITE:-m004-s01-suite}"
EXPECTED_CHANNEL="users.created"
EXPECTED_MESSAGE="UserCreated"
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

echo "Running example service Kafka integration proof with a real broker..."
if ! (
  cd "${ROOT_DIR}" && \
  YANOTE_EVENTS_PATH="${EVENTS_PATH}" \
  YANOTE_RUN_ID="${EXPECTED_RUN_ID}" \
  YANOTE_SUITE="${EXPECTED_SUITE}" \
  ./gradlew --no-daemon :examples:springmvc-service:test \
    --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' \
    --rerun-tasks
) >"${TEST_LOG_PATH}" 2>&1; then
  fail "Example service Kafka integration test failed."
fi

if [[ ! -f "${EVENTS_PATH}" ]]; then
  fail "Example service test did not create events.jsonl."
fi

if [[ ! -s "${EVENTS_PATH}" ]]; then
  fail "Example service test created events.jsonl but left it empty."
fi

EVENT_SUMMARY="$(python3 - "${EVENTS_PATH}" "${EXPECTED_RUN_ID}" "${EXPECTED_SUITE}" "${EXPECTED_CHANNEL}" "${EXPECTED_MESSAGE}" "${EXPECTED_HTTP_ROUTE}" "${EXPECTED_SERVICE}" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_run = sys.argv[2]
expected_suite = sys.argv[3]
expected_channel = sys.argv[4]
expected_message = sys.argv[5]
expected_http_route = sys.argv[6]
expected_service = sys.argv[7]
records = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

if len(records) != 3:
    raise SystemExit(f"Expected exactly 3 mixed events, got {len(records)}")

http_records = [record for record in records if record.get("kind") == "http"]
kafka_records = [record for record in records if record.get("kind") == "kafka"]
if len(http_records) != 1:
    raise SystemExit(f"Expected exactly 1 HTTP event, got {len(http_records)}")
if len(kafka_records) != 2:
    raise SystemExit(f"Expected exactly 2 Kafka events, got {len(kafka_records)}")

http_record = http_records[0]
if http_record.get("route") != expected_http_route:
    raise SystemExit(f"Expected HTTP route {expected_http_route!r}, got {http_record.get('route')!r}")
if http_record.get("service") != expected_service:
    raise SystemExit(f"Expected HTTP service {expected_service!r}, got {http_record.get('service')!r}")
if http_record.get("test.run_id") != expected_run:
    raise SystemExit(f"Expected HTTP test.run_id {expected_run!r}, got {http_record.get('test.run_id')!r}")
if http_record.get("test.suite") != expected_suite:
    raise SystemExit(f"Expected HTTP test.suite {expected_suite!r}, got {http_record.get('test.suite')!r}")

actions = sorted(record.get("action") for record in kafka_records)
if actions != ["receive", "send"]:
    raise SystemExit(f"Expected Kafka actions ['receive', 'send'], got {actions!r}")
for record in kafka_records:
    if record.get("channel") != expected_channel:
        raise SystemExit(f"Expected Kafka channel {expected_channel!r}, got {record.get('channel')!r}")
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

print(
    "events={events} http_route={route} kafka_actions={actions} channel={channel} suite={suite}".format(
        events=len(records),
        route=http_record["route"],
        actions=",".join(actions),
        channel=expected_channel,
        suite=expected_suite,
    )
)
PY
)" || fail "Live example evidence drifted from the expected mixed HTTP+Kafka contract."

echo "Building yanote-js analyzer..."
if ! bash -lc "cd '${ROOT_DIR}' && npm -C yanote-js ci && npm -C yanote-js run build" >"${ANALYZER_BUILD_LOG_PATH}" 2>&1; then
  fail "yanote-js build failed."
fi

echo "Running async-report directly against the live mixed events file..."
if ! (
  cd "${ROOT_DIR}" && \
  node yanote-js/dist/yanote.cjs async-report \
    --spec yanote-js/test/fixtures/asyncapi/spring-kafka-single-service.yaml \
    --events "${EVENTS_PATH}" \
    --out "${OUT_DIR}" \
    --min-coverage 100
) >"${ASYNC_STDOUT_PATH}" 2>"${ASYNC_STDERR_PATH}"; then
  fail "async-report failed on the live example evidence."
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

def expect_close(actual, expected, label):
    if not math.isclose(float(actual), float(expected), abs_tol=1e-6):
        raise SystemExit(f"Unexpected {label}={actual!r}; expected {expected!r}")

if report.get("status") != "ok":
    raise SystemExit(f"Expected report status 'ok', got {report.get('status')!r}")
if summary.get("totalChannels") != 1 or summary.get("coveredChannels") != 1:
    raise SystemExit(f"Unexpected channel summary: {summary!r}")
if summary.get("totalOperations") != 2 or summary.get("coveredOperations") != 2:
    raise SystemExit(f"Unexpected operation summary: {summary!r}")
if summary.get("totalMessages") != 2 or summary.get("coveredMessages") != 2:
    raise SystemExit(f"Unexpected message summary: {summary!r}")
expect_close(summary.get("channelCoveragePercent"), 100, "channelCoveragePercent")
expect_close(summary.get("operationCoveragePercent"), 100, "operationCoveragePercent")
expect_close(summary.get("messageCoveragePercent"), 100, "messageCoveragePercent")

if report.get("diagnostics", {}).get("counts") != {"unmatched": 0, "mismatched": 0}:
    raise SystemExit(f"Expected zero async diagnostics, got {report.get('diagnostics')!r}")

operations = {entry["operationKey"]: entry for entry in coverage.get("operations", {}).get("items", [])}
expected_keys = {"kafka send users.created", "kafka receive users.created"}
if set(operations) != expected_keys:
    raise SystemExit(f"Unexpected async operation keys: {sorted(operations)!r}")
for key, entry in operations.items():
    if entry.get("operation", {}).get("state") != "COVERED":
        raise SystemExit(f"Expected covered operation for {key}, got {entry!r}")
    if entry.get("messageContract", {}).get("name") != "UserCreated":
        raise SystemExit(f"Expected UserCreated message contract for {key}, got {entry!r}")
    if entry.get("messageContract", {}).get("state") != "COVERED":
        raise SystemExit(f"Expected covered message contract for {key}, got {entry!r}")
    if entry.get("suites") != [expected_suite]:
        raise SystemExit(f"Expected suites [{expected_suite!r}] for {key}, got {entry.get('suites')!r}")

print(
    "channels=1/1 operations=2/2 messages=2/2 suite={suite} report={report}".format(
        suite=expected_suite,
        report=path,
    )
)
PY
)" || fail "async-report artifact drifted from the expected single-service Kafka acceptance surface."

echo "Kafka example proof passed: ${EVENT_SUMMARY}"
echo "Async analyzer proof passed: ${REPORT_SUMMARY}"
