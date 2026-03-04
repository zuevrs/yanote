# Phase 1: Specification Semantics Contract - Research

**Researched:** 2026-03-04
**Domain:** OpenAPI semantic identity and deterministic HTTP event-to-operation matching (Java + TypeScript)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)
- AsyncAPI/Kafka/RabbitMQ semantic contract work - separate future phase.
- Non-Java ecosystem semantic adapters - separate future phase.
- Drift intelligence and changed-endpoint gating - already allocated to later roadmap phases.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SPEC-01 | Maintainer can load OpenAPI HTTP specifications and resolve operations into canonical operation keys | Use explicit parser resolution options (`resolve`, `resolveFully`) and normalize into strict `METHOD + templated_route` keys with deterministic dedupe order in both runtimes. |
| SPEC-02 | Maintainer can detect and review unmatched or ambiguous spec operations with actionable diagnostics | Implement first-class semantic diagnostics (`invalid`, `ambiguous`, `unmatched`) and fail-closed contract checks instead of first-match heuristics. |
| SPEC-03 | Maintainer can map recorded HTTP events to canonical operation keys using deterministic matching rules | Use exact key equality first, then deterministic same-method template matching with stable candidate ordering and explicit ambiguity diagnostics. |
</phase_requirements>

## Summary

The phase should lock a single semantic contract across Java and TypeScript before adding new coverage dimensions. Existing code already establishes core building blocks (`OperationKey` value objects, OpenAPI loaders, route-template resolver in Spring, fixture-driven tests), but matching behavior is still permissive in places and diagnostics are not yet modeled as a formal contract output. The planning focus should be to codify behavior, not to add delivery surfaces.

Use OpenAPI path+method as canonical operation identity, not `operationId`. The OpenAPI spec explicitly defines path templating precedence and warns that same-hierarchy templated paths are identical/ambiguous for tooling decisions. That aligns with the phase requirement to surface ambiguities as actionable diagnostics instead of selecting arbitrary winners. Also keep parser options explicit and parity-tested because Java and Node use different parser implementations.

For deterministic fallback matching from concrete event paths, avoid custom regex logic. Use a proven path-template matcher in Node and framework-native path semantics in Java/Spring, then enforce stable tie-breaking and ambiguity reporting through shared fixtures. This directly supports trust and reproducibility for all Phase 1 success criteria.

**Primary recommendation:** Implement a shared semantic contract: explicit OpenAPI resolution + strict canonical keys + deterministic same-method template fallback + fail-closed diagnostics, validated by cross-runtime parity fixtures.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `io.swagger.parser.v3:swagger-parser` | `2.1.22` | Java OpenAPI parse + `$ref` resolution | Already in `yanote-core`; official parser supports explicit parse options needed for deterministic loading and diagnostics. |
| `@apidevtools/swagger-parser` | `^10.1.1` | TypeScript OpenAPI parse + dereference | Already in `yanote-js`; purpose-built for dereference/validation and widely used in Node OpenAPI tooling. |
| OpenAPI Specification | `3.1.x` semantics | Source of truth for path templating and operation constraints | Defines matching precedence and ambiguity caveats the contract must encode. |
| Spring MVC `PathPattern` + `HandlerMapping` attributes | `6.1.x` via Boot `3.2.2` | Recorder-side canonical route template access | Existing recorder already resolves best matching route template using framework metadata. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `path-to-regexp` | latest stable (pin in lockfile when added) | Deterministic concrete-path-to-template matching in Node fallback path | Use when event route is concrete (`/users/123`) and needs mapping to OpenAPI template (`/users/{id}`). |
| `openapi-types` | `^12.1.3` | TypeScript OpenAPI typings | Use to keep parser output handling explicit and type-safe. |
| JUnit Jupiter | `5.10.2` | Java semantic contract tests | Use for fixture-driven parity tests in `yanote-core`. |
| Vitest | `^2.1.9` | TypeScript semantic contract tests | Use for fast fixture tests in `yanote-js`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `METHOD + templated_route` identity | `operationId` identity | `operationId` is useful metadata but not a reliable sole identity for deterministic coverage matching across real-world specs. |
| Matcher library + deterministic ordering | Hand-rolled regex matching | Custom matching is brittle for escaping, optional segments, and ambiguity handling; higher bug risk and rewrite cost. |
| Explicit parser options in code | Relying on parser defaults | Defaults can change across versions and runtimes, creating silent drift and non-deterministic behavior. |

