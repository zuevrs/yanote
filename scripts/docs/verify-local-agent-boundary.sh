#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MAINTAINERS_README="docs/maintainers/README.md"
LOCAL_AGENT_DOC="docs/maintainers/local-agent-workflow.md"
PUBLIC_SURFACES=(
  "README.md"
  "docs/README.md"
  "SECURITY.md"
  "SUPPORT.md"
  "CONTRIBUTING.md"
)

failures=0

error() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

require_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  grep -Fq -- "$needle" "${ROOT_DIR}/${path}" || error "${path} is missing ${label}: ${needle}"
}

require_not_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    error "${path} leaks ${label}: ${needle}"
  fi
}

check_tracked_agents_boundary() {
  while IFS= read -r path; do
    [[ -n "$path" ]] || continue
    error "Tracked AGENTS.md is not allowed: ${path}"
  done < <(cd "$ROOT_DIR" && git ls-files | rg '(^|/)AGENTS\.md$' || true)
}

check_tracked_gitignore_boundary() {
  while IFS= read -r path; do
    [[ -n "$path" ]] || continue

    if grep -Fq -- "AGENTS.md" "${ROOT_DIR}/${path}"; then
      error "Tracked .gitignore leaks AGENTS.md handling: ${path}"
    fi
  done < <(cd "$ROOT_DIR" && git ls-files | rg '(^|/)\.gitignore$' || true)
}

check_public_surface_boundary() {
  local path

  for path in "${PUBLIC_SURFACES[@]}"; do
    if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
      error "Missing required public trust surface: ${path}"
      continue
    fi

    require_not_contains "$path" "AGENTS.md" "local AGENTS workflow reference"
    require_not_contains "$path" "local-agent-workflow.md" "maintainer local-agent doc link"
    require_not_contains "$path" "git rev-parse --git-path info/exclude" "repo-local exclude bootstrap command"
    require_not_contains "$path" "git check-ignore -v" "ignore verification command"
    require_not_contains "$path" "git status --ignored --short AGENTS.md" "ignored-status proof command"
  done
}

check_maintainer_doc_contract() {
  if [[ ! -f "${ROOT_DIR}/${MAINTAINERS_README}" ]]; then
    error "Missing required maintainer owner map: ${MAINTAINERS_README}"
  else
    require_contains "$MAINTAINERS_README" "local-agent-workflow.md" "maintainer local-agent leaf link"
  fi

  if [[ ! -f "${ROOT_DIR}/${LOCAL_AGENT_DOC}" ]]; then
    error "Missing required maintainer local-agent leaf: ${LOCAL_AGENT_DOC}"
    return
  fi

  require_contains "$LOCAL_AGENT_DOC" "maintainer-only leaf" "maintainer audience label"
  require_contains "$LOCAL_AGENT_DOC" '[`docs/maintainers/README.md`](README.md)' "maintainer owner-map backlink"
  require_contains "$LOCAL_AGENT_DOC" "git rev-parse --git-path info/exclude" "repo-local exclude bootstrap command"
  require_contains "$LOCAL_AGENT_DOC" "/AGENTS.md" "anchored root ignore pattern"
  require_contains "$LOCAL_AGENT_DOC" "git check-ignore -v" "ignore verification command"
  require_contains "$LOCAL_AGENT_DOC" "git status --ignored --short AGENTS.md" "ignored-status proof command"
  require_contains "$LOCAL_AGENT_DOC" "git ls-files" "tracked-file proof command"
  require_contains "$LOCAL_AGENT_DOC" "private prompt content" "no-private-content boundary clause"
  require_contains "$LOCAL_AGENT_DOC" "local environment notes" "local-environment boundary clause"
  require_contains "$LOCAL_AGENT_DOC" "personal workflow notes" "personal-workflow boundary clause"
  require_contains "$LOCAL_AGENT_DOC" "секрет" "secret boundary wording"
}

check_tracked_agents_boundary
check_tracked_gitignore_boundary
check_public_surface_boundary
check_maintainer_doc_contract

if (( failures > 0 )); then
  echo "S07 local-agent boundary verification failed with ${failures} issue(s)." >&2
  exit 1
fi

echo "S07 local-agent boundary verification passed: tracked surfaces stay silent and the maintainer-only workflow contract is wired correctly."
