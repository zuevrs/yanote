# Phase 5: OSS Release and Traceable Verification - Research

**Researched:** 2026-03-04  
**Domain:** Maven Central OSS release automation, GitHub release contracts, and requirement-to-test traceability gates  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Release trigger and versioning contract
- Public v1 release line starts at `v1.0.0`.
- Production releases are triggered by release tags only (no manual-only release entrypoint).
- Tag format is strict semver with `v` prefix: `vMAJOR.MINOR.PATCH`.
- Version bump policy is strict semver with explicit breaking/non-breaking criteria.
- Pre-release channels (`-beta`, `-rc`) are out of v1 release contract; stable releases only.
- Release tags are created from `main` only.
- Signed git tags are required for release execution.
- Release pipeline includes one explicit manual approval gate before publication.
- Hotfixes use patch-version semver increments under the same release contract.
- Retry on external publish platform failures is allowed under the same tag only when deterministic retry conditions are met and logged.
- A short release freeze period is required before tagging (target: 24h-style short freeze).

### GitHub Release bundle contract
- Every release publishes structured release notes with required sections: Summary, Breaking Changes, Upgrade Notes, and Verification Highlights.
- Changelog scope is "since previous release tag."
- Release notes are curated from a fixed template, using auto-derived data as input rather than raw freeform text.
- Official release notes language is English-first for OSS consumers.
- GitHub Release asset set is mandatory and deterministic: v1 distribution artifacts + traceability artifacts + checksum/signature proof files.
- SHA-256 is the required checksum standard for release assets.
- Signature/checksum proof is published per asset plus a shared manifest.
- SBOM is required as part of the release asset bundle.
- Asset naming is a strict deterministic convention (version + artifact type), not ad hoc naming.

### Maven Central publication scope
- Maven Central publishes only v1 product modules, not all subprojects blindly.
- Included public scope for v1: `yanote-core`, recorder module, test-tag adapters, and Gradle plugin artifacts.
- `examples/*` modules are docs/demo-only and are explicitly excluded from Maven Central publication.
- Gradle plugin publication path is Maven Central first for v1, with explicit usage docs for consumers.
- Group/artifact coordinates are treated as a stable v1 compatibility surface (no arbitrary renames).
- Every published artifact must satisfy full OSS publication contract: signed main artifact + sources + javadocs + Central-ready POM metadata.
- Central publish flow accepts stable release versions only (no SNAPSHOT publication to Central in v1).
- Publish execution requires a preflight gate/checklist before upload.
- Central failure handling follows deterministic retry policy with explicit, auditable conditions.
- One release signing identity is used consistently across v1 publications.

### Requirement-to-test traceability contract (QUAL-01)
- `.planning/REQUIREMENTS.md` is the canonical source of requirement inventory for v1.
- Traceability output is a versioned machine-readable JSON artifact plus a concise human summary.
- JSON traceability artifact uses an explicit schema version field and deterministic structure.
- Mapping granularity is strict: each requirement maps to concrete test case references and automated verification command(s).
- Flaky/quarantined tests do not count toward requirement coverage.
- Release pipeline hard-fails before publish if any v1 requirement is not fully accounted for.
- QUAL-01 release threshold is strict 100% coverage with no waiver path in v1 release flow.
- Traceability is published both as a versioned release asset and as a versioned repository document using the same snapshot ID/reference.
- Final traceability sign-off is owned by designated release owner (explicit accountable role).

### Claude's Discretion
- Exact release workflow file layout (`release.yml` split vs monolithic workflow) while preserving all locked gate semantics.
- Exact release approval mechanism details (environment approval vs equivalent gated control), as long as one explicit manual approval exists.
- Exact naming of traceability artifact files and schema field names, provided deterministic schema-versioned contract is preserved.
- Exact SBOM format/tool choice and signature file extensions, provided proof remains machine-verifiable.
- Exact implementation of semver classification checks and preflight automation scripts.
- Exact rollback/retry logging format, provided retry policy remains deterministic and auditable.

