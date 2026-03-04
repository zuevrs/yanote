# Phase 5: OSS Release and Traceable Verification - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a production release surface for v1 that publishes signed Java artifacts to Maven Central, creates versioned GitHub Releases with deterministic release assets, and proves full requirement-to-test accountability with a strict 100% traceability gate. This phase is about release and verification contracts only. It does not add new product capabilities, protocol support, UI, or non-Java ecosystem expansion.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<specifics>
## Specific Ideas

- Keep release as a deterministic product contract, not a best-effort CI convenience.
- Prefer strictness over flexibility for v1 release trust: signed tags, strict semver, strict metadata, strict traceability.
- Make release outputs independently verifiable by third parties (checksums/signature proof/SBOM + structured notes).
- Treat requirement accountability as a first-class release artifact, not an internal-only report.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `build.gradle.kts`: already applies `maven-publish` across subprojects and sets shared group/version baseline.
- `gradle.properties`: currently defines `0.1.0-SNAPSHOT`, providing clear versioning transition point into release tags.
- `.github/workflows/yanote-ci.yml`: existing deterministic CI checks and artifact flow can be reused as release preflight foundation.
- `scripts/ci/assert-java21.sh`: existing runtime baseline guard can be reused in release gating.
- `scripts/ci/collect-yanote-artifacts.sh` and `scripts/ci/render-yanote-summary.mjs`: existing deterministic artifact and summary patterns can inform release bundle generation.
- `.planning/REQUIREMENTS.md`: canonical requirement inventory and phase mapping already established.
- `.planning/phases/04-java-build-and-ci-delivery-surfaces/04-VERIFICATION.md`: demonstrates live verification reporting pattern and evidence structure.

### Established Patterns
- Compatibility contracts are treated as explicit public surfaces (CLI output, check names, deterministic ordering).
- Fail-closed behavior is preferred when evidence is incomplete or invalid.
- CI outputs emphasize deterministic machine-readable artifacts paired with concise human summaries.
- Java 21 baseline and merge-blocking governance are already locked and should be preserved in release workflows.

### Integration Points
- Release workflow integration point: GitHub Actions release pipeline triggered by release tags.
- Maven publication/signing integration point: Gradle publishing/signing configuration at root/module boundaries.
- GitHub Release integration point: deterministic asset packaging from existing `dist/` and verification outputs.
- Traceability integration point: aggregate requirement/test evidence from plan/summary/verification artifacts into a versioned release-grade report.

</code_context>

<deferred>
## Deferred Ideas

- Official pre-release channels (`-rc`, `-beta`) as public contract - deferred beyond v1 stable release surface.
- Plugin Portal co-equal distribution policy - deferred; v1 contract is Maven Central first.
- Non-GitHub release channels and cross-platform release orchestration - outside current phase scope.
- v2 traceability analytics beyond strict requirement->test accountability (deeper insights, trend intelligence) - future phase scope.

</deferred>

---

*Phase: 05-oss-release-and-traceable-verification*
*Context gathered: 2026-03-04*
