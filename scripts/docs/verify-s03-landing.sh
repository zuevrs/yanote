#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
DOCS_README="docs/README.md"
EXAMPLES_README="examples/README.md"
SERVICE_EXAMPLE="examples/springmvc-service/README.md"
TESTS_EXAMPLE="examples/tests-restassured/README.md"

failures=0

error() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

require_file() {
  local path="$1"
  [[ -f "${ROOT_DIR}/${path}" ]] || error "Missing required doc: ${path}"
}

require_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    error "Missing required doc for ${label}: ${path}"
    return
  fi

  grep -Fq -- "$needle" "${ROOT_DIR}/${path}" || error "${path} is missing ${label}: ${needle}"
}

require_absent() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    error "Missing required doc for ${label}: ${path}"
    return
  fi

  if grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    error "${path} still contains stale ${label}: ${needle}"
  fi
}

first_line_of() {
  local path="$1"
  local needle="$2"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    return 1
  fi

  grep -Fnm1 -- "$needle" "${ROOT_DIR}/${path}" | cut -d: -f1
}

require_after_heading() {
  local path="$1"
  local heading="$2"
  local needle="$3"
  local label="$4"
  local heading_line
  local target_line

  heading_line="$(first_line_of "$path" "$heading" || true)"
  target_line="$(first_line_of "$path" "$needle" || true)"

  if [[ -z "$heading_line" ]]; then
    return
  fi

  if [[ -z "$target_line" ]]; then
    error "${path} is missing ${label}: ${needle}"
    return
  fi

  if (( target_line < heading_line )); then
    error "${path} promotes ${label} before section ${heading}: ${needle}"
  fi
}

for path in \
  "$ROOT_README" \
  "$DOCS_README" \
  "$EXAMPLES_README" \
  "$SERVICE_EXAMPLE" \
  "$TESTS_EXAMPLE"
do
  require_file "$path"
done

require_contains "$ROOT_README" "## Что такое Yanote" "landing section"
require_contains "$ROOT_README" "## Для кого" "landing section"
require_contains "$ROOT_README" "## Проверенный цикл" "landing section"
require_contains "$ROOT_README" "## Куда идти дальше" "landing section"
require_contains "$ROOT_README" "## Вторичные поверхности" "landing section"
require_contains "$ROOT_README" "docs/guides/recorder-spring-mvc.md" "canonical recorder guide link"
require_contains "$ROOT_README" "docs/guides/analyzer-coverage.md" "canonical analyzer guide link"
require_contains "$ROOT_README" "docs/guides/test-tagging.md" "canonical tagging guide link"
require_contains "$ROOT_README" "docs/README.md" "docs landing link"
require_contains "$ROOT_README" "examples/README.md" "examples landing link"
require_contains "$ROOT_README" "events.jsonl" "primary workflow wording"
require_contains "$ROOT_README" "yanote-report.json" "report artifact wording"
require_contains "$ROOT_README" "HTTP Payload Conformance" "payload conformance wording"
require_contains "$ROOT_README" "HTTP Request Conformance" "request conformance wording"
require_contains "$ROOT_README" "bash scripts/ci/run-v1-e2e.sh" "public proof command"
require_contains "$ROOT_README" ".yanote-ci/v1-e2e/request-semantics.events.jsonl" "request sidecar artifact"
require_contains "$ROOT_README" ".yanote-ci/v1-e2e/request-semantics.stdout" "request sidecar artifact"
require_contains "$ROOT_README" ".yanote-ci/v1-e2e/request-semantics.stderr" "request sidecar artifact"
require_contains "$ROOT_README" ".yanote-ci/v1-e2e/request-semantics-yanote-report.json" "request sidecar artifact"
require_contains "$ROOT_README" "semantic-red.stderr" "semantic red proof wording"
require_contains "$ROOT_README" "semantic-red-yanote-report.json" "semantic red report wording"
require_contains "$ROOT_README" "bash scripts/ci/verify-m011-s02-request-semantics.sh" "focused request proof command"
require_contains "$ROOT_README" "bash scripts/ci/verify-m011-s03-format-media.sh" "focused payload proof command"
require_contains "$ROOT_README" "path=simple" "request subset wording"
require_contains "$ROOT_README" "query=form" "request subset wording"
require_contains "$ROOT_README" "header=simple" "request subset wording"
require_contains "$ROOT_README" "cookie=form" "request subset wording"
require_contains "$ROOT_README" "request_observed_operations" "request summary token"
require_contains "$ROOT_README" "request_truths" "request summary token"
require_contains "$ROOT_README" "SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER" "request fail-closed wording"
require_contains "$ROOT_README" '`email`-only format allowlist' "email-only format wording"
require_contains "$ROOT_README" "RECORDER_OMITTED" "root landing recorder omission wording"
require_contains "$ROOT_README" "policy-filtered" "root landing recorder omission provenance wording"
require_contains "$ROOT_README" "runtime-selection sidecar" "root landing async multi-message wording"
require_after_heading "$ROOT_README" "## Вторичные поверхности" "docs/maintainers/release-signing.md" "maintainer surface"

