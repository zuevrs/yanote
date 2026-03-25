# S03: Format Policy And Media Specificity Truth — UAT

**Milestone:** M011
**Written:** 2026-03-25T18:25:39.736Z

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S03 changes analyzer/report/CLI semantics only; no new runtime or recorder behavior was introduced, so retained OpenAPI + JSONL fixtures and the real `yanote report` entrypoint are the authoritative proof surface.

## Preconditions

- Node dependencies are installed in `yanote-js` and `yanote-js/dist/yanote.cjs` can be built locally.
- The shared fixtures exist at `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml` and `yanote-js/test/fixtures/events/`.
- Run from the repository worktree root so relative verifier paths resolve.

## Smoke Test

1. Run `bash scripts/ci/verify-m011-s03-format-media.sh`.
2. Confirm the script prints four verified scenarios (`valid-format`, `invalid-format`, `unsupported-format`, `media-specificity`) and ends with `S03 retained format/media verifier passed.`
3. **Expected:** the green email scenario exits cleanly, the red scenarios fail closed with the expected semantic outcomes, and the verifier does not report missing report artifacts.

## Test Cases

### 1. Supported allowlisted format stays green

1. Run `node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-payload-format-media.yaml --events yanote-js/test/fixtures/events/http-payload-valid-format.fixture.jsonl --out /tmp/yanote-s03-valid --profile local`.
2. Open `/tmp/yanote-s03-valid/yanote-report.json` and inspect `httpPayloadConformance.diagnostics.items`.
3. **Expected:** the request and response diagnostics for `http POST /subscribers` both have `code: VALID`, `observedMediaType: application/json`, governance has no `SEMANTIC_HTTP_*` payload code, and stdout includes one `YANOTE_SUMMARY` line with `primary=none`.

### 2. Invalid email format fails as INVALID_BODY

1. Run `node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-payload-format-media.yaml --events yanote-js/test/fixtures/events/http-payload-invalid-format.fixture.jsonl --out /tmp/yanote-s03-invalid --profile local`.
2. Capture stderr and inspect `/tmp/yanote-s03-invalid/yanote-report.json`.
3. **Expected:** the command exits with code `5`; stderr contains `YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_INVALID_BODY`; the request diagnostic for `http POST /verifications` has `code: INVALID_BODY` and the Ajv error `/email must match format "email"`; Top Issues shows the typed semantic failure once without echoing the raw email value.

### 3. Unsupported/custom schema format fails closed explicitly

1. Run `node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-payload-format-media.yaml --events yanote-js/test/fixtures/events/http-payload-unsupported-format.fixture.jsonl --out /tmp/yanote-s03-unsupported --profile local`.
2. Inspect stderr and `/tmp/yanote-s03-unsupported/yanote-report.json`.
3. **Expected:** the command exits with code `5`; stderr contains `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT`; the request diagnostic for `http POST /custom-format` has `code: UNSUPPORTED_SCHEMA_FORMAT`, `state: SKIPPED`, `observedMediaType: application/json`, and an error naming the unsupported format `yanote-customer-id`; stdout Top Issues contains the typed semantic failure once and does not leak the observed `externalId` value.

### 4. Most-specific media declaration wins over wildcard sibling

1. Run `node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-payload-format-media.yaml --events yanote-js/test/fixtures/events/http-payload-media-specificity.fixture.jsonl --out /tmp/yanote-s03-media --profile local`.
2. Inspect `/tmp/yanote-s03-media/yanote-report.json` and CLI stdout/stderr.
3. **Expected:** the command exits with code `5`; the request diagnostic for `http POST /incidents` uses `observedMediaType: application/problem+json` and `code: INVALID_BODY` with `/ must have required property 'detail'`; no payload diagnostic claims a matched media type of `application/*+json`; the response remains `VALID`; Top Issues and stderr identify `SEMANTIC_HTTP_INVALID_BODY` as the primary failure.

## Edge Cases

### No raw payload value leakage on human-facing surfaces

1. Re-run the invalid-format, unsupported-format, and media-specificity commands while capturing stdout and stderr.
2. Search the outputs for fixture payload values such as `not-an-email`, `cust-123`, `storage outage`, or `Ticket created`.
3. **Expected:** stdout/stderr never echo those raw payload values; only schema paths, format names, media types, and typed semantic codes appear. Raw values remain absent from the CLI surfaces even when the JSON report carries detailed diagnostic structure.

### Declared media ordering remains stable even though matching changed

1. Inspect `httpPayloadConformance.perOperation[].response.declaredContent` for the `/incidents` operation in the generated report.
2. Compare the listed declared media types with the OpenAPI fixture order and with the matched request diagnostic.
3. **Expected:** the declared media lists remain deterministically sorted for reporting, while the matched request diagnostic still chooses the specific `application/problem+json` contract during evaluation.

## Failure Signals

- `bash scripts/ci/verify-m011-s03-format-media.sh` fails to build `yanote-js`, fails to emit `yanote-report.json`, or reports a scenario assertion failure.
- `yanote report` exits `0` for the invalid-email or unsupported-format fixtures.
- `yanote-report.json` omits `UNSUPPORTED_SCHEMA_FORMAT`, omits matched `observedMediaType`, or reports `application/*+json` as the winning media type for `/incidents`.
- CLI stdout/stderr duplicates raw payload diagnostics or leaks raw payload values.

## Requirements Proved By This UAT

- R022 — proves that retained HTTP/OpenAPI evidence now supports truthful payload-format and media-specificity semantics through analyzer, report, and CLI outputs.
- R002 — proves invalid/unsupported payload semantics fail closed with deterministic typed governance codes.
- R003 — proves the standard `yanote report` CLI surface publishes the richer payload truth without needing a new user entrypoint.

## Not Proven By This UAT

- Expansion beyond the current allowlisted payload format subset (`email` only today).
- Public docs/CI/schema closeout work scheduled for S04.
- Any new live recorder/runtime behavior; S03 intentionally changes analyzer/report/CLI semantics only.

## Notes for Tester

If a scenario fails, rerun with `YANOTE_KEEP_TEMP=true bash scripts/ci/verify-m011-s03-format-media.sh` so the script retains per-scenario stdout, stderr, exit-code, and `yanote-report.json` artifacts for direct comparison. Use the retained report JSON as the source of truth for whether the analyzer, governance mapper, or CLI renderer drifted.
