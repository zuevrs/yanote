---
estimated_steps: 6
estimated_files: 7
skills_used:
  - vitest
---

# T03: Publish deprecated truth on HTTP CLI summaries without touching async surfaces

**Slice:** S02 — Deprecated Operation Truth Without Numerator Drift
**Milestone:** M013

## Description

Use the real HTTP `report` command to surface deprecated truth to operators while preserving existing machine tokens, async boundaries, and remote-spec compatibility.

## Steps

1. Update `yanote-js/src/cli.ts` so the HTTP summary prints an additive deprecated line and `YANOTE_SUMMARY` publishes deprecated count/percent tokens without overloading the existing `operations` or `covered` tokens.
2. Change HTTP Top Issues wording so uncovered deprecated operations are called out explicitly while covered deprecated operations remain summary-only truth and no new semantic failure class or gate behavior is introduced.
3. Update downstream CLI and report contract tests so local, remote-spec, request-evidence, and security report consumers all pin the new deprecated fields while async summary behavior stays unchanged.

## Must-Haves

- [ ] Human summary and `YANOTE_SUMMARY` both expose deprecated total/covered/uncovered truth explicitly.
- [ ] Uncovered deprecated operations are labeled explicitly instead of looking like generic uncovered operations.
- [ ] `YANOTE_ASYNC_SUMMARY` and async report surfaces remain untouched.

## Verification

- `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/cli.async-report.contract.test.ts`
- The CLI contract stack proves HTTP deprecated truth is visible on supported summary surfaces while async output remains unchanged.

## Observability Impact

- Signals added/changed: HTTP summary deprecated line, `YANOTE_SUMMARY` deprecated tokens, and explicit uncovered-deprecated issue wording.
- How a future agent inspects this: rerun the focused CLI/report contract stack and inspect stdout from `yanote report` against the deprecated fixture.
- Failure state exposed: missing deprecated tokens/line or generic uncovered wording localizes directly to the HTTP CLI summary path.

## Inputs

- `yanote-js/src/cli.ts` — real HTTP and async CLI summary path that must expose deprecated truth only on the HTTP side.
- `yanote-js/src/cli.summary.contract.test.ts` — fixed-section summary contract test for human/machine output ordering.
- `yanote-js/src/cli.report.test.ts` — end-to-end CLI report test that inspects stdout and written report artifacts together.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — remote-spec CLI contract that must stay compatible with the expanded HTTP summary/report truth.
- `yanote-js/src/cli.async-report.contract.test.ts` — async summary guardrail to prove no HTTP deprecation tokens leak across boundaries.
- `yanote-js/src/report/report.remote-spec.contract.test.ts` — report contract consumer that must accept the new additive fields alongside `specSource`.
- `yanote-js/src/report/report.requestEvidence.contract.test.ts` — request-evidence report contract consumer that must remain schema-valid.
- `yanote-js/src/report/report.security.contract.test.ts` — security report contract consumer that must remain schema-valid.
- `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml` — dedicated deprecated-operation spec fixture for CLI assertions.
- `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl` — retained evidence fixture for deprecated summary and issue wording checks.

## Expected Output

- `yanote-js/src/cli.ts` — HTTP CLI summary with additive deprecated truth and explicit uncovered-deprecated issue wording.
- `yanote-js/src/cli.summary.contract.test.ts` — summary contract tests pinning the new deprecated line and machine tokens.
- `yanote-js/src/cli.report.test.ts` — CLI/report integration tests proving deprecated truth reaches stdout and report artifacts together.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — remote-spec CLI contract tests updated for the additive HTTP summary/report fields.
- `yanote-js/src/report/report.remote-spec.contract.test.ts` — remote-spec report contract tests updated for the new deprecated JSON fields.
- `yanote-js/src/report/report.requestEvidence.contract.test.ts` — request-evidence report contract tests kept schema-valid with the expanded report contract.
- `yanote-js/src/report/report.security.contract.test.ts` — security report contract tests kept schema-valid with the expanded report contract.
