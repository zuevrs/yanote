---
id: T01
parent: S02
milestone: M011
key_files:
  - yanote-js/src/coverage/dimensions.ts
  - yanote-js/src/spec/openapi.ts
  - yanote-js/src/spec/openapi.test.ts
  - yanote-js/src/coverage/httpRequestConformance.ts
  - yanote-js/src/coverage/httpRequestConformance.test.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/schema.ts
  - yanote-js/src/report/report.requestEvidence.contract.test.ts
  - yanote-js/src/report/writeReport.determinism.test.ts
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Publish the new request serialization matrix additively via `declaredSupport*` while keeping the legacy `scalar*` evaluator contract intact until later S02 tasks switch enforcement.
  - Use stable unsupported reasons `content`, `style`, `explode`, and `schema`, and only mark repeated arrays as supported for honest repeated query serialization (`query` + `form` + `explode=true` + scalar items).
duration: ""
verification_result: mixed
completed_at: 2026-03-25T16:18:46.631Z
blocker_discovered: false
---

# T01: Publish declared request serialization support metadata in OpenAPI and report contracts

**Publish declared request serialization support metadata in OpenAPI and report contracts**

## What Happened

Activated the OpenAPI 3.2 and Vitest skills, read the active milestone/slice/task contracts, and widened the HTTP request-parameter model additively instead of replacing the legacy evaluator in one jump. In `yanote-js/src/coverage/dimensions.ts` and `yanote-js/src/spec/openapi.ts`, I introduced a new declared request-support contract that distinguishes supported scalar parameters, supported repeated query arrays (`query` + `form` + `explode=true` + scalar items), and explicit unsupported reasons (`content`, `style`, `explode`, `schema`). I preserved the existing `scalar` support contract so the current first-scalar analyzer behavior stays stable until later slice tasks switch enforcement over. I then threaded the new declared-support metadata through `yanote-js/src/coverage/httpRequestConformance.ts`, `yanote-js/src/report/report.ts`, and `yanote-js/src/report/schema.ts` so `yanote-report.json` now publishes the declared support matrix per request parameter via `declaredSupport`, `declaredSupportShape`, and `declaredSupportReason` while keeping legacy `scalarSupport` fields and coverage numerators unchanged. I expanded `yanote-js/src/spec/openapi.test.ts` to pin supported query arrays plus unsupported content/style/explode/schema cases, updated `yanote-js/src/report/report.requestEvidence.contract.test.ts` to prove the report surface carries the widened declared-support metadata deterministically, and adjusted `yanote-js/src/report/writeReport.determinism.test.ts` plus `yanote-js/src/coverage/httpRequestConformance.test.ts` for the new additive fields. I also appended a knowledge entry documenting the temporary two-surface transition (`declaredSupport*` public boundary vs `scalar*` legacy evaluator input) so later slice tasks do not accidentally collapse the staged migration.

## Verification

Verified the task-scoped contract with `npm -C yanote-js test -- src/spec/openapi.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts`, which passed and confirmed the widened OpenAPI extraction plus report-schema/determinism surfaces. Ran the broader slice Vitest command from the slice plan; it passed for the currently present suites and confirmed the additive contract changes did not regress request-conformance, CLI, or failure-order tests. Ran the slice-level retained verifier command `bash scripts/ci/verify-m011-s02-request-semantics.sh`; it failed immediately with exit 127 because that script is not present in this worktree yet, which matches this being the first task in the slice rather than a plan-invalidating blocker. Confirmed the related end-to-end request-semantics surfaces are not yet present by checking for matching files under `scripts/ci` and `yanote-js/src`.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts` | 0 | ✅ pass | 2000ms |
| 2 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 1580ms |
| 3 | `bash scripts/ci/verify-m011-s02-request-semantics.sh` | 127 | ❌ fail | 0ms |


## Deviations

None.

## Known Issues

The slice-level retained verifier script `scripts/ci/verify-m011-s02-request-semantics.sh` is not present yet in this worktree, so that verification step currently exits 127 and remains for a later slice task. The slice-level Vitest command also references `src/gates/httpRequestSemantics.test.ts`, which is not present yet and is therefore silently skipped by Vitest; this is a local slice-progress gap, not a blocker for T01.

## Files Created/Modified

- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/coverage/httpRequestConformance.ts`
- `yanote-js/src/coverage/httpRequestConformance.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
- `.gsd/KNOWLEDGE.md`
