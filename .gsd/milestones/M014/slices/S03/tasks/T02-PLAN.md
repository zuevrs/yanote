---
estimated_steps: 4
estimated_files: 7
skills_used:
  - debug-like-expert
  - vitest
---

# T02: Surface the Kafka binding support matrix through HTML and CLI delivery paths

**Slice:** S03 — Kafka binding support matrix without false green
**Milestone:** M014

## Description

Close the supported delivery path once `bindingSupport` exists in canonical JSON. Mirror the same support matrix in async HTML and `yanote async-report` output, extend local/remote contract coverage, and prove the built CLI still keeps `report=yanote-async-report.json` while showing supported, declared-only, and deferred binding rows consistently.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Binding-support JSON DTO plus HTML/CLI/local-remote delivery formatting | Keep `yanote-async-report.json` canonical, do not point `report=` at HTML, and avoid synthetic “supported” wording if formatting fails. | Treat CLI delivery as blocked and rely on focused contract tests instead of emitting ambiguous partial summaries. | Malformed matrix rows or unknown support states must fail deterministic contract tests rather than leaking contradictory HTML/CLI output. |

## Load Profile

- **Shared resources**: HTML section rendering, stdout summary buffers, machine-token formatting, and supported local/remote spec-source handling.
- **Per-operation cost**: Re-render one binding-support row across JSON, HTML, stdout, and machine summary surfaces.
- **10x breakpoint**: Very large binding matrices stress human-readable summary size and deterministic ordering before serialization cost becomes meaningful.

## Negative Tests

- **Malformed inputs**: Missing `bindingSupport` sections, unknown support-status values, and malformed remote-spec responses reaching the widened formatter path.
- **Error paths**: `local-file`, `local-directory`, and `remote-url` modes plus the built CLI entrypoint must present the same matrix and keep `report=` JSON-centered.
- **Boundary conditions**: Topic-only bindings, deferred-only bindings, and operations with no bindings should all render deterministic rows and counts without raw schema blobs in machine tokens.

## Steps

1. Update `yanote-js/src/report/asyncReportHtml.ts` so async HTML mirrors the canonical `bindingSupport` matrix without implying coverage or broker breadth beyond Kafka.
2. Extend `yanote-js/src/cli.ts` with a `Kafka Binding Support` section plus additive counts-only `binding_*` machine tokens while keeping `YANOTE_ASYNC_SUMMARY` JSON-centered and `report=` pointed at `yanote-async-report.json`.
3. Add `yanote-js/src/cli.async-report.bindings.contract.test.ts`, widen `yanote-js/src/cli.remote-spec.contract.test.ts`, and add `yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl` so local and remote delivery paths exercise the same matrix.
4. Build the CLI and run a direct `dist/yanote.cjs async-report` probe against the binding fixture to confirm JSON, HTML, stdout, and machine tokens tell the same story.

## Must-Haves

- [ ] HTML and CLI surfaces mirror JSON `bindingSupport` truth and keep `report=` pointed at `yanote-async-report.json`.
- [ ] Human output distinguishes supported, declared-only, and deferred Kafka bindings without synthetic coverage claims or raw schema blobs in machine tokens.
- [ ] Local and remote-spec contract tests plus the built CLI probe prove the widened delivery path is deterministic.

## Verification

- `npm -C yanote-js test -- src/report/asyncReport.bindings.contract.test.ts src/cli.async-report.bindings.contract.test.ts src/cli.remote-spec.contract.test.ts && npm -C yanote-js run build`
- `rm -rf .tmp/m014-s03-bindings && node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml --events yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl --out .tmp/m014-s03-bindings --profile local | tee .tmp/m014-s03-bindings.stdout && test -f .tmp/m014-s03-bindings/yanote-async-report.json && rg -n '"bindingSupport"' .tmp/m014-s03-bindings/yanote-async-report.json && rg -n 'Kafka Binding Support' .tmp/m014-s03-bindings/yanote-async-report.html && rg -n 'YANOTE_ASYNC_SUMMARY .*report=.*/yanote-async-report.json .*binding_' .tmp/m014-s03-bindings.stdout`

## Observability Impact

- Signals added/changed: HTML, stdout, and `YANOTE_ASYNC_SUMMARY` gain binding-support counts and per-operation detail rows.
- How a future agent inspects this: rerun the binding-specific CLI/remote tests, then compare `.tmp/m014-s03-bindings/yanote-async-report.json`, `.html`, and `.stdout` from the built-CLI probe.
- Failure state exposed: section-order drift, report-path drift, remote-spec divergence, or contradictory support-status wording fails focused contract tests with the broken surface identified.

## Inputs

- `yanote-js/src/report/asyncReport.ts` — canonical JSON `bindingSupport` DTO from T01.
- `yanote-js/src/report/asyncSchema.ts` — report contract that HTML/CLI must keep JSON-centered.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic ordering reused by downstream delivery surfaces.
- `yanote-js/src/report/asyncReportHtml.ts` — async HTML renderer that must mirror the new matrix.
- `yanote-js/src/cli.ts` — supported `async-report` entrypoint and machine-summary formatter.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — local/remote spec-source contract guard to widen intentionally.
- `yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml` — binding-rich AsyncAPI fixture the delivery path must expose consistently.

## Expected Output

- `yanote-js/src/report/asyncReportHtml.ts` — HTML renderer updated with a Kafka binding support section.
- `yanote-js/src/report/asyncReport.bindings.contract.test.ts` — report/HTML assertions widened for the binding-support matrix.
- `yanote-js/src/cli.ts` — CLI summary/detail formatting widened with binding-support rows and additive machine tokens.
- `yanote-js/src/cli.async-report.bindings.contract.test.ts` — CLI contract assertions for section order, machine tokens, and JSON-centered report-path behavior.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — remote-spec assertions proving supported spec-source modes keep the same binding-support story.
- `yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl` — dedicated event fixture for the built-CLI binding-support probe.
