#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACT_DIR="${ROOT_DIR}/.yanote-ci/v1-e2e"
COMPOSE_FILE="examples/docker-compose.yml"

cd "${ROOT_DIR}"

prepare_demo_assets() {
  ./gradlew --no-daemon :examples:springmvc-service:bootJar :examples:tests-restassured:testClasses
  npm -C yanote-js ci
  npm -C yanote-js run build
}

collect_artifacts() {
  mkdir -p "${ARTIFACT_DIR}"
  docker compose -f "${COMPOSE_FILE}" cp report:/data/yanote/out "${ARTIFACT_DIR}/out" >/dev/null 2>&1 || true
  docker compose -f "${COMPOSE_FILE}" logs --no-color > "${ARTIFACT_DIR}/compose.log" 2>&1 || true
}

cleanup() {
  collect_artifacts
  docker compose -f "${COMPOSE_FILE}" down --remove-orphans --volumes || true
}
trap cleanup EXIT

# Ensure stale marker files from previous runs cannot short-circuit container sequencing.
docker compose -f "${COMPOSE_FILE}" down --remove-orphans --volumes >/dev/null 2>&1 || true

prepare_demo_assets

docker compose -f "${COMPOSE_FILE}" up --build --abort-on-container-exit --exit-code-from report
