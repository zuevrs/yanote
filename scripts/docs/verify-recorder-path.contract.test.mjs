import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const verifierSourcePath = path.resolve("scripts/docs/verify-recorder-path.sh");
const fixtureSettingsPath = path.resolve("test/fixtures/recorder-spring-smoke/settings.gradle.kts");

async function writeExecutable(filePath, content) {
  await writeFile(filePath, content, "utf8");
  await chmod(filePath, 0o755);
}

function fakeGradleScript(bootMode) {
  return `#!/usr/bin/env bash
set -euo pipefail

state_file="${'$'}{FAKE_PUBLISH_STATE_FILE:-}"
fail_count="${'$'}{FAKE_PUBLISH_FAIL_COUNT:-0}"

publish_attempt() {
  if [[ -z "${'$'}state_file" ]]; then
    echo 0
    return
  fi

  if [[ -f "${'$'}state_file" ]]; then
    cat "${'$'}state_file"
  else
    echo 0
  fi
}

record_publish_attempt() {
  local next_value="${'$'}1"
  if [[ -n "${'$'}state_file" ]]; then
    printf '%s' "${'$'}next_value" > "${'$'}state_file"
  fi
}

if [[ "$*" == *"publishToMavenLocal"* ]]; then
  current_attempt="$(publish_attempt)"
  next_attempt=$((current_attempt + 1))
  record_publish_attempt "${'$'}next_attempt"

  if (( current_attempt < fail_count )); then
    echo "simulated publish failure on attempt ${'$'}next_attempt" >&2
    exit 1
  fi

  echo "published fake artifacts on attempt ${'$'}next_attempt"
  exit 0
fi

if [[ "$*" != *"bootRun"* ]]; then
  echo "unexpected fake gradle invocation: $*" >&2
  exit 1
fi

case ${JSON.stringify(bootMode)} in
  serve)
    exec python3 -u - "${'$'}{SERVER_PORT:?}" "${'$'}{YANOTE_EVENTS_PATH:?}" "${'$'}{YANOTE_SERVICE_NAME:?}" <<'PY'
import http.server
import json
import pathlib
import sys
import urllib.parse

port = int(sys.argv[1])
events_path = pathlib.Path(sys.argv[2])
service_name = sys.argv[3]

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        sys.stdout.write(f"fixture request: {format % args}\\n")
        sys.stdout.flush()

    def do_GET(self):
        parsed = urllib.parse.urlsplit(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        if parsed.path != "/orders/42" or query.get("expand") != ["true"]:
            self.send_response(404)
            self.end_headers()
            return

        payload = {"orderId": "42", "expand": True, "status": "ok"}
        record = {
            "method": "GET",
            "route": "/orders/{orderId}",
            "status": 200,
            "service": service_name,
            "test.run_id": None,
            "test.suite": None,
            "responseBodyState": "captured",
            "responseBodyReason": None,
            "responseBody": payload,
        }
        events_path.parent.mkdir(parents=True, exist_ok=True)
        with events_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record) + "\\n")

        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

server = http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler)
print(f"fixture listening on 127.0.0.1:{port}", flush=True)
server.serve_forever()
PY
    ;;
  hang)
    echo "fixture intentionally stays alive without binding port ${'$'}{SERVER_PORT:?}" >&2
    trap 'exit 0' TERM INT
    while true; do
      sleep 1
    done
    ;;
  exit)
    echo "fixture exits before binding port ${'$'}{SERVER_PORT:?}" >&2
    exit 0
    ;;
  *)
    echo "unknown fake boot mode: ${JSON.stringify(bootMode)}" >&2
    exit 1
    ;;
esac
`;
}

async function createContractRepo(bootMode) {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "yanote-recorder-contract-"));
  const scriptsDir = path.join(rootDir, "scripts", "docs");
  const fixtureDir = path.join(rootDir, "test", "fixtures", "recorder-spring-smoke");
  const binDir = path.join(rootDir, ".fake-bin");
  const verifierSource = await readFile(verifierSourcePath, "utf8");

  await mkdir(scriptsDir, { recursive: true });
  await mkdir(fixtureDir, { recursive: true });
  await mkdir(binDir, { recursive: true });

  await writeExecutable(path.join(rootDir, "gradlew"), fakeGradleScript(bootMode));
  await writeExecutable(path.join(binDir, "sleep"), `#!/usr/bin/env bash
seconds="${'$'}{1:-0}"
python3 - "$seconds" <<'PY'
import sys
import time
seconds = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
time.sleep(0 if seconds <= 0 else min(seconds, 1.0) / 20.0)
PY
`);

  await writeFile(path.join(rootDir, "gradle.properties"), "group=io.github.zuevrs\nversion=0.1.0-SNAPSHOT\n", "utf8");
  await writeFile(path.join(scriptsDir, "verify-recorder-path.sh"), verifierSource, "utf8");
  await chmod(path.join(scriptsDir, "verify-recorder-path.sh"), 0o755);

  return { rootDir, binDir };
}

async function runVerifier(rootDir, binDir, extraEnv = {}) {
  return execFileAsync("bash", ["scripts/docs/verify-recorder-path.sh"], {
    cwd: rootDir,
    env: {
      ...process.env,
      PATH: `${binDir}:${process.env.PATH}`,
      YANOTE_STARTUP_TIMEOUT_SECONDS: "3",
      ...extraEnv,
    },
    timeout: 20_000,
    maxBuffer: 1024 * 1024,
  });
}

