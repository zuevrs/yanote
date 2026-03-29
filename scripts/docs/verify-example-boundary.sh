#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EXAMPLES_README="examples/README.md"
COMPOSE_FILE="examples/docker-compose.yml"
MAINTAINER_DOC="docs/maintainers/proofed-entry-paths.md"

failures=0
markdown_failures=0
compose_failures=0
maintainer_failures=0
size_failures=0

record_failure() {
  local domain="$1"
  local message="$2"

  echo "ERROR[${domain}]: ${message}" >&2
  failures=$((failures + 1))
  case "${domain}" in
    markdown) markdown_failures=$((markdown_failures + 1)) ;;
    compose) compose_failures=$((compose_failures + 1)) ;;
    maintainer) maintainer_failures=$((maintainer_failures + 1)) ;;
    size) size_failures=$((size_failures + 1)) ;;
  esac
}

require_file() {
  local path="$1"
  local domain="$2"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    record_failure "${domain}" "missing required file: ${path}"
  fi
}

require_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"
  local domain="$4"

  if [[ -f "${ROOT_DIR}/${path}" ]] && ! grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    record_failure "${domain}" "${path} is missing ${label}: ${needle}"
  fi
}

reject_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"
  local domain="$4"

  if [[ -f "${ROOT_DIR}/${path}" ]] && grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    record_failure "${domain}" "${path} still exposes ${label}: ${needle}"
  fi
}

require_max_lines() {
  local path="$1"
  local ceiling="$2"
  local domain="$3"

  if [[ -f "${ROOT_DIR}/${path}" ]]; then
    local actual
    actual=$(wc -l < "${ROOT_DIR}/${path}")
    if (( actual > ceiling )); then
      record_failure "${domain}" "${path} exceeds size ceiling: ${actual} lines > ${ceiling}"
    fi
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

require_before() {
  local path="$1"
  local earlier="$2"
  local later="$3"
  local label="$4"
  local domain="$5"
  local earlier_line
  local later_line

  earlier_line="$(first_line_of "$path" "$earlier" || true)"
  later_line="$(first_line_of "$path" "$later" || true)"

  if [[ -z "$earlier_line" ]]; then
    record_failure "$domain" "${path} is missing ${label}: ${earlier}"
    return
  fi

  if [[ -z "$later_line" ]]; then
    record_failure "$domain" "${path} is missing ${label}: ${later}"
    return
  fi

  if (( earlier_line > later_line )); then
    record_failure "$domain" "${path} places ${label} after a secondary surface: ${earlier}"
  fi
}

require_file "${EXAMPLES_README}" markdown
require_file "${COMPOSE_FILE}" compose
require_file "${MAINTAINER_DOC}" maintainer

require_max_lines "${EXAMPLES_README}" 60 size

require_contains "${EXAMPLES_README}" "docker-compose.yml" "compose entry link" markdown
require_contains "${EXAMPLES_README}" "springmvc-service/README.md" "service leaf link" markdown
require_contains "${EXAMPLES_README}" "tests-restassured/README.md" "test leaf link" markdown
require_contains "${EXAMPLES_README}" "../docs/guides/analyzer-coverage.md" "analyzer guide backlink" markdown
require_contains "${EXAMPLES_README}" "../docs/release-and-support.md" "release/support boundary link" markdown
require_contains "${EXAMPLES_README}" '`v1.0.x`' "stable line wording" markdown
require_contains "${EXAMPLES_README}" "yanote-analyzer.zip" "standalone analyzer asset wording" markdown
require_contains "${EXAMPLES_README}" "dist/standalone-analyzer/bin/yanote" "repo-local standalone launcher wording" markdown
require_contains "${EXAMPLES_README}" "events.jsonl" "events wording" markdown
require_contains "${EXAMPLES_README}" "yanote-report.json" "JSON report wording" markdown
require_contains "${EXAMPLES_README}" "yanote-report.html" "HTML report wording" markdown
require_before "${EXAMPLES_README}" "docker-compose.yml" "../docs/release-and-support.md" "demo-before-release ordering" markdown

for banned in \
  '.yanote-ci/' \
  'scripts/ci' \
  'yanote-validation-artifacts' \
  'build-and-test-artifacts' \
  'artifact-manifest.txt' \
  'artifact-source-paths.txt' \
  '../docs/maintainers/' \
  'docs/maintainers' \
  'node yanote-js/dist/yanote.cjs'
do
  reject_contains "${EXAMPLES_README}" "${banned}" "proof-first wording" markdown
done

require_contains "${COMPOSE_FILE}" "YANOTE_ANALYZER_PATH: /workspace/dist/standalone-analyzer/bin/yanote" "standalone launcher path" compose
require_contains "${COMPOSE_FILE}" 'Run ./gradlew distStandaloneAnalyzer before docker compose up.' "launcher rebuild guidance" compose
require_contains "${COMPOSE_FILE}" '"$${YANOTE_ANALYZER_PATH}" report --spec /workspace/examples/openapi/demo-openapi.yaml --events /data/yanote/events.jsonl --out /data/yanote/out --min-coverage 100 --profile local;' "standalone launcher command" compose
reject_contains "${COMPOSE_FILE}" "node yanote-js/dist/yanote.cjs" "raw Node seam" compose

require_contains "${MAINTAINER_DOC}" '.yanote-ci/v1-e2e/' "clone-local rerun bundle breadcrumb" maintainer
require_contains "${MAINTAINER_DOC}" 'dist/standalone-analyzer/bin/yanote' "repo-local standalone launcher breadcrumb" maintainer
require_contains "${MAINTAINER_DOC}" 'build/distributions/yanote-analyzer.zip' "archive-equivalent breadcrumb" maintainer
require_contains "${MAINTAINER_DOC}" '../../examples/README.md' "public example backlink" maintainer

if (( failures > 0 )); then
  echo "S03 example boundary verification failed: markdown=${markdown_failures} compose=${compose_failures} maintainer=${maintainer_failures} size=${size_failures}." >&2
  exit 1
fi

echo "S03 example boundary verification passed: public example docs stay short, Compose keeps the standalone launcher truth, and maintainer rerun breadcrumbs stay secondary."