**Installation:**
```bash
npm -C yanote-js install path-to-regexp
```

## Architecture Patterns

### Recommended Project Structure
```
yanote-core/src/main/java/dev/yanote/core/openapi/
├── OpenApiLoader.java              # explicit parse/resolve options
├── OpenApiOperations.java          # canonical key extraction
├── OperationKey.java               # canonical identity value object
├── SemanticDiagnostic.java         # NEW: invalid/ambiguous/unmatched diagnostic model
└── OperationMatcher.java           # NEW: deterministic fallback matching

yanote-js/src/spec/
├── openapi.ts                      # parser entry + canonical extraction
├── semantics.ts                    # NEW: semantic contract orchestration
└── diagnostics.ts                  # NEW: semantic diagnostics model

yanote-js/src/coverage/
└── coverage.ts                     # integrates deterministic matcher output
```

### Pattern 1: Explicit Parse Configuration
**What:** Parse with explicit resolution options and capture parser messages as diagnostics input.
**When to use:** Every spec load path for canonical key extraction.
**Example:**
```java
// Source: https://github.com/swagger-api/swagger-parser/blob/master/README.md
ParseOptions parseOptions = new ParseOptions();
parseOptions.setResolve(true);
parseOptions.setResolveFully(true);
parseOptions.setResolveCombinators(false);
SwaggerParseResult result = new OpenAPIParser().readLocation(specPath, null, parseOptions);
if (result.getMessages() != null) result.getMessages().forEach(System.err::println);
```

### Pattern 2: Two-Stage Deterministic Matching
**What:** Match events in two deterministic passes: exact canonical key equality first, template fallback second (same HTTP method only).
**When to use:** Event route is concrete or recorder template was unavailable.
**Example:**
```typescript
import { match } from "path-to-regexp";

function toMatcher(openApiTemplate: string) {
  const pathToRegexpTemplate = openApiTemplate.replace(/\{([^}]+)\}/g, ":$1");
  return match(pathToRegexpTemplate, { end: true, decode: decodeURIComponent });
}
```

### Pattern 3: Ambiguity as First-Class Contract Error
**What:** If fallback finds multiple candidates, emit one ambiguity diagnostic with sorted candidates and do not auto-select.
**When to use:** Any concrete route matches more than one templated operation for the same method.
**Example:**
```typescript
// Source: Phase contract decision + OpenAPI path ambiguity rules
if (candidates.length === 0) diagnostics.push({ kind: "unmatched", event });
else if (candidates.length > 1) diagnostics.push({ kind: "ambiguous", event, candidates: candidates.sort() });
else matched.push({ event, operation: candidates[0] });
```

### Anti-Patterns to Avoid
- **First-match wins fallback:** Produces nondeterministic or wrong coverage when multiple templates match.
- **Silent parse warnings:** Hides invalid/unsupported spec structures and undermines trust in outputs.
- **Operation identity by `operationId` only:** Creates drift/collision risk and breaks strict route-based matching.
- **Mixing AsyncAPI semantics into this phase:** Explicitly out of scope and distracts from locked OpenAPI contract.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `$ref` resolution and composed schema expansion | Custom YAML/JSON reference resolver | Existing parser stacks (`swagger-parser` Java, `@apidevtools/swagger-parser` TS) | Reference resolution and schema edge cases are complex and already solved in mature parsers. |
| Concrete path to template matching | Ad-hoc regex string replacement matcher | `path-to-regexp` (Node) and Spring `PathPattern` semantics where applicable | Mature matchers handle escaping, decoding, and parameter extraction reliably. |
| Route specificity comparison | Homegrown tie-break algorithm | Framework/library specificity rules + stable canonical sort | Reduces ambiguity bugs and cross-runtime behavior drift. |
| Ambiguity handling | Implicit best-effort auto-selection | Explicit `ambiguous` diagnostics and fail-closed contract behavior | Preserves trust by preventing hidden false positives. |

**Key insight:** In this domain, "simple matching" quickly becomes edge-case heavy; trusted coverage requires explicit semantics, not permissive heuristics.

## Common Pitfalls

