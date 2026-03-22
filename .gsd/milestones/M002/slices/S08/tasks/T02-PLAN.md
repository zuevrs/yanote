---
estimated_steps: 4
estimated_files: 3
---

# T02: Capture live milestone proof evidence

**Slice:** S08 — Proofed Entry Paths And Doc Reliability
**Milestone:** M002

## Description

Execute the composed S08 proof in the active clone, use any failing stage to correct last-mile ordering or truth issues, and record fresh UAT/summary artifacts from the live run. This task is what turns S08 from “planned proof” into authoritative milestone evidence.

## Steps

1. Run `bash scripts/docs/verify-s08-entry-paths.sh` from the active clone and use any failing stage output to fix final proof drift without re-implementing delegated logic.
2. Capture the passing command order and the high-signal outputs that prove the concept-first path, recorder success, analyzer report semantics, release/support checks, trust-surface checks, and clone-local `AGENTS.md` boundary.
3. Write `.gsd/milestones/M002/slices/S08/S08-UAT.md` so a future agent can rerun the proof and see the exact diagnostic surfaces that were observed, including the analyzer gate-failure signal and the Git ignore proof.
4. Write `.gsd/milestones/M002/slices/S08/S08-SUMMARY.md` from live command output and task evidence rather than from the placeholder slice-summary pattern seen earlier in M002.

## Must-Haves

- [ ] `S08-UAT.md` records the real acceptance command, the key delegated checks, the analyzer failure-path signal, and the clone-local `AGENTS.md` proof commands/results.
- [ ] `S08-SUMMARY.md` is grounded in the live run and explicitly avoids treating S01-S06 placeholder summaries as the primary source of truth.

## Verification

- `bash scripts/docs/verify-s08-entry-paths.sh`
- `rg -n 'verify-s08-entry-paths\.sh|GATE_MIN_AGGREGATE|git check-ignore -v AGENTS\.md|git status --ignored --short AGENTS\.md' .gsd/milestones/M002/slices/S08/S08-UAT.md .gsd/milestones/M002/slices/S08/S08-SUMMARY.md`

## Observability Impact

- Signals added/changed: Persisted UAT evidence for every final-proof stage, including runtime and boundary diagnostics.
- How a future agent inspects this: Read `S08-UAT.md`, then rerun `bash scripts/docs/verify-s08-entry-paths.sh` or the delegated failing command called out there.
- Failure state exposed: The exact acceptance stage, analyzer gate diagnostic strings, and Git ignore proof output observed during the live run.

## Inputs

- `scripts/docs/verify-s08-entry-paths.sh` — composed proof surface created in T01.
- `docs/maintainers/proofed-entry-paths.md` — documented rerun order and proof contract from T01.
- S01-S06 summary recovery caveat — use live command output and task-level evidence as the authoritative source, not the placeholder slice summaries.

## Expected Output

- `.gsd/milestones/M002/slices/S08/S08-UAT.md` — fresh acceptance evidence from the live composed run.
- `.gsd/milestones/M002/slices/S08/S08-SUMMARY.md` — real slice summary anchored in runtime proof.
- `scripts/docs/verify-s08-entry-paths.sh` — adjusted only if live execution reveals truthful composition issues.
