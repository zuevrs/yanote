---
id: S03
parent: M014
milestone: M014
provides:
  - Truthful additive Kafka binding support classification on canonical async contracts without changing canonical operation keys or legacy async coverage numerators.
  - Dedicated binding-support visibility across async JSON, HTML, CLI stdout, and machine summary tokens.
  - A repeatable built-CLI proof path that demonstrates supported, declared-only, and deferred Kafka binding rows without false-green semantics.
  - Recorded decisions and knowledge about JSON-centered machine summaries, dedicated human-facing binding sections, and the expected partial-status local-profile verifier behavior.
requires:
  - slice: S01
    provides: Canonical Kafka operation contracts with trait-aware declared-semantics scaffolding, stable `kafka <action> <channel>` identities, and the additive async report wiring that S03 widened with binding support.
affects:
  - S04
key_files:
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/spec/asyncapi.bindings.test.ts
  - yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncSchema.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/report/asyncReport.bindings.contract.test.ts
  - yanote-js/src/report/writeAsyncReport.determinism.test.ts
  - yanote-js/src/report/asyncReportHtml.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/cli.async-report.bindings.contract.test.ts
  - yanote-js/src/cli.remote-spec.contract.test.ts
  - yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl
  - .gsd/DECISIONS.md
  - .gsd/KNOWLEDGE.md
  - .gsd/PROJECT.md
key_decisions:
  - D053: Keep Kafka binding support additive so no binding field rewrites canonical `kafka <action> <channel>` identity or legacy coverage numerators.
  - D054: Store flat `bindingSupport` rows on `KafkaOperationContract` and derive report `bindingSupport` JSON directly from those contracts.
  - D055: Keep `YANOTE_ASYNC_SUMMARY` JSON-centered by leaving `report=` on `yanote-async-report.json` and publishing only additive `binding_*` counts in machine tokens.
  - D056: Mirror binding truth on human-facing surfaces with a dedicated `Kafka Binding Support` section instead of folding it into coverage or declared/runtime semantics.
patterns_established:
  - Carry additive Kafka binding truth on canonical operation contracts, then derive JSON/HTML/CLI output from that one source instead of reparsing bindings independently per surface.
  - Keep machine summaries JSON-centered and counts-only while giving human surfaces a dedicated binding matrix section with per-operation supported / declared-only / deferred / invalid rows.
  - Verify binding-matrix behavior with the built `dist/yanote.cjs` CLI and accept `status: partial` under `--profile local` when the fixture intentionally leaves an operation uncovered; the proof target is truthful artifact output, not a synthetic all-green run.
observability_surfaces:
  - `report.bindingSupport.summary` and `report.bindingSupport.operations[]` in `yanote-async-report.json`.
  - Async HTML `Kafka Binding Support` section mirroring the canonical JSON matrix.
  - `yanote async-report` stdout `Kafka Binding Support` block with additive counts and per-operation detail lines.
  - `YANOTE_ASYNC_SUMMARY` additive `binding_*` machine tokens while keeping `report=` pointed at `yanote-async-report.json`.
  - Regenerated `.tmp/m014-s03-bindings/` proof artifacts (`yanote-async-report.json`, `yanote-async-report.html`, and stdout sidecar) for slice-level closeout verification.
drill_down_paths:
  - .gsd/milestones/M014/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M014/slices/S03/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T12:52:05.948Z
blocker_discovered: false
---

# S03: Kafka binding support matrix without false green

**Closed the Kafka binding matrix slice by publishing truthful additive binding-support classification across canonical contracts, JSON/HTML/CLI surfaces, and machine tokens without changing canonical `kafka <action> <channel>` identities or legacy async coverage numerators.**

## What Happened

## Delivered

