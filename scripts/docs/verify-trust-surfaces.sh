#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CANONICAL_REPO_URL="https://github.com/zuevrs/yanote"
CANONICAL_DOC_URL="${CANONICAL_REPO_URL}#readme"
CANONICAL_ISSUES_URL="${CANONICAL_REPO_URL}/issues"
CANONICAL_SUPPORT_FILE_URL="${CANONICAL_REPO_URL}/blob/main/SUPPORT.md"
CANONICAL_SECURITY_FILE_URL="${CANONICAL_REPO_URL}/blob/main/SECURITY.md"
CANONICAL_CONTRIBUTING_FILE_URL="${CANONICAL_REPO_URL}/blob/main/CONTRIBUTING.md"
CANONICAL_DOCS_MAP_URL="${CANONICAL_REPO_URL}/blob/main/docs/README.md"
CANONICAL_RELEASE_SUPPORT_URL="${CANONICAL_REPO_URL}/blob/main/docs/release-and-support.md"
CANONICAL_SCM_CONNECTION="scm:git:${CANONICAL_REPO_URL}.git"
CANONICAL_SCM_DEVELOPER_CONNECTION="scm:git:ssh://git@github.com/zuevrs/yanote.git"
STALE_REPO_URL="github.com/yanote/yanote"

failures=0

error() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

note() {
  echo "INFO: $1"
}

require_file() {
  local path="$1"
  local label="$2"

  [[ -f "${ROOT_DIR}/${path}" ]] || error "Missing required ${label}: ${path}"
}

require_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    error "Missing required file for ${label}: ${path}"
    return
  fi

  grep -Fq -- "$needle" "${ROOT_DIR}/${path}" || error "${path} is missing ${label}: ${needle}"
}

require_not_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"

  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    error "Missing required file for ${label}: ${path}"
    return
  fi

  if grep -Fq -- "$needle" "${ROOT_DIR}/${path}"; then
    error "${path} still contains ${label}: ${needle}"
  fi
}

verify_module_metadata() {
  local path="$1"

  require_contains "$path" "url.set(\"${CANONICAL_REPO_URL}\")" "canonical repository homepage"
  require_contains "$path" 'name.set("Apache License, Version 2.0")' "Apache-2.0 POM license name"
  require_contains "$path" 'url.set("https://www.apache.org/licenses/LICENSE-2.0.txt")' "Apache-2.0 POM license URL"
  require_contains "$path" "connection.set(\"${CANONICAL_SCM_CONNECTION}\")" "canonical SCM connection"
  require_contains "$path" "developerConnection.set(\"${CANONICAL_SCM_DEVELOPER_CONNECTION}\")" "canonical SCM developer connection"
  require_not_contains "$path" "$STALE_REPO_URL" "stale repository identity"
}

check_identity() {
  note "Checking S06 identity/legal trust surfaces"

  if [[ -f "${ROOT_DIR}/LICENSE" ]]; then
    require_contains "LICENSE" "Apache License" "Apache-2.0 license title"
    require_contains "LICENSE" "Version 2.0, January 2004" "Apache-2.0 license version header"
  else
    error "Missing required root license: LICENSE"
  fi

  require_contains "jreleaser.yml" "license: Apache-2.0" "declared project license"
  require_contains "jreleaser.yml" "homepage: ${CANONICAL_REPO_URL}" "canonical JReleaser homepage"
  require_contains "jreleaser.yml" "documentation: ${CANONICAL_DOC_URL}" "canonical JReleaser documentation URL"
  require_contains "jreleaser.yml" "bugTracker: ${CANONICAL_ISSUES_URL}" "canonical JReleaser bug tracker URL"
  require_not_contains "jreleaser.yml" "$STALE_REPO_URL" "stale repository identity"

  for module in \
    "yanote-core/build.gradle.kts" \
    "yanote-recorder-spring-mvc/build.gradle.kts" \
    "yanote-recorder-spring-kafka/build.gradle.kts" \
    "yanote-test-tags-restassured/build.gradle.kts" \
    "yanote-test-tags-cucumber/build.gradle.kts" \
    "yanote-gradle-plugin/build.gradle.kts"
  do
    verify_module_metadata "$module"
  done
}

