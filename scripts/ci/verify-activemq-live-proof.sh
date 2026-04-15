#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-jms-live-proof.XXXXXX")"
EVENTS_PATH="${TMP_DIR}/events.jsonl"
TEST_LOG_PATH="${TMP_DIR}/module-test.log"
ASYNC_STDOUT_PATH="${TMP_DIR}/async-report.stdout"
ASYNC_STDERR_PATH="${TMP_DIR}/async-report.stderr"
OUT_DIR="${TMP_DIR}/async-report"
ASYNC_REPORT_PATH="${OUT_DIR}/yanote-async-report.json"
ASYNC_REPORT_HTML_PATH="${OUT_DIR}/yanote-async-report.html"
SPEC_PATH="yanote-js/test/fixtures/asyncapi/spring-jms-activemq-single-service.yaml"
KEEP_TEMP="false"

cleanup() {
  if [[ "${KEEP_TEMP}" != "true" ]]; then
    rm -rf "${TMP_DIR}"
  fi
}
trap cleanup EXIT

fail() {
  echo "ERROR: $1" >&2
  KEEP_TEMP="true"
  for file in "${TEST_LOG_PATH}" "${ASYNC_STDOUT_PATH}" "${ASYNC_STDERR_PATH}"; do
    if [[ -s "${file}" ]]; then
      echo "--- $(basename "${file}") (tail) ---" >&2
      tail -n 80 "${file}" >&2 || true
    fi
  done
  echo "Retained temp dir: ${TMP_DIR}" >&2
  exit 1
}

echo "Running embedded Artemis single-service proof..."
if ! YANOTE_ACTIVEMQ_EVENTS_PATH="${EVENTS_PATH}" \
  ./gradlew --no-daemon :yanote-recorder-spring-activemq:test \
  --tests dev.yanote.recorder.springactivemq.ActiveMqRecorderSingleServiceIntegrationTest \
  --console=plain >"${TEST_LOG_PATH}" 2>&1; then
  fail "ActiveMQ Artemis integration test failed."
fi

if [[ ! -s "${EVENTS_PATH}" ]]; then
  fail "Expected embedded Artemis proof to create a non-empty events.jsonl file."
fi

RAW_SUMMARY="$(python3 - "${EVENTS_PATH}" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
text = path.read_text(encoding='utf-8')
if 'top-secret-token' in text:
    raise SystemExit('raw events leaked the secret property value')
records = [json.loads(line) for line in text.splitlines() if line.strip()]
if len(records) != 2:
    raise SystemExit(f'Expected exactly 2 JMS records, got {len(records)}')
actions = {record.get('action') for record in records}
if actions != {'send', 'receive'}:
    raise SystemExit(f'Unexpected JMS actions: {sorted(actions)!r}')
for record in records:
    if record.get('kind') != 'jms':
        raise SystemExit(f'Expected kind=jms, got {record.get("kind")!r}')
    if record.get('channel') != 'yanote.jms.integration.queue':
        raise SystemExit(f'Unexpected channel: {record.get("channel")!r}')
    if record.get('message') != 'OrderCreated':
        raise SystemExit(f'Unexpected message hint: {record.get("message")!r}')
    if record.get('service') != 'activemq-integration-test':
        raise SystemExit(f'Unexpected service: {record.get("service")!r}')
    if record.get('error') is not False:
        raise SystemExit(f'Expected error=false, got {record.get("error")!r}')
    if record.get('test.run_id') != 'run-jms-live':
        raise SystemExit(f'Unexpected test.run_id: {record.get("test.run_id")!r}')
    if record.get('test.suite') != 'suite-jms-live':
        raise SystemExit(f'Unexpected test.suite: {record.get("test.suite")!r}')
    payload = record.get('payload') or {}
    if payload.get('orderId') != 'ord-jms-1' or payload.get('status') != 'created':
        raise SystemExit(f'Unexpected payload: {payload!r}')
    headers = record.get('headers') or {}
    if headers.get('JMSCorrelationID') != {'state': 'captured', 'value': 'corr-jms-live-1'}:
        raise SystemExit(f'Unexpected JMSCorrelationID header: {headers.get("JMSCorrelationID")!r}')
    if headers.get('JMSReplyTo') != {'state': 'captured', 'value': 'yanote.jms.integration.queue'}:
        raise SystemExit(f'Unexpected JMSReplyTo header: {headers.get("JMSReplyTo")!r}')
    if headers.get('JMSType') != {'state': 'captured', 'value': 'OrderCreatedType'}:
        raise SystemExit(f'Unexpected JMSType header: {headers.get("JMSType")!r}')
    if headers.get('yanote.message') != {'state': 'captured', 'value': 'OrderCreated'}:
        raise SystemExit(f'Unexpected yanote.message header: {headers.get("yanote.message")!r}')
    if headers.get('yanote.test.run_id') != {'state': 'captured', 'value': 'run-jms-live'}:
        raise SystemExit(f'Unexpected yanote.test.run_id header: {headers.get("yanote.test.run_id")!r}')
    if headers.get('yanote.test.suite') != {'state': 'captured', 'value': 'suite-jms-live'}:
        raise SystemExit(f'Unexpected yanote.test.suite header: {headers.get("yanote.test.suite")!r}')
    if headers.get('tenant') != {'state': 'captured', 'value': 'tenant-a'}:
        raise SystemExit(f'Unexpected tenant header: {headers.get("tenant")!r}')
    if headers.get('authorization') != {'state': 'redacted', 'reason': 'sensitive'}:
        raise SystemExit(f'Unexpected authorization header: {headers.get("authorization")!r}')
