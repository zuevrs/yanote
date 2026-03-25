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

require_contains "${ANALYZER_GUIDE}" "HTTP Payload Conformance" "payload conformance section"
require_contains "${ANALYZER_GUIDE}" "HTTP Request Conformance" "request conformance section"
require_contains "${ANALYZER_GUIDE}" "httpRequestConformance.summary" "request summary field"
require_contains "${ANALYZER_GUIDE}" "httpRequestConformance.perOperation[]" "request per-operation field"
require_contains "${ANALYZER_GUIDE}" "declaredSupport" "request support field"
require_contains "${ANALYZER_GUIDE}" "declaredSupportShape" "request support-shape field"
require_contains "${ANALYZER_GUIDE}" "declaredSupportReason" "request support-reason field"
require_contains "${ANALYZER_GUIDE}" "request_observed_operations" "request summary token"
require_contains "${ANALYZER_GUIDE}" "request_observed_parameters" "request summary token"
require_contains "${ANALYZER_GUIDE}" "request_truths" "request summary token"
require_contains "${ANALYZER_GUIDE}" "path=simple" "path subset wording"
require_contains "${ANALYZER_GUIDE}" "query=form" "query subset wording"
require_contains "${ANALYZER_GUIDE}" "header=simple" "header subset wording"
require_contains "${ANALYZER_GUIDE}" "cookie=form" "cookie subset wording"
require_contains "${ANALYZER_GUIDE}" 'query=form` + `explode=true` + scalar `items`' "repeated query-array wording"
require_contains "${ANALYZER_GUIDE}" "SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER" "request fail-closed wording"
require_contains "${ANALYZER_GUIDE}" "request-semantics.events.jsonl" "request sidecar artifact"
require_contains "${ANALYZER_GUIDE}" "request-semantics.stdout" "request sidecar artifact"
require_contains "${ANALYZER_GUIDE}" "request-semantics.stderr" "request sidecar artifact"
require_contains "${ANALYZER_GUIDE}" "request-semantics-yanote-report.json" "request sidecar artifact"
require_contains "${ANALYZER_GUIDE}" "bash scripts/ci/verify-m011-s02-request-semantics.sh" "focused request proof command"
require_contains "${ANALYZER_GUIDE}" "bash scripts/ci/verify-m011-s03-format-media.sh" "focused payload proof command"
require_contains "${ANALYZER_GUIDE}" "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT" "unsupported-format wording"
require_contains "${ANALYZER_GUIDE}" "application/problem+json" "most-specific media wording"
require_contains "${ANALYZER_GUIDE}" '`email` как публичный payload format allowlist' "email-only format wording"
require_contains "${ANALYZER_GUIDE}" "NO_DECLARED_CONTENT" "benign payload boundary wording"
require_contains "${ANALYZER_GUIDE}" "RECORDER_OMITTED" "omitted payload boundary wording"
require_contains "${ANALYZER_GUIDE}" "observation coverage, request conformance и payload conformance — разные поверхности" "surface split wording"

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

echo "Doc link verification passed: analyzer guide, request/payload boundary wording, and local markdown links are wired correctly."
