---
id: M007
provides:
  - Payload-bearing Kafka evidence, routing-first AsyncAPI payload validation, public schema-depth async diagnostics/gates, and authoritative live-proof artifacts/docs that prove the stronger Kafka async contract end to end.
key_decisions:
  - Kept canonical Kafka operation identity routing-only while retaining parser schema ids beside it, published public schema-depth diagnostics only for retained named schema ids, and preserved stable happy-path artifact filenames by exporting intentional red-path proof as additive `schema-failure-*` sidecars.
patterns_established:
  - Close contract-depth milestones in boundary order: evidence model first, internal conformance seam second, public report/gate semantics third, then live proof and docs; keep routing coverage percentages separate from payload-conformance diagnostics throughout.
observability_surfaces:
  - `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts`
  - `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
  - `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - `bash scripts/docs/verify-m005-s01-async-path.sh`
  - `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
  - `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr`
  - `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json`
requirement_outcomes:
  - id: R049
    from_status: active
    to_status: validated
    proof: Payload-bearing Kafka evidence from S01, routing-first schema validation from S02, public async report/gate/CLI exposure from S03, and the authoritative Spring Kafka `schema-failure-*` proof artifacts from S04 together prove payload conformance end to end.
  - id: R065
    from_status: active
    to_status: validated
    proof: S02 established typed schema/header/reference diagnostics distinct from routing drift, S03 exposed them through public async artifacts and `ASYNC_SEMANTIC_*` failures, and S04 preserved that distinction in retained live-proof artifacts and boundary docs.
duration: ~11h20m across S01-S04 plus milestone close-out
verification_result: passed
completed_at: 2026-03-20 20:24:10 +0300
---

# M007: AsyncAPI Schema Conformance And Contract Depth

**Yanote’s Kafka async path now carries payload-bearing evidence end to end, validates observed payloads against AsyncAPI schemas, exposes typed schema-depth drift through public async artifacts and gates, and proves that stronger boundary on the authoritative Spring Kafka live-proof stack.**

## What Happened

M007 closed the biggest remaining contract-depth gap in Yanote’s async surface by working in the right order and keeping each boundary truthful.

S01 replaced the old metadata-only seam with a payload-bearing Kafka evidence contract that survives Java recorder capture, JSONL round-trip, and Node ingestion. That slice also retained AsyncAPI payload-schema metadata beside the canonical `kafka <action> <channel>` identity instead of widening routing keys, which kept the existing async coverage/report model stable while making real schema validation possible.

S02 turned that stronger evidence boundary into actual schema-depth analyzer truth. The new internal routing-first conformance seam validates only routing-aligned Kafka evidence, strips parser-only extensions before strict Ajv compilation, and emits typed redacted diagnostics for invalid payloads, missing payload observations, unsupported schema/content-type cases, and currently unverifiable header contracts. Just as importantly, it proved that schema drift can stay distinct from routing drift without changing the public async contract prematurely.

S03 promoted that internal truth to the shipped product surface. Public async coverage, `yanote-async-report.json`, gates, CLI machine output, and CI summary readers now publish schema-depth async diagnostics as first-class redacted contract truth while preserving routing-first coverage percentages. The same explicit semantic ordering now drives gate failures, `YANOTE_ASYNC_ERROR*`, `YANOTE_ASYNC_SUMMARY primary_reason`, Top Issues, and report-first fallback classification.

S04 completed the milestone by proving the stronger contract on the real Spring Kafka path and refreshing the outward-facing boundary to match. The authoritative live proof now keeps the stable happy-path async artifact trio, adds retained `schema-failure-*` sidecars from an intentional invalid-payload analyzer pass over the same merged Kafka evidence, and documents only the runtime boundary that those artifacts actually prove: Kafka-only, Spring Kafka-first, routing-first coverage percentages, payload-schema drift surfaced through retained async artifacts, and headers still publicly unverifiable.

Taken together, the slices delivered one coherent result rather than four isolated improvements: real payload-bearing async evidence, deterministic schema-conformance logic, public schema-depth failure semantics, and live retained proof that the repository can stand behind.

## Cross-Slice Verification

Each roadmap success criterion was rechecked against the assembled slice evidence and the milestone validation pass:

- **Success criterion 1 — `async-report` surfaces payload-conformance failures on supported Kafka evidence:** met. S01 introduced truthful payload-bearing Kafka evidence, S02 added routing-first schema validation, S03 widened public async report/gate/CLI/report-artifact surfaces, and S04 proved the behavior through retained `schema-failure-*` live-proof artifacts.
- **Success criterion 2 — async failures distinguish routing drift from schema/header drift in CLI/stderr and `yanote-async-report.json`:** met. S02 kept typed schema/reference/header diagnostics separate from `unmatched` and `mismatched`; S03 mapped them to public async diagnostics plus `ASYNC_SEMANTIC_*` failure semantics; S04 retained red-path stderr and report artifacts that show `invalid-payload` while routing coverage remains green.
- **Success criterion 3 — the live Spring Kafka proof exercises the stronger async contract end to end and leaves inspectable failure artifacts:** met. `scripts/ci/verify-m004-s03-live-kafka-proof.sh` now exports both the canonical happy-path trio and `schema-failure-*` sidecars, and `.yanote-ci/live-kafka-proof/` contains the retained stderr/report artifacts needed to inspect red-path behavior.
- **Success criterion 4 — public async docs/support surfaces describe the stronger contract truth without overclaiming scope:** met. S04 refreshed `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md`, then rechecked them with the async boundary verifier stack.

The milestone definition of done also checks out in full:

- payload-bearing async evidence exists as a stable recorder → JSONL → analyzer boundary: **met** by S01;
- AsyncAPI schema validation works through the real async-report path: **met** by S02 internal conformance plus S03 public async-report/gate/CLI/report wiring;
- async report/gate surfaces distinguish routing drift from schema drift with deterministic diagnostics and artifacts: **met** by S03 and S04;
- the live Kafka proof stack exercises the stronger contract end to end: **met** by S04 live-proof/exporter/verifier work;
- async docs/support surfaces were rechecked against runtime truth: **met** by the S04 docs verifier stack.

Delivery-integrity checks also passed:

- all roadmap slices are marked complete and all slice summaries exist under `.gsd/milestones/M007/slices/S01/S01-SUMMARY.md` through `S04/S04-SUMMARY.md`;
- the boundary handoffs S01 → S02, S02 → S03, and S03 → S04 all remained consistent in the final validation record;
- no success criterion or definition-of-done clause remained unmet.

## Requirement Changes

- R049: active → validated — S01 made payload-bearing Kafka evidence truthful, S02 proved deterministic routing-first schema validation, S03 exposed payload-conformance failures through public async artifacts/gates/CLI, and S04 proved the behavior on the authoritative Spring Kafka live-proof stack with retained `schema-failure-*` artifacts.
- R065: active → validated — S02 established typed schema/header/reference diagnostics distinct from routing drift, S03 preserved that distinction through public async report/gate/CLI/CI semantics, and S04 retained the same distinction in live-proof artifacts and public boundary docs.

## Forward Intelligence

### What the next milestone should know
- M007 worked because it did not try to do everything at once: the durable pattern was evidence boundary first, internal conformance second, public semantics third, and live proof/docs last. M008 should follow the same order on the HTTP side instead of starting from CLI/report changes.
- Keep routing/exercise coverage and payload conformance as separate truths. M007 stayed stable because operation/message/channel percentages remained routing-first while payload-schema failures became a separately ordered diagnostic family.
- If a new payload-conformance surface needs stronger red-path proof, use the same observed evidence for both the green path and the intentional failing path so the difference is obviously contract depth rather than different runtime input.

### What's fragile
- Public contract widening is fragile when downstream readers already consume canonical filenames, counts, or machine-readable summary fields. Preserve the stable happy-path artifact contract and add new failure proof as additive sidecars or paired diagnostics instead of overloading the existing happy-path files.
- Schema-depth publishing is also fragile when stable schema identity is missing. M007 only exposed public schema-depth diagnostics when backed by retained named schema ids; otherwise generic fixtures would have produced noisy or misleading public failures.

### Authoritative diagnostics
- `.gsd/milestones/M007/M007-VALIDATION.md` — fastest milestone-level truth source because it cross-checks success criteria, slice delivery, integration boundaries, and requirement outcomes in one place.
- `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr` and `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json` — authoritative retained proof that the shipped async surface now reports typed schema-depth failures while routing coverage stays green.
- `yanote-js/src/coverage/asyncSchemaConformance*.test.ts` plus `src/report/asyncReport*.test.ts`, `src/gates/asyncEvaluator.test.ts`, and `src/cli.async-report*.test.ts` — authoritative source for the internal-versus-public contract boundary and the deterministic failure semantics that S03/S04 relied on.

### What assumptions changed
- “Payload validation will require widening canonical async operation identity.” — It did not. Retained parser schema ids beside routing-only keys were enough to add deterministic schema-depth truth.
- “A green happy-path live proof is enough to claim schema-depth support.” — It was not. The milestone only became trustworthy once the same authoritative live bundle also carried inspectable intentional `schema-failure-*` red-path artifacts and the docs/support wording was tied to those artifacts.

## Files Created/Modified

- `.gsd/milestones/M007/M007-SUMMARY.md` — recorded the milestone close-out, integrated verification, requirement transitions, and downstream guidance.
- `.gsd/REQUIREMENTS.md` — refreshed R049 and R065 notes to record the integrated M007 close-out proof behind their validated status.
- `.gsd/PROJECT.md` — updated the project record to show M007 closed and M008 as the next planned roadmap focus.
- `.gsd/KNOWLEDGE.md` — captured reusable lessons about routing-first versus payload-conformance separation and sidecar proof artifacts for future contract-depth milestones.
- `.gsd/STATE.md` — moved the worktree from completing-milestone into milestone-complete handoff state.
