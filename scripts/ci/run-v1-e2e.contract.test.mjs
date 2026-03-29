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

test("v1 e2e script prebuilds example service, test assets, and the standalone analyzer launcher on the host before compose", async () => {
  const source = await loadScriptSource();
  assert.match(source, /prepare_demo_assets\(\)/);
  assert.match(source, /:examples:springmvc-service:bootJar/);
  assert.match(source, /:examples:tests-restassured:testClasses/);
  assert.match(source, /:examples:tests-restassured:resolveTestRuntimeClasspath/);
  assert.match(source, /distStandaloneAnalyzer/);
});

test("v1 e2e script still prebuilds raw Node analyzer assets for host-side focused sidecar reruns", async () => {
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

test("v1 e2e script retains the live compose events and happy-path JSON+HTML report bundle", async () => {
  const source = await loadScriptSource();
  assert.match(source, /HAPPY_PATH_REPORT_JSON_PATH="\$\{ARTIFACT_DIR\}\/out\/yanote-report\.json"/);
  assert.match(source, /HAPPY_PATH_REPORT_HTML_PATH="\$\{ARTIFACT_DIR\}\/out\/yanote-report\.html"/);
  assert.match(source, /docker compose -f "\$\{COMPOSE_FILE\}" cp report:\/data\/yanote\/out "\$\{ARTIFACT_DIR\}\/out"/);
  assert.match(source, /docker compose -f "\$\{COMPOSE_FILE\}" cp report:\/data\/yanote\/events\.jsonl "\$\{ARTIFACT_DIR\}\/events\.jsonl"/);
  assert.match(source, /docker compose -f "\$\{COMPOSE_FILE\}" logs --no-color > "\$\{ARTIFACT_DIR\}\/compose\.log"/);
});

test("v1 e2e script extracts happy-path spec-source and deprecated-operation metadata from the retained HTTP report", async () => {
  const source = await loadScriptSource();
  assert.match(source, /extract_http_report_metadata\(\) \{/);
  assert.match(source, /spec_source = report\.get\("specSource"\) or \{\}/);
  assert.match(source, /deprecated = \(report\.get\("summary"\) or \{\}\)\.get\("deprecatedOperations"\) or \{\}/);
  assert.match(source, /emit\("spec_source_kind", spec_source\.get\("kind", "none"\)\)/);
  assert.match(source, /emit\("spec_source_ref", spec_source\.get\("reference", "none"\)\)/);
  assert.match(source, /emit\("deprecated_total", deprecated\.get\("totalOperations", 0\)\)/);
  assert.match(source, /emit\("deprecated_uncovered", deprecated\.get\("uncoveredOperations", 0\)\)/);
});

test("v1 e2e script reruns the analyzer locally against filtered retained request events with the request-evidence spec", async () => {
  const source = await loadScriptSource();
  assert.match(source, /REQUEST_SEMANTICS_SPEC="examples\/openapi\/request-evidence-openapi\.yaml"/);
  assert.match(source, /REQUEST_SEMANTICS_ROUTE="\/request-evidence\/users\/\{userId\}"/);
  assert.match(source, /REQUEST_SEMANTICS_EVENTS_PATH="\$\{ARTIFACT_DIR\}\/request-semantics\.events\.jsonl"/);
  assert.match(source, /record\.get\("route"\) == route/);
  assert.match(source, /node yanote-js\/dist\/yanote\.cjs report \\\n    --spec "\$\{REQUEST_SEMANTICS_SPEC\}" \\\n    --events "\$\{REQUEST_SEMANTICS_EVENTS_PATH\}"/);
  assert.match(source, /if \[\[ "\$\{status\}" -ne 5 \]\]/);
  assert.match(source, /grep -q 'YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER' "\$\{REQUEST_SEMANTICS_STDERR_PATH\}"/);
  assert.match(source, /cp "\$\{REQUEST_SEMANTICS_OUT_DIR\}\/yanote-report\.json" "\$\{REQUEST_SEMANTICS_REPORT_PATH\}"/);
});

test("v1 e2e script reruns the analyzer locally against the focused security fixtures and retains public sidecars", async () => {
  const source = await loadScriptSource();
  assert.match(source, /SECURITY_SEMANTICS_SPEC="yanote-js\/test\/fixtures\/openapi\/http-security-api-key\.yaml"/);
  assert.match(source, /SECURITY_SEMANTICS_EVENTS_FIXTURE="yanote-js\/test\/fixtures\/events\/http-security-api-key\.fixture\.jsonl"/);
  assert.match(source, /SECURITY_SEMANTICS_STDOUT_PATH="\$\{ARTIFACT_DIR\}\/security-semantics\.stdout"/);
  assert.match(source, /SECURITY_SEMANTICS_STDERR_PATH="\$\{ARTIFACT_DIR\}\/security-semantics\.stderr"/);
  assert.match(source, /SECURITY_SEMANTICS_REPORT_PATH="\$\{ARTIFACT_DIR\}\/security-semantics-yanote-report\.json"/);
  assert.match(source, /node yanote-js\/dist\/yanote\.cjs report \\\n    --spec "\$\{SECURITY_SEMANTICS_SPEC\}" \\\n    --events "\$\{SECURITY_SEMANTICS_EVENTS_FIXTURE\}" \\\n    --out "\$\{SECURITY_SEMANTICS_OUT_DIR\}" \\\n    --profile local \\\n    --verbose/);
  assert.match(source, /grep -q '\^HTTP Security Conformance\$' "\$\{SECURITY_SEMANTICS_STDOUT_PATH\}"/);
  assert.match(source, /grep -q 'YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_MISSING_SECURITY' "\$\{SECURITY_SEMANTICS_STDERR_PATH\}"/);
  assert.match(source, /grep -q 'primary=SEMANTIC_HTTP_MISSING_SECURITY' "\$\{SECURITY_SEMANTICS_STDOUT_PATH\}"/);
  assert.match(source, /cp "\$\{SECURITY_SEMANTICS_OUT_DIR\}\/yanote-report\.json" "\$\{SECURITY_SEMANTICS_REPORT_PATH\}"/);
});

test("v1 e2e script keeps request-semantics stdout and stderr free of retained request values and secrets", async () => {
  const source = await loadScriptSource();
  assert.match(source, /REQUEST_SEMANTICS_FORBIDDEN_STDIO_VALUES=\("user-42" "alpha" "bravo" "amber" "compact" "opaque"\)/);
  assert.match(source, /REQUEST_SEMANTICS_FORBIDDEN_SECRET_VALUES=\("Bearer proof-secret-token" "proof-session-secret"\)/);
  assert.match(source, /ensure_no_file_leak "\$\{REQUEST_SEMANTICS_STDOUT_PATH\}" "request-semantics stdout" "\$\{REQUEST_SEMANTICS_FORBIDDEN_STDIO_VALUES\[@\]\}"/);
  assert.match(source, /ensure_no_file_leak "\$\{REQUEST_SEMANTICS_STDERR_PATH\}" "request-semantics stderr" "\$\{REQUEST_SEMANTICS_FORBIDDEN_SECRET_VALUES\[@\]\}"/);
});

test("v1 e2e script keeps retained security sidecars and report free of fixture secrets", async () => {
  const source = await loadScriptSource();
  assert.match(source, /SECURITY_SEMANTICS_FORBIDDEN_VALUES=\([\s\S]*"header-secret-123"[\s\S]*"query-secret-456"[\s\S]*"path-secret-xyz"[\s\S]*\)/);
  assert.match(source, /ensure_no_file_leak "\$\{SECURITY_SEMANTICS_STDOUT_PATH\}" "security-semantics stdout" "\$\{SECURITY_SEMANTICS_FORBIDDEN_VALUES\[@\]\}"/);
  assert.match(source, /ensure_no_file_leak "\$\{SECURITY_SEMANTICS_STDERR_PATH\}" "security-semantics stderr" "\$\{SECURITY_SEMANTICS_FORBIDDEN_VALUES\[@\]\}"/);
  assert.match(source, /ensure_no_file_leak "\$\{SECURITY_SEMANTICS_REPORT_PATH\}" "security-semantics yanote-report" "\$\{SECURITY_SEMANTICS_FORBIDDEN_VALUES\[@\]\}"/);
});

test("v1 e2e script reruns the analyzer locally against the retained events with the unsupported-schema spec", async () => {
  const source = await loadScriptSource();
  assert.match(source, /SEMANTIC_RED_SPEC="examples\/openapi\/demo-openapi-unsupported-schema\.yaml"/);
  assert.match(source, /node yanote-js\/dist\/yanote\.cjs report \\\n    --spec "\$\{SEMANTIC_RED_SPEC\}" \\\n    --events "\$\{ARTIFACT_DIR\}\/events\.jsonl"/);
  assert.match(source, /if \[\[ "\$\{status\}" -ne 5 \]\]/);
  assert.match(source, /grep -q 'YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA' "\$\{SEMANTIC_RED_STDERR_PATH\}"/);
  assert.match(source, /cp "\$\{SEMANTIC_RED_OUT_DIR\}\/yanote-report\.json" "\$\{SEMANTIC_RED_REPORT_PATH\}"/);
});

test("v1 e2e script writes deterministic bundle manifest and source-path notes for retained green JSON+HTML plus request, security, and red artifacts", async () => {
  const source = await loadScriptSource();
  assert.match(source, /SOURCE_PATHS_NOTE_NAME="artifact-source-paths\.txt"/);
  assert.match(source, /MANIFEST_NAME="artifact-manifest\.txt"/);
  assert.match(source, /out\/yanote-report\.json=%s\\n' 'report:\/data\/yanote\/out\/yanote-report\.json'/);
  assert.match(source, /out\/yanote-report\.html=%s\\n' 'report:\/data\/yanote\/out\/yanote-report\.html'/);
  assert.match(source, /happy_path_spec_source_kind=%s\\n' "\$\{happy_path_spec_source_kind\}"/);
  assert.match(source, /happy_path_spec_source_ref=%s\\n' "\$\{happy_path_spec_source_ref\}"/);
  assert.match(source, /happy_path_deprecated_total=%s\\n' "\$\{happy_path_deprecated_total\}"/);
  assert.match(source, /happy_path_report_html_found=%s\\n' "\$\{happy_path_report_html_found\}"/);
  assert.match(source, /request-semantics\.events\.jsonl/);
  assert.match(source, /request-semantics\.stdout/);
  assert.match(source, /request-semantics\.stderr/);
  assert.match(source, /request-semantics-yanote-report\.json/);
  assert.match(source, /request-semantics\.events\.jsonl=%s\\n' 'filtered:\.yanote-ci\/v1-e2e\/events\.jsonl route=\/request-evidence\/users\/\{userId\}'/);
  assert.match(source, /request_semantics_expected_exit=%s\\n' '5'/);
  assert.match(source, /request_semantics_primary=%s\\n' 'SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER'/);
  assert.match(source, /security_semantics_spec=%s\\n' 'yanote-js\/test\/fixtures\/openapi\/http-security-api-key\.yaml'/);
  assert.match(source, /security_semantics_events=%s\\n' 'yanote-js\/test\/fixtures\/events\/http-security-api-key\.fixture\.jsonl'/);
  assert.match(source, /security-semantics\.stdout/);
  assert.match(source, /security-semantics\.stderr/);
  assert.match(source, /security-semantics-yanote-report\.json/);
  assert.match(source, /security-semantics\.stdout=%s\\n' 'host:node yanote-js\/dist\/yanote\.cjs report --spec yanote-js\/test\/fixtures\/openapi\/http-security-api-key\.yaml --events yanote-js\/test\/fixtures\/events\/http-security-api-key\.fixture\.jsonl --out <temp> --profile local --verbose'/);
  assert.match(source, /security_semantics_expected_exit=%s\\n' '5'/);
  assert.match(source, /security_semantics_primary=%s\\n' 'SEMANTIC_HTTP_MISSING_SECURITY'/);
  assert.match(source, /semantic-red\.stdout/);
  assert.match(source, /semantic-red\.stderr/);
  assert.match(source, /semantic-red-yanote-report\.json/);
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

test("compose demo report container consumes the prebuilt standalone analyzer launcher instead of the raw Node seam", async () => {
  const source = await loadComposeSource();
  assert.match(source, /YANOTE_ANALYZER_PATH: \/workspace\/dist\/standalone-analyzer\/bin\/yanote/);
  assert.match(source, /standalone analyzer launcher not found at \$\$\{YANOTE_ANALYZER_PATH\}\. Run \.\/gradlew distStandaloneAnalyzer before docker compose up\./);
  assert.match(source, /"\$\$\{YANOTE_ANALYZER_PATH\}" report --spec \/workspace\/examples\/openapi\/demo-openapi\.yaml --events \/data\/yanote\/events\.jsonl --out \/data\/yanote\/out --min-coverage 100 --profile local/);
  assert.doesNotMatch(source, /node yanote-js\/dist\/yanote\.cjs report/);
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
