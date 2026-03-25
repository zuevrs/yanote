# S04 Research — Final boundary assembly and docs hardening

## Scope / Requirements Focus
- Active requirements touched by this slice: `R031`, `R032`, `R033`, `R034`.
- S04 is an assembly/truth slice, not a new feature slice: it has to make public docs, proof scripts, retained artifacts, and support wording line up with what the repo can actually prove end to end.
- Practical owner surfaces are:
  - `docs/guides/analyzer-coverage.md`
  - `docs/guides/asyncapi-kafka.md`
  - `docs/release-and-support.md`
  - `docs/requirements.md`
  - `SUPPORT.md`
  - `README.md`
  - `docs/README.md`
  - `examples/README.md`
  - `scripts/docs/verify-s04-boundaries.sh`
  - `scripts/docs/verify-m005-s01-async-boundaries.sh`
  - `scripts/docs/verify-m005-s01-async-path.sh`
  - `scripts/docs/verify-s02-analysis-path.sh`
  - `scripts/ci/run-v1-e2e.sh`
  - `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - `.yanote-ci/v1-e2e/`
  - `.yanote-ci/live-kafka-proof/`

## Summary
- HTTP is **not** ready for final public boundary hardening yet. The internal HTTP core model exists in code, but CLI/gate/proof remain payload-era.
- Async is **partially stronger in code than in public docs**, but the retained public bundle still does not yet prove the stronger header surface truthfully.
- There is also a separate docs-hardening issue: `scripts/docs/verify-s04-boundaries.sh` currently fails only because `docs/release-and-support.md` still says `v1.0.126` while the repo’s latest tag is `v1.0.127`.
- The next unit should treat S04 as an **assembly dependency slice** on unfinished S02/S03 runtime/public wiring, not as a pure docs-edit slice.

## Implementation Landscape

### HTTP foundations already landed
- `yanote-js/src/spec/openapi.ts`
  - extracts supported parameter schemas and `responseHeadersByStatus`.
  - supported value subset is intentionally narrow and truthful: scalar `string|integer|number|boolean`, arrays thereof, enum, string pattern/minLength/maxLength, numeric min/max/exclusive bounds.
  - this matches the narrow-core approach recommended by the installed `openapi-specification-v3.2` skill: document the exact supported parameter/header subset, do not imply full OpenAPI serialization/style coverage.
- `yanote-js/src/coverage/httpValueConformance.ts`
  - validates retained string evidence, array values, numeric/boolean coercion, enum/pattern/bounds.
  - `format` is outside support; repeated values on non-array schemas become skipped (`REPEATED_VALUE_UNSUPPORTED`).
- `yanote-js/src/coverage/httpParameterValueConformance.ts`
  - produces typed diagnostics: `VALID`, `INVALID_VALUE`, `MISSING_VALUE`, `RECORDER_REDACTED`, `RECORDER_OMITTED`, `UNSUPPORTED_SCHEMA`, `REPEATED_VALUE_UNSUPPORTED`.
- `yanote-js/src/coverage/httpResponseHeaderConformance.ts`
  - same diagnostic shape for response headers; declared header matching already handles exact status, `nXX`, and `default`.
- `yanote-js/src/coverage/httpCoreConformance.ts`
  - aggregates undeclared statuses + parameter value conformance + response-header conformance into additive `httpCoreConformance`.
  - `UNDECLARED_STATUS` is already a first-class typed diagnostic inside this internal surface.
- `yanote-js/src/report/report.ts`
  - schema/report/normalize already carry a required `httpCoreConformance` section with neutral fallback.

### HTTP runtime/public seams still missing
- `yanote-js/src/cli.ts`
  - still computes only `computeCoverage(...)` and `computeHttpPayloadConformance(...)`.
  - summary rendering still prints only `HTTP Payload Conformance`; there is no human-facing `HTTP Core Conformance` section and no machine-summary counts for the new http-core surface.
- `yanote-js/src/gates/evaluator.ts`
  - short-circuits only on `evaluateHttpPayloadSemanticFailures(...)`.
  - no evaluator path exists yet for undeclared status / parameter drift / response-header drift.
- `yanote-js/src/gates/failureOrder.ts`
  - ranks async semantic codes and payload-era HTTP semantic codes only.
  - there are no precedence entries for future HTTP-core semantic codes.
- Test coverage reflects the same gap:
  - `yanote-js/src/report/report.test.ts` and contract tests cover additive `httpCoreConformance` serialization.
  - `yanote-js/src/cli.report.test.ts`, `yanote-js/src/cli.summary.contract.test.ts`, `yanote-js/src/cli.failclosed.contract.test.ts`, `yanote-js/src/gates/evaluator.threshold.test.ts`, and `yanote-js/src/gates/failureOrder.test.ts` still assert payload-era `SEMANTIC_HTTP_*BODY/*SCHEMA/*MEDIA*` behavior only.

### Existing live HTTP proof asset that S04 should reuse
- `examples/openapi/demo-openapi.yaml`
  - already exposes `/evidence/users/{id}` with:
    - undeclared live status surface (`202` returned by app while only `200` is declared),
    - query params `expand`, `token`,
    - request headers `X-Evidence-Mode`, `X-Api-Key`,
    - response headers `X-Evidence-Mode`, repeated `X-Trace-Id`, and `Server-Timing`.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
  - the real route returns `202`, echoes evidence, emits repeated response headers, and provides omitted header behavior.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java`
  - already proves recorder truth for `/evidence/users/{id}`:
    - undeclared status `202`,
    - redacted query/header evidence,
    - repeated response header values,
    - omitted `server-timing` evidence.
- `scripts/docs/verify-m010-s01-http-evidence-depth.sh`
  - already reruns this focused proof successfully.
- But public/runtime proof is still older:
  - `scripts/docs/verify-s02-analysis-path.sh` and `scripts/ci/run-v1-e2e.sh` still prove payload-era unsupported-schema drift on `/users`, not HTTP-core drift on `/evidence/users/{id}`.
  - Current public HTTP proof bundle therefore cannot truthfully advertise `R031`/`R032`/`R033` yet.

### Async public-boundary state
- Analyzer/runtime support is stronger than docs:
  - `scripts/ci/verify-m004-s03-live-kafka-proof.sh` contains header-sidecar spec paths and `run_header_drift_sidecar(...)`.
  - `examples/springmvc-service/.../ExampleServiceApplication.java` emits proof-only sensitive header `yanote.proof.secret`, which matches the S03 redaction strategy.
  - `scripts/ci/render-yanote-summary.mjs` already maps `missing-header`, `unavailable-header`, `invalid-header`, and `unverifiable-headers` to `ASYNC_SEMANTIC_*` codes.
- Live verification status in this unit:
  - `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` passed.
- Export/public bundle gap remains:
  - `.yanote-ci/live-kafka-proof/artifact-manifest.txt` from this run reports `artifact_count=15` and lists only:
    - happy path,
    - runtime-selected sidecar,
    - schema-failure sidecar.
  - No missing/invalid/unavailable/unverifiable header sidecars were present in the retained exported bundle from this run.
  - So the retained public artifact still matches the older under-claim more than the widened script/test intent.
- Docs/support/verifiers still deliberately under-claim async headers:
  - `docs/guides/asyncapi-kafka.md`
  - `docs/release-and-support.md`
  - `docs/requirements.md`
  - `SUPPORT.md`
  - `scripts/docs/verify-m005-s01-async-boundaries.sh`
  - `scripts/docs/verify-m005-s01-async-path.sh`
  all still require the clause `retained Kafka headers remain unverifiable`.
- For S04 planning that means: async docs should only be promoted after exported retained artifacts and support intake become truthful.

### Docs hardening seam unrelated to HTTP/async boundary assembly
- `scripts/docs/verify-s04-boundaries.sh` resolves the latest git tag dynamically.
- In this worktree it fails only because `docs/release-and-support.md` still hardcodes `v1.0.126` while the latest tag is now `v1.0.127`.
- That is a clean independent docs fix once the main boundary wording is settled.

## Verification already rerun in this research unit
- ✅ `node --test scripts/ci/export-async-proof-artifacts.test.mjs`
- ✅ `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- ✅ `bash scripts/docs/verify-m005-s01-async-path.sh`
- ✅ `bash scripts/docs/verify-s02-analysis-path.sh`
- ✅ `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- ✅ `bash ./scripts/docs/verify-m010-s01-http-evidence-depth.sh`
- ❌ `bash scripts/docs/verify-s04-boundaries.sh`
  - current failure: `docs/release-and-support.md` is missing latest stable release tag `v1.0.127`.

## Recommendation / natural task split
1. **HTTP runtime wiring first — highest blocker for `R031`/`R032`/`R033`**
   - Update `yanote-js/src/cli.ts` to compute `computeHttpCoreConformance(...)`, pass it to `buildReport(...)`, add a human summary section, machine counts, and top-issue generation for http-core diagnostics.
   - Extend focused CLI tests instead of relying on report-only tests.
2. **HTTP fail-closed semantics second**
   - Introduce explicit HTTP-core semantic classification parallel to `httpPayloadSemantics.ts`.
   - Extend `yanote-js/src/gates/evaluator.ts` and `yanote-js/src/gates/failureOrder.ts` with precedence and codes for undeclared status / invalid parameter value / response-header drift.
   - Only after this can S04 docs claim governance/gate truth for `R031`-`R033`.
3. **HTTP proof bundle retarget third**
   - Replace payload-era retained red-path assertions in `scripts/docs/verify-s02-analysis-path.sh`, `scripts/ci/run-v1-e2e.sh`, and linked docs with `/evidence/users/{id}`-based proof surfaces.
   - Keep the payload matrix if useful, but the public retained proof should showcase the new core boundary.
4. **Async public-boundary reconciliation fourth**
   - Reconcile `scripts/ci/verify-m004-s03-live-kafka-proof.sh` versus exported `.yanote-ci/live-kafka-proof/` contents so retained public artifacts actually include whatever header surface docs will claim.
   - Only then update docs/support/verifiers away from the clause `retained Kafka headers remain unverifiable`.
5. **Final docs/release hardening last**
   - Refresh `docs/release-and-support.md` and any related landing docs so `scripts/docs/verify-s04-boundaries.sh` goes green for `v1.0.127`.

## Risks / gotchas
- **Do not let S04 overclaim HTTP today.** The codebase has internal DTOs and recorder truth, but the user-facing CLI/gate/proof boundary is still payload-era.
- **Do not let async docs outpace exported artifacts.** Passing live script logic is not enough; the retained bundle visible to users still lacks header-sidecar artifacts from this unit’s exported manifest.
- **Keep the OpenAPI/AsyncAPI promise narrow.** This slice should follow the installed `openapi-specification-v3.2` and `asyncapi-design` skill guidance: state exactly what supported core subset is proven; do not imply full-spec or broker-agnostic coverage.
- **Bash verifier changes should stay deterministic and explicit.** Per the installed `bash-scripting` skill, keep temp paths, output artifacts, and failure reasons explicit; avoid opaque helper behavior.
- **Test changes should stay focused.** Per the installed `vitest` and `java-junit` skills, prefer small focused summary/gate/proof assertions rather than one broad integration catch-all.

## Skills Discovered
No new skill installation was needed. Directly relevant installed skills already covered this slice:
- `openapi-specification-v3.2`
- `asyncapi-design`
- `spring-kafka`
- `bash-scripting`
- `vitest`
- `java-junit`
- `java-gradle`

## Resume notes
- Research artifact complete; no code changes were made in this unit.
- If the next unit starts with docs-only edits, it will dead-end unless it first resolves:
  - the HTTP CLI/gate/proof gap, and
  - the async exported-artifact mismatch described above.
- The only clean docs-only fix available immediately is the `v1.0.127` release-tag refresh for `docs/release-and-support.md`, but that alone does **not** close S04.