#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODE="${1:-tracked}"

failures=0
tracked_count=0

error() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

note() {
  echo "INFO: $1"
}

require_file() {
  local path="$1"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    error "Missing required file: ${path}"
    return 1
  fi
}

require_gitignore_rule() {
  local rule="$1"

  require_file ".gitignore" || return

  if ! grep -Fqx -- "$rule" "${ROOT_DIR}/.gitignore"; then
    error ".gitignore is missing clone-local boundary rule: ${rule}"
  fi
}

require_not_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  require_file "$path" || return

  if grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    error "${path} still exposes ${label}: ${needle}"
  fi
}

check_mode() {
  case "${MODE}" in
    tracked|all) ;;
    *)
      error "Unsupported verification mode '${MODE}'. Supported modes: tracked, all."
      ;;
  esac
}

check_ignore_contract() {
  require_gitignore_rule ".bg-shell/"
  require_gitignore_rule ".tmp/"
  require_gitignore_rule ".tmp-*"
  require_gitignore_rule ".vite/"
  require_gitignore_rule ".mcp.json"
  require_gitignore_rule ".nvmrc"
  require_gitignore_rule "dist/"
}

check_tracked_inventory() {
  local inventory
  local path

  if ! inventory="$(git -C "${ROOT_DIR}" ls-files 2>&1)"; then
    error "git ls-files failed while collecting tracked public-boundary inventory: ${inventory}"
    return
  fi

  while IFS= read -r path; do
    [[ -n "${path}" ]] || continue

    case "${path}" in
      .bg-shell|.bg-shell/*|.mcp.json|.nvmrc|.tmp|.tmp/*|.tmp-*|.tmp-*/*|.vite|.vite/*|dist|dist/*)
        tracked_count=$((tracked_count + 1))
        error "Tracked clone-local root remains in git inventory: ${path}"
        ;;
    esac
  done <<< "${inventory}"

  note "Tracked public-boundary inventory entries under .bg-shell/.mcp.json/.nvmrc/.tmp/.tmp-*/.vite/dist: ${tracked_count}"
}

check_public_surface_boundary() {
  require_not_contains "README.md" ".tmp/" "clone-local .tmp reference"
  require_not_contains "README.md" ".tmp-" "clone-local .tmp-* reference"
  require_not_contains "README.md" ".vite/" "clone-local .vite reference"
  require_not_contains "README.md" ".bg-shell/" "clone-local .bg-shell reference"
  require_not_contains "README.md" ".yanote-ci/" "clone-local proof bundle reference"
  require_not_contains "README.md" "dist/README.md" "tracked dist owner map"
  require_not_contains "README.md" "dist/flatdir-recorder/README.md" "tracked fallback doc"
  require_not_contains "README.md" "dist/node-analyzer/README.md" "tracked fallback doc"

  require_not_contains "docs/README.md" ".tmp/" "clone-local .tmp reference"
  require_not_contains "docs/README.md" ".tmp-" "clone-local .tmp-* reference"
  require_not_contains "docs/README.md" ".vite/" "clone-local .vite reference"
  require_not_contains "docs/README.md" ".bg-shell/" "clone-local .bg-shell reference"
  require_not_contains "docs/README.md" ".yanote-ci/" "clone-local proof bundle reference"
  require_not_contains "docs/README.md" "../dist/README.md" "tracked dist owner map"

  require_not_contains "docs/release-and-support.md" ".tmp/" "clone-local .tmp reference"
  require_not_contains "docs/release-and-support.md" ".tmp-" "clone-local .tmp-* reference"
  require_not_contains "docs/release-and-support.md" ".vite/" "clone-local .vite reference"
  require_not_contains "docs/release-and-support.md" ".bg-shell/" "clone-local .bg-shell reference"
  require_not_contains "docs/release-and-support.md" ".yanote-ci/" "clone-local proof bundle reference"
  require_not_contains "docs/release-and-support.md" ".nvmrc" "repo/dev-only Node pin reference"

  require_not_contains "docs/guides/asyncapi-kafka.md" ".tmp/" "clone-local .tmp reference"
  require_not_contains "docs/guides/asyncapi-kafka.md" ".tmp-" "clone-local .tmp-* reference"
  require_not_contains "docs/guides/asyncapi-kafka.md" ".vite/" "clone-local .vite reference"
  require_not_contains "docs/guides/asyncapi-kafka.md" ".bg-shell/" "clone-local .bg-shell reference"
  require_not_contains "docs/guides/asyncapi-kafka.md" ".yanote-ci/" "clone-local proof bundle reference"
  require_not_contains "docs/guides/asyncapi-kafka.md" ".nvmrc" "repo/dev-only Node pin reference"

  require_not_contains "SUPPORT.md" ".tmp/" "clone-local .tmp reference"
  require_not_contains "SUPPORT.md" ".tmp-" "clone-local .tmp-* reference"
  require_not_contains "SUPPORT.md" ".vite/" "clone-local .vite reference"
  require_not_contains "SUPPORT.md" ".bg-shell/" "clone-local .bg-shell reference"
  require_not_contains "SUPPORT.md" ".yanote-ci/" "clone-local proof bundle reference"
}

check_mode
if (( failures == 0 )); then
  check_ignore_contract
  check_tracked_inventory

  if [[ "${MODE}" == "all" ]]; then
    check_public_surface_boundary
  fi
fi

if (( failures > 0 )); then
  echo "S03 public artifact boundary verification failed in mode '${MODE}' with ${failures} issue(s)." >&2
  exit 1
fi

if [[ "${MODE}" == "all" ]]; then
  echo "S03 public artifact boundary verification passed in mode '${MODE}': clone-local roots are untracked and the public landing/support surfaces stay silent about private paths."
else
  echo "S03 public artifact boundary verification passed in mode '${MODE}': clone-local ignore rules are present and tracked inventory is clean."
fi
