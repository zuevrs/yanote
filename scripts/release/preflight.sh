#!/usr/bin/env bash
set -euo pipefail

DIAGNOSTIC_CLASS_ORDER=(input policy auth transient)

HAS_FAILURE=false
INPUT_DIAGNOSTICS=()
POLICY_DIAGNOSTICS=()
AUTH_DIAGNOSTICS=()
TRANSIENT_DIAGNOSTICS=()

add_diagnostic() {
  local class_name="$1"
  local code="$2"
  local message="$3"
  local retry_eligible="$4"
  local retry_reason="$5"
  local entry="${code}|${message}|${retry_eligible}|${retry_reason}"

  case "$class_name" in
    input) INPUT_DIAGNOSTICS+=("$entry") ;;
    policy) POLICY_DIAGNOSTICS+=("$entry") ;;
    auth) AUTH_DIAGNOSTICS+=("$entry") ;;
    transient) TRANSIENT_DIAGNOSTICS+=("$entry") ;;
    *)
      echo "Unknown diagnostic class: ${class_name}" >&2
      exit 2
      ;;
  esac
}

fail_with_diagnostic() {
  HAS_FAILURE=true
  add_diagnostic "$@"
}

is_truthy() {
  local normalized
  normalized="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')"
  case "$normalized" in
    1|true|yes|y) return 0 ;;
    *) return 1 ;;
  esac
}

read_project_version() {
  local version=""
  while IFS='=' read -r key value; do
    if [[ "$key" == "version" ]]; then
      version="$value"
      break
    fi
  done < "gradle.properties"
  printf '%s' "$version"
}

classify_retry_eligibility() {
  local failure_message="${1:-}"
  local normalized="${failure_message,,}"
  case "$normalized" in
    *timeout*|*"timed out"*|*"connection reset"*|*"connection refused"*|*"temporary unavailable"*|*429*|*502*|*503*|*504*)
      echo "true|transient-network"
      ;;
    "")
      echo "false|no-failure"
      ;;
    *)
      echo "false|non-transient"
      ;;
  esac
}

render_group() {
  local class_name="$1"
  shift
  local entries=("$@")

  if [[ "${#entries[@]}" -eq 0 ]]; then
    return
  fi

  local sorted_entries
  sorted_entries="$(printf '%s\n' "${entries[@]}" | LC_ALL=C sort)"
  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    IFS='|' read -r code message retry_eligible retry_reason <<< "$entry"
    echo "diagnostic-class=${class_name} code=${code} message=${message} retry-eligible=${retry_eligible} retry_reason=${retry_reason}"
  done <<< "$sorted_entries"
}

render_diagnostics() {
  local class_name
  for class_name in "${DIAGNOSTIC_CLASS_ORDER[@]}"; do
    case "$class_name" in
      input) render_group "$class_name" "${INPUT_DIAGNOSTICS[@]}" ;;
      policy) render_group "$class_name" "${POLICY_DIAGNOSTICS[@]}" ;;
      auth) render_group "$class_name" "${AUTH_DIAGNOSTICS[@]}" ;;
      transient) render_group "$class_name" "${TRANSIENT_DIAGNOSTICS[@]}" ;;
      *)
        echo "Unexpected diagnostic class ordering entry: ${class_name}" >&2
        exit 2
        ;;
    esac
  done
}

join_sorted() {
  local sorted_values
  sorted_values="$(printf '%s\n' "$@" | LC_ALL=C sort)"
  local joined=""
  while IFS= read -r value; do
    [[ -z "$value" ]] && continue
    if [[ -z "$joined" ]]; then
      joined="$value"
    else
      joined="${joined},${value}"
    fi
  done <<< "$sorted_values"
  printf '%s' "$joined"
}

