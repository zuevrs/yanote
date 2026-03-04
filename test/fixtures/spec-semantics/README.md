# Shared Semantic Parity Fixtures

These fixtures are the single source of truth for Phase 1 semantic parity between:

- `yanote-js` (TypeScript runtime)
- `yanote-core` (Java runtime)

## Files

- `operation-cases.json` - canonical operation extraction + diagnostics expectations
- `matching-cases.json` - deterministic event-to-operation matching expectations

## `operation-cases.json` schema

Each case includes:

- `caseId` - stable identifier used by both runtimes
- `paths` - simplified OpenAPI `paths` object used to build semantic input
- `expectedOperations` - ordered list of canonical operation keys (`"METHOD /route"`)
- `expectedDiagnostics` - ordered diagnostics with at least `kind`, optional `method`, `route`, `candidates`

## `matching-cases.json` schema

Each case includes:

- `caseId` - stable identifier used by both runtimes
- `operations` - canonical operation keys (`"METHOD /route"`) used as matcher input
- `events` - replay events with `method`, `route`, and optional `suite`
- `expectedCovered` - ordered list of covered operation keys
- `expectedDiagnostics` - ordered diagnostics with deterministic candidate lists

## Determinism contract

- `caseId` values must stay stable once published.
- `expectedOperations` and `expectedCovered` are order-sensitive.
- `expectedDiagnostics` are order-sensitive.
- `candidates` inside ambiguous diagnostics are order-sensitive.
- Both runtimes must read these files directly (no runtime-specific fixture forks).
