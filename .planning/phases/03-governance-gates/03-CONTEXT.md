# Phase 3: Governance Gates - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Define deterministic governance gate behavior for the standalone CLI coverage workflow. This phase sets pass/fail policy for threshold, regression, exclusions, and failure precedence over the existing Phase 2 coverage/report contract. It does not add new delivery channels (Gradle plugin/GitHub Action), new protocol support, or release automation.

</domain>

<decisions>
## Implementation Decisions

### Threshold policy
- Primary blocking gate is operation coverage.
- Aggregate gating is optional and enabled via dedicated flag (`--min-aggregate`) in addition to `--min-coverage`.
- Default operation threshold for CI is 95%.
- Default aggregate threshold (when aggregate gate is enabled) is 85%.
- Warning band is enabled at threshold minus 2% as pre-fail signal.
- If aggregate is `N/A`, aggregate gate is skipped (operation gate remains mandatory).
- Threshold checks are applied after exclusions are resolved.
- Critical operation list is supported; loss of critical coverage is hard-fail.
- Threshold comparisons use raw decimal values; rounding is display-only.
- Configuration precedence is CLI > policy file > defaults.
- Unmatched events are reported as separate quality signal and do not enter threshold denominator.
- Gate behavior is enforce-in-CI, warn-capable locally.

### Regression policy
- Baseline is versioned and includes covered operations plus dimension summary snapshot.
- Any loss of previously covered operation is hard regression fail.
- Dimension regressions (status/parameters/aggregate) are warning-level in Phase 3; hard-fail can be introduced later.
- Regression comparison is performed on the same post-exclusion scope as threshold checks.
- Baseline updates are explicit command-driven (no automatic overwrite).
- Main/default branch baseline is the source of truth for CI regression checks.
- If an operation is removed from spec, absence is neutral (not counted as regression).
- Regression reporting is sorted by canonical operation key (`METHOD + ROUTE`).
- Incompatible baseline format/schema causes input-class fail with actionable hint to regenerate baseline.
- CI defaults to fail-on-regression; local runs can relax this behavior.

### Exclusion policy
- Primary exclusion syntax is prefix and `*` wildcard; regex is out for v1 gates.
- Exclusion policy is stored in YAML file with deterministic merge.
- Merge strategy is file baseline plus CLI append overrides.
- Each exclusion rule requires rationale, owner, and expiry/review date.
- Broad wildcard rules are restricted and require explicit override handling.
- Unmatched exclusion rules are warnings (stale rule signal), not silent.
- Applied exclusions are reported grouped by rule with rationale and matched-operation count.
- Critical operations are protected from exclusion unless explicit override is provided.

### Failure precedence and output contract
- Exit code table is frozen as public v1 contract.
- Global failure class precedence is `input > semantic > gate > runtime`.
- Gate-internal precedence is `regression > threshold`.
- On multi-failure runs, output includes one primary `YANOTE_ERROR` line plus deterministic ordered secondary block.
- Secondary ordering is class precedence, then error code, then operation key where applicable.
- `unmatched` diagnostics are warning-level and do not directly change exit code in this phase.
- Machine summary on failure includes status, primary code, and counts by failure class.
- If report snapshot cannot be written, machine summary must explicitly emit `report=none`.
- Strict gate profile is default in CI with softer local behavior.

### Claude's Discretion
- Exact gate policy file name and CLI flag naming for policy-file path.
- Exact warning-band message wording and formatting.
- Exact secondary error block rendering style while preserving deterministic ordering.
- Internal module placement for gate policy parser and precedence evaluator.

</decisions>

<specifics>
## Specific Ideas

- Governance output should remain deterministic and machine-parsable first, human-readable second.
- Gate policies should be strict enough for CI trust but predictable for local iteration.
- Exclusions should behave like auditable policy records, not ad-hoc toggles.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `yanote-js/src/cli.ts`: existing typed failure classes (`input`, `semantic`, `gate`, `runtime`) and exit-code mapping already aligned with governance gating.
- `yanote-js/src/baseline/baseline.ts`: existing baseline read and regression comparison scaffold to extend with versioned policy/snapshots.
- `yanote-js/src/report/schema.ts`: strict schema and report status (`ok | partial | invalid`) usable as gate input contract.
- `yanote-js/src/cli.summary.contract.test.ts`: fixed-order summary and no-ANSI contract tests to extend with governance semantics.
- `yanote-js/src/cli.report.test.ts` and `yanote-js/src/cli.test.ts`: current typed failure behavior and gate exit test coverage.

### Established Patterns
- CLI/report behavior is already treated as compatibility contract with deterministic tests.
- Semantic invalid/ambiguous outcomes are fail-closed and should remain high-priority failures.
- Deterministic ordering is already applied in diagnostics and summary issues; this can be reused for precedence outputs.

### Integration Points
- Gate evaluation entrypoint: `yanote-js/src/cli.ts` report command flow.
- Baseline compatibility and regression set logic: `yanote-js/src/baseline/baseline.ts`.
- Exclusion application + transparency: coverage filtering and report diagnostics/output sections.
- Machine-readable failure surfaces: `YANOTE_ERROR` (stderr) and `YANOTE_SUMMARY` (stdout tail line).

</code_context>

<deferred>
## Deferred Ideas

- Governance behavior integration for Gradle plugin and GitHub Action channels (Phase 4).
- Release policy gates tied to Maven Central/GitHub release workflow (Phase 5).
- AsyncAPI/non-Java gate semantics (future scope).

</deferred>

---

*Phase: 03-governance-gates*
*Context gathered: 2026-03-04*
