---
id: M008
provides:
  - Truthful HTTP payload-conformance depth across the real Spring MVC recorder → JSONL → Node analyzer path, including supported JSON request/response validation against OpenAPI requestBody and response content schemas.
  - Separate observation-versus-conformance report, gate, CLI, and retained artifact surfaces that keep 100% exercised coverage distinct from fail-closed payload drift.
  - A public green/red `v1-e2e` proof bundle plus refreshed docs/support boundaries that describe the JSON-first HTTP payload scope truthfully.
key_decisions:
  - Kept operation/status/parameter coverage as the stable observation surface and published request/response payload truth through the separate `httpPayloadConformance` seam.
  - Derived fail-closed `SEMANTIC_HTTP_*` behavior from raw payload diagnostics instead of folding payload drift into threshold math or existing coverage percentages.
  - Preserved the canonical happy-path `out/yanote-report.json` artifact name and added semantic-red sidecars from the same live events so public proof stayed additive and inspectable.
patterns_established:
  - Close contract-depth milestones in boundary order: evidence model first, deterministic conformance semantics second, public report/gate/CLI truth third, and live proof/docs boundary last.
  - Keep observation coverage and payload conformance separate all the way through analyzer, report, CLI, gates, docs, and retained artifacts.
  - When a task-local Gradle home is mounted into Docker, copy wrapper distributions into the mounted home instead of symlinking back to `~/.gradle`; host-absolute symlinks do not survive the container boundary reliably.
