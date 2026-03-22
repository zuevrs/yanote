#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-m004-s03-live-proof.XXXXXX")"
SINGLE_SERVICE_LOG_PATH="${TMP_DIR}/single-service-proof.log"
TWO_SERVICE_TEST_LOG_PATH="${TMP_DIR}/two-service-test.log"
MERGE_LOG_PATH="${TMP_DIR}/merge.log"
ASYNC_STDOUT_PATH="${TMP_DIR}/async-report.stdout"
ASYNC_STDERR_PATH="${TMP_DIR}/async-report.stderr"
SCHEMA_FAILURE_ASYNC_STDOUT_PATH="${TMP_DIR}/schema-failure-async-report.stdout"
SCHEMA_FAILURE_ASYNC_STDERR_PATH="${TMP_DIR}/schema-failure-async-report.stderr"
PRODUCER_EVENTS_PATH="${TMP_DIR}/01-producer.events.jsonl"
CONSUMER_EVENTS_PATH="${TMP_DIR}/02-consumer.events.jsonl"
MERGED_EVENTS_PATH="${TMP_DIR}/merged-two-service.events.jsonl"
OUT_DIR="${TMP_DIR}/async-report"
ASYNC_REPORT_PATH="${OUT_DIR}/yanote-async-report.json"
RUNTIME_SELECTED_ASYNC_SPEC_PATH="${TMP_DIR}/runtime-selected-asyncapi.yaml"
RUNTIME_SELECTED_OUT_DIR="${TMP_DIR}/runtime-selected-async-report"
RUNTIME_SELECTED_ASYNC_STDOUT_PATH="${TMP_DIR}/runtime-selected-async-report.stdout"
RUNTIME_SELECTED_ASYNC_STDERR_PATH="${TMP_DIR}/runtime-selected-async-report.stderr"
RUNTIME_SELECTED_ASYNC_REPORT_PATH="${RUNTIME_SELECTED_OUT_DIR}/yanote-async-report.json"
SCHEMA_FAILURE_OUT_DIR="${TMP_DIR}/schema-failure-async-report"
SCHEMA_FAILURE_ASYNC_REPORT_PATH="${SCHEMA_FAILURE_OUT_DIR}/yanote-async-report.json"
ASYNC_EXPORT_DIR="${YANOTE_ASYNC_EXPORT_DIR:-${ROOT_DIR}/.yanote-ci/live-kafka-proof}"
KEEP_TEMP="false"
SIMULATE_ANALYZER_FAILURE="false"
ARTIFACT_EXPORT_ATTEMPTED="false"
ARTIFACT_EXPORT_SUCCEEDED="false"

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
SCHEMA_FAILURE_ASYNC_SPEC_PATH="yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml"

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

