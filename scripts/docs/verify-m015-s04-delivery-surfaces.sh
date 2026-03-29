#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
README_DOC="README.md"
DOCS_README="docs/README.md"
EXAMPLES_README="examples/README.md"
ASYNC_GUIDE="docs/guides/asyncapi-kafka.md"
RELEASE_DOC="docs/release-and-support.md"
REQUIREMENTS_DOC="docs/requirements.md"
SUPPORT_DOC="SUPPORT.md"

failures=0

fail() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

require_file() {
  local path="$1"
  [[ -f "${ROOT_DIR}/${path}" ]] || fail "Missing required file: ${path}"
}

require_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if ! grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    fail "${path} is missing ${label}: ${needle}"
  fi
}

require_not_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    fail "${path} still contains stale ${label}: ${needle}"
  fi
}

require_path_exists() {
  local path="$1"
  [[ -e "${ROOT_DIR}/${path}" ]] || fail "Referenced path does not exist: ${path}"
}

for path in \
  "$README_DOC" \
  "$DOCS_README" \
  "$EXAMPLES_README" \
  "$ASYNC_GUIDE" \
  "$RELEASE_DOC" \
  "$REQUIREMENTS_DOC" \
  "$SUPPORT_DOC" \
  "scripts/ci/verify-m004-s03-live-kafka-proof.sh" \
  "scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh" \
  "scripts/ci/verify-m015-s03-combined-report.sh"
do
  require_file "$path"
done

for path in \
  "docs/guides/asyncapi-kafka.md" \
  "docs/release-and-support.md" \
  "scripts/ci/verify-m004-s03-live-kafka-proof.sh" \
  "scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh" \
  "scripts/ci/verify-m015-s03-combined-report.sh"
do
  require_path_exists "$path"
done

require_contains "$README_DOC" 'yanote-validation-artifacts' 'HTTP validation bundle name'
require_contains "$README_DOC" 'build-and-test-artifacts/live-kafka-proof/' 'Kafka bundle path'
require_contains "$README_DOC" 'build-and-test-artifacts/live-rabbitmq-proof/' 'RabbitMQ bundle path'
require_contains "$README_DOC" 'build-and-test-artifacts/combined-proof/' 'combined bundle path'
require_contains "$README_DOC" 'yanote-combined-report.json' 'combined report artifact name'
require_contains "$README_DOC" 'verify-m015-s02-live-rabbitmq-proof.sh' 'RabbitMQ rerun command'
require_contains "$README_DOC" 'verify-m015-s03-combined-report.sh' 'combined rerun command'
require_contains "$README_DOC" 'docs/maintainers/README.md' 'maintainer owner-map backlink'
require_contains "$README_DOC" 'blended denominator' 'no-blended-denominator wording'
require_contains "$README_DOC" 'broker-agnostic promise' 'no-broker-agnostic wording'
require_not_contains "$README_DOC" '.yanote-ci/' 'README clone-local proof root'
require_not_contains "$README_DOC" '.tmp/' 'README clone-local proof root'
require_not_contains "$README_DOC" 'node yanote-js/dist/yanote.cjs' 'README raw Node seam'
require_not_contains "$README_DOC" 'никакого combined HTTP+async report surface' 'README no-combined claim'

require_contains "$DOCS_README" 'yanote-validation-artifacts' 'docs landing HTTP validation bundle name'
require_contains "$DOCS_README" 'build-and-test-artifacts/live-kafka-proof/' 'docs landing Kafka bundle path'
require_contains "$DOCS_README" 'build-and-test-artifacts/live-rabbitmq-proof/' 'docs landing RabbitMQ bundle path'
require_contains "$DOCS_README" 'build-and-test-artifacts/combined-proof/' 'docs landing combined bundle path'
require_contains "$DOCS_README" 'maintainers/README.md' 'docs landing maintainer owner-map backlink'
require_contains "$DOCS_README" 'protocols=amqp' 'docs landing AMQP proof wording'
require_contains "$DOCS_README" 'broker-agnostic promise' 'docs landing no-broker-agnostic wording'
require_not_contains "$DOCS_README" '.yanote-ci/' 'docs landing clone-local proof root'
require_not_contains "$DOCS_README" '.tmp/' 'docs landing clone-local proof root'

require_contains "$EXAMPLES_README" 'live-rabbitmq-proof/' 'examples RabbitMQ bundle path'
require_contains "$EXAMPLES_README" 'combined-proof/' 'examples combined bundle path'
require_contains "$EXAMPLES_README" 'yanote-combined-report.html' 'examples combined HTML artifact'
require_contains "$EXAMPLES_README" 'child-attributed' 'examples child-attributed wording'
require_not_contains "$EXAMPLES_README" 'Здесь нет ни combined HTTP+async report surface' 'examples no-combined claim'

require_contains "$ASYNC_GUIDE" 'verify-m015-s02-live-rabbitmq-proof.sh' 'async guide RabbitMQ proof command'
require_contains "$ASYNC_GUIDE" 'verify-m015-s03-combined-report.sh' 'async guide combined proof command'
require_contains "$ASYNC_GUIDE" 'yanote-combined-report.json' 'async guide combined JSON artifact'
require_contains "$ASYNC_GUIDE" 'YANOTE_COMBINED_SUMMARY' 'async guide combined machine summary'
require_contains "$ASYNC_GUIDE" 'protocols=amqp' 'async guide AMQP wording'
require_contains "$ASYNC_GUIDE" 'child-attributed' 'async guide child-attributed wording'
require_contains "$ASYNC_GUIDE" 'broker-agnostic promise нет' 'async guide no-broker-agnostic wording'
require_not_contains "$ASYNC_GUIDE" '**Kafka-only**' 'async guide Kafka-only clause'

