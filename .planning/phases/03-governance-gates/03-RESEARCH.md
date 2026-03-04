# Phase 3: Governance Gates - Research

**Researched:** 2026-03-04
**Domain:** Deterministic policy enforcement for CLI coverage governance
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)
- Governance behavior integration for Gradle plugin and GitHub Action channels (Phase 4).
- Release policy gates tied to Maven Central/GitHub release workflow (Phase 5).
- AsyncAPI/non-Java gate semantics (future scope).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GATE-01 | Configurable minimum coverage threshold with fail below target | Add deterministic policy-resolution layer (CLI > YAML > defaults), raw-decimal threshold comparator, optional aggregate gate, warning-band diagnostics, and critical-operation hard-fail path. |
| GATE-02 | Fail checks on coverage regression against baseline report | Extend baseline format to versioned snapshot (covered operations + dimension summary), compare on post-exclusion scope, preserve canonical operation-key sort, and enforce explicit baseline update command. |
| GATE-03 | Explicit exclusions with rationale in outputs | Introduce YAML exclusion rules (pattern/rationale/owner/expiry), deterministic merge with CLI appends, broad wildcard guardrails, critical-operation protection, and grouped applied/unmatched rule reporting. |
| GATE-04 | Fail-closed on invalid/incomplete evidence with actionable diagnostics | Promote evidence integrity and incompatible baseline/schema failures into typed deterministic non-zero outcomes using existing `YANOTE_ERROR`/`YANOTE_SUMMARY` contracts and precedence model. |
</phase_requirements>

<research_summary>
## Summary

Phase 2 already provides the core primitives needed for governance: canonical operation identity, layered coverage dimensions, deterministic report writing, and typed CLI failure classes. Governance planning should therefore focus on **policy orchestration and contract hardening**, not new coverage math.

Current implementation already has partial governance (`--min-coverage`, `--baseline`, `--fail-on-regression`, `--exclude`), but it does not satisfy Phase 3 locked decisions: no policy file, no aggregate threshold gate, no critical-operation protection, no rationale-bearing exclusion model, no explicit baseline update workflow, and no multi-failure precedence output block. Evidence integrity is also under-enforced right now because JSONL parsing counts invalid lines but does not fail-closed on them.

The highest planning risk is accidental contract drift in CLI outputs and exit semantics while adding richer gate behavior. Existing tests already treat stdout/stderr as contract surfaces, so Phase 3 should be planned with a dedicated gate evaluation module and narrow CLI integration points to keep deterministic behavior predictable.

**Primary recommendation:** Plan Phase 3 as three waves: (1) policy model + parser + resolution precedence, (2) deterministic gate evaluator with precedence and reporting, (3) baseline v2 + explicit baseline update command and fail-closed integrity checks.
</research_summary>

<implementation_gaps>
## Current Code: What Exists vs What Is Missing

### Already in place (strong reuse)
- `yanote-js/src/cli.ts` has typed failure classes (`input`, `semantic`, `gate`, `runtime`) and stable error/success output contracts (`YANOTE_ERROR`, `YANOTE_SUMMARY`).
- `yanote-js/src/coverage/coverage.ts` already applies route exclusions before denominator calculation and computes layered dimensions.
- `yanote-js/src/report/report.ts` and `yanote-js/src/report/schema.ts` provide strict, deterministic report surface with status and diagnostics.
- `yanote-js/src/baseline/baseline.ts` has regression comparison scaffold against covered operations.
- Contract tests in `cli.summary.contract.test.ts`, `cli.report.test.ts`, `cli.test.ts`, and report determinism tests are already enforcing deterministic behavior.