export_async_artifacts() {
  local proof_status="$1"
  ARTIFACT_EXPORT_ATTEMPTED="true"

  if (
    cd "${ROOT_DIR}" && \
    YANOTE_ASYNC_PROOF_STATUS="${proof_status}" \
    YANOTE_ASYNC_SOURCE_TEMP_DIR="${TMP_DIR}" \
    YANOTE_ASYNC_SOURCE_SINGLE_SERVICE_LOG="${SINGLE_SERVICE_LOG_PATH}" \
    YANOTE_ASYNC_SOURCE_TWO_SERVICE_LOG="${TWO_SERVICE_TEST_LOG_PATH}" \
    YANOTE_ASYNC_SOURCE_PRODUCER_EVENTS="${PRODUCER_EVENTS_PATH}" \
    YANOTE_ASYNC_SOURCE_CONSUMER_EVENTS="${CONSUMER_EVENTS_PATH}" \
    YANOTE_ASYNC_SOURCE_MERGE_LOG="${MERGE_LOG_PATH}" \
    YANOTE_ASYNC_SOURCE_MERGED_EVENTS="${MERGED_EVENTS_PATH}" \
    YANOTE_ASYNC_SOURCE_ASYNC_STDOUT="${ASYNC_STDOUT_PATH}" \
    YANOTE_ASYNC_SOURCE_ASYNC_STDERR="${ASYNC_STDERR_PATH}" \
    YANOTE_ASYNC_SOURCE_ASYNC_REPORT="${ASYNC_REPORT_PATH}" \
    YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_STDOUT="${RUNTIME_SELECTED_ASYNC_STDOUT_PATH}" \
    YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_STDERR="${RUNTIME_SELECTED_ASYNC_STDERR_PATH}" \
    YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_REPORT="${RUNTIME_SELECTED_ASYNC_REPORT_PATH}" \
    YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_STDOUT="${SCHEMA_FAILURE_ASYNC_STDOUT_PATH}" \
    YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_STDERR="${SCHEMA_FAILURE_ASYNC_STDERR_PATH}" \
    YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_REPORT="${SCHEMA_FAILURE_ASYNC_REPORT_PATH}" \
    bash scripts/ci/export-async-proof-artifacts.sh "${ASYNC_EXPORT_DIR}"
  ); then
    ARTIFACT_EXPORT_SUCCEEDED="true"
    return 0
  fi

  ARTIFACT_EXPORT_SUCCEEDED="false"
  return 1
}

print_failure_artifacts() {
  echo "Verification failed. Retained failure artifacts:" >&2
  echo "  temp_dir: ${TMP_DIR}" >&2
  echo "  exported_async_bundle: ${ASYNC_EXPORT_DIR}" >&2
  echo "  async_bundle_exported: ${ARTIFACT_EXPORT_SUCCEEDED}" >&2
  echo "  single_service_log: ${SINGLE_SERVICE_LOG_PATH}" >&2
  echo "  two_service_test_log: ${TWO_SERVICE_TEST_LOG_PATH}" >&2
  echo "  producer_events_file: ${PRODUCER_EVENTS_PATH}" >&2
  echo "  consumer_events_file: ${CONSUMER_EVENTS_PATH}" >&2
  echo "  merge_log: ${MERGE_LOG_PATH}" >&2
  echo "  merged_events_file: ${MERGED_EVENTS_PATH}" >&2
  echo "  async_stdout: ${ASYNC_STDOUT_PATH}" >&2
  echo "  async_stderr: ${ASYNC_STDERR_PATH}" >&2
  echo "  async_report_dir: ${OUT_DIR}" >&2
  echo "  runtime_selected_async_stdout: ${RUNTIME_SELECTED_ASYNC_STDOUT_PATH}" >&2
  echo "  runtime_selected_async_stderr: ${RUNTIME_SELECTED_ASYNC_STDERR_PATH}" >&2
  echo "  runtime_selected_async_report_dir: ${RUNTIME_SELECTED_OUT_DIR}" >&2
  echo "  schema_failure_async_stdout: ${SCHEMA_FAILURE_ASYNC_STDOUT_PATH}" >&2
  echo "  schema_failure_async_stderr: ${SCHEMA_FAILURE_ASYNC_STDERR_PATH}" >&2
  echo "  schema_failure_async_report_dir: ${SCHEMA_FAILURE_OUT_DIR}" >&2
}

show_failure_tail() {
  local file
  for file in \
    "${SINGLE_SERVICE_LOG_PATH}" \
    "${TWO_SERVICE_TEST_LOG_PATH}" \
    "${MERGE_LOG_PATH}" \
    "${ASYNC_STDOUT_PATH}" \
    "${ASYNC_STDERR_PATH}" \
    "${RUNTIME_SELECTED_ASYNC_STDOUT_PATH}" \
    "${RUNTIME_SELECTED_ASYNC_STDERR_PATH}" \
    "${SCHEMA_FAILURE_ASYNC_STDOUT_PATH}" \
    "${SCHEMA_FAILURE_ASYNC_STDERR_PATH}"; do
    if [[ -s "${file}" ]]; then
      echo "--- $(basename "${file}") (tail) ---" >&2
      tail -n 80 "${file}" >&2 || true
    fi
  done
}

