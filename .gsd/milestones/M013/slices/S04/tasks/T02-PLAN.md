---
estimated_steps: 3
estimated_files: 5
skills_used:
  - github-workflows
  - test
---

# T02: Publish widened delivery truth in GitHub summaries and workflow contracts

**Slice:** S04 — CI, Docs, And Support Truth For Delivery Surfaces
**Milestone:** M013

## Description

Once the bundles carry the right files and metadata, make the CI-facing summaries and workflow contract surfaces publish the same truth without changing the required job topology.

## Steps

1. Extend `render-yanote-summary.mjs` so HTTP and async summaries show sanitized `specSource`, additive deprecated-operation truth where applicable, and explicit JSON-vs-HTML artifact names from canonical report data plus collected artifact directories.
2. Update summary tests to pin the new wording, ordering, and secret-safe behavior for HTTP and async bundles.
3. Sync workflow and branch-protection contract surfaces so they still promise the same required jobs while documenting the widened artifact uploads and summary behavior.

## Must-Haves

- [ ] HTTP summaries disclose `specSource`, deprecated counts, and JSON/HTML artifact names without scraping new CLI-only output.
- [ ] Async summaries disclose separate async JSON/HTML artifact names and keep HTTP-only wording out.
- [ ] Workflow/branch-protection contracts remain topology-stable while explicitly acknowledging the widened artifact and summary surfaces.

## Verification

- `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
- Render representative HTTP and async markdown summaries from fixture-backed artifact directories and confirm the new artifact/provenance/deprecated lines appear in the expected order.

## Observability Impact

- Signals added/changed: `GITHUB_STEP_SUMMARY` output and branch-protection contract wording expose `specSource`, deprecated counts, and separate JSON/HTML artifact names.
- How a future agent inspects this: rerun the summary/workflow contract tests or inspect rendered markdown from `scripts/ci/render-yanote-summary.mjs` against collected bundles.
- Failure state exposed: summary drift, missing artifact lines, or required-job topology drift fails focused contract tests with the offending summary or workflow block.

## Inputs

- `scripts/ci/render-yanote-summary.mjs` — current HTTP/async summary renderer that still hides provenance, deprecated counts, and HTML sibling names.
- `scripts/ci/render-yanote-summary.test.mjs` — fixture-backed summary coverage for HTTP and async markdown outputs.
- `.github/workflows/yanote-ci.yml` — stable required-job workflow topology that must remain unchanged.
- `.github/BRANCH_PROTECTION.md` — human-readable contract for the required check names and uploaded artifacts.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — contract tests that pin workflow/job topology and branch-protection wording.
- `scripts/ci/collect-yanote-artifacts.sh` — T01 output that determines which widened HTTP artifact facts are available to summaries.
- `scripts/ci/export-async-proof-artifacts.sh` — T01 output that determines which widened async artifact facts are available to summaries.
- `scripts/ci/run-v1-e2e.sh` — T01 output whose bundle notes shape the delivery-sensitive proof surfaces referenced by the workflow contract.

## Expected Output

- `scripts/ci/render-yanote-summary.mjs` — summary renderer updated to publish artifact/provenance/deprecated truth for HTTP and async bundles.
- `scripts/ci/render-yanote-summary.test.mjs` — summary tests pinned to the widened markdown contract and secret-safe behavior.
- `.github/workflows/yanote-ci.yml` — workflow file updated only if needed to keep summary or artifact steps aligned with the widened contract while preserving stable job IDs.
- `.github/BRANCH_PROTECTION.md` — required-check contract wording updated to describe the widened uploaded artifacts and GitHub summary surfaces.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — workflow contract tests updated to pin the widened summary/artifact contract without renaming required jobs.
