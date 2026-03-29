---
id: T01
parent: S01
milestone: M014
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
completed_at: 2026-03-26T09:44:29.938Z
blocker_discovered: false
---

# T01: Normalize trait-applied correlation and reply declarations into Kafka contracts

## What Happened
No summary recorded.
## Must-Haves Covered

- Supported `correlationId` and `reply` declarations survive AsyncAPI normalization as additive contract metadata instead of parser-only residue.
- Trait-applied declarations normalize to the same retained fields as inline declarations for the supported fixture cases.
- `serializeOperationKey()` continues to emit `kafka <action> <channel>` with no semantic-field leakage.

