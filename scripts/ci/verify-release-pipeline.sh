#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ARTIFACT_DIR="${YANOTE_RELEASE_PIPELINE_PROOF_DIR:-.yanote-ci/release-pipeline-proof}"
ARTIFACT_ROOT="${ARTIFACT_DIR}"
if [[ "${ARTIFACT_ROOT}" != /* ]]; then
  ARTIFACT_ROOT="${ROOT_DIR}/${ARTIFACT_ROOT}"
fi

RELEASE_TAG="${YANOTE_RELEASE_PROOF_TAG:-v1.2.3}"
RELEASE_VERSION="${RELEASE_TAG#v}"
PREVIOUS_RELEASE_TAG="${YANOTE_RELEASE_PROOF_PREVIOUS_TAG:-v1.2.2}"

FIXTURE_ARCHIVE_PATH="${ROOT_DIR}/scripts/release/fixtures/preflight-runtime/preflight-signed-main.tar.gz.base64"
FIXTURE_PUBLIC_KEY_PATH="${ROOT_DIR}/scripts/release/fixtures/test-release-signing-public.asc"
FIXTURE_ROOT="${ARTIFACT_ROOT}/preflight-fixture"
FIXTURE_TARBALL_PATH="${FIXTURE_ROOT}/fixture.tar.gz"
PREFLIGHT_WORKTREE="${FIXTURE_ROOT}/fixture/worktree"
FIXTURE_ORIGIN_DIR="${FIXTURE_ROOT}/fixture/origin.git"
GPG_WRAPPER_PATH="${FIXTURE_ROOT}/gpg-loopback.sh"
GENERATED_SIGNING_HOME=""
GENERATED_PRIVATE_KEY_PATH="${FIXTURE_ROOT}/generated-signing-private.asc"
GENERATED_PUBLIC_KEY_PATH="${FIXTURE_ROOT}/generated-signing-public.asc"

COMPAT_ROOT="${ARTIFACT_ROOT}/git-compatible-root"

BUILD_ROOT="${ROOT_DIR}/build"
STAGING_ROOT="${BUILD_ROOT}/staging-deploy"
ANALYZER_ARCHIVE_PATH="${BUILD_ROOT}/distributions/yanote-analyzer.zip"
RELEASE_ASSET_INDEX_PATH="${BUILD_ROOT}/release-assets/index.txt"
BUNDLE_ROOT="${BUILD_ROOT}/release-bundle/${RELEASE_TAG}"
BUNDLE_MANIFEST_PATH="${BUNDLE_ROOT}/${RELEASE_TAG}-manifest.txt"
BUNDLE_ASSETS_DIR="${BUNDLE_ROOT}/assets"
RELEASE_NOTES_PATH="${BUILD_ROOT}/release-notes.md"
SBOM_PATH="${BUILD_ROOT}/reports/cyclonedx/bom.json"
JRELEASER_OUTPUT_PATH="${BUILD_ROOT}/jreleaser/output.properties"
TRACEABILITY_JSON_PATH="${ROOT_DIR}/docs/traceability/v1-requirements-tests.json"
TRACEABILITY_MARKDOWN_PATH="${ROOT_DIR}/docs/traceability/v1-requirements-tests.md"

PHASE_STATUS_PATH="${ARTIFACT_ROOT}/phase-status.txt"
TAG_CONTEXT_PATH="${ARTIFACT_ROOT}/tag-context.txt"
STAGING_INVENTORY_PATH="${ARTIFACT_ROOT}/staged-publications.txt"
STAGING_MODULES_PATH="${ARTIFACT_ROOT}/staging-modules.txt"
RELEASE_BUNDLE_ASSETS_PATH="${ARTIFACT_ROOT}/release-bundle-assets.txt"
RELEASE_BUNDLE_MANIFEST_COPY_PATH="${ARTIFACT_ROOT}/release-bundle-manifest.txt"
RELEASE_ASSET_INDEX_COPY_PATH="${ARTIFACT_ROOT}/release-assets-index.txt"
RELEASE_NOTES_COPY_PATH="${ARTIFACT_ROOT}/release-notes.md"
TRACEABILITY_JSON_COPY_PATH="${ARTIFACT_ROOT}/traceability-v1-requirements-tests.json"
TRACEABILITY_MARKDOWN_COPY_PATH="${ARTIFACT_ROOT}/traceability-v1-requirements-tests.md"
JRELEASER_OUTPUT_COPY_PATH="${ARTIFACT_ROOT}/jreleaser-output.properties"
MANIFEST_PATH="${ARTIFACT_ROOT}/artifact-manifest.txt"
SOURCE_PATHS_PATH="${ARTIFACT_ROOT}/artifact-source-paths.txt"

PREFLIGHT_STDOUT_PATH="${ARTIFACT_ROOT}/preflight.stdout.log"
PREFLIGHT_STDERR_PATH="${ARTIFACT_ROOT}/preflight.stderr.log"
PREFLIGHT_EXIT_CODE_PATH="${ARTIFACT_ROOT}/preflight.exit-code.txt"
PUBLISH_STDOUT_PATH="${ARTIFACT_ROOT}/publish.stdout.log"
PUBLISH_STDERR_PATH="${ARTIFACT_ROOT}/publish.stderr.log"
PUBLISH_EXIT_CODE_PATH="${ARTIFACT_ROOT}/publish.exit-code.txt"
BUNDLE_STDOUT_PATH="${ARTIFACT_ROOT}/bundle.stdout.log"
BUNDLE_STDERR_PATH="${ARTIFACT_ROOT}/bundle.stderr.log"
BUNDLE_EXIT_CODE_PATH="${ARTIFACT_ROOT}/bundle.exit-code.txt"
NOTES_STDOUT_PATH="${ARTIFACT_ROOT}/notes.stdout.log"
NOTES_STDERR_PATH="${ARTIFACT_ROOT}/notes.stderr.log"
NOTES_EXIT_CODE_PATH="${ARTIFACT_ROOT}/notes.exit-code.txt"

PREFLIGHT_TIMEOUT_SECONDS="${YANOTE_RELEASE_PREFLIGHT_TIMEOUT_SECONDS:-60}"
PUBLISH_TIMEOUT_SECONDS="${YANOTE_RELEASE_PUBLISH_TIMEOUT_SECONDS:-1200}"
BUNDLE_TIMEOUT_SECONDS="${YANOTE_RELEASE_BUNDLE_TIMEOUT_SECONDS:-120}"
NOTES_TIMEOUT_SECONDS="${YANOTE_RELEASE_NOTES_TIMEOUT_SECONDS:-60}"

EXPECTED_STAGING_PUBLICATIONS=(
  "build/staging-deploy/io/github/zuevrs/yanote-core/${RELEASE_VERSION}/yanote-core-${RELEASE_VERSION}.pom"
  "build/staging-deploy/io/github/zuevrs/yanote-recorder-spring-mvc/${RELEASE_VERSION}/yanote-recorder-spring-mvc-${RELEASE_VERSION}.pom"
  "build/staging-deploy/io/github/zuevrs/yanote-recorder-spring-kafka/${RELEASE_VERSION}/yanote-recorder-spring-kafka-${RELEASE_VERSION}.pom"
  "build/staging-deploy/io/github/zuevrs/yanote-recorder-spring-amqp/${RELEASE_VERSION}/yanote-recorder-spring-amqp-${RELEASE_VERSION}.pom"
  "build/staging-deploy/io/github/zuevrs/yanote-test-tags-restassured/${RELEASE_VERSION}/yanote-test-tags-restassured-${RELEASE_VERSION}.pom"
  "build/staging-deploy/io/github/zuevrs/yanote-test-tags-cucumber/${RELEASE_VERSION}/yanote-test-tags-cucumber-${RELEASE_VERSION}.pom"
  "build/staging-deploy/io/github/zuevrs/yanote-gradle-plugin/${RELEASE_VERSION}/yanote-gradle-plugin-${RELEASE_VERSION}.pom"
  "build/staging-deploy/io/github/zuevrs/yanote/gradle/io.github.zuevrs.yanote.gradle.gradle.plugin/${RELEASE_VERSION}/io.github.zuevrs.yanote.gradle.gradle.plugin-${RELEASE_VERSION}.pom"
)

PROOF_STATUS="running"
PREFLIGHT_STATUS="pending"
PUBLISH_STATUS="pending"
BUNDLE_STATUS="pending"
NOTES_STATUS="pending"
PREFLIGHT_EXIT_CODE="not-run"
PUBLISH_EXIT_CODE="not-run"
BUNDLE_EXIT_CODE="not-run"
NOTES_EXIT_CODE="not-run"
PREFLIGHT_RELEASE_TAG="unknown"
PREFLIGHT_PROJECT_VERSION="unknown"
PREFLIGHT_RETRY_ELIGIBLE="unknown"
PREFLIGHT_RETRY_REASON="unknown"
TRACEABILITY_SNAPSHOT="unknown"
STAGING_PUBLICATION_COUNT="0"
RELEASE_BUNDLE_ASSET_COUNT="0"
PROOF_SUMMARY="pending"

print_artifacts() {
  echo "Artifacts retained at: ${ARTIFACT_ROOT}" >&2
  echo "  manifest: ${MANIFEST_PATH}" >&2
  echo "  phase_status: ${PHASE_STATUS_PATH}" >&2
  echo "  tag_context: ${TAG_CONTEXT_PATH}" >&2
  echo "  source_paths: ${SOURCE_PATHS_PATH}" >&2
  echo "  preflight_stdout: ${PREFLIGHT_STDOUT_PATH}" >&2
  echo "  preflight_stderr: ${PREFLIGHT_STDERR_PATH}" >&2
  echo "  publish_stdout: ${PUBLISH_STDOUT_PATH}" >&2
  echo "  publish_stderr: ${PUBLISH_STDERR_PATH}" >&2
  echo "  bundle_stdout: ${BUNDLE_STDOUT_PATH}" >&2
  echo "  bundle_stderr: ${BUNDLE_STDERR_PATH}" >&2
  echo "  notes_stdout: ${NOTES_STDOUT_PATH}" >&2
  echo "  notes_stderr: ${NOTES_STDERR_PATH}" >&2
  echo "  staging_inventory: ${STAGING_INVENTORY_PATH}" >&2
  echo "  staging_modules: ${STAGING_MODULES_PATH}" >&2
  echo "  bundle_assets: ${RELEASE_BUNDLE_ASSETS_PATH}" >&2
  echo "  bundle_manifest_copy: ${RELEASE_BUNDLE_MANIFEST_COPY_PATH}" >&2
  echo "  release_notes_copy: ${RELEASE_NOTES_COPY_PATH}" >&2
  echo "  compat_root: ${COMPAT_ROOT}" >&2
  echo "  staging_root: ${STAGING_ROOT}" >&2
  echo "  bundle_root: ${BUNDLE_ROOT}" >&2
  echo "  release_notes: ${RELEASE_NOTES_PATH}" >&2
}

show_failure_tail() {
  local file
  for file in \
    "${PREFLIGHT_STDERR_PATH}" \
    "${PREFLIGHT_STDOUT_PATH}" \
    "${PUBLISH_STDERR_PATH}" \
    "${PUBLISH_STDOUT_PATH}" \
    "${BUNDLE_STDERR_PATH}" \
    "${BUNDLE_STDOUT_PATH}" \
    "${NOTES_STDERR_PATH}" \
    "${NOTES_STDOUT_PATH}"; do
    if [[ -s "${file}" ]]; then
      echo "--- $(basename "${file}") (tail) ---" >&2
      tail -n 80 "${file}" >&2 || true
    fi
  done
}

write_phase_status() {
  {
    printf 'preflight=%s\n' "${PREFLIGHT_STATUS}"
    printf 'publish=%s\n' "${PUBLISH_STATUS}"
    printf 'bundle=%s\n' "${BUNDLE_STATUS}"
    printf 'notes=%s\n' "${NOTES_STATUS}"
  } > "${PHASE_STATUS_PATH}"
}

write_tag_context() {
  {
    printf 'release_tag=%s\n' "${RELEASE_TAG}"
    printf 'release_version=%s\n' "${RELEASE_VERSION}"
    printf 'previous_release_tag=%s\n' "${PREVIOUS_RELEASE_TAG}"
    printf 'preflight_release_tag=%s\n' "${PREFLIGHT_RELEASE_TAG}"
    printf 'preflight_project_version=%s\n' "${PREFLIGHT_PROJECT_VERSION}"
    printf 'preflight_retry_eligible=%s\n' "${PREFLIGHT_RETRY_ELIGIBLE}"
    printf 'preflight_retry_reason=%s\n' "${PREFLIGHT_RETRY_REASON}"
    printf 'traceability_snapshot=%s\n' "${TRACEABILITY_SNAPSHOT}"
  } > "${TAG_CONTEXT_PATH}"
}

write_source_paths_note() {
  {
    printf 'artifact_dir=%s\n' "${ARTIFACT_ROOT}"
    printf 'compat_root=%s\n' "${COMPAT_ROOT}"
    printf 'fixture_root=%s\n' "${FIXTURE_ROOT}"
    printf 'fixture_archive=%s\n' "${FIXTURE_ARCHIVE_PATH}"
    printf 'fixture_public_key=%s\n' "${FIXTURE_PUBLIC_KEY_PATH}"
    printf 'generated_signing_home=%s\n' "${GENERATED_SIGNING_HOME}"
    printf 'generated_public_key=%s\n' "${GENERATED_PUBLIC_KEY_PATH}"
    printf 'generated_private_key=%s\n' "${GENERATED_PRIVATE_KEY_PATH}"
    printf 'preflight_worktree=%s\n' "${PREFLIGHT_WORKTREE}"
    printf 'staging_root=%s\n' "${STAGING_ROOT}"
    printf 'analyzer_archive=%s\n' "${ANALYZER_ARCHIVE_PATH}"
    printf 'sbom=%s\n' "${SBOM_PATH}"
    printf 'release_asset_index=%s\n' "${RELEASE_ASSET_INDEX_PATH}"
    printf 'bundle_root=%s\n' "${BUNDLE_ROOT}"
    printf 'bundle_manifest=%s\n' "${BUNDLE_MANIFEST_PATH}"
    printf 'bundle_assets=%s\n' "${BUNDLE_ASSETS_DIR}"
    printf 'release_notes=%s\n' "${RELEASE_NOTES_PATH}"
    printf 'traceability_json=%s\n' "${TRACEABILITY_JSON_PATH}"
    printf 'traceability_markdown=%s\n' "${TRACEABILITY_MARKDOWN_PATH}"
    printf 'jreleaser_output=%s\n' "${JRELEASER_OUTPUT_PATH}"
    printf 'staging_inventory=%s\n' "${STAGING_INVENTORY_PATH}"
    printf 'release_bundle_assets=%s\n' "${RELEASE_BUNDLE_ASSETS_PATH}"
    printf 'preflight_command=env RELEASE_TAG=%s PROJECT_VERSION=%s PREVIOUS_RELEASE_TAG=%s bash %s/scripts/release/preflight.sh\n' "${RELEASE_TAG}" "${RELEASE_VERSION}" "${PREVIOUS_RELEASE_TAG}" "${ROOT_DIR}"
    printf 'publish_command=%s/.gradlew -Pversion=%s publish distStandaloneAnalyzer cyclonedxBom jreleaserConfig --stacktrace\n' "${COMPAT_ROOT}" "${RELEASE_VERSION}"
    printf 'bundle_command=RELEASE_TAG=%s RELEASE_ASSET_INDEX=build/release-assets/index.txt bash scripts/release/assemble-release-assets.sh\n' "${RELEASE_TAG}"
    printf 'notes_command=node scripts/release/render-release-notes.mjs --output build/release-notes.md --version %s --previous-tag %s\n' "${RELEASE_TAG}" "${PREVIOUS_RELEASE_TAG}"
  } > "${SOURCE_PATHS_PATH}"
}

write_manifest() {
  {
    printf 'created_at=%s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    printf 'proof_status=%s\n' "${PROOF_STATUS}"
    printf 'release_tag=%s\n' "${RELEASE_TAG}"
    printf 'release_version=%s\n' "${RELEASE_VERSION}"
    printf 'previous_release_tag=%s\n' "${PREVIOUS_RELEASE_TAG}"
    printf 'preflight_status=%s\n' "${PREFLIGHT_STATUS}"
    printf 'publish_status=%s\n' "${PUBLISH_STATUS}"
    printf 'bundle_status=%s\n' "${BUNDLE_STATUS}"
    printf 'notes_status=%s\n' "${NOTES_STATUS}"
    printf 'preflight_exit_code=%s\n' "${PREFLIGHT_EXIT_CODE}"
    printf 'publish_exit_code=%s\n' "${PUBLISH_EXIT_CODE}"
    printf 'bundle_exit_code=%s\n' "${BUNDLE_EXIT_CODE}"
    printf 'notes_exit_code=%s\n' "${NOTES_EXIT_CODE}"
    printf 'preflight_release_tag=%s\n' "${PREFLIGHT_RELEASE_TAG}"
    printf 'preflight_project_version=%s\n' "${PREFLIGHT_PROJECT_VERSION}"
    printf 'preflight_retry_eligible=%s\n' "${PREFLIGHT_RETRY_ELIGIBLE}"
    printf 'preflight_retry_reason=%s\n' "${PREFLIGHT_RETRY_REASON}"
    printf 'traceability_snapshot=%s\n' "${TRACEABILITY_SNAPSHOT}"
    printf 'staging_publication_count=%s\n' "${STAGING_PUBLICATION_COUNT}"
    printf 'release_bundle_asset_count=%s\n' "${RELEASE_BUNDLE_ASSET_COUNT}"
    printf 'proof_summary=%s\n' "${PROOF_SUMMARY}"
    printf 'source_paths_note=%s\n' "$(basename "${SOURCE_PATHS_PATH}")"
    printf 'phase_status=%s\n' "$(basename "${PHASE_STATUS_PATH}")"
    printf 'observability=%s\n' 'preflight.stdout.log,preflight.stderr.log,publish.stdout.log,publish.stderr.log,bundle.stdout.log,bundle.stderr.log,notes.stdout.log,notes.stderr.log,phase-status.txt,tag-context.txt,staged-publications.txt,staging-modules.txt,release-bundle-assets.txt,release-bundle-manifest.txt,release-notes.md,traceability-v1-requirements-tests.json,traceability-v1-requirements-tests.md,jreleaser-output.properties'
  } > "${MANIFEST_PATH}"
}

fail() {
  local message="$1"
  PROOF_STATUS="failure"
  write_phase_status
  write_tag_context
  write_source_paths_note
  write_manifest
  echo "ERROR: ${message}" >&2
  show_failure_tail
  print_artifacts
  exit 1
}

run_shell_with_timeout() {
  local timeout_seconds="$1"
  local working_dir="$2"
  local stdout_path="$3"
  local stderr_path="$4"
  local command="$5"

  python3 - "$timeout_seconds" "$working_dir" "$stdout_path" "$stderr_path" "$command" <<'PY'
import os
import subprocess
import sys

timeout_seconds = int(sys.argv[1])
working_dir = sys.argv[2]
stdout_path = sys.argv[3]
stderr_path = sys.argv[4]
command = sys.argv[5]

with open(stdout_path, 'wb') as stdout_file, open(stderr_path, 'wb') as stderr_file:
    try:
        completed = subprocess.run(
            ['bash', '-lc', command],
            cwd=working_dir,
            stdout=stdout_file,
            stderr=stderr_file,
            timeout=timeout_seconds,
            env=os.environ.copy(),
            check=False,
        )
    except subprocess.TimeoutExpired:
        stderr_file.write(
            f"YANOTE_TIMEOUT seconds={timeout_seconds} cwd={working_dir} command={command}\n".encode('utf-8')
        )
        raise SystemExit(124)

raise SystemExit(completed.returncode)
PY
}

require_file() {
  local target_path="$1"
  local message="$2"
  [[ -f "${target_path}" ]] || fail "${message}"
}

reset_release_outputs() {
  rm -rf \
    "${STAGING_ROOT}" \
    "${BUILD_ROOT}/release-assets" \
    "${BUNDLE_ROOT}" \
    "${BUILD_ROOT}/jreleaser" \
    "${BUILD_ROOT}/reports/cyclonedx" \
    "${BUILD_ROOT}/reports/cyclonedx-direct"
  rm -f \
    "${ANALYZER_ARCHIVE_PATH}" \
    "${RELEASE_NOTES_PATH}"
}

restore_preflight_fixture() {
  rm -rf "${FIXTURE_ROOT}"
  mkdir -p "${FIXTURE_ROOT}"

  python3 - "${FIXTURE_ARCHIVE_PATH}" "${FIXTURE_TARBALL_PATH}" <<'PY'
from pathlib import Path
import base64
import sys

source = Path(sys.argv[1])
target = Path(sys.argv[2])
target.write_bytes(base64.b64decode(source.read_text().strip()))
PY

  tar -xzf "${FIXTURE_TARBALL_PATH}" -C "${FIXTURE_ROOT}"
  cat > "${GPG_WRAPPER_PATH}" <<'EOF'
#!/usr/bin/env bash
exec gpg --batch --pinentry-mode loopback "$@"
EOF
  chmod 755 "${GPG_WRAPPER_PATH}"

  git -C "${PREFLIGHT_WORKTREE}" remote set-url origin "${FIXTURE_ORIGIN_DIR}"
  git -C "${PREFLIGHT_WORKTREE}" config gpg.format openpgp
  git -C "${PREFLIGHT_WORKTREE}" config gpg.program "${GPG_WRAPPER_PATH}"
}

generate_release_signing_fixture() {
  if [[ -n "${GENERATED_SIGNING_HOME:-}" ]]; then
    rm -rf "${GENERATED_SIGNING_HOME}"
  fi
  GENERATED_SIGNING_HOME="$(mktemp -d "${TMPDIR:-/tmp}/yanote-release-proof-gpg.XXXXXX")"
  chmod 700 "${GENERATED_SIGNING_HOME}"

  command -v gpg >/dev/null 2>&1 || fail "gpg is required to generate the temporary release-signing fixture."

  cat > "${GENERATED_SIGNING_HOME}/keygen.batch" <<'EOF'
%no-protection
Key-Type: RSA
Key-Length: 3072
Subkey-Type: RSA
Subkey-Length: 3072
Subkey-Usage: sign
Name-Real: Yanote Release Proof
Name-Email: release-proof@yanote.invalid
Expire-Date: 0
%commit
EOF

  GNUPGHOME="${GENERATED_SIGNING_HOME}" gpg --batch --generate-key "${GENERATED_SIGNING_HOME}/keygen.batch" >/dev/null 2>&1 \
    || fail "Failed to generate the temporary release-signing fixture keypair."

  local fingerprint
  fingerprint="$(GNUPGHOME="${GENERATED_SIGNING_HOME}" gpg --batch --with-colons --list-secret-keys | awk -F: '/^fpr:/{print $10; exit}')"
  [[ -n "${fingerprint}" ]] || fail "Temporary release-signing fixture keypair did not expose a secret-key fingerprint."

  GNUPGHOME="${GENERATED_SIGNING_HOME}" gpg --batch --armor --export-secret-keys "${fingerprint}" > "${GENERATED_PRIVATE_KEY_PATH}" \
    || fail "Failed to export the temporary release-signing private key fixture."
  GNUPGHOME="${GENERATED_SIGNING_HOME}" gpg --batch --armor --export "${fingerprint}" > "${GENERATED_PUBLIC_KEY_PATH}" \
    || fail "Failed to export the temporary release-signing public key fixture."

  chmod 600 "${GENERATED_PRIVATE_KEY_PATH}" "${GENERATED_PUBLIC_KEY_PATH}"
}

create_git_compatible_root() {
  rm -rf "${COMPAT_ROOT}"
  python3 - "${ROOT_DIR}" "${COMPAT_ROOT}" <<'PY'
from pathlib import Path
import os
import shutil
import sys

root = Path(sys.argv[1]).resolve()
compat = Path(sys.argv[2]).resolve()
compat.parent.mkdir(parents=True, exist_ok=True)
compat.mkdir(parents=True, exist_ok=True)

for child in root.iterdir():
    if child.name in {'.git', '.yanote-ci'}:
        continue
    target = compat / child.name
    target.symlink_to(os.path.relpath(child, compat), target_is_directory=child.is_dir())

build_target = compat / 'build'
if not build_target.exists():
    build_target.symlink_to(os.path.relpath(root / 'build', compat), target_is_directory=True)

dotgit = root / '.git'
if dotgit.is_file():
    text = dotgit.read_text().strip()
    if not text.startswith('gitdir: '):
        raise SystemExit(f'unexpected .git file format: {text!r}')
    worktree_gitdir = Path(text.split(': ', 1)[1]).resolve()
else:
    worktree_gitdir = dotgit.resolve()

commondir_file = worktree_gitdir / 'commondir'
common_gitdir = (worktree_gitdir / commondir_file.read_text().strip()).resolve() if commondir_file.exists() else worktree_gitdir
compat_gitdir = compat / '.git'
compat_gitdir.mkdir()

for name in ['HEAD', 'index', 'ORIG_HEAD']:
    src = worktree_gitdir / name
    if src.exists():
        (compat_gitdir / name).symlink_to(os.path.relpath(src, compat_gitdir))

for name in ['config', 'objects', 'refs', 'packed-refs', 'hooks', 'info']:
    src = common_gitdir / name
    if src.exists():
        (compat_gitdir / name).symlink_to(os.path.relpath(src, compat_gitdir), target_is_directory=src.is_dir())

for name in ['logs', 'worktrees']:
    src = worktree_gitdir / name
    if src.exists():
        (compat_gitdir / name).symlink_to(os.path.relpath(src, compat_gitdir), target_is_directory=src.is_dir())
PY
}

assert_staged_publications() {
  local expected_path
  local missing=()
  for expected_path in "${EXPECTED_STAGING_PUBLICATIONS[@]}"; do
    if ! grep -Fxq "${expected_path}" "${STAGING_INVENTORY_PATH}"; then
      missing+=("${expected_path}")
    fi
  done
  if [[ "${#missing[@]}" -gt 0 ]]; then
    fail "Publish phase did not stage every expected publication module for ${RELEASE_TAG}; missing: $(printf '%s' "${missing[*]}")"
  fi
}

capture_staging_inventory() {
  find "${STAGING_ROOT}" -type f \( -name '*.pom' -o -name '*.module' -o -name '*.jar' -o -name '*.asc' \) \
    | LC_ALL=C sort \
    | sed "s#^${ROOT_DIR}/##" > "${STAGING_INVENTORY_PATH}"

  python3 - "${STAGING_INVENTORY_PATH}" "${STAGING_MODULES_PATH}" <<'PY'
from pathlib import Path
import re
import sys

inventory = Path(sys.argv[1]).read_text(encoding='utf-8').splitlines()
modules = []
seen = set()
pattern = re.compile(r'build/staging-deploy/.+?/([^/]+)/[^/]+/[^/]+$')
for line in inventory:
    match = pattern.match(line)
    if not match:
        continue
    module = match.group(1)
    if module not in seen:
      seen.add(module)
      modules.append(module)
Path(sys.argv[2]).write_text("\n".join(modules) + ("\n" if modules else ""), encoding='utf-8')
PY

  STAGING_PUBLICATION_COUNT="$(wc -l < "${STAGING_INVENTORY_PATH}" | tr -d ' ')"
  assert_staged_publications
}

capture_traceability_snapshot() {
  TRACEABILITY_SNAPSHOT="$(awk -F'"' '/"snapshotId"[[:space:]]*:/ {print $4; exit}' "${TRACEABILITY_JSON_PATH}")"
  if [[ -z "${TRACEABILITY_SNAPSHOT}" ]]; then
    fail "Traceability snapshot is missing from ${TRACEABILITY_JSON_PATH}."
  fi
}

refresh_proof_copies() {
  cp "${BUNDLE_MANIFEST_PATH}" "${RELEASE_BUNDLE_MANIFEST_COPY_PATH}"
  cp "${RELEASE_ASSET_INDEX_PATH}" "${RELEASE_ASSET_INDEX_COPY_PATH}"
  cp "${RELEASE_NOTES_PATH}" "${RELEASE_NOTES_COPY_PATH}"
  cp "${TRACEABILITY_JSON_PATH}" "${TRACEABILITY_JSON_COPY_PATH}"
  cp "${TRACEABILITY_MARKDOWN_PATH}" "${TRACEABILITY_MARKDOWN_COPY_PATH}"
  cp "${JRELEASER_OUTPUT_PATH}" "${JRELEASER_OUTPUT_COPY_PATH}"

  find "${BUNDLE_ASSETS_DIR}" -type f | LC_ALL=C sort | sed "s#^${ROOT_DIR}/##" > "${RELEASE_BUNDLE_ASSETS_PATH}"
  RELEASE_BUNDLE_ASSET_COUNT="$(wc -l < "${RELEASE_BUNDLE_ASSETS_PATH}" | tr -d ' ')"
}

run_preflight_phase() {
  local release_tag_signing_public_key
  release_tag_signing_public_key="$(< "${FIXTURE_PUBLIC_KEY_PATH}")"

  PREFLIGHT_STATUS="running"
  write_phase_status
  write_source_paths_note
  write_manifest

  local preflight_command
  preflight_command=$(cat <<EOF
export RELEASE_TAG='${RELEASE_TAG}'
export PROJECT_VERSION='${RELEASE_VERSION}'
export PREVIOUS_RELEASE_TAG='${PREVIOUS_RELEASE_TAG}'
export RELEASE_TAG_SIGNING_PUBLIC_KEY="${release_tag_signing_public_key}"
export RELEASE_FREEZE_APPROVED='true'
export JRELEASER_MAVENCENTRAL_USERNAME='fixture-user'
export JRELEASER_MAVENCENTRAL_PASSWORD='fixture-password'
export JRELEASER_GPG_SECRET_KEY='fixture-secret-key'
export JRELEASER_GPG_PUBLIC_KEY='fixture-public-key'
export JRELEASER_GPG_PASSPHRASE='fixture-passphrase'
bash '${ROOT_DIR}/scripts/release/preflight.sh'
EOF
)

  if run_shell_with_timeout \
    "${PREFLIGHT_TIMEOUT_SECONDS}" \
    "${PREFLIGHT_WORKTREE}" \
    "${PREFLIGHT_STDOUT_PATH}" \
    "${PREFLIGHT_STDERR_PATH}" \
    "${preflight_command}"; then
    PREFLIGHT_EXIT_CODE="0"
  else
    PREFLIGHT_EXIT_CODE="$?"
  fi
  printf '%s\n' "${PREFLIGHT_EXIT_CODE}" > "${PREFLIGHT_EXIT_CODE_PATH}"

  PREFLIGHT_RELEASE_TAG="$(awk -F= '/^release-tag=/{print $2}' "${PREFLIGHT_STDOUT_PATH}" | tail -n 1)"
  PREFLIGHT_PROJECT_VERSION="$(awk -F= '/^project-version=/{print $2}' "${PREFLIGHT_STDOUT_PATH}" | tail -n 1)"
  PREFLIGHT_RETRY_ELIGIBLE="$(awk -F= '/^retry-eligible=/{print $2}' "${PREFLIGHT_STDOUT_PATH}" | tail -n 1)"
  PREFLIGHT_RETRY_REASON="$(awk -F= '/^retry_reason=/{print $2}' "${PREFLIGHT_STDOUT_PATH}" | tail -n 1)"

  if [[ "${PREFLIGHT_EXIT_CODE}" == "124" ]]; then
    PREFLIGHT_STATUS="timeout"
    write_phase_status
    write_tag_context
    write_manifest
    fail "Preflight phase timed out after ${PREFLIGHT_TIMEOUT_SECONDS}s; inspect ${PREFLIGHT_STDOUT_PATH} and ${PREFLIGHT_STDERR_PATH}."
  fi
  if [[ "${PREFLIGHT_EXIT_CODE}" != "0" ]]; then
    PREFLIGHT_STATUS="failed"
    write_phase_status
    write_tag_context
    write_manifest
    fail "Preflight phase failed with exit ${PREFLIGHT_EXIT_CODE}; inspect ${PREFLIGHT_STDOUT_PATH} and ${PREFLIGHT_STDERR_PATH}."
  fi
  if [[ "${PREFLIGHT_RELEASE_TAG}" != "${RELEASE_TAG}" ]]; then
    PREFLIGHT_STATUS="failed"
    write_phase_status
    write_tag_context
    write_manifest
    fail "Preflight emitted release-tag=${PREFLIGHT_RELEASE_TAG:-missing}, expected ${RELEASE_TAG}."
  fi
  if [[ "${PREFLIGHT_PROJECT_VERSION}" != "${RELEASE_VERSION}" ]]; then
    PREFLIGHT_STATUS="failed"
    write_phase_status
    write_tag_context
    write_manifest
    fail "Preflight emitted project-version=${PREFLIGHT_PROJECT_VERSION:-missing}, expected ${RELEASE_VERSION}."
  fi

  PREFLIGHT_STATUS="success"
  write_phase_status
  write_tag_context
  write_manifest
}

run_publish_phase() {
  PUBLISH_STATUS="running"
  write_phase_status
  write_source_paths_note
  write_manifest

  local publish_command
  publish_command=$(cat <<EOF
export JRELEASER_MAVENCENTRAL_USERNAME='fixture-user'
export JRELEASER_MAVENCENTRAL_PASSWORD='fixture-password'
export JRELEASER_GPG_SECRET_KEY='${GENERATED_PRIVATE_KEY_PATH}'
export JRELEASER_GPG_PUBLIC_KEY='${GENERATED_PUBLIC_KEY_PATH}'
export JRELEASER_GPG_PASSPHRASE=''
export JRELEASER_GITHUB_TOKEN='fixture-github-token'
./gradlew -Pversion='${RELEASE_VERSION}' publish distStandaloneAnalyzer cyclonedxBom jreleaserConfig --stacktrace
EOF
)

  if run_shell_with_timeout \
    "${PUBLISH_TIMEOUT_SECONDS}" \
    "${COMPAT_ROOT}" \
    "${PUBLISH_STDOUT_PATH}" \
    "${PUBLISH_STDERR_PATH}" \
    "${publish_command}"; then
    PUBLISH_EXIT_CODE="0"
  else
    PUBLISH_EXIT_CODE="$?"
  fi
  printf '%s\n' "${PUBLISH_EXIT_CODE}" > "${PUBLISH_EXIT_CODE_PATH}"

  if [[ "${PUBLISH_EXIT_CODE}" == "124" ]]; then
    PUBLISH_STATUS="timeout"
    write_phase_status
    write_manifest
    fail "Publish phase timed out after ${PUBLISH_TIMEOUT_SECONDS}s; inspect ${PUBLISH_STDOUT_PATH} and ${PUBLISH_STDERR_PATH}."
  fi
  if [[ "${PUBLISH_EXIT_CODE}" != "0" ]]; then
    PUBLISH_STATUS="failed"
    write_phase_status
    write_manifest
    fail "Publish phase failed with exit ${PUBLISH_EXIT_CODE}; inspect ${PUBLISH_STDOUT_PATH} and ${PUBLISH_STDERR_PATH}."
  fi

  require_file "${ANALYZER_ARCHIVE_PATH}" "Publish phase did not produce the official analyzer archive at build/distributions/yanote-analyzer.zip."
  require_file "${SBOM_PATH}" "Publish phase did not produce build/reports/cyclonedx/bom.json."
  require_file "${JRELEASER_OUTPUT_PATH}" "Publish phase did not retain build/jreleaser/output.properties."
  capture_staging_inventory

  PUBLISH_STATUS="success"
  write_phase_status
  write_manifest
}

run_bundle_phase() {
  BUNDLE_STATUS="running"
  write_phase_status
  write_manifest

  local bundle_command
  bundle_command=$(cat <<EOF
mkdir -p build/release-assets
cat > build/release-assets/index.txt <<'INDEX'
analyzer|build/distributions/yanote-analyzer.zip
INDEX
export RELEASE_TAG='${RELEASE_TAG}'
export RELEASE_ASSET_INDEX='build/release-assets/index.txt'
export SBOM_PATH='build/reports/cyclonedx/bom.json'
export TRACEABILITY_JSON_PATH='docs/traceability/v1-requirements-tests.json'
export TRACEABILITY_MARKDOWN_PATH='docs/traceability/v1-requirements-tests.md'
bash scripts/release/assemble-release-assets.sh
EOF
)

  if run_shell_with_timeout \
    "${BUNDLE_TIMEOUT_SECONDS}" \
    "${COMPAT_ROOT}" \
    "${BUNDLE_STDOUT_PATH}" \
    "${BUNDLE_STDERR_PATH}" \
    "${bundle_command}"; then
    BUNDLE_EXIT_CODE="0"
  else
    BUNDLE_EXIT_CODE="$?"
  fi
  printf '%s\n' "${BUNDLE_EXIT_CODE}" > "${BUNDLE_EXIT_CODE_PATH}"

  if [[ "${BUNDLE_EXIT_CODE}" == "124" ]]; then
    BUNDLE_STATUS="timeout"
    write_phase_status
    write_manifest
    fail "Bundle phase timed out after ${BUNDLE_TIMEOUT_SECONDS}s; inspect ${BUNDLE_STDOUT_PATH} and ${BUNDLE_STDERR_PATH}."
  fi
  if [[ "${BUNDLE_EXIT_CODE}" != "0" ]]; then
    BUNDLE_STATUS="failed"
    write_phase_status
    write_manifest
    fail "Bundle phase failed with exit ${BUNDLE_EXIT_CODE}; inspect ${BUNDLE_STDOUT_PATH} and ${BUNDLE_STDERR_PATH}."
  fi

  require_file "${RELEASE_ASSET_INDEX_PATH}" "Bundle phase did not retain build/release-assets/index.txt."
  require_file "${BUNDLE_MANIFEST_PATH}" "Bundle phase did not retain the release manifest at ${BUNDLE_MANIFEST_PATH}."
  if ! grep -Fxq "release-tag=${RELEASE_TAG}" "${BUNDLE_MANIFEST_PATH}"; then
    BUNDLE_STATUS="failed"
    write_phase_status
    write_manifest
    fail "Bundle manifest ${BUNDLE_MANIFEST_PATH} did not retain release-tag=${RELEASE_TAG}."
  fi
  if ! grep -Fxq "traceability-snapshot=${TRACEABILITY_SNAPSHOT}" "${BUNDLE_MANIFEST_PATH}"; then
    BUNDLE_STATUS="failed"
    write_phase_status
    write_manifest
    fail "Bundle manifest ${BUNDLE_MANIFEST_PATH} did not retain traceability-snapshot=${TRACEABILITY_SNAPSHOT}."
  fi
  if ! grep -Fxq "asset=${RELEASE_TAG}-analyzer.zip" "${BUNDLE_MANIFEST_PATH}"; then
    BUNDLE_STATUS="failed"
    write_phase_status
    write_manifest
    fail "Bundle manifest ${BUNDLE_MANIFEST_PATH} did not retain the analyzer asset row for ${RELEASE_TAG}-analyzer.zip."
  fi
  require_file "${BUNDLE_ASSETS_DIR}/${RELEASE_TAG}-analyzer.zip" "Bundle phase did not stage ${RELEASE_TAG}-analyzer.zip."
  require_file "${BUNDLE_ASSETS_DIR}/${RELEASE_TAG}-analyzer.zip.sha256" "Bundle phase did not stage ${RELEASE_TAG}-analyzer.zip.sha256."
  require_file "${BUNDLE_ASSETS_DIR}/${RELEASE_TAG}-analyzer.zip.sha256.proof" "Bundle phase did not stage ${RELEASE_TAG}-analyzer.zip.sha256.proof."
  require_file "${BUNDLE_ASSETS_DIR}/${RELEASE_TAG}-traceability-json.json" "Bundle phase did not stage ${RELEASE_TAG}-traceability-json.json."
  require_file "${BUNDLE_ASSETS_DIR}/${RELEASE_TAG}-traceability-summary.md" "Bundle phase did not stage ${RELEASE_TAG}-traceability-summary.md."

  BUNDLE_STATUS="success"
  write_phase_status
  write_manifest
}

run_notes_phase() {
  NOTES_STATUS="running"
  write_phase_status
  write_manifest

  local notes_command
  notes_command="node scripts/release/render-release-notes.mjs --output build/release-notes.md --version '${RELEASE_TAG}' --previous-tag '${PREVIOUS_RELEASE_TAG}'"

  if run_shell_with_timeout \
    "${NOTES_TIMEOUT_SECONDS}" \
    "${COMPAT_ROOT}" \
    "${NOTES_STDOUT_PATH}" \
    "${NOTES_STDERR_PATH}" \
    "${notes_command}"; then
    NOTES_EXIT_CODE="0"
  else
    NOTES_EXIT_CODE="$?"
  fi
  printf '%s\n' "${NOTES_EXIT_CODE}" > "${NOTES_EXIT_CODE_PATH}"

  if [[ "${NOTES_EXIT_CODE}" == "124" ]]; then
    NOTES_STATUS="timeout"
    write_phase_status
    write_manifest
    fail "Notes phase timed out after ${NOTES_TIMEOUT_SECONDS}s; inspect ${NOTES_STDOUT_PATH} and ${NOTES_STDERR_PATH}."
  fi
  if [[ "${NOTES_EXIT_CODE}" != "0" ]]; then
    NOTES_STATUS="failed"
    write_phase_status
    write_manifest
    fail "Notes phase failed with exit ${NOTES_EXIT_CODE}; inspect ${NOTES_STDOUT_PATH} and ${NOTES_STDERR_PATH}."
  fi

  require_file "${RELEASE_NOTES_PATH}" "Notes phase did not retain build/release-notes.md."
  if ! grep -Fq "# Release ${RELEASE_TAG}" "${RELEASE_NOTES_PATH}"; then
    NOTES_STATUS="failed"
    write_phase_status
    write_manifest
    fail "Release notes at ${RELEASE_NOTES_PATH} did not retain the expected release heading for ${RELEASE_TAG}."
  fi
  if ! grep -Fq "since previous release tag \`${PREVIOUS_RELEASE_TAG}\`." "${RELEASE_NOTES_PATH}"; then
    NOTES_STATUS="failed"
    write_phase_status
    write_manifest
    fail "Release notes at ${RELEASE_NOTES_PATH} did not retain the expected previous-tag scope ${PREVIOUS_RELEASE_TAG}."
  fi

  NOTES_STATUS="success"
  write_phase_status
  write_manifest
}

mkdir -p "${ARTIFACT_ROOT}"
rm -rf "${ARTIFACT_ROOT}"
mkdir -p "${ARTIFACT_ROOT}"
: > "${PREFLIGHT_STDOUT_PATH}"
: > "${PREFLIGHT_STDERR_PATH}"
: > "${PUBLISH_STDOUT_PATH}"
: > "${PUBLISH_STDERR_PATH}"
: > "${BUNDLE_STDOUT_PATH}"
: > "${BUNDLE_STDERR_PATH}"
: > "${NOTES_STDOUT_PATH}"
: > "${NOTES_STDERR_PATH}"
write_phase_status
write_tag_context
write_source_paths_note
write_manifest

require_file "${FIXTURE_ARCHIVE_PATH}" "Missing signed preflight fixture archive at ${FIXTURE_ARCHIVE_PATH}."
require_file "${FIXTURE_PUBLIC_KEY_PATH}" "Missing fixture public signing key at ${FIXTURE_PUBLIC_KEY_PATH}."
require_file "${TRACEABILITY_JSON_PATH}" "Missing traceability JSON at ${TRACEABILITY_JSON_PATH}."
require_file "${TRACEABILITY_MARKDOWN_PATH}" "Missing traceability markdown at ${TRACEABILITY_MARKDOWN_PATH}."

capture_traceability_snapshot
reset_release_outputs
restore_preflight_fixture
generate_release_signing_fixture
create_git_compatible_root
write_tag_context
write_source_paths_note
write_manifest

run_preflight_phase
run_publish_phase
run_bundle_phase
run_notes_phase
refresh_proof_copies
write_tag_context

PROOF_SUMMARY="release_tag=${RELEASE_TAG} staged_publications=${STAGING_PUBLICATION_COUNT} bundle_assets=${RELEASE_BUNDLE_ASSET_COUNT} traceability_snapshot=${TRACEABILITY_SNAPSHOT} previous_release_tag=${PREVIOUS_RELEASE_TAG}"
PROOF_STATUS="success"
write_phase_status
write_manifest
write_source_paths_note

printf 'Release pipeline proof passed: %s\n' "${PROOF_SUMMARY}"
print_artifacts
