# M002/S04 — Research

**Date:** 2026-03-12

## Summary

This slice directly owns **R027** (current version, recent changes, and release visibility) and **R028** (stable support boundaries, limitations, and compatibility story). It also supports **R029** (documentation architecture) and **R030** (maintained-product trust surfaces). The repo already contains most of the truth S04 needs: signed `v1.0.x` release tags, a release workflow, Maven Central publication wiring, stable Gradle plugin contracts, Java 21 CI enforcement, Node runtime requirements, and explicit out-of-scope statements for broader ecosystem coverage. What is missing is not raw truth. What is missing is a single user-facing place where that truth is assembled coherently.

The main surprise is that the current-version story is structurally split. `docs/maintainers/release-signing.md` says the active public line is `v1.0.x` and gives `v1.0.122` as the latest example; local tags confirm `v1.0.122` is the latest stable release tag; but the working tree still exposes `version=0.1.0-SNAPSHOT` in `gradle.properties`, and both the source-built and bundled Node analyzer currently report `0.0.0` from `yanote-js/package.json` / `src/version.ts`. That means S04 cannot treat `gradle.properties`, `yanote --version`, or report `toolVersion` as the public current-version source without either documenting the distinction explicitly or doing extra version-stamping work.

The second surprise is that the “recent changes” surface is weaker than it looks. There is no `CHANGELOG.md`, `SUPPORT.md`, or other public boundary doc. The release workflow is deterministic and tag-driven, but `scripts/release/render-release-notes.mjs` renders generic section headings and upgrade bullets rather than a concrete repo-side change summary, and the root/docs landings do not link to GitHub Releases or Maven Central at all. On the current working branch, `HEAD` is already 12 commits ahead of `v1.0.122`, almost entirely with M002 documentation/navigation work. S04 therefore needs to distinguish **latest stable release** from **current repository state**, not pretend those are the same thing.

## Recommendation

Use **one authoritative public boundary document** plus light landing-page pointers, not a broad doc reorg.

1. **Add one user-facing boundary doc**
   - Recommended shape: a single Russian-first reference file such as `docs/reference/version-and-support.md` or `docs/reference/release-and-support.md`.
   - This file should become the authoritative home for:
     - current stable release line (`v1.0.x`)
     - latest stable release tag (`v1.0.122` today, but verified dynamically)
     - where to see released changes (GitHub Releases)
     - how repository `HEAD` relates to the latest stable release
     - stable published/product surfaces
     - compatibility assumptions and current limitations

2. **Keep root/docs changes thin and directional**
   - `README.md` should not absorb the whole compatibility/support matrix.
   - Add a short “version/support” pointer from the root landing and from `docs/README.md`.
   - Reuse the S03 navigation shape: root stays concept-first; the new boundary doc owns detail.

3. **Use release tags and GitHub Releases as the authoritative release version source**
   - Do **not** present `gradle.properties` `0.1.0-SNAPSHOT` as the current public version.
   - Do **not** present `yanote --version` / `toolVersion` as authoritative while they still resolve to `0.0.0`.
   - Explain the distinction plainly: workspace files may show development markers, while tagged GitHub Releases / Maven Central represent the stable public line.

4. **State support boundaries as supported surfaces, not as a support-SLA promise**
   - Supported/stable today:
     - `v1.0.x` public release line
     - Java-first workflow
     - Spring Boot 3.x / Spring MVC recorder path
     - Node analyzer with `>=20` runtime requirement
     - Gradle plugin id `io.github.zuevrs.yanote.gradle`
     - `yanoteReport` / `yanoteCheck` task names and limited extension surface
     - report schema `1.0.0`
   - Supported but explicitly secondary:
     - `dist/flatdir-recorder/` and `dist/node-analyzer/` as offline/smoke fallbacks
   - Not yet first-class / explicitly limited:
     - non-Java service ecosystems
     - runnable Cucumber demo
     - anything beyond the current Java-first recorder → events → analyzer path

