---
id: S02
parent: M007
milestone: M007
provides:
  - Internal AsyncAPI schema-conformance validation for routed Kafka payload evidence, with deterministic typed diagnostics kept separate from the unchanged public async report/gate contract.
requires:
  - slice: S01
    provides: Payload-bearing Kafka evidence, retained AsyncAPI payload metadata, and deterministic fixture/event boundaries the schema analyzer can consume.
affects:
  - S03
  - S04
key_files:
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/coverage/asyncSchemaConformance.ts
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml
  - yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml
  - yanote-js/test/fixtures/async-events/schema-valid.fixture.jsonl
  - yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl
  - yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl
  - yanote-js/test/fixtures/async-events/schema-unsupported-format.fixture.jsonl
key_decisions:
  - Retain payload/header schema identity via parser-emitted `x-parser-schema-id` values instead of widening canonical `kafka <action> <channel>` keys.
  - Validate payload conformance only after routing and message alignment so schema drift stays distinct from unmatched or mismatched routing drift.
  - Keep S02 schema-depth truth internal and compose public async coverage from the internal matched-operation set without widening public diagnostics until S03.
patterns_established:
  - Routing-first internal conformance seam: canonical routing decides whether schema validation runs at all.
  - Strict Ajv validation must sanitize parser-only `x-parser-*` extension keywords while retaining schema ids separately for diagnostics.
  - Boundary-proof testing pairs internal conformance suites with public coverage/report/gate/CLI suites against the same schema-invalid fixtures.
observability_surfaces:
  - yanote-js/src/coverage/asyncSchemaConformance.test.ts
  - yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts
  - yanote-js/src/coverage/asyncSchemaConformance.parity.test.ts
  - yanote-js/src/coverage/asyncCoverage.test.ts
  - yanote-js/src/report/asyncReport.test.ts
  - yanote-js/src/gates/asyncEvaluator.test.ts
  - yanote-js/src/cli.async-report.test.ts
  - yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml
  - yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml
  - yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl
  - yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl
drill_down_paths:
  - .gsd/milestones/M007/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M007/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M007/slices/S02/tasks/T03-SUMMARY.md
duration: PT1H45M
verification_result: passed
completed_at: 2026-03-20T17:39:00+0300
---

# S02: AsyncAPI Schema Validation And Drift Semantics

**Shipped an internal routing-first AsyncAPI schema-conformance layer that validates Kafka payload evidence with deterministic typed diagnostics while deliberately keeping the public async report/gate/CLI surface unchanged until S03.**

## What Happened

S02 turned the payload-bearing evidence boundary from S01 into real schema-depth analyzer truth without reopening Yanote’s canonical Kafka identity contract.

First, the AsyncAPI normalization seam was extended so `KafkaMessageContract` keeps schema-depth metadata beside the existing routing key: payload schema id, header schema id, and explicit header validation capability. The important constraint held: `serializeOperationKey()` stayed routing-only, so AsyncAPI v2/v3 parity and every downstream `kafka <action> <channel>` consumer remained stable.

Second, the slice added `yanote-js/src/coverage/asyncSchemaConformance.ts` as a new internal schema-conformance seam. That pass resolves routed Kafka operations first, then validates only routing-aligned, message-aligned payload-bearing events. It strips parser-only `x-parser-*` keywords before strict Ajv compilation, caches validators per routed operation, and emits ordered redacted diagnostics for:
- invalid payloads
- missing payload observation gaps
- unsupported content types
- unsupported schema formats
- header contracts that are declared but not yet truthfully verifiable

Those diagnostics intentionally stay limited to operation key, message name, schema id, JSON pointer, and reason. Payload bodies and observed header values do not leak into stable failure output.

Third, S02 wired public async coverage to consume the internal match truth without widening the public contract. `computeAsyncCoverage()` now derives routing coverage from the internal matched-operation set, but `asyncCoverage`, `asyncReport`, `asyncEvaluator`, and `cli async-report` still expose only the pre-existing public `unmatched | mismatched` diagnostic contract. This was the key compatibility boundary for the slice: schema-invalid and missing-payload fixtures now fail internally, yet still count as publicly covered routing/message evidence until S03 deliberately surfaces schema drift through report/gate semantics.

The slice also established the deterministic fixture corpus the next slices should reuse: schema-depth AsyncAPI v2/v3 parity specs plus valid, invalid, missing-payload, and unsupported async event JSONL fixtures. Together they pin both halves of the boundary: richer internal schema truth and unchanged public async behavior.

## Verification

Slice-level verification was re-run and passed:

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts`
- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`

Observability/diagnostic surfaces were confirmed through the same verifier stack:
- the `asyncSchemaConformance*.test.ts` suites prove internal invalid-payload, missing-payload, unsupported-format/content-type, and unverifiable-header diagnostics, including deterministic ordering and v2/v3 parity
- the `asyncCoverage*.test.ts`, `asyncReport.test.ts`, `asyncEvaluator.test.ts`, and `cli.async-report.test.ts` suites prove the same schema-invalid fixtures do **not** widen the public async surface in S02

`git diff --check` was part of the written slice verifier list but was not run here because auto-mode explicitly forbade git commands.

## Requirements Advanced

- R049 — advanced from payload-bearing evidence plumbing to actual routing-first internal payload validation with deterministic v2/v3 parity and redacted schema diagnostics.
- R065 — advanced from planned schema drift semantics to typed internal schema/header/reference diagnostics that stay distinct from routing drift on deterministic fixtures.

## Requirements Validated

- None. S02 proves internal schema-depth truth, but public report/gate exposure and live runtime proof remain in S03/S04 before R049 and R065 can be treated as validated.

## Requirements Invalidated or Re-scoped

- None.

## Requirements Proved By This UAT

