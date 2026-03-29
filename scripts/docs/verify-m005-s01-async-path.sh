#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
DOCS_README="docs/README.md"
ANALYZER_GUIDE="docs/guides/analyzer-coverage.md"
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
  "${ROOT_README}" \
  "${DOCS_README}" \
  "${ANALYZER_GUIDE}" \
  "${ASYNC_GUIDE}"
do
  require_file "$path"
done

require_contains "${ASYNC_GUIDE}" '# Канонический путь: AsyncAPI через Kafka, RabbitMQ и `combined-report`' "guide title"
require_contains "${ASYNC_GUIDE}" '## 1. Что поддерживается в widened async и combined surface' "required section"
require_contains "${ASYNC_GUIDE}" '## 2. Авторитетные live-proof команды' "required section"
require_contains "${ASYNC_GUIDE}" '## 3. Какие async evidence inputs поддержаны' "required section"
require_contains "${ASYNC_GUIDE}" '## 4. Подготовьте standalone CLI bundle' "required section"
require_contains "${ASYNC_GUIDE}" '## 5. Запустите `async-report`' "required section"
require_contains "${ASYNC_GUIDE}" '## 7. Честная граница widened async surface' "required section"
require_contains "${ASYNC_GUIDE}" 'yanote-analyzer.zip' "standalone bundle wording"
require_contains "${ASYNC_GUIDE}" './gradlew distStandaloneAnalyzer' "repo-local bundle build command"
require_contains "${ASYNC_GUIDE}" 'build/distributions/yanote-analyzer.zip' "standalone archive path"
require_contains "${ASYNC_GUIDE}" './yanote-analyzer/bin/yanote' "standalone launcher path"
require_contains "${ASYNC_GUIDE}" '"${YANOTE}" async-report' "standalone async launcher command"
require_contains "${ASYNC_GUIDE}" '"${YANOTE}" combined-report' "standalone combined launcher command"
require_contains "${ASYNC_GUIDE}" 'yanote-async-report.json' "async artifact wording"
require_contains "${ASYNC_GUIDE}" 'yanote-async-report.html' "async HTML artifact wording"
require_contains "${ASYNC_GUIDE}" 'yanote-combined-report.json' "combined artifact wording"
require_contains "${ASYNC_GUIDE}" 'yanote-combined-report.html' "combined HTML artifact wording"
require_contains "${ASYNC_GUIDE}" 'verify-m004-s03-live-kafka-proof.sh' "Kafka proof link"
require_contains "${ASYNC_GUIDE}" 'verify-m015-s02-live-rabbitmq-proof.sh' "RabbitMQ proof link"
require_contains "${ASYNC_GUIDE}" 'verify-m015-s03-combined-report.sh' "combined proof link"
require_contains "${ASYNC_GUIDE}" 'build-and-test-artifacts/live-kafka-proof/' "Kafka CI proof bundle wording"
require_contains "${ASYNC_GUIDE}" 'build-and-test-artifacts/live-rabbitmq-proof/' "RabbitMQ CI proof bundle wording"
require_contains "${ASYNC_GUIDE}" 'build-and-test-artifacts/combined-proof/' "combined CI proof bundle wording"
require_contains "${ASYNC_GUIDE}" 'binding support' "widened async summary wording"
require_contains "${ASYNC_GUIDE}" 'declared semantics' "widened async summary wording"
require_contains "${ASYNC_GUIDE}" 'runtime semantics' "widened async summary wording"
require_contains "${ASYNC_GUIDE}" 'broker-agnostic promise нет' "boundary clause"
reject_contains "${ASYNC_GUIDE}" 'node yanote-js/dist/yanote.cjs async-report' "raw async command"
reject_contains "${ASYNC_GUIDE}" 'npm -C yanote-js ci' "source-build install command"
reject_contains "${ASYNC_GUIDE}" 'npm -C yanote-js run build' "source-build install command"

require_contains "${ANALYZER_GUIDE}" 'asyncapi-kafka.md' "dedicated async guide pointer"
require_contains "${ANALYZER_GUIDE}" 'не смешивайте этот guide с async semantics' "surface-separation wording"
require_contains "${ANALYZER_GUIDE}" 'yanote-async-report.json' "async artifact pointer"

require_contains "${ROOT_README}" 'docs/guides/asyncapi-kafka.md' "root async guide link"
require_contains "${ROOT_README}" 'yanote-async-report.json' "root async artifact wording"
require_contains "${ROOT_README}" 'build-and-test-artifacts/live-kafka-proof/' "root async CI bundle wording"
require_contains "${ROOT_README}" 'binding support' "root widened async summary wording"
require_contains "${ROOT_README}" 'runtime semantics' "root widened async summary wording"

require_contains "${DOCS_README}" 'guides/asyncapi-kafka.md' "docs landing async guide link"
require_contains "${DOCS_README}" 'yanote-async-report.json' "docs landing async artifact wording"
require_contains "${DOCS_README}" 'build-and-test-artifacts/live-kafka-proof/' "docs landing async CI bundle wording"
require_contains "${DOCS_README}" 'binding support' "docs landing widened async summary wording"
require_contains "${DOCS_README}" 'runtime semantics' "docs landing widened async summary wording"

echo "M005 S01 async path verification passed: async docs expose one standalone launcher contract across main landings and guide surfaces."