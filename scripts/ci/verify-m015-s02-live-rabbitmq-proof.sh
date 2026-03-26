#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-m015-s02-live-proof.XXXXXX")"
TWO_SERVICE_TEST_LOG_PATH="${TMP_DIR}/two-service-test.log"
MERGE_LOG_PATH="${TMP_DIR}/merge.log"
ASYNC_STDOUT_PATH="${TMP_DIR}/async-report.stdout"
ASYNC_STDERR_PATH="${TMP_DIR}/async-report.stderr"
PRODUCER_EVENTS_PATH="${TMP_DIR}/01-producer.events.jsonl"
CONSUMER_EVENTS_PATH="${TMP_DIR}/02-consumer.events.jsonl"
MERGED_EVENTS_PATH="${TMP_DIR}/merged-two-service.events.jsonl"
OUT_DIR="${TMP_DIR}/async-report"
ASYNC_REPORT_PATH="${OUT_DIR}/yanote-async-report.json"
ASYNC_REPORT_HTML_PATH="${OUT_DIR}/yanote-async-report.html"
ASYNC_EXPORT_DIR="${YANOTE_ASYNC_EXPORT_DIR:-${ROOT_DIR}/.yanote-ci/live-rabbitmq-proof}"
KEEP_TEMP="false"
ARTIFACT_EXPORT_ATTEMPTED="false"
ARTIFACT_EXPORT_SUCCEEDED="false"

PROOF_TIMEOUT_SECONDS="${YANOTE_PROOF_TIMEOUT_SECONDS:-600}"
ASYNC_TIMEOUT_SECONDS="${YANOTE_ASYNC_TIMEOUT_SECONDS:-240}"
EXPECTED_RUN_ID="${YANOTE_RUN_ID:-m015-s02-live-rabbitmq-run}"
EXPECTED_SUITE="${YANOTE_SUITE:-m015-s02-live-rabbitmq-suite}"
EXPECTED_PRODUCER_SERVICE="${YANOTE_PRODUCER_SERVICE_NAME:-rabbitmq-proof-producer-service}"
EXPECTED_CONSUMER_SERVICE="${YANOTE_CONSUMER_SERVICE_NAME:-rabbitmq-proof-consumer-service}"
EXPECTED_CHANNEL="${YANOTE_EXPECTED_CHANNEL:-users.created}"
EXPECTED_MESSAGE="${YANOTE_EXPECTED_MESSAGE:-UserCreated}"
EXPECTED_HTTP_ROUTE="${YANOTE_EXPECTED_HTTP_ROUTE:-/users}"
EXPECTED_CORRELATION_HEADER="${YANOTE_EXPECTED_CORRELATION_HEADER:-correlation_id}"
EXPECTED_REPLY_HEADER="${YANOTE_EXPECTED_REPLY_HEADER:-reply_to}"
EXPECTED_CORRELATION_VALUE="${YANOTE_EXPECTED_CORRELATION_VALUE:-${EXPECTED_MESSAGE}-proof-correlation}"
EXPECTED_REPLY_VALUE="${YANOTE_EXPECTED_REPLY_VALUE:-${EXPECTED_CHANNEL}}"
ASYNC_SPEC_PATH="yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml"
OPTIONAL_EXPORT_ARTIFACTS="single-service-proof.log,runtime-selected-async-report.stdout,runtime-selected-async-report.stderr,runtime-selected-yanote-async-report.json,runtime-selected-yanote-async-report.html,schema-failure-async-report.stdout,schema-failure-async-report.stderr,schema-failure-yanote-async-report.json,schema-failure-yanote-async-report.html"

usage() {
  cat <<'EOF'
Usage: bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh [--retain-temp-on-failure]
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --retain-temp-on-failure)
      KEEP_TEMP="true"
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