print('records=2 actions=send,receive channel=yanote.jms.integration.queue protocol=jms')
PY
)" || fail "Raw JMS JSONL drifted from the expected embedded-Artemis proof contract."

echo "Running async-report against the retained JMS evidence..."
if ! node yanote-js/dist/yanote.cjs async-report \
  --spec "${SPEC_PATH}" \
  --events "${EVENTS_PATH}" \
  --out "${OUT_DIR}" \
  --min-coverage 100 >"${ASYNC_STDOUT_PATH}" 2>"${ASYNC_STDERR_PATH}"; then
  fail "async-report failed on the retained JMS evidence."
fi

if [[ -s "${ASYNC_STDERR_PATH}" ]]; then
  fail "async-report unexpectedly wrote to stderr on the JMS happy path."
fi
if [[ ! -f "${ASYNC_REPORT_PATH}" || ! -f "${ASYNC_REPORT_HTML_PATH}" ]]; then
  fail "async-report did not retain both JSON and HTML artifacts for the JMS proof."
fi
if ! grep -q '^YANOTE_ASYNC_SUMMARY ' "${ASYNC_STDOUT_PATH}"; then
  fail "async-report stdout is missing the final YANOTE_ASYNC_SUMMARY line."
fi
if ! grep -q 'protocols=jms' "${ASYNC_STDOUT_PATH}"; then
  fail "async-report stdout is missing protocols=jms."
fi

REPORT_SUMMARY="$(python3 - "${ASYNC_REPORT_PATH}" <<'PY'
import json
import math
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
report = json.loads(path.read_text(encoding='utf-8'))
summary = report.get('summary', {})
if report.get('status') != 'ok':
    raise SystemExit(f'Expected report status ok, got {report.get("status")!r}')
if report.get('protocols') != ['jms']:
    raise SystemExit(f'Expected protocols ["jms"], got {report.get("protocols")!r}')
if summary.get('totalChannels') != 1 or summary.get('coveredChannels') != 1:
    raise SystemExit(f'Unexpected channel summary: {summary!r}')
if summary.get('totalOperations') != 2 or summary.get('coveredOperations') != 2:
    raise SystemExit(f'Unexpected operation summary: {summary!r}')
if summary.get('totalMessages') != 2 or summary.get('coveredMessages') != 2:
    raise SystemExit(f'Unexpected message summary: {summary!r}')
for key in ('channelCoveragePercent', 'operationCoveragePercent', 'messageCoveragePercent'):
    if not math.isclose(float(summary.get(key)), 100.0, abs_tol=1e-6):
        raise SystemExit(f'Unexpected {key}: {summary.get(key)!r}')
counts = (report.get('diagnostics') or {}).get('counts') or {}
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
    raise SystemExit(f'Unexpected async diagnostics: {counts!r}')
print('channels=1/1 operations=2/2 messages=2/2 protocols=jms report=' + str(path))
PY
)" || fail "JMS async-report artifact drifted from the expected analyzer contract."

echo "Embedded Artemis raw proof passed: ${RAW_SUMMARY}"
echo "Embedded Artemis analyzer proof passed: ${REPORT_SUMMARY}"
