#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="${1:-.yanote-ci/artifacts}"
KAFKA_BUNDLE_SOURCE_DIR=".yanote-ci/live-kafka-proof"
KAFKA_BUNDLE_TARGET_NAME="live-kafka-proof"
RABBITMQ_BUNDLE_SOURCE_DIR=".yanote-ci/live-rabbitmq-proof"
RABBITMQ_BUNDLE_TARGET_NAME="live-rabbitmq-proof"
COMBINED_BUNDLE_SOURCE_DIR=".tmp/m015-s03-combined-proof"
COMBINED_BUNDLE_TARGET_NAME="combined-proof"
V1_E2E_BUNDLE_SOURCE_DIR=".yanote-ci/v1-e2e"
V1_E2E_BUNDLE_TARGET_NAME="v1-e2e"
SOURCE_PATHS_NOTE_NAME="artifact-source-paths.txt"
SOURCE_PATHS_NOTE_PATH="${DEST_DIR}/${SOURCE_PATHS_NOTE_NAME}"

mkdir -p "$(dirname "${DEST_DIR}")"
rm -rf "${DEST_DIR}"
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

read_manifest_value() {
  local manifest_path="$1"
  local key="$2"
  local default_value="$3"

  if [[ ! -f "${manifest_path}" ]]; then
    printf '%s' "${default_value}"
    return 0
  fi

  local line
  while IFS= read -r line || [[ -n "${line}" ]]; do
    if [[ "${line}" == "${key}="* ]]; then
      printf '%s' "${line#*=}"
      return 0
    fi
  done < "${manifest_path}"

  printf '%s' "${default_value}"
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
protocols = report.get("protocols") or []
if not isinstance(protocols, list):
    protocols = []


def emit(key, value):
    normalized = "none" if value is None else str(value)
    normalized = normalized.replace("\t", " ").replace("\n", " ")
    print(f"{key}\t{normalized}")

emit("spec_source_kind", spec_source.get("kind", "none"))
emit("spec_source_ref", spec_source.get("reference", "none"))
emit("status", report.get("status", "unknown"))
emit("protocols", ",".join(str(item) for item in protocols) or "none")
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

extract_combined_report_metadata() {
  local report_path="$1"
  python3 - "${report_path}" <<'PY'
import json
import pathlib
import sys

report_path = pathlib.Path(sys.argv[1])
report = json.loads(report_path.read_text(encoding="utf-8"))
http_child = (report.get("children") or {}).get("http") or {}
async_child = (report.get("children") or {}).get("async") or {}
async_summary = async_child.get("summary") or {}
protocols = async_summary.get("protocols") or []
if not isinstance(protocols, list):
    protocols = []


def artifact_path(child, kind):
    for artifact in ((child.get("provenance") or {}).get("artifacts") or []):
        if artifact.get("kind") == kind:
            return artifact.get("path", "none")
    return "none"


def emit(key, value):
    normalized = "none" if value is None else str(value)
    normalized = normalized.replace("\t", " ").replace("\n", " ")
    print(f"{key}\t{normalized}")

emit("status", report.get("status", "unknown"))
emit("http_status", http_child.get("status", "unknown"))
emit("async_status", async_child.get("status", "unknown"))
emit("async_protocols", ",".join(str(item) for item in protocols) or "none")
emit("http_json", artifact_path(http_child, "json"))
emit("http_html", artifact_path(http_child, "html"))
emit("async_json", artifact_path(async_child, "json"))
emit("async_html", artifact_path(async_child, "html"))
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

kafka_bundle_found="false"
kafka_bundle_source="none"
kafka_bundle_manifest_source="none"
kafka_bundle_source_paths_source="none"
kafka_bundle_proof_status="none"
kafka_bundle_report_found="false"
kafka_bundle_report_html_found="false"
kafka_bundle_runtime_selected_report_found="false"
kafka_bundle_runtime_selected_report_html_found="false"
kafka_bundle_schema_failure_report_found="false"
kafka_bundle_schema_failure_report_html_found="false"
kafka_bundle_report_status="unknown"
kafka_bundle_report_protocols="none"
kafka_bundle_report_channels="0/0"
kafka_bundle_report_operations="0/0"
kafka_bundle_report_messages="0/0"
kafka_bundle_report_supported_bindings="0/0"
kafka_bundle_report_declared_only_bindings="0"
kafka_bundle_report_deferred_bindings="0"
kafka_bundle_report_invalid_bindings="0"
kafka_bundle_report_binding_total_operations="0"
kafka_bundle_report_message_correlation_ids="0"
kafka_bundle_report_operations_with_correlation_id="0/0"
kafka_bundle_report_operations_with_reply="0/0"
kafka_bundle_report_runtime_satisfied_operations="0/0"
kafka_bundle_report_runtime_satisfied_semantics="0/0"
kafka_bundle_report_runtime_unsatisfied_operations="0"
kafka_bundle_report_runtime_unsatisfied_semantics="0"
kafka_bundle_report_runtime_semantic_coverage_percent="0"

if copy_directory_if_exists "${KAFKA_BUNDLE_SOURCE_DIR}" "${KAFKA_BUNDLE_TARGET_NAME}"; then
  kafka_bundle_found="true"
  kafka_bundle_source="${KAFKA_BUNDLE_SOURCE_DIR}"
  kafka_bundle_manifest_source="${KAFKA_BUNDLE_SOURCE_DIR}/artifact-manifest.txt"
  kafka_bundle_source_paths_source="${KAFKA_BUNDLE_SOURCE_DIR}/artifact-source-paths.txt"

  copied_kafka_manifest="${DEST_DIR}/${KAFKA_BUNDLE_TARGET_NAME}/artifact-manifest.txt"
  copied_kafka_report="${DEST_DIR}/${KAFKA_BUNDLE_TARGET_NAME}/yanote-async-report.json"

  kafka_bundle_proof_status="$(read_manifest_value "${copied_kafka_manifest}" proof_status "none")"
  kafka_bundle_report_found="$(read_manifest_value "${copied_kafka_manifest}" report_found "false")"
  kafka_bundle_report_html_found="$(read_manifest_value "${copied_kafka_manifest}" report_html_found "false")"
  kafka_bundle_runtime_selected_report_found="$(read_manifest_value "${copied_kafka_manifest}" runtime_selected_report_found "false")"
  kafka_bundle_runtime_selected_report_html_found="$(read_manifest_value "${copied_kafka_manifest}" runtime_selected_report_html_found "false")"
  kafka_bundle_schema_failure_report_found="$(read_manifest_value "${copied_kafka_manifest}" schema_failure_report_found "false")"
  kafka_bundle_schema_failure_report_html_found="$(read_manifest_value "${copied_kafka_manifest}" schema_failure_report_html_found "false")"
  kafka_bundle_report_status="$(read_manifest_value "${copied_kafka_manifest}" report_status "unknown")"
  kafka_bundle_report_channels="$(read_manifest_value "${copied_kafka_manifest}" report_channels "0/0")"
  kafka_bundle_report_operations="$(read_manifest_value "${copied_kafka_manifest}" report_operations "0/0")"
  kafka_bundle_report_messages="$(read_manifest_value "${copied_kafka_manifest}" report_messages "0/0")"
  kafka_bundle_report_supported_bindings="$(read_manifest_value "${copied_kafka_manifest}" report_supported_bindings "0/0")"
  kafka_bundle_report_declared_only_bindings="$(read_manifest_value "${copied_kafka_manifest}" report_declared_only_bindings "0")"
  kafka_bundle_report_deferred_bindings="$(read_manifest_value "${copied_kafka_manifest}" report_deferred_bindings "0")"
  kafka_bundle_report_invalid_bindings="$(read_manifest_value "${copied_kafka_manifest}" report_invalid_bindings "0")"
  kafka_bundle_report_binding_total_operations="$(read_manifest_value "${copied_kafka_manifest}" report_binding_total_operations "0")"
  kafka_bundle_report_message_correlation_ids="$(read_manifest_value "${copied_kafka_manifest}" report_message_correlation_ids "0")"
  kafka_bundle_report_operations_with_correlation_id="$(read_manifest_value "${copied_kafka_manifest}" report_operations_with_correlation_id "0/0")"
  kafka_bundle_report_operations_with_reply="$(read_manifest_value "${copied_kafka_manifest}" report_operations_with_reply "0/0")"
  kafka_bundle_report_runtime_satisfied_operations="$(read_manifest_value "${copied_kafka_manifest}" report_runtime_satisfied_operations "0/0")"
  kafka_bundle_report_runtime_satisfied_semantics="$(read_manifest_value "${copied_kafka_manifest}" report_runtime_satisfied_semantics "0/0")"
  kafka_bundle_report_runtime_unsatisfied_operations="$(read_manifest_value "${copied_kafka_manifest}" report_runtime_unsatisfied_operations "0")"
  kafka_bundle_report_runtime_unsatisfied_semantics="$(read_manifest_value "${copied_kafka_manifest}" report_runtime_unsatisfied_semantics "0")"
  kafka_bundle_report_runtime_semantic_coverage_percent="$(read_manifest_value "${copied_kafka_manifest}" report_runtime_semantic_coverage_percent "0")"

  if [[ -f "${copied_kafka_report}" ]]; then
    while IFS=$'\t' read -r key value; do
      case "${key}" in
        protocols)
          kafka_bundle_report_protocols="${value}"
          ;;
      esac
    done < <(extract_async_report_metadata "${copied_kafka_report}")
  fi
fi

rabbitmq_bundle_found="false"
rabbitmq_bundle_source="none"
rabbitmq_bundle_manifest_source="none"
rabbitmq_bundle_source_paths_source="none"
rabbitmq_bundle_proof_status="none"
rabbitmq_bundle_report_found="false"
rabbitmq_bundle_report_html_found="false"
rabbitmq_bundle_runtime_selected_report_found="false"
rabbitmq_bundle_runtime_selected_report_html_found="false"
rabbitmq_bundle_schema_failure_report_found="false"
rabbitmq_bundle_schema_failure_report_html_found="false"
rabbitmq_bundle_report_status="unknown"
rabbitmq_bundle_report_protocols="none"
rabbitmq_bundle_report_channels="0/0"
rabbitmq_bundle_report_operations="0/0"
rabbitmq_bundle_report_messages="0/0"
rabbitmq_bundle_report_supported_bindings="0/0"
rabbitmq_bundle_report_declared_only_bindings="0"
rabbitmq_bundle_report_deferred_bindings="0"
rabbitmq_bundle_report_invalid_bindings="0"
rabbitmq_bundle_report_binding_total_operations="0"
rabbitmq_bundle_report_message_correlation_ids="0"
rabbitmq_bundle_report_operations_with_correlation_id="0/0"
rabbitmq_bundle_report_operations_with_reply="0/0"
rabbitmq_bundle_report_runtime_satisfied_operations="0/0"
rabbitmq_bundle_report_runtime_satisfied_semantics="0/0"
rabbitmq_bundle_report_runtime_unsatisfied_operations="0"
rabbitmq_bundle_report_runtime_unsatisfied_semantics="0"
rabbitmq_bundle_report_runtime_semantic_coverage_percent="0"

if copy_directory_if_exists "${RABBITMQ_BUNDLE_SOURCE_DIR}" "${RABBITMQ_BUNDLE_TARGET_NAME}"; then
  rabbitmq_bundle_found="true"
  rabbitmq_bundle_source="${RABBITMQ_BUNDLE_SOURCE_DIR}"
  rabbitmq_bundle_manifest_source="${RABBITMQ_BUNDLE_SOURCE_DIR}/artifact-manifest.txt"
  rabbitmq_bundle_source_paths_source="${RABBITMQ_BUNDLE_SOURCE_DIR}/artifact-source-paths.txt"

  copied_rabbitmq_manifest="${DEST_DIR}/${RABBITMQ_BUNDLE_TARGET_NAME}/artifact-manifest.txt"
  copied_rabbitmq_report="${DEST_DIR}/${RABBITMQ_BUNDLE_TARGET_NAME}/yanote-async-report.json"

  rabbitmq_bundle_proof_status="$(read_manifest_value "${copied_rabbitmq_manifest}" proof_status "none")"
  rabbitmq_bundle_report_found="$(read_manifest_value "${copied_rabbitmq_manifest}" report_found "false")"
  rabbitmq_bundle_report_html_found="$(read_manifest_value "${copied_rabbitmq_manifest}" report_html_found "false")"
  rabbitmq_bundle_runtime_selected_report_found="$(read_manifest_value "${copied_rabbitmq_manifest}" runtime_selected_report_found "false")"
  rabbitmq_bundle_runtime_selected_report_html_found="$(read_manifest_value "${copied_rabbitmq_manifest}" runtime_selected_report_html_found "false")"
  rabbitmq_bundle_schema_failure_report_found="$(read_manifest_value "${copied_rabbitmq_manifest}" schema_failure_report_found "false")"
  rabbitmq_bundle_schema_failure_report_html_found="$(read_manifest_value "${copied_rabbitmq_manifest}" schema_failure_report_html_found "false")"
  rabbitmq_bundle_report_status="$(read_manifest_value "${copied_rabbitmq_manifest}" report_status "unknown")"
  rabbitmq_bundle_report_channels="$(read_manifest_value "${copied_rabbitmq_manifest}" report_channels "0/0")"
  rabbitmq_bundle_report_operations="$(read_manifest_value "${copied_rabbitmq_manifest}" report_operations "0/0")"
  rabbitmq_bundle_report_messages="$(read_manifest_value "${copied_rabbitmq_manifest}" report_messages "0/0")"
  rabbitmq_bundle_report_supported_bindings="$(read_manifest_value "${copied_rabbitmq_manifest}" report_supported_bindings "0/0")"
  rabbitmq_bundle_report_declared_only_bindings="$(read_manifest_value "${copied_rabbitmq_manifest}" report_declared_only_bindings "0")"
  rabbitmq_bundle_report_deferred_bindings="$(read_manifest_value "${copied_rabbitmq_manifest}" report_deferred_bindings "0")"
  rabbitmq_bundle_report_invalid_bindings="$(read_manifest_value "${copied_rabbitmq_manifest}" report_invalid_bindings "0")"
  rabbitmq_bundle_report_binding_total_operations="$(read_manifest_value "${copied_rabbitmq_manifest}" report_binding_total_operations "0")"
  rabbitmq_bundle_report_message_correlation_ids="$(read_manifest_value "${copied_rabbitmq_manifest}" report_message_correlation_ids "0")"
  rabbitmq_bundle_report_operations_with_correlation_id="$(read_manifest_value "${copied_rabbitmq_manifest}" report_operations_with_correlation_id "0/0")"
  rabbitmq_bundle_report_operations_with_reply="$(read_manifest_value "${copied_rabbitmq_manifest}" report_operations_with_reply "0/0")"
  rabbitmq_bundle_report_runtime_satisfied_operations="$(read_manifest_value "${copied_rabbitmq_manifest}" report_runtime_satisfied_operations "0/0")"
  rabbitmq_bundle_report_runtime_satisfied_semantics="$(read_manifest_value "${copied_rabbitmq_manifest}" report_runtime_satisfied_semantics "0/0")"
  rabbitmq_bundle_report_runtime_unsatisfied_operations="$(read_manifest_value "${copied_rabbitmq_manifest}" report_runtime_unsatisfied_operations "0")"
  rabbitmq_bundle_report_runtime_unsatisfied_semantics="$(read_manifest_value "${copied_rabbitmq_manifest}" report_runtime_unsatisfied_semantics "0")"
  rabbitmq_bundle_report_runtime_semantic_coverage_percent="$(read_manifest_value "${copied_rabbitmq_manifest}" report_runtime_semantic_coverage_percent "0")"

  if [[ -f "${copied_rabbitmq_report}" ]]; then
    while IFS=$'\t' read -r key value; do
      case "${key}" in
        protocols)
          rabbitmq_bundle_report_protocols="${value}"
          ;;
      esac
    done < <(extract_async_report_metadata "${copied_rabbitmq_report}")
  fi
