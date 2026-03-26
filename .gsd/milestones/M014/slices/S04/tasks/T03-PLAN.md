---
estimated_steps: 3
estimated_files: 8
skills_used:
  - debug-like-expert
---

# T03: Refresh public async boundary docs around the authoritative live proof bundle

**Slice:** S04 — Live Kafka proof and support-surface closeout
**Milestone:** M014

## Description

Close the user-facing side of M014 by explaining the richer live async proof bundle everywhere teams will discover it: root/docs landings, async guide, release/support boundary, and branch-protection wording. The wording must stay truthful to the existing Kafka-only / Spring-Kafka-first boundary while explicitly naming the widened live bundle and CI summary surfaces.

## Steps

1. Update the public async docs and landings so they describe the authoritative live Spring Kafka bundle, its widened `yanote-async-report.json` / `.html` semantics, and the retained companion artifacts / CI summary surfaces.
2. Keep every touched surface explicit about the existing boundary: Kafka-only, Spring-Kafka-first, separate async reporting, no combined HTTP+async report, no hosted dashboard, no broker-agnostic promise, and no raw retained-header leakage.
3. Tighten the doc/boundary verifier scripts and branch-protection wording so stale or over-broad claims fail mechanically.

## Must-Haves

- [ ] `README.md`, `docs/README.md`, and `docs/guides/asyncapi-kafka.md` point users to the widened authoritative live proof bundle and CI summary surfaces.
- [ ] `docs/release-and-support.md` and `.github/BRANCH_PROTECTION.md` describe the richer live async semantics and artifact family without widening the public support boundary.
- [ ] `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh`, and `scripts/docs/verify-s04-boundaries.sh` fail if the richer live-proof wording or boundary clauses drift.

## Verification

- `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh`
- Manual review — touched docs exist, are non-empty, and keep the richer live-proof wording aligned with the verifier scripts.

## Inputs

- `README.md` — root landing that must point to the separate async path honestly.
- `docs/README.md` — canonical docs landing for user-facing navigation.
- `docs/guides/asyncapi-kafka.md` — AsyncAPI/Kafka guide describing the authoritative proof path.
- `docs/release-and-support.md` — release/support boundary surface for public promises and CI artifacts.
- `.github/BRANCH_PROTECTION.md` — required-check owner map and CI artifact wording.
- `scripts/docs/verify-m005-s01-async-path.sh` — async-guide / landing verifier.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — support/boundary verifier.
- `scripts/docs/verify-s04-boundaries.sh` — S04 boundary verifier for release/support alignment.

## Expected Output

- `README.md` — root landing mentions the widened authoritative live async proof bundle and separate async-report surface.
- `docs/README.md` — docs landing routes users to the richer live async proof path without mixing it into HTTP onboarding.
- `docs/guides/asyncapi-kafka.md` — async guide explains the widened live bundle, CI summary, and retained companions truthfully.
- `docs/release-and-support.md` — release/support boundary includes the richer live async semantics while preserving current support limits.
- `.github/BRANCH_PROTECTION.md` — branch-protection wording names the widened build-and-test async artifact / summary surfaces.
- `scripts/docs/verify-m005-s01-async-path.sh` — path verifier checks the richer live async wording.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — boundary verifier checks the richer live async wording and unchanged support limits.
- `scripts/docs/verify-s04-boundaries.sh` — S04 verifier enforces the refreshed release/support and landing wording.
