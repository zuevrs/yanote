---
estimated_steps: 5
estimated_files: 8
---

# T01: Lock the S06 trust contract and fix identity/legal drift

**Slice:** S06 — Maintained-Product Trust Surfaces
**Milestone:** M002

## Description

Create the S06 verifier before adding new trust copy, then use it to close the two hardest trust contradictions already identified by research: missing root licensing and stale repository identity in published metadata. This task gives S06 an objective contract while delivering real user-visible progress for **R030** instead of only scaffolding later work.

## Steps

1. Create `scripts/docs/verify-s06-trust-surfaces.sh`, following the explicit shell-assertion style already used by the S03-S05 documentation verifiers.
2. Encode assertions for root `LICENSE` presence, canonical `github.com/zuevrs/yanote` URLs in `jreleaser.yml` and published module POM metadata blocks, and the still-missing root/`.github` trust files; run the full script once to confirm it fails against the current tree.
3. Add a root Apache-2.0 `LICENSE` file that matches the already-declared publication metadata.
4. Update `jreleaser.yml` and the published POM metadata blocks in each released module build file so homepage, documentation, bug tracker, and SCM URLs all point at `https://github.com/zuevrs/yanote`.
5. Re-run `bash scripts/docs/verify-s06-trust-surfaces.sh identity` until the identity/legal section passes while the remaining missing policy/intake surfaces stay visible for later tasks.

## Must-Haves

- [ ] `scripts/docs/verify-s06-trust-surfaces.sh` exists and emits path-specific failures for missing trust files, missing `LICENSE`, and stale repository metadata.
- [ ] `LICENSE`, `jreleaser.yml`, and every published module `build.gradle.kts` targeted by the task agree on the canonical repository identity and Apache-2.0 licensing surface.

## Verification

- `bash scripts/docs/verify-s06-trust-surfaces.sh identity`
- First-run expectation before fixes: the initial full verifier run should fail because the license file and the new trust surfaces do not exist yet.

## Observability Impact

- Signals added/changed: deterministic `ERROR:` lines in `scripts/docs/verify-s06-trust-surfaces.sh` for identity/legal drift and missing trust-surface files.
- How a future agent inspects this: run `bash scripts/docs/verify-s06-trust-surfaces.sh identity` for metadata drift or the full script for the remaining slice contract.
- Failure state exposed: the exact file and clause carrying the wrong repo URL, missing license, or missing trust surface becomes visible at script exit.

## Inputs

- `jreleaser.yml` — current release metadata surface that still points package consumers at the wrong repository URL.
- `yanote-core/build.gradle.kts` — representative published POM metadata block to normalize alongside the other released modules.
- `yanote-recorder-spring-mvc/build.gradle.kts` — published Spring recorder module metadata surface.
- `yanote-test-tags-restassured/build.gradle.kts` — published test-tagging module metadata surface.
- `yanote-test-tags-cucumber/build.gradle.kts` — published test-tagging module metadata surface.
- `yanote-gradle-plugin/build.gradle.kts` — published Gradle plugin metadata surface.
- `scripts/docs/verify-s04-boundaries.sh` and `scripts/docs/verify-s05-navigation.sh` — existing verifier style to mirror for deterministic shell-level documentation/repo contracts.

## Expected Output

- `scripts/docs/verify-s06-trust-surfaces.sh` — executable S06 verifier with at least an `identity` mode and a full-slice mode.
- `LICENSE` — tracked Apache-2.0 root license file for GitHub and downstream consumers.
- `jreleaser.yml` — release metadata aligned to the actual repository identity.
- `yanote-core/build.gradle.kts` — corrected publication URLs.
- `yanote-recorder-spring-mvc/build.gradle.kts` — corrected publication URLs.
- `yanote-test-tags-restassured/build.gradle.kts` — corrected publication URLs.
- `yanote-test-tags-cucumber/build.gradle.kts` — corrected publication URLs.
- `yanote-gradle-plugin/build.gradle.kts` — corrected publication URLs.
