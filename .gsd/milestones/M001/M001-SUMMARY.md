---
id: M001
provides:
  - Java-first OpenAPI coverage workflow spanning semantic analysis, governance gates, Gradle delivery, GitHub CI, and OSS release automation
  - Deterministic cross-runtime coverage/reporting contracts with fail-closed diagnostics and traceability proof
key_decisions:
  - Keep one deterministic coverage/governance contract and expose it through thin CLI, Gradle, and GitHub adapters.
  - Treat requirement traceability and release publication as first-class v1 delivery work, not post-release follow-up.
patterns_established:
  - Lock critical workflow and release behavior with executable contract tests before implementation.
  - Preserve deterministic file/report/check outputs so future agents can diagnose failures from artifacts instead of guesswork.
observability_surfaces:
  - node --test contract suites for CI/release workflows
  - ./gradlew test
  - npm -C yanote-js test && npm -C yanote-js run build
  - scripts/release/preflight.sh
  - scripts/release/verify-traceability.mjs
  - GitHub Actions release proof run 22712608803 for v1.0.122
duration: 2d
verification_result: passed
completed_at: 2026-03-05
---

# M001: Yanote v1 Delivery

**Yanote v1 now ships as a deterministic Java-first OpenAPI coverage platform with canonical cross-runtime semantics, enforceable governance gates, CI-native delivery surfaces, signed OSS release automation, and validated requirement traceability.**

## What Happened

This milestone consolidated the entire migrated `.planning` history into one coherent v1 delivery story.

- **S01** locked the semantic contract: canonical OpenAPI operation identity, deterministic event-to-operation matching, first-class invalid/ambiguous diagnostics, and shared Java/Node parity fixtures.
- **S02** turned those semantics into a usable analyzer: deterministic operation/status/parameter coverage, a strict versioned report schema, and stable CLI summary/error contracts.
- **S03** added governance: policy resolution, exclusions, regression baselines, fail-closed evidence handling, and deterministic report/CLI diagnostics for automated gates.
- **S04** delivered the Java-first adoption surfaces: a Gradle plugin, GitHub workflow contracts, required-check topology, always-on artifact retention, and explicit Java 21 enforcement.
- **S05** closed the OSS distribution loop: Maven Central publication contracts, approval-gated GitHub releases, 100% requirement traceability validation, and release workflow hardening.

The migrated source also captured the final completion state from `.planning/STATE.md`: the release pipeline was proven end-to-end on 2026-03-05 with successful preflight and publish execution for GitHub release `v1.0.122` (run `22712608803`). That proof establishes that the milestone is not merely code-complete; it was release-verified.

## Cross-Slice Verification

- **Coverage semantics are deterministic and cross-runtime aligned** — verified by Node/Vitest and Java/JUnit semantic, matcher, and parity fixture suites in S01.
- **Coverage computation and CLI/report contracts are stable** — verified by `npm -C yanote-js test` and `npm -C yanote-js run build` across S02 and S03.
- **Governance and delivery surfaces are merge-blocking ready** — verified by workflow/helper contract tests, `./gradlew test`, and the S04 CI hardening work.
- **Release and traceability contracts are publishable and auditable** — verified by `node --test scripts/release/*.test.mjs`, `scripts/release/preflight.sh`, `scripts/release/verify-traceability.mjs`, and the successful proof release run `22712608803` for `v1.0.122`.

## Requirement Changes

- `SPEC-01`, `SPEC-02`, `SPEC-03`: active → validated — S01 implemented canonical OpenAPI semantics, deterministic matching, actionable diagnostics, and Java/Node parity fixtures.
- `COVR-01`, `COVR-02`, `COVR-03`, `COVR-04`, `COVR-05`, `DELV-01`: active → validated — S02 delivered layered coverage computation, deterministic report generation, and the standalone CLI contract.
- `GATE-01`, `GATE-02`, `GATE-03`, `GATE-04`: active → validated — S03 implemented policy resolution, exclusion transparency, baseline regression checks, and fail-closed governance behavior.
- `DELV-02`, `DELV-03`, `QUAL-02`, `QUAL-03`: active → validated — S04 delivered the Gradle plugin, GitHub CI surfaces, required-check topology, and explicit Java 21 enforcement.
- `RELS-01`, `RELS-02`, `RELS-03`, `QUAL-01`: active → validated — S05 delivered signed publication contracts, approval-gated release automation, strict traceability validation, and a successful end-to-end proof release.

## Forward Intelligence

### What the next milestone should know
- The highest-value stable contracts are the canonical operation identity, the report schema/output ordering, and the frozen CI job names (`build-and-test`, `yanote-validation`). Treat those as compatibility surfaces.
- Release automation depends on both repository files and GitHub environment configuration. Repository-side code is complete; future changes should explicitly re-verify environment approval behavior rather than assuming it.
- The project now has enough deterministic contract tests that future work should usually start by extending tests, not by exploring behavior manually.

### What's fragile
- Release publication still depends on external credentials, signing material, and GitHub environment reviewer configuration — changes here can make a healthy codebase look broken.
- The Gradle plugin intentionally wraps the existing Node analyzer rather than replacing it — future refactors must preserve parity between JVM-facing UX and Node execution semantics.

### Authoritative diagnostics
- `scripts/release/preflight.sh` and `scripts/release/verify-traceability.mjs` are the first places to inspect when release/readiness questions appear.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` and `scripts/release/release-workflow.contract.test.mjs` are the best truth sources for expected GitHub workflow behavior.
- `yanote-js` report/CLI contract tests and Java parity tests are the fastest proof points when coverage semantics look suspicious.

### What assumptions changed
- Early planning assumed OSS release automation would end with repo-side workflow wiring; in practice the milestone also needed proof through a real published release run.
- The project remained Java-first at the user surface, but the most reliable implementation path kept the Node analyzer as the shared engine behind thin adapters instead of rewriting analysis logic in Kotlin.

## Files Created/Modified

- `.gsd/milestones/M001/M001-ROADMAP.md` — canonical milestone roadmap for the migrated v1 delivery.
- `.gsd/milestones/M001/slices/S01/S01-PLAN.md` — semantic-contract slice plan and task structure.
- `.gsd/milestones/M001/slices/S04/S04-PLAN.md` — Java/CI delivery-surface slice plan and task structure.
- `.gsd/milestones/M001/slices/S05/S05-PLAN.md` — OSS release and traceability slice plan and task structure.
- `yanote-js/src/spec/semantics.ts` — deterministic semantic extraction contract.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt` — Gradle delivery surface.
- `.github/workflows/yanote-ci.yml` — CI delivery and required-check workflow.
- `.github/workflows/release.yml` — approval-gated OSS release workflow.
- `scripts/release/verify-traceability.mjs` — strict requirement traceability gate.
- `.planning/traceability/v1-requirements-tests.json` — canonical traceability evidence snapshot referenced by the migrated milestone state.