fail() {
  local message="$1"
  echo "ERROR: ${message}" >&2
  if [[ "${ARTIFACT_EXPORT_ATTEMPTED}" != "true" ]]; then
    if ! export_async_artifacts "failure"; then
      echo "WARN: Failed to export async proof artifacts to ${ASYNC_EXPORT_DIR}" >&2
    fi
  fi
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
if producer_http_record.get('status') != 201:
    raise SystemExit(f"Expected producer HTTP status 201, got {producer_http_record.get('status')!r}")
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
    headers = record.get('headers')
    if not isinstance(headers, dict):
        raise SystemExit(f"Expected {label} retained Kafka headers map, got {headers!r}")
    if headers.get('yanote.message') != {'state': 'captured', 'value': expected_message}:
        raise SystemExit(f"Expected {label} retained yanote.message header {expected_message!r}, got {headers.get('yanote.message')!r}")
    if headers.get('yanote.test.run_id') != {'state': 'captured', 'value': expected_run}:
        raise SystemExit(f"Expected {label} retained yanote.test.run_id header {expected_run!r}, got {headers.get('yanote.test.run_id')!r}")
    if headers.get('yanote.test.suite') != {'state': 'captured', 'value': expected_suite}:
        raise SystemExit(f"Expected {label} retained yanote.test.suite header {expected_suite!r}, got {headers.get('yanote.test.suite')!r}")

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

cat >"${RUNTIME_SELECTED_ASYNC_SPEC_PATH}" <<EOF
asyncapi: 3.0.0
info:
  title: spring kafka two-service runtime selection proof
  version: '1.0.0'
servers:
  kafkaLocal:
    host: localhost:9092
    protocol: kafka
channels:
  userCreated:
    address: ${EXPECTED_CHANNEL}
operations:
  sendUserCreated:
    action: send
    channel:
      \$ref: '#/channels/userCreated'
    messages:
      - name: ${EXPECTED_MESSAGE}
        headers:
          type: object
          required:
            - yanote.message
            - yanote.test.run_id
            - yanote.test.suite
          properties:
            yanote.message:
              type: string
              const: ${EXPECTED_MESSAGE}
            yanote.test.run_id:
              type: string
            yanote.test.suite:
              type: string
              const: ${TWO_SERVICE_SUITE}
        payload:
          \$ref: '#/components/schemas/UserCreatedPayload'
      - name: ${EXPECTED_MESSAGE}
        headers:
          type: object
          required:
            - yanote.message
            - yanote.test.run_id
            - yanote.test.suite
          properties:
            yanote.message:
              type: string
              const: ${EXPECTED_MESSAGE}
            yanote.test.run_id:
              type: string
            yanote.test.suite:
              type: string
              const: suite-not-observed
        payload:
          \$ref: '#/components/schemas/UserCreatedPayloadShadow'
  receiveUserCreated:
    action: receive
    channel:
      \$ref: '#/channels/userCreated'
    messages:
      - name: ${EXPECTED_MESSAGE}
        headers:
          type: object
          required:
            - yanote.message
            - yanote.test.run_id
            - yanote.test.suite
          properties:
            yanote.message:
              type: string
              const: ${EXPECTED_MESSAGE}
            yanote.test.run_id:
              type: string
            yanote.test.suite:
              type: string
              const: ${TWO_SERVICE_SUITE}
        payload:
          \$ref: '#/components/schemas/UserCreatedPayload'
      - name: ${EXPECTED_MESSAGE}
        headers:
          type: object
          required:
            - yanote.message
            - yanote.test.run_id
            - yanote.test.suite
          properties:
            yanote.message:
              type: string
              const: ${EXPECTED_MESSAGE}
            yanote.test.run_id:
              type: string
            yanote.test.suite:
              type: string
              const: suite-not-observed
        payload:
          \$ref: '#/components/schemas/UserCreatedPayloadShadow'
components:
  schemas:
    UserCreatedPayload:
      type: object
      required:
        - name
        - email
      properties:
        name:
          type: string
        email:
          type: string
    UserCreatedPayloadShadow:
      type: object
      required:
        - userId
      properties:
        userId:
          type: string
EOF

echo "Running async-report directly against the merged two-service evidence..."
async_report_exit_code=0
if (
  cd "${ROOT_DIR}" && \
  node yanote-js/dist/yanote.cjs async-report \
    --spec "${ASYNC_SPEC_PATH}" \
    --events "${MERGED_EVENTS_PATH}" \
    --out "${OUT_DIR}" \
    --min-coverage 100
) >"${ASYNC_STDOUT_PATH}" 2>"${ASYNC_STDERR_PATH}"; then
  async_report_exit_code=0
else
  async_report_exit_code=$?
fi

if [[ "${SIMULATE_ANALYZER_FAILURE}" == "true" ]]; then
  if [[ "${async_report_exit_code}" -eq 0 ]]; then
    fail "Simulated analyzer failure flag was set, but async-report unexpectedly succeeded."
  fi
  if [[ "${async_report_exit_code}" -ne 3 ]]; then
    fail "Simulated analyzer failure exited ${async_report_exit_code} instead of the expected gate exit code 3."
  fi
  if [[ ! -s "${ASYNC_STDERR_PATH}" ]]; then
    fail "Simulated analyzer failure did not write typed stderr diagnostics."
  fi
  if ! grep -q '^Summary$' "${ASYNC_STDOUT_PATH}"; then
    fail "Simulated analyzer failure stdout is missing the Summary section."
  fi
  if ! grep -q '^YANOTE_ASYNC_SUMMARY ' "${ASYNC_STDOUT_PATH}"; then
    fail "Simulated analyzer failure stdout is missing the final YANOTE_ASYNC_SUMMARY line."
  fi
  if ! grep -q 'ASYNC_GATE_MIN_COVERAGE' "${ASYNC_STDERR_PATH}"; then
    fail "Simulated analyzer failure stderr is missing ASYNC_GATE_MIN_COVERAGE."
  fi

  SIMULATED_FAILURE_SUMMARY="$(python3 - "${ASYNC_REPORT_PATH}" "${async_report_exit_code}" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_exit_code = int(sys.argv[2])
if not path.exists():
    raise SystemExit(f"Missing simulated-failure async report file: {path}")

report = json.loads(path.read_text(encoding='utf-8'))
summary = report.get('summary', {})
counts = report.get('diagnostics', {}).get('counts', {})
coverage_items = report.get('coverage', {}).get('operations', {}).get('items', [])
coverage_by_key = {entry.get('operationKey'): entry for entry in coverage_items}
expected_keys = {
    'kafka send users.created',
    'kafka receive users.created',
    'kafka send users.created.republished',
    'kafka receive users.created.republished',
}
if report.get('status') != 'partial':
    raise SystemExit(f"Expected simulated-failure report status 'partial', got {report.get('status')!r}")
if summary.get('totalChannels') != 2 or summary.get('coveredChannels') != 1:
    raise SystemExit(f"Unexpected simulated-failure channel summary: {summary!r}")
if summary.get('totalOperations') != 4 or summary.get('coveredOperations') != 2:
    raise SystemExit(f"Unexpected simulated-failure operation summary: {summary!r}")
if summary.get('totalMessages') != 4 or summary.get('coveredMessages') != 2:
    raise SystemExit(f"Unexpected simulated-failure message summary: {summary!r}")
expected_counts = {
    'unsupported-content-type': 0,
    'unsupported-schema-format': 0,
    'missing-payload': 0,
    'invalid-payload': 0,
    'missing-header': 0,
    'unavailable-header': 0,
    'invalid-header': 0,
    'unverifiable-headers': 0,
    'ambiguous': 0,
    'unmatched': 0,
    'mismatched': 0,
}
if counts != expected_counts:
    raise SystemExit(f"Expected zero async diagnostics on simulated-failure path, got {counts!r}")
if set(coverage_by_key) != expected_keys:
    raise SystemExit(f"Unexpected simulated-failure operation keys: {sorted(coverage_by_key)!r}")
for key in ('kafka send users.created', 'kafka receive users.created'):
    if coverage_by_key[key].get('operation', {}).get('state') != 'COVERED':
        raise SystemExit(f"Expected covered observed operation for {key}, got {coverage_by_key[key]!r}")
for key in ('kafka send users.created.republished', 'kafka receive users.created.republished'):
    if coverage_by_key[key].get('operation', {}).get('state') != 'UNCOVERED':
        raise SystemExit(f"Expected uncovered republished operation for {key}, got {coverage_by_key[key]!r}")

print(
    'exit_code={exit_code} channels=1/2 operations=2/4 messages=2/4 primary=ASYNC_GATE_MIN_COVERAGE report={report}'.format(
        exit_code=expected_exit_code,
        report=path,
    )
)
PY
)" || fail "Simulated analyzer failure drifted from the expected gate-failure surface."

  if ! export_async_artifacts "simulated-failure"; then
    fail "Async proof artifacts exporter failed after the simulated analyzer failure was confirmed."
  fi

  echo "Single-service proof passed."
  echo "Two-service raw proof passed: ${RAW_SUMMARY}"
  echo "Deterministic merge proof passed: ${MERGE_SUMMARY}"
  echo "Simulated async analyzer failure passed: ${SIMULATED_FAILURE_SUMMARY}"
  echo "Async proof artifacts exported: ${ASYNC_EXPORT_DIR}"
  exit 0
