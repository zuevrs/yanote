#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="${1:-.yanote-ci/artifacts}"
ASYNC_BUNDLE_SOURCE_DIR=".yanote-ci/live-kafka-proof"
ASYNC_BUNDLE_TARGET_NAME="live-kafka-proof"
V1_E2E_BUNDLE_SOURCE_DIR=".yanote-ci/v1-e2e"
V1_E2E_BUNDLE_TARGET_NAME="v1-e2e"
SOURCE_PATHS_NOTE_NAME="artifact-source-paths.txt"
SOURCE_PATHS_NOTE_PATH="${DEST_DIR}/${SOURCE_PATHS_NOTE_NAME}"
mkdir -p "${DEST_DIR}"

copy_if_exists() {
  local source_path="$1"
  local target_name="$2"
  if [[ -f "${source_path}" ]]; then
    cp "${source_path}" "${DEST_DIR}/${target_name}"
    return 0
  fi
  return 1
}

copy_directory_if_exists() {
  local source_dir="$1"
  local target_name="$2"
  local target_dir="${DEST_DIR}/${target_name}"
  if [[ -d "${source_dir}" ]]; then
    rm -rf "${target_dir}"
    mkdir -p "${target_dir}"
    cp -R "${source_dir}/." "${target_dir}/"
    return 0
  fi
  return 1
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
emit("deprecated_total", deprecated.get("totalOperations", 0))
emit("deprecated_covered", deprecated.get("coveredOperations", 0))
emit("deprecated_uncovered", deprecated.get("uncoveredOperations", 0))
emit("deprecated_percent", deprecated.get("operationCoveragePercent", 0))
PY
}

REPORT_SOURCE=""
REPORT_HTML_SOURCE=""
REPORT_CANDIDATES=(
  "build/yanote/aggregate/check/yanote-report.json"
  "build/yanote/aggregate/report/yanote-report.json"
)

for candidate in "${REPORT_CANDIDATES[@]}"; do
  if [[ -f "${candidate}" ]]; then
    REPORT_SOURCE="${candidate}"
    break
  fi
done

if [[ -z "${REPORT_SOURCE}" ]]; then
  shopt -s nullglob
  module_reports=(build/yanote/modules/*/check/yanote-report.json build/yanote/modules/*/report/yanote-report.json)
  shopt -u nullglob
  if [[ "${#module_reports[@]}" -gt 0 ]]; then
    IFS=$'\n' sorted_reports=($(printf '%s\n' "${module_reports[@]}" | sort))
    REPORT_SOURCE="${sorted_reports[0]}"
  fi
fi

report_found="false"
report_json_found="false"
report_html_found="false"
report_spec_source_kind="none"
report_spec_source_ref="none"
report_deprecated_total="0"
report_deprecated_covered="0"
report_deprecated_uncovered="0"
report_deprecated_percent="0"

if [[ -n "${REPORT_SOURCE}" ]]; then
  cp "${REPORT_SOURCE}" "${DEST_DIR}/yanote-report.json"
  printf '%s\n' "${REPORT_SOURCE}" > "${DEST_DIR}/yanote-report.source-path.txt"
  report_found="true"
  report_json_found="true"

  candidate_html_source="$(dirname "${REPORT_SOURCE}")/yanote-report.html"
  if [[ -f "${candidate_html_source}" ]]; then
    cp "${candidate_html_source}" "${DEST_DIR}/yanote-report.html"
    REPORT_HTML_SOURCE="${candidate_html_source}"
    report_html_found="true"
  fi

  while IFS=$'\t' read -r key value; do
    case "${key}" in
      spec_source_kind)
        report_spec_source_kind="${value}"
        ;;
      spec_source_ref)
        report_spec_source_ref="${value}"
        ;;
      deprecated_total)
        report_deprecated_total="${value}"
        ;;
      deprecated_covered)
        report_deprecated_covered="${value}"
        ;;
      deprecated_uncovered)
        report_deprecated_uncovered="${value}"
        ;;
      deprecated_percent)
        report_deprecated_percent="${value}"
        ;;
    esac
  done < <(extract_http_report_metadata "${REPORT_SOURCE}")
fi

copy_if_exists "build/yanote/aggregate/check/yanote-check-command.args" "yanote-check-command.args" || true
copy_if_exists "build/yanote/aggregate/report/yanote-report-command.args" "yanote-report-command.args" || true
copy_if_exists "build/yanote/aggregate/check/yanote-report-diagnostics.txt" "yanote-report-diagnostics.txt" || true
copy_if_exists "build/yanote/aggregate/report/yanote-report-diagnostics.txt" "yanote-report-diagnostics.txt" || true

