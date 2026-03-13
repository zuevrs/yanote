# GSD State

**Active Milestone:** M004 — Kafka Evidence Capture And Java Integration
**Active Slice:** S01 — Truthful Spring Kafka Recorder Path
**Phase:** planned
**Requirements Status:** 7 active · 36 validated · 7 deferred · 6 out of scope

## Milestone Registry
- ✅ **M001:** Yanote v1 Delivery
- ✅ **M002:** Repository Product Maturity
- ✅ **M003:** AsyncAPI Coverage Foundations
- 🔄 **M004:** Kafka Evidence Capture And Java Integration
- ⬜ **M005:** M005

## Recent Decisions
- M004/S01: reuse `examples/springmvc-service` as the single-service HTTP+Kafka proof surface while keeping the recorder itself in `yanote-recorder-spring-kafka`.

## Blockers
- None

## Next Action
Execute T01 from `.gsd/milestones/M004/slices/S01/tasks/T01-PLAN.md` to land the shared `KafkaEvent` JSONL contract.
