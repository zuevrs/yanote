---
id: T02
parent: S06
milestone: M002
provides:
  - Russian-first root `SECURITY.md`, `SUPPORT.md`, and `CONTRIBUTING.md` files with concrete public channels and maintainer-led boundaries.
  - Policy-mode verifier checks for public channels, canonical-doc backlinks, and bounded wording on the new root trust surfaces.
key_files:
  - SECURITY.md
  - SUPPORT.md
  - CONTRIBUTING.md
  - scripts/docs/verify-s06-trust-surfaces.sh
key_decisions:
  - Keep root trust files thin and route canonical release/support/scope truth back to docs-owned surfaces instead of duplicating it.
patterns_established:
  - Root public policy files are verifier-backed routing surfaces, not parallel owners of product or support policy truth.
observability_surfaces:
  - `bash scripts/docs/verify-s06-trust-surfaces.sh policy`
duration: 35m
verification_result: passed
completed_at: 2026-03-13 02:03:10 +0300
blocker_discovered: false
---

# T02: Add bounded public security, support, and contribution policy surfaces

**Added Russian-first root trust files and machine-checked them for concrete public channels plus canonical-doc backlinks.**

## What Happened

Added `SECURITY.md`, `SUPPORT.md`, and `CONTRIBUTING.md` at the repo root as thin, maintainer-led public trust surfaces. The copy stays Russian-first, names a concrete private security channel (`zzuevrs@gmail.com`), keeps undisclosed vulnerabilities out of public issues, routes ordinary support and integration/doc questions back through the docs map, and narrows contribution expectations to docs fixes, focused bugfix PRs, and prior discussion for larger changes.

Updated `scripts/docs/verify-s06-trust-surfaces.sh` so `policy` mode now checks more than file presence: it enforces the concrete security email, the “do not open public issues for undisclosed vulnerabilities” rule, the maintainer-led/no-SLA support wording, the public GitHub issue intake URL, and backlinks to `docs/release-and-support.md`, `docs/README.md`, and `docs/requirements.md` where those files should delegate canonical truth.

## Verification

- Passed: `bash scripts/docs/verify-s06-trust-surfaces.sh policy && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh`
- Passed: `git diff --check`
- Expected pending slice result: `bash scripts/docs/verify-s06-trust-surfaces.sh` still fails only on the T03-owned GitHub trust files (`.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/config.yml`, `.github/ISSUE_TEMPLATE/bug-report.md`, `.github/ISSUE_TEMPLATE/integration-guidance.md`, `.github/PULL_REQUEST_TEMPLATE.md`).
- Spot-checked published channels in the root files: `SECURITY.md` names `zzuevrs@gmail.com`; `SUPPORT.md` names `https://github.com/zuevrs/yanote/issues`; neither path depends on private maintainer workflow context.

## Diagnostics

Re-run `bash scripts/docs/verify-s06-trust-surfaces.sh policy` to inspect policy drift. It now emits deterministic `ERROR:` lines for missing root trust files, missing canonical-doc backlinks, or missing bounded wording/public channels in `SECURITY.md`, `SUPPORT.md`, or `CONTRIBUTING.md`.

## Deviations

None.

## Known Issues

- Full S06 verification is not green yet because T03 has not added the GitHub-native ownership/intake files.

## Files Created/Modified

- `SECURITY.md` — added the root security policy with private email reporting, a public-issue boundary for undisclosed vulnerabilities, and links back to canonical docs.
- `SUPPORT.md` — added the root support policy with maintainer-led/no-SLA expectations, a concrete public issue channel, and docs/backlink routing.
- `CONTRIBUTING.md` — added the root contribution policy with narrow accepted contribution scope, prior-discussion expectations, and canonical scope/doc backlinks.
- `scripts/docs/verify-s06-trust-surfaces.sh` — expanded `policy` mode from file-existence checks to concrete channel, backlink, and bounded-wording assertions.
- `.gsd/DECISIONS.md` — recorded the thin-root-policy/backlinked-doc-owners decision for S06.
- `.gsd/milestones/M002/slices/S06/S06-PLAN.md` — marked T02 complete.
- `.gsd/STATE.md` — advanced the slice state to T03 and recorded the new trust-surface decision.
