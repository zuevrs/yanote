---
id: T03
parent: S06
milestone: M002
provides:
  - GitHub-native trust surfaces now exist for maintainer ownership, bounded issue intake, and PR verification/review context.
  - `scripts/docs/verify-s06-trust-surfaces.sh` now checks GitHub intake content, routing links, and review wording instead of only file presence.
key_files:
  - .github/CODEOWNERS
  - .github/ISSUE_TEMPLATE/config.yml
  - .github/ISSUE_TEMPLATE/bug-report.md
  - .github/ISSUE_TEMPLATE/integration-guidance.md
  - .github/PULL_REQUEST_TEMPLATE.md
  - scripts/docs/verify-s06-trust-surfaces.sh
key_decisions:
  - Keep GitHub-native intake bounded to maintainer-owned bug and integration/docs paths, with support and security routing delegated to the root policy files.
patterns_established:
  - `.github` trust files are verifier-backed intake shapers, not open-ended feature-marketplace or community-governance funnels.
observability_surfaces:
  - `bash scripts/docs/verify-s06-trust-surfaces.sh github`
  - `bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh && git diff --check`
duration: 31m
verification_result: passed
completed_at: 2026-03-13 02:09:45 +0300
blocker_discovered: false
---

# T03: Add GitHub-native ownership and intake shaping surfaces

**Added maintainer-owned GitHub intake files and extended the S06 verifier so routing and review wording are machine-checked, not just present.**

## What Happened

Added `.github/CODEOWNERS` with explicit maintainer ownership for the repo-wide and policy/trust surfaces, then created the missing GitHub issue/PR intake files under `.github/`.

`config.yml` now disables blank issues and exposes two contact links before template selection: `SUPPORT.md` for public support/boundary routing and `SECURITY.md` for private vulnerability reporting. The issue chooser is intentionally narrow: one template for reproducible bugs and one for integration/documentation guidance.

`bug-report.md` asks for release/commit context, environment, reproduction steps, expected vs actual behavior, and concrete Yanote evidence such as `events.jsonl`, `yanote-report.json`, analyzer stderr, or Gradle/CI output. `integration-guidance.md` asks which docs path or product surface is involved, what was already tried, the current confusion/behavior, and the exact evidence file or command output that would let the maintainer reason about the problem.

`PULL_REQUEST_TEMPLATE.md` now reinforces the maintained-product posture: narrow scope, explicit verification, docs/boundary impact, reviewer context, and awareness of the merge-blocking `build-and-test` and `yanote-validation` checks already documented elsewhere in the repo.

I also expanded `scripts/docs/verify-s06-trust-surfaces.sh` so `github`/full mode now validates owner lines, issue-config routing links, required template sections, evidence prompts, PR checklist sections, and the maintained-product boundary wording. During the first verification pass I hit a shell bug of my own: backticks inside double-quoted verifier needles triggered command substitution. I fixed that by single-quoting the literal backtick needles so the verifier stays deterministic and quiet.

Recorded the GitHub intake boundary in `.gsd/DECISIONS.md` so future work inherits the same “maintainer-owned, narrow, verifier-backed” intake posture instead of rediscovering it from the templates themselves.

## Verification

- Passed: `bash scripts/docs/verify-s06-trust-surfaces.sh`
- Passed: `bash scripts/docs/verify-s04-boundaries.sh`
- Passed: `bash scripts/docs/verify-s05-navigation.sh`
- Passed: `git diff --check`
- Static spot-check of the issue chooser surface by reading `.github/ISSUE_TEMPLATE/config.yml` plus the template frontmatter/body confirmed the chooser now exposes only:
  - support routing via `SUPPORT.md`
  - private vulnerability routing via `SECURITY.md`
  - `Баг / Bug report`
  - `Интеграция и документация / Integration guidance`
- Re-ran the full verifier stack after fixing the command-substitution bug in the S06 script; no noisy shell errors remain.

## Diagnostics

Run `bash scripts/docs/verify-s06-trust-surfaces.sh github` to inspect only the GitHub-native trust layer. It emits deterministic `ERROR:` lines for missing CODEOWNERS entries, missing issue/PR template files, missing support/security/docs backlinks, or missing required template sections/check wording.

Run `bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh && git diff --check` for the full slice-level contract.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `.github/CODEOWNERS` — added the truthful single-maintainer ownership map for repo review and public trust surfaces.
- `.github/ISSUE_TEMPLATE/config.yml` — added the bounded issue chooser with explicit support/security routing and blank issues disabled.
- `.github/ISSUE_TEMPLATE/bug-report.md` — added the reproducible-bug intake template with version, environment, reproduction, behavior, and evidence prompts.
- `.github/ISSUE_TEMPLATE/integration-guidance.md` — added the integration/docs guidance template with docs-path, prior-attempts, current-state, and evidence prompts.
- `.github/PULL_REQUEST_TEMPLATE.md` — added the PR checklist for scope, verification, docs impact, reviewer context, and maintained-product boundaries.
- `scripts/docs/verify-s06-trust-surfaces.sh` — expanded GitHub-mode assertions and fixed literal backtick matching so verification stays deterministic.
- `.gsd/DECISIONS.md` — recorded the GitHub intake shaping boundary for future S06/S07 work.
- `.gsd/milestones/M002/slices/S06/S06-PLAN.md` — marked T03 complete.
- `.gsd/STATE.md` — advanced repo state from in-slice execution to post-S06 reassessment.
