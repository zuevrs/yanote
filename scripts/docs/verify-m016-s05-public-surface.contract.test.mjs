import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const verifierScriptPath = path.resolve("scripts/docs/verify-m016-s05-public-surface.sh");
const navigationScriptPath = path.resolve("scripts/docs/verify-s05-navigation.sh");
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
    label: "S05-01",
    title: "Tracked inventory and public-boundary silence",
    command: "bash scripts/docs/verify-s03-public-artifact-boundary.sh all",
  },
  {
    label: "S05-02",
    title: "Landing contract across root/docs/examples",
    command: "bash scripts/docs/verify-s03-landing.sh",
  },
  {
    label: "S05-03",
    title: "Short newcomer and analyzer docs contract",
    command: "bash scripts/docs/verify-m016-s04-short-docs.sh",
  },
  {
    label: "S05-04",
    title: "Recorder doc wiring",
    command: "bash scripts/docs/verify-s01-doc-links.sh",
  },
  {
    label: "S05-05",
    title: "Tagging and analyzer doc wiring",
    command: "bash scripts/docs/verify-s02-doc-links.sh",
  },
  {
    label: "S05-06",
    title: "Recorder runtime proof",
    command: "bash scripts/docs/verify-s01-recorder-path.sh",
  },
  {
    label: "S05-07",
    title: "Analyzer runtime and archive proof",
    command: "bash scripts/docs/verify-s02-analysis-path.sh",
  },
  {
    label: "S05-08",
    title: "Repo demo and example boundary",
    command: "bash scripts/docs/verify-s03-example-boundary.sh",
  },
  {
    label: "S05-09",
    title: "Release/support public boundary",
    command: "bash scripts/docs/verify-s04-boundaries.sh",
  },
  {
    label: "S05-10",
    title: "Maintainer navigation and rerun leaf",
    command: "bash scripts/docs/verify-s05-navigation.sh",
  },
  {
    label: "S05-11",
    title: "Repo demo contract test",
    command: "node --test scripts/ci/run-v1-e2e.contract.test.mjs",
  },
  {
    label: "S05-12",
    title: "Tag-driven release pipeline proof",
    command: "bash scripts/ci/verify-m016-s02-release-pipeline.sh",
  },
];

async function loadUtf8(filePath) {
  return readFile(filePath, "utf8");
}

test("S05 verifier pins the delegated stage order and exact rerun commands", async () => {
  const source = await loadUtf8(verifierScriptPath);

  assert.match(
    source,
    /NOTE \[S05\]: The verifier delegates to existing proof owners and stops on the first failing stage\./,
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
    /M016 S05 public-surface proof passed: boundary, docs, recorder\/analyzer\/demo path, maintainer navigation, and release diagnostics stay aligned\./,
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
  assert.match(readmeSource, /verify-m016-s05-public-surface\.sh/);
  assert.match(leafSource, /> Audience: \*\*maintainer-only leaf\*\*/);
  assert.match(leafSource, /\[`docs\/maintainers\/README\.md`\]\(README\.md\)/);
  assert.match(leafSource, /bash scripts\/docs\/verify-m016-s05-public-surface\.sh/);
  assert.match(leafSource, /`mavenLocal\(\)` \+ `mavenCentral\(\)`/);
  assert.match(leafSource, /Gradle Plugin Portal/);
  assert.match(leafSource, /--refresh-dependencies/);
  assert.match(leafSource, /bounded publish retry/);
  assert.match(leafSource, /deterministic localhost port-open readiness probe/);
  assert.match(leafSource, /bash scripts\/docs\/verify-s01-recorder-path\.sh/);
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
  assert.match(releaseSigningSource, /bash scripts\/ci\/verify-m016-s02-release-pipeline\.sh/);
  assert.match(releaseSigningSource, /bash scripts\/docs\/verify-m016-s05-public-surface\.sh/);
  assert.ok(
    releaseSigningSource.indexOf("bash scripts/ci/verify-m016-s02-release-pipeline.sh") <
      releaseSigningSource.indexOf("bash scripts/docs/verify-m016-s05-public-surface.sh"),
    "release-signing workflow should mention the release-candidate proof before the final public-surface gate",
  );

  for (const stage of expectedStages) {
    assert.match(leafSource, new RegExp(`${stage.label}[^\n]*${stage.command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  }

  assert.match(navigationSource, /PUBLIC_SURFACE_PROOF_DOC="docs\/maintainers\/public-surface-proof\.md"/);
  assert.match(navigationSource, /public-surface-proof\.md/);
  assert.match(navigationSource, /verify-m016-s05-public-surface\.sh/);
});

test("the final S05 rerun surface stays out of public onboarding docs", async () => {
  const publicSources = await Promise.all([
    loadUtf8(rootReadmePath),
    loadUtf8(docsReadmePath),
    loadUtf8(quickstartPath),
    loadUtf8(examplesReadmePath),
    loadUtf8(releaseSupportPath),
  ]);

  for (const source of publicSources) {
    assert.doesNotMatch(source, /public-surface-proof\.md/);
    assert.doesNotMatch(source, /verify-m016-s05-public-surface\.sh/);
  }
});
