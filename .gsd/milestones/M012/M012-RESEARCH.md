# M012 Research: OpenAPI Surface Expansion Beyond Request/Response Core

_Gathered: 2026-03-25_

## Skills Discovered

- Existing installed skill used for this research: `openapi-specification-v3.2`
- Directly relevant installed skills already present in the environment: `spring-boot`, `vitest`
- New skill installs: none

## What exists now

- `yanote-js/src/spec/openapi.ts` dereferences the spec and extracts only `paths`-based HTTP operations plus request/response-core contracts:
  - declared statuses
  - request parameters
  - request body media/schema
  - response body media/schema
- `yanote-js/src/spec/semantics.ts` validates only `paths`; broader root objects are outside the semantic invalid/diagnostic path today.
- `yanote-js/src/model/httpEvent.ts` and `yanote-js/src/events/readJsonl.ts` retain payloads plus request evidence maps for `path` / `query` / `header` / `cookie` with `captured` / `redacted` / `omitted` provenance. This is the only realistic current evidence substrate for broader OpenAPI HTTP-adjacent objects.
- `yanote-js/src/report/report.ts`, `yanote-js/src/report/schema.ts`, `yanote-js/src/report/normalize.ts`, and `yanote-js/src/report/writeReport.ts` form a strict additive report pipeline. Public docs and CI currently treat `yanote-report.json` schema version `1.0.0` as a stable boundary.
- `scripts/ci/render-yanote-summary.mjs` currently surfaces governance diagnostics, generic semantic diagnostics, and uncovered operations. New broader-object failures should flow through governance diagnostics if they need GitHub summary visibility without custom parsing.

## Key codebase constraints

- Operation identity is currently `http METHOD ROUTE` (`yanote-js/src/model/operationKey.ts`). That fits security requirements attached to existing operations. It does **not** naturally fit webhook names or callback expressions.
- Sensitive request evidence is redacted in `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java`. That means:
  - `apiKey` in query/header/cookie can be presence-checked if not redacted;
  - Authorization-based schemes usually degrade to presence/unavailable truth only;
  - bearer/basic differentiation and OAuth/OpenID scopes are not truthfully provable today.
- There are currently **no** fixtures using `security`, `securitySchemes`, `examples`, `links`, `callbacks`, or `webhooks` in:
  - `examples/openapi/*.yaml`
  - `yanote-js/test/fixtures/openapi/*.yaml`
- New semantic codes require precedence updates in two places:
  - `yanote-js/src/gates/failureOrder.ts`
  - `yanote-js/src/report/normalize.ts`

## Surface-by-surface viability

### 1. Security schemes + effective security requirements

This is the best first target.

Why it fits the current architecture:

- it attaches to already-known HTTP operations;
- it can reuse existing request evidence;
- it has a believable fail-closed story for selected scheme types.

Truthful initial support boundary should stay narrow:

- good fit: `apiKey` in `query`, `header`, `cookie` via retained request evidence;
- maybe acceptable as declaration/presence-only: HTTP auth schemes that depend on `Authorization` header presence;
- poor fit for now: bearer/basic differentiation from redacted header values, OAuth/OpenID scopes/claims, mutual TLS.

Most important spec semantics to implement deterministically:

- root `security` inheritance;
- operation-level override;
- OR across security requirement objects;
- AND within a single security requirement object;
- explicit optional / clear semantics (`{}` optional, operation-level clearing of inherited security).

### 2. Examples / Example Objects

Low implementation fit for this milestone.

- They are primarily design-time/documentation objects.
- Static example-schema validation is possible, but that is much closer to spec lint than runtime truth.
- Trying to make examples first-class coverage/conformance will likely pollute the current runtime evidence story and collide with deferred `DEEP-01` behavior-coverage ambitions.

Recommendation: keep deferred in M012 unless the product intentionally wants a non-governance “declared but not proven” documentation-only section. I would **not** make this first-wave supported truth.

### 3. Links

Moderate-to-low fit right now.

- Links are design-time relationships from one operation response to another using runtime expressions.
- They are more runtime-adjacent than examples, but Yanote currently has no cross-operation traversal model in report logic.
- `test.run_id` stays in `events.jsonl` and is **not** promoted into `yanote-report.json`, so stable chain-level proof/reporting is not currently a first-class surface.
- A static link graph would again drift toward lint/documentation, not runtime truth.

Recommendation: defer. If revisited later, it likely belongs with richer traceability/report UX rather than this milestone’s first implementation slice.

### 4. Callbacks

High risk / poor fit now.

- Callback URLs are runtime expressions over request/response data.
- They describe provider-initiated outbound HTTP after a parent operation.
- The current recorder/analyzer path is built around observed inbound HTTP events matched by route/method, not outbound correlation from a parent operation.
- Supporting callbacks truthfully would likely require new proof infrastructure, not just analyzer extraction.

Recommendation: explicit defer for M012.

### 5. Webhooks

More interesting than callbacks, but still structurally risky.

- They are more runtime-adjacent than links/examples because they describe real HTTP requests.
- However, OpenAPI `webhooks` are root-level named entries whose values are Path Item Objects; they do not slot cleanly into the current `http METHOD ROUTE` identity model.
- That means even pure analyzer support likely needs either:
  - a new operation-key kind, or
  - an artificial route/name mapping layer,
  both of which are larger architectural moves than security support.

Recommendation: treat as a separate exploratory/defer decision, not part of the first proving slice.

## What should be proven first

