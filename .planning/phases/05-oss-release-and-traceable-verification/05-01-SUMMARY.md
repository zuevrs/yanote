---
phase: 05-oss-release-and-traceable-verification
plan: 01
subsystem: infra
tags: [maven-central, jreleaser, gradle-publishing, signing, release-preflight]

requires:
  - phase: 04-java-build-and-ci-delivery-surfaces
    provides: "Deterministic CI script/contract patterns reused for release preflight enforcement."
provides:
  - "Fail-closed release preflight script for signed semver tags, main-lineage, freeze, snapshot, and credential checks."
  - "Maven Central-first JReleaser configuration with signing and Central rules."
  - "Signed publication metadata contract (sources/javadocs/POM) for v1 allowlisted Java modules."
affects: [release-workflow, github-release-assets, requirement-traceability]

tech-stack:
  added: [org.jreleaser Gradle plugin]
  patterns: [explicit publication allowlist, deterministic diagnostic ordering, conditional signing gates]

key-files:
  created:
    - scripts/release/maven-central-preflight.contract.test.mjs
    - scripts/release/release-failclosed.contract.test.mjs
    - scripts/release/preflight.sh
    - jreleaser.yml
  modified:
    - build.gradle.kts
    - gradle.properties
    - yanote-core/build.gradle.kts
    - yanote-recorder-spring-mvc/build.gradle.kts
    - yanote-test-tags-restassured/build.gradle.kts
    - yanote-test-tags-cucumber/build.gradle.kts
    - yanote-gradle-plugin/build.gradle.kts

key-decisions:
  - "Lock release preflight behavior with contract tests first, then implement fail-closed script/config."
  - "Bind JReleaser to repository-managed jreleaser.yml via Gradle and keep local jreleaserConfig deterministic with non-release token fallback."
  - "Fail closed on publication scope by allowing only v1 modules and disabling other publish task surfaces."

patterns-established:
  - "Preflight Diagnostics: deterministic class order input -> policy -> auth -> transient with explicit retry metadata."
  - "Central Publication Surface: every v1 module emits main + sources + javadocs plus Central-ready POM metadata."

requirements-completed: [RELS-01, RELS-03]

duration: 10min
completed: 2026-03-04
---

# Phase 5 Plan 01: Maven Central Foundation Summary

**Deterministic Maven Central preflight and signed publication contracts for v1 Java modules using JReleaser.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-04T19:36:17Z
- **Completed:** 2026-03-04T19:47:05Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Added executable release contract tests for semver tag policy, signed/main-lineage checks, snapshot blocking, credential gates, and deterministic fail-closed diagnostics.
- Implemented `scripts/release/preflight.sh` with fail-closed policy checks, deterministic diagnostic ordering, and explicit retry-eligibility output.
- Wired `jreleaser.yml` + root Gradle release allowlist behavior and updated v1 module publications to include sources, javadocs, signing hooks, and Central-ready POM metadata while excluding examples.

## Task Commits

Each task was committed atomically:

1. **Task 1: Lock preflight and fail-closed release contracts with executable tests** - `62419e9` (test)
2. **Task 2: Implement root release preflight and Central deploy orchestration contract** - `aba221e` (feat)
3. **Task 3: Apply signed publication metadata and v1 module allowlist across Java artifacts** - `3033d2a` (feat)

**Plan metadata:** pending (created after STATE/ROADMAP updates)

## Files Created/Modified

- `scripts/release/maven-central-preflight.contract.test.mjs` - RED/GREEN contract assertions for release preflight requirements.
- `scripts/release/release-failclosed.contract.test.mjs` - fail-closed deterministic diagnostics and retry-eligibility contract assertions.
- `scripts/release/preflight.sh` - deterministic release preflight gate script.
- `jreleaser.yml` - Maven Central + signing release configuration contract.
- `build.gradle.kts` - JReleaser integration, release allowlist, and publication-surface fail-closed controls.
- `gradle.properties` - release policy constants for start version/tag/freeze/retry behavior.
- `yanote-core/build.gradle.kts` - signed publication metadata and sources/javadocs publication contract.
- `yanote-recorder-spring-mvc/build.gradle.kts` - signed publication metadata and sources/javadocs publication contract.
- `yanote-test-tags-restassured/build.gradle.kts` - signed publication metadata and sources/javadocs publication contract.
- `yanote-test-tags-cucumber/build.gradle.kts` - signed publication metadata and sources/javadocs publication contract.
- `yanote-gradle-plugin/build.gradle.kts` - plugin publication metadata/signing contract with sources/javadocs artifacts.

## Decisions Made

- Used script-level release contract tests (`node:test`) to lock fail-closed semantics before implementing preflight behavior.
- Forced root publication scope to an explicit module allowlist and disabled all non-allowlisted publish tasks to prevent accidental surface expansion.
- Configured JReleaser from checked-in `jreleaser.yml` and added a local-only token fallback for `jreleaserConfig` validation so release config remains testable without external credentials.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] JReleaser config task ignored repository YAML**
- **Found during:** Task 2 (Implement root release preflight and Central deploy orchestration contract)
- **Issue:** `./gradlew jreleaserConfig` used default JReleaser model and failed token validation before applying project release contract.
- **Fix:** Wired Gradle `jreleaser.configFile` to `jreleaser.yml` and corrected YAML schema fields to parse reliably.
- **Files modified:** `build.gradle.kts`, `jreleaser.yml`
- **Verification:** `./gradlew jreleaserConfig`
- **Committed in:** `aba221e`

**2. [Rule 3 - Blocking] Local config validation required GitHub token before release-plan wiring**
- **Found during:** Task 2 (Implement root release preflight and Central deploy orchestration contract)
- **Issue:** `jreleaserConfig` hard-failed when `JRELEASER_GITHUB_TOKEN` was absent, blocking deterministic local contract verification.
- **Fix:** Added controlled fallback in `build.gradle.kts` for `jreleaser.github.token` during `jreleaserConfig` when no token is present.
- **Files modified:** `build.gradle.kts`
- **Verification:** `./gradlew jreleaserConfig`
- **Committed in:** `aba221e`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes were required to make release contract verification deterministic and executable in local/CI contexts.

## Issues Encountered

- `jreleaser.yml` initially used an unsupported `issueTracker` key and was rejected by the parser; migrated to `bugTracker`.
- `jreleaserConfig` enforces release provider presence even for config rendering; resolved by explicit config + controlled fallback token for config-time validation.

## User Setup Required

External release credentials are required before real publication:

- `JRELEASER_MAVENCENTRAL_USERNAME`
- `JRELEASER_MAVENCENTRAL_PASSWORD`
- `JRELEASER_GPG_SECRET_KEY`
- `JRELEASER_GPG_PUBLIC_KEY`
- `JRELEASER_GPG_PASSPHRASE`

## Next Phase Readiness

- Phase 05 Plan 01 contracts are in place and machine-verified.
- Ready for `05-02-PLAN.md` (GitHub release workflow and deterministic release bundle assembly).

---
*Phase: 05-oss-release-and-traceable-verification*
*Completed: 2026-03-04*

## Self-Check: PASSED

- FOUND: `.planning/phases/05-oss-release-and-traceable-verification/05-01-SUMMARY.md`
- FOUND: `62419e9`
- FOUND: `aba221e`
- FOUND: `3033d2a`