check_policy() {
  note "Checking S06 public policy trust surfaces"

  for path in \
    "SECURITY.md" \
    "SUPPORT.md" \
    "CONTRIBUTING.md"
  do
    require_file "$path" "public trust surface"
  done

  require_contains "SECURITY.md" "zzuevrs@gmail.com" "security reporting contact"
  require_contains "SECURITY.md" "Не открывайте публичный issue для нераскрытых уязвимостей." "private vulnerability reporting rule"
  require_contains "SECURITY.md" "docs/README.md" "docs navigation backlink"
  require_contains "SECURITY.md" "docs/release-and-support.md" "public support boundary backlink"

  require_contains "SUPPORT.md" "Поддержка Yanote ведётся мейнтейнером." "maintainer-led support boundary"
  require_contains "SUPPORT.md" "без SLA" "no-SLA support wording"
  require_contains "SUPPORT.md" "${CANONICAL_ISSUES_URL}" "public bug-report channel"
  require_contains "SUPPORT.md" "docs/release-and-support.md" "public support boundary backlink"
  require_contains "SUPPORT.md" "docs/README.md" "docs navigation backlink"
  require_contains "SUPPORT.md" "docs/requirements.md" "requirements boundary backlink"

  require_contains "CONTRIBUTING.md" "Исправления документации и узкие bugfix PR приветствуются." "narrow contribution scope"
  require_contains "CONTRIBUTING.md" "Большие изменения начинайте с обсуждения" "prior discussion rule"
  require_contains "CONTRIBUTING.md" "${CANONICAL_ISSUES_URL}" "public discussion intake channel"
  require_contains "CONTRIBUTING.md" "docs/release-and-support.md" "public support boundary backlink"
  require_contains "CONTRIBUTING.md" "docs/requirements.md" "requirements boundary backlink"
  require_contains "CONTRIBUTING.md" "docs/README.md" "docs navigation backlink"
}

