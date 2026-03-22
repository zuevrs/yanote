# M002: Repository Product Maturity — Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

## Project Description

Yanote already ships a release-verified Java-first OpenAPI coverage product with a deterministic analyzer, recorder/test-tagging modules, Gradle delivery surfaces, and governed release automation. This milestone does not change the core coverage engine; it raises the repository and documentation layer to the standard of a stable corporate product for engineers evaluating and integrating the tool.

## Why This Milestone

This work should happen at product start, not later. The maintainer wants the repository to feel serious from day one, so future updates can build on a clean foundation instead of retrofitting basic repo hygiene under pressure.

Right now the technical core is ahead of the public product surface. The repo already contains working examples, release automation, and distribution bundles, but the first-run user journey is fragmented across `README.md`, `dist/*` bundle guides, example assets, maintainer docs, and historical planning notes. A first-time engineer should not have to reverse-engineer how Yanote works, how to wire the recorder, where `events.jsonl` comes from, or which release line is current.

## User-Visible Outcome

### When this milestone is complete, the user can:

- open the repository and understand what Yanote is, what problem it solves, and the concept-first path from recorder integration to coverage output
- follow a short, verified path to connect the recorder to a real Spring service, produce `events.jsonl`, run analysis, and interpret the result
- see which version line is current, what changed recently, what is already stable, and what limits still apply

### Entry point / environment

- Entry point: `README.md`, user-facing docs under `docs/`, existing example and distribution assets, release surfaces
- Environment: GitHub repository, local developer environment, CI-adjacent product usage
- Live dependencies involved: Gradle/Java 21, Node 20+, GitHub Releases, Maven Central, example Spring service/runtime surfaces

## Completion Class

- Contract complete means: repo-level documents, navigation, ownership boundaries, and requirement mappings exist at stable paths with no broken internal references and no public/private instruction confusion
- Integration complete means: the documented recorder → `events.jsonl` → analyzer → report interpretation flow is exercised against real repo assets and produces truthful guidance
- Operational complete means: current version/release/support/limitations surfaces stay aligned with the real release line and maintainer operating model

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a fresh engineer can start at the root repo, understand the concept, and follow the documented real-service path far enough to produce event evidence and a coverage report
- the repository clearly exposes the current release line, recent changes, stable surfaces, and current limitations without forcing the reader into workflow files or historical planning artifacts
- maintainer agent workflow instructions can exist locally without publishing `AGENTS.md` into tracked repo state or confusing users about the public product surface

## Risks and Unknowns

- Recorder integration may still be too brittle or too smoke-test-specific — if the fastest path is not trustworthy, the repo will still feel experimental
- Existing docs are fragmented across root, `dist/`, `examples/`, maintainer docs, and historical artifacts — reorganizing them without losing useful truth sources requires discipline
- Russian-first public docs must still look product-grade and precise — local language is fine, but tone and structure must still signal stability
- Local-only `AGENTS.md` handling can leak or drift if the ignore/storage pattern is not made explicit during execution

## Existing Codebase / Prior Art

- `README.md` — current root landing; useful but too narrow and not yet a product-grade concept-first entry point
- `dist/flatdir-recorder/README.md` — current quickest recorder integration instructions for restricted environments
- `dist/node-analyzer/README.md` — current analyzer bundle instructions for offline analysis
- `examples/docker-compose.yml` — runnable end-to-end demo from recorded traffic to report generation
- `yanote-js/README.md` — current development-facing Node analyzer note surface
- `docs/maintainers/release-signing.md` — maintainer-only release policy surface
- `docs/traceability/v1-requirements-tests.md` — validated proof artifact for v1 requirement coverage
- `.gsd/milestones/M001/M001-SUMMARY.md` — authoritative summary of the validated v1 product baseline

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R022 — establish a concept-first repository landing for engineers
- R023 — provide a verified real-service recorder integration path
- R024 — explain event evidence capture and retrieval clearly
- R025 — provide an analyzer execution and report interpretation path
- R026 — document RestAssured and Cucumber tagging/header setup
- R027 — expose current version and recent release changes clearly
- R028 — define support boundaries, limitations, and compatibility assumptions
- R029 — separate user docs, maintainer docs, and historical artifacts
- R030 — add the trust surfaces expected from a maintained product repo
- R031 — support local-only maintainer agent instructions

## Scope

### In Scope

- concept-first root entry path for engineers evaluating Yanote
- verified recorder integration and event-file handling guidance grounded in real repo assets
- analyzer execution and coverage interpretation guidance
- version/release visibility, support boundaries, limitations, and compatibility story
- documentation information architecture for user, maintainer, and historical surfaces
- maintained-product repo trust surfaces and local-only maintainer agent workflow handling

### Out of Scope / Non-Goals

- changing the validated M001 coverage semantics, governance, or release engine
- building a separate external docs site in this milestone
- creating English-first public docs
- optimizing the repo for a broad community-first contribution model
- publishing a tracked public `AGENTS.md` file

## Technical Constraints

- Public documentation should be Russian-first because the target audience is a Russian-speaking engineer audience.
- The milestone must preserve all validated M001 product behavior and release surfaces; this is a packaging/documentation milestone, not a core-engine rewrite.
- Historical evidence in `docs/traceability/` and planning artifacts may be reorganized or de-emphasized, but their truth value must remain intact.
- Recorder/analyzer guidance must distinguish between recommended product paths and temporary smoke-only/offline paths when those are not the same thing.

## Integration Points

- Root repo entry surfaces (`README.md`, root-level metadata files)
- `dist/flatdir-recorder/` and `dist/node-analyzer/` bundles and guides
- `examples/` demo assets, especially `examples/docker-compose.yml`
- Gradle and Node execution commands already validated in M001
- GitHub Releases / tags and Maven Central publication surfaces
- local Git ignore/exclude handling for the maintainer-only `AGENTS.md`

## Open Questions

- Which exact repo-level trust files add real value for a maintained product repo here, and which would only create fake community expectations?
- Should version/release visibility live primarily in the root landing, a changelog surface, release pages, or a split between them?
- What is the least error-prone local-only pattern for `AGENTS.md` in this repo: `.git/info/exclude`, maintainer bootstrap instructions, or another private convention?
