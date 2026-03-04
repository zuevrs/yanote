# Pitfalls Research

**Domain:** Java API specification coverage tooling (Spring MVC recorder + OpenAPI analyzer + CLI/Gradle/GitHub delivery)
**Researched:** 2026-03-04
**Confidence:** HIGH for spec/release requirements, MEDIUM for scale thresholds

## Critical Pitfalls

### Pitfall 1: Naive URL Matching Causes False Coverage

**What goes wrong:**
Coverage matching uses raw request URLs (or partially decoded paths) and marks operations incorrectly. Teams see false positives ("covered but not really") and false negatives ("uncovered despite tests").

**Why it happens:**
OpenAPI path templating and Spring MVC lookup-path semantics are more nuanced than string equality. Concrete paths must win over templated paths, and ambiguous or identical templates are easy to mishandle.

**How to avoid:**
- Canonicalize operation identity to `method + normalized route template + server base normalization`.
- Resolve Spring route templates from framework metadata, not only raw `requestURI`.
- Add a preflight lint that fails on ambiguous/invalid OpenAPI paths.
- Maintain golden matching fixtures (encoded chars, templated paths, concrete-vs-template collisions).

**Warning signs:**
- Same request appears under multiple operations in reports.
- "100% covered" while known endpoints remain untested.
- Frequent mismatch between framework route mapping and analyzer operation key.

**Phase to address:**
Phase 1 - Coverage Semantics Contract

---

### Pitfall 2: Operation Identity Drift Across Java and Node Parsers

**What goes wrong:**
Java and Node paths/operations extracted from the same spec do not match exactly, causing inconsistent coverage outcomes by runtime.

**Why it happens:**
The project currently uses separate parser stacks (`swagger-parser` in Java and `@apidevtools/swagger-parser` in Node). Also, `operationId` can be missing (optional) and must be unique when present; over-reliance on it causes collisions or gaps.

**How to avoid:**
- Define one canonical operation key algorithm and test both runtimes against the same corpus.
- Treat `operationId` as metadata, not sole identity.
- Add contract tests that diff extracted operation sets between Java and Node in CI.
- Fix parser options explicitly (`resolve`, `resolveFully`, flatten behavior) and version-pin parser libs.

**Warning signs:**
- Operation counts differ by runtime for identical input spec.
- Same endpoint appears with different keys across reports.
- Coverage changes after parser dependency bumps without source changes.

**Phase to address:**
Phase 1 - Coverage Semantics Contract

---

### Pitfall 3: "Endpoint Hit Once" Metrics Inflate Coverage

**What goes wrong:**
Tools report strong coverage while only happy-path variants are exercised. Response status classes, media types, and parameter serialization variants remain untested.

**Why it happens:**
Coverage denominator is modeled too coarsely at operation level. OpenAPI defines richer behavior space (status codes/ranges, request/response content types, parameter style/explode behavior).

**How to avoid:**
- Split requirement units into: operation presence, status outcome, media type, and key request variants.
- Report both operation coverage and behavior coverage (separate metrics).
- Track an explicit "risk-weighted uncovered list" for failing paths (e.g., auth, error codes).
- Include negative-path tests in quality gates, not only 2xx.

**Warning signs:**
- 100% operation coverage with zero 4xx/5xx assertions.
- Tests pass while API consumers report behavior mismatches.
- Regressions appear only after production traffic includes unsupported content types.

**Phase to address:**
Phase 2 - Coverage Model Expansion

---

### Pitfall 4: Recorder Fail-Open Design Hides Data Loss

**What goes wrong:**
Telemetry write failures do not break request flow (good), but dropped events silently reduce coverage fidelity (bad). Corrupted or incomplete `events.jsonl` then skews reports.

**Why it happens:**
Product teams prioritize request safety but do not add hard observability and integrity checks for recorder output. Concurrent file append and post-chain write points increase edge-case loss risk.

**How to avoid:**
- Keep fail-open request behavior, but add explicit recorder health counters and dropped-event metrics.
- Emit structured diagnostics and fail coverage gate when dropped events exceed threshold.
- Add JSONL integrity validation before analysis and require strict parsing success.
- Use deterministic write strategy (single-writer queue/flush policy) under concurrency.

**Warning signs:**
- Malformed JSONL lines or parse errors in analyzer logs.
- Event count drops under load tests.
- Frequent recorder warnings while coverage still "passes."

**Phase to address:**
Phase 2 - Recorder Correctness and Data Integrity

---

### Pitfall 5: Test Flakiness from Shared State and Parallelism

**What goes wrong:**
CI becomes non-deterministic: reruns pass, first runs fail. Shared files, global JVM properties, and cross-test contamination break confidence in gates.

**Why it happens:**
Parallel execution and mutable shared resources are introduced without isolation controls (`@ResourceLock`, `@Isolated`, unique temp resources). Integration tests also rely on sleep/poll and assumptions that can mask failures.

