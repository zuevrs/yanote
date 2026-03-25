#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACT_DIR="${ROOT_DIR}/.yanote-ci/v1-e2e"
COMPOSE_FILE="examples/docker-compose.yml"
SEMANTIC_RED_SPEC="examples/openapi/demo-openapi-unsupported-schema.yaml"
SEMANTIC_RED_STDOUT_PATH="${ARTIFACT_DIR}/semantic-red.stdout"
SEMANTIC_RED_STDERR_PATH="${ARTIFACT_DIR}/semantic-red.stderr"
SEMANTIC_RED_REPORT_PATH="${ARTIFACT_DIR}/semantic-red-yanote-report.json"
SOURCE_PATHS_NOTE_NAME="artifact-source-paths.txt"
MANIFEST_NAME="artifact-manifest.txt"
SOURCE_PATHS_NOTE_PATH="${ARTIFACT_DIR}/${SOURCE_PATHS_NOTE_NAME}"
MANIFEST_PATH="${ARTIFACT_DIR}/${MANIFEST_NAME}"
HOST_GRADLE_HOME="$(mktemp -d "${TMPDIR:-/tmp}/yanote-v1-e2e-gradle.XXXXXX")"
FALLBACK_GRADLE_DIST_HOME="${HOME}/.gradle/wrapper/dists"
FALLBACK_GRADLE_MODULES_CACHE="${HOME}/.gradle/caches/modules-2"
FALLBACK_GRADLE_JARS_CACHE="${HOME}/.gradle/caches/jars-9"
SEMANTIC_RED_OUT_DIR=""

preseed_gradle_wrapper_dists() {
  if [[ -d "${FALLBACK_GRADLE_DIST_HOME}" ]]; then
    mkdir -p "${HOST_GRADLE_HOME}/wrapper/dists"
    cp -R "${FALLBACK_GRADLE_DIST_HOME}/." "${HOST_GRADLE_HOME}/wrapper/dists/"
  fi
}

preseed_gradle_dependency_caches() {
  if [[ -d "${FALLBACK_GRADLE_MODULES_CACHE}" ]]; then
    mkdir -p "${HOST_GRADLE_HOME}/caches"
    ln -s "${FALLBACK_GRADLE_MODULES_CACHE}" "${HOST_GRADLE_HOME}/caches/modules-2"
  fi
  if [[ -d "${FALLBACK_GRADLE_JARS_CACHE}" ]]; then
    mkdir -p "${HOST_GRADLE_HOME}/caches"
    ln -s "${FALLBACK_GRADLE_JARS_CACHE}" "${HOST_GRADLE_HOME}/caches/jars-9"
  fi
}

mkdir -p "${HOST_GRADLE_HOME}"
preseed_gradle_wrapper_dists
preseed_gradle_dependency_caches
export GRADLE_USER_HOME="${HOST_GRADLE_HOME}"
export YANOTE_GRADLE_HOME="${HOST_GRADLE_HOME}"
export YANOTE_GRADLE_MODULES_CACHE="${YANOTE_GRADLE_MODULES_CACHE:-${FALLBACK_GRADLE_MODULES_CACHE}}"
export YANOTE_GRADLE_JARS_CACHE="${YANOTE_GRADLE_JARS_CACHE:-${FALLBACK_GRADLE_JARS_CACHE}}"
export YANOTE_DOCKER_UID="${YANOTE_DOCKER_UID:-$(id -u)}"
export YANOTE_DOCKER_GID="${YANOTE_DOCKER_GID:-$(id -g)}"

cd "${ROOT_DIR}"

join_by_comma() {
  if [[ "$#" -eq 0 || ( "$#" -eq 1 && -z "${1:-}" ) ]]; then
    printf 'none'
    return 0
  fi

  local joined="$1"
  shift
  local item
  for item in "$@"; do
    joined+="${joined:+,}${item}"
  done
  printf '%s' "${joined}"
}

