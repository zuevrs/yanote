#!/usr/bin/env bash
set -euo pipefail

JAVA_VERSION_OUTPUT="$(java -version 2>&1)"

if [[ "${JAVA_VERSION_OUTPUT}" =~ version[[:space:]]+\"([0-9]+) ]]; then
  JAVA_MAJOR="${BASH_REMATCH[1]}"
elif [[ "${JAVA_VERSION_OUTPUT}" =~ \"1\.([0-9]+)\. ]]; then
  JAVA_MAJOR="${BASH_REMATCH[1]}"
else
  echo "ERROR: Unable to determine Java major version from java -version output." >&2
  echo "${JAVA_VERSION_OUTPUT}" >&2
  echo "Fix: ensure actions/setup-java runs with java-version: '21' before required checks." >&2
  exit 1
fi

if [[ "${JAVA_MAJOR}" != "21" ]]; then
  echo "ERROR: Java 21 is required for merge-blocking CI checks." >&2
  echo "Expected major version: 21" >&2
  echo "Detected major version: ${JAVA_MAJOR}" >&2
  echo "Fix actions/setup-java configuration:" >&2
  echo "  uses: actions/setup-java@v5" >&2
  echo "  with:" >&2
  echo "    distribution: temurin" >&2
  echo "    java-version: '21'" >&2
  echo "Current java -version output:" >&2
  echo "${JAVA_VERSION_OUTPUT}" >&2
  exit 1
fi

echo "Java baseline check passed (major version ${JAVA_MAJOR})."
