---
id: T01
parent: S02
milestone: M010
provides:
  - Schema-bearing HTTP parameter contracts, status-keyed response-header contracts, and a shared HTTP operation-evidence resolver for downstream analyzers.
key_files:
  - yanote-js/src/coverage/dimensions.ts
  - yanote-js/src/spec/openapi.ts
  - yanote-js/src/coverage/httpOperationEvidence.ts
  - yanote-js/src/coverage/httpOperationEvidence.test.ts
  - yanote-js/src/coverage/coverage.ts
  - yanote-js/src/spec/openapi.test.ts
  - .gsd/milestones/M010/slices/S02/tasks/T01-PLAN.md
key_decisions:
  - Kept parameter/header schema support intentionally narrow with a typed scalar-or-array subset instead of exposing arbitrary OpenAPI schemas directly.
patterns_established:
  - Route matching and retained HTTP evidence aggregation now live in one shared resolver that coverage can reuse without forking S01 event interpretation.
observability_surfaces:
  - yanote-js/src/coverage/httpOperationEvidence.test.ts
  - yanote-js/src/spec/openapi.test.ts
  - npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpOperationEvidence.test.ts src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts
duration: 1h05m
verification_result: partial
completed_at: 2026-03-25T01:00:00+03:00
blocker_discovered: false
---

# T01: Extract supported HTTP contracts and shared operation evidence

**Added schema-bearing HTTP contracts and a shared operation-evidence resolver, with one legacy coverage expectation still needing follow-up.**

## What Happened

I first repaired the task contract by adding the missing `## Observability Impact` section to `T01-PLAN.md`, then implemented the T01 foundation work in `yanote-js`.

The runtime changes were:
- extended `ParameterDefinition` in `yanote-js/src/coverage/dimensions.ts` with a narrow supported HTTP value schema surface;
- updated `yanote-js/src/spec/openapi.ts` to extract supported path/query/header parameter schemas and status-keyed response-header contracts while preserving existing request/response body extraction;
- added `yanote-js/src/coverage/httpOperationEvidence.ts` as the shared resolver for canonical operation matching plus observed statuses, suites, path/query/request-header/response-header evidence aggregation from the S01 JSONL shape;
- migrated `yanote-js/src/coverage/coverage.ts` to consume that shared resolver instead of owning its own route/evidence matching path;
- pinned the new behavior in `yanote-js/src/coverage/httpOperationEvidence.test.ts` and expanded `yanote-js/src/spec/openapi.test.ts` for parameter/header contract extraction.

Because the context budget warning arrived during verification, I stopped before reconciling the last failing legacy expectation.

## Verification

I ran the focused T01 verification stack for OpenAPI extraction, the new shared evidence helper, and the migrated coverage path.

Results:
- `src/spec/openapi.test.ts` passed.
- `src/coverage/httpOperationEvidence.test.ts` passed.
- `src/coverage/coverage.matching.test.ts` passed.
- `src/coverage/coverage.test.ts` had one failing assertion in `keeps observation coverage numerators unchanged when payload contracts are present`; the failure was on the expected operation coverage percentage after the migration.

I did **not** run `src/coverage/coverage.parity.test.ts` or the slice-level verification stack after the context budget warning.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `/usr/bin/time -p npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpOperationEvidence.test.ts src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts` | 1 | ❌ fail | 0.75s |

## Diagnostics

Future agents should inspect these surfaces first:
- `yanote-js/src/coverage/httpOperationEvidence.ts` for the shared canonical HTTP route resolution and retained evidence aggregation behavior.
- `yanote-js/src/coverage/httpOperationEvidence.test.ts` for the expected exact/fallback route matching contract and additive evidence shape.
- `yanote-js/src/spec/openapi.ts` and `yanote-js/src/spec/openapi.test.ts` for the supported parameter schema subset and `responseHeadersByStatus` extraction behavior.
- `yanote-js/src/coverage/coverage.test.ts` around the failing payload-baseline assertion for the remaining carry-forward verification issue.

## Deviations

- I updated `.gsd/milestones/M010/slices/S02/tasks/T01-PLAN.md` to add the required `## Observability Impact` section before proceeding.
- I stopped after the first focused verification failure because the system issued a context-budget wrap-up instruction.

## Known Issues

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpOperationEvidence.test.ts src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts` still fails in `src/coverage/coverage.test.ts` on the legacy payload-baseline expectation for `dimensions.operations`.
- `src/coverage/coverage.parity.test.ts` was not rerun in this session.
- Slice-level verification commands were not rerun in this session.

## Files Created/Modified

- `.gsd/milestones/M010/slices/S02/tasks/T01-PLAN.md` — added the missing observability contract required by the execution pre-flight.
- `yanote-js/src/coverage/dimensions.ts` — extended parameter contracts with a narrow supported HTTP value schema type.
- `yanote-js/src/coverage/parameterCoverage.ts` — preserved schema metadata when normalizing parameter definitions.
- `yanote-js/src/spec/openapi.ts` — extracted supported parameter schemas and status-keyed response-header contracts.
- `yanote-js/src/coverage/httpOperationEvidence.ts` — added the shared HTTP route/evidence resolver for downstream analyzers.
- `yanote-js/src/coverage/httpOperationEvidence.test.ts` — pinned resolver matching and additive evidence aggregation behavior.
- `yanote-js/src/coverage/coverage.ts` — migrated legacy coverage onto the shared evidence resolver.
- `yanote-js/src/spec/openapi.test.ts` — added assertions for supported parameter schema and response-header contract extraction.
## Must-Haves Covered

- `ParameterDefinition` carries the supported schema metadata S02 needs instead of only name/location/requiredness.
- `HttpOperationContract` exposes response-header contracts keyed by declared response status alongside the existing payload contracts.
- One shared HTTP operation-evidence helper aggregates S01 value-bearing evidence so later analyzers do not fork the route-matching logic again.

