# S03 Research — Async Kafka header validation as a supported core surface

## Requirement Focus

- **Owns:** `R034` Kafka-first AsyncAPI header diagnostics are a supported public surface.
- **Supports:** `R002` (fail closed on bad/insufficient evidence), `R003` (land truth in CLI/report/CI surfaces), and `R005` (keep the async surface Kafka-only, separate, and truthful).

## Summary

S03 is mostly an **alignment + live-proof + public-surface** slice, not a greenfield analyzer slice.

The core implementation already exists across the supported Kafka path:

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` already models retained Kafka headers with explicit `captured` / `redacted` / `omitted` state and `sensitive` / `oversized` / `unsupported` reasons.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` already retains safe headers, redacts sensitive ones, and marks unsupported/binary values as omitted.
- `yanote-js/src/spec/asyncapi.ts` already extracts `headersSchema`, `headersSchemaId`, and `headerValidationCapability` into Kafka message contracts.
- `yanote-js/src/coverage/asyncSchemaConformance.ts` already computes the four typed header diagnostics the slice cares about: `missing-header`, `unavailable-header`, `invalid-header`, and `unverifiable-headers`.
- `yanote-js/src/coverage/asyncCoverage.ts`, `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/gates/asyncEvaluator.ts`, `yanote-js/src/report/asyncSchema.ts`, and `yanote-js/src/cli.ts` already carry those diagnostics into the public async report and typed CLI/gate errors.
- Fixture-backed tests already cover most of the typed header surface in `asyncSchemaConformance.test.ts`, `asyncReport.test.ts`, `asyncReport.contract.test.ts`, `cli.async-report.test.ts`, and `asyncEvaluator.test.ts`.

The stale or incomplete surfaces are public-facing:

- **Docs/support still under-claim header support** with repeated “retained Kafka headers remain unverifiable” wording in `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, `SUPPORT.md`, and the M005 async-boundary verifier scripts.
- **The live proof bundle still proves payload depth, not header depth.** `scripts/ci/verify-m004-s03-live-kafka-proof.sh` exports happy-path, runtime-selection, and invalid-payload sidecars, but no header-drift sidecars.
- **The GitHub summary renderer is stale.** `scripts/ci/render-yanote-summary.mjs` still maps only payload-era async diagnostics plus `unverifiable-headers`; it omits `missing-header`, `unavailable-header`, and `invalid-header` from code mapping and precedence.
- **At least one older async test surface still encodes the previous boundary.** `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` still expects the older “headers cannot be verified from Kafka evidence” behavior instead of the newer retained-header path.
- **`unverifiable-headers` does not appear to have a real spec → parser → CLI proof path yet.** Current tests reach it only by mutating in-memory message contracts, not by loading a real AsyncAPI fixture through the public path.

That last point is the main planning risk: S03’s public promise mentions missing / invalid / unavailable / unverifiable headers, but only the first three are clearly reachable today from real retained evidence and authored fixtures.

## Recommendation

### 1. Prove diagnostic reachability from real user inputs first

This is the highest-risk first task because it determines whether S03 is mostly proof/docs wiring or whether a small semantics change is still needed.

What is already straightforward from real inputs:

- **`missing-header`** — reachable today by running current Kafka evidence against an AsyncAPI spec that requires an extra header not present in retained events.
- **`invalid-header`** — reachable today by tightening schema constraints on already captured retained headers such as `yanote.message`, `yanote.test.run_id`, or `yanote.test.suite`.
- **`unavailable-header`** — reachable if live evidence contains at least one retained header in `redacted` or `omitted` state.

What is not yet clearly proven from real inputs:

- **`unverifiable-headers`** — current public tests do not show a real AsyncAPI YAML fixture that produces `headerValidationCapability: "unverifiable"` through `loadAsyncApiSemanticsBundle()` and then reaches the CLI/report surface.

Planner implication:

- Build or prove the real-input `unverifiable-headers` path first.
- If it turns out not to be reachable truthfully from authored AsyncAPI + retained Kafka evidence, narrow the public claim before widening docs.

### 2. Extend the live Kafka proof bundle additively with header sidecars

The proof pattern already exists in `scripts/ci/verify-m004-s03-live-kafka-proof.sh`:

- happy-path green bundle
- runtime-selected sidecar
- invalid-payload red sidecar

The clean S03 move is to **add** header-specific sidecars, not replace the existing proof contract.

Lowest-risk ways to prove each drift kind:

- **Missing-header:** alternate spec only; no example-app change needed.
- **Invalid-header:** alternate spec only; constrain existing captured `yanote.*` headers.
- **Unavailable-header:** needs live evidence with a redacted or omitted retained header.
  - Current example app (`examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`) only emits `yanote.message`; happy-path live proofs therefore produce captured `yanote.*` headers, not redacted/omitted ones.
  - The simplest live seam is probably adding one deterministic proof-only sensitive header in `KafkaMessagePublisher` so recorder-side redaction can be exercised end to end.
  - If the planner wants to avoid touching the example app, it needs a separate live harness that still passes through the real recorder path.
- **Unverifiable-headers:** only add a live sidecar after the real-input path exists. Do not fake this diagnostic inside the proof script.

### 3. Bring CI and report summaries up to the same contract

The async CLI already emits the right typed failures; CI summary is the next stale public surface.

Files to update together:

- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/render-yanote-summary.test.mjs`
- `.github/workflows/yanote-ci.yml` is already wired to use that summary step, so once the renderer understands header diagnostics the workflow will benefit automatically.

