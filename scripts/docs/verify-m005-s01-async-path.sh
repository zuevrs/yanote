#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
DOCS_README="docs/README.md"
ANALYZER_GUIDE="docs/guides/analyzer-coverage.md"
ASYNC_GUIDE="docs/guides/asyncapi-kafka.md"
SINGLE_SERVICE_PROOF="scripts/ci/verify-m004-s02-metadata-propagation.sh"
TWO_SERVICE_PROOF="scripts/ci/verify-m004-s03-live-kafka-proof.sh"
MERGE_HELPER="scripts/ci/merge-async-events-jsonl.mjs"

failures=0
landing_failures=0

error() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

landing_error() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
  landing_failures=$((landing_failures + 1))
}

require_file() {
  local path="$1"
  [[ -f "${ROOT_DIR}/${path}" ]] || error "Missing required surface: ${path}"
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

first_line_of() {
  local path="$1"
  local needle="$2"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    return 1
  fi

  grep -Fnm1 -- "$needle" "${ROOT_DIR}/${path}" | cut -d: -f1
}

require_between_sections() {
  local path="$1"
  local start_heading="$2"
  local end_heading="$3"
  local needle="$4"
  local label="$5"
  local start_line
  local end_line
  local target_line

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    landing_error "Missing landing surface for ${label}: ${path}"
    return
  fi

  start_line="$(first_line_of "$path" "$start_heading" || true)"
  end_line="$(first_line_of "$path" "$end_heading" || true)"
  target_line="$(first_line_of "$path" "$needle" || true)"

  if [[ -z "$start_line" ]]; then
    landing_error "${path} is missing section boundary for ${label}: ${start_heading}"
    return
  fi

  if [[ -z "$end_line" ]]; then
    landing_error "${path} is missing section boundary for ${label}: ${end_heading}"
    return
  fi

  if [[ -z "$target_line" ]]; then
    landing_error "${path} is missing T03 async discoverability pointer (${label}): ${needle}"
    return
  fi

  if (( target_line <= start_line || target_line >= end_line )); then
    landing_error "${path} buries ${label} outside the primary user-facing path between '${start_heading}' and '${end_heading}': ${needle}"
  fi
}

check_local_markdown_links() {
  python3 - "${ROOT_DIR}" "$@" <<'PY'
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1]).resolve()
paths = [pathlib.Path(arg) for arg in sys.argv[2:]]
pattern = re.compile(r'\[[^\]]+\]\(([^)]+)\)')
errors = []

for rel_path in paths:
    doc = (root / rel_path).resolve()
    text = doc.read_text(encoding='utf-8')
    for target in pattern.findall(text):
        target = target.strip().strip('<>')
        if not target or target.startswith(('http://', 'https://', 'mailto:', '#')):
            continue
        path_part = target.split('#', 1)[0]
        if not path_part:
            continue
        resolved = (doc.parent / path_part).resolve()
        if not resolved.exists():
            errors.append(f"{rel_path}: broken link target {target}")

if errors:
    for item in errors:
        print(item, file=sys.stderr)
    raise SystemExit(1)
PY
}

for path in \
  "${ROOT_README}" \
  "${DOCS_README}" \
  "${ANALYZER_GUIDE}" \
  "${ASYNC_GUIDE}" \
  "${SINGLE_SERVICE_PROOF}" \
  "${TWO_SERVICE_PROOF}" \
  "${MERGE_HELPER}"
do
  require_file "${path}"
done

if ! check_local_markdown_links \
  "${ROOT_README}" \
  "${DOCS_README}" \
  "${ANALYZER_GUIDE}" \
  "${ASYNC_GUIDE}"
then
  error "Local markdown links are broken in the root/docs landings or async guide surfaces."
fi