**How to avoid:**
- Assign unique run IDs and event paths per test execution.
- Use JUnit resource locks/isolation for shared JVM/system resources.
- Replace timing sleeps with deterministic readiness probes + bounded retries.
- Ban "silent skip" patterns in CI-critical suites.

**Warning signs:**
- Failures disappear on rerun without code change.
- Flakes concentrate around filesystem/system-property tests.
- Parallel test mode produces different coverage from sequential mode.

**Phase to address:**
Phase 3 - Deterministic Test Harness

---

### Pitfall 6: Non-Reproducible Builds Undermine Release Trust

**What goes wrong:**
The same commit produces different artifacts or dependency graphs across days/runners, causing hard-to-diagnose release and gate regressions.

**Why it happens:**
Dynamic/changing dependencies, missing lock discipline, and mixed toolchain pipelines introduce hidden variability.

**How to avoid:**
- Enable Gradle dependency locking and commit lockfiles.
- Publish resolved dependency versions for released artifacts.
- Enforce `npm ci` (not `npm install`) in CI packaging paths.
- Add artifact reproducibility checks (hash compare across reruns).

**Warning signs:**
- Dependency graph changes without `build.gradle`/`package-lock` changes.
- Release candidate hashes differ between reruns.
- "Works locally, fails in CI" increases after dependency updates.

**Phase to address:**
Phase 4 - Release Engineering Hardening

---

### Pitfall 7: OSS Publishing Fails Late (Central/Signing/Metadata)

**What goes wrong:**
Publishing fails near release cut due to missing signatures, sources/javadocs, invalid POM metadata, or outdated publishing protocol assumptions.

**Why it happens:**
Teams validate publication requirements only at final release time. Maven Central requirements are strict, and process changes (for example Central protocol updates) can invalidate old automation.

**How to avoid:**
- Add a publish-preflight workflow that validates Central requirements on every release candidate.
- Enforce sources/javadocs/signing/POM metadata checks before tag creation.
- Keep publishing plugins and workflows aligned with current Central guidance.
- Verify release pipeline in a dry-run repository step before official publish.

**Warning signs:**
- Release branch blocked by missing `.asc` or missing `-sources`/`-javadoc` artifacts.
- POM metadata validation errors (SCM/license/developers).
- Last-minute manual edits to publishing configs during release day.

**Phase to address:**
Phase 4 and Phase 5 - Release Engineering + OSS Publishing

---

### Pitfall 8: Supply-Chain Exposure in CI/CD Workflows

**What goes wrong:**
Compromised third-party action/tag or over-privileged token impacts release artifacts, credentials, or repository state.

**Why it happens:**
Workflows use mutable action tags, broad `GITHUB_TOKEN` permissions, and long-lived secrets without policy enforcement.

**How to avoid:**
- Pin third-party actions to full-length commit SHAs.
- Minimize `GITHUB_TOKEN` permissions per job.
- Prefer OIDC short-lived credentials for cloud publishing.
- Protect workflow changes with `CODEOWNERS` and dependency review.

**Warning signs:**
- Workflow files reference floating tags (`@vX`) for critical release jobs.
- Release jobs require broad write permissions not tied to specific steps.
- Security review repeatedly flags workflow dependency drift.

**Phase to address:**
Phase 4 - CI/CD Supply-Chain Hardening

---

### Pitfall 9: Report/CLI Contract Breakage Without Version Governance

**What goes wrong:**
Downstream Gradle plugins, GitHub Actions, and CI gates break when report JSON shape or CLI semantics change unexpectedly.

**Why it happens:**
Public API surface of the tooling is not explicitly versioned/tested as a compatibility contract.

**How to avoid:**
- Define report schema version and compatibility policy.
- Add golden contract tests for CLI exit codes, flags, and JSON report.
- Apply SemVer to all externally consumed artifacts and document deprecations.
- Provide migration notes and compatibility windows before removals.

**Warning signs:**
- Minor releases require downstream hotfixes.
- Consumers pin exact patch versions to avoid breakage.
- Breaking changes appear without explicit major release notes.

