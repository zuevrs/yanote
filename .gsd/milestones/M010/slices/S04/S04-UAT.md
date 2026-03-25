# S04: Final Boundary Assembly And Docs Hardening — UAT

**Milestone:** M010
**Written:** 2026-03-25T07:26:26.415Z

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: this slice ships both live-runtime proof assembly and artifact/documentation hardening, so acceptance must confirm real proof runs, retained artifacts, and owner-facing wording together.

## Preconditions

- Docker/Compose is available.
- Java 21 and Node >=20 are available in the runner.
- The repo can build `yanote-js` and the example Spring MVC / Spring Kafka proof assets.
- No stale expectation exists that raw `docker compose up` alone is the supported cold-start path; use the scripted verifiers.

## Smoke Test

1. Run `bash scripts/docs/verify-m010-s04-final-boundary.sh`.
2. Wait for the focused HTTP-core proof, retained HTTP bundle refresh, live Kafka proof export, and doc verifiers to finish.
3. **Expected:** the script exits 0 and prints `M010 S04 final boundary verification passed`.

## Test Cases

### 1. Stable retained HTTP happy-path bundle stays green

1. Run `bash scripts/ci/run-v1-e2e.sh`.
2. Open `.yanote-ci/v1-e2e/artifact-manifest.txt`.
3. Confirm it contains `happy_path_report_found=true`, `semantic_red_expected_exit=5`, `semantic_red_primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`, `artifact_count=6`, and `missing_artifacts=none`.
4. Open `.yanote-ci/v1-e2e/out/yanote-report.json` or review stdout.
5. **Expected:** the retained happy-path report is green (`status=ok`, `operations=4/4`, `aggregate=100.00%`) while the retained semantic-red sidecars still exist beside it.

### 2. Focused HTTP-core proof surfaces undeclared-status and retained-evidence truth

1. Run `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh`.
2. Review its final success line.
3. Confirm the proof reports route `/evidence/users/{id}`, status `202`, `queryKeys=expand,token`, `requestHeaderState=redacted`, and `responseHeaderState=omitted`.
4. **Expected:** the focused Spring MVC proof succeeds, demonstrates the live undeclared-status / retained-parameter / retained-response-header input surface, and does not leak raw sensitive values.

### 3. HTTP-core CLI/gate surface is publicly wired

1. Run `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts src/gates/evaluator.threshold.test.ts src/gates/failureOrder.test.ts src/cli.httpCore.report.test.ts src/cli.httpCore.failclosed.test.ts src/cli.summary.contract.test.ts`.
2. Review the assertions exercised by the focused suites.
3. **Expected:** the command exits 0 and the focused suites confirm `HTTP Core Conformance` output plus stable `SEMANTIC_HTTP_*` fail-closed behavior for undeclared statuses and supported parameter/response-header semantics.

### 4. Retained Kafka proof export includes all header-drift sidecars

1. Run `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`.
2. Open `.yanote-ci/live-kafka-proof/artifact-manifest.txt`.
3. Confirm it contains `proof_status=success`, `artifact_count=27`, `header_sidecar_family_count=4`, `header_sidecar_artifact_count=12`, and `missing_artifacts=none`.
4. Open `.yanote-ci/live-kafka-proof/missing-header-async-report.stderr`, `.yanote-ci/live-kafka-proof/invalid-header-async-report.stderr`, `.yanote-ci/live-kafka-proof/unavailable-header-async-report.stderr`, and `.yanote-ci/live-kafka-proof/unverifiable-header-async-report.stderr`.
5. **Expected:** each retained sidecar exists and carries the matching typed code (`ASYNC_SEMANTIC_MISSING_HEADER`, `ASYNC_SEMANTIC_INVALID_HEADER`, `ASYNC_SEMANTIC_UNAVAILABLE_HEADER`, `ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS`).

### 5. Owner/support wording matches the assembled proof boundary

1. Run `bash scripts/docs/verify-s04-boundaries.sh`.
2. Review `docs/release-and-support.md`, `README.md`, and `docs/README.md` only if the verifier reports a mismatch.
3. **Expected:** the verifier exits 0 and confirms the latest stable tag, `HTTP Core Conformance` boundary wording, Kafka header-diagnostic boundary wording, and landing-page pointers all agree.

## Edge Cases

### Stable compose proof must not be contaminated by the focused HTTP-core route

1. Run `node --test scripts/ci/run-v1-e2e.contract.test.mjs`.
2. Confirm the compose contract pins `DemoServiceE2eTest` and excludes `/evidence/users/{param}` in the report container.
3. Re-run `bash scripts/ci/run-v1-e2e.sh` if needed.
4. **Expected:** the stable retained happy-path bundle stays at `4/4` operations instead of dropping to `80%`, while the focused `/evidence/users/{id}` proof remains available only through the separate assembly flow.

### Retained async header diagnostics must stay redacted and provenance-backed

1. Inspect `.yanote-ci/live-kafka-proof/artifact-source-paths.txt` and one header-sidecar stderr file.
2. Confirm provenance is recorded for the retained sidecars and that the stderr message names the missing/invalid/unavailable/unverifiable header condition without printing raw Kafka header values.
3. **Expected:** operators can diagnose the header failure type and provenance without any raw sensitive header publication.

## Failure Signals

- `bash scripts/docs/verify-m010-s04-final-boundary.sh` exits non-zero.
- `.yanote-ci/v1-e2e/artifact-manifest.txt` is missing the happy-path or semantic-red retained artifacts.
- The retained HTTP happy-path bundle reports `operations < 4/4` or `primary=GATE_MIN_COVERAGE`.
- `.yanote-ci/live-kafka-proof/artifact-manifest.txt` is missing one of the header-sidecar counts or any header-sidecar file.
- Owner verifiers report that release/support wording no longer matches the retained proof boundary.

## Requirements Proved By This UAT

- `R031` — undeclared HTTP statuses surface as first-class drift on the live HTTP-core proof path and owner boundary.
- `R032` — supported HTTP parameter values are retained and evaluated on the proven Spring MVC path.
- `R033` — supported HTTP response-header evidence is part of the shipped HTTP-core boundary.
- `R034` — missing/invalid/unavailable/unverifiable Kafka header diagnostics are retained and public on the proven Spring Kafka path.

## Not Proven By This UAT

- Combined HTTP+async reporting.
- Broker-agnostic async support or non-Kafka transports.
- Broader deferred OpenAPI/AsyncAPI semantics outside the current proven core surfaces.

## Notes for Tester

- Expect the final owner verifier to take noticeably longer than the focused unit/contract suites because it rebuilds the retained HTTP and Kafka proof stacks.
- The supported happy-path HTTP bundle is intentionally separate from the focused `/evidence/users/{id}` HTTP-core proof; seeing both surfaces is the expected final boundary, not a duplication bug.
