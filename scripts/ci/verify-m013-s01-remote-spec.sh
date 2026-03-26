#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

ARTIFACT_DIR=".yanote-ci/remote-spec-proof"
FIXTURE_ROOT="${ARTIFACT_DIR}/fixtures"
LOCAL_FILE_FIXTURE_PATH="${FIXTURE_ROOT}/local-file/simple.yaml"
LOCAL_DIRECTORY_FIXTURE_DIR="${FIXTURE_ROOT}/local-directory"
REMOTE_SERVE_DIR="${FIXTURE_ROOT}/remote-serve"
BUILD_LOG_PATH="${ARTIFACT_DIR}/dist-node-analyzer.log"
SERVER_LOG_PATH="${ARTIFACT_DIR}/fixture-server.log"
SOURCE_PATHS_NOTE_NAME="artifact-source-paths.txt"
SOURCE_PATHS_NOTE_PATH="${ARTIFACT_DIR}/${SOURCE_PATHS_NOTE_NAME}"
MANIFEST_NAME="artifact-manifest.txt"
MANIFEST_PATH="${ARTIFACT_DIR}/${MANIFEST_NAME}"
FIXTURE_SPEC="yanote-js/test/fixtures/openapi/simple.yaml"
FIXTURE_EVENTS="yanote-js/test/fixtures/events/events.ci.fixture.jsonl"
ANALYZER_PATH="dist/node-analyzer/bin/yanote.cjs"
SERVER_PID=""

print_artifacts() {
  echo "Artifacts retained at: ${ARTIFACT_DIR}" >&2
  echo "  build_log: ${BUILD_LOG_PATH}" >&2
  echo "  server_log: ${SERVER_LOG_PATH}" >&2
  echo "  manifest: ${MANIFEST_PATH}" >&2
  echo "  source_paths: ${SOURCE_PATHS_NOTE_PATH}" >&2
}

show_failure_tail() {
  local file
  for file in \
    "${BUILD_LOG_PATH}" \
    "${SERVER_LOG_PATH}" \
    "${ARTIFACT_DIR}/gradle-remote-check/ci/yanote-validation.stderr.log" \
    "${ARTIFACT_DIR}/gradle-remote-report/ci/yanote-validation.stderr.log"; do
    if [[ -s "${file}" ]]; then
      echo "--- $(basename "${file}") (tail) ---" >&2
      tail -n 80 "${file}" >&2 || true
    fi
  done
}

fail() {
  local message="$1"
  echo "ERROR: ${message}" >&2
  show_failure_tail
  print_artifacts
  exit 1
}

