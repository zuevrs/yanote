# M014 Research: AsyncAPI Semantic Breadth Within Kafka-First Boundaries

_Gathered: 2026-03-26_

## Skills Discovered

- Directly relevant installed skills already present in the environment: `asyncapi-design`, `kafka-engineer`, `spring-kafka`
- `npx skills find "AsyncAPI"`, `npx skills find "Kafka"`, and `npx skills find "Spring Kafka"` all returned external equivalents, but none justified a new install over the already-installed local skills
- Context7 docs consulted during research:
  - `AsyncAPI Specification` (`/asyncapi/spec`)
  - `AsyncAPI Bindings` (`/asyncapi/bindings`)
  - `AsyncAPI Parser JS` (`/asyncapi/parser-js`)
- New skill installs: none

## What exists now

- The current AsyncAPI semantic extractor in `yanote-js/src/spec/asyncapi.ts` is intentionally narrow:
  - accepts only AsyncAPI `v2`/`v3`
  - accepts only `kafka` protocol
  - normalizes only canonical operation identity plus adjacent message-contract metadata
  - currently extracts only these first-class async analyzer surfaces:
    - channel/address
    - action (`send` / `receive`)
    - message name
    - payload schema + `contentType` + `schemaFormat`
    - headers schema
    - runtime multi-message selection hints from message name and header `const` / single-value `enum`
- The async model in `yanote-js/src/model/operationKey.ts` has no first-class place yet for richer semantics such as:
  - bindings
  - correlation metadata
  - reply metadata
  - trait provenance
- Runtime async conformance in `yanote-js/src/coverage/asyncSchemaConformance.ts` already proves a lot inside the Kafka path:
  - payload schema validation
  - header schema validation
  - runtime-selected multi-message resolution
  - explicit `missing-*`, `invalid-*`, `unsupported-*`, `unavailable-*`, `ambiguous`, `mismatched`, `unmatched` diagnostics
- Async coverage/report/gate surfaces are closed and strict today:
  - `yanote-js/src/coverage/asyncCoverage.ts`
  - `yanote-js/src/report/asyncReport.ts`
  - `yanote-js/src/report/asyncSchema.ts`
  - `yanote-js/src/report/asyncNormalize.ts`
  - `yanote-js/src/gates/asyncEvaluator.ts`
  - `yanote-js/src/gates/failureOrder.ts`
  - `scripts/ci/render-yanote-summary.mjs`
- Those files currently assume the async product model is exactly:
  - channels
  - operations
  - messages
  - diagnostics
  Any new async semantic surface will require coordinated changes across DTOs, schema validation, normalization, HTML rendering, CLI summary, CI summary rendering, and failure precedence.
- The Kafka recorder path is already richer than the public docs make obvious:
  - `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java` records payload, retained headers, message hint, service, error flag, `test.run_id`, and `test.suite`
  - `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` retains all non-sensitive UTF-8 headers up to 1 KB per value and marks them as `captured`, `redacted`, or `omitted`
- The current recorder/evidence path does **not** retain the Kafka fields that many binding candidates would need:
  - record key
  - partition
  - offset
  - client id
  - consumer group id
  - broker/topic configuration metadata
- The authoritative async proof path already contains a strong reuse pattern for richer semantics:
  - `scripts/ci/verify-m004-s03-live-kafka-proof.sh` generates a retained runtime-selection sidecar that proves header-based multi-message selection from live Kafka evidence
  - the same script also proves retained schema-failure truth on the same merged Kafka evidence
- Repo search found no existing fixtures, docs, or proof surfaces that exercise `bindings`, `correlationId`, `reply`, or explicit trait visibility today

## Key findings and surprises

### 1. The best next semantics are the ones that can reuse retained headers immediately

The current live path already proves that Yanote can:

- retain Kafka headers with provenance
- select between multiple declared messages using header discriminators
- publish deterministic async diagnostics without raw-header leakage

That makes **header-address semantics** the highest-value next target:

- `message.correlationId.location`
- `operation.reply.address.location`
- possibly `reply.channel` matching when the reply address is retained in headers

These can ride on the existing recorder/evidence substrate. They do **not** require broker expansion or a new combined report contract.

### 2. Traits are probably less of a merge problem than they first look

The most useful external finding came from AsyncAPI Parser JS docs: the parser applies traits and preserves the originals under `x-parser-original-traits`.

Implications for M014:

