---
id: M002
provides:
  - "A concept-first, guide-first repository surface with verified recorder → events → analyzer onboarding, explicit release/support boundaries, maintained-product trust surfaces, and a clone-local AGENTS.md workflow that stays out of tracked repo state."
key_decisions:
  - "Treat `bash scripts/docs/verify-s08-entry-paths.sh` plus `.gsd/milestones/M002/slices/S08/S08-UAT.md` as the canonical milestone proof, rather than relying on the recovered placeholder summaries for earlier slices."
patterns_established:
  - "Repository-maturity work should close through stage-owned verifiers and one thin composed acceptance path; public docs stay concept-first while maintainer-only workflow stays local and untracked."
observability_surfaces:
  - "bash scripts/docs/verify-s08-entry-paths.sh"
  - ".gsd/milestones/M002/slices/S08/S08-UAT.md"
  - "git check-ignore -v AGENTS.md"
  - "git status --ignored --short AGENTS.md"
  - "git diff --check"
requirement_outcomes:
  - id: R022
    from_status: active
    to_status: validated
    proof: "`bash scripts/docs/verify-s08-entry-paths.sh` stage `S08-01` passed, proving the root/docs/examples concept-first landing contract; the closure of the ledger is recorded in `.gsd/milestones/M002/slices/S08/tasks/T03-SUMMARY.md`."
  - id: R023
    from_status: active
    to_status: validated
    proof: "Stages `S08-02` and `S08-03` passed, including the live recorder proof `method=GET route=/orders/{orderId} status=200` against the Spring smoke fixture."
  - id: R024
    from_status: active
    to_status: validated
    proof: "`S08-03` proved live `events.jsonl` production and inspection, while `S08-UAT.md` captures the event-evidence retrieval and handoff signals used for analysis."
  - id: R025
    from_status: active
    to_status: validated
    proof: "`S08-05` passed with `aggregate_percent=93.75`, persisted `yanote-report.json`, and retained gate diagnostics `GATE_MIN_AGGREGATE` documented in `S08-UAT.md`."
  - id: R026
    from_status: active
    to_status: validated
    proof: "`S08-04` verified the canonical tagging guide wiring and `S08-05` proved tagged RestAssured events with `run_id=manual-run-s02` and `suite=restassured-suite`."
  - id: R027
    from_status: active
    to_status: validated
    proof: "`S08-06` resolved the latest stable tag `v1.0.122`, expected release line `v1.0.x`, and confirmed the public release/support surface matches that line."
  - id: R028
    from_status: active
    to_status: validated
    proof: "`S08-06` and `S08-08` passed, proving compatibility, limitation, support, and policy surfaces remain explicit and machine-checked."
  - id: R029
    from_status: active
    to_status: validated
    proof: "`S08-01` and `S08-07` passed, proving the user-facing landings, secondary maps, owner backlinks, and fallback positioning are wired into a coherent documentation architecture."
  - id: R030
    from_status: active
    to_status: validated
    proof: "`S08-08` passed in full mode, verifying identity/legal, public policy, and GitHub-native trust surfaces for the maintained-product repo posture."
  - id: R031
    from_status: active
    to_status: validated
    proof: "`S08-09` and `S08-10` passed, including `.git/info/exclude:8:/AGENTS.md`, `!! AGENTS.md`, and no tracked `AGENTS.md` in the index."
duration: ~8h 20m
verification_result: passed
completed_at: 2026-03-13 03:32:36 +0300
---

# M002: Repository Product Maturity

**Delivered a product-grade repository surface with live proof from concept through recorder, analyzer, release/support boundaries, trust surfaces, and the clone-local maintainer workflow.**

## What Happened

M002 did not change Yanote’s core engine. It made the repository behave like a serious product repo instead of a pile of truthful but fragmented materials.

S01 established the first hard adoption step: a short recorder path against a real Spring-based service, explicit recorder configuration expectations, and a concrete non-empty `events.jsonl` evidence contract. S02 finished the primary user loop by making the analyzer path canonical, documenting RestAssured/Cucumber tagging surfaces, and proving both the happy-path report and the expected gate-failure diagnostics.

With the runnable path in place, S03 turned the root surface into a concept-first landing and added stable `docs/` and `examples/` maps so a first-time engineer can understand Yanote before dropping into setup details. S04 then centralized the current release line, latest stable tag, GitHub Releases pointer, compatibility assumptions, and limitation wording behind one public owner surface. S05 finished the information architecture by separating user docs, maintainer docs, historical proof, and fallback bundle material without letting secondary surfaces compete with the primary recorder/analyzer path.

S06 hardened the trust layer: canonical repo/license identity, thin public policy files, CODEOWNERS, issue templates, PR intake, and bounded wording that matches a maintained-product posture rather than a community-first promise. S07 added the last missing maintainer contract: a root `AGENTS.md` that stays local to each clone, a tracked verifier that keeps public surfaces silent about private instructions, and clone-local Git proof through `.git/info/exclude`.

S08 was the only trustworthy milestone closure surface. It composed S01-S07 into one guide-first acceptance command, captured live UAT evidence, and proved the full concept → recorder → events → analyzer → interpretation → boundary story in the active clone. That mattered because S01-S06 still have recovered placeholder summaries; their existence satisfies the artifact invariant, but the operational source of truth for milestone acceptance is the live S08 proof and the T03 closure of the ledger/state surfaces.

## Cross-Slice Verification

