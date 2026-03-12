#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
GUIDE="docs/guides/recorder-spring-mvc.md"
SERVICE_EXAMPLE="examples/springmvc-service/README.md"
TESTS_EXAMPLE="examples/tests-restassured/README.md"
FLATDIR_README="dist/flatdir-recorder/README.md"

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

  grep -Fq "$needle" "${ROOT_DIR}/${path}" || fail "${path} is missing ${label}: ${needle}"
}

for path in \
  "${ROOT_README}" \
  "${GUIDE}" \
  "${SERVICE_EXAMPLE}" \
  "${TESTS_EXAMPLE}" \
  "${FLATDIR_README}"
do
  require_file "$path"
done

require_contains "${ROOT_README}" "docs/guides/recorder-spring-mvc.md" "canonical guide link"
require_contains "${ROOT_README}" "Рекомендуемый путь настройки рекордера" "recommended-path wording"
require_contains "${ROOT_README}" "examples/springmvc-service/README.md" "service example link"
require_contains "${ROOT_README}" "examples/tests-restassured/README.md" "RestAssured example link"
require_contains "${ROOT_README}" "dist/flatdir-recorder/README.md" "flatDir fallback link"
require_contains "${ROOT_README}" "Smoke/offline fallback" "fallback stage wording"
require_contains "${ROOT_README}" "mavenLocal()" "fallback boundary wording"

require_contains "${GUIDE}" "../../examples/springmvc-service/README.md" "service example link"
require_contains "${GUIDE}" "../../examples/tests-restassured/README.md" "RestAssured example link"
require_contains "${GUIDE}" "../../dist/flatdir-recorder/README.md" "flatDir fallback link"
require_contains "${GUIDE}" "основной и проверенный путь" "canonical-path wording"
require_contains "${GUIDE}" "smoke/offline-вариант" "fallback wording"

require_contains "${SERVICE_EXAMPLE}" "../../docs/guides/recorder-spring-mvc.md" "canonical guide link"
require_contains "${SERVICE_EXAMPLE}" "../tests-restassured/README.md" "RestAssured example link"
require_contains "${SERVICE_EXAMPLE}" "../../dist/flatdir-recorder/README.md" "flatDir fallback link"
require_contains "${SERVICE_EXAMPLE}" "smoke/offline прогон" "fallback wording"

require_contains "${TESTS_EXAMPLE}" "../../docs/guides/recorder-spring-mvc.md" "canonical guide link"
require_contains "${TESTS_EXAMPLE}" "../springmvc-service/README.md" "service example link"
require_contains "${TESTS_EXAMPLE}" "../../dist/flatdir-recorder/README.md" "flatDir fallback link"
require_contains "${TESTS_EXAMPLE}" "smoke/offline путь" "fallback wording"

require_contains "${FLATDIR_README}" "../../docs/guides/recorder-spring-mvc.md" "canonical guide link"
require_contains "${FLATDIR_README}" "smoke/offline-only fallback" "fallback-only wording"
require_contains "${FLATDIR_README}" "публикация в Maven-репозиторий" "fallback boundary wording"
require_contains "${FLATDIR_README}" "mavenLocal()" "fallback boundary wording"
require_contains "${FLATDIR_README}" "недоступна" "fallback boundary wording"
require_contains "${FLATDIR_README}" "закрытой сети" "offline-use wording"
require_contains "${FLATDIR_README}" "не должен быть основной историей продукта" "demotion wording"

echo "Doc link verification passed: canonical recorder guide and smoke/offline fallback are wired correctly."