- if Yanote only needs trait-applied fields to behave like inline fields, the parser may already be doing most of the merge work before `document.json()` reaches `asyncapi.ts`
- if Yanote wants to expose **trait provenance itself** as a first-class analyzer surface, that provenance is currently ignored by repo code and will need explicit extraction from `x-parser-original-traits`

This changes the risk profile: the first parser risk is not “can we merge traits at all?” but “what trait-origin information do we want to surface, if any?”

### 3. “Bindings” is not one thing; most Kafka bindings are not truthful with current evidence

AsyncAPI/Kafka bindings cover very different categories:

- channel binding: topic / partitions / replicas / topic configuration
- operation binding: consumer group / client id
- message binding: key / schema-registry metadata

With today’s evidence model:

- **maybe viable now**
  - `channel.bindings.kafka.topic` as additive declared metadata, or possibly as an address fallback when no explicit address exists
- **not runtime-truthful today without recorder expansion**
  - operation `groupId`
  - operation `clientId`
  - message `key`
  - message schema-registry fields (`schemaIdLocation`, encoding, lookup strategy)
  - channel partitions / replicas / topic config

The milestone should not let “bindings” dominate the roadmap. Most of them are either report-only metadata or deferred work unless the recorder contract expands.

### 4. The report/gate contract is the real cost center

Adding one new async semantic kind is not just a parser change. Any new public async surface touches a closed stack:

- model types
- coverage result shape
- JSON schema (`additionalProperties: false`)
- normalization ordering
- HTML rendering
- CLI summary text
- machine summary line `YANOTE_ASYNC_SUMMARY ...`
- CI summary rendering in `scripts/ci/render-yanote-summary.mjs`
- gate failure codes and precedence
- contract tests and retained proof scripts

This argues for slice boundaries that retire contract-shape risk before live-proof/docs closeout.

### 5. The existing public boundary already prefers additive semantics over numerator changes

The strongest reusable product pattern is from M011/M012/M013 and the decisions register (`D020`, `D033`, `D036`, `D039`):

- widen support through additive surfaces
- keep legacy coverage numerators stable unless a deliberate contract change is justified
- keep JSON-centered automation and sibling human HTML
- preserve separate async vs HTTP surfaces

M014 should follow the same pattern. New AsyncAPI semantics should land as additive async truth, not as a rewrite of channel/operation/message coverage math.

### 6. Full request/reply workflow proof is still a different architecture

AsyncAPI `reply` can mean at least two different things:

1. a single-event declared reply destination/address
2. an actual request/reply workflow where one event is correlated to a later response event

Current Yanote evidence has no cross-event async workflow model. It has:

- per-event channel/action/message/payload/headers/test metadata
- no dedicated correlation graph
- no event key / partition / offset / span linkage

So the first truthful reply subset should be:

- reply address/header presence/availability
- optional equality to declared reply channel/address when that is statically known

It should **not** start with “prove that a reply event happened later” unless the roadmap intentionally adds a new workflow architecture.

## Existing patterns to reuse

- **Additive conformance surface pattern** from M011/M012:
  - new semantics get their own explicit surface
  - existing numerators remain stable
  - governance stays typed and fail-closed
- **Runtime-selected message pattern** from `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/coverage/asyncSchemaConformance.ts`, and `scripts/ci/verify-m004-s03-live-kafka-proof.sh`:
  - extract discriminators from headers
  - evaluate against retained header evidence
  - classify `missing` / `unavailable` / `ambiguous` / `mismatched` deterministically
- **Spec-invalid vs semantic-drift split** already present in `yanote-js/src/cli.ts`:
  - malformed or unsupported spec structure becomes `ASYNC_SEMANTIC_SPEC_INVALID`
  - supported-but-unhappy runtime truth becomes typed semantic diagnostics in the report/gate path
- **JSON-centered + sibling HTML pattern** from M013:
  - canonical truth stays in `yanote-async-report.json`
  - `yanote-async-report.html` is a sibling view, not a separate analyzer contract
- **Retained proof-sidecar pattern** from M004:
  - happy-path bundle for green proof
  - focused runtime-selected bundle for richer semantic truth
  - focused red bundle for fail-closed drift proof

## Key codebase constraints

### Canonical identity must stay stable

- `serializeOperationKey()` in `yanote-js/src/model/operationKey.ts` still defines the async identity contract as `kafka <action> <channel>`
- milestone context explicitly says that identity should not change casually
- any binding/topic support must not silently rewrite operation keys when an existing `address` is already present

