#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="${1:-.yanote-ci/live-kafka-proof}"
PROOF_STATUS="${YANOTE_ASYNC_PROOF_STATUS:-unknown}"
SOURCE_TEMP_DIR="${YANOTE_ASYNC_SOURCE_TEMP_DIR:-none}"
OPTIONAL_ARTIFACTS="${YANOTE_ASYNC_OPTIONAL_ARTIFACTS:-}"
OPTIONAL_ARTIFACTS="${OPTIONAL_ARTIFACTS//[[:space:]]/}"
OPTIONAL_ARTIFACTS_NOTE="${OPTIONAL_ARTIFACTS:-none}"
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

is_optional_artifact() {
  local target_name="$1"
  if [[ -z "${OPTIONAL_ARTIFACTS}" ]]; then
    return 1
  fi

  case ",${OPTIONAL_ARTIFACTS}," in
    *,"${target_name}",*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

extract_async_report_metadata() {
  local report_path="$1"
  python3 - "${report_path}" <<'PY'
import json
import pathlib
import sys

report_path = pathlib.Path(sys.argv[1])
report = json.loads(report_path.read_text(encoding="utf-8"))
spec_source = report.get("specSource") or {}
summary = report.get("summary") or {}
binding_support = (report.get("bindingSupport") or {}).get("summary") or {}
declared_semantics = (report.get("declaredSemantics") or {}).get("summary") or {}
runtime_semantics = (report.get("runtimeSemantics") or {}).get("summary") or {}


def emit(key, value):
    normalized = "none" if value is None else str(value)
    normalized = normalized.replace("\t", " ").replace("\n", " ")
    print(f"{key}\t{normalized}")

emit("spec_source_kind", spec_source.get("kind", "none"))
emit("spec_source_ref", spec_source.get("reference", "none"))
emit("status", report.get("status", "unknown"))
emit("covered_channels", summary.get("coveredChannels", 0))
emit("total_channels", summary.get("totalChannels", 0))
emit("covered_operations", summary.get("coveredOperations", 0))
emit("total_operations", summary.get("totalOperations", 0))
emit("covered_messages", summary.get("coveredMessages", 0))
emit("total_messages", summary.get("totalMessages", 0))
emit("supported_bindings", binding_support.get("supportedBindings", 0))
emit("total_bindings", binding_support.get("totalBindings", 0))
emit("declared_only_bindings", binding_support.get("declaredOnlyBindings", 0))
emit("deferred_bindings", binding_support.get("deferredBindings", 0))
emit("invalid_bindings", binding_support.get("invalidBindings", 0))
emit("binding_total_operations", binding_support.get("totalOperations", 0))
emit("message_correlation_ids", declared_semantics.get("messageCorrelationIds", 0))
emit("operations_with_correlation_id", declared_semantics.get("operationsWithCorrelationId", 0))
emit("operations_with_reply", declared_semantics.get("operationsWithReply", 0))
emit("declared_total_operations", declared_semantics.get("totalOperations", 0))
emit("satisfied_operations", runtime_semantics.get("satisfiedOperations", 0))
emit("runtime_total_operations", runtime_semantics.get("totalOperations", 0))
emit("satisfied_semantics", runtime_semantics.get("satisfiedSemantics", 0))
emit("total_semantics", runtime_semantics.get("totalSemantics", 0))
emit("semantic_coverage_percent", runtime_semantics.get("semanticCoveragePercent", 0))
emit("unsatisfied_operations", runtime_semantics.get("unsatisfiedOperations", 0))
emit("unsatisfied_semantics", runtime_semantics.get("unsatisfiedSemantics", 0))
PY
}

copy_or_note() {
  local target_name="$1"
  local source_path="$2"
  local required_on_success="$3"

  if [[ -n "${source_path}" && -f "${source_path}" ]]; then
    cp "${source_path}" "${DEST_DIR}/${target_name}"
    exported_artifacts+=("${target_name}")
    printf '%s=%s\n' "${target_name}" "${source_path}" >> "${SOURCE_PATHS_NOTE_PATH}"
    case "${target_name}" in
      yanote-async-report.json)
        report_found="true"
        report_source="${source_path}"
        ;;
      yanote-async-report.html)
        report_html_found="true"
        report_html_source="${source_path}"
        ;;
      runtime-selected-yanote-async-report.json)
        runtime_selected_report_found="true"
        runtime_selected_report_source="${source_path}"
        ;;
      runtime-selected-yanote-async-report.html)
        runtime_selected_report_html_found="true"
        runtime_selected_report_html_source="${source_path}"
        ;;
      schema-failure-yanote-async-report.json)
        schema_failure_report_found="true"
        schema_failure_report_source="${source_path}"
        ;;
      schema-failure-yanote-async-report.html)
        schema_failure_report_html_found="true"
        schema_failure_report_html_source="${source_path}"
        ;;
    esac
    return 0
  fi

  missing_artifacts+=("${target_name}")
  printf '%s=%s\n' "${target_name}" "none" >> "${SOURCE_PATHS_NOTE_PATH}"

  if [[ "${PROOF_STATUS}" == "success" && "${required_on_success}" == "true" ]] && ! is_optional_artifact "${target_name}"; then
    echo "ERROR: Missing allowlisted async proof artifact for success export: ${target_name}" >&2
    exit 1
  fi
}

