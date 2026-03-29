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

echo "M016 S05 final public-surface proof: clean boundary, short docs, runtime/demo path, and release proof in one rerunnable command."
echo "NOTE [S05]: The verifier delegates to existing proof owners and stops on the first failing stage."
echo

run_stage "S05-01" "Tracked inventory and public-boundary silence" "bash scripts/docs/verify-s03-public-artifact-boundary.sh all" \
  bash "${ROOT_DIR}/scripts/docs/verify-s03-public-artifact-boundary.sh" all
run_stage "S05-02" "Landing contract across root/docs/examples" "bash scripts/docs/verify-s03-landing.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-s03-landing.sh"
run_stage "S05-03" "Short newcomer and analyzer docs contract" "bash scripts/docs/verify-m016-s04-short-docs.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-m016-s04-short-docs.sh"
run_stage "S05-04" "Recorder doc wiring" "bash scripts/docs/verify-s01-doc-links.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-s01-doc-links.sh"
run_stage "S05-05" "Tagging and analyzer doc wiring" "bash scripts/docs/verify-s02-doc-links.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-s02-doc-links.sh"
run_stage "S05-06" "Recorder runtime proof" "bash scripts/docs/verify-s01-recorder-path.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-s01-recorder-path.sh"
run_stage "S05-07" "Analyzer runtime and archive proof" "bash scripts/docs/verify-s02-analysis-path.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-s02-analysis-path.sh"
run_stage "S05-08" "Repo demo and example boundary" "bash scripts/docs/verify-s03-example-boundary.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-s03-example-boundary.sh"
run_stage "S05-09" "Release/support public boundary" "bash scripts/docs/verify-s04-boundaries.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-s04-boundaries.sh"
run_stage "S05-10" "Maintainer navigation and rerun leaf" "bash scripts/docs/verify-s05-navigation.sh" \
  bash "${ROOT_DIR}/scripts/docs/verify-s05-navigation.sh"
run_stage "S05-11" "Repo demo contract test" "node --test scripts/ci/run-v1-e2e.contract.test.mjs" \
  node --test "${ROOT_DIR}/scripts/ci/run-v1-e2e.contract.test.mjs"
run_stage "S05-12" "Tag-driven release pipeline proof" "bash scripts/ci/verify-m016-s02-release-pipeline.sh" \
  bash "${ROOT_DIR}/scripts/ci/verify-m016-s02-release-pipeline.sh"

echo "M016 S05 public-surface proof passed: boundary, docs, recorder/analyzer/demo path, maintainer navigation, and release diagnostics stay aligned."
