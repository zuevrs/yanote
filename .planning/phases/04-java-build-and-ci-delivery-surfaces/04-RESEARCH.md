# Phase 4: Java Build and CI Delivery Surfaces - Research

**Researched:** 2026-03-04  
**Domain:** Gradle plugin delivery and GitHub Actions CI surfaces for deterministic Yanote analyzer/governance behavior  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Gradle task contract
- The Gradle surface exposes a stable v1 task pair: `yanoteReport` for report generation and `yanoteCheck` for blocking governance validation.
- Gradle integration uses explicit opt-in wiring to the standard `check` lifecycle through a simple boolean-style plugin configuration, rather than auto-hooking by default.
- Multi-module builds support both per-module tasks and a root-level aggregate task so teams can debug locally per project and still run one top-level CI-friendly command.
- Module participation defaults to automatic discovery of Java projects, with an explicit exclude mechanism to keep adoption low-friction but controlled.
- Missing required inputs are treated differently by task type: `yanoteCheck` fails hard with actionable diagnostics, while `yanoteReport` can remain report-first and non-blocking.
- Default Gradle outputs include both per-module artifacts and one aggregate report artifact so teams get drill-down plus a single merge-oriented view.
- The primary policy source in the Gradle channel is the project policy file, with only a limited, explicit set of DSL/CLI-style overrides allowed on top.
- Local console output should stay compact by default and push deeper detail into standard Gradle verbosity levels and generated artifacts.
- The Gradle DSL and task names are a compatibility surface: stable across v1 minor releases, with breaking changes reserved for future major versions.

### GitHub PR feedback contract
- The required PR-facing experience is built around GitHub Checks status, a concise job summary, and published artifacts; PR comments are not part of the mandatory v1 contract.
- The job summary is the primary human-readable surface in GitHub and should remain roughly single-screen in size.
- The summary should preserve parity with the Phase 2/3 CLI contract: key coverage metrics, deterministic top issues, fail reasons, and clear references to generated artifacts.
- The summary should show a top 5 issue list by default, using deterministic ordering rather than dumping the full report into the PR UI.
- Report artifacts should always be uploaded when a stable snapshot can be produced, including failed runs.
- The default artifact bundle should include the deterministic JSON report plus lightweight diagnostic/supporting outputs that help users debug failures quickly.
- Artifact names should be deterministic and human-recognizable rather than run-randomized.
- Failure presentation in GitHub should mirror the CLI contract closely enough that the same primary failure and ordered secondary diagnostics remain recognizable across channels.
- CI surfaces must avoid leaking unnecessary raw event payloads or other overly verbose evidence into summaries/artifacts; include only what is needed for actionable debugging.
- The PR feedback contract should serve both humans and automation: concise summary for fast review, stable artifacts for machine consumption.

### Channel defaults and strictness
- Delivery channels choose defaults by environment: local Gradle usage defaults to a local/report-first profile, while GitHub Action defaults to the strict CI profile.
- Override precedence remains aligned with prior phases: explicit channel input/DSL override > policy file > built-in defaults.
- The CI profile is explicitly fail-closed for invalid/incomplete evidence, semantic invalidity, and gate failures.
- The local default is optimized for fast feedback and low friction: generating reports and warnings first, with blocking enforcement moved to the explicit `yanoteCheck` path.
- GitHub Action should expose only a limited, explicit set of inputs for overrides, rather than acting as an unrestricted CLI pass-through.
- The Gradle DSL should mirror that same limited override set so the two channels stay conceptually aligned.
- Core failure/status fields stay consistent across local and CI channels even if presentation differs by medium (terminal vs GitHub summary/check output).
- Onboarding priority is low-friction adoption: sensible defaults and minimal mandatory setup for a working first integration.