### Header evidence is truthful but intentionally constrained

- retained Kafka headers are text-only, trimmed, and size-limited
- sensitive-looking header names are redacted by substring policy in `YanoteKafkaHeaders.isSensitiveHeader()`
- header keys are not lowercased in the Kafka path, so exact retained key matching matters today

This means correlation/reply semantics should reuse the current `captured` / `redacted` / `omitted` model and should not invent a fake green path for unretained header values.

### New diagnostics kinds are expensive

New async diagnostic kinds must be threaded through at least:

- `yanote-js/src/coverage/asyncCoverage.ts`
- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncSchema.ts`
- `yanote-js/src/report/asyncNormalize.ts`
- `yanote-js/src/gates/asyncEvaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/cli.ts`
- `scripts/ci/render-yanote-summary.mjs`

So the roadmap should avoid multiplying new diagnostic families unless the runtime-evidence story is clearly worth it.

### Bindings without evidence should never be promoted to synthetic coverage

Current async coverage percentages are routing-first and message-contract-first. They are not “all declared async semantics covered.”

That means any binding field without runtime evidence should be one of:

- additive declared metadata only
- explicit `N/A`
- explicit unsupported/unverifiable diagnostic
- explicit defer

but never “covered” by static declaration alone.

## Candidate semantic surfaces ranked by evidence strength

### Strong candidates for early slices

- **Trait-applied parity for already-supported fields**
  - inline vs trait-applied headers/payload/contentType/message-selection should normalize the same way
  - this is high user value and low truth risk
- **Header-based `correlationId` subset**
  - support runtime expressions that resolve to retained header values
  - classify `captured` / `missing` / `unavailable` / `unsupported-location`
- **Header-based `reply.address` subset**
  - support runtime expressions that resolve to retained header values
  - optionally compare to declared `reply.channel` address when both are present

### Medium candidates

- **Trait provenance visibility**
  - possible via `x-parser-original-traits`
  - useful for “supported semantics explained honestly”
  - probably report-only, not gate-driving
- **`channel.bindings.kafka.topic` visibility**
  - useful as additive metadata or address fallback
  - safe only if identity stability is preserved explicitly

### Weak candidates / likely defer

- operation `bindings.kafka.groupId`
- operation `bindings.kafka.clientId`
- message `bindings.kafka.key`
- message schema-registry binding fields
- channel partitions / replicas / topicConfiguration
- end-to-end request/reply workflow proof across multiple events

## What should be proven first

### Risk-first answer

The first proof should be a **focused fixture path** that demonstrates:

1. trait-applied declarations are seen the same way as inline declarations
2. a retained Kafka header can satisfy a richer AsyncAPI semantic contract
3. missing or unavailable retained header evidence fails closed with a typed diagnostic
4. canonical `kafka <action> <channel>` keys and existing channel/operation/message percentages do not change

Concretely, the best first proof target is:

- a v3 AsyncAPI fixture where `correlationId` and/or `reply.address` is declared through message/operation traits
- an event fixture or focused proof event carrying the relevant retained header
- an async report that exposes the new semantic truth additively
- a failing companion fixture where the header is missing or redacted

### What should not be first

Do **not** start M014 with:

- operation/client/message binding conformance that requires new recorder fields
- general runtime-expression support for every AsyncAPI location form
- workflow-level request/reply linkage across multiple events
- docs-only “support” for bindings that have no truthful evidence path

## Suggested slice boundaries

### S01 — Semantic extraction and additive report contract

Goal:
- extend the AsyncAPI semantic model so richer declared semantics can be extracted and published without changing existing coverage numerators

Likely scope:
- extend `KafkaOperationContract` with additive richer-semantic fields
- extract merged/original trait data where it matters
- extract `correlationId`, `reply`, and selected Kafka binding metadata from parser output
- add strict schema + normalization + HTML/CLI support for the additive fields
- add fixture parity tests proving inline vs trait-applied declarations behave identically

Why first:
- retires the closed-contract risk before live proof or governance expansion
- makes later runtime conformance work plug into a stable DTO/report shape

### S02 — Runtime-verifiable header-address semantics

Goal:
- turn the highest-value richer semantics into truthful runtime conformance using only current retained Kafka evidence

Likely scope:
- support a narrow runtime-expression subset first, ideally `$message.header#/...`
- evaluate `correlationId` and `reply.address` against retained header evidence
- classify deterministic states such as missing / unavailable / mismatched / unsupported-location
- add typed semantic failures with explicit precedence
- add focused fixture tests for green and red paths

