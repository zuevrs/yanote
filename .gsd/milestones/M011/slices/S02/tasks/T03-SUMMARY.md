---
id: T03
parent: S02
milestone: M011
key_files:
  - yanote-js/src/gates/httpRequestSemantics.ts
  - yanote-js/src/gates/httpRequestSemantics.test.ts
  - yanote-js/src/gates/evaluator.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/gates/failureOrder.test.ts
  - yanote-js/src/cli.ts
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Map request-conformance truths to dedicated governance codes for invalid, unavailable, and unsupported request semantics instead of leaving them as medium-only diagnostics.
  - Rank request semantic failures ahead of HTTP payload semantics and gate threshold/regression failures, while keeping failure reasons secret-safe and pointing retained-value detail back to yanote-report.json diagnostics.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T16:37:00.652Z
blocker_discovered: false
---

# T03: Fail-close request semantic drift with typed governance failures

**Fail-close request semantic drift with typed governance failures**

## What Happened

Activated the Vitest skill, re-read the active M011/S02/T03 contracts, and added a new `yanote-js/src/gates/httpRequestSemantics.ts` classifier that turns request-conformance truths into dedicated semantic failures for invalid, unavailable, and unsupported request evidence. The mapper keeps CLI/stderr reasons secret-safe by localizing to operation/location/name and avoiding retained raw values in governance failure text, while still pointing hints back to `httpRequestConformance` diagnostics for retained-value detail in `yanote-report.json`. I then wired request semantics into `yanote-js/src/gates/evaluator.ts` and the CLI entrypoint so `evaluateGateFailures` now short-circuits on request-semantic drift before threshold/regression math, just like payload semantics. In `yanote-js/src/gates/failureOrder.ts` and `yanote-js/src/gates/failureOrder.test.ts`, I pinned deterministic precedence so request-semantic failures sort ahead of payload semantics, generic fail-closed wrappers, and gate failures. I added `yanote-js/src/gates/httpRequestSemantics.test.ts` to cover raw classifier mapping, a real 100%-coverage false-green case with invalid/unavailable/unsupported request drift, and the fully valid green path. I also captured the follow-up boundary in `.gsd/KNOWLEDGE.md`: once request diagnostics enter the governance layer, the older request-summary CLI contract tests flip from exit 0 to exit 5 until T04 updates the summary/dedupe assertions.

## Verification

Verified the task contract with `npm -C yanote-js test -- src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts`, which passed and proved the new request-semantic mapper plus precedence ordering. Verified the evaluator entrypoint with `npm -C yanote-js test -- src/gates/evaluator.threshold.test.ts`, which passed and showed the existing payload fail-closed path still works after adding request-semantic wiring. Ran the slice-level Vitest stack from the slice plan; it now fails in `src/cli.requestEvidence.test.ts` and `src/cli.summary.contract.test.ts` because request drift exits fail-closed with code 5, which is the expected next-task CLI-polish boundary after this governance-layer change. Ran the slice shell verifier command as required by the slice plan; it still exits 127 because `scripts/ci/verify-m011-s02-request-semantics.sh` has not been created yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts` | 0 | ✅ pass | 426ms |
| 2 | `npm -C yanote-js test -- src/gates/evaluator.threshold.test.ts` | 0 | ✅ pass | 385ms |
| 3 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` | 1 | ❌ fail | 1140ms |
| 4 | `bash scripts/ci/verify-m011-s02-request-semantics.sh` | 127 | ❌ fail | 0ms |


## Deviations

None.

## Known Issues

`npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` now fails in `src/cli.requestEvidence.test.ts` and `src/cli.summary.contract.test.ts` because request drift correctly exits fail-closed with code 5, while those request-focused CLI contract tests still assert the pre-T04 exit-0 behavior. `bash scripts/ci/verify-m011-s02-request-semantics.sh` still exits 127 because the T05 verifier script is not present yet.

## Files Created/Modified

- `yanote-js/src/gates/httpRequestSemantics.ts`
- `yanote-js/src/gates/httpRequestSemantics.test.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/failureOrder.test.ts`
- `yanote-js/src/cli.ts`
- `.gsd/KNOWLEDGE.md`
