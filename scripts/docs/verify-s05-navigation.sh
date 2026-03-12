#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

MAINTAINERS_README="docs/maintainers/README.md"
TRACEABILITY_README="docs/traceability/README.md"
PLANS_README="docs/plans/README.md"
DIST_README="dist/README.md"
RELEASE_SUPPORT_DOC="docs/release-and-support.md"
REQUIREMENTS_DOC="docs/requirements.md"
RELEASE_SIGNING_DOC="docs/maintainers/release-signing.md"
TRACEABILITY_MATRIX_DOC="docs/traceability/v1-requirements-tests.md"
FLATDIR_DOC="dist/flatdir-recorder/README.md"
NODE_ANALYZER_DOC="dist/node-analyzer/README.md"

failures=0

error() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

require_file() {
  local path="$1"
  [[ -f "${ROOT_DIR}/${path}" ]] || error "Missing required navigation surface: ${path}"
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

require_before() {
  local path="$1"
  local earlier="$2"
  local later="$3"
  local label="$4"
  local earlier_line
  local later_line

  earlier_line="$(first_line_of "$path" "$earlier" || true)"
  later_line="$(first_line_of "$path" "$later" || true)"

  if [[ -z "$earlier_line" ]]; then
    error "${path} is missing ${label}: ${earlier}"
    return
  fi

  if [[ -z "$later_line" ]]; then
    error "${path} is missing ${label}: ${later}"
    return
  fi

  if (( earlier_line > later_line )); then
    error "${path} places ${label} after a secondary surface: ${earlier}"
  fi
}

for path in \
  "$MAINTAINERS_README" \
  "$TRACEABILITY_README" \
  "$PLANS_README" \
  "$DIST_README"
do
  require_file "$path"
done

require_contains "$MAINTAINERS_README" "# Maintainers / Для мейнтейнера" "maintainer landing title"
require_contains "$MAINTAINERS_README" "maintainer-only surface" "maintainer-only audience label"
require_contains "$MAINTAINERS_README" "../README.md" "owner-map backlink"
require_contains "$MAINTAINERS_README" "release-signing.md" "maintainer leaf link"
require_before "$MAINTAINERS_README" "../README.md" "release-signing.md" "owner-map backlink ordering"

require_contains "$TRACEABILITY_README" "# Traceability / Reference map" "traceability landing title"
require_contains "$TRACEABILITY_README" "reference-only surface" "traceability audience label"
require_contains "$TRACEABILITY_README" "../README.md" "owner-map backlink"
require_contains "$TRACEABILITY_README" "v1-requirements-tests.md" "traceability matrix link"
require_contains "$TRACEABILITY_README" "../requirements.md" "canonical requirements link"
require_before "$TRACEABILITY_README" "../README.md" "v1-requirements-tests.md" "owner-map backlink ordering"

require_contains "$PLANS_README" "# Исторические планы и design notes" "plans landing title"
require_contains "$PLANS_README" "historical-only surface" "plans audience label"
require_contains "$PLANS_README" "../README.md" "owner-map backlink"
require_contains "$PLANS_README" "исторические документы" "historical positioning"
require_before "$PLANS_README" "../README.md" "2026-02-28-yanote.md" "owner-map backlink ordering"

require_contains "$DIST_README" "# Fallback bundles / dist" "dist landing title"
require_contains "$DIST_README" "offline/fallback-only surface" "fallback audience label"
require_contains "$DIST_README" "../docs/README.md" "owner-map backlink"
require_contains "$DIST_README" "../docs/guides/recorder-spring-mvc.md" "canonical recorder guide link"
require_contains "$DIST_README" "../docs/guides/analyzer-coverage.md" "canonical analyzer guide link"
require_contains "$DIST_README" 'не начинайте onboarding с `dist/`' "fallback positioning clause"
require_contains "$DIST_README" "flatdir-recorder/README.md" "recorder fallback bundle link"
require_contains "$DIST_README" "node-analyzer/README.md" "analyzer fallback bundle link"
require_before "$DIST_README" "../docs/README.md" "flatdir-recorder/README.md" "owner-map backlink ordering"
require_before "$DIST_README" "../docs/guides/recorder-spring-mvc.md" "flatdir-recorder/README.md" "canonical guide ordering"
require_before "$DIST_README" "../docs/guides/analyzer-coverage.md" "node-analyzer/README.md" "canonical guide ordering"

require_contains "$RELEASE_SUPPORT_DOC" "public boundary owner surface" "release/support audience label"
require_contains "$RELEASE_SUPPORT_DOC" '[`docs/README.md`](README.md)' "docs owner-map backlink"
require_before "$RELEASE_SUPPORT_DOC" '[`docs/README.md`](README.md)' "## Текущая стабильная линия" "docs owner-map backlink ordering"

require_contains "$REQUIREMENTS_DOC" "public requirements owner surface" "requirements audience label"
require_contains "$REQUIREMENTS_DOC" '[`docs/README.md`](README.md)' "docs owner-map backlink"
require_before "$REQUIREMENTS_DOC" '[`docs/README.md`](README.md)' "## v1 Requirements" "docs owner-map backlink ordering"

require_contains "$RELEASE_SIGNING_DOC" "maintainer-only leaf" "release-signing audience label"
require_contains "$RELEASE_SIGNING_DOC" '[`docs/maintainers/README.md`](README.md)' "maintainer owner-map backlink"
require_before "$RELEASE_SIGNING_DOC" '[`docs/maintainers/README.md`](README.md)' "## Current policy" "maintainer owner-map backlink ordering"

require_contains "$TRACEABILITY_MATRIX_DOC" "reference-only leaf" "traceability leaf audience label"
require_contains "$TRACEABILITY_MATRIX_DOC" '[`docs/traceability/README.md`](README.md)' "traceability owner-map backlink"
require_contains "$TRACEABILITY_MATRIX_DOC" '[`docs/requirements.md`](../requirements.md)' "canonical requirements backlink"
require_before "$TRACEABILITY_MATRIX_DOC" '[`docs/traceability/README.md`](README.md)' "## Requirement Mapping" "traceability owner-map backlink ordering"

require_contains "$FLATDIR_DOC" "offline/fallback leaf" "flatdir fallback audience label"
require_contains "$FLATDIR_DOC" '[`dist/README.md`](../README.md)' "dist owner-map backlink"
require_contains "$FLATDIR_DOC" '[`docs/guides/recorder-spring-mvc.md`](../../docs/guides/recorder-spring-mvc.md)' "canonical recorder backlink"
require_before "$FLATDIR_DOC" '[`dist/README.md`](../README.md)' '[`docs/guides/recorder-spring-mvc.md`](../../docs/guides/recorder-spring-mvc.md)' "fallback recovery ordering"
require_before "$FLATDIR_DOC" '[`dist/README.md`](../README.md)' "### Когда этот fallback всё ещё полезен" "dist owner-map backlink ordering"

require_contains "$NODE_ANALYZER_DOC" "offline/fallback leaf" "node analyzer fallback audience label"
require_contains "$NODE_ANALYZER_DOC" '[`dist/README.md`](../README.md)' "dist owner-map backlink"
require_contains "$NODE_ANALYZER_DOC" '[`docs/guides/analyzer-coverage.md`](../../docs/guides/analyzer-coverage.md)' "canonical analyzer backlink"
require_before "$NODE_ANALYZER_DOC" '[`dist/README.md`](../README.md)' '[`docs/guides/analyzer-coverage.md`](../../docs/guides/analyzer-coverage.md)' "fallback recovery ordering"
require_before "$NODE_ANALYZER_DOC" '[`dist/README.md`](../README.md)' "### 1) Собрать analyzer bundle в этом репо" "dist owner-map backlink ordering"

if (( failures > 0 )); then
  echo "S05 navigation verification failed with ${failures} issue(s)." >&2
  exit 1
fi

echo "S05 navigation verification passed: secondary directory/leaf docs, owner backlinks, and fallback positioning are wired correctly."
