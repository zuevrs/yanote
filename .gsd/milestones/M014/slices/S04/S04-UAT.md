# S04: Live Kafka proof and support-surface closeout — UAT

**Milestone:** M014
**Written:** 2026-03-26T14:23:35.982Z

# S04: Live Kafka proof and support-surface closeout — UAT

**Milestone:** M014
**Written:** 2026-03-26T17:44:00+03:00

## Preconditions
- Worktree: `/Users/zuevrs/Projects/yanote/.gsd/worktrees/M014`
- Docker is running so the Spring Kafka / Testcontainers proof can start Kafka locally.
- Java/Gradle and Node dependencies are available in this worktree.
- If you want a fresh collection pass, delete `.yanote-ci/live-kafka-proof` and `.yanote-ci/build-and-test-artifacts` first.

## Test Case 1 — Regenerate the authoritative live Spring Kafka proof bundle

**Goal:** Confirm the real two-service proof still produces the widened happy-path async artifacts plus the focused companion families.

1. Run:
   ```bash
   bash scripts/ci/verify-m004-s03-live-kafka-proof.sh
   ```
   **Expected:** Exit code `0`.
2. Inspect `.yanote-ci/live-kafka-proof/`.
   **Expected:** It contains the happy-path pair `yanote-async-report.json` and `yanote-async-report.html`, the focused runtime-selected pair `runtime-selected-yanote-async-report.json` and `.html`, the focused schema-failure pair `schema-failure-yanote-async-report.json` and `.html`, plus `async-report.stdout`, `async-report.stderr`, `artifact-manifest.txt`, and `artifact-source-paths.txt`.
3. Open `.yanote-ci/live-kafka-proof/artifact-manifest.txt`.
   **Expected:**
   - `proof_status=success`
   - `report_status=ok`
   - `report_channels=1/1`
   - `report_operations=2/2`
   - `report_messages=2/2`
   - `report_supported_bindings=2/2`
   - `report_operations_with_correlation_id=2/2`
   - `report_operations_with_reply=2/2`
   - `report_runtime_satisfied_semantics=4/4`
   - `missing_artifacts=none`
4. Inspect `.yanote-ci/live-kafka-proof/async-report.stdout`.
   **Expected:** It contains `Kafka Binding Support`, `Declared Semantics`, and `Runtime Semantics` sections, ends with a `YANOTE_ASYNC_SUMMARY` line, and that summary still points `report=` at `.../yanote-async-report.json`.

## Test Case 2 — Happy-path report proves widened live semantics without identity drift or report-surface leaks

**Goal:** Confirm the authoritative happy-path report carries the widened semantics on canonical Kafka operations and stays redaction-safe.

1. Open `.yanote-ci/live-kafka-proof/yanote-async-report.json`.
2. Inspect the top-level summary.
   **Expected:**
   - `status === "ok"`
   - `summary.coveredChannels === 1` and `summary.totalChannels === 1`
   - `summary.coveredOperations === 2` and `summary.totalOperations === 2`
   - `summary.coveredMessages === 2` and `summary.totalMessages === 2`
3. Inspect `bindingSupport.summary`.
   **Expected:** `supportedBindings === 2`, `totalBindings === 2`, `declaredOnlyBindings === 0`, `deferredBindings === 0`, `invalidBindings === 0`, `totalOperations === 2`.
4. Inspect `declaredSemantics.summary`.
   **Expected:** `operationsWithCorrelationId === 2`, `operationsWithReply === 2`, `messageCorrelationIds === 2`, `totalOperations === 2`.
5. Inspect `runtimeSemantics.summary`.
   **Expected:** `satisfiedOperations === 2`, `unsatisfiedOperations === 0`, `satisfiedSemantics === 4`, `unsatisfiedSemantics === 0`, `semanticCoveragePercent === 100`.
6. Inspect the operation rows.
   **Expected:** Operation keys remain exactly `kafka receive users.created` and `kafka send users.created`; no binding or header field rewrites canonical identity.
7. Run the redaction check:
   ```bash
   rg -n "UserCreated-proof-correlation" \
     .yanote-ci/live-kafka-proof/yanote-async-report.json \
     .yanote-ci/live-kafka-proof/yanote-async-report.html \
     .yanote-ci/live-kafka-proof/async-report.stdout \
     .yanote-ci/live-kafka-proof/async-report.stderr \
     .yanote-ci/build-and-test-artifacts/async-summary.md
   ```
   **Expected:** No matches. The proof value may exist in raw retained event evidence, but it must not leak into report/summary surfaces.

