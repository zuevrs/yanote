---
estimated_steps: 4
estimated_files: 3
skills_used:
  - debug-like-expert
  - bash-scripting
---

# T01: Codify the public-boundary contract and fail-closed guard

**Slice:** S03 — Public repository boundary cleanup
**Milestone:** M016

## Description

Turn the public-boundary expectation into an executable contract before any mass cleanup. Expand ignore rules to cover `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/`, teach the shell verifier to distinguish tracked-only vs full public-surface checks, and add a fixture-backed Node contract test so the guard can be verified even while the repo is still dirty.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `git ls-files` inventory plus `.gitignore` patterns | Fail closed and print the missing pattern or offending tracked root; do not guess | Treat as indeterminate repo state and keep the contract red | Reject ambiguous inventory parsing instead of silently passing |
| `scripts/docs/verify-s03-public-artifact-boundary.sh` exercised from Node fixtures | Keep the contract test red and print captured verifier stderr/stdout | Mark the verifier contract as broken; do not skip the failing fixture | Reject fixtures that pass while private roots are present or fail when the fixture is clean |

## Load Profile

- **Shared resources**: `.gitignore`, the shell verifier, and small temporary git fixtures.
- **Per-operation cost**: path-pattern updates plus a few short fixture runs.
- **10x breakpoint**: allowlist/forbidden-path drift across verifier modes becomes the main failure source before runtime cost matters.

## Negative Tests

- **Malformed inputs**: missing `.gsd/`, `.tmp-*`, or `.vite/` ignore rules; verifier mode names that silently skip checks.
- **Error paths**: tracked `.gsd`/`.tmp*` roots are present but the verifier exits green, or public docs still mention private paths without tripping the guard.
- **Boundary conditions**: dirty fixtures fail with high-signal diagnostics and clean fixtures pass in both tracked-only and full-public modes.

## Steps

1. Update `.gitignore` so `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/` are explicitly clone-local roots.
2. Expand `scripts/docs/verify-s03-public-artifact-boundary.sh` to cover the new root inventory plus forbidden references in public landing/support surfaces, while keeping an incremental tracked-only mode for later tasks.
3. Add `scripts/docs/verify-s03-public-boundary.contract.test.mjs` with dirty/clean fixture repos that prove the guard fails and passes for the right reasons.
4. Keep verifier output high-signal so later cleanup tasks can localize regressions quickly.

## Must-Haves

- [ ] Ignore rules explicitly describe the local-only roots this slice is removing from the public face.
- [ ] The shell verifier can check tracked-only cleanup separately from full public-surface wording.
- [ ] A real test file proves the verifier contract instead of relying on ad hoc manual reruns.

## Verification

- Run `node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs`.
- Expect dirty fixture repos to fail on tracked/private roots and clean fixtures to pass.

## Observability Impact

- Signals added/changed: the boundary guard emits missing ignore patterns, tracked-inventory counts, and exact forbidden public references.
- How a future agent inspects this: run `node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs` or the shell verifier directly.
- Failure state exposed: whether the regression is in ignore rules, tracked inventory, or forbidden public wording.

## Inputs

- `.gitignore` — current ignore contract for local and generated surfaces.
- `scripts/docs/verify-s03-public-artifact-boundary.sh` — existing boundary verifier that already checks `.gsd`/`dist` drift.
- `README.md` — root public landing surface whose private-path references the guard must learn to catch.
- `docs/README.md` — docs landing surface that should stay product-first.
- `SUPPORT.md` — public intake surface that currently exposes local proof directories.

## Expected Output

- `.gitignore` — clone-local ignore rules extended for `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/`.
- `scripts/docs/verify-s03-public-artifact-boundary.sh` — verifier updated with tracked-only and full-public modes.
- `scripts/docs/verify-s03-public-boundary.contract.test.mjs` — fixture-backed contract test that proves the guard fails and passes for the right reasons.
