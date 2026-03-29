---
id: S04
parent: M015
milestone: M015
provides:
  - A deterministic collected-artifact and summary-rendering surface for Kafka, RabbitMQ, and combined proof families, including `protocols=amqp`, optional-companion handling, and combined child-path attribution.
  - A stable required-check topology where `build-and-test` enforces Kafka, RabbitMQ, and combined proofs in one job while still publishing separate collected summaries and fail-closed exit codes.
  - Public docs, requirements/support wording, and support intake that align to the widened proof bundles and tell operators exactly which retained/collected artifacts to inspect or attach.
requires:
  - slice: S02
    provides: The retained `.yanote-ci/live-rabbitmq-proof/` canonical async bundle, `protocols=amqp` truth, and RabbitMQ optional-companion boundary exported by the live Spring AMQP proof path.
  - slice: S03
    provides: The retained `.tmp/m015-s03-combined-proof/` bundle plus the child-attributed combined JSON/HTML/CLI contract and explicit HTTP/async child-path model.
affects:
  []
key_files:
  - scripts/ci/collect-yanote-artifacts.sh
  - scripts/ci/collect-yanote-artifacts.test.mjs
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/render-yanote-summary.test.mjs
  - .github/workflows/yanote-ci.yml
  - scripts/ci/yanote-ci-workflow.contract.test.mjs
  - .github/BRANCH_PROTECTION.md
  - README.md
  - docs/README.md
  - examples/README.md
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
  - docs/requirements.md
  - SUPPORT.md
  - scripts/docs/verify-m015-s04-delivery-surfaces.sh
key_decisions:
  - Preserved legacy `async_bundle_*` collected-artifact fields as Kafka aliases while adding explicit `rabbitmq_bundle_*` and `combined_bundle_*` metadata so older CI consumers do not break during the widened rollout.
  - Kept `build-and-test` as the stable required GitHub Actions job and widened it in place with Kafka, RabbitMQ, and combined proof steps plus collected-summary publication and proof-specific exit-code enforcement.
  - Documented the combined-report surface as a child-attributed additive proof family and kept support intake surface-specific so operators attach Kafka, RabbitMQ, or combined bundles according to the failing path instead of flattening evidence into one denominator.
  - Validated R021 on current HEAD once the first RabbitMQ/AMQP path survived collected CI artifacts, GitHub summaries, public docs, and support intake rather than remaining a Kafka-only boundary.
patterns_established:
  - When widening an existing collected-artifact contract, keep legacy manifest keys as aliases and add new proof-family metadata beside them so existing consumers survive while newer summaries localize drift per family.
  - Render CI/GitHub summaries from canonical retained bundle artifacts and source-path notes instead of hand-maintained text so `protocols=amqp`, child paths, and artifact truth remain synchronized.
  - Keep combined delivery and support surfaces child-attributed: manifests, summaries, and support intake should point back to canonical HTTP and async child reports rather than flattening them into one troubleshooting bundle.
  - For RabbitMQ/AMQP delivery surfaces, keep Kafka-only companion artifacts explicit as `optional missing` / `none` instead of fabricating parity files or silently omitting the boundary.
observability_surfaces:
  - `artifact-manifest.txt` / `artifact-source-paths.txt` in collected bundles now publish explicit `rabbitmq_bundle_*` and `combined_bundle_*` metadata, including `protocols=amqp` and combined child-report paths.
  - `scripts/ci/render-yanote-summary.mjs` now renders a RabbitMQ async summary with `protocols: amqp`, optional Kafka-only companion absence markers, binding/declared/runtime-semantic lines, and fail-closed malformed-bundle handling.
  - The combined collected summary now publishes child statuses, `async protocols: amqp`, explicit combined JSON/HTML artifact paths, and explicit HTTP/async child JSON/HTML drill-down paths instead of a blended denominator.
  - The `build-and-test` enforcement step now logs proof-specific failure messages for Kafka, RabbitMQ, combined, and delivery-proof drift, then exits with the first failing proof's exit code.
  - `scripts/docs/verify-m015-s04-delivery-surfaces.sh` acts as a focused public-boundary drift alarm for bundle names, rerun commands, and the no-dashboard/no-blended-denominator/no-broker-agnostic clauses.
drill_down_paths:
  - .gsd/milestones/M015/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M015/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M015/slices/S04/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T23:14:24.830Z
blocker_discovered: false
---

# S04: CI, docs, and support closure for widened async and combined reporting

