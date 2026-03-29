#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
TAG_GUIDE="docs/guides/test-tagging.md"
RECORDER_GUIDE="docs/guides/recorder-spring-mvc.md"
ANALYZER_GUIDE="docs/guides/analyzer-coverage.md"
SERVICE_EXAMPLE="examples/springmvc-service/README.md"
RESTASSURED_EXAMPLE="examples/tests-restassured/README.md"
RELEASE_DOC="docs/release-and-support.md"

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

require_max_lines() {
  local path="$1"
  local max_lines="$2"

  local line_count
  line_count="$(python3 - <<'PY' "${ROOT_DIR}/${path}"
from pathlib import Path
import sys
print(len(Path(sys.argv[1]).read_text(encoding='utf-8').splitlines()))
PY
)"

  if (( line_count > max_lines )); then
    fail "${path} is too long: ${line_count} lines (max ${max_lines})"
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
  "$ROOT_README" \
  "$TAG_GUIDE" \
  "$RECORDER_GUIDE" \
  "$ANALYZER_GUIDE" \
  "$SERVICE_EXAMPLE" \
  "$RESTASSURED_EXAMPLE" \
  "$RELEASE_DOC"
do
  require_file "$path"
done

check_local_markdown_links \
  "$ROOT_README" \
  "$TAG_GUIDE" \
  "$RECORDER_GUIDE" \
  "$ANALYZER_GUIDE" \
  "$SERVICE_EXAMPLE" \
  "$RESTASSURED_EXAMPLE" \
  "$RELEASE_DOC"

require_contains "$ANALYZER_GUIDE" "HTTP Security Conformance" "security CLI section"
require_contains "$ANALYZER_GUIDE" "security-semantics.stdout" "security sidecar"
require_contains "$ANALYZER_GUIDE" "security-semantics.stderr" "security sidecar"
require_contains "$ANALYZER_GUIDE" "security-semantics-yanote-report.json" "security sidecar"
require_contains "$ANALYZER_GUIDE" "artifact-manifest.txt" "security provenance note"
require_contains "$ANALYZER_GUIDE" "artifact-source-paths.txt" "security provenance note"
require_contains "$ANALYZER_GUIDE" "bash scripts/ci/verify-m012-s02-security-semantics.sh" "focused security proof command"
require_contains "$ANALYZER_GUIDE" "fixture-backed proof" "security provenance wording"
require_contains "$ANALYZER_GUIDE" 'raw `http-security-api-key.fixture.jsonl` в `.yanote-ci/v1-e2e/` не копируется' "raw fixture exclusion wording"
require_contains "$ANALYZER_GUIDE" "security: []" "security clear wording"
require_contains "$ANALYZER_GUIDE" '`{}` внутри массива означает optional branch' "security optional wording"
require_contains "$ANALYZER_GUIDE" "действует OR между объектами Security Requirement" "security OR wording"
require_contains "$ANALYZER_GUIDE" "внутри одного объекта действует AND" "security AND wording"
require_contains "$ANALYZER_GUIDE" 'только `apiKey` в `query`, `header` и `cookie`' "supported security subset wording"
require_contains "$ANALYZER_GUIDE" "SEMANTIC_HTTP_MISSING_SECURITY" "missing-security wording"
require_contains "$ANALYZER_GUIDE" "SEMANTIC_HTTP_UNAVAILABLE_SECURITY" "unavailable-security wording"
require_contains "$ANALYZER_GUIDE" "SEMANTIC_HTTP_UNSUPPORTED_SECURITY" "unsupported-security wording"
require_contains "$ANALYZER_GUIDE" "httpSecurityConformance.summary" "security summary field"
require_contains "$ANALYZER_GUIDE" "httpSecurityConformance.perOperation[]" "security per-operation field"
require_contains "$ANALYZER_GUIDE" "httpSecurityConformance.diagnostics.items[]" "security diagnostics field"
require_contains "$ANALYZER_GUIDE" "security_declared_operations" "security summary token"
require_contains "$ANALYZER_GUIDE" "security_observed_operations" "security summary token"
require_contains "$ANALYZER_GUIDE" "security_observed_evaluations" "security summary token"
require_contains "$ANALYZER_GUIDE" "security_truths" "security summary token"
require_contains "$ANALYZER_GUIDE" "coverage.operations/status/parameters/aggregate" "legacy numerator wording"
require_contains "$ANALYZER_GUIDE" 'deferred: `examples`, `links`, `callbacks` и `webhooks`' "deferred broader-object wording"
require_contains "$ANALYZER_GUIDE" "security matrix описывает fixture-backed proof" "live-vs-fixture wording"

