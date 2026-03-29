#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
DOCS_README="docs/README.md"
QUICKSTART="docs/guides/getting-started.md"
ANALYZER_GUIDE="docs/guides/analyzer-coverage.md"
EXAMPLES_README="examples/README.md"

failures=0
file_failures=0
link_failures=0
size_failures=0
content_failures=0
order_failures=0

record_failure() {
  local domain="$1"
  local message="$2"

  echo "ERROR[${domain}]: ${message}" >&2
  failures=$((failures + 1))
  case "${domain}" in
    file) file_failures=$((file_failures + 1)) ;;
    link) link_failures=$((link_failures + 1)) ;;
    size) size_failures=$((size_failures + 1)) ;;
    content) content_failures=$((content_failures + 1)) ;;
    order) order_failures=$((order_failures + 1)) ;;
  esac
}

require_file() {
  local path="$1"
  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    record_failure file "missing required file: ${path}"
  fi
}

require_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if [[ -f "${ROOT_DIR}/${path}" ]] && ! grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    record_failure content "${path} is missing ${label}: ${needle}"
  fi
}

reject_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if [[ -f "${ROOT_DIR}/${path}" ]] && grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    record_failure content "${path} still foregrounds ${label}: ${needle}"
  fi
}

reject_contains_in_first_lines() {
  local path="$1"
  local needle="$2"
  local label="$3"
  local line_limit="$4"

  if [[ -f "${ROOT_DIR}/${path}" ]] && head -n "$line_limit" "${ROOT_DIR}/${path}" | grep -Fq -- "$needle"; then
    record_failure content "${path} still foregrounds ${label} in the first ${line_limit} lines: ${needle}"
  fi
}

require_max_lines() {
  local path="$1"
  local ceiling="$2"

  if [[ -f "${ROOT_DIR}/${path}" ]]; then
    local actual
    actual=$(wc -l < "${ROOT_DIR}/${path}")
    if (( actual > ceiling )); then
      record_failure size "${path} exceeds size ceiling: ${actual} lines > ${ceiling}"
    fi
  fi
}

for path in "$ROOT_README" "$DOCS_README" "$QUICKSTART" "$ANALYZER_GUIDE" "$EXAMPLES_README"; do
  require_file "$path"
done

if ! python3 - "${ROOT_DIR}" "$ROOT_README" "$DOCS_README" "$QUICKSTART" "$ANALYZER_GUIDE" "$EXAMPLES_README" <<'PY'
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1]).resolve()
paths = [pathlib.Path(arg) for arg in sys.argv[2:]]
pattern = re.compile(r'\[[^\]]+\]\(([^)]+)\)')
errors = []

for rel_path in paths:
    doc = (root / rel_path).resolve()
    if not doc.exists():
        continue
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
            errors.append(f"ERROR[link]: {rel_path} has broken local markdown link: {target}")

if errors:
    for item in errors:
        print(item, file=sys.stderr)
    raise SystemExit(1)
PY
then
  link_failures=$((link_failures + 1))
  failures=$((failures + 1))
fi

if ! python3 - "${ROOT_DIR}" <<'PY'
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1]).resolve()
checks = [
    (pathlib.Path('README.md'), 'docs/guides/getting-started.md'),
    (pathlib.Path('docs/README.md'), 'guides/getting-started.md'),
]
pattern = re.compile(r'\[[^\]]+\]\(([^)]+)\)')
errors = []

for rel_path, expected in checks:
    text = (root / rel_path).read_text(encoding='utf-8')
    links = []
    for target in pattern.findall(text):
        target = target.strip().strip('<>')
        if not target or target.startswith(('http://', 'https://', 'mailto:', '#')):
            continue
        path_part = target.split('#', 1)[0]
        if path_part:
            links.append(path_part)
    first = links[0] if links else None
    if first != expected:
        errors.append(
            f"ERROR[order]: {rel_path} first local markdown link should be {expected}, found {first!r}"
        )

if errors:
    for item in errors:
        print(item, file=sys.stderr)
    raise SystemExit(1)
PY
then
  order_failures=$((order_failures + 1))
  failures=$((failures + 1))
fi

require_max_lines "$ROOT_README" 80
require_max_lines "$DOCS_README" 70
require_max_lines "$QUICKSTART" 140
require_max_lines "$ANALYZER_GUIDE" 170
require_max_lines "$EXAMPLES_README" 60

require_contains "$ROOT_README" "docs/guides/getting-started.md" "quickstart link"
require_contains "$ROOT_README" "docs/README.md" "docs landing link"
require_contains "$ROOT_README" "docs/release-and-support.md" "release/support boundary link"

require_contains "$DOCS_README" "guides/getting-started.md" "quickstart link"
require_contains "$DOCS_README" "../README.md" "root README backlink"
require_contains "$DOCS_README" "release-and-support.md" "release/support boundary link"
require_contains "$DOCS_README" '`v1.0.x`' "stable line wording"
require_contains "$DOCS_README" 'yanote-analyzer.zip' "standalone analyzer asset wording"
reject_contains "$DOCS_README" 'release/proof surface' "proof-first jargon"