observability_surfaces:
  - `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/gates/evaluator.threshold.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts src/cli.summary.contract.test.ts`
  - `bash scripts/docs/verify-s02-analysis-path.sh`
  - `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
  - `bash scripts/ci/run-v1-e2e.sh`
  - `bash scripts/docs/verify-s08-entry-paths.sh`
  - `.yanote-ci/v1-e2e/out/yanote-report.json`
  - `.yanote-ci/v1-e2e/semantic-red.stdout`
  - `.yanote-ci/v1-e2e/semantic-red.stderr`
  - `.yanote-ci/v1-e2e/semantic-red-yanote-report.json`
requirement_outcomes:
  - id: R066
    from_status: active
    to_status: validated
    proof: S01 carried request/response payload and content-type facts through the real Spring MVC recorder boundary, S02 proved deterministic valid/invalid/missing/unsupported payload semantics, and the close-out verifier stack (`bash scripts/docs/verify-s02-analysis-path.sh` plus the retained `.yanote-ci/v1-e2e/` bundle) confirmed supported JSON request/response validation end to end.
  - id: R067
    from_status: active
    to_status: validated
    proof: S01 introduced the separate `httpPayloadConformance` surface, S03 turned raw payload diagnostics into fail-closed `SEMANTIC_HTTP_*` report/gate/CLI truth, and S04 plus close-out reruns proved the retained green/red public artifacts and docs/verifiers preserve the observation-versus-conformance split.
duration: ~11h across S01-S04 plus milestone close-out
verification_result: passed
completed_at: 2026-03-21 08:39:07 +0300
---

# M008: OpenAPI Payload Conformance And Contract Depth

**Yanote’s HTTP/OpenAPI path now reaches truthful contract depth:** real Spring MVC traffic carries supported request/response payload facts through recorder → JSONL → analyzer boundaries, Yanote validates those payloads against declared OpenAPI content contracts, report/gate/CLI surfaces separate observation from conformance, and the public demo path retains both green and intentional semantic-red proof artifacts.

## What Happened

M008 closed the biggest remaining depth gap in Yanote’s HTTP surface by working in the same order that had already proven successful on the async side.

S01 made the recorder boundary truthful instead of metadata-only. `HttpEvent` widened to carry optional request/response bodies and content types, the Spring MVC recorder captured JSON-compatible payloads without breaking traffic, the example `POST /users` path became a real JSON `201` request/response flow, and `yanote report` gained a separate top-level `httpPayloadConformance` surface without disturbing the established operation/status/parameter coverage model.

S02 turned that stronger evidence boundary into deterministic analyzer semantics. Yanote now distinguishes valid payloads, invalid payloads, missing bodies, missing content types, unsupported media, unsupported schemas, no-declared-content response cases, and mixed `PARTIAL` observations. Those semantics propagate through the report and CLI as payload-specific truth while leaving observation coverage math untouched.

S03 completed the fail-closed product behavior. Raw payload diagnostics now map to stable `SEMANTIC_HTTP_*` failures, report status can be `partial` even when observation coverage remains `100%`, `governance.diagnostics` persists the semantic failures, CLI stdout/stderr and `YANOTE_SUMMARY primary=...` agree on the same reason, and benign `NO_DECLARED_CONTENT` stays visible without becoming a false failure.

S04 closed the public boundary. The `bash scripts/ci/run-v1-e2e.sh` path now retains the stable happy-path `out/yanote-report.json` artifact plus semantic-red sidecars derived from the same live events, and README/docs/support wording was refreshed so the public story matches the shipped JSON-first payload boundary instead of older partial-coverage demo language.

Milestone close-out uncovered one more operational wrinkle in the public proof script: a task-local Gradle home mounted into Docker cannot safely preseed `wrapper/dists` via an absolute symlink back to `~/.gradle`. The close-out pass corrected `scripts/ci/run-v1-e2e.sh` to copy wrapper distributions into the mounted Gradle home instead, then reran the public proof successfully and confirmed that the retained bundle now appears reliably on repeat execution.

## Cross-Slice Verification

Each roadmap success criterion was rechecked against the assembled slice evidence and live close-out verification.

- **Success criterion 1 — `yanote report` shows request/response payload conformance beside existing HTTP coverage:** **met.** `bash scripts/docs/verify-s02-analysis-path.sh` passed on live Spring MVC traffic and `.yanote-ci/v1-e2e/out/yanote-report.json` now contains a top-level `httpPayloadConformance` section. The retained happy-path report shows `status: "ok"`, `aggregateCoveragePercent: 100`, `http POST /users` request/response payload states as `COVERED`, and explicit `NO_DECLARED_CONTENT` diagnostics for GET responses whose content is intentionally undeclared.
- **Success criterion 2 — report/json/stdout/gates distinguish observed operations from payload conformance and call out drift explicitly:** **met.** The HTTP payload test stack passed across spec, conformance, gate, report, and CLI suites. The retained semantic-red artifacts prove the shipped behavior directly: `.yanote-ci/v1-e2e/semantic-red.stdout` shows `operations/status/parameters/aggregate = 100.00%` while `primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`, and `.yanote-ci/v1-e2e/semantic-red.stderr` retains both request and response `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` error lines for `http POST /users`.
- **Success criterion 3 — real Spring MVC recorder traffic carries payload/media facts end to end and proves passing + failing cases with inspectable artifacts:** **met.** `bash scripts/docs/verify-s02-analysis-path.sh` passed with live events and reported `payload_request=COVERED payload_response=COVERED` for `POST /users` plus the retained unsupported-media / invalid / missing / partial / unsupported-schema matrix. `bash scripts/ci/run-v1-e2e.sh` now reruns successfully after the Gradle-home preseed fix and retains `.yanote-ci/v1-e2e/events.jsonl`, the happy-path report, and semantic-red sidecars from the same recorded events.
- **Success criterion 4 — public docs/support surfaces describe the supported HTTP payload scope truthfully:** **met.** `bash scripts/docs/verify-s08-entry-paths.sh` passed end to end, including the release/support boundary verifier. That stack rechecked README/docs/examples/release wording against the shipped JSON-first boundary, benign `NO_DECLARED_CONTENT` treatment, retained semantic-red proof, and the absence of any implied combined HTTP+async report surface.

No roadmap success criterion remained unmet.

The milestone definition of done also checks out in full:

- payload-bearing HTTP evidence exists across recorder, JSONL, and analyzer boundaries: **met**;
- supported OpenAPI request/response payload validation works without regressing operation/status/parameter truth: **met**;
- report/gate/CLI outputs keep observation and conformance visibly distinct: **met**;
- the public HTTP entry path is exercised end to end with inspectable green/red artifacts: **met**;
- success criteria were rechecked against live behavior and retained artifacts during close-out rather than assumed from source changes: **met**.

All slices are complete, all slice summaries exist, and the cross-slice handoffs S01 → S02 → S03 → S04 remained consistent in the milestone validation record.

## Requirement Changes

- **R066 — active → validated.** The real Spring MVC recorder now carries supported JSON request/response payload and content-type evidence end to end, and Yanote validates those payloads against declared OpenAPI request/response schemas with deterministic invalid/missing/unsupported semantics.
- **R067 — active → validated.** HTTP report, gate, CLI, and retained proof surfaces now distinguish exercised operations from request/response payload conformance and fail closed on typed `SEMANTIC_HTTP_*` drift while keeping benign `NO_DECLARED_CONTENT` paths non-failing.

Requirements strengthened without status changes:

- **R025** — strengthened by the readable payload-conformance report section, machine summary counts, semantic Top Issues, and refreshed analyzer guidance.
- **R057 / R058** — strengthened by the retained docs verifier, the green/red `.yanote-ci/v1-e2e/` bundle, and the public proof script hardening needed to keep that bundle reproducible.

Project-state correction completed during close-out:

- `.gsd/REQUIREMENTS.md` now also reflects the already-completed M007 async close-out, moving **R049** and **R065** to `validated` so the requirements register no longer shows stale active work after M007+M008 completion.

## Forward Intelligence

### What the next milestone or reassessment should know
- M008 succeeded because it never tried to hide payload depth inside the original HTTP coverage percentages. Keep exercise coverage and contract-depth conformance as separate truths.
- The authoritative live HTTP analyzer proof remains `bash scripts/docs/verify-s02-analysis-path.sh`; the public `v1-e2e` bundle should be treated as the retained outward-facing artifact surface built around the same truth.
- If future work needs another red-path proof, reuse the exact live events from the happy path and change only the contract dimension being demonstrated.

### What’s fragile
- Public artifact naming is now part of the boundary: `out/yanote-report.json` must stay stable, and semantic-red proof should remain additive sidecars.
- A mounted task-local Gradle home cannot rely on absolute symlinks back into `~/.gradle`; copy wrapper distributions into the mounted home instead.
- `NO_DECLARED_CONTENT` is intentionally benign. Treating it as fail-closed would regress both live proof and public docs truth.

### Authoritative diagnostics
- `.gsd/milestones/M008/M008-VALIDATION.md` — fastest milestone-level truth source for success-criteria and definition-of-done audit.
- `bash scripts/docs/verify-s02-analysis-path.sh` — authoritative live recorder → analyzer → payload-matrix proof.
- `.yanote-ci/v1-e2e/out/yanote-report.json` — retained happy-path public artifact.
- `.yanote-ci/v1-e2e/semantic-red.stdout`, `.yanote-ci/v1-e2e/semantic-red.stderr`, and `.yanote-ci/v1-e2e/semantic-red-yanote-report.json` — retained proof that fully observed HTTP runs can still fail closed on payload semantics.

## Files Created/Modified

- `.gsd/milestones/M008/M008-SUMMARY.md` — recorded the milestone close-out, success-criteria audit, requirement outcomes, and downstream guidance.
- `scripts/ci/run-v1-e2e.sh` — fixed mounted Gradle-home preseed behavior so the public proof path can rerun reliably inside Docker-backed tests.
- `.gsd/REQUIREMENTS.md` — confirmed the M008 requirement transitions and corrected the carried-forward M007 async requirement statuses to match completed proof.
- `.gsd/PROJECT.md` — updated the project record to show M007 and M008 complete and to describe the current no-active-requirements state.
- `.gsd/KNOWLEDGE.md` — captured reusable lessons about observation-versus-conformance separation, additive proof sidecars, and Docker-mounted Gradle-home preseed behavior.
- `.gsd/STATE.md` — moved the worktree to milestone-complete state with no active milestone.