1. **Security requirement extraction and inheritance semantics** from OpenAPI documents.
2. **A narrow, truthful security conformance surface** for scheme types that the current recorder can actually observe:
   - apiKey query/header/cookie presence
   - possibly Authorization-presence-only, but not bearer/basic/oauth scopes.
3. **Additive report + governance integration** so new failures surface through existing CLI/CI paths without contaminating `coverage.operations/status/parameters/aggregate`.
4. **Explicit documentation of defers** for examples, links, callbacks, and webhooks.

That ordering retires the main product question (“which broader objects deserve first-class support?”) without forcing a grab-bag milestone.

## Reuse patterns to keep

- **Additive surface pattern** from M011:
  - keep legacy observation coverage numerators unchanged;
  - publish new truth in a separate section (security should mirror `httpRequestConformance` / `httpPayloadConformance` rather than overload `coverage`).
- **Typed semantic governance pattern**:
  - new broader-object drift should surface as dedicated semantic codes, then flow through CLI/report/GitHub summary via governance diagnostics.
- **Deterministic normalization pattern**:
  - any new per-operation section must be normalized/sorted in `report.ts` + `normalize.ts` + `schema.ts`.
- **Focused proof sidecar pattern**:
  - M011 already proved that additive sidecars are the safe way to widen public proof without destabilizing the happy path bundle.

## Natural slice boundaries

### Recommended Slice 1 — Boundary decision + extractor contract

Goal: choose the supported broader surface explicitly and wire the spec model.

- Extend `yanote-js/src/spec/openapi.ts` to extract:
  - `components.securitySchemes`
  - effective per-operation `security`
- Extend semantic invalid handling for bad/missing security references and inheritance cases.
- Add fixtures/tests for root inheritance, operation override, OR/AND semantics, and explicit clear/optional cases.
- In the same slice, document explicit defers for examples/links/callbacks/webhooks so the milestone closes the product-boundary question.

### Recommended Slice 2 — Security conformance + report/gate surface

Goal: turn selected security semantics into truthful analyzer output.

- Evaluate only truthfully supported schemes against retained request evidence.
- Publish an additive section (likely `httpSecurityConformance` or similar).
- Add typed semantic codes and precedence.
- Ensure CI summary/GitHub summary can see failures through governance diagnostics.

### Recommended Slice 3 — Docs + retained proof closeout

Goal: make the widened boundary public and rerunnable.

- Add focused OpenAPI fixture(s) and retained proof command(s).
- Update `README.md`, `docs/guides/analyzer-coverage.md`, and `docs/release-and-support.md`.
- State clearly:
  - what security semantics are supported,
  - what are presence-only/unavailable,
  - what remains deferred.

### Optional / separate exploratory slice — Webhooks only if planners insist on a second object

Do **not** mix this with security implementation. First answer whether the operation identity model can represent root `webhooks` truthfully. If not, defer cleanly.

## Boundary contracts that matter

- `yanote-js/src/model/operationKey.ts`: existing HTTP key shape is a hard constraint.
- `yanote-js/src/model/httpEvent.ts` + `yanote-js/src/events/readJsonl.ts`: current request evidence is the only current substrate for broader HTTP-adjacent semantics.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java`: redaction/omission policy defines what security claims are actually provable.
- `yanote-js/src/report/schema.ts` + `yanote-js/src/report/writeReport.ts`: strict schema and deterministic write path mean new sections must be deliberate.
- `scripts/ci/render-yanote-summary.mjs`: governance-diagnostic-driven surfaces are the lowest-friction way to expose new failures in CI.
- `docs/release-and-support.md`: public docs currently treat `yanote-report.json` schema `1.0.0` and additive conformance sections as a stable contract.

## Requirements read-through

### Table stakes from existing validated requirements

- **R001**: keep the recorder → JSONL → analyzer path deterministic.
- **R002**: broader-object support must fail closed where Yanote claims support.
- **R003**: whatever is added must remain visible through CLI/report/CI, not only internal code/tests.

### What looks missing but should probably become candidate requirements

1. **Selected broader OpenAPI surfaces must remain additive and must not change existing observation coverage numerators.**
2. **Root/operation security inheritance/override semantics must be deterministic and user-visible.**
3. **Unsupported broader OpenAPI objects should be documented explicitly instead of remaining silent omission.**

### What is probably optional or should stay deferred

- example validation / named-example conformance
- link traversal proof
- callback support
- webhook support unless the identity/matching model is redesigned intentionally
- OAuth scope / bearer/basic token semantics beyond presence/unavailable truth

## Recommended milestone stance

M012 should probably **ship one real broader-object family well, not many weakly**.

My recommendation is:

- **Support now:** security schemes + effective security requirements, with a narrow truthful conformance subset.
- **Defer explicitly:** examples, links, callbacks, webhooks.

That gives Yanote a credible post-core OpenAPI expansion without collapsing into generic spec-linting or forcing a new runtime model mid-milestone.

## Resume notes for the roadmap planner

- If you want a second construct after security, evaluate **webhooks before callbacks/links/examples**, but only as a separate architectural decision slice.
- Expect report/CLI/CI touches beyond analyzer code: `schema.ts`, `report.ts`, `normalize.ts`, `failureOrder.ts`, `render-yanote-summary.mjs`, docs, and proof scripts all participate in the public contract.
- There is no existing fixture coverage for any broad OpenAPI object, so the first slice needs to create the proving corpus, not just implementation code.
