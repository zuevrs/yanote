# GSD State

**Active Milestone:** M003 — AsyncAPI Coverage Foundations
**Active Slice:** S02 — Async Coverage And Diagnostics Semantics
**Phase:** planning
**Requirements Status:** 10 active · 33 validated · 7 deferred · 6 out of scope

## Milestone Registry
- ✅ **M001:** Yanote v1 Delivery
- ✅ **M002:** Repository Product Maturity
- 🔄 **M003:** AsyncAPI Coverage Foundations
- ⬜ **M004:** M004
- ⬜ **M005:** M005

## Recent Decisions
- 2026-03-13 — **M003/S01/T03:** Keep unsupported AsyncAPI versions and broken `$ref` inputs on the parser-rejection side; reserve structured async diagnostics for successfully parsed Kafka-scoped contracts.
- 2026-03-13 — **M003/S01/T02:** Expose AsyncAPI normalization as a semantics bundle and fail closed on unsupported protocol or semantically invalid contracts before returning canonical operations.
- 2026-03-13 — **M003/S01:** Use canonical Kafka runtime identities (`kafka <action> <channel>`) and keep message-contract metadata adjacent to the base operation key.

## Blockers
- None

## Next Action
Plan slice S02 (Async Coverage And Diagnostics Semantics) on top of the now-locked S01 proof command.
