# M012: M012: OpenAPI Surface Expansion Beyond Request/Response Core

**Vision:** Expand Yanote beyond the request/response core by supporting one broader OpenAPI family well: effective HTTP security requirements. The milestone should let users point Yanote at richer OpenAPI documents and see deterministic, user-visible truth for selected security semantics without changing existing coverage numerators, while the docs and support surfaces state clearly which broader OpenAPI objects remain deferred.

## Success Criteria

- Yanote extracts components.securitySchemes plus effective per-operation security requirements deterministically, including root inheritance, operation override, explicit clear/optional cases, OR across requirement objects, and AND within a requirement object.
- Yanote evaluates a truthful first support subset for HTTP security requirements against retained request evidence, publishes the result through yanote-report.json plus CLI/CI/governance surfaces, and fails closed where support is claimed.
- The new broader-object surface is additive: existing coverage.operations/status/parameters/aggregate numerators and public happy-path semantics remain stable while security truth appears in a separate, normalized report surface.
- README, analyzer coverage docs, release/support boundary docs, and retained proof scripts explicitly state what security semantics are supported now and what remains deferred (examples, links, callbacks, webhooks, and unsupported security subtypes).

## Slices

- [x] **S01: Security Semantics Through Report, CLI, And CI** `risk:High — this slice proves the real risky path by turning OpenAPI security requirements into deterministic analyzer truth without breaking the current HTTP coverage contract.` `depends:[]`
  > After this: Run `yanote report` on security-focused OpenAPI fixtures and see inherited/overridden apiKey security requirements surface as additive per-operation truth plus typed semantic failures in `yanote-report.json`, CLI output, and CI summary while `coverage.operations/status/parameters/aggregate` stay unchanged.

- [x] **S02: Public Boundary Closure And Retained Proof** `risk:Medium — once S01 works, the remaining risk is shipping an honest public boundary so supported and deferred OpenAPI objects are unmistakable to users and maintainers.` `depends:[S01]`
  > After this: Run the retained milestone proof scripts and inspect the updated README/support docs to see the published Yanote boundary explicitly describe supported security semantics, fail-closed/unavailable cases, and deferred broader OpenAPI objects.

## Boundary Map

## Boundary map

- **User entrypoints**: `node yanote-js/dist/yanote.cjs report`, `yanote-report.json`, CLI summary/stderr, `scripts/ci/render-yanote-summary.mjs`, README, analyzer coverage guide, release/support docs.
- **Spec/model boundary (S01)**: extend `yanote-js/src/spec/openapi.ts` and `yanote-js/src/spec/semantics.ts` to resolve `components.securitySchemes` and effective per-operation `security` without changing existing HTTP operation identity (`http METHOD ROUTE`).
- **Evidence boundary (S01)**: reuse retained request evidence from `yanote-js/src/model/httpEvent.ts`, `yanote-js/src/events/readJsonl.ts`, and `yanote-recorder-spring-mvc/.../HttpRequestEvidenceCapture.java`; support only claims that remain truthful under captured/redacted/omitted evidence.
- **Conformance/gate boundary (S01)**: add a dedicated HTTP security conformance evaluator and route its typed failures through `yanote-js/src/gates/*`, CLI summary, and governance diagnostics rather than overloading legacy coverage metrics.
- **Report boundary (S01)**: extend `yanote-js/src/report/report.ts`, `schema.ts`, and `normalize.ts` with a new additive security section; preserve current `coverage.*` numerators and deterministic ordering.
- **Public proof boundary (S02)**: update retained fixtures, `scripts/ci/run-v1-e2e.sh`, focused verifiers, and public docs so supported security semantics and explicit defers for other broader OpenAPI objects are visible and rerunnable.
