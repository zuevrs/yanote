import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, utimes } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const execFile = promisify(execFileCallback);
const resolverPath = path.resolve("examples/resolve-springmvc-boot-jar.sh");

async function createFixtureDir() {
  return mkdtemp(path.join(os.tmpdir(), "yanote-boot-jar-"));
}

async function touchFile(filePath, secondsOffset = 0) {
  await writeFile(filePath, "", "utf8");
  const when = new Date(Date.now() + secondsOffset * 1000);
  await utimes(filePath, when, when);
}

test("resolver selects the executable jar when both boot and plain jars exist", async () => {
  const fixtureDir = await createFixtureDir();
  await touchFile(path.join(fixtureDir, "springmvc-service-0.1.0-SNAPSHOT-plain.jar"), -10);
  const bootJarPath = path.join(fixtureDir, "springmvc-service-0.1.0-SNAPSHOT.jar");
  await touchFile(bootJarPath, 0);

  const { stdout, stderr } = await execFile(resolverPath, [fixtureDir]);

  assert.equal(stdout.trim(), bootJarPath);
  assert.equal(stderr, "");
});

test("resolver picks the newest executable jar when multiple candidates exist", async () => {
  const fixtureDir = await createFixtureDir();
  const olderJarPath = path.join(fixtureDir, "springmvc-service-0.0.9-SNAPSHOT.jar");
  const newerJarPath = path.join(fixtureDir, "springmvc-service-0.1.0-SNAPSHOT.jar");
  await touchFile(olderJarPath, -20);
  await touchFile(newerJarPath, 0);

  const { stdout } = await execFile(resolverPath, [fixtureDir]);

  assert.equal(stdout.trim(), newerJarPath);
});

test("resolver fails clearly when only plain jars are available", async () => {
  const fixtureDir = await createFixtureDir();
  await touchFile(path.join(fixtureDir, "springmvc-service-0.1.0-SNAPSHOT-plain.jar"), 0);

  await assert.rejects(
    execFile(resolverPath, [fixtureDir]),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /No executable Spring Boot jar found/);
      return true;
    },
  );
});

test("resolver fails clearly when the jar directory is missing", async () => {
  const missingDir = path.join(await createFixtureDir(), "missing");

  await assert.rejects(
    execFile(resolverPath, [missingDir]),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Spring Boot jar directory not found/);
      return true;
    },
  );
});
