---
estimated_steps: 4
estimated_files: 9
skills_used:
  - debug-like-expert
  - vitest
---

# T01: Retain Kafka binding declarations and emit a JSON support matrix without identity drift

**Slice:** S03 — Kafka binding support matrix without false green
**Milestone:** M014

## Description

Extend the canonical Kafka AsyncAPI contract model and report DTO so binding truth comes from one honest source. Capture only the M014-approved Kafka binding fields, classify them as supported vs declared-only vs deferred, and publish that classification as an additive `bindingSupport` JSON surface without changing canonical operation identity or legacy async coverage math.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| AsyncAPI parser output plus canonical contract/report schema wiring | Keep binding extraction additive, reject malformed supported-topic declarations, and never synthesize supported coverage from missing metadata. | Treat JSON matrix publication as blocked and keep existing async report surfaces unchanged until focused spec/report tests pass. | Unsupported or malformed binding shapes must classify deterministically as invalid, declared-only, or deferred instead of silently disappearing or rewriting operation identity. |

## Load Profile

- **Shared resources**: Parser-normalized operation contracts, deterministic JSON ordering, and strict async report schema validation.
- **Per-operation cost**: Classify a fixed binding family set once per operation/message and emit one additive binding-support row plus summary counters.
- **10x breakpoint**: Large specs increase matrix row count and normalization cost before runtime analysis changes; determinism tests should catch drift early.

## Negative Tests

- **Malformed inputs**: Empty or non-string `channel.bindings.kafka.topic` values, unexpected binding object shapes, and message-level schema-registry fields with incomplete metadata.
- **Error paths**: Specs that declare only deferred or declared-only bindings must still emit explicit matrix rows without changing status or coverage numerators.
- **Boundary conditions**: Operations with no bindings, multi-message operations with message-level binding metadata, and topic values that differ from channel address while canonical operation keys stay unchanged.

## Steps

1. Extend `yanote-js/src/model/operationKey.ts` and `yanote-js/src/spec/asyncapi.ts` so Kafka contracts retain additive binding-support metadata, treat `channel.bindings.kafka.topic` as supported metadata only, and never let bindings rewrite `kafka <action> <channel>` keys.
2. Add `yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml` plus `yanote-js/src/spec/asyncapi.bindings.test.ts` to pin supported, declared-only, deferred, malformed-topic, and no-regression extraction behavior.
3. Widen `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncSchema.ts`, and `yanote-js/src/report/asyncNormalize.ts` with an additive `bindingSupport` summary and per-operation rows sourced from canonical contracts.
4. Add `yanote-js/src/report/asyncReport.bindings.contract.test.ts` and widen `yanote-js/src/report/writeAsyncReport.determinism.test.ts` so the new JSON contract stays strict, deterministic, and coverage-neutral.

## Must-Haves

- [ ] Canonical Kafka contracts carry explicit support-class info for supported, declared-only, and deferred binding fields without changing operation keys or legacy async coverage numbers.
- [ ] `yanote-async-report.json` exposes a strict additive `bindingSupport` section with summary counts and per-operation rows sourced from canonical contracts.
- [ ] Focused spec/report tests prove malformed-topic declarations fail closed and declaration-only/deferred fields never appear as covered semantics.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.bindings.test.ts src/report/asyncReport.bindings.contract.test.ts src/report/writeAsyncReport.determinism.test.ts`
- JSON report assertions prove canonical `kafka <action> <channel>` identity, unchanged legacy coverage numerators, and explicit supported/declared-only/deferred binding rows.

## Observability Impact

- Signals added/changed: `yanote-async-report.json` gains an additive `bindingSupport` summary and per-operation matrix.
- How a future agent inspects this: rerun `src/spec/asyncapi.bindings.test.ts`, `src/report/asyncReport.bindings.contract.test.ts`, and `src/report/writeAsyncReport.determinism.test.ts`, then inspect the written JSON artifact.
- Failure state exposed: malformed-topic extraction, schema drift, or coverage-math regression fails focused tests with the offending binding family or field name.

## Inputs

- `yanote-js/src/model/operationKey.ts` — canonical async contract types that must remain identity-stable.
- `yanote-js/src/spec/asyncapi.ts` — AsyncAPI extractor that currently ignores Kafka binding semantics.
- `yanote-js/src/spec/asyncapi.test.ts` — existing extractor guardrails to keep aligned while widening the contract model.
- `yanote-js/src/report/asyncReport.ts` — canonical async JSON builder to widen additively.
- `yanote-js/src/report/asyncSchema.ts` — strict report schema that must stay `additionalProperties: false`.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic ordering surface for widened async artifacts.

## Expected Output

- `yanote-js/src/model/operationKey.ts` — additive binding-support metadata types on canonical Kafka contracts.
- `yanote-js/src/spec/asyncapi.ts` — Kafka binding extraction/classification that preserves canonical operation identity.
- `yanote-js/src/spec/asyncapi.bindings.test.ts` — focused extraction tests for supported, declared-only, deferred, and malformed-topic cases.
- `yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml` — AsyncAPI fixture covering the binding families S03 must classify.
- `yanote-js/src/report/asyncReport.ts` — additive `bindingSupport` builder sourced from canonical contracts.
- `yanote-js/src/report/asyncSchema.ts` — strict JSON schema widened for the binding-support matrix.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic ordering for the widened binding-support section.
- `yanote-js/src/report/asyncReport.bindings.contract.test.ts` — report-contract assertions for the new JSON surface.
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts` — determinism coverage proving the widened report stays byte-stable.