require_contains "$QUICKSTART" "../../README.md" "root README backlink"
require_contains "$QUICKSTART" "../README.md" "docs landing backlink"
require_contains "$QUICKSTART" "recorder-spring-mvc.md" "recorder guide link"
require_contains "$QUICKSTART" "test-tagging.md" "tagging guide link"
require_contains "$QUICKSTART" "analyzer-coverage.md" "analyzer guide link"
require_contains "$QUICKSTART" "../../examples/README.md" "repo demo link"
require_contains "$QUICKSTART" 'events.jsonl' "events proof wording"
require_contains "$QUICKSTART" 'test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"' "exact events proof check"
require_contains "$QUICKSTART" 'X-Test-Run-Id' "run-id header wording"
require_contains "$QUICKSTART" 'X-Test-Suite' "suite header wording"
require_contains "$QUICKSTART" 'test.run_id' "event run-id wording"
require_contains "$QUICKSTART" 'test.suite' "event suite wording"
require_contains "$QUICKSTART" 'coverage.perOperation[].suites' "report suite wording"
require_contains "$QUICKSTART" 'YANOTE_SUITE' "demo bridge wording"
require_contains "$QUICKSTART" 'demo/env bridge' "demo bridge boundary wording"
require_contains "$QUICKSTART" 'yanote-analyzer.zip' "standalone analyzer asset wording"
require_contains "$QUICKSTART" 'bin/yanote report' "standalone launcher wording"
require_contains "$QUICKSTART" 'yanote-report.json' "JSON report wording"
require_contains "$QUICKSTART" 'yanote-report.html' "HTML report wording"
require_contains "$QUICKSTART" '../release-and-support.md' "release/support boundary link"

require_contains "$ANALYZER_GUIDE" 'yanote-analyzer.zip' "standalone analyzer asset wording"
require_contains "$ANALYZER_GUIDE" './gradlew distStandaloneAnalyzer' "repo-local build wording"
require_contains "$ANALYZER_GUIDE" 'build/distributions/yanote-analyzer.zip' "standalone archive wording"
require_contains "$ANALYZER_GUIDE" './yanote-analyzer/bin/yanote' "standalone launcher wording"
require_contains "$ANALYZER_GUIDE" '"${YANOTE}" report' "launcher-based report command"
require_contains "$ANALYZER_GUIDE" 'yanote-report.json' "JSON report wording"
require_contains "$ANALYZER_GUIDE" 'yanote-report.html' "HTML report wording"
require_contains "$ANALYZER_GUIDE" 'Summary' "stdout summary wording"
require_contains "$ANALYZER_GUIDE" 'HTTP Payload Conformance' "payload wording"
require_contains "$ANALYZER_GUIDE" 'YANOTE_SUMMARY' "summary token wording"
require_contains "$ANALYZER_GUIDE" '../release-and-support.md' "release/support boundary link"
require_contains "$ANALYZER_GUIDE" '../../examples/README.md' "repo demo backlink"

require_contains "$EXAMPLES_README" 'docker-compose.yml' "compose entry link"
require_contains "$EXAMPLES_README" 'springmvc-service/README.md' "service leaf link"
require_contains "$EXAMPLES_README" 'tests-restassured/README.md' "test leaf link"
require_contains "$EXAMPLES_README" '../docs/guides/analyzer-coverage.md' "analyzer guide backlink"
require_contains "$EXAMPLES_README" '../docs/release-and-support.md' "release/support boundary link"
require_contains "$EXAMPLES_README" 'yanote-analyzer.zip' "standalone analyzer asset wording"
require_contains "$EXAMPLES_README" 'dist/standalone-analyzer/bin/yanote' "repo-local standalone launcher wording"
require_contains "$EXAMPLES_README" 'events.jsonl' "events wording"
require_contains "$EXAMPLES_README" 'yanote-report.json' "JSON report wording"
require_contains "$EXAMPLES_README" 'yanote-report.html' "HTML report wording"

for banned in \
  'scripts/ci' \
  '.yanote-ci/' \
  'yanote-validation-artifacts' \
  'build-and-test-artifacts' \
  'artifact-manifest.txt' \
  'artifact-source-paths.txt' \
  'docs/maintainers' \
  'maintainers/README.md' \
  'traceability/' \
  'plans/' \
  'node yanote-js/dist/yanote.cjs'
do
  reject_contains "$ROOT_README" "$banned" "proof-first wording"
  reject_contains "$DOCS_README" "$banned" "proof-first wording"
  reject_contains "$EXAMPLES_README" "$banned" "proof-first wording"
done

for analyzer_banned in \
  'scripts/ci' \
  '.yanote-ci/' \
  'yanote-validation-artifacts' \
  'build-and-test-artifacts' \
  'artifact-manifest.txt' \
  'artifact-source-paths.txt' \
  'docs/maintainers' \
  'maintainers/README.md' \
  'traceability/' \
  'plans/'
do
  reject_contains_in_first_lines "$ANALYZER_GUIDE" "$analyzer_banned" "proof-first wording" 55
done

reject_contains "$ANALYZER_GUIDE" 'node yanote-js/dist/yanote.cjs' "proof-first wording"

if (( failures > 0 )); then
  echo "Short-doc verification failed: file=${file_failures} link=${link_failures} size=${size_failures} content=${content_failures} order=${order_failures}." >&2
  exit 1
fi

echo "Short-doc verification passed: newcomer, analyzer, and repo-demo docs stay short and product-first."
