---
id: M016
title: "Product-First Repository Surface And Shipping Automation"
status: complete
completed_at: 2026-03-29T08:19:54.588Z
key_decisions:
  - Use the release tag as the single fail-closed trigger for validating and publishing intended shipping surfaces.
  - Publish the analyzer as one official standalone CLI contract: `yanote-analyzer.zip` -> `bin/yanote`, while keeping the internal Node seam private.
  - Treat `.gsd/`, `.tmp*`, `.vite/`, and similar maintainer/process/proof surfaces as clone-local rather than part of the public repository face.
  - Assemble final acceptance as one thin stage-labeled verifier that delegates to existing proof owners and stops on the first failing surface.
  - Harden the recorder proof path with deterministic port readiness, bounded publish retry, fixture-local Spring plugin resolution through `mavenLocal()` / `mavenCentral()`, and no forced `--refresh-dependencies`.
key_files:
  - build.gradle.kts
  - yanote-js/bin/yanote
  - .github/workflows/release.yml
  - scripts/ci/verify-m016-s02-release-pipeline.sh
  - scripts/docs/verify-s03-public-artifact-boundary.sh
  - scripts/docs/verify-m016-s04-short-docs.sh
  - scripts/docs/verify-m016-s05-public-surface.sh
  - scripts/docs/verify-s01-recorder-path.sh
  - scripts/docs/verify-s01-recorder-path.contract.test.mjs
  - test/fixtures/recorder-spring-smoke/settings.gradle.kts
  - README.md
  - docs/README.md
  - docs/guides/getting-started.md
  - docs/maintainers/public-surface-proof.md
  - docs/release-and-support.md
  - examples/README.md
lessons_learned:
  - For public proof paths, package contracts and docs have to move with the same runtime verifier; prose-only cleanup is not enough.
  - A top-level integration verifier should delegate to existing owner verifiers under stable stage labels instead of duplicating assertions.
  - For Gradle-backed smoke fixtures, fixture-local `pluginManagement` module mappings are more reliable than relying on Plugin Portal refresh behavior during milestone proof.
  - Recorder/runtime proof stability depends on hardening both readiness detection and pre-runtime bootstrap steps; fixing only one still leaves the end-to-end gate flaky.
  - Retained artifact manifests, source-path notes, and stage-local logs make release and public-surface drift attributable without rerunning the whole pipeline.
---

# M016: Product-First Repository Surface And Shipping Automation

**M016 turned Yanote into a product-first public repository with a standalone analyzer CLI, tag-driven release proof, and a rerunnable end-to-end public-surface acceptance gate.**

## What Happened

M016 turned Yanote’s repository and release story into a coherent public product surface. S01 established the analyzer as an official standalone CLI contract with one archive (`yanote-analyzer.zip`), one launcher (`bin/yanote`), one version story, and one public install/run path that hides the internal Node seam. S02 then made the release tag the authoritative fail-closed publication trigger by runtime-testing signed-tag preflight, aligning the GitHub workflow to those outputs, and retaining a local release-proof bundle that stages publications, assembles the analyzer bundle, and renders release notes without requiring real external publication.

With the shipping contract in place, S03 removed clone-local planning/proof/runtime residue from the public repository face and rewrote public support/example surfaces around release assets and CI bundle names instead of private rerun paths. S04 followed by reshaping the public docs into one quickstart-first newcomer funnel across `README.md`, `docs/README.md`, and `docs/guides/getting-started.md`, with shorter recorder, tagging, analyzer, and repo-demo guides that all describe the same real product loop.

S05 assembled those boundaries into one canonical acceptance path, `bash scripts/docs/verify-m016-s05-public-surface.sh`, with stable `S05-0N` stage labels and a maintainer-only rerun leaf. Closeout then exposed that the composed proof was still only as strong as its recorder bootstrap. S06 hardened the recorder stage around deterministic port-open readiness and bounded publish retry, and S07 finished the job by removing the fragile Plugin Portal / forced-refresh dependency from the recorder smoke bootstrap through fixture-local plugin resolution plus matching contract-test and maintainer-doc updates.

On current HEAD the milestone now closes on live proof rather than historical slice claims: the focused recorder proof passes, the focused S05/recorder contract suites pass, and the full `bash scripts/docs/verify-m016-s05-public-surface.sh` acceptance path passes twice in the same checkout. That means the cleaned public boundary, short newcomer docs, standalone analyzer archive, recorder/analyzer runtime paths, repo demo, maintainer rerun map, and retained release diagnostics all describe the same real shipping contract.

