#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="${1:-.yanote-ci/artifacts}"
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

report_found="false"
if [[ -n "${REPORT_SOURCE}" ]]; then
  report_found="true"
fi

manifest_path="${DEST_DIR}/artifact-manifest.txt"
{
  printf 'created_at=%s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  printf 'report_found=%s\n' "${report_found}"
  printf 'report_source=%s\n' "${REPORT_SOURCE:-none}"
  printf 'destination=%s\n' "${DEST_DIR}"
} > "${manifest_path}"