Why second:
- highest user value inside the current recorder boundary
- reuses the existing message-selection/header-diagnostic substrate
- avoids binding-driven overexpansion

### S03 — Binding boundary decision and explicit support matrix

Goal:
- decide which binding fields are genuinely in-scope for M014 and make the rest explicit instead of silent

Likely scope:
- safe additive visibility for `channel.bindings.kafka.topic`
- explicit `N/A` / declared-only / deferred treatment for groupId, clientId, key, schema-registry, partitions, replicas, topic config
- focused tests that prevent accidental green coverage on declarative-only fields

Why third:
- turns “bindings” from a vague promise into a truthful support matrix
- keeps the milestone honest if only one or two binding fields are actually supportable today

### S04 — Live proof, CI summaries, and docs/support closeout

Goal:
- prove the selected richer semantics on the real Kafka-first path and publish the widened boundary honestly

Likely scope:
- extend focused async proof artifacts alongside the existing happy/runtime-selected/schema-failure patterns
- update `scripts/ci/render-yanote-summary.mjs` if new async diagnostic kinds or human summary text are introduced
- update `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, and any release/support wording to enumerate:
  - what richer semantics are now supported
  - what remains declared-only / unverifiable / deferred
  - that the boundary is still Kafka-first, separate, and not broker-agnostic

If the roadmap wants only three slices, S03 and S04 are the easiest pair to merge, but S01 and S02 should stay separate.

## Requirements read-through

### Table stakes from active requirements

- **R005** is non-negotiable:
  - Kafka-only
  - Spring-Kafka-first
  - separate `async-report` / `yanote-async-report.json`
  - no broker-agnostic or combined HTTP+async drift
- **R002** remains table stakes for every new semantic:
  - malformed or unsupported declarations cannot silently pass
  - unsupported runtime-expression locations or unverifiable binding fields need explicit behavior
- **R003** means success is not just parser code:
  - CLI
  - report artifacts
  - CI summary/proof surfaces
  - docs/support wording
  all need to tell the same story

### What looks missing but should be treated as candidate requirement, not silent scope expansion

- There is no explicit active requirement today saying new async semantics must stay **additive** to current channel/operation/message numerators, but the codebase and decisions register strongly assume that continuity.
- There is no explicit active requirement saying supported trait-applied declarations must behave identically to inline declarations, but that is a natural expectation if M014 claims broader AsyncAPI semantic support.
- There is no explicit active requirement saying human-facing async diagnostics must avoid raw retained header values, but the existing report/CLI posture strongly points that way.

### Clearly out of scope unless the roadmap intentionally changes the milestone

- **R020** combined HTTP + async reporting
- **R021** broker expansion beyond Kafka
- end-to-end request/reply workflow proof across separate async events
- binding conformance that requires recorder fields not currently emitted

## Candidate requirements (advisory only)

1. **Trait-applied parity**
   - If a supported AsyncAPI semantic field is declared through message or operation traits, Yanote should normalize it the same way as the equivalent inline declaration.

2. **Evidence-bounded runtime-expression support**
   - M014 should support only the `correlationId` / `reply.address` runtime-expression subset that can be resolved from currently retained Kafka evidence; anything outside that subset should be explicit `unsupported` / `unverifiable`, not silently ignored.

3. **Additive async semantic contract**
   - New richer AsyncAPI semantics should publish through additive async report/CLI/CI fields and diagnostics without redefining canonical `kafka <action> <channel>` identities or current channel/operation/message coverage numerators.

4. **Binding honesty requirement**
   - Kafka binding fields without a current runtime-evidence path should never count as covered semantics; they must be report-only metadata, `N/A`, or explicitly deferred.

5. **No raw-header leakage in broad human surfaces**
   - CLI stderr/stdout, machine summary lines, and GitHub summary rendering should describe richer async semantic drift without echoing retained raw header values.

## Bottom line for the roadmap planner

The natural milestone center is **not** “support all AsyncAPI bindings/traits/reply/correlation.” The natural center is:

- preserve the current Kafka-first identity and separate async surface
- reuse the existing retained-header proof substrate
- support the richer semantics that can be made truthful **now**
- publish everything else as declared-only or deferred explicitly

The highest-value, lowest-regret first proof is a trait-aware, header-based `correlationId` / `reply.address` subset on the current Kafka evidence path. Bindings should be treated surgically, not as a blanket milestone promise.
