---
id: M012
title: "OpenAPI Surface Expansion Beyond Request and Response Core"
status: complete
completed_at: 2026-03-25T22:51:23.042Z
key_decisions:
  - Resolve broader OpenAPI security semantics in the semantic layer first, then materialize typed operation security contracts so canonical `http METHOD ROUTE` identities stay stable.
  - Support only the truthful first subset — `apiKey` security in query, header, and cookie locations backed by retained request evidence provenance — and mark unsupported security types/locations explicitly instead of inferring success.
  - Expose security truth additively through `httpSecurityConformance`, CLI/CI summaries, and retained proof sidecars without mutating legacy `coverage.*` numerators.
  - Publish the supported-vs-deferred security boundary literally in public docs and fixture-backed proof artifacts instead of implying it from runtime behavior.
key_files:
  - yanote-js/src/spec/semantics.ts
  - yanote-js/src/spec/openapi.ts
  - yanote-js/src/coverage/httpSecurityConformance.ts
  - yanote-js/src/gates/httpSecuritySemantics.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/schema.ts
  - yanote-js/src/report/normalize.ts
  - yanote-js/src/cli.ts
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/run-v1-e2e.sh
  - scripts/ci/verify-m012-s02-security-semantics.sh
  - README.md
  - docs/guides/analyzer-coverage.md
  - docs/release-and-support.md
lessons_learned:
  - When Yanote widens HTTP/OpenAPI semantics, ship them on a dedicated additive conformance surface instead of mutating established `coverage.operations/status/parameters/aggregate` numerators.
  - New typed semantic failure families must be wired through gate precedence, report normalization, and human-facing summary renderers together or deterministic ordering drifts between JSON, CLI, and CI surfaces.
  - Focused broader-object proof should prefer retained derived sidecars plus provenance notes over raw fixture evidence so the public bundle stays truthful and secret-safe.
---

# M012: OpenAPI Surface Expansion Beyond Request and Response Core

**M012 completed Yanote’s first broader OpenAPI family by shipping truthful additive HTTP security semantics for OpenAPI security requirements across analyzer, report, CLI, CI, and public support surfaces without changing legacy HTTP coverage numerators.**

## What Happened

M012 closed successfully with real implementation and public-boundary proof, not planning-only output. Code-change verification against `$(git merge-base HEAD main)` showed 36 non-`.gsd/` files changed across `yanote-js` sources/tests/fixtures, CI scripts, and public docs, so the milestone produced substantive product work. S01 extended the semantic layer to resolve effective per-operation OpenAPI security requirements deterministically — root inheritance, operation override, explicit `security: []` clear semantics, optional `{}` branches, OR across requirement objects, and AND within a requirement object — while preserving canonical `http METHOD ROUTE` identities. It then added a truthful first evaluator for `apiKey` security in query/header/cookie locations, dedicated `httpSecurityConformance` report/schema/normalization surfaces, and fail-closed typed `SEMANTIC_HTTP_MISSING_SECURITY`, `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`, and `SEMANTIC_HTTP_UNSUPPORTED_SECURITY` governance routed through CLI and CI summary output. S02 closed the public boundary by retaining fixture-backed `security-semantics.*` proof sidecars in `.yanote-ci/v1-e2e/`, updating README/docs/examples/release-support wording to publish the supported-vs-deferred matrix literally, and pinning the delivery path with focused verifier scripts plus CI/doc contract tests. Milestone closeout reran the key integrated proofs on the worktree: `bash scripts/ci/verify-m012-s02-security-semantics.sh`, `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, and `bash scripts/ci/run-v1-e2e.sh`, all of which passed. The retained live bundle continued to show unchanged legacy HTTP coverage numerators while the focused security proof and report/CLI/CI surfaces exposed additive security truth deterministically and secret-safely.

## Success Criteria Results

- [x] **Deterministic effective security extraction** — Met. S01 delivered semantic extraction for `components.securitySchemes` plus effective per-operation security requirements covering root inheritance, operation override, explicit clear (`security: []`), optional `{}` branches, OR across requirement objects, and AND within a requirement object. Evidence: S01 summary plus `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts` (recorded in slice verification) and the focused closeout rerun `bash scripts/ci/verify-m012-s02-security-semantics.sh`.
- [x] **Truthful first support subset with fail-closed behavior on claimed support** — Met. Yanote now evaluates the supported `apiKey` subset in query/header/cookie locations against retained request evidence and fails closed with typed `SEMANTIC_HTTP_MISSING_SECURITY`, `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`, and `SEMANTIC_HTTP_UNSUPPORTED_SECURITY` diagnostics instead of false-green output. Evidence: S01 verification stack (`src/gates/httpSecuritySemantics.test.ts`, `src/gates/failureOrder.test.ts`, `src/cli.security.report.test.ts`, `src/cli.security.summary.contract.test.ts`) plus the focused verifier rerun `bash scripts/ci/verify-m012-s02-security-semantics.sh`.
- [x] **Additive broader-object surface without perturbing legacy coverage numerators** — Met. The new security truth is published through top-level `httpSecurityConformance`, CLI security blocks, `YANOTE_SUMMARY` security tokens, and CI summary rendering while `coverage.operations`, `coverage.status`, `coverage.parameters`, and `coverage.aggregate` remain unchanged. Evidence: S01 direct fixture-backed CLI proof in the slice summary, `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, and the closeout rerun `bash scripts/ci/run-v1-e2e.sh`, whose retained happy-path output still reported 100% legacy coverage with additive `HTTP Security Conformance` counts.
- [x] **Public docs/support boundary states supported vs deferred semantics explicitly** — Met. README, analyzer coverage guidance, examples, and release/support surfaces now describe the supported `apiKey` subset, additive security surfaces, unchanged legacy numerators, and the continued defer of examples/links/callbacks/webhooks and unsupported security subtypes. Evidence: S02 summary, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, and `bash scripts/ci/run-v1-e2e.sh` retaining the public proof sidecars.

