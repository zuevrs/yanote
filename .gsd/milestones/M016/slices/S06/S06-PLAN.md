# S06: Stabilize recorder readiness in final public-surface proof

**Goal:** Replace the fragile log-line readiness gate in the recorder runtime proof with a deterministic runtime signal and close the loop by proving the full S05 public-surface verifier passes from both a cold run and an immediate rerun.
**Demo:** After this: A cold run and a rerun of `bash scripts/docs/verify-m016-s05-public-surface.sh` both pass end to end, and the recorder runtime stage uses a deterministic readiness signal instead of timing out after the app has already started.

## Tasks
- [x] **T01: Replaced recorder verifier log-scrape readiness with a deterministic port probe and contract tests.** — Rebuild the recorder runtime verifier around a real readiness signal. Current evidence shows `bash scripts/docs/verify-s01-recorder-path.sh` can time out after the smoke fixture is already serving because it waits on a specific Spring boot log line under redirected `bootRun` output. This task directly stabilizes the S05-06 recorder stage and keeps the recorder proof truthful.

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
  - Estimate: 1h
  - Files: scripts/docs/verify-s01-recorder-path.sh, scripts/docs/verify-s01-recorder-path.contract.test.mjs, test/fixtures/recorder-spring-smoke/build.gradle.kts, test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/RecorderSmokeApplication.java, test/fixtures/recorder-spring-smoke/src/main/resources/application.properties
  - Verify: node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs && bash scripts/docs/verify-s01-recorder-path.sh
- [x] **T02: Locked the maintainer rerun leaf to the recorder port-probe diagnostics and proved the full S05 public-surface verifier passes cold and on immediate rerun.** — Close the slice on the actual final public-surface proof. S06 is not done when the focused recorder verifier passes once; it is done when the composed S05 proof can be run cold and then rerun immediately without flaking on S05-06, and when maintainer-facing docs/tests describe that behavior truthfully.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `node --test` coverage around the recorder/public-surface verifier docs | Keep the task red until the readiness strategy and maintainer references are pinned | N/A | Reject tests that pass while log-line gating or stale diagnostics wording still exists |
| `bash scripts/docs/verify-m016-s05-public-surface.sh` | Stop at the first failing `S05-0N` stage and repair the owning surface instead of papering over it | Treat as slice-incomplete and keep the failing stage label/logs | Reject partial success where a cold run passes but the immediate rerun fails |
| Maintainer rerun leaf | Fail closed if it still implies log-only readiness or omits the retained diagnostics future maintainers need | N/A | Reject doc/test drift between the maintainer leaf and the actual recorder verifier behavior |

## Load Profile

- **Shared resources**: the recorder verifier, the S05 composed verifier, the retained release-proof bundle reused by S05-12, and the maintainer rerun leaf.
- **Per-operation cost**: one focused test pass plus two full public-surface proof runs.
- **10x breakpoint**: full-stack proof reruns dominate runtime cost; the contract coverage stays cheap.

## Negative Tests

- **Malformed inputs**: reintroducing the `Started RecorderSmokeApplication` grep or dropping the failure-artifact printout from maintainer surfaces.
- **Error paths**: a cold S05 pass but rerun failure because temp paths, reserved ports, or retained proof surfaces are not rerunnable.
- **Boundary conditions**: maintainer docs describe the same deterministic readiness and diagnostics the script actually uses.

## Steps

1. Update the maintainer rerun leaf so S05-06 documents the deterministic readiness probe and the retained failure artifacts future agents should inspect.
2. Extend the S05 contract coverage wherever needed so maintainer-doc drift around the recorder stage fails closed.
3. Run the focused recorder verifier, then run `bash scripts/docs/verify-m016-s05-public-surface.sh` twice from the same checkout to prove both the cold path and immediate rerun path.
4. Only close the task once both full S05 passes are green and the maintainer leaf still points at the right diagnostics.

## Must-Haves

- [ ] Maintainer rerun docs describe the same readiness and diagnostics the recorder verifier implements.
- [ ] Contract coverage fails if the recorder-stage rerun surface drifts away from the real verifier behavior.
- [ ] A cold run and immediate rerun of `bash scripts/docs/verify-m016-s05-public-surface.sh` both pass end to end.
  - Estimate: 1h15m
  - Files: docs/maintainers/public-surface-proof.md, scripts/docs/verify-m016-s05-public-surface.contract.test.mjs, scripts/docs/verify-m016-s05-public-surface.sh, scripts/docs/verify-s01-recorder-path.sh
  - Verify: bash scripts/docs/verify-s01-recorder-path.sh && node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs && bash scripts/docs/verify-m016-s05-public-surface.sh && bash scripts/docs/verify-m016-s05-public-surface.sh
