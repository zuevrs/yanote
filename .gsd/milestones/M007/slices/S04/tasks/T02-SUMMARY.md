---
id: T02
parent: S04
milestone: M007
provides:
  - The authoritative live Kafka proof now retains inspectable `schema-failure-*` stdout/stderr/report artifacts beside the canonical happy-path async artifact trio, and the bundle contract tests lock that widened inventory down exactly.
key_files:
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/export-async-proof-artifacts.test.mjs
  - scripts/ci/collect-yanote-artifacts.test.mjs
  - .gsd/KNOWLEDGE.md
  - .gsd/STATE.md
  - .gsd/milestones/M007/slices/S04/S04-PLAN.md
key_decisions:
  - Kept the workflow-facing happy-path filenames `async-report.stdout`, `async-report.stderr`, and `yanote-async-report.json` stable, and exported the intentional invalid-payload proof only as additional `schema-failure-*` sidecar artifacts in the same live-proof bundle (recorded as D010).
patterns_established:
  - For retained red-path async proofs, assert typed stderr codes plus report diagnostics from the exported `schema-failure-*` bundle instead of assuming the analyzer will emit literal `invalid-payload` text on stderr or switch the report status to `error`.
observability_surfaces:
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `.yanote-ci/live-kafka-proof/artifact-manifest.txt`, `.yanote-ci/live-kafka-proof/artifact-source-paths.txt`, `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr`, and `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json`
duration: ~1h15m
verification_result: passed
completed_at: 2026-03-20T16:47:01Z
blocker_discovered: false
---

# T02: Retain intentional invalid-payload artifacts in the live Kafka proof stack

**Retained schema-failure async proof artifacts beside the canonical live Kafka proof bundle without changing workflow-facing filenames.**

## What Happened

I loaded the `bash-scripting`, `spring-kafka`, and `asyncapi-design` skills, then widened `scripts/ci/verify-m004-s03-live-kafka-proof.sh` in place instead of creating a parallel proof path.

The live verifier still runs the existing green two-service analyzer pass first and preserves the canonical exported filenames `async-report.stdout`, `async-report.stderr`, and `yanote-async-report.json` for CI summary and workflow readers. After that green pass, it now reruns `async-report` against `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml` using the same merged Kafka evidence, asserts a non-zero exit, checks for typed `ASYNC_SEMANTIC_INVALID_PAYLOAD` stderr output, and validates that the retained report contains `diagnostics.counts.invalid-payload = 2` with `schemaId: UserCreatedPayload` on both send/receive operations.

I added sidecar temp/export paths for `schema-failure-async-report.stdout`, `schema-failure-async-report.stderr`, and `schema-failure-yanote-async-report.json`, wired those through `scripts/ci/export-async-proof-artifacts.sh`, and kept the exporter failure-safe: success exports require the widened bundle, but failure exports still note missing schema-failure files instead of inventing them when the proof aborts before the second pass.

I then rewrote the exact bundle-contract tests in `scripts/ci/export-async-proof-artifacts.test.mjs` and `scripts/ci/collect-yanote-artifacts.test.mjs` so they pin the widened deterministic inventory and prove stale copied bundles are replaced cleanly.

During the first live run, the new proof itself was already correct, but one assertion was wrong: the analyzer emits typed `ASYNC_SEMANTIC_INVALID_PAYLOAD` codes on stderr while the literal `invalid-payload` wording lives in stdout/report, and the retained report status is `partial` with covered operations rather than `error`. I adjusted the verifier to assert the observed runtime contract and recorded that gotcha in `.gsd/KNOWLEDGE.md`.

I also recorded decision D010 so downstream tasks know the stable happy-path trio is intentional and the red proof must remain a sidecar surface, advanced `.gsd/STATE.md` to T03, and marked T02 complete in the slice plan.

## Verification

I first ran the task-local contract checks:

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

Both passed, and the exported `.yanote-ci/live-kafka-proof/artifact-manifest.txt` now reports `artifact_count=12` with the canonical happy-path trio plus all three retained `schema-failure-*` files.

Per the slice execution contract, I then reran the broader slice verification stack sequentially. All automated non-git checks passed from this intermediate T02 state:

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
- `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`

I did not run `git diff --check` because the auto-mode contract for this execution explicitly forbade running git commands. The slice’s manual review item remains for T03 because it includes the public docs/support files that T02 intentionally did not modify.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` | 0 | ✅ pass | 0.14s |
| 2 | `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` | 0 | ✅ pass | 23s |
| 3 | `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 72s |
| 4 | `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh` | 0 | ✅ pass | 1s |
| 5 | `bash scripts/ci/verify-m005-s02-async-acceptance.sh` | 0 | ✅ pass | 115s |
| 6 | `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 0.09s |
| 7 | `git diff --check` | not run | ⚪ skipped | not run |
| 8 | `Manual review — compare .yanote-ci/live-kafka-proof/schema-failure-async-report.stderr, .yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json, docs/guides/asyncapi-kafka.md, docs/release-and-support.md, docs/requirements.md, and SUPPORT.md` | not run | ⚪ deferred | not run |

## Diagnostics

To inspect what this task built later, run:

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`

Then inspect:

- `.yanote-ci/live-kafka-proof/artifact-manifest.txt` — confirms the widened deterministic bundle (`artifact_count=12`, `missing_artifacts=none`)
- `.yanote-ci/live-kafka-proof/artifact-source-paths.txt` — shows canonical and schema-failure source mappings
- `.yanote-ci/live-kafka-proof/async-report.stdout`
- `.yanote-ci/live-kafka-proof/yanote-async-report.json`
- `.yanote-ci/live-kafka-proof/schema-failure-async-report.stdout`
- `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr`
- `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json`

The intentional red pass now exposes typed `ASYNC_SEMANTIC_INVALID_PAYLOAD` stderr lines plus report-side `invalid-payload` diagnostics with `schemaId: UserCreatedPayload`, while the canonical happy-path files remain the ones the workflow summary consumes.

## Deviations

I skipped `git diff --check` because this auto-mode run explicitly prohibited git commands, even though the slice verification list normally includes that check.

## Known Issues

The slice’s manual review item is still open for T03, because it includes public docs/support files that T02 intentionally left untouched.

## Files Created/Modified

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — added the retained invalid-payload analyzer sidecar pass, widened exported observability paths, and asserted the real schema-failure runtime contract.
- `scripts/ci/export-async-proof-artifacts.sh` — widened the allowlist/manifest bookkeeping to include retained `schema-failure-*` artifacts without inventing them on early failure exports.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — locked the widened exporter bundle inventory and stale-output replacement behavior down exactly.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — locked the widened collected live-proof bundle shape and stale-directory replacement behavior down exactly.
- `.gsd/KNOWLEDGE.md` — recorded the non-obvious schema-failure analyzer contract (`exit 5`, `status: partial`, covered operations, diagnostics in report/stdout rather than literal stderr wording).
- `.gsd/STATE.md` — advanced the next action to T03.
- `.gsd/milestones/M007/slices/S04/S04-PLAN.md` — marked T02 complete.
- `.gsd/DECISIONS.md` — recorded D010 about keeping the canonical happy-path trio stable and exporting red-path proof only as `schema-failure-*` sidecars.
