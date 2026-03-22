---
estimated_steps: 8
estimated_files: 10
skills_used:
  - asyncapi-design
---

# T02: Validate AsyncAPI headers against retained evidence and tighten diagnostics

**Slice:** S02 — Kafka Header Evidence And AsyncAPI Header Verification
**Milestone:** M009

## Description

Use the retained Kafka headers to validate AsyncAPI header contracts, narrow the current `unverifiable-headers` story to genuinely unsupported cases, and expose typed header diagnostics in async report and CLI surfaces.

## Steps

1. Extend AsyncAPI message-contract loading to preserve header schema metadata needed for validation.
2. Decide which retained header shapes are verifiable vs genuinely unsupported.
3. Validate retained headers during async schema conformance evaluation.
4. Surface missing, invalid, unsupported, and redacted/unavailable header outcomes as distinct diagnostics where appropriate.
5. Reflect the richer diagnostics in async report and CLI surfaces.
6. Update tests for async schema conformance, report, and CLI behavior.
7. Re-run the metadata propagation and async acceptance proof scripts.
8. Confirm unsupported cases still fail closed or remain explicit instead of silently passing.

## Must-Haves

- [ ] Async header validation uses retained evidence instead of one broad unverifiable bucket.
- [ ] Unsupported header encodings remain explicit and truthful.
- [ ] Async report/CLI outputs surface typed header truth without regressing payload semantics.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`

## Observability Impact

- Signals added/changed: typed async header diagnostics and narrower `unverifiable-headers` usage.
- How a future agent inspects this: async conformance/report/CLI tests plus retained async proof artifacts.
- Failure state exposed: header-missing, header-invalid, redacted/unavailable, and truly unsupported header-validation cases become distinct.

## Inputs

- `yanote-js/src/spec/asyncapi.ts` — current AsyncAPI message-contract loader.
- `yanote-js/src/coverage/asyncSchemaConformance.ts` — current async payload/header semantic evaluator.
- `yanote-js/src/report/asyncReport.ts` — public async report surface.
- `yanote-js/src/cli.async-report.test.ts` — CLI expectations for async diagnostics.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — retained metadata propagation proof.
- `scripts/ci/verify-m005-s02-async-acceptance.sh` — retained end-to-end async acceptance proof.

## Expected Output

- `yanote-js/src/spec/asyncapi.ts` — header-validation-ready contract metadata.
- `yanote-js/src/coverage/asyncSchemaConformance.ts` — retained-header validation and typed diagnostics.
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts` — validation behavior for retained headers.
- `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts` — typed missing/invalid/unsupported header diagnostics.
- `yanote-js/src/report/asyncReport.ts` — async report support for richer header diagnostics.
- `yanote-js/src/report/asyncReport.test.ts` — report expectations for header drift.
- `yanote-js/src/report/asyncReport.contract.test.ts` — contract-level async report proof.
- `yanote-js/src/cli.async-report.test.ts` — CLI expectations for header diagnostics.
- `yanote-js/src/cli.async-report.contract.test.ts` — CLI contract proof for header-validation outcomes.
- `scripts/ci/verify-m005-s02-async-acceptance.sh` — retained live async acceptance proof with header truth.
