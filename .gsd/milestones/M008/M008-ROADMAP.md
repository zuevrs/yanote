# M008: OpenAPI Payload Conformance And Contract Depth

**Vision:** Extend Yanote’s HTTP/OpenAPI path from operation/status/parameter observation into truthful request/response payload conformance, with report/gate/CLI semantics that keep exercised coverage separate from actual contract validation.

## Success Criteria

- `yanote report` shows request and response payload conformance beside the existing HTTP coverage dimensions.
- Report/json/stdout/gates distinguish observed operation/status/parameter coverage from payload conformance and call out payload drift explicitly.
- The real Spring MVC recorder path carries payload/media facts end to end and proves both passing and failing cases with inspectable retained artifacts.
- Public docs/support surfaces describe the supported JSON-first HTTP payload scope truthfully.

## Key Risks / Unknowns

- The existing HTTP evidence model started metadata-only. — Recorder and JSONL boundaries had to deepen before analyzer semantics could be truthful.
- Payload-conformance semantics can muddy existing coverage numbers if mixed together carelessly. — Observation and conformance had to stay separate all the way through the product surfaces.
- Public proof could become confusing if the green and red paths did not derive from the same live events. — The retained bundle needed additive sidecars, not a second unrelated runtime story.

## Proof Strategy

- HTTP evidence-depth risk → retire in S01 by proving payload-bearing HTTP evidence through the real Spring MVC recorder path.
- Conformance-semantics risk → retire in S02 by proving deterministic valid/invalid/missing/unsupported payload outcomes without changing observation coverage math.
- Fail-closed product-truth risk → retire in S03 by proving report/gate/CLI surfaces map payload drift to stable `SEMANTIC_HTTP_*` behavior.
- Public boundary risk → retire in S04 by proving the green/red retained bundle and docs/support wording align with the shipped JSON-first HTTP payload boundary.

## Verification Classes

- Contract verification: `yanote-js` OpenAPI/payload/gate/report/CLI suites
- Integration verification: `bash scripts/docs/verify-s02-analysis-path.sh`
- Operational verification: `bash scripts/ci/run-v1-e2e.sh` and retained `.yanote-ci/v1-e2e/` green/red artifacts
- UAT / human verification: inspect docs/support wording and retained artifacts to confirm the observation-versus-conformance split is truthful

## Milestone Definition of Done

This milestone is complete only when all are true:

- payload-bearing HTTP evidence exists across recorder, JSONL, and analyzer boundaries
- supported OpenAPI request/response payload validation works without regressing operation/status/parameter truth
- report/gate/CLI outputs keep observation and payload conformance visibly distinct
- the public HTTP proof path is exercised end to end with inspectable green/red artifacts
- success criteria are rechecked against live behavior and retained artifacts rather than assumed from source changes

## Requirement Coverage

- Covers: `R066`, `R067`
- Partially covers: `R001`, `R002`, `R003`
- Leaves for later: combined HTTP+async reporting and broader non-core spec surfaces
- Orphan risks: none

## Slices

- [x] **S01: Payload-Bearing HTTP Evidence Contract** `risk:high` `depends:[]`
  > After this: the real Spring MVC recorder path carries request/response payload and content-type facts into JSONL and the analyzer exposes a separate `httpPayloadConformance` seam.
- [x] **S02: Deterministic HTTP Payload Conformance Semantics** `risk:high` `depends:[S01]`
  > After this: Yanote can classify valid, invalid, missing, unsupported, skipped, and partial HTTP payload outcomes without changing observation coverage numerators.
- [x] **S03: Fail-Closed HTTP Report, Gate, And CLI Truth** `risk:medium` `depends:[S01,S02]`
  > After this: payload drift appears as stable `SEMANTIC_HTTP_*` truth in report/gate/CLI surfaces while benign `NO_DECLARED_CONTENT` stays visible and non-failing.
- [x] **S04: Public HTTP Proof Bundle And Boundary Refresh** `risk:medium` `depends:[S03]`
  > After this: the retained green/red HTTP proof bundle and the public docs/support surfaces describe the JSON-first payload boundary truthfully.

## Boundary Map

### S01 → S02

Produces:
- payload-bearing HTTP event model and JSONL reader boundary
- separate `httpPayloadConformance` report seam fed by real recorder evidence

Consumes:
- existing canonical HTTP operation/status/parameter observation surface

### S02 → S03

Produces:
- deterministic payload diagnostics for valid/invalid/missing/unsupported/no-declared-content cases
- a stable payload-conformance state model separate from observation coverage

Consumes:
- S01 payload-bearing HTTP evidence contract

### S03 → S04

Produces:
- fail-closed `SEMANTIC_HTTP_*` report/gate/CLI behavior from payload diagnostics
- retained semantic-red proof outputs derived from the same live events as the happy path

Consumes:
- S01 payload-bearing evidence and S02 deterministic payload-conformance semantics
