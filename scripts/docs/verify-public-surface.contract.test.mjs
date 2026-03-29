import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const verifierScriptPath = path.resolve("scripts/docs/verify-public-surface.sh");
const navigationScriptPath = path.resolve("scripts/docs/verify-navigation.sh");
const maintainersReadmePath = path.resolve("docs/maintainers/README.md");
const maintainerLeafPath = path.resolve("docs/maintainers/public-surface-proof.md");
const releaseSigningPath = path.resolve("docs/maintainers/release-signing.md");
const rootReadmePath = path.resolve("README.md");
const docsReadmePath = path.resolve("docs/README.md");
const quickstartPath = path.resolve("docs/guides/getting-started.md");
const examplesReadmePath = path.resolve("examples/README.md");
const releaseSupportPath = path.resolve("docs/release-and-support.md");

const expectedStages = [
  {
    label: "PUBLIC-01",
    title: "Tracked inventory and public-boundary silence",
    command: "bash scripts/docs/verify-public-artifact-boundary.sh all",
  },
  {
    label: "PUBLIC-02",
    title: "Landing contract across root/docs/examples",
    command: "bash scripts/docs/verify-landing.sh",
  },
  {
    label: "PUBLIC-03",
    title: "Short newcomer and analyzer docs contract",
    command: "bash scripts/docs/verify-short-docs.sh",
  },
  {
    label: "PUBLIC-04",
    title: "Recorder doc wiring",
    command: "bash scripts/docs/verify-recorder-doc-links.sh",
  },
  {
    label: "PUBLIC-05",
    title: "Tagging and analyzer doc wiring",
    command: "bash scripts/docs/verify-analysis-doc-links.sh",
  },
  {
    label: "PUBLIC-06",
    title: "Recorder runtime proof",
    command: "bash scripts/docs/verify-recorder-path.sh",
  },
  {
    label: "PUBLIC-07",
    title: "Analyzer runtime and archive proof",
    command: "bash scripts/docs/verify-analysis-path.sh",
  },
  {
    label: "PUBLIC-08",
    title: "Repo demo and example boundary",
    command: "bash scripts/docs/verify-example-boundary.sh",
  },
  {
    label: "PUBLIC-09",
    title: "Release/support public boundary",
    command: "bash scripts/docs/verify-release-support-boundaries.sh",
  },
  {
    label: "PUBLIC-10",
    title: "Maintainer navigation and rerun leaf",
    command: "bash scripts/docs/verify-navigation.sh",
  },
  {
    label: "PUBLIC-11",
    title: "Repo demo contract test",
    command: "node --test scripts/ci/run-v1-e2e.contract.test.mjs",
  },
  {
    label: "PUBLIC-12",
    title: "Tag-driven release pipeline proof",
    command: "bash scripts/ci/verify-release-pipeline.sh",
  },
];

async function loadUtf8(filePath) {
  return readFile(filePath, "utf8");
}

test("S05 verifier pins the delegated stage order and exact rerun commands", async () => {
  const source = await loadUtf8(verifierScriptPath);

  assert.match(
    source,
    /NOTE \[PUBLIC\]: The verifier delegates to existing proof owners and stops on the first failing stage\./,
  );

  let lastIndex = -1;
  for (const stage of expectedStages) {
    const fragment = `run_stage \"${stage.label}\" \"${stage.title}\" \"${stage.command}\"`;
    const index = source.indexOf(fragment);
    assert.notEqual(index, -1, `missing stage ${stage.label}: ${stage.command}`);
    assert.ok(index > lastIndex, `stage ${stage.label} is out of order`);
    lastIndex = index;
  }

  assert.match(
    source,
    /Public-surface proof passed: boundary, docs, recorder\/analyzer\/demo path, maintainer navigation, and release diagnostics stay aligned\./,
  );
});

test("maintainer navigation knows about the public-surface proof leaf and its canonical command", async () => {
  const [navigationSource, readmeSource, leafSource, releaseSigningSource] = await Promise.all([
    loadUtf8(navigationScriptPath),
    loadUtf8(maintainersReadmePath),
    loadUtf8(maintainerLeafPath),
    loadUtf8(releaseSigningPath),
  ]);

  assert.match(readmeSource, /public-surface-proof\.md/);
  assert.match(readmeSource, /verify-public-surface\.sh/);
  assert.match(leafSource, /> Audience: \*\*maintainer-only leaf\*\*/);
  assert.match(leafSource, /\[`docs\/maintainers\/README\.md`\]\(README\.md\)/);
  assert.match(leafSource, /bash scripts\/docs\/verify-public-surface\.sh/);
  assert.match(leafSource, /`mavenLocal\(\)` \+ `mavenCentral\(\)`/);
  assert.match(leafSource, /Gradle Plugin Portal/);
  assert.match(leafSource, /--refresh-dependencies/);
  assert.match(leafSource, /bounded publish retry/);
  assert.match(leafSource, /deterministic localhost port-open readiness probe/);
  assert.match(leafSource, /bash scripts\/docs\/verify-recorder-path\.sh/);
  assert.match(leafSource, /readiness_port/);
  assert.match(leafSource, /temp_dir/);
  assert.match(leafSource, /gradle_home/);
  assert.match(leafSource, /publish_log/);
  assert.match(leafSource, /app_log/);
  assert.match(leafSource, /events_file/);
  assert.match(leafSource, /response_file/);
  assert.match(leafSource, /bootstrap failure/);
  assert.match(leafSource, /cold-run failure/);
  assert.match(leafSource, /immediate-rerun failure/);
  assert.match(leafSource, /phase-status\.txt/);
  assert.match(leafSource, /artifact-manifest\.txt/);
  assert.match(leafSource, /tag-context\.txt/);
  assert.match(releaseSigningSource, /public-surface-proof\.md/);
  assert.match(releaseSigningSource, /bash scripts\/ci\/verify-release-pipeline\.sh/);
  assert.match(releaseSigningSource, /bash scripts\/docs\/verify-public-surface\.sh/);
  assert.ok(
    releaseSigningSource.indexOf("bash scripts/ci/verify-release-pipeline.sh") <
      releaseSigningSource.indexOf("bash scripts/docs/verify-public-surface.sh"),
    "release-signing workflow should mention the release-candidate proof before the final public-surface gate",
  );

  for (const stage of expectedStages) {
    assert.match(leafSource, new RegExp(`${stage.label}[^\n]*${stage.command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  }

  assert.match(navigationSource, /PUBLIC_SURFACE_PROOF_DOC="docs\/maintainers\/public-surface-proof\.md"/);
  assert.match(navigationSource, /public-surface-proof\.md/);
  assert.match(navigationSource, /verify-public-surface\.sh/);
});

test("the final public-surface rerun surface stays out of public onboarding docs", async () => {
  const publicSources = await Promise.all([
    loadUtf8(rootReadmePath),
    loadUtf8(docsReadmePath),
    loadUtf8(quickstartPath),
    loadUtf8(examplesReadmePath),
    loadUtf8(releaseSupportPath),
  ]);

  for (const source of publicSources) {
    assert.doesNotMatch(source, /public-surface-proof\.md/);
    assert.doesNotMatch(source, /verify-public-surface\.sh/);
  }
});