report_found="false"
report_source="none"
report_html_found="false"
report_html_source="none"
runtime_selected_report_found="false"
runtime_selected_report_source="none"
runtime_selected_report_html_found="false"
runtime_selected_report_html_source="none"
schema_failure_report_found="false"
schema_failure_report_source="none"
schema_failure_report_html_found="false"
schema_failure_report_html_source="none"
report_spec_source_kind="none"
report_spec_source_ref="none"
report_status="unknown"
report_covered_channels="0"
report_total_channels="0"
report_covered_operations="0"
report_total_operations="0"
report_covered_messages="0"
report_total_messages="0"
report_supported_bindings="0"
report_total_bindings="0"
report_declared_only_bindings="0"
report_deferred_bindings="0"
report_invalid_bindings="0"
report_binding_total_operations="0"
report_message_correlation_ids="0"
report_operations_with_correlation_id="0"
report_operations_with_reply="0"
report_declared_total_operations="0"
report_satisfied_operations="0"
report_runtime_total_operations="0"
report_satisfied_semantics="0"
report_total_semantics="0"
report_semantic_coverage_percent="0"
report_unsatisfied_operations="0"
report_unsatisfied_semantics="0"
exported_artifacts=()
missing_artifacts=()

printf 'temp_dir=%s\n' "${SOURCE_TEMP_DIR}" > "${SOURCE_PATHS_NOTE_PATH}"
printf 'optional_artifacts=%s\n' "${OPTIONAL_ARTIFACTS_NOTE}" >> "${SOURCE_PATHS_NOTE_PATH}"

copy_or_note "single-service-proof.log" "${YANOTE_ASYNC_SOURCE_SINGLE_SERVICE_LOG:-}" "true"
copy_or_note "two-service-test.log" "${YANOTE_ASYNC_SOURCE_TWO_SERVICE_LOG:-}" "true"
copy_or_note "01-producer.events.jsonl" "${YANOTE_ASYNC_SOURCE_PRODUCER_EVENTS:-}" "true"
copy_or_note "02-consumer.events.jsonl" "${YANOTE_ASYNC_SOURCE_CONSUMER_EVENTS:-}" "true"
copy_or_note "merge.log" "${YANOTE_ASYNC_SOURCE_MERGE_LOG:-}" "true"
copy_or_note "merged-two-service.events.jsonl" "${YANOTE_ASYNC_SOURCE_MERGED_EVENTS:-}" "true"
copy_or_note "async-report.stdout" "${YANOTE_ASYNC_SOURCE_ASYNC_STDOUT:-}" "true"
copy_or_note "async-report.stderr" "${YANOTE_ASYNC_SOURCE_ASYNC_STDERR:-}" "true"
copy_or_note "yanote-async-report.json" "${YANOTE_ASYNC_SOURCE_ASYNC_REPORT:-}" "true"
copy_or_note "yanote-async-report.html" "${YANOTE_ASYNC_SOURCE_ASYNC_REPORT_HTML:-}" "true"
copy_or_note "runtime-selected-async-report.stdout" "${YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_STDOUT:-}" "true"
copy_or_note "runtime-selected-async-report.stderr" "${YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_STDERR:-}" "true"
copy_or_note "runtime-selected-yanote-async-report.json" "${YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_REPORT:-}" "true"
copy_or_note "runtime-selected-yanote-async-report.html" "${YANOTE_ASYNC_SOURCE_RUNTIME_SELECTED_ASYNC_REPORT_HTML:-}" "true"
copy_or_note "schema-failure-async-report.stdout" "${YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_STDOUT:-}" "true"
copy_or_note "schema-failure-async-report.stderr" "${YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_STDERR:-}" "true"
copy_or_note "schema-failure-yanote-async-report.json" "${YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_REPORT:-}" "true"
copy_or_note "schema-failure-yanote-async-report.html" "${YANOTE_ASYNC_SOURCE_SCHEMA_FAILURE_ASYNC_REPORT_HTML:-}" "true"

