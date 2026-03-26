---
estimated_steps: 3
estimated_files: 6
skills_used:
  - vitest
  - java-junit
---

# T03: Pin CLI and Gradle delivery surfaces around sibling HTML artifacts

**Slice:** S03 — Static HTML Reports From Canonical HTTP And Async Truth
**Milestone:** M013

## Description

Close the supported-delivery boundary by proving real CLI runs emit sibling HTML while `Report Path` and machine tokens stay JSON-centered, and by pinning Gradle pass-through on successful analyzer execution without inventing stub HTML.

## Steps

1. Update CLI integration and summary tests to assert `report` and `async-report` write sibling `.html` files next to JSON, keep human `Report Path` plus `report=` / `YANOTE_ASYNC_SUMMARY report=` tokens pointed at the JSON artifact, and avoid cross-leaking HTTP-only sections into async output.
2. Extend the Gradle remote-spec contract test's fake analyzer output so a successful `yanoteReport` run also emits `yanote-report.html`, then assert the task leaves the sibling artifact in the output directory while skip/stub branches remain unchanged.
3. Make only the smallest `yanote-js/src/cli.ts` or delivery-surface adjustments needed to preserve the current JSON-centered machine contract while the new human artifact becomes reachable on real supported entrypoints.

## Must-Haves

- [ ] Real CLI tests prove sibling HTML exists for both HTTP and async commands without changing final machine-summary tokens.
- [ ] Gradle report execution keeps passing through analyzer-created HTML artifacts instead of inventing noncanonical placeholders.
- [ ] HTTP and async delivery surfaces remain separate; no combined report path, dashboard, or summary blending appears.

## Verification

- `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.async-report.contract.test.ts src/cli.async-report.test.ts`
- `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'`

## Observability Impact

- Signals added/changed: real CLI and Gradle tests now inspect sibling HTML artifacts in output directories in addition to JSON and summary text.
- How a future agent inspects this: rerun the focused CLI/Gradle tests and inspect generated output directories for `*.json` + `*.html` pairs.
- Failure state exposed: report-path drift, missing sibling HTML, or cross-surface leakage fails delivery-surface assertions immediately.

## Inputs

- `yanote-js/src/cli.ts` — real CLI summary/report-path surface that must stay JSON-centered.
- `yanote-js/src/cli.summary.contract.test.ts` — HTTP summary contract coverage for section order and machine tokens.
- `yanote-js/src/cli.report.test.ts` — real HTTP CLI integration coverage that should assert sibling HTML output.
- `yanote-js/src/cli.async-report.contract.test.ts` — async machine-summary boundary that must stay HTTP-separate.
- `yanote-js/src/cli.async-report.test.ts` — real async CLI integration coverage for sibling HTML output.
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt` — supported Gradle entrypoint contract that can pin analyzer-created sibling artifacts.

## Expected Output

- `yanote-js/src/cli.summary.contract.test.ts` — HTTP summary tests that keep `Report Path` / `report=` JSON-centered while sibling HTML exists.
- `yanote-js/src/cli.report.test.ts` — real HTTP CLI tests asserting `yanote-report.html` is written beside JSON.
- `yanote-js/src/cli.async-report.contract.test.ts` — async summary tests proving no HTTP/combined-report leakage.
- `yanote-js/src/cli.async-report.test.ts` — real async CLI tests asserting `yanote-async-report.html` is written beside JSON.
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt` — Gradle contract tests proving successful report runs preserve analyzer-created sibling HTML artifacts.
- `yanote-js/src/cli.ts` — CLI output logic adjusted only if needed to preserve the existing JSON-centered machine contract.
