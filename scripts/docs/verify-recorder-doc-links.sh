#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
DOCS_README="docs/README.md"
ANALYZER_GUIDE="docs/guides/analyzer-coverage.md"
ASYNC_GUIDE="docs/guides/asyncapi-kafka.md"
BOUNDARY_DOC="docs/release-and-support.md"
RECORDER_GUIDE="docs/guides/recorder-spring-mvc.md"
SERVICE_EXAMPLE="examples/springmvc-service/README.md"

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

reject_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    fail "${path} still contains stale ${label}: ${needle}"
  fi
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
  "${ROOT_README}" \
  "${DOCS_README}" \
  "${ANALYZER_GUIDE}" \
  "${ASYNC_GUIDE}" \
  "${BOUNDARY_DOC}" \
  "${RECORDER_GUIDE}" \
  "${SERVICE_EXAMPLE}"
do
  require_file "$path"
done

check_local_markdown_links \
  "${ROOT_README}" \
  "${DOCS_README}" \
  "${ANALYZER_GUIDE}" \
  "${ASYNC_GUIDE}" \
  "${BOUNDARY_DOC}" \
  "${RECORDER_GUIDE}" \
  "${SERVICE_EXAMPLE}"

require_contains "${ROOT_README}" "docs/guides/analyzer-coverage.md" "HTTP analyzer guide link"
require_contains "${ROOT_README}" "docs/guides/asyncapi-kafka.md" "async guide link"
require_contains "${ROOT_README}" "docs/release-and-support.md" "release/support boundary link"
require_contains "${ROOT_README}" 'yanote-analyzer.zip' "standalone bundle wording"
require_contains "${ROOT_README}" 'bin/yanote' "standalone launcher wording"
reject_contains "${ROOT_README}" 'node yanote-js/dist/yanote.cjs' "raw analyzer command"

require_contains "${DOCS_README}" 'guides/analyzer-coverage.md' "HTTP analyzer guide link"
require_contains "${DOCS_README}" 'guides/asyncapi-kafka.md' "async guide link"
require_contains "${DOCS_README}" 'release-and-support.md' "release/support boundary link"
require_contains "${DOCS_README}" 'yanote-analyzer.zip' "standalone bundle wording"
require_contains "${DOCS_README}" 'bin/yanote' "standalone launcher wording"
reject_contains "${DOCS_README}" 'node yanote-js/dist/yanote.cjs' "raw analyzer command"

require_contains "${ANALYZER_GUIDE}" 'yanote-analyzer.zip' "standalone bundle wording"
require_contains "${ANALYZER_GUIDE}" './gradlew distStandaloneAnalyzer' "repo-local bundle build command"
require_contains "${ANALYZER_GUIDE}" 'build/distributions/yanote-analyzer.zip' "standalone archive path"
require_contains "${ANALYZER_GUIDE}" './yanote-analyzer/bin/yanote' "standalone launcher path"
require_contains "${ANALYZER_GUIDE}" '"${YANOTE}" report' "launcher-based report command"
require_contains "${ANALYZER_GUIDE}" '../release-and-support.md' "release/support boundary link"
reject_contains "${ANALYZER_GUIDE}" 'node yanote-js/dist/yanote.cjs report' "raw analyzer report command"
reject_contains "${ANALYZER_GUIDE}" 'npm -C yanote-js ci' "source-build install command"
reject_contains "${ANALYZER_GUIDE}" 'npm -C yanote-js run build' "source-build install command"

