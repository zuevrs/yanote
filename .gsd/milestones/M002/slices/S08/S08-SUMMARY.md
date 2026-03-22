---
id: S08
parent: M002
milestone: M002
provides:
  - One rerunnable guide-first final proof command plus live UAT evidence for the full concept → recorder → analyzer → repository-boundary journey.
requires:
  - slice: S01
    provides: Recorder guide wiring and live recorder proof surfaces.
  - slice: S02
    provides: Analyzer guide wiring, tagged-event runtime proof, and gate-failure diagnostics.
  - slice: S03
    provides: Concept-first landing and directory-entry contracts.
  - slice: S04
    provides: Release/support boundary verification against the latest stable tag.
  - slice: S05
    provides: Secondary navigation and recovery-path verification.
  - slice: S06
    provides: Trust, policy, and GitHub intake verification.
  - slice: S07
    provides: Tracked local-agent boundary checks plus the clone-local AGENTS.md proof contract.
affects:
  - M002 completion handoff
key_files:
  - scripts/docs/verify-s08-entry-paths.sh
  - docs/maintainers/proofed-entry-paths.md
  - .gsd/milestones/M002/slices/S08/S08-UAT.md
  - .gsd/milestones/M002/slices/S08/S08-SUMMARY.md
key_decisions:
  - Keep the final milestone proof as a thin composition layer over S01-S07 plus clone-local Git diagnostics, and treat live command output as the authoritative evidence instead of recovered placeholder summaries.
patterns_established:
  - Final-assembly slices should compose stage-owned verifiers in documented order and persist fresh runtime proof artifacts rather than restating old assertions from placeholder summaries.
observability_surfaces:
  - bash scripts/docs/verify-s08-entry-paths.sh
  - .gsd/milestones/M002/slices/S08/S08-UAT.md
  - docs/maintainers/proofed-entry-paths.md
  - YANOTE_ERROR class=gate code=GATE_MIN_AGGREGATE
  - git check-ignore -v AGENTS.md
  - git status --ignored --short AGENTS.md
drill_down_paths:
  - .gsd/milestones/M002/slices/S08/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S08/tasks/T02-SUMMARY.md
duration: 70m
verification_result: passed
completed_at: 2026-03-13 03:16:41 +0300
---

# S08: Proofed Entry Paths And Doc Reliability

**Captured a live final-assembly proof for the guide-first Yanote journey and persisted rerunnable UAT evidence instead of relying on recovered placeholder summaries.**

## What Happened

T01 finished the composition layer: `scripts/docs/verify-s08-entry-paths.sh` now runs the S01-S07 verifiers in the documented order, prints the delegated command at each `S08-0N` stage, and ends with the clone-local `AGENTS.md` Git diagnostics. `docs/maintainers/proofed-entry-paths.md` became the maintainer-facing rerun contract for that proof surface.

T02 then used the live clone as the source of truth. `bash scripts/docs/verify-s08-entry-paths.sh` passed end to end without needing composition fixes, which means the current repo really does prove the documented concept → recorder → events → analyzer → interpretation → boundary story in one command. The run produced the high-signal outputs the slice needed: the recorder proof against `/orders/{orderId}`, the analyzer proof over four tagged events with aggregate coverage `93.75`, the expected gate-failure code `GATE_MIN_AGGREGATE`, the latest stable release line `v1.0.x` resolved from tag `v1.0.122`, the trust/navigation verifier passes, and the clone-local `AGENTS.md` boundary resolving through `.git/info/exclude` with `git status --ignored --short AGENTS.md` returning `!! AGENTS.md`.

Because the top-level run only reports the gate summary line, T02 also captured the underlying analyzer failure-path evidence once so future agents would have the real diagnostic strings, not just the wrapper’s success message. Re-running `scripts/docs/verify-s02-analysis-path.sh` with an intentionally wrong expected gate code preserved the real gate artifacts after the failing analyzer command had already executed. That retained the exact `YANOTE_ERROR class=gate code=GATE_MIN_AGGREGATE ...` stderr line, the final `YANOTE_SUMMARY ... primary=GATE_MIN_AGGREGATE` stdout line, and the persisted `yanote-report.json` showing `status: partial`, aggregate coverage `93.75`, and the known missing `201` response for `POST /users`.

The slice summary and `S08-UAT.md` were written from those live command results and task evidence. They intentionally do **not** treat the recovered S01-S06 placeholder summaries as the primary source of truth for milestone acceptance.

## Verification

The current tree passed the proof and artifact checks needed for T02:

