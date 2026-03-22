# T03: 04-java-build-and-ci-delivery-surfaces 03

**Slice:** S04 — **Milestone:** M001

## Description

Harden merge-blocking CI behavior for Phase 4 with branch-aware workflows and Java 21 enforcement.

Purpose: Complete QUAL-02 and QUAL-03 by making required checks deterministic, actionable, and branch-protection ready while preserving PR speed.
Output: Updated CI workflow topology, Java 21 assertion tooling, and required-check contract documentation.

## Files

- `.github/workflows/yanote-ci.yml`
- `scripts/ci/assert-java21.sh`
- `scripts/ci/run-v1-e2e.sh`
- `.github/BRANCH_PROTECTION.md`
- `examples/docker-compose.yml`
