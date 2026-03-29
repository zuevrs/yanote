---
estimated_steps: 25
estimated_files: 5
skills_used: []
---

# T01: Replace recorder log-scrape readiness with a deterministic runtime probe

Rebuild the recorder runtime verifier around a real readiness signal. Current evidence shows `bash scripts/docs/verify-s01-recorder-path.sh` can time out after the smoke fixture is already serving because it waits on a specific Spring boot log line under redirected `bootRun` output. This task directly stabilizes the S05-06 recorder stage and keeps the recorder proof truthful.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `./gradlew ... publishToMavenLocal` and `./gradlew ... bootRun` | Fail closed, keep logs/temp paths, and do not attempt the proof request | Stop the verifier and surface the last publish/app log lines | Reject partial startup state instead of continuing |
| Localhost readiness probe on the reserved `SERVER_PORT` | Keep waiting only while the fixture process is alive; if it exits, fail immediately with diagnostics | Fail with the probed port and retained temp-dir details | Reject false-positive readiness that never opens the port |
| Proof `curl` request and `events.jsonl` assertions | Fail closed and preserve `response.json` / `events.jsonl` paths | Treat as recorder/runtime regression and keep artifacts | Reject empty or mismatched JSONL instead of passing a flaky stage |

## Load Profile

- **Shared resources**: local Maven cache, temporary Gradle home, reserved localhost ports, and retained temp files.
- **Per-operation cost**: one local publish, one bootRun process, one readiness loop, and one proof HTTP call.
- **10x breakpoint**: repeated cold-start churn and port collisions dominate before JSONL parsing does.

## Negative Tests

- **Malformed inputs**: stale log-based readiness logic or a reused port that never opens.
- **Error paths**: the bootRun process stays alive but never writes the final `Started RecorderSmokeApplication` line, or exits before the readiness probe succeeds.
- **Boundary conditions**: the first real proof request after readiness still creates non-empty `events.jsonl` with the documented fields.

## Steps

1. Reproduce the current timeout and preserve the failing `fixture.log` so the change is grounded in observed behavior, not assumption.
2. Replace the log-line wait in `scripts/docs/verify-s01-recorder-path.sh` with a deterministic localhost readiness probe that still fails fast if the fixture exits.
3. Keep the existing proof request, JSONL assertions, cleanup, and retained-artifact reporting aligned with the documented recorder contract.
4. Add a focused contract test that fails if the script regresses to log-scrape readiness.

## Must-Haves

- [ ] The recorder proof no longer depends on `grep "Started RecorderSmokeApplication"` to decide readiness.
- [ ] Readiness failure output names the port plus retained log/events/response paths.
- [ ] The first proof request after readiness still produces the documented `events.jsonl` contract.
- [ ] A focused contract test locks the new readiness strategy.

## Inputs

- `scripts/docs/verify-s01-recorder-path.sh`
- `test/fixtures/recorder-spring-smoke/build.gradle.kts`
- `test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/RecorderSmokeApplication.java`
- `test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/OrdersController.java`
- `test/fixtures/recorder-spring-smoke/src/main/resources/application.properties`

## Expected Output

- `scripts/docs/verify-s01-recorder-path.sh`
- `scripts/docs/verify-s01-recorder-path.contract.test.mjs`

## Verification

node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs && bash scripts/docs/verify-s01-recorder-path.sh

## Observability Impact

Readiness becomes observable through the reserved localhost port instead of a buffered log line; failures must still print the probed port plus retained `publish.log`, `fixture.log`, `events.jsonl`, and `response.json` paths.