- **Success criterion: first-time engineer can understand Yanote and the main workflow from the repo root.** Verified by `bash scripts/docs/verify-s08-entry-paths.sh` stage `S08-01`, which reran `scripts/docs/verify-s03-landing.sh` and passed with `Landing contract verification passed: root/docs/examples surfaces and example backlinks are wired correctly.`
- **Success criterion: repo provides a short, verified recorder path to a real Spring service and real `events.jsonl`.** Verified by stages `S08-02` and `S08-03`; the live passing run published local artifacts, started the Spring smoke fixture, sent a proof request, and ended with `Recorder proof passed: method=GET route=/orders/{orderId} status=200 service=recorder-spring-smoke test.run_id=None test.suite=None`.
- **Success criterion: engineer can run analysis and understand the resulting coverage report.** Verified by stages `S08-04` and `S08-05`; the live passing run built `yanote-js`, executed tagged RestAssured traffic, reported `aggregate_percent=93.75`, persisted `yanote-report.json`, and retained the failure-path diagnostics `YANOTE_ERROR class=gate code=GATE_MIN_AGGREGATE` and `YANOTE_SUMMARY ... primary=GATE_MIN_AGGREGATE` in `.gsd/milestones/M002/slices/S08/S08-UAT.md`.
- **Success criterion: current version line, recent changes, stable surfaces, compatibility assumptions, and limitations are visible.** Verified by stage `S08-06`; the live run resolved latest stable tag `v1.0.122`, expected line `v1.0.x`, reported repository position relative to that tag, and passed `scripts/docs/verify-s04-boundaries.sh`.
- **Success criterion: user docs, maintainer docs, and historical artifacts are separated cleanly.** Verified by stages `S08-01` and `S08-07`; `scripts/docs/verify-s05-navigation.sh` passed with owner backlinks and fallback positioning wired correctly.
- **Success criterion: repo exposes maintained-product trust surfaces without implying community-first stewardship.** Verified by stage `S08-08`; `scripts/docs/verify-s06-trust-surfaces.sh` passed in full mode after checking identity/legal, public policy, and GitHub-native intake surfaces.
- **Success criterion: maintainer agent instructions can remain local-only and untracked.** Verified by stages `S08-09` and `S08-10`; `scripts/docs/verify-s07-local-agent.sh` passed, `git check-ignore -v AGENTS.md` resolved to `.git/info/exclude:8:/AGENTS.md`, `git status --ignored --short AGENTS.md` returned `!! AGENTS.md`, and `git ls-files | rg '(^|/)AGENTS\.md$' || true` returned clean.
- **Definition of done / cross-slice integration:** Verified by direct filesystem checks showing all eight slice summaries exist, roadmap checks showing S01-S08 are `[x]`, a fresh passing run of `bash scripts/docs/verify-s08-entry-paths.sh`, and clean structure verification from `git diff --check`. The requirements ledger now reads `0 active · 31 validated · 2 deferred · 3 out of scope`, which matches the closed milestone boundary. No success criterion was left unmet.

## Requirement Changes

- R022: active → validated — `S08-01` proved the concept-first landing contract and T03 closed the requirement ledger around the passing proof.
- R023: active → validated — `S08-02`/`S08-03` proved the real-service recorder path and recorded runtime evidence.
- R024: active → validated — `S08-03` plus `S08-UAT.md` proved event capture, non-empty evidence, and the practical handoff to analysis.
- R025: active → validated — `S08-05` proved analyzer execution, report generation, report interpretation, and gate-failure diagnostics.
- R026: active → validated — `S08-04`/`S08-05` proved canonical tagging docs plus tagged runtime evidence.
- R027: active → validated — `S08-06` proved latest stable tag, stable release line, and public release visibility.
- R028: active → validated — `S08-06`/`S08-08` proved compatibility, support, and limitation surfaces.
- R029: active → validated — `S08-01`/`S08-07` proved the user/maintainer/history navigation split and recovery links.
- R030: active → validated — `S08-08` proved the repo-level trust and intake surfaces for a maintained product posture.
- R031: active → validated — `S08-09`/`S08-10` proved the tracked/public boundary plus the clone-local ignored-untracked root `AGENTS.md` contract.

## Forward Intelligence

### What the next milestone should know
- M002 is closed on live proof, not on prose. Start with `bash scripts/docs/verify-s08-entry-paths.sh` and `.gsd/milestones/M002/slices/S08/S08-UAT.md` before trusting any older slice narrative.

### What's fragile
- The clone-local `AGENTS.md` contract depends on repo-local Git admin state in `.git/info/exclude` — if that state is reset or the file is force-added, the public docs still look correct while the real boundary is broken.

### Authoritative diagnostics
- `bash scripts/docs/verify-s08-entry-paths.sh` and `.gsd/milestones/M002/slices/S08/S08-UAT.md` — together they localize failures by stage and preserve the exact analyzer gate and local-agent signals that matter operationally.

### What assumptions changed
- The recovered S01-S06 placeholder summaries would be enough to close the milestone — in practice the milestone needed a fresh composed proof and live UAT artifact because artifact existence was not the same thing as trustworthy acceptance evidence.

## Files Created/Modified

- `.gsd/milestones/M002/M002-SUMMARY.md` — recorded milestone-level proof, requirement transitions, and forward intelligence for the finished repository-maturity pass.
- `.gsd/PROJECT.md` — refreshed the living project snapshot to point at the milestone summary as the closed M002 handoff surface.
- `.gsd/STATE.md` — moved the quick-glance state from in-flight milestone completion to idle post-M002 status.
- `.gsd/REQUIREMENTS.md` — tightened the M002 traceability proof lines so the requirement ledger points at the final integrated proof surface instead of a generic validated marker.