### Deferred Ideas (OUT OF SCOPE)
- Official pre-release channels (`-rc`, `-beta`) as public contract - deferred beyond v1 stable release surface.
- Plugin Portal co-equal distribution policy - deferred; v1 contract is Maven Central first.
- Non-GitHub release channels and cross-platform release orchestration - outside current phase scope.
- v2 traceability analytics beyond strict requirement->test accountability (deeper insights, trend intelligence) - future phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RELS-01 | Maintainer can publish signed Java artifacts to Maven Central | Use Gradle `maven-publish` + `signing` + explicit publication allowlist + Central Portal-compatible deployment (`org.jreleaser`) with preflight validation of POM metadata, signatures, and sources/javadocs. |
| RELS-02 | Maintainer can publish versioned GitHub Releases with changelog and usage notes | Use tag-driven release workflow plus `.github/release.yml` templating and deterministic release asset assembly (checksums/signatures/SBOM/traceability bundle). |
| RELS-03 | Maintainer can run a reproducible CI release pipeline from tagged versions | Use immutable tag-triggered workflow, signed-tag verification, environment approval gate, least-privilege permissions, and deterministic failure checks for missing publishing/signing prerequisites. |
| QUAL-01 | Team has automated tests that trace to all v1 requirements (100% requirement coverage) | Generate and validate schema-versioned requirement-to-test JSON from `.planning/REQUIREMENTS.md` + explicit test selectors; gate release on 100% accounted coverage and exclusion of flaky/quarantined tests. |
</phase_requirements>

<research_summary>
## Summary

Phase 5 should be implemented as a release-contract phase that reuses Phase 4's deterministic CI baseline, not as a feature phase. The repository already has stable CI check names (`build-and-test`, `yanote-validation`), Java 21 enforcement, deterministic artifact collection, and script-level contract tests. What is missing is the production release lane: Central publication wiring, release workflow and approval gating, deterministic release asset packaging, and end-to-end requirement traceability artifacts.

Current ecosystem guidance has shifted after the OSSRH sunset: publishing workflows must target Central Portal-compatible flows rather than legacy OSSRH assumptions. Gradle docs now explicitly call out that Maven Central no longer supports the legacy protocol after 2025-06-30 and recommends dedicated Central publishing plugins. Sonatype's own docs also state there is currently no first-party Gradle plugin and point to community options, including JReleaser.

One implementation nuance matters for deterministic release policy: Sonatype Central publication requirements still require legacy checksum sidecars for deployed Maven files (`.md5` and `.sha1`) while this phase's locked release-bundle contract requires SHA-256 as the public checksum standard for GitHub release assets. Plan for both checksum surfaces explicitly to avoid release-day validation failures.

The most reliable implementation path for this phase is: keep Gradle as the source of artifact truth (`maven-publish` + `signing`), use JReleaser for Central/GitHub release orchestration and checksum/signature fan-out, generate SBOM via CycloneDX Gradle plugin, and add a strict traceability gate that blocks release unless every v1 requirement has explicit automated test references and runnable commands.

**Primary recommendation:** Use a tag-only, signed, environment-gated release workflow built around Gradle publishing + JReleaser + CycloneDX + requirement-traceability JSON gate, with deterministic artifacts and fail-closed preflight checks.
</research_summary>

<implementation_reality>
## Current Code: What Exists vs Missing

### Already in place (reuse directly)
- `build.gradle.kts` already applies `maven-publish` to subprojects and enforces Java toolchain 21.
- `.github/workflows/yanote-ci.yml` already provides deterministic CI checks, Java 21 setup, merge-group support, and always-on artifact/summary flow.
- `.github/BRANCH_PROTECTION.md` already defines stable merge-blocking check contracts.
- `scripts/ci/*` already includes contract tests and deterministic artifact/summary behavior for CI.
- `gradle.properties` already has an explicit snapshot baseline (`0.1.0-SNAPSHOT`) to transition into release tags.

