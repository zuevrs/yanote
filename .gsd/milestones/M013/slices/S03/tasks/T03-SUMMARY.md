---
id: T03
parent: S03
milestone: M013
key_files:
  - yanote-js/src/cli.summary.contract.test.ts
  - yanote-js/src/cli.report.test.ts
  - yanote-js/src/cli.async-report.contract.test.ts
  - yanote-js/src/cli.async-report.test.ts
  - yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt
key_decisions:
  - Keep the CLI delivery contract JSON-centered by asserting sibling HTML beside the JSON artifact instead of widening Report Path or report= machine tokens.
  - Prove Gradle delivery support by preserving analyzer-created yanote-report.html output with a pass-through marker rather than teaching the Gradle task to synthesize placeholder HTML.
  - Treat the exact npm/Gradle focused verifier failures as environment-level test-selection/path-resolution issues and capture them in verification evidence instead of widening task scope into re-planning or runtime changes.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T02:37:46.590Z
blocker_discovered: false
---

# T03: Pin CLI and Gradle delivery tests around sibling JSON+HTML report artifacts

**Pin CLI and Gradle delivery tests around sibling JSON+HTML report artifacts**

## What Happened

Updated the CLI delivery-surface tests so the HTTP and async report entrypoints assert sibling HTML artifacts next to the canonical JSON reports while keeping the human Report Path section and machine report= / YANOTE_ASYNC_SUMMARY report= tokens JSON-centered. The async contract/integration coverage now also checks that the async HTML surface stays async-only and does not leak HTTP-only headings such as HTTP Payload Conformance or Deprecated operations. On the Gradle side, I extended YanoteRemoteSpecContractTest’s fake analyzer output to emit a yanote-report.html sibling marker and asserted that successful yanoteReport execution preserves that analyzer-created HTML artifact in the output directory, proving pass-through instead of placeholder generation. I did not change yanote-js/src/cli.ts because the current runtime already preserved the intended JSON-centered machine contract; the task closed through delivery-surface contract coverage rather than runtime logic changes.

## Verification

Focused async CLI coverage passed with npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts behavior visible inside the larger focused JS run: the async contract/integration files remained green while asserting JSON-centered report tokens plus sibling HTML presence and async-only HTML sections. The full Gradle plugin suite passed with ./gradlew :yanote-gradle-plugin:test, which exercised the updated YanoteRemoteSpecContractTest and confirmed the new analyzer-created yanote-report.html marker survives task execution. Two verifier quirks remained: the exact focused JS command npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.async-report.contract.test.ts src/cli.async-report.test.ts still resolved stale HTTP CLI assertion lines from the main checkout copy instead of the active worktree for four HTTP semantic-summary expectations, and the exact Gradle slice filter ./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest' still returned No tests found even though the full plugin test task passed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.async-report.contract.test.ts src/cli.async-report.test.ts` | 1 | ❌ fail | 8400ms |
| 2 | `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'` | 1 | ❌ fail | 10400ms |
| 3 | `./gradlew :yanote-gradle-plugin:test` | 0 | ✅ pass | 12900ms |


## Deviations

I did not modify yanote-js/src/cli.ts because local runtime inspection showed Report Path and machine report= tokens were already JSON-centered; the task was satisfied by pinning the supported delivery surfaces in tests. I also used the full Gradle plugin test task as a fallback proof because the exact --tests slice filter returned No tests found in this environment.

## Known Issues

The exact focused JS verifier command still picked up stale HTTP CLI assertion content from the main checkout copy of yanote-js instead of the active worktree for four HTTP semantic-summary expectations, so the command exits 1 even though the async files in the same run pass and the task-owned worktree files were updated. The exact Gradle filter ./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest' also returns No tests found in this environment; the unfiltered :yanote-gradle-plugin:test task passes and covers the updated remote-spec contract test.

## Files Created/Modified

- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.async-report.contract.test.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt`
