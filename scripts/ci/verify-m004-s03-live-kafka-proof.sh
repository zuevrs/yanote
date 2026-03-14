#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-m004-s03-live-proof.XXXXXX")"
SINGLE_SERVICE_LOG_PATH="${TMP_DIR}/single-service-proof.log"
TWO_SERVICE_TEST_LOG_PATH="${TMP_DIR}/two-service-test.log"
MERGE_LOG_PATH="${TMP_DIR}/merge.log"
ASYNC_STDOUT_PATH="${TMP_DIR}/async-report.stdout"
ASYNC_STDERR_PATH="${TMP_DIR}/async-report.stderr"
PRODUCER_EVENTS_PATH="${TMP_DIR}/01-producer.events.jsonl"
CONSUMER_EVENTS_PATH="${TMP_DIR}/02-consumer.events.jsonl"
MERGED_EVENTS_PATH="${TMP_DIR}/merged-two-service.events.jsonl"
OUT_DIR="${TMP_DIR}/async-report"
KEEP_TEMP="false"
SIMULATE_ANALYZER_FAILURE="false"

SINGLE_SERVICE_RUN_ID="${YANOTE_SINGLE_SERVICE_RUN_ID:-m004-s03-single-service-run}"
SINGLE_SERVICE_SUITE="${YANOTE_SINGLE_SERVICE_SUITE:-m004-s03-single-service-suite}"
TWO_SERVICE_RUN_ID="${YANOTE_TWO_SERVICE_RUN_ID:-m004-s03-two-service-run}"
TWO_SERVICE_SUITE="${YANOTE_TWO_SERVICE_SUITE:-m004-s03-two-service-suite}"
EXPECTED_PRODUCER_SERVICE="${YANOTE_EXPECTED_PRODUCER_SERVICE:-producer-role-service}"
EXPECTED_CONSUMER_SERVICE="${YANOTE_EXPECTED_CONSUMER_SERVICE:-consumer-role-service}"
EXPECTED_CHANNEL="users.created"
EXPECTED_MESSAGE="UserCreated"
EXPECTED_HTTP_ROUTE="/users"
ASYNC_SPEC_PATH="yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml"

usage() {
  cat <<'EOF'
Usage: bash scripts/ci/verify-m004-s03-live-kafka-proof.sh [--retain-temp-on-failure] [--simulate-analyzer-failure]
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --retain-temp-on-failure)
      KEEP_TEMP="true"
      shift
      ;;
    --simulate-analyzer-failure)
      SIMULATE_ANALYZER_FAILURE="true"
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "${SIMULATE_ANALYZER_FAILURE}" == "true" ]]; then
  ASYNC_SPEC_PATH="yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml"
fi

print_failure_artifacts() {
  echo "Verification failed. Retained failure artifacts:" >&2
  echo "  temp_dir: ${TMP_DIR}" >&2
  echo "  single_service_log: ${SINGLE_SERVICE_LOG_PATH}" >&2
  echo "  two_service_test_log: ${TWO_SERVICE_TEST_LOG_PATH}" >&2
  echo "  producer_events_file: ${PRODUCER_EVENTS_PATH}" >&2
  echo "  consumer_events_file: ${CONSUMER_EVENTS_PATH}" >&2
  echo "  merge_log: ${MERGE_LOG_PATH}" >&2
  echo "  merged_events_file: ${MERGED_EVENTS_PATH}" >&2
  echo "  async_stdout: ${ASYNC_STDOUT_PATH}" >&2
  echo "  async_stderr: ${ASYNC_STDERR_PATH}" >&2
  echo "  async_report_dir: ${OUT_DIR}" >&2
}

