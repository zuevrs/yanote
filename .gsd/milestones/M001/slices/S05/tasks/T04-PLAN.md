# T04: 05-oss-release-and-traceable-verification 04

**Slice:** S05 — **Milestone:** M001

## Description

Close the Phase 05 verification gaps in release workflow trigger semantics and release-notes previous-tag wiring.

Purpose: Satisfy the remaining RELS-02/RELS-03 defects by fixing exactly two workflow wiring issues without expanding release scope.
Output: One focused gap-closure patch plus contract-test guards that prevent regression.

## Must-Haves

- [ ] "Release workflow tag trigger uses GitHub glob semantics and allows stable release tag entry while strict semver remains enforced in preflight."
- [ ] "Release notes changelog scope is wired to resolved previous release tag output, not `${{ github.event.before }}`."
- [ ] "Release workflow contract tests fail if tag trigger syntax regresses to regex-like patterns or previous-tag wiring regresses."
- [ ] "Manual approval remains explicit human verification through `production-release` required reviewers; no fake automation is introduced."

## Files

- `.github/workflows/release.yml`
- `scripts/release/release-workflow.contract.test.mjs`
