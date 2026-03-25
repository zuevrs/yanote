---
id: M011
title: "OpenAPI Parameter, Cookie, And Media Semantics"
status: complete
completed_at: 2026-03-25T20:02:00.274Z
key_decisions:
  - Keep the widened HTTP semantics additive: preserve legacy coverage numerators while publishing request truth on `httpRequestConformance` and per-parameter `declaredSupport*` surfaces.
  - Support repeated arrays only where retained evidence stays honest (`query=form` + `explode=true` + scalar items) and fail closed on unsupported request constructs with typed `SEMANTIC_HTTP_*REQUEST_PARAMETER` governance.
  - Apply an explicit payload-format allowlist (`email` first) and evaluate payload media types by specificity at runtime rather than by declaration order.
  - Publish the widened HTTP boundary through the standard `run-v1-e2e.sh` bundle, docs landing surfaces, and release/support boundary docs instead of inventing a separate public entrypoint for M011.
key_files:
  - yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java
  - yanote-core/src/main/java/dev/yanote/core/events/HttpRequestEvidence.java
  - yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java
  - yanote-js/src/spec/openapi.ts
  - yanote-js/src/coverage/httpRequestConformance.ts
  - yanote-js/src/coverage/httpPayloadConformance.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/cli.ts
  - scripts/ci/run-v1-e2e.sh
  - scripts/ci/verify-m011-s02-request-semantics.sh
  - scripts/ci/verify-m011-s03-format-media.sh
  - docs/release-and-support.md
lessons_learned:
  - For milestone closeout in a `.gsd/worktrees/...` checkout, trust direct `bash` verification over `async_bash` unless the background runner's cwd is explicitly confirmed.
  - When shared example routes/tests evolve across slices, older focused shell verifiers can drift even if the product surface remains correct; integrated milestone-proof commands should be the authoritative closeout evidence.
  - Release/support boundary docs must keep the latest stable tag consistent in every section, because the public boundary verifier checks exact release strings rather than broad intent.
---

# M011: OpenAPI Parameter, Cookie, And Media Semantics

**M011 closed the widened supported HTTP semantics contract: retained request evidence, supported request serialization truth, payload format/media semantics, and public report/CI/docs surfaces are now proven end to end on current HEAD.**

## What Happened

Milestone M011 delivered the planned HTTP/OpenAPI depth increase across recorder, JSONL, analyzer, report, CLI, docs, and CI surfaces without redefining the legacy coverage numerators. The code-change check confirmed real implementation work on current HEAD (`git diff --stat $(git merge-base HEAD main) HEAD -- ':!.gsd/'` showed 62 non-.gsd files changed across `yanote-core`, `yanote-recorder-spring-mvc`, `yanote-js`, `examples/`, `scripts/`, and public docs). Closeout verification then re-proved the assembled milestone through the current integrated stack: `bash scripts/ci/verify-m011-s02-request-semantics.sh` passed for retained path/query/header/cookie evidence, supported repeated query arrays, and fail-closed unsupported request semantics; `bash scripts/ci/verify-m011-s03-format-media.sh` passed for valid-format, invalid-format, unsupported-format, and most-specific-media scenarios; `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, and `bash scripts/docs/verify-s04-boundaries.sh` passed after synchronizing `docs/release-and-support.md` with the latest stable tag `v1.0.128`; `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` passed; and `bash scripts/ci/run-v1-e2e.sh` passed, retaining the standard happy-path report plus additive request-semantics and payload semantic-red sidecars. For the first-slice evidence depth, the request-evidence Vitest suite passed (`npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts`), and the focused Java request-evidence tests passed with wildcard class filters (`./gradlew :yanote-core:test --tests '*HttpEventRequestEvidenceJsonlRoundTripTest'` and `./gradlew :yanote-recorder-spring-mvc:test --tests '*HttpRequestEvidenceCaptureTest'`). The only closeout caveat was verifier maintenance drift: the historical `bash scripts/ci/verify-m011-s01-request-evidence.sh` script still asserts the pre-S02 `oversizedHint` scenario against a shared focused RestAssured proof that now exercises S02 `tags/meta` semantics, and the historical exact fully qualified Gradle `--tests` filters no longer discover the same two focused Java tests reliably in this repo. Those issues did not invalidate the milestone’s product outcomes, because omission/redaction behavior remains covered by the passing unit tests and the latest integrated verifiers, but they should be cleaned up so historical proof commands stay aligned with the delivered boundary.

## Success Criteria Results

- [x] **Safe retained request evidence and additive truth surface.** Current HEAD preserves the deterministic recorder → JSONL → analyzer path while widening request evidence additively. Evidence: `git diff --stat $(git merge-base HEAD main) HEAD -- ':!.gsd/'` showed 62 non-.gsd files changed; `./gradlew :yanote-core:test --tests '*HttpEventRequestEvidenceJsonlRoundTripTest'` and `./gradlew :yanote-recorder-spring-mvc:test --tests '*HttpRequestEvidenceCaptureTest'` passed for JSONL round-trip plus captured/redacted/omitted request evidence; `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts` passed 6 files / 18 tests; and `bash scripts/ci/verify-m011-s02-request-semantics.sh` plus `bash scripts/ci/run-v1-e2e.sh` proved retained request evidence and additive request-conformance publication on live artifacts.
- [x] **Supported parameter subset and honest request semantics.** Yanote now evaluates the documented supported request subset and fails closed on unsupported constructs instead of implying blanket support. Evidence: `bash scripts/ci/verify-m011-s02-request-semantics.sh` passed, confirming supported `path=simple`, `query=form`, `header=simple`, and `cookie=form` semantics, supported repeated query arrays (`tags`) only where retained values stay honest, `declaredSupport` / `declaredSupportShape` / `declaredSupportReason` publication, and typed `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER` governance for unsupported `meta` semantics.
- [x] **Format policy and media specificity truth.** Payload conformance now applies the documented supported format policy and most-specific media selection. Evidence: `bash scripts/ci/verify-m011-s03-format-media.sh` passed the green supported-format scenario, the invalid email fail-closed scenario (`SEMANTIC_HTTP_INVALID_BODY`), the unsupported custom-format scenario (`SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT`), and the media-specificity scenario where `application/problem+json` wins over broader declarations.
- [x] **Public contract closeout across CLI/report/schema/docs/CI surfaces.** The widened HTTP boundary is published through existing public entrypoints and docs. Evidence: `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` passed; `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, and `bash scripts/docs/verify-s04-boundaries.sh` passed; and `bash scripts/ci/run-v1-e2e.sh` passed, retaining the stable happy-path report plus additive request-semantics and payload semantic-red sidecars on the standard proof path.