### Merge-blocking CI and verification scope
- Phase 4 is designed explicitly for GitHub branch protection and merge blocking, not just informational CI.
- The default protected-branch contract uses two stable required checks: one for build/test validation and one for Yanote coverage/governance validation.
- For ordinary pull requests, the required checks favor a faster blocking path: build/tests plus Yanote coverage/gates, without forcing the heaviest end-to-end workflow on every PR.
- Full end-to-end v1 workflow validation is still required and blocking for `main` and release-oriented flows, where confidence matters more than PR speed.
- Java 21 is an explicit, hard baseline across all required checks in this phase, not a best-effort signal.
- Required checks are expected to be deterministic; flakiness is treated as a CI/pipeline defect to fix, not a normal condition to tolerate.
- Any merge-blocking failure must be actionable: the failing check must point reviewers toward the next step through status, summary, and retained artifacts.
- Artifact retention should be long enough to investigate current PR failures and recent regressions, but not stretched into an unnecessary long-term archive.

### Claude's Discretion
- Exact Gradle plugin ID, extension name, and final DSL property names, as long as they reflect the locked task/configuration contract.
- Exact naming of aggregate vs per-module task variants, provided the stable `yanoteReport` / `yanoteCheck` user-facing contract remains clear.
- Exact GitHub Action input names and which supporting diagnostic files accompany the JSON report artifact.
- Exact text/layout of the GitHub job summary, provided it stays concise and preserves CLI-parity fields.
- Exact artifact retention duration value within the agreed medium-term range.
- Exact branch/ref triggers and workflow decomposition needed to realize the required PR vs `main`/release validation split.

### Deferred Ideas (OUT OF SCOPE)
- Rich PR comment workflows (sticky comments, per-run comments) as a first-class UX surface - potential later enhancement, not required for Phase 4.
- Broader Java version matrices beyond the Java 21 baseline - separate future compatibility scope.
- Cross-platform/non-GitHub CI delivery channels (other CI systems, non-GitHub SCM integrations) - outside current phase scope.
- Release publishing and signed Maven Central/GitHub release automation - explicitly reserved for Phase 5.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DELV-02 | Developer can run coverage analysis via Gradle plugin tasks integrated into Java build lifecycle | Use a thin Gradle wrapper plugin that shells into the existing Node analyzer contract, exposes stable `yanoteReport` and `yanoteCheck`, supports aggregate multi-module orchestration, and optional explicit `check` hook-in. |
| DELV-03 | Team can run coverage analysis via GitHub Action and consume resulting artifacts/check outcomes | Add a dedicated GitHub workflow/check job with Java 21 setup, deterministic summary via `GITHUB_STEP_SUMMARY`, and artifact upload with stable names even on failures (`if: always()`). |
| QUAL-02 | CI runs unit, integration, and end-to-end checks for v1 workflow and blocks merges on failure | Split required checks into (1) build/test and (2) yanote validation; include unit/integration suites plus e2e v1 workflow (`examples/docker-compose.yml`) on `main`/release paths; enforce branch protection required checks. |
| QUAL-03 | Team verifies Java 21 baseline compatibility in automated checks | Keep Gradle Java toolchain 21 as source of truth and enforce `actions/setup-java` Java 21 in all required workflow jobs; fail if any required check runs under non-21 runtime. |
</phase_requirements>

<research_summary>
## Summary

Phase 4 should be planned as a delivery-channel phase, not a semantics phase. The core analyzer and governance contract already exist in `yanote-js/src/cli.ts` (typed failure classes, deterministic summary ordering, fixed `YANOTE_SUMMARY` line, fail-closed behavior) and deterministic report writing already exists in `yanote-js/src/report/writeReport.ts`. The highest-value strategy is to reuse that exact contract through Gradle and GitHub wrappers.

The repository currently has no Gradle plugin implementation and no `.github/workflows/*.yml`. That means DELV-02/03 and QUAL-02/03 are mostly delivery-surface additions on top of existing analyzer functionality. Existing reusable foundations are strong: Java 21 toolchain is already locked in root Gradle (`build.gradle.kts`), deterministic dist tasks already package the Node analyzer (`distNodeAnalyzer`), and e2e scenario assets exist (`examples/docker-compose.yml`, `examples/tests-restassured`).