### Missing for Phase 5
- No release workflow (`.github/workflows/release*.yml`) exists.
- No GitHub release-note template (`.github/release.yml`) exists.
- No Maven Central-ready publishing/signing config exists in module build files (`withSourcesJar`, `withJavadocJar`, POM metadata, signing configuration).
- No Central Portal deployer configuration (`jreleaser.yml` or equivalent) exists.
- No SBOM generation setup exists.
- No requirement-to-test traceability artifact generator/gate exists.
</implementation_reality>

<standard_stack>
## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| Gradle Wrapper | 8.10.2 (repo baseline) | Build + publication orchestration | Existing project baseline; preserves deterministic behavior already proven in CI. |
| Gradle `maven-publish` + `signing` | Built into Gradle 8.10.2 | Publish Maven artifacts and signatures | Official Gradle publishing path; directly aligns with Central requirements for signed artifacts. |
| `java-gradle-plugin` + `maven-publish` interaction | Gradle current docs | Publish Gradle plugin artifacts + marker publications to Maven repos | Officially supported auto-wiring for plugin main + marker publications when `maven-publish` is applied. |
| `org.jreleaser` | 1.23.0 (Plugin Portal, 2026-02-28) | Central Portal publishing + GitHub release automation + checksums/signatures | Sonatype lists it as a supported community path for Portal publishing; JReleaser enforces many Central rules pre-deploy. |
| GitHub Actions (`actions/checkout@v5`, `actions/setup-java@v5`, `gradle/actions/setup-gradle@v5`, `actions/upload-artifact@v4`) | Current major lines used in repo | Reproducible tag pipeline + artifact retention | Matches existing CI baseline; upload-artifact v4 provides immutable archives and deterministic retention controls. |
| CycloneDX Gradle Plugin (`org.cyclonedx.bom`) | 3.2.0 | SBOM generation for release bundle | Standard OSS SBOM generation path in Gradle builds; supports aggregate multi-project SBOM output. |

### Supporting
| Library/Tool | Version | Purpose | When to Use |
|--------------|---------|---------|-------------|
| `.github/release.yml` auto-release-note config | GitHub native | Deterministic release note categorization | Use for consistent Summary/Breaking/Upgrade/Verification sections and changelog scoping. |
| `git verify-tag` | Git 2.50+ docs current | Enforce signed-tag contract before publish | Use as preflight guard before any publish/deploy step. |
| `GITHUB_STEP_SUMMARY` | GitHub native | Human-readable release verification summary | Use for concise release evidence and failure triage in workflow UI. |
| Existing CI scripts (`scripts/ci/*`) | Current repo | Deterministic command, artifact, and summary patterns | Reuse established contract patterns for release preflight and traceability summary generation. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `org.jreleaser` for Central + GitHub release orchestration | Multiple separate tools (community Central plugin + custom `gh release` scripts + custom checksum/sign scripts) | More moving parts and greater drift risk; harder to keep deterministic and auditable. |
| CycloneDX plugin for SBOM | JReleaser catalog/syft-only approach | CycloneDX Gradle plugin is simpler to integrate in existing Gradle-centric build/test flow. |
| Tag-triggered `push.tags` release workflow | `release.published`-triggered workflow | Tag push keeps release as source of truth and makes preflight-before-publish easier to control. |

**Installation / setup commands (implementation-time):**
```bash
./gradlew test
./gradlew publishToMavenLocal
./gradlew cyclonedxBom
./gradlew jreleaserConfig
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
.github/
├── workflows/
│   ├── yanote-ci.yml                 # Existing deterministic CI checks (Phase 4)
│   └── release.yml                   # New: tag-only release pipeline with approval gate
├── release.yml                       # New: GitHub auto-generated release notes categories
scripts/
├── release/
│   ├── preflight.sh                  # New: signed tag + semver + prerequisites checks
│   ├── assemble-release-assets.sh    # New: deterministic asset layout + manifest
│   └── verify-traceability.mjs       # New: QUAL-01 hard gate
.planning/
├── REQUIREMENTS.md                   # Canonical requirement inventory (already locked)
└── traceability/
    ├── v1-requirements-tests.json    # New: schema-versioned requirement->test map
    └── v1-requirements-tests.md      # New: concise human summary paired with JSON
jreleaser.yml                         # New: Central + GitHub release configuration
```

