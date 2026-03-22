---
id: M005
provides:
  - Productized AsyncAPI/Kafka onboarding, an honest first-wave boundary contract, and a CI-grade end-to-end async acceptance/diagnostics surface built on the authoritative live Kafka proof stack.
key_decisions:
  - Land the public async boundary truth first across onboarding, support, release, and requirements surfaces, then promote CI proof and diagnostics on top of that stable contract.
  - Keep final async acceptance delegation-only by composing the S01 verifiers with the authoritative M004 Kafka proof scripts under stable stage labels.
  - Promote async diagnostics inside the existing `build-and-test` / `yanote-validation` topology instead of introducing new required job names.
patterns_established:
  - Product-surface truth and CI proof should each be machine-checked at their own layer, then composed rather than rewritten in a second acceptance surface.
  - Proof-owned async diagnostics should export into a stable repo-local bundle and feed summaries/artifacts from that bundle instead of temp-path scraping.
observability_surfaces:
  - bash scripts/docs/verify-m005-s01-async-path.sh
  - bash scripts/docs/verify-m005-s01-async-boundaries.sh
  - bash scripts/ci/verify-m005-s02-async-acceptance.sh
  - bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure
  - .yanote-ci/live-kafka-proof/
  - .yanote-ci/artifacts/build-and-test-async-summary.md
requirement_outcomes:
  - id: R047
    from_status: active
    to_status: validated
    proof: Proven by the dedicated async guide plus the placement-aware landing/boundary verifier stack (`verify-m005-s01-async-path.sh`, `verify-m005-s01-async-boundaries.sh`) that keeps README/docs/support/release/requirements surfaces aligned on the Kafka-only / Spring Kafka-first / separate `async-report` contract.
  - id: R048
    from_status: active
    to_status: validated
    proof: Proven by the stage-labeled `scripts/ci/verify-m005-s02-async-acceptance.sh` command, its delegation-order contract test, the retained-failure live Kafka proof export under `.yanote-ci/live-kafka-proof/`, and the async-aware workflow/summary contracts that keep required job names stable.
duration: 4h55m
verification_result: passed
completed_at: 2026-03-14 14:48:06 +0300
---

# M005: Async Productization And End-to-End Proof

**Yanote’s AsyncAPI/Kafka path is now discoverable, honestly bounded, and backed by a composed CI-grade proof chain from docs through live Kafka evidence to retained async diagnostics.**

## What Happened

M005 turned the async capability from “technically present” into a trustworthy product surface. S01 established one canonical Russian-first async onboarding path: `README.md` and `docs/README.md` now point engineers to `docs/guides/asyncapi-kafka.md`, that guide explains the first-wave Kafka-only / Spring Kafka-first route from raw or merged async JSONL into `yanote async-report`, and the public owner/support surfaces (`docs/release-and-support.md`, `docs/requirements.md`, `SUPPORT.md`) now repeat the same literal scope and support-artifact clauses. The new S01 verifiers keep both discoverability and boundary wording machine-checked so those surfaces cannot quietly drift apart again.

S02 then made the async path release-grade. The authoritative live Kafka proof now exports an allowlisted retained bundle at `.yanote-ci/live-kafka-proof/`, the artifact collector mirrors that bundle under collected CI output, and the summary renderer can explain async failures either from `yanote-async-report.json` or from typed `YANOTE_ASYNC_*` fallback lines when no report exists. That same slice moved async triage into `build-and-test` while leaving `yanote-validation` as the HTTP-only validation job, preserving the existing required job names and branch-protection contract.

The milestone closes with one composed acceptance command instead of a second proof implementation. `scripts/ci/verify-m005-s02-async-acceptance.sh` delegates to the S01 public-contract verifiers plus the authoritative M004 single-service and two-service Kafka proof scripts under stable stage labels, and its contract test locks that composition order. Together, those layers now prove the milestone’s full chain: discoverable docs, honest product boundaries, raw-evidence-first Kafka runtime proof, separate async reporting/gating, retained diagnostics, and CI-visible async summaries.

## Cross-Slice Verification