**Primary recommendation:** plan Phase 4 in three executable waves: (1) Gradle plugin and task contract with multi-module aggregation, (2) GitHub workflow/check/artifact/summary contract for pull requests, (3) merge-blocking CI topology plus Java 21 and end-to-end verification hardening.
</research_summary>

<implementation_gaps>
## Current Code: What Exists vs What Is Missing

### Already in place (reuse directly)
- Java 21 baseline is already configured in root `build.gradle.kts` via `JavaLanguageVersion.of(21)`.
- Deterministic Node analyzer packaging exists via `distNodeAnalyzer` and `dist/node-analyzer/bin/yanote.cjs`.
- CLI governance/report contract is mature (`yanote-js/src/cli.ts`, `yanote-js/src/gates/policy.ts`, `yanote-js/src/cli.summary.contract.test.ts`, `yanote-js/src/cli.failclosed.contract.test.ts`).
- Existing e2e v1 flow exists in `examples/docker-compose.yml` and demonstrates API -> tests -> analyzer sequencing.
- Existing test foundations cover Java modules (JUnit 5) and Node analyzer (Vitest).

### Missing for Phase 4
- No Gradle plugin module or plugin class currently exists.
- No `yanoteReport` / `yanoteCheck` tasks currently exist.
- No aggregate/per-module yanote task orchestration exists yet.
- No GitHub Actions workflow file exists in `.github/workflows/`.
- No branch-protection check naming contract is encoded/documented yet.
- No CI summary rendering layer that maps CLI parity fields into `GITHUB_STEP_SUMMARY`.
</implementation_gaps>

<standard_stack>
## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| Gradle Wrapper | 8.10.2 | Build orchestration and plugin execution surface | Already locked in `gradle/wrapper/gradle-wrapper.properties`; aligns with existing repo conventions. |
| Java Toolchain | 21 | Runtime/build compatibility baseline | Already locked globally in root Gradle and explicitly required by Phase 4. |
| Yanote CLI (`yanote.cjs`) | from current `yanote-js` build | Source-of-truth analyzer/gate semantics | Preserves Phase 2/3 deterministic contracts across new channels. |
| `actions/setup-java` | v5 (current README) | Pin Java runtime in CI jobs | Official action; supports explicit `java-version: '21'` and dependency cache modes. |
| `gradle/actions/setup-gradle` | v5 | Gradle cache/setup in CI | Official Gradle-maintained action for wrapper-centric CI execution. |
| `actions/upload-artifact` | v4 | Publish deterministic report and diagnostics artifacts | Official and required for retained evidence in failed/successful CI runs. |

### Supporting
| Library/Tool | Version | Purpose | When to Use |
|--------------|---------|---------|-------------|
| `actions/checkout` | v5+ | Source checkout in workflows | Required in all CI jobs before Gradle/Node commands. |
| `GITHUB_STEP_SUMMARY` | GitHub Actions workflow command | Concise PR-facing summary | Render top-level coverage/gate outcomes without noisy logs. |
| Branch protection required checks | GitHub repository setting | Merge blocking policy enforcement | Required to make DELV-03 and QUAL-02 operationally real. |
| `merge_group` trigger | GitHub Actions event | Keep required checks valid in merge queue mode | Include when merge queue is enabled, or required checks may not report. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Thin Gradle wrapper over CLI | Reimplement analyzer logic in Gradle plugin | High drift risk vs locked parity contract; duplicates semantics and tests. |
| `upload-artifact@v4` stable names | Raw log scraping only | Loses deterministic machine-consumable artifacts and triage quality. |
| `GITHUB_STEP_SUMMARY` summary | Required PR comments | Deferred by user constraints; comments add noisy mutable surface. |
| `setup-gradle` action | Only `setup-java` gradle cache | Works for simple flows, but setup-gradle is better for Gradle-specific CI behavior and reporting. |