5. **Summarize current repo-head changes separately from latest stable release**
   - Because the working tree is ahead of `v1.0.122`, the new doc should have a short section like “Current repository state relative to the latest stable release”.
   - Keep it lightweight and truthful: current repo work since `v1.0.122` is documentation/repository-maturity work, not a new published engine line.
   - Prefer a stable wording over hardcoding a fragile commit count.

6. **Add S04-specific verification**
   - Add a dedicated script such as `scripts/docs/verify-s04-boundaries.sh` rather than overloading the S03 landing verifier.
   - The verifier should dynamically resolve the latest `v*` tag and assert that the public boundary doc and its landing-page pointers contain:
     - current release line wording
     - latest stable tag
     - GitHub Releases pointer
     - runtime/compatibility assumptions
     - stable surfaces
     - known limitations/fallback boundary wording
   - It should also guard against version drift by ensuring the doc does not imply that `0.1.0-SNAPSHOT` or `0.0.0` are the authoritative public release version.

7. **Avoid turning S04 into S05/S06**
   - S04 should define the owning file and the public wording contract.
   - S05 can later place that file cleanly inside the broader information architecture.
   - S06 can later decide whether a root-level `CHANGELOG.md`, `SUPPORT.md`, `SECURITY.md`, or other trust files are warranted.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Public release-line truth | Git tags + `docs/maintainers/release-signing.md` + `.github/workflows/release.yml` | These are the only surfaces that currently agree on the real public release line. |
| Release boundary rules | `scripts/release/preflight.sh` | It already encodes minimum supported production line `v1.0.0+`, signed/annotated tags, snapshot blocking, and main-lineage policy. |
| Stable Gradle integration contract | `yanote-gradle-plugin` contract tests | They prove which task names and extension properties are intentionally stable instead of leaving that as prose-only policy. |
| Published module inventory | `build.gradle.kts` release allowlist + module `build.gradle.kts` POM metadata | This shows which repo modules are actually part of the published product surface and which are not. |
| Compatibility baselines | `.github/workflows/yanote-ci.yml`, `scripts/ci/assert-java21.sh`, `.nvmrc`, `yanote-js/package.json`, existing guides | These are already the truthful runtime signals; S04 should assemble them, not invent a new compatibility story. |
| Product limitations | `docs/requirements.md`, `docs/guides/test-tagging.md`, fallback `dist/*` READMEs | The repo already documents major limits and fallback boundaries; they just need to be centralized for users. |

## Existing Code and Patterns

- `../../../../../README.md` — concept-first root landing established by S03. Good place for a short version/support pointer, but not the place to dump the full matrix.
- `../../../../../docs/README.md` — already has a “deeper boundaries” seam. Natural place to link a dedicated version/support reference doc.
- `../../../../../docs/maintainers/release-signing.md` — currently the clearest repo surface for `v1.0.x`, latest `v1.0.122`, signed tags, and release workflow expectations, but it is maintainer-oriented and English-first.
- `../../../../../gradle.properties` — workspace/dev version marker (`0.1.0-SNAPSHOT`) plus release policy settings like `yanote.release.startVersion=1.0.0`. Important truth source, but not a user-facing current-version source.
- `../../../../../.github/workflows/release.yml` — tag-driven release workflow; overrides Gradle version with `-Pversion="${RELEASE_VERSION}"`, which explains why the repo can publish `v1.0.x` even while `gradle.properties` stays snapshot.
- `../../../../../scripts/release/preflight.sh` — authoritative release-policy contract: minimum production line `v1.0.0`, signed annotated tags only, no snapshot publication, main-lineage enforcement.
- `../../../../../yanote-js/package.json`, `../../../../../yanote-js/src/version.ts`, `../../../../../dist/node-analyzer/package.json` — current Node/analyzer version markers are all `0.0.0`; these cannot be treated as public release truth.
- `../../../../../build.gradle.kts` — release allowlist for published modules (`yanote-core`, `yanote-recorder-spring-mvc`, `yanote-test-tags-restassured`, `yanote-test-tags-cucumber`, `yanote-gradle-plugin`) and explicit exclusion of example modules from publication.
- `../../../../../yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt` + `../../../../../yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanotePluginContractTest.kt` — stable Gradle plugin interface: plugin id, `yanoteReport`, `yanoteCheck`, and limited extension surface.
- `../../../../../yanote-js/src/report/schema.ts` — stable report schema version `1.0.0`; good candidate for the “stable surfaces” section of the public boundary doc.
- `../../../../../.github/workflows/yanote-ci.yml` + `../../../../../scripts/ci/assert-java21.sh` — explicit Java 21 verification baseline.
- `../../../../../.nvmrc` + `../../../../../yanote-js/package.json` — repo dev currently pins Node 22, while the analyzer promises `>=20`; this should be explained as verified/dev baseline vs minimum runtime, not flattened into one number.
- `../../../../../docs/guides/recorder-spring-mvc.md` — current verified recorder path is Spring Boot 3.x / Spring MVC only.
- `../../../../../docs/guides/test-tagging.md` — explicit current limitation: no runnable Cucumber demo yet.
- `../../../../../docs/requirements.md` — truthful inventory of deferred/out-of-scope items (non-Java ecosystem support, AsyncAPI/Kafka, dashboard UI), but too internal/English-first to be the main user-facing boundary doc.

