---
id: S01
parent: M005
milestone: M005
provides:
  - Canonical Russian-first async onboarding, aligned first-wave Kafka boundary truth, and machine-checked landing/support/release wording for the separate `async-report` path.
requires: []
affects:
  - M005/S02 acceptance and CI diagnostics
key_files:
  - README.md
  - docs/README.md
  - docs/guides/asyncapi-kafka.md
  - docs/guides/analyzer-coverage.md
  - docs/release-and-support.md
  - docs/requirements.md
  - SUPPORT.md
  - scripts/docs/verify-m005-s01-async-path.sh
  - scripts/docs/verify-m005-s01-async-boundaries.sh
  - .gsd/milestones/M005/slices/S01/S01-UAT.md
  - .gsd/milestones/M005/slices/S01/S01-SUMMARY.md
key_decisions:
  - Keep async onboarding as a dedicated guide plus thin landing pointers, and duplicate the literal first-wave async clauses across the public owner/support surfaces instead of hiding scope in one document.
  - Treat root/docs async discoverability as placement-aware: the async guide and separate `async-report` / `yanote-async-report.json` path must live inside the primary user-facing onboarding sections.
patterns_established:
  - Product-surface async verifiers should localize drift by surface and by claim type, while distinguishing discoverability failures from boundary/support failures.
  - Slices that only add docs still need one inspectable retained-failure proof when they claim diagnosable runtime support surfaces.
observability_surfaces:
  - bash scripts/docs/verify-m005-s01-async-path.sh
  - bash scripts/docs/verify-m005-s01-async-boundaries.sh
  - bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure
  - README.md
  - docs/README.md
  - docs/release-and-support.md
  - docs/requirements.md
  - SUPPORT.md
drill_down_paths:
  - .gsd/milestones/M005/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M005/slices/S01/tasks/T03-SUMMARY.md
duration: 1h55m
verification_result: passed
completed_at: 2026-03-14 13:24:57 +0300
---

# S01: Async Onboarding And Boundary Truth

**Shipped a discoverable, Russian-first AsyncAPI/Kafka product surface that now tells one honest first-wave story from the main landings through the guide, release/support owners, and support intake rules.**

## What Happened

T01 created the canonical async path. `docs/guides/asyncapi-kafka.md` now explains the first-wave Kafka-only / Spring Kafka-first route from raw or merged async JSONL into `node yanote-js/dist/yanote.cjs async-report`, names `yanote-async-report.json`, and points directly at the authoritative live-proof commands in `scripts/ci/verify-m004-s02-metadata-propagation.sh` and `scripts/ci/verify-m004-s03-live-kafka-proof.sh`. `docs/guides/analyzer-coverage.md` stayed HTTP-first and now branches cleanly to the async guide instead of mixing HTTP and Kafka semantics.

T02 aligned the public owner/support surfaces. `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` now repeat the same literal first-wave async contract: Kafka-only, Spring Kafka-first, separate async report/gate, no payload-schema enforcement yet, and no broker-agnostic promise. Those same surfaces also name the async support intake artifacts explicitly: raw or merged async JSONL, `yanote-async-report.json`, and analyzer/proof `stderr` logs.

T03 made the path actually discoverable from the two main landings without displacing the existing HTTP onboarding. `README.md` and `docs/README.md` now expose the dedicated async guide from the primary user-facing sections and explicitly call out the separate `async-report` / `yanote-async-report.json` outcome. At the same time, `scripts/docs/verify-m005-s01-async-path.sh` and `scripts/docs/verify-m005-s01-async-boundaries.sh` were tightened into the slice’s machine-checked contract: placement-aware landing checks, shared clause checks, support-artifact checks, and surface-specific diagnostics.

The slice also closed its planning surfaces. `R047` was promoted to validated in `.gsd/REQUIREMENTS.md`, the key landing/boundary decisions were recorded in `.gsd/DECISIONS.md`, and the milestone/state files were refreshed so S02 can consume S01 as an already-proven contract instead of rediscovering it.

## Verification

The completed slice passed the full slice-level verification stack:

- `bash scripts/docs/verify-m005-s01-async-path.sh`
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-s04-boundaries.sh`
- `bash scripts/docs/verify-s01-doc-links.sh`
- `bash scripts/docs/verify-s02-doc-links.sh`
- `git diff --check`

The observability/failure-path surface also worked as intended:

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`
  - Expected result: non-zero after the raw-evidence and deterministic-merge checks complete.
  - Observed diagnostic signals: `YANOTE_ASYNC_SUMMARY`, `YANOTE_ASYNC_ERROR`, and retained artifact paths for the single-service log, two-service log, raw producer/consumer JSONL, merged JSONL, async stdout/stderr, and `yanote-async-report.json`.

