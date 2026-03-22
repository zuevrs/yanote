---
estimated_steps: 4
estimated_files: 4
---

# T03: Align CI summary readers and live proof verifiers with the widened async contract

**Slice:** S03 — Async Report And Gate Schema Truth
**Milestone:** M007

## Description

Load the `bash-scripting` skill and close the public-contract loop for artifact consumers. This task updates the CI async summary reader and both authoritative live-proof shell verifiers so they understand the widened async diagnostic/count contract, keep severity/ordering truthful, and still prove today’s zero-diagnostic Kafka happy paths without printing payload bodies.

## Steps

1. Update `scripts/ci/render-yanote-summary.mjs` so async summaries classify the widened report diagnostics/counts and `YANOTE_ASYNC_*` fallback signals explicitly instead of assuming only `mismatched` is high severity.
2. Expand `scripts/ci/render-yanote-summary.test.mjs` to pin the new async summary wording, severity ordering, and no-payload-leak behavior for widened schema/routing diagnostics.
3. Update `scripts/ci/verify-m004-s02-metadata-propagation.sh` and `scripts/ci/verify-m004-s03-live-kafka-proof.sh` so their happy-path artifact assertions validate the full widened zero-diagnostic async counts contract rather than hard-coding only `{ unmatched, mismatched }`.
4. Re-run the summary test and both shell verifiers as the final proof that async artifact readers stayed aligned with the widened public contract.

## Must-Haves

- [ ] The CI async summary reader understands the widened async diagnostic contract and still produces truthful fallback summaries when a report is missing.
- [ ] Both live Kafka proof verifiers assert the widened zero-diagnostic async report contract while preserving retained-failure breadcrumbs and payload redaction.

## Verification

- `node --test scripts/ci/render-yanote-summary.test.mjs && bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `test -f scripts/ci/render-yanote-summary.mjs && test -f scripts/ci/verify-m004-s03-live-kafka-proof.sh`

## Observability Impact

- Signals added/changed: async markdown summaries and live-proof shell assertions now classify widened routing/schema diagnostics and the widened zero-diagnostic counts contract.
- How a future agent inspects this: run the node summary test or either live-proof shell verifier and inspect the retained artifact bundle / stderr breadcrumbs they already emit on failure.
- Failure state exposed: async proof summaries now localize whether failure came from typed async diagnostics, gate fallback, missing report artifacts, or a verifier-side contract mismatch.

## Inputs

- `scripts/ci/render-yanote-summary.mjs` — current async artifact reader that still assumes the old two-kind diagnostics contract.
- `scripts/ci/render-yanote-summary.test.mjs` — current summary contract tests to widen for schema-depth async diagnostics.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — authoritative single-service live proof that hard-codes the old async counts object.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — authoritative two-service live proof that hard-codes the old async counts object.
- `yanote-js/src/report/asyncSchema.ts` — widened async report counts/schema contract from T01.
- `yanote-js/src/cli.ts` — widened `YANOTE_ASYNC_*` output surface from T02.

## Expected Output

- `scripts/ci/render-yanote-summary.mjs` — async summary reader updated for widened schema/routing diagnostics and fallback behavior.
- `scripts/ci/render-yanote-summary.test.mjs` — node tests pinning the widened async summary contract and payload redaction.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — single-service live proof verifier updated for the widened zero-diagnostic async counts contract.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — two-service live proof verifier updated for the widened zero-diagnostic async counts contract.
