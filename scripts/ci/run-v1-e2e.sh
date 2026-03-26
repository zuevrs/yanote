#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACT_DIR="${ROOT_DIR}/.yanote-ci/v1-e2e"
COMPOSE_FILE="examples/docker-compose.yml"
REQUEST_SEMANTICS_SPEC="examples/openapi/request-evidence-openapi.yaml"
REQUEST_SEMANTICS_ROUTE="/request-evidence/users/{userId}"
HAPPY_PATH_REPORT_JSON_PATH="${ARTIFACT_DIR}/out/yanote-report.json"
HAPPY_PATH_REPORT_HTML_PATH="${ARTIFACT_DIR}/out/yanote-report.html"
REQUEST_SEMANTICS_EVENTS_PATH="${ARTIFACT_DIR}/request-semantics.events.jsonl"
REQUEST_SEMANTICS_STDOUT_PATH="${ARTIFACT_DIR}/request-semantics.stdout"
REQUEST_SEMANTICS_STDERR_PATH="${ARTIFACT_DIR}/request-semantics.stderr"
REQUEST_SEMANTICS_REPORT_PATH="${ARTIFACT_DIR}/request-semantics-yanote-report.json"
REQUEST_SEMANTICS_FORBIDDEN_STDIO_VALUES=("user-42" "alpha" "bravo" "amber" "compact" "opaque")
REQUEST_SEMANTICS_FORBIDDEN_SECRET_VALUES=("Bearer proof-secret-token" "proof-session-secret")
SECURITY_SEMANTICS_SPEC="yanote-js/test/fixtures/openapi/http-security-api-key.yaml"
SECURITY_SEMANTICS_EVENTS_FIXTURE="yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl"
SECURITY_SEMANTICS_STDOUT_PATH="${ARTIFACT_DIR}/security-semantics.stdout"
SECURITY_SEMANTICS_STDERR_PATH="${ARTIFACT_DIR}/security-semantics.stderr"
SECURITY_SEMANTICS_REPORT_PATH="${ARTIFACT_DIR}/security-semantics-yanote-report.json"
SECURITY_SEMANTICS_FORBIDDEN_VALUES=(
  "header-secret-123"
  "query-secret-456"
  "header-and-789"
  "query-and-789"
  "header-only-000"
  "Basic dXNlcjpzZWNyZXQ="
  "Bearer oauth-secret"
  "Bearer oidc-secret"
  "path-secret-xyz"
)
SEMANTIC_RED_SPEC="examples/openapi/demo-openapi-unsupported-schema.yaml"
SEMANTIC_RED_STDOUT_PATH="${ARTIFACT_DIR}/semantic-red.stdout"
SEMANTIC_RED_STDERR_PATH="${ARTIFACT_DIR}/semantic-red.stderr"
SEMANTIC_RED_REPORT_PATH="${ARTIFACT_DIR}/semantic-red-yanote-report.json"
SOURCE_PATHS_NOTE_NAME="artifact-source-paths.txt"
MANIFEST_NAME="artifact-manifest.txt"
SOURCE_PATHS_NOTE_PATH="${ARTIFACT_DIR}/${SOURCE_PATHS_NOTE_NAME}"
MANIFEST_PATH="${ARTIFACT_DIR}/${MANIFEST_NAME}"
HOST_GRADLE_HOME="${YANOTE_GRADLE_HOME:-${GRADLE_USER_HOME:-${HOME}/.gradle}}"
REQUEST_SEMANTICS_OUT_DIR=""
SECURITY_SEMANTICS_OUT_DIR=""
SEMANTIC_RED_OUT_DIR=""

mkdir -p "${HOST_GRADLE_HOME}"
export GRADLE_USER_HOME="${HOST_GRADLE_HOME}"
export YANOTE_GRADLE_HOME="${HOST_GRADLE_HOME}"
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

