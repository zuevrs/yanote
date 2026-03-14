---
id: T01
parent: S01
milestone: M005
provides:
  - Canonical Russian-first AsyncAPI/Kafka onboarding guide with explicit first-wave boundary wording and a guide-level verifier that localizes missing async discoverability versus owner/support drift.
key_files:
  - docs/guides/asyncapi-kafka.md
  - docs/guides/analyzer-coverage.md
  - scripts/docs/verify-m005-s01-async-path.sh
  - scripts/docs/verify-m005-s01-async-boundaries.sh
  - .gsd/milestones/M005/slices/S01/S01-PLAN.md
key_decisions:
  - Keep async onboarding as a separate guide and verifier surface instead of folding AsyncAPI/Kafka semantics into the existing HTTP/OpenAPI analyzer guide.
patterns_established:
  - Guide-level async verifiers should fail with targeted surface-specific diagnostics and clearly distinguish T03 landing discoverability gaps from T02 owner/support boundary gaps.
observability_surfaces:
  - bash scripts/docs/verify-m005-s01-async-path.sh
  - bash scripts/docs/verify-m005-s01-async-boundaries.sh
  - bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure
duration: 1h10m
verification_result: passed
completed_at: 2026-03-14T13:03:14+03:00
blocker_discovered: false
---

# T01: Define the canonical async guide and guide-level verifier

**Added the dedicated Russian-first AsyncAPI/Kafka onboarding guide, branched the HTTP analyzer guide to it, and locked the surface with a verifier that now fails only on the T03 README/docs landing pointers.**

## What Happened

Added `docs/guides/asyncapi-kafka.md` as the canonical first-wave async guide. It now names the supported Kafka evidence inputs (`raw` single-service mixed `events.jsonl`, raw per-service JSONL, and merged async JSONL), the canonical CLI command `node yanote-js/dist/yanote.cjs async-report`, the stable artifact `yanote-async-report.json`, the `YANOTE_ASYNC_SUMMARY` / `YANOTE_ASYNC_ERROR` surfaces, the deterministic merge helper, and both authoritative M004 live-proof commands.

Updated `docs/guides/analyzer-coverage.md` with a thin async branch so the HTTP guide stays explicitly about `report` / `yanote-report.json` while pointing readers to the dedicated async path instead of absorbing AsyncAPI semantics.

Added `scripts/docs/verify-m005-s01-async-path.sh`. It checks the new guide title, required sections, live-proof links, artifact names, boundary clauses, analyzer-guide pointer, and local markdown links. In its current T01 form it also checks for future landing pointers and reports when the only remaining failures are the T03-owned async discoverability gaps in `README.md` and `docs/README.md`.

Also created `scripts/docs/verify-m005-s01-async-boundaries.sh` now, so the slice-level verification surface exists on the first task and fails with named T02-targeted diagnostics instead of a missing-file error.

Pre-flight, updated `.gsd/milestones/M005/slices/S01/S01-PLAN.md` so the slice Verification section includes an explicit inspectable failure-path check (`bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`). Then marked T01 done in the slice plan.

## Verification

Verified the task surface directly:

- `bash scripts/docs/verify-m005-s01-async-path.sh`
  - Result: expected failure only on `README.md` and `docs/README.md` async-guide discoverability pointers reserved for T03.
- `rg -n 'async-report|yanote-async-report.json|verify-m004-s02-metadata-propagation.sh|verify-m004-s03-live-kafka-proof.sh' docs/guides/asyncapi-kafka.md docs/guides/analyzer-coverage.md`
  - Result: passed; required async command/artifact/proof references are present.

Ran the slice-level verifier stack and recorded the current state:

- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
  - Result: expected failure with targeted diagnostics across `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md`; reserved for T02.
- `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh`
  - Result: passed.
- `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`
  - Result: passed.
- `git diff --check`
  - Result: passed.
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`
  - Result: expected diagnostic failure; raw-evidence and merge checks passed first, then the simulated analyzer failure produced retained temp artifacts plus `YANOTE_ASYNC_SUMMARY` / `YANOTE_ASYNC_ERROR` output as intended.

## Diagnostics

Use these surfaces to inspect the async onboarding contract after this task:

- `bash scripts/docs/verify-m005-s01-async-path.sh` — validates the guide itself and distinguishes general guide drift from the still-missing T03 landing pointers.
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh` — already localizes the still-pending T02 owner/support async clause gaps by surface.
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure` — inspectable failure-path proof; on failure it retains temp artifacts and prints the relevant raw JSONL, merge, stdout, and stderr paths.
- `docs/guides/asyncapi-kafka.md` — canonical first-wave async wording for evidence inputs, live-proof commands, and boundary clauses.

## Deviations

Created `scripts/docs/verify-m005-s01-async-boundaries.sh` during T01 even though the inlined T01 task plan only required the async-path verifier. This was done intentionally because T01 is the first task in the slice and the slice-level verification contract already referenced that file; creating it now gives future agents a real failing verifier with named diagnostics instead of a bare missing-file failure.

## Known Issues

- `README.md` and `docs/README.md` still do not expose the new async guide; `bash scripts/docs/verify-m005-s01-async-path.sh` fails only on those T03-owned landing-pointer checks.
- `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` still lack the first-wave async boundary/support wording; `bash scripts/docs/verify-m005-s01-async-boundaries.sh` fails there until T02 updates those surfaces.

## Files Created/Modified

- `docs/guides/asyncapi-kafka.md` — new canonical Russian-first AsyncAPI/Kafka onboarding guide.
- `docs/guides/analyzer-coverage.md` — thin pointer to the dedicated async guide without mixing HTTP and async semantics.
- `scripts/docs/verify-m005-s01-async-path.sh` — guide-level async path verifier with targeted T03 landing diagnostics.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — initial async owner/support boundary verifier surface for T02.
- `.gsd/milestones/M005/slices/S01/S01-PLAN.md` — added the pre-flight failure-path verification step and marked T01 complete.
