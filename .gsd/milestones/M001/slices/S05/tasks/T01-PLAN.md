# T01: 05-oss-release-and-traceable-verification 01

**Slice:** S05 — **Milestone:** M001

## Description

Establish the Maven Central release foundation for v1 with deterministic fail-closed preflight behavior.

Purpose: Satisfy RELS-01 and the publication-precondition portion of RELS-03 by making release publication deterministic, signed, scope-controlled, and auditable.
Output: Publication/signing config, release preflight script, and contract tests that lock fail-closed release behavior.

## Must-Haves

- [ ] "Maintainer can publish only scoped v1 Java modules as signed Maven artifacts with sources, javadocs, and Central-ready metadata."
- [ ] "Release publication fails before upload when semver tag, signing, or publishing prerequisites are invalid or missing."
- [ ] "Pre-release and snapshot versions are blocked from v1 Maven Central publication."
- [ ] "Preflight output records deterministic retry eligibility for transient external publish failures under the same tag."

## Files

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
