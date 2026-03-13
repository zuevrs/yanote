---
estimated_steps: 4
estimated_files: 3
---

# T03: Close milestone state around the proven slice

**Slice:** S08 — Proofed Entry Paths And Doc Reliability
**Milestone:** M002

## Description

Once the S08 proof is passing and recorded, update the living milestone artifacts so they describe the verified state of the repo rather than the pre-proof plan. This task closes the loop for future agents and prevents stale state from making M002 look unfinished after it is already proven.

## Steps

1. Mark S08 complete in `.gsd/milestones/M002/M002-ROADMAP.md` and make the milestone text reflect that the final proof script now backs the integrated acceptance path.
2. Update `.gsd/PROJECT.md` so the current-state description names the proofed concept → recorder → analyzer journey, the release/support/trust surfaces, and the local-only `AGENTS.md` contract as proven repo behavior.
3. Update `.gsd/STATE.md` so it no longer says the slice is only being planned and instead points the next agent at the post-milestone reality or next queued work.
4. Re-run the final proof and `git diff --check` so the state updates cannot drift from the already-proven runtime and documentation reality.

## Must-Haves

- [ ] No living artifact still describes S08 as open or describes M002 as lacking a final integrated proof once the verifier and evidence exist.
- [ ] The updated state points to the rerunnable final proof surface and does not claim deferred work (R032/R033) was completed.

## Verification

- `bash scripts/docs/verify-s08-entry-paths.sh`
- `git diff --check && rg -n 'S08|Proofed Entry Paths|M002' .gsd/milestones/M002/M002-ROADMAP.md .gsd/PROJECT.md .gsd/STATE.md`

## Observability Impact

- Signals added/changed: Living milestone/state docs now point future agents at the final proof command and evidence files instead of stale planning text.
- How a future agent inspects this: Read `.gsd/STATE.md` for the current slice/milestone truth, then jump to the proof command and `S08-UAT.md` referenced there.
- Failure state exposed: Any mismatch between runtime proof and living state remains visible through `git diff --check` and the rerun of `bash scripts/docs/verify-s08-entry-paths.sh`.

## Inputs

- `.gsd/milestones/M002/slices/S08/S08-UAT.md` — live acceptance evidence from T02.
- `.gsd/milestones/M002/slices/S08/S08-SUMMARY.md` — slice handoff grounded in the passing proof.
- S05-S07 assessments — all remaining active M002 requirements depend on S08’s integrated proof pass before the milestone can be treated as complete.

## Expected Output

- `.gsd/milestones/M002/M002-ROADMAP.md` — updated to show S08 complete.
- `.gsd/PROJECT.md` — refreshed current-state snapshot for the proven milestone.
- `.gsd/STATE.md` — updated quick-glance state for the next agent.
