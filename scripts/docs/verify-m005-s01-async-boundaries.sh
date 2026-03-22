#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

BOUNDARY_DOC="docs/release-and-support.md"
REQUIREMENTS_DOC="docs/requirements.md"
SUPPORT_DOC="SUPPORT.md"

failures=0

error() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

require_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    error "Missing required surface for ${label}: ${path}"
    return
  fi

  grep -Fq -- "$needle" "${ROOT_DIR}/${path}" || error "${path} is missing ${label}: ${needle}"
}

reject_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    error "Missing required surface for ${label}: ${path}"
    return
  fi

  if grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    error "${path} still contains stale ${label}: ${needle}"
  fi
}

common_boundary_clauses=(
  "Kafka-only"
  "Spring Kafka-first"
  "separate async report/gate"
  "payload-schema drift surfaced on the proven Kafka path"
  "routing percentages remain routing-first"
  "retained Kafka headers remain unverifiable"
  "broker-agnostic promise нет"
)

common_artifact_clauses=(
  "raw или merged async JSONL"
  "yanote-async-report.json"
  "runtime-selected-async-report.stderr"
  "runtime-selected-yanote-async-report.json"
  "stderr"
  "schema-failure-async-report.stderr"
  "schema-failure-yanote-async-report.json"
)

for path in \
  "${BOUNDARY_DOC}" \
  "${REQUIREMENTS_DOC}" \
  "${SUPPORT_DOC}"
do
  for needle in "${common_boundary_clauses[@]}"; do
    require_contains "${path}" "${needle}" "first-wave async boundary clause"
  done

  for needle in "${common_artifact_clauses[@]}"; do
    require_contains "${path}" "${needle}" "async intake artifact wording"
  done

  reject_contains "${path}" "payload-schema enforcement пока нет" "payload-schema underclaim wording"
done

require_contains "${BOUNDARY_DOC}" "source-built async path" "release-vs-HEAD async wording"
require_contains "${BOUNDARY_DOC}" 'repository `HEAD`' "release-vs-HEAD async wording"
require_contains "${BOUNDARY_DOC}" '`v1.0.x`' "stable-line async relation"
require_contains "${BOUNDARY_DOC}" "Первая волна async относительно релиза и `HEAD`" "named async release boundary section"

reject_contains "${REQUIREMENTS_DOC}" "AsyncAPI coverage (Kafka, RabbitMQ) | Explicitly deferred by project owner to keep v1 focused on Java HTTP/OpenAPI |" "broad deferred AsyncAPI row"
require_contains "${REQUIREMENTS_DOC}" "### AsyncAPI / Kafka — первая волна" "current async scope section"
require_contains "${REQUIREMENTS_DOC}" "### Async Follow-ons" "deferred async follow-ons section"
require_contains "${REQUIREMENTS_DOC}" "deeper AsyncAPI schema-keyword coverage and retained header validation" "deferred async follow-on"
require_contains "${REQUIREMENTS_DOC}" "combined HTTP + async report/gate" "deferred async follow-on"
require_contains "${REQUIREMENTS_DOC}" "non-Kafka brokers" "deferred async follow-on"
require_contains "${REQUIREMENTS_DOC}" "current public async surface proves payload drift only for the retained Kafka path and still treats headers as unverifiable" "out-of-scope async boundary wording"

require_contains "${SUPPORT_DOC}" "какая команда или proof-script упала" "async repro guidance"
require_contains "${SUPPORT_DOC}" "live-proof path" "async support scope trigger"
require_contains "${SUPPORT_DOC}" ".yanote-ci/live-kafka-proof/" "retained sidecar intake location"
require_contains "${SUPPORT_DOC}" "operation keys, schema ids, счётчиков и redacted reason text" "support redaction guidance"

if (( failures > 0 )); then
  echo "M005 S01 async boundary verification failed with ${failures} issue(s)." >&2
  exit 1
fi

echo "M005 S01 async boundary verification passed: owner/support surfaces agree on first-wave async scope, release-vs-HEAD wording, and intake artifacts."
