# T02: 05-oss-release-and-traceable-verification 02

**Slice:** S05 — **Milestone:** M001

## Description

Deliver the public GitHub release surface for v1 with deterministic tag-driven execution and approval-gated publication.

Purpose: Satisfy RELS-02 and workflow/orchestration portions of RELS-03 by converting release from ad hoc CI activity into an explicit OSS release contract.
Output: Release workflow, release notes template renderer, and deterministic release asset assembly with contract tests.

## Must-Haves

- [ ] "Tagged stable versions trigger a deterministic release pipeline and no manual-only entrypoint can bypass tag policy."
- [ ] "Release publish job pauses for one explicit manual approval before any external publication."
- [ ] "GitHub Release output contains required sections (Summary, Breaking Changes, Upgrade Notes, Verification Highlights) and changelog scope since previous release tag."
- [ ] "Release asset bundle is deterministic and includes v1 distribution artifacts, SBOM, SHA-256 checksums, per-asset signatures/checksum proofs, and shared manifest."

## Files

- `.github/workflows/release.yml`
- `.github/release.yml`
- `scripts/release/assemble-release-assets.sh`
- `scripts/release/render-release-notes.mjs`
- `scripts/release/github-release.contract.test.mjs`
- `scripts/release/release-workflow.contract.test.mjs`
