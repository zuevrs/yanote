---
depends_on: [M010]
---

# M011: OpenAPI Parameter, Cookie, And Media Semantics

**Gathered:** 2026-03-23
**Status:** Queued — pending auto-mode execution.

## Project Description

Yanote’s HTTP/OpenAPI path is already strong on core coverage and JSON-first payload conformance, but it still treats many request-surface semantics as out of scope. Today parameter coverage is mostly key presence for path/query/header inputs, cookie parameters are ignored, HTTP payload validation runs with `format` enforcement disabled, and broader media/serialization semantics are still outside the supported boundary. M011 is the next HTTP follow-on after M010: it broadens the supported HTTP contract surface without yet trying to cover every OpenAPI object.

## Why This Milestone

After M010, the main remaining HTTP gap will be breadth rather than honesty. Teams with real OpenAPI specs will quickly ask about cookie parameters, parameter serialization rules, `format` semantics, and media-type breadth. Those are natural next questions once undeclared-status, supported parameter-value, and response-header drift are already visible. This milestone exists to answer those questions on the HTTP path before work branches into broader non-request/response OpenAPI objects or operator UX.

## User-Visible Outcome

### When this milestone is complete, the user can:

- run `yanote report` against a real HTTP service and see supported cookie/serialization/media drift surfaced as first-class contract truth rather than silent omissions
- trust that supported OpenAPI parameter semantics go beyond key presence and into retained value interpretation where the recorder path can prove it safely

### Entry point / environment

- Entry point: `node yanote-js/dist/yanote.cjs report`, `yanote-report.json`, Spring MVC recorder path, example service/tests, and retained HTTP proof scripts
- Environment: local development, CI, and the existing Spring MVC demo/runtime path
- Live dependencies involved: OpenAPI specs, Spring MVC recorder/evidence path, Node analyzer/report/gate surfaces, and retained `.yanote-ci/v1-e2e/` artifacts

## Completion Class

- Contract complete means: supported cookie/serialization/media semantics have explicit report/gate truth and test coverage instead of being silently ignored.
- Integration complete means: the Spring MVC recorder/evidence path retains enough safe data to drive those semantics end to end.
- Operational complete means: the stronger HTTP breadth is visible through the same public proof/report surfaces teams already use.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- the live HTTP proof path can surface supported cookie and parameter-serialization drift without regressing current operation/status/payload truth
- supported `format` and media-type semantics fail closed when the contract says they should, rather than being silently skipped
- the HTTP guide and proof bundles describe the widened supported semantics explicitly and still state what remains outside the boundary

## Risks and Unknowns

- Parameter serialization (`style` / `explode`) can become combinatorially broad quickly. — The milestone has to stay focused on the subset the recorder path can prove truthfully.
- Cookie and richer media retention can increase privacy and artifact-size risk. — Safe retention/redaction boundaries have to be pinned before analyzer logic depends on them.
- `format` validation can introduce noisy drift if adopted indiscriminately. — The supported subset needs to be explicit and mechanically verified.

## Existing Codebase / Prior Art

- `yanote-js/src/spec/openapi.ts` — verified current parameter extraction only recognizes `path`, `query`, and `header`; `cookie` is outside today’s supported set.
- `yanote-js/src/coverage/parameterCoverage.ts` — verified current HTTP parameter coverage is key-presence based rather than value/serialization-semantic conformance.
- `yanote-js/src/coverage/httpPayloadConformance.ts` — verified current payload validation uses AJV with `validateFormats: false`, so `format` is not yet enforced.
- `yanote-js/src/model/httpEvent.ts` and `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — current HTTP evidence model will need additive safe retention for any broader serialization/media checks.
- `docs/guides/analyzer-coverage.md` — current public HTTP guide describes the stronger core boundary but not broader cookie/serialization/media support.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- `R001` — extends supported HTTP contract proof beyond today’s core request surfaces
- `R002` — broader HTTP semantics still need fail-closed behavior rather than silent omission
- `R003` — the widened HTTP checks must stay reachable through CLI/report/CI surfaces

## Scope

### In Scope

- supported cookie-parameter coverage/conformance on the HTTP path
- supported parameter serialization semantics (`style` / `explode`) where the recorder path can retain enough truth safely
- supported `format` enforcement and broader media semantics for the HTTP payload path
- docs/proof updates for the widened supported HTTP boundary

### Out of Scope / Non-Goals

- security schemes, links, callbacks, webhooks, and examples as first-class OpenAPI surfaces
- full universal media-type support across every possible HTTP content type
- remote spec loading, HTML report writing, or deprecated-operation UX
- non-HTTP protocols or async work

## Technical Constraints

- Preserve the current recorder → `events.jsonl` → analyzer architecture and additive evidence compatibility.
- Keep redaction/privacy boundaries stronger than the desire for broader semantics.
- Do not claim support for all OpenAPI serialization/media constructs; support only what can be proven end to end.

## Integration Points

- `yanote-recorder-spring-mvc` — source of any additive cookie/serialization/media evidence
- `yanote-core` HTTP event shape — canonical JSONL contract for the richer HTTP inputs
- `yanote-js` OpenAPI parser, coverage engine, payload conformance engine, report/gate/CLI surfaces — semantic consumers of the new HTTP breadth
- existing HTTP docs/proof scripts — public boundary that must stay truthful after the milestone lands

## Open Questions

- Which cookie and parameter-serialization shapes are worth supporting first? — Current leaning: the common scalar patterns proven by real Spring MVC demo/runtime paths.
- How much media-type breadth belongs here versus a later milestone? — Current leaning: widen only where the recorder/analyzer can still produce deterministic fail-closed truth.
