import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const releaseWorkflowPath = path.resolve(".github/workflows/release.yml");

async function loadReleaseWorkflowSource() {
  return readFile(releaseWorkflowPath, "utf8");
}

test("release workflow triggers only on stable version tags", async () => {
  const source = await loadReleaseWorkflowSource();
  assert.match(source, /^\s*on:\s*$/m);
  assert.match(source, /^\s*push:\s*$/m);
  assert.match(source, /^\s*tags:\s*$/m);
  assert.match(source, /^\s*-\s*['"]?v\*\.\*\.\*['"]?\s*$/m);
  assert.doesNotMatch(source, /^\s*-\s*['"]?v\[0-9\]\+\\\.\[0-9\]\+\\\.\[0-9\]\+['"]?\s*$/m);
  assert.doesNotMatch(source, /^\s*workflow_dispatch:\s*$/m);
});

test("release workflow runs preflight before publish and requires approval gate", async () => {
  const source = await loadReleaseWorkflowSource();
  assert.match(source, /^\s*preflight:\s*$/m);
  assert.match(source, /preflight\.sh/);
  assert.match(source, /fetch-tags:\s*true/);
  assert.match(source, /RELEASE_TAG_SIGNING_PUBLIC_KEY:\s*\$\{\{\s*secrets\.RELEASE_TAG_SIGNING_PUBLIC_KEY\s*\}\}/);
  assert.match(source, /set \+e/);
  assert.match(source, /PREFLIGHT_EXIT_CODE=\$\?/);
  assert.match(source, /if \[\[ "\$\{PREFLIGHT_EXIT_CODE\}" -ne 0 \]\]/);
  assert.match(source, /verify-traceability\.mjs/);
  assert.match(source, /^\s*publish:\s*$/m);
  assert.match(source, /needs:\s*(\[\s*preflight\s*\]|preflight)/);
  assert.match(source, /environment:\s*production-release/);
});

test("release workflow wires deterministic publish sequence", async () => {
  const source = await loadReleaseWorkflowSource();
  assert.match(source, /RELEASE_VERSION="\$\{\{\s*needs\.preflight\.outputs\.release_tag\s*\}\}"/);
  assert.match(source, /RELEASE_VERSION="\$\{RELEASE_VERSION#v\}"/);
  assert.match(source, /Materialize in-runner signing key files/);
  assert.match(source, /JRELEASER_GPG_PUBLIC_KEY=\$\{PUBLIC_KEY_FILE\}/);
  assert.match(source, /JRELEASER_GPG_SECRET_KEY=\$\{SECRET_KEY_FILE\}/);
  assert.match(source, /\.\/gradlew\s+-Pversion="\$\{RELEASE_VERSION\}"\s+distAll\s+cyclonedxBom\s+jreleaserConfig/);
  assert.match(
    source,
    /Build deterministic release outputs[\s\S]*JRELEASER_MAVENCENTRAL_USERNAME:\s*\$\{\{\s*secrets\.JRELEASER_MAVENCENTRAL_USERNAME\s*\}\}/,
  );
  assert.match(source, /yanote-dist-all\.zip/);
  assert.match(source, /zip -rq/);
  assert.match(source, /cyclonedxBom|sbom/i);
  assert.match(source, /assemble-release-assets\.sh/);
  assert.match(source, /render-release-notes\.mjs/);
  assert.match(source, /JRELEASER_GITHUB_TOKEN:\s*\$\{\{\s*secrets\.JRELEASER_GITHUB_TOKEN\s*\}\}/);
  assert.match(source, /\.\/gradlew\s+-Pversion="\$\{RELEASE_VERSION\}"\s+jreleaserFullRelease/);
  assert.match(source, /jreleaser/i);
});

test("release workflow wires release notes previous-tag from resolved previous release output", async () => {
  const source = await loadReleaseWorkflowSource();
  assert.match(source, /Resolve previous release tag/);
  assert.match(
    source,
    /previous_release_tag:\s*\$\{\{\s*steps\.previous-tag\.outputs\.previous_release_tag\s*\}\}/,
  );
  assert.match(
    source,
    /--previous-tag\s+"\$\{\{\s*needs\.preflight\.outputs\.previous_release_tag\s*\}\}"/,
  );
  assert.doesNotMatch(
    source,
    /PREVIOUS_RELEASE_TAG:\s*\$\{\{\s*github\.event\.before\s*\}\}/,
  );
  assert.doesNotMatch(
    source,
    /--previous-tag\s+"\$\{\{\s*github\.event\.before\s*\}\}"/,
  );
});

test("release workflow preserves deterministic retry logging for publish outages", async () => {
  const source = await loadReleaseWorkflowSource();
  assert.match(source, /retry-eligible|retry_reason|retry-reason/i);
  assert.match(source, /same-tag|same tag/i);
});

test("release workflow records accountable release-owner sign-off context", async () => {
  const source = await loadReleaseWorkflowSource();
  assert.match(source, /Release Owner Sign-off/);
  assert.match(source, /GITHUB_STEP_SUMMARY/);
  assert.match(source, /release-owner-signoff-environment=production-release/);
});
