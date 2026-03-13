#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

fail() {
  echo "ERROR: $1" >&2
  return 1
}

run_stage() {
  local label="$1"
  local title="$2"
  local command_display
  shift 2

  printf -v command_display '%q ' "$@"

  echo "==> [${label}] ${title}"
  echo "[${label}] run: ${command_display% }"
  if ! "$@"; then
    echo "FAIL [${label}] ${title}" >&2
    return 1
  fi
  echo "<== [${label}] ok"
  echo
}

run_clone_local_agents_checks() {
  local label="$1"
  local exclude_path
  local ignore_output
  local status_output
  local tracked_output

  exclude_path="$(git -C "${ROOT_DIR}" rev-parse --git-path info/exclude)"
  echo "[${label}] git rev-parse --git-path info/exclude => ${exclude_path}"

  ignore_output="$(git -C "${ROOT_DIR}" check-ignore -v AGENTS.md)" || fail "AGENTS.md is not ignored in this clone."
  echo "[${label}] git check-ignore -v AGENTS.md => ${ignore_output}"
  [[ "${ignore_output}" == *"info/exclude:"*$'\t'"AGENTS.md" ]] || fail "git check-ignore -v AGENTS.md did not resolve to repo-local info/exclude."
  [[ "${ignore_output}" == *":/AGENTS.md"*$'\t'"AGENTS.md" ]] || fail "git check-ignore -v AGENTS.md did not report the anchored /AGENTS.md rule."

  status_output="$(git -C "${ROOT_DIR}" status --ignored --short AGENTS.md)"
  echo "[${label}] git status --ignored --short AGENTS.md => ${status_output:-<empty>}"
  [[ "${status_output}" == "!! AGENTS.md" ]] || fail "Expected git status --ignored --short AGENTS.md to report '!! AGENTS.md'."

  tracked_output="$(bash -lc "cd '${ROOT_DIR}' && git ls-files | rg '(^|/)AGENTS\\.md$' || true")"
  if [[ -n "${tracked_output}" ]]; then
    echo "[${label}] git ls-files | rg '(^|/)AGENTS\\.md$' => ${tracked_output}" >&2
    fail "AGENTS.md is tracked, but this proof requires clone-local only handling."
  fi
  echo "[${label}] git ls-files | rg '(^|/)AGENTS\\.md$' || true => clean"
}

echo "S08 final proof: guide-first acceptance path plus clone-local AGENTS.md diagnostics."
echo "NOTE [S08]: Docker Compose remains optional/secondary; this verifier does not require a Docker daemon."
echo

run_stage "S08-01" "Landing contract across root/docs/examples" "${ROOT_DIR}/scripts/docs/verify-s03-landing.sh"
run_stage "S08-02" "Recorder guide wiring" "${ROOT_DIR}/scripts/docs/verify-s01-doc-links.sh"
run_stage "S08-03" "Recorder runtime proof" "${ROOT_DIR}/scripts/docs/verify-s01-recorder-path.sh"
run_stage "S08-04" "Tagging and analyzer guide wiring" "${ROOT_DIR}/scripts/docs/verify-s02-doc-links.sh"
run_stage "S08-05" "Analyzer runtime and gate proof" "${ROOT_DIR}/scripts/docs/verify-s02-analysis-path.sh"
run_stage "S08-06" "Release and support boundaries" "${ROOT_DIR}/scripts/docs/verify-s04-boundaries.sh"
run_stage "S08-07" "Secondary navigation surfaces" "${ROOT_DIR}/scripts/docs/verify-s05-navigation.sh"
run_stage "S08-08" "Trust and intake surfaces" "${ROOT_DIR}/scripts/docs/verify-s06-trust-surfaces.sh"
run_stage "S08-09" "Tracked local-agent boundary" "${ROOT_DIR}/scripts/docs/verify-s07-local-agent.sh"
run_stage "S08-10" "Clone-local AGENTS.md Git diagnostics" run_clone_local_agents_checks "S08-10"

echo "S08 final proof passed: guide-first docs, runtime proofs, repo boundaries, and clone-local AGENTS.md diagnostics are aligned."