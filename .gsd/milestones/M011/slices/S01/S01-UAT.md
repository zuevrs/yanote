# S01: Safe Request Evidence And First Scalar Truth — UAT

**Milestone:** M011
**Written:** 2026-03-25T15:27:49.007Z

# S01: Safe Request Evidence And First Scalar Truth — UAT

**Milestone:** M011
**Written:** 2026-03-25

## UAT Type

- UAT mode: mixed (artifact-driven + live-runtime)
- Why this mode is sufficient: The slice promise is an end-to-end recorder → JSONL → analyzer/report proof on retained artifacts, so a focused live request plus retained artifact inspection proves the shipped boundary more honestly than a UI-style walkthrough.

## Preconditions

- Java/Gradle and Node/npm are available in the repo environment.
- The example Spring MVC proof service can bind an ephemeral localhost port.
- `yanote-js` dependencies can be installed/built by the verifier script.
- For artifact inspection, run the verifier with `YANOTE_KEEP_TEMP=true` so `events.jsonl`, `yanote-report.json`, and CLI stdout are retained.

## Smoke Test

1. Run `bash scripts/ci/verify-m011-s01-request-evidence.sh`.
2. Confirm the command exits `0` and prints `Focused request-evidence verifier passed.`
3. **Expected:** The focused live proof route, analyzer, and report all succeed without any manual cleanup.

## Test Cases

### 1. Raw recorder artifact retains captured, redacted, and omitted request evidence honestly

1. Run `YANOTE_KEEP_TEMP=true bash scripts/ci/verify-m011-s01-request-evidence.sh`.
2. Open the retained `events.jsonl` path printed by the verifier.
3. Verify the focused event keeps the canonical templated route `/request-evidence/users/{userId}`.
4. Verify `pathParams.userId`, `queryParams.expand`, `requestHeaders.x-request-flavor`, and `cookies.clientMode` are `captured` with retained values.
5. Verify `queryParams.oversizedHint` is `omitted` with reason `oversized`.
6. Verify `requestHeaders.authorization` and `cookies.SESSION` are `redacted` with reason `sensitive`.
7. Verify `requestHeaders` does not contain `x-test-run-id`, `x-test-suite`, or `cookie`.
8. **Expected:** The raw recorder artifact proves captured/redacted/omitted request evidence without leaking the Authorization bearer token or SESSION cookie value.

### 2. `yanote-report.json` publishes first-scalar request truth on a dedicated surface

1. From the retained verifier bundle, open `report-out/yanote-report.json`.
2. Verify the top-level `httpRequestConformance.summary` reports `observedOperations = 1` and `observedParameters = 7`.
3. Verify `httpRequestConformance.summary.counts` equals `capturedValid=4`, `capturedInvalid=0`, `redacted=2`, `omitted=1`, `unsupported=0`.
4. Verify the per-parameter diagnostics cover `userId`, `expand`, `oversizedHint`, `Authorization`, `X-Request-Flavor`, `clientMode`, and `SESSION` with the expected truth states.
5. Verify legacy `coverage.operations`, `coverage.status`, and `coverage.parameters` remain `100%` on the focused proof.
6. **Expected:** The report publishes request-conformance truth additively, without redefining the existing coverage numerators.

### 3. CLI summary exposes the new request-conformance surface without leaking raw values

1. Open the retained `report.stdout` file from the verifier bundle.
2. Verify it contains an `HTTP Request Conformance` section.
3. Verify it contains a final `YANOTE_SUMMARY` line with `request_observed_operations=1`, `request_observed_parameters=7`, and request truth counters.
4. Verify the top issues mention `SESSION`, `Authorization`, and `oversizedHint` using sanitized summaries plus evidence reasons.
5. Verify the stdout file does **not** contain the raw Authorization token or raw SESSION cookie value.
6. **Expected:** Human-readable and machine-readable CLI surfaces expose the new request truth safely.

## Edge Cases

### Oversized query inputs stay visible as omission truth instead of silently disappearing

1. Inspect the retained `events.jsonl` and `yanote-report.json` artifacts from the focused verifier.
2. Verify `oversizedHint` is present as request evidence with omitted/oversized provenance and request-conformance truth `omitted`.
3. **Expected:** Oversized request input is surfaced as unavailable evidence, not counted as captured or silently dropped.

### Sensitive header/cookie inputs never leak into raw or public-facing artifacts

1. Search the retained `events.jsonl`, `yanote-report.json`, and `report.stdout` files for the proof Authorization token and SESSION cookie value.
2. Verify those raw secret values are absent from all retained artifacts.
3. **Expected:** Sensitive inputs appear only as `redacted` evidence with reason `sensitive`.

### Focused proof traffic is not polluted by undeclared readiness requests

1. Inspect the retained verifier bundle after a successful run.
2. Confirm there is exactly one tagged focused event for the proof route and no extra unmatched readiness traffic.
3. **Expected:** TCP readiness checks keep the focused bundle limited to declared proof traffic, so `yanote report` remains `ok` instead of `partial`.

## Failure Signals

- The Java verifier fails with `No tests found for given includes`, indicating the exact focused JUnit filter is no longer resolving the targeted classes.
- The Node verifier does not report all six focused test files passing.
- The end-to-end verifier exits non-zero, reports `partial`, or fails the raw `events.jsonl` / `yanote-report.json` Python assertions.
- Any retained artifact contains the Authorization bearer token or SESSION cookie secret.
- `HTTP Request Conformance` or the request summary tokens disappear from CLI stdout.

## Requirements Proved By This UAT

- R022 — Proves the first additive request-evidence increment: retained path/query/header/cookie evidence plus first-scalar request truth on a live Spring MVC route.
- R001 — Re-proves that the recorder → JSONL → analyzer → report path remains deterministic while the new request-conformance surface is added additively.

## Not Proven By This UAT

- Repeated-value array serialization truth and wider unsupported style/content diagnostics planned for S02.
- Format policy, media specificity, and unsupported/custom format truth planned for S03.
- Full public docs/CI closeout for the widened HTTP boundary planned for S04.

## Notes for Tester

- Prefer `YANOTE_KEEP_TEMP=true` when running this UAT so the retained artifacts can be inspected directly.
- The focused proof route intentionally echoes only safe booleans/lengths for sensitive and oversized inputs; absence of raw secrets in the retained artifacts is part of the acceptance criteria.
- Ambient safe request headers such as `accept`, `host`, and `user-agent` may still appear in raw recorder evidence; the acceptance check is that Yanote metadata headers and sensitive values do not leak into semantic/public surfaces.