require_contains "$ROOT_README" "docs/guides/analyzer-coverage.md" "canonical analyzer guide link"
require_contains "$ROOT_README" "docs/guides/test-tagging.md" "canonical tagging guide link"
require_contains "$RECORDER_GUIDE" "test-tagging.md" "canonical tagging guide link"
require_contains "$TAG_GUIDE" "coverage.perOperation[].suites" "report suite wording"
require_contains "$RESTASSURED_EXAMPLE" "../../docs/guides/test-tagging.md" "canonical tagging guide link"
require_contains "$RELEASE_DOC" "bash scripts/ci/verify-m012-s02-security-semantics.sh" "release/support security proof command"

require_max_lines "$TAG_GUIDE" 140
require_max_lines "$RESTASSURED_EXAMPLE" 70
require_contains "$TAG_GUIDE" 'X-Test-Run-Id' "run-id header"
require_contains "$TAG_GUIDE" 'X-Test-Suite' "suite header"
require_contains "$TAG_GUIDE" 'test.run_id' "event run-id field"
require_contains "$TAG_GUIDE" 'test.suite' "event suite field"
require_contains "$TAG_GUIDE" 'coverage.perOperation[].suites' "report suites field"
require_contains "$TAG_GUIDE" 'YanoteRestAssuredFilter.fromEnv()' "RestAssured convenience path"
require_contains "$TAG_GUIDE" 'YANOTE_RUN_ID' "run-id env surface"
require_contains "$TAG_GUIDE" 'yanote.suite' "shared suite property"
require_contains "$TAG_GUIDE" 'YANOTE_SUITE' "demo suite env bridge"
require_contains "$TAG_GUIDE" 'demo/env bridge' "demo-only boundary wording"
require_contains "$TAG_GUIDE" 'YanoteSuiteNamePlugin' "Cucumber plugin surface"
require_contains "$TAG_GUIDE" './gradlew --no-daemon :yanote-test-tags-restassured:test :yanote-test-tags-cucumber:test' "library verifier command"
require_contains "$TAG_GUIDE" '../../examples/tests-restassured/README.md' "RestAssured example backlink"
require_contains "$TAG_GUIDE" '../../examples/springmvc-service/README.md' "service example backlink"

require_contains "$RESTASSURED_EXAMPLE" '../README.md' "examples landing link"
require_contains "$RESTASSURED_EXAMPLE" '../../docs/guides/test-tagging.md' "canonical tagging guide link"
require_contains "$RESTASSURED_EXAMPLE" '../../docs/guides/recorder-spring-mvc.md' "canonical recorder guide link"
require_contains "$RESTASSURED_EXAMPLE" 'YANOTE_RUN_ID' "demo run-id env"
require_contains "$RESTASSURED_EXAMPLE" 'YANOTE_SUITE' "demo suite env"
require_contains "$RESTASSURED_EXAMPLE" 'System.setProperty("yanote.suite", ...)' "suite bridge wording"
require_contains "$RESTASSURED_EXAMPLE" 'X-Test-Run-Id' "request header wording"
require_contains "$RESTASSURED_EXAMPLE" 'X-Test-Suite' "request header wording"
require_contains "$RESTASSURED_EXAMPLE" 'coverage.perOperation[].suites' "report suites wording"
require_contains "$RESTASSURED_EXAMPLE" '../springmvc-service/README.md' "service example backlink"
require_contains "$RESTASSURED_EXAMPLE" 'demo/env bridge' "demo-only boundary wording"

echo "Doc link verification passed: analyzer guide, tagging contract wording, and example backlinks all match the short shared contract surfaces."