fi

if [[ "${async_report_exit_code}" -ne 0 ]]; then
  fail "async-report failed on the merged two-service evidence."
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

REPORT_SUMMARY="$(python3 - "${ASYNC_REPORT_PATH}" "${TWO_SERVICE_SUITE}" <<'PY'
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

if report.get('diagnostics', {}).get('counts') != {
    'unsupported-content-type': 0,
    'unsupported-schema-format': 0,
    'missing-payload': 0,
    'invalid-payload': 0,
    'missing-header': 0,
    'unavailable-header': 0,
    'invalid-header': 0,
    'unverifiable-headers': 0,
    'ambiguous': 0,
    'unmatched': 0,
    'mismatched': 0,
}:
    raise SystemExit(f"Expected widened zero async diagnostics contract, got {report.get('diagnostics')!r}")

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

echo "Running runtime-selection async-report against the same merged evidence to prove retained-header discriminators..."
if ! (
  cd "${ROOT_DIR}" && \
  node yanote-js/dist/yanote.cjs async-report \
    --spec "${RUNTIME_SELECTED_ASYNC_SPEC_PATH}" \
    --events "${MERGED_EVENTS_PATH}" \
    --out "${RUNTIME_SELECTED_OUT_DIR}"
) >"${RUNTIME_SELECTED_ASYNC_STDOUT_PATH}" 2>"${RUNTIME_SELECTED_ASYNC_STDERR_PATH}"; then
  fail "Runtime-selection async-report failed on the merged two-service evidence."
