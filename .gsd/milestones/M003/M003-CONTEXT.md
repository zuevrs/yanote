# M003: AsyncAPI Coverage Foundations — Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

## Project Description

Yanote already proves HTTP/OpenAPI contract coverage end to end. This milestone extends the analyzer and reporting model so the product can understand Kafka-oriented AsyncAPI contracts, normalize async identities across supported AsyncAPI versions, compute async coverage semantics, and expose a separate async report/gate path without weakening the existing HTTP trust model.

## Why This Milestone

Some target services are described not only by OpenAPI but also by AsyncAPI. Without async contract understanding, Yanote remains incomplete for event-driven Java teams even if the repository, release process, and HTTP path are already mature.

The first async step should not start with recorder instrumentation. It should start by fixing the contract model and coverage semantics so downstream Kafka evidence capture has one stable target to write against. Otherwise Spring Kafka instrumentation and analyzer behavior will drift immediately and create rework.

## User-Visible Outcome

### When this milestone is complete, the user can:

- point Yanote at a Kafka-oriented AsyncAPI contract and receive explicit validation/diagnostic output instead of “unsupported input”
- generate a separate async report that shows covered and uncovered Kafka channels, send/receive operations, and identified message-contract surfaces
- see unmatched or mismatched async evidence explicitly instead of silently losing or auto-counting it

### Entry point / environment

- Entry point: `yanote-js` analyzer/report path, async fixtures, report JSON/CLI output
- Environment: local development and CI; contract/evidence processing, not yet live broker instrumentation
- Live dependencies involved: AsyncAPI specification documents, normalized async evidence files, existing report/gate surfaces

## Completion Class

- Contract complete means: supported AsyncAPI documents parse into one internal async model with canonical operation identities, deterministic diagnostics, and version boundary behavior that is explicit rather than accidental
- Integration complete means: the analyzer can consume normalized async evidence, compute async coverage semantics, and expose a separate async report/gate path next to HTTP
- Operational complete means: async report and gate surfaces are deterministic and ready for downstream CI/runtime integration; no live Kafka runtime is required yet

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a supported AsyncAPI contract can be parsed into canonical async identities for Kafka channels and direction semantics
- normalized async evidence can drive coverage results and explicit unmatched/mismatched diagnostics in a separate async report path
- the async report/gate surface is deterministic and can fail closed without affecting the existing HTTP path

## Risks and Unknowns

- AsyncAPI v2 and v3 differ in shape and semantics — if Yanote leaks those differences downstream, coverage and recorder work will become unstable
- Async coverage can become misleading if the product counts only topic hits and never clarifies operation direction or message-contract identity
- Payload-schema validation is desirable, but trying to solve it now could delay the first trustworthy async rollout
- Separate async report surfaces reduce confusion now, but the report schema and CLI contract still need to stay coherent with the existing product story

## Existing Codebase / Prior Art

- `yanote-js/src/spec/` — current OpenAPI-oriented contract ingestion and semantic extraction layer that async support will extend
- `yanote-js/src/coverage/` and `yanote-js/src/cli*` — current deterministic coverage and CLI/report surfaces
- `yanote-js/package.json` — already includes `@asyncapi/parser`, showing earlier intent to expand into AsyncAPI
- `docs/plans/2026-03-02-node-spec-analyzer-design.md` — earlier design notes for OpenAPI + AsyncAPI analyzer direction
- `docs/plans/2026-02-28-yanote-design.md` — earlier extensibility notes for future Kafka/AsyncAPI support
- `.gsd/milestones/M001/M001-SUMMARY.md` — validated HTTP/OpenAPI baseline whose trust posture must be preserved

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R037 — AsyncAPI contract ingestion for Kafka APIs
- R038 — canonical async operation identity across AsyncAPI versions
- R039 — async coverage semantics for channels, operations, and message contracts
- R040 — unmatched and mismatched async evidence diagnostics
- R041 — separate async report and gate path alongside HTTP
- R046 — async verification stack at OpenAPI-quality depth (foundation layer)

## Scope

### In Scope

- Kafka-oriented AsyncAPI contract parsing and validation in the analyzer
- canonical async operation identity and internal normalization strategy
- async coverage semantics for channels, operation direction, and message-contract identity
- unmatched/mismatched async diagnostics and fail-closed behavior
- separate async report and gate surface alongside the existing HTTP path
- fixture, unit, and contract-proof foundations for downstream Kafka runtime work

### Out of Scope / Non-Goals

- live Spring Kafka instrumentation or broker capture
- payload-schema validation against AsyncAPI message schemas
- combined HTTP + async report in one mandatory surface
- non-Kafka broker expansion
- Schema Registry, DLQ/retry, partition, or lag-aware coverage dimensions

## Technical Constraints

- Preserve the current deterministic report/governance posture; async support must not weaken the existing HTTP path.
- Prefer support for both AsyncAPI v2 and v3 if it can be delivered without semantic compromise; otherwise support v3 first and document the version boundary explicitly.
- Keep separate async report/gate surfaces in the first async release.
- Treat unmatched or mismatched async evidence as first-class diagnostics, not as silent best-effort matches.

## Integration Points

- `yanote-js` spec loader, coverage engine, report writer, and CLI surfaces
- existing JSON report schema and deterministic output conventions
- current gate/error ordering model from the HTTP path
- future Spring Kafka evidence capture in M004, which will depend on the canonical async identity defined here

## Open Questions

- Can AsyncAPI v2 and v3 be normalized into one internal operation model without distorting direction semantics?
- What is the least ambiguous canonical key for async coverage: channel + direction + message contract, or a slightly richer async operation form?
- How much of message-contract identity can be surfaced now without promising full payload-schema validation?