show_failure_tail() {
  local file
  for file in \
    "${SINGLE_SERVICE_LOG_PATH}" \
    "${TWO_SERVICE_TEST_LOG_PATH}" \
    "${MERGE_LOG_PATH}" \
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

echo "Running authoritative single-service republish proof..."
if ! (
  cd "${ROOT_DIR}" && \
  YANOTE_EXPECTED_RUN_ID="${SINGLE_SERVICE_RUN_ID}" \
  YANOTE_EXPECTED_SUITE="${SINGLE_SERVICE_SUITE}" \
  bash scripts/ci/verify-m004-s02-metadata-propagation.sh
) >"${SINGLE_SERVICE_LOG_PATH}" 2>&1; then
  fail "Single-service republish proof failed."
fi

echo "Running live two-service producer -> consumer integration proof..."
if ! (
  cd "${ROOT_DIR}" && \
  YANOTE_RUN_ID="${TWO_SERVICE_RUN_ID}" \
  YANOTE_SUITE="${TWO_SERVICE_SUITE}" \
  YANOTE_PRODUCER_SERVICE_NAME="${EXPECTED_PRODUCER_SERVICE}" \
  YANOTE_CONSUMER_SERVICE_NAME="${EXPECTED_CONSUMER_SERVICE}" \
  YANOTE_PRODUCER_EVENTS_PATH="${PRODUCER_EVENTS_PATH}" \
  YANOTE_CONSUMER_EVENTS_PATH="${CONSUMER_EVENTS_PATH}" \
  ./gradlew --no-daemon :examples:springmvc-service:test \
    --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest' \
    --rerun-tasks
) >"${TWO_SERVICE_TEST_LOG_PATH}" 2>&1; then
  fail "Two-service Kafka integration test failed."
fi

for file in "${PRODUCER_EVENTS_PATH}" "${CONSUMER_EVENTS_PATH}"; do
  if [[ ! -f "${file}" ]]; then
    fail "Expected two-service proof to create $(basename "${file}") but it is missing."
  fi
  if [[ ! -s "${file}" ]]; then
    fail "Expected two-service proof to populate $(basename "${file}") but it is empty."
  fi
done

RAW_SUMMARY="$(python3 - "${PRODUCER_EVENTS_PATH}" "${CONSUMER_EVENTS_PATH}" "${TWO_SERVICE_RUN_ID}" "${TWO_SERVICE_SUITE}" "${EXPECTED_PRODUCER_SERVICE}" "${EXPECTED_CONSUMER_SERVICE}" "${EXPECTED_CHANNEL}" "${EXPECTED_MESSAGE}" "${EXPECTED_HTTP_ROUTE}" <<'PY'
import json
import pathlib
import sys

producer_path = pathlib.Path(sys.argv[1])
consumer_path = pathlib.Path(sys.argv[2])
expected_run = sys.argv[3]
expected_suite = sys.argv[4]
expected_producer_service = sys.argv[5]
expected_consumer_service = sys.argv[6]
expected_channel = sys.argv[7]
expected_message = sys.argv[8]
expected_http_route = sys.argv[9]

def load(path):
    return [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]

producer_records = load(producer_path)
consumer_records = load(consumer_path)

if len(producer_records) != 2:
    raise SystemExit(f"Expected exactly 2 producer records, got {len(producer_records)}")
if len(consumer_records) != 1:
    raise SystemExit(f"Expected exactly 1 consumer record, got {len(consumer_records)}")

producer_http = [record for record in producer_records if record.get('kind') == 'http']
producer_kafka = [record for record in producer_records if record.get('kind') == 'kafka']
consumer_http = [record for record in consumer_records if record.get('kind') == 'http']
consumer_kafka = [record for record in consumer_records if record.get('kind') == 'kafka']

if len(producer_http) != 1:
    raise SystemExit(f"Expected exactly 1 producer HTTP record, got {len(producer_http)}")
if len(producer_kafka) != 1:
    raise SystemExit(f"Expected exactly 1 producer Kafka record, got {len(producer_kafka)}")
if consumer_http:
    raise SystemExit(f"Expected 0 consumer HTTP records, got {len(consumer_http)}")
if len(consumer_kafka) != 1:
    raise SystemExit(f"Expected exactly 1 consumer Kafka record, got {len(consumer_kafka)}")

producer_http_record = producer_http[0]
if producer_http_record.get('route') != expected_http_route:
    raise SystemExit(f"Expected producer HTTP route {expected_http_route!r}, got {producer_http_record.get('route')!r}")
if producer_http_record.get('method') != 'POST':
    raise SystemExit(f"Expected producer HTTP method 'POST', got {producer_http_record.get('method')!r}")
if producer_http_record.get('status') != 200:
    raise SystemExit(f"Expected producer HTTP status 200, got {producer_http_record.get('status')!r}")
if producer_http_record.get('service') != expected_producer_service:
    raise SystemExit(
        f"Expected producer HTTP service {expected_producer_service!r}, got {producer_http_record.get('service')!r}"
    )
if producer_http_record.get('error') is not False:
    raise SystemExit(f"Expected producer HTTP error=false, got {producer_http_record.get('error')!r}")
if producer_http_record.get('test.run_id') != expected_run:
    raise SystemExit(
        f"Expected producer HTTP test.run_id {expected_run!r}, got {producer_http_record.get('test.run_id')!r}"
    )
if producer_http_record.get('test.suite') != expected_suite:
    raise SystemExit(
        f"Expected producer HTTP test.suite {expected_suite!r}, got {producer_http_record.get('test.suite')!r}"
    )

producer_send = producer_kafka[0]
consumer_receive = consumer_kafka[0]
for label, record, expected_service, expected_action in [
    ('producer', producer_send, expected_producer_service, 'send'),
    ('consumer', consumer_receive, expected_consumer_service, 'receive'),
]:
    if record.get('action') != expected_action:
        raise SystemExit(f"Expected {label} action {expected_action!r}, got {record.get('action')!r}")
    if record.get('channel') != expected_channel:
        raise SystemExit(f"Expected {label} channel {expected_channel!r}, got {record.get('channel')!r}")
    if record.get('message') != expected_message:
        raise SystemExit(f"Expected {label} message {expected_message!r}, got {record.get('message')!r}")
    if record.get('service') != expected_service:
        raise SystemExit(f"Expected {label} service {expected_service!r}, got {record.get('service')!r}")
    if record.get('error') is not False:
        raise SystemExit(f"Expected {label} error=false, got {record.get('error')!r}")
    if record.get('test.run_id') != expected_run:
        raise SystemExit(f"Expected {label} test.run_id {expected_run!r}, got {record.get('test.run_id')!r}")
    if record.get('test.suite') != expected_suite:
        raise SystemExit(f"Expected {label} test.suite {expected_suite!r}, got {record.get('test.suite')!r}")

producer_services = {record.get('service') for record in producer_records}
consumer_services = {record.get('service') for record in consumer_records}
if producer_services != {expected_producer_service}:
    raise SystemExit(f"Producer evidence unexpectedly mixed services: {sorted(producer_services)!r}")
if consumer_services != {expected_consumer_service}:
    raise SystemExit(f"Consumer evidence unexpectedly mixed services: {sorted(consumer_services)!r}")

print(
    'producer_records={producer_count} consumer_records={consumer_count} channel={channel} services={producer}->{consumer} suite={suite}'.format(
        producer_count=len(producer_records),
        consumer_count=len(consumer_records),
        channel=expected_channel,
        producer=expected_producer_service,
        consumer=expected_consumer_service,
        suite=expected_suite,
    )
)
PY
)" || fail "Two-service raw JSONL attribution drifted from the expected producer/consumer ownership contract."

