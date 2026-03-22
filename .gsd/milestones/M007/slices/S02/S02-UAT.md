# S02: AsyncAPI Schema Validation And Drift Semantics — UAT

**Milestone:** M007
**Written:** Friday, March 20, 2026

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S02 only ships deterministic analyzer/report contract behavior inside `yanote-js`; no live broker/runtime or human-experience proof is required at this slice boundary.

## Preconditions

- Worktree is `/Users/zuevrs/Projects/yanote/.gsd/worktrees/M007`.
- `yanote-js` dependencies are installed and Vitest can run locally.
- The S02 fixture corpus exists under `yanote-js/test/fixtures/asyncapi/` and `yanote-js/test/fixtures/async-events/`.
- Tester understands the S02 boundary: internal schema-depth failures are expected in conformance suites, but public `async-report` / gate / CLI surfaces must remain unchanged until S03.

## Smoke Test

Run:

`npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/report/asyncReport.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts`

Expected: all tests pass, including assertions that schema-invalid fixtures still leave the public async report/gate/CLI contract unchanged in S02.

## Test Cases

### 1. Retained schema-depth metadata stays separate from canonical Kafka routing identity

1. Run:
   `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
2. Inspect the assertions around the schema-depth fixtures (`schema-depth-v2.yaml` and `schema-depth-v3.yaml`).
3. **Expected:** both AsyncAPI versions normalize to the same canonical routing key (`kafka send orders.created`) while also retaining `payloadSchemaId`, `headersSchemaId`, and `headerValidationCapability` metadata.
4. **Expected:** parity tests confirm the retained schema metadata is identical across the v2/v3 fixtures without changing operation-key serialization.

### 2. Internal schema conformance surfaces deterministic redacted diagnostics

1. Run:
   `npm -C yanote-js test -- src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts`
2. Confirm the valid fixture passes cleanly.
3. Confirm the invalid fixture produces an `invalid-payload` diagnostic with a stable JSON pointer (for the fixture, `/order/total`) and a retained schema id rather than a dumped payload body.
4. Confirm the missing-payload fixture produces `missing-payload` with pointer `/`.
5. Confirm unsupported content type, unsupported schema format, and `unverifiable-headers` cases are surfaced explicitly.
6. **Expected:** diagnostics are ordered, deduplicated, redacted, and identical across equivalent AsyncAPI v2/v3 fixtures.

### 3. Public async coverage/report/gate/CLI surfaces stay backward-compatible in S02

1. Run:
   `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
2. Focus on the tests that use `schema-invalid.fixture.jsonl` and `schema-missing-payload.fixture.jsonl`.
3. **Expected:** those fixtures still count as publicly covered routing/message evidence in S02.
4. **Expected:** public diagnostics remain limited to `unmatched` and `mismatched`; schema-depth kinds do not leak into async coverage, report JSON, gate evaluation, or CLI output.
5. **Expected:** report and CLI contract tests remain green, proving S02 did not accidentally pull S03 public-surface changes forward.

## Edge Cases

### Declared headers remain explicit but not overclaimed

1. Run:
   `npm -C yanote-js test -- src/coverage/asyncSchemaConformance.test.ts src/spec/asyncapi.test.ts`
2. Inspect the assertions around header contracts on the schema-depth fixtures.
3. **Expected:** header schema ids are retained and surfaced, but capability is reported as `unverifiable` rather than pretending headers were fully validated.

### Parser-only schema keywords do not break strict validation

1. Run:
   `npm -C yanote-js test -- src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts`
2. **Expected:** Ajv-backed validation succeeds for the valid fixture and yields user-facing schema diagnostics for invalid fixtures instead of failing on parser-only `x-parser-*` extension keywords.

## Failure Signals

- AsyncAPI v2/v3 schema-depth fixtures normalize to different routing keys or different retained schema ids.
- `asyncSchemaConformance` tests begin leaking payload bodies, raw headers, unstable ordering, or duplicate diagnostics.
- Schema-invalid or missing-payload fixtures start appearing as new public diagnostic kinds in `asyncCoverage`, `asyncReport`, async gates, or CLI output.
- Public async-report contract tests fail because S02 accidentally widened report schema, machine summary lines, or gate semantics.

## Not Proven By This UAT

- Schema-depth failures are not yet surfaced through the real public `async-report`, `YANOTE_ASYNC_*`, or `yanote-async-report.json` contract; that is S03.
- Live Spring Kafka runtime proof for schema-depth validation is not covered here; that is S04.
- Truthful generic observed-header validation is not proven here beyond explicit `unverifiable` capability reporting.

## Notes for Tester

- Do not treat a green public async report/gate result on `schema-invalid.fixture.jsonl` as a bug in S02; that compatibility boundary is intentional and pinned by tests.
- The authoritative internal-vs-public boundary lives in the paired suites: `asyncSchemaConformance*.test.ts` should fail on schema-depth drift, while `asyncCoverage*.test.ts`, `asyncReport.test.ts`, `asyncEvaluator.test.ts`, and `cli.async-report.test.ts` should stay on the old public contract until S03.
