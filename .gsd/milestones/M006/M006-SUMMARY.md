---
id: M006
provides:
  - Deterministic public demo/runtime proof through the hardened `run-v1-e2e.sh` path and retained public artifacts
  - Earlier delivery-sensitive CI proof without changing the stable required job names teams depend on
  - A cleaner public repo boundary where private maintainer/runtime trees are no longer tracked on the default branch
key_decisions:
  - Treat the public runtime/demo path as a first-class trust surface rather than a secondary example.
  - Remove tracked maintainer/runtime residue from the default branch instead of documenting around it.
patterns_established:
  - Public proof paths should be re-verified end to end whenever repo hygiene or CI topology changes.
  - Repo cleanup must preserve public docs and proof contracts rather than treating tracked artifact removal as a standalone housekeeping task.
observability_surfaces:
  - `node --test scripts/ci/*.test.mjs scripts/release/*.test.mjs`
  - `bash scripts/ci/run-v1-e2e.sh`
  - `bash scripts/docs/verify-s03-public-artifact-boundary.sh all`
  - GitHub Actions `yanote-ci` run `23319759762`
  - GitHub release run `23320033592` for `v1.0.125`
duration: restored-from-surviving-milestone-state
verification_result: passed
completed_at: 2026-03-23
---

# M006: Runtime Delivery Hardening And Public Repo Hygiene

**Yanote’s public runtime and repo boundary are trustworthy again:** the demo/proof path is deterministic, delivery-sensitive proof runs earlier in CI without changing required checks, and private maintainer/runtime trees no longer leak into the default branch.**

## What Happened

M006 repaired the parts of Yanote that users and maintainers experience before they ever read deep analyzer code: the public runtime proof path, the CI merge gate placement for delivery-sensitive verification, and the repo’s visible artifact boundary.

The milestone hardened `run-v1-e2e.sh` so the public demo/runtime story became deterministic again, moved the relevant proof closer to merge in GitHub Actions while preserving stable required check names, and cleaned tracked maintainer/runtime residue such as `.bg-shell/`, `.gsd/`, and bundle-centric `dist/` material out of the public branch without leaving docs or trust surfaces dangling.

The result is that later milestones can treat the public runtime proof and repo boundary as trustworthy foundations rather than working around a broken demo path or a noisy default branch.

## Cross-Slice Verification

- **Public runtime proof is deterministic again** — verified by `bash scripts/ci/run-v1-e2e.sh` and its retained proof artifacts.
- **Delivery-sensitive proof runs earlier in CI without destabilizing required checks** — verified by workflow contract tests and GitHub Actions `yanote-ci` run `23319759762`.
- **Public repo boundary no longer contains private maintainer/runtime trees** — verified by `bash scripts/docs/verify-s03-public-artifact-boundary.sh all` and the cleaned default branch state.
- **Release-facing delivery path remained healthy after the cleanup** — verified by release run `23320033592` for `v1.0.125`.

## Requirement Changes

- `R003`: strengthened — local and CI delivery surfaces now rest on a deterministic public runtime proof path and earlier CI proof placement.
- `R004`: strengthened — the public branch and release-facing surfaces are cleaner and more trustworthy after repo-boundary cleanup.

## Forward Intelligence

### What the next milestone should know
- Treat `run-v1-e2e.sh` as a public trust surface, not a demo afterthought.
- Repo hygiene and public docs/proof surfaces move together; changing one without the others causes user-facing drift quickly.

### What's fragile
- CI job topology is a compatibility surface — moving proof around is fine, renaming required jobs casually is not.
- Public proof artifacts can silently rot when runtime setup changes; always rerun the real script, not only contract tests.

### Authoritative diagnostics
- `bash scripts/ci/run-v1-e2e.sh` — first place to check whether the public runtime/demo story is still true.
- `bash scripts/docs/verify-s03-public-artifact-boundary.sh all` — first place to check repo-boundary drift.

### What assumptions changed
- “The analyzer core is enough” — in practice the public runtime/proof path and tracked repo boundary had to be treated as first-class product surfaces too.

## Files Created/Modified

- `scripts/ci/run-v1-e2e.sh` — hardened public runtime/demo proof entrypoint
- `.github/workflows/yanote-ci.yml` — CI proof moved earlier without changing required check names
- public repo artifact boundaries and docs — cleaned so durable public surfaces stayed tracked while private runtime residue stopped leaking into the default branch
