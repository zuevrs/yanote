# S01 planning summary

Planned slice `S01` for milestone `M010` and committed the plan as `docs(S01): add slice plan` (`c5a7547`).

## Outputs written
- `.gsd/milestones/M010/slices/S01/S01-PLAN.md`
- `.gsd/milestones/M010/slices/S01/tasks/T01-PLAN.md`
- `.gsd/milestones/M010/slices/S01/tasks/T02-PLAN.md`
- `.gsd/milestones/M010/slices/S01/tasks/T03-PLAN.md`
- `.gsd/DECISIONS.md` updated with `D005`

## Slice structure
- `T01` extends the canonical `HttpEvent` + `yanote-js` parser contract with additive HTTP evidence while preserving compatibility `queryKeys` / `headerKeys`.
- `T02` adds Spring MVC recorder capture/redaction logic for path/query/request-header/response-header evidence.
- `T03` proves the live example path with undeclared status + richer header/value evidence and a focused verifier, then re-runs `scripts/docs/verify-s02-analysis-path.sh`.

## Planned verification
- `./gradlew :yanote-core:test --tests "dev.yanote.core.events.EventJsonlRoundTripTest"`
- `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest"`
- `npm -C yanote-js test -- src/events/readJsonl.httpEvidence.test.ts`
- `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh`
- `bash scripts/docs/verify-s02-analysis-path.sh`

## Resume notes
- Planning is complete; no unfinished plan-file edits remain.
- Next unit can start directly from `T01`.
- Decision `D005` captures the intended additive evidence strategy: compatibility key arrays remain, while richer path/query/request-header/response-header evidence carries explicit capture/redaction/omission state and multi-value arrays.
