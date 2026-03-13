# GSD State

**Active Milestone:** M004 — Kafka Evidence Capture And Java Integration
**Active Slice:** S01 — Truthful Spring Kafka Recorder Path
**Phase:** roadmap-planned
**Requirements Status:** 7 active · 36 validated · 7 deferred · 6 out of scope

## Milestone Registry
- ✅ **M001:** Yanote v1 Delivery
- ✅ **M002:** Repository Product Maturity
- ✅ **M003:** AsyncAPI Coverage Foundations
- 🔄 **M004:** Kafka Evidence Capture And Java Integration
- ⬜ **M005:** Async Productization And End-to-End Proof

## Recent Decisions
- Split Spring Kafka recorder seams so producer facts reflect ack/failure and consumer facts reflect listener outcome.
- Keep Kafka metadata propagation narrow: shared test-metadata context plus explicit Yanote headers only.
- Collect Kafka evidence per service and merge deterministically for multi-service analysis.

## Blockers
- None

## Next Action
Plan slice M004/S01 and task breakdown from `.gsd/milestones/M004/M004-ROADMAP.md`.