### Pitfall 1: Equivalent Templated Paths Treated as Different Operations
**What goes wrong:** `/pets/{id}` and `/pets/{name}` are treated as distinct operations.
**Why it happens:** Template variable names are mistaken as part of route identity.
**How to avoid:** Normalize path templates and enforce OpenAPI hierarchy-equivalence rule during canonical extraction.
**Warning signs:** Duplicate operations with same HTTP method and structurally identical template.

### Pitfall 2: Ambiguous Fallback Matching Hidden by First-Match Logic
**What goes wrong:** Concrete event path maps to whichever template appears first in iteration.
**Why it happens:** Tool chooses convenience over explicit ambiguity handling.
**How to avoid:** Collect all same-method matches, then emit `ambiguous` diagnostic when count > 1.
**Warning signs:** Different results across runtimes or after parser/library upgrades without input changes.

### Pitfall 3: Parser Drift Across Java and TypeScript
**What goes wrong:** Same spec yields different operation sets or normalization behavior.
**Why it happens:** Different parser implementations/options or implicit defaults.
**How to avoid:** Pin parser versions, set parse options explicitly, and run parity fixture checks in both runtimes.
**Warning signs:** Operation count/key mismatches between `yanote-core` and `yanote-js`.

### Pitfall 4: Unsafe Spec Inputs and `$ref` Resolution
**What goes wrong:** Loading untrusted specs can resolve unintended local files.
**Why it happens:** Parser follows `$ref` by default and can traverse local/remote references.
**How to avoid:** Treat untrusted specs as high-risk input; constrain execution context and document trust assumptions.
**Warning signs:** Unexpected file access during parsing or security review flags around local file inclusion.

## Code Examples

Verified patterns from official sources:

### OpenAPI Path Ambiguity Rule to Encode in Diagnostics
```text
// Source: https://spec.openapis.org/oas/v3.1.0.html#paths-object
When matching URLs, concrete (non-templated) paths would be matched before their templated counterparts.
Templated paths with the same hierarchy but different templated names MUST NOT exist as they are identical.
In case of ambiguous matching, it’s up to the tooling to decide which one to use.
```

### Java Parse + Resolve with Explicit Options
```java
// Source: https://github.com/swagger-api/swagger-parser/blob/master/README.md
ParseOptions parseOptions = new ParseOptions();
parseOptions.setResolve(true);
parseOptions.setResolveFully(true);
final OpenAPI openAPI = new OpenAPIV3Parser().read("a.yaml", null, parseOptions);
```

### Node Template Matching Primitive
```javascript
// Source: https://raw.githubusercontent.com/pillarjs/path-to-regexp/master/Readme.md
const fn = match("/:foo/:bar");
fn("/test/route");
//=> { path: '/test/route', params: { foo: 'test', bar: 'route' } }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Identity via `operationId` or parser-dependent fields | Identity via `HTTP_METHOD + templated_route` | Current Yanote v1 planning | Stable cross-runtime keys and clearer matching contract. |
| Best-effort first-match on concrete paths | Deterministic two-stage matching + explicit ambiguity diagnostics | Current OpenAPI-centric coverage tooling direction | Prevents silent false positives and increases maintainer trust. |
| Implicit parser defaults | Explicit parse options in code + parity fixtures | Modern parser/tooling hardening practice | Reduces semantic drift and version-upgrade surprises. |

**Deprecated/outdated:**
- `operationId`-only matching for coverage identity.
- Silent "skip invalid and continue" behavior for semantic contract failures.

## Open Questions

1. **Cross-runtime fixture layout**
   - What we know: Parity fixtures are required by locked decisions.
   - What's unclear: Single shared fixture source + adapters vs duplicated fixture trees with consistency checks.
   - Recommendation: Choose one strategy in Wave 0 and enforce it in CI immediately.

2. **Diagnostics payload schema**
   - What we know: Diagnostics must cover `invalid`, `unmatched`, and `ambiguous`.
   - What's unclear: Exact wire shape for CLI/report consumption and future governance gates.
   - Recommendation: Define a versioned diagnostics schema now and keep extension points explicit.

3. **Path decoding policy in fallback matching**
   - What we know: Determinism is required; concrete routes may include encoded segments.
   - What's unclear: Exact decode/normalization policy for `%2F`, reserved chars, and trailing slashes.
   - Recommendation: Add explicit fixture cases and lock behavior before Phase 2 depends on it.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `^2.1.9` (Node) + JUnit Jupiter `5.10.2` (Java) |
| Config file | none for Vitest (defaults); JUnit configured in `yanote-core/build.gradle.kts` |
| Quick run command | `npm -C yanote-js run test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts && ./gradlew :yanote-core:test --tests "dev.yanote.core.openapi.OpenApiOperationsTest"` |
| Full suite command | `npm -C yanote-js test && ./gradlew test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SPEC-01 | Load OpenAPI and emit canonical operation keys deterministically | unit + fixture (Java + TS) | `npm -C yanote-js run test -- src/spec/openapi.test.ts && ./gradlew :yanote-core:test --tests "dev.yanote.core.openapi.OpenApiOperationsTest"` | ✅ (partial; deterministic edge cases still sparse) |
| SPEC-02 | Emit actionable diagnostics for unmatched/ambiguous/invalid semantics | unit + contract | `npm -C yanote-js run test -- src/spec/semantics.diagnostics.test.ts && ./gradlew :yanote-core:test --tests "*OpenApiSemanticDiagnosticsTest"` | ❌ Wave 0 |
| SPEC-03 | Deterministic event-to-operation mapping (exact + template fallback) | unit + fixture | `npm -C yanote-js run test -- src/coverage/coverage.matching.test.ts && ./gradlew :yanote-core:test --tests "*OperationMatcherTest"` | ❌ Wave 0 (current tests cover exact matching only) |

