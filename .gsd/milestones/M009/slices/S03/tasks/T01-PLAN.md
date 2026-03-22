---
estimated_steps: 7
estimated_files: 5
skills_used:
  - asyncapi-design
---

# T01: Add deterministic multi-message AsyncAPI parsing and selection rules

**Slice:** S03 — AsyncAPI Multi-Message Contract Resolution
**Milestone:** M009

## Description

Extend the AsyncAPI parser so Kafka-only v3 operations with multiple messages can be loaded when one message contract can be selected deterministically, while ambiguous shapes fail closed with typed diagnostics.

## Steps

1. Identify the current parser branch that rejects multi-message v3 operations.
2. Define deterministic selection precedence using message identity and retained runtime discriminators.
3. Preserve canonical `kafka <action> <channel>` operation keys while attaching selected-message metadata separately.
4. Add fixtures for resolvable multi-message and ambiguous multi-message contracts.
5. Update parser tests for supported, ambiguous, and invalid cases.
6. Re-run parity tests to confirm single-message behavior does not regress.
7. Document any still-unsupported shapes explicitly in diagnostics.

## Must-Haves

- [ ] Resolvable multi-message AsyncAPI contracts load successfully inside the Kafka-only boundary.
- [ ] Ambiguous multi-message contracts fail closed with typed diagnostics.
- [ ] Canonical operation keys remain unchanged.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`

## Observability Impact

- Signals added/changed: selected-message metadata and typed ambiguity diagnostics from the parser boundary.
- How a future agent inspects this: AsyncAPI fixtures, parser/parity tests, and the async boundary verifier.
- Failure state exposed: unsupported vs ambiguous multi-message shapes stop collapsing into one generic parser failure.

## Inputs

- `yanote-js/src/spec/asyncapi.ts` — current AsyncAPI normalization logic.
- `yanote-js/src/spec/asyncapi.test.ts` — existing parser expectations.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — parity guard for v2/v3 behavior.
- `yanote-js/test/fixtures/asyncapi/v3.yaml` — current v3 contract fixture surface.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — retained boundary verifier.

## Expected Output

- `yanote-js/src/spec/asyncapi.ts` — deterministic multi-message parsing and diagnostics.
- `yanote-js/src/spec/asyncapi.test.ts` — parser proof for resolvable and ambiguous multi-message contracts.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — parity guard for unchanged canonical identities.
- `yanote-js/test/fixtures/asyncapi/v3.yaml` — expanded v3 fixture coverage.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — verifier updated for the new supported/ambiguous boundary.