- None as standalone requirement validation. The UAT for this slice is artifact-driven contract confirmation, not the final public or live-runtime proof for R049/R065.

## New Requirements Surfaced

- None.

## Deviations

- `git diff --check` was skipped despite being listed in the slice verifier stack because this auto-mode run explicitly prohibited git commands.

## Known Limitations

- Public async coverage, report, gate, and CLI surfaces still do not expose schema-depth diagnostics; they remain limited to `unmatched` and `mismatched` until S03.
- Header schema presence is retained, but header validation capability is still explicitly `unverifiable` because the event boundary does not yet support truthful generic observed-header validation.
- This slice is contract-level only; it does not yet prove schema-depth failures through the live Spring Kafka proof path.

## Follow-ups

- S03 should serialize internal schema-conformance diagnostics into `async-report`, `YANOTE_ASYNC_*`, `yanote-async-report.json`, and async gate semantics without regressing the deterministic public contract.
- S04 should prove the stronger schema-depth contract on the live Spring Kafka path and then refresh public docs/support wording to match the runtime truth.

## Files Created/Modified

- `yanote-js/src/model/operationKey.ts` — retained payload/header schema ids and explicit header validation capability beside unchanged canonical Kafka routing identity.
- `yanote-js/src/spec/asyncapi.ts` — preserved parser-resolved schema-depth metadata from AsyncAPI v2/v3 normalization.
- `yanote-js/src/coverage/asyncSchemaConformance.ts` — added the internal routing-first Ajv-backed schema-conformance analyzer and typed redacted diagnostics.
- `yanote-js/src/coverage/asyncCoverage.ts` — composed public routing coverage from the internal conformance seam while preserving the public diagnostic union.
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts` — pinned valid-routing behavior, unsupported-format/content-type handling, and routing-vs-schema separation.
- `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts` — pinned exact invalid/missing diagnostic payloads, ordering, deduplication, and redaction.
- `yanote-js/src/coverage/asyncSchemaConformance.parity.test.ts` — proved deterministic v2/v3 parity for schema-depth conformance outcomes.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — proved schema-invalid and missing-payload fixtures remain publicly covered in S02.
- `yanote-js/src/report/asyncReport.test.ts` — guarded the unchanged public async report contract against internal schema-diagnostic leakage.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — guarded the unchanged public async gate semantics against schema-only failures in S02.
- `yanote-js/src/cli.async-report.test.ts` — guarded the unchanged CLI async-report contract against schema-diagnostic leakage.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml` — added deterministic AsyncAPI v2 schema-depth contract fixture.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml` — added deterministic AsyncAPI v3 parity fixture for the same contract.
- `yanote-js/test/fixtures/async-events/schema-valid.fixture.jsonl` — added valid payload evidence for the schema-depth conformance seam.
- `yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl` — added invalid payload evidence that fails redacted validation at a stable JSON pointer.
- `yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl` — added observation-gap evidence for missing-payload diagnostics.
- `yanote-js/test/fixtures/async-events/schema-unsupported-format.fixture.jsonl` — added unsupported-format/content-type evidence reused across schema-depth diagnostics.
- `.gsd/DECISIONS.md` — recorded D003 for stable schema-identifier retention via parser-emitted `x-parser-schema-id` values.
- `.gsd/KNOWLEDGE.md` — captured the S02 internal-vs-public boundary check pattern for future slices.
- `.gsd/REQUIREMENTS.md` — refreshed R049 and R065 notes to reflect what S02 actually advanced without prematurely validating them.
- `.gsd/milestones/M007/M007-ROADMAP.md` — marked S02 complete.
- `.gsd/PROJECT.md` — refreshed current project state to include internal async schema-conformance progress and remaining M007 gap.
- `.gsd/STATE.md` — advanced the repository state to post-S02 handoff.

## Forward Intelligence

### What the next slice should know
- S02 already established the seam S03 needs: `computeAsyncSchemaConformance()` is the authoritative internal source of routing-aligned schema-depth truth, and the public async/report/gate surfaces are intentionally constrained wrappers around it.
- The most reliable way to extend the public contract is to reuse the schema-invalid and schema-missing-payload fixtures across both internal and public suites so any accidental widening or regression becomes obvious.

### What's fragile
- The boundary between internal schema diagnostics and the public async contract is thin — if S03 changes public diagnostic unions, report schema, or CLI wording without updating all paired regression suites, it will either leak S02-internal semantics too early or overclaim what the gate/report actually proves.
- Ajv strict-mode compilation against parser-resolved AsyncAPI schemas is fragile if `x-parser-*` extensions are not stripped first — forgetting that sanitization turns parser metadata into validator failures instead of user-facing contract truth.

### Authoritative diagnostics
- `yanote-js/src/coverage/asyncSchemaConformance*.test.ts` — authoritative proof of schema-depth truth, ordering, parity, and redaction.
- `yanote-js/src/coverage/asyncCoverage*.test.ts`, `src/report/asyncReport.test.ts`, `src/gates/asyncEvaluator.test.ts`, and `src/cli.async-report.test.ts` — authoritative proof that S02 intentionally keeps schema-depth failures off the public async surface.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml`, `schema-depth-v3.yaml`, and `yanote-js/test/fixtures/async-events/schema-*.fixture.jsonl` — authoritative reusable fixture corpus for S03/S04.

### What assumptions changed
- “Schema validation will require widening Kafka operation identity or public async report semantics immediately.” — False; parser-retained schema ids plus an internal conformance seam let Yanote gain schema-depth truth while preserving canonical routing keys and the existing public async contract.
- “Schema drift and routing drift must share one diagnostic surface from the start.” — False; separating them internally first made the new semantics deterministic and testable without destabilizing `async-report` and gate behavior before S03.