copy_if_exists ".yanote-ci/yanote-validation.stdout.log" "yanote-validation.stdout.log" || true
copy_if_exists ".yanote-ci/yanote-validation.stderr.log" "yanote-validation.stderr.log" || true
copy_if_exists ".yanote-ci/yanote-exit-code.txt" "yanote-exit-code.txt" || true
copy_if_exists ".yanote-ci/yanote-command.txt" "yanote-command.txt" || true
copy_if_exists ".yanote-ci/delivery-proof-exit-code.txt" "delivery-proof-exit-code.txt" || true
copy_if_exists ".yanote-ci/delivery-proof-should-run.txt" "delivery-proof-should-run.txt" || true
copy_if_exists ".yanote-ci/delivery-proof-scope.txt" "delivery-proof-scope.txt" || true
copy_if_exists ".yanote-ci/delivery-proof-changed-files.txt" "delivery-proof-changed-files.txt" || true

async_bundle_found="false"
async_bundle_source="none"
if copy_directory_if_exists "${ASYNC_BUNDLE_SOURCE_DIR}" "${ASYNC_BUNDLE_TARGET_NAME}"; then
  async_bundle_found="true"
  async_bundle_source="${ASYNC_BUNDLE_SOURCE_DIR}"
fi

v1_e2e_bundle_found="false"
v1_e2e_bundle_source="none"
if copy_directory_if_exists "${V1_E2E_BUNDLE_SOURCE_DIR}" "${V1_E2E_BUNDLE_TARGET_NAME}"; then
  v1_e2e_bundle_found="true"
  v1_e2e_bundle_source="${V1_E2E_BUNDLE_SOURCE_DIR}"
fi

{
  printf 'yanote-report.json=%s\n' "${REPORT_SOURCE:-none}"
  printf 'yanote-report.html=%s\n' "${REPORT_HTML_SOURCE:-none}"
  printf 'report_spec_source_kind=%s\n' "${report_spec_source_kind}"
  printf 'report_spec_source_ref=%s\n' "${report_spec_source_ref}"
  printf 'report_deprecated_total=%s\n' "${report_deprecated_total}"
  printf 'report_deprecated_covered=%s\n' "${report_deprecated_covered}"
  printf 'report_deprecated_uncovered=%s\n' "${report_deprecated_uncovered}"
  printf 'report_deprecated_percent=%s\n' "${report_deprecated_percent}"
  printf 'live-kafka-proof=%s\n' "${async_bundle_source}"
  printf 'v1-e2e=%s\n' "${v1_e2e_bundle_source}"
} > "${SOURCE_PATHS_NOTE_PATH}"

manifest_path="${DEST_DIR}/artifact-manifest.txt"
{
  printf 'created_at=%s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  printf 'report_found=%s\n' "${report_found}"
  printf 'report_json_found=%s\n' "${report_json_found}"
  printf 'report_html_found=%s\n' "${report_html_found}"
  printf 'report_source=%s\n' "${REPORT_SOURCE:-none}"
  printf 'report_html_source=%s\n' "${REPORT_HTML_SOURCE:-none}"
  printf 'report_spec_source_kind=%s\n' "${report_spec_source_kind}"
  printf 'report_spec_source_ref=%s\n' "${report_spec_source_ref}"
  printf 'report_deprecated_total=%s\n' "${report_deprecated_total}"
  printf 'report_deprecated_covered=%s\n' "${report_deprecated_covered}"
  printf 'report_deprecated_uncovered=%s\n' "${report_deprecated_uncovered}"
  printf 'report_deprecated_percent=%s\n' "${report_deprecated_percent}"
  printf 'async_bundle_found=%s\n' "${async_bundle_found}"
  printf 'async_bundle_source=%s\n' "${async_bundle_source}"
  printf 'v1_e2e_bundle_found=%s\n' "${v1_e2e_bundle_found}"
  printf 'v1_e2e_bundle_source=%s\n' "${v1_e2e_bundle_source}"
  printf 'source_paths_note=%s\n' "${SOURCE_PATHS_NOTE_NAME}"
  printf 'destination=%s\n' "${DEST_DIR}"
} > "${manifest_path}"
