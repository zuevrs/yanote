---
estimated_steps: 4
estimated_files: 6
---

# T01: Define the Kafka-oriented async identity and fixture contract

**Slice:** S01 — AsyncAPI Contract Ingestion And Canonical Identity
**Milestone:** M003

## Description

Replace the current shallow AsyncAPI identity assumption with one Kafka-oriented async contract surface, plus fixture coverage for equivalent v2/v3 operations and explicit invalid/unsupported cases.

## Steps

1. Audit the current `OperationKey` and semantic diagnostic shapes to identify what must change for Kafka-oriented async identities and async-context diagnostics.
2. Update the type/diagnostic surface so the primary async identity can represent channel + `send`/`receive`, while associated message-contract metadata has an explicit home instead of being smuggled into string keys.
3. Expand the AsyncAPI fixture corpus with invalid and unsupported examples that will force the implementation to surface fail-closed diagnostics.
4. Tighten the existing AsyncAPI tests so they describe the new canonical contract instead of only checking shallow action/channel extraction.

## Must-Haves

- [ ] The canonical async identity is framed around the Kafka runtime domain, not around `kind:"asyncapi"` as a document-format label.
- [ ] The fixture corpus covers equivalent v2/v3 happy paths plus at least one invalid and one unsupported case.
- [ ] Async diagnostics have a structured place to carry channel/action/message/version or protocol context where relevant.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/semantics.diagnostics.test.ts`
- The updated fixture/test surface makes the current shallow loader insufficient until T02 lands.

## Inputs

- `yanote-js/src/model/operationKey.ts` — current operation-key union and serialization seam.
- `yanote-js/src/spec/diagnostics.ts` — current HTTP-centric diagnostic vocabulary.
- `yanote-js/src/spec/asyncapi.test.ts` — current shallow AsyncAPI expectations.
- `yanote-js/test/fixtures/asyncapi/v2.yaml` — current v2 happy-path fixture.
- `yanote-js/test/fixtures/asyncapi/v3.yaml` — current v3 happy-path fixture.

## Expected Output

- `yanote-js/src/model/operationKey.ts` — Kafka-oriented async identity shape and stable serialization surface.
- `yanote-js/src/spec/diagnostics.ts` — generalized semantic diagnostics capable of async-context failure reporting.
- `yanote-js/test/fixtures/asyncapi/invalid.yaml` — invalid AsyncAPI fixture for fail-closed semantics.
- `yanote-js/test/fixtures/asyncapi/unsupported-rabbitmq.yaml` — unsupported non-Kafka fixture that pins the first async scope boundary.
- `yanote-js/src/spec/asyncapi.test.ts` — contract tests describing the intended canonical async identity surface.
