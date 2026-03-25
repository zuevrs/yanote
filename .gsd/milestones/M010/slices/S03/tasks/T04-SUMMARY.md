---
id: T04
parent: S03
milestone: M010
provides:
  - Durable wrap-up notes for the unfinished async boundary docs/verifier refresh, including the exact stale wording still on disk and the local-reality mismatches that the next executor must preserve when resuming.
key_files:
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
  - docs/requirements.md
  - SUPPORT.md
  - scripts/docs/verify-m005-s01-async-path.sh
  - scripts/docs/verify-m005-s01-async-boundaries.sh
  - scripts/ci/verify-m005-s02-async-acceptance.sh
key_decisions:
  - Do not invent header-drift proof artifact names that are not present locally; resume from the shipped bundle contract and update wording against actual retained artifacts plus existing header diagnostics fixtures/tests.
patterns_established:
  - For this slice, verify docs/support wording against local proof surfaces first: the retained live Kafka bundle currently exports happy-path, runtime-selection, and schema-failure artifacts, while typed header diagnostics are proven by existing async event fixtures and report/CLI/summary tests.
observability_surfaces:
  - .yanote-ci/live-kafka-proof/
  - yanote-js/test/fixtures/async-events/schema-missing-header.fixture.jsonl
  - yanote-js/test/fixtures/async-events/schema-unavailable-header.fixture.jsonl
  - yanote-js/test/fixtures/async-events/schema-invalid-header.fixture.jsonl
  - scripts/ci/render-yanote-summary.test.mjs
  - none
duration: context-budget wrap-up
verification_result: not_run
completed_at: 2026-03-25T00:15:14+03:00
blocker_discovered: false
---

# T04: Refresh async boundary docs and verifier contracts for header support

**Recorded wrap-up notes after the context-budget stop; the async boundary docs/verifier edits themselves are still pending.**

## What Happened

I used the remaining budget to inspect the required T04 surfaces and capture precise resume notes instead of starting half-finished edits.

Confirmed stale public wording still exists in these target files:

- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `docs/requirements.md`
- `SUPPORT.md`
- `scripts/docs/verify-m005-s01-async-path.sh`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`

The stale phrase still on disk is the old under-claim that **“retained Kafka headers remain unverifiable”**.

I also verified an important local mismatch versus the planner/T02 carry-forward snapshot: the repository does **not** currently contain these authored spec files:

- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-missing-header.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-header.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-unavailable-header.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-unverifiable-header.yaml`

Likewise, the retained live proof export contract currently ships only these proof families from `.yanote-ci/live-kafka-proof/`:

- happy path: `async-report.stdout`, `async-report.stderr`, `yanote-async-report.json`
- runtime selection: `runtime-selected-async-report.stdout`, `runtime-selected-async-report.stderr`, `runtime-selected-yanote-async-report.json`
- payload schema failure: `schema-failure-async-report.stdout`, `schema-failure-async-report.stderr`, `schema-failure-yanote-async-report.json`

The current repository **does** already prove typed header diagnostics through existing fixtures/tests instead:

- `yanote-js/test/fixtures/async-events/schema-missing-header.fixture.jsonl`
- `yanote-js/test/fixtures/async-events/schema-unavailable-header.fixture.jsonl`
- `yanote-js/test/fixtures/async-events/schema-invalid-header.fixture.jsonl`
- `yanote-js/src/report/asyncReport.test.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `scripts/ci/render-yanote-summary.test.mjs`

Those surfaces already pin the shipped public diagnostic names and reasons:

- `missing-header`
- `unavailable-header`
- `invalid-header`
- `unverifiable-headers`

and the CI summary tests already pin the corresponding semantic codes:

- `ASYNC_SEMANTIC_MISSING_HEADER`
- `ASYNC_SEMANTIC_UNAVAILABLE_HEADER`
- `ASYNC_SEMANTIC_INVALID_HEADER`
- `ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS`

## Verification

No implementation or verifier reruns were performed after the context-budget warning. I only completed read-only inspection of the target docs, scripts, fixtures, and tests needed for a clean resume.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `rg -n "retained Kafka headers remain unverifiable|missing-header|invalid-header|unavailable-header|unverifiable-headers|live-kafka-proof|header-drift|runtime-selected-async-report|schema-failure-async-report" docs SUPPORT.md scripts/ci scripts/docs yanote-js/test/fixtures/asyncapi` | 0 | ✅ pass | not captured |
| 2 | `find yanote-js/test/fixtures/asyncapi -maxdepth 1 -type f | sort | sed 's#^#/#' | rg 'header|spring-kafka|schema-depth|multi-message|unverifiable'` | 0 | ✅ pass | not captured |
| 3 | `find yanote-js/test/fixtures/async-events -maxdepth 1 -type f | sort | sed 's#^#/#' | rg 'header|schema-'` | 0 | ✅ pass | not captured |

## Diagnostics

Resume from these concrete facts instead of re-researching:

1. Replace the stale “retained Kafka headers remain unverifiable” clause in all four docs with wording that says header diagnostics are supported on the Kafka-first `async-report` surface while raw sensitive header values stay redacted/not retained.
2. Keep these existing boundary clauses explicit:
   - `Kafka-only`
   - `Spring Kafka-first`
   - `separate async report/gate`
   - `payload-schema drift surfaced on the proven Kafka path`
   - `routing percentages remain routing-first`
   - `broker-agnostic promise нет`
3. Do **not** claim non-existent exported header sidecars. The truthful local contract is:
   - retained live bundle = happy path + runtime-selection + schema-failure
   - typed header diagnostics = existing async event fixtures + report/CLI tests + summary tests
4. Update `scripts/docs/verify-m005-s01-async-path.sh` and `scripts/docs/verify-m005-s01-async-boundaries.sh` to reject the old phrase and require the new supported-header wording plus the existing retained-artifact set.
5. `scripts/ci/verify-m005-s02-async-acceptance.sh` already composes the right delegated stages; it may only need message text cleanup unless the verifier assertions change.

## Deviations

Instead of editing docs/scripts, I stopped at durable wrap-up because the context-budget warning arrived before implementation began.

## Known Issues

- The contracted T04 docs/verifier updates are still not implemented.
- The slice-local planner/T02 carry-forward references header-drift AsyncAPI spec files that do not exist in this worktree.
- The retained live Kafka proof bundle does not currently export separate header-drift sidecars; resume work must stay aligned with the actual shipped artifact set.

## Files Created/Modified

- `.gsd/milestones/M010/slices/S03/tasks/T04-SUMMARY.md` — Durable wrap-up summary with exact stale wording, local mismatches, and resume instructions.
