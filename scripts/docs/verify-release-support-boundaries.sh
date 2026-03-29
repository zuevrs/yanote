#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BOUNDARY_DOC="docs/release-and-support.md"
ROOT_README="README.md"
DOCS_README="docs/README.md"
ANALYZER_GUIDE="docs/guides/analyzer-coverage.md"
ASYNC_GUIDE="docs/guides/asyncapi-kafka.md"
EXAMPLES_README="examples/README.md"

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

require_file() {
  local path="$1"
  [[ -f "${ROOT_DIR}/${path}" ]] || fail "Missing required doc: ${path}"
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

reject_contains_in_first_lines() {
  local path="$1"
  local needle="$2"
  local label="$3"
  local line_limit="$4"

  if head -n "$line_limit" "${ROOT_DIR}/${path}" | grep -Fq -- "$needle"; then
    fail "${path} still contains stale ${label} in the first ${line_limit} lines: ${needle}"
  fi
}

require_max_lines() {
  local path="$1"
  local ceiling="$2"
  local actual

  actual=$(wc -l < "${ROOT_DIR}/${path}")
  if (( actual > ceiling )); then
    fail "${path} exceeds size ceiling: ${actual} lines > ${ceiling}"
  fi
}

for path in \
  "$BOUNDARY_DOC" \
  "$ROOT_README" \
  "$DOCS_README" \
  "$ANALYZER_GUIDE" \
  "$ASYNC_GUIDE" \
  "$EXAMPLES_README"
do
  require_file "$path"
done

require_contains "$BOUNDARY_DOC" "## Текущая стабильная линия" "required section"
require_contains "$BOUNDARY_DOC" "## Последний стабильный релиз" "required section"
require_contains "$BOUNDARY_DOC" "## Текущее состояние репозитория относительно релиза" "required section"
require_contains "$BOUNDARY_DOC" "## Стабильные поверхности" "required section"
require_contains "$BOUNDARY_DOC" "## Предположения по совместимости" "required section"
require_contains "$BOUNDARY_DOC" "## Ограничения" "required section"
require_contains "$BOUNDARY_DOC" "## Fallback-границы" "required section"
require_contains "$BOUNDARY_DOC" '`v1.0.x`' "stable line wording"
require_contains "$BOUNDARY_DOC" "https://github.com/zuevrs/yanote/releases" "GitHub Releases pointer"
require_contains "$BOUNDARY_DOC" 'yanote-analyzer.zip' "official standalone bundle wording"
require_contains "$BOUNDARY_DOC" './yanote-analyzer/bin/yanote --version' "standalone version truth wording"
require_contains "$BOUNDARY_DOC" './gradlew distStandaloneAnalyzer' "repo-local bundle build wording"
require_contains "$BOUNDARY_DOC" 'build/distributions/yanote-analyzer.zip' "standalone archive path wording"
require_contains "$BOUNDARY_DOC" 'single-document `http(s)` `--spec`' "remote opt-in wording"
require_contains "$BOUNDARY_DOC" 'httpSecurityConformance' "security report contract surface"
require_contains "$BOUNDARY_DOC" 'security_declared_operations' "security summary token"
require_contains "$BOUNDARY_DOC" 'security_observed_operations' "security summary token"
require_contains "$BOUNDARY_DOC" 'security_observed_evaluations' "security summary token"
require_contains "$BOUNDARY_DOC" 'security_truths' "security summary token"
require_contains "$BOUNDARY_DOC" 'coverage.operations/status/parameters/aggregate' "legacy numerator wording"
require_contains "$BOUNDARY_DOC" './yanote-analyzer/bin/yanote async-report' "standalone async launcher wording"
require_contains "$BOUNDARY_DOC" './yanote-analyzer/bin/yanote combined-report' "standalone combined launcher wording"
require_contains "$BOUNDARY_DOC" 'raw `node yanote-js/dist/yanote.cjs` seam остаётся внутренней реализацией bundle' "raw seam internal boundary wording"
require_contains "$BOUNDARY_DOC" 'tracked `dist/`' "no-tracked-dist clause"
require_contains "$BOUNDARY_DOC" '`examples`, `links`, `callbacks`, `webhooks`' "deferred broader-object wording"

require_contains "$ROOT_README" 'yanote-analyzer.zip' "root standalone bundle wording"
require_contains "$ROOT_README" '`v1.0.x`' "root stable line wording"
require_contains "$ROOT_README" 'bin/yanote' "root standalone launcher wording"
require_contains "$ROOT_README" 'docs/release-and-support.md' "root release/support link"
reject_contains "$ROOT_README" 'node yanote-js/dist/yanote.cjs' "root raw analyzer command"

require_contains "$DOCS_README" 'yanote-analyzer.zip' "docs landing standalone bundle wording"
require_contains "$DOCS_README" '`v1.0.x`' "docs landing stable line wording"
require_contains "$DOCS_README" 'bin/yanote' "docs landing standalone launcher wording"
require_contains "$DOCS_README" 'release-and-support.md' "docs landing release/support link"
reject_contains "$DOCS_README" 'node yanote-js/dist/yanote.cjs' "docs landing raw analyzer command"

require_max_lines "$ANALYZER_GUIDE" 170
require_contains "$ANALYZER_GUIDE" 'yanote-analyzer.zip' "analyzer guide standalone bundle wording"
require_contains "$ANALYZER_GUIDE" './yanote-analyzer/bin/yanote' "analyzer guide launcher path"
require_contains "$ANALYZER_GUIDE" '"${YANOTE}" report' "analyzer guide launcher command"
require_contains "$ANALYZER_GUIDE" '../release-and-support.md' "analyzer guide release/support link"
require_contains "$ANALYZER_GUIDE" '../../examples/README.md' "analyzer guide repo demo backlink"
reject_contains "$ANALYZER_GUIDE" 'node yanote-js/dist/yanote.cjs report' "analyzer guide raw report command"
reject_contains_in_first_lines "$ANALYZER_GUIDE" 'scripts/ci' "analyzer guide proof-first wording" 55
reject_contains_in_first_lines "$ANALYZER_GUIDE" '.yanote-ci/' "analyzer guide proof-first wording" 55
reject_contains_in_first_lines "$ANALYZER_GUIDE" 'build-and-test-artifacts' "analyzer guide proof-first wording" 55
reject_contains_in_first_lines "$ANALYZER_GUIDE" 'yanote-validation-artifacts' "analyzer guide proof-first wording" 55

require_contains "$ASYNC_GUIDE" 'yanote-analyzer.zip' "async guide standalone bundle wording"
require_contains "$ASYNC_GUIDE" './yanote-analyzer/bin/yanote' "async guide launcher path"
require_contains "$ASYNC_GUIDE" '"${YANOTE}" async-report' "async guide launcher command"
require_contains "$ASYNC_GUIDE" '"${YANOTE}" combined-report' "async guide combined launcher command"
reject_contains "$ASYNC_GUIDE" 'node yanote-js/dist/yanote.cjs async-report' "async guide raw command"

require_max_lines "$EXAMPLES_README" 60
require_contains "$EXAMPLES_README" '`v1.0.x`' "examples stable line wording"
require_contains "$EXAMPLES_README" 'docker-compose.yml' "examples compose link"
require_contains "$EXAMPLES_README" 'springmvc-service/README.md' "examples service leaf link"
require_contains "$EXAMPLES_README" 'tests-restassured/README.md' "examples tests leaf link"
require_contains "$EXAMPLES_README" '../docs/release-and-support.md' "examples release/support link"
reject_contains "$EXAMPLES_README" 'scripts/ci' "examples proof-first wording"
reject_contains "$EXAMPLES_README" '.yanote-ci/' "examples proof-first wording"
reject_contains "$EXAMPLES_README" 'build-and-test-artifacts' "examples proof-first wording"
reject_contains "$EXAMPLES_README" 'yanote-validation-artifacts' "examples proof-first wording"
reject_contains "$EXAMPLES_README" 'docs/maintainers' "examples maintainer breadcrumb"
reject_contains "$EXAMPLES_README" 'node yanote-js/dist/yanote.cjs' "examples raw analyzer command"

echo "S04 boundary verification passed: release/support and public docs align on a short standalone analyzer and repo-demo contract."
