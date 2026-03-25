---
id: T01
parent: S03
milestone: M011
key_files:
  - yanote-js/package.json
  - yanote-js/package-lock.json
  - yanote-js/src/coverage/httpPayloadConformance.ts
  - yanote-js/src/coverage/httpPayloadConformance.test.ts
  - yanote-js/src/gates/httpPayloadSemantics.ts
  - yanote-js/test/fixtures/openapi/http-payload-format-media.yaml
  - yanote-js/test/fixtures/events/http-payload-valid-format.fixture.jsonl
  - yanote-js/test/fixtures/events/http-payload-invalid-format.fixture.jsonl
  - yanote-js/test/fixtures/events/http-payload-unsupported-format.fixture.jsonl
  - .gsd/KNOWLEDGE.md
  - .gsd/DECISIONS.md
key_decisions:
  - HTTP payload format support is an explicit allowlist registered in Ajv (`email` first), not whatever `ajv-formats` could validate by default.
  - Declared unsupported/custom payload formats surface as `UNSUPPORTED_SCHEMA_FORMAT` skipped diagnostics so legacy invalid-count numerators stay stable while downstream governance can still fail closed.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T17:44:14.753Z
blocker_discovered: false
---

# T01: Enforced the email-only payload format allowlist and surfaced unsupported schema formats in the analyzer

**Enforced the email-only payload format allowlist and surfaced unsupported schema formats in the analyzer**

## What Happened

Added `ajv-formats` as a direct dependency, configured the HTTP payload analyzer to register only the published allowlist (`email`), and introduced a schema walker that scans matched JSON schemas for declared `format` keywords before Ajv compilation. The analyzer now validates `format: email` for real, returns `INVALID_BODY` when an email-shaped payload is wrong, and emits the dedicated `UNSUPPORTED_SCHEMA_FORMAT` diagnostic with schema-path/format detail when a declared/custom format falls outside Yanote support instead of silently degrading to plain string validation. I also added the shared S03 OpenAPI fixture bundle plus focused JSONL evidence fixtures for valid email, invalid email, and unsupported-format scenarios, then expanded the Vitest suite to prove supported-format green behavior, invalid-email failure, and unsupported-format fail-closed behavior while preserving skipped-vs-invalid accounting. To keep the new analyzer code typed cleanly, I added the matching semantic-code case to `httpPayloadSemantics` without pulling the later report/CLI work forward.

## Verification

Verified the task contract with `npm -C yanote-js test -- src/coverage/httpPayloadConformance.test.ts`, which passed with the new format-policy coverage cases. Also ran the slice Vitest stack from `S03-PLAN.md`; all listed test files passed, confirming the new analyzer behavior did not regress current report/gate/CLI surfaces. Finally ran the retained slice verifier command from the slice plan; it failed with exit 127 because `scripts/ci/verify-m011-s03-format-media.sh` has not been created yet and is owned by T05.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/coverage/httpPayloadConformance.test.ts` | 0 | ✅ pass | 1714ms |
| 2 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 1288ms |
| 3 | `bash scripts/ci/verify-m011-s03-format-media.sh` | 127 | ❌ fail | 3ms |


## Deviations

Added a minimal `yanote-js/src/gates/httpPayloadSemantics.ts` mapping for the new analyzer code so downstream type surfaces stay exhaustive before the dedicated governance/report/CLI work in later S03 tasks. Otherwise none.

## Known Issues

`bash scripts/ci/verify-m011-s03-format-media.sh` is not present yet, so the retained slice proof remains pending T05. This is expected for T01 and is not a blocker.

## Files Created/Modified

- `yanote-js/package.json`
- `yanote-js/package-lock.json`
- `yanote-js/src/coverage/httpPayloadConformance.ts`
- `yanote-js/src/coverage/httpPayloadConformance.test.ts`
- `yanote-js/src/gates/httpPayloadSemantics.ts`
- `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml`
- `yanote-js/test/fixtures/events/http-payload-valid-format.fixture.jsonl`
- `yanote-js/test/fixtures/events/http-payload-invalid-format.fixture.jsonl`
- `yanote-js/test/fixtures/events/http-payload-unsupported-format.fixture.jsonl`
- `.gsd/KNOWLEDGE.md`
- `.gsd/DECISIONS.md`