**Closed M015's widened async/combined delivery boundary by carrying RabbitMQ and combined proof families through collected artifacts, the stable `build-and-test` workflow, and public docs/support surfaces without losing HTTP-vs-async attribution.**

## What Happened

S04 finished M015's implementation work by carrying the widened async and combined-report contracts into the exact delivery/support seams operators already trust. T01 extended `scripts/ci/collect-yanote-artifacts.sh` and `scripts/ci/render-yanote-summary.mjs` so collected bundles now retain `live-rabbitmq-proof/` and `combined-proof/` beside the legacy Kafka and HTTP families, keep the legacy `async_bundle_*` fields as Kafka aliases, and publish explicit `rabbitmq_bundle_*` / `combined_bundle_*` metadata plus source-path breadcrumbs. The renderer now surfaces `protocols: amqp`, keeps RabbitMQ Kafka-only companions explicit as optional missing rather than fabricated, and fails closed when combined child attribution, bundle shape, or report files drift.

T02 kept the repository's required-check topology stable while widening it in place. `.github/workflows/yanote-ci.yml` still exposes the existing `build-and-test` job as the delivery proof surface, but it now runs the live Kafka proof, live RabbitMQ proof, and combined proof in dependency order, records each exit code, always collects artifacts, renders separate redaction-safe summaries from deterministic collected paths, and then fails closed with proof-specific messages/exit codes. The workflow contract suite and `.github/BRANCH_PROTECTION.md` now pin that topology so future drift cannot silently rename required checks or hide a failing proof family behind a generic CI result.

T03 closed the outward-facing boundary. README/docs/examples landings, the AsyncAPI guide, release/support wording, the public requirements surface, and `SUPPORT.md` now tell one truthful story: Kafka, RabbitMQ, and combined bundles are current additive proof families; combined-report stays child-attributed; and the explicit no-dashboard, no blended denominator, and no broker-agnostic promise clauses remain visible. Support intake now asks for the retained bundle that matches the failing surface, and for combined issues it points operators back to the referenced HTTP and async child reports instead of asking them to reconstruct or flatten one denominator.

For closeout observability, I also ran a local collection/render pass against the retained artifacts. `.tmp/s04-closeout-artifacts/artifact-manifest.txt` showed `rabbitmq_bundle_report_status=ok`, `rabbitmq_bundle_report_protocols=amqp`, `combined_bundle_status=ok`, `combined_bundle_http_status=ok`, `combined_bundle_async_status=ok`, and preserved both combined child-report paths. The rendered RabbitMQ summary showed optional Kafka-only companions as `optional missing`, while the rendered combined summary kept `async protocols: amqp` and explicit HTTP/async drill-down paths. That means the slice did not just update tests and docs; it also proved the diagnostic surfaces operators actually read still work on the assembled retained bundles.

## Operational Readiness (Q8)
- **Health signal:** collected manifests and rendered summaries show `rabbitmq_bundle_report_status=ok`, `rabbitmq_bundle_report_protocols=amqp`, `combined_bundle_status=ok`, and present JSON/HTML artifact pairs for RabbitMQ and combined bundles.
- **Failure signal:** `render-yanote-summary.mjs` fails closed on malformed bundle families, the workflow enforcement step returns the failing proof's exit code, and GitHub/markdown summaries keep proof-specific redaction-safe breadcrumbs instead of collapsing failures into one generic CI error.
- **Recovery procedure:** rerun the source proof family in dependency order (`bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh`, `bash scripts/ci/verify-m015-s03-combined-report.sh` as needed), then rerun `bash scripts/ci/collect-yanote-artifacts.sh <dest>` and the relevant `node scripts/ci/render-yanote-summary.mjs ...` invocation or the focused verifier suites.
- **Monitoring gaps:** there is still no hosted dashboard or blended cross-surface denominator; operators must inspect the separate collected bundles and, for combined failures, the referenced child reports. RabbitMQ remains the first concrete AMQP path, and AMQP runtime semantics stay explicit zero/none rather than Kafka parity.

## Verification

Slice-plan verification passed on current HEAD:
- `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs` ✅ passed (12 tests; 375 ms wall clock in closeout verification).
- `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` ✅ passed (18 tests; 186 ms wall clock in closeout verification).
- `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh` ✅ passed (126 ms wall clock in closeout verification).
- Additional observability confirmation also passed: `bash scripts/ci/collect-yanote-artifacts.sh .tmp/s04-closeout-artifacts` plus two `node scripts/ci/render-yanote-summary.mjs ...` runs produced collected RabbitMQ and combined summaries with `protocols: amqp`, optional-companion handling, `combined_bundle_status=ok`, and explicit HTTP/async child paths.

