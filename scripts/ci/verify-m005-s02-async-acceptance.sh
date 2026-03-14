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

echo "M005 S02 async acceptance: compose the validated public async boundary with the authoritative live Kafka proof stack."
echo

run_stage "M005-S02-01" "Async landing and guide path contract" "${ROOT_DIR}/scripts/docs/verify-m005-s01-async-path.sh"
run_stage "M005-S02-02" "Async owner/support boundary contract" "${ROOT_DIR}/scripts/docs/verify-m005-s01-async-boundaries.sh"
run_stage "M005-S02-03" "Single-service async metadata propagation proof" "${ROOT_DIR}/scripts/ci/verify-m004-s02-metadata-propagation.sh"
run_stage "M005-S02-04" "Two-service live Kafka proof and async diagnostics" "${ROOT_DIR}/scripts/ci/verify-m004-s03-live-kafka-proof.sh"

echo "M005 S02 async acceptance passed: public async contract, raw-evidence-first Kafka proof, and CI-grade async diagnostics remain aligned."
