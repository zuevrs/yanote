# S06: Stabilize recorder readiness in final public-surface proof — UAT

**Milestone:** M016
**Written:** 2026-03-29T04:42:19.386Z

# S06 UAT — Stabilize recorder readiness in final public-surface proof

## Preconditions
- Work from the repository root of the M016 checkout.
- Java 21 and Node >=20 are available.
- No other process is intentionally binding random localhost ports used by the verifier.

## Test Case 1 — Focused recorder verifier passes on the real fixture
1. Run `bash scripts/docs/verify-s01-recorder-path.sh`.
   - **Expected:** The script publishes `yanote-core` and `yanote-recorder-spring-mvc`, starts the Spring smoke fixture, waits for `Waiting for Spring smoke fixture to open port <port>...`, then sends the proof request.
2. Observe the publish phase output.
   - **Expected:** The happy path either publishes immediately or prints at most one warning like `WARN: publishToMavenLocal attempt 1/2 failed; retrying...` before continuing.
3. Observe the final success line.
   - **Expected:** The script prints `Recorder proof passed: method=GET route=/orders/{orderId} status=200 service=recorder-spring-smoke ...` and exits 0.
4. If the run fails, inspect the emitted diagnostics.
   - **Expected:** The failure output names `readiness_port`, `temp_dir`, `publish_log`, `app_log`, `events_file`, and `response_file` so the owning failure surface is immediately inspectable.

## Test Case 2 — Recorder verifier contract guards pin retry and readiness behavior
1. Run `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs`.
   - **Expected:** All recorder verifier tests pass.
2. Review the test names in the output.
   - **Expected:** The suite explicitly covers: no dependence on `Started RecorderSmokeApplication`, success when the fixture serves without that log line, retry-once publish recovery, fail-closed final publish failure after the retry, port-timeout diagnostics, and early fixture-exit diagnostics.

## Test Case 3 — Full public-surface proof passes cold and on immediate rerun
1. Run `bash scripts/docs/verify-m016-s05-public-surface.sh`.
   - **Expected:** The script passes stages `S05-01` through `S05-12`, including `S05-06` for the recorder runtime proof.
2. Immediately rerun `bash scripts/docs/verify-m016-s05-public-surface.sh` from the same checkout.
   - **Expected:** The second run also passes all twelve stages without flaking in `S05-06`.
3. Inspect the combined output around `S05-06`.
   - **Expected:** The recorder stage still proves the live request/event contract and does not regress to a started-log gate.

## Test Case 4 — Maintainer rerun leaf matches the real recorder diagnostics
1. Open `docs/maintainers/public-surface-proof.md`.
   - **Expected:** The maintainer-only leaf describes the recorder stage as a deterministic localhost port-open readiness probe, not a Spring started-log grep.
2. Review the recorder-failure diagnostics section.
   - **Expected:** It names `readiness_port`, `temp_dir`, `publish_log`, `app_log`, `events_file`, and `response_file`, and notes that `publish_log` can contain retry attempt markers if the bounded publish retry had to absorb a transient Gradle daemon failure.
3. Run `node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`.
   - **Expected:** The contract test passes, confirming the maintainer leaf still references the canonical public-surface verifier and stays out of public onboarding docs.

## Edge checks
- A transient publish failure must be absorbed only once; repeated publish failures still fail closed with retained artifacts.
- If the fixture process exits before the port opens, the verifier must fail immediately instead of waiting for the full startup timeout.
- If the port never opens, the verifier must fail with the probed port number and retained artifact paths instead of claiming partial readiness.
- The first proof request after readiness must still be the request that produces the documented `events.jsonl` contract.