## Test Case 3 — Focused companions still prove runtime selection and fail-closed schema behavior

**Goal:** Confirm the widened live bundle keeps the focused companion artifacts instead of replacing them with one happy-path-only report.

1. Open `.yanote-ci/live-kafka-proof/runtime-selected-async-report.stdout`.
   **Expected:**
   - `status: partial`
   - `messages: 2/4 (50.00%)`
   - no declared or runtime semantics rows are invented (`operations with declarations: 0`, `operations with runtime semantics: 0`)
   - the file still ends with a `YANOTE_ASYNC_SUMMARY` line pointing at `runtime-selected-async-report/yanote-async-report.json`.
2. Open `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr`.
   **Expected:** Two typed `YANOTE_ASYNC_ERROR` lines with code `ASYNC_SEMANTIC_INVALID_PAYLOAD`, one for `kafka receive users.created` and one for `kafka send users.created`.
3. Open `.yanote-ci/live-kafka-proof/schema-failure-async-report.stdout`.
   **Expected:**
   - `status: partial`
   - `messages: 2/2 (100.00%)`
   - `Top Issues` contains the `ASYNC_SEMANTIC_INVALID_PAYLOAD` failures
   - the final `YANOTE_ASYNC_SUMMARY` line reports `primary=ASYNC_SEMANTIC_INVALID_PAYLOAD`.
4. Edge check.
   **Expected:** The happy-path report in Test Case 2 stays `status: ok` even though the schema-failure companion remains retained beside it; the bundle proves both positive-path and fail-closed behavior at once.

## Test Case 4 — Collected CI bundle and public boundary wording stay aligned to the live proof

**Goal:** Confirm the build-and-test collection path and public docs surfaces tell the same widened-but-narrow story as the authoritative live bundle.

1. Run:
   ```bash
   bash scripts/ci/collect-yanote-artifacts.sh .yanote-ci/build-and-test-artifacts
   node scripts/ci/render-yanote-summary.mjs \
     --report .yanote-ci/build-and-test-artifacts/live-kafka-proof/yanote-async-report.json \
     --stdout .yanote-ci/build-and-test-artifacts/live-kafka-proof/async-report.stdout \
     --stderr .yanote-ci/build-and-test-artifacts/live-kafka-proof/async-report.stderr \
     --artifacts-dir .yanote-ci/build-and-test-artifacts/live-kafka-proof \
     --output .yanote-ci/build-and-test-artifacts/async-summary.md \
     --exit-code 0
   ```
   **Expected:** Both commands succeed.
2. Open `.yanote-ci/build-and-test-artifacts/async-summary.md`.
   **Expected:**
   - `status: ok`
   - `report artifacts: yanote-async-report.json (present), yanote-async-report.html (present)`
   - `retained async companions: runtime-selected-yanote-async-report.json (present), runtime-selected-yanote-async-report.html (present), schema-failure-yanote-async-report.json (present), schema-failure-yanote-async-report.html (present)`
   - `binding support: supported=2/2 declared_only=0 deferred=0 invalid=0 operations=2`
   - `declared semantics: correlation_operations=2/2 reply_operations=2/2 message_correlation_ids=2`
   - `runtime semantics: satisfied_operations=2/2 satisfied_semantics=4/4 unsatisfied_operations=0 unsatisfied_semantics=0 (100.00%)`
   - `report: yanote-async-report.json`
3. Run the public boundary verifier stack:
   ```bash
   bash scripts/docs/verify-m005-s01-async-path.sh && \
   bash scripts/docs/verify-m005-s01-async-boundaries.sh && \
   bash scripts/docs/verify-s04-boundaries.sh
   ```
   **Expected:** Exit code `0` and all three verifiers report success.
4. Spot-check the touched docs (`README.md`, `docs/README.md`, `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `.github/BRANCH_PROTECTION.md`).
   **Expected:** They describe the widened live Spring Kafka proof and redaction-safe summary lines while still saying Kafka-only, Spring-Kafka-first, separate async reporting, and no combined-report / no dashboard / no broker-agnostic promise.