fi

if [[ -s "${RUNTIME_SELECTED_ASYNC_STDERR_PATH}" ]]; then
  fail "Runtime-selection async-report unexpectedly wrote to stderr."
fi
if ! grep -q '^Summary$' "${RUNTIME_SELECTED_ASYNC_STDOUT_PATH}"; then
  fail "Runtime-selection async-report stdout is missing the Summary section."
fi
if ! grep -q '^YANOTE_ASYNC_SUMMARY ' "${RUNTIME_SELECTED_ASYNC_STDOUT_PATH}"; then
  fail "Runtime-selection async-report stdout is missing the final YANOTE_ASYNC_SUMMARY line."
fi

RUNTIME_SELECTED_REPORT_SUMMARY="$(python3 - "${RUNTIME_SELECTED_ASYNC_REPORT_PATH}" "${TWO_SERVICE_SUITE}" <<'PY'
import json
import math
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_suite = sys.argv[2]
if not path.exists():
    raise SystemExit(f"Missing runtime-selection async report file: {path}")

report = json.loads(path.read_text(encoding='utf-8'))
summary = report.get('summary', {})
coverage = report.get('coverage', {})
counts = report.get('diagnostics', {}).get('counts', {})

def expect_close(actual, expected, label):
    if not math.isclose(float(actual), float(expected), abs_tol=1e-6):
        raise SystemExit(f"Unexpected {label}={actual!r}; expected {expected!r}")

