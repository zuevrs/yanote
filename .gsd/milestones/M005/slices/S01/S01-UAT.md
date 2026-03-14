# S01: Async Onboarding And Boundary Truth — UAT

**Milestone:** M005
**Written:** 2026-03-14 13:24:57 +0300

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: S01 primarily ships docs and shell verifiers, but it also claims an inspectable async failure-diagnostics surface via the retained-failure Kafka proof. The slice is only trustworthy if both the doc contracts and that failure-path proof are observable.

## Preconditions

- Run from the Yanote repo root.
- `bash`, `git`, and `rg` are available.
- For the retained-failure proof case, Java 21, Node/npm, Gradle, Docker/Testcontainers-compatible runtime, and the repo’s normal live Kafka proof prerequisites are available.
- Do not edit the public async surfaces while running the checks.

## Smoke Test

Run the two slice-owned doc verifiers:

```bash
bash scripts/docs/verify-m005-s01-async-path.sh
bash scripts/docs/verify-m005-s01-async-boundaries.sh
```

Expected: both commands exit 0. The first confirms discoverability and placement from the landings into the async guide; the second confirms the shared first-wave async boundary and support-artifact wording across the owner/support surfaces.

## Test Cases

### 1. Canonical async path is discoverable from the main landings

1. Run:
   ```bash
   bash scripts/docs/verify-m005-s01-async-path.sh
   ```
2. Open `README.md` and `docs/README.md` and confirm the async branch is visible in the primary user-facing sections, not buried in maintainer/fallback sections.
3. Confirm the user-facing copy names the separate `async-report` command and `yanote-async-report.json` artifact.
4. **Expected:** the verifier passes and both landings visibly route a new engineer from the main onboarding flow to `docs/guides/asyncapi-kafka.md` without replacing the existing HTTP-first path.

### 2. The guide and owner surfaces tell one honest first-wave async story

1. Run:
   ```bash
   bash scripts/docs/verify-m005-s01-async-boundaries.sh
   ```
2. Inspect `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md`.
3. Confirm all four surfaces repeat the same first-wave boundary truth: Kafka-only, Spring Kafka-first, separate async report/gate, no payload-schema enforcement yet, and no broker-agnostic promise.
4. Confirm the support-oriented surfaces name the required async intake artifacts: raw or merged async JSONL, `yanote-async-report.json`, and analyzer/proof `stderr` logs.
5. **Expected:** the verifier passes and no public owner/support surface contradicts the guide on scope, deferred work, or required proof artifacts.

### 3. Existing landing and boundary contracts stay green after the async additions

1. Run:
   ```bash
   bash scripts/docs/verify-s03-landing.sh
   bash scripts/docs/verify-s04-boundaries.sh
   bash scripts/docs/verify-s01-doc-links.sh
   bash scripts/docs/verify-s02-doc-links.sh
   git diff --check
   ```
2. Review the command output for any regressions outside the new async surfaces.
3. **Expected:** all commands exit 0. The pre-existing landing, release/support, recorder-guide, analyzer-guide, and diff/whitespace contracts remain intact after the S01 edits.

### 4. Async retained-failure diagnostics stay inspectable after raw evidence and merge checks

1. Run:
   ```bash
   bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure
   ```
2. Confirm the command exits non-zero.
3. Inspect the output and confirm it contains:
   - `YANOTE_ASYNC_SUMMARY`
   - `YANOTE_ASYNC_ERROR`
   - retained artifact paths for the single-service log, two-service log, producer/consumer JSONL, merged JSONL, async stdout/stderr, and `yanote-async-report.json`
4. **Expected:** the command fails only at the simulated analyzer stage, after raw-evidence and merge assertions have completed, and it preserves the async diagnostic artifacts needed for local or CI triage.

## Edge Cases

### Landing pointer exists but is misplaced

1. Move the async guide link in `README.md` or `docs/README.md` out of the primary onboarding section while keeping the link somewhere else in the file.
2. Run:
   ```bash
   bash scripts/docs/verify-m005-s01-async-path.sh
   ```
3. **Expected:** the verifier fails and localizes the problem as a discoverability/placement regression, not as a missing-guide-content regression.

### One owner/support surface drops an async artifact clause

1. Remove one of the required async support artifacts from `SUPPORT.md`, `docs/release-and-support.md`, or `docs/requirements.md`.
2. Run:
   ```bash
   bash scripts/docs/verify-m005-s01-async-boundaries.sh
   ```
3. **Expected:** the verifier fails and names the exact surface plus the missing artifact clause.

### Async proof command loses retained-failure signals

1. Run:
   ```bash
   bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure
   ```
2. Check whether the output still includes `YANOTE_ASYNC_SUMMARY`, `YANOTE_ASYNC_ERROR`, and retained artifact paths.
3. **Expected:** if any of those signals are missing, treat the slice as regressed even if the command still exits non-zero.

## Failure Signals

- `bash scripts/docs/verify-m005-s01-async-path.sh` reports missing or misplaced async discoverability in `README.md` or `docs/README.md`.
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh` reports missing Kafka-only / Spring Kafka-first / separate async-report wording, missing deferred-scope clauses, or missing async support-intake artifacts.
- `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, `bash scripts/docs/verify-s01-doc-links.sh`, or `bash scripts/docs/verify-s02-doc-links.sh` fail after async doc edits.
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure` stops before the analyzer stage or fails to print the retained artifact paths and `YANOTE_ASYNC_*` lines.
- `git diff --check` reports whitespace or conflict-marker problems.

## Requirements Proved By This UAT

- R047 — Proves that a new engineer can discover the supported AsyncAPI/Kafka path, understand its honest first-wave limits, and find the right proof/support artifacts from the public repo surfaces.

## Not Proven By This UAT

- R048 — This slice does not yet prove the final CI-grade composed acceptance runner or the async-aware GitHub artifact/summary contract; that belongs to M005/S02.
- Payload validation against AsyncAPI message schemas, combined HTTP+async reporting, and non-Kafka/broker-agnostic support are intentionally not proven here.

## Notes for Tester

- The live failure-path proof is expected to fail; for this case the acceptance signal is the presence and quality of the retained diagnostics, not a zero exit code.
- If the doc verifiers fail, fix the named surface first instead of editing multiple docs speculatively — both new verifiers are intentionally surface-aware.
- Keep the HTTP-first onboarding intact while validating async discoverability; S01 adds a branch, not a replacement path.
