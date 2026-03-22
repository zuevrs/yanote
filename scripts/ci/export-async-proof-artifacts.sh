#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="${1:-.yanote-ci/live-kafka-proof}"
PROOF_STATUS="${YANOTE_ASYNC_PROOF_STATUS:-unknown}"
SOURCE_TEMP_DIR="${YANOTE_ASYNC_SOURCE_TEMP_DIR:-none}"
SOURCE_PATHS_NOTE_NAME="artifact-source-paths.txt"
MANIFEST_NAME="artifact-manifest.txt"
SOURCE_PATHS_NOTE_PATH="${DEST_DIR}/${SOURCE_PATHS_NOTE_NAME}"
MANIFEST_PATH="${DEST_DIR}/${MANIFEST_NAME}"

mkdir -p "$(dirname "${DEST_DIR}")"
rm -rf "${DEST_DIR}"
mkdir -p "${DEST_DIR}"

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

copy_or_note() {
  local target_name="$1"
  local source_path="$2"
  local required_on_success="$3"

  if [[ -n "${source_path}" && -f "${source_path}" ]]; then
    cp "${source_path}" "${DEST_DIR}/${target_name}"
    exported_artifacts+=("${target_name}")
    printf '%s=%s\n' "${target_name}" "${source_path}" >> "${SOURCE_PATHS_NOTE_PATH}"
    if [[ "${target_name}" == "yanote-async-report.json" ]]; then
      report_found="true"
      report_source="${source_path}"
    fi
    return 0
  fi

  missing_artifacts+=("${target_name}")
  printf '%s=%s\n' "${target_name}" "none" >> "${SOURCE_PATHS_NOTE_PATH}"

  if [[ "${PROOF_STATUS}" == "success" && "${required_on_success}" == "true" ]]; then
    echo "ERROR: Missing allowlisted async proof artifact for success export: ${target_name}" >&2
    exit 1
  fi
}

report_found="false"
report_source="none"
exported_artifacts=()
missing_artifacts=()

printf 'temp_dir=%s\n' "${SOURCE_TEMP_DIR}" > "${SOURCE_PATHS_NOTE_PATH}"

copy_or_note "single-service-proof.log" "${YANOTE_ASYNC_SOURCE_SINGLE_SERVICE_LOG:-}" "true"
copy_or_note "two-service-test.log" "${YANOTE_ASYNC_SOURCE_TWO_SERVICE_LOG:-}" "true"
copy_or_note "01-producer.events.jsonl" "${YANOTE_ASYNC_SOURCE_PRODUCER_EVENTS:-}" "true"
copy_or_note "02-consumer.events.jsonl" "${YANOTE_ASYNC_SOURCE_CONSUMER_EVENTS:-}" "true"
copy_or_note "merge.log" "${YANOTE_ASYNC_SOURCE_MERGE_LOG:-}" "true"
copy_or_note "merged-two-service.events.jsonl" "${YANOTE_ASYNC_SOURCE_MERGED_EVENTS:-}" "true"
copy_or_note "async-report.stdout" "${YANOTE_ASYNC_SOURCE_ASYNC_STDOUT:-}" "true"
copy_or_note "async-report.stderr" "${YANOTE_ASYNC_SOURCE_ASYNC_STDERR:-}" "true"
copy_or_note "yanote-async-report.json" "${YANOTE_ASYNC_SOURCE_ASYNC_REPORT:-}" "true"
copy_or_note "runtime-selected-async-report.stdout" "${YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_STDOUT:-}" "true"
copy_or_note "runtime-selected-async-report.stderr" "${YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_STDERR:-}" "true"
copy_or_note "runtime-selected-yanote-async-report.json" "${YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_REPORT:-}" "true"
copy_or_note "schema-failure-async-report.stdout" "${YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_STDOUT:-}" "true"
copy_or_note "schema-failure-async-report.stderr" "${YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_STDERR:-}" "true"
copy_or_note "schema-failure-yanote-async-report.json" "${YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_REPORT:-}" "true"

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
  printf 'proof_status=%s\n' "${PROOF_STATUS}"
  printf 'report_found=%s\n' "${report_found}"
  printf 'report_source=%s\n' "${report_source}"
  printf 'artifact_count=%s\n' "${#exported_artifacts[@]}"
  printf 'artifacts=%s\n' "${artifacts_csv}"
  printf 'missing_artifacts=%s\n' "${missing_artifacts_csv}"
  printf 'source_paths_note=%s\n' "${SOURCE_PATHS_NOTE_NAME}"
  printf 'destination=%s\n' "${DEST_DIR}"
} > "${MANIFEST_PATH}"
