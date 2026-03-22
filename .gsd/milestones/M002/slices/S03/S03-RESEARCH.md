# M002/S03 — Research

**Date:** 2026-03-12

## Summary

This slice directly owns **R022** (concept-first repository landing for engineers). It also supports **R025** (analyzer execution and report interpretation path), **R027** (version/release visibility), and **R029** (documentation architecture). The repo already contains the truthful product journey S03 needs to surface: a verified Spring recorder guide, a verified analyzer guide, an explicit test-tagging contract, runnable example assets, and machine-checked doc-link verification for the S01/S02 surfaces. The problem is not missing product truth. The problem is that the root surface still behaves like a hub of validated sub-docs instead of a product landing for a first-time engineer.

The current `README.md` opens with module inventory, then immediately routes readers into recorder, analyzer, and tagging guides. Its only “quick start” is `./gradlew test`, which proves the repo builds but does not explain what Yanote is, who it is for, or what meaningful outcome the user should expect. There is no `docs/README.md` and no `examples/README.md`, so directory browsing pushes user-facing guides, maintainer docs, and historical/internal artifacts into the same visual plane. That is the main navigation gap S03 needs to close before S05 formalizes the wider information architecture.

The main surprise is version-surface drift. The active release line in tags and maintainer docs is `v1.0.x` / latest `v1.0.122`, while the working tree still exposes `version=0.1.0-SNAPSHOT` in `gradle.properties` and `0.0.0` in `yanote-js/package.json`. That is not S03’s bug to solve, but it constrains the landing work: S03 should establish concept, workflow, and navigation, while avoiding hardcoded “current version” claims that S04 will need to reconcile properly.

## Recommendation

Use a **layered landing** approach instead of a doc reorg.

1. **Rewrite `README.md` as a product landing, not just a guide index**
   - Start with: what Yanote is, what problem it solves, who it is for, and the verified product loop.
   - The root loop should be explicit and short: **connect recorder → inspect `events.jsonl` → run analyzer → read coverage result**.
   - Keep the language Russian-first and product-oriented, not maintainership-oriented.

2. **Keep authoritative detail in the existing guides**
   - `docs/guides/recorder-spring-mvc.md` remains the canonical recorder setup and evidence guide.
   - `docs/guides/analyzer-coverage.md` remains the canonical analyzer + interpretation guide.
   - `docs/guides/test-tagging.md` remains the authoritative metadata-handoff reference.
   - The root landing should explain the journey and route into those guides, not duplicate their commands and coverage numbers.

3. **Add thin landing pages instead of moving lots of files**
   - Add `docs/README.md` as the user-facing docs map.
   - Add `examples/README.md` as the narrative wrapper for the repo demo assets, especially `examples/docker-compose.yml`.
   - Do not try to solve the full user/maintainer/history file reorganization here; S05 owns that broader structural cleanup.

4. **Preserve the existing verified guide graph**
   - Keep direct links from the root README to the canonical S01/S02 guides unless the verification scripts are updated in the same slice.
   - Preserve the current “primary path vs fallback” boundary: `dist/flatdir-recorder/` and `dist/node-analyzer/` stay demoted to offline/smoke fallback, not the main product story.

5. **Add S03-specific verification**
   - The existing S01/S02 doc-link scripts already protect canonical wording and cross-links.
   - S03 should add one new verification surface for the landing contract: required README sections, required links to canonical guides, and required separation between user-facing entry points vs maintainer/historical pointers.

6. **Leave version/support depth to S04**
   - S03 can reserve a small “current state” pointer if needed, but it should not invent a release/support story while the workspace and released version surfaces still disagree.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Canonical recorder/analyzer/tagging explanations | `docs/guides/recorder-spring-mvc.md`, `docs/guides/analyzer-coverage.md`, `docs/guides/test-tagging.md` | These are already the truthful product surfaces and are protected by slice-level verification. |