run_with_timeout() {
  local timeout_seconds="$1"
  local stdout_path="$2"
  local stderr_path="$3"
  shift 3

  python3 - "$timeout_seconds" "$stdout_path" "$stderr_path" "$@" <<'PY'
import os
import subprocess
import sys


timeout_seconds = int(sys.argv[1])
stdout_path = sys.argv[2]
stderr_path = sys.argv[3]
command = sys.argv[4:]

with open(stdout_path, "wb") as stdout_file, open(stderr_path, "wb") as stderr_file:
    try:
        completed = subprocess.run(
            command,
            stdout=stdout_file,
            stderr=stderr_file,
            timeout=timeout_seconds,
            cwd=os.getcwd(),
            env=os.environ.copy(),
            check=False,
        )
    except subprocess.TimeoutExpired:
        stderr_file.write(
            f"YANOTE_TIMEOUT seconds={timeout_seconds} command={' '.join(command)}\n".encode("utf-8")
        )
        raise SystemExit(124)

raise SystemExit(completed.returncode)
PY
}

export_async_artifacts() {
  local proof_status="$1"
  ARTIFACT_EXPORT_ATTEMPTED="true"

  if (
    YANOTE_ASYNC_PROOF_STATUS="${proof_status}" \
    YANOTE_ASYNC_OPTIONAL_ARTIFACTS="${OPTIONAL_EXPORT_ARTIFACTS}" \
    YANOTE_ASYNC_SOURCE_TEMP_DIR="${TMP_DIR}" \
    YANOTE_ASYNC_SOURCE_TWO_SERVICE_LOG="${TWO_SERVICE_TEST_LOG_PATH}" \
    YANOTE_ASYNC_SOURCE_PRODUCER_EVENTS="${PRODUCER_EVENTS_PATH}" \
    YANOTE_ASYNC_SOURCE_CONSUMER_EVENTS="${CONSUMER_EVENTS_PATH}" \
    YANOTE_ASYNC_SOURCE_MERGE_LOG="${MERGE_LOG_PATH}" \
    YANOTE_ASYNC_SOURCE_MERGED_EVENTS="${MERGED_EVENTS_PATH}" \
    YANOTE_ASYNC_SOURCE_ASYNC_STDOUT="${ASYNC_STDOUT_PATH}" \
    YANOTE_ASYNC_SOURCE_ASYNC_STDERR="${ASYNC_STDERR_PATH}" \
    YANOTE_ASYNC_SOURCE_ASYNC_REPORT="${ASYNC_REPORT_PATH}" \
    YANOTE_ASYNC_SOURCE_ASYNC_REPORT_HTML="${ASYNC_REPORT_HTML_PATH}" \
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

echo "Running live RabbitMQ two-service integration proof..."
export YANOTE_RUN_ID="${EXPECTED_RUN_ID}"
export YANOTE_SUITE="${EXPECTED_SUITE}"
export YANOTE_PRODUCER_SERVICE_NAME="${EXPECTED_PRODUCER_SERVICE}"
export YANOTE_CONSUMER_SERVICE_NAME="${EXPECTED_CONSUMER_SERVICE}"
export YANOTE_PRODUCER_EVENTS_PATH="${PRODUCER_EVENTS_PATH}"
export YANOTE_CONSUMER_EVENTS_PATH="${CONSUMER_EVENTS_PATH}"
export YANOTE_RABBITMQ_USER_CREATED_QUEUE="${EXPECTED_CHANNEL}"

if ! run_with_timeout \
  "${PROOF_TIMEOUT_SECONDS}" \
  "${TWO_SERVICE_TEST_LOG_PATH}" \
  "${TWO_SERVICE_TEST_LOG_PATH}.stderr" \
  ./gradlew --no-daemon :examples:springmvc-service:test \
    --tests 'dev.yanote.examples.service.RabbitMqRecorderTwoServiceIntegrationTest.shouldWriteSeparateProducerAndConsumerEvidenceForLiveRabbitMqHandoff' \
    --rerun-tasks; then
  if [[ -s "${TWO_SERVICE_TEST_LOG_PATH}.stderr" ]]; then
    cat "${TWO_SERVICE_TEST_LOG_PATH}.stderr" >> "${TWO_SERVICE_TEST_LOG_PATH}"
  fi
  fail "RabbitMQ two-service integration test failed or timed out."
fi
if [[ -s "${TWO_SERVICE_TEST_LOG_PATH}.stderr" ]]; then
  cat "${TWO_SERVICE_TEST_LOG_PATH}.stderr" >> "${TWO_SERVICE_TEST_LOG_PATH}"
fi
rm -f "${TWO_SERVICE_TEST_LOG_PATH}.stderr"

for file in "${PRODUCER_EVENTS_PATH}" "${CONSUMER_EVENTS_PATH}"; do
  if [[ ! -f "${file}" ]]; then
    fail "Expected RabbitMQ proof to create $(basename "${file}") but it is missing."
  fi
  if [[ ! -s "${file}" ]]; then
    fail "Expected RabbitMQ proof to populate $(basename "${file}") but it is empty."
  fi
done

RAW_SUMMARY="$(python3 - "${PRODUCER_EVENTS_PATH}" "${CONSUMER_EVENTS_PATH}" "${EXPECTED_RUN_ID}" "${EXPECTED_SUITE}" "${EXPECTED_PRODUCER_SERVICE}" "${EXPECTED_CONSUMER_SERVICE}" "${EXPECTED_CHANNEL}" "${EXPECTED_MESSAGE}" "${EXPECTED_HTTP_ROUTE}" "${EXPECTED_CORRELATION_HEADER}" "${EXPECTED_REPLY_HEADER}" "${EXPECTED_CORRELATION_VALUE}" "${EXPECTED_REPLY_VALUE}" <<'PY'
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
expected_correlation_header = sys.argv[10]
expected_reply_header = sys.argv[11]
expected_correlation_value = sys.argv[12]
expected_reply_value = sys.argv[13]


def load(path):
    return [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]

producer_records = load(producer_path)
consumer_records = load(consumer_path)

if len(producer_records) != 2:
    raise SystemExit(f"Expected exactly 2 producer records, got {len(producer_records)}")
if len(consumer_records) != 1:
    raise SystemExit(f"Expected exactly 1 consumer record, got {len(consumer_records)}")

producer_http = [record for record in producer_records if record.get('kind') == 'http']
producer_amqp = [record for record in producer_records if record.get('kind') == 'amqp']
consumer_http = [record for record in consumer_records if record.get('kind') == 'http']
consumer_amqp = [record for record in consumer_records if record.get('kind') == 'amqp']

if len(producer_http) != 1:
    raise SystemExit(f"Expected exactly 1 producer HTTP record, got {len(producer_http)}")
if len(producer_amqp) != 1:
    raise SystemExit(f"Expected exactly 1 producer AMQP record, got {len(producer_amqp)}")
if consumer_http:
    raise SystemExit(f"Expected 0 consumer HTTP records, got {len(consumer_http)}")
if len(consumer_amqp) != 1:
    raise SystemExit(f"Expected exactly 1 consumer AMQP record, got {len(consumer_amqp)}")

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

producer_send = producer_amqp[0]
consumer_receive = consumer_amqp[0]
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
        raise SystemExit(f"Expected {label} retained AMQP headers map, got {headers!r}")
    if headers.get('yanote.message') != {'state': 'captured', 'value': expected_message}:
        raise SystemExit(f"Expected {label} retained yanote.message header {expected_message!r}, got {headers.get('yanote.message')!r}")
    if headers.get('yanote.test.run_id') != {'state': 'captured', 'value': expected_run}:
        raise SystemExit(f"Expected {label} retained yanote.test.run_id header {expected_run!r}, got {headers.get('yanote.test.run_id')!r}")
    if headers.get('yanote.test.suite') != {'state': 'captured', 'value': expected_suite}:
        raise SystemExit(f"Expected {label} retained yanote.test.suite header {expected_suite!r}, got {headers.get('yanote.test.suite')!r}")
    if headers.get(expected_correlation_header) != {'state': 'captured', 'value': expected_correlation_value}:
        raise SystemExit(
            f"Expected {label} retained {expected_correlation_header} header {expected_correlation_value!r}, got {headers.get(expected_correlation_header)!r}"
        )
    if headers.get(expected_reply_header) != {'state': 'captured', 'value': expected_reply_value}:
        raise SystemExit(
            f"Expected {label} retained {expected_reply_header} header {expected_reply_value!r}, got {headers.get(expected_reply_header)!r}"
        )

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
)" || fail "RabbitMQ producer/consumer raw JSONL drifted from the expected ownership contract."

echo "Merging producer and consumer AMQP events deterministically..."
if ! node scripts/ci/merge-async-events-jsonl.mjs \
  --out "${MERGED_EVENTS_PATH}" \
  "${PRODUCER_EVENTS_PATH}" \
  "${CONSUMER_EVENTS_PATH}" >"${MERGE_LOG_PATH}" 2>&1; then
  fail "Deterministic merge helper failed on the RabbitMQ events files."
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
)" || fail "Merged RabbitMQ evidence drifted from deterministic concatenation or lost service ownership."

