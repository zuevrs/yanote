# Phase 2: Coverage Metrics and CLI Reporting - Research

**Researched:** 2026-03-04
**Domain:** Deterministic coverage dimensions and CLI/report contract for standalone Node analyzer
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)
- Governance threshold/regression policy expansion and gate orchestration beyond report semantics (Phase 3).
- Gradle plugin and GitHub Action surface behavior (Phase 4).
- AsyncAPI/non-Java coverage dimensions (future phase only).
- Web dashboard/report UI (out of v1 scope).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COVR-01 | Maintainer can compute operation-level coverage for all scoped v1 endpoints | Reuse Phase 1 canonical `METHOD + ROUTE` identity and deterministic matcher, then compute operation denominator from canonical OpenAPI operation set only. |
| COVR-02 | Maintainer can compute status-code coverage per operation | Build per-operation status denominator from OpenAPI `responses` keys (explicit codes + allowed ranges + optional `default` policy), then compare observed event statuses deterministically. |
| COVR-03 | Maintainer can compute parameter coverage (path/query/header where defined) | Merge Path Item + Operation parameters per OpenAPI override rules, score required params in main metric, keep optional params informational, and represent non-applicable as `N/A`. |
| COVR-04 | Maintainer can generate deterministic versioned JSON report output for the same inputs | Introduce strict schema version header + canonical ordering + single rounding helper + stable serialization and schema validation on write path. |
| COVR-05 | Maintainer can read a concise CLI summary showing uncovered operations and coverage percentages | Treat stdout wording/ordering as contract with fixed compact layout, deterministic top-issues truncation, and a final machine summary line. |
| DELV-01 | Developer can run coverage analysis via standalone CLI in local and CI environments | Keep `yanote report` command as single delivery channel with deterministic stdout/stderr + typed exit classes for CI parseability and local readability. |
</phase_requirements>

## Summary

Phase 2 should be planned as a contract-hardening phase, not a feature-exploration phase: coverage dimensions, JSON schema, CLI text, and exit semantics are all compatibility surfaces. Current code already has the right backbone (`computeCoverage`, `buildReport`, `writeYanoteReport`, Commander-based `runCli`), but it currently computes only operation coverage and writes a non-versioned report with non-deterministic timestamp behavior.

The highest planning risk is evidence fidelity for COVR-03. Current `events.jsonl` ingestion in `yanote-js/src/events/readJsonl.ts` keeps `method`, `route`, `status`, and suite/run metadata, but does not currently ingest query/header parameter evidence. You should plan Wave 0 to lock parameter-evidence policy (event schema extension vs explicit fail-closed/unknown semantics), because this directly determines whether query/header coverage is credible or only inferred.

Determinism requirements are stricter than current behavior: byte-equivalent report output means timestamp and ordering policies must be explicit, not incidental. Treat `generatedAt`, array ordering, object key ordering, rounding, and CLI wording as tested contract fixtures.

**Primary recommendation:** Implement a strict contract pipeline: canonical coverage computation -> deterministic normalized report DTO -> strict schema validation -> stable serialization -> golden-tested CLI/stderr/machine-line output.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js runtime | `>=20` (repo uses target `node22`) | CLI execution in local and CI | Matches existing `yanote-js` engine constraints and dist build target. |
| `commander` | `^12.1.0` | CLI command surface and typed exits | Already in use; provides `requiredOption`, `error({exitCode, code})`, `exitOverride`, and output routing hooks. |
| `@apidevtools/swagger-parser` | `^10.1.1` | OpenAPI dereference/loading | Existing parser; keeps OpenAPI processing in one place before coverage dimensions are computed. |
| `path-to-regexp` | `^8.3.0` | Deterministic fallback route-template matching | Already used by coverage matching with strict method-scoped fallback and deterministic candidate sorting. |
| `vitest` | `^2.1.9` | Contract/golden tests for report and CLI behavior | Existing test runner; supports snapshot and run-mode CI behavior. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ajv` | `v8.x` | Enforce strict JSON report schema at write boundary | Use before writing report artifact to reject unknown fields and ensure required shape in v1. |
| `json-stable-stringify` | `v1.x` | Canonical object key ordering for deterministic JSON bytes | Use in serialization boundary if native key-order behavior is insufficient for strict byte-equivalence guarantees. |
| `openapi-types` | `^12.1.3` | Typed OpenAPI object handling | Use when extracting parameter/response dimensions from spec with clear type boundaries. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Ajv strict validation | Manual runtime shape checks | Manual checks drift quickly as schema evolves and miss unknown-field rejection edge cases. |
| Stable stringifier library | Custom recursive key-sort + `JSON.stringify` | Works, but easy to miss nested-key ordering and future extension edge cases; library is safer. |
| Golden snapshots for CLI/report contracts | Ad hoc `contains(...)` assertions | Looser tests miss formatting/ordering regressions that break deterministic CI parsing. |

**Installation:**
```bash
npm -C yanote-js install ajv json-stable-stringify
```

## Architecture Patterns

### Recommended Project Structure
```
yanote-js/src/
├── coverage/
│   ├── coverage.ts                 # Existing operation matcher and baseline coverage
│   ├── statusCoverage.ts           # NEW: status denominator/observed scoring
│   └── parameterCoverage.ts        # NEW: path/query/header scoring and N/A handling
├── report/
│   ├── report.ts                   # Existing report assembly entrypoint
│   ├── schema.ts                   # NEW: versioned schema contract + validator wiring
│   ├── normalize.ts                # NEW: canonical sorting/rounding/enum normalization
│   └── writeReport.ts              # Existing write boundary (strict validate + stable stringify)
├── cli.ts                          # Existing command orchestration and exit mapping
└── events/
   └── readJsonl.ts                 # Existing evidence ingestion (extend if parameter evidence added)
