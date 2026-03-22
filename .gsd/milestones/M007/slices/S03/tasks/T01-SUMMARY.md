---
id: T01
parent: S03
milestone: M007
provides:
  - Public async coverage and `yanote-async-report.json` now expose named retained schema-depth diagnostics and per-kind counts while preserving routing-first coverage percentages.
key_files:
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/src/coverage/asyncCoverage.test.ts
  - yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncSchema.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/report/asyncReport.test.ts
  - yanote-js/src/report/asyncReport.contract.test.ts
key_decisions:
  - Publish only schema-depth diagnostics backed by retained named parser schema ids; keep anonymous inline schema ids internal so generic happy-path async fixtures stay zero-diagnostic.
patterns_established:
  - Compose public async diagnostics from routing drift plus filtered schema-depth truth, then sort/count them with one shared union order across coverage and report surfaces.
observability_surfaces:
  - yanote-js/src/coverage/asyncCoverage*.test.ts
  - yanote-js/src/report/asyncReport*.test.ts
  - .gsd/KNOWLEDGE.md
duration: PT55M
verification_result: passed
completed_at: 2026-03-20T18:12:30+0300
blocker_discovered: false
---

# T01: Widen async coverage and report artifacts for schema diagnostics

**Exposed named async schema diagnostics in public coverage/report artifacts while preserving routing-first percentages.**

## What Happened

I loaded the `vitest` and `asyncapi-design` skills, then widened `yanote-js/src/coverage/asyncCoverage.ts` so the public async diagnostic surface is now a typed union of routing drift (`unmatched` / `mismatched`) plus schema-depth failures (`missing-payload`, `invalid-payload`, `unsupported-content-type`, `unsupported-schema-format`, `unverifiable-headers`). The routing-first coverage numerators stayed unchanged: channels, operations, and messages still compute from routing/message identity rather than schema success.

On the report side, I widened `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncSchema.ts`, and `yanote-js/src/report/asyncNormalize.ts` so `yanote-async-report.json` now carries the full typed async diagnostic union, stable per-kind counts, partial status when any public async diagnostic is present, and deterministic normalization/sort behavior without reusing the HTTP report schema.

While implementing, I hit one real contract trap: generic async fixtures with anonymous inline payload schemas started surfacing public `missing-payload` diagnostics. That would have broken current zero-diagnostic happy paths. I fixed that by filtering the public async artifact layer to publish only schema-depth diagnostics backed by retained named parser schema ids, while leaving anonymous inline schema ids internal-only. I recorded that rule in `.gsd/KNOWLEDGE.md`.

I rewrote the coverage/report tests around the schema-invalid, missing-payload, unsupported content/schema-format, and header-unverifiable scenarios. The new assertions pin redacted diagnostics only: operation key, schema id, pointer, validation kind, and reason are visible, while payload bodies and ids from observed events remain absent from serialized public diagnostics.

I also marked T01 complete in `.gsd/milestones/M007/slices/S03/S03-PLAN.md` and advanced `.gsd/STATE.md` to T02.

## Verification

I first ran the task-level Vitest verifier for the widened coverage/report surface and confirmed all targeted tests passed. I then ran the task’s file-existence check for the widened async report schema/normalizer files.

After that, I ran the non-git slice-level verification stack. The CI summary renderer test passed unchanged. The gate/CLI suite and both live-proof shell verifiers failed for expected downstream reasons: they still encode the pre-T01 async diagnostic/count contract and will be updated in T02/T03. That failure mode matches the slice plan sequencing rather than a blocker in this task.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts` | 0 | ✅ pass | 1.37s |
| 2 | `test -f yanote-js/src/report/asyncSchema.ts && test -f yanote-js/src/report/asyncNormalize.ts` | 0 | ✅ pass | 0.00s |
| 3 | `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts` | 1 | ❌ fail | 1.59s |
| 4 | `node --test scripts/ci/render-yanote-summary.test.mjs` | 0 | ✅ pass | 0.25s |
| 5 | `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` | 1 | ❌ fail | 34.25s |
| 6 | `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 1 | ❌ fail | 40.41s |

## Diagnostics

Future agents can inspect the widened public contract by running:

- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts`

The inspection surfaces now prove that `yanote-async-report.json` exposes redacted typed async diagnostics and counts for:

- `missing-payload`
- `invalid-payload`
- `unsupported-content-type`
- `unsupported-schema-format`
- `unverifiable-headers`
- `mismatched`
- `unmatched`

The stable public failure fields are `kind`, `validationKind`, `operationKey`, `channel`, `action`, `messageName`, `schemaId`, `pointer`, `reason`, and the redacted human message. Payload bodies and raw headers remain excluded.

## Deviations

- I did not run `git diff --check` even though it is listed in the slice verifier stack, because this auto-mode prompt explicitly forbade running git commands.

## Known Issues

- `yanote-js/src/gates/asyncEvaluator.test.ts` and `yanote-js/src/cli.async-report.test.ts` still expect the pre-T01 public async contract; they fail until T02 teaches gate/CLI surfaces about the widened diagnostic union.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` and `scripts/ci/verify-m004-s03-live-kafka-proof.sh` still hard-code the old two-key async diagnostic counts object; they fail until T03 aligns the live-proof readers with the widened async artifact.

## Files Created/Modified

- `yanote-js/src/coverage/asyncCoverage.ts` — widened the public async diagnostic union, composed named schema-depth diagnostics into public coverage, and centralized deterministic diagnostic ordering.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — pinned routing-first coverage percentages while schema-depth diagnostics surface publicly for the schema-depth fixtures.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — pinned deterministic mixed ordering, unsupported schema-material diagnostics, and public redaction guarantees.
- `yanote-js/src/report/asyncReport.ts` — widened async diagnostic counts/status handling and preserved the separate async report artifact surface.
- `yanote-js/src/report/asyncSchema.ts` — expanded the async JSON schema to validate the full routing+schema diagnostic union and per-kind count object.
- `yanote-js/src/report/asyncNormalize.ts` — normalized widened async diagnostic counts and items with the same stable union sort order.
- `yanote-js/src/report/asyncReport.test.ts` — proved public async report behavior for schema-invalid, missing-payload, unsupported-content-type, and routing-drift scenarios.
- `yanote-js/src/report/asyncReport.contract.test.ts` — pinned the widened `yanote-async-report.json` contract and deterministic normalization behavior.
- `.gsd/KNOWLEDGE.md` — recorded the named-schema-only public publishing rule for async schema diagnostics.
- `.gsd/milestones/M007/slices/S03/S03-PLAN.md` — marked T01 complete.
- `.gsd/STATE.md` — advanced the next action to T02.
