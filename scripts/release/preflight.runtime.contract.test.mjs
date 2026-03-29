import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";

const preflightScriptPath = path.resolve("scripts/release/preflight.sh");
const signingPublicKeyPath = path.resolve("scripts/release/fixtures/test-release-signing-public.asc");
const fixtureArchivePaths = {
  signedMain: path.resolve("scripts/release/fixtures/preflight-runtime/preflight-signed-main.tar.gz.base64"),
  unsignedAnnotated: path.resolve("scripts/release/fixtures/preflight-runtime/preflight-unsigned-annotated.tar.gz.base64"),
  lightweight: path.resolve("scripts/release/fixtures/preflight-runtime/preflight-lightweight.tar.gz.base64"),
  signedOffMain: path.resolve("scripts/release/fixtures/preflight-runtime/preflight-signed-off-main.tar.gz.base64"),
  signedPrerelease: path.resolve("scripts/release/fixtures/preflight-runtime/preflight-signed-prerelease.tar.gz.base64"),
};

const REQUIRED_RELEASE_ENV = {
  JRELEASER_MAVENCENTRAL_USERNAME: "fixture-user",
  JRELEASER_MAVENCENTRAL_PASSWORD: "fixture-password",
  JRELEASER_GPG_SECRET_KEY: "fixture-secret-key",
  JRELEASER_GPG_PUBLIC_KEY: "fixture-public-key",
  JRELEASER_GPG_PASSPHRASE: "fixture-passphrase",
};

function runCommand(command, args, { cwd, env, input } = {}) {
  return spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
    input,
  });
}

