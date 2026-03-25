---
id: S03
parent: M010
milestone: M010
provides:
  - Fixture-backed real-input async header diagnostics for `missing-header`, `invalid-header`, `unavailable-header`, and authored `unverifiable-headers` on the analyzer/report/CLI path.
  - Partial live Kafka proof/export groundwork for retained header-drift sidecars, including proof-only sensitive header emission and authored two-service AsyncAPI sidecar specs.
  - Async summary-renderer precedence work that already maps header diagnostics to the correct `ASYNC_SEMANTIC_*` codes.
requires: []
affects:
  - M010/S04
key_files:
  - yanote-js/test/fixtures/asyncapi/schema-header-unverifiable-v3.yaml
  - yanote-js/src/spec/asyncapi.test.ts
  - yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts
  - yanote-js/src/report/asyncReport.test.ts
  - yanote-js/src/cli.async-report.test.ts
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-missing-header.yaml
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-header.yaml
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-unavailable-header.yaml
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-unverifiable-header.yaml
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/export-async-proof-artifacts.test.mjs
key_decisions:
  - Use authored AsyncAPI fixtures, not in-memory contract mutation, to prove public `unverifiable-headers` reachability.
  - Use a proof-only sensitive Kafka header key containing `secret` so the recorder naturally emits redacted unavailable-header evidence without leaking the raw value.
patterns_established:
  - Real-input async header diagnostics are trustworthy only when the spec path itself causes the outcome; for `unverifiable-headers`, an authored invalid header-schema pattern is enough to force AJV compilation failure without mutating contracts in tests.
  - The live Kafka proof path should extend the existing happy-path/runtime-selection/schema-failure sidecar pattern additively rather than inventing a second export flow.
observability_surfaces:
  - `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/report/asyncReport.test.ts src/cli.async-report.test.ts`
  - `scripts/ci/render-yanote-summary.mjs`
  - `.yanote-ci/live-kafka-proof/`
verification_result: partial
completed_at: 2026-03-25T07:22:00+03:00
---

# S03: Async Kafka Header Validation As A Supported Core Surface

**Closeout status:** interrupted at the context-budget boundary. The slice is **not ready to mark done yet**. T01-level fixture-backed header diagnostics are now real and focused tests pass, but the live Kafka proof/export widening and public docs boundary refresh are only partially assembled and were not fully re-verified after the last edits.

## What landed before wrap-up

### 1. Real-input header diagnostics are now reachable without in-memory mutation
The most important truthful change landed in the typed analyzer/report/CLI test path:

- added authored fixture `yanote-js/test/fixtures/asyncapi/schema-header-unverifiable-v3.yaml`
- updated `yanote-js/src/spec/asyncapi.test.ts` to prove the parser keeps the authored header schema on the real-input path
- updated `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` to stop expecting the old blanket header-unverifiable behavior on `schema-depth-v3.yaml` and to assert a real authored `unverifiable-headers` path instead
- updated `yanote-js/src/report/asyncReport.test.ts` and `yanote-js/src/cli.async-report.test.ts` so missing / unavailable / invalid / unverifiable headers are asserted from authored inputs instead of stale mutation helpers

This retires the narrowest T01 blocker from the earlier handoff: the focused async suite no longer depends on the stale “headers are always unverifiable” expectation.

### 2. Proof-side groundwork for live header drift is partially wired
The repository now also contains the missing authored two-service sidecar specs for the live Kafka proof path:

- `spring-kafka-two-service-missing-header.yaml`
- `spring-kafka-two-service-invalid-header.yaml`
- `spring-kafka-two-service-unavailable-header.yaml`
- `spring-kafka-two-service-unverifiable-header.yaml`

and `ExampleServiceApplication.java` now emits a proof-only sensitive Kafka header (`yanote.proof.secret`) so recorder redaction can produce real unavailable-header evidence.