cleanup() {
  if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

reserve_port() {
  python3 - <<'PY'
import socket
sock = socket.socket()
sock.bind(("127.0.0.1", 0))
print(sock.getsockname()[1])
sock.close()
PY
}

wait_for_port() {
  python3 - "$1" "$2" <<'PY'
import socket
import sys
import time

host = sys.argv[1]
port = int(sys.argv[2])
for _ in range(60):
    try:
        with socket.create_connection((host, port), timeout=1):
            raise SystemExit(0)
    except OSError:
        time.sleep(0.5)
raise SystemExit(1)
PY
}

ensure_no_file_leak() {
  local file="$1"
  local label="$2"
  shift 2
  local forbidden
  for forbidden in "$@"; do
    if [[ -f "${file}" ]] && grep -Fq -- "${forbidden}" "${file}"; then
      fail "${label} leaked forbidden value '${forbidden}'."
    fi
  done
}

run_cli_case() {
  local label="$1"
  local spec_input="$2"
  local expected_kind="$3"
  local expected_ref="$4"
  local case_dir="${ARTIFACT_DIR}/${label}"
  local stdout_path="${case_dir}/stdout"
  local stderr_path="${case_dir}/stderr"
  local out_dir="${case_dir}/out"
  local report_path="${out_dir}/yanote-report.json"

  mkdir -p "${case_dir}"
  if ! node "${ANALYZER_PATH}" report \
    --spec "${spec_input}" \
    --events "${FIXTURE_EVENTS}" \
    --out "${out_dir}" \
    --profile local >"${stdout_path}" 2>"${stderr_path}"; then
    fail "CLI ${label} run failed."
  fi

  [[ -f "${report_path}" ]] || fail "CLI ${label} did not produce yanote-report.json."
  grep -q '^YANOTE_SUMMARY ' "${stdout_path}" || fail "CLI ${label} stdout is missing YANOTE_SUMMARY."

  python3 - "${stdout_path}" "${report_path}" "${expected_kind}" "${expected_ref}" <<'PY' || fail "CLI proof assertions failed for ${label}."
import json
import pathlib
import sys

stdout_path = pathlib.Path(sys.argv[1])
report_path = pathlib.Path(sys.argv[2])
expected_kind = sys.argv[3]
expected_ref = sys.argv[4]
stdout = stdout_path.read_text(encoding="utf-8")
report = json.loads(report_path.read_text(encoding="utf-8"))
summary_lines = [line for line in stdout.splitlines() if line.startswith("YANOTE_SUMMARY ")]
if len(summary_lines) != 1:
    raise SystemExit(f"Expected exactly one YANOTE_SUMMARY line, got {len(summary_lines)}")
summary_line = summary_lines[0]
expected_stdout = f"- spec source: {expected_kind} ({expected_ref})"
if expected_stdout not in stdout:
    raise SystemExit(f"stdout is missing {expected_stdout!r}")
for token in [
    f"spec_source_kind={expected_kind}",
    f'spec_source_ref="{expected_ref}"',
    "report=",
]:
    if token not in summary_line:
        raise SystemExit(f"summary line is missing token {token!r}")
if report.get("specSource") != {"kind": expected_kind, "reference": expected_ref}:
    raise SystemExit(f"Unexpected report specSource: {report.get('specSource')!r}")
PY

  ensure_no_file_leak "${stdout_path}" "${label} stdout" "proof-user" "proof-secret" "proof-token" "proof-fragment"
  ensure_no_file_leak "${stderr_path}" "${label} stderr" "proof-user" "proof-secret" "proof-token" "proof-fragment"
  ensure_no_file_leak "${report_path}" "${label} report" "proof-user" "proof-secret" "proof-token" "proof-fragment"
}

run_gradle_case() {
  local label="$1"
  local gradle_task="$2"
  local case_dir="${ARTIFACT_DIR}/${label}"
  local helper_stdout_path="${case_dir}/helper.stdout"
  local helper_stderr_path="${case_dir}/helper.stderr"
  local ci_dir="${case_dir}/ci"
  local out_dir="${case_dir}/out"
  local args_path
  local report_path="${out_dir}/yanote-report.json"

  mkdir -p "${case_dir}"
  if ! YANOTE_CI_DIR="${ci_dir}" \
    YANOTE_GRADLE_FIXTURE_DIR="${case_dir}/fixture" \
    YANOTE_OUT_DIR="${out_dir}" \
    YANOTE_GRADLE_TASK="${gradle_task}" \
    YANOTE_SKIP_DIST_NODE_ANALYZER=true \
    INPUT_SPEC_PATH="${REMOTE_SPEC_URL}" \
    INPUT_EVENTS_PATH="${FIXTURE_EVENTS}" \
    bash scripts/ci/run-yanote-gradle-check.sh >"${helper_stdout_path}" 2>"${helper_stderr_path}"; then
    fail "Gradle ${gradle_task} remote proof failed."
  fi

  if [[ "${gradle_task}" == "yanoteCheck" ]]; then
    args_path="${out_dir}/yanote-check-command.args"
  else
    args_path="${out_dir}/yanote-report-command.args"
  fi

  [[ -f "${args_path}" ]] || fail "Gradle ${gradle_task} proof did not produce $(basename "${args_path}")."
  [[ -f "${report_path}" ]] || fail "Gradle ${gradle_task} proof did not produce yanote-report.json."
  grep -Fq 'report --spec <remote-url>' "${args_path}" || fail "Gradle ${gradle_task} args surface did not redact the remote --spec display value."
  grep -Fq "spec_source_kind=remote-url" "${args_path}" || fail "Gradle ${gradle_task} args surface is missing spec_source_kind."
  grep -Fq "spec_source_ref=${REMOTE_SPEC_URL}" "${args_path}" || fail "Gradle ${gradle_task} args surface is missing the sanitized remote ref."
  if grep -Fq -- "--spec ${REMOTE_SPEC_URL}" "${args_path}"; then
    fail "Gradle ${gradle_task} args surface persisted the raw remote --spec value instead of the sanitized placeholder."
  fi

  python3 - "${report_path}" "${REMOTE_SPEC_URL}" <<'PY' || fail "Gradle ${gradle_task} report assertions failed."
import json
import pathlib
import sys

report_path = pathlib.Path(sys.argv[1])
expected_ref = sys.argv[2]
report = json.loads(report_path.read_text(encoding="utf-8"))
if report.get("specSource") != {"kind": "remote-url", "reference": expected_ref}:
    raise SystemExit(f"Unexpected report specSource: {report.get('specSource')!r}")
PY

  ensure_no_file_leak "${args_path}" "${label} args" "proof-user" "proof-secret" "proof-token" "proof-fragment"
  ensure_no_file_leak "${helper_stdout_path}" "${label} helper stdout" "proof-user" "proof-secret" "proof-token" "proof-fragment"
  ensure_no_file_leak "${helper_stderr_path}" "${label} helper stderr" "proof-user" "proof-secret" "proof-token" "proof-fragment"
  ensure_no_file_leak "${report_path}" "${label} report" "proof-user" "proof-secret" "proof-token" "proof-fragment"
}

rm -rf "${ARTIFACT_DIR}"
mkdir -p "${FIXTURE_ROOT}" "$(dirname "${LOCAL_FILE_FIXTURE_PATH}")" "${LOCAL_DIRECTORY_FIXTURE_DIR}" "${REMOTE_SERVE_DIR}"
cp "${FIXTURE_SPEC}" "${LOCAL_FILE_FIXTURE_PATH}"
cp "${FIXTURE_SPEC}" "${LOCAL_DIRECTORY_FIXTURE_DIR}/openapi.yaml"
cp "${FIXTURE_SPEC}" "${REMOTE_SERVE_DIR}/simple.yaml"

PORT="${YANOTE_PORT:-$(reserve_port)}"
REMOTE_SPEC_URL="http://127.0.0.1:${PORT}/simple.yaml"

if ! ./gradlew distNodeAnalyzer --stacktrace >"${BUILD_LOG_PATH}" 2>&1; then
  fail "distNodeAnalyzer build failed."
fi

python3 -m http.server "${PORT}" --bind 127.0.0.1 --directory "${REMOTE_SERVE_DIR}" >"${SERVER_LOG_PATH}" 2>&1 &
SERVER_PID=$!
if ! wait_for_port 127.0.0.1 "${PORT}"; then
  fail "Fixture HTTP server did not become ready on port ${PORT}."
fi

run_cli_case "cli-local-file" "${LOCAL_FILE_FIXTURE_PATH}" "local-file" "${LOCAL_FILE_FIXTURE_PATH}"
run_cli_case "cli-local-directory" "${LOCAL_DIRECTORY_FIXTURE_DIR}" "local-directory" "${LOCAL_DIRECTORY_FIXTURE_DIR}"
run_cli_case "cli-remote-url" "${REMOTE_SPEC_URL}" "remote-url" "${REMOTE_SPEC_URL}"

run_gradle_case "gradle-remote-check" "yanoteCheck"
run_gradle_case "gradle-remote-report" "yanoteReport"

python3 - "${ARTIFACT_DIR}" <<'PY' || fail "Remote-spec proof bundle leak scan failed."
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
forbidden = ["proof-user", "proof-secret", "proof-token", "proof-fragment"]
for path in root.rglob("*"):
    if not path.is_file():
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    for value in forbidden:
        if value in text:
            raise SystemExit(f"{path} leaked forbidden value {value!r}")
PY

cat > "${SOURCE_PATHS_NOTE_PATH}" <<EOF
cli-local-file.stdout=host:node ${ANALYZER_PATH} report --spec ${LOCAL_FILE_FIXTURE_PATH} --events ${FIXTURE_EVENTS} --out <proof>/cli-local-file/out --profile local
cli-local-file.report=${ARTIFACT_DIR}/cli-local-file/out/yanote-report.json
cli-local-directory.stdout=host:node ${ANALYZER_PATH} report --spec ${LOCAL_DIRECTORY_FIXTURE_DIR} --events ${FIXTURE_EVENTS} --out <proof>/cli-local-directory/out --profile local
cli-local-directory.report=${ARTIFACT_DIR}/cli-local-directory/out/yanote-report.json
cli-remote-url.stdout=host:node ${ANALYZER_PATH} report --spec ${REMOTE_SPEC_URL} --events ${FIXTURE_EVENTS} --out <proof>/cli-remote-url/out --profile local
cli-remote-url.report=${ARTIFACT_DIR}/cli-remote-url/out/yanote-report.json
gradle-remote-check.command=${ARTIFACT_DIR}/gradle-remote-check/ci/yanote-command.txt
gradle-remote-check.args=${ARTIFACT_DIR}/gradle-remote-check/out/yanote-check-command.args
gradle-remote-check.report=${ARTIFACT_DIR}/gradle-remote-check/out/yanote-report.json
gradle-remote-report.command=${ARTIFACT_DIR}/gradle-remote-report/ci/yanote-command.txt
gradle-remote-report.args=${ARTIFACT_DIR}/gradle-remote-report/out/yanote-report-command.args
gradle-remote-report.report=${ARTIFACT_DIR}/gradle-remote-report/out/yanote-report.json
remote_spec_url=${REMOTE_SPEC_URL}
source_paths_note=${SOURCE_PATHS_NOTE_NAME}
EOF

cat > "${MANIFEST_PATH}" <<EOF
created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
artifact_dir=${ARTIFACT_DIR}
cli_local_file=ok
cli_local_directory=ok
cli_remote_url=ok
gradle_remote_check=ok
gradle_remote_report=ok
remote_spec_ref=${REMOTE_SPEC_URL}
sanitized_remote_only=true
source_paths_note=${SOURCE_PATHS_NOTE_NAME}
EOF

echo "Remote spec proof bundle ready at ${ARTIFACT_DIR}."
print_artifacts
