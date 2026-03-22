# Project Knowledge

Append-only register of project-specific rules, patterns, and lessons learned.
Agents read this before every unit. Add entries when you discover something worth remembering.

## Rules

| # | Scope | Rule | Why | Added |
|---|-------|------|-----|-------|
| 1 | release truth | Treat signed `vMAJOR.MINOR.PATCH` tags and GitHub Releases as the public version truth, not workspace snapshot markers such as `0.0.0` or `0.1.0-SNAPSHOT`. | `docs/release-and-support.md` is explicit that workspace version markers are technical build markers, not release truth. | 2026-03-22 |
| 2 | report surfaces | Keep HTTP/OpenAPI reporting and the current async/Kafka reporting on separate public surfaces (`yanote-report.json` vs `yanote-async-report.json`) unless a future milestone explicitly proves a combined contract. | The current public boundary is intentionally split and documented that way. | 2026-03-22 |
| 3 | gsd storage | Follow the `gsd-2` shared-project model: commit durable `.gsd` docs and milestone artifacts, but keep `.gsd/runtime/`, `.gsd/activity/`, `.gsd/worktrees/`, lock/state files, and other session data local-only. | This repo previously blanket-ignored `.gsd/`, which prevents durable project memory from surviving machines and sessions. | 2026-03-22 |

## Patterns

| # | Pattern | Where | Notes |
|---|---------|-------|-------|
| 1 | Recorder writes portable evidence, analyzer computes contract coverage | `README.md`, `yanote-recorder-spring-mvc`, `yanote-js` | The product boundary is recorder → `events.jsonl` → analyzer/report, not ad hoc runtime introspection. |
| 2 | Traceability is explicit and file-backed | `docs/requirements.md`, `docs/traceability/v1-requirements-tests.md` | Requirements, test references, and verification commands are already documented as first-class repo artifacts. |

## Lessons Learned

| # | What Happened | Root Cause | Fix | Scope |
|---|--------------|------------|-----|-------|
| 1 | Blanket-ignoring `.gsd/` leaves GSD planning memory entirely local and easy to lose. | The repo treated `.gsd` as an all-local cache instead of separating durable docs from runtime residue. | Use the `gsd-2` shared-project ignore model: commit durable `.gsd` docs, ignore only runtime/state/worktrees. | `.gsd/` maintenance |