**Installation / setup commands (implementation-time):**
```bash
npm -C yanote-js ci
npm -C yanote-js run build
./gradlew distNodeAnalyzer
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
.
├── yanote-gradle-plugin/                 # New: Gradle plugin module (Kotlin/JVM)
│   ├── src/main/kotlin/...               # Plugin, extension, task types
│   └── src/test/kotlin/...               # Plugin functional/task wiring tests
├── .github/workflows/
│   └── yanote-ci.yml                     # New: required CI checks + artifact publication
├── yanote-js/                            # Existing analyzer source-of-truth
└── examples/docker-compose.yml           # Existing v1 e2e scenario
```

### Pattern 1: Thin Wrapper, Single Semantics Core
**What:** Gradle tasks and CI workflows must execute existing CLI semantics (`yanote.cjs report`) instead of re-implementing coverage/governance logic.  
**When to use:** All delivery channels (local Gradle and GitHub CI).  
**Example:**
```bash
node dist/node-analyzer/bin/yanote.cjs report \
  --spec <spec-path> \
  --events <events-path> \
  --out <out-dir> \
  --policy <policy-path> \
  --profile <ci|local>
```

### Pattern 2: Configuration Avoidance and Explicit Lifecycle Hook
**What:** Register tasks lazily with `tasks.register` and wire `check` dependency only when opt-in flag is enabled.  
**When to use:** Gradle plugin task registration and `check` lifecycle integration.  
**Example:**
```kotlin
// Source: https://docs.gradle.org/current/userguide/task_configuration_avoidance
val yanoteCheck by tasks.registering
tasks.named("check") {
    dependsOn(yanoteCheck)
}
```

### Pattern 3: Multi-Module Dual Surface (per-module + aggregate)
**What:** Provide per-module `yanoteReport`/`yanoteCheck` and root aggregate variants; support excludes for scoped adoption.  
**When to use:** Any multi-project Java build where local debugging and one-shot CI command both matter.  
**Example:**
```kotlin
// Pseudocode: aggregate task depends on eligible subproject yanoteCheck tasks
subprojects.filter(::isEligibleJavaModule).forEach { module ->
    aggregateYanoteCheck.configure { dependsOn(module.tasks.named("yanoteCheck")) }
}
```

### Pattern 4: Deterministic GitHub Check Surface
**What:** Use one workflow job for yanote validation that always publishes deterministic artifacts and concise summary.  
**When to use:** Pull request checks and required merge-blocking status checks.  
**Example:**
```yaml
# Sources: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
#          https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-java-with-gradle
jobs:
  yanote-validation:
    steps:
      - uses: actions/setup-java@v5
        with:
          distribution: temurin
          java-version: '21'
      - uses: gradle/actions/setup-gradle@v5
      - run: ./gradlew yanoteCheck
      - run: cat build/yanote/summary.md >> "$GITHUB_STEP_SUMMARY"
      - if: ${{ always() }}
        uses: actions/upload-artifact@v4
        with:
          name: yanote-report-${{ github.sha }}
          path: build/yanote/**
```

### Pattern 5: Two Required Checks Contract
**What:** Stable check names for branch protection: one build/test check and one yanote governance check.  
**When to use:** Protected branch merge-blocking setup for PRs.  
**Example:**
```yaml
jobs:
  build-and-test:   # required check name 1
  yanote-validation: # required check name 2
```

### Anti-Patterns to Avoid
- **Analyzer reimplementation in Gradle:** breaks DELV-02 parity and doubles maintenance.
- **Implicit auto-hook into `check` by default:** violates locked low-friction onboarding decision.
- **Non-deterministic artifact naming:** weakens machine consumption and triage.
- **Workflow-only `pull_request` trigger when merge queue is enabled:** required checks can fail to report in queue context.
- **Verbose raw payload dumps in summaries/artifacts:** violates locked security/noise constraints.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CI artifact transport | Custom artifact upload scripts | `actions/upload-artifact@v4` | Handles retention, error behavior, and immutable archives. |
| CI Java setup | Ad hoc apt/sdk install scripts | `actions/setup-java` | Deterministic JDK provisioning and cache integration. |
| Gradle cache wiring | Manual cache key shell logic | `gradle/actions/setup-gradle` | Maintained Gradle-specific caching and wrapper integration. |
| PR summary transport | Custom API calls for comments/check text | `GITHUB_STEP_SUMMARY` + checks output | Simpler, first-class workflow surface, less auth complexity. |
| Coverage/gate semantics | New Java implementation in plugin | Existing `yanote-js` CLI contract | Avoids drift from Phase 2/3 deterministic behavior. |

