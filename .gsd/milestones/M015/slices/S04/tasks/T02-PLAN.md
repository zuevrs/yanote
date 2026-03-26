---
estimated_steps: 26
estimated_files: 3
skills_used: []
---

# T02: Wire the widened proof stack into the stable build-and-test workflow contract

Why: The repository already has live RabbitMQ and combined proof commands, but the required CI job still runs only the Kafka proof and therefore does not expose or enforce the new delivery surface promised by M015.
Do: keep `build-and-test` as the stable required job, add live RabbitMQ and combined proof steps in dependency order, publish the widened collected summaries in GitHub Actions, and update workflow contract tests plus required-check docs so the widened stack is mechanically pinned.
Done when: `build-and-test` runs the Kafka, RabbitMQ, and combined proof stack without renaming required jobs, uploads deterministic widened artifacts, and fails closed with step-specific exit codes when any proof drifts.

## Description

Turn the widened async and combined-report work into a real GitHub Actions delivery surface by extending the existing required job instead of inventing new merge-blocking job names or a blended dashboard workflow.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Live RabbitMQ and combined proof scripts | Capture exit codes, keep artifact collection on `always()`, and fail the job with a proof-specific message | Preserve retained temp/bundle paths so CI logs point to the failing proof family | Do not continue as green if the combined proof consumes malformed child artifacts |
| GitHub step summary publication | Keep summaries additive and redaction-safe; no overwrite that hides earlier proof output | N/A | Refuse to point summary steps at non-existent collected bundle paths |
| Required-check contract docs/tests | Fail the contract suite if step order, artifact names, or stable job IDs drift | N/A | Reject stale branch-protection wording that still describes Kafka-only async CI coverage |

## Load Profile

- **Shared resources**: one required `build-and-test` job, multiple proof-script runs, and one uploaded collected artifact bundle.
- **Per-operation cost**: Kafka proof, RabbitMQ proof, combined proof, artifact collection, summary rendering, and workflow contract assertions.
- **10x breakpoint**: proof-script runtime and artifact I/O dominate before YAML parsing or contract tests do.

## Negative Tests

- **Malformed inputs**: combined proof step pointed at the wrong collected bundle path or missing retained RabbitMQ child report.
- **Error paths**: RabbitMQ proof failure, combined proof failure after RabbitMQ success, and summary step path drift inside the workflow.
- **Boundary conditions**: stable required job names stay unchanged, `always()` artifact collection still runs on failure, and delivery-proof / HTTP validation behavior stays intact beside the widened proof stack.

## Steps

1. Extend `.github/workflows/yanote-ci.yml` so `build-and-test` runs the live RabbitMQ proof and then the combined proof after the existing Kafka proof, records each exit code, and still collects artifacts on `always()`.
2. Publish the widened collected summary surfaces from the deterministic artifact paths and keep enforcement fail-closed without renaming `build-and-test` or `yanote-validation`.
3. Update workflow contract coverage and branch-protection documentation so step order, artifact bundle names, and widened proof expectations stay pinned.

## Must-Haves

- [ ] `build-and-test` remains the stable required job while enforcing Kafka, RabbitMQ, and combined proof results through one deterministic collected artifact family.
- [ ] Workflow contracts and required-check docs explain the widened proof stack without implying a combined dashboard or breaking the existing HTTP validation split.

## Inputs

- ``.github/workflows/yanote-ci.yml` — current required-check workflow that still publishes only the Kafka async proof family.`
- ``scripts/ci/yanote-ci-workflow.contract.test.mjs` — workflow contract suite that pins job names, proof steps, artifact names, and summary paths.`
- ``.github/BRANCH_PROTECTION.md` — required-check documentation that must stay aligned with the widened CI delivery surface.`
- ``scripts/ci/collect-yanote-artifacts.sh` — widened collector contract from T01 that the workflow will call.`
- ``scripts/ci/render-yanote-summary.mjs` — widened summary renderer from T01 used to publish collected proof summaries.`
- ``scripts/ci/verify-m004-s03-live-kafka-proof.sh` — existing Kafka proof surface that must remain in the widened build-and-test stack.`
- ``scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` — live RabbitMQ proof surface that must become a real CI step.`
- ``scripts/ci/verify-m015-s03-combined-report.sh` — combined proof surface that depends on the retained RabbitMQ child bundle.`

## Expected Output

- ``.github/workflows/yanote-ci.yml` — widened required-check workflow that runs and enforces Kafka, RabbitMQ, and combined proof steps.`
- ``scripts/ci/yanote-ci-workflow.contract.test.mjs` — updated workflow contract tests pinning widened proof-step order, summary paths, and artifact bundle names.`
- ``.github/BRANCH_PROTECTION.md` — required-check contract doc aligned to the widened async and combined CI surfaces.`

## Verification

node --test scripts/ci/yanote-ci-workflow.contract.test.mjs

## Observability Impact

- Signals added/changed: proof-step exit codes for Kafka, RabbitMQ, and combined runs; widened `GITHUB_STEP_SUMMARY` publication; deterministic `build-and-test-artifacts/` contents.
- How a future agent inspects this: inspect the workflow job logs plus the uploaded `build-and-test-artifacts` bundle and rerun `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs`.
- Failure state exposed: workflow logs and contract tests identify which proof step, artifact path, or required-check clause drifted.
