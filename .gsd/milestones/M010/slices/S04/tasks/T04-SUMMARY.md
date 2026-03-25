---
id: T04
parent: S04
milestone: M010
key_files:
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/export-async-proof-artifacts.test.mjs
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - docs/guides/asyncapi-kafka.md
  - docs/requirements.md
  - SUPPORT.md
  - scripts/docs/verify-m005-s01-async-path.sh
  - scripts/docs/verify-m005-s01-async-boundaries.sh
  - .gsd/STATE.md
  - .gsd/KNOWLEDGE.md
  - .gsd/DECISIONS.md
key_decisions:
  - Promote retained Kafka header-drift sidecars and their typed `ASYNC_SEMANTIC_*` codes as supported public truth on the proven Spring Kafka path, while still redacting raw header values and keeping the async surface Kafka-only and separate from HTTP reporting.
  - Add explicit header-sidecar manifest counts (`missing_*`, `invalid_*`, `unavailable_*`, `unverifiable_*`, `header_sidecar_*`) so the live proof can fail deterministically when the exported bundle or provenance metadata drifts.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T06:29:02.570Z
blocker_discovered: false
---

# T04: Promoted retained Kafka header sidecars into the async proof bundle and public boundary

**Promoted retained Kafka header sidecars into the async proof bundle and public boundary**

## What Happened

I widened the async proof exporter so its manifest now records deterministic counts for the runtime-selected sidecar, schema-failure sidecar, and each retained header-drift family, then extended the Node contract test to pin both the success and failure manifests to that richer surface. I strengthened the live Kafka proof by asserting the exported bundle itself after the proof run: the script now fails if the retained success export is missing any required header sidecar file, provenance entry, manifest count, or typed `ASYNC_SEMANTIC_*` stderr code. I then rewrote the task-owned public async surfaces so they no longer under-claim retained Kafka headers: the async guide, requirements surface, and support intake now explicitly describe missing/invalid/unavailable/unverifiable header diagnostics as supported truth on the proven Spring Kafka path, while still stating that raw header values remain redacted, the path is Kafka-only / Spring Kafka-first, and async reporting stays separate from HTTP reporting. Finally, I updated the M005 async path and boundary verifiers to enforce the new retained-header wording and artifact expectations, recorded the boundary decision in GSD, added the worktree export-path gotcha to `.gsd/KNOWLEDGE.md`, and moved `.gsd/STATE.md` forward to T05.

## Verification

Task-owned verification passed on the updated surfaces. `node --test scripts/ci/export-async-proof-artifacts.test.mjs && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh` passed, proving the widened exporter manifest plus the rewritten async guide/requirements/support/verifiers are consistent. The live proof stack also passed: `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` completed successfully, and a second run of `YANOTE_ASYNC_EXPORT_DIR=.yanote-ci/live-kafka-proof bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` also passed after the new exported-bundle assertions were added. Slice-level partial verification behaved as expected for an intermediate task: the focused HTTP-core Vitest command and the `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs` contract stack both passed, while `bash scripts/docs/verify-s04-boundaries.sh` still fails on the stale release/support owner tag and `bash scripts/docs/verify-m010-s04-final-boundary.sh` is still missing pending T05.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/export-async-proof-artifacts.test.mjs && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh` | 0 | ✅ pass | 500ms |
| 2 | `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 121300ms |
| 3 | `YANOTE_ASYNC_EXPORT_DIR=.yanote-ci/live-kafka-proof bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 73500ms |
| 4 | `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts src/gates/evaluator.threshold.test.ts src/gates/failureOrder.test.ts src/cli.httpCore.report.test.ts src/cli.httpCore.failclosed.test.ts src/cli.summary.contract.test.ts` | 0 | ✅ pass | 885ms |
| 5 | `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs` | 0 | ✅ pass | 202ms |
| 6 | `bash scripts/docs/verify-s04-boundaries.sh` | 1 | ❌ fail | 300ms |
| 7 | `bash scripts/docs/verify-m010-s04-final-boundary.sh` | 127 | ❌ fail | 50ms |


## Deviations

None, aside from one verification-only adaptation: I reran the live Kafka proof with `YANOTE_ASYNC_EXPORT_DIR=.yanote-ci/live-kafka-proof` to try to keep retained artifacts in the worktree after discovering the default proof topology can resolve exports to the shared checkout.

## Known Issues

`bash scripts/docs/verify-s04-boundaries.sh` still fails because `docs/release-and-support.md` has not yet been refreshed to the latest stable tag (`v1.0.127`), and `bash scripts/docs/verify-m010-s04-final-boundary.sh` currently exits 127 because that T05 verifier file does not exist yet. In this worktree topology, retained `.yanote-ci` exports from proof scripts can also resolve to the shared checkout rather than the worktree-local tree, so future agents should trust the logged export path before assuming the local bundle was refreshed.

## Files Created/Modified

- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.test.mjs`
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `docs/guides/asyncapi-kafka.md`
- `docs/requirements.md`
- `SUPPORT.md`
- `scripts/docs/verify-m005-s01-async-path.sh`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`
- `.gsd/STATE.md`
- `.gsd/KNOWLEDGE.md`
- `.gsd/DECISIONS.md`
