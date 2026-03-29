---
id: T01
parent: S02
milestone: M015
provides: []
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: ""
completed_at: 2026-03-26T21:50:56.693Z
blocker_discovered: false
---

# T01: Added the Spring AMQP recorder module with opt-in send/listener instrumentation and AMQP contract tests.

## What Happened
No summary recorded.
## Must-Haves Covered

- Real Spring AMQP sends and receives can emit `kind: "amqp"` JSONL without mutating the S01 analyzer contract.
- Recorder hooks remain opt-in and do not clobber existing application `RabbitTemplate` or listener customization.

