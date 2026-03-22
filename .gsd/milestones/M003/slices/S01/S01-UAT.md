# S01: AsyncAPI Contract Ingestion And Canonical Identity — UAT

**Milestone:** M003
**Written:** 2026-03-13 16:57:22 +0300

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S01 is a contract slice with no live broker/runtime requirement; the trustworthy acceptance surface is the deterministic test proof over AsyncAPI fixtures and HTTP regression checks.

## Preconditions

- Run from the repo root in a clone with `npm` dependencies installed for `yanote-js`.
- No Kafka broker, Spring service, or browser session is required.
- Keep the fixture corpus in `yanote-js/test/fixtures/asyncapi/*` unchanged while running acceptance so the proof remains comparable.

## Smoke Test

Run the slice proof command:

```bash
npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts
```

Expected: all 5 test files pass, covering 21 tests, with no failed assertions.

## Test Cases

### 1. Canonical AsyncAPI v2/v3 parity

1. Run `npm -C yanote-js test -- src/spec/asyncapi.parity.test.ts`.
2. Inspect the passing assertions for `kafka send users.signedup` and `kafka receive users.deleted`.
3. **Expected:** equivalent AsyncAPI v2 and v3 fixtures normalize into the same canonical Kafka operation keys, in the same order, with the same adjacent message-contract metadata.

### 2. Explicit async failure paths

1. Run `npm -C yanote-js test -- src/spec/asyncapi.test.ts`.
2. Confirm passing cases for:
   - semantic invalidity on `invalid.yaml`
   - unsupported Kafka-scope boundary on `unsupported-rabbitmq.yaml`
   - parser-boundary rejection on `unsupported-version.yaml`
   - parser-boundary rejection on `unresolved-message-ref.yaml`
   - parser-boundary rejection on `malformed-channel-ref.yaml`
3. **Expected:** parsed-but-invalid Kafka contracts surface structured async diagnostics, while unsupported version and broken `$ref` inputs fail as invalid-document parser rejections.

### 3. Discovery and HTTP compatibility baseline

1. Run `npm -C yanote-js test -- src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts`.
2. **Expected:** AsyncAPI/OpenAPI discovery remains correct, HTTP semantic diagnostics stay deterministic, and the OpenAPI loader tests stay green after the async identity changes.

## Edge Cases

### Deterministic async bundle ordering

1. Run `npm -C yanote-js test -- src/spec/semantics.diagnostics.test.ts`.
2. Inspect the passing async determinism cases.
3. **Expected:** repeated loads of the same valid or invalid AsyncAPI fixture produce the same serialized operation order, the same `operationContractsByKey` insertion order, and the same structured diagnostics.

## Failure Signals

- The slice proof command fails in `src/spec/asyncapi.parity.test.ts`, indicating canonical ordering drift between AsyncAPI v2 and v3.
- `src/spec/asyncapi.test.ts` starts accepting unsupported protocol/version or broken `$ref` inputs silently.
- `src/spec/semantics.diagnostics.test.ts` fails repeated-load assertions, indicating non-deterministic async bundle or diagnostic ordering.
- `src/spec/openapi.test.ts` or `src/spec/discover.test.ts` fails, indicating the async identity work regressed existing HTTP/discovery behavior.

## Requirements Proved By This UAT

- R037 — Kafka-oriented AsyncAPI specs ingest through a deterministic loader boundary with explicit invalid/unsupported outcomes.
- R038 — Supported AsyncAPI v2/v3 contracts normalize into one canonical async operation identity.
- R046 — The first async slice is protected by a repeatable proof command instead of ad hoc spot checks.

## Not Proven By This UAT

- Live Kafka producer/consumer evidence capture.
- Async coverage computation over runtime evidence and unmatched/mismatched async evidence diagnostics.
- Async report/gate output surfaces or payload-schema validation.

## Notes for Tester

- Prefer the single slice proof command first; only drop to the narrower commands above when a failure needs localization.
- If parser-boundary assertions fail after an `@asyncapi/parser` upgrade, inspect the new error text before changing the broader semantic boundary. The intended split is parser rejection for unsupported version/broken `$ref`, semantic diagnostics for parsed Kafka-scoped invalidity.
