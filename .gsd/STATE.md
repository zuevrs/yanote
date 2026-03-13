# GSD State

**Active Milestone:** M004 — Kafka Evidence Capture And Java Integration
**Active Slice:** None
**Phase:** ready-for-planning
**Requirements Status:** 7 active · 36 validated · 7 deferred · 6 out of scope

## Milestone Registry
- ✅ **M001:** Yanote v1 Delivery
- ✅ **M002:** Repository Product Maturity
- ✅ **M003:** AsyncAPI Coverage Foundations
- 🔄 **M004:** Kafka Evidence Capture And Java Integration
- ⬜ **M005:** Async Productization And End-to-End Proof

## Recent Decisions
- #68 M003/S03/T01 — Keep the first async artifact and gate path separate from the HTTP report surface.
- #69 M003/S03/T02 — Keep deterministic normalization and schema validation as explicit async report boundary helpers.
- #70 M003/S03/T03 — Expose async analysis through a dedicated `async-report` command with `YANOTE_ASYNC_*` output lines.

## Blockers
- None

## Next Action
Plan M004/S01 against the M003 seams: canonical `kafka <action> <channel>` identities, metadata-only async JSONL evidence, and the separate async report/gate surface.