echo "Running async-report directly against the merged RabbitMQ evidence..."
if ! run_with_timeout \
  "${ASYNC_TIMEOUT_SECONDS}" \
  "${ASYNC_STDOUT_PATH}" \
  "${ASYNC_STDERR_PATH}" \
  node yanote-js/dist/yanote.cjs async-report \
    --spec "${ASYNC_SPEC_PATH}" \
    --events "${MERGED_EVENTS_PATH}" \
    --out "${OUT_DIR}" \
    --min-coverage 100; then
  fail "async-report failed or timed out on the merged RabbitMQ evidence."
fi

if [[ -s "${ASYNC_STDERR_PATH}" ]]; then
  fail "async-report unexpectedly wrote to stderr on the RabbitMQ happy path."
fi
if [[ ! -f "${ASYNC_REPORT_PATH}" ]]; then
  fail "async-report did not retain yanote-async-report.json on the RabbitMQ happy path."
fi
if [[ ! -f "${ASYNC_REPORT_HTML_PATH}" ]]; then
  fail "async-report did not retain yanote-async-report.html on the RabbitMQ happy path."
fi
if ! grep -q '^Summary$' "${ASYNC_STDOUT_PATH}"; then
  fail "async-report stdout is missing the Summary section."
fi
if ! grep -q '^YANOTE_ASYNC_SUMMARY ' "${ASYNC_STDOUT_PATH}"; then
  fail "async-report stdout is missing the final YANOTE_ASYNC_SUMMARY line."