### Missing for Phase 3
- No YAML gate policy file parser/validator (locked decision requires file-based policy with deterministic merge).
- No aggregate gate flag (`--min-aggregate`) or gate policy defaults (95/85 plus warning band).
- No critical-operation list enforcement.
- Exclusions are currently raw strings only; no rationale/owner/expiry metadata and no grouped output.
- No broad wildcard restriction/override handling.
- Baseline format is v1 (`format:1`, `covered[]`) only; no versioned dimension snapshot.
- No explicit baseline update command path.
- No multi-failure primary+secondary deterministic block.
- Evidence integrity is not fail-closed: `readHttpEventsJsonl()` exposes `invalidLines` but CLI ignores it.
</implementation_gaps>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `commander` | `^12.1.0` | CLI options and deterministic exit flow | Already used and aligned with current `runCli()` override pattern. |
| `ajv` | `^8.18.0` | Strict runtime validation for policy/baseline schemas | Matches existing strict report schema approach; keeps fail-closed behavior explicit. |
| `json-stable-stringify` | `^1.3.0` | Deterministic JSON output ordering | Existing deterministic contract dependency used in report write path. |
| `vitest` | `^2.1.9` | Contract and regression tests | Existing test runner and style for CLI/report behavior locks. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `yaml` | latest 2.x | Parse deterministic policy YAML config | Required because locked exclusion policy lives in YAML file. |
| Node `fs/promises` + `path` | built-in | Policy/baseline read-write and explicit update command | Existing repo pattern for deterministic file IO in CLI paths. |
| Existing wildcard logic in `coverage.ts` | current | Prefix + `*` matching for route exclusions | Keep as base semantics; wrap with policy metadata and guardrails. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `yaml` package parse + schema validate | Homegrown YAML-ish parser | Too fragile for audit/governance config; poor diagnostics. |
| Reusing raw `--exclude` only | Policy file + CLI append merge | Raw flags cannot satisfy rationale/owner/expiry requirements. |
| Expanding `cli.ts` only | Separate `gates/*` module layer | Direct expansion in `cli.ts` risks precedence bugs and output drift. |

**Installation (when implementation starts):**
```bash
npm -C yanote-js install yaml
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
yanote-js/src/
├── gates/
│   ├── policy.ts                # Gate policy DTOs + defaults + merge (CLI > file > defaults)
│   ├── policy.schema.ts         # Ajv schema for policy file
│   ├── exclusions.ts            # Rule compile/match + stale rule diagnostics + critical protection
│   ├── evaluator.ts             # Threshold/regression evaluation + deterministic precedence
│   └── failureOrder.ts          # Primary/secondary deterministic failure ordering
├── baseline/
│   └── baseline.ts              # Extend to versioned snapshot and explicit update helpers
├── cli.ts                       # Thin orchestration: parse, call gate modules, emit contracts
└── report/
    ├── report.ts                # Existing deterministic report assembly
    └── schema.ts                # Existing strict contract validation
```

### Pattern 1: Policy Resolution Pipeline
**What:** Resolve one effective gate policy from defaults, YAML file, and CLI overrides in strict precedence.
**When to use:** At start of `report` command, before coverage computation.
**Example:**
```typescript
const defaults = ciMode ? CI_DEFAULT_POLICY : LOCAL_DEFAULT_POLICY;
const fromFile = policyPath ? await readPolicyFile(policyPath) : {};
const fromCli = parseCliGateOverrides(opts);
const effective = mergePolicy(defaults, fromFile, fromCli); // CLI > file > defaults
```

### Pattern 2: Deterministic Gate Evaluation and Precedence
**What:** Evaluate all gate checks, then choose one primary failure using locked precedence.
**When to use:** After coverage/report are available and exclusions are applied.
**Example:**
```typescript
const failures = [
  ...evaluateRegression(...),   // gate
  ...evaluateThreshold(...),    // gate
  ...evaluateEvidenceIntegrity(...)
];

const ordered = sortFailuresByPrecedence(failures); // input > semantic > gate > runtime, then code, then op key
const primary = ordered[0];
const secondary = ordered.slice(1);
```

### Pattern 3: Exclusion Rules as Auditable Records
**What:** Treat each exclusion as policy record with metadata, not an ad-hoc string.
**When to use:** Before denominator/regression scope resolution and in report/summary rendering.
**Example:**
```typescript
type ExclusionRule = {
  pattern: string;
  rationale: string;
  owner: string;
  expiresOn: string;
  allowBroad?: boolean;
  allowCriticalOverride?: boolean;
};
```

### Pattern 4: Versioned Baseline Snapshot + Explicit Update
**What:** Move baseline from covered-op list to versioned snapshot that includes dimension summary.
**When to use:** On regression checks and explicit baseline write/update command only.
**Example:**
```typescript
type BaselineV2 = {
  format: 2;
  generatedAt: string;
  covered: string[]; // canonical operation keys
  dimensions: { operations: number; status: number | null; parameters: number | null; aggregate: number | null };
};
```

### Pattern 5: Fail-Closed Evidence Integrity Gate
**What:** Treat invalid or incomplete evidence as non-passable with actionable diagnostics.
**When to use:** Immediately after event read + baseline read + schema compatibility checks.
**Example:**
```typescript
if (events.invalidLines > 0) {
  failures.push(inputFailure("INPUT_EVENTS_INVALID_LINES", `${events.invalidLines} invalid JSONL line(s).`, "Fix malformed events and rerun."));
}
```

