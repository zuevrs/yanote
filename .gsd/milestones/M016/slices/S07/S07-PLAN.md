# S07: Recorder bootstrap hardening for final public-surface proof

**Goal:** Harden the recorder smoke bootstrap so the final public-surface proof no longer depends on fragile Gradle Plugin Portal refresh behavior, and close the loop by proving the S05 acceptance path passes on both a cold run and an immediate rerun.
**Demo:** After this: The recorder smoke verifier no longer depends on fragile plugin-portal refreshes during milestone proof, the live script/tests truthfully pin the implemented bootstrap behavior, and `bash scripts/docs/verify-m016-s05-public-surface.sh` passes on both a cold run and an immediate rerun.

## Tasks
- [x] **T01: Pinned recorder smoke plugin resolution to module-backed repositories, removed forced bootRun refresh, and restored retry-aware bootstrap diagnostics.** — Fix the live bootstrap path that currently dies before readiness with a Gradle Plugin Portal handshake failure. This task redefines the recorder smoke fixture bootstrap around explicit Spring plugin resolution and keeps the verifier's pre-runtime hardening honest.

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
  - Estimate: 1h15m
  - Files: scripts/docs/verify-s01-recorder-path.sh, scripts/docs/verify-s01-recorder-path.contract.test.mjs, test/fixtures/recorder-spring-smoke/settings.gradle.kts, test/fixtures/recorder-spring-smoke/build.gradle.kts, settings.gradle.kts
  - Verify: node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs && bash scripts/docs/verify-s01-recorder-path.sh
- [x] **T02: Pinned the maintainer rerun leaf to the hardened recorder bootstrap contract and proved the full S05 gate passes on an immediate rerun.** — Close S07 on the composed public-surface proof, not only the focused bootstrap fix. Once the recorder verifier is hardened, maintainer-facing docs and the S05 contract suite need to describe exactly that behavior, and the full acceptance path must pass cold and on immediate rerun.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `docs/maintainers/public-surface-proof.md` plus `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` | Keep the task red until the maintainer leaf describes the same bootstrap contract the script implements | N/A | Reject docs/tests that still imply Plugin Portal refresh dependency or stale diagnostics wording |
| `bash scripts/docs/verify-m016-s05-public-surface.sh` | Stop at the first failing `S05-0N` stage and repair the owning surface instead of papering over recorder-stage drift | Treat rerun failure as slice-incomplete | Reject partial success where the cold run passes but the immediate rerun fails |
| `bash scripts/docs/verify-s01-recorder-path.sh` | Re-run the focused recorder verifier first if `S05-06` regresses and inspect the retained bootstrap artifacts | Treat as a recorder-stage blocker before the broader proof | Reject green docs/contracts when the live recorder proof is still red |

## Load Profile

- **Shared resources**: the recorder verifier, the S05 composed verifier, the retained release-proof bundle reused by `S05-12`, and the maintainer rerun leaf.
- **Per-operation cost**: one focused recorder proof, one focused contract pass, and two full public-surface proof runs.
- **10x breakpoint**: repeated full-stack proof reruns dominate runtime cost; doc/contract coverage stays cheap.

## Negative Tests

- **Malformed inputs**: maintainer wording that omits bounded publish retry, retained bootstrap artifacts, or the removal of forced refresh behavior.
- **Error paths**: cold-run success but immediate-rerun failure, or a recorder-stage contract test that still passes after bootstrap behavior drifts.
- **Boundary conditions**: the maintainer leaf remains a secondary surface while still documenting the exact runtime proof contract and failure breadcrumbs.

## Steps

1. Update `docs/maintainers/public-surface-proof.md` so `S05-06` documents the hardened bootstrap contract, including the retained diagnostics maintainers should inspect after bootstrap failure.
2. Extend `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` so doc drift around the recorder bootstrap contract fails closed.
3. Run `bash scripts/docs/verify-s01-recorder-path.sh`, then run `bash scripts/docs/verify-m016-s05-public-surface.sh` twice from the same checkout to prove both the cold path and immediate rerun path.
4. Only close the task once both full S05 passes are green and the maintainer leaf still points at the right diagnostics without leaking this surface into public onboarding docs.

## Must-Haves

- [ ] Maintainer rerun docs describe the same recorder bootstrap contract the live script implements.
- [ ] S05 contract coverage fails if the recorder stage drifts back to Plugin Portal refresh dependency or stale diagnostics wording.
- [ ] `bash scripts/docs/verify-m016-s05-public-surface.sh` passes from a cold run and on immediate rerun in the same checkout.
  - Estimate: 1h
  - Files: docs/maintainers/public-surface-proof.md, scripts/docs/verify-m016-s05-public-surface.contract.test.mjs, scripts/docs/verify-m016-s05-public-surface.sh, scripts/docs/verify-s01-recorder-path.sh
  - Verify: bash scripts/docs/verify-s01-recorder-path.sh && node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs && bash scripts/docs/verify-m016-s05-public-surface.sh && bash scripts/docs/verify-m016-s05-public-surface.sh