## Definition of Done Results

- [x] All roadmap slices are complete. `find .gsd/milestones/M011/slices -maxdepth 1 -mindepth 1 -type d | sort` returned `S01` through `S04`, and `gsd_complete_milestone` validation confirmed all slices were complete before recording the milestone.
- [x] All slice summaries exist. `find .gsd/milestones/M011/slices -maxdepth 2 -name 'S*-SUMMARY.md' | sort` returned `S01-SUMMARY.md` through `S04-SUMMARY.md`.
- [x] All planned task summaries exist. `find .gsd/milestones/M011/slices -maxdepth 3 -name 'T*-SUMMARY.md' | sort` returned 16 task summary artifacts across S01-S04.
- [x] The milestone produced real implementation, not planning-only artifacts. `git diff --stat $(git merge-base HEAD main) HEAD -- ':!.gsd/'` showed 62 changed non-.gsd files with 7698 insertions and 292 deletions.
- [x] Cross-slice integration works on current HEAD. The closeout stack passed: `bash scripts/ci/verify-m011-s02-request-semantics.sh`, `bash scripts/ci/verify-m011-s03-format-media.sh`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, and `bash scripts/ci/run-v1-e2e.sh`.
- [x] Milestone verification can be marked passing, with one maintenance caveat. The historical `bash scripts/ci/verify-m011-s01-request-evidence.sh` proof and the historical exact fully qualified Gradle `--tests` filters are currently stale/flaky against the evolved shared request-semantics proof path, but the delivered milestone outcomes remain proven by the passing integrated stack plus focused Java/Vitest evidence-depth tests.

## Requirement Outcomes

- **R022 — active → validated.** Supported by current closeout evidence: `bash scripts/ci/verify-m011-s02-request-semantics.sh`, `bash scripts/ci/verify-m011-s03-format-media.sh`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, and `bash scripts/ci/run-v1-e2e.sh` all passed. Together they prove additive request-semantics sidecars, supported request serialization metadata (`declaredSupport*`), email-only format policy, most-specific media matching, and publication through standard report/CI/docs entrypoints.
- **R001 — remains validated.** The milestone still satisfies the core recorder → JSONL → analyzer/report promise on current HEAD. Evidence includes real implementation diff on non-.gsd files, passing public `bash scripts/ci/run-v1-e2e.sh`, passing request-evidence Vitest coverage, and passing focused Java request-evidence tests when filtered with wildcard class names. Closeout caveat: the historical exact fully qualified Gradle `--tests` filters and the old S01 shell verifier should not be cited as current proof until they are realigned to the evolved request-semantics scenario.
- **No requirement was invalidated or re-scoped during closeout.** The only discovered gaps were verifier-maintenance issues, not product-surface regressions.

## Deviations

During closeout I made one public-doc sync fix that did not change product behavior: `docs/release-and-support.md` still referenced `v1.0.127` in the HEAD-vs-release section, so I updated it to `v1.0.128` to match the latest stable tag and satisfy the S04 exact-string boundary verifier. I also documented, rather than treating as a product regression, that the historical S01 shell proof and exact FQCN Gradle filters no longer reflect the evolved shared request-semantics scenario on current HEAD.

## Follow-ups

Realign `scripts/ci/verify-m011-s01-request-evidence.sh` with the current shared focused request-semantics proof route (or split it onto its own dedicated S01-only test) so the historical omission/redaction proof remains runnable. Replace or supplement the historical exact fully qualified Gradle `--tests` closeout evidence with a reliable class-filter form before citing it again in requirements or slice summaries.
