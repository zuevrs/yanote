# Yanote Coverage Platform

## What This Is

Yanote is a developer toolchain for analyzing how well service specifications are covered by tests, with immediate focus on Java services and OpenAPI-driven HTTP contracts. The project combines runtime event recording, coverage computation, and CI-ready reporting so engineers can see uncovered operations before release. It is built for your team to run locally and in automation through CLI, Gradle, and GitHub workflows.

## Core Value

Any Java service team can reliably prove that every v1 API requirement is covered by executable tests before shipping.

## Requirements

### Validated

- ✓ Record HTTP events from Spring MVC applications into JSONL without breaking request flow — existing
- ✓ Tag test traffic with suite/run metadata via RestAssured and Cucumber integrations — existing
- ✓ Compute coverage against discovered specs and produce machine-readable reports via Node CLI — existing
- ✓ Enforce coverage quality gates (`--min-coverage`, regression checks) in automated runs — existing
- ✓ Build distributable recorder and analyzer bundles from root Gradle tasks — existing

### Active

- [ ] Deliver a production-grade Java-first coverage analyzer workflow through CLI, Gradle plugin, and GitHub Action (no web UI)
- [ ] Guarantee 100% requirement coverage traceability for v1 scope with deterministic CI outputs
- [ ] Publish project artifacts to GitHub (releases, docs, workflows) and Maven Central using standard OSS release/signing practices
- [ ] Achieve full automated test coverage of functional behavior for the scoped v1 modules and release paths

### Out of Scope

- AsyncAPI event-driven coverage (Kafka, RabbitMQ) for this milestone — focus all delivery on Java HTTP/OpenAPI path first
- Support for non-Java service ecosystems — defer until Java workflow is stable and adopted
- Web report interface/dashboard — CLI and file-based reports are sufficient for v1

## Context

The repository is a brownfield monorepo with Java 21 Gradle modules (`yanote-core`, recorder, test-tag adapters) and a TypeScript CLI analyzer (`yanote-js`). Existing architecture already supports capture -> normalize -> match -> summarize coverage flow and includes example E2E orchestration via Docker Compose. Current strengths are deterministic file-based integration and reusable domain types across Java and TS; current gap is productization into a cohesive Java-first developer experience with robust publication and validation standards.

## Constraints

- **Tech stack**: Java 21+ and Gradle 8+ baseline — aligns with current modules and avoids dual-runtime support complexity
- **Domain scope**: OpenAPI HTTP coverage only for v1 roadmap — keeps milestone focused and reduces protocol variance risk
- **Delivery channels**: CLI + Gradle plugin + GitHub Action required — team needs local, build-time, and CI-native adoption paths
- **Release quality**: GitHub Actions CI/CD with signed Maven Central publishing — required for standard OSS distribution and trust
- **Compatibility**: Preserve existing CLI/report contract semantics where possible — prevents regressions for current users/examples

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build all non-UI surfaces in v1 (CLI, Gradle plugin, GitHub Action) | Team needs practical adoption in local dev and CI from day one | — Pending |
| Use requirement-coverage completion as primary quality gate | User value is proving spec coverage, not only line coverage | — Pending |
| Defer AsyncAPI and non-Java expansion | Limits scope to fastest path for a reliable Java-first release | — Pending |
| Publish to GitHub and Maven Central with standard release pipeline | Public distribution is a core deliverable, not post-v1 work | — Pending |

---
*Last updated: 2026-03-04 after initialization*
