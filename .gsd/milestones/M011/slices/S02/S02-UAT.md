# S02: Supported Serialization Subset And Cookie Conformance — UAT

**Milestone:** M011
**Written:** 2026-03-25

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: this slice’s contract is proved by a live Spring MVC request plus retained artifacts and CLI/report publication, so the right acceptance check is a repeatable runtime + artifact verification flow instead of manual UI review.

## Preconditions

- Run from the repository root with the M011 S02 changes present.
- Java, Node, npm, and the Gradle wrapper dependencies are available on the machine.
- No conflicting process is bound to the verifier’s chosen localhost port.
- If the tester wants to inspect the retained artifacts after the run, set `YANOTE_KEEP_TEMP=true` before invoking the verifier.

## Smoke Test

1. Run `bash scripts/ci/verify-m011-s02-request-semantics.sh`.
2. Wait for the script to build the focused Spring MVC assets, start the example service, execute the RestAssured proof, and run `yanote report`.
3. **Expected:** the script exits `0` and prints `Focused request-semantics verifier passed.`

## Test Cases

### 1. Supported repeated query-array semantics stay honest end to end

1. Run `bash scripts/ci/verify-m011-s02-request-semantics.sh`.
2. If `YANOTE_KEEP_TEMP=true` is set, open the retained `events.jsonl` and `yanote-report.json` paths printed by the script.
3. Inspect the retained request evidence for the focused tagged request.
4. **Expected:** `events.jsonl` shows `queryParams.tags` captured as the ordered values `["alpha", "bravo"]`, and `yanote-report.json` reports query parameter `tags` with `declaredSupport=supported`, `declaredSupportShape=array`, and a `captured-valid` request-conformance truth.

### 2. Unsupported request constructs fail closed through the normal governance path

1. Run `bash scripts/ci/verify-m011-s02-request-semantics.sh`.
2. If artifacts were retained, inspect `yanote-report.json`, `report.stdout`, and `report.stderr`.
3. Look for the focused query parameter `meta` in the request-conformance and governance output.
4. **Expected:** `yanote-report.json` marks `meta` as `declaredSupport=unsupported` with reason `schema`, request-conformance records it as `unsupported`, governance contains exactly `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER`, stdout Top Issues highlights that semantic failure, and stderr contains a single primary `YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER` line.

### 3. Public CLI/report surfaces stay secret-safe while JSON artifacts retain investigation detail

1. Run `bash scripts/ci/verify-m011-s02-request-semantics.sh`.
2. If artifacts were retained, inspect `events.jsonl`, `yanote-report.json`, `report.stdout`, and `report.stderr`.
3. Search for the live Authorization value, SESSION cookie value, and the retained request values `alpha`, `bravo`, and `opaque`.
4. **Expected:** the secret values never appear in `events.jsonl`, `yanote-report.json`, stdout, or stderr; retained non-secret request values may exist in `events.jsonl` / `yanote-report.json` for localization, but they do not appear in stdout or stderr.

## Edge Cases

### Deterministic mixed request semantics ordering

1. Run `npm -C yanote-js test -- src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts src/cli.failclosed.contract.test.ts`.
2. Review the passing assertions for mixed request/payload/gate failure ordering.
3. **Expected:** request-semantic failures sort ahead of payload semantics and generic threshold/regression failures, and duplicate request diagnostics are suppressed from CLI Top Issues when the typed semantic failure is already present.

### Green-path summary stability for fully valid request evidence

1. Run `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/coverage/httpRequestConformance.test.ts`.
2. Review the green-path request summary assertions.
3. **Expected:** fully valid request evidence keeps the CLI/request summary green, preserves request observation/truth rollups, and does not introduce secret leakage on public summary lines.

## Failure Signals

- The verifier script exits non-zero or does not print `Focused request-semantics verifier passed.`
- `yanote-report.json` does not contain `httpRequestConformance` summary/per-operation/diagnostic data for the focused request.
- `tags` is reconstructed incorrectly, missing, or not treated as a supported repeated array.
- `meta` does not fail closed as `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER`.
- stdout/stderr contains retained values or secret Authorization/SESSION content.
- Request-semantic failures appear after payload/gate failures or duplicate the same issue in Top Issues.

## Requirements Proved By This UAT

- R022 — Yanote now proves a truthful supported request-serialization subset, including honest repeated query-array handling and explicit unsupported request constructs, through retained runtime evidence.
- R002 — Unsupported request semantics now fail closed through typed governance and public CLI/report surfaces instead of yielding a false green result.
- R003 — The widened request truth is visible through the existing `yanote report` JSON/CLI path, including Top Issues, stderr semantic errors, and `YANOTE_SUMMARY`.

## Not Proven By This UAT

- S03 media-type specificity and format-policy behavior.
- S04 public docs/schema/CI closeout for the widened HTTP request semantics boundary.
- Support for delimiter-based arrays, parameter `content`, or non-whitelisted request serialization styles outside the published subset.

## Notes for Tester

- The focused verifier already checks the most important retained artifacts; rerunning it with `YANOTE_KEEP_TEMP=true` is the easiest way to inspect the exact `events.jsonl`, `yanote-report.json`, stdout, and stderr used for the assertions.
- The report itself remains `status: ok`; the fail-closed behavior is published through governance diagnostics and exit code `5`, which is expected for this unsupported request-semantics proof.
- If the verifier fails before the app becomes ready, inspect the retained build/app logs that the script prints when `YANOTE_KEEP_TEMP=true` is enabled.