- **Success criterion: a fresh engineer can discover the AsyncAPI/Kafka capability from `README.md`, `docs/README.md`, and the support/release surfaces, then follow one canonical path to `yanote async-report` and the live Kafka proof.**
  - Verified by `bash scripts/docs/verify-m005-s01-async-path.sh` and `bash scripts/docs/verify-m005-s01-async-boundaries.sh`, which passed and explicitly checked main-landing placement, guide routing, separate `async-report` / `yanote-async-report.json` wording, and aligned support/release owner surfaces.
  - Re-verified inside `bash scripts/ci/verify-m005-s02-async-acceptance.sh`, which passed stages `M005-S02-01` and `M005-S02-02` before continuing into the live Kafka proof stages.

- **Success criterion: public landing, guide, requirements, support, and release-boundary surfaces all tell the same first-wave async story — Kafka-only, Spring Kafka-first, separate async report/gate, no payload-schema enforcement yet, and no broker-agnostic promise.**
  - Verified by `bash scripts/docs/verify-m005-s01-async-boundaries.sh`, which passed and checks the shared clause set plus the release-vs-HEAD and support-artifact nuances.
  - Supported by the S01 slice summary and by the current `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` contract described there.

- **Success criterion: the repo has a composed async acceptance command that reuses the authoritative M004 raw-evidence-first Kafka proofs and passes in CI-grade environments without inventing duplicate proof logic.**
  - Verified by `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs`, which passed and locks the stable stage labels, delegated script order, and delegation-only behavior.
  - Verified by `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`, which passed the single-service HTTP → Kafka → Kafka metadata/raw-evidence proof and direct async analyzer handoff.
  - Verified by `bash scripts/ci/verify-m005-s02-async-acceptance.sh`, which passed all four stages and showed stable `M005-S02-01` through `M005-S02-04` output while delegating to the authoritative M004 scripts.

- **Success criterion: existing required CI job names stay stable while async failures surface actionable artifacts and summaries, including `yanote-async-report.json`, structured `YANOTE_ASYNC_*` lines, and retained live-proof diagnostics.**
  - Verified by `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`, which passed and locked the unchanged `build-and-test` / `yanote-validation` topology plus async summary behavior.
  - Verified operationally by `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`, which returned the expected non-zero result only after raw-evidence and merge assertions completed, emitted `YANOTE_ASYNC_SUMMARY` / `YANOTE_ASYNC_ERROR`, and exported `.yanote-ci/live-kafka-proof/` with retained logs, raw JSONL, merged JSONL, stdout/stderr, and `yanote-async-report.json`.
  - Verified by `bash scripts/ci/collect-yanote-artifacts.sh .yanote-ci/artifacts` plus `node scripts/ci/render-yanote-summary.mjs ... --output .yanote-ci/artifacts/build-and-test-async-summary.md --exit-code 1`, which produced a build-style async summary with `proof exit code: 1`, `report: yanote-async-report.json`, `summary source: report file`, and `primary failure: ASYNC_GATE_MIN_COVERAGE ...`.

- **Definition of done re-check:**
  - All roadmap slices are complete (`S01`, `S02`), and both slice summaries now exist: `.gsd/milestones/M005/slices/S01/S01-SUMMARY.md` and `.gsd/milestones/M005/slices/S02/S02-SUMMARY.md`.
  - Requirement transitions are supported by proof: `R047` and `R048` are validated in `.gsd/REQUIREMENTS.md` with evidence anchored in the S01 verifier stack and the S02 acceptance/CI contracts.
  - The first-wave async story remains explicit and bounded, the final acceptance surface composes rather than duplicates, required job names stayed stable, and the verification stack above re-checked success using runnable commands and retained artifacts rather than prose-only review.

Unmet success criteria: none.

## Requirement Changes

- R047: active → validated — Verified by the S01 async guide/landing/support alignment and the passing `scripts/docs/verify-m005-s01-async-path.sh` + `scripts/docs/verify-m005-s01-async-boundaries.sh` stack.
- R048: active → validated — Verified by the passing `scripts/ci/verify-m005-s02-async-acceptance.sh` command, the delegation-order contract test, the retained `.yanote-ci/live-kafka-proof/` export seam, and the async-aware workflow/summary contracts.