## Constraints

- Public docs remain **Russian-first**.
- S04 owns version/release/support wording; **S05** owns the broader docs architecture and **S06** owns the wider maintained-product trust surfaces.
- The current public release truth lives in **tags/releases**, not in the workspace snapshot version and not in the Node CLI version marker.
- The current working branch/repo state may be **ahead of the latest stable release tag**, so docs must separate “latest stable release” from “current repository state”.
- The published product surface is **narrower than the repo surface**: examples are runnable proof assets, not published modules.
- Runtime claims must distinguish **minimum supported runtime** from **repo/CI verified baseline** where those differ (Node `>=20` vs `.nvmrc` `22`).
- Support-boundary wording must stay aligned with the maintained-product posture from M002: serious and explicit, but not community-first or high-bandwidth by implication.
- S03’s landing/navigation contract is already machine-checked; S04 should extend it with new boundary verification, not regress it.

## Common Pitfalls

- **Using `gradle.properties` as the public current version** — it is a workspace snapshot marker, not the authoritative release line.
- **Using `yanote --version` or report `toolVersion` as release truth** — both current analyzer surfaces still report `0.0.0`.
- **Treating generic release notes as sufficient “recent changes” visibility** — the current renderer is deterministic, but thin.
- **Promoting example modules as if they are published/support-equal product modules** — `build.gradle.kts` explicitly excludes them from publication.
- **Flattening Node 22 and Node `>=20` into one unsupported claim** — one is the repo dev pin, the other is the analyzer’s declared minimum runtime.
- **Promising broader ecosystem coverage or runnable Cucumber support** — those are not first-class proof surfaces today.
- **Scattering release/support statements across README, guides, and maintainer docs with no owner** — S04 needs one authoritative public document.
- **Letting S04 drift into public support-process policy** — this slice should describe product boundaries, not invent an external support operating model.

## Open Risks

- The analyzer version placeholder (`0.0.0`) is a real product-surface mismatch, not just a documentation quirk. S04 can document around it, but the rough edge remains until version-stamping is fixed.
- If the boundary doc hardcodes too much repo-state detail, it will drift quickly as `HEAD` moves past the latest tag.
- If S04 relies only on GitHub Releases for “recent changes”, users may still not get a clear repo-local picture of what changed after the last stable tag.
- If S04 adds too many new root-level public files now, it may pre-empt S06’s trust-surface decisions and create churn.
- If the root landing does not surface the new boundary doc clearly enough, R027 will still feel buried even if the content exists.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Gradle | `pluginagentmarketplace/custom-plugin-java@java-gradle` | available — install with `npx skills add pluginagentmarketplace/custom-plugin-java@java-gradle` |
| GitHub Actions | `dalestudy/skills@github-actions` | available — install with `npx skills add dalestudy/skills@github-actions` |
| Maven Central / release pipeline | `pluginagentmarketplace/custom-plugin-java@java-maven-gradle` | available — install with `npx skills add pluginagentmarketplace/custom-plugin-java@java-maven-gradle` |
| JReleaser | none found | none found |

