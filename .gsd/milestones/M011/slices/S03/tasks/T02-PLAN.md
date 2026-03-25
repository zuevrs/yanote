---
estimated_steps: 3
estimated_files: 4
skills_used:
  - openapi-specification-v3.2
  - vitest
---

# T02: Prefer the most-specific declared media type during payload matching

**Slice:** S03 — Format Policy And Media Specificity Truth
**Milestone:** M011

## Description

Fix media-type contract selection so broader JSON wildcards stop shadowing more specific siblings. This task changes matching-time ranking only; declaration extraction and report ordering must remain stable.

## Steps

1. Replace the current first-match media selection in `yanote-js/src/coverage/httpPayloadConformance.ts` with specificity ranking that prefers exact media types over structured suffix wildcards and broader wildcards.
2. Add a focused media-specificity JSONL fixture that exercises a competing `application/*+json` vs `application/problem+json` declaration from the shared S03 OpenAPI bundle.
3. Expand `yanote-js/src/coverage/httpPayloadConformance.test.ts` and `yanote-js/src/spec/openapi.test.ts` so the specific declaration wins during evaluation while extracted declared-media ordering stays sorted and unchanged.

## Must-Haves

- [ ] Exact/specific media contracts beat wildcard siblings deterministically at evaluation time.
- [ ] Matching-time specificity changes do not reorder declared media lists in report output.
- [ ] The regression is covered by a fixture-backed analyzer test.

## Verification

- Focused analyzer/openapi tests prove media-specific contract selection without changing normalized declaration ordering.
- `npm -C yanote-js test -- src/coverage/httpPayloadConformance.test.ts src/spec/openapi.test.ts`

## Inputs

- `yanote-js/src/coverage/httpPayloadConformance.ts` — current evaluator that selects the first matching media type.
- `yanote-js/src/coverage/httpPayloadConformance.test.ts` — existing wildcard-media regression coverage.
- `yanote-js/src/spec/openapi.test.ts` — extraction-order regression suite that should remain stable.
- `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml` — shared S03 OpenAPI fixture bundle from T01.
- `yanote-js/test/fixtures/events/http-payload-valid-format.fixture.jsonl` — baseline green fixture from T01 for comparison.

## Expected Output

- `yanote-js/src/coverage/httpPayloadConformance.ts` — specificity-ranked media matching.
- `yanote-js/src/coverage/httpPayloadConformance.test.ts` — regression coverage for competing media declarations.
- `yanote-js/src/spec/openapi.test.ts` — proof that extracted declaration ordering remains stable.
- `yanote-js/test/fixtures/events/http-payload-media-specificity.fixture.jsonl` — competing-media evidence fixture.
