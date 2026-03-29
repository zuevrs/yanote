---
estimated_steps: 4
estimated_files: 7
skills_used:
  - debug-like-expert
  - java-gradle
---

# T03: Route Gradle and CI validation through the standalone launcher contract

**Slice:** S01 — Standalone analyzer shipping contract
**Milestone:** M016

## Description

Keep existing Gradle and CI delivery surfaces truthful by consuming the same standalone launcher contract instead of separately documented raw `yanote.cjs` paths. This preserves validated delivery behavior while aligning internal automation with the public analyzer surface.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `scripts/ci/run-yanote-gradle-check.sh` | Fail the helper with a clear missing-launcher message and keep command-args surfaces | Do not silently rerun `npm -C yanote-js ...` as a hidden fallback | Reject malformed analyzer-path overrides before invoking Gradle tasks |
| `yanote-gradle-plugin` tasks | Missing standalone launcher must fail or stub exactly as the contract says; no implicit raw-CJS fallback | Long analyzer runs should still leave `yanote-*-command.args` and output dirs inspectable | Malformed override paths should surface typed Gradle diagnostics rather than hanging |

## Load Profile

- **Shared resources**: staged standalone bundle, helper fixture project, plugin output dirs, and command-args surfaces.
- **Per-operation cost**: one bundle staging task plus one helper-driven Gradle run.
- **10x breakpoint**: repeated bundle staging and fixture Gradle invocations dominate before analyzer execution.

## Negative Tests

- **Malformed inputs**: missing launcher path, override pointing at a directory, or override pointing back to a stale raw CJS file.
- **Error paths**: helper runs without the bundle, plugin error messages still instruct source-built `yanote-js` commands, or args surfaces leak the old raw path.
- **Boundary conditions**: default launcher path works, explicit `analyzerPath` override still works, and remote-spec/report flows remain supported.

## Steps

1. Change the default analyzer path in the Gradle plugin and CI helper to the standalone launcher path from T01 while keeping explicit overrides possible.
2. Update missing-runtime diagnostics and command-args surfaces so they reference the standalone bundle contract rather than `dist/node-analyzer/bin/yanote.cjs`.
3. Extend Gradle plugin tests to prove the launcher path, override path, and remote-spec flows still work through the new contract.
4. Keep required CI contract tests aligned with the helper's new launcher path and build task.

## Must-Haves

- [ ] Gradle and CI consumers no longer make the raw `yanote.cjs` seam the default public contract.
- [ ] Missing-bundle diagnostics point future agents to the standalone bundle staging step and launcher path.
- [ ] Existing Gradle validation capabilities still work with the new launcher contract.

## Verification

- `./gradlew :yanote-gradle-plugin:test && bash scripts/ci/run-yanote-gradle-check.sh && node --test scripts/ci/yanote-ci-workflow.contract.test.mjs`
- Expect Gradle/plugin tests plus the real helper flow to succeed through the standalone launcher path.

## Observability Impact

- Signals added/changed: default analyzer-path diagnostics, `yanote-*-command.args`, and CI contract tests now point at the standalone launcher contract.
- How a future agent inspects this: run the helper, inspect the generated args files and output dirs, and use plugin tests to localize default-path vs override-path drift.
- Failure state exposed: missing launcher, bad override handling, or helper/workflow drift becomes attributable before release/docs work depends on it.

## Inputs

- `scripts/ci/run-yanote-gradle-check.sh` — current helper that stages and runs Yanote validation.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — CI workflow/helper contract coverage.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt` — default analyzer-path wiring.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt` — blocking Gradle validation task.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt` — report-only Gradle validation task.
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt` — existing plugin contract coverage for remote spec flows.
- `dist/standalone-analyzer/bin/yanote` — staged launcher path from T01 that should become the default contract.

## Expected Output

- `scripts/ci/run-yanote-gradle-check.sh` — helper aligned to the standalone launcher.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — CI contract pinned to the new helper/build path.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt` — plugin defaults aligned to the standalone launcher.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt` — blocking task diagnostics/path handling updated.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt` — report task diagnostics/path handling updated.
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt` — existing contract coverage updated for the new default path.
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteStandaloneBundleContractTest.kt` — focused plugin coverage for the standalone bundle contract.
