# M015 Research — Async Platform Expansion And Cross-Surface Reporting

_Gathered during milestone planning in `/Users/zuevrs/Projects/yanote/.gsd/worktrees/M015`._

## Executive summary

M015 is feasible, but only if it is narrowed to one concrete non-Kafka async expansion path and one combined reporting strategy that preserves the current split truth instead of flattening it.

The codebase is not merely documented as Kafka-only; it is structurally Kafka-first across parser validation, event shapes, operation identity, coverage evaluators, runtime semantics, report DTOs, HTML rendering, CI artifact collection, and GitHub summary generation. That makes a true broker expansion a deep contract change, not a docs toggle.

The safest milestone shape is:

1. generalize the async analyzer/evidence contract enough to admit one real non-Kafka protocol,
2. prove that path on a real runtime,
3. build a combined HTTP plus async report and gate surface as an aggregation of canonical subreports rather than a replacement for them,
4. then close CI/docs/support boundaries.

## Codebase findings

### 1. Non-Kafka support is rejected at the parser boundary today

Current `yanote-js/src/spec/asyncapi.ts` hard-rejects any AsyncAPI protocol other than `kafka` in `resolveSupportedProtocol()` with the diagnostic `Only kafka is supported.`

Implication: R021 is blocked by design at the spec-loading seam before any analyzer logic runs.

### 2. Async event identity is hardcoded to Kafka in both JVM and Node contracts

Relevant files:

- `yanote-js/src/model/asyncEvent.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.ts`
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java`
- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`

Findings:

- Node async events normalize only `kind: "kafka"`.
- `readAsyncEventsJsonl()` drops any non-Kafka line.
- JVM event polymorphism currently permits only `HttpEvent` and `KafkaEvent`.

Implication: adding a second broker is a cross-language evidence-contract change. It must preserve old Kafka JSONL while admitting a new async subtype.

### 3. Async coverage logic is written against Kafka operation identity

Relevant files:

- `yanote-js/src/model/operationKey.ts`
- `yanote-js/src/coverage/asyncCoverage.ts`
- `yanote-js/src/coverage/asyncSemanticConformance.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.ts`

Findings:

- canonical async keys serialize as `kafka <action> <channel>`;
- `computeAsyncCoverage()` filters bundle operations to `operation.kind === "kafka"`;
- runtime-semantic and schema-conformance messaging is explicitly Kafka-worded.

Implication: M015 must generalize async identity without breaking existing Kafka operation keys. A protocol-aware async identity seam is the real first technical step.

### 4. The current async report contract already contains Kafka-specific additive sections

Relevant files:

- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncReportHtml.ts`
- `yanote-js/src/report/writeAsyncReport.ts`

Findings:

Current async reports expose:

- `bindingSupport` rendered as **Kafka Binding Support**,
- `declaredSemantics` for retained AsyncAPI declarations,
- `runtimeSemantics` for header-backed correlation/reply proof.

Implication: the first non-Kafka expansion should not promise parity with all Kafka-only additive semantics on day one. The safer contract is: widen routing/message/payload truth first, keep Kafka-specific additive surfaces optional/protocol-scoped where a non-Kafka runtime cannot yet prove the same semantics.

### 5. Combined reporting is also a structural change, not just a template change

Relevant files:

- `yanote-js/src/cli.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/asyncReport.ts`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/collect-yanote-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.sh`
- `.github/workflows/yanote-ci.yml`

Findings:

- CLI has separate `report` and `async-report` commands.
- HTTP and async reports have different schemas and different summary tokens.
- CI uploads and summarizes separate HTTP and async artifact families.

Implication: R020 should be implemented as a combined artifact/gate that **aggregates canonical HTTP and async subreports**. It should not invent one blended denominator or erase protocol/source attribution.

### 6. There is already a perfect regression fixture for the current non-Kafka rejection

Relevant files:

- `yanote-js/test/fixtures/asyncapi/unsupported-rabbitmq.yaml`
- `yanote-js/src/spec/asyncapi.test.ts`

