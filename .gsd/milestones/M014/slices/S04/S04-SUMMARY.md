---
id: S04
parent: M014
milestone: M014
provides:
  - An authoritative live Spring Kafka proof bundle that now proves additive Kafka binding support, declared correlation/reply semantics, and header-backed runtime semantics on canonical Kafka operations.
  - Collected build-and-test artifacts and async GitHub summary rendering that stay aligned to the live bundle manifest and fail closed when required async report fields or companion artifacts disappear.
  - Public README/docs/release/support/branch-protection wording plus shell verifiers that describe the same widened live async bundle while preserving the Kafka-only, Spring-Kafka-first, separate-report boundary.
  - Requirement-closeout evidence that validates R025 on current HEAD and gives milestone validation one canonical proof bundle to audit.
requires:
  - slice: S02
    provides: Header-backed runtime `correlationId` / `reply.address` truth, typed async fail-closed diagnostics, and additive runtimeSemantics report/CLI surfaces on canonical Kafka operations.
  - slice: S03
    provides: An explicit additive Kafka binding support matrix on canonical contracts plus async JSON/HTML/CLI surfaces, ready to be carried through the authoritative live bundle.
affects:
  []
key_files:
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml
  - yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/collect-yanote-artifacts.sh
  - scripts/ci/render-yanote-summary.mjs
  - README.md
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
  - .github/BRANCH_PROTECTION.md
  - .gsd/DECISIONS.md
  - .gsd/PROJECT.md
key_decisions:
  - D057: Prove richer AsyncAPI semantics on the authoritative live Spring Kafka path by widening the existing proof bundle instead of closing M014 on fixtures alone.
  - D058: Derive collected async bundle metadata and summary rendering from the authoritative live bundle manifest, and fail closed when required report fields or retained companion artifacts are missing.
  - D059: Mark R025 validated based on the live Spring Kafka proof, collected CI artifact/summary contracts, and public Kafka-first docs boundary verifiers.
  - D060: Use stable non-sensitive `correlation_id` and `reply_to` values derived from the proof message/topic so runtime semantics are provable end to end without leaking sensitive values.
  - D061: Anchor public async proof wording to the redaction-safe CI summary families (`binding support`, `declared semantics`, `runtime semantics`) and mirror the same literals in drift verifiers.
patterns_established:
  - Treat the authoritative live proof bundle as the single source for widened async delivery truth, then derive exporters, collectors, manifests, and GitHub summaries from that bundle instead of reconstructing metadata heuristically.
  - Keep machine-facing async output JSON-centered and counts-only (`report=yanote-async-report.json` plus additive summary counts), while giving human-facing docs and summaries explicit `binding support`, `declared semantics`, and `runtime semantics` wording.
  - Retain the happy-path, runtime-selected, and schema-failure async artifact families together so widened live proof stays both demonstrably satisfied and demonstrably fail-closed.
observability_surfaces:
  - `.yanote-ci/live-kafka-proof/yanote-async-report.json` and `.yanote-ci/live-kafka-proof/yanote-async-report.html` as the authoritative happy-path async artifacts.
  - `.yanote-ci/live-kafka-proof/runtime-selected-yanote-async-report.json` / `.html` proving the focused runtime-selection companion remains retained.
  - `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json` / `.html` plus typed stderr proving the fail-closed schema companion remains retained.
  - `.yanote-ci/build-and-test-artifacts/live-kafka-proof/` as the collected CI artifact family derived from the authoritative live bundle manifest.
  - `.yanote-ci/build-and-test-artifacts/async-summary.md` with redaction-safe `binding support`, `declared semantics`, and `runtime semantics` summary lines while keeping `report` JSON-centered.
  - `bash scripts/docs/verify-m005-s01-async-path.sh`, `bash scripts/docs/verify-m005-s01-async-boundaries.sh`, and `bash scripts/docs/verify-s04-boundaries.sh` as literal drift guards for the public async boundary wording.
drill_down_paths:
  - .gsd/milestones/M014/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M014/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M014/slices/S04/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T14:23:35.981Z
blocker_discovered: false
---

# S04: Live Kafka proof and support-surface closeout

**Closed S04 by making the authoritative live Spring Kafka proof bundle, collected CI artifacts, and public docs all publish the same redaction-safe richer AsyncAPI surface — supported bindings 2/2, declared correlation/reply 2/2, runtime semantics 4/4 — without widening beyond Kafka-only, Spring-Kafka-first, separate async reporting.**

## What Happened

## Delivered

S04 closed M014 on the real Spring Kafka path instead of leaving the richer AsyncAPI semantics story split between fixtures and internal tests. The example producer/consumer flow now emits stable non-sensitive `correlation_id` and `reply_to` headers on the same live send/receive traffic that already powered the authoritative proof, the two-service and single-service AsyncAPI fixtures declare matching Kafka binding plus correlation/reply semantics, and the live verifier now fails closed unless the happy-path report keeps additive `bindingSupport`, `declaredSemantics`, and `runtimeSemantics` sections alongside the retained runtime-selected and schema-failure companions.

