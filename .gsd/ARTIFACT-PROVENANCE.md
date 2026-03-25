# Artifact Provenance

This file records where the current durable `.gsd` milestone state came from.

Use these categories strictly:

- `original` — the durable artifact survived in the repository's own committed `.gsd` history.
- `restored-from-backup` — the durable artifact was restored from a filesystem backup after the repo-local `.gsd` tree was lost.
- `recovered-from-repo-evidence` — the original durable closeout artifact was lost, but the milestone outcome was reconstructed from surviving repo commits, code, tests, docs, and proof surfaces.
- `reconstructed-root-layer` — the root `.gsd` living-doc layer was recreated after `.gsd` had historically been blanket-ignored in git.

## Root Layer

- `PROJECT.md`, `REQUIREMENTS.md`, `KNOWLEDGE.md`, `DECISIONS.md`, `OVERRIDES.md`, `QUEUE.md`
  - Status: `reconstructed-root-layer`
  - Why: `yanote` historically blanket-ignored `.gsd/`, so the current repo-local durable layer was reintroduced on 2026-03-22 and then corrected to match durable milestone truth.

## Milestone Terminal State

- `M001`
  - Status: `restored-from-backup`
  - Current terminal artifacts: `M001-ROADMAP.md`, `M001-SUMMARY.md`
  - Source: restored in commit `b0c5cd3` from preserved repo-local backup state.

- `M002`
  - Status: `restored-from-backup`
  - Current terminal artifacts: `M002-ROADMAP.md`, `M002-SUMMARY.md`
  - Source: restored in commit `b0c5cd3` from preserved repo-local backup state.

- `M003`
  - Status: `restored-from-backup`
  - Current terminal artifacts: `M003-ROADMAP.md`, `M003-SUMMARY.md`
  - Source: restored in commit `b0c5cd3` from preserved repo-local backup state.

- `M004`
  - Status: `restored-from-backup`
  - Current terminal artifacts: `M004-ROADMAP.md`, `M004-SUMMARY.md`
  - Source: restored in commit `b0c5cd3` from preserved repo-local backup state.

- `M005`
  - Status: `restored-from-backup`
  - Current terminal artifacts: `M005-ROADMAP.md`, `M005-SUMMARY.md`
  - Source: restored in commit `b0c5cd3` from preserved repo-local backup state.

- `M006`
  - Status: `restored-from-backup`
  - Current terminal artifacts: `M006-ROADMAP.md`, `M006-SUMMARY.md`
  - Source: restored in commit `b0c5cd3` from preserved repo-local backup state.

- `M007`
  - Status: `restored-from-backup`
  - Current terminal artifacts: `M007-ROADMAP.md`, `M007-SUMMARY.md`, `M007-VALIDATION.md`
  - Source: restored in commit `b0c5cd3` from preserved repo-local backup state.

- `M008`
  - Status: `restored-from-backup`
  - Current terminal artifacts: `M008-ROADMAP.md`, `M008-SUMMARY.md`, `M008-VALIDATION.md`
  - Source: restored in commit `727b658` from preserved backup state after the terminal closeout files were found missing in the repo-local tree.
  - Canonicalization note: `M008-ROADMAP.md` was reconstructed on 2026-03-23 from the surviving context, summary, and validation artifacts so the milestone once again has a canonical roadmap surface.

- `M009`
  - Status: `recovered-from-repo-evidence`
  - Current terminal artifacts: `M009-ROADMAP.md`, `M009-SUMMARY.md`
  - Why: the original terminal closeout artifact did not survive in repo-local `.gsd` or backups, but the milestone implementation and outcome did survive in repo history and current proof surfaces.
  - Evidence basis:
    - `fe30e5c` — additive HTTP/Kafka payload provenance contract landed.
    - `b6fca44` — recorder-side provenance emission and broader Kafka payload capture landed.
    - `9a42f35` — Spring MVC compilation follow-up for the same milestone landed.
    - `7c6a9ca` — retained async header evidence and hardened proof/docs surfaces landed.
  - Recovery commit: `3ef99e2`

## Reading Rule

Do not treat `recovered-from-repo-evidence` as equivalent to an original untouched closeout artifact.

It means:
- the milestone outcome is considered true;
- the terminal `.gsd` closeout file is not original;
- the closeout was reconstructed from durable repo evidence because the original milestone summary artifact was lost.
2 template shape;
- the file now matches current canonical artifact conventions;
- the exact historical wording or structure did not survive unchanged.