verify_release_tag_signature() {
  local release_tag="$1"

  if git verify-tag "$release_tag" >/dev/null 2>&1; then
    return 0
  fi

  local signing_public_key="${RELEASE_TAG_SIGNING_PUBLIC_KEY:-}"
  if [[ -n "$signing_public_key" ]]; then
    if ! command -v gpg >/dev/null 2>&1; then
      fail_with_diagnostic "input" "missing-gpg-binary" "gpg is required to verify signed release tags." "false" "gpg-missing"
      return 1
    fi

    if ! printf '%s\n' "$signing_public_key" | gpg --batch --import >/dev/null 2>&1; then
      fail_with_diagnostic "input" "invalid-signing-public-key" "RELEASE_TAG_SIGNING_PUBLIC_KEY could not be imported by gpg." "false" "invalid-signing-key"
      return 1
    fi

    if git verify-tag "$release_tag" >/dev/null 2>&1; then
      return 0
    fi

    fail_with_diagnostic "policy" "unverifiable-tag-signature" "Release tag '${release_tag}' signature could not be verified after importing RELEASE_TAG_SIGNING_PUBLIC_KEY." "false" "signature-verification-failed"
    return 1
  fi

  fail_with_diagnostic "policy" "unsigned-tag" "Release tag '${release_tag}' must be a signed git tag." "false" "tag-not-signed"
  return 1
}