fi
if ! grep -q 'protocols=amqp' "${ASYNC_STDOUT_PATH}"; then
  fail "async-report stdout is missing protocols=amqp on the RabbitMQ happy path."
fi

REPORT_SUMMARY="$(python3 - "${ASYNC_REPORT_PATH}" "${EXPECTED_SUITE}" "${EXPECTED_CHANNEL}" "${EXPECTED_MESSAGE}" "${EXPECTED_CORRELATION_HEADER}" "${EXPECTED_REPLY_HEADER}" <<'PY'
import json
import math
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
expected_suite = sys.argv[2]
expected_channel = sys.argv[3]
expected_message = sys.argv[4]
expected_correlation_header = sys.argv[5]
expected_reply_header = sys.argv[6]
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

expected_async_diagnostics = {
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
if report.get('diagnostics', {}).get('counts') != expected_async_diagnostics:
    raise SystemExit(f"Expected zero async diagnostics contract, got {report.get('diagnostics')!r}")

expected_keys = {'amqp send users.created', 'amqp receive users.created'}
operations = {entry['operationKey']: entry for entry in coverage.get('operations', {}).get('items', [])}
if set(operations) != expected_keys:
    raise SystemExit(f"Unexpected async operation keys: {sorted(operations)!r}")
for key, entry in operations.items():
    if entry.get('operation', {}).get('state') != 'COVERED':
        raise SystemExit(f"Expected covered operation for {key}, got {entry!r}")
    if entry.get('messageContract', {}).get('name') != expected_message:
        raise SystemExit(f"Expected {expected_message} message contract for {key}, got {entry!r}")
    if entry.get('messageContract', {}).get('state') != 'COVERED':
        raise SystemExit(f"Expected covered message contract for {key}, got {entry!r}")
    if entry.get('messageContract', {}).get('selectionMode') != 'single':
        raise SystemExit(f"Expected single selectionMode for {key}, got {entry!r}")
    if entry.get('channel') != expected_channel:
        raise SystemExit(f"Expected channel {expected_channel!r} for {key}, got {entry!r}")
    if entry.get('suites') != [expected_suite]:
        raise SystemExit(f"Expected suites [{expected_suite!r}] for {key}, got {entry.get('suites')!r}")

binding_support = report.get('bindingSupport')
if not isinstance(binding_support, dict):
    raise SystemExit(f"Expected bindingSupport section, got {binding_support!r}")
if binding_support.get('summary') != {
    'totalOperations': 0,
    'totalBindings': 0,
    'supportedBindings': 0,
    'declaredOnlyBindings': 0,
    'deferredBindings': 0,
    'invalidBindings': 0,
}:
    raise SystemExit(f"Unexpected bindingSupport summary: {binding_support.get('summary')!r}")
if binding_support.get('operations') != []:
    raise SystemExit(f"Expected zero bindingSupport operations for AMQP happy path, got {binding_support.get('operations')!r}")

declared_semantics = report.get('declaredSemantics')
if not isinstance(declared_semantics, dict):
    raise SystemExit(f"Expected declaredSemantics section, got {declared_semantics!r}")
if declared_semantics.get('summary') != {
    'totalOperations': 2,
    'operationsWithCorrelationId': 2,
    'messageCorrelationIds': 2,
    'operationsWithReply': 2,
}:
    raise SystemExit(f"Unexpected declaredSemantics summary: {declared_semantics.get('summary')!r}")

declared_operations = {entry['operationKey']: entry for entry in declared_semantics.get('operations', [])}
if set(declared_operations) != expected_keys:
    raise SystemExit(f"Unexpected declaredSemantics operation keys: {sorted(declared_operations)!r}")
for key, entry in declared_operations.items():
    if entry.get('channel') != expected_channel:
        raise SystemExit(f"Expected declaredSemantics channel {expected_channel!r} for {key}, got {entry!r}")
    if entry.get('correlationIds') != [
        {
            'message': expected_message,
            'location': f'$message.header#/{expected_correlation_header}',
        }
    ]:
        raise SystemExit(f"Unexpected declared correlationIds for {key}: {entry.get('correlationIds')!r}")
    if entry.get('reply') != {
        'address': {
            'location': f'$message.header#/{expected_reply_header}',
        }
    }:
        raise SystemExit(f"Unexpected declared reply for {key}: {entry.get('reply')!r}")

runtime_semantics = report.get('runtimeSemantics')
if not isinstance(runtime_semantics, dict):
    raise SystemExit(f"Expected runtimeSemantics section, got {runtime_semantics!r}")
if runtime_semantics.get('summary') != {
    'totalOperations': 0,
    'satisfiedOperations': 0,
    'unsatisfiedOperations': 0,
    'totalSemantics': 0,
    'satisfiedSemantics': 0,
    'unsatisfiedSemantics': 0,
    'semanticCoveragePercent': None,
}:
    raise SystemExit(f"Unexpected runtimeSemantics summary: {runtime_semantics.get('summary')!r}")
if runtime_semantics.get('diagnostics', {}).get('counts') != {
    'missing': 0,
    'unavailable': 0,
    'unsupported': 0,
    'mismatched': 0,
}:
    raise SystemExit(f"Unexpected runtimeSemantics diagnostics: {runtime_semantics.get('diagnostics')!r}")
if runtime_semantics.get('operations') != []:
    raise SystemExit(f"Expected zero runtimeSemantics operations for AMQP happy path, got {runtime_semantics.get('operations')!r}")

print(
    'channels=1/1 operations=2/2 messages=2/2 bindings=0 declared=4 runtime=0 suite={suite} report={report}'.format(
        suite=expected_suite,
        report=path,
    )
)
PY
)" || fail "async-report artifact drifted from the expected RabbitMQ acceptance surface."

