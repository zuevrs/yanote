#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
DOCS_README="docs/README.md"
EXAMPLES_README="examples/README.md"
SERVICE_EXAMPLE="examples/springmvc-service/README.md"
TESTS_EXAMPLE="examples/tests-restassured/README.md"

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
  "$DOCS_README" \
  "$EXAMPLES_README" \
  "$SERVICE_EXAMPLE" \
  "$TESTS_EXAMPLE"
do
  require_file "$path"
done

check_local_markdown_links \
  "$ROOT_README" \
  "$DOCS_README" \
  "$EXAMPLES_README" \
  "$SERVICE_EXAMPLE" \
  "$TESTS_EXAMPLE"

require_contains "$ROOT_README" "HTTP Security Conformance" "security CLI surface"
require_contains "$ROOT_README" "security-semantics.stdout" "security sidecar"
require_contains "$ROOT_README" "security-semantics.stderr" "security sidecar"
require_contains "$ROOT_README" "security-semantics-yanote-report.json" "security sidecar"
require_contains "$ROOT_README" "bash scripts/ci/verify-m012-s02-security-semantics.sh" "focused security proof command"
require_contains "$ROOT_README" "fixture-backed proof" "security provenance wording"
require_contains "$ROOT_README" "security: []" "security clear wording"
require_contains "$ROOT_README" "OR между объектами Security Requirement" "security OR wording"
require_contains "$ROOT_README" "AND внутри одного объекта" "security AND wording"
require_contains "$ROOT_README" "httpSecurityConformance" "additive security report surface"
require_contains "$ROOT_README" "coverage.operations/status/parameters/aggregate" "legacy numerator wording"
require_contains "$ROOT_README" 'Broader OpenAPI objects `examples`, `links`, `callbacks`, `webhooks`' "deferred broader-object wording"
require_contains "$ROOT_README" 'raw fixture JSONL не попадает в `.yanote-ci/v1-e2e/`' "fixture redaction wording"

require_contains "$DOCS_README" "HTTP Security Conformance" "security CLI surface"
require_contains "$DOCS_README" "security-semantics.stdout" "security sidecar"
require_contains "$DOCS_README" "security-semantics-yanote-report.json" "security sidecar"
require_contains "$DOCS_README" "bash scripts/ci/verify-m012-s02-security-semantics.sh" "focused security proof command"
require_contains "$DOCS_README" "httpSecurityConformance" "additive security report surface"
require_contains "$DOCS_README" "coverage.operations/status/parameters/aggregate" "legacy numerator wording"
require_contains "$DOCS_README" '`examples`, `links`, `callbacks`, `webhooks`' "deferred broader-object wording"
require_contains "$DOCS_README" "fixture-backed proof" "security provenance wording"

require_contains "$EXAMPLES_README" "HTTP Security Conformance" "security CLI surface"
require_contains "$EXAMPLES_README" "security-semantics.stdout" "security sidecar"
require_contains "$EXAMPLES_README" "security-semantics.stderr" "security sidecar"
require_contains "$EXAMPLES_README" "security-semantics-yanote-report.json" "security sidecar"
require_contains "$EXAMPLES_README" "bash scripts/ci/verify-m012-s02-security-semantics.sh" "focused security proof command"
require_contains "$EXAMPLES_README" "fixture-backed proof" "security provenance wording"
require_contains "$EXAMPLES_README" "security: []" "security clear wording"
require_contains "$EXAMPLES_README" "OR между объектами Security Requirement" "security OR wording"
require_contains "$EXAMPLES_README" "AND внутри одного объекта" "security AND wording"
require_contains "$EXAMPLES_README" "httpSecurityConformance" "additive security report surface"
require_contains "$EXAMPLES_README" "coverage.operations/status/parameters/aggregate" "legacy numerator wording"
require_contains "$EXAMPLES_README" '`examples`, `links`, `callbacks`, `webhooks`' "deferred broader-object wording"
require_contains "$EXAMPLES_README" "raw fixture JSONL" "fixture redaction wording"

require_contains "$SERVICE_EXAMPLE" "../README.md" "examples landing backlink"
require_contains "$TESTS_EXAMPLE" "../README.md" "examples landing backlink"

echo "Landing contract verification passed: root/docs/examples surfaces publish the retained security proof, additive numerators, and deferred broader OpenAPI boundary."