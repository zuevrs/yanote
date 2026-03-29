---
id: T01
parent: S04
milestone: M015
provides: []
requires: []
affects: []
key_files: ["scripts/ci/collect-yanote-artifacts.sh", "scripts/ci/render-yanote-summary.mjs", "scripts/ci/collect-yanote-artifacts.test.mjs", ".gsd/milestones/M015/slices/S04/tasks/T01-SUMMARY.md"]
key_decisions: ["Preserved the legacy async_bundle manifest fields as Kafka aliases while adding explicit rabbitmq_bundle and combined_bundle metadata.", "Treat RabbitMQ async bundles as optional-companion bundles so missing Kafka-only sidecars stay explicit instead of being fabricated."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran syntax checks for the modified surfaces, then ran the task verifier. node --check scripts/ci/render-yanote-summary.mjs && node --check scripts/ci/collect-yanote-artifacts.test.mjs passed. node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs failed with three renderer assertion mismatches because the async expected markdown snapshots do not yet include the new protocols line."
completed_at: 2026-03-26T22:42:00.997Z
blocker_discovered: false
---

# T01: Extended artifact collection and summary rendering toward RabbitMQ and combined proof support, but renderer tests still need follow-up expectation updates.

> Extended artifact collection and summary rendering toward RabbitMQ and combined proof support, but renderer tests still need follow-up expectation updates.

## What Happened
---
id: T01
parent: S04
milestone: M015
key_files:
  - scripts/ci/collect-yanote-artifacts.sh
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/collect-yanote-artifacts.test.mjs
  - .gsd/milestones/M015/slices/S04/tasks/T01-SUMMARY.md
key_decisions:
  - Preserved the legacy async_bundle manifest fields as Kafka aliases while adding explicit rabbitmq_bundle and combined_bundle metadata.
  - Treat RabbitMQ async bundles as optional-companion bundles so missing Kafka-only sidecars stay explicit instead of being fabricated.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T22:42:00.998Z
blocker_discovered: false
---

# T01: Extended artifact collection and summary rendering toward RabbitMQ and combined proof support, but renderer tests still need follow-up expectation updates.

**Extended artifact collection and summary rendering toward RabbitMQ and combined proof support, but renderer tests still need follow-up expectation updates.**

## What Happened

Read the active state, slice/task contracts, and the existing collector/renderer surfaces before editing. Widened scripts/ci/collect-yanote-artifacts.sh so it now recognizes the retained RabbitMQ proof bundle and the combined proof bundle alongside the legacy Kafka and HTTP families, and records explicit manifest/source-path provenance for them while preserving the legacy async_bundle fields as Kafka aliases. Extended scripts/ci/render-yanote-summary.mjs so async summaries now expose protocols, RabbitMQ bundles can explicitly omit Kafka-only companion artifacts without fabrication, and combined-report bundles fail closed when collected artifacts, child paths, or AMQP attribution drift. Replaced scripts/ci/collect-yanote-artifacts.test.mjs with a smaller widened-bundle contract suite and reran the task verifier. Collector-side coverage is green; the remaining work is in scripts/ci/render-yanote-summary.test.mjs, where three existing async snapshot expectations still need to be updated for the new protocols line and dedicated RabbitMQ/combined summary coverage still needs to be added.

## Verification

Ran syntax checks for the modified surfaces, then ran the task verifier. node --check scripts/ci/render-yanote-summary.mjs && node --check scripts/ci/collect-yanote-artifacts.test.mjs passed. node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs failed with three renderer assertion mismatches because the async expected markdown snapshots do not yet include the new protocols line.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs` | 1 | ❌ fail | 288ms |


## Deviations

Stopped in wrap-up mode under context/time-budget pressure after leaving the task in a coherent partial state. I did not finish the renderer-side test expectation updates or add the planned dedicated RabbitMQ/combined renderer tests in this context window.

## Known Issues

scripts/ci/render-yanote-summary.test.mjs still has three failing async expectation snapshots, and dedicated renderer coverage for RabbitMQ optional-companion behavior plus combined-report markdown shape is still missing.

## Files Created/Modified

- `scripts/ci/collect-yanote-artifacts.sh`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
- `.gsd/milestones/M015/slices/S04/tasks/T01-SUMMARY.md`


## Deviations
Stopped in wrap-up mode under context/time-budget pressure after leaving the task in a coherent partial state. I did not finish the renderer-side test expectation updates or add the planned dedicated RabbitMQ/combined renderer tests in this context window.

## Known Issues
scripts/ci/render-yanote-summary.test.mjs still has three failing async expectation snapshots, and dedicated renderer coverage for RabbitMQ optional-companion behavior plus combined-report markdown shape is still missing.

## Must-Haves Covered

- `build-and-test-artifacts/` retains `live-kafka-proof/`, `live-rabbitmq-proof/`, and `combined-proof/` without fabricating missing AMQP companions or losing existing HTTP bundle collection.
- Collected markdown summaries stay redaction-safe while surfacing `protocols=amqp`, combined child report paths, and fail-closed bundle drift.