| Proof that the workflow actually works | `scripts/docs/verify-s01-recorder-path.sh` and `scripts/docs/verify-s02-analysis-path.sh` | They replay the real recorder → events → analyzer journey and anchor the landing story in executable proof instead of prose. |
| Cross-link and vocabulary protection | `scripts/docs/verify-s01-doc-links.sh` and `scripts/docs/verify-s02-doc-links.sh` | They already enforce canonical links and wording; S03 should extend this pattern, not replace it with manual review. |
| Runnable repo demo | `examples/springmvc-service/`, `examples/tests-restassured/`, `examples/docker-compose.yml` | The demo path already exists; it needs narrative framing, not a second parallel example stack. |
| Offline fallback positioning | `dist/flatdir-recorder/README.md` and `dist/node-analyzer/README.md` | These docs already define the fallback boundary correctly; S03 should preserve that demotion instead of re-explaining it from scratch. |

## Existing Code and Patterns

- `../../../../../README.md` — accurate root hub, but concept-light. Reuse its canonical links; change its role from “validated index” to “product landing”.
- `../../../../../docs/guides/recorder-spring-mvc.md` — authoritative recorder/evidence path. Link from the landing instead of copying setup detail into README.
- `../../../../../docs/guides/analyzer-coverage.md` — authoritative analyzer execution and report interpretation guide. It already explains the important `operations=100%` vs `status/aggregate=partial` nuance.
- `../../../../../docs/guides/test-tagging.md` — authoritative RestAssured/Cucumber metadata contract. It is important, but too advanced to dominate first-touch onboarding.
- `../../../../../scripts/docs/verify-s01-doc-links.sh` — existing recorder doc-graph verifier that currently passes; S03 must preserve or update its expected README wording and links intentionally.
- `../../../../../scripts/docs/verify-s02-doc-links.sh` — existing analyzer/tagging doc-graph verifier that currently passes; it also uses local markdown link checks that S03 can extend.
- `../../../../../scripts/docs/verify-s01-recorder-path.sh` — executable recorder proof, including request → non-empty `events.jsonl` → field checks.
- `../../../../../scripts/docs/verify-s02-analysis-path.sh` — executable analyzer proof, including happy-path output and threshold-failure behavior with persisted report.
- `../../../../../examples/docker-compose.yml` — strong end-to-end proof surface, but currently only discoverable as raw YAML; it needs a narrative landing page around it.
- `../../../../../examples/springmvc-service/README.md` and `../../../../../examples/tests-restassured/README.md` — useful runnable example docs, but they assume the reader already understands why these pieces matter.
- `../../../../../docs/maintainers/release-signing.md` — maintainer-only release truth. Useful for S04, but it should not be the first release/version surface exposed from the root landing.
- `../../../../../docs/plans/` and `../../../../../docs/traceability/` — valid historical/reference surfaces that should remain available, but should not sit on the primary onboarding path.

## Constraints

- Public repository docs remain **Russian-first**.
- The verified product path is still **Java-first / Spring-first**: Spring Boot 3.x recorder integration, Java 21 toolchain in the build, and Node `>=20` for the source-built analyzer path.
- The root landing should not promise a broader ecosystem story than the repo actually proves today.
- Existing S01/S02 doc-link scripts currently pass and enforce exact cross-links and wording; S03 must either preserve those invariants or update them deliberately.
- `dist/flatdir-recorder/` and `dist/node-analyzer/` are explicitly **offline/smoke fallback** surfaces, not the main product journey.
- There is no `docs/README.md` and no `examples/README.md` today, so directory-level navigation currently lacks an audience split.
- Version surfaces are inconsistent right now: workspace files expose snapshot/internal versions while Git tags and maintainer docs expose the active `v1.0.x` release line.
- S05 owns the bigger documentation architecture cleanup, so S03 should prefer additive landing/navigation pages over large file moves.

## Common Pitfalls

