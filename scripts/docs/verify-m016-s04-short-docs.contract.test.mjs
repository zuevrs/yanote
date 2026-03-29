import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";

const sourceScriptPath = path.resolve("scripts/docs/verify-m016-s04-short-docs.sh");
const verifierSource = await readFile(sourceScriptPath, "utf8");

function runCommand(command, args, { cwd } = {}) {
  return spawnSync(command, args, {
    cwd,
    env: process.env,
    encoding: "utf8",
  });
}

async function writeFixtureFile(rootDir, relativePath, content) {
  const absolutePath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, "utf8");
}

function createBaseFixture() {
  return {
    "README.md": `# yanote

One short intro.

1. [Quickstart](docs/guides/getting-started.md)
2. [Docs](docs/README.md)
3. [Release](docs/release-and-support.md)
`,
    "docs/README.md": `# Docs

1. [Quickstart](guides/getting-started.md)
2. [Root](../README.md)
3. [Release](release-and-support.md)
`,
    "docs/guides/getting-started.md": `# Getting started

Back: [root](../../README.md) · [docs](../README.md)

- [recorder](recorder-spring-mvc.md)
- [tagging](test-tagging.md)
- [analyzer](analyzer-coverage.md)
- [demo](../../examples/README.md)
- [release](../release-and-support.md)

Use events.jsonl.

test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"

X-Test-Run-Id
X-Test-Suite
test.run_id
test.suite
coverage.perOperation[].suites
YANOTE_SUITE
only demo/env bridge
yanote-analyzer.zip
bin/yanote report
yanote-report.json
yanote-report.html
`,
    "docs/guides/recorder-spring-mvc.md": "# recorder\n",
    "docs/guides/test-tagging.md": "# tagging\n",
    "docs/guides/analyzer-coverage.md": `# analyzer

yanote-analyzer.zip
./gradlew distStandaloneAnalyzer
build/distributions/yanote-analyzer.zip
./yanote-analyzer/bin/yanote
"\${YANOTE}" report
yanote-report.json
yanote-report.html
Summary
HTTP Payload Conformance
YANOTE_SUMMARY
../release-and-support.md
../../examples/README.md
`,
    "docs/release-and-support.md": "# release\n",
    "examples/README.md": `# examples

[docker-compose](docker-compose.yml)
[service](springmvc-service/README.md)
[tests](tests-restassured/README.md)
[analyzer](../docs/guides/analyzer-coverage.md)
[release](../docs/release-and-support.md)

yanote-analyzer.zip
dist/standalone-analyzer/bin/yanote
events.jsonl
yanote-report.json
yanote-report.html
`,
    "examples/docker-compose.yml": "services: {}\n",
    "examples/springmvc-service/README.md": "# service\n",
    "examples/tests-restassured/README.md": "# tests\n",
  };
}

async function createFixture(overrides = {}) {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "yanote-m016-s04-short-docs-"));
  const files = { ...createBaseFixture(), ...overrides };

  await writeFixtureFile(rootDir, "scripts/docs/verify-m016-s04-short-docs.sh", verifierSource);
  for (const [relativePath, content] of Object.entries(files)) {
    await writeFixtureFile(rootDir, relativePath, content);
  }

  return rootDir;
}

function runVerifier(rootDir) {
  return runCommand("bash", [path.join(rootDir, "scripts/docs/verify-m016-s04-short-docs.sh")], { cwd: rootDir });
}

