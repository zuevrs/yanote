---
id: T04
parent: S03
milestone: M016
provides: []
requires: []
affects: []
key_files: ["examples/README.md", "examples/docker-compose.yml", "docs/maintainers/proofed-entry-paths.md", "scripts/docs/verify-s03-landing.sh", "scripts/docs/verify-s03-example-boundary.sh", "scripts/ci/run-v1-e2e.sh", "scripts/ci/run-v1-e2e.contract.test.mjs", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Keep clone-local rerun bundle paths in docs/maintainers/proofed-entry-paths.md while public example docs reference only bundle names and the standalone launcher contract.", "Treat the example Compose launcher, the host distStandaloneAnalyzer prebuild, and the compose contract test as one coupled surface that must move together."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran bash -n on the changed shell scripts, node --test scripts/ci/run-v1-e2e.contract.test.mjs, bash scripts/docs/verify-s03-landing.sh, bash scripts/docs/verify-s03-example-boundary.sh, bash scripts/docs/verify-s03-public-artifact-boundary.sh all, node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs, bash scripts/docs/verify-m015-s04-delivery-surfaces.sh, and bash scripts/docs/verify-s05-navigation.sh. All passed on the final tree."
completed_at: 2026-03-29T01:12:00.901Z
blocker_discovered: false
---

# T04: Repointed the public example demo to the standalone analyzer launcher and added fail-closed example boundary guards.

> Repointed the public example demo to the standalone analyzer launcher and added fail-closed example boundary guards.

## What Happened
---
id: T04
parent: S03
milestone: M016
key_files:
  - examples/README.md
  - examples/docker-compose.yml
  - docs/maintainers/proofed-entry-paths.md
  - scripts/docs/verify-s03-landing.sh
  - scripts/docs/verify-s03-example-boundary.sh
  - scripts/ci/run-v1-e2e.sh
  - scripts/ci/run-v1-e2e.contract.test.mjs
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Keep clone-local rerun bundle paths in docs/maintainers/proofed-entry-paths.md while public example docs reference only bundle names and the standalone launcher contract.
  - Treat the example Compose launcher, the host distStandaloneAnalyzer prebuild, and the compose contract test as one coupled surface that must move together.
duration: ""
verification_result: passed
completed_at: 2026-03-29T01:12:00.902Z
blocker_discovered: false
---

# T04: Repointed the public example demo to the standalone analyzer launcher and added fail-closed example boundary guards.

**Repointed the public example demo to the standalone analyzer launcher and added fail-closed example boundary guards.**

## What Happened

Updated examples/README.md so the public example landing speaks in terms of yanote-analyzer.zip, yanote-validation-artifacts, and build-and-test-artifacts/* instead of clone-local .yanote-ci paths, while linking maintainers to docs/maintainers/proofed-entry-paths.md for the hidden rerun roots. Rewired examples/docker-compose.yml so the report step now executes the repo-local standalone launcher at dist/standalone-analyzer/bin/yanote with a fail-closed rebuild hint, and moved the clone-local rerun breadcrumb into the maintainer-only proof map. Added scripts/docs/verify-s03-example-boundary.sh to expose markdown-vs-compose-vs-maintainer regressions, realigned scripts/docs/verify-s03-landing.sh to current public wording, and updated scripts/ci/run-v1-e2e.sh plus scripts/ci/run-v1-e2e.contract.test.mjs so the runnable demo still prebuilds and proves the correct launcher contract end to end.

## Verification

Ran bash -n on the changed shell scripts, node --test scripts/ci/run-v1-e2e.contract.test.mjs, bash scripts/docs/verify-s03-landing.sh, bash scripts/docs/verify-s03-example-boundary.sh, bash scripts/docs/verify-s03-public-artifact-boundary.sh all, node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs, bash scripts/docs/verify-m015-s04-delivery-surfaces.sh, and bash scripts/docs/verify-s05-navigation.sh. All passed on the final tree.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -n scripts/docs/verify-s03-landing.sh scripts/docs/verify-s03-example-boundary.sh scripts/ci/run-v1-e2e.sh` | 0 | ✅ pass | 5ms |
| 2 | `node --test scripts/ci/run-v1-e2e.contract.test.mjs` | 0 | ✅ pass | 418ms |
| 3 | `bash scripts/docs/verify-s03-landing.sh` | 0 | ✅ pass | 334ms |
| 4 | `bash scripts/docs/verify-s03-example-boundary.sh` | 0 | ✅ pass | 123ms |
| 5 | `bash scripts/docs/verify-s03-public-artifact-boundary.sh all` | 0 | ✅ pass | 347ms |
| 6 | `node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs` | 0 | ✅ pass | 1554ms |
| 7 | `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh` | 0 | ✅ pass | 302ms |
| 8 | `bash scripts/docs/verify-s05-navigation.sh` | 0 | ✅ pass | 175ms |


## Deviations

Expanded the task beyond the listed files by updating scripts/ci/run-v1-e2e.sh and scripts/ci/run-v1-e2e.contract.test.mjs so the changed Compose demo remains runnable, not just documented.

## Known Issues

None.

## Files Created/Modified

- `examples/README.md`
- `examples/docker-compose.yml`
- `docs/maintainers/proofed-entry-paths.md`
- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s03-example-boundary.sh`
- `scripts/ci/run-v1-e2e.sh`
- `scripts/ci/run-v1-e2e.contract.test.mjs`
- `.gsd/KNOWLEDGE.md`


## Deviations
Expanded the task beyond the listed files by updating scripts/ci/run-v1-e2e.sh and scripts/ci/run-v1-e2e.contract.test.mjs so the changed Compose demo remains runnable, not just documented.

## Known Issues
None.