require_contains "$RELEASE_DOC" 'yanote-validation-artifacts' 'release/support HTTP validation bundle name'
require_contains "$RELEASE_DOC" 'build-and-test-artifacts/live-kafka-proof/' 'release/support Kafka bundle path'
require_contains "$RELEASE_DOC" 'build-and-test-artifacts/live-rabbitmq-proof/' 'release/support RabbitMQ bundle path'
require_contains "$RELEASE_DOC" 'build-and-test-artifacts/combined-proof/' 'release/support combined bundle path'
require_contains "$RELEASE_DOC" 'yanote-combined-report.json' 'release/support combined JSON artifact'
require_contains "$RELEASE_DOC" 'yanote-combined-report.html' 'release/support combined HTML artifact'
require_contains "$RELEASE_DOC" 'maintainers/README.md' 'release/support maintainer owner-map backlink'
require_contains "$RELEASE_DOC" 'hosted dashboard' 'release/support no-dashboard wording'
require_contains "$RELEASE_DOC" 'blended denominator' 'release/support no-blended-denominator wording'
require_contains "$RELEASE_DOC" 'broker-agnostic promise нет' 'release/support no-broker-agnostic wording'
require_not_contains "$RELEASE_DOC" '.yanote-ci/' 'release/support clone-local proof root'
require_not_contains "$RELEASE_DOC" '.tmp/' 'release/support clone-local proof root'
require_not_contains "$RELEASE_DOC" '**Kafka-only**' 'release/support Kafka-only clause'

require_contains "$REQUIREMENTS_DOC" 'AsyncAPI / Kafka / RabbitMQ / Combined — widened current surface' 'requirements widened heading'
require_contains "$REQUIREMENTS_DOC" 'live-rabbitmq-proof/' 'requirements RabbitMQ bundle path'
require_contains "$REQUIREMENTS_DOC" 'combined-proof/' 'requirements combined bundle path'
require_contains "$REQUIREMENTS_DOC" 'yanote-combined-report.json' 'requirements combined artifact'
require_contains "$REQUIREMENTS_DOC" 'broker-agnostic promise нет' 'requirements no-broker-agnostic wording'
require_not_contains "$REQUIREMENTS_DOC" 'Combined HTTP + async report/gate in the current first wave' 'old combined deferred row'
require_not_contains "$REQUIREMENTS_DOC" 'Broker-agnostic or non-Kafka async coverage (RabbitMQ/AMQP/other brokers)' 'old broker deferred row'

require_contains "$SUPPORT_DOC" 'yanote-validation-artifacts' 'support HTTP validation bundle name'
require_contains "$SUPPORT_DOC" 'build-and-test-artifacts/live-kafka-proof/' 'support Kafka bundle path'
require_contains "$SUPPORT_DOC" 'build-and-test-artifacts/live-rabbitmq-proof/' 'support RabbitMQ bundle path'
require_contains "$SUPPORT_DOC" 'build-and-test-artifacts/combined-proof/' 'support combined bundle path'
require_contains "$SUPPORT_DOC" 'artifact-manifest.txt' 'support manifest request'
require_contains "$SUPPORT_DOC" 'artifact-source-paths.txt' 'support source-path note request'
require_contains "$SUPPORT_DOC" 'yanote-combined-report.json' 'support combined JSON request'
require_contains "$SUPPORT_DOC" 'docs/maintainers/README.md' 'support maintainer owner-map backlink'
require_contains "$SUPPORT_DOC" 'raw retained Kafka/RabbitMQ headers' 'support raw-header prohibition'
require_contains "$SUPPORT_DOC" 'surface-specific' 'support surface-specific intake wording'
require_not_contains "$SUPPORT_DOC" '.yanote-ci/' 'support clone-local proof root'
require_not_contains "$SUPPORT_DOC" '.tmp/' 'support clone-local proof root'
require_not_contains "$SUPPORT_DOC" '**Kafka-only**' 'support Kafka-only clause'

python3 - "$ROOT_DIR" \
  "$README_DOC" \
  "$DOCS_README" \
  "$EXAMPLES_README" \
  "$ASYNC_GUIDE" \
  "$RELEASE_DOC" \
  "$REQUIREMENTS_DOC" \
  "$SUPPORT_DOC" <<'PY' || failures=$((failures + 1))
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])
files = [pathlib.Path(item) for item in sys.argv[2:]]
link_pattern = re.compile(r'\[[^\]]+\]\(([^)]+)\)')
errors = []

for relative_file in files:
    path = root / relative_file
    text = path.read_text(encoding='utf-8')
    for raw_target in link_pattern.findall(text):
        target = raw_target.strip()
        if not target or target.startswith('#') or '://' in target or target.startswith('mailto:'):
            continue
        target_path = target.split('#', 1)[0]
        if not target_path:
            continue
        resolved = (path.parent / target_path).resolve()
        try:
            resolved.relative_to(root.resolve())
        except ValueError:
            errors.append(f"{relative_file}: link escapes repository root -> {target}")
            continue
        if not resolved.exists():
            errors.append(f"{relative_file}: broken relative link -> {target}")

if errors:
    for entry in errors:
        print(f"ERROR: {entry}", file=sys.stderr)
    raise SystemExit(1)
PY

if (( failures > 0 )); then
  echo "M015 S04 delivery-surface verification failed with ${failures} issue(s)." >&2
  exit 1
fi

echo "M015 S04 delivery-surface verification passed: public docs, requirements, and support intake align on Kafka + RabbitMQ + combined child proof families without dashboard/blended/broker-agnostic drift."