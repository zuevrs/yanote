# M001: Yanote v1 Delivery

**Gathered:** 2026-03-23
**Status:** Complete

## Project Description

M001 delivered Yanote v1 as a deterministic Java-first OpenAPI coverage platform: semantic extraction, layered coverage/reporting, fail-closed governance, Java/CI delivery surfaces, and signed OSS release automation all landed as one coherent product milestone.

## Why This Milestone

This was the original v1 delivery milestone. It existed to turn the early analyzer ideas into a shippable product surface with deterministic semantics, governance, Java-first adoption paths, CI integration, release automation, and traceability strong enough to publish and support.

## User-Visible Outcome

### When this milestone is complete, the user can:

- run deterministic OpenAPI coverage analysis through the standalone CLI, Gradle plugin, and GitHub Action/CI delivery surfaces
- trust signed Maven Central and GitHub release pipelines, fail-closed governance, and requirement traceability as part of the shipped v1 product boundary

### Entry point / environment

- Entry point: standalone CLI, Gradle plugin, GitHub workflow/release surfaces
- Environment: local development, CI, and release publication
- Live dependencies involved: OpenAPI specs, Java services/tests, Node analyzer, Gradle, GitHub Actions, Maven Central, and release signing infrastructure

## Completion Class

- Contract complete means: canonical coverage semantics, reporting, and fail-closed diagnostics are stable and cross-runtime aligned.
- Integration complete means: the Node analyzer, Java delivery surfaces, CI workflows, and release pipeline work together as one product.
- Operational complete means: v1 can be published and verified through the real release path.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Java teams can run deterministic OpenAPI coverage analysis through CLI, Gradle, and GitHub workflow surfaces
- coverage semantics, reporting, governance, and traceability stay deterministic and auditable across Node and Java workflows
- signed release automation publishes reproducible v1 artifacts from semver tags with explicit approval gates

## Risks and Unknowns

- none — milestone completed and later milestones now build on this delivered v1 foundation

## Existing Codebase / Prior Art

- `yanote-js` semantic, coverage, report, and CLI surfaces — analyzer foundation delivered in M001
- `yanote-gradle-plugin` — Java-first build surface delivered in M001
- `.github/workflows/yanote-ci.yml` and `.github/workflows/release.yml` — CI and release delivery surfaces delivered in M001
- `scripts/release/verify-traceability.mjs` and related release contracts — traceability/release governance delivered in M001

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- `R001`, `R002`, `R003`, `R004` — foundational validated product requirements established by M001

## Scope

### In Scope

- deterministic OpenAPI semantics and coverage computation
- fail-closed governance gates
- Java/CI delivery surfaces
- signed OSS release automation and traceability

### Out of Scope / Non-Goals

- AsyncAPI/Kafka support and later contract-depth follow-ons
- broader post-v1 repository/runtime hardening work handled by later milestones

## Technical Constraints

- Keep one deterministic analyzer/governance contract and expose it through thin Java/CI/release adapters.
- Preserve reproducible outputs and proof artifacts so later milestones can build on them safely.

## Integration Points

- Node analyzer core
- Java Gradle plugin and recorder-facing delivery surfaces
- GitHub CI/release automation
- release signing and traceability pipeline

## Open Questions

- none — milestone completed and superseded by later contract-depth and runtime-hardening milestones
