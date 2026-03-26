# S02 Research: Header-backed correlation and reply truth

_Gathered: 2026-03-26_

## Requirements targeted

- **R005** — keep the slice Kafka-only and Spring-Kafka-first. The truthful subset here is retained Kafka header evidence only; do not widen into broker metadata, non-Kafka transports, or cross-event request/reply workflow proof.
- **R002** — fail closed for both malformed declarations and unsupported runtime-expression locations. Current extractor behavior still silently drops some bad declaration shells; S02 needs to stop that.
- **R003** — whatever truth model lands must show up consistently in `yanote-async-report.json`, `yanote-async-report.html`, CLI/stdout, stderr gate failures, and machine summary tokens without leaking retained header values.
- **Continuation of S01 / R025** — S01 already made declared `correlationId` / `reply.address` visible additively. S02 is the runtime-truth half of that same semantic expansion.

## Skills Discovered

- Installed relevant skills already present: **`asyncapi-design`**, **`spring-kafka`**, **`kafka-engineer`**.
- No new skill installs were needed; the directly relevant skills were already available in `<available_skills>`.
- Relevant skill rules used in this research:
  - **`asyncapi-design`** says to use a documentation-first approach and base guidance on the AsyncAPI 3.0 spec. I used AsyncAPI spec docs to confirm `correlationId.location`, `reply.address.location`, and optional `reply.channel` shape before recommending extractor changes.
  - **`spring-kafka`** emphasizes header-aware producer/consumer patterns and treating headers as first-class message metadata. That aligns with keeping S02 on retained Kafka headers instead of inventing truth from partition/group/client metadata.

## Summary

S02 is not blocked by new infrastructure; it is blocked by contract plumbing and delivery breadth. The codebase already has the hard runtime primitives needed for truthful header-backed semantics: exact retained header evidence states (`captured` / `redacted` / `omitted`), deterministic message selection via retained headers, and redaction-safe diagnostic surfaces. The missing pieces are:

1. the canonical async contract does **not** retain enough reply metadata yet to compare `reply.address` against `reply.channel`;
2. malformed `correlationId` / `reply.address` declarations can still be silently ignored during extraction;
3. there is **no positive runtime truth surface** yet — only declared semantics plus generic diagnostics;
4. several downstream async delivery contracts are closed and will all need coordinated changes once new runtime truth is published.

The cleanest implementation path is to add a dedicated async semantic-conformance layer for header-backed declarations, then thread it additively through report/gate/CLI surfaces while leaving canonical `kafka <action> <channel>` identity and channel/operation/message coverage numerators unchanged.

## Implementation Landscape

### Contract extraction seam

#### `yanote-js/src/model/operationKey.ts`

Current role:
- owns canonical async contract types;
- currently stores:
  - `KafkaMessageContract.declaredCorrelationId.location`
  - `KafkaOperationContract.declaredReply.address.location`
- preserves canonical operation identity via `serializeOperationKey()` as `kafka <action> <channel>`.

Current gaps for S02:
- `KafkaDeclaredReply` has **address location only**; it has no place for an expected reply channel/address.
- Without reply-channel metadata, S02 cannot implement a truthful **reply mismatched** state.

Implication:
- S02 likely needs to extend `KafkaDeclaredReply` additively, e.g. keep `address.location` and add optional resolved reply-channel address metadata.
- Do **not** touch `serializeOperationKey()`.

#### `yanote-js/src/spec/asyncapi.ts`

Current role:
- loads AsyncAPI via `@asyncapi/parser`;
- normalizes Kafka-only v2/v3 contracts;
- already trusts parser-resolved trait merging for `correlationId` / `reply.address`;
- already has `resolveV3ChannelNameOrAddress()` for resolving channel refs to addresses.

