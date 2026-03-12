---
id: T01
parent: S06
milestone: M002
provides:
  - `scripts/docs/verify-s06-trust-surfaces.sh` now enforces S06 identity/legal drift and keeps missing policy and GitHub trust files visible with deterministic `ERROR:` lines.
  - Root licensing and published metadata now agree on Apache-2.0 and the canonical `https://github.com/zuevrs/yanote` repository identity.
key_files:
  - scripts/docs/verify-s06-trust-surfaces.sh
  - LICENSE
  - jreleaser.yml
  - yanote-core/build.gradle.kts
  - yanote-recorder-spring-mvc/build.gradle.kts
  - yanote-test-tags-restassured/build.gradle.kts
  - yanote-test-tags-cucumber/build.gradle.kts
  - yanote-gradle-plugin/build.gradle.kts
key_decisions:
  - Structure the S06 verifier as incremental `identity`, `policy`, and GitHub intake checks, with full mode composing all three.
patterns_established:
  - Trust-surface work lands verifier-first, with task-local modes that let identity/legal fixes pass without masking later policy/intake gaps.
observability_surfaces:
  - bash scripts/docs/verify-s06-trust-surfaces.sh identity
  - bash scripts/docs/verify-s06-trust-surfaces.sh
duration: 42m
verification_result: passed
completed_at: 2026-03-13 01:58:19 +0300
blocker_discovered: false
---

# T01: Lock the S06 trust contract and fix identity/legal drift

**Added the S06 trust-surface verifier, aligned root licensing with Apache-2.0, and corrected all published repo metadata to the canonical GitHub identity.**

## What Happened

I started by creating `scripts/docs/verify-s06-trust-surfaces.sh` in the same explicit shell-contract style as the earlier S03-S05 verifiers. The new script already supports the slice progression model: `identity` verifies license and publication metadata drift, `policy` is reserved for the root trust files added in T02, and full mode composes identity, policy, and GitHub intake checks.

Running the full verifier immediately exposed the intended baseline failure: 35 path-specific issues covering the missing root `LICENSE`, stale `github.com/yanote/yanote` metadata in `jreleaser.yml` and all five published-module POM blocks, and the still-absent root/`.github` trust files owned by later tasks.

I then added a root Apache-2.0 `LICENSE` file and updated `jreleaser.yml`, `yanote-core/build.gradle.kts`, `yanote-recorder-spring-mvc/build.gradle.kts`, `yanote-test-tags-restassured/build.gradle.kts`, `yanote-test-tags-cucumber/build.gradle.kts`, and `yanote-gradle-plugin/build.gradle.kts` so their homepage, documentation, bug-tracker, and SCM URLs consistently point at `https://github.com/zuevrs/yanote` while preserving the existing developer identity and Apache-2.0 publication metadata.

During verification I hit one script bug: `require_not_contains()` was returning grep’s non-match status under `set -e`, which made the identity mode exit early even after the metadata fixes. I corrected that helper so the verifier now behaves as a proper accumulating contract instead of a fail-fast shell accident.

I recorded the incremental verifier structure in `.gsd/DECISIONS.md`, marked T01 complete in the slice plan, and updated `.gsd/STATE.md` to point the slice at T02.

## Verification

- `bash scripts/docs/verify-s06-trust-surfaces.sh` — failed first with 35 exact `ERROR:` lines naming the missing license, stale repo URLs, and absent future trust files.
- `bash scripts/docs/verify-s06-trust-surfaces.sh identity` — passed after adding `LICENSE` and normalizing `jreleaser.yml` plus all five published module metadata blocks.
- `bash scripts/docs/verify-s06-trust-surfaces.sh` — now fails as expected with 8 remaining `ERROR:` lines for the not-yet-created `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`, `.github/CODEOWNERS`, issue template config/templates, and PR template.
- `bash scripts/docs/verify-s04-boundaries.sh` — passed.
- `bash scripts/docs/verify-s05-navigation.sh` — passed.
- `git diff --check` — passed.
- `rg -n "github.com/yanote/yanote|github.com/zuevrs/yanote" -S jreleaser.yml yanote-core/build.gradle.kts yanote-recorder-spring-mvc/build.gradle.kts yanote-test-tags-restassured/build.gradle.kts yanote-test-tags-cucumber/build.gradle.kts yanote-gradle-plugin/build.gradle.kts LICENSE` — confirmed only canonical `zuevrs/yanote` URLs remain in the touched publication metadata.

## Diagnostics

Run `bash scripts/docs/verify-s06-trust-surfaces.sh identity` when checking repo/license metadata drift. It emits deterministic `ERROR:` lines naming the exact file and clause missing the canonical repo URL, SCM URL, or root license surface.

Run `bash scripts/docs/verify-s06-trust-surfaces.sh` for the whole slice contract. At this point it should only fail on the still-missing policy and GitHub intake files, which keeps T02/T03 work visible instead of silently passing a partial slice.

## Deviations

None.

## Known Issues

- Full S06 verification is intentionally still red until T02/T03 add `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`, `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/config.yml`, `.github/ISSUE_TEMPLATE/bug-report.md`, `.github/ISSUE_TEMPLATE/integration-guidance.md`, and `.github/PULL_REQUEST_TEMPLATE.md`.

## Files Created/Modified

- `scripts/docs/verify-s06-trust-surfaces.sh` — added the S06 verifier with incremental identity/policy/GitHub checks and deterministic `ERROR:` reporting.
- `LICENSE` — added the root Apache-2.0 license surface promised by published metadata.
- `jreleaser.yml` — corrected homepage, documentation, and bug-tracker URLs to the canonical GitHub repository.
- `yanote-core/build.gradle.kts` — corrected POM homepage and SCM URLs.
- `yanote-recorder-spring-mvc/build.gradle.kts` — corrected POM homepage and SCM URLs.
- `yanote-test-tags-restassured/build.gradle.kts` — corrected POM homepage and SCM URLs.
- `yanote-test-tags-cucumber/build.gradle.kts` — corrected POM homepage and SCM URLs.
- `yanote-gradle-plugin/build.gradle.kts` — corrected POM homepage and SCM URLs.
- `.gsd/DECISIONS.md` — recorded the incremental S06 verifier progression model.
- `.gsd/milestones/M002/slices/S06/S06-PLAN.md` — marked T01 complete.
- `.gsd/STATE.md` — advanced the slice’s next action to T02.
