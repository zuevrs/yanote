# S02: Header-backed correlation and reply truth — UAT

**Milestone:** M014
**Written:** 2026-03-26T11:47:26.613Z

# S02 UAT — Header-backed correlation and reply truth

## Preconditions
- Worktree: `/Users/zuevrs/Projects/yanote/.gsd/worktrees/M014`
- Node dependencies installed for `yanote-js`
- Built CLI available via `node yanote-js/dist/yanote.cjs` (`npm -C yanote-js run build`)
- Temp output directory available (examples below use `/tmp/yanote-m014-s02-uat`)

## Test Case 1 — Green path: retained headers prove both runtime semantics

**Goal:** Confirm a supported header-backed spec plus retained normalized header evidence produces full runtime proof without changing legacy coverage.

1. Run:
   ```bash
   rm -rf /tmp/yanote-m014-s02-uat/covered && mkdir -p /tmp/yanote-m014-s02-uat/covered
   node yanote-js/dist/yanote.cjs async-report \
     --spec yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml \
     --events yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl \
     --out /tmp/yanote-m014-s02-uat/covered \
     --profile local
   ```
   **Expected:** Exit code `0`.
2. Inspect stdout.
   **Expected:**
   - `status: ok`
   - `Runtime Semantics` section is present
   - `operations with runtime semantics: 1`
   - `satisfied semantics: 2`
   - `runtime proof coverage: 100.00%`
   - Per-operation detail shows `declaredChannel=orders.reply`
3. Inspect `/tmp/yanote-m014-s02-uat/covered/yanote-async-report.json`.
   **Expected:**
   - `status === "ok"`
   - `coverage.channels.percent`, `coverage.operations.percent`, and `coverage.messages.percent` remain `100`
   - `runtimeSemantics.summary.totalSemantics === 2`
   - `runtimeSemantics.summary.satisfiedSemantics === 2`
   - `runtimeSemantics.operations[0].reply.address.replyChannelAddress === "orders.reply"`
   - `runtimeSemantics.diagnostics.items` is empty
4. Inspect `/tmp/yanote-m014-s02-uat/covered/yanote-async-report.html`.
   **Expected:** HTML contains a Runtime Semantics section whose counts match the JSON report.

## Test Case 2 — Fail-closed runtime drift: missing, unavailable, and mismatched headers

**Goal:** Confirm runtime proof failures stay redaction-safe, keep legacy coverage green, and surface typed async semantic failures.

1. Run:
   ```bash
   rm -rf /tmp/yanote-m014-s02-uat/failures && mkdir -p /tmp/yanote-m014-s02-uat/failures
   node yanote-js/dist/yanote.cjs async-report \
     --spec yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml \
     --events yanote-js/test/fixtures/async-events/header-runtime-failures.fixture.jsonl \
     --out /tmp/yanote-m014-s02-uat/failures \
     --profile local
   ```
   **Expected:** Exit code `5`.
2. Inspect stderr.
   **Expected:**
   - Primary error code is `ASYNC_SEMANTIC_CORRELATION_ID_MISSING`
   - Secondary errors include `ASYNC_SEMANTIC_CORRELATION_ID_UNAVAILABLE`, `ASYNC_SEMANTIC_REPLY_ADDRESS_MISSING`, `ASYNC_SEMANTIC_REPLY_ADDRESS_UNAVAILABLE`, and `ASYNC_SEMANTIC_REPLY_ADDRESS_MISMATCH`
   - Error text does **not** echo retained values like `corr-runtime-mismatch` or `orders.deadletter`
3. Inspect stdout.
   **Expected:**
   - `status: partial`
   - Coverage dimensions still show `100.00% (COVERED)` for channels, operations, and messages
   - Runtime diagnostics show `missing=2 unavailable=2 unsupported=0 mismatched=1`
   - `YANOTE_ASYNC_SUMMARY` contains additive `runtime_*` tokens and `primary=ASYNC_SEMANTIC_CORRELATION_ID_MISSING`
4. Inspect `/tmp/yanote-m014-s02-uat/failures/yanote-async-report.json`.
   **Expected:**
   - `status === "partial"`
   - `runtimeSemantics.summary.satisfiedSemantics === 1`
   - `runtimeSemantics.summary.unsatisfiedSemantics === 1`
   - `runtimeSemantics.diagnostics.counts` equals `{ "missing": 2, "unavailable": 2, "unsupported": 0, "mismatched": 1 }`
   - Legacy coverage percentages remain `100`
5. Confirm redaction safety.
   **Expected:** Neither stdout, stderr, nor the generated JSON/HTML artifacts contain `corr-runtime-mismatch` or `orders.deadletter`.

## Test Case 3 — Unsupported runtime-expression subset still reports partial truth

**Goal:** Confirm supported-shape but unsupported runtime-expression locations fail closed through the same async-report surfaces.

1. Run:
   ```bash
   rm -rf /tmp/yanote-m014-s02-uat/unsupported && mkdir -p /tmp/yanote-m014-s02-uat/unsupported
   node yanote-js/dist/yanote.cjs async-report \
     --spec yanote-js/test/fixtures/asyncapi/header-runtime-unsupported-v3.yaml \
     --events yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl \
     --out /tmp/yanote-m014-s02-uat/unsupported \
     --profile local
   ```
   **Expected:** Exit code `5`.
2. Inspect stderr and JSON.
   **Expected:**
   - Stderr includes `ASYNC_SEMANTIC_CORRELATION_ID_UNSUPPORTED` and `ASYNC_SEMANTIC_REPLY_ADDRESS_UNSUPPORTED`
   - `/tmp/yanote-m014-s02-uat/unsupported/yanote-async-report.json` exists
   - Report `status === "partial"`
   - `runtimeSemantics.diagnostics.counts` equals `{ "missing": 0, "unavailable": 0, "unsupported": 2, "mismatched": 0 }`

## Test Case 4 — Malformed declaration shells fail before report generation

**Goal:** Confirm invalid header-backed declaration shells fail closed as spec-invalid errors and do not pretend to produce a report.

1. Run:
   ```bash
   rm -rf /tmp/yanote-m014-s02-uat/malformed && mkdir -p /tmp/yanote-m014-s02-uat/malformed
   node yanote-js/dist/yanote.cjs async-report \
     --spec yanote-js/test/fixtures/asyncapi/header-runtime-malformed-v3.yaml \
     --events yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl \
     --out /tmp/yanote-m014-s02-uat/malformed \
     --profile local
   ```
   **Expected:** Exit code `5`.
2. Inspect stderr and output directory.
   **Expected:**
   - Primary stderr code is `ASYNC_SEMANTIC_SPEC_INVALID`
   - Error text mentions non-empty runtime-expression path requirements for `correlationId` / `reply.address.location`
   - `/tmp/yanote-m014-s02-uat/malformed/yanote-async-report.json` does **not** exist because extraction failed before report generation

## Edge Checks
- Re-run Test Case 2 after `npm -C yanote-js run build`; results must stay deterministic.
- The canonical operation key must remain `kafka send orders.command` in all generated JSON/HTML/CLI surfaces.
- The green and red paths must keep `declaredSemantics` and `runtimeSemantics` visibly separate; runtime failures must not rewrite declared locations or legacy coverage numerators.