if ! grep -q 'Kafka Binding Support' "${ASYNC_REPORT_HTML_PATH}"; then
  fail "RabbitMQ async HTML is missing the Kafka Binding Support section."
fi
if ! grep -q 'Declared semantics' "${ASYNC_REPORT_HTML_PATH}"; then
  fail "RabbitMQ async HTML is missing the Declared semantics section."
fi
if ! grep -q 'Runtime semantics' "${ASYNC_REPORT_HTML_PATH}"; then
  fail "RabbitMQ async HTML is missing the Runtime semantics section."
fi
if ! grep -q '\$message.header#/correlation_id' "${ASYNC_REPORT_HTML_PATH}"; then
  fail "RabbitMQ async HTML is missing the declared correlationId location."
fi
if ! grep -q '\$message.header#/reply_to' "${ASYNC_REPORT_HTML_PATH}"; then
  fail "RabbitMQ async HTML is missing the declared reply.address location."
fi
for file in \
  "${ASYNC_STDOUT_PATH}" \
  "${ASYNC_STDERR_PATH}" \
  "${ASYNC_REPORT_PATH}" \
  "${ASYNC_REPORT_HTML_PATH}"; do
  if grep -F -q "${EXPECTED_CORRELATION_VALUE}" "${file}"; then
    fail "RabbitMQ async surfaces leaked the raw correlation proof header value into $(basename "${file}")."
  fi