### Pattern 1: Tag-Only, Signed, Deterministic Release Entry
**What:** Release workflow runs only on semver tags (`vMAJOR.MINOR.PATCH`) and verifies cryptographic tag signatures before publication.  
**When to use:** Every production release and hotfix release.  
**Why:** Prevents branch-based drift and enforces immutable release provenance.

### Pattern 2: Two-Stage Gate (Preflight -> Approval -> Publish)
**What:** Split release workflow into strict preflight checks and a publish job protected by one manual environment approval.  
**When to use:** All external publication to Central/GitHub.  
**Why:** Keeps deterministic failure behavior for prerequisites and preserves required human accountability.

### Pattern 3: Explicit Publication Allowlist
**What:** Publish only the locked v1 modules (`yanote-core`, recorder, test-tag adapters, Gradle plugin artifacts) and explicitly exclude `examples/*`.  
**When to use:** Gradle publication configuration and release asset assembly.  
**Why:** Prevents accidental public surface expansion and keeps compatibility scope controlled.

### Pattern 4: Release Bundle as Verifiable Contract
**What:** Publish deterministic asset set: binaries + checksums + signatures + SBOM + traceability JSON/summary + manifest.  
**When to use:** GitHub Release and archive artifacts for release runs.  
**Why:** Third parties can independently verify integrity and requirement accountability.

### Pattern 5: Requirement Traceability as Hard Release Gate
**What:** Generate schema-versioned requirement-to-test mapping from `.planning/REQUIREMENTS.md` and explicit test selectors; fail release if coverage < 100% or mapped tests are flaky/quarantined.  
**When to use:** Pre-publish gate in release workflow.  
**Why:** QUAL-01 demands strict requirement accountability, not best-effort reporting.

### Anti-Patterns to Avoid
- **Legacy OSSRH assumptions:** do not target old OSSRH-only flow as v1 default.
- **Publishing all subprojects blindly:** do not auto-publish `examples/*` or unintended modules.
- **Mutable or ad hoc asset names:** do not let release bundle naming vary per run.
- **Unverified tag provenance:** do not publish from unsigned or unverified tags.
- **Heuristic traceability:** do not infer requirement coverage from test file names only; require explicit mapping records.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Maven Central rule validation | Custom bash checks for POM/signature/sources/javadocs | JReleaser `applyMavenCentralRules` + Sonatype requirement-aligned checks | Avoid incomplete validation and late release-day failures. |
| Release checksums/signatures for many assets | Ad hoc loops and hand-managed signature lists | JReleaser release `checksums/signatures` controls | Reduces integrity drift and missing-proof edge cases. |
| Release notes categorization logic | Bespoke parser over PR titles | GitHub `.github/release.yml` + generated notes | Native mechanism is stable and easier to maintain. |
| SBOM document construction | Custom JSON assembly scripts | CycloneDX Gradle plugin (`cyclonedxBom`) | Produces spec-valid SBOMs with less custom logic. |
| Requirement coverage inference | Regex over test names/logs as source of truth | Explicit schema-versioned requirement->test mapping artifact + validator | Guarantees deterministic, auditable QUAL-01 accountability. |

**Key insight:** This phase succeeds by composing proven ecosystem release primitives, not by inventing new release infrastructure.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Central publish fails at cut time
**What goes wrong:** Tag pipeline reaches publish stage and fails on POM/signature/sources/javadocs requirements.  
**Why it happens:** Publication contract is not validated continuously before release tags.  
**How to avoid:** Add preflight gate that validates staged artifacts and required metadata before publish job starts.  
**Warning signs:** Missing `.asc`, missing `-sources.jar`/`-javadoc.jar`, or metadata complaints in dry runs.

### Pitfall 2: Checksum policy mismatch blocks publication
**What goes wrong:** Release process generates only SHA-256 proofs and Central rejects upload because required checksum sidecars are missing.  
**Why it happens:** Teams conflate GitHub release integrity policy with Central transport requirements.  
**How to avoid:** Keep SHA-256 as release-asset standard while ensuring Central deploy artifacts include required sidecars (or tool-managed equivalents) for repository acceptance.  
**Warning signs:** Central validation errors mentioning missing `.md5`/`.sha1` files.