function assertCommandOk(result, context) {
  assert.equal(result.status, 0, `${context}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.equal(result.signal, null, `${context} terminated by signal ${result.signal}`);
}

function parseOutputs(stdout) {
  const outputs = new Map();
  for (const line of stdout.split("\n")) {
    const match = line.match(/^([a-z0-9_.-]+)=(.*)$/i);
    if (match) {
      outputs.set(match[1], match[2]);
    }
  }
  return outputs;
}

function parseDiagnostics(stdout) {
  return stdout
    .split("\n")
    .filter((line) => line.startsWith("diagnostic-class="))
    .map((line) => {
      const match = line.match(/^diagnostic-class=([^ ]+) code=([^ ]+) /);
      assert.ok(match, `Unexpected diagnostic line shape: ${line}`);
      return { line, className: match[1], code: match[2] };
    });
}

async function restoreFixture(fixtureName) {
  const archivePath = fixtureArchivePaths[fixtureName];
  assert.ok(archivePath, `Unknown preflight fixture ${fixtureName}`);

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "yanote-preflight-runtime-"));
  const tarballPath = path.join(tempRoot, "fixture.tar.gz");
  const archiveBase64 = await readFile(archivePath, "utf8");
  const publicKey = await readFile(signingPublicKeyPath, "utf8");

  await writeFile(tarballPath, Buffer.from(archiveBase64.trim(), "base64"));
  assertCommandOk(runCommand("tar", ["-xzf", tarballPath, "-C", tempRoot]), `expected ${fixtureName} extraction to succeed`);

  const workDir = path.join(tempRoot, "fixture", "worktree");
  const originDir = path.join(tempRoot, "fixture", "origin.git");
  const gpgWrapperPath = path.join(tempRoot, "gpg-loopback.sh");
  await writeFile(
    gpgWrapperPath,
    "#!/usr/bin/env bash\nexec gpg --batch --pinentry-mode loopback \"$@\"\n",
    { encoding: "utf8", mode: 0o755 },
  );
  assertCommandOk(
    runCommand("git", ["remote", "set-url", "origin", originDir], { cwd: workDir }),
    `expected ${fixtureName} origin rewrite to succeed`,
  );
  assertCommandOk(
    runCommand("git", ["config", "gpg.format", "openpgp"], { cwd: workDir }),
    `expected ${fixtureName} gpg format rewrite to succeed`,
  );
  assertCommandOk(
    runCommand("git", ["config", "gpg.program", gpgWrapperPath], { cwd: workDir }),
    `expected ${fixtureName} gpg program rewrite to succeed`,
  );

  return {
    tempRoot,
    workDir,
    publicKey,
  };
}

function runPreflight(
  fixture,
  {
    releaseTag,
    projectVersion = "1.2.3",
    previousReleaseTag = "v1.2.2",
    includeCredentials = true,
    includeSigningKey = true,
    releaseFreezeApproved = "true",
    publishFailureReason = "",
  },
) {
  const env = {
    RELEASE_TAG: releaseTag,
    PROJECT_VERSION: projectVersion,
    PREVIOUS_RELEASE_TAG: previousReleaseTag,
    RELEASE_FREEZE_APPROVED: releaseFreezeApproved,
    PUBLISH_FAILURE_REASON: publishFailureReason,
  };

  if (includeSigningKey) {
    env.RELEASE_TAG_SIGNING_PUBLIC_KEY = fixture.publicKey;
  }

  if (includeCredentials) {
    Object.assign(env, REQUIRED_RELEASE_ENV);
  }

  return runCommand("bash", [preflightScriptPath], {
    cwd: fixture.workDir,
    env,
  });
}

test("runtime preflight passes for a signed annotated stable tag reachable from main", { concurrency: false }, async () => {
  const fixture = await restoreFixture("signedMain");

  try {
    const result = runPreflight(fixture, { releaseTag: "v1.2.3" });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const outputs = parseOutputs(result.stdout);
    assert.equal(outputs.get("release-tag"), "v1.2.3");
    assert.equal(outputs.get("project-version"), "1.2.3");
    assert.equal(outputs.get("retry-eligible"), "false");
    assert.equal(outputs.get("retry_reason"), "no-failure");
    assert.equal(outputs.get("preflight-status"), "pass");
    assert.deepEqual(parseDiagnostics(result.stdout), []);
  } finally {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  }
});

test("runtime preflight rejects unsigned annotated tags with the exact unsigned-tag diagnostic", { concurrency: false }, async () => {
  const fixture = await restoreFixture("unsignedAnnotated");

  try {
    const result = runPreflight(fixture, { releaseTag: "v1.2.3" });
    assert.notEqual(result.status, 0);

    const diagnostics = parseDiagnostics(result.stdout);
    assert.deepEqual(
      diagnostics.map(({ className, code }) => [className, code]),
      [["policy", "unsigned-tag"]],
    );
    assert.doesNotMatch(result.stdout, /unverifiable-tag-signature/);
  } finally {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  }
});

test("runtime preflight rejects lightweight tags with the exact non-annotated-tag diagnostic", { concurrency: false }, async () => {
  const fixture = await restoreFixture("lightweight");

  try {
    const result = runPreflight(fixture, { releaseTag: "v1.2.3" });
    assert.notEqual(result.status, 0);

    const diagnostics = parseDiagnostics(result.stdout);
    assert.deepEqual(
      diagnostics.map(({ className, code }) => [className, code]),
      [["policy", "non-annotated-tag"]],
    );
    assert.doesNotMatch(result.stdout, /unsigned-tag/);
  } finally {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  }
});

test("runtime preflight rejects signed release tags that are not reachable from main", { concurrency: false }, async () => {
  const fixture = await restoreFixture("signedOffMain");

  try {
    const result = runPreflight(fixture, { releaseTag: "v1.2.3" });
    assert.notEqual(result.status, 0);

    const diagnostics = parseDiagnostics(result.stdout);
    assert.deepEqual(
      diagnostics.map(({ className, code }) => [className, code]),
      [["policy", "main-lineage"]],
    );
  } finally {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  }
});

test("runtime preflight rejects prerelease tags even when they are signed annotated tags", { concurrency: false }, async () => {
  const fixture = await restoreFixture("signedPrerelease");

  try {
    const result = runPreflight(fixture, { releaseTag: "v1.2.3-rc1", previousReleaseTag: "v1.2.2" });
    assert.notEqual(result.status, 0);

    const diagnostics = parseDiagnostics(result.stdout);
    assert.deepEqual(
      diagnostics.map(({ className, code }) => [className, code]),
      [
        ["input", "invalid-tag-format"],
        ["input", "prerelease-tag"],
      ],
    );
    assert.doesNotMatch(result.stdout, /missing-tag-ref/);
  } finally {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  }
});

test("runtime preflight keeps mixed failure ordering deterministic and preserves transient retry outputs", { concurrency: false }, async () => {
  const fixture = await restoreFixture("signedMain");

  try {
    const result = runPreflight(fixture, {
      releaseTag: "v1.2.3",
      projectVersion: "1.2.3-SNAPSHOT",
      includeCredentials: false,
      releaseFreezeApproved: "false",
      publishFailureReason: "HTTP 503 timeout while staging Maven Central release",
    });
    assert.notEqual(result.status, 0);

    const outputs = parseOutputs(result.stdout);
    assert.equal(outputs.get("retry-eligible"), "true");
    assert.equal(outputs.get("retry_reason"), "transient-network");

    const diagnostics = parseDiagnostics(result.stdout);
    assert.deepEqual(
      diagnostics.map(({ className, code }) => [className, code]),
      [
        ["policy", "release-freeze"],
        ["policy", "snapshot-version"],
        ["auth", "missing-credentials"],
        ["transient", "retry-eligibility"],
      ],
    );
  } finally {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  }
});

test("runtime retry classification keeps non-transient failures ineligible for same-tag retry", { concurrency: false }, () => {
  const result = runCommand("bash", [preflightScriptPath, "--classify-failure", "repository validation failed permanently"]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const outputs = parseOutputs(result.stdout);
  assert.equal(outputs.get("retry-eligible"), "false");
  assert.equal(outputs.get("retry_reason"), "non-transient");
  assert.equal(outputs.get("retry-reason"), "non-transient");
});
