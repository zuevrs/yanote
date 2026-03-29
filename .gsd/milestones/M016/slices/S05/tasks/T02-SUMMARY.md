---
id: T02
parent: S05
milestone: M016
provides: []
requires: []
affects: []
key_files: ["README.md", "docs/README.md", "examples/README.md", "scripts/docs/verify-s03-landing.sh", "scripts/docs/verify-m016-s04-short-docs.sh", "scripts/docs/verify-s03-example-boundary.sh", "scripts/docs/verify-s04-boundaries.sh", ".gsd/milestones/M016/slices/S05/tasks/T02-SUMMARY.md"]
key_decisions: ["Tighten the focused doc verifiers to lock newcomer→demo→release ordering explicitly instead of relying only on first-link checks and manual prose review.", "Repeat the public stable-line `v1.0.x` plus `yanote-analyzer.zip` wording on docs/examples landing surfaces so release/support stays a secondary owner surface with the same asset names as root and release docs."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "I syntax-checked every touched verifier with bash -n, then reran the full slice-required focused verification stack. All six task-plan verification commands passed: public artifact boundary, landing contract, short docs contract, example boundary, release boundary, and S05 navigation. This confirms the public root/docs/examples/release story remains product-first, silent about clone-local proof roots, and locked to the same stable-line and standalone-analyzer naming."
completed_at: 2026-03-29T03:01:10.854Z
blocker_discovered: false
---

# T02: Aligned the public landing/docs/examples story around the same quickstart-first flow, stable release line `v1.0.x`, and standalone analyzer asset `yanote-analyzer.zip`, then tightened the focused verifiers to fail closed on wording and ordering drift.

> Aligned the public landing/docs/examples story around the same quickstart-first flow, stable release line `v1.0.x`, and standalone analyzer asset `yanote-analyzer.zip`, then tightened the focused verifiers to fail closed on wording and ordering drift.

## What Happened
---
id: T02
parent: S05
milestone: M016
key_files:
  - README.md
  - docs/README.md
  - examples/README.md
  - scripts/docs/verify-s03-landing.sh
  - scripts/docs/verify-m016-s04-short-docs.sh
  - scripts/docs/verify-s03-example-boundary.sh
  - scripts/docs/verify-s04-boundaries.sh
  - .gsd/milestones/M016/slices/S05/tasks/T02-SUMMARY.md
key_decisions:
  - Tighten the focused doc verifiers to lock newcomer→demo→release ordering explicitly instead of relying only on first-link checks and manual prose review.
  - Repeat the public stable-line `v1.0.x` plus `yanote-analyzer.zip` wording on docs/examples landing surfaces so release/support stays a secondary owner surface with the same asset names as root and release docs.
duration: ""
verification_result: passed
completed_at: 2026-03-29T03:01:10.856Z
blocker_discovered: false
---

# T02: Aligned the public landing/docs/examples story around the same quickstart-first flow, stable release line `v1.0.x`, and standalone analyzer asset `yanote-analyzer.zip`, then tightened the focused verifiers to fail closed on wording and ordering drift.

**Aligned the public landing/docs/examples story around the same quickstart-first flow, stable release line `v1.0.x`, and standalone analyzer asset `yanote-analyzer.zip`, then tightened the focused verifiers to fail closed on wording and ordering drift.**

## What Happened

I started by treating the task as a drift investigation and ran the full focused doc stack against the current checkout. The stack was already green, which showed the remaining gap was not a broken public surface but an under-specified final-story contract: docs/examples did not carry the stable-line and asset wording as explicitly as root/release, and the guards did not fully lock the newcomer→demo→release ordering.

I updated README.md so the release/support pointer now names the stable line `v1.0.x` and the published analyzer bundle `yanote-analyzer.zip`. I updated docs/README.md to keep the opening copy product-first without public proof-surface jargon and to describe the release/support pointer with the same stable-line and asset names. I updated examples/README.md so the exit path out of the demo stays secondary while explicitly naming `v1.0.x` and `yanote-analyzer.zip` and using product-facing wording for the two example READMEs.

Then I tightened the focused shell verifiers instead of relying on prose review. verify-s03-landing.sh now enforces root/docs ordering across quickstart, docs map, examples, and release/support links. verify-m016-s04-short-docs.sh now rejects the old `release/proof surface` jargon and requires stable-line plus standalone-asset wording on the docs landing. verify-s03-example-boundary.sh now requires `v1.0.x` on the examples surface and proves the demo route appears before the release/support escape hatch. verify-s04-boundaries.sh was refreshed to assert the stable-line wording on root/docs/examples in addition to the existing standalone launcher and release-boundary checks.

## Verification

I syntax-checked every touched verifier with bash -n, then reran the full slice-required focused verification stack. All six task-plan verification commands passed: public artifact boundary, landing contract, short docs contract, example boundary, release boundary, and S05 navigation. This confirms the public root/docs/examples/release story remains product-first, silent about clone-local proof roots, and locked to the same stable-line and standalone-analyzer naming.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -n scripts/docs/verify-s03-landing.sh` | 0 | ✅ pass | 5ms |
| 2 | `bash -n scripts/docs/verify-m016-s04-short-docs.sh` | 0 | ✅ pass | 4ms |
| 3 | `bash -n scripts/docs/verify-s03-example-boundary.sh` | 0 | ✅ pass | 4ms |
| 4 | `bash -n scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 4ms |
| 5 | `bash scripts/docs/verify-s03-public-artifact-boundary.sh all` | 0 | ✅ pass | 78ms |
| 6 | `bash scripts/docs/verify-s03-landing.sh` | 0 | ✅ pass | 85ms |
| 7 | `bash scripts/docs/verify-m016-s04-short-docs.sh` | 0 | ✅ pass | 202ms |
| 8 | `bash scripts/docs/verify-s03-example-boundary.sh` | 0 | ✅ pass | 54ms |
| 9 | `bash scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 103ms |
| 10 | `bash scripts/docs/verify-s05-navigation.sh` | 0 | ✅ pass | 115ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `README.md`
- `docs/README.md`
- `examples/README.md`
- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-m016-s04-short-docs.sh`
- `scripts/docs/verify-s03-example-boundary.sh`
- `scripts/docs/verify-s04-boundaries.sh`
- `.gsd/milestones/M016/slices/S05/tasks/T02-SUMMARY.md`


## Deviations
None.

## Known Issues
None.
