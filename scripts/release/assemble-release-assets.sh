#!/usr/bin/env bash
set -euo pipefail

# Deterministic release bundle builder.
# Asset naming contract: {version}-{artifact-type}{extension}
# Example stable tag format: v1.2.3

RELEASE_TAG="${RELEASE_TAG:-${1:-}}"
ASSET_INDEX_PATH="${RELEASE_ASSET_INDEX:-build/release-assets/index.txt}"
SBOM_SOURCE_PATH="${SBOM_PATH:-build/reports/cyclonedx/bom.json}"
TRACEABILITY_JSON_PATH="${TRACEABILITY_JSON_PATH:-.planning/traceability/v1-requirements-tests.json}"
TRACEABILITY_MARKDOWN_PATH="${TRACEABILITY_MARKDOWN_PATH:-.planning/traceability/v1-requirements-tests.md}"
OUTPUT_ROOT="${RELEASE_OUTPUT_DIR:-build/release-bundle/${RELEASE_TAG}}"
CHECKSUM_ALGORITHM="sha256"

if [[ -z "${RELEASE_TAG}" ]]; then
  echo "RELEASE_TAG is required (expected vMAJOR.MINOR.PATCH)." >&2
  exit 1
fi

if [[ ! "${RELEASE_TAG}" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "RELEASE_TAG must match vMAJOR.MINOR.PATCH (got '${RELEASE_TAG}')." >&2
  exit 1
fi

if [[ ! -f "${ASSET_INDEX_PATH}" ]]; then
  echo "Release asset index not found at '${ASSET_INDEX_PATH}'." >&2
  exit 1
fi

if [[ ! -f "${SBOM_SOURCE_PATH}" ]]; then
  echo "SBOM file not found at '${SBOM_SOURCE_PATH}'." >&2
  exit 1
fi

if [[ ! -f "${TRACEABILITY_JSON_PATH}" ]]; then
  echo "Traceability JSON file not found at '${TRACEABILITY_JSON_PATH}'." >&2
  exit 1
fi

if [[ ! -f "${TRACEABILITY_MARKDOWN_PATH}" ]]; then
  echo "Traceability markdown file not found at '${TRACEABILITY_MARKDOWN_PATH}'." >&2
  exit 1
fi

ASSETS_DIR="${OUTPUT_ROOT}/assets"
MANIFEST_PATH="${OUTPUT_ROOT}/${RELEASE_TAG}-manifest.txt"

mkdir -p "${ASSETS_DIR}"
{
  echo "release-tag=${RELEASE_TAG}"
  echo "checksum-algorithm=${CHECKSUM_ALGORITHM}"
  echo "manifest-format=v1"
} > "${MANIFEST_PATH}"

extract_snapshot_id_from_json() {
  local json_path="$1"
  local snapshot_id
  snapshot_id="$(awk -F'"' '/"snapshotId"[[:space:]]*:/ {print $4; exit}' "${json_path}")"
  printf '%s' "${snapshot_id}"
}

extract_snapshot_id_from_markdown() {
  local markdown_path="$1"
  local snapshot_id
  snapshot_id="$(awk -F'\`' '/Snapshot ID:/ {print $2; exit}' "${markdown_path}")"
  if [[ -z "${snapshot_id}" ]]; then
    snapshot_id="$(awk -F': ' '/Snapshot ID:/ {print $2; exit}' "${markdown_path}" | tr -d '[:space:]')"
  fi
  printf '%s' "${snapshot_id}"
}

copy_with_deterministic_name() {
  local artifact_type="$1"
  local source_path="$2"

  if [[ ! -f "${source_path}" ]]; then
    echo "Expected source artifact not found: ${source_path}" >&2
    exit 1
  fi

  if [[ ! "${artifact_type}" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
    echo "Invalid artifact-type '${artifact_type}' (expected lowercase kebab-case)." >&2
    exit 1
  fi

  local source_file
  source_file="$(basename "${source_path}")"
  local extension=""
  if [[ "${source_file}" == *.* ]]; then
    extension=".${source_file#*.}"
  fi

  local target_file="${RELEASE_TAG}-${artifact_type}${extension}"
  local target_path="${ASSETS_DIR}/${target_file}"
  cp "${source_path}" "${target_path}"

  local checksum_file="${target_file}.${CHECKSUM_ALGORITHM}"
  local checksum_path="${ASSETS_DIR}/${checksum_file}"
  local proof_file="${target_file}.${CHECKSUM_ALGORITHM}.proof"
  local proof_path="${ASSETS_DIR}/${proof_file}"

  (cd "${ASSETS_DIR}" && shasum -a 256 "${target_file}" > "${checksum_file}")
  (cd "${ASSETS_DIR}" && shasum -a 256 -c "${checksum_file}" > "${proof_file}")

  {
    echo "asset=${target_file}"
    echo "checksum-file=${checksum_file}"
    echo "proof-file=${proof_file}"
  } >> "${MANIFEST_PATH}"

  # Optional sidecar signatures/proofs copied when present.
  local sidecar
  for sidecar in ".asc" ".sig"; do
    if [[ -f "${source_path}${sidecar}" ]]; then
      cp "${source_path}${sidecar}" "${ASSETS_DIR}/${target_file}${sidecar}"
      echo "signature-file=${target_file}${sidecar}" >> "${MANIFEST_PATH}"
    fi
  done
}

SORTED_INDEX="$(mktemp)"
trap 'rm -f "${SORTED_INDEX}"' EXIT

TRACEABILITY_SNAPSHOT_JSON="$(extract_snapshot_id_from_json "${TRACEABILITY_JSON_PATH}")"
TRACEABILITY_SNAPSHOT_MARKDOWN="$(extract_snapshot_id_from_markdown "${TRACEABILITY_MARKDOWN_PATH}")"
if [[ -z "${TRACEABILITY_SNAPSHOT_JSON}" || -z "${TRACEABILITY_SNAPSHOT_MARKDOWN}" ]]; then
  echo "Traceability snapshot references are required in both JSON and markdown artifacts." >&2
  exit 1
fi
if [[ "${TRACEABILITY_SNAPSHOT_JSON}" != "${TRACEABILITY_SNAPSHOT_MARKDOWN}" ]]; then
  echo "Traceability snapshot mismatch between JSON ('${TRACEABILITY_SNAPSHOT_JSON}') and markdown ('${TRACEABILITY_SNAPSHOT_MARKDOWN}')." >&2
  exit 1
fi
echo "traceability-snapshot=${TRACEABILITY_SNAPSHOT_JSON}" >> "${MANIFEST_PATH}"

LC_ALL=C sort "${ASSET_INDEX_PATH}" > "${SORTED_INDEX}"

while IFS= read -r line; do
  [[ -z "${line}" || "${line}" =~ ^# ]] && continue
  artifact_type="${line%%|*}"
  source_path="${line#*|}"
  if [[ "${artifact_type}" == "${source_path}" ]]; then
    echo "Invalid asset index entry '${line}'. Expected format artifact-type|path." >&2
    exit 1
  fi
  copy_with_deterministic_name "${artifact_type}" "${source_path}"
done < "${SORTED_INDEX}"

copy_with_deterministic_name "sbom" "${SBOM_SOURCE_PATH}"
copy_with_deterministic_name "traceability-json" "${TRACEABILITY_JSON_PATH}"
copy_with_deterministic_name "traceability-summary" "${TRACEABILITY_MARKDOWN_PATH}"

echo "release-asset-count=$(ls -1 "${ASSETS_DIR}" | wc -l | tr -d ' ')" >> "${MANIFEST_PATH}"
echo "manifest=${MANIFEST_PATH}"