if report.get('status') != 'partial':
    raise SystemExit(f"Expected runtime-selection report status 'partial', got {report.get('status')!r}")
if summary.get('totalChannels') != 1 or summary.get('coveredChannels') != 1:
    raise SystemExit(f"Unexpected runtime-selection channel summary: {summary!r}")
if summary.get('totalOperations') != 2 or summary.get('coveredOperations') != 2:
    raise SystemExit(f"Unexpected runtime-selection operation summary: {summary!r}")
if summary.get('totalMessages') != 4 or summary.get('coveredMessages') != 2:
    raise SystemExit(f"Unexpected runtime-selection message summary: {summary!r}")
expect_close(summary.get('channelCoveragePercent'), 100, 'channelCoveragePercent')
expect_close(summary.get('operationCoveragePercent'), 100, 'operationCoveragePercent')
expect_close(summary.get('messageCoveragePercent'), 50, 'messageCoveragePercent')

expected_counts = {
    'unsupported-content-type': 0,
    'unsupported-schema-format': 0,
    'missing-payload': 0,
    'invalid-payload': 0,
    'missing-header': 0,
    'unavailable-header': 0,
    'invalid-header': 0,
    'unverifiable-headers': 0,
    'ambiguous': 0,
    'unmatched': 0,
    'mismatched': 0,
}
if counts != expected_counts:
    raise SystemExit(f"Expected zero runtime-selection diagnostics, got {counts!r}")

operations = {entry['operationKey']: entry for entry in coverage.get('operations', {}).get('items', [])}
expected_keys = {'kafka send users.created', 'kafka receive users.created'}
if set(operations) != expected_keys:
    raise SystemExit(f"Unexpected runtime-selection operation keys: {sorted(operations)!r}")
for key, entry in operations.items():
    message_contract = entry.get('messageContract', {})
    if entry.get('operation', {}).get('state') != 'COVERED':
        raise SystemExit(f"Expected covered operation for {key}, got {entry!r}")
    if message_contract.get('state') != 'PARTIAL':
        raise SystemExit(f"Expected runtime-selected PARTIAL message contract for {key}, got {entry!r}")
    if message_contract.get('selectionMode') != 'runtime':
        raise SystemExit(f"Expected runtime selectionMode for {key}, got {entry!r}")
    declared_messages = message_contract.get('declaredMessages') or []
    selected_messages = message_contract.get('selectedMessages') or []
    if len(declared_messages) != 2:
        raise SystemExit(f"Expected 2 declaredMessages for {key}, got {declared_messages!r}")
    if len(selected_messages) != 1:
        raise SystemExit(f"Expected 1 selectedMessages entry for {key}, got {selected_messages!r}")
    if not all(candidate.startswith('UserCreated ') for candidate in declared_messages):
        raise SystemExit(f"Expected declaredMessages for {key} to stay on the UserCreated contract, got {declared_messages!r}")
    if not selected_messages[0].startswith('UserCreated '):
        raise SystemExit(f"Expected selectedMessages for {key} to stay on the UserCreated contract, got {selected_messages!r}")
    if not any(f"yanote.test.suite={expected_suite}" in candidate for candidate in declared_messages):
        raise SystemExit(f"Expected declaredMessages for {key} to retain the observed suite discriminator, got {declared_messages!r}")
    if not any('yanote.test.suite=suite-not-observed' in candidate for candidate in declared_messages):
        raise SystemExit(f"Expected declaredMessages for {key} to retain the shadow suite discriminator, got {declared_messages!r}")
    if f"yanote.test.suite={expected_suite}" not in selected_messages[0]:
        raise SystemExit(f"Expected selectedMessages for {key} to prove runtime selection via retained headers, got {selected_messages!r}")
    if entry.get('suites') != [expected_suite]:
        raise SystemExit(f"Expected suites [{expected_suite!r}] for {key}, got {entry.get('suites')!r}")