### Anti-Patterns to Avoid
- **Gate logic embedded in presentation formatting:** leads to precedence and contract drift.
- **Threshold compares against rounded display values:** violates locked raw-decimal comparison rule.
- **Silent exclusion drops:** violates auditable-policy requirement and makes CI trust impossible.
- **Auto-overwriting baseline on report run:** violates explicit update command requirement.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Policy YAML parsing | Manual string splitting | `yaml` parser + Ajv schema validation | Better diagnostics, fewer config edge-case bugs. |
| Failure precedence | Inline `if/else` chains scattered in CLI | Central precedence sorter (`failureOrder.ts`) | Required for deterministic primary/secondary ordering. |
| Baseline compatibility checks | Ad hoc `if (format===...)` in many places | Single baseline adapter/validator in `baseline.ts` | Keeps format migration and actionable hints consistent. |
| Exclusion audit rendering | Recompute matches during print | Precomputed rule-application result object | Avoids ordering mismatches and duplicate logic. |

**Key insight:** Phase 3 is a governance-contract phase; centralization beats convenience because deterministic behavior is the deliverable.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Passes despite invalid evidence
**What goes wrong:** CLI exits 0 even with malformed JSONL lines or dropped evidence.
**Why it happens:** `invalidLines` from `readHttpEventsJsonl()` is not enforced by CLI gate policy.
**How to avoid:** Define and test fail-closed integrity conditions in one place (input/semantic class decisions included).
**Warning signs:** `invalidLines > 0` appears in debug logs but no non-zero exit.

### Pitfall 2: Threshold mismatch due rounding
**What goes wrong:** borderline values (e.g. 94.995) pass/fail inconsistently.
**Why it happens:** comparing against display-rounded percentages.
**How to avoid:** compare raw decimal values, use rounding only in human/machine output formatting.
**Warning signs:** same data fails locally but passes in CI after formatting tweaks.

### Pitfall 3: Regression noise after exclusions
**What goes wrong:** operations excluded from threshold scope still count as regressions.
**Why it happens:** regression comparison not using same post-exclusion operation set.
**How to avoid:** produce one resolved operation scope and reuse it for threshold + regression.
**Warning signs:** exclusion appears in output but regression still references excluded operation.

### Pitfall 4: Policy abuse via broad wildcards
**What goes wrong:** teams exclude large API surface accidentally or intentionally.
**Why it happens:** unrestricted `*` patterns with no guardrails.
**How to avoid:** detect broad patterns, require explicit override, emit warnings and metadata in outputs.
**Warning signs:** one rule matches most operations with weak rationale.

### Pitfall 5: Output contract breakage
**What goes wrong:** CI parsers break after adding secondary failure details.
**Why it happens:** changing `YANOTE_ERROR`/`YANOTE_SUMMARY` grammar or ordering non-deterministically.
**How to avoid:** add dedicated contract tests for multi-failure output while preserving existing one-line guarantees.
**Warning signs:** flaky snapshot tests and parsing scripts requiring hotfixes.
</common_pitfalls>

<planning_guidance>
## Planning Guidance (What to Settle Before Writing 03-PLAN)

1. **Finalize policy surface names**
   - Pick policy file name and CLI flag (locked as discretionary).
   - Decide whether CI/local profile is explicit flag (recommended) or env-derived fallback.

2. **Define baseline v2 contract and migration behavior**
   - Keep baseline v1 read compatibility or require v2 only.
   - Lock actionable regeneration hint text for incompatible schema.

3. **Lock fail-closed evidence criteria for GATE-04**
   - Minimum set should include malformed JSONL lines and incompatible baseline schema.
   - Decide whether "zero valid events" is fail-closed or threshold/regression-evaluable.

4. **Design exclusion policy schema and guardrails**
   - Required fields: pattern, rationale, owner, expiry/review date.
   - Add explicit broad wildcard policy and critical-operation override mechanics.

5. **Define multi-failure rendering contract**
   - Preserve one primary `YANOTE_ERROR` line.
   - Add deterministic secondary block in fixed order without breaking machine parsing.

### Suggested execution waves
- **Wave 1 (contract-first):** policy DTO/schema/parser + resolution precedence + CLI option plumbing.
- **Wave 2 (governance engine):** exclusion application/audit + threshold/regression evaluator + precedence sorter + output contract updates.
- **Wave 3 (baseline + integrity):** baseline v2 and explicit update command + fail-closed evidence checks + migration/compat tests.
</planning_guidance>

<validation_architecture>
## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (`npm -C yanote-js test`) |
| Current gate contract tests | `yanote-js/src/cli.report.test.ts`, `yanote-js/src/cli.summary.contract.test.ts`, `yanote-js/src/cli.test.ts` |
| Determinism tests | `yanote-js/src/report/writeReport.determinism.test.ts`, `yanote-js/src/report/report.contract.test.ts` |
| Full phase gate command | `npm -C yanote-js test && npm -C yanote-js run build && ./gradlew test` |

