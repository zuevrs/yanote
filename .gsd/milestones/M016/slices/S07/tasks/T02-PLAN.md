---
estimated_steps: 24
estimated_files: 4
skills_used:
  - debug-like-expert
  - test
---

# T02: Lock final public-surface rerun truth to the hardened recorder bootstrap

Close S07 on the composed public-surface proof, not only the focused bootstrap fix. Once the recorder verifier is hardened, maintainer-facing docs and the S05 contract suite need to describe exactly that behavior, and the full acceptance path must pass cold and on immediate rerun.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `docs/maintainers/public-surface-proof.md` plus `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` | Keep the task red until the maintainer leaf describes the same bootstrap contract the script implements | N/A | Reject docs/tests that still imply Plugin Portal refresh dependency or stale diagnostics wording |
| `bash scripts/docs/verify-m016-s05-public-surface.sh` | Stop at the first failing `S05-0N` stage and repair the owning surface instead of papering over recorder-stage drift | Treat rerun failure as slice-incomplete | Reject partial success where the cold run passes but the immediate rerun fails |
| `bash scripts/docs/verify-s01-recorder-path.sh` | Re-run the focused recorder verifier first if `S05-06` regresses and inspect the retained bootstrap artifacts | Treat as a recorder-stage blocker before the broader proof | Reject green docs/contracts when the live recorder proof is still red |

## Load Profile

- **Shared resources**: the recorder verifier, the S05 composed verifier, the retained release-proof bundle reused by `S05-12`, and the maintainer rerun leaf.
- **Per-operation cost**: one focused recorder proof, one focused contract pass, and two full public-surface proof runs.
- **10x breakpoint**: repeated full-stack proof reruns dominate runtime cost; doc/contract coverage stays cheap.

## Negative Tests

- **Malformed inputs**: maintainer wording that omits bounded publish retry, retained bootstrap artifacts, or the removal of forced refresh behavior.
- **Error paths**: cold-run success but immediate-rerun failure, or a recorder-stage contract test that still passes after bootstrap behavior drifts.
- **Boundary conditions**: the maintainer leaf remains a secondary surface while still documenting the exact runtime proof contract and failure breadcrumbs.

## Steps

1. Update `docs/maintainers/public-surface-proof.md` so `S05-06` documents the hardened bootstrap contract, including the retained diagnostics maintainers should inspect after bootstrap failure.
2. Extend `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` so doc drift around the recorder bootstrap contract fails closed.
3. Run `bash scripts/docs/verify-s01-recorder-path.sh`, then run `bash scripts/docs/verify-m016-s05-public-surface.sh` twice from the same checkout to prove both the cold path and immediate rerun path.
4. Only close the task once both full S05 passes are green and the maintainer leaf still points at the right diagnostics without leaking this surface into public onboarding docs.

## Must-Haves

- [ ] Maintainer rerun docs describe the same recorder bootstrap contract the live script implements.
- [ ] S05 contract coverage fails if the recorder stage drifts back to Plugin Portal refresh dependency or stale diagnostics wording.
- [ ] `bash scripts/docs/verify-m016-s05-public-surface.sh` passes from a cold run and on immediate rerun in the same checkout.

## Inputs

- `scripts/docs/verify-s01-recorder-path.sh`
- `scripts/docs/verify-s01-recorder-path.contract.test.mjs`
- `scripts/docs/verify-m016-s05-public-surface.sh`
- `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`
- `docs/maintainers/public-surface-proof.md`

## Expected Output

- `docs/maintainers/public-surface-proof.md`
- `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`

## Verification

bash scripts/docs/verify-s01-recorder-path.sh && node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs && bash scripts/docs/verify-m016-s05-public-surface.sh && bash scripts/docs/verify-m016-s05-public-surface.sh

## Observability Impact

- Signals added/changed: the maintainer rerun surface must describe the same retained bootstrap diagnostics and rerun command the live verifier emits.
- How a future agent inspects this: run the focused recorder verifier first, then the S05 proof, and use the documented stage labels plus retained artifact paths to localize failure.
- Failure state exposed: cold-run vs rerun drift at `S05-06` stays attributable instead of collapsing into a generic final-proof failure.
