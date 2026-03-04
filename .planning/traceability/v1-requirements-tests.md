# v1 Requirement Traceability Snapshot

- Snapshot ID: `v1-traceability-20260304`
- Schema Version: `traceability.v1`
- Canonical inventory: `.planning/REQUIREMENTS.md`
- Validator:
  `node scripts/release/verify-traceability.mjs --requirements .planning/REQUIREMENTS.md --map .planning/traceability/v1-requirements-tests.json --schema .planning/traceability/schema.v1.json`

## Requirement Mapping

| Requirement | Test References | Verification Commands |
| --- | --- | --- |
| COVR-01 | `yanote-js/src/coverage/coverage.test.ts` (`coverage-operation-metrics`) | `npm -C yanote-js test -- src/coverage/coverage.test.ts` |
| COVR-02 | `yanote-js/src/coverage/statusCoverage.test.ts` (`coverage-status-code-metrics`) | `npm -C yanote-js test -- src/coverage/statusCoverage.test.ts` |
| COVR-03 | `yanote-js/src/coverage/parameterCoverage.test.ts` (`coverage-parameter-metrics`) | `npm -C yanote-js test -- src/coverage/parameterCoverage.test.ts` |
| COVR-04 | `yanote-js/src/report/writeReport.determinism.test.ts` (`report-json-determinism`) | `npm -C yanote-js test -- src/report/writeReport.determinism.test.ts` |
| COVR-05 | `yanote-js/src/cli.summary.contract.test.ts` (`cli-summary-contract`) | `npm -C yanote-js test -- src/cli.summary.contract.test.ts` |
| DELV-01 | `yanote-js/src/cli.test.ts` (`cli-end-to-end-contract`), `yanote-js/src/cli.report.test.ts` (`cli-report-surface-contract`) | `npm -C yanote-js test -- src/cli.report.test.ts`; `npm -C yanote-js test -- src/cli.test.ts` |
| DELV-02 | `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanotePluginContractTest.kt`, `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteMultiModuleWiringTest.kt` | `./gradlew :yanote-gradle-plugin:test` |
| DELV-03 | `scripts/ci/yanote-ci-workflow.contract.test.mjs` (`github-action-delivery-contract`) | `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` |
| GATE-01 | `yanote-js/src/gates/evaluator.threshold.test.ts` (`threshold-gate-contract`) | `npm -C yanote-js test -- src/gates/evaluator.threshold.test.ts` |
| GATE-02 | `yanote-js/src/gates/evaluator.regression.test.ts` (`regression-gate-contract`) | `npm -C yanote-js test -- src/gates/evaluator.regression.test.ts` |
| GATE-03 | `yanote-js/src/gates/exclusions.test.ts` (`governance-exclusion-contract`) | `npm -C yanote-js test -- src/gates/exclusions.test.ts` |
| GATE-04 | `yanote-js/src/cli.failclosed.contract.test.ts` (`fail-closed-cli-contract`) | `npm -C yanote-js test -- src/cli.failclosed.contract.test.ts` |
| QUAL-01 | `scripts/release/traceability.contract.test.mjs` (`traceability-validator-contract`) | `node --test scripts/release/traceability.contract.test.mjs` |
| QUAL-02 | `scripts/ci/run-v1-e2e.contract.test.mjs` (`v1-e2e-ci-contract`) | `node --test scripts/ci/run-v1-e2e.contract.test.mjs` |
| QUAL-03 | `scripts/ci/assert-java21.contract.test.mjs` (`java21-baseline-contract`) | `node --test scripts/ci/assert-java21.contract.test.mjs` |
| RELS-01 | `scripts/release/maven-central-preflight.contract.test.mjs` (`maven-central-preflight-contract`) | `node --test scripts/release/maven-central-preflight.contract.test.mjs` |
| RELS-02 | `scripts/release/github-release.contract.test.mjs` (`github-release-contract`) | `node --test scripts/release/github-release.contract.test.mjs` |
| RELS-03 | `scripts/release/release-failclosed.contract.test.mjs`, `scripts/release/release-workflow.contract.test.mjs` | `node --test scripts/release/release-failclosed.contract.test.mjs scripts/release/release-workflow.contract.test.mjs` |
| SPEC-01 | `yanote-js/src/spec/openapi.test.ts` (`openapi-canonical-operations`) | `npm -C yanote-js test -- src/spec/openapi.test.ts` |
| SPEC-02 | `yanote-js/src/spec/semantics.diagnostics.test.ts` (`semantic-diagnostics-contract`) | `npm -C yanote-js test -- src/spec/semantics.diagnostics.test.ts` |
| SPEC-03 | `yanote-js/src/coverage/coverage.matching.test.ts` (`deterministic-operation-matching`) | `npm -C yanote-js test -- src/coverage/coverage.matching.test.ts` |
