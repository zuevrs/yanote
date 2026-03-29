---
id: T01
parent: S04
milestone: M016
provides: []
requires: []
affects: []
key_files: ["README.md", "docs/README.md", "docs/guides/getting-started.md", "scripts/docs/verify-m016-s04-short-docs.sh", "scripts/docs/verify-m016-s04-short-docs.contract.test.mjs", "scripts/docs/verify-s03-landing.sh", ".gsd/milestones/M016/slices/S04/tasks/T01-SUMMARY.md"]
key_decisions: ["Split landing verification into a new short-doc contract for size/proof-first drift and an updated S03 landing verifier for newcomer navigation/backlinks.", "Keep release/support linked from the short landings as a secondary boundary surface while moving the first navigation slot to the newcomer quickstart."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Task-level verification passed with bash scripts/docs/verify-m016-s04-short-docs.sh, node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs, and bash scripts/docs/verify-s03-landing.sh. Cross-slice doc-link and public-boundary verifiers also passed. Slice-level runtime verification was partial: bash scripts/docs/verify-s01-recorder-path.sh passed, while bash scripts/docs/verify-s02-analysis-path.sh failed because the example proof recorded 8 events instead of the verifier's documented expectation of 4."
completed_at: 2026-03-29T01:52:01.396Z
blocker_discovered: false
---

# T01: Added a newcomer quickstart and fail-closed landing verifiers for the short docs path.

> Added a newcomer quickstart and fail-closed landing verifiers for the short docs path.

## What Happened
---
id: T01
parent: S04
milestone: M016
key_files:
  - README.md
  - docs/README.md
  - docs/guides/getting-started.md
  - scripts/docs/verify-m016-s04-short-docs.sh
  - scripts/docs/verify-m016-s04-short-docs.contract.test.mjs
  - scripts/docs/verify-s03-landing.sh
  - .gsd/milestones/M016/slices/S04/tasks/T01-SUMMARY.md
key_decisions:
  - Split landing verification into a new short-doc contract for size/proof-first drift and an updated S03 landing verifier for newcomer navigation/backlinks.
  - Keep release/support linked from the short landings as a secondary boundary surface while moving the first navigation slot to the newcomer quickstart.
duration: ""
verification_result: mixed
completed_at: 2026-03-29T01:52:01.397Z
blocker_discovered: false
---

# T01: Added a newcomer quickstart and fail-closed landing verifiers for the short docs path.

**Added a newcomer quickstart and fail-closed landing verifiers for the short docs path.**

## What Happened

Rewrote the root README and docs landing into short newcomer-first surfaces, added docs/guides/getting-started.md as the explicit recorder → tagging → analyzer → repo demo path, and replaced the old landing assumptions with fail-closed verifiers for ordering, backlinks, size ceilings, and proof-first wording. A small local adaptation restored the root async-guide backlink so the cross-slice doc-link verifiers still pass without changing the newcomer-first order.

## Verification

Task-level verification passed with bash scripts/docs/verify-m016-s04-short-docs.sh, node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs, and bash scripts/docs/verify-s03-landing.sh. Cross-slice doc-link and public-boundary verifiers also passed. Slice-level runtime verification was partial: bash scripts/docs/verify-s01-recorder-path.sh passed, while bash scripts/docs/verify-s02-analysis-path.sh failed because the example proof recorded 8 events instead of the verifier's documented expectation of 4.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/docs/verify-m016-s04-short-docs.sh && node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs && bash scripts/docs/verify-s03-landing.sh` | 0 | ✅ pass | 2236ms |
| 2 | `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh` | 0 | ✅ pass | 348ms |
| 3 | `bash scripts/docs/verify-s03-example-boundary.sh && bash scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 256ms |
| 4 | `bash scripts/docs/verify-s01-recorder-path.sh` | 0 | ✅ pass | 107900ms |
| 5 | `bash scripts/docs/verify-s02-analysis-path.sh` | 1 | ❌ fail | 404600ms |


## Deviations

Restored a secondary docs/guides/asyncapi-kafka.md backlink in README.md after rerunning the existing slice verifiers, because that secondary link is still part of the current doc-link contract.

## Known Issues

bash scripts/docs/verify-s02-analysis-path.sh currently fails outside this landing-doc scope because the example test-tagging/analyzer proof records 8 events where the verifier still expects 4. The latest retained failure artifacts are under /var/folders/6n/q9s0qd4d5b92jqqf9kk_0kdm0000gn/T//yanote-s02-analysis.WKHdZq/.

## Files Created/Modified

- `README.md`
- `docs/README.md`
- `docs/guides/getting-started.md`
- `scripts/docs/verify-m016-s04-short-docs.sh`
- `scripts/docs/verify-m016-s04-short-docs.contract.test.mjs`
- `scripts/docs/verify-s03-landing.sh`
- `.gsd/milestones/M016/slices/S04/tasks/T01-SUMMARY.md`


## Deviations
Restored a secondary docs/guides/asyncapi-kafka.md backlink in README.md after rerunning the existing slice verifiers, because that secondary link is still part of the current doc-link contract.

## Known Issues
bash scripts/docs/verify-s02-analysis-path.sh currently fails outside this landing-doc scope because the example test-tagging/analyzer proof records 8 events where the verifier still expects 4. The latest retained failure artifacts are under /var/folders/6n/q9s0qd4d5b92jqqf9kk_0kdm0000gn/T//yanote-s02-analysis.WKHdZq/.