## Requirements Advanced

- R003 — S04 carried the widened delivery surface through the existing CLI/CI/documentation topology: the stable `build-and-test` job now enforces Kafka, RabbitMQ, and combined proofs, collected artifacts publish deterministic bundle metadata, and public docs/support surfaces describe the same artifact paths and rerun commands.
- R020 — S04 promoted the combined-report contract from an internal/CLI proof into collected CI summaries, branch-protection wording, public docs, and support intake while preserving explicit child attribution and avoiding any blended cross-surface denominator.
- R021 — S04 closed the first non-Kafka delivery boundary by publishing the retained RabbitMQ/AMQP bundle and the child-attributed combined bundle through collected CI artifacts, GitHub summaries, public docs, and support intake.

## Requirements Validated

- R021 — Validated on current HEAD via `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs`, `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs`, and `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh`, plus a closeout collection/render pass that produced `rabbitmq_bundle_report_status=ok`, `rabbitmq_bundle_report_protocols=amqp`, `combined_bundle_status=ok`, and explicit combined child-report paths in `.tmp/s04-closeout-artifacts/`.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

- `build-and-test` now enforces Kafka, RabbitMQ, and combined proof results, but it still depends on the upstream proof scripts generating their retained bundles successfully.
- RabbitMQ remains the first concrete AMQP path only; S04 does not broaden the product to a broker-agnostic contract.
- The combined surface stays intentionally child-attributed and does not publish a blended HTTP plus async denominator or hosted dashboard.
- RabbitMQ collected summaries intentionally show Kafka-only companion artifacts as explicit optional absences rather than fabricating parity files.

## Follow-ups

- Use this slice summary plus the retained/collected bundles during M015 milestone validation and closeout.
- Treat broader broker expansion or AMQP runtime-semantic parity as separate future work; S04 closes only the first RabbitMQ/AMQP delivery boundary.
- Keep future combined-surface work child-attributed and bundle-specific instead of reintroducing a blended denominator or dashboard promise.

## Files Created/Modified

- `scripts/ci/collect-yanote-artifacts.sh` — Widened collected-artifact retention to copy RabbitMQ and combined proof families, preserve Kafka alias fields, and publish explicit rabbitmq/combined manifest metadata plus source-path breadcrumbs.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — Pinned the widened collector inventory, RabbitMQ optional-companion behavior, and combined bundle manifest/source-path assertions.
- `scripts/ci/render-yanote-summary.mjs` — Rendered RabbitMQ and combined collected summaries with protocols=amqp, child-path attribution, and fail-closed malformed-bundle diagnostics.
- `scripts/ci/render-yanote-summary.test.mjs` — Updated and widened summary-renderer coverage so async protocol lines and combined summary/failure surfaces stay mechanically pinned.
- `.github/workflows/yanote-ci.yml` — Kept the stable build-and-test job while adding live RabbitMQ and combined proof steps, collected summary publication, and per-proof exit-code enforcement.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — Pinned the widened workflow topology, collected summary paths, and enforcement behavior for Kafka + RabbitMQ + combined proof coverage.
- `.github/BRANCH_PROTECTION.md` — Updated required-check documentation to describe the widened proof stack without renaming build-and-test or implying a blended dashboard.
- `README.md` — Aligned the primary public landing with Kafka, RabbitMQ, and combined retained/collected bundle paths and rerun commands.
- `docs/README.md` — Aligned the docs landing with the widened async/combined proof families and the additive no-dashboard/no-blended-denominator boundary.
- `examples/README.md` — Aligned the examples landing and the async guide to the retained RabbitMQ and combined proof bundles plus their rerun commands.
- `docs/guides/asyncapi-kafka.md` — Updated the AsyncAPI guide to describe RabbitMQ/AMQP and combined proof bundles, retained artifact names, and explicit protocol-scoped boundaries.
- `docs/release-and-support.md` — Aligned release/support boundary text, public requirements wording, and support intake with the widened proof families and surface-specific bundle requests.
- `docs/requirements.md` — Promoted the widened Kafka/RabbitMQ/combined delivery surface to current support wording while preserving explicit scope limits.
- `SUPPORT.md` — Updated support intake so operators attach the Kafka, RabbitMQ, or combined bundle that matches the failing surface, plus referenced child reports for combined failures.
- `scripts/docs/verify-m015-s04-delivery-surfaces.sh` — Added a focused doc verifier that pins widened delivery wording, retained bundle names, rerun commands, and anti-drift boundary clauses.
