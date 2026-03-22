---
id: S04
parent: M007
milestone: M007
provides:
  - Authoritative live Kafka proof artifacts now show both the stable happy-path async bundle and retained `schema-failure-*` invalid-payload sidecars, while public async docs/support wording is pinned to that proven Kafka payload-schema boundary.
requires:
  - slice: S03
    provides: Typed async schema/header/reference diagnostics across report, gate, CLI, CI summary, and verifier surfaces that S04 could exercise on the live Spring Kafka proof path.
affects:
  - M008/S01
key_files:
  - yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/export-async-proof-artifacts.test.mjs
  - scripts/ci/collect-yanote-artifacts.test.mjs
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
  - docs/requirements.md
  - SUPPORT.md
key_decisions:
  - Keep the Spring Kafka runtime on string payloads and make the live AsyncAPI proof truthful by moving to named component schemas instead of changing the Java example payload shape.
  - Preserve the canonical happy-path filenames `async-report.stdout`, `async-report.stderr`, and `yanote-async-report.json`, and export the intentional invalid-payload proof only as `schema-failure-*` sidecars.
  - Keep public payload-schema claims tied to the retained Kafka `schema-failure-*` proof artifacts instead of broadening the claim to broker-agnostic or header-level enforcement.
patterns_established:
  - For live Kafka proof fixtures, use named `components.schemas` payload refs on the green path and reuse the same schema id in intentional mismatch specs so retained public `invalid-payload` diagnostics carry stable `schemaId` values.
  - For red-path live proof, assert typed stderr codes plus report diagnostics from retained artifacts; do not assume the analyzer will emit literal `invalid-payload` text on stderr or switch report status to `error`.
  - Mechanically verify public async boundary wording so stale underclaims (`payload-schema enforcement пока нет`) and overclaims (broker-agnostic or header-level enforcement) fail closed.
observability_surfaces:
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - `.yanote-ci/live-kafka-proof/artifact-manifest.txt`
  - `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr`
  - `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json`
  - `bash scripts/docs/verify-m005-s01-async-path.sh`
  - `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
drill_down_paths:
  - `.gsd/milestones/M007/slices/S04/tasks/T01-SUMMARY.md`
  - `.gsd/milestones/M007/slices/S04/tasks/T02-SUMMARY.md`
  - `.gsd/milestones/M007/slices/S04/tasks/T03-SUMMARY.md`
duration: ~3h15m implementation + ~4m final slice verification
verification_result: passed
completed_at: 2026-03-20T20:15:57+03:00
---

# S04: Live Kafka Proof And Boundary Refresh

**Yanote’s authoritative Spring Kafka proof now demonstrates schema-depth async validation end to end, exports inspectable invalid-payload sidecars beside the stable happy-path bundle, and documents only the boundary that runtime actually proves.**

## What Happened

S04 closed M007 by turning the already-built async schema semantics into a truthful live proof and a truthful public boundary.

First, the slice fixed the live AsyncAPI fixtures so the happy path stopped succeeding through anonymous inline payload definitions. The Spring example runtime still publishes and consumes plain string Kafka payloads, so the slice kept that runtime unchanged and rewrote the live proof specs around named `components.schemas` string payloads. It also added a dedicated two-service mismatch fixture that reuses the same named schema id (`UserCreatedPayload`) but intentionally expects an object, giving the same merged Kafka evidence a stable public `invalid-payload` failure surface.

Second, the authoritative live proof stack was widened without breaking existing consumers. `scripts/ci/verify-m004-s03-live-kafka-proof.sh` still exports the canonical happy-path trio (`async-report.stdout`, `async-report.stderr`, `yanote-async-report.json`) for CI/workflow readers, but it now runs a second analyzer pass against the mismatch spec and retains `schema-failure-async-report.stdout`, `schema-failure-async-report.stderr`, and `schema-failure-yanote-async-report.json`. The bundle/exporter tests lock that widened inventory down exactly, so downstream workflow and artifact readers keep their stable filenames while investigators get inspectable red-path proof from the same run.

Third, the public async boundary was refreshed around the runtime truth that the live proof now exports. The guide, release/support owner surface, requirements surface, and support intake no longer say payload-schema enforcement is absent. Instead, they now say something narrower and true: payload-schema drift is surfaced on the proven Kafka path via retained `schema-failure-*` artifacts; routing percentages remain routing-first; retained Kafka headers remain unverifiable; the user-facing async path stays Kafka-only, Spring Kafka-first, and separate from the HTTP report/gate path. The docs verifier scripts now enforce those clauses mechanically.

Finally, the slice updated the explicit project record. Requirement notes for R049 and R065 now include the live-proof/exported-artifact evidence that S04 added, and D011 records the final public-boundary choice so later roadmap work does not accidentally widen claims beyond what the retained proof bundle actually demonstrates.

## Verification

The slice-level verification stack was rerun sequentially from this worktree and passed:

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/docs/verify-m005-s01-async-path.sh`
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
- `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`

Observability/manual proof was also rechecked after the live verifier run:

