---
estimated_steps: 3
estimated_files: 2
skills_used:
  - bash-scripting
  - test
  - debug-like-expert
---

# T03: Align CI summary rendering with async header failure order

**Slice:** S03 — Async Kafka Header Validation As A Supported Core Surface
**Milestone:** M010

## Description

Bring the GitHub/CI summary surface up to the same contract as the async gate path. This task ensures header diagnostics are mapped, ordered, and rendered as first-class async semantic failures instead of being silently dropped behind payload-era summary logic.

## Steps

1. Update `scripts/ci/render-yanote-summary.mjs` so `missing-header`, `unavailable-header`, and `invalid-header` have semantic codes, precedence, and issue formatting aligned with the existing async evaluator/failure-order behavior.
2. Extend `scripts/ci/render-yanote-summary.test.mjs` with mixed diagnostic fixtures that prove primary-failure selection, class counts, and top-issue formatting when header diagnostics are present alongside payload and routing diagnostics.
3. Keep the task narrow: do not redesign the summary format, only make the existing CI summary truthful for the supported async header semantics.

## Must-Haves

- [ ] No supported async header diagnostic kind is omitted from `ASYNC_DIAGNOSTIC_CODE_BY_KIND` or precedence ordering.
- [ ] The summary renderer can select a header diagnostic as the primary async failure when its precedence demands it.
- [ ] Tests pin the rendered issue text and class counts so future regressions are obvious.

## Verification

- `node --test scripts/ci/render-yanote-summary.test.mjs`

## Observability Impact

- Signals added/changed: GitHub summary markdown and local summary output now surface header semantic codes and precedence consistently with the async gate path.
- How a future agent inspects this: run the node test above or execute `node scripts/ci/render-yanote-summary.mjs --help` and feed it retained async proof artifacts.
- Failure state exposed: summary failures should reveal whether code mapping, precedence ordering, or issue formatting drifted from the supported async contract.

## Inputs

- `scripts/ci/render-yanote-summary.mjs` — current summary renderer that only maps payload-era async diagnostics plus `unverifiable-headers`.
- `scripts/ci/render-yanote-summary.test.mjs` — current node test surface that needs header-diagnostic precedence and formatting coverage.

## Expected Output

- `scripts/ci/render-yanote-summary.mjs` — async header diagnostics added to code mapping, precedence, and issue rendering.
- `scripts/ci/render-yanote-summary.test.mjs` — deterministic tests covering summary behavior for missing, unavailable, invalid, and unverifiable header diagnostics.
