---
id: S03
parent: M007
milestone: M007
provides:
  - Public async coverage, `yanote-async-report.json`, async gates, CLI machine output, and CI/live-proof readers now expose schema-depth async drift as first-class redacted contract truth without changing routing-first coverage percentages.
requires:
  - slice: S01
    provides: Payload-bearing Kafka evidence, retained AsyncAPI payload/header schema metadata, and a normalized async evidence/report seam that can carry schema-relevant facts.
  - slice: S02
    provides: Internal routing-first async schema conformance with deterministic typed payload/header/reference diagnostics and v2/v3 parity.
affects:
  - S04
key_files:
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncSchema.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/gates/asyncEvaluator.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/cli.ts
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/verify-m004-s02-metadata-propagation.sh
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
key_decisions:
  - Publish public schema-depth async diagnostics only for retained named parser schema ids; keep anonymous inline schema ids internal so happy-path fixtures stay zero-diagnostic.
  - Reuse one explicit async semantic precedence map across gate evaluation, CLI Top Issues, `YANOTE_ASYNC_ERROR*`, `YANOTE_ASYNC_SUMMARY`, and CI summary fallback classification.
  - Treat `yanote-async-report.json` as the first fallback source of typed async failure truth when stderr machine lines are missing.
patterns_established:
  - Keep routing coverage percentages routing-first while layering schema/header/reference drift into a separately ordered public async diagnostic union with per-kind counts.
  - Derive async gate failures directly from the public async diagnostic union and repeat the same primary failure across human-readable, machine-readable, and retained-artifact surfaces.
  - Make downstream artifact readers report-first and semantic-precedence-aware so widened async truth survives missing stderr lines and stays deterministic.
observability_surfaces:
  - `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts`
  - `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
  - `node --test scripts/ci/render-yanote-summary.test.mjs`
  - `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - `.yanote-ci/live-kafka-proof/`
drill_down_paths:
  - .gsd/milestones/M007/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M007/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M007/slices/S03/tasks/T03-SUMMARY.md
duration: PT2H55M
verification_result: passed
completed_at: 2026-03-20T18:56:00+0300
---

# S03: Async Report And Gate Schema Truth

**Shipped schema-depth async contract truth through public report, gate, CLI, and CI surfaces while preserving routing-first async coverage percentages.**

## What Happened

S03 completed the public half of M007. S01 had already made payload-bearing Kafka evidence real, and S02 had already proved internal schema-depth validation, but users still saw only routing drift. This slice wired that deeper truth all the way out to the public async surfaces.

T01 widened the public async diagnostic contract. `asyncCoverage` and `yanote-async-report.json` now publish redacted schema-depth diagnostics alongside `unmatched` and `mismatched`: `invalid-payload`, `missing-payload`, `unsupported-content-type`, `unsupported-schema-format`, and `unverifiable-headers`. The important boundary stayed intact: channel / operation / message percentages remain routing-first, so a routed message can still count as covered even when schema conformance fails. To avoid destabilizing existing happy-path fixtures, public schema-depth diagnostics are published only when backed by retained named parser schema ids; anonymous inline schemas remain internal-only.

T02 made those public diagnostics fail closed. The async gate and CLI now map each public async diagnostic kind to a typed `ASYNC_SEMANTIC_*` failure, order them with an explicit semantic precedence map, and repeat the same redacted primary failure across `Top Issues`, `YANOTE_ASYNC_ERROR*`, and `YANOTE_ASYNC_SUMMARY primary_reason`. This means schema drift no longer hides behind a false-green async summary, and human-facing plus machine-facing output now agree on the primary failure.

T03 aligned downstream artifact readers. `render-yanote-summary.mjs` now understands the widened async contract, synthesizes typed async failure truth from `yanote-async-report.json` when stderr machine lines are missing, and only falls back to `YANOTE_ASYNC_SUMMARY primary_reason` when the report is absent. The two authoritative live Kafka proof scripts were widened to assert the full zeroed async diagnostic-count object, so current happy-path runtime proofs stay green while future schema-depth failures remain inspectable in retained artifacts.

As a result, this slice closes the public contract gap left by S02 and advances M007 from “internal schema truth exists” to “schema truth is now part of the shipped async report/gate product surface.” R049 and R065 are now validated because observed Kafka payload conformance and schema/header/reference drift both participate in public async artifacts, gates, CLI failure semantics, CI summaries, and verifier expectations.

