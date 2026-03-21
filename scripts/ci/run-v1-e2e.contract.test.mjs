import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/run-v1-e2e.sh");
const composePath = path.resolve("examples/docker-compose.yml");
const wrapperPropertiesPath = path.resolve("gradle/wrapper/gradle-wrapper.properties");
const restAssuredBuildPath = path.resolve("examples/tests-restassured/build.gradle.kts");
const greenSpecPath = path.resolve("examples/openapi/demo-openapi.yaml");
const redSpecPath = path.resolve("examples/openapi/demo-openapi-unsupported-schema.yaml");

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

async function loadGreenSpecSource() {
  return readFile(greenSpecPath, "utf8");
}

async function loadRedSpecSource() {
  return readFile(redSpecPath, "utf8");
}

test("v1 e2e script uses deterministic compose file path", async () => {
  const source = await loadScriptSource();
  assert.match(source, /COMPOSE_FILE="examples\/docker-compose\.yml"/);
  assert.match(source, /docker compose -f "\$\{COMPOSE_FILE\}"/);
});

test("v1 e2e script shares one explicit Gradle home between host preflight and compose", async () => {
  const source = await loadScriptSource();
  assert.match(source, /HOST_GRADLE_HOME="(?:\$\{YANOTE_GRADLE_HOME:-\$\{GRADLE_USER_HOME:-\$\{HOME\}\/\.gradle\}\}|\$\(mktemp -d "\$\{TMPDIR:-\/tmp\}\/yanote-v1-e2e-gradle\.XXXXXX"\))"/);
  assert.match(source, /export GRADLE_USER_HOME="\$\{HOST_GRADLE_HOME\}"/);
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

test("v1 e2e script clears stale bundle paths before collecting fresh compose artifacts", async () => {
  const source = await loadScriptSource();
  assert.match(source, /reset_artifact_dir\(\) \{/);
  assert.match(source, /rm -rf "\$\{ARTIFACT_DIR\}"/);
  assert.match(source, /rm -rf "\$\{ARTIFACT_DIR\}\/out" "\$\{ARTIFACT_DIR\}\/events\.jsonl" "\$\{ARTIFACT_DIR\}\/compose\.log"/);
});

test("v1 e2e script retains the live compose events and canonical happy-path report bundle", async () => {
  const source = await loadScriptSource();
  assert.match(source, /docker compose -f "\$\{COMPOSE_FILE\}" cp report:\/data\/yanote\/out "\$\{ARTIFACT_DIR\}\/out"/);
  assert.match(source, /docker compose -f "\$\{COMPOSE_FILE\}" cp report:\/data\/yanote\/events\.jsonl "\$\{ARTIFACT_DIR\}\/events\.jsonl"/);
  assert.match(source, /docker compose -f "\$\{COMPOSE_FILE\}" logs --no-color > "\$\{ARTIFACT_DIR\}\/compose\.log"/);
});

test("v1 e2e script reruns the analyzer locally against the retained events with the unsupported-schema spec", async () => {
  const source = await loadScriptSource();
  assert.match(source, /SEMANTIC_RED_SPEC="examples\/openapi\/demo-openapi-unsupported-schema\.yaml"/);
  assert.match(source, /node yanote-js\/dist\/yanote\.cjs report \\\n    --spec "\$\{SEMANTIC_RED_SPEC\}" \\\n    --events "\$\{ARTIFACT_DIR\}\/events\.jsonl"/);
  assert.match(source, /if \[\[ "\$\{status\}" -ne 5 \]\]/);
  assert.match(source, /grep -q 'YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA' "\$\{SEMANTIC_RED_STDERR_PATH\}"/);
  assert.match(source, /cp "\$\{SEMANTIC_RED_OUT_DIR\}\/yanote-report\.json" "\$\{SEMANTIC_RED_REPORT_PATH\}"/);
});

test("v1 e2e script writes deterministic bundle manifest and source-path notes for retained green and red artifacts", async () => {
  const source = await loadScriptSource();
  assert.match(source, /SOURCE_PATHS_NOTE_NAME="artifact-source-paths\.txt"/);
  assert.match(source, /MANIFEST_NAME="artifact-manifest\.txt"/);
  assert.match(source, /semantic-red\.stdout/);
  assert.match(source, /semantic-red\.stderr/);
  assert.match(source, /semantic-red-yanote-report\.json/);
  assert.match(source, /out\/yanote-report\.json/);
  assert.match(source, /events\.jsonl/);
  assert.match(source, /printf 'source_paths_note=%s\\n' "\$\{SOURCE_PATHS_NOTE_NAME\}"/);
});

test("v1 e2e script propagates report service exit code", async () => {
  const source = await loadScriptSource();
  assert.match(source, /--exit-code-from report/);
});

test("v1 e2e script always tears down compose resources", async () => {
  const source = await loadScriptSource();
  assert.match(source, /docker compose -f "\$\{COMPOSE_FILE\}" down/);
  assert.match(source, /trap cleanup EXIT/);
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

test("unsupported demo spec keeps the live route surface but makes only POST /users payload schemas unsupported", async () => {
  const [greenSource, redSource] = await Promise.all([loadGreenSpecSource(), loadRedSpecSource()]);

  for (const route of ["/users:", "/users/{id}:", "/admin/ping:"]) {
    assert.match(greenSource, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(redSource, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(redSource, /CreateUserRequest:[\s\S]*?pattern: "\["/);
  assert.match(redSource, /CreateUserResponse:[\s\S]*?pattern: "\["/);
  assert.match(greenSource, /CreateUserRequest:[\s\S]*?name:[\s\S]*?type: string/);
  assert.doesNotMatch(greenSource, /pattern: "\["/);
});

test("gradle wrapper keeps a raised download timeout for host preflight builds", async () => {
  const source = await loadWrapperProperties();
  const match = source.match(/^networkTimeout=(\d+)$/m);

  assert.ok(match, "expected gradle wrapper networkTimeout to be configured");
  assert.ok(Number(match[1]) >= 30000, `expected networkTimeout >= 30000, got ${match[1]}`);
});
