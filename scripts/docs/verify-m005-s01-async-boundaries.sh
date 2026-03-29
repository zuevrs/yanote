#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

BOUNDARY_DOC="docs/release-and-support.md"
ROOT_README="README.md"
DOCS_README="docs/README.md"
ASYNC_GUIDE="docs/guides/asyncapi-kafka.md"

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

require_file() {
  local path="$1"
  [[ -f "${ROOT_DIR}/${path}" ]] || fail "Missing required surface: ${path}"
}

require_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  grep -Fq -- "$needle" "${ROOT_DIR}/${path}" || fail "${path} is missing ${label}: ${needle}"
}

reject_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    fail "${path} still contains stale ${label}: ${needle}"
  fi
}

for path in \
  "${BOUNDARY_DOC}" \
  "${ROOT_README}" \
  "${DOCS_README}" \
  "${ASYNC_GUIDE}"
do
  require_file "$path"
done

require_contains "${BOUNDARY_DOC}" 'yanote-analyzer.zip' "official standalone bundle wording"
require_contains "${BOUNDARY_DOC}" './yanote-analyzer/bin/yanote --version' "standalone version truth wording"
require_contains "${BOUNDARY_DOC}" './yanote-analyzer/bin/yanote async-report' "standalone async launcher wording"
require_contains "${BOUNDARY_DOC}" './yanote-analyzer/bin/yanote combined-report' "standalone combined launcher wording"
require_contains "${BOUNDARY_DOC}" './gradlew distStandaloneAnalyzer' "repo-local bundle build wording"
require_contains "${BOUNDARY_DOC}" 'raw `node yanote-js/dist/yanote.cjs` seam остаётся внутренней реализацией bundle' "raw seam internal boundary wording"
require_contains "${BOUNDARY_DOC}" 'RabbitMQ/AMQP — первый конкретный второй broker path' "async broker boundary wording"
require_contains "${BOUNDARY_DOC}" 'separate async report/gate + retained combined-report surface' "separate async boundary wording"
require_contains "${BOUNDARY_DOC}" 'payload-schema drift surfaced on the proven Kafka path' "Kafka payload drift wording"
require_contains "${BOUNDARY_DOC}" 'routing percentages remain routing-first' "routing-first wording"
require_contains "${BOUNDARY_DOC}" 'broker-agnostic promise нет' "broker-agnostic boundary wording"
require_contains "${BOUNDARY_DOC}" 'build-and-test-artifacts/live-kafka-proof/' "Kafka proof bundle wording"
require_contains "${BOUNDARY_DOC}" 'build-and-test-artifacts/live-rabbitmq-proof/' "RabbitMQ proof bundle wording"
require_contains "${BOUNDARY_DOC}" 'build-and-test-artifacts/combined-proof/' "combined proof bundle wording"
require_contains "${BOUNDARY_DOC}" 'binding support' "widened async summary wording"
require_contains "${BOUNDARY_DOC}" 'declared semantics' "widened async summary wording"
require_contains "${BOUNDARY_DOC}" 'runtime semantics' "widened async summary wording"
require_contains "${BOUNDARY_DOC}" 'hosted dashboard' "no-dashboard wording"

require_contains "${ASYNC_GUIDE}" 'yanote-analyzer.zip' "async guide standalone bundle wording"
require_contains "${ASYNC_GUIDE}" './yanote-analyzer/bin/yanote' "async guide launcher path"
require_contains "${ASYNC_GUIDE}" '"${YANOTE}" async-report' "async guide launcher command"
require_contains "${ASYNC_GUIDE}" '"${YANOTE}" combined-report' "async guide combined command"
require_contains "${ASYNC_GUIDE}" 'broker-agnostic promise нет' "async guide boundary wording"
reject_contains "${ASYNC_GUIDE}" 'node yanote-js/dist/yanote.cjs async-report' "async guide raw command"

require_contains "${ROOT_README}" 'yanote-analyzer.zip' "root standalone bundle wording"
require_contains "${ROOT_README}" 'docs/guides/asyncapi-kafka.md' "root async guide link"
reject_contains "${ROOT_README}" 'node yanote-js/dist/yanote.cjs' "root raw analyzer command"

require_contains "${DOCS_README}" 'yanote-analyzer.zip' "docs landing standalone bundle wording"
require_contains "${DOCS_README}" 'guides/asyncapi-kafka.md' "docs landing async guide link"
reject_contains "${DOCS_README}" 'node yanote-js/dist/yanote.cjs' "docs landing raw analyzer command"

echo "M005 S01 async boundary verification passed: async boundary docs agree on the standalone analyzer bundle and launcher contract."