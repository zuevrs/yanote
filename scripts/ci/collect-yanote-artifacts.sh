#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="${1:-.yanote-ci/artifacts}"
ASYNC_BUNDLE_SOURCE_DIR=".yanote-ci/live-kafka-proof"
ASYNC_BUNDLE_TARGET_NAME="live-kafka-proof"
V1_E2E_BUNDLE_SOURCE_DIR=".yanote-ci/v1-e2e"
V1_E2E_BUNDLE_TARGET_NAME="v1-e2e"
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

REPORT_SOURCE=""
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

if [[ -n "${REPORT_SOURCE}" ]]; then
  cp "${REPORT_SOURCE}" "${DEST_DIR}/yanote-report.json"
  printf '%s\n' "${REPORT_SOURCE}" > "${DEST_DIR}/yanote-report.source-path.txt"
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

report_found="false"
if [[ -n "${REPORT_SOURCE}" ]]; then
  report_found="true"
fi

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

manifest_path="${DEST_DIR}/artifact-manifest.txt"
{
  printf 'created_at=%s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  printf 'report_found=%s\n' "${report_found}"
  printf 'report_source=%s\n' "${REPORT_SOURCE:-none}"
  printf 'async_bundle_found=%s\n' "${async_bundle_found}"
  printf 'async_bundle_source=%s\n' "${async_bundle_source}"
  printf 'v1_e2e_bundle_found=%s\n' "${v1_e2e_bundle_found}"
  printf 'v1_e2e_bundle_source=%s\n' "${v1_e2e_bundle_source}"
  printf 'destination=%s\n' "${DEST_DIR}"
} > "${manifest_path}"
