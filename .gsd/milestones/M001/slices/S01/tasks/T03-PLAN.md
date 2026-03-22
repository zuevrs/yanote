# T03: 01-specification-semantics-contract 03

**Slice:** S01 — **Milestone:** M001

## Description

Implement deterministic Node event-to-operation matching and fail-closed CLI semantics on top of the extraction contract.

Purpose: Deliver Node-side SPEC-03 matching behavior and SPEC-02 ambiguity/unmatched enforcement for standalone CLI users.
Output: Two-stage deterministic matcher integration, semantic diagnostics propagation, and CLI failure-policy tests.

## Must-Haves

- [ ] "Node analyzer maps events to operations deterministically with exact-first then same-method template fallback."
- [ ] "Ambiguous and unmatched route matches emit explicit diagnostics rather than heuristic selection."
- [ ] "CLI report command fails closed on invalid or ambiguous semantic states."

## Files

- `yanote-js/package.json`
- `yanote-js/package-lock.json`
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/coverage/coverage.test.ts`
- `yanote-js/src/coverage/coverage.matching.test.ts`
- `yanote-js/src/cli.test.ts`
