import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, cp, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const bundleDir = path.resolve("dist/standalone-analyzer");
const launcherPath = path.join(bundleDir, "bin", "yanote");
const runtimePath = path.join(bundleDir, "lib", "yanote.cjs");
const versionPath = path.join(bundleDir, "VERSION");
const packageJsonPath = path.join(bundleDir, "package.json");

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function runLauncher(rootDir, args) {
  const file = path.join(rootDir, "bin", "yanote");

  return await new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      cwd: rootDir,
      env: { ...process.env }
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

async function makeBundleCopy() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "yanote-standalone-bundle-"));
  const copyDir = path.join(tempDir, "standalone-analyzer");
  await cp(bundleDir, copyDir, { recursive: true });
  return { tempDir, copyDir };
}

test("standalone bundle exposes one stable launcher path with explicit version metadata", async () => {
  assert.equal(await exists(launcherPath), true, "missing dist/standalone-analyzer/bin/yanote");
  assert.equal(await exists(runtimePath), true, "missing dist/standalone-analyzer/lib/yanote.cjs");
  assert.equal(await exists(versionPath), true, "missing dist/standalone-analyzer/VERSION");
  assert.equal(await exists(packageJsonPath), true, "missing dist/standalone-analyzer/package.json");
  assert.equal(await exists(path.join(bundleDir, "bin", "yanote.cjs")), false, "standalone bundle should not expose raw runtime at bin/yanote.cjs");

  const [launcherSource, standaloneVersion, packageJsonRaw, launcherStat] = await Promise.all([
    readFile(launcherPath, "utf8"),
    readFile(versionPath, "utf8"),
    readFile(packageJsonPath, "utf8"),
    stat(launcherPath)
  ]);

  const packageJson = JSON.parse(packageJsonRaw);
  const trimmedVersion = standaloneVersion.trim();

  assert.match(launcherSource, /lib\/yanote\.cjs/);
  assert.match(launcherSource, /VERSION/);
  assert.doesNotMatch(launcherSource, /dist\/node-analyzer/);
  assert.notEqual(trimmedVersion, "", "standalone VERSION file must not be empty");
  assert.notEqual(trimmedVersion, "0.0.0", "standalone VERSION file must not leak the source-build marker");
  assert.equal(packageJson.version, trimmedVersion);
  assert.equal(packageJson.bin?.yanote, "./bin/yanote");
  assert.ok((launcherStat.mode & 0o111) !== 0, "launcher should be executable");
});

test("standalone launcher surfaces staged version metadata and resolves all shipped commands", async () => {
  const expectedVersion = (await readFile(versionPath, "utf8")).trim();
  const versionResult = await runLauncher(bundleDir, ["--version"]);
  assert.equal(versionResult.code, 0);
  assert.equal(versionResult.signal, null);
  assert.equal(versionResult.stdout.trim(), expectedVersion);
  assert.equal(versionResult.stderr, "");

  const reportHelp = await runLauncher(bundleDir, ["report", "--help"]);
  assert.equal(reportHelp.code, 0);
  assert.match(reportHelp.stdout, /Compute deterministic operation coverage/);

  const asyncHelp = await runLauncher(bundleDir, ["async-report", "--help"]);
  assert.equal(asyncHelp.code, 0);
  assert.match(asyncHelp.stdout, /Compute deterministic async coverage/);

  const combinedHelp = await runLauncher(bundleDir, ["combined-report", "--help"]);
  assert.equal(combinedHelp.code, 0);
  assert.match(combinedHelp.stdout, /Combine canonical HTTP and async child reports/);
});

test("standalone launcher fails closed when version metadata is missing", async () => {
  const { tempDir, copyDir } = await makeBundleCopy();

  try {
    await rm(path.join(copyDir, "VERSION"));
    const result = await runLauncher(copyDir, ["--version"]);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /standalone version metadata missing/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("standalone launcher rejects stale default version metadata", async () => {
  const { tempDir, copyDir } = await makeBundleCopy();

  try {
    await writeFile(path.join(copyDir, "VERSION"), "0.0.0\n", "utf8");
    const result = await runLauncher(copyDir, ["--version"]);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /standalone version metadata invalid/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("standalone launcher surfaces runtime-resolution failures instead of falling back to legacy layouts", async () => {
  const { tempDir, copyDir } = await makeBundleCopy();

  try {
    await rm(path.join(copyDir, "lib", "yanote.cjs"));
    const result = await runLauncher(copyDir, ["--version"]);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /runtime not found relative to launcher/);
    assert.doesNotMatch(result.stderr, /dist\/node-analyzer/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