messages = coverage.get('messages', {}).get('items', [])
covered = [entry for entry in messages if entry.get('state') == 'COVERED']
uncovered = [entry for entry in messages if entry.get('state') == 'UNCOVERED']
if len(covered) != 2 or len(uncovered) != 2:
    raise SystemExit(f"Expected runtime-selection covered/uncovered split 2/2, got covered={len(covered)} uncovered={len(uncovered)}")

print(
    'channels=1/1 operations=2/2 messages=2/4 selection=runtime suite={suite} report={report}'.format(
        suite=expected_suite,
        report=path,
    )
)
PY
)" || fail "Runtime-selection sidecar drifted from the expected retained-header discriminator surface."

echo "Running intentional schema-failure async-report against the same merged evidence..."
schema_failure_exit_code=0
if (
  cd "${ROOT_DIR}" && \
  node yanote-js/dist/yanote.cjs async-report \
    --spec "${SCHEMA_FAILURE_ASYNC_SPEC_PATH}" \
    --events "${MERGED_EVENTS_PATH}" \
    --out "${SCHEMA_FAILURE_OUT_DIR}" \
    --min-coverage 100
) >"${SCHEMA_FAILURE_ASYNC_STDOUT_PATH}" 2>"${SCHEMA_FAILURE_ASYNC_STDERR_PATH}"; then
  schema_failure_exit_code=0
else
  schema_failure_exit_code=$?
fi

if [[ "${schema_failure_exit_code}" -eq 0 ]]; then
  fail "Intentional schema-failure async-report unexpectedly succeeded."
fi
if [[ ! -s "${SCHEMA_FAILURE_ASYNC_STDERR_PATH}" ]]; then
  fail "Intentional schema-failure async-report did not write typed stderr diagnostics."
fi
if ! grep -q 'ASYNC_SEMANTIC_INVALID_PAYLOAD' "${SCHEMA_FAILURE_ASYNC_STDERR_PATH}"; then
  fail "Intentional schema-failure stderr is missing ASYNC_SEMANTIC_INVALID_PAYLOAD."
fi
if [[ ! -f "${SCHEMA_FAILURE_ASYNC_REPORT_PATH}" ]]; then
  fail "Intentional schema-failure async-report did not retain yanote-async-report.json."
fi
if ! grep -q '^YANOTE_ASYNC_SUMMARY ' "${SCHEMA_FAILURE_ASYNC_STDOUT_PATH}"; then
  fail "Intentional schema-failure stdout is missing the final YANOTE_ASYNC_SUMMARY line."
fi
if ! grep -q 'invalid-payload' "${SCHEMA_FAILURE_ASYNC_STDOUT_PATH}"; then
  fail "Intentional schema-failure stdout is missing invalid-payload truth."
fi

