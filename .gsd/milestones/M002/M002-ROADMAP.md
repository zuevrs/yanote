# M002: Repository Product Maturity

**Vision:** Raise Yanote's repository and documentation layer to the standard of a stable corporate product: concept-first onboarding, verified real-service integration guidance, explicit release/support boundaries, navigable documentation, and a maintainer-safe local agent workflow.

## Success Criteria

- A first-time engineer can open the repository and understand what Yanote is, what it does, and the main path from recorder integration to report interpretation without hunting through historical notes.
- The repository provides a short, verified path to connect the recorder to a real Spring-based service, produce `events.jsonl`, run analysis, and understand the resulting coverage report.
- The repository clearly exposes the current version line, recent changes, stable surfaces, compatibility assumptions, and current limitations.
- User-facing docs, maintainer docs, and historical artifacts are separated cleanly enough that each audience can find the right information quickly.
- The repository presents the trust surfaces of a maintained product repo without pretending to be a community-first project.
- Maintainer agent instructions can be kept locally without publishing a tracked public `AGENTS.md`.

## Key Risks / Unknowns

- Recorder integration may still feel fragile or overly tied to temporary smoke paths, which would keep the repo from feeling product-grade.
- Coverage output may remain difficult for first-time users to interpret even if the commands themselves are documented.
- Repo documentation may stay fragmented if root landing, user docs, maintainer docs, and historical artifacts are not given a clear navigation contract.
- Trust-surface additions can accidentally create fake expectations of broad community stewardship if they are copied mechanically.
- Local-only `AGENTS.md` handling can leak into tracked state or remain too implicit for reliable maintainer use.

## Proof Strategy

- recorder integration fragility → retire in S01 by proving a short, truthful recorder → `events.jsonl` path against real repo assets
- analysis/interpretation ambiguity → retire in S02 by proving a runnable analyzer path plus concrete coverage-result interpretation guidance
- fragmented first-run navigation → retire in S03 and S05 by proving a concept-first landing and a coherent docs information architecture
- trust-surface mismatch → retire in S04 and S06 by proving version/support/limitations visibility and maintained-product repo surfaces
- local-only agent handling uncertainty → retire in S07 by proving a private, untracked maintainer workflow for `AGENTS.md`
- pretty docs that do not actually work → retire in S08 by re-running the key entry paths end-to-end from the docs as milestone proof

## Verification Classes

- Contract verification: file existence, internal-link correctness, command/path accuracy, requirement mapping, and truthful repo-surface boundaries
- Integration verification: real recorder → `events.jsonl` → analyzer → report flow exercised against existing repo assets and example/runtime surfaces
- Operational verification: current version/release/support/limitations surfaces match the real release line and maintainer workflow expectations; local `AGENTS.md` handling remains untracked
- UAT / human verification: none required for milestone completeness; readability must be supported by concept-first structure and verified commands rather than subjective review alone

## Milestone Definition of Done

This milestone is complete only when all are true:

- all slice deliverables are complete and mapped requirements remain covered truthfully
- the root repo entry path explains the product before deep setup details
- the recorder integration, event capture, analyzer execution, and report interpretation path is exercised from documentation, not merely described
- version/release/support/limitation surfaces are clear and reflect the actual current release line
- user docs, maintainer docs, and historical artifacts are wired into a coherent navigation model
- the repo exposes maintained-product trust surfaces without implying a community-first operating model
- the local-only maintainer `AGENTS.md` workflow is defined and kept out of tracked public repo state
- final integrated acceptance scenarios pass

## Requirement Coverage

- Covers: R022, R023, R024, R025, R026, R027, R028, R029, R030, R031
- Partially covers: none
- Leaves for later: R032, R033
- Orphan risks: none

## Slices

- [x] **S01: Verified Recorder Integration Path** `risk:high` `depends:[]`
  > After this: An engineer can follow one short, truthful path to connect the recorder to a real Spring service and verify that `events.jsonl` is being produced.