test("clean newcomer/analyzer/example fixtures pass", { concurrency: false }, async () => {
  const rootDir = await createFixture();

  try {
    const result = runVerifier(rootDir);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /M016 S04 short-doc verification passed/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("allows secondary analyzer proof wording after the newcomer section", { concurrency: false }, async () => {
  const secondaryProofAnalyzer = [
    "# analyzer",
    "",
    "yanote-analyzer.zip",
    "./gradlew distStandaloneAnalyzer",
    "build/distributions/yanote-analyzer.zip",
    "./yanote-analyzer/bin/yanote",
    '"${YANOTE}" report',
    "yanote-report.json",
    "yanote-report.html",
    "Summary",
    "HTTP Payload Conformance",
    "YANOTE_SUMMARY",
    "../release-and-support.md",
    "../../examples/README.md",
    ...Array.from({ length: 45 }, (_, index) => `body line ${index + 1}`),
    "HTTP Security Conformance",
    "bash scripts/ci/verify-m012-s02-security-semantics.sh",
    "security-semantics.stdout",
    "security-semantics.stderr",
    "security-semantics-yanote-report.json",
    "artifact-manifest.txt",
    "artifact-source-paths.txt",
    "raw `http-security-api-key.fixture.jsonl` в `.yanote-ci/v1-e2e/` не копируется",
  ].join("\n");

  const rootDir = await createFixture({
    "docs/guides/analyzer-coverage.md": `${secondaryProofAnalyzer}\n`,
  });

  try {
    const result = runVerifier(rootDir);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /M016 S04 short-doc verification passed/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("fails closed when the first landing link is not the quickstart", { concurrency: false }, async () => {
  const rootDir = await createFixture({
    "README.md": `# yanote\n\n1. [Docs](docs/README.md)\n2. [Quickstart](docs/guides/getting-started.md)\n3. [Release](docs/release-and-support.md)\n`,
  });

  try {
    const result = runVerifier(rootDir);
    assert.notEqual(result.status, 0, "verifier should fail when quickstart is not first");
    assert.match(result.stderr, /README\.md first local markdown link should be docs\/guides\/getting-started\.md/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("fails closed on broken local markdown links", { concurrency: false }, async () => {
  const rootDir = await createFixture({
    "examples/README.md": `# examples\n\n[docker-compose](docker-compose.yml)\n[service](missing-service.md)\n[tests](tests-restassured/README.md)\n[analyzer](../docs/guides/analyzer-coverage.md)\n[release](../docs/release-and-support.md)\n\nyanote-analyzer.zip\ndist/standalone-analyzer/bin/yanote\nevents.jsonl\nyanote-report.json\nyanote-report.html\n`,
  });

  try {
    const result = runVerifier(rootDir);
    assert.notEqual(result.status, 0, "verifier should fail on broken links");
    assert.match(result.stderr, /examples\/README\.md has broken local markdown link: missing-service\.md/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("fails closed on analyzer/examples size drift and proof-first wording", { concurrency: false }, async () => {
  const overlongAnalyzer = [
    "# analyzer",
    "",
    "yanote-analyzer.zip",
    "./gradlew distStandaloneAnalyzer",
    "build/distributions/yanote-analyzer.zip",
    "./yanote-analyzer/bin/yanote",
    '"${YANOTE}" report',
    "yanote-report.json",
    "yanote-report.html",
    "Summary",
    "HTTP Payload Conformance",
    "YANOTE_SUMMARY",
    "../release-and-support.md",
    "../../examples/README.md",
    ...Array.from({ length: 160 }, (_, index) => `line ${index + 1}`),
  ].join("\n");

  const rootDir = await createFixture({
    "docs/guides/analyzer-coverage.md": `${overlongAnalyzer}\n`,
    "examples/README.md": `# examples\n\n[docker-compose](docker-compose.yml)\n[service](springmvc-service/README.md)\n[tests](tests-restassured/README.md)\n[analyzer](../docs/guides/analyzer-coverage.md)\n[release](../docs/release-and-support.md)\n\nyanote-analyzer.zip\ndist/standalone-analyzer/bin/yanote\nevents.jsonl\nyanote-report.json\nyanote-report.html\nscripts/ci\n`,
  });

  try {
    const result = runVerifier(rootDir);
    assert.notEqual(result.status, 0, "verifier should fail on size drift and banned wording");
    assert.match(result.stderr, /docs\/guides\/analyzer-coverage\.md exceeds size ceiling:/);
    assert.match(result.stderr, /examples\/README\.md still foregrounds proof-first wording: scripts\/ci/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