Concrete stale points in `render-yanote-summary.mjs`:

- `ASYNC_DIAGNOSTIC_CODE_BY_KIND` omits `missing-header`, `unavailable-header`, and `invalid-header`
- `ASYNC_DIAGNOSTIC_PRECEDENCE` omits the same kinds
- summary fallback behavior is therefore not aligned with `yanote-js/src/gates/failureOrder.ts`

Planner implication:

- treat the summary renderer as part of the user-facing async contract, not post-work polish.

### 4. Update docs/support/verifiers as one coordinated boundary change

The old under-claim is enforced in code and docs, not just prose.

Current under-claim surfaces:

- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `docs/requirements.md`
- `SUPPORT.md`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`
- `scripts/docs/verify-m005-s01-async-path.sh`
- `scripts/ci/verify-m005-s02-async-acceptance.sh`

Planner implication:

- either update those scripts in place,
- or create M010-specific verifier replacements and switch acceptance to them,
- but do not land proof/docs changes while M005 verifiers still assert that Kafka headers are publicly unverifiable.

S03 should at least refresh the async-specific boundary language enough that header diagnostics stop being described as hidden/stale-doc behavior. S04 can still do the broader final HTTP+Kafka boundary assembly.

## Don’t Hand-Roll

| Problem | Existing solution | Why use it |
|---|---|---|
| Typed Kafka header drift diagnostics | `yanote-js/src/coverage/asyncSchemaConformance.ts` + `yanote-js/src/gates/asyncEvaluator.ts` | Already defines public kinds, reasons, semantic codes, and ordering. |
| Deterministic async artifact/report contract | `yanote-js/src/report/asyncReport.ts` + `asyncSchema.ts` + `asyncNormalize.ts` | Keeps JSON/schema/ordering stable while new header diagnostics surface publicly. |
| Live proof bundle/export pattern | `scripts/ci/verify-m004-s03-live-kafka-proof.sh` + `scripts/ci/export-async-proof-artifacts.sh` | The slice can extend the existing retained artifact model instead of inventing a new one. |
| Recorder-side retained header states | `YanoteKafkaHeaders.java` + `KafkaMetadataPropagationContractTest.java` | Redaction/omission semantics already exist and are contract-tested. |
| Strict shell verifier structure | `verify-m004-s03-live-kafka-proof.sh`, `verify-m005-s01-async-path.sh` | Matches the repo’s `bash-scripting` style: `set -euo pipefail`, explicit artifacts, Python assertions, resumable failure tails. |

## Implementation Landscape

### Analyzer / CLI surfaces already exist

Primary files:

- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.ts`
- `yanote-js/src/coverage/asyncCoverage.ts`
- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncSchema.ts`
- `yanote-js/src/gates/asyncEvaluator.ts`
- `yanote-js/src/cli.ts`

Current state:

- public report schema already reserves counts/items for all four header diagnostic kinds
- CLI tests already cover `missing-header`
- lower-level tests already cover `missing-header`, `unavailable-header`, and `invalid-header`
- `failureOrder.ts` already assigns deterministic precedence to `ASYNC_SEMANTIC_MISSING_HEADER`, `ASYNC_SEMANTIC_UNAVAILABLE_HEADER`, and `ASYNC_SEMANTIC_INVALID_HEADER`

Gap:

- no verified real AsyncAPI fixture path for `unverifiable-headers`
- older test surfaces still encode the previous “headers are unverifiable” boundary and likely need coordinated cleanup

### Recorder / evidence surfaces are already capable

Primary files:

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`
- `yanote-js/src/model/asyncEvent.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.ts`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java`
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`

