# Feature Research

**Domain:** Java API specification coverage tooling (OpenAPI + test evidence)
**Researched:** 2026-03-04
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| OpenAPI ingestion and normalization (file + URL) | Every mature tool starts from the spec as source of truth | MEDIUM | `swagger-coverage` CLI accepts local/remote spec; Schemathesis `st run` accepts file/URL schema. |
| Runtime evidence capture from real tests | Coverage requires observed calls, not static guesses | MEDIUM | `swagger-coverage` and Reqover record request evidence through filter/proxy patterns. |
| Operation-level coverage (method + templated path) | Teams first ask "which endpoints are covered?" | MEDIUM | Mature reports center on endpoint coverage counts and uncovered operations. |
| Response code conformance coverage | Status mismatches are high-impact API regressions | MEDIUM | `swagger-coverage` has explicit status rules and undeclared-status checks. |
| Parameter/request-body condition coverage | Endpoint-only coverage is too shallow for contract confidence | HIGH | `swagger-coverage` supports parameter-oriented conditions; Schemathesis reports parameter validity coverage depth. |
| CI quality gates with deterministic exit behavior | Tool must fail fast in PR/CI when thresholds are missed | MEDIUM | Specmatic governance exposes `minCoveragePercentage`, `maxMissedOperationsInSpec`, and enforcement. |
| Noise control via exclusions and rule config | Real services need to ignore health/deprecated/non-critical paths | MEDIUM | Specmatic supports excluded endpoints; `swagger-coverage` supports rule toggles and `exclude-deprecated`. |
| Machine-readable output for automation | Teams need artifacts for bots, trend jobs, and custom checks | MEDIUM | Mature tools produce HTML/text and/or structured outputs (JSON, JUnit, NDJSON, CTRF). |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Spec-implementation drift detection | Catches endpoints in app-but-not-spec and spec-but-not-app early | HIGH | Specmatic API coverage report explicitly highlights both mismatch directions. |
| Coverage depth beyond endpoints (keywords/examples, valid vs invalid) | Moves from "was hit" to "was meaningfully validated" | HIGH | Schemathesis coverage reports include operations, parameters, schema keywords, examples, and responses. |
| Traceability by suite/run with call counts | Shows which test suite provides evidence and where gaps remain | HIGH | Mature reports expose per-endpoint call counts; suite/run attribution is high-value for large Java repos. |
| Java-native adapter ecosystem (Spring MVC recorder + RestAssured/Cucumber/Karate tagging) | Lowers adoption friction in existing Java test stacks | MEDIUM | `swagger-coverage` ships RestAssured and Karate integrations; this domain rewards adapter breadth. |
| Incremental/PR-focused gating (changed operations first) | Reduces CI noise and accelerates rollout in legacy services | HIGH | Not standard in most OSS tools today; strong practical differentiator for enterprise adoption. |
| Actionable remediation output (missing operation, missing status, suggested next test) | Converts report from dashboard artifact into engineering action list | MEDIUM | Differentiator is workflow quality, not just more metrics. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Mandatory web dashboard/backend in v1 | Stakeholders want "pretty charts" | Adds hosting/state/auth complexity; conflicts with CLI-first delivery and slows OSS adoption | Ship CLI + JSON/HTML artifacts first; let teams plug into existing dashboards |
| Multi-protocol expansion in v1 (AsyncAPI, gRPC, GraphQL) | "One tool for all API styles" sounds strategic | Explodes matching logic and quality surface; risks weakening OpenAPI/Java core value | Keep v1 OpenAPI HTTP focused, design extension points for v2 |
| Built-in autonomous test generation as core scope | Promises quick coverage gains | Fuzzing/stateful generation is a separate product surface with high false-positive risk | Integrate with external generators (e.g., Schemathesis) via report ingestion |
| Single global percentage as only success metric | Easy to communicate | Hides critical gaps (e.g., unimplemented endpoint with high overall percent) | Enforce multi-dimensional gates (coverage %, missed ops in spec, undeclared statuses) |
| Recorder that can break request flow on IO/report errors | "Strictness" is mistaken for reliability | Violates service safety expectations in test/staging; creates flaky pipelines | Fail-open recording with explicit warnings and post-run hard gates |

## Feature Dependencies

