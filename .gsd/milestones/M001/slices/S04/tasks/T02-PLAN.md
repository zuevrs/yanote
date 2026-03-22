# T02: 04-java-build-and-ci-delivery-surfaces 02

**Slice:** S04 — **Milestone:** M001

## Description

Deliver the GitHub Actions channel for Yanote checks with deterministic PR feedback and artifact retention.

Purpose: Satisfy DELV-03 by exposing GitHub-native check/summarization/artifact surfaces that preserve existing CLI semantics and strict CI defaults.
Output: New workflow + summary/artifact helper scripts that create reliable merge-review feedback without PR-comment dependency.

## Files

- `.github/workflows/yanote-ci.yml`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/render-yanote-summary.test.mjs`
- `scripts/ci/collect-yanote-artifacts.sh`
