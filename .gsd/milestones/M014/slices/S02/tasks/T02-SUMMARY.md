---
id: T02
parent: S02
milestone: M014
provides: []
requires: []
affects: []
key_files: ["yanote-js/src/coverage/asyncSemanticConformance.ts", "yanote-js/src/coverage/asyncSemanticConformance.test.ts", "yanote-js/src/coverage/asyncCoverage.ts", "yanote-js/src/coverage/asyncCoverage.test.ts", "yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts", "yanote-js/src/coverage/asyncCoverage.parity.test.ts", "yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl", "yanote-js/test/fixtures/async-events/header-runtime-failures.fixture.jsonl", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Expose header-backed async runtime truth under `AsyncCoverageResult.runtimeSemantics` instead of widening the existing top-level coverage diagnostics before T03-T05 intentionally promote that seam into gates and report artifacts.", "Verify malformed raw-string async header evidence with direct evaluator tests because JSONL normalization drops invalid header entries before coverage code can classify them fail-closed."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the T02 verifier stack exactly as planned: `npm -C yanote-js test -- src/coverage/asyncSemanticConformance.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts`. The suite passed and confirmed satisfied/missing/unavailable/unsupported/mismatched runtime semantics, unchanged legacy coverage numerators, redaction-safe diagnostics with no raw header-value leakage, malformed raw-string header fail-closed handling, and inline-vs-trait parity."
completed_at: 2026-03-26T10:38:13.040Z
blocker_discovered: false
---

# T02: Added header-backed async runtime semantics coverage with truthful correlationId/reply diagnostics.

> Added header-backed async runtime semantics coverage with truthful correlationId/reply diagnostics.

## What Happened
---
id: T02
parent: S02
milestone: M014
key_files:
  - yanote-js/src/coverage/asyncSemanticConformance.ts
  - yanote-js/src/coverage/asyncSemanticConformance.test.ts
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/src/coverage/asyncCoverage.test.ts
  - yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts
  - yanote-js/src/coverage/asyncCoverage.parity.test.ts
  - yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl
  - yanote-js/test/fixtures/async-events/header-runtime-failures.fixture.jsonl
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Expose header-backed async runtime truth under `AsyncCoverageResult.runtimeSemantics` instead of widening the existing top-level coverage diagnostics before T03-T05 intentionally promote that seam into gates and report artifacts.
  - Verify malformed raw-string async header evidence with direct evaluator tests because JSONL normalization drops invalid header entries before coverage code can classify them fail-closed.
duration: ""
verification_result: passed
completed_at: 2026-03-26T10:38:13.041Z
blocker_discovered: false
---

# T02: Added header-backed async runtime semantics coverage with truthful correlationId/reply diagnostics.

**Added header-backed async runtime semantics coverage with truthful correlationId/reply diagnostics.**

## What Happened

Added `yanote-js/src/coverage/asyncSemanticConformance.ts` as the dedicated header-backed evaluator for AsyncAPI `correlationId` and `reply.address` truth. The evaluator reuses `resolveAsyncMessageContract()`, supports only the `$message.header#/...` subset against flat retained Kafka header keys, proves satisfied semantics from retained `AsyncHeaderEvidence`, and fails closed with sanitized `missing`, `unavailable`, `unsupported`, and `mismatched` diagnostics when declarations or evidence cannot be trusted.

Threaded that result into `yanote-js/src/coverage/asyncCoverage.ts` as a new additive `runtimeSemantics` surface without changing existing channel/operation/message summaries, canonical `kafka <action> <channel>` identities, or the existing routing/schema diagnostics array. Expanded the focused coverage tests to snapshot the empty runtime-semantic surface on legacy fixtures, prove truthful satisfied semantics on retained-header evidence, prove fail-closed unsupported and malformed inputs, and lock inline-vs-trait parity. Added real retained-header JSONL fixtures for covered and failing runtime cases, then recorded the JSONL-normalization testing gotcha in `.gsd/KNOWLEDGE.md` and saved the downstream-facing placement decision in GSD decision D048.

## Verification

Ran the T02 verifier stack exactly as planned: `npm -C yanote-js test -- src/coverage/asyncSemanticConformance.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts`. The suite passed and confirmed satisfied/missing/unavailable/unsupported/mismatched runtime semantics, unchanged legacy coverage numerators, redaction-safe diagnostics with no raw header-value leakage, malformed raw-string header fail-closed handling, and inline-vs-trait parity.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/coverage/asyncSemanticConformance.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts` | 0 | ✅ pass | 1450ms |


## Deviations

Nested the new runtime-semantic diagnostics under `runtimeSemantics` instead of widening the existing top-level `coverage.diagnostics` array so T02 could publish the truthful surface immediately without perturbing current gate/report/CLI contracts ahead of T03-T05.

## Known Issues

Async gates, JSON/HTML report artifacts, and CLI output do not consume `runtimeSemantics` yet; those planned promotions remain for T03-T05. Type-aware LSP diagnostics were unavailable in this worktree because no language server was running.

## Files Created/Modified

- `yanote-js/src/coverage/asyncSemanticConformance.ts`
- `yanote-js/src/coverage/asyncSemanticConformance.test.ts`
- `yanote-js/src/coverage/asyncCoverage.ts`
- `yanote-js/src/coverage/asyncCoverage.test.ts`
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`
- `yanote-js/src/coverage/asyncCoverage.parity.test.ts`
- `yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl`
- `yanote-js/test/fixtures/async-events/header-runtime-failures.fixture.jsonl`
- `.gsd/KNOWLEDGE.md`


## Deviations
Nested the new runtime-semantic diagnostics under `runtimeSemantics` instead of widening the existing top-level `coverage.diagnostics` array so T02 could publish the truthful surface immediately without perturbing current gate/report/CLI contracts ahead of T03-T05.

## Known Issues
Async gates, JSON/HTML report artifacts, and CLI output do not consume `runtimeSemantics` yet; those planned promotions remain for T03-T05. Type-aware LSP diagnostics were unavailable in this worktree because no language server was running.