I also started widening:

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.test.mjs`

but that work stopped mid-closeout and still needs a clean completion + rerun.

### 3. CI summary precedence work already existed and should be preserved
T03’s renderer work remains the strongest already-finished slice surface:

- `scripts/ci/render-yanote-summary.mjs` now maps `missing-header`, `unavailable-header`, `invalid-header`, and `unverifiable-headers`
- `scripts/ci/render-yanote-summary.test.mjs` already pins mixed payload/header ordering and header-primary behavior

Do not regress that ordering while finishing T02/T04.

## What I verified before stopping

### Passed now
This focused T01 verification command passes after the fixture-backed updates:

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/report/asyncReport.test.ts src/cli.async-report.test.ts`

### Previously passed earlier in the slice, but **not rerun after the last live-proof edits**
From the existing task summaries:

- `node --test scripts/ci/render-yanote-summary.test.mjs`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/ci/verify-m005-s02-async-acceptance.sh`

Those results were valid before the newest proof/export edits. They should now be treated as **stale verification** until rerun.

### Not re-verified after the last edits
I did **not** finish or rerun the full slice command stack after widening the live proof/export surfaces. That means S03 cannot truthfully be marked done from this unit.

## What remains unfinished

### 1. Finish the live Kafka header-sidecar proof wiring
The highest-priority resume target is:

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`

The script now has:

- the new sidecar spec paths,
- proof-only sensitive header expectations,
- a new `run_header_drift_sidecar(...)` helper,
- additive export env vars,
- new success-summary lines,

but it still needs one clean end-to-end run to confirm:

- missing-header sidecar emits `ASYNC_SEMANTIC_MISSING_HEADER`
- unavailable-header sidecar emits `ASYNC_SEMANTIC_UNAVAILABLE_HEADER`
- invalid-header sidecar emits `ASYNC_SEMANTIC_INVALID_HEADER`
- unverifiable-header sidecar emits `ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS`
- happy path, runtime-selection sidecar, and schema-failure sidecar all remain green/additive

### 2. Finish the exporter and exporter test updates
`scripts/ci/export-async-proof-artifacts.sh` was widened to copy the four new header sidecars.

`scripts/ci/export-async-proof-artifacts.test.mjs` was also widened substantially, but the failure-mode assertions were interrupted mid-update. At wrap-up time it still needs a final pass to make the new success/failure expectations internally consistent and then a direct rerun:

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs`

Treat that file as the most likely resume point for a small cleanup before the full live proof rerun.

### 3. Public async boundary wording is still stale
The docs/support verifier stack still encodes the older under-claim:

- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `docs/requirements.md`
- `SUPPORT.md`
- `scripts/docs/verify-m005-s01-async-path.sh`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`

At the moment those surfaces still say variants of **“retained Kafka headers remain unverifiable”**. That is no longer the intended S03 boundary. T04 still needs the wording and verifier expectations refreshed to say header diagnostics are supported on the Kafka-first async surface while raw sensitive values stay redacted.

## Requirement status

No requirement state was updated during this interrupted closeout.

- `R034` should remain **active** until the live proof bundle and public wording are rerun together.
- `R002`, `R003`, and `R005` remain supported by previously validated surfaces, but S03 has not yet added enough fresh end-to-end proof to claim completion against them from this unit alone.

## Resume checklist for the next unit

Resume in this order to minimize wasted context:

1. **Finish `scripts/ci/export-async-proof-artifacts.test.mjs`** so the new header-sidecar expectations are internally complete.
2. Run:
   - `node --test scripts/ci/export-async-proof-artifacts.test.mjs`
3. Run the live proof stack:
   - `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
4. Update the async public-boundary docs + verifier scripts to remove the stale under-claim.
5. Rerun the full slice verification stack from the plan.
6. Only then update roadmap/state and mark S03 done.

## Most important gotchas

- `schema-header-unverifiable-v3.yaml` currently produces the real unverifiable-header path by forcing an **AJV compile failure** from an authored invalid regex pattern. Preserve that pattern; do not revert to in-memory mutation helpers.
- The new proof-only Kafka header intentionally relies on the recorder’s existing sensitive-header policy. The useful public signal is the retained evidence state/reason (`redacted` / `sensitive`), **not** the raw header value.
- Do not trust the earlier green docs/acceptance results after the newest proof/export edits. They must be rerun.
