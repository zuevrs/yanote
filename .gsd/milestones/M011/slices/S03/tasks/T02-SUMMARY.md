---
id: T02
parent: S03
milestone: M011
key_files:
  - yanote-js/src/coverage/httpPayloadConformance.ts
  - yanote-js/src/coverage/httpPayloadConformance.test.ts
  - yanote-js/src/spec/openapi.test.ts
  - yanote-js/test/fixtures/events/http-payload-media-specificity.fixture.jsonl
  - .gsd/KNOWLEDGE.md
  - .gsd/DECISIONS.md
key_decisions:
  - HTTP payload media specificity is resolved only at evaluation time; extracted declared-media ordering remains lexicographically stable for report/contract surfaces.
  - When multiple declared media types match, choose deterministically by specificity (`exact` > exact subtype with broader type > structured-suffix wildcard > broader wildcard), then break ties by media-type sort order.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T17:51:03.037Z
blocker_discovered: false
---

# T02: Prefer most-specific HTTP payload media contracts during matching without reordering declarations

**Prefer most-specific HTTP payload media contracts during matching without reordering declarations**

## What Happened

Updated `yanote-js/src/coverage/httpPayloadConformance.ts` so payload matching no longer stops at the first declared media match. The evaluator now scores all matching declared media types and chooses the most specific contract, which lets `application/problem+json` beat `application/*+json` without touching the already-stable extracted declaration ordering. To prove the regression end to end, I added `yanote-js/test/fixtures/events/http-payload-media-specificity.fixture.jsonl` for the shared `/incidents` OpenAPI bundle case, then expanded `yanote-js/src/coverage/httpPayloadConformance.test.ts` to show an observed `application/problem+json` request/response pair uses the exact sibling contract during evaluation while `declaredMediaTypes` and `declaredContent` stay sorted. I also expanded `yanote-js/src/spec/openapi.test.ts` to pin that the extracted request/response media lists remain `application/*+json` then `application/problem+json`, with the specific schema still preserved in the second slot. Finally, I recorded the extraction-vs-matching rule in GSD knowledge and decisions so downstream S03 tasks keep the report-ordering boundary intact.

## Verification

Verified the task contract with `npm -C yanote-js test -- src/coverage/httpPayloadConformance.test.ts src/spec/openapi.test.ts`, which passed and proved the `/incidents` media-specificity regression plus the stable OpenAPI extraction order. Ran the slice-level Vitest stack from `S03-PLAN.md`; all listed suites passed, confirming the ranking change did not regress gate/report/CLI behavior already in tree. Ran the retained slice verifier command from the slice plan as required; it still fails with exit 127 because `scripts/ci/verify-m011-s03-format-media.sh` is a later T05 deliverable and does not exist yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/coverage/httpPayloadConformance.test.ts src/spec/openapi.test.ts` | 0 | ✅ pass | 803ms |
| 2 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 1934ms |
| 3 | `bash scripts/ci/verify-m011-s03-format-media.sh` | 127 | ❌ fail | 24ms |


## Deviations

None.

## Known Issues

`bash scripts/ci/verify-m011-s03-format-media.sh` still fails with exit 127 because the retained slice verifier script is owned by T05 and is not in the tree yet. This is expected at T02 and is not a blocker.

## Files Created/Modified

- `yanote-js/src/coverage/httpPayloadConformance.ts`
- `yanote-js/src/coverage/httpPayloadConformance.test.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/test/fixtures/events/http-payload-media-specificity.fixture.jsonl`
- `.gsd/KNOWLEDGE.md`
- `.gsd/DECISIONS.md`
