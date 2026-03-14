---
estimated_steps: 5
estimated_files: 4
---

# T02: Align release, requirements, and support owner surfaces for first-wave async

**Slice:** S01 — Async Onboarding And Boundary Truth
**Milestone:** M005

## Description

Make the owner surfaces tell the same async truth. This task updates the public boundary, requirements, and support docs so engineers see one honest first-wave AsyncAPI/Kafka contract and know exactly which artifacts support needs when async proof fails.

## Steps

1. Extend `docs/release-and-support.md` with explicit first-wave async boundary wording that stays honest about Kafka-only / Spring Kafka-first scope and explains how the source-built async path relates to the existing stable release line and repository `HEAD`.
2. Rewrite the async-relevant parts of `docs/requirements.md` so the public requirements surface no longer says AsyncAPI coverage is deferred, and instead distinguishes current first-wave async scope from still-deferred follow-ons like payload validation, combined HTTP+async reporting, and non-Kafka brokers.
3. Update `SUPPORT.md` so async issue reports request raw or merged async JSONL, `yanote-async-report.json`, and analyzer/proof `stderr` logs in addition to the existing reproducibility context.
4. Add `scripts/docs/verify-m005-s01-async-boundaries.sh` to assert that all three owner/support docs name the same first-wave async scope and the same support-intake artifacts.
5. Re-run `bash scripts/docs/verify-s04-boundaries.sh` so the new async clauses do not break the already-proven release/support owner contract.

## Must-Haves

- [ ] `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` all say Kafka-only, Spring Kafka-first, separate async report/gate, no payload-schema enforcement yet, and no broker-agnostic promise.
- [ ] `docs/requirements.md` no longer leaves AsyncAPI/Kafka coverage in the public “deferred” bucket and explicitly keeps the later async expansions deferred.
- [ ] `SUPPORT.md` makes the async intake artifact list explicit: raw or merged async JSONL, `yanote-async-report.json`, and analyzer/proof `stderr` logs.
- [ ] `scripts/docs/verify-m005-s01-async-boundaries.sh` localizes drift by surface and existing `bash scripts/docs/verify-s04-boundaries.sh` still passes.

## Verification

- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- `bash scripts/docs/verify-s04-boundaries.sh`

## Observability Impact

- Signals added/changed: a boundary/support verifier that names which public owner surface drifted and which async clause or intake artifact is missing.
- How a future agent inspects this: read the three owner/support docs, then run `bash scripts/docs/verify-m005-s01-async-boundaries.sh` and `bash scripts/docs/verify-s04-boundaries.sh` to isolate whether the break is async-specific or a broader release-boundary regression.
- Failure state exposed: stale “AsyncAPI deferred” wording, contradictory scope claims, or missing async support artifacts becomes a named failure instead of a support-triage surprise.

## Inputs

- `docs/release-and-support.md` — existing public owner for stable-line and support-boundary truth that must stay authoritative.
- `docs/requirements.md` — current public requirements inventory that still reflects the pre-async boundary and needs an honest first-wave update.
- `SUPPORT.md` — current public support intake surface that only names HTTP artifacts.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — live proof surfaces that define the async artifacts and diagnostics support should ask for.

## Expected Output

- `docs/release-and-support.md` — public boundary owner updated with honest first-wave async scope.
- `docs/requirements.md` — public requirements owner updated for current async scope versus deferred follow-ons.
- `SUPPORT.md` — support intake updated for async artifacts and diagnostics.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — async owner/support boundary verifier.
