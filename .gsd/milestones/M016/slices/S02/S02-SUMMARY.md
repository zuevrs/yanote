---
id: S02
parent: M016
milestone: M016
provides:
  - A runtime-tested fail-closed preflight contract proving that only signed annotated stable tags reachable from `main` unlock publication and that rejection diagnostics stay deterministic.
  - A workflow contract where `.github/workflows/release.yml` consumes the preflight-tested `release_tag` and retry outputs that downstream publish steps rely on.
  - A rerunnable local release-candidate verifier plus retained proof bundle that stage publications, assemble the standalone analyzer release bundle, render release notes, and preserve inspectable diagnostics without performing a real external publish.
requires:
  - slice: S01
    provides: The dedicated standalone analyzer asset contract (`build/distributions/yanote-analyzer.zip`) and stable launcher surface that release assembly and publication verification now publish and validate.
affects:
  - S04
  - S05
key_files:
  - scripts/release/preflight.sh
  - scripts/release/preflight.runtime.contract.test.mjs
  - .github/workflows/release.yml
  - scripts/release/maven-central-preflight.contract.test.mjs
  - scripts/release/release-failclosed.contract.test.mjs
  - scripts/release/release-workflow.contract.test.mjs
  - scripts/ci/verify-m016-s02-release-pipeline.sh
  - scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs
  - docs/maintainers/release-signing.md
  - .yanote-ci/m016-s02-release-pipeline-proof/artifact-manifest.txt
  - .yanote-ci/m016-s02-release-pipeline-proof/phase-status.txt
  - build/release-bundle/v1.2.3/v1.2.3-manifest.txt
  - build/release-notes.md
key_decisions:
  - Use archive-backed git fixture repositories for signed, unsigned, lightweight, off-main, and prerelease release-tag runtime coverage instead of creating signed tags inside node:test.
  - Source `release_tag` in `.github/workflows/release.yml` from preflight outputs so downstream publish steps consume the same runtime-tested contract surface as the gate.
  - Run the local release-candidate Gradle/JReleaser phase from a symlinked git-compatible proof root so worktree-local verification can resolve `HEAD` without leaving the active GSD worktree.
  - Retain one diagnostic bundle under `.yanote-ci/m016-s02-release-pipeline-proof/` with phase logs, inventories, copied artifacts, source-path notes, and tag context instead of relying on scattered build outputs.
patterns_established:
  - Use archive-backed git fixture repositories for release-tag gate runtime tests so signed/unsigned/off-main/prerelease coverage stays stable and attributable under node:test.
  - Make workflow publish steps consume the exact outputs emitted by the runtime-tested preflight gate (`release_tag`, retry metadata) rather than reconstructing release truth from surrounding CI context.
  - When worktree-local release verification needs Git-aware tooling such as JReleaser, build a git-compatible compatibility root and retain one proof bundle that centralizes phase logs, inventories, copied artifacts, and provenance notes.
observability_surfaces:
  - `.yanote-ci/m016-s02-release-pipeline-proof/artifact-manifest.txt` records phase exit codes, release tag/version truth, staged publication count, bundle asset count, traceability snapshot, and the full retained observability inventory.
  - `.yanote-ci/m016-s02-release-pipeline-proof/phase-status.txt` exposes one line per phase (`preflight`, `publish`, `bundle`, `notes`) so failures localize immediately.
  - `.yanote-ci/m016-s02-release-pipeline-proof/tag-context.txt` records the resolved release tag, project version, previous release tag, retry eligibility, and traceability snapshot consumed by the proof.
  - Per-phase stdout/stderr logs plus `staged-publications.txt`, `staging-modules.txt`, `release-bundle-assets.txt`, `release-bundle-manifest.txt`, and copied `release-notes.md` make publish/bundle/notes drift inspectable without rerunning the whole pipeline.
  - `build/staging-deploy/`, `build/release-bundle/v1.2.3/`, and `build/release-notes.md` remain the live assembled outputs that downstream slices and maintainers can inspect directly after the local proof succeeds.