```

### Pattern 1: Layered Coverage Aggregation
**What:** Compute operation, status, and parameter dimensions independently, then combine using fixed weights (60/25/15) and explicit `N/A` semantics.
**When to use:** Every report generation path.
**Example:**
```typescript
// Source: Phase 2 locked decisions + existing coverage pipeline
const operation = computeOperationCoverage(...);  // required
const status = computeStatusCoverage(...);        // N/A if no declared statuses
const params = computeParameterCoverage(...);     // required-only scoring, optional informational

const weighted = roundCoverage(
  operation.percent * 0.60 + status.percent * 0.25 + params.percent * 0.15
);
```

### Pattern 2: Deterministic Serialization Boundary
**What:** Normalize report DTO (sort arrays/maps, fixed decimal policy) before writing, then serialize deterministically.
**When to use:** Exactly once at write boundary (`writeReport.ts`).
**Example:**
```typescript
// Source: https://raw.githubusercontent.com/ljharb/json-stable-stringify/main/README.md
import stringify from "json-stable-stringify";

const normalized = normalizeReport(report); // sorting + rounding + enum normalization
const bytes = stringify(normalized, { space: 2 }) + "\n";
await writeFile(outPath, bytes, "utf8");
```

### Pattern 3: Strict Report Schema Gate
**What:** Validate full report object against versioned JSON schema and reject unknown fields (`additionalProperties: false`).
**When to use:** Before serialization and for golden fixture verification.
**Example:**
```typescript
// Source: Context7 /ajv-validator/ajv/v8.17.1
import Ajv from "ajv";
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(reportSchemaV1);
if (!validate(report)) throw new Error("Invalid report schema: " + ajv.errorsText(validate.errors));
```

### Pattern 4: CLI Contracted I/O Channels
**What:** Keep compact human summary in stdout, diagnostics/failures in stderr, and append final machine summary line in stdout.
**When to use:** For all success/failure outcomes of `report` command.
**Example:**
```typescript
// Source: Context7 /tj/commander.js + existing cli.ts pattern
program.exitOverride();
program.configureOutput({ writeOut, writeErr });
// ... emit ordered stdout sections ...
// ... emit typed failures to stderr ...
// ... append YANOTE_SUMMARY ... as last stdout line ...
```

### Anti-Patterns to Avoid
- **Runtime timestamp in deterministic report:** using `new Date()` directly for `generatedAt` breaks byte-equivalence.
- **Implicit denominators:** counting observed statuses/params as denominator inflates coverage and hides missing declared cases.
- **Mixed stdout/stderr semantics:** interleaving diagnostics with summary text makes CI parsing brittle.
- **Unsorted "top issues":** unstable ordering creates noisy diffs and flaky golden tests.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema enforcement | Custom `if`/`typeof` tree validators | Ajv + explicit schema (`additionalProperties: false`) | Schema evolution remains explicit and testable; unknown fields are rejected consistently. |
| Deterministic JSON key ordering | Homegrown recursive sorter | `json-stable-stringify` (or equivalent canonical serializer) | Reduces hidden edge cases in nested maps/arrays and improves byte-stability confidence. |
| CLI parsing and exit plumbing | Manual `process.argv` parser | Commander (`requiredOption`, `error`, `exitOverride`, `configureOutput`) | Existing stable integration and predictable typed exits. |
| Route template matching | Ad-hoc regex substitution logic | Existing `path-to-regexp` matching approach in `coverage.ts` | Mature matching semantics and deterministic behavior already aligned with Phase 1. |

**Key insight:** Determinism failures are usually serialization/contract failures, not math failures. Harden boundaries first.

## Common Pitfalls

### Pitfall 1: Non-Deterministic `generatedAt`
**What goes wrong:** identical inputs produce different report bytes due to wall-clock timestamp.
**Why it happens:** defaulting to `new Date()` in report builder.
**How to avoid:** define deterministic `generatedAt` policy (input-derived or fixed via explicit CLI option) and golden-test exact bytes.
**Warning signs:** repeated runs differ only in `meta.generatedAt`.

### Pitfall 2: Incorrect Status Denominator
**What goes wrong:** status coverage appears higher because denominator uses observed statuses only.
**Why it happens:** implementation ignores OpenAPI-declared response set.
**How to avoid:** denominator must be declared statuses from OpenAPI responses object per operation; document explicit policy for `default` and ranges (`2XX`, etc.).
**Warning signs:** missing declared codes do not reduce status coverage.

### Pitfall 3: Parameter Merge Semantics Drift
**What goes wrong:** path-level parameters are dropped or double-counted when operation-level overrides exist.
**Why it happens:** OpenAPI Path Item + Operation parameter rules are not merged correctly.
**How to avoid:** merge using `(name, in)` identity with operation-level override precedence; enforce path param `required=true` rule.
**Warning signs:** mismatched required counts across equivalent specs with moved parameter declarations.

### Pitfall 4: Missing Query/Header Evidence
**What goes wrong:** query/header coverage is reported as uncovered even when tests likely exercised them.
**Why it happens:** current events schema ingestion lacks explicit query/header capture.
**How to avoid:** lock evidence contract for params in Wave 0 (event schema extension or explicit fail-closed/unknown policy).
**Warning signs:** all query/header metrics remain zero across otherwise covered operations.

### Pitfall 5: CLI Output Drift
**What goes wrong:** local and CI parsers break due to wording/order changes.
**Why it happens:** summary text treated as incidental logging.
**How to avoid:** golden-test full stdout/stderr sections and machine summary line grammar.
**Warning signs:** parsing scripts key off brittle free-form text.

## Code Examples

Verified patterns from official sources:

### Commander Exit + Output Override
```javascript
// Source: https://raw.githubusercontent.com/tj/commander.js/master/Readme.md
program.exitOverride();
program.configureOutput({
  writeOut: (str) => process.stdout.write(str),
  writeErr: (str) => process.stderr.write(str),
});
program.error("Custom processing has failed", { exitCode: 2, code: "my.custom.error" });
```

### Path Matcher Primitive
```javascript
// Source: https://raw.githubusercontent.com/pillarjs/path-to-regexp/master/Readme.md
const fn = match("/:foo/:bar");
fn("/test/route");
//=> { path: '/test/route', params: { foo: 'test', bar: 'route' } }
```

### OpenAPI Parameter Rules That Affect Coverage
```text
// Source: https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/versions/3.0.3.md
A unique parameter is defined by (name, in).
Path Item parameters can be overridden (not removed) at Operation level.
If parameter in == "path", required MUST be true.
```

### Strict Unknown-Field Rejection
```javascript
// Source: Context7 /ajv-validator/ajv/v8.17.1
const schema = {
  type: "object",
  properties: { foo: { type: "integer" } },
  required: ["foo"],
  additionalProperties: false,
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single operation percentage only | Layered operation/status/parameter dimensions | Current v1 Phase 2 scope | Prevents false confidence from endpoint-only metrics. |
| Implicit JSON shape + `JSON.stringify` defaults | Versioned strict schema + canonical serialization | Current deterministic CI-first tooling practice | Enables byte-stable artifacts and safe downstream automation. |
| Free-form CLI logs | Contracted stdout/stderr with machine summary line | Modern CI parsing expectations | Reduces flaky CI integrations and parsing ambiguity. |

**Deprecated/outdated:**
- Treating CLI human text as non-contract logging.
- Using wall-clock metadata in deterministic outputs without explicit policy.

## Open Questions

1. **Query/header evidence contract for COVR-03**
   - What we know: current Node event ingestion includes `method`, `route`, `status`, suite/run; no explicit query/header fields are read.
   - What's unclear: whether Phase 2 may extend recorder/event schema or must infer from existing evidence only.
   - Recommendation: resolve in Wave 0; if no schema extension, define explicit `UNKNOWN`/`N/A` semantics and fail-closed policy to avoid misleading coverage.

2. **`generatedAt` deterministic policy**
   - What we know: locked schema requires `generatedAt`; success criteria require byte-equivalent output for identical inputs.
   - What's unclear: canonical source of timestamp (input-derived vs explicit CLI-provided vs omitted from deterministic comparison contract).
   - Recommendation: lock one policy before writing golden fixtures; do not leave as runtime wall clock.

3. **Response denominator policy for ranges/default**
   - What we know: OpenAPI responses may use explicit codes, wildcard ranges (`2XX`), and `default`.
   - What's unclear: exact scoring semantics when both ranges and explicit codes coexist.
   - Recommendation: codify precedence and counting policy in schema docs and fixtures before implementation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `^2.1.9` |
| Config file | none (Vitest defaults via `npm -C yanote-js test`) |
| Quick run command | `npm -C yanote-js run test -- src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts src/report/report.test.ts src/cli.report.test.ts src/cli.test.ts` |
| Full suite command | `npm -C yanote-js test && ./gradlew test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COVR-01 | Compute operation-level coverage for all scoped v1 endpoints | unit + fixture | `npm -C yanote-js run test -- src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts src/coverage/coverage.parity.test.ts` | ✅ (operation baseline exists) |
| COVR-02 | Compute status-code coverage per operation | unit + contract | `npm -C yanote-js run test -- src/coverage/statusCoverage.test.ts` | ❌ Wave 0 |
| COVR-03 | Compute parameter coverage for path/query/header where defined | unit + integration fixture | `npm -C yanote-js run test -- src/coverage/parameterCoverage.test.ts src/events/readJsonl.parameters.test.ts` | ❌ Wave 0 |
| COVR-04 | Deterministic versioned JSON report output | golden + schema contract | `npm -C yanote-js run test -- src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts` | ❌ Wave 0 |
| COVR-05 | Concise CLI summary of uncovered operations and aggregate percentages | golden CLI contract | `npm -C yanote-js run test -- src/cli.summary.contract.test.ts` | ❌ Wave 0 |
| DELV-01 | Standalone CLI works in local and CI workflows | integration smoke | `npm -C yanote-js run test -- src/cli.report.test.ts src/cli.test.ts && npm -C yanote-js run build` | ✅ (partial; no summary contract yet) |

### Sampling Rate
- **Per task commit:** `npm -C yanote-js run test -- src/coverage/coverage.test.ts src/report/report.test.ts src/cli.report.test.ts`
- **Per wave merge:** `npm -C yanote-js test`
- **Phase gate:** `npm -C yanote-js test && ./gradlew test` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `yanote-js/src/coverage/statusCoverage.ts` + `statusCoverage.test.ts` — COVR-02 denominator and scoring semantics.
- [ ] `yanote-js/src/coverage/parameterCoverage.ts` + `parameterCoverage.test.ts` — COVR-03 required/optional/N-A model.
- [ ] `yanote-js/src/report/schema.ts` + `report.contract.test.ts` — COVR-04 strict versioned schema.
- [ ] `yanote-js/src/report/writeReport.determinism.test.ts` — byte-equivalent output guardrail.
- [ ] `yanote-js/src/cli.summary.contract.test.ts` — COVR-05 fixed section order + machine summary line.
- [ ] `yanote-js/src/events/readJsonl.parameters.test.ts` (or equivalent) — lock parameter evidence ingestion contract.
- [ ] Framework install: `npm -C yanote-js ci` — if dependencies are not preinstalled.

## Sources

### Primary (HIGH confidence)
- Context7 `/tj/commander.js` - `requiredOption`, `error`, `exitOverride`, and output stream override behavior for deterministic CLI contracts.
- Context7 `/pillarjs/path-to-regexp` - deterministic route matching API (`match`, `end`, `decode`) used in fallback matching.
- Context7 `/vitest-dev/vitest` - run-mode behavior in CI and snapshot/golden testing patterns.
- Context7 `/ajv-validator/ajv/v8.17.1` - strict JSON schema validation patterns and unknown-property rejection via schema.
- OpenAPI 3.0.3 spec (official): https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/versions/3.0.3.md
- APIDevTools Swagger Parser docs (official): https://raw.githubusercontent.com/APIDevTools/swagger-parser/master/docs/swagger-parser.md
- `json-stable-stringify` official README: https://raw.githubusercontent.com/ljharb/json-stable-stringify/main/README.md

### Secondary (MEDIUM confidence)
- Project codebase evidence from `yanote-js/src/cli.ts`, `yanote-js/src/coverage/coverage.ts`, `yanote-js/src/report/report.ts`, `yanote-js/src/report/writeReport.ts`, `yanote-js/src/events/readJsonl.ts`, and recorder-side event emission in `yanote-recorder-spring-mvc`.
- Existing planning research artifacts (`.planning/research/FEATURES.md`) for ecosystem-level validation of layered coverage expectations.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - mostly existing pinned dependencies + official docs.
- Architecture: MEDIUM - core pattern is clear, but parameter-evidence contract and `generatedAt` policy remain unresolved.
- Pitfalls: HIGH - directly grounded in OpenAPI rules, current code behavior, and deterministic-output requirements.

**Research date:** 2026-03-04
**Valid until:** 2026-04-03