require_contains "${ASYNC_GUIDE}" '# Канонический путь: AsyncAPI + Kafka через `async-report`' "guide title"
require_contains "${ASYNC_GUIDE}" "## 1. Что поддерживается в первой волне" "required section"
require_contains "${ASYNC_GUIDE}" "## 2. Авторитетные live-proof команды" "required section"
require_contains "${ASYNC_GUIDE}" "## 3. Какие Kafka evidence inputs поддержаны" "required section"
require_contains "${ASYNC_GUIDE}" '## 5. Запустите `async-report`' "required section"
require_contains "${ASYNC_GUIDE}" "## 7. Честная граница первой волны" "required section"
require_contains "${ASYNC_GUIDE}" "## Связанные поверхности" "required section"
require_contains "${ASYNC_GUIDE}" "node yanote-js/dist/yanote.cjs async-report" "canonical async CLI command"
require_contains "${ASYNC_GUIDE}" "YANOTE_ASYNC_SUMMARY" "async machine summary wording"
require_contains "${ASYNC_GUIDE}" "yanote-async-report.json" "async artifact wording"
require_contains "${ASYNC_GUIDE}" '`raw` или `merged` async JSONL' "supported evidence wording"
require_contains "${ASYNC_GUIDE}" "verify-m004-s02-metadata-propagation.sh" "single-service proof link"
require_contains "${ASYNC_GUIDE}" "verify-m004-s03-live-kafka-proof.sh" "two-service proof link"
require_contains "${ASYNC_GUIDE}" "merge-async-events-jsonl.mjs" "merge helper link"
require_contains "${ASYNC_GUIDE}" "Kafka-only" "first-wave boundary clause"
require_contains "${ASYNC_GUIDE}" "Spring Kafka-first" "first-wave boundary clause"
require_contains "${ASYNC_GUIDE}" "separate async report/gate" "first-wave boundary clause"
require_contains "${ASYNC_GUIDE}" "payload-schema drift surfaced on the proven Kafka path" "proven Kafka payload-drift clause"
require_contains "${ASYNC_GUIDE}" "routing percentages remain routing-first" "routing-first async coverage clause"
require_contains "${ASYNC_GUIDE}" "retained Kafka headers remain unverifiable" "header boundary clause"
require_contains "${ASYNC_GUIDE}" "broker-agnostic promise нет" "first-wave boundary clause"
require_contains "${ASYNC_GUIDE}" ".yanote-ci/live-kafka-proof/" "live proof bundle location"
require_contains "${ASYNC_GUIDE}" "schema-failure-async-report.stderr" "retained schema-failure artifact wording"
require_contains "${ASYNC_GUIDE}" "schema-failure-yanote-async-report.json" "retained schema-failure artifact wording"
require_contains "${ASYNC_GUIDE}" "ASYNC_SEMANTIC_INVALID_PAYLOAD" "typed schema-failure wording"
require_contains "${ASYNC_GUIDE}" "diagnostics.counts.invalid-payload" "schema-failure report wording"
reject_contains "${ASYNC_GUIDE}" "payload-schema enforcement пока нет" "payload-schema underclaim wording"

require_contains "${ANALYZER_GUIDE}" "asyncapi-kafka.md" "dedicated async guide pointer"
require_contains "${ANALYZER_GUIDE}" "не смешивайте этот guide с async semantics" "surface-separation wording"
require_contains "${ANALYZER_GUIDE}" "async-report" "async CLI pointer"
require_contains "${ANALYZER_GUIDE}" "yanote-async-report.json" "async artifact pointer"

require_between_sections "${ROOT_README}" "## Проверенный цикл" "## Вторичные поверхности" "docs/guides/asyncapi-kafka.md" "root README async guide link"
require_between_sections "${ROOT_README}" "## Проверенный цикл" "## Вторичные поверхности" "async-report" "root README separate async command wording"
require_between_sections "${ROOT_README}" "## Проверенный цикл" "## Вторичные поверхности" "yanote-async-report.json" "root README separate async artifact wording"

require_between_sections "${DOCS_README}" "## Канонические гайды" "## Примеры и демо" "guides/asyncapi-kafka.md" "docs landing async guide link"
require_between_sections "${DOCS_README}" "## Канонические гайды" "## Примеры и демо" "async-report" "docs landing separate async command wording"
require_between_sections "${DOCS_README}" "## Канонические гайды" "## Примеры и демо" "yanote-async-report.json" "docs landing separate async artifact wording"

if (( failures > 0 )); then
  if (( failures == landing_failures )); then
    echo "M005 S01 async path verification failed only on landing discoverability/user-path checks." >&2
  else
    echo "M005 S01 async path verification failed with ${failures} issue(s); ${landing_failures} of them are landing discoverability/user-path checks." >&2
  fi
  exit 1
fi

echo "M005 S01 async path verification passed: main landings, guide surface, async evidence wording, and analyzer-guide branch are aligned."
