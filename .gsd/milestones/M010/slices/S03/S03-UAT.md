# S03 UAT — Async Kafka header validation as a supported core surface

**Milestone:** M010  
**Slice:** S03  
**Closeout reality:** this UAT reflects the repository state at the context-budget wrap-up. It separates what is already proven from what still blocks truthful slice completion.

## Preconditions

1. Work from the M010 worktree root.
2. Node/npm and Java/Gradle are available.
3. Kafka-backed example tests can run locally.
4. `yanote-js` dependencies are installed and the CLI can be built.

## Test Case 1 — Real-input header diagnostics are fixture-backed and green

**Goal:** Confirm all four public header outcomes are reachable from authored AsyncAPI input, not only mutation helpers.

### Steps
1. Run:
   - `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/report/asyncReport.test.ts src/cli.async-report.test.ts`
2. Inspect the assertions around:
   - `schema-header-unverifiable-v3.yaml`
   - `schema-missing-header.fixture.jsonl`
   - `schema-unavailable-header.fixture.jsonl`
   - `schema-invalid-header.fixture.jsonl`

### Expected
1. The command exits `0`.
2. `src/spec/asyncapi.test.ts` proves the authored unverifiable-header fixture still loads as a real-input contract.
3. `src/coverage/asyncCoverage.diagnostics.test.ts` proves:
   - `missing-header`
   - `invalid-header`
   - `unavailable-header`
   - authored `unverifiable-headers`
4. `src/report/asyncReport.test.ts` and `src/cli.async-report.test.ts` prove the same four outcomes surface through report/CLI without leaking payloads or retained header values.

## Test Case 2 — The authored unverifiable-header path is genuinely spec-driven

**Goal:** Verify the `unverifiable-headers` outcome now comes from the spec itself.

### Steps
1. Open `yanote-js/test/fixtures/asyncapi/schema-header-unverifiable-v3.yaml`.
2. Confirm the header schema includes an authored invalid regex pattern.
3. Run only the CLI contract for that path if needed:
   - `npm -C yanote-js test -- src/cli.async-report.test.ts`

### Expected
1. The fixture exists on disk.
2. The unverifiable outcome comes from AsyncAPI header-schema compilation failure, not from a mutated in-memory contract.
3. CLI output uses `ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS` and does not show the raw `bad-trace` header value.

## Test Case 3 — Live Kafka evidence retains the proof-only sensitive header as redacted

**Goal:** Confirm the runtime path can produce truthful unavailable-header evidence.

### Steps
1. Open `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`.
2. Confirm the example publisher emits the proof-only header `yanote.proof.secret`.
3. Run:
   - `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
4. Inspect retained producer/consumer JSONL or exported bundle sidecars.

### Expected
1. The example publisher emits `yanote.proof.secret` only for proof purposes.
2. Recorder-retained evidence does **not** preserve the raw secret value.
3. The retained header state is `redacted` with reason `sensitive`.
4. The happy path still stays green.

## Test Case 4 — Live header-drift sidecars fail closed with typed async codes

**Goal:** Confirm the real two-service proof bundle exports one sidecar per header diagnostic kind.

### Steps
1. Run:
   - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
2. Inspect `.yanote-ci/live-kafka-proof/`.
3. Confirm the presence and contents of:
   - `missing-header-*`
   - `invalid-header-*`
   - `unavailable-header-*`
   - `unverifiable-header-*`
4. Inspect the corresponding `.stderr` files.

### Expected
1. Four additive header-drift sidecar families exist alongside the existing happy-path, runtime-selection, and schema-failure artifacts.
2. Their stderr surfaces contain the correct semantic codes:
   - `ASYNC_SEMANTIC_MISSING_HEADER`
   - `ASYNC_SEMANTIC_INVALID_HEADER`
   - `ASYNC_SEMANTIC_UNAVAILABLE_HEADER`
   - `ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS`
3. The `.json` reports retain `operationKey`, `schemaId`, and `pointer` when applicable.
4. No sidecar leaks the raw proof-only secret header value.

## Test Case 5 — Exporter contract includes the new header-sidecar artifacts

**Goal:** Confirm exported proof bundles keep the header-drift sidecars deterministically.

### Steps
1. Run:
   - `node --test scripts/ci/export-async-proof-artifacts.test.mjs`
2. Inspect the expected artifact inventory in the passing test.

### Expected
1. Success-mode export expects all four new header-sidecar stdout/stderr/report files.
2. Failure-mode export lists the new header-sidecar files as `missing_artifacts=...=none` when the proof aborts before writing them.
3. The exporter does not invent non-existent artifacts.

## Test Case 6 — CI summary precedence still prefers the correct async semantic failure

**Goal:** Confirm header diagnostics are first-class in CI/GitHub summary rendering.

### Steps
1. Run:
   - `node --test scripts/ci/render-yanote-summary.test.mjs`
2. Inspect mixed payload/header and header-primary assertions.

### Expected
1. The command exits `0`.
2. Mixed async reports keep payload-vs-header ordering deterministic.
3. Header-only reports select `ASYNC_SEMANTIC_MISSING_HEADER` as the primary failure when no higher-precedence payload failure exists.

## Test Case 7 — Public boundary docs describe supported Kafka header diagnostics truthfully

**Goal:** Confirm public wording matches the new supported surface.

### Steps
1. Run:
   - `bash scripts/docs/verify-m005-s01-async-path.sh`
   - `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
   - `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
2. Inspect:
   - `docs/guides/asyncapi-kafka.md`
   - `docs/release-and-support.md`
   - `docs/requirements.md`
   - `SUPPORT.md`

### Expected
1. The verifier stack exits `0`.
2. Docs/support wording says Kafka header diagnostics are supported on the Kafka-first async surface.
3. Docs still keep the constraints explicit:
   - Kafka-only
   - Spring Kafka-first
   - separate `async-report`
   - no broker-agnostic promise
4. Docs no longer under-claim the surface as “headers remain unverifiable” if the live proof/export path is already proving missing/invalid/unavailable/unverifiable diagnostics.

## Edge Case 1 — Unverifiable headers must not depend on missing header evidence

### Steps
1. Run the authored unverifiable-header fixture path.
2. Check that the emitted diagnostic is `unverifiable-headers`, not `missing-header` or `invalid-header`.

### Expected
1. The failure is classified as schema-verification incapability.
2. It remains tied to the authored header schema, not to missing runtime values.

## Edge Case 2 — Unavailable headers must preserve redaction truth

### Steps
1. Inspect the unavailable-header sidecar report and stderr.
2. Search for the proof-only secret value.

### Expected
1. The sidecar exposes the retained header state/reason needed for diagnosis.
2. The raw sensitive header value never appears in stdout, stderr, JSON, or exported sidecars.

## Failure Signals

- The focused async fixture suite fails.
- `.yanote-ci/live-kafka-proof/` does not contain the new header-sidecar families.
- Exporter tests do not account for the new sidecars.
- Summary rendering drops one of the header diagnostic kinds.
- Docs/support still say the supported surface keeps Kafka headers unverifiable after live sidecars exist.

## Notes for the next closer

At the wrap-up point, **Test Case 1** is the only one freshly re-verified in this unit. The remaining cases are the exact checklist that must be completed before S03 can be marked done truthfully.
