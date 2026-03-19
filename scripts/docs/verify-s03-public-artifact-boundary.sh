#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODE="${1:-tracked}"

failures=0

error() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

note() {
  echo "INFO: $1"
}

require_not_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    error "Missing required doc for ${label}: ${path}"
    return
  fi

  if grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    error "${path} still exposes ${label}: ${needle}"
  fi
}

tracked_inventory="$(git -C "${ROOT_DIR}" ls-files .bg-shell .gsd dist)"
tracked_count="$(printf '%s' "${tracked_inventory}" | awk 'NF{count++} END{print count+0}')"
note "Tracked public-boundary inventory entries under .bg-shell/.gsd/dist: ${tracked_count}"

if [[ -n "${tracked_inventory}" ]]; then
  printf '%s
' "${tracked_inventory}" >&2
  error "Expected no tracked public-boundary entries under .bg-shell/.gsd/dist."
fi

if ! grep -Fq '.gsd/' "${ROOT_DIR}/.gitignore"; then
  error ".gitignore does not ignore .gsd/."
fi

if ! grep -Fq 'dist/' "${ROOT_DIR}/.gitignore"; then
  error ".gitignore does not ignore dist/."
fi

if [[ "${MODE}" == "all" ]]; then
  require_not_contains "README.md" ".gsd/PROJECT.md" "public .gsd surface"
  require_not_contains "README.md" ".gsd/REQUIREMENTS.md" "public .gsd surface"
  require_not_contains "README.md" ".gsd/DECISIONS.md" "public .gsd surface"
  require_not_contains "README.md" "dist/README.md" "tracked dist owner map"
  require_not_contains "README.md" "dist/flatdir-recorder/README.md" "tracked fallback doc"
  require_not_contains "README.md" "dist/node-analyzer/README.md" "tracked fallback doc"

  require_not_contains "docs/README.md" "../dist/README.md" "tracked dist owner map"
  require_not_contains "examples/README.md" "../dist/README.md" "tracked dist owner map"
  require_not_contains "docs/guides/recorder-spring-mvc.md" "../../dist/flatdir-recorder/README.md" "tracked fallback doc"
  require_not_contains "docs/guides/analyzer-coverage.md" "../../dist/node-analyzer/README.md" "tracked fallback doc"
fi

if (( failures > 0 )); then
  echo "S03 public artifact boundary verification failed with ${failures} issue(s)." >&2
  exit 1
fi

echo "S03 public artifact boundary verification passed in mode '${MODE}': tracked .bg-shell/.gsd/dist residue is gone and public docs no longer point at private boundary files."