Current gaps for S02:
- `extractDeclaredCorrelationId()` and `extractDeclaredReply()` only return a value when `location` is a non-empty string; otherwise they silently return `undefined`.
- `extractDeclaredReply()` ignores `reply.channel` completely.
- malformed declaration shells therefore disappear instead of producing explicit behavior.

Implication:
- S02 should split two cases deliberately:
  - **malformed declaration shape** (`correlationId` / `reply.address` object present but no usable `location`) → spec-invalid path via `bundle.diagnostics` / `ASYNC_SEMANTIC_SPEC_INVALID`;
  - **valid location string outside the supported header-backed subset** → runtime semantic unsupported path, not spec invalid.
- `reply.channel` can likely reuse `resolveV3ChannelNameOrAddress()` for v3 reply mismatch support.

### Runtime-truth seam

#### `yanote-js/src/coverage/asyncSchemaConformance.ts`

Current role:
- matches retained events to canonical Kafka contracts;
- exports `resolveAsyncMessageContract()` for single-message and runtime-selected multi-message operations;
- already distinguishes header evidence states during routing/schema validation:
  - missing retained header → explicit reason
  - unavailable retained header (`redacted` / `omitted`) → explicit reason
  - mismatched retained header discriminator → explicit reason
- already redacts diagnostics so payload/header values do not leak.

Why it matters for S02:
- this file already contains the exact runtime-selection logic S02 must reuse for per-message `correlationId` truth on multi-message operations.
- it also establishes the current async diagnostic style: typed, deterministic, no retained-value dumps.

Important trap:
- this file is already large. Adding all correlation/reply runtime truth inline here will work, but it will be much harder to reason about than a sibling module.

Recommendation:
- prefer a new module such as **`yanote-js/src/coverage/asyncSemanticConformance.ts`** that imports / reuses `resolveAsyncMessageContract()` instead of bloating `asyncSchemaConformance.ts` further.
- if helpers must be shared, export small targeted utilities rather than duplicating runtime-selection logic.

#### `yanote-js/src/coverage/asyncCoverage.ts`

Current role:
- keeps channel / operation / message coverage numerators separate;
- merges routing diagnostics with **public** schema diagnostics;
- sorts diagnostics deterministically.

Important trap for S02:
- `computeAsyncCoverage()` currently exposes schema diagnostics through:
  - `schemaConformance.diagnostics.filter(isPublicSchemaDiagnostic)`
- `isPublicSchemaDiagnostic()` keeps only diagnostics with a retained public `schemaId`.
- New correlation/reply runtime diagnostics will often have **no schemaId at all**.

Implication:
- if S02 models new semantics as plain schema diagnostics without adjusting this filter, they will disappear from public coverage/report/CLI surfaces.
- either:
  - route new diagnostics through a separate public path, or
  - broaden the public-filter logic intentionally.

### Delivery seam

#### `yanote-js/src/report/asyncReport.ts`

Current role:
- builds the async JSON report;
- publishes `declaredSemantics` additively from `operationContractsByKey`;
- counts current top-level async diagnostics.

Gap for S02:
- there is no positive runtime truth surface yet.
- diagnostics alone can express failure, but they cannot express "this correlationId header-backed semantic was satisfied" in a durable machine-readable way.

Recommendation:
- add a top-level sibling section such as **`runtimeSemantics`** rather than overloading `declaredSemantics`.
- pairing `declaredSemantics` + `runtimeSemantics` is the least confusing contract for future slices.
- follow the established HTTP pattern: summary counts + per-operation rows + diagnostics, additive to coverage.

#### `yanote-js/src/report/asyncSchema.ts`
#### `yanote-js/src/report/asyncNormalize.ts`
#### `yanote-js/src/report/asyncReportHtml.ts`
#### `yanote-js/src/cli.ts`

Current role:
- strict async JSON schema (`additionalProperties: false` everywhere);
- deterministic normalization/order;
- HTML rendering;
- CLI human summary + `YANOTE_ASYNC_SUMMARY` machine line.

