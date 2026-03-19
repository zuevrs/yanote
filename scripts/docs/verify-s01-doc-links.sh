#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
GUIDE="docs/guides/recorder-spring-mvc.md"
SERVICE_EXAMPLE="examples/springmvc-service/README.md"
TESTS_EXAMPLE="examples/tests-restassured/README.md"
BOUNDARY_DOC="docs/release-and-support.md"

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

for path in \
  "${ROOT_README}" \
  "${GUIDE}" \
  "${SERVICE_EXAMPLE}" \
  "${TESTS_EXAMPLE}" \
  "${BOUNDARY_DOC}"
do
  require_file "$path"
done

require_contains "${ROOT_README}" "docs/guides/recorder-spring-mvc.md" "canonical guide link"
require_contains "${ROOT_README}" "Рекомендуемый путь настройки рекордера" "recommended-path wording"
require_contains "${ROOT_README}" "examples/springmvc-service/README.md" "service example link"
require_contains "${ROOT_README}" "examples/tests-restassured/README.md" "RestAssured example link"
require_contains "${ROOT_README}" "docs/release-and-support.md" "release/support boundary link"
require_contains "${ROOT_README}" "Smoke/offline fallback" "fallback stage wording"
require_contains "${ROOT_README}" "GitHub Releases" "release-assets wording"
require_contains "${ROOT_README}" "mavenLocal()" "fallback boundary wording"

require_contains "${GUIDE}" "../../examples/springmvc-service/README.md" "service example link"
require_contains "${GUIDE}" "../../examples/tests-restassured/README.md" "RestAssured example link"
require_contains "${GUIDE}" "../release-and-support.md" "release/support boundary link"
require_contains "${GUIDE}" "основной и проверенный путь" "canonical-path wording"
require_contains "${GUIDE}" "release assets" "fallback wording"

require_contains "${SERVICE_EXAMPLE}" "../../docs/guides/recorder-spring-mvc.md" "canonical guide link"
require_contains "${SERVICE_EXAMPLE}" "../tests-restassured/README.md" "RestAssured example link"
require_contains "${SERVICE_EXAMPLE}" "../../docs/release-and-support.md" "release/support boundary link"
require_contains "${SERVICE_EXAMPLE}" "smoke/offline" "fallback wording"

require_contains "${TESTS_EXAMPLE}" "../../docs/guides/recorder-spring-mvc.md" "canonical guide link"
require_contains "${TESTS_EXAMPLE}" "../springmvc-service/README.md" "service example link"
require_contains "${TESTS_EXAMPLE}" "../../docs/release-and-support.md" "release/support boundary link"
require_contains "${TESTS_EXAMPLE}" "smoke/offline" "fallback wording"

require_contains "${BOUNDARY_DOC}" "GitHub Releases" "release source wording"
require_contains "${BOUNDARY_DOC}" "release assets" "release-assets wording"
require_contains "${BOUNDARY_DOC}" 'tracked `dist/`' "no-tracked-dist clause"

echo "Doc link verification passed: canonical recorder guide and release-asset fallback are wired correctly."
