---
estimated_steps: 5
estimated_files: 2
---

# T02: Publish the authoritative release and support reference

**Slice:** S04 — Version, Release, And Support Boundaries
**Milestone:** M002

## Description

Turn `docs/release-and-support.md` into the single public answer for release visibility and current support boundaries by assembling the repo’s scattered truth into one Russian-first reference that does not confuse repository `HEAD`, workspace snapshot markers, and published releases.

## Steps

1. Fill the release-visibility sections with the current stable line, latest stable tag, GitHub Releases link, and a plain explanation of how published releases differ from the current repository state.
2. Add explicit non-authoritative wording for `gradle.properties` `0.1.0-SNAPSHOT` and current analyzer `0.0.0` version markers so readers do not mistake them for the public version line.
3. Document the stable published/product surfaces: published Java modules, the Gradle plugin id and task names, report schema `1.0.0`, the verified Spring MVC recorder path, and the source-built analyzer versus secondary offline bundles.
4. Document compatibility assumptions and limitations truthfully: Java 21 verified baseline, Node `>=20` minimum with repo/dev pin `22`, Spring Boot 3.x / Spring MVC as the primary recorder path, no first-class non-Java onboarding yet, and no runnable Cucumber demo yet.
5. Adjust `scripts/docs/verify-s04-boundaries.sh` only as needed so that, after this task, any remaining failures are limited to the root/docs landing pointers owned by T03.

## Must-Haves

- [ ] `docs/release-and-support.md` names the current stable release line, latest stable tag, and GitHub Releases as the published change surface.
- [ ] The doc distinguishes latest stable release truth from current repository `HEAD` without hardcoding fragile repo-state counts.
- [ ] The doc explicitly demotes `0.1.0-SNAPSHOT` and analyzer `0.0.0` markers as non-authoritative public version sources.
- [ ] The doc lists stable surfaces, compatibility expectations, fallback boundaries, and current limitations in user-facing language.
- [ ] After this task, any remaining S04 verifier failures are limited to `README.md` / `docs/README.md` discoverability clauses.

## Verification

- `bash scripts/docs/verify-s04-boundaries.sh` — expected to fail only on the README/docs pointer clauses until T03 completes.
- `bash scripts/docs/verify-s03-landing.sh`

## Observability Impact

- Signals added/changed: no new runtime signals beyond the verifier introduced in T01; this task makes the diagnostic surface user-facing by naming the authoritative and non-authoritative version sources directly in the doc.
- How a future agent inspects this: read `docs/release-and-support.md`, then run `bash scripts/docs/verify-s04-boundaries.sh` to see which clause drifted.
- Failure state exposed: missing or misleading release/support wording becomes a named verifier failure instead of an ambiguous docs complaint.

## Inputs

- `docs/release-and-support.md` from T01 — skeleton that now needs real release/support content.
- `docs/maintainers/release-signing.md` — source of the public `v1.0.x` line and current signing/release expectations.
- `gradle.properties`, `.github/workflows/release.yml`, `scripts/release/preflight.sh` — explain why tag-driven releases, not the workspace snapshot version, define the public release line.
- `build.gradle.kts`, `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt`, `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanotePluginContractTest.kt`, `yanote-js/src/report/schema.ts` — truth sources for stable published surfaces.
- `.nvmrc`, `yanote-js/package.json`, `docs/guides/recorder-spring-mvc.md`, `docs/guides/test-tagging.md` — truth sources for compatibility assumptions and current limitations.

## Expected Output

- `docs/release-and-support.md` — authoritative public reference for current release visibility and support boundaries.
- `scripts/docs/verify-s04-boundaries.sh` — tuned so remaining failures after T02 are pointer-only if content is complete.
