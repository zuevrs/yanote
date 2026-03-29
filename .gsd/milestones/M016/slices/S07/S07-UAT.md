# S07: Recorder bootstrap hardening for final public-surface proof — UAT

**Milestone:** M016
**Written:** 2026-03-29T08:10:23.736Z

# S07: Recorder bootstrap hardening for final public-surface proof — UAT

**Milestone:** M016
**Written:** 2026-03-29

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: this slice changed both live runtime proof behavior and maintainer-facing contract surfaces, so the right acceptance check is a mix of contract tests plus the real recorder and full public-surface verifier runs.

## Preconditions

- Run from the M016 worktree root.
- Java, Node.js, curl, and the Gradle wrapper are available.
- `build/distributions/yanote-analyzer.zip` exists. If it is missing in a fresh worktree, regenerate it first with `./gradlew distStandaloneAnalyzer --stacktrace`.

## Smoke Test

Run:

```bash
node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs
```

The smoke passes when all 10 contract tests are green and the output includes the recorder failure-path assertions for retry exhaustion and readiness failures.

## Test Cases

### 1. Focused recorder bootstrap proof stays stable without Plugin Portal refresh dependence

1. Run `bash scripts/docs/verify-s01-recorder-path.sh`.
2. Wait for the script to publish local artifacts, start the smoke fixture, and send the proof request.
3. **Expected:** the script prints `Recorder proof passed: method=GET route=/orders/{orderId} status=200 ...`, creates writable `events.jsonl` evidence, and does not require `--refresh-dependencies` or a `Started RecorderSmokeApplication` log match to declare readiness.

### 2. Full public-surface proof passes from the current checkout

1. Run `bash scripts/docs/verify-m016-s05-public-surface.sh`.
2. Watch the delegated stages from `S05-01` through `S05-12`.
3. **Expected:** every stage prints `<== [S05-0N] ok`, `S05-06` passes through the focused recorder proof, `S05-07` passes through the analyzer archive proof, and the command ends with `M016 S05 public-surface proof passed: ...`.

### 3. Immediate rerun stays green in the same checkout

1. Run `bash scripts/docs/verify-m016-s05-public-surface.sh` again immediately after test case 2.
2. Watch `S05-06` and `S05-07` closely.
3. **Expected:** the second run also reaches `M016 S05 public-surface proof passed: ...`; the recorder stage starts and proves successfully without falling back to Plugin Portal refresh behavior, and the analyzer stage still finds the standalone archive contract.

## Edge Cases

### Fresh-worktree analyzer archive precondition

1. Check whether `build/distributions/yanote-analyzer.zip` exists.
2. If it does not, run `./gradlew distStandaloneAnalyzer --stacktrace`, then rerun `bash scripts/docs/verify-m016-s05-public-surface.sh`.
3. **Expected:** the archive is created locally and `S05-07` can pass from the documented standalone analyzer bundle.

## Failure Signals

- `ERROR [publish]`, `ERROR [bootRun]`, `ERROR [readiness]`, `ERROR [request]`, or `ERROR [validation]` from `scripts/docs/verify-s01-recorder-path.sh`.
- Missing retained bootstrap breadcrumbs such as `publish_log`, `app_log`, `events_file`, or `response_file` after a recorder-stage failure.
- `FAIL [S05-0N]` from `bash scripts/docs/verify-m016-s05-public-surface.sh`, which identifies the exact delegated owner stage to rerun.
- `S05-07` failing because `build/distributions/yanote-analyzer.zip` is absent.

## Not Proven By This UAT

- It does not prove that the final public-surface verifier self-builds a missing standalone analyzer archive; that is still a precondition in a fresh worktree.
- It does not replace the release tag / GitHub-hosted publication path; it relies on the local retained release-pipeline proof already wired into `S05-12`.

## Notes for Tester

If the recorder stage fails, rerun `bash scripts/docs/verify-s01-recorder-path.sh` directly before touching broader S05 surfaces. The recorder verifier's retained fields (`readiness_port`, `temp_dir`, `gradle_home`, `publish_log`, `app_log`, `events_file`, `response_file`) are the authoritative first place to localize bootstrap drift. If only `S05-07` fails in a fresh worktree, rebuild `yanote-analyzer.zip` before assuming the public-surface contract itself regressed.