fi

combined_bundle_found="false"
combined_bundle_source="none"
combined_bundle_manifest_source="none"
combined_bundle_source_paths_source="none"
combined_bundle_report_found="false"
combined_bundle_report_html_found="false"
combined_bundle_status="unknown"
combined_bundle_http_status="unknown"
combined_bundle_async_status="unknown"
combined_bundle_async_protocols="none"
combined_bundle_report_json_path="none"
combined_bundle_report_html_path="none"
combined_bundle_http_child_json_path="none"
combined_bundle_http_child_html_path="none"
combined_bundle_async_child_json_path="none"
combined_bundle_async_child_html_path="none"

if copy_directory_if_exists "${COMBINED_BUNDLE_SOURCE_DIR}" "${COMBINED_BUNDLE_TARGET_NAME}"; then
  combined_bundle_found="true"
  combined_bundle_source="${COMBINED_BUNDLE_SOURCE_DIR}"
  combined_bundle_manifest_source="${COMBINED_BUNDLE_SOURCE_DIR}/artifact-manifest.txt"
  combined_bundle_source_paths_source="${COMBINED_BUNDLE_SOURCE_DIR}/artifact-source-paths.txt"

  copied_combined_manifest="${DEST_DIR}/${COMBINED_BUNDLE_TARGET_NAME}/artifact-manifest.txt"
  copied_combined_report="${DEST_DIR}/${COMBINED_BUNDLE_TARGET_NAME}/combined-report/out/yanote-combined-report.json"
  copied_combined_report_html="${DEST_DIR}/${COMBINED_BUNDLE_TARGET_NAME}/combined-report/out/yanote-combined-report.html"

  if [[ -f "${copied_combined_report}" ]]; then
    combined_bundle_report_found="true"
  fi
  if [[ -f "${copied_combined_report_html}" ]]; then
    combined_bundle_report_html_found="true"
  fi

  combined_bundle_status="$(read_manifest_value "${copied_combined_manifest}" combined_status "unknown")"
  combined_bundle_async_protocols="$(read_manifest_value "${copied_combined_manifest}" combined_async_protocols "none")"
  combined_bundle_report_json_path="$(read_manifest_value "${copied_combined_manifest}" combined_report_json "none")"
  combined_bundle_report_html_path="$(read_manifest_value "${copied_combined_manifest}" combined_report_html "none")"
  combined_bundle_http_child_json_path="$(read_manifest_value "${copied_combined_manifest}" http_report_json "none")"
  combined_bundle_http_child_html_path="$(read_manifest_value "${copied_combined_manifest}" http_report_html "none")"
  combined_bundle_async_child_json_path="$(read_manifest_value "${copied_combined_manifest}" retained_async_report "none")"
  combined_bundle_async_child_html_path="$(read_manifest_value "${copied_combined_manifest}" retained_async_html "none")"

  if [[ -f "${copied_combined_report}" ]]; then
    while IFS=$'\t' read -r key value; do
      case "${key}" in
        status)
          combined_bundle_status="${value}"
          ;;
        http_status)
          combined_bundle_http_status="${value}"
          ;;
        async_status)
          combined_bundle_async_status="${value}"
          ;;
        async_protocols)
          combined_bundle_async_protocols="${value}"
          ;;
        http_json)
          combined_bundle_http_child_json_path="${value}"
          ;;
        http_html)
          combined_bundle_http_child_html_path="${value}"
          ;;
        async_json)
          combined_bundle_async_child_json_path="${value}"
          ;;
        async_html)
          combined_bundle_async_child_html_path="${value}"
          ;;
      esac
    done < <(extract_combined_report_metadata "${copied_combined_report}")
  fi