### Pitfall 3: Legacy protocol assumptions break release flow
**What goes wrong:** Workflow still assumes legacy OSSRH path and fails against current Central expectations.  
**Why it happens:** Release automation copied from older Maven Central tutorials.  
**How to avoid:** Use Central Portal-compatible tooling/config and document old OSSRH flow as deprecated.  
**Warning signs:** References to `s01.oss.sonatype.org` as primary path for stable releases.

### Pitfall 4: Release provenance is weak
**What goes wrong:** Release can be triggered from unsigned or non-main tags, reducing trust.  
**Why it happens:** Workflow triggers on tags but does not verify signature/lineage constraints.  
**How to avoid:** Preflight with signed-tag verification and main-branch ancestry checks; fail closed.  
**Warning signs:** Tags can be created from arbitrary branches and still publish.

### Pitfall 5: Determinism drift in release assets
**What goes wrong:** Same tag reruns generate different names, manifests, or checksums.  
**Why it happens:** Asset assembly scripts use timestamps/random naming or unstable file order.  
**How to avoid:** Use strict naming convention, stable sort order, and deterministic manifest generation.  
**Warning signs:** Asset filenames differ across reruns for identical tag.

### Pitfall 6: Manual approval bypasses least privilege
**What goes wrong:** Publish job has broad permissions/secrets without scoped approval gate.  
**Why it happens:** Environment protection is not configured, or secrets are available in preflight jobs.  
**How to avoid:** Isolate publish job behind protected environment and minimal permissions per job.  
**Warning signs:** Credentials are accessible before approval or from non-release jobs.

### Pitfall 7: QUAL-01 appears green but is not auditable
**What goes wrong:** Traceability report says 100% but entries are stale, flaky, or not tied to runnable test commands.  
**Why it happens:** Mapping is freeform text without schema validation and automated command verification.  
**How to avoid:** Enforce schema-versioned JSON map, command existence checks, and flaky-test exclusion rules.  
**Warning signs:** Requirements map to test files but not specific test cases/commands.
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Signed Maven publication with sources/javadocs (Gradle)
```kotlin
// Source: https://docs.gradle.org/current/userguide/publishing_maven.html
plugins {
    `java-library`
    `maven-publish`
    signing
}

java {
    withJavadocJar()
    withSourcesJar()
}

publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
        }
    }
}

signing {
    sign(publishing.publications["mavenJava"])
}
```

### Tag-only workflow trigger for releases
```yaml
# Source: https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows
on:
  push:
    tags:
      - v1.**
```

### Manual approval gate with GitHub environments
```yaml
# Source: https://docs.github.com/en/actions/deployment/about-deployments/deploying-with-github-actions
jobs:
  preflight:
    runs-on: ubuntu-latest
    steps:
      - run: echo "validate release prerequisites"

  publish:
    needs: [preflight]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: echo "publish after approval"
```

### JReleaser Central Portal + signing baseline
```yaml
# Source: https://jreleaser.org/guide/latest/examples/maven/maven-central.html
signing:
  pgp:
    active: ALWAYS
    armored: true

deploy:
  maven:
    mavenCentral:
      sonatype:
        active: RELEASE
        url: https://central.sonatype.com/api/v1/publisher
        stagingRepositories:
          - target/staging-deploy
```

### GitHub auto-generated release notes config
```yaml
# Source: https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes
changelog:
  categories:
    - title: Breaking Changes
      labels:
        - breaking-change
    - title: Other Changes
      labels:
        - "*"
```
</code_examples>

<state_of_the_art>
## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OSSRH/Nexus2 as default publication path | Central Portal-compatible publishing flow | OSSRH sunset date announced for 2025-06-30 | Release tooling must target Portal APIs or compatible translators/plugins. |
| Generic Maven publish assumptions for Central | Dedicated Central-aware plugin/tooling in Gradle workflows | Post-2025 Central protocol change | Build scripts need explicit Central publishing strategy, not only vanilla `maven-publish`. |
| Mutable artifact upload semantics (`upload-artifact` older behavior) | Immutable artifact archives in `upload-artifact@v4` | v4 backend changes | Stronger reproducibility and lower artifact corruption risk in CI evidence. |
| Freeform release notes text | Structured generated notes with `.github/release.yml` categories | Current GitHub release workflow norms | Consistent changelog scope and maintainable release-note quality. |

