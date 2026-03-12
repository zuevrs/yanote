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

# Root landing contract.
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
require_after_heading "$ROOT_README" "## Вторичные поверхности" "docs/maintainers/release-signing.md" "maintainer surface"

# docs/ landing contract.
require_contains "$DOCS_README" "# Документация Yanote" "docs landing title"
require_contains "$DOCS_README" "## Канонические гайды" "docs landing section"
require_contains "$DOCS_README" "## Примеры и демо" "docs landing section"
require_contains "$DOCS_README" "## Для мейнтейнера и исторического контекста" "docs landing section"
require_contains "$DOCS_README" "guides/recorder-spring-mvc.md" "canonical recorder guide link"
require_contains "$DOCS_README" "guides/analyzer-coverage.md" "canonical analyzer guide link"
require_contains "$DOCS_README" "guides/test-tagging.md" "canonical tagging guide link"
require_contains "$DOCS_README" "../examples/README.md" "examples landing link"
require_contains "$DOCS_README" "../examples/docker-compose.yml" "compose demo link"
require_after_heading "$DOCS_README" "## Для мейнтейнера и исторического контекста" "maintainers/release-signing.md" "maintainer surface"
require_after_heading "$DOCS_README" "## Для мейнтейнера и исторического контекста" "plans/" "historical plans surface"
require_after_heading "$DOCS_README" "## Для мейнтейнера и исторического контекста" "traceability/v1-requirements-tests.md" "traceability surface"

# examples/ landing contract.
require_contains "$EXAMPLES_README" "# Примеры Yanote" "examples landing title"
require_contains "$EXAMPLES_README" "## Проверенный demo-маршрут" "examples landing section"
require_contains "$EXAMPLES_README" "## Что лежит в директории" "examples landing section"
require_contains "$EXAMPLES_README" "## Когда возвращаться в документацию" "examples landing section"
require_contains "$EXAMPLES_README" "docker-compose.yml" "compose demo link"
require_contains "$EXAMPLES_README" "springmvc-service/README.md" "service example link"
require_contains "$EXAMPLES_README" "tests-restassured/README.md" "RestAssured example link"
require_contains "$EXAMPLES_README" "openapi/demo-openapi.yaml" "OpenAPI asset link"
require_contains "$EXAMPLES_README" "../docs/README.md" "docs landing link"
require_contains "$EXAMPLES_README" "../docs/guides/recorder-spring-mvc.md" "canonical recorder guide link"
require_contains "$EXAMPLES_README" "../docs/guides/analyzer-coverage.md" "canonical analyzer guide link"
require_contains "$EXAMPLES_README" "../docs/guides/test-tagging.md" "canonical tagging guide link"

# Example leaf backlink contract.
require_contains "$SERVICE_EXAMPLE" "../README.md" "examples landing backlink"
require_contains "$TESTS_EXAMPLE" "../README.md" "examples landing backlink"

if (( failures > 0 )); then
  echo "Landing contract verification failed with ${failures} issue(s)." >&2
  exit 1
fi

echo "Landing contract verification passed: root/docs/examples surfaces and example backlinks are wired correctly."