fi

v1_e2e_bundle_found="false"
v1_e2e_bundle_source="none"
if copy_directory_if_exists "${V1_E2E_BUNDLE_SOURCE_DIR}" "${V1_E2E_BUNDLE_TARGET_NAME}"; then
  v1_e2e_bundle_found="true"
  v1_e2e_bundle_source="${V1_E2E_BUNDLE_SOURCE_DIR}"
fi

async_bundle_found="${kafka_bundle_found}"
async_bundle_source="${kafka_bundle_source}"
async_bundle_manifest_source="${kafka_bundle_manifest_source}"
async_bundle_source_paths_source="${kafka_bundle_source_paths_source}"
async_bundle_proof_status="${kafka_bundle_proof_status}"
async_bundle_report_found="${kafka_bundle_report_found}"
async_bundle_report_html_found="${kafka_bundle_report_html_found}"
async_bundle_runtime_selected_report_found="${kafka_bundle_runtime_selected_report_found}"
async_bundle_runtime_selected_report_html_found="${kafka_bundle_runtime_selected_report_html_found}"
async_bundle_schema_failure_report_found="${kafka_bundle_schema_failure_report_found}"
async_bundle_schema_failure_report_html_found="${kafka_bundle_schema_failure_report_html_found}"
async_bundle_report_status="${kafka_bundle_report_status}"
async_bundle_report_protocols="${kafka_bundle_report_protocols}"
async_bundle_report_channels="${kafka_bundle_report_channels}"
async_bundle_report_operations="${kafka_bundle_report_operations}"
async_bundle_report_messages="${kafka_bundle_report_messages}"
async_bundle_report_supported_bindings="${kafka_bundle_report_supported_bindings}"
async_bundle_report_declared_only_bindings="${kafka_bundle_report_declared_only_bindings}"
async_bundle_report_deferred_bindings="${kafka_bundle_report_deferred_bindings}"
async_bundle_report_invalid_bindings="${kafka_bundle_report_invalid_bindings}"
async_bundle_report_binding_total_operations="${kafka_bundle_report_binding_total_operations}"
async_bundle_report_message_correlation_ids="${kafka_bundle_report_message_correlation_ids}"
async_bundle_report_operations_with_correlation_id="${kafka_bundle_report_operations_with_correlation_id}"
async_bundle_report_operations_with_reply="${kafka_bundle_report_operations_with_reply}"
async_bundle_report_runtime_satisfied_operations="${kafka_bundle_report_runtime_satisfied_operations}"
async_bundle_report_runtime_satisfied_semantics="${kafka_bundle_report_runtime_satisfied_semantics}"
async_bundle_report_runtime_unsatisfied_operations="${kafka_bundle_report_runtime_unsatisfied_operations}"
async_bundle_report_runtime_unsatisfied_semantics="${kafka_bundle_report_runtime_unsatisfied_semantics}"
async_bundle_report_runtime_semantic_coverage_percent="${kafka_bundle_report_runtime_semantic_coverage_percent}"

