---
estimated_steps: 8
estimated_files: 7
skills_used:
  - best-practices
---

# T01: Normalize OpenAPI payload schema/media handling and recorder-policy inputs

**Slice:** S04 — HTTP and OpenAPI Recorder-Policy And Schema Fidelity Hardening
**Milestone:** M009

## Description

Feed recorder provenance into the HTTP analyzer path, tighten OpenAPI schema/media-type normalization for payload validation, and expand fixture coverage so recorder-policy omission no longer masquerades as plain semantic absence.

## Steps

1. Identify current HTTP payload cases where missing evidence is inferred instead of read from provenance.
2. Decide which recorder provenance states should remain semantic failures vs recorder-policy diagnostics.
3. Add or tighten OpenAPI schema normalization before validation.
4. Expand HTTP payload fixtures for provenance-aware omission and broader supported media/schema shapes.
5. Update HTTP payload conformance tests for new distinctions.
6. Re-run Spring MVC recorder tests to confirm provenance still lands in JSONL.
7. Keep unsupported schema/media cases explicit and fail closed.
8. Record any still-deferred schema shapes rather than silently widening support.

## Must-Haves

- [ ] HTTP analyzer reads recorder provenance instead of guessing on omitted payloads.
- [ ] Supported OpenAPI schema/media shapes expand deterministically.
- [ ] Unsupported cases remain explicit and do not silently pass.

## Verification

- `./gradlew --no-daemon :yanote-recorder-spring-mvc:test`
- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts`

## Observability Impact

- Signals added/changed: provenance-aware HTTP payload diagnostics and clearer schema/media normalization failures.
- How a future agent inspects this: Spring MVC recorder tests plus OpenAPI/payload-conformance suites.
- Failure state exposed: recorder-policy omission, media mismatch, unsupported schema, and true invalid-body drift become easier to separate.

## Inputs

- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java` — recorder provenance source for HTTP payload evidence.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` — Spring MVC recorder proof.
- `yanote-js/src/spec/openapi.ts` — current OpenAPI contract loader.
- `yanote-js/src/coverage/httpPayloadConformance.ts` — current HTTP payload semantic evaluator.
- `yanote-js/test/fixtures/openapi/http-payload.yaml` — shared HTTP payload fixture surface.

## Expected Output

- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java` — provenance-aware omission signals that the analyzer can trust.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` — recorder proof for provenance-bearing HTTP events.
- `yanote-js/src/spec/openapi.ts` — tightened schema/media normalization.
- `yanote-js/src/spec/openapi.test.ts` — loader proof for broader supported shapes.
- `yanote-js/src/coverage/httpPayloadConformance.ts` — provenance-aware payload semantics.
- `yanote-js/src/coverage/httpPayloadConformance.test.ts` — semantics proof for recorder-policy omission vs semantic drift.
- `yanote-js/test/fixtures/openapi/http-payload.yaml` — fixture coverage for the stronger boundary.
