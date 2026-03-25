#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
TAG_GUIDE="docs/guides/test-tagging.md"
RECORDER_GUIDE="docs/guides/recorder-spring-mvc.md"
ANALYZER_GUIDE="docs/guides/analyzer-coverage.md"
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

echo "Doc link verification passed: analyzer guide, security boundary wording, and local markdown links are wired correctly."