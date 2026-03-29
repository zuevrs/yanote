---
estimated_steps: 4
estimated_files: 4
skills_used:
  - debug-like-expert
  - bash-scripting
---

# T03: Add a rerunnable dist-entrypoint proof for the combined surface using canonical child reports

**Slice:** S03 — Combined HTTP plus async report and gate from canonical subreports
**Milestone:** M015

## Description

Prove the shipped dist entrypoint end to end by generating a green HTTP child report, combining it with the retained S02 RabbitMQ async report, and asserting the combined JSON, HTML, and summary surfaces stay explicit about child attribution and retained drill-down paths.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `node yanote-js/dist/yanote.cjs report` | Fail closed and retain stdout/stderr plus generated inputs when HTTP child report generation fails | Command timeouts retain the proof directory and exact generated input paths | Malformed proof fixtures must fail before the combined step runs |
| `node yanote-js/dist/yanote.cjs combined-report` | No success without combined JSON/HTML and one final machine summary line | Fail the verifier explicitly and retain the proof directory | Malformed or drifted child report input aborts with an attributed typed failure |
| `.yanote-ci/live-rabbitmq-proof/yanote-async-report.json` | Fail with a clear instruction to rerun the S02 proof if the retained async child report is missing | N/A | Schema drift in the retained async child report must be surfaced as a combined-input failure, not ignored |

## Load Profile

- **Shared resources**: a deterministic `.tmp/m015-s03-combined-proof/` directory, one generated HTTP child report, the retained live async child report, and combined stdout/stderr artifacts.
- **Per-operation cost**: one HTTP `report` run plus one `combined-report` run.
- **10x breakpoint**: repeated dist builds and file I/O dominate before the aggregation work becomes expensive.

## Negative Tests

- **Malformed inputs**: missing retained async child report, corrupted generated HTTP child report JSON, or missing combined HTML sibling.
- **Error paths**: dist command non-zero exit, unexpected stderr on the happy path, or a missing final `YANOTE_COMBINED_SUMMARY` line.
- **Boundary conditions**: green HTTP child plus green AMQP async child, explicit async `protocols=amqp` attribution, and child report path references that point back to the canonical subreports.

## Steps

1. Add dedicated green HTTP proof fixtures under `scripts/ci/fixtures/` that can deterministically generate a canonical `yanote-report.json` child report.
2. Add `scripts/ci/verify-m015-s03-combined-report.sh` that runs `node yanote-js/dist/yanote.cjs report` against those fixtures, then runs `node yanote-js/dist/yanote.cjs combined-report` against the generated HTTP child report plus `.yanote-ci/live-rabbitmq-proof/yanote-async-report.json`.
3. Assert the happy path writes `yanote-combined-report.json` and `.html`, prints one final `YANOTE_COMBINED_SUMMARY` line, reports `status: ok`, preserves distinct HTTP-vs-async child report paths, and surfaces `protocols=amqp` for the async child.
4. Add a lightweight contract test for the verifier so the expected artifact names, proof directory, and child-path assertions stay pinned as the proof evolves.

## Must-Haves

- [ ] One command reruns the combined surface against canonical child reports and proves the dist entrypoint generates the combined artifact plus attributed summary without re-analyzing async runtime evidence.
- [ ] The proof retains enough stdout/stderr and artifact-path context that a future agent can localize whether drift came from HTTP child generation, retained async input, or combined aggregation.

## Verification

- `node --test scripts/ci/verify-m015-s03-combined-report.contract.test.mjs`
- `npm -C yanote-js run build && bash scripts/ci/verify-m015-s03-combined-report.sh`
- Expect a green combined proof that points back to the generated HTTP child report and the retained S02 RabbitMQ async child report.

## Observability Impact

- Signals added/changed: retained `http-report.stdout` / `http-report.stderr`, `combined-report.stdout` / `combined-report.stderr`, and the final `YANOTE_COMBINED_SUMMARY` proof token.
- How a future agent inspects this: rerun the verifier, then inspect `.tmp/m015-s03-combined-proof/` for child and combined artifacts.
- Failure state exposed: the proof localizes whether the HTTP child generation, retained async child input, or combined aggregation step drifted.

## Inputs

- `scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` — retained live async proof structure and failure-reporting patterns from S02.
- `.yanote-ci/live-rabbitmq-proof/yanote-async-report.json` — canonical retained async child report from the live RabbitMQ proof.
- `yanote-js/dist/yanote.cjs` — built dist entrypoint that must prove the combined surface end to end.

## Expected Output

- `scripts/ci/fixtures/m015-s03-combined-http.openapi.yaml` — deterministic green HTTP proof spec.
- `scripts/ci/fixtures/m015-s03-combined-http.events.jsonl` — deterministic green HTTP proof evidence.
- `scripts/ci/verify-m015-s03-combined-report.sh` — rerunnable dist-entrypoint verifier for the combined surface.
- `scripts/ci/verify-m015-s03-combined-report.contract.test.mjs` — script contract coverage for proof paths and expected assertions.