SCHEMA_FAILURE_REPORT_SUMMARY="$(python3 - "${SCHEMA_FAILURE_ASYNC_REPORT_PATH}" "${TWO_SERVICE_SUITE}" "${schema_failure_exit_code}" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_suite = sys.argv[2]
expected_exit_code = int(sys.argv[3])
report = json.loads(path.read_text(encoding='utf-8'))
diagnostics = report.get('diagnostics', {})
counts = diagnostics.get('counts', {})
items = diagnostics.get('items', [])

if report.get('status') != 'partial':
    raise SystemExit(f"Expected schema-failure report status 'partial', got {report.get('status')!r}")
if counts.get('invalid-payload') != 2:
    raise SystemExit(f"Expected invalid-payload count 2, got {counts.get('invalid-payload')!r}")
invalid_payload_items = [item for item in items if item.get('kind') == 'invalid-payload']
if len(invalid_payload_items) != 2:
    raise SystemExit(f"Expected 2 invalid-payload diagnostics, got {len(invalid_payload_items)}")
expected_operations = {'kafka send users.created', 'kafka receive users.created'}
actual_operations = {item.get('operationKey') for item in invalid_payload_items}
if actual_operations != expected_operations:
    raise SystemExit(f"Unexpected invalid-payload operations: {sorted(actual_operations)!r}")
for item in invalid_payload_items:
    if item.get('schemaId') != 'UserCreatedPayload':
        raise SystemExit(f"Expected schemaId UserCreatedPayload, got {item!r}")
    if item.get('validationKind') != 'payload':
        raise SystemExit(f"Expected payload validationKind, got {item!r}")
    if item.get('pointer') != '/userId':
        raise SystemExit(f"Expected pointer '/userId', got {item!r}")
    if item.get('messageName') != 'UserCreated':
        raise SystemExit(f"Expected messageName UserCreated, got {item!r}")
    reason = item.get('reason')
    if not isinstance(reason, str) or "must have required property 'userId'" not in reason:
        raise SystemExit(f"Expected missing-userId reason, got {item!r}")

coverage_items = report.get('coverage', {}).get('operations', {}).get('items', [])
coverage_by_key = {entry.get('operationKey'): entry for entry in coverage_items}
if set(coverage_by_key) != expected_operations:
    raise SystemExit(f"Unexpected coverage operation keys: {sorted(coverage_by_key)!r}")
for key, entry in coverage_by_key.items():
    if entry.get('operation', {}).get('state') != 'COVERED':
        raise SystemExit(f"Expected covered operation for {key}, got {entry!r}")
    if entry.get('messageContract', {}).get('state') != 'COVERED':
        raise SystemExit(f"Expected covered message contract for {key}, got {entry!r}")
    if entry.get('messageContract', {}).get('name') != 'UserCreated':
        raise SystemExit(f"Expected UserCreated message contract for {key}, got {entry!r}")
    if entry.get('suites') != [expected_suite]:
        raise SystemExit(f"Expected suites [{expected_suite!r}] for {key}, got {entry.get('suites')!r}")

print(
    'exit_code={exit_code} invalid_payload=2 operations=2 suite={suite} report={report}'.format(
        exit_code=expected_exit_code,
        suite=expected_suite,
        report=path,
    )
)
PY
)" || fail "Intentional schema-failure async-report drifted from the expected invalid-payload diagnostics surface."

if ! export_async_artifacts "success"; then
  fail "Async proof artifacts exporter failed after the live Kafka proof passed."
fi

echo "Single-service proof passed."
echo "Two-service raw proof passed: ${RAW_SUMMARY}"
echo "Deterministic merge proof passed: ${MERGE_SUMMARY}"
echo "Async analyzer proof passed: ${REPORT_SUMMARY}"
echo "Intentional schema-failure proof retained: ${SCHEMA_FAILURE_REPORT_SUMMARY}"
echo "Async proof artifacts exported: ${ASYNC_EXPORT_DIR}"
