#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIBS_DIR="${1:-${ROOT_DIR}/examples/springmvc-service/build/libs}"

if [[ "${LIBS_DIR}" != /* ]]; then
  LIBS_DIR="${ROOT_DIR}/${LIBS_DIR}"
fi

if [[ ! -d "${LIBS_DIR}" ]]; then
  echo "ERROR: Spring Boot jar directory not found: ${LIBS_DIR}" >&2
  exit 1
fi

candidates=()
while IFS= read -r -d '' candidate; do
  candidates+=("${candidate}")
done < <(find "${LIBS_DIR}" -maxdepth 1 -type f -name '*.jar' ! -name '*-plain.jar' -print0)

if [[ ${#candidates[@]} -eq 0 ]]; then
  echo "ERROR: No executable Spring Boot jar found in ${LIBS_DIR}. Expected a non-plain *.jar after running bootJar." >&2
  exit 1
fi

BOOT_JAR="$(ls -t "${candidates[@]}" 2>/dev/null | head -n 1)"

if [[ -z "${BOOT_JAR}" || ! -f "${BOOT_JAR}" ]]; then
  echo "ERROR: Unable to resolve an executable Spring Boot jar from ${LIBS_DIR}." >&2
  exit 1
fi

printf '%s\n' "${BOOT_JAR}"
