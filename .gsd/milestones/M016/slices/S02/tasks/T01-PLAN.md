---
estimated_steps: 4
estimated_files: 5
skills_used:
  - debug-like-expert
  - github-workflows
  - bash-scripting
---

# T01: Runtime-test the signed-tag preflight gate

**Slice:** S02 — Tag-driven release and publication pipeline
**Milestone:** M016

## Description

Turn the release tag gate into a runtime-tested contract that proves only signed stable tags from `main` can unlock the publication path, and that every rejection stays deterministic and inspectable.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `git` tag/signature inspection plus `gpg` fixture material | Fail closed with the exact diagnostic class/code for unsigned, unannotated, missing, or off-main tags; do not downgrade to a warning | Treat the gate as blocked and keep the captured stdout/stderr from the fixture run for inspection | Reject imported keys or tags whose fingerprint/object type does not match the expected signed annotated-tag contract |
| `scripts/release/preflight.sh` environment validation | Missing freeze approval or credentials must stop the pipeline before any publish/build step runs | Treat as a failed gate; never continue with partial publish preparation | Reject malformed retry or tag metadata instead of emitting ambiguous outputs |
| `.github/workflows/release.yml` preflight output wiring | Fail the workflow contract tests if job outputs drift from the runtime preflight contract | Treat stale wiring as a broken release trigger | Reject renamed or missing outputs that would make downstream publish steps read the wrong release tag/retry state |

## Load Profile

- **Shared resources**: local git refs, temporary GPG homedir/key material, and the workflow output names consumed by downstream release steps.
- **Per-operation cost**: several short preflight executions against fixture repos/tags plus source-level contract checks.
- **10x breakpoint**: repeated temporary repo/key setup dominates before shell logic does.

## Negative Tests

- **Malformed inputs**: missing tag, bad `vMAJOR.MINOR.PATCH` format, prerelease suffixes, non-annotated tags, and `SNAPSHOT` project version.
- **Error paths**: unsigned tag, tag not reachable from `main`, missing credentials, missing freeze approval, and non-transient publish failure classification.
- **Boundary conditions**: signed stable tag on `main` passes, transient publish reasons remain retry-eligible, and deterministic diagnostic ordering survives mixed failure cases.

## Steps

1. Add a process-level contract test harness that executes `bash scripts/release/preflight.sh` against controlled git/tag and environment fixtures instead of only source-inspecting the script.
2. Tighten `scripts/release/preflight.sh` only where runtime gaps exist so signed annotated tags on `main` pass, malformed/unsigned/off-main/snapshot release attempts fail closed, and the emitted class/code/retry outputs stay deterministic.
3. Keep `.github/workflows/release.yml` aligned with the runtime preflight contract by consuming the same release-tag and retry outputs that the process-level tests assert.
4. Update the existing preflight contract tests so they pin the runtime gate surface rather than stale implementation details.

## Must-Haves

- [ ] Real script execution proves the signed-tag gate instead of relying only on source inspection.
- [ ] Every fail-closed rejection emits deterministic diagnostic class/code/retry output that later release steps can consume or surface.
- [ ] Workflow preflight wiring still matches the runtime-tested contract exactly.

## Verification

- `node --test scripts/release/preflight.runtime.contract.test.mjs scripts/release/maven-central-preflight.contract.test.mjs scripts/release/release-failclosed.contract.test.mjs scripts/release/release-workflow.contract.test.mjs`
- Runtime cases cover signed annotated tag success, unsigned/off-main/prerelease/snapshot rejection, and retry-classification drift.

## Observability Impact

- Signals added/changed: real preflight execution emits deterministic `diagnostic-class=...`, `retry-eligible=...`, and `retry_reason=...` surfaces that later steps can trust.
- How a future agent inspects this: run the named Node test suite and inspect the captured fixture stdout/stderr in `scripts/release/preflight.runtime.contract.test.mjs` failures.
- Failure state exposed: malformed tags, missing credentials, unsigned/off-main tags, and retry-classification drift fail with explicit class/code output instead of ambiguous shell errors.

## Inputs

- `scripts/release/preflight.sh` — current release gate that enforces tag, signature, lineage, freeze, and credential policy.
- `.github/workflows/release.yml` — current preflight job wiring and downstream publish outputs.
- `scripts/release/maven-central-preflight.contract.test.mjs` — existing source-level assertions for semver, signing, and credential policy.
- `scripts/release/release-failclosed.contract.test.mjs` — current diagnostics and retry-contract expectations.

## Expected Output

- `scripts/release/preflight.runtime.contract.test.mjs` — process-level signed-tag success and fail-closed rejection tests.
- `scripts/release/preflight.sh` — runtime-aligned preflight diagnostics and output contract.
- `scripts/release/maven-central-preflight.contract.test.mjs` — updated source-level coverage for the tightened runtime gate.
- `scripts/release/release-failclosed.contract.test.mjs` — updated deterministic diagnostics contract if the output surface changes.
- `.github/workflows/release.yml` — workflow preflight wiring kept aligned with the runtime-tested gate.
