---
id: T01
parent: S01
milestone: M010
provides:
  - Additive HTTP evidence maps and compatibility key derivation across yanote-core JSONL and yanote-js parsing.
key_files:
  - yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java
  - yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java
  - yanote-js/src/model/httpEvent.ts
  - yanote-js/src/events/readJsonl.ts
  - yanote-js/src/events/readJsonl.httpEvidence.test.ts
  - .gsd/milestones/M010/slices/S01/S01-PLAN.md
key_decisions:
  - Keep `queryKeys` and `headerKeys` serialized on every HTTP event and derive them from additive query/request-header evidence when legacy arrays are absent.
patterns_established:
  - HTTP per-key evidence now uses `{ state, values[], reason }` with preserved value order, lowercase header keys, and explicit redacted/omitted markers.
observability_surfaces:
  - `EventJsonlRoundTripTest`, `readJsonl.httpEvidence.test.ts`, `RecorderWritesJsonlTest`, and `verify-s02-analysis-path.sh`
duration: 0h31m
verification_result: passed
completed_at: 2026-03-25T00:47:00+03:00
blocker_discovered: false
---

# T01: Extend the HTTP event contract and Node parser for additive evidence

**Added additive HTTP evidence maps with compatibility key derivation in the JVM contract and Node JSONL parser.**

## What Happened

I first applied the task plan’s required pre-flight fix by extending the slice verification list with an explicit diagnostic-flavored recorder test run (`--info`).

For the implementation, I expanded `HttpEvent` to carry additive `pathParams`, `queryParams`, `requestHeaders`, and `responseHeaders` maps backed by a reusable nested `ValueEvidence` contract with explicit `captured` / `redacted` / `omitted` state, optional reason, and multi-value `values[]` support. Header evidence keys now normalize to lowercase, compatibility `queryKeys` / `headerKeys` are always present, and the constructor derives those arrays from additive evidence when legacy arrays are missing.

I then updated `EventJsonlRoundTripTest` to pin the richer serialized shape, legacy compatibility behavior, and derivation of compatibility arrays from additive evidence. On the Node side, I extended `yanote-js` HTTP event types and parser normalization so additive HTTP evidence round-trips deterministically while legacy JSONL still yields stable empty compatibility arrays.

Finally, I added focused Vitest coverage in `readJsonl.httpEvidence.test.ts` for additive and legacy HTTP JSONL files. During verification I found this worktree did not have `yanote-js/node_modules`, so I ran `npm -C yanote-js ci` locally before rerunning the exact task verifier.

## Verification

Task-level verification passed with the exact required commands:
- `./gradlew :yanote-core:test --tests "dev.yanote.core.events.EventJsonlRoundTripTest"`
- `npm -C yanote-js test -- src/events/readJsonl.httpEvidence.test.ts`

I also ran the slice-level stack to record interim status on this non-final task:
- `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest"` passed, showing the additive core-contract change did not break the existing recorder proof.
- `bash scripts/docs/verify-s02-analysis-path.sh` passed, showing the existing analyzer-path regression proof still holds after the contract/parser update.
- `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh` failed with `127` because that verifier script belongs to T03 and is not created yet; this is an expected interim slice-level miss, not a blocker.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew :yanote-core:test --tests "dev.yanote.core.events.EventJsonlRoundTripTest"` | 0 | ✅ pass | 8.6s |
| 2 | `npm -C yanote-js test -- src/events/readJsonl.httpEvidence.test.ts` | 0 | ✅ pass | 0.25s |
| 3 | `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest"` | 0 | ✅ pass | 246.6s |
| 4 | `bash scripts/docs/verify-s02-analysis-path.sh` | 0 | ✅ pass | 383.4s |
| 5 | `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh` | 127 | ❌ fail | 0.0s |

## Diagnostics

Inspect additive HTTP contract behavior in:
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` for the canonical JSONL shape, legacy fallback, and compatibility-key derivation.
- `yanote-js/src/events/readJsonl.httpEvidence.test.ts` for Node normalization of additive and legacy files.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` and `bash scripts/docs/verify-s02-analysis-path.sh` for currently green downstream regression surfaces.

Failure modes now surface as explicit field assertions around evidence state/reason/value arrays and compatibility arrays instead of requiring downstream consumers to infer keys ad hoc.

## Deviations

- Added the pre-flight slice-plan verification entry `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest" --info` to satisfy the flagged diagnostic-verification gap before implementation.
- Installed `yanote-js` dependencies in this worktree with `npm -C yanote-js ci` so the required Vitest verifier could run locally.

## Known Issues

- `scripts/docs/verify-m010-s01-http-evidence-depth.sh` does not exist yet in this worktree; it is planned work for T03, so the slice-level verification stack is only partially green at the end of T01.

## Files Created/Modified

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — added additive HTTP evidence maps, reusable nested evidence types, and compatibility key derivation.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — pinned additive JSONL shape, legacy fallback behavior, and compatibility-key derivation.
- `yanote-js/src/model/httpEvent.ts` — extended the Node HTTP model with additive evidence types and normalizers.
- `yanote-js/src/events/readJsonl.ts` — normalized additive HTTP evidence and derived compatibility arrays from additive query/request-header facts.
- `yanote-js/src/events/readJsonl.httpEvidence.test.ts` — added focused Vitest coverage for additive and legacy HTTP JSONL parsing.
- `.gsd/milestones/M010/slices/S01/S01-PLAN.md` — marked T01 complete and added the required diagnostic-style verification entry.
- `.gsd/STATE.md` — advanced the next action from T01 to T02.
