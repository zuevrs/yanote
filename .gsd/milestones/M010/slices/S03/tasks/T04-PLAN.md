---
estimated_steps: 4
estimated_files: 7
skills_used:
  - bash-scripting
  - review
  - test
---

# T04: Refresh async boundary docs and verifier contracts for header support

**Slice:** S03 — Async Kafka Header Validation As A Supported Core Surface
**Milestone:** M010

## Description

Close the public-contract gap by updating docs, support guidance, and verifier scripts together. After this task, the async boundary language and the scripts that enforce it should describe Kafka header diagnostics as supported public truth while keeping the async surface narrow and separate from HTTP reporting.

## Steps

1. Update `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` so they describe missing, invalid, unavailable, and unverifiable Kafka header diagnostics as supported on the proven Kafka-first path.
2. Keep the boundary explicit while editing: preserve Kafka-only, Spring-Kafka-first, separate `async-report`, and no broker-agnostic or combined-report promise language.
3. Update `scripts/docs/verify-m005-s01-async-path.sh` and `scripts/docs/verify-m005-s01-async-boundaries.sh` so the verifier stack asserts the new wording and retained artifact expectations instead of the stale under-claim.
4. Refresh `scripts/ci/verify-m005-s02-async-acceptance.sh` so the acceptance wrapper still composes the updated boundary/docs verifiers with the live Kafka proof stack.

## Must-Haves

- [ ] No stale “retained Kafka headers remain unverifiable” public under-claim remains in the supported async boundary surfaces.
- [ ] Updated docs still keep the async surface Kafka-only, truthful, and separate from HTTP reporting.
- [ ] The M005 verifier stack passes against the updated wording and retained artifact contract.

## Verification

- `bash scripts/docs/verify-m005-s01-async-path.sh`
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`

## Observability Impact

- Signals added/changed: the public async docs and support intake now name the supported header diagnostics and the retained proof artifacts that demonstrate them.
- How a future agent inspects this: run the three verifier commands above and read the updated docs/support surfaces when triaging async proof failures.
- Failure state exposed: verifier failures should show exactly which wording or artifact expectation drifted from the supported async boundary.

## Inputs

- `docs/guides/asyncapi-kafka.md` — current async guide that still under-claims supported header truth.
- `docs/release-and-support.md` — public release/support boundary wording for the async surface.
- `docs/requirements.md` — requirements wording that must align with the supported header boundary.
- `SUPPORT.md` — support intake guidance that should mention the retained header-drift proof artifacts.
- `scripts/docs/verify-m005-s01-async-path.sh` — docs-path verifier enforcing the current async guide contract.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — docs/support boundary verifier enforcing stale under-claim wording.
- `scripts/ci/verify-m005-s02-async-acceptance.sh` — wrapper that must still compose the updated verifier stack with the live proof scripts.

## Expected Output

- `docs/guides/asyncapi-kafka.md` — async guide updated to describe supported Kafka header diagnostics and retained proof artifacts truthfully.
- `docs/release-and-support.md` — release/support boundary wording aligned with the supported async header surface.
- `docs/requirements.md` — requirements wording aligned with the supported async header surface.
- `SUPPORT.md` — support guidance updated for header-drift intake and retained artifact expectations.
- `scripts/docs/verify-m005-s01-async-path.sh` — path verifier updated to enforce the new async guide wording.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — boundary verifier updated to enforce the new support/release/requirements wording.
- `scripts/ci/verify-m005-s02-async-acceptance.sh` — acceptance wrapper kept green against the updated verifier stack.
