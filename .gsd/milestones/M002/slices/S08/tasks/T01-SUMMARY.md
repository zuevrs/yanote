---
id: T01
parent: S08
milestone: M002
provides:
  - Final guide-first S08 acceptance command plus a maintainer-facing rerun contract for the composed proof path
key_files:
  - scripts/docs/verify-s08-entry-paths.sh
  - docs/maintainers/proofed-entry-paths.md
  - docs/maintainers/README.md
  - .gsd/milestones/M002/slices/S08/S08-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Keep S08 as a thin orchestration layer over the existing S01-S07 verifiers and clone-local Git diagnostics, and print the delegated command at each stage so failures localize to the real proof surface.
patterns_established:
  - Final-assembly proof scripts compose lower-level verifiers in stage order and document the same order in a maintainer leaf instead of copying assertions into a second monolithic gate.
observability_surfaces:
  - bash scripts/docs/verify-s08-entry-paths.sh
  - docs/maintainers/proofed-entry-paths.md
  - rg -n 'verify-s08-entry-paths\.sh|git check-ignore -v AGENTS\.md' docs/maintainers/proofed-entry-paths.md docs/maintainers/README.md
  - git diff --check
duration: 35m
verification_result: passed
completed_at: 2026-03-13 03:10:32 MSK
blocker_discovered: false
---

# T01: Compose the final entry-path verifier

**Completed the S08 composition layer by sharpening `verify-s08-entry-paths.sh`, adding the missing maintainer proof leaf, and wiring that rerun surface into the maintainer map.**

## What Happened

Started by checking the actual verifier inventory in `scripts/docs/` because the previous attempt had assumed nonexistent S04-S06 filenames. The repo already contained a mostly-correct `scripts/docs/verify-s08-entry-paths.sh`, but the task was still incomplete because the maintainer-facing proof leaf did not exist and the stage output did not name the delegated verifier path.

Updated `scripts/docs/verify-s08-entry-paths.sh` so every stage now prints a stable `S08-0N` label plus the exact delegated command before running it. That keeps the script fail-closed while making the failure surface actionable: if a stage breaks, the output now points directly to the underlying verifier or clone-local diagnostic flow.

Created `docs/maintainers/proofed-entry-paths.md` as the missing Russian-first maintainer rerun contract. The new leaf documents the single acceptance command, the canonical stage order, the required clone-local `AGENTS.md` Git diagnostics, and the truthful status of Docker Compose as optional/secondary rather than required.

Updated `docs/maintainers/README.md` so the new proof leaf is discoverable from the maintainer owner map without leaking `AGENTS.md` contents or private prompt material elsewhere.

Finally, marked T01 complete in `S08-PLAN.md` and advanced `.gsd/STATE.md` to T02.

## Verification

Task-level verification passed:

- `bash scripts/docs/verify-s08-entry-paths.sh` — passed end to end. All ten stages succeeded, including the live recorder proof, live analyzer + `GATE_MIN_AGGREGATE` proof, S04-S07 boundary verifiers, and clone-local `AGENTS.md` diagnostics.
- `rg -n 'verify-s08-entry-paths\.sh|git check-ignore -v AGENTS\.md' docs/maintainers/proofed-entry-paths.md docs/maintainers/README.md` — passed; the new maintainer proof leaf and owner-map entry are discoverable.
- `git diff --check` — passed.

Slice-level verification status at the end of T01:

- `bash scripts/docs/verify-s08-entry-paths.sh` — passed.
- `git diff --check` — passed.
- `rg -n 'verify-s08-entry-paths\.sh|verify-s02-analysis-path\.sh|GATE_MIN_AGGREGATE|git check-ignore -v AGENTS\.md|git status --ignored --short AGENTS\.md' .gsd/milestones/M002/slices/S08/S08-UAT.md` — expected fail for now because `S08-UAT.md` is owned by T02 and does not exist yet.

## Diagnostics

Run `bash scripts/docs/verify-s08-entry-paths.sh` for the top-level acceptance surface. Each stage now prints both a stable label and the delegated command, so the failing layer is immediately visible. Use `docs/maintainers/proofed-entry-paths.md` to see the intended stage order and the clone-local `AGENTS.md` diagnostics without exposing local file contents. The maintainer map entry in `docs/maintainers/README.md` is the stable discovery point for that rerun surface.

## Deviations

None.

## Known Issues

- `S08-UAT.md` and the slice-level evidence grep are still pending because T02 owns the live proof artifact capture.

## Files Created/Modified

- `scripts/docs/verify-s08-entry-paths.sh` — now prints the delegated command for each stage so failures point at the exact verifier or diagnostic layer.
- `docs/maintainers/proofed-entry-paths.md` — new maintainer-only rerun contract for the final guide-first proof command and clone-local `AGENTS.md` checks.
- `docs/maintainers/README.md` — added navigation to the new proof leaf and named the final rerun command.
- `.gsd/milestones/M002/slices/S08/S08-PLAN.md` — marked T01 complete.
- `.gsd/STATE.md` — advanced the next action to T02.
