# S03: Public repository boundary cleanup — UAT

**Milestone:** M016
**Written:** 2026-03-29T01:15:52.397Z

# S03: Public repository boundary cleanup — UAT

**Milestone:** M016
**Written:** 2026-03-29T00:34:59+03:00

## Preconditions
- Work from the M016 worktree root.
- `node` and `bash` are available.
- The repository already contains the S03 verifier scripts and the example/Compose contract test.
- Ignore any old local clone-only state under `.gsd/`, `.tmp/`, `.tmp-*`, or `.vite/`; the UAT checks public visibility/truth, not whether those local files exist.

## Test Case 1 — The public-boundary contract fails closed on dirty fixtures and passes on clean fixtures
**Goal:** prove the slice uses an executable contract for public-boundary cleanup instead of manual inspection.

1. Run:
   ```bash
   node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs
   ```
   **Expected:** the command exits `0`.
2. Review the named test cases in the output.
   **Expected:** they explicitly cover all of the following:
   - tracked-mode failure on tracked clone-local roots,
   - all-mode failure on public `.tmp` / private-path wording drift,
   - clean fixtures passing in both `tracked` and `all` modes,
   - missing ignore rules and unsupported mode names failing with actionable diagnostics.
3. Confirm the dirty-fixture test descriptions mention actionable failure output.
   **Expected:** the suite asserts that offending tracked paths or unsupported-mode diagnostics are printed, proving the observability surface is executable.

## Test Case 2 — Tracked clone-local roots are gone from the public inventory while maintainer workflow stays wired
**Goal:** prove the tracked public face is clean without breaking clone-local maintainer guidance.

1. Run:
   ```bash
   bash scripts/docs/verify-s03-public-artifact-boundary.sh
   ```
   **Expected:** the command exits `0` and prints that tracked public-boundary inventory entries under `.bg-shell/.gsd/.tmp/.tmp-*/.vite/dist` are `0`.
2. Run:
   ```bash
   bash scripts/docs/verify-s07-local-agent.sh
   ```
   **Expected:** the command exits `0` and confirms the maintainer-only workflow contract is still wired correctly.
3. Open `docs/maintainers/README.md` and `docs/maintainers/local-agent-workflow.md`.
   **Expected:** they describe `.gsd`/proof/runtime residue as clone-local maintainer surfaces rather than part of the public repository face.

## Test Case 3 — Public landing/support/release docs are clean but still truthful
**Goal:** prove the repository face no longer foregrounds local proof paths while preserving real public artifact names.

1. Run:
   ```bash
   bash scripts/docs/verify-s03-public-artifact-boundary.sh all
   ```
   **Expected:** the command exits `0` and confirms public landing/support surfaces stay silent about private paths.
2. Run:
   ```bash
   bash scripts/docs/verify-m015-s04-delivery-surfaces.sh
   bash scripts/docs/verify-s05-navigation.sh
   ```
   **Expected:** both commands exit `0`.
3. Open `README.md`, `docs/README.md`, `docs/release-and-support.md`, and `SUPPORT.md`.
   **Expected:** public wording refers to real shipped/public surfaces such as `yanote-analyzer.zip`, GitHub Releases, `yanote-validation-artifacts`, and `build-and-test-artifacts/*`, and does **not** foreground `.tmp`, `.yanote-ci`, `.gsd`, or other clone-local rerun roots.
4. Follow the maintainer backlink from the public docs/support surfaces.
   **Expected:** local rerun/proof breadcrumbs are discoverable only through maintainer docs, not through public landing text.

## Test Case 4 — Public example surfaces use the standalone analyzer launcher contract
**Goal:** prove the example landing and Compose demo no longer teach the raw Node seam.

1. Run:
   ```bash
   bash scripts/docs/verify-s03-landing.sh
   bash scripts/docs/verify-s03-example-boundary.sh
   ```
   **Expected:** both commands exit `0`.
2. Open `examples/README.md`.
   **Expected:** it describes the example in terms of public artifact bundles and the standalone analyzer story, not `.yanote-ci`/`.tmp` proof roots.
3. Open `examples/docker-compose.yml`.
   **Expected:** the report/analyzer step uses `dist/standalone-analyzer/bin/yanote` and does **not** invoke `node yanote-js/dist/yanote.cjs`.
4. Open `docs/maintainers/proofed-entry-paths.md`.
   **Expected:** any remaining clone-local rerun bundle paths live here, behind the maintainer-only boundary.

## Test Case 5 — The retained runnable demo still matches the cleaned public example contract
**Goal:** prove the example cleanup changed a real runnable surface, not just the docs.

1. Run:
   ```bash
   node --test scripts/ci/run-v1-e2e.contract.test.mjs
   ```
   **Expected:** the command exits `0`.
2. Review the named test cases in the output.
   **Expected:** they confirm all of the following:
   - the host prebuild includes the standalone analyzer launcher,
   - the Compose report container consumes that launcher instead of the raw Node seam,
   - raw Node assets remain only for host-side focused reruns,
   - retained bundle collection stays deterministic,
   - teardown remains unconditional.
3. If the public example docs and Compose file look correct but this contract test fails, treat that as a blocker.
   **Expected:** the slice is only accepted if docs, Compose config, and retained runnable proof all agree on the same analyzer entrypoint.

## Edge Case 1 — Unsupported verifier modes or missing ignore rules fail loudly
**Goal:** prove the guard cannot silently skip bad inputs.

1. Re-run Test Case 1 and focus on the “missing ignore rules and unsupported modes” case.
   **Expected:** the test suite explicitly proves these scenarios fail closed with actionable diagnostics.
2. If a future edit adds a new verifier mode or boundary root, rerun the contract suite immediately.
   **Expected:** any unsupported mode or missing ignore rule is surfaced as a contract failure rather than a silent pass.

## Edge Case 2 — Example-boundary drift localizes to the right surface
**Goal:** make future regressions attributable.

1. Re-run:
   ```bash
   bash scripts/docs/verify-s03-example-boundary.sh
   ```
   **Expected:** the verifier remains green on current HEAD.
2. On a future failure, inspect the error text first.
   **Expected:** it identifies whether the drift is in markdown wording/navigation, the Compose launcher contract, or the maintainer rerun backlink, so the next slice can fix the specific broken surface instead of re-auditing everything.

