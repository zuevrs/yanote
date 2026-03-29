import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
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

async function makeReleaseFixture({
  analyzerFileName = "yanote-analyzer.zip",
  indexLine,
} = {}) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "yanote-release-contract-"));
  const assetsDir = path.join(tempDir, "assets-src");
  const outputDir = path.join(tempDir, "release-out");
  const sbomPath = path.join(tempDir, "bom.json");
  const traceabilityJsonPath = path.join(tempDir, "traceability.json");
  const traceabilityMarkdownPath = path.join(tempDir, "traceability.md");
  const analyzerArchivePath = path.join(assetsDir, analyzerFileName);
  const resolvedIndexLine = indexLine ?? `analyzer|${analyzerArchivePath}`;
  const assetIndexPath = path.join(tempDir, "index.txt");

  await mkdir(assetsDir, { recursive: true });
  await writeFile(analyzerArchivePath, "fake analyzer archive\n", "utf8");
  await writeFile(sbomPath, JSON.stringify({ bomFormat: "CycloneDX" }, null, 2) + "\n", "utf8");
  await writeFile(
    traceabilityJsonPath,
    JSON.stringify({ snapshotId: "snapshot-001", requirements: [] }, null, 2) + "\n",
    "utf8",
  );
  await writeFile(traceabilityMarkdownPath, "# Traceability\n\nSnapshot ID: `snapshot-001`\n", "utf8");
  await writeFile(assetIndexPath, `${resolvedIndexLine}\n`, "utf8");

  return {
    tempDir,
    outputDir,
    assetIndexPath,
    analyzerArchivePath,
    sbomPath,
    traceabilityJsonPath,
    traceabilityMarkdownPath,
  };
}

async function runAssembleReleaseAssets(fixture) {
  return await new Promise((resolve, reject) => {
    const child = spawn("bash", [assembleReleaseAssetsPath], {
      cwd: fixture.tempDir,
      env: {
        ...process.env,
        RELEASE_TAG: "v1.2.3",
        RELEASE_OUTPUT_DIR: fixture.outputDir,
        RELEASE_ASSET_INDEX: fixture.assetIndexPath,
        SBOM_PATH: fixture.sbomPath,
        TRACEABILITY_JSON_PATH: fixture.traceabilityJsonPath,
        TRACEABILITY_MARKDOWN_PATH: fixture.traceabilityMarkdownPath,
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      resolve({ code, signal, stdout, stderr });
    });
  });
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

test("release bundle assembly emits the dedicated analyzer asset plus checksum, proof, and manifest rows", async () => {
  const fixture = await makeReleaseFixture();

  try {
    const result = await runAssembleReleaseAssets(fixture);
    assert.equal(result.code, 0, result.stderr || result.stdout);
    assert.equal(result.signal, null);

    const manifestPath = path.join(fixture.outputDir, "v1.2.3-manifest.txt");
    const manifest = await readFile(manifestPath, "utf8");
    const assets = (await readdir(path.join(fixture.outputDir, "assets"))).sort();

    assert.deepEqual(
      assets,
      [
        "v1.2.3-analyzer.zip",
        "v1.2.3-analyzer.zip.sha256",
        "v1.2.3-analyzer.zip.sha256.proof",
        "v1.2.3-sbom.json",
        "v1.2.3-sbom.json.sha256",
        "v1.2.3-sbom.json.sha256.proof",
        "v1.2.3-traceability-json.json",
        "v1.2.3-traceability-json.json.sha256",
        "v1.2.3-traceability-json.json.sha256.proof",
        "v1.2.3-traceability-summary.md",
        "v1.2.3-traceability-summary.md.sha256",
        "v1.2.3-traceability-summary.md.sha256.proof",
      ],
    );
    assert.match(manifest, /^release-tag=v1\.2\.3$/m);
    assert.match(manifest, /^traceability-snapshot=snapshot-001$/m);
    assert.match(manifest, /^release-asset-types=analyzer$/m);
    assert.match(manifest, /^asset=v1\.2\.3-analyzer\.zip$/m);
    assert.match(manifest, /^checksum-file=v1\.2\.3-analyzer\.zip\.sha256$/m);
    assert.match(manifest, /^proof-file=v1\.2\.3-analyzer\.zip\.sha256\.proof$/m);
    assert.match(manifest, /^release-asset-count=12$/m);
  } finally {
    await rm(fixture.tempDir, { recursive: true, force: true });
  }
});

test("release bundle assembly fails closed when the analyzer archive is missing", async () => {
  const fixture = await makeReleaseFixture();

  try {
    await rm(fixture.analyzerArchivePath, { force: true });
    const result = await runAssembleReleaseAssets(fixture);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /Expected source artifact not found:/);
    assert.match(result.stderr, /yanote-analyzer\.zip/);
  } finally {
    await rm(fixture.tempDir, { recursive: true, force: true });
  }
});

test("release bundle assembly rejects stale generic-only asset indexes", async () => {
  const fixture = await makeReleaseFixture();

  try {
    const legacyArchivePath = path.join(fixture.tempDir, "yanote-dist-all.zip");
    await writeFile(legacyArchivePath, "legacy generic dist archive\n", "utf8");
    await writeFile(fixture.assetIndexPath, `core-dist|${legacyArchivePath}\n`, "utf8");

    const result = await runAssembleReleaseAssets(fixture);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /Legacy generic dist assets are no longer valid release surfaces/);
    assert.match(result.stderr, /analyzer\|build\/distributions\/yanote-analyzer\.zip/);
  } finally {
    await rm(fixture.tempDir, { recursive: true, force: true });
  }
});

test("release bundle assembly rejects analyzer entries with the wrong archive filename", async () => {
  const fixture = await makeReleaseFixture({ analyzerFileName: "yanote-cli.zip" });

  try {
    const result = await runAssembleReleaseAssets(fixture);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /Analyzer asset must point to build\/distributions\/yanote-analyzer\.zip/);
    assert.match(result.stderr, /yanote-cli\.zip/);
  } finally {
    await rm(fixture.tempDir, { recursive: true, force: true });
  }
});