Findings:

The repository already pins current RabbitMQ/AMQP rejection behavior in tests.

Implication: RabbitMQ/AMQP is the natural first non-Kafka candidate for M015. It is already represented in fixtures and today’s failure boundary is mechanically visible.

## Recommended scope narrowing

### Recommendation: choose RabbitMQ/AMQP as the first non-Kafka path

Do **not** attempt full broker-agnostic semantics in this milestone.

Why:

- the repo already has an unsupported RabbitMQ fixture and explicit rejection tests,
- one concrete broker is demoable and provable,
- full broker-agnostic abstraction would force too many simultaneous choices across event identity, selection semantics, headers/properties, report DTOs, and recorder modules.

The milestone can still leave a future broker-agnostic abstraction possible, but M015 should prove one widened broker honestly first.

### Recommendation: combined reporting should compose, not flatten

The combined surface should:

- keep `yanote-report.json` and `yanote-async-report.json` as authoritative child truths,
- derive overall combined status deterministically from those child truths,
- surface per-surface failures explicitly,
- avoid a synthetic merged coverage percentage that hides whether drift came from HTTP or async.

## Requirement analysis

### Requirements this milestone should actively advance

- `R021` — move from deferred to active via one concrete non-Kafka path, recommended as RabbitMQ/AMQP.
- `R020` — move from deferred to active via one intentional combined report and gate artifact that preserves split truth.

### Continuity constraints that must shape planning

- `R003` — any new surface must remain usable through the real delivery path, not just internal code.
- `R005` — the old Kafka-only/separate-report contract cannot be silently blurred; if superseded, it must be superseded explicitly and truthfully.

### Table stakes / missing expectations to bake into the roadmap

These are not sufficiently safe to leave implicit:

- live non-Kafka runtime proof, not fixture-only proof;
- explicit per-surface attribution in the combined report and gate;
- public docs/support wording that says exactly what is widened and what remains Kafka-only or deferred;
- compatibility preservation for existing Kafka operation keys and existing split report consumers.

### Overbuild risks

Avoid these in M015:

- full broker-agnostic recorder abstraction for every future broker,
- forcing RabbitMQ to support every Kafka-only semantic family before shipping any non-Kafka path,
- inventing a single merged HTTP plus async denominator that weakens failure visibility,
- introducing a dashboard/UI surface.

## Skills discovered

### Already installed and directly relevant

- `asyncapi-design`
- `spring-kafka`
- `java-gradle`

### Installed during research for future execution units

- `rabbitmq-expert` — installed via `npx skills add martinholovsky/claude-skills-generator@rabbitmq-expert -g -y`

No additional skill installation looked necessary for the combined-report half of the milestone.

## Proposed slice shape

### S01 — Protocol-aware async analyzer contract with first RabbitMQ path

Why first: this retires the deepest codebase assumption — that async means Kafka everywhere.

### S02 — Live RabbitMQ recorder/proof path

Why second: the milestone is not credible until the widened async contract works through a real runtime, not just fixtures.

### S03 — Combined HTTP plus async report and gate built from canonical subreports

Why third: once the widened async path exists, the combined surface can compose stable HTTP and async truths without guessing at hidden semantics.

### S04 — CI/docs/support closeout

Why last: after the technical boundary is real, publish it honestly through artifacts, workflow summaries, and docs.

## Verification strategy recommendation

- Use fixture and contract tests to retire analyzer/report shape risk early.
- Use a real RabbitMQ runtime proof path to retire the platform-boundary risk.
- Use explicit combined-artifact assertions to prove split truth remains visible inside the new combined surface.
- Finish with workflow/doc verifiers so the public support boundary is mechanically pinned.

## Planning takeaway

M015 should be planned as a real contract-change milestone, not a light extension. The key to keeping it finishable is to make two deliberate scope choices:

1. **RabbitMQ/AMQP first, not full broker-agnostic support.**
2. **Combined reporting as canonical subreport aggregation, not denominator flattening.**