prepare_demo_assets() {
  mkdir -p "${HOST_GRADLE_HOME}"
  ./gradlew --no-daemon -g "${HOST_GRADLE_HOME}" \
    :examples:springmvc-service:bootJar \
    :examples:tests-restassured:testClasses \
    :examples:tests-restassured:resolveTestRuntimeClasspath
  npm -C yanote-js ci
  npm -C yanote-js run build
}

reset_artifact_dir() {
  rm -rf "${ARTIFACT_DIR}"
  mkdir -p "${ARTIFACT_DIR}"
}

collect_artifacts() {
  mkdir -p "${ARTIFACT_DIR}"
  rm -rf "${ARTIFACT_DIR}/out" "${ARTIFACT_DIR}/events.jsonl" "${ARTIFACT_DIR}/compose.log"
  docker compose -f "${COMPOSE_FILE}" cp report:/data/yanote/out "${ARTIFACT_DIR}/out" >/dev/null 2>&1 || true
  docker compose -f "${COMPOSE_FILE}" cp report:/data/yanote/events.jsonl "${ARTIFACT_DIR}/events.jsonl" >/dev/null 2>&1 || true
  docker compose -f "${COMPOSE_FILE}" logs --no-color > "${ARTIFACT_DIR}/compose.log" 2>&1 || true
}

run_semantic_red_pass() {
  local status

  if [[ ! -f "${ARTIFACT_DIR}/events.jsonl" ]]; then
    echo "ERROR: Missing live events artifact at ${ARTIFACT_DIR}/events.jsonl after compose run." >&2
    exit 1
  fi

  rm -f "${SEMANTIC_RED_STDOUT_PATH}" "${SEMANTIC_RED_STDERR_PATH}" "${SEMANTIC_RED_REPORT_PATH}"
  SEMANTIC_RED_OUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-v1-e2e-red.XXXXXX")"

  set +e
  node yanote-js/dist/yanote.cjs report \
    --spec "${SEMANTIC_RED_SPEC}" \
    --events "${ARTIFACT_DIR}/events.jsonl" \
    --out "${SEMANTIC_RED_OUT_DIR}" \
    --min-coverage 100 >"${SEMANTIC_RED_STDOUT_PATH}" 2>"${SEMANTIC_RED_STDERR_PATH}"
  status=$?
  set -e

  if [[ "${status}" -ne 5 ]]; then
    echo "ERROR: Expected semantic red analyzer exit 5, got ${status}." >&2
    exit 1
  fi

  if ! grep -q 'YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA' "${SEMANTIC_RED_STDERR_PATH}"; then
    echo "ERROR: semantic-red stderr is missing SEMANTIC_HTTP_UNSUPPORTED_SCHEMA." >&2
    exit 1
  fi

  if [[ ! -f "${SEMANTIC_RED_OUT_DIR}/yanote-report.json" ]]; then
    echo "ERROR: semantic-red report did not produce yanote-report.json." >&2
    exit 1
  fi

  cp "${SEMANTIC_RED_OUT_DIR}/yanote-report.json" "${SEMANTIC_RED_REPORT_PATH}"
}

