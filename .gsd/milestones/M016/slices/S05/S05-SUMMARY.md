---
id: S05
parent: M016
milestone: M016
provides:
  - A canonical final public-surface verifier: `bash scripts/docs/verify-m016-s05-public-surface.sh`.
  - A maintainer-only rerun leaf and release-signing workflow that require both the local release-candidate proof and the final public-surface proof.
  - One aligned public story across README/docs/examples/release surfaces for `v1.0.x`, `yanote-analyzer.zip`, and the standalone launcher contract.
requires:
  - slice: S02
    provides: the standalone analyzer release asset contract and retained tag-driven release-pipeline proof used by stages S05-07 and S05-12
  - slice: S03
    provides: the cleaned public-boundary and example-boundary surfaces used by stages S05-01, S05-02, and S05-08
  - slice: S04
    provides: the quickstart-first public docs path and short-doc verifiers used by stages S05-03 through S05-05 and S05-09
affects:
  []
key_files:
  - scripts/docs/verify-m016-s05-public-surface.sh
  - scripts/docs/verify-m016-s05-public-surface.contract.test.mjs
  - docs/maintainers/public-surface-proof.md
  - docs/maintainers/release-signing.md
  - scripts/docs/verify-s05-navigation.sh
  - README.md
  - docs/README.md
  - examples/README.md
  - docs/release-and-support.md
  - .gsd/PROJECT.md
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Delegate the final S05 acceptance path to existing S02-S04 proof owners under stable stage labels instead of duplicating assertions.
  - Keep all public root/docs/examples/release surfaces on one quickstart-first story with repeated `v1.0.x` and `yanote-analyzer.zip` wording.
  - Require maintainers to pass the local release-candidate proof before the final public-surface proof before pushing a real release tag.
patterns_established:
  - Compose final acceptance as one stage-labeled top-level verifier that delegates to existing proof owners and stops on the first failing surface.
  - Lock public wording drift with focused verifiers that repeat the same release line and analyzer asset names across root/docs/examples/release surfaces.
  - Keep maintainer rerun documentation discoverable through maintainer maps only, not through public onboarding surfaces.
observability_surfaces:
  - Stable `S05-0N` stage labels and exact delegated command echoes in `scripts/docs/verify-m016-s05-public-surface.sh`.
  - Maintainer-only rerun map in `docs/maintainers/public-surface-proof.md`.
  - Retained release diagnostics under `.yanote-ci/m016-s02-release-pipeline-proof/` (`phase-status.txt`, `artifact-manifest.txt`, `tag-context.txt`, stderr/stdout logs).
drill_down_paths:
  - .gsd/milestones/M016/slices/S05/tasks/T01-SUMMARY.md
  - .gsd/milestones/M016/slices/S05/tasks/T02-SUMMARY.md
  - .gsd/milestones/M016/slices/S05/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-29T03:21:28.529Z
blocker_discovered: false
---

# S05: Final public-surface integration proof

**S05 proved the cleaned repo boundary, quickstart/docs story, standalone analyzer CLI surface, repo demo, and tag-driven release diagnostics as one coherent public product path.**

## What Happened

S05 closed M016 by turning the cleaned public repository face, the short newcomer docs path, the standalone analyzer bundle contract, the repo demo, and the tag-driven release proof into one rerunnable acceptance story. T01 created `scripts/docs/verify-m016-s05-public-surface.sh` as the canonical stage-labeled assembly verifier, added a fixture-free contract test, and introduced a maintainer-only rerun leaf so the composed proof stays discoverable without leaking into public onboarding docs. T02 then reconciled `README.md`, `docs/README.md`, `examples/README.md`, and `docs/release-and-support.md` around one quickstart-first flow and one stable public wording set: the current release line is `v1.0.x`, the published analyzer asset is `yanote-analyzer.zip`, and the repo demo uses the same standalone launcher contract rather than a raw Node seam. T03 reran the assembled proof end to end, confirmed that all delegated stages pass together, and updated `docs/maintainers/release-signing.md` so maintainers must clear both the local release-candidate proof and the final public-surface proof before pushing a real release tag.