**Phase to address:**
Phase 5 - OSS API Governance

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep separate Java/Node coverage semantics without conformance tests | Fast iteration per runtime | Drift, conflicting coverage outputs | Only before Phase 1 completion |
| Treat any single hit as "covered" | Simple reporting and demos | Blind spots in error/media-path behavior | Never for release gates |
| Fail-open recorder without integrity metrics | No request disruption | Silent data loss and false confidence | Acceptable only with explicit dropped-event SLO + gates |
| Manual release checklist only | Fewer automation tasks initially | Human error at release cut | MVP only, must be automated by Phase 4 |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Spring MVC request mapping | Match on raw URI and ignore framework lookup/template rules | Match on normalized framework route template and method |
| OpenAPI parsing (Java + Node) | Assume parser defaults are equivalent | Lock parser versions/options and conformance-test extracted operations |
| Maven Central publishing | Keep legacy OSSRH/old protocol assumptions | Use current Central publishing flow and validate requirements continuously |
| GitHub Actions | Use mutable tags and broad token permissions | Pin SHAs, scope permissions minimally, enforce policy |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-request synchronous file I/O for event writes | Latency spikes, warning storms | Buffered/single-writer architecture with backpressure metrics | Often visible at sustained high request rates (validate with load tests) |
| Full in-memory event ingestion | Analyzer OOM or GC thrash | Stream processing and chunked aggregation | Typically with very large event files (project-specific threshold) |
| Full spec dereference by default | Slow startup/high memory on large specs | Configurable parse mode + pre-validated specs + caching | Large multi-file OpenAPI documents |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Recording sensitive headers/body fields in events | Credential/PII leakage via artifacts/logs | Default denylist/redaction + tests proving no secret fields persist |
| Long-lived publish credentials in CI | Credential compromise, repository takeover | OIDC short-lived credentials + secret scoping/review gates |
| Unpinned third-party release actions | Supply-chain compromise of build/release path | SHA pinning + dependency review + action source audits |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Single "coverage %" headline without reason codes | Teams cannot act on failures quickly | Provide uncovered requirements grouped by endpoint/status/media-type with suggested tests |
| Non-deterministic gate outcomes | Trust in tool collapses | Stable, reproducible reports with deterministic ordering and clear diffs |
| Opaque failure messages | Slower adoption and false bug reports | Emit remediation-oriented diagnostics (what failed, why, next step) |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Coverage engine:** Operation matching passes happy path but lacks ambiguity/path-template regression suite.
- [ ] **Recorder:** Writes events in normal flow but has no dropped-event SLO or integrity gate.
- [ ] **CI gate:** Threshold check exists but no contract test for CLI exit codes/report schema.
- [ ] **Release pipeline:** Publishes snapshots but not fully signed + metadata-complete Central-compatible artifacts.
- [ ] **Security posture:** Workflows run green but third-party actions are not SHA-pinned.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Incorrect operation matching in released report | HIGH | Freeze release, patch canonical matching, regenerate reports, publish corrected release notes with impact scope |
| Flaky CI gates | MEDIUM | Quarantine flaky suites, enforce isolation/resource locks, rebaseline with deterministic seeds/fixtures |
| Central publishing failure at cut | MEDIUM | Run preflight publish workflow, fix missing metadata/signatures, cut new release candidate |
| Workflow supply-chain incident | HIGH | Rotate credentials, invalidate release artifacts, pin SHAs, audit action graph and rerun trusted build |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Naive URL matching | Phase 1 - Coverage Semantics Contract | Golden fixture suite proving correct mapping for concrete/template/encoded paths |
| Parser drift across runtimes | Phase 1 - Coverage Semantics Contract | CI diff test: Java vs Node extracted operation set must match |
| Inflated endpoint-only metrics | Phase 2 - Coverage Model Expansion | Report includes operation + behavior coverage dimensions with failing examples |
| Recorder hidden data loss | Phase 2 - Recorder Correctness and Data Integrity | Dropped-event metric and JSONL integrity check enforced in gates |
| Flaky tests from shared state | Phase 3 - Deterministic Test Harness | Repeated CI runs yield identical outcomes under parallel execution |
| Non-reproducible builds | Phase 4 - Release Engineering Hardening | Same commit produces identical dependency lock state and artifact hashes |
| Late OSS publish failures | Phase 4/5 - Release Engineering + OSS Publishing | Publish-preflight job passes on every release candidate |
| CI/CD supply-chain exposure | Phase 4 - CI/CD Supply-Chain Hardening | Policy check enforces SHA-pinned actions and least-privilege tokens |
| Contract breakage in reports/CLI | Phase 5 - OSS API Governance | Backward-compat contract tests + SemVer release checks |

## Sources

- OpenAPI Specification 3.1.0 - operation/path/parameter/response rules (HIGH): https://spec.openapis.org/oas/v3.1.0
- Swagger Parser README - parse option semantics (`resolve`, `resolveFully`, `flatten`) (HIGH): https://github.com/swagger-api/swagger-parser/blob/master/README.md
- Spring Framework path matching reference (HIGH): https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping-path.html
- JUnit parallel execution and synchronization (`@ResourceLock`, `@Isolated`) (HIGH): https://docs.junit.org/5.14.2/writing-tests/parallel-execution
- Gradle dependency locking and reproducible build guidance (HIGH): https://docs.gradle.org/current/userguide/dependency_locking.html
- Gradle Maven Publish plugin and Central publishing notes (HIGH): https://docs.gradle.org/current/userguide/publishing_maven.html
- Sonatype Central publishing requirements (HIGH): https://central.sonatype.org/publish/requirements/
- GitHub Actions secure use reference (pinning, permissions, secret handling) (HIGH): https://docs.github.com/en/actions/reference/secure-use-reference
- Semantic Versioning 2.0.0 (HIGH): https://semver.org/
- Project context files (HIGH): `.planning/PROJECT.md`, `.planning/codebase/STACK.md`, `.planning/codebase/TESTING.md`, `.planning/codebase/CONCERNS.md`

---
*Pitfalls research for: Java API specification coverage tooling*
*Researched: 2026-03-04*
