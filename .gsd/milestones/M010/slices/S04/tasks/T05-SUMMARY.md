---
id: T05
parent: S04
milestone: M010
key_files:
  - docs/release-and-support.md
  - scripts/docs/verify-s04-boundaries.sh
  - scripts/docs/verify-m010-s04-final-boundary.sh
  - README.md
  - docs/README.md
  - scripts/ci/run-v1-e2e.sh
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Assemble the final M010 owner verifier from the retained HTTP bundle, the focused `/evidence/users/{id}` HTTP-core proof, the retained Kafka live-proof bundle, and owner/support doc verifiers instead of over-claiming that one older HTTP bundle proves the entire milestone boundary.
  - Default `scripts/ci/run-v1-e2e.sh` to a shared cache-backed Gradle home so the compose-based retained HTTP bundle can rerun in agent environments that cannot freshly download Maven dependencies.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T07:04:56.401Z
blocker_discovered: false
---

# T05: Draft the final release/support boundary and add the assembled M010 verifier with a cache-backed HTTP proof rerun fix

**Draft the final release/support boundary and add the assembled M010 verifier with a cache-backed HTTP proof rerun fix**

## What Happened

Activated the requested skills, read the active state/slice/task inputs, and refreshed the owner-facing release/support story to the live stable tag `v1.0.127`. I rewrote `docs/release-and-support.md` so it now describes the final public boundary truthfully: release tags remain the public version source, the retained HTTP bundle and payload fail-closed path remain supported, HTTP Core Conformance is now called out explicitly as an additive supported surface on the proven Spring MVC path, and retained Kafka header diagnostics are promoted as supported truth on the proven Spring Kafka path. I then rewrote `scripts/docs/verify-s04-boundaries.sh` to assert the latest-tag wording plus the new HTTP-core and async-header clauses, added `scripts/docs/verify-m010-s04-final-boundary.sh` as the milestone-level assembly verifier, and tightened the release/support pointers in `README.md` and `docs/README.md` so the public landings point at the final owner contract instead of the older payload-era framing. During verification, the new final boundary script first failed because the old S02 analysis verifier still assumes the pre-M010 four-operation demo; I removed that stale dependency and had the final script verify the refreshed retained HTTP bundle directly. The next run then failed inside `scripts/ci/run-v1-e2e.sh` because its temporary Gradle home forced a fresh Maven download and the environment could not complete the TLS handshake to Maven Central. I patched `run-v1-e2e.sh` to use a shared cache-backed Gradle home and recorded that recovery rule in `.gsd/KNOWLEDGE.md`, but the hard-timeout recovery interrupted execution before I could rerun the full final assembly gate after that fix.

## Verification

Completed verification: `bash scripts/docs/verify-s04-boundaries.sh` now passes against the updated owner surface; `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs` passed; and `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts src/gates/evaluator.threshold.test.ts src/gates/failureOrder.test.ts src/cli.httpCore.report.test.ts src/cli.httpCore.failclosed.test.ts src/cli.summary.contract.test.ts` exited 0, though its Vitest summary only reported three files and should be rechecked when resuming. The remaining gap is the final assembled gate: `bash ./scripts/docs/verify-m010-s04-final-boundary.sh` failed before the last cache-backed `run-v1-e2e.sh` fix could be reverified, so the bundle-refresh portion still needs one confirming rerun.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts src/gates/evaluator.threshold.test.ts src/gates/failureOrder.test.ts src/cli.httpCore.report.test.ts src/cli.httpCore.failclosed.test.ts src/cli.summary.contract.test.ts` | 0 | ✅ pass | 2164ms |
| 2 | `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs` | 0 | ✅ pass | 253ms |
| 3 | `bash scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 164ms |
| 4 | `bash ./scripts/docs/verify-m010-s04-final-boundary.sh` | 1 | ❌ fail | 252291ms |


## Deviations

Patched `scripts/ci/run-v1-e2e.sh` in addition to the planned files after the new final verifier exposed that the retained HTTP bundle refresh was not rerunnable in this environment with a throwaway Gradle home. Because the hard-timeout recovery interrupted execution, I did not rerun the full final boundary stack after that cache-backed Gradle-home fix landed.

## Known Issues

`bash ./scripts/docs/verify-m010-s04-final-boundary.sh` was failing on the retained HTTP bundle refresh before I could rerun it after the `run-v1-e2e.sh` Gradle-home fix, so the final assembled proof gate still needs one confirming rerun. Also, the focused Vitest command exited 0 but reported only three test files in its summary even though six explicit paths were passed, so that runner output should be double-checked when resuming.

## Files Created/Modified

- `docs/release-and-support.md`
- `scripts/docs/verify-s04-boundaries.sh`
- `scripts/docs/verify-m010-s04-final-boundary.sh`
- `README.md`
- `docs/README.md`
- `scripts/ci/run-v1-e2e.sh`
- `.gsd/KNOWLEDGE.md`