### Operational Readiness (Q8)
- **Health signal:** `bash scripts/docs/verify-m016-s05-public-surface.sh` passes all twelve stages; `node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` passes; and `.yanote-ci/m016-s02-release-pipeline-proof/phase-status.txt` plus `artifact-manifest.txt` show retained release-proof diagnostics.
- **Failure signal:** the top-level verifier stops on the first failing `S05-0N` label and prints the exact delegated command; release-stage drift leaves inspectable `preflight.stderr.log`, `publish.stderr.log`, `bundle.stderr.log`, or `notes.stderr.log` under `.yanote-ci/m016-s02-release-pipeline-proof/`.
- **Recovery procedure:** rerun the failing delegated command printed by the `S05-0N` stage, repair the owning surface, rerun that focused verifier, then rerun `bash scripts/docs/verify-m016-s05-public-surface.sh`; before a real tag push, rerun both `bash scripts/ci/verify-m016-s02-release-pipeline.sh` and `bash scripts/docs/verify-m016-s05-public-surface.sh` in that order.
- **Monitoring gaps:** this is a rerunnable local/CI proof surface rather than a continuous monitor, so drift is detected when maintainers rerun the verifier or perform release preparation; there is no always-on dashboard or alert feed for this boundary.

## Verification

Reran `bash scripts/docs/verify-m016-s05-public-surface.sh` successfully. It passed S05-01 through S05-12, including the public-boundary/landing/doc verifiers, live recorder runtime proof, standalone analyzer archive/runtime proof, repo demo contract test, and the retained tag-driven release-pipeline proof under `.yanote-ci/m016-s02-release-pipeline-proof/`. Reran `node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` and all 3 tests passed, confirming stage order, maintainer rerun discoverability, and the leak-free boundary between maintainer-only rerun docs and public onboarding surfaces. `git diff --check` was not rerun during closeout because this unit explicitly forbade git commands; the T03 task summary already records a clean pass for that verifier.

## Requirements Advanced

- R036 — Re-ran the short-doc assembly proof so the newcomer path stays truthful after integrating repo-demo and release surfaces.
- R038 — Re-ran the tagging/analyzer doc wiring inside the final composed proof so the quickstart-first public path still carries the explicit tagging contract.
- R040 — Wired release-signing guidance to require the local release-candidate proof before the final public-surface proof before a real tag push.

## Requirements Validated

- R035 — The composed S05 verifier passed tracked-boundary silence, landing/docs/example/release guards, and maintainer navigation, proving the public repository face stays product-first after cleanup.
- R037 — The composed S05 verifier passed recorder doc wiring and live recorder runtime proof, confirming one short explicit recorder path from public docs to writable `events.jsonl` evidence.
- R043 — `bash scripts/docs/verify-m016-s05-public-surface.sh` passed S05-01 through S05-12 and the S05 contract test passed, proving README/docs/examples/release surfaces, repo demo, maintainer navigation, and retained release proof all describe the same real shipping contract.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Closeout reran the full S05 verifier and the S05 contract test, but did not rerun `git diff --check` because this auto-mode unit explicitly forbade git commands. T03 already recorded a clean `git diff --check` result for the slice-level verifier stack, and closeout-only edits after verification were limited to internal GSD project/knowledge/decision surfaces.

## Known Limitations

None on the public product surface. The only open item is GSD requirement-database reconciliation for the newly validated M016 requirements.

## Follow-ups

Milestone validation/closeout should reconcile requirement database rows for R035, R037, and R043 if needed: validation decisions were recorded, but `gsd_requirement_update` could not resolve those IDs from this worktree even though `.gsd/REQUIREMENTS.md` lists them. No additional product-surface assembly work is expected for M016.

## Files Created/Modified

- `scripts/docs/verify-m016-s05-public-surface.sh` — Added the stage-labeled final public-surface acceptance orchestrator that delegates to existing S02-S04 proof owners.
- `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` — Pinned S05 stage order, delegated commands, maintainer references, and the rule that the rerun leaf stays out of public onboarding docs.
- `docs/maintainers/public-surface-proof.md` — Documented the canonical maintainer-only rerun command, stage map, and retained diagnostic bundle surfaces.
- `docs/maintainers/release-signing.md` — Required both the local release-candidate proof and the final public-surface proof before pushing a real release tag.
- `README.md` — Aligned root newcomer copy with the quickstart-first flow and stable `v1.0.x` / `yanote-analyzer.zip` release wording.
- `docs/README.md` — Aligned the docs landing to the same quickstart-first, standalone-analyzer, stable-line story.
- `examples/README.md` — Kept the example landing on one short repo-demo path while naming the same standalone analyzer and release line contract.
- `docs/release-and-support.md` — Kept the release/support owner surface aligned with the same stable-line and standalone-analyzer contract.
- `scripts/docs/verify-s05-navigation.sh` — Tightened the maintainer navigation guard so the new rerun leaf and release-signing wiring fail closed if they drift.
- `scripts/docs/verify-s03-landing.sh` — Tightened the focused public doc guards so newcomer -> demo -> release ordering and wording drift fail closed.
- `.gsd/PROJECT.md` — Refreshed current project state after S05 completion and milestone-closeout readiness.
- `.gsd/KNOWLEDGE.md` — Recorded the S05 assembly-proof pattern for future agents.