```text
[OpenAPI ingestion + normalization]
    └──requires──> [Operation identity matching (method + route template)]
                       └──requires──> [Operation-level coverage report]
                                          └──requires──> [CI quality gates]

[Request/response evidence capture]
    └──requires──> [Status + parameter coverage]
                       └──enables──> [Coverage depth (keywords/examples)]

[Endpoint discovery from running app]
    └──requires──> [Spec-implementation drift detection]
                       └──enables──> [Missed-ops governance rules]

[Structured report schema]
    └──requires──> [Gradle plugin + GitHub Action integrations]

[Spec diff capability]
    └──enables──> [PR-focused incremental gating]
```

### Dependency Notes

- **Operation coverage requires canonical matching:** without stable method/path normalization, all downstream metrics are noisy.
- **Depth metrics depend on capture fidelity:** parameter/keyword coverage is only credible if requests and responses are recorded consistently.
- **Drift detection needs two inventories:** you need both spec operations and discovered runtime endpoints to classify gaps correctly.
- **CI integration depends on deterministic outputs:** stable schemas + exit codes are prerequisites for Gradle and GitHub workflow adoption.
- **Incremental gating depends on diffing:** changed-operation gating is impossible without reliable spec diff and mapping logic.

## MVP Definition

### Launch With (v1)

Minimum viable product - what is needed to validate the concept.

- [ ] OpenAPI-first ingestion + operation normalization for Java HTTP services
- [ ] Operation + status + parameter coverage from recorded test traffic
- [ ] Deterministic JSON report + clear CLI summary with uncovered items
- [ ] CI governance gates (minimum coverage, missed operation thresholds)
- [ ] Exclusion/config rules (deprecated ops, health endpoints, status ignore lists)

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Spec-implementation drift detection with explicit mismatch categories
- [ ] Suite/run-level traceability and endpoint call counts in report output
- [ ] PR annotation / changed-endpoint-focused failure messaging

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Schema keyword/example positive-vs-negative coverage scoring
- [ ] Native fuzzing/stateful sequence generation engine
- [ ] Multi-protocol coverage (AsyncAPI/gRPC/GraphQL)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| OpenAPI ingestion + normalization | HIGH | MEDIUM | P1 |
| Operation + status + parameter coverage | HIGH | HIGH | P1 |
| CI governance thresholds + deterministic exit codes | HIGH | MEDIUM | P1 |
| Exclusions/rules configuration | HIGH | MEDIUM | P1 |
| Drift detection (spec vs implementation) | HIGH | HIGH | P2 |
| Suite/run traceability | MEDIUM | HIGH | P2 |
| PR-focused incremental gating | MEDIUM | HIGH | P2 |
| Keyword/example depth metrics | MEDIUM | HIGH | P3 |
| Native fuzzing engine | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Swagger Coverage | Specmatic | Schemathesis | Our Approach |
|---------|------------------|-----------|--------------|--------------|
| Endpoint/operation coverage | Strong (core) | Strong | Strong | P1 baseline |
| Status/parameter condition coverage | Strong (rules-driven) | Medium | Strong (deep) | P1 baseline |
| Spec-implementation mismatch detection | Limited | Strong (core value) | Limited | P2 differentiator |
| CI governance thresholds | Medium | Strong | Medium | P1 baseline |
| Java-first integration ergonomics | Strong | Strong | Limited (language-agnostic runner) | Strong and explicit |
| Schema depth (keywords/examples, positive/negative) | Limited | Limited | Strong | P3 / optional integration |

## Sources

- Swagger Coverage README (official): https://raw.githubusercontent.com/viclovsky/swagger-coverage/master/README.md (HIGH)
- Specmatic reports configuration docs (official): https://docs.specmatic.io/references/configuration/reports (HIGH)
- Specmatic complete configuration examples (official): https://docs.specmatic.io/references/configuration/complete-examples.html (HIGH)
- Specmatic API coverage walkthrough (official blog/demo): https://specmatic.io/demonstration/detect-mismatches-between-your-api-specifications-and-implementation-specmatic-api-coverage-report (MEDIUM)
- Schemathesis CLI reference (official): https://schemathesis.readthedocs.io/en/latest/reference/cli/ (HIGH)
- Schemathesis coverage report example (official workbench artifact): https://workbench.schemathesis.io/coverage/mealie-baseline/schema-coverage.html (MEDIUM)
- Reqover docs README (official repository docs): https://raw.githubusercontent.com/reqover/docs/main/README.md (MEDIUM)
- Dredd "How it works" docs (official, OpenAPI 2 era baseline): https://dredd.org/en/latest/how-it-works.html (MEDIUM)

---
*Feature research for: Java API specification coverage tooling*
*Researched: 2026-03-04*