## Requirements Advanced

- R048 — Advanced the final async acceptance slice by shipping the public contract and verifier outputs that S02 must compose with the authoritative M004 live Kafka proofs.

## Requirements Validated

- R047 — Validated by the dedicated async guide, aligned release/requirements/support wording, thin landing pointers in `README.md` and `docs/README.md`, and the combined async doc verifier stack.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- None.

## Known Limitations

- S01 does not yet provide the final composed M005 acceptance runner; S02 still needs to combine the S01 verifiers with the authoritative M004 live Kafka proof scripts.
- CI artifact collection and GitHub summaries are not yet first-class for async outputs; that promotion remains the core S02 delivery.
- Payload validation against AsyncAPI message schemas and broader non-Kafka/broker-agnostic support remain intentionally deferred.

## Follow-ups

- Build the stage-labeled M005 acceptance surface in S02 by composing `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh`, `scripts/ci/verify-m004-s02-metadata-propagation.sh`, and `scripts/ci/verify-m004-s03-live-kafka-proof.sh`.
- Extend the existing workflow artifact and summary contracts so async failures publish `yanote-async-report.json`, retained live-proof files, and structured `YANOTE_ASYNC_*` diagnostics without changing required job names.

## Files Created/Modified

- `docs/guides/asyncapi-kafka.md` — added the canonical Russian-first AsyncAPI/Kafka onboarding guide.
- `docs/guides/analyzer-coverage.md` — kept the analyzer guide HTTP-first while branching cleanly to the async guide.
- `README.md` — added thin async discoverability copy inside the main onboarding path.
- `docs/README.md` — promoted the async guide into the canonical user-facing guide list.
- `docs/release-and-support.md` — added the honest first-wave async release/support boundary wording.
- `docs/requirements.md` — replaced stale deferred-only async wording with a supported first-wave contract plus explicit deferred follow-ons.
- `SUPPORT.md` — made async support intake artifact requirements concrete.
- `scripts/docs/verify-m005-s01-async-path.sh` — added placement-aware async landing/guide verification.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — added shared-clause and surface-specific async boundary verification.
- `.gsd/REQUIREMENTS.md` — promoted `R047` to validated.
- `.gsd/DECISIONS.md` — recorded the S01 async guide/owner-surface/landing placement decisions.
- `.gsd/milestones/M005/M005-ROADMAP.md` — marked S01 complete.
- `.gsd/PROJECT.md` — refreshed the project snapshot to reflect S01 closure and S02 as the frontier.
- `.gsd/STATE.md` — moved the active slice to S02 and pointed next work at the composed async acceptance layer.
- `.gsd/milestones/M005/slices/S01/S01-UAT.md` — captured the slice-specific acceptance script.
- `.gsd/milestones/M005/slices/S01/S01-SUMMARY.md` — compressed the slice execution and proof into one handoff artifact.

## Forward Intelligence

### What the next slice should know
- `scripts/docs/verify-m005-s01-async-path.sh` and `scripts/docs/verify-m005-s01-async-boundaries.sh` already localize public-surface drift well enough that S02 should compose them directly, not restate their assertions in new scripts.
- The retained-failure proof from `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure` is the best existing evidence for what async CI diagnostics must preserve.

### What's fragile
- The landing verifier is intentionally placement-aware — moving the async pointer out of the primary onboarding sections can break S01 even if the links still exist elsewhere.
- The async boundary contract is duplicated literally across three public owner/support surfaces — any wording drift across those files will fail the new boundary verifier quickly.

### Authoritative diagnostics
- `bash scripts/docs/verify-m005-s01-async-path.sh` — trustworthy for discoverability drift because it checks both wording and placement on the main landings.
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh` — trustworthy for boundary drift because it checks the shared clause/artifact set and surface-specific nuance together.
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure` — trustworthy for async failure visibility because it proves the retained-artifact contract after raw/merge assertions complete.

### What assumptions changed
- Raw link presence would be enough to close async discoverability — in practice S01 needed placement-aware checks so the async branch stays visible in the primary onboarding flow.
- One boundary owner doc could carry the async truth for all public surfaces — in practice the slice needed literal duplication across release/support/requirements/support intake surfaces to prevent contradictory product claims.
