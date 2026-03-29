#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROOT_README="README.md"
DOCS_README="docs/README.md"
QUICKSTART="docs/guides/getting-started.md"
EXAMPLES_README="examples/README.md"
SERVICE_EXAMPLE="examples/springmvc-service/README.md"
TESTS_EXAMPLE="examples/tests-restassured/README.md"

failures=0
link_failures=0
navigation_failures=0
backlink_failures=0

record_failure() {
  local domain="$1"
  local message="$2"

  echo "ERROR[${domain}]: ${message}" >&2
  failures=$((failures + 1))
  case "${domain}" in
    link) link_failures=$((link_failures + 1)) ;;
    navigation) navigation_failures=$((navigation_failures + 1)) ;;
    backlink) backlink_failures=$((backlink_failures + 1)) ;;
  esac
}

require_file() {
  local path="$1"
  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    record_failure link "missing required doc: ${path}"
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

for path in \
  "$ROOT_README" \
  "$DOCS_README" \
  "$QUICKSTART" \
  "$EXAMPLES_README" \
  "$SERVICE_EXAMPLE" \
  "$TESTS_EXAMPLE"
do
  require_file "$path"
done

if ! python3 - "${ROOT_DIR}" "$ROOT_README" "$DOCS_README" "$QUICKSTART" "$EXAMPLES_README" "$SERVICE_EXAMPLE" "$TESTS_EXAMPLE" <<'PY'
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
            f"ERROR[navigation]: {rel_path} first local markdown link should be {expected}, found {first!r}"
        )

if errors:
    for item in errors:
        print(item, file=sys.stderr)
    raise SystemExit(1)
PY
then
  navigation_failures=$((navigation_failures + 1))
  failures=$((failures + 1))
fi

require_contains "$ROOT_README" "docs/guides/getting-started.md" "quickstart link" navigation
require_contains "$ROOT_README" "docs/README.md" "docs landing link" navigation
require_contains "$ROOT_README" "docs/release-and-support.md" "release/support boundary link" navigation
require_before "$ROOT_README" "docs/guides/getting-started.md" "docs/README.md" "root newcomer ordering" navigation
require_before "$ROOT_README" "docs/README.md" "docs/release-and-support.md" "root newcomer ordering" navigation
require_contains "$DOCS_README" "guides/getting-started.md" "quickstart link" navigation
require_contains "$DOCS_README" "../README.md" "root README backlink" backlink
require_contains "$DOCS_README" "release-and-support.md" "release/support boundary link" navigation
require_before "$DOCS_README" "guides/getting-started.md" "../examples/README.md" "docs newcomer ordering" navigation
require_before "$DOCS_README" "../examples/README.md" "release-and-support.md" "docs newcomer ordering" navigation
require_contains "$QUICKSTART" "../../README.md" "root README backlink" backlink
require_contains "$QUICKSTART" "../README.md" "docs landing backlink" backlink
require_contains "$QUICKSTART" "../../examples/README.md" "examples landing link" navigation
require_contains "$SERVICE_EXAMPLE" "../README.md" "examples landing backlink" backlink
require_contains "$TESTS_EXAMPLE" "../README.md" "examples landing backlink" backlink

if (( failures > 0 )); then
  echo "S03 landing verification failed: links=${link_failures} navigation=${navigation_failures} backlinks=${backlink_failures}." >&2
  exit 1
fi

echo "S03 landing verification passed: root/docs newcomer links and example backlinks agree."