test("fixture bootstrap settings pin Spring plugin resolution to mavenLocal and mavenCentral without Plugin Portal fallback", async () => {
  const settings = await readFile(fixtureSettingsPath, "utf8");

  assert.match(settings, /pluginManagement\s*\{/);
  assert.match(settings, /mavenLocal\(\)/);
  assert.match(settings, /mavenCentral\(\)/);
  assert.match(settings, /org\.springframework\.boot" -> useModule\("org\.springframework\.boot:spring-boot-gradle-plugin:/);
  assert.match(settings, /io\.spring\.dependency-management" -> useModule\("io\.spring\.gradle:dependency-management-plugin:/);
  assert.doesNotMatch(settings, /gradlePluginPortal\(\)/);
});

test("recorder verifier source forbids refresh-dependencies and pins retry plus retained phase diagnostics", async () => {
  const source = await readFile(verifierSourcePath, "utf8");

  assert.doesNotMatch(source, /--refresh-dependencies/);
  assert.match(source, /run_publish_with_retry/);
  assert.match(source, /Publish attempt \$\{attempt\}\/\$\{PUBLISH_RETRY_MAX_ATTEMPTS\} failed; retrying once/);
  assert.match(source, /ERROR \[\$\{BOOTSTRAP_PHASE\}\]:/);
  assert.match(source, /phase: \$\{BOOTSTRAP_PHASE\}/);
});

test("recorder verifier accepts a live port even when bootRun never prints the Spring started log", async () => {
  const { rootDir, binDir } = await createContractRepo("serve");

  try {
    const { stdout, stderr } = await runVerifier(rootDir, binDir);
    const combined = `${stdout}\n${stderr}`;

    assert.match(combined, /Waiting for Spring smoke fixture to open port \d+/);
    assert.match(combined, /Sending proof request to http:\/\/127\.0\.0\.1:\d+\/orders\/42\?expand=true/);
    assert.match(combined, /Recorder proof passed: method=GET route=\/orders\/\{orderId\} status=200 service=recorder-spring-smoke/);
    assert.doesNotMatch(combined, /Started RecorderSmokeApplication/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("recorder verifier retries publish once and succeeds when the second publish attempt works", async () => {
  const { rootDir, binDir } = await createContractRepo("serve");
  const publishStateFile = path.join(rootDir, "publish-state.txt");

  try {
    const { stdout, stderr } = await runVerifier(rootDir, binDir, {
      FAKE_PUBLISH_FAIL_COUNT: "1",
      FAKE_PUBLISH_STATE_FILE: publishStateFile,
    });
    const combined = `${stdout}\n${stderr}`;

    assert.match(combined, /Publish attempt 1\/2 failed; retrying once/);
    assert.match(combined, /Publish recovered on retry 2\/2\./);
    assert.match(combined, /Recorder proof passed:/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("recorder verifier fails closed with publish-phase diagnostics after retry exhaustion", async () => {
  const { rootDir, binDir } = await createContractRepo("serve");
  const publishStateFile = path.join(rootDir, "publish-state.txt");

  try {
    await assert.rejects(
      runVerifier(rootDir, binDir, {
        FAKE_PUBLISH_FAIL_COUNT: "2",
        FAKE_PUBLISH_STATE_FILE: publishStateFile,
        YANOTE_PUBLISH_RETRY_MAX_ATTEMPTS: "2",
      }),
      (error) => {
        const combined = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;

        assert.match(combined, /ERROR \[publish\]: Gradle publishToMavenLocal failed after 2 attempt\(s\)\./);
        assert.match(combined, /phase: publish/);
        assert.match(combined, /publish_log:/);
        assert.match(combined, /app_log:/);
        return true;
      },
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("recorder verifier fails closed with the probed port and retained artifact paths when readiness never opens", async () => {
  const { rootDir, binDir } = await createContractRepo("hang");

  try {
    await assert.rejects(
      runVerifier(rootDir, binDir, { YANOTE_STARTUP_TIMEOUT_SECONDS: "2" }),
      (error) => {
        const combined = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;

        assert.match(combined, /ERROR \[readiness\]: Spring smoke fixture did not open port \d+ within 2 seconds\./);
        assert.match(combined, /phase: readiness/);
        assert.match(combined, /readiness_port: \d+/);
        assert.match(combined, /publish_log:/);
        assert.match(combined, /app_log:/);
        assert.match(combined, /events_file:/);
        assert.match(combined, /response_file:/);
        return true;
      },
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("recorder verifier fails fast if bootRun exits before the port opens", async () => {
  const { rootDir, binDir } = await createContractRepo("exit");

  try {
    await assert.rejects(
      runVerifier(rootDir, binDir, { YANOTE_STARTUP_TIMEOUT_SECONDS: "2" }),
      (error) => {
        const combined = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;

        assert.match(combined, /ERROR \[readiness\]: Spring smoke fixture exited before opening port \d+\./);
        assert.match(combined, /phase: readiness/);
        assert.match(combined, /readiness_port: \d+/);
        return true;
      },
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
