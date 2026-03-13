# GSD State

**Active Milestone:** M003 — AsyncAPI Coverage Foundations
**Active Slice:** (none)
**Active Task:** (none)
**Phase:** planning
**Requirements Status:** 12 active · 31 validated · 7 deferred · 6 out of scope

## Milestone Registry
- ✅ **M001:** Yanote v1 Delivery
- ✅ **M002:** Repository Product Maturity
- ⏳ **M003:** AsyncAPI Coverage Foundations
- ⏳ **M004:** Kafka Evidence Capture And Java Integration
- ⏳ **M005:** Async Productization And End-to-End Proof

## Recent Decisions
- Accept M003 → M004 → M005 sequentially, while allowing research and prototypes to proceed in parallel only when they do not lock contracts prematurely.
- Ship the first async release with a separate async report and gate path alongside HTTP.
- Keep the first async rollout Kafka-only and Spring Kafka-first.
- Preserve the OpenAPI-level test/proof bar for the async capability across fixtures, unit, integration, end-to-end, and CI.

## Blockers
- None

## Next Action
Plan M003/S01 — AsyncAPI Contract Ingestion And Canonical Identity.
