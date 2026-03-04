import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const releaseTemplatePath = path.resolve(".github/release.yml");
const releaseNotesRendererPath = path.resolve("scripts/release/render-release-notes.mjs");
const assembleReleaseAssetsPath = path.resolve("scripts/release/assemble-release-assets.sh");

async function loadReleaseTemplateSource() {
  return readFile(releaseTemplatePath, "utf8");
}

async function loadReleaseNotesRendererSource() {
  return readFile(releaseNotesRendererPath, "utf8");
}

async function loadAssembleReleaseAssetsSource() {
  return readFile(assembleReleaseAssetsPath, "utf8");
}

test("release notes contract enforces required section headings", async () => {
  const template = await loadReleaseTemplateSource();
  const renderer = await loadReleaseNotesRendererSource();
  const requiredSections = [
    "Summary",
    "Breaking Changes",
    "Upgrade Notes",
    "Verification Highlights",
  ];

  for (const section of requiredSections) {
    assert.match(template, new RegExp(section, "m"));
    assert.match(renderer, new RegExp(section, "m"));
  }
});

test("release notes contract scopes changelog since previous release tag", async () => {
  const template = await loadReleaseTemplateSource();
  const renderer = await loadReleaseNotesRendererSource();
  assert.match(template, /changelog/i);
  assert.match(template, /previous release tag|since previous tag|previous-tag/i);
  assert.match(renderer, /PREVIOUS_RELEASE_TAG|previousReleaseTag|since previous tag/i);
});

test("release bundle contract requires deterministic asset naming and ordering", async () => {
  const source = await loadAssembleReleaseAssetsSource();
  assert.match(source, /v[0-9]+\.[0-9]+\.[0-9]+/);
  assert.match(source, /artifact-type|artifact_type|artifact type/i);
  assert.match(source, /LC_ALL=C sort|sort -V|sort/u);
});

test("release bundle contract requires sbom, checksums, proofs, and manifest", async () => {
  const source = await loadAssembleReleaseAssetsSource();
  assert.match(source, /sbom/i);
  assert.match(source, /sha-?256|sha256/i);
  assert.match(source, /manifest/i);
  assert.match(source, /proof|\.sig|\.asc/i);
});