Implication:
- once S02 adds runtime truth, all four files must move together.
- `cli.async-report.contract.test.ts` currently asserts section ordering: `Summary` → `Coverage Dimensions` → `Declared Semantics` → `Top Issues` → `Report Path` → machine line. Any runtime truth section will need corresponding contract-test updates.
- machine summary tokens will need a stable additive token set if CLI is expected to "tell the same story" as JSON/HTML.

### Gate seam

#### `yanote-js/src/gates/asyncEvaluator.ts`
#### `yanote-js/src/gates/failureOrder.ts`

Current role:
- maps current async diagnostics to typed semantic failures;
- defines precedence across async payload/header/routing failures.

Gap for S02:
- there are no correlation/reply semantic failure codes today.

Implication:
- S02 needs new typed failure codes for the new fail-closed states.
- recommended split:
  - malformed declaration shape → existing `ASYNC_SEMANTIC_SPEC_INVALID` path from extraction;
  - runtime subset failures → new semantic failure codes.

Precedence guidance:
- keep existing payload/header schema failures ahead of the new declaration-runtime failures unless product requirements say otherwise;
- put new correlation/reply semantic failures ahead of generic routing drift only when both can coexist on the same selected contract (many routing failures will naturally short-circuit semantic evaluation anyway).

### Recorder / evidence seam

#### `yanote-js/src/model/asyncEvent.ts`
#### `yanote-js/src/events/readAsyncEventsJsonl.ts`

Current role:
- define and normalize retained async header evidence as:
  - `captured` with `value`
  - `redacted` / `omitted` with optional `reason`
- trim header keys but do **not** lowercase them.

Important surprise:
- several S01 CLI tests use simplified JSON like:
  - `"headers": {"correlation_id": "corr-123"}`
- that is fine for S01 declared-semantics tests because runtime truth was irrelevant, but `readAsyncEventsJsonl()` drops those entries for actual runtime evaluation.

Implication for S02:
- any new runtime-truth fixtures must use the real evidence shape, e.g.
  - `"headers": {"correlation_id": {"state":"captured","value":"corr-123"}}`
- otherwise the analyzer will see the header as missing.

#### `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java`

Current role:
- retains all non-sensitive UTF-8 Kafka headers up to 1 KB;
- marks headers as `captured`, `redacted`, or `omitted`;
- preserves original header name casing except trimming.

Important implication:
- `correlation_id` / `reply_to` are **not** redacted by the current sensitive-header policy.
- realistic "unavailable" live-proof cases for these headers are more naturally `omitted` (`unsupported` / `oversized`) than `redacted`.
- exact header name matching matters; there is no automatic lowercasing in the Kafka path.

### Existing test / fixture seam

Most of the scaffolding already exists and is worth extending instead of replacing:

- extractor + parity
  - `yanote-js/src/spec/asyncapi.test.ts`
  - `yanote-js/src/spec/asyncapi.parity.test.ts`
- current async runtime/schema diagnostics
  - `yanote-js/src/coverage/asyncSchemaConformance.test.ts`
  - `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts`
  - `yanote-js/src/coverage/asyncSchemaConformance.parity.test.ts`
- public async coverage diagnostics
  - `yanote-js/src/coverage/asyncCoverage.test.ts`
  - `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`
  - `yanote-js/src/coverage/asyncCoverage.parity.test.ts`
- report / normalization / HTML / remote-spec contract
  - `yanote-js/src/report/asyncReport.test.ts`
  - `yanote-js/src/report/asyncReport.contract.test.ts`
  - `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts`
  - `yanote-js/src/report/writeAsyncReport.determinism.test.ts`
- gate / CLI
  - `yanote-js/src/gates/asyncEvaluator.test.ts`
  - `yanote-js/src/cli.async-report.test.ts`
  - `yanote-js/src/cli.async-report.contract.test.ts`
  - `yanote-js/src/cli.remote-spec.contract.test.ts`