check_github() {
  note "Checking S06 GitHub-native trust surfaces"

  for path in \
    ".github/CODEOWNERS" \
    ".github/ISSUE_TEMPLATE/config.yml" \
    ".github/ISSUE_TEMPLATE/bug-report.md" \
    ".github/ISSUE_TEMPLATE/integration-guidance.md" \
    ".github/PULL_REQUEST_TEMPLATE.md"
  do
    require_file "$path" "GitHub trust surface"
  done

  require_contains ".github/CODEOWNERS" "* @zuevrs" "default maintainer CODEOWNER"
  require_contains ".github/CODEOWNERS" "/.github/ @zuevrs" "GitHub surface CODEOWNER"
  require_contains ".github/CODEOWNERS" "/SECURITY.md @zuevrs" "security surface CODEOWNER"
  require_contains ".github/CODEOWNERS" "/SUPPORT.md @zuevrs" "support surface CODEOWNER"
  require_contains ".github/CODEOWNERS" "/CONTRIBUTING.md @zuevrs" "contribution surface CODEOWNER"

  require_contains ".github/ISSUE_TEMPLATE/config.yml" "blank_issues_enabled: false" "bounded issue chooser setting"
  require_contains ".github/ISSUE_TEMPLATE/config.yml" "${CANONICAL_SUPPORT_FILE_URL}" "support routing link"
  require_contains ".github/ISSUE_TEMPLATE/config.yml" "${CANONICAL_SECURITY_FILE_URL}" "security routing link"

  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" "name: \"Баг / Bug report\"" "bug template chooser title"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" "about: \"Сообщить о воспроизводимом дефекте в поддерживаемой поверхности Yanote.\"" "bug template chooser guidance"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" "## Проверка маршрута" "bug intake routing section"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" "## Версия / коммит" "bug version field"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" "## Окружение" "bug environment field"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" "## Шаги воспроизведения" "bug reproduction field"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" "## Ожидаемое поведение" "bug expected behavior field"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" "## Фактическое поведение" "bug actual behavior field"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" "## Артефакты Yanote / выдержки из отчёта" "bug evidence field"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" '`events.jsonl`' "bug recorder evidence prompt"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" '`yanote-report.json`' "bug analyzer evidence prompt"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" "${CANONICAL_SUPPORT_FILE_URL}" "bug support routing link"
  require_contains ".github/ISSUE_TEMPLATE/bug-report.md" "${CANONICAL_SECURITY_FILE_URL}" "bug security routing link"

  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" "name: \"Интеграция и документация / Integration guidance\"" "integration template chooser title"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" "about: \"Запросить помощь по интеграции, документации или границам поддерживаемой поверхности.\"" "integration template chooser guidance"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" "## Проверка маршрута" "integration intake routing section"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" "## Какая поверхность или путь документации задействованы?" "integration docs path field"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" "## Что вы уже пробовали?" "integration prior-attempts field"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" "## Какое текущее поведение или непонимание?" "integration current-state field"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" "## Какую подсказку или уточнение вы ищете?" "integration requested-guidance field"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" "## Релевантные evidence-файлы или вывод команд" "integration evidence field"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" "${CANONICAL_SUPPORT_FILE_URL}" "integration support routing link"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" "${CANONICAL_SECURITY_FILE_URL}" "integration security routing link"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" "${CANONICAL_DOCS_MAP_URL}" "integration docs-map routing link"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" '`events.jsonl`' "integration recorder evidence prompt"
  require_contains ".github/ISSUE_TEMPLATE/integration-guidance.md" '`yanote-report.json`' "integration analyzer evidence prompt"

  require_contains ".github/PULL_REQUEST_TEMPLATE.md" "## Кратко" "PR summary section"
  require_contains ".github/PULL_REQUEST_TEMPLATE.md" "## Проверка" "PR verification section"
  require_contains ".github/PULL_REQUEST_TEMPLATE.md" "## Влияние на документацию и публичные границы" "PR docs impact section"
  require_contains ".github/PULL_REQUEST_TEMPLATE.md" "## Контекст для ревью" "PR reviewer context section"
  require_contains ".github/PULL_REQUEST_TEMPLATE.md" "## Финальная проверка автора" "PR author checklist section"
  require_contains ".github/PULL_REQUEST_TEMPLATE.md" "${CANONICAL_CONTRIBUTING_FILE_URL}" "PR contributing boundary backlink"
  require_contains ".github/PULL_REQUEST_TEMPLATE.md" "${CANONICAL_RELEASE_SUPPORT_URL}" "PR release/support boundary backlink"
  require_contains ".github/PULL_REQUEST_TEMPLATE.md" '`build-and-test`' "PR required build check reference"
  require_contains ".github/PULL_REQUEST_TEMPLATE.md" '`yanote-validation`' "PR required validation check reference"
  require_contains ".github/PULL_REQUEST_TEMPLATE.md" "roadmap/SLA/community-governance" "PR maintained-product boundary wording"
}

mode="${1:-all}"

case "$mode" in
  identity)
    check_identity
    ;;
  policy)
    check_policy
    ;;
  github|intake)
    check_github
    ;;
  all|full)
    check_identity
    check_policy
    check_github
    ;;
  *)
    echo "Usage: $0 [identity|policy|github|intake|all|full]" >&2
    exit 2
    ;;
esac

if (( failures > 0 )); then
  echo "S06 trust-surface verification failed with ${failures} issue(s)." >&2
  exit 1
fi

echo "S06 trust-surface verification passed for mode: ${mode}."
