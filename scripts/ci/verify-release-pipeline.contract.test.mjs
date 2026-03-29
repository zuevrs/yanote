import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/verify-release-pipeline.sh");

async function loadScriptSource() {
  return readFile(scriptPath, "utf8");
}

test("release pipeline verifier keeps a stable retained proof root and signed-tag fixture inputs", async () => {
  const source = await loadScriptSource();

  assert.match(source, /ARTIFACT_DIR="\$\{YANOTE_RELEASE_PIPELINE_PROOF_DIR:-\.yanote-ci\/m016-s02-release-pipeline-proof\}"/);
  assert.match(source, /RELEASE_TAG="\$\{YANOTE_RELEASE_PROOF_TAG:-v1\.2\.3\}"/);
  assert.match(source, /PREVIOUS_RELEASE_TAG="\$\{YANOTE_RELEASE_PROOF_PREVIOUS_TAG:-v1\.2\.2\}"/);
  assert.match(source, /FIXTURE_ARCHIVE_PATH="\$\{ROOT_DIR\}\/scripts\/release\/fixtures\/preflight-runtime\/preflight-signed-main\.tar\.gz\.base64"/);
  assert.match(source, /FIXTURE_PUBLIC_KEY_PATH="\$\{ROOT_DIR\}\/scripts\/release\/fixtures\/test-release-signing-public\.asc"/);
  assert.match(source, /GENERATED_SIGNING_HOME="\$\{FIXTURE_ROOT\}\/generated-signing-home"/);
  assert.match(source, /GENERATED_PRIVATE_KEY_PATH="\$\{FIXTURE_ROOT\}\/generated-signing-private\.asc"/);
  assert.match(source, /GENERATED_PUBLIC_KEY_PATH="\$\{FIXTURE_ROOT\}\/generated-signing-public\.asc"/);
  assert.match(source, /git -C "\$\{PREFLIGHT_WORKTREE\}" remote set-url origin "\$\{FIXTURE_ORIGIN_DIR\}"/);
  assert.match(source, /git -C "\$\{PREFLIGHT_WORKTREE\}" config gpg\.program "\$\{GPG_WRAPPER_PATH\}"/);
  assert.match(source, /generate_release_signing_fixture\(\) \{/);
  assert.match(source, /GNUPGHOME="\$\{GENERATED_SIGNING_HOME\}" gpg --batch --generate-key/);
  assert.match(source, /GNUPGHOME="\$\{GENERATED_SIGNING_HOME\}" gpg --batch --armor --export-secret-keys/);
  assert.match(source, /export RELEASE_TAG_SIGNING_PUBLIC_KEY="\$\{release_tag_signing_public_key\}"/);
});

test("release pipeline verifier builds a git-compatible root for jreleaser instead of publishing from the raw worktree metadata", async () => {
  const source = await loadScriptSource();

  assert.match(source, /COMPAT_ROOT="\$\{ARTIFACT_ROOT\}\/git-compatible-root"/);
  assert.match(source, /if child\.name in \{'.git', '.yanote-ci'\}:/);
  assert.match(source, /if dotgit\.is_file\(\):/);
  assert.match(source, /if not text\.startswith\('gitdir: '\):/);
  assert.match(source, /compat_gitdir = compat \/ '\.git'/);
  assert.match(source, /for name in \['HEAD', 'index', 'ORIG_HEAD'\]:/);
  assert.match(source, /for name in \['config', 'objects', 'refs', 'packed-refs', 'hooks', 'info'\]:/);
  assert.match(source, /for name in \['logs', 'worktrees'\]:/);
});

test("release pipeline verifier mirrors the workflow's local release-candidate task graph and fails closed before any external publish step", async () => {
  const source = await loadScriptSource();

  assert.match(source, /\.\/gradlew -Pversion='\$\{RELEASE_VERSION\}' publish distStandaloneAnalyzer cyclonedxBom jreleaserConfig --stacktrace/);
  assert.doesNotMatch(source, /jreleaserFullRelease/);
  assert.match(source, /export JRELEASER_GPG_SECRET_KEY='\$\{GENERATED_PRIVATE_KEY_PATH\}'/);
  assert.match(source, /export JRELEASER_GPG_PUBLIC_KEY='\$\{GENERATED_PUBLIC_KEY_PATH\}'/);
  assert.match(source, /require_file "\$\{ANALYZER_ARCHIVE_PATH\}" "Publish phase did not produce the official analyzer archive at build\/distributions\/yanote-analyzer\.zip\."/);
  assert.match(source, /require_file "\$\{SBOM_PATH\}" "Publish phase did not produce build\/reports\/cyclonedx\/bom\.json\."/);
  assert.match(source, /require_file "\$\{JRELEASER_OUTPUT_PATH\}" "Publish phase did not retain build\/jreleaser\/output\.properties\."/);
  assert.match(source, /EXPECTED_STAGING_PUBLICATIONS=\(/);
  assert.match(source, /yanote-core-\$\{RELEASE_VERSION\}\.pom/);
  assert.match(source, /yanote-recorder-spring-mvc-\$\{RELEASE_VERSION\}\.pom/);
  assert.match(source, /yanote-recorder-spring-kafka-\$\{RELEASE_VERSION\}\.pom/);
  assert.match(source, /yanote-recorder-spring-amqp-\$\{RELEASE_VERSION\}\.pom/);
  assert.match(source, /yanote-test-tags-restassured-\$\{RELEASE_VERSION\}\.pom/);
  assert.match(source, /yanote-test-tags-cucumber-\$\{RELEASE_VERSION\}\.pom/);
  assert.match(source, /yanote-gradle-plugin-\$\{RELEASE_VERSION\}\.pom/);
  assert.match(source, /io\.github\.zuevrs\.yanote\.gradle\.gradle\.plugin-\$\{RELEASE_VERSION\}\.pom/);
  assert.match(source, /Publish phase did not stage every expected publication module/);
});

test("release pipeline verifier pins the analyzer asset, traceability, and notes surfaces under one proof bundle", async () => {
  const source = await loadScriptSource();

  assert.match(source, /cat > build\/release-assets\/index\.txt <<'INDEX'\nanalyzer\|build\/distributions\/yanote-analyzer\.zip\nINDEX/);
  assert.match(source, /bash scripts\/release\/assemble-release-assets\.sh/);
  assert.match(source, /require_file "\$\{BUNDLE_MANIFEST_PATH\}" "Bundle phase did not retain the release manifest/);
  assert.match(source, /traceability-snapshot=\$\{TRACEABILITY_SNAPSHOT\}/);
  assert.match(source, /asset=\$\{RELEASE_TAG\}-analyzer\.zip/);
  assert.match(source, /require_file "\$\{BUNDLE_ASSETS_DIR\}\/\$\{RELEASE_TAG\}-traceability-json\.json"/);
  assert.match(source, /require_file "\$\{BUNDLE_ASSETS_DIR\}\/\$\{RELEASE_TAG\}-traceability-summary\.md"/);
  assert.match(source, /notes_command=node scripts\/release\/render-release-notes\.mjs --output build\/release-notes\.md --version %s --previous-tag %s/);
  assert.match(source, /if ! grep -Fq "# Release \$\{RELEASE_TAG\}" "\$\{RELEASE_NOTES_PATH\}"; then/);
  assert.match(source, /if ! grep -Fq "since previous release tag \\\`\$\{PREVIOUS_RELEASE_TAG\}\\\`\." "\$\{RELEASE_NOTES_PATH\}"; then/);
});

test("release pipeline verifier retains inspectable phase logs, inventories, and copied proof artifacts", async () => {
  const source = await loadScriptSource();

  assert.match(source, /PHASE_STATUS_PATH="\$\{ARTIFACT_ROOT\}\/phase-status\.txt"/);
  assert.match(source, /STAGING_INVENTORY_PATH="\$\{ARTIFACT_ROOT\}\/staged-publications\.txt"/);
  assert.match(source, /STAGING_MODULES_PATH="\$\{ARTIFACT_ROOT\}\/staging-modules\.txt"/);
  assert.match(source, /RELEASE_BUNDLE_ASSETS_PATH="\$\{ARTIFACT_ROOT\}\/release-bundle-assets\.txt"/);
  assert.match(source, /RELEASE_BUNDLE_MANIFEST_COPY_PATH="\$\{ARTIFACT_ROOT\}\/release-bundle-manifest\.txt"/);
  assert.match(source, /RELEASE_NOTES_COPY_PATH="\$\{ARTIFACT_ROOT\}\/release-notes\.md"/);
  assert.match(source, /JRELEASER_OUTPUT_COPY_PATH="\$\{ARTIFACT_ROOT\}\/jreleaser-output\.properties"/);
  assert.match(source, /printf 'observability=%s\\n' 'preflight\.stdout\.log,preflight\.stderr\.log,publish\.stdout\.log,publish\.stderr\.log,bundle\.stdout\.log,bundle\.stderr\.log,notes\.stdout\.log,notes\.stderr\.log,phase-status\.txt,tag-context\.txt,staged-publications\.txt,staging-modules\.txt,release-bundle-assets\.txt,release-bundle-manifest\.txt,release-notes\.md,traceability-v1-requirements-tests\.json,traceability-v1-requirements-tests\.md,jreleaser-output\.properties'/);
  assert.match(source, /PROOF_SUMMARY="release_tag=\$\{RELEASE_TAG\} staged_publications=\$\{STAGING_PUBLICATION_COUNT\} bundle_assets=\$\{RELEASE_BUNDLE_ASSET_COUNT\} traceability_snapshot=\$\{TRACEABILITY_SNAPSHOT\} previous_release_tag=\$\{PREVIOUS_RELEASE_TAG\}"/);
  assert.match(source, /printf 'Release pipeline proof passed: %s\\n' "\$\{PROOF_SUMMARY\}"/);
});
