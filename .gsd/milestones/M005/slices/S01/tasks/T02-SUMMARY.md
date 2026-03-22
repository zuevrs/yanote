---
id: T02
parent: S01
milestone: M005
provides:
  - Public owner/support surfaces that now repeat one honest first-wave AsyncAPI/Kafka boundary, name the async support-intake artifacts explicitly, and are locked by a surface-aware verifier.
key_files:
  - docs/release-and-support.md
  - docs/requirements.md
  - SUPPORT.md
  - scripts/docs/verify-m005-s01-async-boundaries.sh
  - .gsd/milestones/M005/slices/S01/S01-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Keep the async boundary clauses literal and duplicated across the three owner/support docs, while reserving release-vs-HEAD nuance to `docs/release-and-support.md` and deferred follow-ons to `docs/requirements.md`.
patterns_established:
  - Async boundary verifiers should check a shared clause/artifact set across all owner surfaces and then add surface-specific assertions for release truth, deferred scope, and support intake guidance.
observability_surfaces:
  - bash scripts/docs/verify-m005-s01-async-boundaries.sh
  - bash scripts/docs/verify-s04-boundaries.sh
  - bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure
  - docs/release-and-support.md
  - docs/requirements.md
  - SUPPORT.md
duration: 25m
verification_result: passed
completed_at: 2026-03-14T13:11:44+03:00
blocker_discovered: false
---

# T02: Align release, requirements, and support owner surfaces for first-wave async

**Aligned `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` on the same first-wave AsyncAPI/Kafka truth, and tightened the async boundary verifier so it catches drift by clause and by surface.**

## What Happened

Updated `docs/release-and-support.md` with a dedicated async boundary subsection under the stable-surface owner doc. It now explains that the current async onboarding/proof route is a **source-built async path** on repository `HEAD`, complements but does not redefine the public stable line `v1.0.x`, and repeats the literal first-wave clauses: **Kafka-only**, **Spring Kafka-first**, **separate async report/gate**, **payload-schema enforcement пока нет**, **broker-agnostic promise нет**. The same section now names the async proof/support artifacts explicitly: `raw или merged async JSONL`, `yanote-async-report.json`, and analyzer/proof `stderr`.

Rewrote the async-relevant parts of `docs/requirements.md` so the public requirements owner no longer leaves AsyncAPI/Kafka coverage in the deferred bucket. Instead, the file now has a dedicated “AsyncAPI / Kafka — первая волна” section with the same literal boundary clauses and artifact wording, while `v2 Requirements` gained an `Async Follow-ons` subsection that keeps payload validation, one combined HTTP+async report/gate, and non-Kafka/broker-agnostic expansion explicitly deferred.

Expanded `SUPPORT.md` so async issue intake is concrete instead of implied. It now tells reporters that the first-wave async support boundary is the same Kafka-only / Spring Kafka-first / separate async report/gate path, and asks for the specific async artifacts support needs when proof fails: `raw или merged async JSONL`, `yanote-async-report.json`, and analyzer/proof `stderr`, along with version/commit, repro, and which proof command failed.

Tightened `scripts/docs/verify-m005-s01-async-boundaries.sh` to match the new contract. The verifier now checks the shared clause set and artifact set across all three surfaces, plus surface-specific assertions for release-vs-HEAD wording in `docs/release-and-support.md`, deferred async follow-ons in `docs/requirements.md`, and concrete repro guidance in `SUPPORT.md`.

Marked T02 complete in `.gsd/milestones/M005/slices/S01/S01-PLAN.md` and advanced `.gsd/STATE.md` to T03.

## Verification

Verified the task-owned checks directly:

- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
  - Result: passed.
- `bash scripts/docs/verify-s04-boundaries.sh`
  - Result: passed.

Ran the slice-level verification stack and recorded the current state:

- `bash scripts/docs/verify-m005-s01-async-path.sh`
  - Result: expected failure only on the still-missing T03 landing pointers in `README.md` and `docs/README.md`.
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`
  - Result: expected diagnostic failure; the single-service proof, two-service raw evidence checks, and deterministic merge all passed first, then the simulated analyzer failure retained temp artifacts and surfaced `YANOTE_ASYNC_SUMMARY` plus typed `stderr` as intended.
- `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh`
  - Result: passed.
- `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`
  - Result: passed.
- `git diff --check`
  - Result: passed.

## Diagnostics

Use these surfaces to inspect the aligned async boundary after this task:

- `bash scripts/docs/verify-m005-s01-async-boundaries.sh` — validates the shared first-wave async clauses, release-vs-HEAD wording, deferred follow-ons, and support-intake artifacts by surface.
- `bash scripts/docs/verify-s04-boundaries.sh` — confirms the older stable-line/release-owner contract still holds after the async additions.
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure` — produces retained raw/merged JSONL, async stdout/stderr, and `yanote-async-report.json` paths when the analyzer path is intentionally forced to fail after the raw/merge checks.
- `docs/release-and-support.md`, `docs/requirements.md`, `SUPPORT.md` — the three public owner/support surfaces that now repeat the same first-wave async truth.

## Deviations

None.

## Known Issues

- `README.md` and `docs/README.md` still do not expose the async guide; `bash scripts/docs/verify-m005-s01-async-path.sh` still fails only on those T03-owned landing discoverability checks.

## Files Created/Modified

- `docs/release-and-support.md` — added the honest first-wave async release-boundary subsection with release-vs-HEAD wording and explicit async proof/support artifacts.
- `docs/requirements.md` — replaced the stale deferred AsyncAPI wording with a supported first-wave async section and explicitly deferred async follow-ons.
- `SUPPORT.md` — added explicit async support boundary and intake artifact requirements.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — extended the verifier with shared-clause and surface-specific async boundary checks.
- `.gsd/milestones/M005/slices/S01/S01-PLAN.md` — marked T02 complete.
- `.gsd/STATE.md` — advanced the next action to T03.