Current state:

- retained headers are normalized and lower-risk by default
- sensitive headers are redacted
- binary/unsupported or oversized headers can be omitted with explicit reasons
- Node async-event reader already normalizes the same capture-state vocabulary

Planner implication:

- S03 does **not** need a new event model
- the only recorder-side question is whether the live example proof path must emit one extra header to make `unavailable-header` reachable in real exported artifacts

### Live proof surfaces lag the analyzer

Primary files:

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml`
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java`

Current state:

- current live proof verifies happy-path headers only via `yanote.message` / `yanote.test.*`
- current exported red sidecar is payload-only (`invalid-payload`)
- runtime-selection sidecar proves header-based message selection, but not public header validation drift

Planner implication:

- the proof script is a natural additive seam for S03
- missing/invalid header sidecars can probably reuse current merged live events with alternate specs
- unavailable header sidecar likely needs one change in example emission or a separate live recorder harness

### Public boundary / support surfaces are stale by construction

Primary files:

- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `docs/requirements.md`
- `SUPPORT.md`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`
- `scripts/docs/verify-m005-s01-async-path.sh`
- `scripts/ci/verify-m005-s02-async-acceptance.sh`

Current state:

- these files/scripts still assert the earlier “headers remain unverifiable” public boundary
- they also describe payload drift as the proven depth surface

Planner implication:

- boundary docs and boundary verifiers must move together
- if S03 updates only prose, the verifier stack will immediately disagree

## Constraints

- Keep the async surface **Kafka-only** and **separate from HTTP reporting**; do not widen into broker-agnostic or combined report work.
- Prefer **additive sidecars** over replacing current happy-path live proof artifacts.
- Do not expose raw secrets just to prove unavailable headers. If the example app emits a sensitive header for proof, the retained artifact must still show only redacted state + reason text.
- Reuse real recorder-retained headers; do not synthesize fake diagnostics inside proof scripts.
- If live unavailable proof requires an app change, `spring-kafka` guidance points to `ProducerRecord` headers in the publisher as the lowest-risk seam.
- Keep shell verifiers strict and artifact-retaining per the repo’s existing `bash-scripting` pattern.
- Do not market `unverifiable-headers` as supported unless it is reachable truthfully from authored AsyncAPI + retained evidence.

## Common Pitfalls

- **Treating S03 as docs-only.** The live proof script, CI summary renderer, and old tests are all stale too.
- **Assuming `unverifiable-headers` is already publicly reachable.** Current public/fixture paths do not prove that.
- **Proving unavailable-header by leaking a real secret.** The supported truth surface is redacted/omitted evidence plus reason text, not raw header values.
- **Replacing the current green live proof instead of extending it.** The existing happy-path and payload-drift artifacts are still part of the public contract.
- **Updating docs without updating the M005 boundary verifiers.** They explicitly assert the older boundary.
- **Using a brand-new header name for invalid-header proof when existing captured `yanote.*` headers would do.** Spec-only invalid proofs are cheaper and safer than example-app changes.

## Verification

### Recommended task-level reruns

- `npm -C yanote-js test -- --run src/coverage/asyncSchemaConformance.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/gates/asyncEvaluator.test.ts`
- `node --test scripts/ci/render-yanote-summary.test.mjs`

### Proof / integration stack

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` if the planner reuses the single-service path for retained-header evidence

