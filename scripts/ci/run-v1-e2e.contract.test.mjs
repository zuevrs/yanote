import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/run-v1-e2e.sh");
const composePath = path.resolve("examples/docker-compose.yml");
const wrapperPropertiesPath = path.resolve("gradle/wrapper/gradle-wrapper.properties");
const restAssuredBuildPath = path.resolve("examples/tests-restassured/build.gradle.kts");

async function loadScriptSource() {
  return readFile(scriptPath, "utf8");
}

async function loadComposeSource() {
  return readFile(composePath, "utf8");
}

async function loadWrapperProperties() {
  return readFile(wrapperPropertiesPath, "utf8");
}

async function loadRestAssuredBuildSource() {
  return readFile(restAssuredBuildPath, "utf8");
}

test("v1 e2e script uses deterministic compose file path", async () => {
  const source = await loadScriptSource();
  assert.match(source, /COMPOSE_FILE="examples\/docker-compose\.yml"/);
  assert.match(source, /docker compose -f "\$\{COMPOSE_FILE\}"/);
});

test("v1 e2e script shares one explicit Gradle home between host preflight and compose", async () => {
  const source = await loadScriptSource();
  assert.match(source, /HOST_GRADLE_HOME="\$\{YANOTE_GRADLE_HOME:-\$\{GRADLE_USER_HOME:-\$\{HOME\}\/\.gradle\}\}"/);
  assert.match(source, /export YANOTE_GRADLE_HOME="\$\{HOST_GRADLE_HOME\}"/);
  assert.match(source, /\.\/gradlew --no-daemon -g "\$\{HOST_GRADLE_HOME\}"/);
});

test("v1 e2e script prebuilds example service and test assets on the host before compose", async () => {
  const source = await loadScriptSource();
  assert.match(source, /prepare_demo_assets\(\)/);
  assert.match(source, /:examples:springmvc-service:bootJar/);
  assert.match(source, /:examples:tests-restassured:testClasses/);
  assert.match(source, /:examples:tests-restassured:resolveTestRuntimeClasspath/);
});

test("v1 e2e script prebuilds analyzer assets on the host before compose", async () => {
  const source = await loadScriptSource();
  assert.match(source, /npm -C yanote-js ci/);
  assert.match(source, /npm -C yanote-js run build/);
});

test("v1 e2e script propagates report service exit code", async () => {
  const source = await loadScriptSource();
  assert.match(source, /--exit-code-from report/);
});

test("v1 e2e script always tears down compose resources", async () => {
  const source = await loadScriptSource();
  assert.match(source, /docker compose -f "\$\{COMPOSE_FILE\}" down/);
});

test("compose demo resolves the boot jar through the shared resolver", async () => {
  const source = await loadComposeSource();
  assert.match(source, /\.\/examples\/resolve-springmvc-boot-jar\.sh/);
});

test("compose demo does not launch the example service through raw wildcard jar expansion", async () => {
  const source = await loadComposeSource();
  assert.doesNotMatch(source, /-jar\s+examples\/springmvc-service\/build\/libs\/\*\.jar/);
});

test("compose demo mounts the explicit shared Gradle home into the tests container", async () => {
  const source = await loadComposeSource();
  assert.match(source, /\$\{YANOTE_GRADLE_HOME:-\$\{HOME\}\/\.gradle\}:\/data\/gradle/);
});

test("compose demo runs tests through offline Gradle once host assets are prepared", async () => {
  const source = await loadComposeSource();
  assert.match(source, /\.\/gradlew --offline --no-daemon .*:examples:tests-restassured:test --rerun-tasks/);
});

test("tests-restassured exposes an explicit runtime prewarm task for offline demo runs", async () => {
  const source = await loadRestAssuredBuildSource();
  assert.match(source, /resolveTestRuntimeClasspath/);
  assert.match(source, /configurations\.named\("testRuntimeClasspath"\)/);
});

test("compose demo report container consumes the prebuilt analyzer instead of reinstalling Node deps", async () => {
  const source = await loadComposeSource();
  assert.match(source, /node yanote-js\/dist\/yanote\.cjs report/);
  assert.doesNotMatch(source, /npm -C yanote-js ci/);
  assert.doesNotMatch(source, /npm -C yanote-js run build/);
});

test("gradle wrapper keeps a raised download timeout for host preflight builds", async () => {
  const source = await loadWrapperProperties();
  const match = source.match(/^networkTimeout=(\d+)$/m);

  assert.ok(match, "expected gradle wrapper networkTimeout to be configured");
  assert.ok(Number(match[1]) >= 30000, `expected networkTimeout >= 30000, got ${match[1]}`);
});
