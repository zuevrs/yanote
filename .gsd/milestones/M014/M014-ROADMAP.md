# M014: M014: M014: AsyncAPI Semantic Breadth Within Kafka-First Boundaries

## Vision
Deepen Yanote's proven Kafka-first async path so richer AsyncAPI semantics become truthful, additive user-facing analyzer surfaces without widening into broker-agnostic promises, combined HTTP+async reporting, or workflow architectures the current evidence model cannot prove.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Trait-aware declared semantics on async-report | high | — | ✅ | Run `async-report` against richer Kafka AsyncAPI specs and see trait-applied declarations normalize the same as inline declarations, with additive richer-semantic fields visible in `yanote-async-report.json`/`.html` while canonical operation keys and existing coverage numerators stay unchanged. |
| S02 | Header-backed correlation and reply truth | high | S01 | ✅ | Run `async-report` on Kafka evidence with retained correlation or reply headers and see additive runtime truth plus typed async gate/CLI failures when required header-backed semantics are missing, unavailable, mismatched, or unsupported. |
| S03 | Kafka binding support matrix without false green | medium | S01 | ✅ | Run `async-report` on AsyncAPI specs with Kafka bindings and see which binding semantics are supported now, which are declaration-only, and which are deferred, instead of silent omission or synthetic coverage. |
| S04 | Live Kafka proof and support-surface closeout | medium | S02, S03 | ✅ | The authoritative Spring Kafka proof bundle retains widened async JSON/HTML artifacts plus focused companions, and docs/CI summaries explain the richer semantics while still saying Kafka-only, Spring-Kafka-first, and separate async reporting. |