require_contains "${ASYNC_GUIDE}" 'yanote-analyzer.zip' "standalone bundle wording"
require_contains "${ASYNC_GUIDE}" './gradlew distStandaloneAnalyzer' "repo-local bundle build command"
require_contains "${ASYNC_GUIDE}" 'build/distributions/yanote-analyzer.zip' "standalone archive path"
require_contains "${ASYNC_GUIDE}" './yanote-analyzer/bin/yanote' "standalone launcher path"
require_contains "${ASYNC_GUIDE}" '"${YANOTE}" async-report' "launcher-based async command"
require_contains "${ASYNC_GUIDE}" '"${YANOTE}" combined-report' "launcher-based combined command"
reject_contains "${ASYNC_GUIDE}" 'node yanote-js/dist/yanote.cjs async-report' "raw async command"
reject_contains "${ASYNC_GUIDE}" 'npm -C yanote-js ci' "source-build install command"
reject_contains "${ASYNC_GUIDE}" 'npm -C yanote-js run build' "source-build install command"

require_contains "${BOUNDARY_DOC}" 'yanote-analyzer.zip' "official standalone bundle wording"
require_contains "${BOUNDARY_DOC}" './yanote-analyzer/bin/yanote --version' "standalone version truth wording"
require_contains "${BOUNDARY_DOC}" './yanote-analyzer/bin/yanote async-report' "standalone async launcher wording"
require_contains "${BOUNDARY_DOC}" './yanote-analyzer/bin/yanote combined-report' "standalone combined launcher wording"
require_contains "${BOUNDARY_DOC}" 'raw `node yanote-js/dist/yanote.cjs` seam остаётся внутренней реализацией bundle' "internal seam boundary wording"
require_contains "${BOUNDARY_DOC}" 'tracked `dist/`' "no tracked dist clause"

require_max_lines "${RECORDER_GUIDE}" 120
require_max_lines "${SERVICE_EXAMPLE}" 60
require_contains "${RECORDER_GUIDE}" 'io.github.zuevrs:yanote-recorder-spring-mvc' "recorder dependency"
require_contains "${RECORDER_GUIDE}" 'yanote.recorder.enabled=true' "recorder enable property"
require_contains "${RECORDER_GUIDE}" 'yanote.recorder.events-path' "recorder events path property"
require_contains "${RECORDER_GUIDE}" 'YANOTE_RECORDER_EVENTS_PATH' "Spring env binding example"
require_contains "${RECORDER_GUIDE}" 'test -s "$YANOTE_RECORDER_EVENTS_PATH"' "events.jsonl proof command"
require_contains "${RECORDER_GUIDE}" 'head -n 1 "$YANOTE_RECORDER_EVENTS_PATH"' "JSONL proof command"
require_contains "${RECORDER_GUIDE}" 'X-Test-Run-Id' "run-id header mapping"
require_contains "${RECORDER_GUIDE}" 'X-Test-Suite' "suite header mapping"
require_contains "${RECORDER_GUIDE}" 'test.run_id' "recorded run id field"
require_contains "${RECORDER_GUIDE}" 'test.suite' "recorded suite field"
require_contains "${RECORDER_GUIDE}" 'bash scripts/docs/verify-recorder-path.sh' "repo proof command"
require_contains "${RECORDER_GUIDE}" '../../examples/springmvc-service/README.md' "service example backlink"
require_contains "${RECORDER_GUIDE}" 'test-tagging.md' "tagging guide link"

require_contains "${SERVICE_EXAMPLE}" '../../docs/guides/recorder-spring-mvc.md' "canonical recorder guide link"
require_contains "${SERVICE_EXAMPLE}" '../README.md' "examples landing link"
require_contains "${SERVICE_EXAMPLE}" 'yanote.recorder.events-path' "shared recorder property wording"
require_contains "${SERVICE_EXAMPLE}" 'YANOTE_EVENTS_PATH' "example env bridge wording"
require_contains "${SERVICE_EXAMPLE}" 'X-Test-Run-Id' "header handoff wording"
require_contains "${SERVICE_EXAMPLE}" 'X-Test-Suite' "header handoff wording"
require_contains "${SERVICE_EXAMPLE}" '../tests-restassured/README.md' "RestAssured example backlink"

echo "Doc link verification passed: public docs point to one standalone analyzer bundle and recorder path stays short, explicit, and linked to the runnable service companion."