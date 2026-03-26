# S01: Trait-aware declared semantics on async-report — UAT

**Milestone:** M014
**Written:** 2026-03-26T05:40:14.410Z

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S01 only widens canonical AsyncAPI extraction and async-report delivery surfaces; no live broker or human UX behavior changed, so artifact parity across JSON/HTML/CLI is the truthful acceptance surface.

## Preconditions

- Run `npm -C yanote-js run build` from the repo root.
- Create a temporary events file containing one Kafka send event for `orders.command` / `OrderCommand` with `correlation_id` and `reply_to` headers.
- Use the shipped fixtures `yanote-js/test/fixtures/asyncapi/trait-declarations-inline-v3.yaml` and `yanote-js/test/fixtures/asyncapi/trait-declarations-trait-v3.yaml`.

## Smoke Test

Run `node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/trait-declarations-inline-v3.yaml --events <events.jsonl> --out <out-dir> --profile local`.

Expected quick check:
- Exit code is `0`.
- `<out-dir>/yanote-async-report.json` and `<out-dir>/yanote-async-report.html` both exist.
- Stdout contains a `Declared Semantics` section and a final `YANOTE_ASYNC_SUMMARY` line.

## Test Cases

### 1. Inline-declared semantics appear additively in all async-report surfaces

1. Run the built CLI against `trait-declarations-inline-v3.yaml` with the prepared `events.jsonl`.
2. Open `yanote-async-report.json` and inspect `declaredSemantics.summary` and `declaredSemantics.operations[0]`.
3. Open `yanote-async-report.html` and inspect the `Declared semantics` section.
4. Inspect stdout and the final `YANOTE_ASYNC_SUMMARY` line.
5. **Expected:**
   - JSON shows `totalOperations: 1`, `operationsWithCorrelationId: 1`, `messageCorrelationIds: 1`, and `operationsWithReply: 1`.
   - JSON operation entry keeps `operationKey` exactly `kafka send orders.command`.
   - HTML contains the declared correlation location `$message.header#/correlation_id` and declared reply location `$message.header#/reply_to`.
   - Stdout shows the same declared-semantics counts and the per-operation detail line `kafka send orders.command: correlationId=OrderCommand@$message.header#/correlation_id; reply=$message.header#/reply_to`.
   - The machine summary includes `declared_operations=1`, `declared_correlation_operations=1`, `declared_correlation_messages=1`, and `declared_reply_operations=1` while `report=` still points to `yanote-async-report.json`.

### 2. Trait-applied declarations normalize identically to inline declarations

1. Run the built CLI against `trait-declarations-inline-v3.yaml` and save `yanote-async-report.json`.
2. Run the same command against `trait-declarations-trait-v3.yaml` using the identical `events.jsonl`.
3. Compare the two reports’ `declaredSemantics`, `summary`, and `coverage` sections.
4. **Expected:**
   - `declaredSemantics` is byte-for-byte equivalent between inline and trait fixtures.
   - Coverage summaries remain identical between the two reports.
   - Both reports keep the same canonical `operationKey` (`kafka send orders.command`) rather than encoding trait metadata into the key.

## Edge Cases

### Async report with no declared semantics stays explicit and quiet

1. Run the built CLI against a fixture with no declared `correlationId` or `reply` metadata, such as `yanote-js/test/fixtures/asyncapi/v3.yaml`, with matching async evidence.
2. Inspect stdout and `YANOTE_ASYNC_SUMMARY`.
3. **Expected:**
   - The `Declared Semantics` section still appears.
   - Stdout reports `operations with declarations: 0` and `details: none`.
   - `YANOTE_ASYNC_SUMMARY` reports all `declared_*` counters as `0`.
   - Existing coverage percentages and diagnostic counts remain unchanged apart from the absence of declared-semantics entries.

### Retained header values are not echoed on human or machine report surfaces

1. Use the same `events.jsonl` with concrete header values like `corr-123` and `reply-orders`.
2. Inspect stdout, `YANOTE_ASYNC_SUMMARY`, and `yanote-async-report.html`.
3. **Expected:**
   - Location strings are shown, but raw retained header values never appear on stdout, in machine summary tokens, or in the HTML artifact.

## Failure Signals

- Inline and trait fixtures produce different `declaredSemantics` content or different coverage summaries.
- Any output changes the canonical operation key away from `kafka <action> <channel>`.
- `yanote-async-report.json` omits the `declaredSemantics` section or the HTML artifact lacks the `Declared semantics` section.
- Stdout or HTML contains raw header values from retained Kafka evidence.
- `report=` points to HTML or another non-JSON artifact instead of `yanote-async-report.json`.

## Requirements Proved By This UAT

- R025 — supported richer AsyncAPI declarations normalize truthfully across inline and trait-applied Kafka contracts and remain visible on the additive async-report delivery surfaces.
- R003 — the supported CLI/report delivery path still exposes the widened async semantics through JSON, HTML, and machine-readable summary output.

## Not Proven By This UAT

- Runtime truth for declared `correlationId` / `reply.address` against retained Kafka headers.
- Kafka binding support-matrix behavior and fail-closed unsupported-binding handling.
- Live Spring Kafka retained-proof, CI summary rendering, and public docs/support alignment for the widened async surface.

## Notes for Tester

Treat `yanote-async-report.json` as the authoritative automation artifact. The HTML file and stdout are additive human-review surfaces only. When comparing inline vs trait fixtures, compare the `declaredSemantics`, `summary`, and `coverage` sections rather than timestamp fields or file paths.