main() {
  if [[ "${1:-}" == "--classify-failure" ]]; then
    IFS='|' read -r classified_retry_eligible classified_retry_reason <<< "$(classify_retry_eligibility "${2:-}")"
    echo "retry-eligible=${classified_retry_eligible}"
    echo "retry_reason=${classified_retry_reason}"
    echo "retry-reason=${classified_retry_reason}"
    return 0
  fi

  local release_tag="${RELEASE_TAG:-${GITHUB_REF_NAME:-}}"
  if [[ -z "$release_tag" ]] && git describe --tags --exact-match >/dev/null 2>&1; then
    release_tag="$(git describe --tags --exact-match)"
  fi

  local semver_tag_regex='^v([0-9]+)\.([0-9]+)\.([0-9]+)$'
  local release_major=""
  local release_minor=""
  local release_patch=""

  if [[ -z "$release_tag" ]]; then
    fail_with_diagnostic "input" "missing-tag" "Release tag is required and must match vMAJOR.MINOR.PATCH." "false" "no-tag"
  else
    if [[ ! "$release_tag" =~ $semver_tag_regex ]]; then
      fail_with_diagnostic "input" "invalid-tag-format" "Tag '${release_tag}' does not match vMAJOR.MINOR.PATCH." "false" "invalid-semver-tag"
    else
      release_major="${BASH_REMATCH[1]}"
      release_minor="${BASH_REMATCH[2]}"
      release_patch="${BASH_REMATCH[3]}"
      if (( release_major < 1 )); then
        fail_with_diagnostic "policy" "minimum-release-version" "v1.0.0 is the minimum supported production release line." "false" "below-v1"
      fi
    fi

    if [[ "$release_tag" == *-beta* || "$release_tag" == *-rc* ]]; then
      fail_with_diagnostic "input" "prerelease-tag" "Prerelease tags (-beta/-rc) are excluded from v1 Central publication." "false" "prerelease-not-allowed"
    fi
  fi

  local previous_release_tag="${PREVIOUS_RELEASE_TAG:-}"
  if [[ -n "$previous_release_tag" && -n "$release_major" ]]; then
    if [[ "$previous_release_tag" =~ $semver_tag_regex ]]; then
      local prev_major="${BASH_REMATCH[1]}"
      local prev_minor="${BASH_REMATCH[2]}"
      local prev_patch="${BASH_REMATCH[3]}"
      if (( release_major == prev_major && release_minor == prev_minor && release_patch <= prev_patch )); then
        fail_with_diagnostic "policy" "hotfix-patch-policy" "Hotfix policy requires PATCH to strictly increase under the same MAJOR.MINOR line." "false" "hotfix-policy-violation"
      fi
    fi
  fi

  local project_version="${PROJECT_VERSION:-$(read_project_version)}"
  if [[ -z "$project_version" ]]; then
    fail_with_diagnostic "input" "missing-project-version" "Project version is required in gradle.properties." "false" "version-missing"
  elif [[ "$project_version" == *SNAPSHOT* ]]; then
    fail_with_diagnostic "policy" "snapshot-version" "Snapshot publication is blocked for Maven Central release tags." "false" "snapshot-blocked"
  fi

  local required_env_vars=(
    "JRELEASER_MAVENCENTRAL_USERNAME"
    "JRELEASER_MAVENCENTRAL_PASSWORD"
    "JRELEASER_GPG_SECRET_KEY"
    "JRELEASER_GPG_PUBLIC_KEY"
    "JRELEASER_GPG_PASSPHRASE"
  )
  local missing_env_vars=()
  local var_name
  for var_name in "${required_env_vars[@]}"; do
    if [[ -z "${!var_name:-}" ]]; then
      missing_env_vars+=("$var_name")
    fi
  done
  if [[ "${#missing_env_vars[@]}" -gt 0 ]]; then
    local missing_sorted
    missing_sorted="$(join_sorted "${missing_env_vars[@]}")"
    fail_with_diagnostic "auth" "missing-credentials" "Missing required release credentials: ${missing_sorted}" "false" "credentials-missing"
  fi

  local release_freeze_hours="${RELEASE_FREEZE_HOURS:-${YANOTE_RELEASE_FREEZE_HOURS:-24}}"
  local release_freeze_approved="${RELEASE_FREEZE_APPROVED:-false}"
  if ! is_truthy "$release_freeze_approved"; then
    fail_with_diagnostic "policy" "release-freeze" "Release freeze approval is required before publication (expected RELEASE_FREEZE_APPROVED=true)." "false" "freeze-not-approved"
  fi

  local main_ref=""
  if git show-ref --verify --quiet "refs/remotes/origin/main"; then
    main_ref="origin/main"
  elif git show-ref --verify --quiet "refs/heads/main"; then
    main_ref="main"
  else
    fail_with_diagnostic "input" "missing-main-ref" "Unable to resolve main branch reference (origin/main or main)." "false" "main-ref-missing"
  fi

  if [[ -n "$release_tag" ]]; then
    if git rev-parse --verify --quiet "refs/tags/${release_tag}" >/dev/null; then
      if ! verify_release_tag_signature "$release_tag"; then
        :
      fi

      if [[ -n "$main_ref" ]]; then
        local tag_commit
        tag_commit="$(git rev-list -n 1 "$release_tag")"
        if ! git merge-base --is-ancestor "$tag_commit" "$main_ref"; then
          fail_with_diagnostic "policy" "main-lineage" "Release tag '${release_tag}' is not reachable from ${main_ref}." "false" "not-on-main"
        fi
      fi
    else
      fail_with_diagnostic "input" "missing-tag-ref" "Tag '${release_tag}' does not exist in the local repository." "false" "tag-not-found"
    fi
  fi

  local publish_failure_reason="${PUBLISH_FAILURE_REASON:-}"
  IFS='|' read -r retry_eligible retry_reason <<< "$(classify_retry_eligibility "$publish_failure_reason")"
  if [[ "$retry_eligible" == "true" ]]; then
    add_diagnostic "transient" "retry-eligibility" "Transient publish failure detected for deterministic same-tag retry evaluation." "$retry_eligible" "$retry_reason"
  fi

  echo "release-tag=${release_tag:-unknown}"
  echo "project-version=${project_version:-unknown}"
  echo "release-freeze-hours=${release_freeze_hours}"
  echo "release-freeze-approved=${release_freeze_approved}"
  echo "retry-eligible=${retry_eligible}"
  echo "retry_reason=${retry_reason}"
  echo "retry-reason=${retry_reason}"

  if [[ "$HAS_FAILURE" == "true" ]]; then
    render_diagnostics
    return 1
  fi

  render_diagnostics
  echo "preflight-status=pass"
}

main "$@"
