# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 | 2026-03-22 | release-boundary | What defines public release truth for Yanote | Signed release tags and GitHub Releases define public version truth; workspace snapshot markers do not. | `docs/release-and-support.md` explicitly separates release truth from local build markers. | No | agent |
| D002 | 2026-03-22 | report-contract | How HTTP and async reporting surfaces are represented today | Keep HTTP and async reporting on separate public artifact surfaces (`yanote-report.json` and `yanote-async-report.json`) until a future milestone explicitly proves a combined contract. | The current product boundary is intentionally split and documented that way in the public requirements and release-support docs. | Yes | agent |
| D003 | 2026-03-22 | gsd-storage | How `.gsd` should be stored for this repository | Use the `gsd-2` shared-project model: commit durable `.gsd` docs and milestone artifacts, keep runtime/state/worktrees local-only. | This preserves project memory without polluting git with ephemeral session data. | Yes | agent |
| D004 | M010 planning | product-boundary | What the next contract-depth milestone should optimize for | Focus M010 on supported core HTTP/OpenAPI and Kafka/AsyncAPI contract surfaces (undeclared HTTP statuses, supported parameter/header conformance, and public Kafka header diagnostics) while explicitly deferring full-spec constructs and broker expansion. | This captures the highest real-user value without turning the milestone into an unfinishable attempt at full OpenAPI/AsyncAPI compliance. It also preserves the current separate HTTP/async report boundary and keeps the product promise truthful. | Yes | collaborative |