**Key insight:** Phase 4 quality depends on transport fidelity, not new analyzer features. Build wrappers that preserve semantics exactly.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Channel drift in policy defaults
**What goes wrong:** Gradle local and GitHub CI produce different gate outcomes for same evidence.  
**Why it happens:** Different profile/default/override precedence between channels.  
**How to avoid:** Centralize profile resolution (`local` for report-first Gradle, `ci` for workflow default) and keep override precedence identical to CLI contract.  
**Warning signs:** Same input passes in one channel and fails in another with no policy change.

### Pitfall 2: Eager task realization and slow/noisy Gradle config
**What goes wrong:** Plugin config time increases and multi-module builds become brittle.  
**Why it happens:** Using `tasks.create`/direct task access instead of lazy registration.  
**How to avoid:** Use `tasks.register` and `tasks.named` wiring only.  
**Warning signs:** Tasks materialize during configuration even when yanote tasks are not requested.

### Pitfall 3: Artifacts missing on failed runs
**What goes wrong:** CI fails but no report artifact is available for debugging.  
**Why it happens:** Upload step runs only on success path.  
**How to avoid:** Use `if: ${{ always() }}` for artifact upload and ensure output path exists when snapshot is available.  
**Warning signs:** Failed checks have no retained `yanote-report.json`.

### Pitfall 4: Branch protection ambiguity
**What goes wrong:** PR merges are blocked or inconsistent because required check names are ambiguous.  
**Why it happens:** Duplicate/non-unique job names across workflows or renamed required checks.  
**How to avoid:** Use stable unique job names and document them as protected-branch contract.  
**Warning signs:** GitHub UI shows pending/unknown required status despite workflow completion.

### Pitfall 5: Merge queue checks never report
**What goes wrong:** PR passes regular checks but merge queue fails due missing required status in queue runs.  
**Why it happens:** Workflow lacks `merge_group` trigger while required checks are enforced.  
**How to avoid:** Include `merge_group` (types: `checks_requested`) when merge queue is enabled.  
**Warning signs:** Merge queue run reports required checks not reported.

### Pitfall 6: Java baseline mismatch
**What goes wrong:** Local Gradle uses toolchain 21 but CI uses another JDK.  
**Why it happens:** Workflow `setup-java` version not pinned to 21.  
**How to avoid:** Set `java-version: '21'` in all required jobs and keep Gradle toolchain enforcement.  
**Warning signs:** Runtime-specific failures present only in CI or only locally.
</common_pitfalls>

<planning_guidance>
## Planning Guidance for Executable Plans

### Wave split recommendation

1. **Wave 1 - Gradle Delivery Surface (DELV-02, partial QUAL-03)**
   - Add plugin module and stable task contract (`yanoteReport`, `yanoteCheck`).
   - Implement explicit opt-in `check` lifecycle wiring.
   - Add module discovery + exclusion + aggregate task orchestration.
   - Add tests for parity invocation args and output path conventions.

2. **Wave 2 - GitHub Delivery Surface (DELV-03)**
   - Add `.github/workflows/yanote-ci.yml` with two stable jobs (build/test + yanote validation).
   - Add Java 21 setup and deterministic summary rendering (`GITHUB_STEP_SUMMARY`).
   - Upload deterministic artifact bundle on success/failure paths.
   - Keep PR summary to top metrics/top 5 issues + artifact references.

3. **Wave 3 - Merge-Blocking and Verification Hardening (QUAL-02, QUAL-03)**
   - Add main/release full e2e v1 workflow gate (compose-based or equivalent deterministic sequence).
   - Ensure required checks map cleanly to branch protection contract.
   - Include `merge_group` trigger if merge queue is used.
   - Lock Java 21 baseline assertions in CI and add failure diagnostics for mismatch.