## Key Findings and Surprises

### 1. `reply.channel` is the missing contract input for truthful reply mismatches

S01 captured `reply.address.location`, but S02 cannot produce a real **mismatched reply** state until the contract also retains the expected reply channel/address. The current extractor throws that information away.

### 2. Malformed and unsupported are different problems and should land on different paths

The current extractor silently drops malformed declaration objects. That violates the slice’s fail-closed requirement.

Recommended split:
- **malformed declaration object** → extraction-time `invalid` diagnostic → `ASYNC_SEMANTIC_SPEC_INVALID`
- **valid runtime-expression string outside the supported header subset** → runtime semantic `unsupported` diagnostic/failure

That matches the repo’s existing HTTP pattern better than collapsing both into one bucket.

### 3. S02 does not need a general AsyncAPI runtime-expression engine

The slice title and roadmap only require **header-backed** correlation/reply truth. The truthful subset can stay narrow:
- support only `$message.header#/...`
- parse JSON Pointer only far enough to resolve a retained flat header key
- fail closed on anything else

A generic runtime-expression evaluator would add a lot of surface area the recorder cannot prove.

### 4. Runtime-selected message resolution is already solved; reuse it

Per-message `correlationId` truth on multi-message operations should reuse `resolveAsyncMessageContract()` so S02 inherits the same runtime message-selection behavior and ambiguity rules as existing async routing/schema coverage.

### 5. Current async CI summary fallback is still behind the async-report contract

`scripts/ci/render-yanote-summary.mjs` does not even fully understand the async diagnostic kinds that already exist (`missing-header`, `unavailable-header`, `invalid-header`, `ambiguous` are not mapped there). S02 can still land fully inside `yanote-js`, but if the slice expands into CI-summary fallback now, that script and its tests will need deliberate updates.

## Don’t Hand-Roll

- **Do not hand-roll a full AsyncAPI runtime-expression interpreter.** S02 only needs the truthful header-backed subset.
- **Do not invent a cross-event request/reply workflow model.** Current evidence is per-event only; proving that a later reply event happened belongs to a different architecture.
- **Do not lowercase Kafka header names in the analyzer.** The retained evidence path is currently exact-key after trimming; changing that would silently alter semantics.
- **Do not print retained `correlation_id` / `reply_to` values** in JSON/HTML/stdout/stderr. Use counts, locations, expected declared addresses, evidence state/reason, and fail-closed wording instead.
- **Do not let unsupported or malformed declarations vanish.** If the object is declared and Yanote cannot truthfully support it, surface that explicitly.

## Recommendation

### Recommended shape

Model S02 like the existing HTTP additive truth surfaces, not like more schema-depth coverage math.

Preferred contract shape:
- keep existing `coverage` unchanged;
- keep S01 `declaredSemantics` unchanged as declared-only truth;
- add a new additive sibling section, preferably **`runtimeSemantics`**, with:
  - summary counts
  - per-operation truth rows
  - diagnostics for non-satisfied outcomes

That gives the planner a clean separation:
- **declared** = what the spec says
- **runtime** = what retained Kafka header evidence proved
- **coverage** = whether the canonical channel/action/message contracts were observed

### Recommended build order

1. **Harden extraction first**
   - extend reply contract metadata to retain optional expected reply-channel address;
   - stop silently dropping malformed correlation/reply declarations;
   - add focused spec fixtures and parity tests.

2. **Build the runtime semantic evaluator second**
   - add a dedicated coverage-side module for header-backed semantic truth;
   - reuse `resolveAsyncMessageContract()` and current retained-header evidence behavior;
   - classify `satisfied`, `missing`, `unavailable`, `unsupported`, and reply-only `mismatched` deterministically.

3. **Thread the result through delivery third**
   - async JSON schema / normalize / HTML / CLI / gate failures;
   - keep operation identity and coverage numerators unchanged;
   - add machine tokens only for stable aggregates, not retained values.

