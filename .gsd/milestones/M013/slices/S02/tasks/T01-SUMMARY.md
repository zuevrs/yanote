---
id: T01
parent: S02
milestone: M013
key_files:
  - yanote-js/src/spec/openapi.ts
  - yanote-js/src/spec/openapi.test.ts
  - yanote-js/src/coverage/coverage.ts
  - yanote-js/src/coverage/coverage.test.ts
  - yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml
  - yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Keep `HttpOperationContract.deprecated` sparse and additive by materializing only explicit `deprecated: true` from the OpenAPI Operation Object, so existing inline contract fixtures remain false-compatible.
  - Publish a concrete `deprecated` boolean on `coverage.perOperation` while leaving `coveredOperations`, `uncoveredOperations`, status math, parameter math, aggregate math, and report-status inputs unchanged.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T00:59:33.529Z
blocker_discovered: false
---

# T01: Threaded OpenAPI deprecated-operation metadata into canonical HTTP coverage without changing legacy numerators

**Threaded OpenAPI deprecated-operation metadata into canonical HTTP coverage without changing legacy numerators**

## What Happened

I threaded OpenAPI operation deprecation through the canonical HTTP coverage path in two steps. First, I updated `yanote-js/src/spec/openapi.ts` so `HttpOperationContract` can carry additive deprecation metadata without forcing unrelated fixtures to grow a `deprecated: false` field: extraction now emits `deprecated: true` only when the source OpenAPI Operation Object sets `deprecated === true`. Second, I updated `yanote-js/src/coverage/coverage.ts` so every `PerOperationCoverage` row publishes a deterministic `deprecated` boolean sourced from the canonical contract with a `false` default, leaving the existing operation/status/parameter/aggregate math untouched.

I added focused regression coverage in `yanote-js/src/spec/openapi.test.ts` and `yanote-js/src/coverage/coverage.test.ts`, plus a dedicated fixture pair (`http-deprecated-operations.yaml` and `http-deprecated-operations.fixture.jsonl`) where the only uncovered operation is deprecated. The new coverage test proves the default denominator remains `2/3` with `66.67%` operation coverage and `66.67%` status coverage, and also proves that removing only the deprecated metadata leaves coverage numerators and dimensions unchanged. During verification I hit one intermediate test failure because my first assertion snapshot under-described the existing richer parameter-coverage shape; after reading the full parameter contract, I narrowed that assertion to the real public shape and the focused gate went green. I also appended a `.gsd/KNOWLEDGE.md` pattern capturing the repo-specific rule that sparse source-spec metadata can coexist with deterministic booleans on canonical coverage/report rows.

## Verification

Focused task verification passed with `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts`, proving deprecated extraction, per-operation coverage metadata, and denominator stability on the dedicated `2/3` fixture. The broader slice Vitest stack also passed unchanged, which confirms the additive metadata did not disturb existing HTTP report/CLI contracts yet. As expected for T01, the later-slice retained proof script and Node contract check still fail because their T04 files are not present yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts` | 0 | ✅ pass | 392ms |
| 2 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts src/report/report.contract.test.ts src/report/report.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/cli.async-report.contract.test.ts` | 0 | ✅ pass | 2104ms |
| 3 | `bash scripts/ci/verify-m013-s02-deprecated-operations.sh` | 127 | ❌ fail | 23ms |
| 4 | `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` | 1 | ❌ fail | 103ms |


## Deviations

None.

## Known Issues

The slice-level retained proof checks `bash scripts/ci/verify-m013-s02-deprecated-operations.sh` and `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` still fail because those T04-owned files do not exist yet.

## Files Created/Modified

- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/coverage/coverage.test.ts`
- `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml`
- `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl`
- `.gsd/KNOWLEDGE.md`
