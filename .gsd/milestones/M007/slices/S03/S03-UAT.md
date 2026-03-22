# S03: Async Report And Gate Schema Truth — UAT

**Milestone:** M007
**Written:** 2026-03-20

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S03 changes deterministic analyzer, report, CLI, gate, and CI artifact-reader contracts. The slice goal is proven by stable generated reports, typed machine output, and verifier behavior rather than by a new interactive runtime workflow.

## Preconditions

- Dependencies for `yanote-js` tests are installed.
- The worktree contains the M007 async schema-depth fixtures and the CI proof scripts.
- No services need to be started manually; the live-proof shell verifiers bootstrap what they need.

## Smoke Test

Run the full slice verifier stack:

```bash
npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts
npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts
node --test scripts/ci/render-yanote-summary.test.mjs
bash scripts/ci/verify-m004-s02-metadata-propagation.sh
bash scripts/ci/verify-m004-s03-live-kafka-proof.sh
```

If all commands pass, the slice basically works.

## Test Cases

### 1. Public async report exposes typed schema-depth diagnostics without changing routing-first coverage

1. Run:
   ```bash
   npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts
   ```
2. Inspect the passing assertions in the coverage/report suites for schema-depth fixtures.
3. **Expected:** The tests prove that `yanote-async-report.json` becomes `partial` on public schema-depth failures, exposes redacted diagnostics for `missing-payload`, `invalid-payload`, `unsupported-content-type`, `unsupported-schema-format`, and `unverifiable-headers`, and still keeps channel/operation/message percentages routing-first.

### 2. Async gate and CLI fail closed on schema truth with one shared primary failure

1. Run:
   ```bash
   npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts
   ```
2. Inspect the passing contract tests for typed async failure ordering.
3. **Expected:** The tests prove every public async diagnostic kind maps to a stable `ASYNC_SEMANTIC_*` failure, the primary failure is deterministic, `Top Issues` agrees with stderr, and `YANOTE_ASYNC_SUMMARY` repeats the same redacted `primary_reason`.

### 3. CI summary and live Kafka proof readers accept the widened async contract

1. Run:
   ```bash
   node --test scripts/ci/render-yanote-summary.test.mjs
   bash scripts/ci/verify-m004-s02-metadata-propagation.sh
   bash scripts/ci/verify-m004-s03-live-kafka-proof.sh
   ```
2. After the shell verifiers pass, inspect `.yanote-ci/live-kafka-proof/`.
3. **Expected:** The markdown summary renderer understands the widened async diagnostic union, report-first fallback classification works when stderr machine lines are absent, and the live Kafka proof scripts accept the full zeroed async diagnostic-count object on happy-path artifacts.

## Edge Cases

### Report exists but async stderr machine lines are missing

1. Run:
   ```bash
   node --test scripts/ci/render-yanote-summary.test.mjs
   ```
2. Focus on the report-only fallback test case in the suite.
3. **Expected:** The renderer synthesizes the primary typed async failure from `yanote-async-report.json` using semantic precedence, stays redacted, and only falls back to `YANOTE_ASYNC_SUMMARY primary_reason` when the report is absent.

## Failure Signals

- Coverage/report tests fail because schema-depth fixtures no longer serialize the widened async diagnostics or counts deterministically.
- Gate/CLI tests fail because `ASYNC_SEMANTIC_*` mapping, ordering, or `primary_reason` drifted.
- `render-yanote-summary.test.mjs` fails because report-first fallback classification no longer matches runtime failure precedence.
- Either live Kafka proof script fails because the zero-diagnostic async count contract changed without updating the shell verifier.
- `.yanote-ci/live-kafka-proof/yanote-async-report.json` is missing, lacks the widened counts object, or disagrees with retained stdout/stderr.

## Not Proven By This UAT

- An intentional live Spring Kafka schema-drift failure path; S03 keeps current live happy paths green but does not yet stage a real runtime schema-invalid failure.
- Public docs/support wording refresh; that remains S04 work.

## Notes for Tester

This slice intentionally preserves routing-first coverage percentages. A routed async event can still count as covered even when payload or header conformance fails; the schema-depth truth appears in diagnostics, gate semantics, and retained artifacts instead of reducing the routing coverage numerators.