### Sampling Rate
- **Per task commit:** `npm -C yanote-js run test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts` plus targeted Java matcher/openapi tests.
- **Per wave merge:** `npm -C yanote-js test && ./gradlew :yanote-core:test`
- **Phase gate:** Full suite green (`npm -C yanote-js test && ./gradlew test`) before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `yanote-js/src/spec/semantics.diagnostics.test.ts` — covers SPEC-02 diagnostics contract.
- [ ] `yanote-js/src/coverage/coverage.matching.test.ts` — covers SPEC-03 fallback determinism + ambiguity.
- [ ] `yanote-core/src/test/java/dev/yanote/core/openapi/OpenApiSemanticDiagnosticsTest.java` — Java-side SPEC-02 parity.
- [ ] `yanote-core/src/test/java/dev/yanote/core/openapi/OperationMatcherTest.java` — Java-side SPEC-03 parity.
- [ ] Shared parity fixtures for edge cases (equivalent templates, ambiguous matches, encoded segments) in Java and TS fixture trees.
- [ ] Framework install: `npm -C yanote-js ci` — if Node dependencies are not already installed in CI/local environment.

## Sources

### Primary (HIGH confidence)
- Context7 `/swagger-api/swagger-parser` - parse options (`resolve`, `resolveFully`, `resolveCombinators`) and parse result message handling.
- Context7 `/pillarjs/path-to-regexp` - deterministic path matching primitives (`match`, `pathToRegexp`, `compile`).
- Context7 `/websites/spec_openapis_oas_latest` - OpenAPI path templating precedence and ambiguity guidance.
- OpenAPI Specification 3.1.0 (`#paths-object`) - concrete-before-template and ambiguity/identical-template constraints: https://spec.openapis.org/oas/v3.1.0.html#paths-object
- Swagger Parser README (official repo): https://raw.githubusercontent.com/swagger-api/swagger-parser/master/README.md
- APIDevTools Swagger Parser README (official repo, features + security note): https://raw.githubusercontent.com/APIDevTools/swagger-parser/main/README.md
- Spring 6.1.3 Javadocs (`HandlerMapping`, `PathPattern`): https://docs.spring.io/spring-framework/docs/6.1.3/javadoc-api/org/springframework/web/servlet/HandlerMapping.html and https://docs.spring.io/spring-framework/docs/6.1.3/javadoc-api/org/springframework/web/util/pattern/PathPattern.html

### Secondary (MEDIUM confidence)
- Project codebase references (`yanote-core`, `yanote-js`, and `.planning/codebase/*`) for current patterns and test layout.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing pinned dependencies plus official docs support.
- Architecture: MEDIUM-HIGH - grounded in current code and official semantics, with some implementation-shape discretion.
- Pitfalls: HIGH - directly supported by OpenAPI spec constraints, parser docs, and current code gaps.

**Research date:** 2026-03-04
**Valid until:** 2026-04-03