drill_down_paths:
  - .gsd/milestones/M016/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M016/slices/S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-29T00:21:50.060Z
blocker_discovered: false
---

# S02: Tag-driven release and publication pipeline

**S02 made the release tag the fail-closed publication trigger by runtime-testing signed-tag preflight, aligning the workflow to that contract, and adding a rerunnable local release proof that stages publications, assembles the analyzer bundle, renders notes, and retains inspectable diagnostics.**

## What Happened

S02 turned release automation from a YAML claim into an executable fail-closed contract. T01 hardened `scripts/release/preflight.sh` and wrapped it in a process-level runtime harness that restores real signed, unsigned, lightweight, off-main, prerelease, and mixed-failure fixture repositories, then executes the real script under Bash. That changed the release gate from source inspection only to real git/tag/signature/runtime coverage and proved the exact rejection classes, codes, retry flags, and deterministic ordering the workflow expects.

The workflow was then aligned to the same contract surface by sourcing `release_tag` from preflight outputs instead of bypassing the gate with `GITHUB_REF_NAME`. That means the workflow, its contract tests, and the runtime gate now agree on one publish truth: only a signed annotated stable tag reachable from `main` can unlock the publication path, and malformed or unsupported release attempts fail closed with inspectable diagnostics.

T02 added the missing assembled proof: `bash scripts/ci/verify-m016-s02-release-pipeline.sh` restores the signed-tag fixture, runs preflight first, creates a git-compatible proof root for the Gradle/JReleaser phase, then executes the workflow-shaped local release-candidate task graph (`publish distStandaloneAnalyzer cyclonedxBom jreleaserConfig`) without touching external publication endpoints. After the build phase it assembles the analyzer-centered release bundle, renders release notes, verifies staged-publication coverage and traceability alignment, and retains one proof bundle under `.yanote-ci/m016-s02-release-pipeline-proof/` with phase logs, inventories, copied release notes, copied manifest/source-path notes, traceability artifacts, and tag context.

For downstream slices, the important dependency summary is: S02 now provides one truthful release-tag automation story around the standalone analyzer asset from S01. S03 and S04 should preserve this contract while cleaning the public repo face and shortening docs, and S05 can treat the retained proof bundle plus `build/staging-deploy/`, `build/release-bundle/v1.2.3/`, and `build/release-notes.md` as the authoritative integration evidence that the shipping surfaces still assemble correctly under a release tag.

## Verification

Passed all slice-plan verification commands on current HEAD: `node --test scripts/release/preflight.runtime.contract.test.mjs scripts/release/maven-central-preflight.contract.test.mjs scripts/release/release-failclosed.contract.test.mjs scripts/release/release-workflow.contract.test.mjs` (20/20 passing, 2879 ms wall clock), `node --test scripts/release/github-release.contract.test.mjs scripts/release/traceability.contract.test.mjs scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs` (18/18 passing, 1182 ms wall clock), and `bash scripts/ci/verify-m016-s02-release-pipeline.sh` (0 exit, 11245 ms wall clock). Additional observability confirmation: `.yanote-ci/m016-s02-release-pipeline-proof/phase-status.txt` showed all four phases as `success`; `.yanote-ci/m016-s02-release-pipeline-proof/artifact-manifest.txt` showed `proof_status=success`, `release_tag=v1.2.3`, `staging_publication_count=72`, and `release_bundle_asset_count=12`; `.yanote-ci/m016-s02-release-pipeline-proof/tag-context.txt` matched the manifest; and `build/release-notes.md` rendered the expected `v1.2.3` notes scoped from `v1.2.2`.

## Requirements Advanced

- R043 — S02 made the release and publication surfaces truthful around the standalone analyzer asset by proving the same release-tag contract through runtime preflight, workflow wiring, retained proof artifacts, and release-note/traceability assembly instead of relying on YAML-only claims.