No success criteria were left unmet.

## Definition of Done Results

- [x] All roadmap slices are complete: the inlined roadmap shows S01 and S02 checked, and milestone disk inspection confirmed both slice summaries plus all task summaries exist under `.gsd/milestones/M012/slices/`.
- [x] The milestone produced real code and product-surface changes: `git diff --stat HEAD $(git merge-base HEAD main) -- ':!.gsd/'` reported 36 non-`.gsd/` files changed across analyzer code, tests, fixtures, CI scripts, and docs.
- [x] Cross-slice integration works on current HEAD: `bash scripts/ci/verify-m012-s02-security-semantics.sh`, `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, and `bash scripts/ci/run-v1-e2e.sh` all passed during closeout.
- [x] The retained proof/report/docs path is coherent end to end: focused security fixtures prove the supported subset, public docs/verifiers publish the same boundary literally, and the standard v1 proof bundle keeps the broader-object surfaces additive rather than mutating legacy coverage contracts.

## Requirement Outcomes

- **R001** remained **validated** and was materially strengthened by M012. Evidence: the deterministic recorder → analyzer → report path now carries additive HTTP security truth without changing canonical operation identity or legacy coverage numerators, as proven by the S01 verification stack and focused `verify-m012-s02-security-semantics.sh` rerun.
- **R002** remained **validated** and was materially strengthened by M012. Evidence: dedicated fail-closed security semantic codes (`SEMANTIC_HTTP_MISSING_SECURITY`, `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`, `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`) now stop analysis with explicit typed diagnostics and precedence, proven by the S01 gate/failure-order verification stack and focused closeout verifier.
- **R003** remained **validated** and was materially strengthened by M012. Evidence: the same security truth is now visible through CLI output, `YANOTE_SUMMARY`, `yanote-report.json`, GitHub-summary rendering, retained proof sidecars, and public support docs; closeout reran the CI summary contract tests, docs verifiers, and public `run-v1-e2e.sh` proof path.
- **R023** transitions from **deferred** to **validated**. Evidence: M012 implemented one selected broader OpenAPI family — truthful HTTP security scheme support — through analyzer semantics, additive report/CLI/CI surfaces, focused retained proof, and literal public-boundary docs while explicitly keeping other broader objects deferred. This satisfies the requirement’s promise to support selected non-request/response OpenAPI constructs where Yanote can prove them truthfully from retained evidence.
- No requirement was invalidated or re-scoped during M012.

## Deviations

None.

## Follow-ups

M013 should focus on analyzer delivery and report UX improvements (remote spec loading, deprecated-operation handling, and more operator-friendly report consumption) now that the broader OpenAPI security boundary is closed. Future broader-object OpenAPI work can expand beyond `apiKey` security only when Yanote can prove additional security types or other OpenAPI objects truthfully from retained evidence. A separate follow-up would be needed if the project wants raw `docker compose up` to become a cold-start supported proof entrypoint rather than relying on `run-v1-e2e.sh` host prewarming.