### Boundary / docs stack

- `bash scripts/docs/verify-m005-s01-async-path.sh` and `bash scripts/docs/verify-m005-s01-async-boundaries.sh` **until** they are replaced or updated for M010
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh` after the boundary verifiers are aligned, or an M010 replacement if the planner chooses not to mutate the M005 acceptance script in place

### This scout unit

- No verification reruns completed here.
- Three candidate verification commands were queued (`yanote-js` tests, async path verifier, summary renderer tests) but were skipped once the context-budget wrap-up warning arrived.

## Open Risks

- **Real-input `unverifiable-headers` path may be missing.** If so, S03 either needs a semantics/extraction adjustment or a narrower public claim.
- **Live unavailable-header proof likely needs extra emitted header evidence.** Current example publisher emits only captured `yanote.*` metadata.
- **Legacy tests may still pin the old boundary.** `asyncCoverage.diagnostics.test.ts` is the clearest stale surface from this scout read.
- **Boundary verifier ownership is awkward.** The current scripts are named for M005 but enforce the active public async boundary; the planner should decide early whether to update in place or supersede with M010 scripts.

## Skills Applied

- **`asyncapi-design`** — kept the slice scoped to AsyncAPI 3.0 + Kafka-only user-facing truth, not broader async design work.
- **`kafka-engineer`** — reinforced that header proofs should stay metadata-sized and redaction-safe; do not leak large or sensitive values just to validate support.
- **`spring-kafka`** — points to `ProducerRecord` headers / `KafkaTemplate` publishing as the lowest-risk live proof seam if extra retained headers are needed.
- **`bash-scripting`** — supports keeping proof scripts strict, additive, and artifact-retaining instead of one-off manual flows.
- **`debug-like-expert`** — guided the main risk call: prove each header diagnostic is reachable from real spec + events before promoting it publicly.
- **`java-junit` / `test` / `review`** — the repo already has focused contract tests and script contract tests; extend those patterns rather than inventing a new proof style.

## Skills Discovered

- No additional skill installs were performed in this scout unit; the existing installed AsyncAPI / Kafka / Spring Kafka / shell / test skills already covered the direct stack.

## Sources

- Core async analyzer/report/gate surfaces: `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/coverage/asyncSchemaConformance.ts`, `yanote-js/src/coverage/asyncCoverage.ts`, `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncSchema.ts`, `yanote-js/src/gates/asyncEvaluator.ts`, `yanote-js/src/cli.ts`.
- Async tests and fixtures: `yanote-js/src/coverage/asyncSchemaConformance.test.ts`, `yanote-js/src/report/asyncReport.test.ts`, `yanote-js/src/report/asyncReport.contract.test.ts`, `yanote-js/src/cli.async-report.test.ts`, `yanote-js/src/cli.async-report.contract.test.ts`, `yanote-js/src/gates/asyncEvaluator.test.ts`, `yanote-js/test/fixtures/asyncapi/*.yaml`, `yanote-js/test/fixtures/async-events/*.jsonl`.
- Recorder/evidence surfaces: `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`, `yanote-js/src/model/asyncEvent.ts`, `yanote-js/src/events/readAsyncEventsJsonl.ts`, `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java`, `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`.
- Live proof / artifact export / CI summary surfaces: `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `scripts/ci/export-async-proof-artifacts.sh`, `scripts/ci/render-yanote-summary.mjs`, `scripts/ci/render-yanote-summary.test.mjs`, `.github/workflows/yanote-ci.yml`.
- Public async boundary and verifier surfaces: `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, `SUPPORT.md`, `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh`, `scripts/ci/verify-m005-s02-async-acceptance.sh`.

## Resume Notes

- Durable output from this scout unit: this research artifact.
- I also updated `.gsd/STATE.md` next-action text so the next agent can plan directly from this file.
- Highest-risk next step for the planner: decide whether `unverifiable-headers` is truthfully reachable from a real AsyncAPI fixture. That decision changes the rest of the slice shape.
- If the planner wants fastest user-visible progress, split work into **(1) reachability + stale-test cleanup**, **(2) live proof sidecars / possible example header emission**, **(3) CI summary + docs/verifier alignment**.
