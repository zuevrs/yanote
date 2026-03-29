---
estimated_steps: 24
estimated_files: 4
skills_used: []
---

# T02: Lock maintainer rerun coverage and prove S05 is cold+rereun safe

Close the slice on the actual final public-surface proof. S06 is not done when the focused recorder verifier passes once; it is done when the composed S05 proof can be run cold and then rerun immediately without flaking on S05-06, and when maintainer-facing docs/tests describe that behavior truthfully.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `node --test` coverage around the recorder/public-surface verifier docs | Keep the task red until the readiness strategy and maintainer references are pinned | N/A | Reject tests that pass while log-line gating or stale diagnostics wording still exists |
| `bash scripts/docs/verify-m016-s05-public-surface.sh` | Stop at the first failing `S05-0N` stage and repair the owning surface instead of papering over it | Treat as slice-incomplete and keep the failing stage label/logs | Reject partial success where a cold run passes but the immediate rerun fails |
| Maintainer rerun leaf | Fail closed if it still implies log-only readiness or omits the retained diagnostics future maintainers need | N/A | Reject doc/test drift between the maintainer leaf and the actual recorder verifier behavior |

## Load Profile

- **Shared resources**: the recorder verifier, the S05 composed verifier, the retained release-proof bundle reused by S05-12, and the maintainer rerun leaf.
- **Per-operation cost**: one focused test pass plus two full public-surface proof runs.
- **10x breakpoint**: full-stack proof reruns dominate runtime cost; the contract coverage stays cheap.

## Negative Tests

- **Malformed inputs**: reintroducing the `Started RecorderSmokeApplication` grep or dropping the failure-artifact printout from maintainer surfaces.
- **Error paths**: a cold S05 pass but rerun failure because temp paths, reserved ports, or retained proof surfaces are not rerunnable.
- **Boundary conditions**: maintainer docs describe the same deterministic readiness and diagnostics the script actually uses.

## Steps

1. Update the maintainer rerun leaf so S05-06 documents the deterministic readiness probe and the retained failure artifacts future agents should inspect.
2. Extend the S05 contract coverage wherever needed so maintainer-doc drift around the recorder stage fails closed.
3. Run the focused recorder verifier, then run `bash scripts/docs/verify-m016-s05-public-surface.sh` twice from the same checkout to prove both the cold path and immediate rerun path.
4. Only close the task once both full S05 passes are green and the maintainer leaf still points at the right diagnostics.

## Must-Haves

- [ ] Maintainer rerun docs describe the same readiness and diagnostics the recorder verifier implements.
- [ ] Contract coverage fails if the recorder-stage rerun surface drifts away from the real verifier behavior.
- [ ] A cold run and immediate rerun of `bash scripts/docs/verify-m016-s05-public-surface.sh` both pass end to end.

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

The maintainer rerun surface must name the deterministic S05-06 readiness probe and point future agents to the same retained failure artifacts the recorder verifier prints when cold or rerun proof fails.
