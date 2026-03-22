---
estimated_steps: 5
estimated_files: 5
---

# T03: Add GitHub-native ownership and intake shaping surfaces

**Slice:** S06 — Maintained-Product Trust Surfaces
**Milestone:** M002

## Description

Complete the S06 trust layer by adding the `.github` files that shape issue/PR intake and review ownership. This task turns the new public policy files into actual GitHub-native guidance, which is the slice’s remaining gap for **R030** after identity/licensing and root policy surfaces are in place.

## Steps

1. Add `.github/CODEOWNERS` with `@zuevrs` as the truthful maintainer owner for repository review and policy surfaces.
2. Add `.github/ISSUE_TEMPLATE/config.yml` so GitHub issue creation surfaces the support and security routes explicitly before free-form issue text.
3. Add `.github/ISSUE_TEMPLATE/bug-report.md` with fields for version, environment, reproduction steps, expected/actual behavior, and any relevant Yanote artifacts or report excerpts.
4. Add `.github/ISSUE_TEMPLATE/integration-guidance.md` for integration/doc questions, including the docs path or integration surface involved, what was tried already, and which evidence file or command output is relevant.
5. Add `.github/PULL_REQUEST_TEMPLATE.md`, then run the full S06 verifier plus the S04/S05 verifiers and `git diff --check` until the complete trust-surface contract passes.

## Must-Haves

- [ ] `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/config.yml`, the two issue templates, and `.github/PULL_REQUEST_TEMPLATE.md` exist and route users to the correct support/security surfaces instead of implying feature-marketplace or high-bandwidth community handling.
- [ ] The full S06 verifier passes alongside the S04/S05 verifiers, proving the new GitHub-native surfaces remain consistent with the release/support owner and docs architecture set in earlier slices.

## Verification

- `bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh && git diff --check`
- Spot-check the issue template chooser to confirm the labels/titles point users toward bug or integration/docs guidance rather than generic feature funneling.

## Observability Impact

- Signals added/changed: deterministic verifier failures for missing CODEOWNERS, missing template files, bad policy links, or template wording that escapes the maintained-product posture.
- How a future agent inspects this: read the `.github` trust files and rerun the full verifier stack.
- Failure state exposed: the exact GitHub-native intake or ownership file that drifted becomes visible at script exit.

## Inputs

- `SUPPORT.md` — canonical public support-routing surface that the issue-template config must reference.
- `SECURITY.md` — canonical vulnerability-reporting surface that the issue-template config must reference.
- `CONTRIBUTING.md` — public contribution boundary that the PR template should reinforce.
- `.github/BRANCH_PROTECTION.md` — existing required-check and review-discipline surface to keep ownership/review expectations truthful.
- `.github/workflows/yanote-ci.yml` and `.github/workflows/release.yml` — existing operational discipline surfaces that justify the review/verification expectations named in the PR template.

## Expected Output

- `.github/CODEOWNERS` — truthful maintainer review ownership map.
- `.github/ISSUE_TEMPLATE/config.yml` — issue-creation routing back to the correct support/security surfaces.
- `.github/ISSUE_TEMPLATE/bug-report.md` — bounded bug-report intake template.
- `.github/ISSUE_TEMPLATE/integration-guidance.md` — bounded integration/documentation-guidance intake template.
- `.github/PULL_REQUEST_TEMPLATE.md` — PR checklist aligned to the repo’s maintained-product verification posture.
