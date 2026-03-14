#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

export YANOTE_EXPECTED_RUN_ID="${YANOTE_EXPECTED_RUN_ID:-m004-s01-run}"
export YANOTE_EXPECTED_SUITE="${YANOTE_EXPECTED_SUITE:-m004-s01-suite}"

exec "${ROOT_DIR}/scripts/ci/verify-m004-s02-metadata-propagation.sh" "$@"
