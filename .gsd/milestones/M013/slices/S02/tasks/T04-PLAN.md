---
estimated_steps: 5
estimated_files: 5
skills_used:
  - bash-scripting
---

# T04: Lock the slice demo behind a retained deprecated-operations proof

**Slice:** S02 — Deprecated Operation Truth Without Numerator Drift
**Milestone:** M013

## Description

Close the slice with a rerunnable proof that uses the real supported CLI path and captures artifacts showing deprecated truth without denominator drift.

## Steps

1. Write `scripts/ci/verify-m013-s02-deprecated-operations.sh` so it runs the built CLI against the dedicated deprecated fixture, captures stdout/report artifacts into `.yanote-ci/deprecated-operations-proof/`, and fails if legacy `covered`/`operations` drift away from `2/3`.
2. Assert inside the proof that report JSON contains `summary.deprecatedOperations` and per-operation `deprecated` flags, stdout contains the deprecated summary line and machine tokens, and no async/dashboard artifacts are introduced.
3. Add `scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` to pin the proof bundle layout and retained claims for future reruns.

## Must-Haves

- [ ] The proof uses the real CLI entrypoint rather than a unit-test-only helper.
- [ ] Retained artifacts make deprecated counts and denominator stability obvious from one inspection.
- [ ] The proof remains HTTP-only and does not widen into async or dashboard/report-surface work.

## Verification

- `bash scripts/ci/verify-m013-s02-deprecated-operations.sh`
- `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs`

## Observability Impact

- Signals added/changed: retained proof bundle with captured JSON report, stdout summary, and manifest entries for deprecated-operation evidence.
- How a future agent inspects this: open `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt`, `.yanote-ci/deprecated-operations-proof/cli-report/stdout.txt`, and `.yanote-ci/deprecated-operations-proof/cli-report/out/yanote-report.json` after rerunning the proof script.
- Failure state exposed: denominator drift or missing deprecated report/summary fields fails the proof with a localized retained artifact trail.

## Inputs

- `scripts/ci/verify-m013-s01-remote-spec.sh` — existing retained-proof pattern to mirror for manifest layout and artifact capture conventions.
- `scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs` — prior proof contract style to mirror for stable retained-bundle assertions.
- `yanote-js/src/cli.ts` — real CLI entrypoint the proof must exercise.
- `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml` — dedicated deprecated-operation spec fixture created earlier in the slice.
- `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl` — retained evidence fixture proving denominator stability.

## Expected Output

- `scripts/ci/verify-m013-s02-deprecated-operations.sh` — rerunnable proof script for the deprecated-operations CLI demo.
- `scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` — proof contract test pinning retained bundle structure and claims.
- `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt` — retained manifest of deprecated-operation proof artifacts.
- `.yanote-ci/deprecated-operations-proof/cli-report/out/yanote-report.json` — retained canonical report showing additive deprecated truth and preserved denominator math.
- `.yanote-ci/deprecated-operations-proof/cli-report/stdout.txt` — retained CLI summary output with deprecated line and machine tokens.
