---
estimated_steps: 3
estimated_files: 1
skills_used:
  - bash-scripting
---

# T05: Prove format policy and media specificity with a retained analyzer verifier

**Slice:** S03 — Format Policy And Media Specificity Truth
**Milestone:** M011

## Description

Close the slice with one retained proof script that exercises the real `yanote report` entrypoint. The verifier should prove the green path and the new red paths without mutating the stable live-service bundle.

## Steps

1. Add `scripts/ci/verify-m011-s03-format-media.sh` to build `yanote-js`, run `yanote report` against the shared S03 fixtures, and assert valid-format green behavior plus invalid-email, unsupported-format, and media-specificity outcomes.
2. Check `yanote-report.json`, stdout, stderr, and exit codes for each scenario so the retained bundle localizes analyzer-vs-report-vs-CLI drift.
3. Retain high-signal temp artifacts on failure and keep the verifier focused on fixture-backed analyzer truth instead of mutating the existing example-service denominator.

## Must-Haves

- [ ] The verifier proves a valid supported-format case stays green.
- [ ] The verifier proves invalid email, unsupported/custom format, and most-specific media selection on the real `yanote report` entrypoint.
- [ ] Failure artifacts make it obvious whether drift came from analyzer logic, report serialization, or CLI surfacing.

## Verification

- The retained shell verifier proves the green path plus every new S03 red path through the real CLI/report entrypoint.
- `bash scripts/ci/verify-m011-s03-format-media.sh`

## Observability Impact

- Signals added/changed: the retained proof bundle captures per-scenario stdout, stderr, exit codes, and report JSON for S03 payload semantics.
- How a future agent inspects this: rerun the verifier and inspect the temp-directory paths it prints on failure.
- Failure state exposed: each scenario keeps enough artifacts to pinpoint analyzer logic vs report contract vs CLI summary drift.

## Inputs

- `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml` — shared S03 OpenAPI fixture bundle from T01.
- `yanote-js/test/fixtures/events/http-payload-valid-format.fixture.jsonl` — green supported-format evidence.
- `yanote-js/test/fixtures/events/http-payload-invalid-format.fixture.jsonl` — invalid email evidence.
- `yanote-js/test/fixtures/events/http-payload-unsupported-format.fixture.jsonl` — unsupported/custom format evidence.
- `yanote-js/test/fixtures/events/http-payload-media-specificity.fixture.jsonl` — most-specific media selection evidence from T02.
- `yanote-js/src/cli.ts` — CLI summary/failure behavior updated by T04.
- `yanote-js/src/report/report.ts` — report contract surface updated by T03.

## Expected Output

- `scripts/ci/verify-m011-s03-format-media.sh` — retained analyzer verifier for valid format, invalid format, unsupported format, and media specificity.