{
  printf 'yanote-report.json=%s\n' "${REPORT_SOURCE:-none}"
  printf 'yanote-report.html=%s\n' "${REPORT_HTML_SOURCE:-none}"
  printf 'report_spec_source_kind=%s\n' "${report_spec_source_kind}"
  printf 'report_spec_source_ref=%s\n' "${report_spec_source_ref}"
  printf 'report_deprecated_total=%s\n' "${report_deprecated_total}"
  printf 'report_deprecated_covered=%s\n' "${report_deprecated_covered}"
  printf 'report_deprecated_uncovered=%s\n' "${report_deprecated_uncovered}"
  printf 'report_deprecated_percent=%s\n' "${report_deprecated_percent}"
  printf 'live-kafka-proof=%s\n' "${kafka_bundle_source}"
  printf 'live-kafka-proof-manifest=%s\n' "${kafka_bundle_manifest_source}"
  printf 'live-kafka-proof-source-paths=%s\n' "${kafka_bundle_source_paths_source}"
  printf 'live-kafka-proof-report-protocols=%s\n' "${kafka_bundle_report_protocols}"
  printf 'live-rabbitmq-proof=%s\n' "${rabbitmq_bundle_source}"
  printf 'live-rabbitmq-proof-manifest=%s\n' "${rabbitmq_bundle_manifest_source}"
  printf 'live-rabbitmq-proof-source-paths=%s\n' "${rabbitmq_bundle_source_paths_source}"
  printf 'live-rabbitmq-proof-report-protocols=%s\n' "${rabbitmq_bundle_report_protocols}"
  printf 'combined-proof=%s\n' "${combined_bundle_source}"
  printf 'combined-proof-manifest=%s\n' "${combined_bundle_manifest_source}"
  printf 'combined-proof-source-paths=%s\n' "${combined_bundle_source_paths_source}"
  printf 'combined-proof-async-protocols=%s\n' "${combined_bundle_async_protocols}"
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
  printf 'async_bundle_manifest_source=%s\n' "${async_bundle_manifest_source}"
  printf 'async_bundle_source_paths_source=%s\n' "${async_bundle_source_paths_source}"
  printf 'async_bundle_proof_status=%s\n' "${async_bundle_proof_status}"
  printf 'async_bundle_report_found=%s\n' "${async_bundle_report_found}"
  printf 'async_bundle_report_html_found=%s\n' "${async_bundle_report_html_found}"
  printf 'async_bundle_runtime_selected_report_found=%s\n' "${async_bundle_runtime_selected_report_found}"
  printf 'async_bundle_runtime_selected_report_html_found=%s\n' "${async_bundle_runtime_selected_report_html_found}"
  printf 'async_bundle_schema_failure_report_found=%s\n' "${async_bundle_schema_failure_report_found}"
  printf 'async_bundle_schema_failure_report_html_found=%s\n' "${async_bundle_schema_failure_report_html_found}"
  printf 'async_bundle_report_status=%s\n' "${async_bundle_report_status}"
  printf 'async_bundle_report_protocols=%s\n' "${async_bundle_report_protocols}"
  printf 'async_bundle_report_channels=%s\n' "${async_bundle_report_channels}"
  printf 'async_bundle_report_operations=%s\n' "${async_bundle_report_operations}"
  printf 'async_bundle_report_messages=%s\n' "${async_bundle_report_messages}"
  printf 'async_bundle_report_supported_bindings=%s\n' "${async_bundle_report_supported_bindings}"
  printf 'async_bundle_report_declared_only_bindings=%s\n' "${async_bundle_report_declared_only_bindings}"
  printf 'async_bundle_report_deferred_bindings=%s\n' "${async_bundle_report_deferred_bindings}"
  printf 'async_bundle_report_invalid_bindings=%s\n' "${async_bundle_report_invalid_bindings}"
  printf 'async_bundle_report_binding_total_operations=%s\n' "${async_bundle_report_binding_total_operations}"
  printf 'async_bundle_report_message_correlation_ids=%s\n' "${async_bundle_report_message_correlation_ids}"
  printf 'async_bundle_report_operations_with_correlation_id=%s\n' "${async_bundle_report_operations_with_correlation_id}"
  printf 'async_bundle_report_operations_with_reply=%s\n' "${async_bundle_report_operations_with_reply}"
  printf 'async_bundle_report_runtime_satisfied_operations=%s\n' "${async_bundle_report_runtime_satisfied_operations}"
  printf 'async_bundle_report_runtime_satisfied_semantics=%s\n' "${async_bundle_report_runtime_satisfied_semantics}"
  printf 'async_bundle_report_runtime_unsatisfied_operations=%s\n' "${async_bundle_report_runtime_unsatisfied_operations}"
  printf 'async_bundle_report_runtime_unsatisfied_semantics=%s\n' "${async_bundle_report_runtime_unsatisfied_semantics}"
  printf 'async_bundle_report_runtime_semantic_coverage_percent=%s\n' "${async_bundle_report_runtime_semantic_coverage_percent}"
  printf 'kafka_bundle_found=%s\n' "${kafka_bundle_found}"
  printf 'kafka_bundle_source=%s\n' "${kafka_bundle_source}"
  printf 'kafka_bundle_manifest_source=%s\n' "${kafka_bundle_manifest_source}"
  printf 'kafka_bundle_source_paths_source=%s\n' "${kafka_bundle_source_paths_source}"
  printf 'kafka_bundle_proof_status=%s\n' "${kafka_bundle_proof_status}"
  printf 'kafka_bundle_report_found=%s\n' "${kafka_bundle_report_found}"
  printf 'kafka_bundle_report_html_found=%s\n' "${kafka_bundle_report_html_found}"
  printf 'kafka_bundle_runtime_selected_report_found=%s\n' "${kafka_bundle_runtime_selected_report_found}"
  printf 'kafka_bundle_runtime_selected_report_html_found=%s\n' "${kafka_bundle_runtime_selected_report_html_found}"
  printf 'kafka_bundle_schema_failure_report_found=%s\n' "${kafka_bundle_schema_failure_report_found}"
  printf 'kafka_bundle_schema_failure_report_html_found=%s\n' "${kafka_bundle_schema_failure_report_html_found}"
  printf 'kafka_bundle_report_status=%s\n' "${kafka_bundle_report_status}"
  printf 'kafka_bundle_report_protocols=%s\n' "${kafka_bundle_report_protocols}"
  printf 'kafka_bundle_report_channels=%s\n' "${kafka_bundle_report_channels}"
  printf 'kafka_bundle_report_operations=%s\n' "${kafka_bundle_report_operations}"
  printf 'kafka_bundle_report_messages=%s\n' "${kafka_bundle_report_messages}"
  printf 'kafka_bundle_report_supported_bindings=%s\n' "${kafka_bundle_report_supported_bindings}"
  printf 'kafka_bundle_report_declared_only_bindings=%s\n' "${kafka_bundle_report_declared_only_bindings}"
  printf 'kafka_bundle_report_deferred_bindings=%s\n' "${kafka_bundle_report_deferred_bindings}"
  printf 'kafka_bundle_report_invalid_bindings=%s\n' "${kafka_bundle_report_invalid_bindings}"
  printf 'kafka_bundle_report_binding_total_operations=%s\n' "${kafka_bundle_report_binding_total_operations}"
  printf 'kafka_bundle_report_message_correlation_ids=%s\n' "${kafka_bundle_report_message_correlation_ids}"
  printf 'kafka_bundle_report_operations_with_correlation_id=%s\n' "${kafka_bundle_report_operations_with_correlation_id}"
  printf 'kafka_bundle_report_operations_with_reply=%s\n' "${kafka_bundle_report_operations_with_reply}"
  printf 'kafka_bundle_report_runtime_satisfied_operations=%s\n' "${kafka_bundle_report_runtime_satisfied_operations}"
  printf 'kafka_bundle_report_runtime_satisfied_semantics=%s\n' "${kafka_bundle_report_runtime_satisfied_semantics}"
  printf 'kafka_bundle_report_runtime_unsatisfied_operations=%s\n' "${kafka_bundle_report_runtime_unsatisfied_operations}"
  printf 'kafka_bundle_report_runtime_unsatisfied_semantics=%s\n' "${kafka_bundle_report_runtime_unsatisfied_semantics}"
  printf 'kafka_bundle_report_runtime_semantic_coverage_percent=%s\n' "${kafka_bundle_report_runtime_semantic_coverage_percent}"
  printf 'rabbitmq_bundle_found=%s\n' "${rabbitmq_bundle_found}"
  printf 'rabbitmq_bundle_source=%s\n' "${rabbitmq_bundle_source}"
  printf 'rabbitmq_bundle_manifest_source=%s\n' "${rabbitmq_bundle_manifest_source}"
  printf 'rabbitmq_bundle_source_paths_source=%s\n' "${rabbitmq_bundle_source_paths_source}"
  printf 'rabbitmq_bundle_proof_status=%s\n' "${rabbitmq_bundle_proof_status}"
  printf 'rabbitmq_bundle_report_found=%s\n' "${rabbitmq_bundle_report_found}"
  printf 'rabbitmq_bundle_report_html_found=%s\n' "${rabbitmq_bundle_report_html_found}"
  printf 'rabbitmq_bundle_runtime_selected_report_found=%s\n' "${rabbitmq_bundle_runtime_selected_report_found}"
  printf 'rabbitmq_bundle_runtime_selected_report_html_found=%s\n' "${rabbitmq_bundle_runtime_selected_report_html_found}"
  printf 'rabbitmq_bundle_schema_failure_report_found=%s\n' "${rabbitmq_bundle_schema_failure_report_found}"
  printf 'rabbitmq_bundle_schema_failure_report_html_found=%s\n' "${rabbitmq_bundle_schema_failure_report_html_found}"
  printf 'rabbitmq_bundle_report_status=%s\n' "${rabbitmq_bundle_report_status}"
  printf 'rabbitmq_bundle_report_protocols=%s\n' "${rabbitmq_bundle_report_protocols}"
  printf 'rabbitmq_bundle_report_channels=%s\n' "${rabbitmq_bundle_report_channels}"
  printf 'rabbitmq_bundle_report_operations=%s\n' "${rabbitmq_bundle_report_operations}"
  printf 'rabbitmq_bundle_report_messages=%s\n' "${rabbitmq_bundle_report_messages}"
  printf 'rabbitmq_bundle_report_supported_bindings=%s\n' "${rabbitmq_bundle_report_supported_bindings}"
  printf 'rabbitmq_bundle_report_declared_only_bindings=%s\n' "${rabbitmq_bundle_report_declared_only_bindings}"
  printf 'rabbitmq_bundle_report_deferred_bindings=%s\n' "${rabbitmq_bundle_report_deferred_bindings}"
  printf 'rabbitmq_bundle_report_invalid_bindings=%s\n' "${rabbitmq_bundle_report_invalid_bindings}"
  printf 'rabbitmq_bundle_report_binding_total_operations=%s\n' "${rabbitmq_bundle_report_binding_total_operations}"
  printf 'rabbitmq_bundle_report_message_correlation_ids=%s\n' "${rabbitmq_bundle_report_message_correlation_ids}"
  printf 'rabbitmq_bundle_report_operations_with_correlation_id=%s\n' "${rabbitmq_bundle_report_operations_with_correlation_id}"
  printf 'rabbitmq_bundle_report_operations_with_reply=%s\n' "${rabbitmq_bundle_report_operations_with_reply}"
  printf 'rabbitmq_bundle_report_runtime_satisfied_operations=%s\n' "${rabbitmq_bundle_report_runtime_satisfied_operations}"
  printf 'rabbitmq_bundle_report_runtime_satisfied_semantics=%s\n' "${rabbitmq_bundle_report_runtime_satisfied_semantics}"
  printf 'rabbitmq_bundle_report_runtime_unsatisfied_operations=%s\n' "${rabbitmq_bundle_report_runtime_unsatisfied_operations}"
  printf 'rabbitmq_bundle_report_runtime_unsatisfied_semantics=%s\n' "${rabbitmq_bundle_report_runtime_unsatisfied_semantics}"
  printf 'rabbitmq_bundle_report_runtime_semantic_coverage_percent=%s\n' "${rabbitmq_bundle_report_runtime_semantic_coverage_percent}"
  printf 'combined_bundle_found=%s\n' "${combined_bundle_found}"
  printf 'combined_bundle_source=%s\n' "${combined_bundle_source}"
  printf 'combined_bundle_manifest_source=%s\n' "${combined_bundle_manifest_source}"
  printf 'combined_bundle_source_paths_source=%s\n' "${combined_bundle_source_paths_source}"
  printf 'combined_bundle_report_found=%s\n' "${combined_bundle_report_found}"
  printf 'combined_bundle_report_html_found=%s\n' "${combined_bundle_report_html_found}"
  printf 'combined_bundle_status=%s\n' "${combined_bundle_status}"
  printf 'combined_bundle_http_status=%s\n' "${combined_bundle_http_status}"
  printf 'combined_bundle_async_status=%s\n' "${combined_bundle_async_status}"
  printf 'combined_bundle_async_protocols=%s\n' "${combined_bundle_async_protocols}"
  printf 'combined_bundle_report_json_path=%s\n' "${combined_bundle_report_json_path}"
  printf 'combined_bundle_report_html_path=%s\n' "${combined_bundle_report_html_path}"
  printf 'combined_bundle_http_child_json_path=%s\n' "${combined_bundle_http_child_json_path}"
  printf 'combined_bundle_http_child_html_path=%s\n' "${combined_bundle_http_child_html_path}"
  printf 'combined_bundle_async_child_json_path=%s\n' "${combined_bundle_async_child_json_path}"
  printf 'combined_bundle_async_child_html_path=%s\n' "${combined_bundle_async_child_html_path}"
  printf 'v1_e2e_bundle_found=%s\n' "${v1_e2e_bundle_found}"
  printf 'v1_e2e_bundle_source=%s\n' "${v1_e2e_bundle_source}"
  printf 'source_paths_note=%s\n' "${SOURCE_PATHS_NOTE_NAME}"
  printf 'destination=%s\n' "${DEST_DIR}"
} > "${manifest_path}"
