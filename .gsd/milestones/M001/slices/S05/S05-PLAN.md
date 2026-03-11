# S05: Oss Release And Traceable Verification

**Goal:** Establish the Maven Central release foundation for v1 with deterministic fail-closed preflight behavior.
**Demo:** Establish the Maven Central release foundation for v1 with deterministic fail-closed preflight behavior.

## Must-Haves


## Tasks

- [x] **T01: 05-oss-release-and-traceable-verification 01** `est:10min`
  - Establish the Maven Central release foundation for v1 with deterministic fail-closed preflight behavior.

Purpose: Satisfy RELS-01 and the publication-precondition portion of RELS-03 by making release publication deterministic, signed, scope-controlled, and auditable.
Output: Publication/signing config, release preflight script, and contract tests that lock fail-closed release behavior.
- [x] **T02: 05-oss-release-and-traceable-verification 02** `est:4 min`
  - Deliver the public GitHub release surface for v1 with deterministic tag-driven execution and approval-gated publication.

Purpose: Satisfy RELS-02 and workflow/orchestration portions of RELS-03 by converting release from ad hoc CI activity into an explicit OSS release contract.
Output: Release workflow, release notes template renderer, and deterministic release asset assembly with contract tests.
- [x] **T03: 05-oss-release-and-traceable-verification 03** `est:9 min`
  - Close QUAL-01 by turning requirement accountability into a deterministic release gate and publishable artifact set.

Purpose: Guarantee that every v1 requirement is traceable to executable automated tests before any public release can be published.
Output: Versioned traceability schema/map artifacts, validator script, contract tests, and release-workflow integration.
- [x] **T04: 05-oss-release-and-traceable-verification 04** `est:4 min`
  - Close the Phase 05 verification gaps in release workflow trigger semantics and release-notes previous-tag wiring.

Purpose: Satisfy the remaining RELS-02/RELS-03 defects by fixing exactly two workflow wiring issues without expanding release scope.
Output: One focused gap-closure patch plus contract-test guards that prevent regression.

## Files Likely Touched

- `build.gradle.kts`
- `gradle.properties`
- `yanote-core/build.gradle.kts`
- `yanote-recorder-spring-mvc/build.gradle.kts`
- `yanote-test-tags-restassured/build.gradle.kts`
- `yanote-test-tags-cucumber/build.gradle.kts`
- `yanote-gradle-plugin/build.gradle.kts`
- `jreleaser.yml`
- `scripts/release/preflight.sh`
- `scripts/release/maven-central-preflight.contract.test.mjs`
- `scripts/release/release-failclosed.contract.test.mjs`
- `.github/workflows/release.yml`
- `.github/release.yml`
- `scripts/release/assemble-release-assets.sh`
- `scripts/release/render-release-notes.mjs`
- `scripts/release/github-release.contract.test.mjs`
- `scripts/release/release-workflow.contract.test.mjs`
- `.planning/traceability/schema.v1.json`
- `.planning/traceability/v1-requirements-tests.json`
- `.planning/traceability/v1-requirements-tests.md`
- `scripts/release/verify-traceability.mjs`
- `scripts/release/traceability.contract.test.mjs`
- `.github/workflows/release.yml`
- `scripts/release/assemble-release-assets.sh`
- `.github/workflows/release.yml`
- `scripts/release/release-workflow.contract.test.mjs`
