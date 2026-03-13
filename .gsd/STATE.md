# GSD State

**Active Milestone:** M003 — AsyncAPI Coverage Foundations
**Active Slice:** S03 — Separate Async Report And Gate Surface
**Phase:** planned
**Requirements Status:** 8 active · 35 validated · 7 deferred · 6 out of scope

## Milestone Registry
- ✅ **M001:** Yanote v1 Delivery
- ✅ **M002:** Repository Product Maturity
- 🔄 **M003:** AsyncAPI Coverage Foundations
- ⬜ **M004:** M004
- ⬜ **M005:** M005

## Recent Decisions
- 2026-03-13 — **M003/S02/T03:** Prove async coverage parity by replaying the same normalized Kafka evidence against equivalent AsyncAPI v2/v3 bundles and keep HTTP coverage in the same verifier stack.
- 2026-03-13 — **M003/S02/T02:** Match async operations at action+channel, keep message-contract identity as a separate coverage dimension, and treat known-channel action drift as unmatched evidence rather than synthetic operation coverage.
- 2026-03-13 — **M003/S02/T01:** Normalize first-wave async runtime evidence as metadata-only Kafka JSONL with explicit action/channel/message-contract identity and `test.*` attribution.
- 2026-03-13 — **M003/S01/T03:** Keep unsupported AsyncAPI versions and broken `$ref` inputs on the parser-rejection side; reserve structured async diagnostics for successfully parsed Kafka-scoped contracts.

## Blockers
- None

## Next Action
Execute S03/T01: define the separate async report and gate contract on top of the now-closed async contract and coverage semantics.
