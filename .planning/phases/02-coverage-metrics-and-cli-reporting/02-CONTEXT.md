# Phase 2: Coverage Metrics and CLI Reporting - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver deterministic operation-level coverage reporting via standalone CLI for local and CI usage, including operation/status/parameter dimensions, stable JSON output contract, and readable terminal summaries. This phase clarifies reporting behavior and output contract only. It does not add new delivery channels (Gradle plugin/GitHub Action), governance gate policy expansion beyond report semantics, or release workflows.

</domain>

<decisions>
## Implementation Decisions

### Coverage dimensions model
- Primary v1 model is layered coverage: operation, status, and parameter dimensions are reported separately.
- Aggregate coverage is enabled with fixed weighting: operations 60%, status 25%, parameters 15%.
- Per-operation status uses three states: `COVERED`, `PARTIAL`, `UNCOVERED`.
- `COVERED` requires 100% required-dimension satisfaction for the operation; otherwise operation is `PARTIAL` unless fully uncovered.
- Parameter coverage score uses required parameters in the main score; optional parameters are reported separately as informational.
- Status coverage denominator is explicitly the set of statuses declared in the specification for each operation.
- Baseline grouping key remains canonical `METHOD + ROUTE` operation identity from Phase 1.
- Non-applicable dimensions (e.g., no parameters defined) are represented explicitly as `N/A`, not silently dropped or treated as zero.
- Suite/run contribution is included as optional breakdown section in reports.

### CLI output contract
- Default output mode is compact summary (single-screen) with deeper details behind explicit verbose mode.
- Terminal output stays plain text only (no ANSI color codes) for deterministic CI and local parity.
- Output section order is fixed and stable: `Summary -> Coverage Dimensions -> Top Issues -> Report Path -> Machine Summary Line`.
- Top issues list is sorted deterministically by severity, then canonical operation key.
- Top issues list is truncated with explicit tail marker (`... +N more; see report`) rather than full dump.
- CLI always emits one stable machine-readable summary line at the end of stdout (`YANOTE_SUMMARY ...`).
- Key CLI wording is treated as contract and must be validated by golden tests.
- Human-readable summary remains in stdout; failure causes and diagnostics summary are written to stderr.

### Deterministic report schema
- Report includes explicit, locked schema header with `schemaVersion`, `generatedAt`, `toolVersion`, and phase contract metadata.
- `schemaVersion` is independent from tool version and is the source of truth for JSON compatibility.
- Full canonical sorting is required across report arrays and deterministic key ordering for byte-equivalent output.
- Numeric formatting is stabilized with fixed decimal policy and one shared rounding function.
- Report schema is strict: required fields are enforced and unknown fields are rejected in v1.
- Diagnostics are emitted in a dedicated top-level `diagnostics` block with stable structure.
- Operation identity in report entries is explicit: `method`, `route`, and canonical `operationKey` all present.
- Report includes explicit status enum (`ok | partial | invalid`) for downstream consumers.
- Contract testing requires golden fixtures validating both schema conformance and byte stability.

### Diagnostics and exit behavior
- Exit behavior uses typed, fixed exit-code classes (input, semantic, gate, io/runtime) with stable mapping.
- Semantic `invalid` and `ambiguous` diagnostics are always fail-closed in this phase (non-zero exit).
- Failure output follows a stable stderr contract: error class/code, concise reason, and actionable next step.
- Report artifact should still be written on failure when a consistent snapshot can be produced, marked with non-`ok` report status.
- Diagnostics ordering is deterministic (severity, then operation key/candidate order) across repeated runs.
- Actionable hints are mandatory for every failure class.
- Input validation is strict and early (spec/events/out path checks before coverage computation).
- Contract tests must cover exit codes, stderr contract shape, and machine summary line behavior.

### Claude's Discretion
- Exact field naming for optional informational parameter coverage sections.
- Exact compact layout spacing/column widths in plain-text summary.
- Concrete token format of machine summary line, while preserving a stable grammar.
- Internal utility placement for sorting/rounding/serialization helpers.

</decisions>

<specifics>
## Specific Ideas

- Keep Phase 2 output CI-first: deterministic, parseable, and easy to diff between runs.
- Treat CLI text as a compatibility surface, not incidental logs.
- Preserve trust by reporting partial coverage explicitly rather than collapsing into binary metrics.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `yanote-js/src/coverage/coverage.ts`: existing layered artifacts (`coveredOperations`, `uncoveredOperations`, `diagnostics`, `suitesByOperation`) and deterministic fallback candidate sorting.
- `yanote-js/src/report/report.ts`: current report builder and summary fields to extend into schema-versioned deterministic contract.
- `yanote-js/src/report/writeReport.ts`: stable report write location and serialization point for canonical ordering rules.
- `yanote-js/src/cli.ts`: existing report command, exit-code handling, and stderr fail-path to evolve into typed failure contract.
- `yanote-js/src/spec/diagnostics.ts` and semantic bundle pipeline from Phase 1: existing diagnostic primitives for report-level diagnostics block.

### Established Patterns
- Canonical operation identity and deterministic semantic matching from Phase 1 are already locked and must be reused unchanged.
- CLI uses Commander with explicit exit codes; this is the right integration point for typed failure classes.
- Test style is fixture/golden-oriented and behavior-first; suitable for schema and output contract tests.

### Integration Points
- Coverage metrics computation: `yanote-js/src/coverage/coverage.ts`.
- Report schema + serialization: `yanote-js/src/report/report.ts` and `yanote-js/src/report/writeReport.ts`.
- User-facing contract + exit semantics: `yanote-js/src/cli.ts` and related CLI tests.
- Determinism/contract regression tests: `yanote-js/src/report/*.test.ts`, `yanote-js/src/cli*.test.ts`, and fixture directories.

</code_context>

<deferred>
## Deferred Ideas

- Governance threshold/regression policy expansion and gate orchestration beyond report semantics (Phase 3).
- Gradle plugin and GitHub Action surface behavior (Phase 4).
- AsyncAPI/non-Java coverage dimensions (future phase only).
- Web dashboard/report UI (out of v1 scope).

</deferred>

---

*Phase: 02-coverage-metrics-and-cli-reporting*
*Context gathered: 2026-03-04*
