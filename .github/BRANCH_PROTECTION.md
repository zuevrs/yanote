# Branch Protection Required-Check Contract

This document defines the merge-blocking status-check contract for `yanote`.
Treat these check names as a stable v1 interface.

## Required Check Names

Configure protected branches to require exactly these workflow job IDs:

- `build-and-test`
- `yanote-validation`

Do not rename these jobs in `.github/workflows/yanote-ci.yml` without updating branch protection rules in GitHub settings.

## Trigger and Check Behavior

| Trigger/Event | Required checks reported | Expected behavior |
| --- | --- | --- |
| `pull_request` | `build-and-test`, `yanote-validation` | Fast merge-blocking path for PR review. |
| `merge_group` | `build-and-test`, `yanote-validation` | Required check reporting for merge queue flows. |
| `push` to `main` or `release/**` | `build-and-test`, `yanote-validation` (+ `v1-e2e`) | Main/release hardening path adds blocking full v1 e2e validation. |

`v1-e2e` is an additional quality gate for main/release flows and is intentionally not part of the default PR required-check pair.

## GitHub Configuration Steps

1. Open **Repository Settings -> Branches -> Branch protection rules**.
2. Enable **Require status checks to pass before merging**.
3. Add `build-and-test` and `yanote-validation` as required checks.
4. If merge queue is enabled, verify `merge_group` runs report the same required checks.

## Failure Handling Expectations

- Any failure in `build-and-test` or `yanote-validation` blocks merge.
- `yanote-validation` retains deterministic artifacts (`yanote-validation-artifacts`) and writes concise diagnostics to `GITHUB_STEP_SUMMARY`.
- Java runtime mismatches fail early via `scripts/ci/assert-java21.sh` with actionable `actions/setup-java` remediation guidance.