echo "Merging the two-service JSONL evidence deterministically..."
if ! (
  cd "${ROOT_DIR}" && \
  node scripts/ci/merge-async-events-jsonl.mjs \
    --out "${MERGED_EVENTS_PATH}" \
    "${PRODUCER_EVENTS_PATH}" \
    "${CONSUMER_EVENTS_PATH}"
) >"${MERGE_LOG_PATH}" 2>&1; then
  fail "Deterministic merge helper failed on the two-service events files."
fi

MERGE_SUMMARY="$(python3 - "${PRODUCER_EVENTS_PATH}" "${CONSUMER_EVENTS_PATH}" "${MERGED_EVENTS_PATH}" "${EXPECTED_PRODUCER_SERVICE}" "${EXPECTED_CONSUMER_SERVICE}" <<'PY'
import json
import pathlib
import sys

producer_path = pathlib.Path(sys.argv[1]).resolve()
consumer_path = pathlib.Path(sys.argv[2]).resolve()
merged_path = pathlib.Path(sys.argv[3]).resolve()
expected_producer_service = sys.argv[4]
expected_consumer_service = sys.argv[5]

def merge_like_helper(paths):
    merged = ''
    for path in sorted(paths, key=lambda candidate: str(candidate.resolve())):
        content = path.read_text(encoding='utf-8')
        if not content:
            continue
        if merged and not merged.endswith('\n'):
            merged += '\n'
        merged += content
    return merged

expected_merged = merge_like_helper([producer_path, consumer_path])
actual_merged = merged_path.read_text(encoding='utf-8')
if actual_merged != expected_merged:
    raise SystemExit('Merged JSONL differs from the deterministic concatenation of producer and consumer files')

records = [json.loads(line) for line in actual_merged.splitlines() if line.strip()]
if len(records) != 3:
    raise SystemExit(f"Expected exactly 3 merged records, got {len(records)}")
services = {record.get('service') for record in records}
expected_services = {expected_producer_service, expected_consumer_service}
if services != expected_services:
    raise SystemExit(f"Merged evidence services {sorted(services)!r} did not match {sorted(expected_services)!r}")