4. **Treat CI/live-proof summary rendering as optional for this slice**
   - if the slice scope stays inside `yanote-js`, leave `scripts/ci/render-yanote-summary.*` and live Kafka proof scripts for S04;
   - if not, budget explicit follow-up edits there.

### Fixture strategy that matches the codebase

Use the existing S01 fixture pattern instead of inventing a new proof harness:

- **Correlation truth parity**
  - existing inline/trait v2 and v3 declaration fixtures are the right starting point;
  - add event fixtures with real `AsyncHeaderEvidence` objects.

- **Reply truth**
  - add a v3 fixture that includes both `reply.address.location` and `reply.channel`;
  - green case: captured reply header equals resolved reply-channel address;
  - red case: captured reply header differs from resolved reply-channel address;
  - unavailable case: omitted reply header evidence.

- **Malformed vs unsupported split**
  - malformed spec fixture: declaration object present but blank/invalid `location` → spec invalid;
  - supported-shape but unsupported-location fixture: e.g. non-header runtime expression or nested header pointer outside retained flat-header support → semantic unsupported.

## Verification

### Existing suites that should be extended or rerun

```bash
npm -C yanote-js test -- \
  src/spec/asyncapi.test.ts \
  src/spec/asyncapi.parity.test.ts

npm -C yanote-js test -- \
  src/coverage/asyncSchemaConformance.test.ts \
  src/coverage/asyncSchemaConformance.diagnostics.test.ts \
  src/coverage/asyncSchemaConformance.parity.test.ts \
  src/coverage/asyncCoverage.test.ts \
  src/coverage/asyncCoverage.diagnostics.test.ts \
  src/coverage/asyncCoverage.parity.test.ts

npm -C yanote-js test -- \
  src/gates/asyncEvaluator.test.ts

npm -C yanote-js test -- \
  src/report/asyncReport.test.ts \
  src/report/asyncReport.contract.test.ts \
  src/report/asyncReport.remote-spec.contract.test.ts \
  src/report/writeAsyncReport.determinism.test.ts

npm -C yanote-js test -- \
  src/cli.async-report.test.ts \
  src/cli.async-report.contract.test.ts \
  src/cli.remote-spec.contract.test.ts

npm -C yanote-js run build

git diff --check
```

### Additional proof expectations for S02

The planner should make sure the implementation proves all of these explicitly:

- canonical operation keys remain `kafka <action> <channel>`;
- channel / operation / message coverage percentages do not change when correlation/reply truth is added;
- inline vs trait-applied correlation declarations evaluate identically where the parser already merges them;
- malformed declaration shells fail closed instead of disappearing;
- unsupported runtime-expression locations fail closed instead of counting green;
- runtime truth surfaces do **not** leak retained correlation/reply header values in JSON/HTML/stdout/stderr;
- real runtime fixtures use `AsyncHeaderEvidence` objects, not raw string header maps.

## Sources

Code inspected:
- `yanote-js/src/model/operationKey.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/asyncapi.test.ts`
- `yanote-js/src/spec/asyncapi.parity.test.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.parity.test.ts`
- `yanote-js/src/coverage/asyncCoverage.ts`
- `yanote-js/src/coverage/asyncCoverage.test.ts`
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`
- `yanote-js/src/coverage/asyncCoverage.parity.test.ts`
- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncSchema.ts`
- `yanote-js/src/report/asyncNormalize.ts`
- `yanote-js/src/report/asyncReportHtml.ts`
- `yanote-js/src/gates/asyncEvaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.ts`
- `yanote-js/src/model/asyncEvent.ts`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java`
- `scripts/ci/render-yanote-summary.mjs`

Docs consulted:
- Context7 `AsyncAPI Specification` (`/asyncapi/spec`) for:
  - `correlationId.location`
  - `reply.address.location`
  - optional `operation.reply.channel`