### Plan acceptance criteria (minimum)
- One canonical analyzer execution path across CLI, Gradle, and GitHub Action channels.
- Stable required check names and branch-protection-ready workflow outputs.
- Artifacts and summaries remain deterministic and actionable on failures.
- Java 21 enforced in Gradle toolchain and required CI jobs.
</planning_guidance>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Gradle task registration and check wiring (configuration avoidance)
```kotlin
// Source: https://docs.gradle.org/current/userguide/task_configuration_avoidance
val check by tasks.registering
val verificationTask by tasks.registering {
    // Configure verificationTask
}
check { dependsOn(verificationTask) }
```

### GitHub Java + Gradle + artifact upload skeleton
```yaml
# Source: https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-java-with-gradle
steps:
  - uses: actions/checkout@v5
  - uses: actions/setup-java@v4
    with:
      java-version: '17'
      distribution: 'temurin'
  - name: Setup Gradle
    uses: gradle/actions/setup-gradle@017a9effdb900e5b5b2fddfb590a105619dca3c3
  - name: Build with Gradle
    run: ./gradlew build
  - name: Upload build artifacts
    uses: actions/upload-artifact@v4
    with:
      name: Package
      path: build/libs
```

### Always-run artifact upload and job summary
```yaml
# Sources:
# - https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs
# - https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
steps:
  - name: Render summary
    run: |
      echo "## Yanote Coverage Summary" >> "$GITHUB_STEP_SUMMARY"
      echo "- status: $STATUS" >> "$GITHUB_STEP_SUMMARY"
  - name: Upload yanote artifacts
    if: ${{ always() }}
    uses: actions/upload-artifact@v4
    with:
      name: yanote-report-${{ github.sha }}
      path: build/yanote/**
      if-no-files-found: error
```
</code_examples>

<state_of_the_art>
## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Eager Gradle task creation/mutation | Configuration-avoidance APIs (`tasks.register`, `tasks.named`) | Current Gradle user guide guidance | Better multi-module performance and predictable task wiring. |
| `upload-artifact@v3` mutable legacy behavior | `upload-artifact@v4` immutable artifacts and newer backend | v4 era (v3 deprecation announced for 2024-11-30) | More deterministic artifact handling and fewer corruption edge cases. |
| Pull request checks only | Include `merge_group` event when merge queue is used | GitHub merge queue model | Required checks continue to report in queue context. |
| Ad hoc JDK setup in CI | `actions/setup-java` with explicit `java-version` and distribution | Current Actions best practice | Deterministic Java baseline and cleaner compatibility enforcement. |

**Deprecated/outdated:**
- `actions/upload-artifact@v3` for github.com workflows: deprecated; use v4+.
</state_of_the_art>

<open_questions>
## Open Questions

1. **Plugin packaging location**
   - What we know: No plugin module exists yet; naming is discretionary.
   - What's unclear: Dedicated `yanote-gradle-plugin` module vs in-repo convention plugin placement.
   - Recommendation: Use dedicated module to align with Phase 5 publication goals.

2. **Exact required check names**
   - What we know: Two required checks are locked (build/test and yanote validation).
   - What's unclear: Final canonical job names to freeze in branch protection.
   - Recommendation: Decide names early and treat as v1 contract.

3. **Artifact retention duration**
   - What we know: Must be medium-term, not long-term archival.
   - What's unclear: Exact retention-days value.
   - Recommendation: Set 7-14 days for PR workflows; revisit after CI usage data.

4. **Main/release e2e execution strategy**
   - What we know: Full e2e required for `main` and release flows.
   - What's unclear: Reuse `examples/docker-compose.yml` directly vs dedicated CI script wrapper.
   - Recommendation: Start with existing compose orchestration for determinism; wrap only if needed for CI ergonomics.
</open_questions>