- [x] **S02: Analysis Run And Coverage Interpretation** `risk:high` `depends:[S01]`
  > After this: An engineer can run Yanote analysis on collected events, get a report, and understand the core meaning of the output and tagging-related integration points.

- [x] **S03: Concept-First Product Landing** `risk:medium` `depends:[S01,S02]`
  > After this: A first-time engineer can understand the product, primary workflow, and next steps from the root landing without wading through implementation archaeology.

- [x] **S04: Version, Release, And Support Boundaries** `risk:medium` `depends:[S03]`
  > After this: A repo visitor can see which version line is current, what changed recently, what is stable, and what limitations/support boundaries still apply.

- [x] **S05: Documentation Architecture And Navigation** `risk:medium` `depends:[S03,S04]`
  > After this: User docs, maintainer docs, and historical artifacts live in a coherent structure with clear navigation and truthful ownership of each surface.

- [ ] **S06: Maintained-Product Trust Surfaces** `risk:medium` `depends:[S05]`
  > After this: The repository presents the trust signals and policy surfaces expected from a serious maintained product repo, without overselling community bandwidth.

- [ ] **S07: Local Agent Development Contract** `risk:low` `depends:[S05,S06]`
  > After this: The maintainer has a safe, explicit local-only `AGENTS.md` workflow that does not publish private agent instructions into tracked repo state.

- [ ] **S08: Proofed Entry Paths And Doc Reliability** `risk:high` `depends:[S01,S02,S03,S04,S05,S06,S07]`
  > After this: The full user journey from concept to recorder setup to coverage interpretation is re-run from the docs, proving that the milestone improved real usability instead of only file organization.

## Boundary Map

### S01 → S02

Produces:
- verified recorder integration guide for a real Spring service
- canonical recorder configuration surface (`enabled`, events path, service-name expectations)
- concrete `events.jsonl` existence/non-empty verification steps
- explicit distinction between recommended integration path and temporary smoke/offline shortcuts

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- authoritative recorder/evidence acquisition path that the root landing can link to without caveats
- stable names for the user journey stages: recorder setup, event capture, analysis

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- authoritative analyzer execution contract (`report` path, input expectations, output location)
- coverage interpretation guide covering report meaning, exclusions, and common confusion points
- concrete tagging/header setup guidance for RestAssured and Cucumber surfaces

Consumes from S01:
- `events.jsonl` acquisition contract and recorder path assumptions

### S03 → S04

Produces:
- root landing information architecture and navigation contract
- canonical user-facing description of the product, target audience, and primary workflow

Consumes from S01/S02:
- verified recorder and analyzer paths

### S03 → S05

Produces:
- top-level doc taxonomy for where user-facing vs deeper reference content should live
- stable root-to-doc navigation links that downstream doc reorganization must preserve

Consumes from S01/S02:
- verified usage paths that deserve first-class placement

### S04 → S05

Produces:
- authoritative version/release/support/limitation sections and their owning files
- current-release visibility pattern that docs navigation must expose consistently

Consumes from S03:
- root landing contract and product framing

### S05 → S06

Produces:
- final documentation map separating user docs, maintainer docs, and historical artifacts
- stable homes for trust-surface files and policy references

Consumes from S03/S04:
- landing hierarchy and version/support ownership surfaces

### S05 → S07

Produces:
- clear boundary between public repo docs and maintainer-only workflow instructions
- authoritative place to document how local-only maintainer conventions are handled without public leakage

Consumes from S06:
- maintained-product trust-surface decisions that constrain how much maintainer policy should be public

### S01/S02/S03/S04/S05/S06/S07 → S08

Produces:
- final proof script for the concept → recorder → events → analyzer → interpretation journey
- validated navigation and repo-surface checklist showing that docs and trust signals match reality
- milestone completion evidence grounded in real commands, real files, and real repo paths

Consumes:
- all user-facing and maintainer-facing surfaces established by the prior slices