done

if ! export_async_artifacts "success"; then
  fail "Async proof artifacts exporter failed after the live RabbitMQ proof passed."
fi

for file in \
  "${ASYNC_EXPORT_DIR}/artifact-manifest.txt" \
  "${ASYNC_EXPORT_DIR}/artifact-source-paths.txt" \
  "${ASYNC_EXPORT_DIR}/two-service-test.log" \
  "${ASYNC_EXPORT_DIR}/01-producer.events.jsonl" \
  "${ASYNC_EXPORT_DIR}/02-consumer.events.jsonl" \
  "${ASYNC_EXPORT_DIR}/merge.log" \
  "${ASYNC_EXPORT_DIR}/merged-two-service.events.jsonl" \
  "${ASYNC_EXPORT_DIR}/async-report.stdout" \
  "${ASYNC_EXPORT_DIR}/async-report.stderr" \
  "${ASYNC_EXPORT_DIR}/yanote-async-report.json" \
  "${ASYNC_EXPORT_DIR}/yanote-async-report.html"; do
  if [[ ! -f "${file}" ]]; then
    fail "Expected exported RabbitMQ bundle artifact $(basename "${file}") but it is missing."
  fi
done

for file in \
  "${ASYNC_EXPORT_DIR}/artifact-manifest.txt" \
  "${ASYNC_EXPORT_DIR}/artifact-source-paths.txt" \
  "${ASYNC_EXPORT_DIR}/two-service-test.log" \
  "${ASYNC_EXPORT_DIR}/merge.log" \
  "${ASYNC_EXPORT_DIR}/async-report.stdout" \
  "${ASYNC_EXPORT_DIR}/async-report.stderr" \
  "${ASYNC_EXPORT_DIR}/yanote-async-report.json" \
  "${ASYNC_EXPORT_DIR}/yanote-async-report.html"; do
  if grep -F -q "${EXPECTED_CORRELATION_VALUE}" "${file}"; then
    fail "Exported RabbitMQ proof bundle leaked the raw correlation proof header value into $(basename "${file}")."
  fi
done

for file in \
  "${ASYNC_EXPORT_DIR}/single-service-proof.log" \
  "${ASYNC_EXPORT_DIR}/runtime-selected-async-report.stdout" \
  "${ASYNC_EXPORT_DIR}/runtime-selected-async-report.stderr" \
  "${ASYNC_EXPORT_DIR}/runtime-selected-yanote-async-report.json" \
  "${ASYNC_EXPORT_DIR}/runtime-selected-yanote-async-report.html" \
  "${ASYNC_EXPORT_DIR}/schema-failure-async-report.stdout" \
  "${ASYNC_EXPORT_DIR}/schema-failure-async-report.stderr" \
  "${ASYNC_EXPORT_DIR}/schema-failure-yanote-async-report.json" \
  "${ASYNC_EXPORT_DIR}/schema-failure-yanote-async-report.html"; do
  if [[ -e "${file}" ]]; then
    fail "RabbitMQ bundle fabricated optional Kafka-only companion $(basename "${file}")."
  fi