### Requirement -> Test Map
| Req ID | Behavior to Verify | Suggested Tests |
|--------|--------------------|-----------------|
| GATE-01 | Operation and optional aggregate thresholds, warning band, critical-operation hard-fail | Extend `cli.report.test.ts`; add `gates/evaluator.threshold.test.ts`; add CLI contract cases for warning-band text and raw-decimal comparisons. |
| GATE-02 | Baseline regression fail on covered-op loss, dimension regressions warning-only, sorted regression output | Add `baseline/baseline.v2.test.ts`; add `gates/evaluator.regression.test.ts`; extend CLI stderr/summary tests for regression precedence. |
| GATE-03 | YAML exclusions with metadata, deterministic merge, unmatched rule warnings, grouped applied rules | Add `gates/policy.test.ts`; add `gates/exclusions.test.ts`; extend summary/report contract tests with grouped exclusion output assertions. |
| GATE-04 | Invalid/incomplete evidence fail-closed and actionable diagnostics | Extend `events/readJsonl.test.ts` integration through CLI; add `cli.failclosed.contract.test.ts` for invalid lines, incompatible baseline, report write failure with `report=none`. |

### Minimum command cadence during execution
- Per-task: `npm -C yanote-js run test -- src/gates/*.test.ts src/cli.report.test.ts`
- Per-wave: `npm -C yanote-js test`
- Before phase completion: `npm -C yanote-js test && npm -C yanote-js run build && ./gradlew test`
</validation_architecture>

<open_questions>
## Open Questions

1. **Policy file naming and CLI path flag**
   - What we know: naming is explicitly discretionary.
   - What's unclear: final file name and whether default discovery is allowed.
   - Recommendation: choose one explicit path flag in Phase 3 and defer auto-discovery to Phase 4+.

2. **CI vs local profile activation**
   - What we know: strict in CI, softer locally is locked.
   - What's unclear: detection mechanism (`--profile ci|local` vs environment heuristics).
   - Recommendation: use explicit `--profile` with deterministic default and optional `CI=true` fallback.

3. **Definition of "incomplete evidence" for fail-closed**
   - What we know: malformed and incompatible inputs must fail-closed.
   - What's unclear: whether empty-but-valid evidence should fail or just fail threshold/regression.
   - Recommendation: lock a small explicit fail-closed matrix in plan acceptance criteria.

4. **Critical operation list source**
   - What we know: must be supported and protected from exclusion.
   - What's unclear: where list is declared (policy file section vs dedicated CLI option).
   - Recommendation: keep it in policy file for auditability, with optional CLI append override.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `.planning/phases/03-governance-gates/03-CONTEXT.md` - locked decisions and phase boundary.
- `.planning/REQUIREMENTS.md` - requirement IDs and scope mapping (`GATE-01..04`).
- `.planning/STATE.md` - current completion state and inherited deterministic contracts.
- `yanote-js/src/cli.ts` - current governance gate and failure-contract behavior.
- `yanote-js/src/coverage/coverage.ts` - exclusion and denominator behavior.
- `yanote-js/src/events/readJsonl.ts` - evidence integrity inputs (`invalidLines`) and current non-fail behavior.
- `yanote-js/src/baseline/baseline.ts` - baseline v1 shape and regression scaffold.
- `yanote-js/src/cli.summary.contract.test.ts`, `cli.report.test.ts`, `cli.test.ts` - output/exit contract coverage.

### Secondary (MEDIUM confidence)
- `.planning/codebase/CONVENTIONS.md` and `.planning/codebase/TESTING.md` - repository test and CLI contract conventions.
- `README.md`, `examples/docker-compose.yml` - current end-to-end usage expectations.

### Tertiary (LOW confidence)
- None.
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: TypeScript CLI governance policy enforcement.
- Ecosystem: existing CLI/report/baseline modules plus YAML policy parsing.
- Patterns: precedence evaluation, auditable exclusions, baseline versioning.
- Pitfalls: fail-closed integrity, deterministic output contracts, wildcard abuse.

**Confidence breakdown:**
- Standard stack: HIGH - mostly existing dependencies/patterns; only YAML parser is additive.
- Architecture: HIGH - directly mapped to locked decisions and existing code structure.
- Pitfalls: HIGH - grounded in current implementation gaps and existing contract tests.

**Research date:** 2026-03-04
**Valid until:** 2026-04-03
</metadata>

---

*Phase: 03-governance-gates*
*Research completed: 2026-03-04*
*Ready for planning: yes*
