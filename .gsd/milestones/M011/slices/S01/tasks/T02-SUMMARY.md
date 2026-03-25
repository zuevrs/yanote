---
id: T02
parent: S01
milestone: M011
key_files:
  - yanote-js/src/model/httpEvent.ts
  - yanote-js/src/events/readJsonl.ts
  - yanote-js/src/events/readJsonl.requestEvidence.test.ts
  - yanote-js/src/coverage/dimensions.ts
  - yanote-js/src/spec/openapi.ts
  - yanote-js/src/spec/openapi.test.ts
  - yanote-js/src/coverage/httpRequestConformance.ts
  - yanote-js/src/coverage/httpRequestConformance.test.ts
  - .gsd/KNOWLEDGE.md
  - .gsd/STATE.md
key_decisions:
  - Keep legacy `parameters` for existing coverage math and add an additive `requestParameters` contract for request-scalar/cookie semantics.
  - Derive legacy `queryKeys` and `headerKeys` only from captured retained evidence when the old arrays are absent; redacted and omitted evidence never count as key presence.
  - Treat repeated retained values and unsupported style/schema contracts as explicit `unsupported` request-conformance truth instead of coercing them into valid or invalid scalar results.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T14:32:53.303Z
blocker_discovered: false
---

# T02: Normalize retained HTTP request evidence in yanote-js and add first-scalar request conformance analysis

**Normalize retained HTTP request evidence in yanote-js and add first-scalar request conformance analysis**

## What Happened

I extended the Node HTTP event model with additive `pathParams`, `queryParams`, `requestHeaders`, and `cookies` request-evidence maps that mirror the recorder’s tri-state `captured` / `redacted` / `omitted` contract and its `sensitive` / `oversized` / `unsupported` / `unavailable` reasons. The JSONL reader now normalizes those maps backward-compatibly, lowercases only request-header evidence keys, and derives legacy `queryKeys` / `headerKeys` from captured retained evidence only when the old arrays are absent so legacy coverage math stays stable.

On the OpenAPI side, I kept the legacy `parameters` contract for existing coverage usage and added an additive `requestParameters` contract that explicitly carries path/query/header/cookie request parameters plus first-scalar support metadata. The extractor now records cookie parameters instead of silently dropping them, captures style/explode defaults, marks unsupported style/schema cases explicitly, and preserves the existing payload/body contract behavior.

I then added `computeHttpRequestConformance()` as the first request-conformance analyzer for retained scalar evidence. It resolves observed HTTP events to canonical operations, reads the retained request evidence honestly, and classifies supported scalar observations as `captured-valid` or `captured-invalid` while treating recorder-redacted, recorder-omitted, repeated-value, and unsupported-style/schema paths as explicit non-green truth instead of guessing. Focused Vitest coverage now pins backward-compatible ingestion, cookie/scalar contract extraction, and deterministic per-parameter request-conformance diagnostics, and I recorded the non-obvious Vitest missing-file behavior in `.gsd/KNOWLEDGE.md` so later tasks do not over-credit the slice-level Node verifier.

## Verification

Verified the T02 task contract directly with `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts`, which passed and proved backward-compatible request-evidence ingestion, additive cookie/scalar OpenAPI extraction, and first-scalar truth classification. Re-ran adjacent legacy reader/coverage/payload suites with `npm -C yanote-js test -- src/events/readJsonl.test.ts src/events/readJsonl.parameters.test.ts src/coverage/parameterCoverage.test.ts src/coverage/coverage.test.ts src/coverage/httpPayloadConformance.test.ts`, which passed and confirmed the additive request-evidence work did not regress the legacy coverage and payload paths.

Per the slice-level verification stack, the focused Java recorder round-trip/capture verifier still passes, and the slice-level Node verifier command now passes as well; however, the shell proof command `bash scripts/ci/verify-m011-s01-request-evidence.sh` still fails because the T04 end-to-end verifier script does not exist yet. That remaining red check is expected at T02 because report/CLI/proof wiring is owned by later tasks in the slice.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts` | 0 | ✅ pass | 1596ms |
| 2 | `./gradlew :yanote-core:test --tests 'dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest' :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest'` | 0 | ✅ pass | 1785ms |
| 3 | `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts` | 0 | ✅ pass | 2119ms |
| 4 | `npm -C yanote-js test -- src/events/readJsonl.test.ts src/events/readJsonl.parameters.test.ts src/coverage/parameterCoverage.test.ts src/coverage/coverage.test.ts src/coverage/httpPayloadConformance.test.ts` | 0 | ✅ pass | 1763ms |
| 5 | `bash scripts/ci/verify-m011-s01-request-evidence.sh` | 127 | ❌ fail | 8ms |


## Deviations

I represented the new scalar/cookie semantics on an additive `requestParameters` contract instead of widening the legacy `parameters` list itself, so existing parameter-coverage numerators and hand-authored test fixtures remain stable while T03 can build on the richer surface. I also made `requestParameters` optional at the type level so older manually-constructed `HttpOperationContract` fixtures outside this task keep compiling against the additive contract.

## Known Issues

`bash scripts/ci/verify-m011-s01-request-evidence.sh` still fails with `No such file or directory` because the focused end-to-end proof/verifier is planned for T04 and has not been created yet.

## Files Created/Modified

- `yanote-js/src/model/httpEvent.ts`
- `yanote-js/src/events/readJsonl.ts`
- `yanote-js/src/events/readJsonl.requestEvidence.test.ts`
- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/coverage/httpRequestConformance.ts`
- `yanote-js/src/coverage/httpRequestConformance.test.ts`
- `.gsd/KNOWLEDGE.md`
- `.gsd/STATE.md`
