#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BOUNDARY_DOC="docs/release-and-support.md"
ROOT_README="README.md"
DOCS_README="docs/README.md"
ANALYZER_GUIDE="docs/guides/analyzer-coverage.md"
ASYNC_GUIDE="docs/guides/asyncapi-kafka.md"

failures=0

error() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

note() {
  echo "INFO: $1"
}

require_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    error "Missing required doc for ${label}: ${path}"
    return
  fi

  grep -Fq -- "$needle" "${ROOT_DIR}/${path}" || error "${path} is missing ${label}: ${needle}"
}

require_absent() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    error "Missing required doc for ${label}: ${path}"
    return
  fi

  if grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    error "${path} still contains stale ${label}: ${needle}"
  fi
}

resolve_latest_release_context() {
  latest_tag="$(git -C "${ROOT_DIR}" tag --list 'v*' --sort=-version:refname | head -n 1 | tr -d '[:space:]')"

  if [[ -z "${latest_tag}" ]]; then
    echo "ERROR: Could not resolve latest stable v* tag from git history." >&2
    exit 2
  fi

  if [[ ! "${latest_tag}" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    echo "ERROR: Latest stable tag has unexpected format: ${latest_tag}" >&2
    exit 2
  fi

  release_line="v${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.x"
  head_ahead_count="$(git -C "${ROOT_DIR}" rev-list --count "${latest_tag}..HEAD")"
}

resolve_release_url() {
  local origin_url
  local repo_path

  origin_url="$(git -C "${ROOT_DIR}" config --get remote.origin.url || true)"
  repo_url=""

  case "${origin_url}" in
    https://github.com/*)
      repo_url="${origin_url%.git}"
      ;;
    git@github.com:*)
      repo_path="${origin_url#git@github.com:}"
      repo_path="${repo_path%.git}"
      repo_url="https://github.com/${repo_path}"
      ;;
    ssh://git@github.com/*)
      repo_path="${origin_url#ssh://git@github.com/}"
      repo_path="${repo_path%.git}"
      repo_url="https://github.com/${repo_path}"
      ;;
  esac

  if [[ -z "${repo_url}" ]]; then
    repo_url="https://github.com/zuevrs/yanote"
  fi

  releases_url="${repo_url}/releases"
}

resolve_latest_release_context
resolve_release_url

note "Resolved latest stable tag: ${latest_tag}"
note "Expected release line: ${release_line}"
note "GitHub Releases surface: ${releases_url}"
if [[ "${head_ahead_count}" == "0" ]]; then
  note "Repository state relative to latest tag: HEAD matches ${latest_tag}"
else
  note "Repository state relative to latest tag: HEAD is ${head_ahead_count} commit(s) ahead of ${latest_tag}"
fi

boundary_doc_present=true
if [[ ! -f "${ROOT_DIR}/${BOUNDARY_DOC}" ]]; then
  error "Missing public boundary doc: ${BOUNDARY_DOC}"
  boundary_doc_present=false
fi

if [[ "${boundary_doc_present}" == "true" ]]; then
  require_contains "${BOUNDARY_DOC}" "# Релизы и границы поддержки Yanote" "boundary doc title"
  require_contains "${BOUNDARY_DOC}" "## Текущая стабильная линия" "required section"
  require_contains "${BOUNDARY_DOC}" "## Последний стабильный релиз" "required section"
  require_contains "${BOUNDARY_DOC}" "## Текущее состояние репозитория относительно релиза" "required section"
  require_contains "${BOUNDARY_DOC}" "## Стабильные поверхности" "required section"
  require_contains "${BOUNDARY_DOC}" "## Предположения по совместимости" "required section"
  require_contains "${BOUNDARY_DOC}" "## Ограничения" "required section"
  require_contains "${BOUNDARY_DOC}" "## Fallback-границы" "required section"
  require_contains "${BOUNDARY_DOC}" "${release_line}" "current stable line clause"
  require_contains "${BOUNDARY_DOC}" "${latest_tag}" "latest stable release tag"
  require_contains "${BOUNDARY_DOC}" "${releases_url}" "GitHub Releases pointer"
  require_contains "${BOUNDARY_DOC}" "HEAD" "repository-vs-release wording"
  require_contains "${BOUNDARY_DOC}" '`gradle.properties`' "workspace version-source reference"
  require_contains "${BOUNDARY_DOC}" '`0.1.0-SNAPSHOT`' "workspace snapshot marker"
  require_contains "${BOUNDARY_DOC}" "не авторитетный источник публичной версии релиза" "snapshot disclaimer"
  require_contains "${BOUNDARY_DOC}" '`yanote --version`' "analyzer version-source reference"
  require_contains "${BOUNDARY_DOC}" '`yanote-js/package.json`' "source-built analyzer version-source reference"
  require_contains "${BOUNDARY_DOC}" '`0.0.0`' "analyzer version marker"
  require_contains "${BOUNDARY_DOC}" "не авторитетный источник стабильного релиза" "analyzer disclaimer"
  require_contains "${BOUNDARY_DOC}" '`yanote-core`' "published Java module"
  require_contains "${BOUNDARY_DOC}" '`yanote-recorder-spring-mvc`' "published Java module"
  require_contains "${BOUNDARY_DOC}" '`yanote-recorder-spring-kafka`' "published Java module"
  require_contains "${BOUNDARY_DOC}" '`yanote-test-tags-restassured`' "published Java module"
  require_contains "${BOUNDARY_DOC}" '`yanote-test-tags-cucumber`' "published Java module"
  require_contains "${BOUNDARY_DOC}" '`yanote-gradle-plugin`' "published Java module"
  require_contains "${BOUNDARY_DOC}" '`io.github.zuevrs.yanote.gradle`' "Gradle plugin id"
  require_contains "${BOUNDARY_DOC}" '`yanoteReport`' "Gradle plugin task name"
  require_contains "${BOUNDARY_DOC}" '`yanoteCheck`' "Gradle plugin task name"
  require_contains "${BOUNDARY_DOC}" '`1.0.0`' "report schema version"
  require_contains "${BOUNDARY_DOC}" "Java 21" "Java compatibility baseline"
  require_contains "${BOUNDARY_DOC}" 'Node `>=20`' "Node compatibility baseline"
  require_contains "${BOUNDARY_DOC}" '`.nvmrc` = `22`' "repo/dev Node pin"
  require_contains "${BOUNDARY_DOC}" "Spring Boot 3.x / Spring MVC" "verified recorder path"
  require_contains "${BOUNDARY_DOC}" "source-built CLI" "primary analyzer path"
  require_contains "${BOUNDARY_DOC}" "release asset" "fallback release asset wording"
  require_contains "${BOUNDARY_DOC}" 'tracked `dist/` поверхность default branch' "no-tracked-dist clause"
  require_contains "${BOUNDARY_DOC}" "не-Java onboarding" "non-Java limitation"
  require_contains "${BOUNDARY_DOC}" "runnable Cucumber demo" "Cucumber limitation"
  require_contains "${BOUNDARY_DOC}" "bash scripts/ci/run-v1-e2e.sh" "public proof command"
  require_contains "${BOUNDARY_DOC}" ".yanote-ci/v1-e2e/out/yanote-report.json" "happy-path proof artifact"
  require_contains "${BOUNDARY_DOC}" "semantic-red.stderr" "retained semantic red stderr artifact"
  require_contains "${BOUNDARY_DOC}" "semantic-red-yanote-report.json" "retained semantic red report artifact"
  require_contains "${BOUNDARY_DOC}" "HTTP Payload Conformance" "payload conformance wording"
  require_contains "${BOUNDARY_DOC}" "JSON-first request/response payload validation" "JSON-first boundary wording"
  require_contains "${BOUNDARY_DOC}" "NO_DECLARED_CONTENT" "benign payload boundary wording"
  require_contains "${BOUNDARY_DOC}" "RECORDER_OMITTED" "recorder omission boundary wording"
  require_contains "${BOUNDARY_DOC}" "policy-filtered" "recorder omission provenance wording"
  require_contains "${BOUNDARY_DOC}" "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA" "fail-closed payload wording"
  require_contains "${BOUNDARY_DOC}" "separate async report/gate" "separate async boundary wording"
  require_contains "${BOUNDARY_DOC}" "runtime-selected-async-report.stderr" "runtime-selection retained artifact wording"
  require_contains "${BOUNDARY_DOC}" "runtime-selected-yanote-async-report.json" "runtime-selection retained artifact wording"
  require_contains "${BOUNDARY_DOC}" "combined HTTP+async report surface" "no-combined-surface wording"
  require_absent "${BOUNDARY_DOC}" "v1.0.123" "stale stable release tag"
  require_absent "${BOUNDARY_DOC}" "v1.0.122" "stale previous release tag"
fi

require_contains "${ROOT_README}" "docs/release-and-support.md" "release/support landing pointer"
require_contains "${ROOT_README}" "${release_line}" "release/support landing stable line"
require_contains "${ROOT_README}" "RECORDER_OMITTED" "root landing recorder omission wording"
require_contains "${ROOT_README}" "policy-filtered" "root landing recorder omission provenance wording"
require_contains "${ROOT_README}" "runtime-selection sidecar" "root landing async multi-message wording"
require_contains "${DOCS_README}" "release-and-support.md" "release/support landing pointer"
require_contains "${DOCS_README}" "${release_line}" "release/support landing stable line"
require_contains "${ANALYZER_GUIDE}" "RECORDER_OMITTED" "analyzer guide recorder omission wording"
require_contains "${ANALYZER_GUIDE}" "policy-filtered" "analyzer guide recorder omission provenance wording"
require_contains "${ASYNC_GUIDE}" "runtime-selected-async-report.stderr" "async guide runtime-selection retained artifact wording"
require_contains "${ASYNC_GUIDE}" "runtime-selected-yanote-async-report.json" "async guide runtime-selection retained artifact wording"
require_contains "${ASYNC_GUIDE}" "selectionMode=runtime" "async guide runtime-selection proof wording"

if (( failures > 0 )); then
  echo "S04 boundary verification failed with ${failures} issue(s)." >&2
  exit 1
fi

echo "S04 boundary verification passed: release/support surface, retained proof wording, and version-source disclaimers align with ${latest_tag} (${release_line})."
