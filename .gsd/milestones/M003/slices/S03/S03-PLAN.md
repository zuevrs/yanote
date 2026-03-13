# S03: Separate Async Report And Gate Surface

**Goal:** Serialize the proven async coverage semantics into a separate deterministic async report and gate path so Yanote can analyze Kafka-oriented AsyncAPI contracts without blurring the existing HTTP surface.
**Demo:** Running the slice proof tests shows that the same normalized async evidence produces a deterministic async report artifact and fail-closed async gate result, while the existing HTTP report/CLI path remains green and separate.

## Must-Haves

- Async results must be emitted through a separate report artifact and CLI/gate path instead of being folded into the existing HTTP report by default.
- The async report must preserve the S02 coverage split for channels, operations, messages, and explicit unmatched/mismatched diagnostics.
- Async report and gate behavior must be deterministic and fail closed without regressing the current HTTP report/CLI surface.

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: deterministic async report JSON, explicit async gate diagnostics, and separate CLI summary/failure output for the async path.
- Inspection surfaces: `yanote-js/src/report/asyncReport*.test.ts`, `yanote-js/src/gates/asyncEvaluator.test.ts`, `yanote-js/src/cli.async-report*.test.ts`, and the generated async report artifact.
- Failure visibility: report-schema failures, async gate-threshold/regression failures, and CLI fail-closed behavior are all localized by dedicated async tests without requiring a live Kafka runtime.
- Redaction constraints: async report fixtures and diagnostics remain metadata-only; do not introduce payload dumps, broker credentials, or raw header blobs.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/src/coverage/asyncCoverage.ts`, `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/report/report.ts`, `yanote-js/src/report/schema.ts`, `yanote-js/src/cli.ts`, and the existing gate/report normalization patterns from the HTTP path.
- New wiring introduced in this slice: separate async report schema/builder/normalizer, async gate evaluator, and a dedicated CLI entry path that consumes normalized async evidence and AsyncAPI specs.
- What remains before the milestone is truly usable end-to-end: M003 is complete once this slice proves the separate async report/gate surface; live runtime evidence capture and end-to-end Kafka proof remain M004 work.

## Tasks

- [ ] **T01: Define the separate async report and gate contract** `est:45m`
  - Why: S03 cannot wire a truthful CLI or gate path until the async artifact shape and fail-closed boundary are pinned in tests instead of being improvised inside command code.
  - Files: `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncReport.contract.test.ts`, `yanote-js/src/report/asyncReport.test.ts`, `yanote-js/src/gates/asyncEvaluator.test.ts`
  - Do: Define the deterministic async report JSON shape, its summary/coverage/diagnostic sections, and the async gate expectations for threshold/regression/fail-closed behavior while keeping the HTTP report untouched.
  - Verify: `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts`
  - Done when: The async artifact and gate contract are pinned in code and tests, and any remaining failures point directly at the missing builder/evaluator implementation.
- [ ] **T02: Implement async report building, normalization, and gate evaluation** `est:1h`
  - Why: T01 only defines the contract; the slice still needs a real report writer and gate evaluator that consume S02 coverage results deterministically.
  - Files: `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncSchema.ts`, `yanote-js/src/report/asyncNormalize.ts`, `yanote-js/src/gates/asyncEvaluator.ts`, `yanote-js/src/report/asyncReport.test.ts`, `yanote-js/src/gates/asyncEvaluator.test.ts`
  - Do: Build a separate async report artifact over `asyncCoverage.ts`, preserve deterministic ordering/rounding/diagnostics, and implement async gate evaluation that fails closed on invalid drift or configured threshold/regression failures without reusing the HTTP artifact surface by accident.
  - Verify: `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts`
  - Done when: The async report and async gate tests pass with deterministic output and explicit failure diagnostics.
- [ ] **T03: Wire the async CLI/report path and prove HTTP non-regression** `est:45m`
  - Why: The milestone is only closed when the separate async report/gate surface is reachable through a real CLI entry point and does not blur or regress the existing HTTP path.
  - Files: `yanote-js/src/cli.ts`, `yanote-js/src/cli.async-report.test.ts`, `yanote-js/src/cli.async-report.contract.test.ts`, `yanote-js/src/report/report.test.ts`, `.gsd/STATE.md`
  - Do: Add a dedicated async CLI/report command or equivalent separate entry path, wire it to AsyncAPI spec loading plus async evidence loading/reporting/gating, rerun HTTP report/coverage tests, and collapse the slice verifier to the truthful final proof stack.
  - Verify: `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts`
  - Done when: The separate async report/gate path is green end to end, HTTP remains green, and `STATE.md` no longer presents S03 as planning work.

## Files Likely Touched

- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncReport.test.ts`
- `yanote-js/src/report/asyncReport.contract.test.ts`
- `yanote-js/src/report/asyncSchema.ts`
- `yanote-js/src/report/asyncNormalize.ts`
- `yanote-js/src/gates/asyncEvaluator.ts`
- `yanote-js/src/gates/asyncEvaluator.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `yanote-js/src/cli.async-report.contract.test.ts`
- `.gsd/STATE.md`