if [[ "${report_found}" == "true" ]]; then
  while IFS=$'\t' read -r key value; do
    case "${key}" in
      spec_source_kind)
        report_spec_source_kind="${value}"
        ;;
      spec_source_ref)
        report_spec_source_ref="${value}"
        ;;
      status)
        report_status="${value}"
        ;;
      covered_channels)
        report_covered_channels="${value}"
        ;;
      total_channels)
        report_total_channels="${value}"
        ;;
      covered_operations)
        report_covered_operations="${value}"
        ;;
      total_operations)
        report_total_operations="${value}"
        ;;
      covered_messages)
        report_covered_messages="${value}"
        ;;
      total_messages)
        report_total_messages="${value}"
        ;;
      supported_bindings)
        report_supported_bindings="${value}"
        ;;
      total_bindings)
        report_total_bindings="${value}"
        ;;
      declared_only_bindings)
        report_declared_only_bindings="${value}"
        ;;
      deferred_bindings)
        report_deferred_bindings="${value}"
        ;;
      invalid_bindings)
        report_invalid_bindings="${value}"
        ;;
      binding_total_operations)
        report_binding_total_operations="${value}"
        ;;
      message_correlation_ids)
        report_message_correlation_ids="${value}"
        ;;
      operations_with_correlation_id)
        report_operations_with_correlation_id="${value}"
        ;;
      operations_with_reply)
        report_operations_with_reply="${value}"
        ;;
      declared_total_operations)
        report_declared_total_operations="${value}"
        ;;
      satisfied_operations)
        report_satisfied_operations="${value}"
        ;;
      runtime_total_operations)
        report_runtime_total_operations="${value}"
        ;;
      satisfied_semantics)
        report_satisfied_semantics="${value}"
        ;;
      total_semantics)
        report_total_semantics="${value}"
        ;;
      semantic_coverage_percent)
        report_semantic_coverage_percent="${value}"
        ;;
      unsatisfied_operations)
        report_unsatisfied_operations="${value}"
        ;;
      unsatisfied_semantics)
        report_unsatisfied_semantics="${value}"
        ;;
    esac
  done < <(extract_async_report_metadata "${report_source}")
fi

