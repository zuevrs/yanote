#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR=".yanote-ci/v1-e2e"

collect_artifacts() {
  mkdir -p "${ARTIFACT_DIR}"
  docker compose -f examples/docker-compose.yml cp report:/data/yanote/out "${ARTIFACT_DIR}/out" >/dev/null 2>&1 || true
  docker compose -f examples/docker-compose.yml logs --no-color > "${ARTIFACT_DIR}/compose.log" 2>&1 || true
}

cleanup() {
  collect_artifacts
  docker compose -f examples/docker-compose.yml down --remove-orphans --volumes || true
}
trap cleanup EXIT

# Ensure stale marker files from previous runs cannot short-circuit container sequencing.
docker compose -f examples/docker-compose.yml down --remove-orphans --volumes >/dev/null 2>&1 || true

docker compose -f examples/docker-compose.yml up --build --abort-on-container-exit --exit-code-from report
