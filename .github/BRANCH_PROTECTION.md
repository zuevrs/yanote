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
| `pull_request` | `build-and-test`, `yanote-validation` | Fast merge-blocking path for PR review. `build-and-test` also runs `run-v1-e2e.sh` when delivery-sensitive files changed. |
| `merge_group` | `build-and-test`, `yanote-validation` | Required check reporting for merge queue flows. `build-and-test` always runs earlier delivery proof on the merge group. |
| `push` to `main` or `release/**` | `build-and-test`, `yanote-validation` (+ `v1-e2e`) | Main/release hardening path adds blocking full v1 e2e validation. |

Delivery-sensitive changes currently mean edits under:

- `examples/**`
- `scripts/ci/**`
- `yanote-recorder-spring-mvc/**`
- `yanote-recorder-spring-kafka/**`
- `yanote-gradle-plugin/**`

`v1-e2e` remains an additional quality gate for main/release flows and is intentionally not part of the default PR required-check pair.

## GitHub Configuration Steps

1. Open **Repository Settings -> Branches -> Branch protection rules**.
2. Enable **Require status checks to pass before merging**.
3. Add `build-and-test` and `yanote-validation` as required checks.
4. If merge queue is enabled, verify `merge_group` runs report the same required checks.

## Failure Handling Expectations

- Any failure in `build-and-test` or `yanote-validation` blocks merge.
- `build-and-test` runs the authoritative live Kafka proof, the live RabbitMQ proof, and the combined proof, always uploads deterministic diagnostics as `build-and-test-artifacts`, and writes concise redaction-safe `GITHUB_STEP_SUMMARY` surfaces from the collected `live-kafka-proof/`, `live-rabbitmq-proof/`, and `combined-proof/` bundles. Those summaries expose sanitized `specSource`, explicit `yanote-async-report.json`/`yanote-async-report.html` and `yanote-combined-report.json`/`yanote-combined-report.html` artifact names, retained runtime-selected and schema-failure JSON+HTML companions when they exist, RabbitMQ `protocols=amqp`, combined child-report paths, and additive `binding support`, `declared semantics`, and `runtime semantics` lines without collapsing HTTP and async truth into a blended dashboard or exposing raw retained headers.
- Delivery-sensitive `run-v1-e2e.sh` failures are enforced through `build-and-test`, not through a renamed required job.
- `build-and-test-artifacts` still retains `v1-e2e/` plus delivery-proof scope files beside the widened async proof families so earlier delivery-proof behavior remains inspectable.
- `yanote-validation` remains the HTTP validation job, retains deterministic HTTP artifacts as `yanote-validation-artifacts`, and writes concise HTTP diagnostics to `GITHUB_STEP_SUMMARY` that expose sanitized `specSource`, additive deprecated-operation counts, and explicit `yanote-report.json`/`yanote-report.html` artifact names.
- Java runtime mismatches fail early via `scripts/ci/assert-java21.sh` with actionable `actions/setup-java` remediation guidance.