- **Turning the README into another link dump** — the root page must explain the product loop before routing into deep guides.
- **Promoting the repo demo or fallback bundles as the main adoption story** — keep the primary narrative centered on the verified recorder → events → analyzer path, with demos/fallbacks clearly secondary.
- **Linking first-time users straight into maintainer or historical docs** — those surfaces are real, but they should be explicitly demoted in the landing hierarchy.
- **Duplicating detailed commands or exact coverage numbers in README** — those facts already live in verified guides and proof scripts; duplication will drift.
- **Copying release/version claims into the root landing too early** — the current `0.1.0-SNAPSHOT` / `0.0.0` vs `v1.0.122` mismatch means S03 should frame, not overstate.
- **Hiding direct canonical guide links behind only new index pages** — current verification scripts expect direct README links to the canonical guides.

## Open Risks

- Without a new S03 verification script, landing-page regressions may slip through while S01/S02 verifiers still pass.
- If S03 tries to solve version, support, and limitations in depth, it will blur into S04 and likely produce a brittle stopgap.
- If S03 tries to solve the whole docs tree by moving files, it will blur into S05 and create unnecessary churn.
- Even with a better root landing, directory browsing will remain noisy until `docs/README.md` and likely `examples/README.md` exist.
- The current release truth is maintainers-first; users may still look for it immediately, so S03 needs to leave a clean seam for S04 instead of pretending the answer is already stable at the root.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Repository/product documentation | `github/awesome-copilot@documentation-writer` | available — install with `npx skills add github/awesome-copilot@documentation-writer` |
| README landing structure | `github/awesome-copilot@readme-blueprint-generator` | available — install with `npx skills add github/awesome-copilot@readme-blueprint-generator` |
| README craft / docs polish | `softaworks/agent-toolkit@crafting-effective-readmes` | available — install with `npx skills add softaworks/agent-toolkit@crafting-effective-readmes` |

## Sources

- The current root surface is accurate but structured as a hub of verified paths, with only `./gradlew test` as a quick-start command and direct routing into recorder/analyzer/tagging guides (source: [README.md](../../../../../README.md)).
- The authoritative recorder, analyzer, and tagging surfaces already exist and define the verified product journey S03 should surface rather than rewrite (source: [recorder-spring-mvc.md](../../../../../docs/guides/recorder-spring-mvc.md), [analyzer-coverage.md](../../../../../docs/guides/analyzer-coverage.md), [test-tagging.md](../../../../../docs/guides/test-tagging.md)).
- The repo already contains executable proof scripts for both halves of the journey, which makes the landing contract groundable in real verification instead of copywriting (source: [verify-s01-recorder-path.sh](../../../../../scripts/docs/verify-s01-recorder-path.sh), [verify-s02-analysis-path.sh](../../../../../scripts/docs/verify-s02-analysis-path.sh)).
- The current doc graph is machine-checked and passing today, which means S03 should extend the existing verification pattern instead of replacing it with manual conventions (source: [verify-s01-doc-links.sh](../../../../../scripts/docs/verify-s01-doc-links.sh), [verify-s02-doc-links.sh](../../../../../scripts/docs/verify-s02-doc-links.sh)).
- The runnable repo demo is real but under-narrated: the end-to-end flow exists through the example service, RestAssured tests, and Docker Compose file, but the compose entry point is still only raw YAML (source: [examples/springmvc-service/README.md](../../../../../examples/springmvc-service/README.md), [examples/tests-restassured/README.md](../../../../../examples/tests-restassured/README.md), [docker-compose.yml](../../../../../examples/docker-compose.yml)).
- Maintainer and historical/reference surfaces currently live close to user-facing docs and need demotion in the navigation hierarchy rather than deletion (source: [release-signing.md](../../../../../docs/maintainers/release-signing.md), [docs/plans/](../../../../../docs/plans/), [docs/traceability/](../../../../../docs/traceability/)).
- Version truth is currently split: workspace files expose snapshot/internal versions while release tags and maintainer docs expose the active release line; this constrains S03 to concept and navigation work, not deep version claims (source: [gradle.properties](../../../../../gradle.properties), [yanote-js/package.json](../../../../../yanote-js/package.json), [release-signing.md](../../../../../docs/maintainers/release-signing.md); verified via `git tag --sort=-version:refname | head`).