require_contains "$DOCS_README" "# Документация Yanote" "docs landing title"
require_contains "$DOCS_README" "## Канонические гайды" "docs landing section"
require_contains "$DOCS_README" "## Примеры и демо" "docs landing section"
require_contains "$DOCS_README" "## Для мейнтейнера и исторического контекста" "docs landing section"
require_contains "$DOCS_README" "guides/recorder-spring-mvc.md" "canonical recorder guide link"
require_contains "$DOCS_README" "guides/analyzer-coverage.md" "canonical analyzer guide link"
require_contains "$DOCS_README" "guides/test-tagging.md" "canonical tagging guide link"
require_contains "$DOCS_README" "HTTP Payload Conformance" "payload conformance wording"
require_contains "$DOCS_README" "HTTP Request Conformance" "request conformance wording"
require_contains "$DOCS_README" "path=simple" "request subset wording"
require_contains "$DOCS_README" "query=form" "request subset wording"
require_contains "$DOCS_README" "header=simple" "request subset wording"
require_contains "$DOCS_README" "cookie=form" "request subset wording"
require_contains "$DOCS_README" '`email`-only payload format allowlist' "email-only format wording"
require_contains "$DOCS_README" ".yanote-ci/v1-e2e/" "retained proof bundle wording"
require_contains "$DOCS_README" "bash scripts/ci/run-v1-e2e.sh" "public proof command"
require_contains "$DOCS_README" "bash scripts/ci/verify-m011-s02-request-semantics.sh" "focused request proof command"
require_contains "$DOCS_README" "bash scripts/ci/verify-m011-s03-format-media.sh" "focused payload proof command"
require_contains "$DOCS_README" "../examples/README.md" "examples landing link"
require_contains "$DOCS_README" "../examples/docker-compose.yml" "compose demo link"
require_after_heading "$DOCS_README" "## Для мейнтейнера и исторического контекста" "maintainers/release-signing.md" "maintainer surface"
require_after_heading "$DOCS_README" "## Для мейнтейнера и исторического контекста" "plans/" "historical plans surface"
require_after_heading "$DOCS_README" "## Для мейнтейнера и исторического контекста" "traceability/v1-requirements-tests.md" "traceability surface"

require_contains "$EXAMPLES_README" "# Примеры Yanote" "examples landing title"
require_contains "$EXAMPLES_README" "## Проверенный demo-маршрут" "examples landing section"
require_contains "$EXAMPLES_README" "## Что лежит в директории" "examples landing section"
require_contains "$EXAMPLES_README" "## Когда возвращаться в документацию" "examples landing section"
require_contains "$EXAMPLES_README" "docker-compose.yml" "compose demo link"
require_contains "$EXAMPLES_README" "springmvc-service/README.md" "service example link"
require_contains "$EXAMPLES_README" "tests-restassured/README.md" "RestAssured example link"
require_contains "$EXAMPLES_README" "openapi/demo-openapi.yaml" "OpenAPI asset link"
require_contains "$EXAMPLES_README" "openapi/demo-openapi-unsupported-schema.yaml" "semantic red OpenAPI asset link"
require_contains "$EXAMPLES_README" "bash scripts/ci/run-v1-e2e.sh" "public proof command"
require_contains "$EXAMPLES_README" ".yanote-ci/v1-e2e/out/yanote-report.json" "happy-path artifact wording"
require_contains "$EXAMPLES_README" "request-semantics.events.jsonl" "request sidecar artifact"
require_contains "$EXAMPLES_README" "request-semantics.stdout" "request sidecar artifact"
require_contains "$EXAMPLES_README" "request-semantics.stderr" "request sidecar artifact"
require_contains "$EXAMPLES_README" "request-semantics-yanote-report.json" "request sidecar artifact"
require_contains "$EXAMPLES_README" "path=simple" "request subset wording"
require_contains "$EXAMPLES_README" "query=form" "request subset wording"
require_contains "$EXAMPLES_README" "header=simple" "request subset wording"
require_contains "$EXAMPLES_README" "cookie=form" "request subset wording"
require_contains "$EXAMPLES_README" '`email`-only format allowlist' "email-only format wording"
require_contains "$EXAMPLES_README" "most-specific media matching" "media specificity wording"
require_contains "$EXAMPLES_README" "bash scripts/ci/verify-m011-s02-request-semantics.sh" "focused request proof command"
require_contains "$EXAMPLES_README" "bash scripts/ci/verify-m011-s03-format-media.sh" "focused payload proof command"
require_contains "$EXAMPLES_README" "semantic-red.stderr" "semantic red proof wording"
require_contains "$EXAMPLES_README" "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA" "fail-closed payload wording"
require_contains "$EXAMPLES_README" "../docs/README.md" "docs landing link"
require_contains "$EXAMPLES_README" "../docs/guides/recorder-spring-mvc.md" "canonical recorder guide link"
require_contains "$EXAMPLES_README" "../docs/guides/analyzer-coverage.md" "canonical analyzer guide link"
require_contains "$EXAMPLES_README" "../docs/guides/test-tagging.md" "canonical tagging guide link"

require_contains "$SERVICE_EXAMPLE" "../README.md" "examples landing backlink"
require_contains "$TESTS_EXAMPLE" "../README.md" "examples landing backlink"

require_absent "$ROOT_README" "75.00%" "partial-status demo number"
require_absent "$ROOT_README" "93.75%" "partial-status aggregate number"
require_absent "$DOCS_README" "75.00%" "partial-status demo number"
require_absent "$DOCS_README" "93.75%" "partial-status aggregate number"
require_absent "$EXAMPLES_README" "75.00%" "partial-status demo number"
require_absent "$EXAMPLES_README" "93.75%" "partial-status aggregate number"

if (( failures > 0 )); then
  echo "Landing contract verification failed with ${failures} issue(s)." >&2
  exit 1
fi

echo "Landing contract verification passed: root/docs/examples surfaces and retained request/payload proof wording are wired correctly."
