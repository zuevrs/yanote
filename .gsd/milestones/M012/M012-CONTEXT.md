---
depends_on: [M011]
---

# M012: OpenAPI Surface Expansion Beyond Request/Response Core

**Gathered:** 2026-03-23
**Status:** Queued — pending auto-mode execution.

## Project Description

Even after M010 and M011, Yanote will still focus mostly on the request/response core of an HTTP API contract. Real OpenAPI documents also carry higher-level surfaces such as security schemes, examples, links, callbacks, and webhooks. M012 is the milestone that decides which of those broader OpenAPI objects deserve first-class coverage/report semantics and how to add them without muddying the existing HTTP core truth.

## Why This Milestone

There is a natural boundary between “core HTTP contract completeness” and “broader OpenAPI document semantics.” M010 and M011 intentionally stop at the main runtime surfaces teams expect first: status, parameters, headers, payloads, cookies, serialization, and media semantics. After that, the remaining OpenAPI gaps are broader spec objects. They should be planned together because they raise a different product question: which non-request/response OpenAPI constructs are valuable enough to become supported user-facing surfaces, and how do they appear in reports without collapsing into spec-lint noise?

## User-Visible Outcome

### When this milestone is complete, the user can:

- point Yanote at richer OpenAPI documents and see supported truth for selected non-request/response OpenAPI constructs instead of those objects being entirely ignored
- understand from the report and docs which broader OpenAPI objects are now treated as contract surfaces and which are still outside the product boundary

### Entry point / environment

- Entry point: `node yanote-js/dist/yanote.cjs report`, `yanote-report.json`, OpenAPI fixtures, and HTTP docs/proof surfaces
- Environment: local development, CI, and retained HTTP proof/report paths
- Live dependencies involved: OpenAPI specs, HTTP analyzer/report/gate surfaces, and any expanded proof fixtures/scripts needed for new OpenAPI objects

## Completion Class

- Contract complete means: selected broader OpenAPI objects have explicit supported semantics and deterministic report/gate treatment.
- Integration complete means: the analyzer/report path can consume those spec objects without regressing current HTTP request/response truth.
- Operational complete means: docs and proof surfaces explain the broadened OpenAPI boundary honestly and rerunnably.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- selected broader OpenAPI constructs surface deterministic truth in `yanote-report.json` and CLI/gate outputs rather than being invisible
- the report remains readable and does not collapse into a generic “spec lint” surface detached from runtime evidence
- docs clearly state which non-request/response OpenAPI objects are now supported and which still remain deferred

## Risks and Unknowns

- Many OpenAPI constructs are only weakly tied to runtime evidence. — The milestone has to choose constructs that can be turned into truthful coverage/conformance surfaces rather than static decoration.
- Callbacks/webhooks can cross runtime boundaries. — If chosen, they may force new proof paths rather than only analyzer changes.
- Security/examples/links each imply different semantics. — Grouping them in one milestone needs careful scoping to avoid a grab-bag implementation.

## Existing Codebase / Prior Art

- `yanote-js/src/spec/openapi.ts` — verified current extraction centers on operations, parameters, request bodies, and response bodies; broader OpenAPI objects are not part of today’s model.
- `yanote-js/src/report/report.ts` and `yanote-js/src/report/schema.ts` — current HTTP report surface has no first-class place for security/example/callback/webhook truth.
- `docs/guides/analyzer-coverage.md` and `README.md` — current public guidance is intentionally centered on request/response contract coverage, not broader OpenAPI objects.
- retained HTTP proof scripts under `scripts/docs/` and `scripts/ci/` — current proof path to preserve while widening the spec boundary.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- `R001` — extends the supported HTTP contract surface beyond today’s core objects
- `R002` — new broader-object signals still need deterministic fail-closed semantics where applicable
- `R003` — whatever becomes supported must stay consumable through existing delivery surfaces

## Scope

### In Scope

- selecting and implementing the first broader OpenAPI constructs worth supporting after the request/response core
- deterministic report/gate semantics for those selected constructs
- guide/proof updates that explain the broader supported OpenAPI boundary

### Out of Scope / Non-Goals

- full OpenAPI feature parity across every object and keyword
- remote spec loading, HTML reports, or deprecated-operation UX
- AsyncAPI/broker expansion or cross-surface reporting
- speculative static-lint-only checks with no runtime-truth story

## Technical Constraints

- Broader OpenAPI support must remain tied to a truthful runtime-evidence story whenever possible.
- Do not pollute the existing HTTP coverage numerators with semantically unrelated spec-lint concepts.
- Preserve deterministic report schemas and stable proof surfaces.

## Integration Points

- `yanote-js` OpenAPI model, report schema, and CLI summary surfaces
- existing HTTP docs and proof scripts
- OpenAPI fixture corpus and any new retained proof assets required for broader constructs

## Open Questions

- Which broader OpenAPI constructs are valuable enough to support first? — Current leaning: choose only objects that can be turned into runtime-adjacent truth, not every descriptive field in the document.
- Should callbacks/webhooks stay with HTTP or become a future cross-protocol concern? — Current leaning: only include them if the proof path can stay clear and deterministic.