## Success Criteria Results

- **Short public product path for recorder, tagging, and analyzer:** met. The quickstart-first README/docs path and the canonical recorder/tagging/analyzer guides are in place, and the composed S05 proof revalidated the landing/doc-link path.
- **Clean public repository face without internal residue foregrounding:** met. Clone-local roots are out of the tracked public face, and `S05-01` public-boundary verification passed.
- **Official standalone analyzer CLI with stable public contract:** met. The analyzer archive/launcher contract from S01 remained intact and passed `S05-07` archive/runtime verification.
- **Release tag as fail-closed validation and publication trigger:** met. The runtime-tested preflight/workflow/release proof from S02 remained intact and passed `S05-12`.
- **README, guides, examples, CI, and release/support surfaces tell one truthful story together:** met. `bash scripts/docs/verify-m016-s05-public-surface.sh` passed twice in the same checkout after S07, closing the last recorder bootstrap gap.

## Definition of Done Results

- [x] **Standalone analyzer contract is the public truth.** S01 established `yanote-analyzer.zip` -> `bin/yanote`, moved Gradle/CI/docs to that launcher, and the composed proof revalidated the archive/runtime path at `S05-07`.
- [x] **Release automation is tag-driven and fail-closed.** S02 wired the workflow to runtime-tested preflight outputs and retained one release-proof bundle; the milestone closeout revalidated that path at `S05-12`.
- [x] **Public repo face is product-first.** S03 removed clone-local roots from the tracked public face and established fail-closed boundary/example verifiers; the composed proof revalidated the boundary at `S05-01` and the example surface at `S05-08`.
- [x] **Public docs are short, current, and newcomer-first.** S04 created the `README.md` / `docs/README.md` / `docs/guides/getting-started.md` funnel and aligned recorder/tagging/analyzer/example docs; the composed proof revalidated the landing/docs path at `S05-02` through `S05-05`.
- [x] **Final public-surface story is rerunnable, not just documented.** S05 created the stage-labeled top-level verifier and maintainer rerun leaf; S06 and S07 hardened the recorder stages so `bash scripts/docs/verify-m016-s05-public-surface.sh` now passes on both a cold run and an immediate rerun.
- [x] **Milestone validation is current on HEAD.** M016 validation was updated from stale remediation state to `pass` after the live proof stack passed on current HEAD.

## Requirement Outcomes

- **R035** → validated. The public repository face is product-first and the composed public-surface proof passes on current HEAD.
- **R036** → validated. Public docs are short, current, and newcomer-first, with their landing/link path revalidated inside the final composed proof.
- **R037** → validated. The recorder path is short and explicit, and the live recorder proof now stays stable inside repeated S05 runs.
- **R038** → validated. The tagging path remains short and explicit, with aligned doc-link and example proof surfaces.
- **R039** → validated. The analyzer now ships as the official standalone CLI contract (`yanote-analyzer.zip` -> `bin/yanote`).
- **R040** → validated. Release tags drive a fail-closed validation/publication path backed by workflow/runtime proof and retained diagnostics.
- **R041** → validated. Internal GSD/process/proof/runtime surfaces are no longer part of the public default-branch face.
- **R042** → validated. The analyzer’s public install/run story no longer requires users to understand or invoke the internal Node seam.
- **R043** → validated. README/docs/examples/release surfaces now stay aligned to the same real shipping contract, and the canonical final proof passes twice on current HEAD.

No M016 requirement remains active or blocked after closeout.

## Deviations

The planned public-surface proof remained correct, but closeout revealed one environment precondition that was not yet encoded into the verifier: in a fresh worktree, `build/distributions/yanote-analyzer.zip` may need to be regenerated with `./gradlew distStandaloneAnalyzer --stacktrace` before `S05-07` can pass. This did not invalidate the milestone contract, but it remains an operational caveat rather than a self-healing preflight step.

## Follow-ups

- If future work needs a truly fresh-checkout one-command S05 proof, add an explicit analyzer-archive preflight/build step before `S05-07`.
- Consider silencing the successful temp Gradle-home cleanup noise in `scripts/docs/verify-s01-recorder-path.sh` so passing reruns do not emit misleading `rm: Directory not empty` lines.
- No additional product-surface assembly slices are required for M016; remaining follow-up is optional verifier polish.