**Deprecated/outdated:**
- OSSRH-first release design as the primary v1 contract.
- Treating release publication as branch-push driven rather than signed tag driven.
</state_of_the_art>

<open_questions>
## Open Questions

1. **Exact traceability schema fields and artifact names**
   - What we know: schema-versioned JSON + concise summary are locked requirements.
   - What's unclear: final field naming (`requirementId`, `tests[]`, `commands[]`, etc.) and canonical file names.
   - Recommendation: decide schema in Wave 1 and freeze as v1 compatibility surface.

2. **Deterministic retry policy details for external publish outages**
   - What we know: retries are allowed for the same tag under explicit conditions and logging.
   - What's unclear: maximum retry count/backoff and exact "safe retry" predicates.
   - Recommendation: codify retry policy in release runbook + script-level contract tests before enabling publish.
</open_questions>

<validation_architecture>
## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Java: JUnit 5 via Gradle; Node: Vitest (`yanote-js`); CI contract tests: Node `node:test` scripts |
| Config file | `build.gradle.kts` (+ module build files), `yanote-js/package.json`; no dedicated root test config file |
| Quick run command | `./gradlew :yanote-gradle-plugin:test && npm -C yanote-js test && node --test scripts/ci/*.test.mjs` |
| Full suite command | `./gradlew test distAll && npm -C yanote-js ci && npm -C yanote-js test && bash scripts/ci/run-v1-e2e.sh` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RELS-01 | Signed Maven Central publication for scoped v1 modules from tag pipeline | release integration + preflight contract | `./gradlew publishToMavenLocal && node --test scripts/release/maven-central-preflight.contract.test.mjs` | ❌ Wave 0 |
| RELS-02 | Tagged versions produce deterministic GitHub Releases with changelog/usage/assets | workflow contract + release integration | `node --test scripts/release/github-release.contract.test.mjs` | ❌ Wave 0 |
| RELS-03 | Release pipeline is reproducible and fail-closed for missing signing/publishing prerequisites | negative-path workflow contract | `node --test scripts/release/release-failclosed.contract.test.mjs` | ❌ Wave 0 |
| QUAL-01 | 100% v1 requirement-to-test mapping with strict traceability gate | schema validation + gate integration | `node scripts/release/verify-traceability.mjs --requirements .planning/REQUIREMENTS.md --map .planning/traceability/v1-requirements-tests.json` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test scripts/release/*.contract.test.mjs` (or targeted contract file) + touched module tests.
- **Per wave merge:** `./gradlew test publishToMavenLocal cyclonedxBom && npm -C yanote-js test`.
- **Phase gate:** full suite + tag-simulated release workflow dry-run + traceability gate must pass before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `.github/workflows/release.yml` - tag-only release workflow with explicit approval gate.
- [ ] `.github/release.yml` - deterministic release note categorization template.
- [ ] Central publication/signing config in module `build.gradle.kts` files (`withSourcesJar`, `withJavadocJar`, POM metadata, signing).
- [ ] `jreleaser.yml` - Central Portal + GitHub release orchestration config.
- [ ] `org.cyclonedx.bom` integration and SBOM artifact wiring.
- [ ] `scripts/release/preflight.sh` - signed tag, semver, and prerequisites validation.
- [ ] `scripts/release/verify-traceability.mjs` + schema file and contract tests.
- [ ] `.planning/traceability/v1-requirements-tests.json` + generated summary markdown.

</validation_architecture>

<sources>
## Sources

### Primary (HIGH confidence)
- `.planning/phases/05-oss-release-and-traceable-verification/05-CONTEXT.md` - locked decisions, discretion, and deferred scope.
- `.planning/REQUIREMENTS.md` - RELS-01/02/03 and QUAL-01 requirement definitions.
- `.planning/STATE.md`, `.planning/phases/04-java-build-and-ci-delivery-surfaces/04-VERIFICATION.md` - completed Phase 4 reality and deterministic CI baseline.
- `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`, `.github/workflows/yanote-ci.yml`, `.github/BRANCH_PROTECTION.md`, `scripts/ci/*` - current implementation evidence.
- [Gradle Maven Publish docs](https://docs.gradle.org/current/userguide/publishing_maven.html) - signing, sources/javadocs, and current Maven Central publishing guidance.
- [Gradle Plugin Development docs](https://docs.gradle.org/current/userguide/java_gradle_plugin.html) - plugin marker publication behavior with `maven-publish`.
- [Sonatype OSSRH sunset announcement](https://central.sonatype.org/news/20250326_ossrh_sunset/) - lifecycle change and migration direction.
- [Sonatype Portal Gradle guidance](https://central.sonatype.org/publish/publish-portal-gradle/) - no official first-party Gradle plugin; community plugin landscape.
- [Sonatype publication requirements](https://central.sonatype.org/publish/requirements/) - signatures, checksums, sources/javadocs, and required POM metadata.
- [JReleaser Maven Central example](https://jreleaser.org/guide/latest/examples/maven/maven-central.html) - `applyMavenCentralRules`, signing, and Central Portal endpoint usage.
- [JReleaser GitHub release reference](https://jreleaser.org/guide/latest/reference/release/github.html) - release assets/checksums/signatures/catalogs behavior.
- [JReleaser signing reference](https://jreleaser.org/guide/latest/reference/signing.html) - artifact/file signing capabilities.
- [GitHub Actions events docs](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows) - tag triggers, release event behavior, merge_group notes.
- [GitHub Actions deployment/environments docs](https://docs.github.com/en/actions/deployment/about-deployments/deploying-with-github-actions) - required reviewers and manual approval behavior.
- [GitHub releases docs](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) - tag-based release model.
- [GitHub auto-generated release notes docs](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes) - `.github/release.yml` config.
- [GitHub workflow command docs (`GITHUB_STEP_SUMMARY`)](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#adding-a-job-summary) - summary reporting pattern.
- [actions/setup-java README](https://raw.githubusercontent.com/actions/setup-java/main/README.md) - publishing/GPG setup support and runner requirements.
- [gradle/actions README](https://raw.githubusercontent.com/gradle/actions/main/README.md) - `setup-gradle` behavior and wrapper validation context.
- [actions/upload-artifact README](https://raw.githubusercontent.com/actions/upload-artifact/main/README.md) - v4 immutability and retention behavior.
- [CycloneDX Gradle plugin README](https://raw.githubusercontent.com/CycloneDX/cyclonedx-gradle-plugin/master/README.md) - SBOM generation tasks and multi-project support.
- [Git `verify-tag` docs](https://git-scm.com/docs/git-verify-tag) - signed tag verification command.

### Secondary (MEDIUM confidence)
- [Gradle Plugin Portal: `org.jreleaser`](https://plugins.gradle.org/plugin/org.jreleaser) - current plugin version metadata.
- [JReleaser release history](https://jreleaser.org/guide/latest/release-history.html) - confirms version release timing and Gradle compatibility floor.
- [Gradle Plugin Portal: `com.gradle.plugin-publish`](https://plugins.gradle.org/plugin/com.gradle.plugin-publish) - current plugin-publish line and release timing context.

### Tertiary (LOW confidence)
- None.
</sources>

<metadata>
## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - based on official Gradle/Sonatype/GitHub/JReleaser docs plus current repo state.
- Architecture: HIGH - directly constrained by locked phase decisions and proven Phase 4 deterministic patterns.
- Pitfalls: HIGH - repeatedly documented failure modes in official release/publishing guidance and current repo gaps.

**Research date:** 2026-03-04  
**Valid until:** 2026-04-03
</metadata>

---

*Phase: 05-oss-release-and-traceable-verification*  
*Research completed: 2026-03-04*  
*Ready for planning: yes*
