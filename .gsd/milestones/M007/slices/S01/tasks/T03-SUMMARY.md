---
id: T03
parent: S01
milestone: M007
provides:
  - AsyncAPI v2/v3 semantics bundles that retain payload schema metadata beside canonical Kafka operation keys, with parity tests and live proof non-regression.
key_files:
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/spec/asyncapi.test.ts
  - yanote-js/src/spec/asyncapi.parity.test.ts
  - yanote-js/test/fixtures/asyncapi/v2.yaml
  - yanote-js/test/fixtures/asyncapi/v3.yaml
key_decisions:
  - Preserve AsyncAPI payload schema material inside `KafkaMessageContract` (`payloadSchema`, `contentType`, optional `schemaFormat`) and keep `serializeOperationKey()` unchanged.
patterns_established:
  - Probe `@asyncapi/parser` output before extending the semantics model; pin only the fields the parser resolves deterministically into `document.json()`.
observability_surfaces:
  - npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts
  - bash scripts/ci/verify-m004-s02-metadata-propagation.sh
duration: 55m
verification_result: passed
completed_at: 2026-03-20 16:14:10 +0300
blocker_discovered: false
---

# T03: Retain AsyncAPI payload schema metadata beside canonical Kafka keys

**Extended the AsyncAPI semantics bundle so payload schema material now rides alongside canonical Kafka operation identity instead of being discarded after message-name extraction.**

## What Happened

Expanded `KafkaMessageContract` to carry payload schema metadata (`payloadSchema`, `contentType`, optional `schemaFormat`) while keeping the canonical operation key exactly `kafka <action> <channel>`. The parser-facing code in `asyncapi.ts` now builds message contracts from the fields `@asyncapi/parser` resolves deterministically into `document.json()`, including the resolved payload object and parser-generated schema ids.

Updated the v2/v3 fixtures and parity tests so both versions prove the same payload-bearing contract result. The contract tests now assert that payload metadata is retained beside the key rather than leaking into routing identity.

Finally, re-ran the existing live metadata proof unchanged. That proved the stronger contract depth did not disturb the current `async-report` path before S02/S03 start turning this retained metadata into schema-validation truth.

## Verification

Verified the parser-level contract and the existing live proof guard:

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts` | 0 | passed | 1.48s |
| 2 | `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` | 0 | passed | 41.8s |

## Diagnostics

- `yanote-js/src/spec/asyncapi.test.ts` is the authoritative contract proof for payload metadata retention and fail-closed invalid-document handling.
- `yanote-js/src/spec/asyncapi.parity.test.ts` is the authoritative v2/v3 parity proof; if payload metadata drifts across versions, it should fail first.
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` is the no-regression proof that the stronger semantics model still feeds the current live Kafka analyzer path unchanged.

## Deviations

- None.

## Known Issues

- The retained payload schema metadata is not consumed by `asyncCoverage.ts`, `async-report`, or the gate logic yet; that remains S02/S03 work.

## Files Created/Modified

- `yanote-js/src/model/operationKey.ts` — extended the Kafka message contract with payload schema metadata.
- `yanote-js/src/spec/asyncapi.ts` — retained resolved payload-schema metadata in AsyncAPI semantics bundles.
- `yanote-js/src/spec/asyncapi.test.ts` — proved payload metadata retention and fail-closed semantics.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — pinned equivalent payload-bearing contracts across AsyncAPI v2 and v3.
- `yanote-js/test/fixtures/asyncapi/v2.yaml` — aligned the v2 fixture with explicit payload-bearing metadata expectations.
- `yanote-js/test/fixtures/asyncapi/v3.yaml` — aligned the v3 fixture with explicit payload-bearing metadata expectations.
