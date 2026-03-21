#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
TAG_GUIDE="docs/guides/test-tagging.md"
RECORDER_GUIDE="docs/guides/recorder-spring-mvc.md"
ANALYZER_GUIDE="docs/guides/analyzer-coverage.md"
RESTASSURED_EXAMPLE="examples/tests-restassured/README.md"

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

require_absent() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    fail "${path} still contains stale ${label}: ${needle}"
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
  "${TAG_GUIDE}" \
  "${RECORDER_GUIDE}" \
  "${ANALYZER_GUIDE}" \
  "${RESTASSURED_EXAMPLE}"
do
  require_file "$path"
done

check_local_markdown_links \
  "${ROOT_README}" \
  "${TAG_GUIDE}" \
  "${RECORDER_GUIDE}" \
  "${ANALYZER_GUIDE}" \
  "${RESTASSURED_EXAMPLE}"

require_contains "${ROOT_README}" "docs/guides/test-tagging.md" "canonical tagging guide link"
require_contains "${ROOT_README}" "Канонический путь тестовых метаданных" "tagging section"
require_contains "${ROOT_README}" "coverage.perOperation[].suites" "report-suite wording"

require_contains "${RECORDER_GUIDE}" "test-tagging.md" "canonical tagging guide link"
require_contains "${RECORDER_GUIDE}" "X-Test-Run-Id" "run-id header wording"
require_contains "${RECORDER_GUIDE}" "X-Test-Suite" "suite header wording"
require_contains "${RECORDER_GUIDE}" "test.run_id" "event run-id wording"
require_contains "${RECORDER_GUIDE}" "test.suite" "event suite wording"

require_contains "${ANALYZER_GUIDE}" "test-tagging.md" "canonical tagging guide link"
require_contains "${ANALYZER_GUIDE}" "coverage.perOperation[]" "per-operation wording"
require_contains "${ANALYZER_GUIDE}" "suites" "suite coverage wording"
require_contains "${ANALYZER_GUIDE}" "HTTP Payload Conformance" "payload conformance section"
require_contains "${ANALYZER_GUIDE}" "NO_DECLARED_CONTENT" "benign payload boundary wording"
require_contains "${ANALYZER_GUIDE}" "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA" "fail-closed payload wording"
require_contains "${ANALYZER_GUIDE}" "bash scripts/ci/run-v1-e2e.sh" "public proof command"
require_contains "${ANALYZER_GUIDE}" ".yanote-ci/v1-e2e/semantic-red.stderr" "retained semantic red stderr path"
require_contains "${ANALYZER_GUIDE}" ".yanote-ci/v1-e2e/semantic-red-yanote-report.json" "retained semantic red report path"
require_contains "${ANALYZER_GUIDE}" "observation coverage и payload conformance — разные поверхности" "surface split wording"
require_absent "${ANALYZER_GUIDE}" "75.00%" "partial-status demo number"
require_absent "${ANALYZER_GUIDE}" "93.75%" "partial-status aggregate number"
require_absent "${ANALYZER_GUIDE}" 'объявляет статус `201`, а demo-service фактически отвечает `200`' "obsolete POST /users mismatch wording"

require_contains "${TAG_GUIDE}" "YanoteRestAssuredFilter" "RestAssured filter contract"
require_contains "${TAG_GUIDE}" "YanoteSuiteNamePlugin" "Cucumber plugin contract"
require_contains "${TAG_GUIDE}" "YANOTE_RUN_ID" "run-id env naming"
require_contains "${TAG_GUIDE}" "YANOTE_SUITE" "demo suite env naming"
require_contains "${TAG_GUIDE}" "yanote.suite" "shared suite property naming"
require_contains "${TAG_GUIDE}" "X-Test-Run-Id" "run-id header naming"
require_contains "${TAG_GUIDE}" "X-Test-Suite" "suite header naming"
require_contains "${TAG_GUIDE}" "test.run_id" "event run-id naming"
require_contains "${TAG_GUIDE}" "test.suite" "event suite naming"
require_contains "${TAG_GUIDE}" "coverage.perOperation[].suites" "report suite naming"
require_contains "${TAG_GUIDE}" "demo/env bridge" "demo-bridge wording"
require_contains "${TAG_GUIDE}" 'run id остаётся только в `events.jsonl`; analyzer сейчас не переносит его в `yanote-report.json`.' "run-id/report boundary wording"

require_contains "${RESTASSURED_EXAMPLE}" "../../docs/guides/test-tagging.md" "canonical tagging guide link"
require_contains "${RESTASSURED_EXAMPLE}" "YANOTE_RUN_ID" "run-id env naming"
require_contains "${RESTASSURED_EXAMPLE}" "YANOTE_SUITE" "demo suite env naming"
require_contains "${RESTASSURED_EXAMPLE}" "yanote.suite" "shared suite property naming"
require_contains "${RESTASSURED_EXAMPLE}" "X-Test-Run-Id" "run-id header naming"
require_contains "${RESTASSURED_EXAMPLE}" "X-Test-Suite" "suite header naming"
require_contains "${RESTASSURED_EXAMPLE}" "demo/env bridge" "demo-bridge wording"
require_contains "${RESTASSURED_EXAMPLE}" "--rerun-tasks" "fresh-events guard"

echo "Doc link verification passed: canonical tagging guide, analyzer payload wording, and local markdown links are wired correctly."
