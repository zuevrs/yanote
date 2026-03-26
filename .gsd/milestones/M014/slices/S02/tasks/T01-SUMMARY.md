---
id: T01
parent: S02
milestone: M014
provides: []
requires: []
affects: []
key_files: ["yanote-js/src/model/operationKey.ts", "yanote-js/src/spec/asyncapi.ts", "yanote-js/src/spec/asyncapi.test.ts", "yanote-js/src/spec/asyncapi.parity.test.ts", "yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml", "yanote-js/test/fixtures/asyncapi/header-runtime-trait-v3.yaml", "yanote-js/test/fixtures/asyncapi/header-runtime-malformed-v3.yaml", "yanote-js/test/fixtures/asyncapi/header-runtime-unsupported-v3.yaml", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Keep `serializeOperationKey()` fixed at `kafka <action> <channel>` and carry resolved reply-channel addresses additively under `declaredReply.channel.address`.", "Use parser-backed fixtures for parser-surviving malformed runtime expressions and a direct `buildAsyncApiSemantics()` test for raw malformed declaration shells the parser rejects before normalization."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts` passed and verified unchanged serialized keys, retained reply-channel address metadata, malformed-shell invalid diagnostics, and inline-vs-trait parity. Slice-level coverage, gate, report, CLI, and build commands also passed. The built CLI proof command failed as expected at T01 because `yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl` is planned for T02 and does not exist yet. `git diff --check` was not run because the session instructions explicitly prohibited git commands."
completed_at: 2026-03-26T10:15:09.524Z
blocker_discovered: false
---

# T01: Hardened AsyncAPI extraction to retain reply-channel address metadata and fail closed on malformed header-backed declaration shells.

> Hardened AsyncAPI extraction to retain reply-channel address metadata and fail closed on malformed header-backed declaration shells.

## What Happened
---
id: T01
parent: S02
milestone: M014
key_files:
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/spec/asyncapi.test.ts
  - yanote-js/src/spec/asyncapi.parity.test.ts
  - yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml
  - yanote-js/test/fixtures/asyncapi/header-runtime-trait-v3.yaml
  - yanote-js/test/fixtures/asyncapi/header-runtime-malformed-v3.yaml
  - yanote-js/test/fixtures/asyncapi/header-runtime-unsupported-v3.yaml
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Keep `serializeOperationKey()` fixed at `kafka <action> <channel>` and carry resolved reply-channel addresses additively under `declaredReply.channel.address`.
  - Use parser-backed fixtures for parser-surviving malformed runtime expressions and a direct `buildAsyncApiSemantics()` test for raw malformed declaration shells the parser rejects before normalization.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T10:15:09.525Z
blocker_discovered: false
---

# T01: Hardened AsyncAPI extraction to retain reply-channel address metadata and fail closed on malformed header-backed declaration shells.

**Hardened AsyncAPI extraction to retain reply-channel address metadata and fail closed on malformed header-backed declaration shells.**

## What Happened

Extended `KafkaDeclaredReply` with optional resolved `channel.address` metadata while preserving canonical `kafka <action> <channel>` serialization, then updated `yanote-js/src/spec/asyncapi.ts` to retain reply-channel addresses additively and emit explicit invalid diagnostics for malformed `correlationId` / `reply.address.location` shells instead of silently dropping them. Added dedicated v3 header-runtime fixtures for supported inline, trait-applied, malformed-shell, and unsupported-location cases, expanded extractor tests to assert retained metadata and fail-closed diagnostics, and added a direct `buildAsyncApiSemantics()` negative test for malformed raw declaration shells that the AsyncAPI parser rejects before normalization. Recorded the parser-vs-extractor malformed-shell testing rule in `.gsd/KNOWLEDGE.md`.

## Verification

`npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts` passed and verified unchanged serialized keys, retained reply-channel address metadata, malformed-shell invalid diagnostics, and inline-vs-trait parity. Slice-level coverage, gate, report, CLI, and build commands also passed. The built CLI proof command failed as expected at T01 because `yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl` is planned for T02 and does not exist yet. `git diff --check` was not run because the session instructions explicitly prohibited git commands.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts` | 0 | ✅ pass | 2336ms |
| 2 | `npm -C yanote-js test -- src/coverage/asyncSemanticConformance.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts` | 0 | ✅ pass | 1159ms |
| 3 | `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/gates/failureOrder.test.ts` | 0 | ✅ pass | 1330ms |
| 4 | `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/report/writeAsyncReport.determinism.test.ts` | 0 | ✅ pass | 1650ms |
| 5 | `npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts` | 0 | ✅ pass | 1805ms |
| 6 | `npm -C yanote-js run build` | 0 | ✅ pass | 733ms |
| 7 | `bash -lc 'rm -rf /tmp/yanote-s02-proof && mkdir -p /tmp/yanote-s02-proof && node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml --events yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl --out /tmp/yanote-s02-proof --profile local'` | 2 | ❌ fail | 424ms |


## Deviations

Added a direct `buildAsyncApiSemantics()` test alongside parser-backed fixtures because the real `@asyncapi/parser` rejects some malformed declaration shells before extractor normalization, so fixture-only tests could not truthfully exercise those fail-closed branches.

## Known Issues

The slice proof command that expects `yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl` still fails until T02 adds that planned fixture. `git diff --check` remains intentionally skipped under the no-git session constraint.

## Files Created/Modified

- `yanote-js/src/model/operationKey.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/asyncapi.test.ts`
- `yanote-js/src/spec/asyncapi.parity.test.ts`
- `yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml`
- `yanote-js/test/fixtures/asyncapi/header-runtime-trait-v3.yaml`
- `yanote-js/test/fixtures/asyncapi/header-runtime-malformed-v3.yaml`
- `yanote-js/test/fixtures/asyncapi/header-runtime-unsupported-v3.yaml`
- `.gsd/KNOWLEDGE.md`


## Deviations
Added a direct `buildAsyncApiSemantics()` test alongside parser-backed fixtures because the real `@asyncapi/parser` rejects some malformed declaration shells before extractor normalization, so fixture-only tests could not truthfully exercise those fail-closed branches.

## Known Issues
The slice proof command that expects `yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl` still fails until T02 adds that planned fixture. `git diff --check` remains intentionally skipped under the no-git session constraint.
