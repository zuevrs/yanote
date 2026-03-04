# Phase 1: Specification Semantics Contract - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Define and lock the canonical OpenAPI operation identity plus deterministic event-to-operation mapping behavior for Java-first HTTP coverage. This phase covers how specs are interpreted, how ambiguities are surfaced, and how events are matched to operation keys. It does not add new delivery channels, UI surfaces, governance gates, or release workflows.

</domain>

<decisions>
## Implementation Decisions

### Canonical operation identity
- Canonical key format is `HTTP_METHOD + templated_route` with method uppercased and route preserved in OpenAPI template form.
- OpenAPI paths with path parameters are normalized to `{param}` representation and compared as templated routes, not concrete URLs.
- Equality is strict on canonical keys after normalization; duplicate operation keys are deduplicated deterministically in stable insertion order.

### Spec parsing and normalization scope
- Phase 1 supports OpenAPI HTTP operations as the semantic source of truth for mapping.
- Parsing must resolve references and produce a deterministic operation set from identical input specs.
- Unsupported or malformed spec structures produce explicit diagnostics that identify the affected path/method and prevent silent acceptance.

### Event-to-operation matching policy
- Primary matching path is exact canonical-key equality when recorder already emits templated routes.
- If event route is non-templated, matching falls back to deterministic template matching against known operations of the same method.
- Ambiguous matches are treated as contract errors and surfaced as actionable diagnostics instead of arbitrary best-effort selection.
- Unmatched events are retained in diagnostics output so maintainers can correct recorder/spec alignment.

### Diagnostics and determinism contract
- Diagnostics are first-class outputs for `unmatched`, `ambiguous`, and `invalid` semantic states.
- Semantic contract behavior is fail-closed for ambiguity/invalidity in planning assumptions; downstream governance can enforce strict exit behavior in later phases.
- Java and Node implementations must share a parity fixture set for operation-key extraction and matching edge cases to avoid cross-runtime drift.

### Claude's Discretion
- Exact internal API shape for semantic diagnostics objects.
- Fixture organization across Java and TypeScript test trees.
- Whether parity checks run as shared fixtures with per-runtime adapters or duplicated fixtures with consistency assertions.

</decisions>

<specifics>
## Specific Ideas

- Prefer deterministic, explainable matching over permissive heuristics; confidence in coverage is more important than maximizing "matched" counts.
- Keep semantic rules explicit and test-backed before extending capabilities in later phases.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java`: Existing OpenAPI parser setup (`resolve`, `resolveFully`) that can anchor Java-side canonical extraction.
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiOperations.java`: Existing operation extraction loop suitable as the baseline for canonical operation-set contract.
- `yanote-core/src/main/java/dev/yanote/core/openapi/OperationKey.java`: Existing Java canonical key value object (`method`, `route`) with method uppercasing.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/RouteTemplateResolver.java`: Existing templated-route resolver from Spring request mapping attributes.
- `yanote-js/src/spec/openapi.ts`: Existing TypeScript OpenAPI operation extraction path that should align with Java semantics.
- `yanote-js/src/coverage/coverage.ts`: Existing operation-key matching entry point where deterministic mapping behavior is enforced.

### Established Patterns
- Normalization is performed near model/parsing boundaries (method normalization in key/model constructors).
- Java core modules prefer fail-fast exceptions on invalid critical inputs.
- Recorder runtime favors request safety and logs on write failures; semantic strictness should be enforced in analyzer/policy layers.
- Tests are behavior-oriented and fixture-driven in both Java (`*Test`) and TypeScript (`*.test.ts`) modules.

### Integration Points
- Java semantic contract logic: `yanote-core` OpenAPI classes and related tests.
- Recorder route template consistency: `yanote-recorder-spring-mvc` resolver/filter path.
- Analyzer parity and matching: `yanote-js` spec loader, event reader, and coverage matcher.
- Cross-runtime conformance fixtures: `yanote-core/src/test/resources` and `yanote-js/test/fixtures` with shared edge-case scenarios.

</code_context>

<deferred>
## Deferred Ideas

- AsyncAPI/Kafka/RabbitMQ semantic contract work - separate future phase.
- Non-Java ecosystem semantic adapters - separate future phase.
- Drift intelligence and changed-endpoint gating - already allocated to later roadmap phases.

</deferred>

---

*Phase: 01-specification-semantics-contract*
*Context gathered: 2026-03-04*