S03 completed the Kafka binding support matrix promised in M014 without widening Yanote into synthetic async coverage. The slice retained additive `bindingSupport` rows on canonical `KafkaOperationContract` records, classified Kafka binding fields into supported-now, declared-only, deferred, and invalid buckets, and threaded that same truth into `yanote-async-report.json`, async HTML, CLI stdout, and `YANOTE_ASYNC_SUMMARY` machine tokens. The supported subset stays intentionally narrow: `channel.bindings.kafka.topic` is surfaced as supported metadata, `operation.groupId` / `operation.clientId` / message `key` stay explicit declared-only truth, and partitions / replicas / topicConfiguration plus schema-registry fields remain visibly deferred.

Just as importantly, the slice preserved the earlier async contract boundaries. Canonical operation identity stayed `kafka <action> <channel>`, legacy channel/operation/message coverage numerators stayed unchanged, and binding support remained additive rather than being folded into coverage or runtime semantics. Human-facing surfaces now show a dedicated `Kafka Binding Support` section with per-operation rows, while machine-facing output stays JSON-centered: `report=` still points at `yanote-async-report.json`, and the summary line only adds counts-style `binding_*` tokens.

## Closeout / auto-fix outcome

The verification gate failure on this auto-fix attempt was artifact-level, not a code regression: `.tmp/m014-s03-bindings/` was absent, so the expected JSON/HTML grep checks had nothing to inspect. I reran the exact slice-level verifier stack from the M014 worktree, rebuilt the CLI, regenerated `.tmp/m014-s03-bindings/yanote-async-report.json` and `.html`, and reconfirmed the required binding matrix signals. The expected result remains `status: partial` under `--profile local` because the fixture intentionally leaves `users.lifecycle` uncovered; the important proof is that the report artifacts are written, the binding matrix is present, and no binding field creates false-green coverage.

## Operational Readiness (Q8)

- **Health signal:** `node yanote-js/dist/yanote.cjs async-report ... --profile local` writes sibling `yanote-async-report.json` and `yanote-async-report.html`, stdout includes a `Kafka Binding Support` block, and `YANOTE_ASYNC_SUMMARY` ends with additive `binding_operations`, `binding_total`, `binding_supported`, `binding_declared_only`, `binding_deferred`, and `binding_invalid` tokens while keeping `report=` pointed at the JSON artifact.
- **Failure signal:** Missing `.tmp/.../yanote-async-report.json` or `.html`, absent `bindingSupport` in JSON, absent `Kafka Binding Support` in HTML/stdout, or machine output that drops the `binding_*` tokens or repoints `report=` away from the JSON artifact.
- **Recovery procedure:** Rebuild with `npm -C yanote-js run build`, rerun the exact binding-matrix CLI probe against `kafka-bindings-matrix-v3.yaml` and `kafka-bindings.fixture.jsonl`, then inspect the generated JSON/HTML/stdout trio to confirm the support counts and per-operation rows are back.
- **Monitoring gaps:** The support matrix is still intentionally narrow and declaration-oriented. Only topic metadata is supported today; groupId/clientId/key remain declaration-only, partitions/replicas/topicConfiguration/schema-registry fields remain deferred, and authoritative live Spring Kafka proof/docs/CI closeout still belongs to S04.

## Verification

Executed the full slice verifier stack from `/Users/zuevrs/Projects/yanote/.gsd/worktrees/M014` and reran the exact artifact-producing proof after the gate failure:

- `npm -C yanote-js test -- src/report/asyncReport.bindings.contract.test.ts src/cli.async-report.bindings.contract.test.ts src/cli.remote-spec.contract.test.ts`
- `npm -C yanote-js run build`
- `rm -rf .tmp/m014-s03-bindings && node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml --events yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl --out .tmp/m014-s03-bindings --profile local | tee .tmp/m014-s03-bindings.stdout && test -f .tmp/m014-s03-bindings/yanote-async-report.json && rg -n '"bindingSupport"' .tmp/m014-s03-bindings/yanote-async-report.json && rg -n 'Kafka Binding Support' .tmp/m014-s03-bindings/yanote-async-report.html && rg -n 'YANOTE_ASYNC_SUMMARY .*report=.*/yanote-async-report.json .*binding_' .tmp/m014-s03-bindings.stdout`