- `bash scripts/docs/verify-s08-entry-paths.sh`
- `rg -n 'verify-s08-entry-paths\.sh|GATE_MIN_AGGREGATE|git check-ignore -v AGENTS\.md|git status --ignored --short AGENTS\.md' .gsd/milestones/M002/slices/S08/S08-UAT.md .gsd/milestones/M002/slices/S08/S08-SUMMARY.md`
- `rg -n 'verify-s08-entry-paths\.sh|verify-s02-analysis-path\.sh|GATE_MIN_AGGREGATE|git check-ignore -v AGENTS\.md|git status --ignored --short AGENTS\.md' .gsd/milestones/M002/slices/S08/S08-UAT.md`
- `git diff --check`

Live evidence captured during T02 also confirmed:

- recorder proof: `Recorder proof passed: method=GET route=/orders/{orderId} status=200 service=recorder-spring-smoke test.run_id=None test.suite=None`
- analyzer proof: `Analysis proof passed: events=4 ... aggregate_percent=93.75 suite=restassured-suite`
- gate proof: `Gate proof passed: exit=3 code=GATE_MIN_AGGREGATE`
- release boundary: latest stable tag `v1.0.122`, expected line `v1.0.x`
- clone-local boundary: `git check-ignore -v AGENTS.md` resolved to `.git/info/exclude:8:/AGENTS.md` and `git status --ignored --short AGENTS.md` returned `!! AGENTS.md`

## Requirements Advanced

- R022-R026 — Advanced the final guide-first proof by composing the landing, recorder-guide, recorder-runtime, analyzer-guide, and analyzer-runtime/gate verifiers into one rerunnable acceptance command.
- R027-R031 — Advanced the final milestone handoff by carrying release/support, navigation, trust, tracked local-agent, and clone-local `AGENTS.md` boundary checks into the same acceptance flow and capturing fresh `.gsd` evidence from the live run.

## Requirements Validated

- R022-R026 — Validated by `bash scripts/docs/verify-s08-entry-paths.sh`, especially stages `S08-01` through `S08-05`, plus the retained `YANOTE_ERROR` / `YANOTE_SUMMARY` gate diagnostics recorded in `S08-UAT.md`.
- R027-R031 — Validated by stages `S08-06` through `S08-10`, including `scripts/docs/verify-s04-boundaries.sh`, `scripts/docs/verify-s05-navigation.sh`, `scripts/docs/verify-s06-trust-surfaces.sh`, `scripts/docs/verify-s07-local-agent.sh`, `git check-ignore -v AGENTS.md`, and `git status --ignored --short AGENTS.md`.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- None. The live proof passed without changes to `scripts/docs/verify-s08-entry-paths.sh`; the extra analyzer rerun was diagnostic-only evidence capture, not a scope change.

## Known Limitations

- Docker Compose remains an optional demo surface, not part of the required final proof. That is intentional, but it means S08 does not assert Docker availability.
- The clone-local `AGENTS.md` proof remains clone-specific because tracked repo state cannot truthfully prove another maintainer’s `.git/info/exclude` contents.
- T03 still needs to close the milestone-facing living files (`M002-ROADMAP.md`, `.gsd/PROJECT.md`, `.gsd/STATE.md`) around the now-proven slice.

## Follow-ups

- Execute T03 and update the milestone roadmap, project snapshot, and state file so the living GSD surfaces point at `bash scripts/docs/verify-s08-entry-paths.sh` and `S08-UAT.md` as the final M002 proof.

## Files Created/Modified

- `scripts/docs/verify-s08-entry-paths.sh` — composed the final S08 acceptance surface and exposed the delegated command at each stage.
- `docs/maintainers/proofed-entry-paths.md` — documented the canonical rerun order and clone-local `AGENTS.md` proof contract.
- `.gsd/milestones/M002/slices/S08/S08-UAT.md` — captured the live stage order, runtime outputs, analyzer gate diagnostics, and clone-local boundary proof from this clone.
- `.gsd/milestones/M002/slices/S08/S08-SUMMARY.md` — compressed the slice’s live proof story and made the runtime evidence, rather than placeholder summaries, the slice-level source of truth.

## Forward Intelligence

### What the next slice should know
- `bash scripts/docs/verify-s08-entry-paths.sh` already localizes failures well enough that the first debugging move should be to rerun the named delegated command, not to inspect unrelated docs.

### What's fragile
- The clone-local `AGENTS.md` boundary depends on `.git/info/exclude` state in the active clone — if that admin state is reset, `S08-10` fails even though tracked docs stay unchanged.

### Authoritative diagnostics
- `.gsd/milestones/M002/slices/S08/S08-UAT.md` plus `bash scripts/docs/verify-s08-entry-paths.sh` — together they show the stage order, the expected high-signal pass lines, and the exact gate/boundary failure surfaces worth rerunning.

### What assumptions changed
- Earlier recovered slice summaries would be enough to close the milestone — in practice the final acceptance needed fresh live proof artifacts because the placeholders were not trustworthy enough for operational handoff.
