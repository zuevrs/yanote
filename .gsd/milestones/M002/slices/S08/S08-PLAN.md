# S08: Proofed Entry Paths And Doc Reliability

**Goal:** Add one rerunnable final proof surface that replays Yanote’s documented concept → recorder → events → analyzer → interpretation journey, composes the existing S01-S07 verifiers instead of duplicating them, and leaves milestone evidence grounded in live command output.
**Demo:** A maintainer can run one S08 acceptance command, watch the repo prove the guide-first entry path plus release/support/trust/local-agent boundaries, and inspect fresh S08 UAT/summary artifacts that show the milestone is actually usable.

## Must-Haves

- [R022, R023, R024, R025, R026] One guide-first acceptance command must traverse the root/docs/guides path and delegate to the existing recorder, event-evidence, analyzer, and tagging proof surfaces rather than re-implementing them.
- [R027, R028, R029, R030, R031] The same acceptance flow must also verify release/support truth, documentation navigation, maintained-product trust surfaces, and the clone-local `AGENTS.md` boundary, with Docker Compose remaining optional rather than mandatory.
- S08 must leave fresh `.gsd` evidence (`S08-UAT.md`, `S08-SUMMARY.md`) based on live runs and task evidence so M002 no longer depends on placeholder slice summaries for operational truth.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `bash scripts/docs/verify-s08-entry-paths.sh`
- `rg -n 'verify-s08-entry-paths\.sh|verify-s02-analysis-path\.sh|GATE_MIN_AGGREGATE|git check-ignore -v AGENTS\.md|git status --ignored --short AGENTS\.md' .gsd/milestones/M002/slices/S08/S08-UAT.md`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: Stage-bounded output from `scripts/docs/verify-s08-entry-paths.sh`, plus the retained recorder/analyzer diagnostics already emitted by the delegated S01/S02 proof scripts.
- Inspection surfaces: `bash scripts/docs/verify-s08-entry-paths.sh`, the existing `scripts/docs/verify-s01-*.sh` … `verify-s07-local-agent.sh` scripts, clone-local Git commands from `docs/maintainers/local-agent-workflow.md`, and `.gsd/milestones/M002/slices/S08/S08-UAT.md`.
- Failure visibility: The failing proof stage name, delegated verifier output, persisted analyzer gate diagnostics (`YANOTE_ERROR`, `GATE_MIN_AGGREGATE`), and the exact Git ignore source reported by `git check-ignore -v AGENTS.md`.
- Redaction constraints: Never record `AGENTS.md` contents, secrets, or private prompt material; capture only command names, repo-relative paths, and pass/fail output needed for reruns.

## Integration Closure

- Upstream surfaces consumed: `README.md`, `docs/README.md`, `docs/guides/recorder-spring-mvc.md`, `docs/guides/analyzer-coverage.md`, `docs/guides/test-tagging.md`, `docs/release-and-support.md`, `docs/maintainers/local-agent-workflow.md`, and `scripts/docs/verify-s01-doc-links.sh` through `scripts/docs/verify-s07-local-agent.sh`.
- New wiring introduced in this slice: `scripts/docs/verify-s08-entry-paths.sh` composes the guide-first doc path, live recorder/analyzer proofs, release/navigation/trust verifiers, and clone-local `AGENTS.md` Git checks into one rerunnable gate; `docs/maintainers/proofed-entry-paths.md` documents that gate; `S08-UAT.md` and `S08-SUMMARY.md` persist the live proof.
- What remains before the milestone is truly usable end-to-end: Nothing within M002 once this slice passes; deferred R032 and R033 remain outside the milestone boundary.

## Tasks

- [x] **T01: Compose the final entry-path verifier** `est:45m`
  - Why: S08’s main gap is composition — the repo already has truthful detailed proofs, but no single acceptance command that exercises them in the same order a maintainer relies on the docs.
  - Files: `scripts/docs/verify-s08-entry-paths.sh`, `docs/maintainers/proofed-entry-paths.md`, `docs/maintainers/README.md`
  - Do: Add a new stage-ordered verifier that delegates to the existing S01-S07 scripts and clone-local `AGENTS.md` Git commands, keeps the proof guide-first and Docker-optional, and documents the rerun contract in the maintainer docs without exposing private agent content.
  - Verify: `bash scripts/docs/verify-s08-entry-paths.sh`
  - Done when: One command proves the documented concept → recorder → analyzer → boundary path using the existing verifiers, and the maintainer docs link to that rerun surface.
- [x] **T02: Capture live milestone proof evidence** `est:45m`
  - Why: S08 must leave fresh operational proof so M002 no longer depends on recovered placeholder summaries for its final handoff.
  - Files: `.gsd/milestones/M002/slices/S08/S08-UAT.md`, `.gsd/milestones/M002/slices/S08/S08-SUMMARY.md`, `scripts/docs/verify-s08-entry-paths.sh`
  - Do: Run the composed verifier in this clone, fix any last-mile truth or ordering drift it exposes, and write UAT/summary artifacts that capture the executed command order, key runtime outputs, analyzer gate diagnostics, and clone-local `AGENTS.md` proof results.
  - Verify: `bash scripts/docs/verify-s08-entry-paths.sh && rg -n 'GATE_MIN_AGGREGATE|git check-ignore -v AGENTS\.md|verify-s04-boundaries\.sh' .gsd/milestones/M002/slices/S08/S08-UAT.md`
  - Done when: `S08-UAT.md` and `S08-SUMMARY.md` are grounded in a passing live run from this clone and explicitly record the diagnostic surfaces future agents will need.
- [x] **T03: Close milestone state around the proven slice** `est:30m`
  - Why: Once S08 proof exists, the roadmap and living state files must stop describing M002 as pending and instead point at the final acceptance surface that now backs the milestone.
  - Files: `.gsd/milestones/M002/M002-ROADMAP.md`, `.gsd/PROJECT.md`, `.gsd/STATE.md`
  - Do: Mark S08 complete, refresh the living project snapshot to describe the now-proven repo journey and milestone outcome, and update `STATE.md` so the next agent sees post-milestone reality instead of stale planning state.
  - Verify: `bash scripts/docs/verify-s08-entry-paths.sh && git diff --check && rg -n 'S08|M002' .gsd/milestones/M002/M002-ROADMAP.md .gsd/PROJECT.md .gsd/STATE.md`
  - Done when: The living GSD artifacts all match the proven final-assembly state and no file still presents S08 as unfinished work.

## Files Likely Touched

- `scripts/docs/verify-s08-entry-paths.sh`
- `docs/maintainers/proofed-entry-paths.md`
- `docs/maintainers/README.md`
- `.gsd/milestones/M002/slices/S08/S08-UAT.md`
- `.gsd/milestones/M002/slices/S08/S08-SUMMARY.md`
- `.gsd/milestones/M002/M002-ROADMAP.md`
- `.gsd/PROJECT.md`
- `.gsd/STATE.md`
