---
id: S01
parent: M003
milestone: M003
provides:
  - A Kafka-oriented AsyncAPI ingestion surface with canonical async identities, explicit message-contract adjacency, deterministic diagnostics, and one repeatable proof command.
requires: []
affects:
  - M003/S02
  - M003/S03
  - M004/S01
key_files:
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/spec/diagnostics.ts
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/spec/asyncapi.test.ts
  - yanote-js/src/spec/asyncapi.parity.test.ts
  - yanote-js/src/spec/semantics.diagnostics.test.ts
  - .gsd/milestones/M003/slices/S01/S01-UAT.md
key_decisions:
  - Use canonical Kafka runtime identities (`kafka <action> <channel>`) instead of `kind:"asyncapi"`, keep message-contract references adjacent to the operation key, and preserve a parser-vs-semantics failure split.
patterns_established:
  - For async contract slices, harden the contract first with fixtures/tests, then land the loader, then close with one proof command that exercises parity, failure paths, discovery, and HTTP compatibility together.
observability_surfaces:
  - npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts
  - yanote-js/src/spec/asyncapi.test.ts
  - yanote-js/src/spec/asyncapi.parity.test.ts
  - yanote-js/src/spec/semantics.diagnostics.test.ts
  - yanote-js/test/fixtures/asyncapi/*
drill_down_paths:
  - .gsd/milestones/M003/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T03-SUMMARY.md
duration: 75m
verification_result: passed
completed_at: 2026-03-13 16:57:22 +0300
---

# S01: AsyncAPI Contract Ingestion And Canonical Identity

**Shipped a deterministic Kafka-first AsyncAPI contract surface that normalizes v2/v3 specs into the same canonical async identities, fails closed on invalid or unsupported input, and stays green against the existing HTTP baseline under one proof command.**

## What Happened

T01 established the contract boundary. The async identity stopped being `kind:"asyncapi"` and became a Kafka runtime identity (`kafka <action> <channel>`), message-contract metadata gained an explicit adjacent home instead of leaking into string keys, and async diagnostics were generalized to carry runtime, version, protocol, channel, action, and message context. That work also expanded the fixture corpus so invalid and unsupported AsyncAPI inputs were no longer vague edge cases but explicit proof surfaces.

T02 replaced the shallow loader with a real semantics bundle. `loadAsyncApiSemanticsBundle()` now parses supported AsyncAPI documents once, normalizes v2 `publish`/`subscribe` and v3 `send`/`receive` into the same Kafka-oriented operation surface, preserves adjacent message-contract metadata in `operationContractsByKey`, and emits structured invalid diagnostics when the contract is unsupported or semantically malformed. The public `loadAsyncApiOperations()` boundary stays fail-closed and rejects invalid async contracts instead of returning partial operations.

T03 finished the slice by tightening proof rather than adding more loader behavior. The parity tests now assert identical canonical key ordering for equivalent v2/v3 fixtures, the failure-path suite covers parser-boundary version/ref errors plus semantic invalidity and protocol scope boundaries, and the generalized diagnostics tests now prove async bundle determinism on repeated loads. The slice closed on one rerunnable command that also keeps discovery classification and the existing OpenAPI tests green.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts`
- `git diff --check`

The passing proof command covers:

- canonical Kafka identity serialization and v2/v3 parity
- parser-boundary failures for unsupported AsyncAPI version and broken `$ref` inputs
- structured semantic invalid/unsupported diagnostics for parsed Kafka-scoped contracts
- discovery classification for AsyncAPI vs OpenAPI
- OpenAPI semantic non-regression after the async contract changes

## Requirements Advanced

- R046 — Advanced the async quality bar by giving the first async slice a repeatable fixture/unit proof command that localizes parity drift, malformed contracts, and HTTP compatibility regressions.

## Requirements Validated

- R037 — Validated by the S01 proof command showing Kafka-oriented AsyncAPI ingestion, explicit invalid/unsupported handling, and stable discovery without treating async contracts as opaque attachments.
- R038 — Validated by canonical `kafka <action> <channel>` normalization plus parity tests that prove AsyncAPI v2 and v3 resolve to the same deterministic async identity surface.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- The local repo was missing `T03-SUMMARY.md`, `S01-SUMMARY.md`, and `S01-UAT.md` even though T01/T02 had already landed. The slice was closed from the actual task evidence and a fresh passing proof run rather than assuming the missing artifacts were already trustworthy.

## Known Limitations

- S01 is contract-only. It does not yet compute async coverage from runtime evidence or expose unmatched/mismatched async evidence diagnostics; that moves to S02.
- The supported broker/runtime boundary is intentionally Kafka-only. Non-Kafka AsyncAPI transports remain out of scope for the first async slice.
- Payload validation against AsyncAPI message schemas is still deferred; S01 preserves message-contract identity, not payload-schema verification.

## Follow-ups

- Plan and execute M003/S02 against the `loadAsyncApiSemanticsBundle()` surface to compute async coverage and explicit unmatched/mismatched evidence diagnostics.
- Keep future async proof commands additive to this slice-level verifier rather than creating parallel ad hoc test entry points.

## Files Created/Modified

- `yanote-js/src/model/operationKey.ts` — introduced canonical Kafka operation identities and the serialization seam that downstream async work now consumes.
- `yanote-js/src/spec/diagnostics.ts` — generalized semantic diagnostics to carry structured async context.
- `yanote-js/src/spec/asyncapi.ts` — replaced the shallow extractor with a deterministic AsyncAPI semantics bundle and fail-closed public loader.
- `yanote-js/src/spec/asyncapi.test.ts` — pinned semantic-invalid, unsupported-protocol, unsupported-version, and broken-ref failure paths.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — proved equivalent AsyncAPI v2/v3 contracts normalize into the same canonical Kafka identities in deterministic order.
- `yanote-js/src/spec/semantics.diagnostics.test.ts` — proved generalized diagnostics stay deterministic for both HTTP and async surfaces.
- `.gsd/milestones/M003/slices/S01/S01-UAT.md` — captured the artifact-driven acceptance flow for the closed slice.
- `.gsd/milestones/M003/slices/S01/S01-SUMMARY.md` — compressed the slice story, proof surface, and downstream handoff.

## Forward Intelligence

### What the next slice should know
- `loadAsyncApiSemanticsBundle()` is the authoritative async contract seam: it gives S02 stable operation ordering, adjacent message-contract metadata, and inspectable diagnostics without having to re-parse documents.

### What's fragile
- Parser-boundary failures for unsupported versions and broken `$ref` inputs depend on `@asyncapi/parser` error text — they are intentional proof surfaces, but they are still parser-owned strings and may need matcher updates if the dependency changes.

### Authoritative diagnostics
- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts` — this is the slice-level truth surface because it distinguishes parser rejection, semantic invalidity, canonical ordering drift, discovery regressions, and HTTP fallout in one run.

### What assumptions changed
- Discovery normalization would require code changes in S01 — in practice the existing `discover.ts` behavior was already sufficient once the AsyncAPI fixtures and loader semantics became truthful, so the slice changed proof depth more than discovery implementation.