## Requirements Validated

- R040 — Validated by the passing runtime preflight contract suite, release workflow/traceability/release-bundle contract suites, and `bash scripts/ci/verify-m016-s02-release-pipeline.sh`, which retained `.yanote-ci/m016-s02-release-pipeline-proof/` with `proof_status=success`, `preflight/publish/bundle/notes=success`, `release_tag=v1.2.3`, `staging_publication_count=72`, and `release_bundle_asset_count=12`.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Used archive-backed git fixture repositories for signed/off-main/prerelease runtime preflight coverage instead of generating signed tags during node:test execution, because fixture restoration proved the gate logic without gpg-agent startup drift. Used a symlinked git-compatible proof root for the Gradle/JReleaser phase because JReleaser cannot resolve HEAD directly from this .gsd/worktrees checkout, while still writing all build outputs back into the active worktree.

## Known Limitations

The local proof intentionally stops before real GitHub Release and Maven Central publication endpoints; it proves the release-candidate path fail-closed with staged outputs and retained diagnostics rather than performing an external publish. The verifier currently depends on the retained signed-tag fixture and the worktree-local git-compatible compatibility root, so future environment changes that alter fixture layout or JReleaser git resolution still need contract-test coverage to stay attributable.

## Follow-ups

S03 and S04 must preserve this tag-driven release truth while cleaning the public repository face and rewriting the public docs; future docs should point users and maintainers at the same release-tag contract instead of inventing a second release ritual. S05 should reuse `.yanote-ci/m016-s02-release-pipeline-proof/`, `build/staging-deploy/`, `build/release-bundle/v1.2.3/`, and `build/release-notes.md` as integration evidence that the standalone analyzer asset and release-note/traceability surfaces still compose cleanly with the final public-repo cleanup.

## Files Created/Modified

- `scripts/release/preflight.sh` — Hardened the fail-closed release-tag gate to keep Bash-3.2-safe deterministic diagnostics, exact annotated-vs-unsigned rejection codes, and runtime-tested output wiring.
- `scripts/release/preflight.runtime.contract.test.mjs` — Added archive-backed process-level runtime tests that execute the real preflight script against signed, unsigned, lightweight, off-main, prerelease, and mixed-failure fixture repositories.
- `.github/workflows/release.yml` — Aligned workflow publish inputs to consume the runtime-tested preflight release_tag output instead of bypassing the gate with the raw ref name.
- `scripts/release/maven-central-preflight.contract.test.mjs` — Refreshed source-level preflight/signing contract coverage to pin the same runtime gate surface and retry semantics exercised by the new harness.
- `scripts/release/release-failclosed.contract.test.mjs` — Pinned deterministic fail-closed classification and grouped diagnostic ordering for release preflight failure paths.
- `scripts/release/release-workflow.contract.test.mjs` — Pinned stable-tag workflow trigger, preflight-before-publish ordering, release notes previous-tag wiring, retry logging, and release-owner sign-off expectations.
- `scripts/ci/verify-m016-s02-release-pipeline.sh` — Added the rerunnable local release-candidate verifier that restores the signed-tag fixture, runs preflight, stages publications, assembles release assets, renders notes, and retains one proof bundle.
- `scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs` — Pinned the retained proof-root, git-compatible compatibility root, analyzer asset, traceability, notes, and observability bundle contract for the local verifier.
- `docs/maintainers/release-signing.md` — Updated maintainer release guidance to require the local release proof command and to point maintainers at the retained diagnostic surfaces on failure.
- `.gsd/KNOWLEDGE.md` — Recorded the archive-backed preflight-fixture and worktree-local JReleaser compatibility-root lessons so future agents do not rediscover them.
- `.gsd/PROJECT.md` — Refreshed the project state summary to reflect that M016 now includes the tag-driven release proof around the standalone analyzer contract.
