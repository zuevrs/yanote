---
id: T03
parent: S04
milestone: M014
provides: []
requires: []
affects: []
key_files: ["README.md", "docs/README.md", "docs/guides/asyncapi-kafka.md", "docs/release-and-support.md", ".github/BRANCH_PROTECTION.md", "scripts/docs/verify-m005-s01-async-path.sh", "scripts/docs/verify-m005-s01-async-boundaries.sh", "scripts/docs/verify-s04-boundaries.sh", ".gsd/milestones/M014/slices/S04/tasks/T03-SUMMARY.md"]
key_decisions: ["Keep public async delivery wording anchored to the redaction-safe CI summary line names (`binding support`, `declared semantics`, `runtime semantics`) instead of inventing broader product promises.", "Mirror public async boundary wording in the verifier scripts so documentation drift fails closed."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Re-ran `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh` successfully after the doc/script edits, then verified shell syntax for the edited verifiers and confirmed all touched doc/script surfaces are present and non-empty."
completed_at: 2026-03-26T14:10:33.761Z
blocker_discovered: false
---

# T03: Refreshed public async boundary docs and drift verifiers around the authoritative live Spring Kafka proof bundle.

> Refreshed public async boundary docs and drift verifiers around the authoritative live Spring Kafka proof bundle.

## What Happened
---
id: T03
parent: S04
milestone: M014
key_files:
  - README.md
  - docs/README.md
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
  - .github/BRANCH_PROTECTION.md
  - scripts/docs/verify-m005-s01-async-path.sh
  - scripts/docs/verify-m005-s01-async-boundaries.sh
  - scripts/docs/verify-s04-boundaries.sh
  - .gsd/milestones/M014/slices/S04/tasks/T03-SUMMARY.md
key_decisions:
  - Keep public async delivery wording anchored to the redaction-safe CI summary line names (`binding support`, `declared semantics`, `runtime semantics`) instead of inventing broader product promises.
  - Mirror public async boundary wording in the verifier scripts so documentation drift fails closed.
duration: ""
verification_result: passed
completed_at: 2026-03-26T14:10:33.763Z
blocker_discovered: false
---

# T03: Refreshed public async boundary docs and drift verifiers around the authoritative live Spring Kafka proof bundle.

**Refreshed public async boundary docs and drift verifiers around the authoritative live Spring Kafka proof bundle.**

## What Happened

Updated the root landing, docs landing, AsyncAPI/Kafka guide, release/support boundary doc, and branch-protection contract so they explicitly describe the authoritative live Spring Kafka async bundle, the widened `yanote-async-report.json` / `yanote-async-report.html` family, the retained runtime-selected/schema-failure companions, and the redaction-safe CI summary lines (`binding support`, `declared semantics`, `runtime semantics`) emitted via `build-and-test-artifacts` and GitHub step summary. Tightened all three doc verifier scripts in lockstep so drift in the widened async-bundle wording, release/support boundary wording, or branch-protection contract now fails mechanically while the public boundary remains Kafka-only, Spring Kafka-first, separate from HTTP reporting, and free of raw retained Kafka header leakage.

## Verification

Re-ran `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh` successfully after the doc/script edits, then verified shell syntax for the edited verifiers and confirmed all touched doc/script surfaces are present and non-empty.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 389ms |
| 2 | `bash -n scripts/docs/verify-m005-s01-async-path.sh scripts/docs/verify-m005-s01-async-boundaries.sh scripts/docs/verify-s04-boundaries.sh && python3 ... non-empty surface check` | 0 | ✅ pass | 31ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `README.md`
- `docs/README.md`
- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `.github/BRANCH_PROTECTION.md`
- `scripts/docs/verify-m005-s01-async-path.sh`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`
- `scripts/docs/verify-s04-boundaries.sh`
- `.gsd/milestones/M014/slices/S04/tasks/T03-SUMMARY.md`


## Deviations
None.

## Known Issues
None.