extract_http_report_metadata() {
  local report_path="$1"
  python3 - "${report_path}" <<'PY'
import json
import pathlib
import sys

report_path = pathlib.Path(sys.argv[1])
report = json.loads(report_path.read_text(encoding="utf-8"))
spec_source = report.get("specSource") or {}
deprecated = (report.get("summary") or {}).get("deprecatedOperations") or {}


def emit(key, value):
    normalized = "none" if value is None else str(value)
    normalized = normalized.replace("\t", " ").replace("\n", " ")
    print(f"{key}\t{normalized}")

emit("spec_source_kind", spec_source.get("kind", "none"))
emit("spec_source_ref", spec_source.get("reference", "none"))
emit("status", report.get("status", "unknown"))
emit("deprecated_total", deprecated.get("totalOperations", 0))
emit("deprecated_covered", deprecated.get("coveredOperations", 0))
emit("deprecated_uncovered", deprecated.get("uncoveredOperations", 0))
emit("deprecated_percent", deprecated.get("operationCoveragePercent", 0))
PY
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

filter_request_semantics_events() {
  python3 - "${ARTIFACT_DIR}/events.jsonl" "${REQUEST_SEMANTICS_ROUTE}" "${REQUEST_SEMANTICS_EVENTS_PATH}" <<'PY'
import json
import pathlib
import sys

source_path = pathlib.Path(sys.argv[1])
route = sys.argv[2]
out_path = pathlib.Path(sys.argv[3])
matched_lines = []

for line in source_path.read_text(encoding="utf-8").splitlines(keepends=True):
    if not line.strip():
        continue
    record = json.loads(line)
    if record.get("route") == route:
        matched_lines.append(line if line.endswith("\n") else f"{line}\n")

if not matched_lines:
    raise SystemExit(f"no retained events matched route {route!r}")

out_path.write_text("".join(matched_lines), encoding="utf-8")
PY
}

ensure_no_file_leak() {
  local file_path="$1"
  local label="$2"
  shift 2
  local forbidden_value

  for forbidden_value in "$@"; do
    if [[ -f "${file_path}" ]] && grep -Fq "${forbidden_value}" "${file_path}"; then
      echo "ERROR: ${label} leaked forbidden retained value '${forbidden_value}'." >&2
      exit 1
    fi
  done
}

run_request_semantics_pass() {
  local status

  if [[ ! -f "${ARTIFACT_DIR}/events.jsonl" ]]; then
    echo "ERROR: Missing live events artifact at ${ARTIFACT_DIR}/events.jsonl after compose run." >&2
    exit 1
  fi

  rm -f \
    "${REQUEST_SEMANTICS_EVENTS_PATH}" \
    "${REQUEST_SEMANTICS_STDOUT_PATH}" \
    "${REQUEST_SEMANTICS_STDERR_PATH}" \
    "${REQUEST_SEMANTICS_REPORT_PATH}"

  filter_request_semantics_events
  REQUEST_SEMANTICS_OUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-v1-e2e-request.XXXXXX")"

  set +e
  node yanote-js/dist/yanote.cjs report \
    --spec "${REQUEST_SEMANTICS_SPEC}" \
    --events "${REQUEST_SEMANTICS_EVENTS_PATH}" \
    --out "${REQUEST_SEMANTICS_OUT_DIR}" \
    --min-coverage 100 >"${REQUEST_SEMANTICS_STDOUT_PATH}" 2>"${REQUEST_SEMANTICS_STDERR_PATH}"
  status=$?
  set -e

  if [[ "${status}" -ne 5 ]]; then
    echo "ERROR: Expected request-semantics analyzer exit 5, got ${status}." >&2
    exit 1
  fi

  if ! grep -q 'YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER' "${REQUEST_SEMANTICS_STDERR_PATH}"; then
    echo "ERROR: request-semantics stderr is missing SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER." >&2
    exit 1
  fi

  if [[ ! -f "${REQUEST_SEMANTICS_OUT_DIR}/yanote-report.json" ]]; then
    echo "ERROR: request-semantics report did not produce yanote-report.json." >&2
    exit 1
  fi

  cp "${REQUEST_SEMANTICS_OUT_DIR}/yanote-report.json" "${REQUEST_SEMANTICS_REPORT_PATH}"

  ensure_no_file_leak "${REQUEST_SEMANTICS_STDOUT_PATH}" "request-semantics stdout" "${REQUEST_SEMANTICS_FORBIDDEN_STDIO_VALUES[@]}"
  ensure_no_file_leak "${REQUEST_SEMANTICS_STDOUT_PATH}" "request-semantics stdout" "${REQUEST_SEMANTICS_FORBIDDEN_SECRET_VALUES[@]}"
  ensure_no_file_leak "${REQUEST_SEMANTICS_STDERR_PATH}" "request-semantics stderr" "${REQUEST_SEMANTICS_FORBIDDEN_STDIO_VALUES[@]}"
  ensure_no_file_leak "${REQUEST_SEMANTICS_STDERR_PATH}" "request-semantics stderr" "${REQUEST_SEMANTICS_FORBIDDEN_SECRET_VALUES[@]}"
}

run_security_semantics_pass() {
  local status

  rm -f \
    "${SECURITY_SEMANTICS_STDOUT_PATH}" \
    "${SECURITY_SEMANTICS_STDERR_PATH}" \
    "${SECURITY_SEMANTICS_REPORT_PATH}"

  SECURITY_SEMANTICS_OUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yanote-v1-e2e-security.XXXXXX")"

  set +e
  node yanote-js/dist/yanote.cjs report \
    --spec "${SECURITY_SEMANTICS_SPEC}" \
    --events "${SECURITY_SEMANTICS_EVENTS_FIXTURE}" \
    --out "${SECURITY_SEMANTICS_OUT_DIR}" \
    --profile local \
    --verbose >"${SECURITY_SEMANTICS_STDOUT_PATH}" 2>"${SECURITY_SEMANTICS_STDERR_PATH}"
  status=$?
  set -e

  if [[ "${status}" -ne 5 ]]; then
    echo "ERROR: Expected security-semantics analyzer exit 5, got ${status}." >&2
    exit 1
  fi

  if ! grep -q '^HTTP Security Conformance$' "${SECURITY_SEMANTICS_STDOUT_PATH}"; then
    echo "ERROR: security-semantics stdout is missing the HTTP Security Conformance section." >&2
    exit 1
  fi

  if ! grep -q 'YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_MISSING_SECURITY' "${SECURITY_SEMANTICS_STDERR_PATH}"; then
    echo "ERROR: security-semantics stderr is missing SEMANTIC_HTTP_MISSING_SECURITY." >&2
    exit 1
  fi

  if ! grep -q 'primary=SEMANTIC_HTTP_MISSING_SECURITY' "${SECURITY_SEMANTICS_STDOUT_PATH}"; then
    echo "ERROR: security-semantics stdout is missing the SEMANTIC_HTTP_MISSING_SECURITY summary token." >&2
    exit 1
  fi

  if [[ ! -f "${SECURITY_SEMANTICS_OUT_DIR}/yanote-report.json" ]]; then
    echo "ERROR: security-semantics report did not produce yanote-report.json." >&2
    exit 1
  fi

  cp "${SECURITY_SEMANTICS_OUT_DIR}/yanote-report.json" "${SECURITY_SEMANTICS_REPORT_PATH}"

  ensure_no_file_leak "${SECURITY_SEMANTICS_STDOUT_PATH}" "security-semantics stdout" "${SECURITY_SEMANTICS_FORBIDDEN_VALUES[@]}"
  ensure_no_file_leak "${SECURITY_SEMANTICS_STDERR_PATH}" "security-semantics stderr" "${SECURITY_SEMANTICS_FORBIDDEN_VALUES[@]}"
  ensure_no_file_leak "${SECURITY_SEMANTICS_REPORT_PATH}" "security-semantics yanote-report" "${SECURITY_SEMANTICS_FORBIDDEN_VALUES[@]}"
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
  local artifact_count
  local artifacts_csv
  local missing_artifacts_csv
  local happy_path_report_found="false"
  local happy_path_report_html_found="false"
  local happy_path_spec_source_kind="none"
  local happy_path_spec_source_ref="none"
  local happy_path_status="unknown"
  local happy_path_deprecated_total="0"
  local happy_path_deprecated_covered="0"
  local happy_path_deprecated_uncovered="0"
  local happy_path_deprecated_percent="0"

  if [[ -f "${HAPPY_PATH_REPORT_JSON_PATH}" ]]; then
    happy_path_report_found="true"
    while IFS=$'\t' read -r key value; do
      case "${key}" in
        spec_source_kind)
          happy_path_spec_source_kind="${value}"
          ;;
        spec_source_ref)
          happy_path_spec_source_ref="${value}"
          ;;
        status)
          happy_path_status="${value}"
          ;;
        deprecated_total)
          happy_path_deprecated_total="${value}"
          ;;
        deprecated_covered)
          happy_path_deprecated_covered="${value}"
          ;;
        deprecated_uncovered)
          happy_path_deprecated_uncovered="${value}"
          ;;
        deprecated_percent)
          happy_path_deprecated_percent="${value}"
          ;;
      esac
    done < <(extract_http_report_metadata "${HAPPY_PATH_REPORT_JSON_PATH}")
  fi

  if [[ -f "${HAPPY_PATH_REPORT_HTML_PATH}" ]]; then
    happy_path_report_html_found="true"
  fi

  : > "${SOURCE_PATHS_NOTE_PATH}"

  if [[ -f "${ARTIFACT_DIR}/events.jsonl" ]]; then
    exported_artifacts+=("events.jsonl")
    printf 'events.jsonl=%s\n' 'report:/data/yanote/events.jsonl' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("events.jsonl")
    printf 'events.jsonl=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${HAPPY_PATH_REPORT_JSON_PATH}" ]]; then
    exported_artifacts+=("out/yanote-report.json")
    printf 'out/yanote-report.json=%s\n' 'report:/data/yanote/out/yanote-report.json' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("out/yanote-report.json")
    printf 'out/yanote-report.json=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${HAPPY_PATH_REPORT_HTML_PATH}" ]]; then
    exported_artifacts+=("out/yanote-report.html")
    printf 'out/yanote-report.html=%s\n' 'report:/data/yanote/out/yanote-report.html' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("out/yanote-report.html")
    printf 'out/yanote-report.html=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${ARTIFACT_DIR}/compose.log" ]]; then
    exported_artifacts+=("compose.log")
    printf 'compose.log=%s\n' 'docker compose -f examples/docker-compose.yml logs --no-color' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("compose.log")
    printf 'compose.log=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${REQUEST_SEMANTICS_EVENTS_PATH}" ]]; then
    exported_artifacts+=("request-semantics.events.jsonl")
    printf 'request-semantics.events.jsonl=%s\n' 'filtered:.yanote-ci/v1-e2e/events.jsonl route=/request-evidence/users/{userId}' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("request-semantics.events.jsonl")
    printf 'request-semantics.events.jsonl=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${REQUEST_SEMANTICS_STDOUT_PATH}" ]]; then
    exported_artifacts+=("request-semantics.stdout")
    printf 'request-semantics.stdout=%s\n' 'host:node yanote-js/dist/yanote.cjs report --spec examples/openapi/request-evidence-openapi.yaml --events .yanote-ci/v1-e2e/request-semantics.events.jsonl --out <temp> --min-coverage 100' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("request-semantics.stdout")
    printf 'request-semantics.stdout=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${REQUEST_SEMANTICS_STDERR_PATH}" ]]; then
    exported_artifacts+=("request-semantics.stderr")
    printf 'request-semantics.stderr=%s\n' 'host:node yanote-js/dist/yanote.cjs report --spec examples/openapi/request-evidence-openapi.yaml --events .yanote-ci/v1-e2e/request-semantics.events.jsonl --out <temp> --min-coverage 100' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("request-semantics.stderr")
    printf 'request-semantics.stderr=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${REQUEST_SEMANTICS_REPORT_PATH}" ]]; then
    exported_artifacts+=("request-semantics-yanote-report.json")
    printf 'request-semantics-yanote-report.json=%s\n' 'host-output:.yanote-ci/v1-e2e/request-semantics-yanote-report.json' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("request-semantics-yanote-report.json")
    printf 'request-semantics-yanote-report.json=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  printf 'security_semantics_spec=%s\n' 'yanote-js/test/fixtures/openapi/http-security-api-key.yaml' >> "${SOURCE_PATHS_NOTE_PATH}"
  printf 'security_semantics_events=%s\n' 'yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl' >> "${SOURCE_PATHS_NOTE_PATH}"

  if [[ -f "${SECURITY_SEMANTICS_STDOUT_PATH}" ]]; then
    exported_artifacts+=("security-semantics.stdout")
    printf 'security-semantics.stdout=%s\n' 'host:node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-security-api-key.yaml --events yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl --out <temp> --profile local --verbose' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("security-semantics.stdout")
    printf 'security-semantics.stdout=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${SECURITY_SEMANTICS_STDERR_PATH}" ]]; then
    exported_artifacts+=("security-semantics.stderr")
    printf 'security-semantics.stderr=%s\n' 'host:node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-security-api-key.yaml --events yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl --out <temp> --profile local --verbose' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("security-semantics.stderr")
    printf 'security-semantics.stderr=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
  fi

  if [[ -f "${SECURITY_SEMANTICS_REPORT_PATH}" ]]; then
    exported_artifacts+=("security-semantics-yanote-report.json")
    printf 'security-semantics-yanote-report.json=%s\n' 'host-output:.yanote-ci/v1-e2e/security-semantics-yanote-report.json' >> "${SOURCE_PATHS_NOTE_PATH}"
  else
    missing_artifacts+=("security-semantics-yanote-report.json")
    printf 'security-semantics-yanote-report.json=%s\n' 'none' >> "${SOURCE_PATHS_NOTE_PATH}"
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

  printf 'happy_path_spec_source_kind=%s\n' "${happy_path_spec_source_kind}" >> "${SOURCE_PATHS_NOTE_PATH}"
  printf 'happy_path_spec_source_ref=%s\n' "${happy_path_spec_source_ref}" >> "${SOURCE_PATHS_NOTE_PATH}"
  printf 'happy_path_status=%s\n' "${happy_path_status}" >> "${SOURCE_PATHS_NOTE_PATH}"
  printf 'happy_path_deprecated_total=%s\n' "${happy_path_deprecated_total}" >> "${SOURCE_PATHS_NOTE_PATH}"
  printf 'happy_path_deprecated_covered=%s\n' "${happy_path_deprecated_covered}" >> "${SOURCE_PATHS_NOTE_PATH}"
  printf 'happy_path_deprecated_uncovered=%s\n' "${happy_path_deprecated_uncovered}" >> "${SOURCE_PATHS_NOTE_PATH}"
  printf 'happy_path_deprecated_percent=%s\n' "${happy_path_deprecated_percent}" >> "${SOURCE_PATHS_NOTE_PATH}"

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
    printf 'happy_path_report_found=%s\n' "${happy_path_report_found}"
    printf 'happy_path_report_html_found=%s\n' "${happy_path_report_html_found}"
    printf 'happy_path_status=%s\n' "${happy_path_status}"
    printf 'happy_path_spec_source_kind=%s\n' "${happy_path_spec_source_kind}"
    printf 'happy_path_spec_source_ref=%s\n' "${happy_path_spec_source_ref}"
    printf 'happy_path_deprecated_total=%s\n' "${happy_path_deprecated_total}"
    printf 'happy_path_deprecated_covered=%s\n' "${happy_path_deprecated_covered}"
    printf 'happy_path_deprecated_uncovered=%s\n' "${happy_path_deprecated_uncovered}"
    printf 'happy_path_deprecated_percent=%s\n' "${happy_path_deprecated_percent}"
    printf 'request_semantics_expected_exit=%s\n' '5'
    printf 'request_semantics_primary=%s\n' 'SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER'
    printf 'security_semantics_expected_exit=%s\n' '5'
    printf 'security_semantics_primary=%s\n' 'SEMANTIC_HTTP_MISSING_SECURITY'
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
  if [[ -n "${REQUEST_SEMANTICS_OUT_DIR}" && -d "${REQUEST_SEMANTICS_OUT_DIR}" ]]; then
    rm -rf "${REQUEST_SEMANTICS_OUT_DIR}"
  fi
  if [[ -n "${SECURITY_SEMANTICS_OUT_DIR}" && -d "${SECURITY_SEMANTICS_OUT_DIR}" ]]; then
    rm -rf "${SECURITY_SEMANTICS_OUT_DIR}"
  fi
  if [[ -n "${SEMANTIC_RED_OUT_DIR}" && -d "${SEMANTIC_RED_OUT_DIR}" ]]; then
    rm -rf "${SEMANTIC_RED_OUT_DIR}"
  fi
}
trap cleanup EXIT

# Ensure stale marker files from previous runs cannot short-circuit container sequencing.
docker compose -f "${COMPOSE_FILE}" down --remove-orphans --volumes >/dev/null 2>&1 || true

reset_artifact_dir
prepare_demo_assets

docker compose -f "${COMPOSE_FILE}" up --build --abort-on-container-exit --exit-code-from report
collect_artifacts
run_request_semantics_pass
run_security_semantics_pass
run_semantic_red_pass
write_bundle_metadata