On current HEAD the authoritative happy-path bundle is the real closeout artifact. `.yanote-ci/live-kafka-proof/yanote-async-report.json` and `.html` now report `status: ok`, `channels=1/1`, `operations=2/2`, `messages=2/2`, `supported_bindings=2/2`, `operations_with_correlation_id=2/2`, `operations_with_reply=2/2`, and `runtime_satisfied_semantics=4/4`, all while preserving canonical `kafka send users.created` / `kafka receive users.created` identities and the existing async coverage numerators. The retained runtime-selected and schema-failure companions stayed in the bundle too, so the widened live proof remains both positive-path and fail-closed rather than a happy-path-only artifact family.

S04 also turned that live bundle into the authoritative delivery surface for CI and support flows. The async proof exporter now writes the widened JSON/HTML pair plus runtime-selected and schema-failure companions with manifest/source-path metadata sourced from the real bundle; `collect-yanote-artifacts.sh` republishes that same family into `.yanote-ci/build-and-test-artifacts/live-kafka-proof/`; and `render-yanote-summary.mjs` prints redaction-safe `binding support`, `declared semantics`, and `runtime semantics` lines while failing closed if the async report is malformed or a required companion artifact is missing. The collected `async-summary.md` remains JSON-centered (`report: yanote-async-report.json`) and now truthfully reports `supported=2/2`, `correlation_operations=2/2`, `reply_operations=2/2`, and `satisfied_semantics=4/4`.

Public support wording now matches the same proven boundary. README, docs landing, the AsyncAPI/Kafka guide, release/support docs, and branch protection all describe the widened live Spring Kafka bundle, the retained focused companions, and the redaction-safe summary surfaces while still saying Kafka-only, Spring-Kafka-first, separate async reporting, no combined HTTP+async report, no hosted dashboard, and no broker-agnostic promise. The doc verifiers now pin those exact strings so future wording drift fails mechanically.

## Operational Readiness (Q8)

- **Health signal:** `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` produces `.yanote-ci/live-kafka-proof/yanote-async-report.json` and `.html` plus `runtime-selected-*` and `schema-failure-*` companions; the happy-path stdout and `.yanote-ci/build-and-test-artifacts/async-summary.md` show `status: ok`, `binding support: supported=2/2`, `declared semantics: correlation_operations=2/2 reply_operations=2/2`, and `runtime semantics: satisfied_semantics=4/4`.
- **Failure signal:** Missing happy-path or companion artifacts, dropped `bindingSupport` / `declaredSemantics` / `runtimeSemantics` sections, `report=` no longer pointing at the JSON artifact, schema-failure proof disappearing, raw `UserCreated-proof-correlation` leaking into report/summary surfaces, or the async docs/boundary verifiers failing.
- **Recovery procedure:** Rerun `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`, then `bash scripts/ci/collect-yanote-artifacts.sh .yanote-ci/build-and-test-artifacts`, then rerender `async-summary.md` with `node scripts/ci/render-yanote-summary.mjs --report .yanote-ci/build-and-test-artifacts/live-kafka-proof/yanote-async-report.json --stdout .yanote-ci/build-and-test-artifacts/live-kafka-proof/async-report.stdout --stderr .yanote-ci/build-and-test-artifacts/live-kafka-proof/async-report.stderr --artifacts-dir .yanote-ci/build-and-test-artifacts/live-kafka-proof --output .yanote-ci/build-and-test-artifacts/async-summary.md --exit-code 0`; if wording drift triggered the failure, rerun the three docs verifiers and restore the literal support-boundary strings.
- **Monitoring gaps:** The closeout path is retained-artifact/CI based rather than a hosted dashboard or continuous external monitor, and the validated async breadth remains intentionally Kafka-only and Spring-Kafka-first rather than broker-agnostic.

## Verification

Executed the full slice verifier stack from `/Users/zuevrs/Projects/yanote/.gsd/worktrees/M014` and confirmed the assembled closeout surfaces, not just the individual task patches:

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` — passed and regenerated `.yanote-ci/live-kafka-proof/` with the widened happy-path JSON/HTML pair plus retained runtime-selected and schema-failure companions; the exported manifest reports `report_status=ok`, `report_supported_bindings=2/2`, `report_operations_with_correlation_id=2/2`, `report_operations_with_reply=2/2`, and `report_runtime_satisfied_semantics=4/4`.
- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` — passed and confirmed the widened exporter, collector, summary renderer, and stable workflow contract fail closed when required async siblings or report fields are missing.
- `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh` — passed and confirmed public landing/docs/release/support/branch-protection wording stays aligned to the same widened live Kafka bundle and narrow support boundary.
- `python3 ...` + `rg -n "UserCreated-proof-correlation" ...` against `.yanote-ci/live-kafka-proof/yanote-async-report.{json,html}`, `async-report.stdout`, `async-report.stderr`, and `.yanote-ci/build-and-test-artifacts/async-summary.md` — passed and confirmed the happy-path report carries binding `2/2`, declared `2/2`, runtime `4/4`, canonical `kafka send/receive users.created` rows, and no raw proof-correlation leak on report/summary surfaces.

