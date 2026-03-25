---
depends_on: [M010]
---

# M014: AsyncAPI Semantic Breadth Within Kafka-First Boundaries

**Gathered:** 2026-03-23
**Status:** Queued — pending auto-mode execution.

## Project Description

Yanote’s current async path is already stronger than a channel hit counter: it proves channels, send/receive operations, message contracts, multi-message selection, payload schema drift, and typed header diagnostics on the Kafka-first path. The next async gap is semantic breadth within that same Kafka boundary: AsyncAPI bindings, traits, correlation/reply semantics, and other runtime-relevant contract metadata are not yet treated as supported analyzer surfaces.

## Why This Milestone

Before widening to new brokers or unified reporting, Yanote should finish the most valuable AsyncAPI semantics still missing inside the already-supported Kafka-first boundary. This milestone exists to deepen the meaning of “supported AsyncAPI/Kafka” without over-claiming transport breadth. It keeps the product honest: first finish the richer Kafka semantics, then decide whether broader platform promises are worth the cost.

## User-Visible Outcome

### When this milestone is complete, the user can:

- run `yanote async-report` against richer Kafka-oriented AsyncAPI specs and see deterministic truth for more of the runtime-relevant declared contract, not just channels/actions/messages/payloads/headers
- understand from the report and docs which richer AsyncAPI constructs are now supported inside the Kafka-first path and which still remain out of scope

### Entry point / environment

- Entry point: `node yanote-js/dist/yanote.cjs async-report`, `yanote-async-report.json`, Spring Kafka proof path, and retained async proof artifacts
- Environment: local development, CI, retained Kafka proof bundles, and Kafka-first analyzer/report surfaces
- Live dependencies involved: AsyncAPI specs, Kafka evidence JSONL, Spring Kafka proof stack, Node async analyzer/report/gate path

## Completion Class

- Contract complete means: selected richer AsyncAPI constructs inside the Kafka-first boundary have explicit deterministic report/gate semantics.
- Integration complete means: the richer async semantics work on the same live Kafka proof paths already used for channels/actions/messages/payloads/headers.
- Operational complete means: docs and proof surfaces describe the expanded Kafka-first boundary honestly without implying broker expansion.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- selected richer AsyncAPI constructs become visible in `yanote-async-report.json` and CLI/gate outputs through the real Kafka proof path
- current Kafka routing/payload/header truth stays intact while richer semantic surfaces are added
- public docs say explicitly that the richer semantics still live inside a Kafka-first boundary rather than implying general async support

## Risks and Unknowns

- Some AsyncAPI constructs are descriptive rather than runtime-verifiable. — The milestone must pick only the constructs that can become truthful analyzer surfaces.
- Richer semantics can destabilize operation/message identity if wired carelessly. — Existing canonical `kafka <action> <channel>` identity has to remain stable unless a contract change is deliberate.
- It is easy to accidentally promise transport breadth while discussing richer semantics. — The milestone needs explicit Kafka-first wording throughout.

## Existing Codebase / Prior Art

- `yanote-js/src/spec/asyncapi.ts` — verified current parser/semantic model does not expose bindings, traits, correlation, or reply semantics as first-class analyzer surfaces.
- `yanote-js/src/coverage/asyncCoverage.ts` and `yanote-js/src/coverage/asyncSchemaConformance.ts` — current async path already proves routing, payload, and header truth and provides the foundation for deeper Kafka-first semantics.
- `docs/guides/asyncapi-kafka.md` and `docs/release-and-support.md` — current public async boundary is explicit about Kafka-only / Spring Kafka-first / separate async report surfaces.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` and related retained `.yanote-ci/live-kafka-proof/` artifacts — current live proof boundary to preserve while deepening semantics.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- `R005` — directly deepens the supported Kafka-only async boundary without widening it to broker-agnostic promises
- `R002` — richer async semantics still need explicit typed fail-closed behavior
- `R003` — the richer async semantics must stay consumable through existing CLI/report/CI surfaces

## Scope

### In Scope

- richer AsyncAPI semantic constructs that can be proven truthfully inside the Kafka-first path
- deterministic report/gate/CLI treatment for those constructs
- proof/docs updates for the expanded Kafka-first semantic boundary

### Out of Scope / Non-Goals

- non-Kafka brokers or broker-agnostic support
- combined HTTP+async report surfaces
- speculative AsyncAPI objects that cannot be tied to truthful runtime evidence
- changing the current separate async artifact/report boundary

## Technical Constraints

- Preserve the current canonical async operation identity unless a future milestone explicitly changes the contract.
- Keep the async product boundary Kafka-only and separate from HTTP reporting.
- Tie new semantics to truthful Kafka evidence rather than static-document decoration.

## Integration Points

- AsyncAPI semantic parser/model in `yanote-js`
- async coverage/report/gate/CLI surfaces
- Spring Kafka proof paths and retained async proof artifacts
- public async boundary docs and release/support wording

## Open Questions

- Which richer AsyncAPI constructs have a strong enough runtime-evidence story to support first? — Current leaning: pick only those that can be proven through the Kafka-first proof path.
- Should correlation/reply semantics live here or in a later workflow-oriented milestone? — Current leaning: include them only if they do not force a new runtime/proof architecture.