The verifier stack passed. The rebuilt CLI probe regenerated the missing `.tmp/m014-s03-bindings/` artifacts, confirmed `bindingSupport` in JSON, confirmed `Kafka Binding Support` in HTML, and confirmed the JSON-centered `YANOTE_ASYNC_SUMMARY ... report=.../yanote-async-report.json ... binding_*` contract. The probe remains truthfully `status: partial` because the fixture intentionally leaves one async operation uncovered under the local profile.

## Requirements Advanced

- R025 — Published a truthful Kafka binding support matrix across canonical contracts plus async JSON/HTML/CLI surfaces, extending richer AsyncAPI semantics without widening beyond the current provable Kafka-first boundary.
- R002 — Made binding support explicit as supported, declared-only, deferred, or invalid instead of silently omitting unsupported fields or turning declaration-only metadata into false-green coverage.
- R003 — Delivered the binding matrix through the real standalone CLI path, generated report artifacts, and machine summary tokens rather than leaving it test-only or internal.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

No product-scope deviation. Closeout only needed to regenerate the missing `.tmp/m014-s03-bindings/` proof artifacts and document the expected `status: partial` local-profile behavior for the intentionally uncovered binding-matrix fixture.

## Known Limitations

Kafka binding support is still intentionally scoped: only `channel.bindings.kafka.topic` is supported now; `groupId`, `clientId`, and message `key` are declaration-only; partitions, replicas, topicConfiguration, and schema-registry fields remain deferred; and the binding matrix is proven on deterministic fixtures today rather than the authoritative live Spring Kafka bundle. The local-profile proof fixture also stays `partial` by design because `users.lifecycle` is intentionally uncovered.

## Follow-ups

S04 should carry the new binding matrix into the authoritative Spring Kafka proof bundle, public docs, CI summaries, and milestone closeout verifiers while preserving the JSON-centered `report=` contract and the no-false-green boundary.

## Files Created/Modified

- `yanote-js/src/model/operationKey.ts` — Preserved canonical `kafka <action> <channel>` identity while widening additive binding metadata.
- `yanote-js/src/spec/asyncapi.ts` — Extracted and classified Kafka binding fields into supported, declared-only, deferred, and invalid rows on canonical operation contracts.
- `yanote-js/src/spec/asyncapi.bindings.test.ts` — Added focused extraction tests for the Kafka binding support matrix.
- `yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml` — Added the AsyncAPI fixture that declares the supported, declared-only, and deferred Kafka binding cases proved by the slice.
- `yanote-js/src/report/asyncReport.ts` — Published additive `bindingSupport` summary and per-operation rows in the canonical async JSON report.
- `yanote-js/src/report/asyncSchema.ts` — Extended the async report schema to validate the new `bindingSupport` contract.
- `yanote-js/src/report/asyncNormalize.ts` — Normalized binding-support output deterministically for report artifacts.
- `yanote-js/src/report/asyncReport.bindings.contract.test.ts` — Locked JSON and HTML binding-support contract expectations to the canonical report output.
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts` — Protected deterministic async artifact generation after adding binding-support sections.
- `yanote-js/src/report/asyncReportHtml.ts` — Rendered the dedicated `Kafka Binding Support` HTML section from the canonical report DTO.
- `yanote-js/src/cli.ts` — Added CLI binding-support output and additive `binding_*` machine summary tokens while keeping `report=` JSON-centered.
- `yanote-js/src/cli.async-report.bindings.contract.test.ts` — Added CLI contract coverage for the new binding-support stdout and machine-summary surfaces.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — Extended local/remote async CLI contract coverage to include the binding matrix surfaces.
- `yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl` — Added the async-events fixture used by the built CLI proof for the binding matrix.
- `.gsd/DECISIONS.md` — Recorded the new binding-support reporting decisions (D055-D056) during slice closeout.
- `.gsd/KNOWLEDGE.md` — Captured the expected partial-status local-profile verifier behavior for the binding-matrix proof.
- `.gsd/PROJECT.md` — Updated project state to show M014 S03 complete and S04 remaining.