## Sources

- The public release line is currently only explicit in maintainer-oriented release docs and local tags: `docs/maintainers/release-signing.md` says `v1.0.x` / latest `v1.0.122`, and local tags confirm `v1.0.122` as the newest stable release tag (source: [release-signing.md](../../../../../docs/maintainers/release-signing.md); verified via `git tag --list 'v*' --sort=-version:refname | head` and `git show -s --format='%h %ci %d %s' v1.0.122`).
- Current repository state is ahead of the latest stable release, so S04 must separate repo-head from public release visibility (source: verified via `git describe --tags --always --dirty`, `git log --oneline v1.0.122..HEAD`, and `git diff --name-only v1.0.122..HEAD`).
- Workspace and analyzer version markers are not authoritative public version surfaces today: Gradle stays on `0.1.0-SNAPSHOT`, release builds override version from the tag, and both source-built and bundled CLIs report `0.0.0` (source: [gradle.properties](../../../../../gradle.properties), [.github/workflows/release.yml](../../../../../.github/workflows/release.yml), [yanote-js/package.json](../../../../../yanote-js/package.json), [version.ts](../../../../../yanote-js/src/version.ts), [dist/node-analyzer/package.json](../../../../../dist/node-analyzer/package.json); verified via `node yanote-js/dist/yanote.cjs --version` and `node dist/node-analyzer/bin/yanote.cjs --version`).
- Release visibility is real but thin: the repo has deterministic release workflow/configuration, yet no committed changelog/support file and only generic rendered release notes (source: [render-release-notes.mjs](../../../../../scripts/release/render-release-notes.mjs), [github-release.contract.test.mjs](../../../../../scripts/release/github-release.contract.test.mjs), [.github/release.yml](../../../../../.github/release.yml), [.github/workflows/release.yml](../../../../../.github/workflows/release.yml); verified via `find . -maxdepth 2 -type f \( -name 'CHANGELOG*' -o -name 'SUPPORT*' -o -name 'SECURITY*' -o -name 'RELEASE*' \)`).
- Stable product surfaces already exist, but they are scattered across build files and tests: published modules are explicitly allowlisted, examples are excluded, and the Gradle plugin API is guarded by contract tests (source: [build.gradle.kts](../../../../../build.gradle.kts), [yanote-gradle-plugin/build.gradle.kts](../../../../../yanote-gradle-plugin/build.gradle.kts), [YanotePlugin.kt](../../../../../yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt), [YanotePluginContractTest.kt](../../../../../yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanotePluginContractTest.kt)).
- Compatibility assumptions are already truthful in code/docs and can be centralized instead of reinvented: Java 21 is enforced in CI, the analyzer declares Node `>=20`, repo dev pins Node 22, the verified recorder path is Spring MVC/Spring Boot 3.x, and Cucumber still has no runnable demo (source: [yanote-ci.yml](../../../../../.github/workflows/yanote-ci.yml), [assert-java21.sh](../../../../../scripts/ci/assert-java21.sh), [.nvmrc](../../../../../.nvmrc), [yanote-js/package.json](../../../../../yanote-js/package.json), [recorder-spring-mvc.md](../../../../../docs/guides/recorder-spring-mvc.md), [test-tagging.md](../../../../../docs/guides/test-tagging.md), [docs/requirements.md](../../../../../docs/requirements.md)).
- S03 already created the right navigation seam: root/docs landings are concept-first and can point to a dedicated boundary doc without reopening the larger docs-architecture problem (source: [README.md](../../../../../README.md), [docs/README.md](../../../../../docs/README.md), [T02-SUMMARY.md](../S03/tasks/T02-SUMMARY.md), [T03-SUMMARY.md](../S03/tasks/T03-SUMMARY.md)).
