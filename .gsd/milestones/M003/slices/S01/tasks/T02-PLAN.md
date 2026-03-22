---
estimated_steps: 5
estimated_files: 4
---

# T02: Implement deterministic AsyncAPI semantics loading and discovery normalization

**Slice:** S01 — AsyncAPI Contract Ingestion And Canonical Identity
**Milestone:** M003

## Description

Turn the parser/discovery path into a real async semantics boundary: one canonical bundle from supported AsyncAPI inputs, deterministic diagnostics from invalid or unsupported ones, and no regression in OpenAPI discovery.

## Steps

1. Refactor `yanote-js/src/spec/asyncapi.ts` so it produces an async semantics bundle rather than a bare operation array or raw thrown parser strings.
2. Normalize AsyncAPI v2 `publish/subscribe` and v3 `action: send|receive` shapes into one Kafka-oriented identity model with message-contract references carried alongside the base operation identity.
3. Translate parser and normalization failures into structured diagnostics with deterministic ordering and a clear `hasInvalid` signal.
4. Tighten `discover.ts` / `discover.test.ts` so AsyncAPI files are recognized reliably without weakening existing OpenAPI detection.
5. Keep the implementation non-breaking for future S02/S03 consumers by preserving a clean seam between parsing, normalization, and downstream coverage/report logic.

## Must-Haves

- [ ] Supported v2/v3 fixtures normalize into the same canonical async semantics bundle.
- [ ] Invalid or unsupported AsyncAPI inputs return structured diagnostics instead of raw thrown strings.
- [ ] OpenAPI-only discovery behavior remains green while AsyncAPI discovery becomes more explicit.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/discover.test.ts`
- `npm -C yanote-js test -- src/spec/openapi.test.ts`

## Observability Impact

- Signals added/changed: async semantic diagnostics now expose parser/normalization failures with structured context instead of collapsing into a generic exception.
- How a future agent inspects this: run the targeted spec tests and inspect the returned async semantics bundle and diagnostics in `src/spec/asyncapi.test.ts` failures.
- Failure state exposed: unsupported version/protocol, unresolved channel/message refs, malformed document structure, or discovery misclassification.

## Inputs

- `yanote-js/src/spec/asyncapi.ts` — current shallow parser wrapper.
- `yanote-js/src/spec/discover.ts` — current content-sniff and filename detection seam.
- `.gsd/milestones/M003/slices/S01/tasks/T01-PLAN.md` — canonical identity and fixture contract decided in T01.

## Expected Output

- `yanote-js/src/spec/asyncapi.ts` — deterministic async semantics loader for supported Kafka-oriented AsyncAPI contracts.
- `yanote-js/src/spec/discover.ts` — explicit AsyncAPI detection that stays compatible with existing OpenAPI discovery.
- `yanote-js/src/spec/discover.test.ts` — regression protection for mixed-spec discovery behavior.
- `yanote-js/src/spec/asyncapi.test.ts` — loader tests that assert normalized v2/v3 identities and structured failure diagnostics.
