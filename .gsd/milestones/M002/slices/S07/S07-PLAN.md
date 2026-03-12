# S07: Local Agent Development Contract

**Goal:** Establish a safe, explicit maintainer-only workflow for a root `AGENTS.md` that remains local to each clone while keeping Yanote’s tracked repository surfaces free of private agent instructions.
**Demo:** A maintainer can follow one maintainer-only doc to bootstrap a local root `AGENTS.md`, prove the file is ignored via the repo-local Git admin exclude path, and rely on a machine-checked verifier that rejects any regression publishing or advertising the workflow in tracked repo surfaces.

## Must-Haves

- Add a machine-checked S07 boundary verifier in `scripts/docs/verify-s07-local-agent.sh` that fails if any tracked `AGENTS.md` exists, if tracked `.gitignore` or public repo surfaces mention `AGENTS.md`, or if the maintainer-only doc wiring/required commands drift. This directly advances **R031** and protects supporting **R029** and **R030**.
- Add a maintainer-only leaf at `docs/maintainers/local-agent-workflow.md` and wire it from `docs/maintainers/README.md` using the existing maintainer-doc owner/backlink pattern; the leaf must explain the local root `AGENTS.md`, bootstrap via `git rev-parse --git-path info/exclude`, the anchored `/AGENTS.md` rule, `git check-ignore -v`, `git status --ignored --short AGENTS.md`, `git ls-files`, and the rule against publishing secrets, private prompt content, or personal workflow notes. This directly advances **R031** and protects supporting **R029** and **R030**.
- Perform a real local proof in the current clone by adding `/AGENTS.md` to the resolved repo-local `info/exclude`, creating or updating the local root `AGENTS.md`, proving ignored/untracked status with Git commands, and rerunning the tracked verifier without leaking the file into tracked state. This directly advances **R031**.

## Proof Level

- This slice proves: operational
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `bash scripts/docs/verify-s07-local-agent.sh`
- `bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh`
- `git check-ignore -v AGENTS.md`
- `git status --ignored --short AGENTS.md | rg '^!! AGENTS\\.md$'`
- `test -z "$(git ls-files | rg '(^|/)AGENTS\\.md' || true)"`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: none — this slice relies on deterministic shell verifier output and Git’s built-in ignore diagnostics rather than app/runtime logging.
- Inspection surfaces: `scripts/docs/verify-s07-local-agent.sh`, `git rev-parse --git-path info/exclude`, `git check-ignore -v`, `git status --ignored --short`, and `git ls-files`.
- Failure visibility: path-specific `ERROR:` lines from the verifier plus Git output that names the exact ignore file/pattern or shows that `AGENTS.md` became visible/tracked.
- Redaction constraints: never echo or copy the local `AGENTS.md` contents into tracked files, logs, summaries, or public docs; no secrets or personal environment notes may be required for verification.

## Integration Closure

- Upstream surfaces consumed: `docs/maintainers/README.md`, `docs/maintainers/release-signing.md`, `.gitignore`, `README.md`, `docs/README.md`, `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`, `scripts/docs/verify-s05-navigation.sh`, `scripts/docs/verify-s06-trust-surfaces.sh`
- New wiring introduced in this slice: `docs/maintainers/README.md` → `docs/maintainers/local-agent-workflow.md`; `scripts/docs/verify-s07-local-agent.sh` protecting the public/private boundary; and the repo-local `info/exclude` bootstrap that keeps the root `AGENTS.md` usable but untracked.
- What remains before the milestone is truly usable end-to-end: S08 must rerun the full concept → recorder → analyzer journey and include the S07 public-boundary verifier plus the local `AGENTS.md` proof commands in the final milestone acceptance pass.

## Tasks

- [x] **T01: Add the verifier-first local-agent boundary contract** `est:45m`
  - Why: S07 needs an objective guardrail before adding docs or a local file; otherwise the slice could drift into memory-based policy instead of a proofed contract.
  - Files: `scripts/docs/verify-s07-local-agent.sh`
  - Do: Create the S07 shell verifier in the existing S03-S06 contract style; make it fail on any tracked `AGENTS.md`, any tracked `.gitignore` mention of `AGENTS.md`, any public/trust-surface mention of the local-agent workflow, missing maintainer-map wiring, or a maintainer leaf that lacks the required commands/backlink/boundary wording; run it once to capture the expected initial failure before the new maintainer doc exists.
  - Verify: `bash scripts/docs/verify-s07-local-agent.sh`
  - Done when: the verifier exists, emits deterministic `ERROR:` lines for the currently missing maintainer leaf/link, and already enforces the clean public/tracked boundary.
- [x] **T02: Document and wire the maintainer-only AGENTS workflow** `est:45m`
  - Why: The repository needs explicit handling rules for maintainers, but those rules must stay inside the maintainer-doc branch and avoid publishing the private file’s contents.
  - Files: `docs/maintainers/README.md`, `docs/maintainers/local-agent-workflow.md`, `docs/maintainers/release-signing.md`
  - Do: Add a Russian-first maintainer leaf following the existing audience/owner/backlink pattern; explain that the real `AGENTS.md` lives at the repo root but stays local-only, that the ignore bootstrap uses `git rev-parse --git-path info/exclude` with anchored `/AGENTS.md`, how to verify the rule with `git check-ignore -v`, `git status --ignored --short AGENTS.md`, and `git ls-files`, and that the tracked doc must not include secrets, private prompt dumps, or personal workflow notes; then link the leaf from `docs/maintainers/README.md` and rerun the S05/S06/S07 verifier stack.
  - Verify: `bash scripts/docs/verify-s07-local-agent.sh && bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh`
  - Done when: the maintainer map links to the new leaf, the leaf contains the required commands/backlink/boundary clauses, and the tracked verifier stack passes without adding any public mention of the workflow.
- [x] **T03: Bootstrap and prove the local root AGENTS contract in this clone** `est:30m`
  - Why: S07 is not complete if it only documents the rule; one real repo-local proof is required to show the root `AGENTS.md` workflow actually works without entering tracked state.
  - Files: `AGENTS.md`, `$(git rev-parse --git-path info/exclude)`
  - Do: Resolve the repo-local admin exclude path with `git rev-parse --git-path info/exclude`, append anchored `/AGENTS.md` if missing, create or update the local root `AGENTS.md` with maintainer-safe instructions derived from the tracked contract but without secrets/private notes, prove the file is ignored and untracked with `git check-ignore -v`, `git status --ignored --short AGENTS.md`, and `git ls-files`, and leave the clone with the local file present but still outside tracked state.
  - Verify: `git check-ignore -v AGENTS.md && git status --ignored --short AGENTS.md | rg '^!! AGENTS\\.md$' && test -z "$(git ls-files | rg '(^|/)AGENTS\\.md' || true)" && bash scripts/docs/verify-s07-local-agent.sh && git diff --check`
  - Done when: the local root `AGENTS.md` exists, the repo-local exclude file ignores it via anchored `/AGENTS.md`, Git shows it as ignored rather than tracked, and the tracked verifier still passes.

## Files Likely Touched

- `scripts/docs/verify-s07-local-agent.sh`
- `docs/maintainers/README.md`
- `docs/maintainers/local-agent-workflow.md`
- `AGENTS.md`
- `$(git rev-parse --git-path info/exclude)`