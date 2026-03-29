---
id: T03
parent: S03
milestone: M016
provides: []
requires: []
affects: []
key_files: ["README.md", "docs/README.md", "docs/release-and-support.md", "SUPPORT.md", "scripts/docs/verify-s03-public-artifact-boundary.sh", "scripts/docs/verify-m015-s04-delivery-surfaces.sh", "scripts/docs/verify-s03-public-boundary.contract.test.mjs", ".gsd/KNOWLEDGE.md"]
key_decisions: ["D031: Public docs and support intake name only public release assets and CI artifact bundle names; clone-local rerun roots stay behind maintainer owner maps.", "When the public-boundary verifier grows to a new doc surface, the fixture helper in scripts/docs/verify-s03-public-boundary.contract.test.mjs must create that file too or the contract test will fail on fixture shape drift instead of wording drift."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran bash scripts/docs/verify-s03-public-artifact-boundary.sh all, bash scripts/docs/verify-m015-s04-delivery-surfaces.sh, bash scripts/docs/verify-s05-navigation.sh, and node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs. All passed on the final tree, confirming the cleaned public wording, maintained backlinks, and updated fixture-backed boundary contract."
completed_at: 2026-03-29T01:02:11.672Z
blocker_discovered: false
---

# T03: Demoted public proof/support docs to release assets and CI bundle names and hardened the boundary verifier contract.

> Demoted public proof/support docs to release assets and CI bundle names and hardened the boundary verifier contract.

## What Happened
---
id: T03
parent: S03
milestone: M016
key_files:
  - README.md
  - docs/README.md
  - docs/release-and-support.md
  - SUPPORT.md
  - scripts/docs/verify-s03-public-artifact-boundary.sh
  - scripts/docs/verify-m015-s04-delivery-surfaces.sh
  - scripts/docs/verify-s03-public-boundary.contract.test.mjs
  - .gsd/KNOWLEDGE.md
key_decisions:
  - D031: Public docs and support intake name only public release assets and CI artifact bundle names; clone-local rerun roots stay behind maintainer owner maps.
  - When the public-boundary verifier grows to a new doc surface, the fixture helper in scripts/docs/verify-s03-public-boundary.contract.test.mjs must create that file too or the contract test will fail on fixture shape drift instead of wording drift.
duration: ""
verification_result: passed
completed_at: 2026-03-29T01:02:11.673Z
blocker_discovered: false
---

# T03: Demoted public proof/support docs to release assets and CI bundle names and hardened the boundary verifier contract.

**Demoted public proof/support docs to release assets and CI bundle names and hardened the boundary verifier contract.**

## What Happened

Updated the public landing, docs landing, release/support owner doc, and support intake so they speak in terms of the shipped analyzer asset, GitHub Releases, yanote-validation-artifacts, and build-and-test-artifacts/* instead of clone-local .yanote-ci or .tmp proof roots. Added maintainer-only backlinks for local rerun breadcrumbs, expanded the public-boundary shell verifier to cover docs/release-and-support.md, updated the delivery-surface verifier to fail on private-path regressions and stale artifact wording, and repaired the fixture-backed Node contract test so its fixture repos now materialize the same public doc surface set as the live verifier.

## Verification

Ran bash scripts/docs/verify-s03-public-artifact-boundary.sh all, bash scripts/docs/verify-m015-s04-delivery-surfaces.sh, bash scripts/docs/verify-s05-navigation.sh, and node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs. All passed on the final tree, confirming the cleaned public wording, maintained backlinks, and updated fixture-backed boundary contract.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/docs/verify-s03-public-artifact-boundary.sh all` | 0 | ✅ pass | 145ms |
| 2 | `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh` | 0 | ✅ pass | 267ms |
| 3 | `bash scripts/docs/verify-s05-navigation.sh` | 0 | ✅ pass | 157ms |
| 4 | `node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs` | 0 | ✅ pass | 751ms |


## Deviations

None.

## Known Issues

T04 still owns the remaining public example/Compose cleanup; this task intentionally left examples/ surfaces to the next planned step.

## Files Created/Modified

- `README.md`
- `docs/README.md`
- `docs/release-and-support.md`
- `SUPPORT.md`
- `scripts/docs/verify-s03-public-artifact-boundary.sh`
- `scripts/docs/verify-m015-s04-delivery-surfaces.sh`
- `scripts/docs/verify-s03-public-boundary.contract.test.mjs`
- `.gsd/KNOWLEDGE.md`


## Deviations
None.

## Known Issues
T04 still owns the remaining public example/Compose cleanup; this task intentionally left examples/ surfaces to the next planned step.