## Requirements Advanced

- R003 — Kept the authoritative async bundle on the real CLI/CI delivery path, with collected artifacts and summary rendering aligned to the widened live report family instead of leaving the richer semantics only in focused tests.
- R002 — Strengthened the live proof exporter, collector, summary renderer, and docs verifiers so missing widened sections, missing companion artifacts, malformed async inputs, or support-boundary drift fail closed instead of silently publishing stale green output.
- R001 — Preserved the proven recorder -> JSONL -> analyzer/report path on the real Spring Kafka example while widening the async truth that survives into retained artifacts and public delivery surfaces.

## Requirements Validated

- R025 — `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` regenerated the authoritative live bundle with happy-path `supported_bindings=2/2`, `operations_with_correlation_id=2/2`, `operations_with_reply=2/2`, and `runtime_satisfied_semantics=4/4`; `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` proved the widened exporter/collector/summary/workflow contract; and `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh` proved the same Kafka-first public boundary wording.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

The widened async breadth remains intentionally narrow: Kafka-only, Spring-Kafka-first, JSON-centered machine output, and separate async reporting only. The retained proof/summary path is CI/on-demand rather than a hosted dashboard or continuous external monitor, and broader broker expansion or combined HTTP+async reporting remain deferred.

## Follow-ups

Milestone validation and roadmap reassessment should treat this slice as the authoritative closeout proof for R025 and verify that the remaining roadmap stays unchanged; no additional slice-local remediation was discovered.

## Files Created/Modified

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — Emits stable non-sensitive `correlation_id` and `reply_to` headers on the authoritative live Kafka send/receive flow used by the proof bundle.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java` — Asserts the producer/consumer JSONL evidence retains the widened live Kafka payload and header truth across the two-service handoff.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — Declares the live two-service Kafka binding, correlationId, and reply semantics that the authoritative happy-path report now proves.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` — Keeps the focused single-service republish proof fixture aligned with the widened live Kafka semantics contract.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — Regenerates the authoritative live bundle and fails closed when happy-path/companion async artifacts, widened sections, or redaction guarantees drift.
- `scripts/ci/export-async-proof-artifacts.sh` — Exports the widened live async JSON/HTML family plus runtime-selected and schema-failure companions with manifest metadata derived from the real proof bundle.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — Locks the widened exporter contract, including success-path HTML siblings and fail-closed missing-artifact behavior.
- `scripts/ci/collect-yanote-artifacts.sh` — Collects the authoritative live Kafka bundle into `build-and-test-artifacts` without inventing stale async files.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — Protects the collected build-and-test bundle manifest and source-path note contract for the widened async artifact family.
- `scripts/ci/render-yanote-summary.mjs` — Renders redaction-safe async GitHub summary lines for binding support, declared semantics, and runtime semantics while failing closed on malformed or incomplete async inputs.
- `scripts/ci/render-yanote-summary.test.mjs` — Locks the widened async summary wording and fail-closed behavior against malformed reports or missing companion artifacts.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — Keeps the existing required-job workflow contract aligned with the widened live Kafka artifact family and summary path.
- `README.md` — Updates the root product landing to describe the authoritative live Kafka async bundle and its still-narrow Kafka-first boundary.
- `docs/README.md` — Updates the docs landing to point readers at the widened live Spring Kafka async proof surfaces.
- `docs/guides/asyncapi-kafka.md` — Refreshes the AsyncAPI/Kafka guide with the widened live proof bundle, retained companions, and JSON/HTML artifact story.
- `docs/release-and-support.md` — Pins release/support wording to the widened async bundle while still excluding combined reporting, hosted dashboards, and broker-agnostic promises.
- `.github/BRANCH_PROTECTION.md` — Aligns branch-protection wording with the widened async proof and collected-summary contract.
- `scripts/docs/verify-m005-s01-async-path.sh` — Makes async landing/boundary drift fail mechanically through exact-string verifier coverage.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — Keeps public async scope and release/support wording aligned through literal boundary assertions.
- `scripts/docs/verify-s04-boundaries.sh` — Pins the widened S04 async-proof/support wording so docs drift fails closed.
- `.gsd/DECISIONS.md` — Records the new S04 delivery/support decisions, requirement validation decision for R025, and refreshed current project state.
- `.gsd/KNOWLEDGE.md` — Captures the collector-manifest pattern needed to re-collect widened live bundles truthfully and updates project state for post-S04 handoff.
- `.gsd/PROJECT.md` — Refreshes current project state to show M014 execution-complete and ready for milestone validation/closeout.
