---
estimated_steps: 25
estimated_files: 5
skills_used:
  - debug-like-expert
  - bash-scripting
---

# T01: Harden recorder smoke bootstrap away from Plugin Portal refresh drift

Fix the live bootstrap path that currently dies before readiness with a Gradle Plugin Portal handshake failure. This task redefines the recorder smoke fixture bootstrap around explicit Spring plugin resolution and keeps the verifier's pre-runtime hardening honest.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `test/fixtures/recorder-spring-smoke/settings.gradle.kts` plugin resolution | Fail closed if Gradle still reaches the default Plugin Portal instead of the pinned module-backed repositories | Treat bootstrap as failed before the fixture process is trusted | Reject missing or stale plugin mappings that resolve the wrong plugin coordinates |
| `scripts/docs/verify-s01-recorder-path.sh` publish + `bootRun` flow | Keep bounded publish retry and retained logs; do not send the proof request after failed bootstrap | Fail with publish/app log paths and phase context | Reject forced refresh flags or temp-cache drift that make reruns depend on the network |
| `scripts/docs/verify-s01-recorder-path.contract.test.mjs` | Keep the task red until the bootstrap contract is pinned in focused coverage | N/A | Reject tests that pass while `--refresh-dependencies` or Plugin Portal fallback remains possible |

## Load Profile

- **Shared resources**: temporary Gradle home, local Maven cache, wrapper/module caches, reserved localhost ports, and Spring plugin metadata.
- **Per-operation cost**: one local publish, one smoke-fixture bootstrap, one proof HTTP request, and one focused contract suite.
- **10x breakpoint**: repeated cold Gradle bootstrap churn dominates before JSONL assertions do.

## Negative Tests

- **Malformed inputs**: missing fixture `pluginManagement`, stale Spring plugin module mappings, or a reintroduced `--refresh-dependencies` flag.
- **Error paths**: first publish attempt fails transiently, bootstrap falls back to the Plugin Portal, or the fixture exits before port readiness.
- **Boundary conditions**: cold bootstrap resolves through `mavenCentral()` + `mavenLocal()`, and an immediate rerun reuses the temp Gradle-home/cached bootstrap path without changing the proof contract.

## Steps

1. Reproduce the current `bash scripts/docs/verify-s01-recorder-path.sh` failure and keep the Plugin Portal handshake evidence as the baseline.
2. Add fixture-local `pluginManagement` resolution in `test/fixtures/recorder-spring-smoke/settings.gradle.kts` so Spring plugins resolve via module coordinates from `mavenCentral()` instead of the default Plugin Portal path.
3. Update `scripts/docs/verify-s01-recorder-path.sh` to remove forced `--refresh-dependencies`, preserve the temp Gradle-home/cache wiring, and restore/retain bounded publish retry plus retained bootstrap diagnostics.
4. Extend `scripts/docs/verify-s01-recorder-path.contract.test.mjs` so it fails on `--refresh-dependencies`, pins the fixture bootstrap settings contract, and covers retry-once publish recovery plus final publish failure.

## Must-Haves

- [ ] The smoke fixture no longer depends on default Gradle Plugin Portal resolution to start.
- [ ] The recorder verifier no longer forces `--refresh-dependencies` during `bootRun`.
- [ ] Transient publish/bootstrap failures stay inspectable through retained logs and bounded retry semantics.
- [ ] Focused contract coverage fails if the bootstrap contract drifts.

## Inputs

- `scripts/docs/verify-s01-recorder-path.sh`
- `scripts/docs/verify-s01-recorder-path.contract.test.mjs`
- `test/fixtures/recorder-spring-smoke/settings.gradle.kts`
- `test/fixtures/recorder-spring-smoke/build.gradle.kts`
- `settings.gradle.kts`

## Expected Output

- `scripts/docs/verify-s01-recorder-path.sh`
- `scripts/docs/verify-s01-recorder-path.contract.test.mjs`
- `test/fixtures/recorder-spring-smoke/settings.gradle.kts`

## Verification

node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs && bash scripts/docs/verify-s01-recorder-path.sh

## Observability Impact

- Signals added/changed: recorder bootstrap should expose retry markers, bootstrap-phase failure context, and the same retained artifact paths on pre-runtime failure.
- How a future agent inspects this: rerun `bash scripts/docs/verify-s01-recorder-path.sh` and inspect the printed `publish_log` / `app_log` / temp-dir paths.
- Failure state exposed: Plugin Portal fallback, publish retry exhaustion, and fixture bootstrap exit before readiness become explicit instead of looking like generic port timeouts.
