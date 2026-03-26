---
id: T02
parent: S03
milestone: M014
provides: []
requires: []
affects: []
key_files: ["yanote-js/src/report/asyncReportHtml.ts", "yanote-js/src/cli.ts", "yanote-js/src/report/asyncReport.bindings.contract.test.ts", "yanote-js/src/cli.async-report.bindings.contract.test.ts", "yanote-js/src/cli.remote-spec.contract.test.ts", "yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl"]
key_decisions: ["Kept `YANOTE_ASYNC_SUMMARY` machine-safe by emitting only additive `binding_*` counts while preserving `report=.../yanote-async-report.json` as the canonical artifact pointer.", "Mirrored binding-support truth in human surfaces with a dedicated `Kafka Binding Support` section rather than folding it into coverage or declared/runtime semantics."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the focused slice verifier stack for report/CLI/local-remote bindings contracts, rebuilt the CLI, and executed the built `dist/yanote.cjs async-report` probe against the Kafka bindings matrix fixture plus the new async-events fixture. Confirmed that `yanote-async-report.json` contains `bindingSupport`, `yanote-async-report.html` contains `Kafka Binding Support`, and stdout ends with `YANOTE_ASYNC_SUMMARY ... report=.../yanote-async-report.json ... binding_*` while keeping machine tokens count-only."
completed_at: 2026-03-26T12:47:36.381Z
blocker_discovered: false
---

# T02: Surfaced the Kafka binding support matrix through async HTML, CLI stdout, and machine tokens while keeping report= JSON-centered.

> Surfaced the Kafka binding support matrix through async HTML, CLI stdout, and machine tokens while keeping report= JSON-centered.

## What Happened
---
id: T02
parent: S03
milestone: M014
key_files:
  - yanote-js/src/report/asyncReportHtml.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/report/asyncReport.bindings.contract.test.ts
  - yanote-js/src/cli.async-report.bindings.contract.test.ts
  - yanote-js/src/cli.remote-spec.contract.test.ts
  - yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl
key_decisions:
  - Kept `YANOTE_ASYNC_SUMMARY` machine-safe by emitting only additive `binding_*` counts while preserving `report=.../yanote-async-report.json` as the canonical artifact pointer.
  - Mirrored binding-support truth in human surfaces with a dedicated `Kafka Binding Support` section rather than folding it into coverage or declared/runtime semantics.
duration: ""
verification_result: passed
completed_at: 2026-03-26T12:47:36.382Z
blocker_discovered: false
---

# T02: Surfaced the Kafka binding support matrix through async HTML, CLI stdout, and machine tokens while keeping report= JSON-centered.

**Surfaced the Kafka binding support matrix through async HTML, CLI stdout, and machine tokens while keeping report= JSON-centered.**

## What Happened

Updated the async HTML renderer to add a dedicated Kafka Binding Support section with additive counts and per-operation rows for supported, declared-only, deferred, and invalid binding declarations. Extended `yanote async-report` stdout with the same section and added counts-only `binding_*` machine tokens on `YANOTE_ASYNC_SUMMARY` without pointing `report=` at HTML or changing legacy async coverage numerators. Added a focused CLI bindings contract, widened the remote-spec contract to exercise the binding matrix for local-file, local-directory, and remote-url inputs, and added a dedicated async-events fixture for the built CLI proof. The built `dist/yanote.cjs async-report` probe now shows the same Kafka binding story across JSON, HTML, and stdout; local profile still reports the expected coverage warning for the intentionally uncovered `users.lifecycle` operation, but the delivery path stays truthful and deterministic.

## Verification

Ran the focused slice verifier stack for report/CLI/local-remote bindings contracts, rebuilt the CLI, and executed the built `dist/yanote.cjs async-report` probe against the Kafka bindings matrix fixture plus the new async-events fixture. Confirmed that `yanote-async-report.json` contains `bindingSupport`, `yanote-async-report.html` contains `Kafka Binding Support`, and stdout ends with `YANOTE_ASYNC_SUMMARY ... report=.../yanote-async-report.json ... binding_*` while keeping machine tokens count-only.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/report/asyncReport.bindings.contract.test.ts src/cli.async-report.bindings.contract.test.ts src/cli.remote-spec.contract.test.ts && npm -C yanote-js run build` | 0 | ✅ pass | 1300ms |
| 2 | `rm -rf .tmp/m014-s03-bindings && node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml --events yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl --out .tmp/m014-s03-bindings --profile local | tee .tmp/m014-s03-bindings.stdout && test -f .tmp/m014-s03-bindings/yanote-async-report.json && rg -n '"bindingSupport"' .tmp/m014-s03-bindings/yanote-async-report.json && rg -n 'Kafka Binding Support' .tmp/m014-s03-bindings/yanote-async-report.html && rg -n 'YANOTE_ASYNC_SUMMARY .*report=.*/yanote-async-report.json .*binding_' .tmp/m014-s03-bindings.stdout` | 0 | ✅ pass | 800ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `yanote-js/src/report/asyncReportHtml.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/report/asyncReport.bindings.contract.test.ts`
- `yanote-js/src/cli.async-report.bindings.contract.test.ts`
- `yanote-js/src/cli.remote-spec.contract.test.ts`
- `yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl`


## Deviations
None.

## Known Issues
None.
