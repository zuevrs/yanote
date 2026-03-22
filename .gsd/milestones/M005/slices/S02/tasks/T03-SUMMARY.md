---
id: T03
parent: S02
milestone: M005
provides:
  - Final M005 stage-labeled async acceptance proof that composes the validated S01 public-contract verifiers with the authoritative M004 live Kafka proof stack, plus requirement/roadmap closure for R048.
key_files:
  - scripts/ci/verify-m005-s02-async-acceptance.sh
  - scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs
  - .gsd/REQUIREMENTS.md
  - .gsd/milestones/M005/M005-ROADMAP.md
  - .gsd/milestones/M005/slices/S02/S02-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Keep the final M005 acceptance surface delegation-only: reuse the S01 verifiers and authoritative M004 proof scripts under stable stage labels instead of copying lower-level assertions into a second runtime truth surface.
patterns_established:
  - Final acceptance runners should lock their delegated `run_stage()` labels, titles, and script paths with a small contract test so composition drift fails before expensive live-proof runs start.
observability_surfaces:
  - bash scripts/ci/verify-m005-s02-async-acceptance.sh
  - scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs
  - .yanote-ci/live-kafka-proof/
duration: 55m
verification_result: passed
completed_at: 2026-03-14T14:38:26+0300
blocker_discovered: false
---

# T03: Compose the final M005 async acceptance runner and close R048

**Added the final M005 stage-labeled async acceptance runner, locked its delegation order with a contract test, and promoted R048/S02 to complete after the full async proof stack passed.**

## What Happened

I followed the existing `run_stage()` pattern from `scripts/docs/verify-s08-entry-paths.sh` and created `scripts/ci/verify-m005-s02-async-acceptance.sh` as a pure composition surface. The runner adds four stable stages — S01 async path, S01 async boundaries, M004 single-service metadata propagation, and M004 live Kafka proof/diagnostics — and does not re-implement any lower-level raw-evidence, merge, analyzer, or doc assertions.

I then added `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs`. It pins the shell `run_stage()` shape itself, asserts the exact stage-label/title/delegated-script order, and rejects obvious proof-logic inlining by failing if the runner starts mentioning lower-level internals like `./gradlew`, `yanote.cjs async-report`, the merge helper, or inline Python assertions.

With the composition surface in place, I ran the full slice verifier stack. The retained-failure proof still behaved truthfully: raw-evidence and merge stages completed first, the analyzer failure surfaced typed `YANOTE_ASYNC_*` lines, and the stable `.yanote-ci/live-kafka-proof` bundle exported successfully. The final composed acceptance command then passed end to end with the new stage labels visible in stdout, proving the public S01 contract, single-service raw evidence path, and two-service live Kafka analyzer path together.

After the proof was green, I updated `.gsd/REQUIREMENTS.md` so `R048` is now validated, fixed the stale `R047` traceability row that still said `active`, refreshed the traceability proof text for both requirements, and corrected the coverage summary counts to `0 active / 43 validated`. I also marked S02 complete in `.gsd/milestones/M005/M005-ROADMAP.md`, marked T03 done in `.gsd/milestones/M005/slices/S02/S02-PLAN.md`, and refreshed `.gsd/STATE.md` so the repo handoff now shows M005 complete.

## Verification

Ran the full slice verification stack plus the task-specific contract check:

- `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs`
  - Result: passed.
- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
  - Result: passed.
- `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs`
  - Result: passed.
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`
  - Result: expected non-zero retained-failure path; observed raw-evidence + merge completion before analyzer failure, typed `YANOTE_ASYNC_ERROR` / `YANOTE_ASYNC_SUMMARY` output, and `async_bundle_exported: true` for `.yanote-ci/live-kafka-proof`.
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
  - Result: passed with stable stages `M005-S02-01` through `M005-S02-04` visible in stdout.
- `git diff --check`
  - Result: passed.

## Diagnostics

Future inspection should start from these surfaces:

- `bash scripts/ci/verify-m005-s02-async-acceptance.sh` — top-level rerunnable acceptance command; the failing stage label localizes whether drift is in S01 docs, single-service metadata/raw evidence, or the two-service live Kafka proof/diagnostics.
- `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` — locks the stage labels, titles, and delegated script paths so composition drift fails fast.
- `.yanote-ci/live-kafka-proof/` — stable exported async proof bundle owned by the authoritative live Kafka verifier; inspect this first instead of temp-path scraping when the composed acceptance fails inside stage `M005-S02-04`.
- `.github/workflows/yanote-ci.yml`, `.github/BRANCH_PROTECTION.md`, and `scripts/ci/render-yanote-summary.mjs` — the CI-visible async artifact/summary surfaces that back the R048 claim outside local execution.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `scripts/ci/verify-m005-s02-async-acceptance.sh` — added the final stage-labeled M005 acceptance runner that composes the existing S01 and M004 verifiers.
- `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` — pinned stage order, labels, delegated commands, and delegation-only behavior.
- `.gsd/REQUIREMENTS.md` — promoted `R048` to validated, fixed the stale `R047` traceability row, and corrected the requirement summary counts.
- `.gsd/milestones/M005/M005-ROADMAP.md` — marked S02 complete.
- `.gsd/milestones/M005/slices/S02/S02-PLAN.md` — marked T03 complete.
- `.gsd/STATE.md` — refreshed the handoff to show M005 complete and no active execution slice.
