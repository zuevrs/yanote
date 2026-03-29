---
id: T02
parent: S03
milestone: M016
provides: []
requires: []
affects: []
key_files: ["docs/maintainers/README.md", "docs/maintainers/local-agent-workflow.md", ".gsd/PROJECT.md", ".gsd/REQUIREMENTS.md", ".gsd/DECISIONS.md", ".tmp-m012-research-out/yanote-report.json", ".tmp/m015-s03-combined-proof/artifact-manifest.txt", ".vite/vitest/results.json"]
key_decisions: ["Use one index-only cleanup pass for `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/`, then prove preservation with representative working-tree file checks instead of trusting staged deletions blindly."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`bash scripts/docs/verify-s03-public-artifact-boundary.sh` passed in tracked mode with zero tracked entries under the clone-local roots. `bash scripts/docs/verify-s07-local-agent.sh` passed after the maintainer-doc edits. `node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs` passed, confirming the fail-closed boundary contract still holds. Direct `test -f` checks confirmed representative `.gsd`, `.tmp`, `.tmp-*`, and `.vite` files still exist in the working tree after untracking."
completed_at: 2026-03-29T00:48:53.271Z
blocker_discovered: false
---

# T02: Removed `.gsd/`, `.tmp*`, and `.vite/` from tracked git inventory while preserving local state and documenting the maintainer boundary.

> Removed `.gsd/`, `.tmp*`, and `.vite/` from tracked git inventory while preserving local state and documenting the maintainer boundary.

## What Happened
---
id: T02
parent: S03
milestone: M016
key_files:
  - docs/maintainers/README.md
  - docs/maintainers/local-agent-workflow.md
  - .gsd/PROJECT.md
  - .gsd/REQUIREMENTS.md
  - .gsd/DECISIONS.md
  - .tmp-m012-research-out/yanote-report.json
  - .tmp/m015-s03-combined-proof/artifact-manifest.txt
  - .vite/vitest/results.json
key_decisions:
  - Use one index-only cleanup pass for `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/`, then prove preservation with representative working-tree file checks instead of trusting staged deletions blindly.
duration: ""
verification_result: passed
completed_at: 2026-03-29T00:48:53.272Z
blocker_discovered: false
---

# T02: Removed `.gsd/`, `.tmp*`, and `.vite/` from tracked git inventory while preserving local state and documenting the maintainer boundary.

**Removed `.gsd/`, `.tmp*`, and `.vite/` from tracked git inventory while preserving local state and documenting the maintainer boundary.**

## What Happened

Verified the T01 boundary guard failure mode first, confirmed that tracked clone-local residue under `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/` was the only blocker, and then removed those roots from the git index with one index-only cleanup pass while preserving the working tree. Confirmed the preservation requirement by checking representative `.gsd`, `.tmp`, `.tmp-*`, and `.vite` files before and after cleanup, and updated the maintainer owner map plus local-agent leaf so the post-S03 clone-local boundary is explicit and rerunnable for future agents.

## Verification

`bash scripts/docs/verify-s03-public-artifact-boundary.sh` passed in tracked mode with zero tracked entries under the clone-local roots. `bash scripts/docs/verify-s07-local-agent.sh` passed after the maintainer-doc edits. `node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs` passed, confirming the fail-closed boundary contract still holds. Direct `test -f` checks confirmed representative `.gsd`, `.tmp`, `.tmp-*`, and `.vite` files still exist in the working tree after untracking.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/docs/verify-s03-public-artifact-boundary.sh` | 0 | ✅ pass | 52ms |
| 2 | `bash scripts/docs/verify-s07-local-agent.sh` | 0 | ✅ pass | 130ms |
| 3 | `node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs` | 0 | ✅ pass | 927ms |
| 4 | `bash -lc 'set -euo pipefail; test -f .gsd/PROJECT.md; test -f .gsd/REQUIREMENTS.md; test -f .gsd/DECISIONS.md; test -f .tmp-m012-research-out/yanote-report.json; test -f .tmp/m015-s03-combined-proof/artifact-manifest.txt; test -f .vite/vitest/results.json'` | 0 | ✅ pass | 16ms |


## Deviations

None.

## Known Issues

Public-facing wording cleanup is still pending in T03: `README.md`, `docs/README.md`, and `SUPPORT.md` still own the remaining `.tmp` / `.yanote-ci` demotion work, so only the tracked-inventory boundary is expected to be green at this stage.

## Files Created/Modified

- `docs/maintainers/README.md`
- `docs/maintainers/local-agent-workflow.md`
- `.gsd/PROJECT.md`
- `.gsd/REQUIREMENTS.md`
- `.gsd/DECISIONS.md`
- `.tmp-m012-research-out/yanote-report.json`
- `.tmp/m015-s03-combined-proof/artifact-manifest.txt`
- `.vite/vitest/results.json`


## Deviations
None.

## Known Issues
Public-facing wording cleanup is still pending in T03: `README.md`, `docs/README.md`, and `SUPPORT.md` still own the remaining `.tmp` / `.yanote-ci` demotion work, so only the tracked-inventory boundary is expected to be green at this stage.
