# S01: Async Onboarding And Boundary Truth

**Goal:** Make Yanote’s first-wave AsyncAPI/Kafka capability discoverable and honest from the public repo surfaces so a new engineer can find the async path, run `yanote async-report`, understand the current limits, and know which proof/support artifacts matter without maintainer-only context.
**Demo:** A reader can open `README.md` or `docs/README.md`, follow one Russian-first guide to the Kafka/AsyncAPI path, see the same first-wave boundary truth repeated in release/support/requirements surfaces, and rerun machine-checked verifiers that fail loudly if those async claims drift.

## Decomposition Rationale

- Start with a dedicated async guide and a guide-level verifier, because the first risk in this slice is simple non-discoverability: if `async-report` stays buried inside the HTTP story, the capability still feels unofficial.
- Align the owner surfaces (`docs/release-and-support.md`, `docs/requirements.md`, `SUPPORT.md`) next, because contradictory promises about Kafka scope, payload validation, or broker breadth are the biggest trust risk once the path becomes visible.
- Finish by wiring thin landing pointers from `README.md` and `docs/README.md`, then rerun both the new and existing doc verifiers so async discoverability lands without regressing the already-proven concept-first and release-boundary contracts.

## Must-Haves

- [R047] One Russian-first guide defines the first-wave AsyncAPI/Kafka route from Kafka evidence to `yanote async-report` / `yanote-async-report.json`, names the authoritative live-proof commands, and keeps Kafka-only, Spring Kafka-first, separate async report/gate, no payload-schema enforcement, and no broker-agnostic promise explicit.
- [R047] `README.md` and `docs/README.md` expose that guide as the canonical async branch without replacing the existing HTTP concept-first onboarding path.
- [R047, R048-support] `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` tell the same first-wave async story and list the async support-intake artifacts: raw or merged async JSONL, `yanote-async-report.json`, and analyzer/proof `stderr` logs.
- [R047, R048-support] New async doc verifiers fail closed on onboarding or boundary drift while the existing S01-S04 doc verifiers remain green.

## Proof Level

- This slice proves: operational
- Real runtime required: no
- Human/UAT required: no

## Verification

- `bash scripts/docs/verify-m005-s01-async-path.sh`
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure` — inspectable failure-path proof that must retain temp artifacts and localize async analyzer drift after the raw/merge checks complete.
- `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh`
- `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: targeted shell assertion output that names the drifting async surface, missing support artifact clause, or broken landing/guide pointer.
- Inspection surfaces: `bash scripts/docs/verify-m005-s01-async-path.sh`, `bash scripts/docs/verify-m005-s01-async-boundaries.sh`, the affected public docs, and the referenced live-proof scripts under `scripts/ci/`.
- Failure visibility: verifier output should localize regressions by surface (`README.md`, `docs/README.md`, `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, `SUPPORT.md`) and by claim type (discoverability, scope boundary, or support intake).
- Redaction constraints: diagnostics must stay on repo text, artifact names, and verifier output only; never include secrets, issue-private details, or copied log payloads beyond the named async artifacts.

## Integration Closure

- Upstream surfaces consumed: `README.md`, `docs/README.md`, `docs/guides/analyzer-coverage.md`, `docs/release-and-support.md`, `docs/requirements.md`, `SUPPORT.md`, `scripts/ci/verify-m004-s02-metadata-propagation.sh`, and `scripts/ci/verify-m004-s03-live-kafka-proof.sh`.
- New wiring introduced in this slice: a dedicated async guide, thin root/docs landing pointers, aligned release/support/requirements/support wording, and two async-specific doc verifiers.
- What remains before the milestone is truly usable end-to-end: S02 must compose these S01 verifiers with the authoritative live Kafka proof scripts and promote async artifacts/summaries into the existing CI diagnostic surfaces.

## Tasks

- [x] **T01: Define the canonical async guide and guide-level verifier** `est:45m`
  - Why: S01 needs one obvious async entry point before any landing or support surface can point somewhere trustworthy.
  - Files: `docs/guides/asyncapi-kafka.md`, `docs/guides/analyzer-coverage.md`, `scripts/docs/verify-m005-s01-async-path.sh`
  - Do: Add a Russian-first async guide that explains the first-wave Kafka/AsyncAPI path, separates `async-report` from the HTTP `report` flow, documents `yanote-async-report.json` plus raw/merged Kafka JSONL inputs, and points to `scripts/ci/verify-m004-s02-metadata-propagation.sh` and `scripts/ci/verify-m004-s03-live-kafka-proof.sh`; add a guide-level verifier with targeted diagnostics and keep any still-missing README/docs landing clauses explicitly reserved for T03.
  - Verify: `bash scripts/docs/verify-m005-s01-async-path.sh` is expected to fail only on the README/docs discoverability clauses until T03 lands.
  - Done when: `docs/guides/asyncapi-kafka.md` exists as a real user-facing guide, `docs/guides/analyzer-coverage.md` points to it without mixing HTTP/async semantics, and the new verifier’s remaining failures are limited to T03-owned landing wiring.
- [x] **T02: Align release, requirements, and support owner surfaces for first-wave async** `est:1h`
  - Why: Discoverability alone is not enough; the slice only becomes trustworthy when the owner surfaces stop contradicting each other about async scope, support, and deferred work.
  - Files: `docs/release-and-support.md`, `docs/requirements.md`, `SUPPORT.md`, `scripts/docs/verify-m005-s01-async-boundaries.sh`
  - Do: Update the public boundary docs so they all name the same first-wave async contract — Kafka-only, Spring Kafka-first, separate async report/gate, no payload-schema enforcement yet, no broker-agnostic promise — while keeping the release-vs-HEAD story honest, retiring the stale “AsyncAPI deferred” wording in `docs/requirements.md`, and making async support intake require raw or merged JSONL, `yanote-async-report.json`, and analyzer/proof `stderr` logs; add a verifier that checks those clauses surface-by-surface.
  - Verify: `bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh`
  - Done when: the three owner/support docs agree on the same async boundary/support contract and the new boundary verifier passes without regressing the existing release/support contract.
- [x] **T03: Wire async discoverability into the main landings** `est:45m`
  - Why: The slice is not done if the new guide and owner surfaces stay buried; root/docs landings must surface them while preserving the existing concept-first path.
  - Files: `README.md`, `docs/README.md`, `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh`
  - Do: Add thin async pointers and first-wave boundary wording to `README.md` and `docs/README.md`, keep the existing HTTP onboarding primary, tighten the new async verifiers so they require final landing discoverability and correct guide ordering, and rerun the older S01-S04 doc verifiers to ensure no regressions.
  - Verify: `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`
  - Done when: a new engineer can find the async path from the two main landings and all async plus pre-existing doc verifiers pass together.

## Files Likely Touched

- `README.md`
- `docs/README.md`
- `docs/guides/asyncapi-kafka.md`
- `docs/guides/analyzer-coverage.md`
- `docs/release-and-support.md`
- `docs/requirements.md`
- `SUPPORT.md`
- `scripts/docs/verify-m005-s01-async-path.sh`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`
