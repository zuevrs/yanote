# T03: 05-oss-release-and-traceable-verification 03

**Slice:** S05 — **Milestone:** M001

## Description

Close QUAL-01 by turning requirement accountability into a deterministic release gate and publishable artifact set.

Purpose: Guarantee that every v1 requirement is traceable to executable automated tests before any public release can be published.
Output: Versioned traceability schema/map artifacts, validator script, contract tests, and release-workflow integration.

## Must-Haves

- [ ] "Every v1 requirement has explicit automated test traceability entries with runnable verification commands."
- [ ] "Release fails before publish when traceability coverage is below 100% or when mapped tests are flaky/quarantined."
- [ ] "Traceability output is deterministic, schema-versioned JSON plus concise markdown summary using the same snapshot reference."
- [ ] "Traceability artifacts are published both in-repo and inside the release asset bundle."

## Files

- `.planning/traceability/schema.v1.json`
- `.planning/traceability/v1-requirements-tests.json`
- `.planning/traceability/v1-requirements-tests.md`
- `scripts/release/verify-traceability.mjs`
- `scripts/release/traceability.contract.test.mjs`
- `.github/workflows/release.yml`
- `scripts/release/assemble-release-assets.sh`
