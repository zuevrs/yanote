import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";

const sourceScriptPath = path.resolve("scripts/docs/verify-s03-public-artifact-boundary.sh");
const verifierSource = await readFile(sourceScriptPath, "utf8");

const CLEAN_GITIGNORE_LINES = [".bg-shell/", ".tmp/", ".tmp-*", ".vite/", ".mcp.json", ".nvmrc", "dist/"];

function runCommand(command, args, { cwd } = {}) {
  return spawnSync(command, args, {
    cwd,
    env: process.env,
    encoding: "utf8",
  });
}

function assertCommandOk(result, context) {
  assert.equal(result.status, 0, `${context}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.equal(result.signal, null, `${context} terminated by signal ${result.signal}`);
}

async function writeFixtureFile(rootDir, relativePath, content) {
  const absolutePath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, "utf8");
}

async function createFixture({
  gitignoreLines = CLEAN_GITIGNORE_LINES,
  readme = "# yanote\n\nPublic landing only.\n",
  docsReadme = "# docs\n\nCanonical docs landing only.\n",
  releaseSupport = "# release and support\n\nPublic release/support owner surface only.\n",
  asyncGuide = "# async guide\n\nPublic async guide only.\n",
  support = "# support\n\nAttach version, minimal reproduction, and released artifacts only.\n",
  extraFiles = {},
}) {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "yanote-s03-public-boundary-"));

  await writeFixtureFile(rootDir, ".gitignore", `${gitignoreLines.join("\n")}\n`);
  await writeFixtureFile(rootDir, "README.md", readme);
  await writeFixtureFile(rootDir, "docs/README.md", docsReadme);
  await writeFixtureFile(rootDir, "docs/release-and-support.md", releaseSupport);
  await writeFixtureFile(rootDir, "docs/guides/asyncapi-kafka.md", asyncGuide);
  await writeFixtureFile(rootDir, "SUPPORT.md", support);
  await writeFixtureFile(rootDir, "scripts/docs/verify-s03-public-artifact-boundary.sh", verifierSource);

  for (const [relativePath, content] of Object.entries(extraFiles)) {
    await writeFixtureFile(rootDir, relativePath, content);
  }

  assertCommandOk(runCommand("git", ["init", "-q"], { cwd: rootDir }), "expected fixture repo init to succeed");
  assertCommandOk(runCommand("git", ["add", "-A", "-f", "."], { cwd: rootDir }), "expected fixture repo staging to succeed");

  return rootDir;
}

function runVerifier(rootDir, mode) {
  const fixtureScriptPath = path.join(rootDir, "scripts/docs/verify-s03-public-artifact-boundary.sh");
  return runCommand("bash", [fixtureScriptPath, mode], { cwd: rootDir });
}

test("tracked mode fails closed on tracked clone-local roots and prints the offending paths", { concurrency: false }, async () => {
  const rootDir = await createFixture({
    extraFiles: {
      ".mcp.json": "{\"mcpServers\":{}}\n",
      ".nvmrc": "22\n",
      ".tmp/proof/artifact.txt": "tracked tmp proof\n",
      ".tmp-m015-s03-combined-proof/artifact-manifest.txt": "tracked tmp-star proof\n",
      ".vite/vitest/results.json": "{}\n",
    },
  });

  try {
    const result = runVerifier(rootDir, "tracked");

    assert.notEqual(result.status, 0, "tracked mode should fail when clone-local roots remain tracked");
    assert.match(result.stderr, /Tracked clone-local root remains in git inventory: \.mcp\.json/);
    assert.match(result.stderr, /Tracked clone-local root remains in git inventory: \.nvmrc/);
    assert.match(result.stderr, /Tracked clone-local root remains in git inventory: \.tmp\/proof\/artifact\.txt/);
    assert.match(result.stderr, /Tracked clone-local root remains in git inventory: \.tmp-m015-s03-combined-proof\/artifact-manifest\.txt/);
    assert.match(result.stderr, /Tracked clone-local root remains in git inventory: \.vite\/vitest\/results\.json/);
    assert.match(result.stdout, /Tracked public-boundary inventory entries under \.bg-shell\/.mcp\.json\/.nvmrc\/.tmp\/.tmp-\*\/.vite\/dist: 5/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("all mode adds public-surface wording checks while tracked mode stays green on the same clean inventory", { concurrency: false }, async () => {
  const rootDir = await createFixture({
    readme: "# yanote\n\nProof bundle lives at `.yanote-ci/v1-e2e/`.\n",
    docsReadme: "# docs\n\nCanonical docs landing only.\n",
    releaseSupport: "# release and support\n\nRepo is pinned by `.nvmrc` and public CI bundles only.\n",
    asyncGuide: "# async guide\n\nCombined retained bundle lives at `.tmp/m015-s03-combined-proof/`, Kafka proof lives at `.yanote-ci/live-kafka-proof/`.\n",
    support: "# support\n\nDo not attach `.tmp/m015-s03-combined-proof/` directly to public issues.\n",
  });

  try {
    const trackedResult = runVerifier(rootDir, "tracked");
    assert.equal(trackedResult.status, 0, trackedResult.stderr || trackedResult.stdout);

    const allResult = runVerifier(rootDir, "all");
    assert.notEqual(allResult.status, 0, "all mode should fail when public docs still mention private roots");
    assert.match(allResult.stderr, /README\.md still exposes clone-local proof bundle reference: \.yanote-ci\//);
    assert.match(allResult.stderr, /docs\/release-and-support\.md still exposes repo\/dev-only Node pin reference: \.nvmrc/);
    assert.match(allResult.stderr, /docs\/guides\/asyncapi-kafka\.md still exposes clone-local \.tmp reference: \.tmp\//);
    assert.match(allResult.stderr, /docs\/guides\/asyncapi-kafka\.md still exposes clone-local proof bundle reference: \.yanote-ci\//);
    assert.match(allResult.stderr, /SUPPORT\.md still exposes clone-local \.tmp reference: \.tmp\//);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("clean fixtures pass in both tracked and full-public modes", { concurrency: false }, async () => {
  const rootDir = await createFixture({
    readme: "# yanote\n\nUse release assets and maintainer docs when needed.\n",
    docsReadme: "# docs\n\nCanonical docs route through release assets, examples, and support guides.\n",
    releaseSupport: "# release and support\n\nPublic release/support owner surface only.\n",
    support: "# support\n\nAttach version, commands, and released report names only.\n",
  });

  try {
    const trackedResult = runVerifier(rootDir, "tracked");
    assert.equal(trackedResult.status, 0, trackedResult.stderr || trackedResult.stdout);
    assert.match(trackedResult.stdout, /verification passed in mode 'tracked'/);

    const allResult = runVerifier(rootDir, "all");
    assert.equal(allResult.status, 0, allResult.stderr || allResult.stdout);
    assert.match(allResult.stdout, /verification passed in mode 'all'/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("missing ignore rules and unsupported modes fail closed with actionable diagnostics", { concurrency: false }, async () => {
  const rootDir = await createFixture({
    gitignoreLines: [".bg-shell/", ".tmp/", ".tmp-*", "dist/"],
  });

  try {
    const missingRuleResult = runVerifier(rootDir, "tracked");
    assert.notEqual(missingRuleResult.status, 0, "tracked mode should fail when a required ignore rule is missing");
    assert.match(missingRuleResult.stderr, /\.gitignore is missing clone-local boundary rule: \.vite\//);

    const invalidModeResult = runVerifier(rootDir, "typo");
    assert.notEqual(invalidModeResult.status, 0, "unsupported modes should fail closed");
    assert.match(invalidModeResult.stderr, /Unsupported verification mode 'typo'\. Supported modes: tracked, all\./);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
