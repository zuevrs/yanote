---
depends_on: [M014]
---

# M015: Async Platform Expansion And Cross-Surface Reporting

**Gathered:** 2026-03-23
**Status:** Queued — pending auto-mode execution.

## Project Description

Even after richer Kafka-first semantics land, Yanote’s async product boundary will still be intentionally narrow: Kafka-only, Spring Kafka-first, and reported separately from HTTP. M015 is the late expansion milestone for the work that the current requirements/docs already defer explicitly: non-Kafka or broker-agnostic async support and any future combined HTTP+async reporting surface.

## Why This Milestone

This work belongs late in the sequence because it is not a depth hardening step; it is a platform-boundary change. Both broker expansion and combined reporting can invalidate assumptions across recorders, evidence shapes, report schemas, CI surfaces, and public docs. They should only be attempted after the Kafka-first path is mature enough that widening the platform does not mean widening on top of unresolved ambiguity.

## User-Visible Outcome

### When this milestone is complete, the user can:

- use Yanote beyond the current Kafka-only async boundary or through a broker-agnostic async contract surface if the product proves that expansion honestly
- consume one intentional combined HTTP+async reporting surface if the split report contract is deliberately superseded

### Entry point / environment

- Entry point: future async recorder/evidence/report surfaces and any future combined report command/artifact introduced by the milestone
- Environment: local development, CI, and any new runtime/proof environments required by broader broker support or cross-surface reporting
- Live dependencies involved: async runtimes beyond the current Kafka-first path, report schema surfaces, CI/release boundaries, and public support/docs surfaces

## Completion Class

- Contract complete means: any widened broker/report boundary is explicit, deterministic, and mechanically verifiable.
- Integration complete means: the broader async platform or combined report path works end to end through real recorder/evidence/analyzer/report wiring.
- Operational complete means: release/support/docs surfaces state the widened boundary honestly and do not leave legacy split surfaces ambiguous.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- the widened async platform path works end to end on a real runtime that is outside today’s Kafka-only promise
- any combined HTTP+async report surface is intentional, deterministic, and does not silently distort the current split truth surfaces
- public docs, requirements, and release boundaries explicitly supersede the old deferred state rather than leaving both stories half-alive

## Risks and Unknowns

- Broker expansion changes recorder/evidence assumptions deeply. — The current Kafka-first shapes may not generalize cleanly.
- Combined reporting can blur truthful split boundaries. — If done poorly, teams lose clarity about what was observed on which protocol surface.
- This milestone may force a requirement-contract rewrite. — It should only start when the product is ready for a real boundary change, not just a feature experiment.

## Existing Codebase / Prior Art

- `docs/requirements.md` — verified current deferred items already call out combined HTTP+async reporting (`ASYNC-02`) and broker-agnostic/non-Kafka async support (`ASYNC-03`) as future scope.
- `docs/release-and-support.md` and `docs/guides/asyncapi-kafka.md` — verified current public boundary is intentionally Kafka-only and split from HTTP reporting.
- `yanote-js` current report/CLI surfaces and `yanote-core` event models — current architecture to revisit only after narrower async depth work is complete.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- `R020` — combined HTTP + async report/gate surface remains deferred until this milestone
- `R021` — broker-agnostic or non-Kafka async coverage remains deferred until this milestone
- `R003` and `R005` — any widened platform surface must preserve trustworthy delivery/report semantics

## Scope

### In Scope

- explicit evaluation and, if justified, implementation of non-Kafka or broker-agnostic async support
- explicit evaluation and, if justified, implementation of a combined HTTP+async report/gate surface
- requirements/docs/release-boundary updates required by a real platform-boundary change

### Out of Scope / Non-Goals

- polishing the current Kafka-only path without widening it
- speculative platform claims without real runtime proof
- silently folding HTTP and async together without an explicit contract change

## Technical Constraints

- Any widened broker/report boundary must be expressed as an intentional contract change, not a silent extension of current artifacts.
- Preserve truthful diagnostics and deterministic report shapes even if the current split boundary is superseded.
- Do not start this milestone until the Kafka-first path is mature enough that widening the platform is the actual next constraint.

## Integration Points

- async recorder/evidence architecture across runtimes
- HTTP and async report schemas and CLI surfaces
- CI/release proof stacks and support boundary docs
- requirements and decisions registers, which will need explicit contract updates if the split boundary changes

## Open Questions

- Should broker expansion and combined reporting really live in one milestone, or should they split if either proves substantially larger? — Current leaning: keep them together only as a queued long-tail milestone until real planning clarifies the cost.
- What proof surface would be strong enough to justify retiring the current split-report promise? — Current leaning: only a real cross-protocol, rerunnable, deterministic proof path.