## Verification

I reran the full slice verifier stack and all checks passed:

- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts`
- `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `node --test scripts/ci/render-yanote-summary.test.mjs`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

I also confirmed the slice observability surfaces by inspecting the exported `.yanote-ci/live-kafka-proof/` bundle after verification; it now contains the widened async report plus retained stdout/stderr and merged evidence artifacts.

## New Requirements Surfaced

- none

## Deviations

None.

## Known Limitations

- S04 still needs to intentionally exercise schema-depth async failures on the live Spring Kafka proof path; S03 only proved that existing happy-path live proofs and retained-artifact readers understand the widened contract.
- Public docs/support wording still needs the S04 boundary refresh so the documented async capability matches the stronger runtime truth without overclaiming broker scope or combined-report behavior.

## Follow-ups

- Build an intentional live schema-drift proof on top of the Spring Kafka path so retained runtime artifacts show a real schema-depth async failure, not just zero-diagnostic happy paths.
- Refresh public async docs/support surfaces after that live proof lands, using the shipped `ASYNC_SEMANTIC_*` and `yanote-async-report.json` behavior as the authoritative boundary.

## Files Created/Modified

- `yanote-js/src/coverage/asyncCoverage.ts` — widened the public async diagnostic/count surface to include redacted schema-depth drift while preserving routing-first percentages.
- `yanote-js/src/report/asyncReport.ts` — serialized widened async diagnostics and counts into deterministic `yanote-async-report.json` output.
- `yanote-js/src/report/asyncSchema.ts` — extended the async report schema to validate the full routing-plus-schema diagnostic union.
- `yanote-js/src/report/asyncNormalize.ts` — normalized widened async diagnostics and counts with stable ordering.
- `yanote-js/src/gates/asyncEvaluator.ts` — mapped every public async diagnostic kind to typed fail-closed async semantic errors.
- `yanote-js/src/gates/failureOrder.ts` — established explicit async semantic precedence shared across gate, CLI, and summary surfaces.
- `yanote-js/src/cli.ts` — aligned Top Issues, `YANOTE_ASYNC_ERROR*`, and `YANOTE_ASYNC_SUMMARY primary_reason` around one primary redacted failure.
- `scripts/ci/render-yanote-summary.mjs` — taught CI summary rendering to classify widened async truth and recover typed failures from report artifacts first.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — widened happy-path live-proof assertions to the full zeroed async diagnostic-count object.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — kept the two-service Kafka proof aligned with the widened async artifact contract.

## Forward Intelligence

### What the next slice should know
- Public async schema-depth diagnostics must stay tied to retained named parser schema ids. If S04 introduces fixtures or live proofs that only hit anonymous inline payload schemas, the public surface should stay quiet unless the contract deliberately promotes those ids.
- CI artifact readers now treat `yanote-async-report.json` as the authoritative fallback source of async failure truth. If S04 changes async failure precedence or introduces new diagnostic kinds, update both `failureOrder.ts` and `scripts/ci/render-yanote-summary.mjs` together.

### What's fragile
- `unsupported-schema-format` runtime proofing is parser-sensitive — real AsyncAPI v3 fixtures need `schemaFormat` on the resolved payload schema surface, not message-level YAML, or the parser rejects the spec before the runtime contract is exercised.
- Happy-path live-proof scripts now assert the full zeroed async diagnostic-count object — any future widening of the public async diagnostic union must update those shell verifiers and summary readers in the same slice or the runtime proof stack will fail on healthy artifacts.

### Authoritative diagnostics
- `yanote-js/src/cli.async-report.contract.test.ts` — proves the machine-readable async stderr/stdout contract, primary/secondary ordering, and `primary_reason` behavior.
- `scripts/ci/render-yanote-summary.test.mjs` — proves report-first fallback classification and redaction on retained artifact readers.
- `.yanote-ci/live-kafka-proof/yanote-async-report.json` plus sibling stdout/stderr files — this is the most trustworthy retained runtime bundle when async proof behavior needs inspection.

### What assumptions changed
- “Internal schema conformance is enough for M007 progress” — S03 showed that requirement progress depended on public artifact, gate, CLI, and CI-reader truth, not just analyzer internals.
- “Existing live-proof readers will naturally tolerate widened async diagnostics” — they did not; both shell verifiers and the markdown summary renderer needed explicit contract updates to keep happy-path proofs green and future failures inspectable.