printf 'report_spec_source_kind=%s\n' "${report_spec_source_kind}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_spec_source_ref=%s\n' "${report_spec_source_ref}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_status=%s\n' "${report_status}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_channels=%s/%s\n' "${report_covered_channels}" "${report_total_channels}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_operations=%s/%s\n' "${report_covered_operations}" "${report_total_operations}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_messages=%s/%s\n' "${report_covered_messages}" "${report_total_messages}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_supported_bindings=%s/%s\n' "${report_supported_bindings}" "${report_total_bindings}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_declared_only_bindings=%s\n' "${report_declared_only_bindings}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_deferred_bindings=%s\n' "${report_deferred_bindings}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_invalid_bindings=%s\n' "${report_invalid_bindings}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_binding_total_operations=%s\n' "${report_binding_total_operations}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_message_correlation_ids=%s\n' "${report_message_correlation_ids}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_operations_with_correlation_id=%s/%s\n' "${report_operations_with_correlation_id}" "${report_declared_total_operations}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_operations_with_reply=%s/%s\n' "${report_operations_with_reply}" "${report_declared_total_operations}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_runtime_satisfied_operations=%s/%s\n' "${report_satisfied_operations}" "${report_runtime_total_operations}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_runtime_satisfied_semantics=%s/%s\n' "${report_satisfied_semantics}" "${report_total_semantics}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_runtime_unsatisfied_operations=%s\n' "${report_unsatisfied_operations}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_runtime_unsatisfied_semantics=%s\n' "${report_unsatisfied_semantics}" >> "${SOURCE_PATHS_NOTE_PATH}"
printf 'report_runtime_semantic_coverage_percent=%s\n' "${report_semantic_coverage_percent}" >> "${SOURCE_PATHS_NOTE_PATH}"

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
  printf 'optional_artifacts=%s\n' "${OPTIONAL_ARTIFACTS_NOTE}"
  printf 'report_found=%s\n' "${report_found}"
  printf 'report_source=%s\n' "${report_source}"
  printf 'report_html_found=%s\n' "${report_html_found}"
  printf 'report_html_source=%s\n' "${report_html_source}"
  printf 'runtime_selected_report_found=%s\n' "${runtime_selected_report_found}"
  printf 'runtime_selected_report_source=%s\n' "${runtime_selected_report_source}"
  printf 'runtime_selected_report_html_found=%s\n' "${runtime_selected_report_html_found}"
  printf 'runtime_selected_report_html_source=%s\n' "${runtime_selected_report_html_source}"
  printf 'schema_failure_report_found=%s\n' "${schema_failure_report_found}"
  printf 'schema_failure_report_source=%s\n' "${schema_failure_report_source}"
  printf 'schema_failure_report_html_found=%s\n' "${schema_failure_report_html_found}"
  printf 'schema_failure_report_html_source=%s\n' "${schema_failure_report_html_source}"
  printf 'report_spec_source_kind=%s\n' "${report_spec_source_kind}"
  printf 'report_spec_source_ref=%s\n' "${report_spec_source_ref}"
  printf 'report_status=%s\n' "${report_status}"
  printf 'report_channels=%s/%s\n' "${report_covered_channels}" "${report_total_channels}"
  printf 'report_operations=%s/%s\n' "${report_covered_operations}" "${report_total_operations}"
  printf 'report_messages=%s/%s\n' "${report_covered_messages}" "${report_total_messages}"
  printf 'report_supported_bindings=%s/%s\n' "${report_supported_bindings}" "${report_total_bindings}"
  printf 'report_declared_only_bindings=%s\n' "${report_declared_only_bindings}"
  printf 'report_deferred_bindings=%s\n' "${report_deferred_bindings}"
  printf 'report_invalid_bindings=%s\n' "${report_invalid_bindings}"
  printf 'report_binding_total_operations=%s\n' "${report_binding_total_operations}"
  printf 'report_message_correlation_ids=%s\n' "${report_message_correlation_ids}"
  printf 'report_operations_with_correlation_id=%s/%s\n' "${report_operations_with_correlation_id}" "${report_declared_total_operations}"
  printf 'report_operations_with_reply=%s/%s\n' "${report_operations_with_reply}" "${report_declared_total_operations}"
  printf 'report_runtime_satisfied_operations=%s/%s\n' "${report_satisfied_operations}" "${report_runtime_total_operations}"
  printf 'report_runtime_satisfied_semantics=%s/%s\n' "${report_satisfied_semantics}" "${report_total_semantics}"
  printf 'report_runtime_unsatisfied_operations=%s\n' "${report_unsatisfied_operations}"
  printf 'report_runtime_unsatisfied_semantics=%s\n' "${report_unsatisfied_semantics}"
  printf 'report_runtime_semantic_coverage_percent=%s\n' "${report_semantic_coverage_percent}"
  printf 'artifact_count=%s\n' "${#exported_artifacts[@]}"
  printf 'artifacts=%s\n' "${artifacts_csv}"
  printf 'missing_artifacts=%s\n' "${missing_artifacts_csv}"
  printf 'source_paths_note=%s\n' "${SOURCE_PATHS_NOTE_NAME}"
  printf 'destination=%s\n' "${DEST_DIR}"
} > "${MANIFEST_PATH}"