write_bundle_metadata() {
  local exported_artifacts=()
  local missing_artifacts=()
  local artifact

  : > "${SOURCE_PATHS_NOTE_PATH}"

  if [[ -f "${ARTIFACT_DIR}/events.jsonl" ]]; then
    exported_artifacts+=("events.jsonl")
    printf 'events.jsonl=%s\n' 'report:/data/yanote/events.jsonl' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("events.jsonl")
    printf 'events.jsonl=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${ARTIFACT_DIR}/out/yanote-report.json" ]]; then
    exported_artifacts+=("out/yanote-report.json")
    printf 'out/yanote-report.json=%s\n' 'report:/data/yanote/out/yanote-report.json' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("out/yanote-report.json")
    printf 'out/yanote-report.json=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${ARTIFACT_DIR}/compose.log" ]]; then
    exported_artifacts+=("compose.log")
    printf 'compose.log=%s\n' 'docker compose -f examples/docker-compose.yml logs --no-color' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("compose.log")
    printf 'compose.log=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${SEMANTIC_RED_STDOUT_PATH}" ]]; then
    exported_artifacts+=("semantic-red.stdout")
    printf 'semantic-red.stdout=%s\n' 'host:node yanote-js/dist/yanote.cjs report --spec examples/openapi/demo-openapi-unsupported-schema.yaml --events .yanote-ci/v1-e2e/events.jsonl --out <temp> --min-coverage 100' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("semantic-red.stdout")
    printf 'semantic-red.stdout=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${SEMANTIC_RED_STDERR_PATH}" ]]; then
    exported_artifacts+=("semantic-red.stderr")
    printf 'semantic-red.stderr=%s\n' 'host:node yanote-js/dist/yanote.cjs report --spec examples/openapi/demo-openapi-unsupported-schema.yaml --events .yanote-ci/v1-e2e/events.jsonl --out <temp> --min-coverage 100' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("semantic-red.stderr")
    printf 'semantic-red.stderr=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${SEMANTIC_RED_REPORT_PATH}" ]]; then
    exported_artifacts+=("semantic-red-yanote-report.json")
    printf 'semantic-red-yanote-report.json=%s\n' 'host-output:.yanote-ci/v1-e2e/semantic-red-yanote-report.json' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("semantic-red-yanote-report.json")
    printf 'semantic-red-yanote-report.json=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  artifact_count="${#exported_artifacts[@]}"
  artifacts_csv="none"
  if [[ "${#exported_artifacts[@]}" -gt 0 ]]; then
    artifacts_csv="$(join_by_comma "${exported_artifacts[@]}")"
  fi

  missing_artifacts_csv="none"
  if [[ "${#missing_artifacts[@]}" -gt 0 ]]; then
    missing_artifacts_csv="$(join_by_comma "${missing_artifacts[@]}")"
  fi

  {
    printf 'created_at=%s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    printf 'happy_path_report_found=%s\n' "$( [[ -f "${ARTIFACT_DIR}/out/yanote-report.json" ]] && printf 'true' || printf 'false' )"
    printf 'semantic_red_expected_exit=%s\n' '5'
    printf 'semantic_red_primary=%s\n' 'SEMANTIC_HTTP_UNSUPPORTED_SCHEMA'
    printf 'artifact_count=%s\n' "${artifact_count}"
    printf 'artifacts=%s\n' "${artifacts_csv}"
    printf 'missing_artifacts=%s\n' "${missing_artifacts_csv}"
    printf 'source_paths_note=%s\n' "${SOURCE_PATHS_NOTE_NAME}"
    printf 'destination=%s\n' "${ARTIFACT_DIR}"
  } > "${MANIFEST_PATH}"
}

cleanup() {
  collect_artifacts
  docker compose -f "${COMPOSE_FILE}" down --remove-orphans --volumes || true
  if [[ -n "${SEMANTIC_RED_OUT_DIR}" && -d "${SEMANTIC_RED_OUT_DIR}" ]]; then
    rm -rf "${SEMANTIC_RED_OUT_DIR}"
  fi
  if [[ -n "${HOST_GRADLE_HOME:-}" && -d "${HOST_GRADLE_HOME}" ]]; then
    rm -rf "${HOST_GRADLE_HOME}" || true
  fi
}
trap cleanup EXIT

# Ensure stale marker files from previous runs cannot short-circuit container sequencing.
docker compose -f "${COMPOSE_FILE}" down --remove-orphans --volumes >/dev/null 2>&1 || true

reset_artifact_dir
prepare_demo_assets

docker compose -f "${COMPOSE_FILE}" up --build --abort-on-container-exit --exit-code-from report
collect_artifacts
run_semantic_red_pass
write_bundle_metadata
