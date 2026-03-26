---
id: T02
parent: S01
milestone: M013
key_files:
  - yanote-js/src/cli.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/schema.ts
  - yanote-js/src/report/normalize.ts
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncSchema.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/cli.remote-spec.contract.test.ts
  - yanote-js/src/report/report.remote-spec.contract.test.ts
  - yanote-js/src/report/asyncReport.remote-spec.contract.test.ts
key_decisions:
  - Reports and CLI summaries now publish one shared `specSource { kind, reference }` contract sourced directly from `ResolvedSpecSource.provenance` instead of recomputing provenance per surface.
  - CLI machine summaries expose sanitized provenance as `spec_source_kind` and `spec_source_ref`, preserving existing coverage and diagnostic tokens unchanged.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T00:05:52.069Z
blocker_discovered: false
---

# T02: Added sanitized spec-source provenance to CLI summaries and retained HTTP/async reports

**Added sanitized spec-source provenance to CLI summaries and retained HTTP/async reports**

## What Happened

Threaded `ResolvedSpecSource.provenance` through the HTTP and async report builders so both canonical JSON artifacts now carry a deterministic top-level `specSource` block with `kind` and sanitized `reference`, then updated the report normalizers and JSON schemas to validate the additive field without changing existing coverage math or diagnostic ordering. In `yanote-js/src/cli.ts`, I surfaced the same canonical truth in both human summaries and machine summary lines via `spec_source_kind` / `spec_source_ref`, keeping remote URLs sanitized because the values come directly from the resolver introduced in T01.

I expanded the real CLI remote-spec contract to assert successful local-file, local-directory, and remote-url runs persist the expected `specSource` in retained artifacts and publish the matching sanitized summary tokens. I also added focused HTTP and async report contract tests that resolve real local and localhost-remote inputs, reuse the resolver provenance, validate the resulting report schemas, and pin deterministic serialized `specSource` ordering across all three supported source kinds.

During regression verification, the existing CLI summary contract exposed a real bug in `report.ts`: report status resolution was inspecting raw governance failures as if they already had serialized `class` fields, so semantic payload drift could remain `ok`. I fixed `resolveReportStatus` to evaluate `GovernanceFailure.failureClass` directly, then reran the summary contracts and the remote-spec verifier stack to confirm the summaries still report semantic partial states correctly while publishing the new provenance fields.

## Verification

Passed the task verifier `npm -C yanote-js test -- src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/cli.remote-spec.contract.test.ts`, which now proves schema-valid sanitized provenance on HTTP reports, async reports, and real CLI local/remote runs. Added an extra regression check `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.async-report.contract.test.ts` because this task changed summary text and machine tokens; it caught and then verified the fix for semantic-status handling in report summaries. The slice-level JavaScript verifier `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts` also passed. The remaining slice verifiers are still not ready at T02: `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'` fails because that Gradle contract target has not been added yet, and `bash scripts/ci/verify-m013-s01-remote-spec.sh` still fails because the retained-proof script does not exist until T03.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/cli.remote-spec.contract.test.ts` | 0 | ✅ pass | 2119ms |
| 2 | `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.async-report.contract.test.ts` | 0 | ✅ pass | 2334ms |
| 3 | `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts` | 0 | ✅ pass | 1410ms |
| 4 | `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'` | 1 | ❌ fail | 1747ms |
| 5 | `bash scripts/ci/verify-m013-s01-remote-spec.sh` | 127 | ❌ fail | 3ms |


## Deviations

None.

## Known Issues

Slice-level Gradle and retained-proof verification remain incomplete until T03 adds `*YanoteRemoteSpecContractTest` and `scripts/ci/verify-m013-s01-remote-spec.sh`; the corresponding slice checks still fail or are missing in this task.

## Files Created/Modified

- `yanote-js/src/cli.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncSchema.ts`
- `yanote-js/src/report/asyncNormalize.ts`
- `yanote-js/src/cli.remote-spec.contract.test.ts`
- `yanote-js/src/report/report.remote-spec.contract.test.ts`
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts`