- `.yanote-ci/live-kafka-proof/artifact-manifest.txt` reports `artifact_count=12` with both the canonical happy-path trio and all retained `schema-failure-*` artifacts.
- `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr` contains typed `ASYNC_SEMANTIC_INVALID_PAYLOAD` lines for the receive and send operations.
- `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json` shows `diagnostics.counts.invalid-payload = 2`, `schemaId = UserCreatedPayload`, `status = "partial"`, and routing coverage still at 100% for the same merged Kafka evidence.
- `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` now match that runtime truth without claiming broker-agnostic, header-level, or combined-report support.

`git diff --check` was not run because this auto-mode execution forbade git commands.

## New Requirements Surfaced

- None.

## Deviations

No implementation deviation from the slice plan.

The only planned verifier that stayed skipped was `git diff --check`, because the auto-mode execution contract for this unit forbade git commands.

## Known Limitations

- Retained Kafka headers are still not preserved in the public proof bundle, so header conformance remains publicly unverifiable even though header-level diagnostics exist as a typed async concept.
- The supported async runtime boundary remains Kafka-only and Spring Kafka-first; non-Kafka brokers are still deferred.
- Async report/gate remains intentionally separate from the HTTP report/gate surface; there is still no combined contract report.
- Routing percentages remain routing-first. The retained schema-failure proof can show 100% operation/message/channel coverage while still surfacing `invalid-payload` diagnostics.
- Broader async follow-ons such as schema registries, deeper schema-evolution concerns, and operational broker semantics remain future scope.

## Follow-ups

- Reassess the post-M007 roadmap before activating M008 so the next milestone builds on the now-closed async boundary instead of reopening Kafka/header/broker assumptions implicitly.
- If future async work is approved, scope it explicitly against the remaining deferred gaps: retained headers, combined HTTP+async surfaces, non-Kafka brokers, and schema-registry/evolution support.

## Files Created/Modified

- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` — replaced anonymous live-proof payload definitions with named string component schemas that match the actual Spring runtime evidence.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — rewrote the happy-path two-service proof spec to use a named string payload schema.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml` — added the intentional mismatch spec that produces retained named-schema `invalid-payload` diagnostics against the same merged Kafka evidence.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — added the retained schema-failure analyzer pass and assertions while keeping the canonical happy-path filenames stable.
- `scripts/ci/export-async-proof-artifacts.sh` — widened the live-proof artifact allowlist and manifest bookkeeping to include `schema-failure-*` sidecars.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — pinned the widened exporter bundle inventory and stale-output replacement behavior.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — pinned the collected live-proof bundle shape and stale-directory replacement behavior.
- `docs/guides/asyncapi-kafka.md` — rewrote the public async guide around the proven Kafka happy-path + schema-failure artifact bundle and the routing/header limits that still remain.
- `docs/release-and-support.md` — refreshed the owner boundary to the proven Kafka payload-schema truth and kept release-vs-HEAD wording aligned.
- `docs/requirements.md` — replaced the stale async underclaim and narrowed deferred async follow-ons to the gaps that really remain.
- `SUPPORT.md` — updated support intake to request the right async artifacts and to preserve redaction discipline for payload/body/header details.
- `.gsd/REQUIREMENTS.md` — recorded S04 validation evidence for R049 and R065.
- `.gsd/DECISIONS.md` — appended D011 for the post-proof public async boundary choice.
- `.gsd/PROJECT.md` — advanced project state to reflect M007 completion.
- `.gsd/STATE.md` — moved the worktree into handoff state for roadmap reassessment.
- `.gsd/milestones/M007/M007-ROADMAP.md` — marked S04 complete.

## Forward Intelligence

### What the next slice should know
- The authoritative async proof now has two distinct truths in one bundle: the canonical happy-path trio remains the stable workflow-facing contract, while the retained `schema-failure-*` sidecars are the inspectable public proof for payload-schema drift on the same merged Kafka evidence.
- S04 fully closes the async schema-depth milestone. Future work should treat the Kafka payload-schema boundary as finished and explicit rather than as a half-implemented surface still needing broadening inside M007.

### What's fragile
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` and `scripts/ci/verify-m004-s03-live-kafka-proof.sh` should not be run in parallel from the same worktree — they share Kafka-heavy local resources and can fail spuriously when launched together.
- The intentional red-path analyzer contract is counterintuitive: it exits non-zero and writes a `partial` report with covered operations. Assertions that expect `status = error` or degraded routing coverage will be wrong.

### Authoritative diagnostics
- `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr` — this is the fastest trustworthy signal for typed public async payload drift because it contains the exported `ASYNC_SEMANTIC_INVALID_PAYLOAD` lines from the authoritative live proof.
- `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json` — this is the authoritative structured source for invalid-payload counts, schema ids, and the routing-first-vs-schema-depth distinction.
- `bash scripts/docs/verify-m005-s01-async-path.sh` and `bash scripts/docs/verify-m005-s01-async-boundaries.sh` — these are the fail-closed guards against boundary wording drift in public docs/support surfaces.

### What assumptions changed
- "The live Kafka proof is already truthful because it passes green." — Before S04, green proof could still ride on anonymous inline payload definitions that never surfaced public schema drift; after S04, the live proof is truthful because the happy path uses named schemas and the same evidence also produces retained named-schema `invalid-payload` sidecars under intentional mismatch.
- "Schema-failure proof should look like routing failure." — The actual contract keeps routing coverage green and publishes payload-schema drift as typed diagnostics beside it, which is the distinction downstream readers must preserve.
