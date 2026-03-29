---
id: T03
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

# T03: Surface declared semantics through async-report summaries without breaking JSON-centered delivery

## What Happened
No summary recorded.
## Must-Haves Covered

- `yanote async-report` exposes declared `correlationId` / `reply` counts or fields additively in stdout and `YANOTE_ASYNC_SUMMARY`.
- `Report Path` and `report=` continue to point at `yanote-async-report.json`, not HTML or any combined surface.
- Supported local and remote spec inputs stay green with the widened summary and no raw header-value leakage.

