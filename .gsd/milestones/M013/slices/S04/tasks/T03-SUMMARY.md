---
id: T03
parent: S04
milestone: M013
key_files:
  - README.md
  - docs/README.md
  - examples/README.md
  - docs/guides/analyzer-coverage.md
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
  - scripts/docs/verify-s03-landing.sh
  - scripts/docs/verify-s04-boundaries.sh
key_decisions:
  - Public docs now state the local file/directory `--spec` path as the stable baseline and remote single-document `http(s)` `--spec` as a narrow opt-in surface with sanitized provenance.
  - Landing, guide, and support pages name separate HTTP and async JSON+HTML artifact families plus CI bundle names instead of implying any combined report or dashboard surface.
  - Shell verifiers now pin the widened public-support wording so regressions in HTML artifact names, remote-support scope, deprecated-operation truth, or no-dashboard boundaries fail closed.
duration: ""
verification_result: passed
completed_at: 2026-03-26T04:04:19.954Z
blocker_discovered: false
---

# T03: Align public docs and doc verifiers with the local-first delivery boundary

**Align public docs and doc verifiers with the local-first delivery boundary**

## What Happened

Updated the public landing, docs landing, examples landing, analyzer guide, async guide, and release/support page so they all describe the same delivery contract that CI now proves. The new wording keeps the local file/directory `--spec` baseline explicit, describes remote single-document `http(s)` `--spec` support as a narrow opt-in surface with sanitized provenance, names additive deprecated-operation truth, and calls out separate HTTP and async JSON+HTML artifact families instead of any combined report or dashboard surface. I also widened `scripts/docs/verify-s03-landing.sh` and `scripts/docs/verify-s04-boundaries.sh` so they fail closed if the new HTML artifact, remote-support, deprecated-truth, CI bundle, or no-dashboard wording drifts. After patching the docs, I fixed one verifier mismatch caused by case-sensitive remote-path wording in `docs/guides/analyzer-coverage.md`, then re-ran the shell verifiers and the slice node contract suite successfully. I manually spot-checked the updated README/guides/support sections by reading the changed regions to confirm they consistently point to separate HTTP vs async artifact families and the same local-first / remote-opt-in / no-dashboard boundary.

## Verification

Passed the focused doc verifiers after updating their required phrases, then ran the full slice node contract suite to confirm the widened docs still match the retained artifact and workflow-contract surfaces. I also manually re-read the updated sections in `README.md`, `docs/README.md`, `examples/README.md`, `docs/guides/analyzer-coverage.md`, `docs/guides/asyncapi-kafka.md`, and `docs/release-and-support.md` to confirm they all describe separate HTTP/async JSON+HTML artifacts, sanitized remote provenance, additive deprecated truth, and the explicit no-dashboard/no-combined boundary. I did not run `git diff --check` because this auto-mode task explicitly forbids running git commands.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/docs/verify-s03-landing.sh` | 0 | ✅ pass | 142ms |
| 2 | `bash scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 171ms |
| 3 | `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 348ms |


## Deviations

Skipped `git diff --check` because the auto-mode instruction for this task explicitly forbids git commands; relied on the focused shell verifiers, slice node contract tests, and manual doc scan instead.

## Known Issues

None.

## Files Created/Modified

- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/guides/analyzer-coverage.md`
- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s04-boundaries.sh`