done

if ! grep -q '^optional_artifacts='"${OPTIONAL_EXPORT_ARTIFACTS}"'$' "${ASYNC_EXPORT_DIR}/artifact-manifest.txt"; then
  fail "RabbitMQ artifact manifest is missing the optional-artifacts contract note."
fi
if ! grep -q '^optional_artifacts='"${OPTIONAL_EXPORT_ARTIFACTS}"'$' "${ASYNC_EXPORT_DIR}/artifact-source-paths.txt"; then
  fail "RabbitMQ source-path note is missing the optional-artifacts contract note."
fi
if ! grep -q '^report_spec_source_ref=yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml$' "${ASYNC_EXPORT_DIR}/artifact-manifest.txt"; then
  fail "RabbitMQ artifact manifest is missing the canonical AMQP spec source reference."
fi
if ! grep -q '^report_channels=1/1$' "${ASYNC_EXPORT_DIR}/artifact-manifest.txt"; then
  fail "RabbitMQ artifact manifest is missing the expected 1/1 channel coverage summary."
fi
if ! grep -q '^report_operations=2/2$' "${ASYNC_EXPORT_DIR}/artifact-manifest.txt"; then
  fail "RabbitMQ artifact manifest is missing the expected 2/2 operation coverage summary."
fi
if ! grep -q '^report_messages=2/2$' "${ASYNC_EXPORT_DIR}/artifact-manifest.txt"; then
  fail "RabbitMQ artifact manifest is missing the expected 2/2 message coverage summary."
fi
if ! grep -q '^report_supported_bindings=0/0$' "${ASYNC_EXPORT_DIR}/artifact-manifest.txt"; then
  fail "RabbitMQ artifact manifest is missing the zero-binding summary for Kafka-only additive sections."
fi
if ! grep -q '^report_runtime_satisfied_semantics=0/0$' "${ASYNC_EXPORT_DIR}/artifact-manifest.txt"; then
  fail "RabbitMQ artifact manifest is missing the zero runtime-semantics summary for the RabbitMQ happy path."
fi
if ! grep -q '^report_runtime_semantic_coverage_percent=none$' "${ASYNC_EXPORT_DIR}/artifact-manifest.txt"; then
  fail "RabbitMQ artifact manifest is missing the expected none runtime semantic coverage marker."
fi
for absent_note in \
  'single-service-proof.log=none' \
  'runtime-selected-async-report.stdout=none' \
  'runtime-selected-async-report.stderr=none' \
  'runtime-selected-yanote-async-report.json=none' \
  'runtime-selected-yanote-async-report.html=none' \
  'schema-failure-async-report.stdout=none' \
  'schema-failure-async-report.stderr=none' \
  'schema-failure-yanote-async-report.json=none' \
  'schema-failure-yanote-async-report.html=none'; do
  if ! grep -q "^${absent_note}$" "${ASYNC_EXPORT_DIR}/artifact-source-paths.txt"; then
    fail "RabbitMQ source-path note is missing the explicit absence marker ${absent_note}."
  fi
done
if ! grep -q '^YANOTE_ASYNC_SUMMARY .*protocols=amqp' "${ASYNC_EXPORT_DIR}/async-report.stdout"; then
  fail "Exported async-report.stdout is missing the final protocols=amqp summary line."
fi

if ! grep -q '^report_runtime_semantic_coverage_percent=none$' "${ASYNC_EXPORT_DIR}/artifact-source-paths.txt"; then
  fail "RabbitMQ source-path note is missing the expected none runtime semantic coverage marker."
fi

if ! grep -q '^report_supported_bindings=0/0$' "${ASYNC_EXPORT_DIR}/artifact-source-paths.txt"; then
  fail "RabbitMQ source-path note is missing the zero-binding summary."
fi

echo "Two-service raw proof passed: ${RAW_SUMMARY}"
echo "Deterministic merge proof passed: ${MERGE_SUMMARY}"
echo "Async analyzer proof passed: ${REPORT_SUMMARY}"
echo "Async proof artifacts exported: ${ASYNC_EXPORT_DIR}"
