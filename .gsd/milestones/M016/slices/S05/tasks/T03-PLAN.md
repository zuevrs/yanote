---
estimated_steps: 4
estimated_files: 5
skills_used:
  - debug-like-expert
---

# T03: Run the integrated proof and wire it into maintainer release workflow

**Slice:** S05 — Final public-surface integration proof
**Milestone:** M016

## Description

Close the slice on live evidence: the new S05 verifier must pass end to end, and release prep docs must require it. This task turns the composed proof from “planned orchestration” into the actual milestone gate for the clean public boundary, short docs path, standalone analyzer contract, and tag-driven release truth.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Recorder/analyzer runtime proof stages | Stop on the first failing stage and inspect the delegated temp/runtime artifacts instead of patching docs blindly | Bubble up the timed-out delegated runtime stage with its `S05-0N` label instead of continuing | Reject output that passes doc checks but fails the live recorder/archive contract |
| Release pipeline proof bundle | Fail closed on any non-success phase and inspect `.yanote-ci/m016-s02-release-pipeline-proof/phase-status.txt`, `artifact-manifest.txt`, and the retained logs before retrying | Surface publish/bundle/notes timeout directly from the delegated S02 script | Reject missing or mismatched release tag, proof status, or bundle asset counts instead of treating docs as sufficient |
| Release-signing guidance | Keep the task red until maintainer workflow names both the local release-candidate proof and the final public-surface proof | N/A | Reject release guidance that mentions only one gate or buries the new proof leaf |

## Load Profile

- **Shared resources**: Gradle publish/build tasks, archive extraction, retained proof artifacts under `.yanote-ci/m016-s02-release-pipeline-proof/`, and the S05 contract test.
- **Per-operation cost**: one end-to-end orchestrator run plus a lightweight Node contract test and maintainer-doc updates.
- **10x breakpoint**: build/runtime flakiness and retained-proof drift will break first, long before file-edit volume becomes the constraint.

## Negative Tests

- **Malformed inputs**: missing analyzer archive, missing maintainer proof leaf, or release-signing docs that do not mention the new final gate.
- **Error paths**: any delegated stage fails or times out, release `phase-status.txt` is not all-success, or `artifact-manifest.txt` no longer reports a successful proof bundle.
- **Boundary conditions**: the final command remains the single top-level gate, while delegated scripts continue to own detailed assertions and diagnostics.

## Steps

1. Execute `bash scripts/docs/verify-m016-s05-public-surface.sh` and use the first failing stage label to repair any remaining recorder/tagging/analyzer/example/release composition drift without reimplementing delegated logic.
2. Update `docs/maintainers/release-signing.md` so maintainers run the final public-surface verifier alongside the local release-candidate proof before pushing a real tag.
3. Re-run the composed verifier and contract test until the full public story is green.
4. Finish with `git diff --check` so the docs-heavy slice leaves a clean diff surface.

## Must-Haves

- [ ] The full S05 verifier passes against live runtime and retained release-proof surfaces.
- [ ] `docs/maintainers/release-signing.md` points at the final public-surface gate as part of real release prep.
- [ ] Future maintainers can find and rerun the proof from maintainer docs alone.

## Verification

- `bash scripts/docs/verify-m016-s05-public-surface.sh`
- `node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`
- `git diff --check`

## Observability Impact

- Signals added/changed: one passing end-to-end proof command plus retained S02 release diagnostics and delegated runtime proof output.
- How a future agent inspects this: start with `bash scripts/docs/verify-m016-s05-public-surface.sh`, then follow the first failing stage to the retained proof bundle or delegated verifier.
- Failure state exposed: failing stage label, failing command, release phase/status metadata, and retained bundle counts/context.

## Inputs

- `scripts/docs/verify-m016-s05-public-surface.sh` — composed final proof from T01 that must become green against the live repo.
- `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` — contract test that must still match the final stage order after live fixes.
- `docs/maintainers/public-surface-proof.md` — maintainer rerun leaf whose instructions must stay truthful after the live run.
- `docs/maintainers/release-signing.md` — maintainer release workflow doc that must reference the new gate.
- `scripts/ci/verify-m016-s02-release-pipeline.sh` — delegated retained release proof the final verifier depends on.
- `scripts/docs/verify-s01-recorder-path.sh` — delegated recorder runtime proof stage.
- `scripts/docs/verify-s02-analysis-path.sh` — delegated analyzer archive/runtime proof stage.
- `docs/release-and-support.md` — public release/support owner surface that the passing live proof must still match.

## Expected Output

- `scripts/docs/verify-m016-s05-public-surface.sh` — finalized end-to-end public-surface verifier after live-run fixes.
- `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` — finalized contract test matching the live verifier.
- `docs/maintainers/public-surface-proof.md` — maintainer rerun leaf aligned to the passing live command.
- `docs/maintainers/release-signing.md` — release workflow guidance updated to require the final public-surface proof.
- `docs/maintainers/README.md` — maintainer owner map finalized if release-proof navigation text changes.
