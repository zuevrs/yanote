# T04: 04-java-build-and-ci-delivery-surfaces 04

**Slice:** S04 — **Milestone:** M001

## Description

Close the Phase 4 blocker by wiring GitHub validation to the aggregate Gradle `yanoteCheck` path while preserving deterministic failure-triage behavior.

Purpose: Restore DELV-02/DELV-03 channel parity and keep QUAL-02/QUAL-03 merge-blocking CI guarantees intact.
Output: One focused CI wiring patch that replaces CLI-only validation execution with rooted Gradle check execution and keeps always-on summary/artifact retention.

## Must-Haves

- [ ] "GitHub `yanote-validation` executes an aggregate Gradle `yanoteCheck` delivery path (or equivalent rooted Gradle wrapper path), not only plugin tests plus direct Node CLI."
- [ ] "Failure triage remains always-on: summary rendering and artifact upload still run under `if: ${{ always() }}` after validation execution."
- [ ] "Parity intent is explicit and test-locked: workflow contract tests fail if `yanoteCheck` invocation disappears or direct CLI-only validation returns."
- [ ] "Java 21 baseline enforcement remains present in required checks while gap wiring is corrected."

## Files

- `.github/workflows/yanote-ci.yml`
- `scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `scripts/ci/run-yanote-gradle-check.sh`
- `scripts/ci/collect-yanote-artifacts.sh`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
