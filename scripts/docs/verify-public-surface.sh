#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

run_stage() {
  local label="$1"
  local title="$2"
  local command_display="$3"
  shift 3

  echo "==> [${label}] ${title}"
  echo "[${label}] run: ${command_display}"
  if ! "$@"; then
    echo "FAIL [${label}] ${title}" >&2
    return 1
  fi
  echo "<== [${label}] ok"
  echo
}

echo "Final public-surface proof: clean boundary, short docs, runtime/demo path, and release proof in one rerunnable command."
echo "NOTE [PUBLIC]: The verifier delegates to existing proof owners and stops on the first failing stage."
echo

run_stage "PUBLIC-01" "Tracked inventory and public-boundary silence" "bash scripts/docs/verify-public-artifact-boundary.sh all" \
  bash "${ROOT_DIR}/scripts/docs/verify-public-artifact-boundary.sh" all
run_stage "PUBLIC-02" "Landing contract across root/docs/examples" "bash scripts/docs/verify-landing.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-landing.sh"
run_stage "PUBLIC-03" "Short newcomer and analyzer docs contract" "bash scripts/docs/verify-short-docs.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-short-docs.sh"
run_stage "PUBLIC-04" "Recorder doc wiring" "bash scripts/docs/verify-recorder-doc-links.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-recorder-doc-links.sh"
run_stage "PUBLIC-05" "Tagging and analyzer doc wiring" "bash scripts/docs/verify-analysis-doc-links.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-analysis-doc-links.sh"
run_stage "PUBLIC-06" "Recorder runtime proof" "bash scripts/docs/verify-recorder-path.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-recorder-path.sh"
run_stage "PUBLIC-07" "Analyzer runtime and archive proof" "bash scripts/docs/verify-analysis-path.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-analysis-path.sh"
run_stage "PUBLIC-08" "Repo demo and example boundary" "bash scripts/docs/verify-example-boundary.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-example-boundary.sh"
run_stage "PUBLIC-09" "Release/support public boundary" "bash scripts/docs/verify-release-support-boundaries.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-release-support-boundaries.sh"
run_stage "PUBLIC-10" "Maintainer navigation and rerun leaf" "bash scripts/docs/verify-navigation.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-navigation.sh"
run_stage "PUBLIC-11" "Repo demo contract test" "node --test scripts/ci/run-v1-e2e.contract.test.mjs" \
  node --test "${ROOT_DIR}/scripts/ci/run-v1-e2e.contract.test.mjs"
run_stage "PUBLIC-12" "Tag-driven release pipeline proof" "bash scripts/ci/verify-release-pipeline.sh" \
  bash "${ROOT_DIR}/scripts/ci/verify-release-pipeline.sh"

echo "Public-surface proof passed: boundary, docs, recorder/analyzer/demo path, maintainer navigation, and release diagnostics stay aligned."
