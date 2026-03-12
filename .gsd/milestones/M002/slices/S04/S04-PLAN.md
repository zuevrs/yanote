# S04: Version, Release, And Support Boundaries

**Goal:** Expose one authoritative public boundary surface that tells a repo visitor which release line is current, where released changes live, how the latest stable release relates to repository `HEAD`, and which stable surfaces, compatibility assumptions, and limitations apply today.
**Demo:** A visitor can open `README.md` or `docs/README.md`, follow one clear link to `docs/release-and-support.md`, and immediately see the current stable line, latest stable tag, GitHub Releases pointer, repo-state-vs-release distinction, supported/stable surfaces, runtime expectations, and current limitations without digging through maintainer-only files.

## Must-Haves

- `docs/release-and-support.md` exists as the single Russian-first public owner for current release visibility and support boundaries.
- The boundary doc states that Git tags and GitHub Releases are the authoritative public release surfaces, while `gradle.properties` `0.1.0-SNAPSHOT` and current analyzer `0.0.0` markers are not the public current version.
- The boundary doc makes the stable/published product surface explicit: current `v1.0.x` line, latest stable tag, published modules, Gradle plugin contract, report schema version, verified Spring MVC recorder path, and secondary fallback bundles.
- The boundary doc explains compatibility and limitation boundaries truthfully: Java 21 verified baseline, Node `>=20` minimum with repo/dev pin `22`, Spring Boot 3.x / Spring MVC as the verified recorder path, no first-class non-Java onboarding yet, and no runnable Cucumber demo yet.
- `README.md` and `docs/README.md` add thin version/support pointers that expose the new boundary surface without replacing the concept-first onboarding path.
- `scripts/docs/verify-s04-boundaries.sh` dynamically resolves the latest `v*` tag and fails with targeted diagnostics when release/support wording, landing links, or non-authoritative version-source warnings drift.

## Proof Level

- This slice proves: operational
- Real runtime required: no
- Human/UAT required: no

## Verification

- `bash scripts/docs/verify-s04-boundaries.sh`
- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`

## Observability / Diagnostics

- Runtime signals: targeted shell assertions from `verify-s04-boundaries.sh` that print the resolved latest stable tag/release line and the exact missing clause, broken link, or misleading version-source statement.
- Inspection surfaces: `bash scripts/docs/verify-s04-boundaries.sh`, `README.md`, `docs/README.md`, `docs/release-and-support.md`, and repo truth sources such as release tags and release-policy files.
- Failure visibility: verifier output should identify whether the regression is in release visibility, support/compatibility wording, landing discoverability, or non-authoritative version-source handling.
- Redaction constraints: none — diagnostics must stay on repo metadata and documentation text only, never secrets or environment-specific credentials.

## Integration Closure

- Upstream surfaces consumed: `README.md`, `docs/README.md`, `docs/maintainers/release-signing.md`, `gradle.properties`, `.github/workflows/release.yml`, `scripts/release/preflight.sh`, `build.gradle.kts`, `yanote-js/package.json`, `dist/node-analyzer/package.json`, `.nvmrc`, `yanote-js/src/report/schema.ts`, `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt`, `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanotePluginContractTest.kt`, `docs/guides/recorder-spring-mvc.md`, `docs/guides/test-tagging.md`
- New wiring introduced in this slice: one public release/support reference file plus root/docs landing pointers and a dynamic verifier that ties those docs back to live tag/release truth.
- What remains before the milestone is truly usable end-to-end: S05 must fold this boundary surface into the broader docs architecture, S06 must add the wider maintained-product trust surfaces, and S08 must re-run the concept → recorder → analyzer journey from the docs after those repo surfaces settle.

## Tasks

- [x] **T01: Codify the public boundary contract and seed the reference surface** `est:45m`
  - Why: S04 needs an executable boundary before wording starts moving around, and the slice needs a real public owner file to anchor later navigation and support claims.
  - Files: `scripts/docs/verify-s04-boundaries.sh`, `docs/release-and-support.md`
  - Do: Create a verifier that resolves the latest `v*` tag and expected release line, checks for the dedicated public boundary doc, required release/support sections, GitHub Releases visibility, root/docs landing pointers, and explicit warnings about snapshot/`0.0.0` version markers; add an initial Russian-first `docs/release-and-support.md` skeleton with the required section structure so later tasks fill content instead of inventing shape.
  - Verify: `bash scripts/docs/verify-s04-boundaries.sh` is expected to fail only on not-yet-filled S04 clauses or missing landing pointers, while `bash scripts/docs/verify-s03-landing.sh` and `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh` still pass.
  - Done when: the verifier exists with targeted diagnostics and the public boundary doc exists as a real user-facing surface with the final section skeleton.
- [x] **T02: Publish the authoritative release and support reference** `est:1h`
  - Why: R027 and R028 are only met if one public doc assembles the real release line, stable surfaces, compatibility assumptions, and known limits without asking readers to reverse-engineer workflow files.
  - Files: `docs/release-and-support.md`, `scripts/docs/verify-s04-boundaries.sh`
  - Do: Fill the boundary doc with the current stable line, latest stable tag, GitHub Releases pointer, and repository-`HEAD` vs latest-release distinction; document why `0.1.0-SNAPSHOT` and analyzer `0.0.0` markers are non-authoritative; summarize published/stable surfaces, compatibility baselines, fallback bundles, and current limitations using the repo’s existing truth sources; refine the verifier so any remaining failures after this task are landing-pointer-only.
  - Verify: `bash scripts/docs/verify-s04-boundaries.sh` fails only on the README/docs discoverability clauses reserved for T03, and `bash scripts/docs/verify-s03-landing.sh` still passes.
  - Done when: `docs/release-and-support.md` alone provides a truthful answer for release visibility and support boundaries, and remaining verifier failures are isolated to T03-owned navigation links.
- [x] **T03: Wire version and support visibility into the main landings** `est:45m`
  - Why: The boundary doc does not satisfy the slice if it stays buried; repo visitors need to discover it from the existing concept-first root and docs landings.
  - Files: `README.md`, `docs/README.md`, `docs/release-and-support.md`, `scripts/docs/verify-s04-boundaries.sh`
  - Do: Add thin version/support pointers to `README.md` and `docs/README.md` that expose the current stable line and link to `docs/release-and-support.md`; keep the S03 concept-first guide ordering intact; make any final wording or verifier adjustments needed so the detailed boundary doc and landing summaries agree without turning the landings into a changelog or support-policy page.
  - Verify: `bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`
  - Done when: both main landings expose the new boundary surface clearly, the S04 verifier passes, and earlier doc verifiers still pass.

## Files Likely Touched

- `README.md`
- `docs/README.md`
- `docs/release-and-support.md`
- `scripts/docs/verify-s04-boundaries.sh`
