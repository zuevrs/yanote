import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const verifierSourcePath = path.resolve("scripts/ci/verify-recorder-spring-webflux-example.sh");

async function writeExecutable(filePath, content) {
  await writeFile(filePath, content, "utf8");
  await chmod(filePath, 0o755);
}

function fakeGradleScript(bootMode) {
  return `#!/usr/bin/env bash
set -euo pipefail

if [[ "$*" == *":examples:webflux-service:classes"* ]]; then
  echo "compiled fake WebFlux example"
  exit 0
fi

if [[ "$*" != *":examples:webflux-service:bootRun"* ]]; then
  echo "unexpected fake gradle invocation: $*" >&2
  exit 1
fi

case ${JSON.stringify(bootMode)} in
  serve)
    exec python3 -u - "${'$'}{EXAMPLE_SERVER_PORT:?}" "${'$'}{YANOTE_EVENTS_PATH:?}" "${'$'}{EXAMPLE_SERVICE_NAME:?}" "${'$'}{YANOTE_REQUEST_FLAVOR:-amber}" <<'PY'
import http.server
import json
import pathlib
import sys
import urllib.parse

port = int(sys.argv[1])
events_path = pathlib.Path(sys.argv[2])
service_name = sys.argv[3]
request_flavor = sys.argv[4]

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        sys.stdout.write(f"fixture request: {format % args}\\n")
        sys.stdout.flush()

    def do_GET(self):
        parsed = urllib.parse.urlsplit(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        if parsed.path != "/request-evidence/users/user-42":
            self.send_response(404)
            self.end_headers()
            return
        if query.get("expand") != ["true"] or query.get("tags") != ["alpha", "bravo"]:
            self.send_response(400)
            self.end_headers()
            return

        record = {
            "method": "GET",
            "route": "/request-evidence/users/{userId}",
            "status": 200,
            "service": service_name,
            "test.run_id": self.headers.get("X-Test-Run-Id"),
            "test.suite": self.headers.get("X-Test-Suite"),
            "pathParams": {
                "userId": {"state": "captured", "reason": None, "values": ["user-42"]}
            },
            "queryParams": {
                "expand": {"state": "captured", "reason": None, "values": ["true"]},
                "tags": {"state": "captured", "reason": None, "values": ["alpha", "bravo"]}
            },
            "requestHeaders": {
                "x-request-flavor": {"state": "captured", "reason": None, "values": [self.headers.get("X-Request-Flavor")]},
                "authorization": {"state": "redacted", "reason": "sensitive", "values": None}
            },
            "cookies": {
                "clientMode": {"state": "captured", "reason": None, "values": ["compact"]},
                "SESSION": {"state": "redacted", "reason": "sensitive", "values": None}
            },
            "requestBody": None,
            "requestBodyState": None,
            "requestBodyReason": None,
            "requestContentType": None,
            "responseBody": None,
            "responseBodyState": None,
            "responseBodyReason": None,
            "responseContentType": None,
        }
        events_path.parent.mkdir(parents=True, exist_ok=True)
        with events_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record) + "\\n")

        payload = {
            "userId": "user-42",
            "expand": True,
            "tags": ["alpha", "bravo"],
            "requestFlavor": request_flavor,
            "clientMode": "compact",
            "authorizationProvided": True,
            "sessionProvided": True,
        }
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
    echo "fixture intentionally stays alive without binding port ${'$'}{EXAMPLE_SERVER_PORT:?}" >&2
    trap 'exit 0' TERM INT
    while true; do
      sleep 1
    done
    ;;
  exit)
    echo "fixture exits before binding port ${'$'}{EXAMPLE_SERVER_PORT:?}" >&2
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
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "yanote-webflux-example-contract-"));
  const scriptsDir = path.join(rootDir, "scripts", "ci");
  const binDir = path.join(rootDir, ".fake-bin");
  const verifierSource = await readFile(verifierSourcePath, "utf8");

  await mkdir(scriptsDir, { recursive: true });
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

  await writeFile(path.join(scriptsDir, "verify-recorder-spring-webflux-example.sh"), verifierSource, "utf8");
  await chmod(path.join(scriptsDir, "verify-recorder-spring-webflux-example.sh"), 0o755);

  return { rootDir, binDir };
}

async function runVerifier(rootDir, binDir, extraEnv = {}) {
  return execFileAsync("bash", ["scripts/ci/verify-recorder-spring-webflux-example.sh"], {
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

test("webflux example verifier source stays internal and keeps retained phase diagnostics", async () => {
  const source = await readFile(verifierSourcePath, "utf8");

  assert.doesNotMatch(source, /publishToMavenLocal/);
  assert.doesNotMatch(source, /scripts\/docs/);
  assert.match(source, /ERROR \[\$\{BOOTSTRAP_PHASE\}\]:/);
  assert.match(source, /phase: \$\{BOOTSTRAP_PHASE\}/);
  assert.match(source, /Recorded JSONL fields drifted from the WebFlux proof contract/);
  assert.match(source, /requestBodyState/);
  assert.match(source, /responseBodyState/);
});

test("webflux example verifier accepts a live port even when bootRun never prints a Spring started log", async () => {
  const { rootDir, binDir } = await createContractRepo("serve");

  try {
    const { stdout, stderr } = await runVerifier(rootDir, binDir);
    const combined = `${stdout}\n${stderr}`;

    assert.match(combined, /Waiting for WebFlux example to open port \d+/);
    assert.match(combined, /Sending proof request to http:\/\/127\.0\.0\.1:\d+\/request-evidence\/users\/user-42\?expand=true&tags=alpha&tags=bravo/);
    assert.match(combined, /WebFlux recorder proof passed: method=GET route=\/request-evidence\/users\/\{userId\} status=200 service=examples-webflux-service-proof/);
    assert.doesNotMatch(combined, /Started WebfluxExampleServiceApplication/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("webflux example verifier fails closed with the probed port and retained artifact paths when readiness never opens", async () => {
  const { rootDir, binDir } = await createContractRepo("hang");

  try {
    await assert.rejects(
      runVerifier(rootDir, binDir, { YANOTE_STARTUP_TIMEOUT_SECONDS: "2" }),
      (error) => {
        const combined = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;

        assert.match(combined, /ERROR \[readiness\]: WebFlux example did not open port \d+ within 2 seconds\./);
        assert.match(combined, /phase: readiness/);
        assert.match(combined, /readiness_port: \d+/);
        assert.match(combined, /build_log:/);
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

test("webflux example verifier fails fast if bootRun exits before the port opens", async () => {
  const { rootDir, binDir } = await createContractRepo("exit");

  try {
    await assert.rejects(
      runVerifier(rootDir, binDir, { YANOTE_STARTUP_TIMEOUT_SECONDS: "2" }),
      (error) => {
        const combined = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;

        assert.match(combined, /ERROR \[readiness\]: WebFlux example exited before opening port \d+\./);
        assert.match(combined, /phase: readiness/);
        assert.match(combined, /readiness_port: \d+/);
        return true;
      },
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
