---
id: S06
parent: M016
milestone: M016
provides:
  - A recorder runtime verifier that survives transient publish bootstrap crashes without regressing to log-scrape readiness.
  - A final public-surface proof that now passes both from a cold run and from an immediate rerun in the same checkout.
  - Maintainer-facing recorder diagnostics that stay aligned with the real verifier behavior, including retry-aware `publish_log` output.
requires:
  - slice: S05
    provides: The composed public-surface verifier and maintainer rerun map that S06 hardened against recorder-stage flake.
affects:
  []
key_files:
  - scripts/docs/verify-s01-recorder-path.sh
  - scripts/docs/verify-s01-recorder-path.contract.test.mjs
  - docs/maintainers/public-surface-proof.md
  - .gsd/KNOWLEDGE.md
  - .gsd/PROJECT.md
  - .gsd/DECISIONS.md
key_decisions:
  - Recorder readiness remains a deterministic localhost port-open probe with process-alive checks instead of a Spring started-log grep.
  - The recorder verifier retries `publishToMavenLocal` once under the temp Gradle-home shape before failing, preserving final diagnostics in `publish_log`.
patterns_established:
  - Use direct runtime readiness signals for live-proof gates, but also harden pre-runtime bootstrap steps that can mask the real contract under transient toolchain failures.
  - When a verifier keeps retained failure artifacts, append retry attempt markers to the retained log instead of inventing a second diagnostic surface.
observability_surfaces:
  - `scripts/docs/verify-s01-recorder-path.sh` now retains `readiness_port`, `temp_dir`, `publish_log`, `app_log`, `events_file`, and `response_file`, with publish-attempt markers in `publish_log` when the retry path is exercised.
  - `docs/maintainers/public-surface-proof.md` documents the deterministic recorder readiness contract and the retained diagnostics maintainers should inspect after cold-run or immediate-rerun failure.
  - The composed `scripts/docs/verify-m016-s05-public-surface.sh` proof still localizes failures to stable `S05-0N` stage labels, with S05-06 now backed by the hardened recorder verifier.
drill_down_paths:
  - .gsd/milestones/M016/slices/S06/tasks/T01-SUMMARY.md
  - .gsd/milestones/M016/slices/S06/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-29T04:42:19.385Z
blocker_discovered: false
---

# S06: Stabilize recorder readiness in final public-surface proof

**S06 removed the last recorder-stage flake from the final public-surface proof by keeping deterministic port readiness, adding a bounded publish retry for transient Gradle daemon crashes, and proving the full S05 verifier passes on both a cold run and an immediate rerun.**

## What Happened

S06 started from the S05-06 recorder runtime stage, which had already been moved off the brittle `Started RecorderSmokeApplication` log scrape onto a deterministic localhost port-open probe. The remaining failure mode showed up during closeout verification: `scripts/docs/verify-s01-recorder-path.sh` could still fail before bootRun when `publishToMavenLocal` hit a transient single-use Gradle daemon crash under the temp Gradle-home shape, leaving `publish.log` with only the Gradle banner and daemon preamble. To make the final public-surface proof actually rerunnable, the recorder verifier now wraps the publish step in one bounded retry, appends attempt markers to `publish.log`, and still fails closed with the retained diagnostics if the second attempt also fails.

The slice keeps the real runtime contract intact: readiness still comes from the reserved localhost port opening while the fixture process stays alive, the first proof request still has to create a non-empty `events.jsonl` with the documented HTTP fields, and the maintainer rerun leaf still points future maintainers at the exact retained recorder diagnostics (`readiness_port`, `temp_dir`, `publish_log`, `app_log`, `events_file`, `response_file`). After the retry hardening landed, the focused recorder contract suite passed, the real recorder proof passed, and `bash scripts/docs/verify-m016-s05-public-surface.sh` passed twice in succession from the same checkout, closing the slice on the actual cold-run plus immediate-rerun goal rather than on a one-off green run.

## Verification

Passed `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`, including new coverage for retry-once publish recovery and final publish failure after the bounded retry. Passed `bash scripts/docs/verify-s01-recorder-path.sh` against the real Gradle/Spring smoke fixture. Passed `bash scripts/docs/verify-m016-s05-public-surface.sh && bash scripts/docs/verify-m016-s05-public-surface.sh`, confirming the composed S05 proof stays green on both a cold run and an immediate rerun.

## Requirements Advanced

- R043 — S06 removed the last recorder-stage flake from the composed public-surface gate, so the README/docs/examples/release truth can now be proven on both a cold run and an immediate rerun instead of only on a lucky single pass.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Closeout expanded S06 slightly beyond the original port-readiness change because the verification gate reproduced a pre-runtime failure: transient `publishToMavenLocal` daemon crashes. The fix kept the slice boundary intact by hardening the same recorder verifier and maintainer diagnostics surface instead of introducing a new proof path.

## Known Limitations

This remains a rerunnable local/CI proof surface, not a continuous monitor. The recorder verifier absorbs only one transient publish failure; repeated or deterministic publish drift still fails closed on the final attempt with retained logs and artifact paths.

## Follow-ups

No further product-surface assembly work is expected. Milestone validation/closeout can now treat the S05 public-surface proof as rerunnable rather than one-shot.

## Files Created/Modified

- `scripts/docs/verify-s01-recorder-path.sh` — Added bounded `publishToMavenLocal` retry handling with attempt markers in `publish.log`, kept deterministic port readiness, and silenced temp-dir cleanup noise on success.
- `scripts/docs/verify-s01-recorder-path.contract.test.mjs` — Extended the recorder verifier contract suite to cover retry-once publish recovery and final publish failure after the bounded retry.
- `docs/maintainers/public-surface-proof.md` — Documented that `publish_log` may contain retry attempt markers while the maintainer rerun leaf still points at the same retained recorder diagnostics.
- `.gsd/KNOWLEDGE.md` — Recorded the transient Gradle daemon crash lesson and the bounded-retry pattern for the recorder verifier.
- `.gsd/PROJECT.md` — Updated current project state to reflect that M016 now includes the S06 recorder-proof stability hardening.
- `.gsd/DECISIONS.md` — Recorded the new verification decision to keep the recorder publish step behind a bounded retry rather than letting transient Gradle daemon crashes fail the public-surface proof.
