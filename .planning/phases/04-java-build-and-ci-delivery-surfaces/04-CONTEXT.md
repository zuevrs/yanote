# Phase 4: Java Build and CI Delivery Surfaces - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the existing deterministic analyzer and governance workflow through Java-native Gradle tasks and a GitHub Action so teams can run the same coverage and gate behavior in local builds and merge-blocking CI on Java 21. This phase defines delivery-surface UX, PR feedback, CI enforcement, and verification scope. It does not add new coverage semantics, new governance capabilities, release publishing, or broader runtime/version support beyond the Java 21 baseline already set for v1.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `build.gradle.kts`: Already defines root-level distribution tasks and is the natural place to align new delivery-surface orchestration with established Gradle conventions.
- `settings.gradle.kts`: Current module registry provides the source of truth for multi-module Java project discovery and aggregate-task scope.
- `yanote-js/src/cli.ts`: Existing deterministic `report` command, typed failure classes, policy handling, and stable summary/error contracts should remain the execution core behind new delivery channels.
- `yanote-js/package.json`: Existing build and runtime packaging for the analyzer (`yanote.cjs`) can be reused rather than creating a second analyzer implementation.
- `examples/docker-compose.yml`: Current end-to-end workflow already demonstrates service -> tests -> analyzer sequencing and is a practical baseline for Phase 4 CI flow design.
- `README.md` and `dist/` conventions: Existing user-facing docs already position root Gradle tasks and CLI usage as supported entrypoints; Phase 4 should extend this rather than replace it.

### Established Patterns
- CLI/report/error behavior is already treated as a compatibility surface and should stay the source of truth for delivery-channel parity.
- The repository already distinguishes between distribution/build orchestration in Gradle and analyzer semantics in the Node CLI, which supports a wrapper-style delivery approach.
- Java 21 is already enforced as the Gradle toolchain baseline across subprojects, so Phase 4 should verify that baseline rather than introduce a broader runtime matrix.
- Existing examples and tests favor deterministic, artifact-based validation over loosely defined logs, which fits the merge-blocking CI direction.
- Prior governance decisions already distinguish stricter CI defaults from softer local usage, so Phase 4 should preserve that split instead of flattening it.

### Integration Points
- Gradle delivery surface should connect at the root build plus participating Java subprojects, using current lifecycle hooks around `check` and existing module discovery.
- GitHub Action should wrap the same analyzer/report/gate path that currently runs through `yanote-js/src/cli.ts`, not define a separate semantics layer.
- Merge-blocking PR validation should integrate with GitHub Checks / branch protection using the two-check contract decided in this phase.
- Full end-to-end validation can build on the existing example workflow assets and root test commands to verify real Java 21 behavior across the v1 path.
- Artifact publication should connect to the existing deterministic report outputs so users can inspect the same machine-readable evidence in local runs and CI.

</code_context>

<specifics>
## Specific Ideas

- Favor a wrapper strategy: Gradle and GitHub Action should feel native in their environments, but they should still be thin delivery shells over the already-locked CLI and governance behavior.
- Keep Phase 4 optimized for adoption: teams should be able to start with sane defaults, get useful PR feedback quickly, and only opt into stricter lifecycle integration where they choose.
- Preserve one mental model across channels: the same analyzer semantics, the same core diagnostics, and the same recognizable report artifacts whether a user runs locally or in CI.

</specifics>

<deferred>
## Deferred Ideas

- Rich PR comment workflows (sticky comments, per-run comments) as a first-class UX surface - potential later enhancement, not required for Phase 4.
- Broader Java version matrices beyond the Java 21 baseline - separate future compatibility scope.
- Cross-platform/non-GitHub CI delivery channels (other CI systems, non-GitHub SCM integrations) - outside current phase scope.
- Release publishing and signed Maven Central/GitHub release automation - explicitly reserved for Phase 5.

</deferred>

---

*Phase: 04-java-build-and-ci-delivery-surfaces*
*Context gathered: 2026-03-04*