print(
    'merged_records={count} ordered_inputs={inputs} services={services}'.format(
        count=len(records),
        inputs=','.join(str(path) for path in sorted([producer_path, consumer_path], key=lambda candidate: str(candidate.resolve()))),
        services=','.join(sorted(services)),
    )
)
PY
)" || fail "Merged two-service evidence drifted from deterministic concatenation or lost service ownership."

echo "Running async-report directly against the merged two-service evidence..."
if ! (
  cd "${ROOT_DIR}" && \
  node yanote-js/dist/yanote.cjs async-report \
    --spec "${ASYNC_SPEC_PATH}" \
    --events "${MERGED_EVENTS_PATH}" \
    --out "${OUT_DIR}" \
    --min-coverage 100
) >"${ASYNC_STDOUT_PATH}" 2>"${ASYNC_STDERR_PATH}"; then
  if [[ "${SIMULATE_ANALYZER_FAILURE}" == "true" ]]; then
    fail "Simulated analyzer failure triggered after raw evidence and merge assertions completed."
  fi
  fail "async-report failed on the merged two-service evidence."
fi

if [[ "${SIMULATE_ANALYZER_FAILURE}" == "true" ]]; then
  fail "Simulated analyzer failure flag was set, but async-report unexpectedly succeeded."
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

REPORT_SUMMARY="$(python3 - "${OUT_DIR}/yanote-async-report.json" "${TWO_SERVICE_SUITE}" <<'PY'
import json
import math
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_suite = sys.argv[2]
if not path.exists():
    raise SystemExit(f"Missing async report file: {path}")

report = json.loads(path.read_text(encoding='utf-8'))
summary = report.get('summary', {})
coverage = report.get('coverage', {})

def expect_close(actual, expected, label):
    if not math.isclose(float(actual), float(expected), abs_tol=1e-6):
        raise SystemExit(f"Unexpected {label}={actual!r}; expected {expected!r}")

if report.get('status') != 'ok':
    raise SystemExit(f"Expected report status 'ok', got {report.get('status')!r}")
if summary.get('totalChannels') != 1 or summary.get('coveredChannels') != 1:
    raise SystemExit(f"Unexpected channel summary: {summary!r}")
if summary.get('totalOperations') != 2 or summary.get('coveredOperations') != 2:
    raise SystemExit(f"Unexpected operation summary: {summary!r}")
if summary.get('totalMessages') != 2 or summary.get('coveredMessages') != 2:
    raise SystemExit(f"Unexpected message summary: {summary!r}")
expect_close(summary.get('channelCoveragePercent'), 100, 'channelCoveragePercent')
expect_close(summary.get('operationCoveragePercent'), 100, 'operationCoveragePercent')
expect_close(summary.get('messageCoveragePercent'), 100, 'messageCoveragePercent')

if report.get('diagnostics', {}).get('counts') != {'unmatched': 0, 'mismatched': 0}:
    raise SystemExit(f"Expected zero async diagnostics, got {report.get('diagnostics')!r}")

operations = {entry['operationKey']: entry for entry in coverage.get('operations', {}).get('items', [])}
expected_keys = {'kafka send users.created', 'kafka receive users.created'}
if set(operations) != expected_keys:
    raise SystemExit(f"Unexpected async operation keys: {sorted(operations)!r}")
for key, entry in operations.items():
    if entry.get('operation', {}).get('state') != 'COVERED':
        raise SystemExit(f"Expected covered operation for {key}, got {entry!r}")
    if entry.get('messageContract', {}).get('name') != 'UserCreated':
        raise SystemExit(f"Expected UserCreated message contract for {key}, got {entry!r}")
    if entry.get('messageContract', {}).get('state') != 'COVERED':
        raise SystemExit(f"Expected covered message contract for {key}, got {entry!r}")
    if entry.get('suites') != [expected_suite]:
        raise SystemExit(f"Expected suites [{expected_suite!r}] for {key}, got {entry.get('suites')!r}")

print(
    'channels=1/1 operations=2/2 messages=2/2 suite={suite} report={report}'.format(
        suite=expected_suite,
        report=path,
    )
)
PY
)" || fail "async-report artifact drifted from the expected two-service Kafka acceptance surface."

echo "Single-service proof passed."
echo "Two-service raw proof passed: ${RAW_SUMMARY}"
echo "Deterministic merge proof passed: ${MERGE_SUMMARY}"
echo "Async analyzer proof passed: ${REPORT_SUMMARY}"