## Forward Intelligence

### What the next milestone should know
- The trustworthy async acceptance chain is now layered and should stay that way: S01 owns public truth, M004 owns raw-evidence-first Kafka runtime proof, and `scripts/ci/verify-m005-s02-async-acceptance.sh` is the only composed top-level command.
- Async CI failures are easiest to debug from `.yanote-ci/live-kafka-proof/` and the rendered build summary, not from the ephemeral temp paths printed during failure.
- The remaining async work is intentionally deferred scope, not cleanup: payload-schema validation, unified HTTP+async reporting, broader broker coverage, schema-registry awareness, and deeper broker-operational dimensions still need deliberate milestone planning.

### What's fragile
- The main async discoverability surface is placement-aware — moving the async pointer out of the primary onboarding sections can break product discoverability even if links still exist elsewhere.
- The required job names and the `build-and-test` async triage / `yanote-validation` HTTP validation split are now part of the CI contract; changing them casually would break both workflow tests and branch-protection expectations.
- The acceptance runner is intentionally delegation-only; adding inline proof logic there would recreate the drift surface this milestone removed.

### Authoritative diagnostics
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh` — trustworthy first stop for end-to-end drift because the failing stage label localizes whether the problem is docs/boundaries, single-service metadata, or live two-service Kafka proof.
- `.yanote-ci/live-kafka-proof/` — trustworthy retained async proof bundle because it is exported by the authoritative live Kafka verifier itself on both success and failure.
- `scripts/ci/render-yanote-summary.mjs` and `.yanote-ci/artifacts/build-and-test-async-summary.md` — trustworthy CI-visible async failure view because they render from the exported bundle and typed `YANOTE_ASYNC_*` lines.
- `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` and `scripts/ci/yanote-ci-workflow.contract.test.mjs` — trustworthy fast-fail drift guards for composition order, job topology, and required-check stability.

### What assumptions changed
- It initially looked like async productization might need new required jobs or a duplicated final proof surface — in practice the existing job topology held once async diagnostics moved into `build-and-test` and the milestone reused the authoritative M004 scripts.
- It looked like async failure summaries would always depend on a generated report file — in practice typed `YANOTE_ASYNC_*` fallbacks were necessary so no-report analyzer failures still produce actionable CI summaries.

## Files Created/Modified

- `docs/guides/asyncapi-kafka.md` — added the canonical Russian-first AsyncAPI/Kafka onboarding guide.
- `README.md` — added discoverable async pointers inside the primary onboarding flow.
- `docs/README.md` — promoted the async guide into the user-facing docs map.
- `docs/release-and-support.md` — aligned the public release/support async boundary with first-wave scope.
- `docs/requirements.md` — aligned the public async requirements story with supported and deferred boundaries.
- `SUPPORT.md` — made async support intake artifacts explicit.
- `scripts/docs/verify-m005-s01-async-path.sh` — added placement-aware async discoverability verification.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — added shared-clause async boundary verification.
- `scripts/ci/export-async-proof-artifacts.sh` — added the stable exported live-proof bundle seam.
- `scripts/ci/collect-yanote-artifacts.sh` — mirrored the exported async bundle into collected artifacts.
- `scripts/ci/render-yanote-summary.mjs` — generalized summary rendering for HTTP and async diagnostics.
- `.github/workflows/yanote-ci.yml` — promoted async collect/render/upload/enforce into `build-and-test` without changing required job names.
- `scripts/ci/verify-m005-s02-async-acceptance.sh` — added the final composed async acceptance runner.
- `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` — locked stage labels, stage order, and delegation-only behavior.
- `.gsd/milestones/M005/slices/S02/S02-SUMMARY.md` — added the missing slice closure summary.
- `.gsd/milestones/M005/M005-SUMMARY.md` — recorded milestone closure, requirement outcomes, and cross-slice proof.
- `.gsd/PROJECT.md` — refreshed the project snapshot to show M005 complete.
- `.gsd/STATE.md` — moved the repo handoff out of completing-milestone mode and marked M005 complete.