<validation_architecture>
## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Java: JUnit 5 via Gradle `test`; Node: Vitest via `npm -C yanote-js test`; e2e: Docker Compose v1 flow |
| Config file | Gradle defaults (`build.gradle.kts`), no dedicated Vitest config file present |
| Quick run command | `./gradlew test && npm -C yanote-js test` |
| Full suite command | `./gradlew test distNodeAnalyzer && npm -C yanote-js test && docker compose -f examples/docker-compose.yml up --build --exit-code-from report` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DELV-02 | Gradle plugin tasks run analyzer/gates with CLI-parity outputs | integration + contract | `./gradlew yanoteReport yanoteCheck` | ❌ Wave 0 |
| DELV-03 | GitHub workflow runs coverage checks, summaries, and artifacts for PRs | CI integration | Trigger `.github/workflows/yanote-ci.yml` on `pull_request` | ❌ Wave 0 |
| QUAL-02 | CI runs unit/integration/e2e and blocks merges | CI system | `./gradlew test && npm -C yanote-js test` (PR) plus compose e2e on `main`/release | ⚠️ Partial (workflow missing) |
| QUAL-03 | Java 21 enforced across required checks | compatibility gate | `actions/setup-java` with `java-version: '21'` + Gradle toolchain 21 checks | ⚠️ Partial (workflow missing) |

### Sampling Rate
- **Per task commit:** `./gradlew test` for touched Java modules and `npm -C yanote-js test` when CLI wiring changes.
- **Per wave merge:** `./gradlew test && npm -C yanote-js test`.
- **Phase gate:** Full suite green including e2e (`docker compose -f examples/docker-compose.yml up --build --exit-code-from report`) before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `.github/workflows/yanote-ci.yml` - required check orchestration for DELV-03 / QUAL-02 / QUAL-03
- [ ] Gradle plugin module (for example `yanote-gradle-plugin/`) with stable task contract for DELV-02
- [ ] Plugin task contract tests (task wiring, profile defaults, override precedence)
- [ ] CI summary renderer that maps CLI parity fields into job summary output
- [ ] Branch protection setup doc/checklist with exact required check names

</validation_architecture>

<sources>
## Sources

### Primary (HIGH confidence)
- `.planning/phases/04-java-build-and-ci-delivery-surfaces/04-CONTEXT.md` - locked decisions, discretion, deferred scope.
- `.planning/REQUIREMENTS.md` - DELV-02, DELV-03, QUAL-02, QUAL-03 definitions.
- `build.gradle.kts`, `settings.gradle.kts`, `gradle/wrapper/gradle-wrapper.properties` - Java 21 and Gradle baseline.
- `yanote-js/src/cli.ts`, `yanote-js/src/gates/policy.ts`, `yanote-js/src/report/writeReport.ts` - deterministic semantics to preserve.
- `examples/docker-compose.yml`, `examples/tests-restassured/src/test/java/.../DemoServiceE2eTest.java` - existing e2e flow primitives.
- Context7 `/websites/gradle_current_userguide` - task configuration avoidance and check wiring.
- Context7 `/websites/github_en_actions` - workflow syntax, `always()`, artifact and job summary guidance.
- [GitHub Docs - Building and testing Java with Gradle](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-java-with-gradle).
- [actions/setup-java README](https://raw.githubusercontent.com/actions/setup-java/main/README.md).
- [actions/upload-artifact README](https://raw.githubusercontent.com/actions/upload-artifact/main/README.md).
- [GitHub Docs - About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging).

### Secondary (MEDIUM confidence)
- [GitHub Docs - Events that trigger workflows (`merge_group`)](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#merge_group).
- [gradle/actions setup-gradle README](https://raw.githubusercontent.com/gradle/actions/main/setup-gradle/README.md).

### Tertiary (LOW confidence)
- None.
</sources>

<metadata>
## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - mostly existing repo baselines plus official action docs.
- Architecture: HIGH - directly constrained by locked decisions and existing implementation boundaries.
- Pitfalls: HIGH - derived from known CI/Gradle delivery failure modes and official guidance.

**Research date:** 2026-03-04  
**Valid until:** 2026-04-03
</metadata>

---

*Phase: 04-java-build-and-ci-delivery-surfaces*  
*Research completed: 2026-03-04*  
*Ready for planning: yes*
