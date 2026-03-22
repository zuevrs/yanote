# M005 — Research

**Date:** 2026-03-14

## Summary

M005 should not start by inventing new async runtime mechanics. The core async path is already materially present and verified: `yanote async-report` exists as a separate CLI/report/gate surface, the live Spring Kafka proof stack already exercises both the single-service republish path and the two-service producer→consumer path, and `build-and-test` already runs that live Kafka proof in CI. The real gap is productization truth: the public landing/docs/support surfaces still describe Yanote primarily as an HTTP/OpenAPI product, `docs/release-and-support.md` does not yet present async as a supported first-wave surface, `SUPPORT.md` only asks for HTTP artifacts, and the public `docs/requirements.md` still says AsyncAPI coverage is out of scope.

Primary recommendation: prove public boundary truth first, then compose the final acceptance surface from the existing M004 proof scripts instead of creating new proof logic. Concretely, S01 should align the root/docs/support/requirements/release-boundary surfaces around the already-decided async contract: **Kafka-only**, **Spring Kafka-first**, **separate async report/gate**, **no payload-schema enforcement yet**, and **no broker-agnostic promise**. After that, S02 should reuse the M002/S08 “stage runner” pattern to compose docs/boundary verification with the authoritative M004 single-service and two-service live Kafka proofs.

The main surprise is that the runtime side is already farther along than the product surface. The repository already has a trustworthy async engine and live broker proof, but the standard validation/reporting surfaces still assume HTTP: `yanote-validation`, artifact collection, GitHub summary rendering, and Gradle `yanoteCheck` all remain wired to `report`/`yanote-report.json`. That means the first thing to prove is not “can Yanote do async?” but “can a fresh engineer discover the real async path, understand its honest limits, and see the existing proof chain without reading maintainer-only context?”

## Recommendation

1. **Prove public truth before parity work.**
   - Fix the public contradiction first: root/docs/release/support/requirements surfaces must stop implying that async is unavailable or unspecified.
   - Add machine checks for the new async boundary wording the same way M002 protected landing/support/trust surfaces.

2. **Reuse existing proof surfaces instead of re-implementing them.**
   - Keep `scripts/ci/verify-m004-s02-metadata-propagation.sh` as the authoritative single-service raw-evidence proof.
   - Keep `scripts/ci/verify-m004-s03-live-kafka-proof.sh` as the authoritative composed runtime proof.
   - Build M005 final acceptance as a stage runner, mirroring `scripts/docs/verify-s08-entry-paths.sh`.

3. **Promote async proof into CI trust surfaces only where it is currently invisible.**
   - Extend artifact collection and GitHub summary rendering so async proof failures and `yanote-async-report.json` become first-class CI diagnostics.
   - Do this inside the existing `build-and-test` / `yanote-validation` topology; do not create new required job names casually.

4. **Treat new Gradle/plugin async API as optional, not default M005 scope.**
   - The current plugin contract is explicitly HTTP-oriented (`yanoteReport`, `yanoteCheck`).
   - Adding `yanoteAsyncReport` / `yanoteAsyncCheck` could be useful later, but it is a broader public-API decision than the milestone context requires.
   - Unless a slice explicitly chooses to own that API expansion, M005 should prefer docs + proof + CI trust-surface closure over new delivery surface growth.

## Don’t Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|-------------------|------------|
| Final milestone acceptance runner | `scripts/docs/verify-s08-entry-paths.sh` | Proven repo pattern for stage-labeled composed acceptance without duplicating lower-level checks. |
| Single-service async proof | `scripts/ci/verify-m004-s02-metadata-propagation.sh` | Already asserts raw JSONL attribution and then `async-report`; preserves the “raw evidence before report” trust posture. |
| Two-service async proof | `scripts/ci/verify-m004-s03-live-kafka-proof.sh` | Already composes single-service proof, two-service proof, deterministic merge, and `async-report` happy-path verification. |
| Separate async analyzer/gate contract | `yanote-js/src/cli.ts` + `yanote-js/src/gates/asyncEvaluator.ts` | Async summary/error lines, separate artifact naming, and fail-closed semantic/threshold behavior already exist; do not invent a second async CLI contract. |
| Deterministic multi-service merge | `scripts/ci/merge-async-events-jsonl.mjs` | The repo already chose lexicographic input-path order; hand-rolling timestamp merge would reintroduce nondeterminism. |
| Public boundary verification | `scripts/docs/verify-s04-boundaries.sh` | Existing machine-checked owner-doc pattern is the right place to extend async support wording and limitation checks. |
| CI artifact collection | `scripts/ci/collect-yanote-artifacts.sh` | Extend this collector for async artifacts instead of adding a parallel ad hoc copy step elsewhere. |
| CI summary rendering | `scripts/ci/render-yanote-summary.mjs` | Better to teach the existing summary surface about async than to create a second GitHub summary format. |

## Requirements Lens

### Table stakes from active requirements

- **R047 — Productized AsyncAPI/Kafka onboarding and support surface** is table stakes, not optional polish.
  - The repository already has working async internals; M005 fails if the public path still forces users to reverse-engineer them.
- **R048 — CI-ready end-to-end async proof and release-grade trust surface** is also table stakes.
  - The runtime proof exists, but it is not yet fully surfaced through the same user-facing trust layers as HTTP.

### Candidate requirements worth considering explicitly (advisory only)

These findings should be considered as **candidate requirements or acceptance bullets**, not silently added scope:

1. **Public product truth parity for async support**
   - Candidate: public `README.md`, `docs/README.md`, `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` must not contradict the real async capability.
   - Why: today the strongest contradiction is `docs/requirements.md`, which still says AsyncAPI coverage is out of scope.

2. **Async support-intake artifact contract**
   - Candidate: support guidance should explicitly ask for async evidence/report artifacts where relevant (`events.jsonl` or merged async JSONL, `yanote-async-report.json`, analyzer logs).
   - Why: otherwise public support intake still assumes HTTP-only debugging.

3. **Async CI diagnostics promotion**
   - Candidate: CI artifact collection and summary rendering should expose async proof/report artifacts when async validation runs.
   - Why: async can be proven in CI today but still remain second-class in triage UX.

### Likely optional / overbuilt for M005

- New public Gradle/plugin async task names.
- A mandatory unified HTTP+async report.
- Release bundles that ship proof output artifacts instead of just proving the command path.
- A second standalone “async validation” required GitHub job.

### Clearly out of scope and should stay that way

- Payload validation against AsyncAPI message schemas.
- Broker-agnostic AsyncAPI support.
- RabbitMQ or other non-Kafka transports.
- Schema Registry integration.
- DLQ/retry/partition/lag-aware async coverage dimensions.
- A mandatory combined HTTP+async report in the first async release.

## Relevant Code

- `README.md` — Root product story and verified path are still HTTP/OpenAPI-first; async does not yet appear as a first-class onboarding path.
- `docs/README.md` — Canonical docs map currently lists only three HTTP-centered guides (`recorder-spring-mvc`, `analyzer-coverage`, `test-tagging`).
- `docs/release-and-support.md` — Public owner surface for stable line, support boundaries, compatibility, and limitations; this is the right async boundary owner to extend.
- `docs/requirements.md` — Public requirements page still says “AsyncAPI coverage (Kafka, RabbitMQ)” is out of scope, which directly conflicts with validated M003/M004 reality.
- `SUPPORT.md` — Maintainer-led support intake still asks for `events.jsonl`, `yanote-report.json`, or analyzer/Gradle logs; it does not yet name async artifacts.
- `scripts/docs/verify-s04-boundaries.sh` — Machine-checks the release/support owner doc and root/docs landing pointers; this should be extended rather than bypassed.
- `scripts/docs/verify-s08-entry-paths.sh` — Best existing model for M005 final composed acceptance: small verifiers plus clone-local proof, stage-labeled and drift-resistant.
- `yanote-js/src/cli.ts` — Ships a separate `async-report` command, `yanote-async-report.json`, and `YANOTE_ASYNC_SUMMARY` / `YANOTE_ASYNC_ERROR*` output contract.
- `yanote-js/src/spec/asyncapi.ts` — Enforces the key public boundary: only `kafka` protocol is supported.
- `yanote-js/src/gates/asyncEvaluator.ts` — Encodes fail-closed async semantics: semantic failures short-circuit threshold/regression logic.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — Authoritative single-service HTTP→Kafka→Kafka proof; validates raw mixed JSONL before running `async-report`.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — Authoritative composed live proof: single-service proof, two-service proof, deterministic merge, and async analyzer run.
- `scripts/ci/merge-async-events-jsonl.mjs` — Deterministically merges per-service async evidence by lexicographic input-path order.
- `.github/workflows/yanote-ci.yml` — `build-and-test` already runs the live Kafka proof stack, but `yanote-validation` remains HTTP-report-oriented.
- `scripts/ci/run-yanote-gradle-check.sh` — The reusable CI validation helper fabricates an HTTP/OpenAPI fixture and drives `yanoteCheck`; no async path here yet.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt` — Public Gradle plugin currently exposes only `yanoteReport` / `yanoteCheck`.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt` — Hardwires analyzer invocation to `report`, not `async-report`.
- `scripts/ci/collect-yanote-artifacts.sh` — Collector only knows `yanote-report.json` and related HTTP validation files.
- `scripts/ci/render-yanote-summary.mjs` — GitHub summary renderer assumes the HTTP report shape and `YANOTE_ERROR` semantics.

## Constraints

- **Public docs remain Russian-first.** Internal research can stay English-first, but public-facing guidance must align with the Russian-first repository posture.
- **First-wave async scope must stay explicit:** Kafka-only, Spring Kafka-first, separate async report/gate, and no payload-schema enforcement yet.
- **Do not duplicate proof logic.** M005 context explicitly prefers composition of lower-level proofs over re-implementation.
- **Required CI job names are stable contracts.** `build-and-test` and `yanote-validation` are already frozen by branch-protection/workflow tests.
- **Raw evidence remains the trust boundary.** Existing async proofs check JSONL attribution before analysis; M005 should preserve that order.
- **Deterministic merge behavior is already chosen.** Multi-service async evidence is merged by lexicographic input-path order, not timestamps.
- **Gradle plugin task names are already public API.** Expanding them is possible, but it is a bigger compatibility decision than a docs-only change.

## Common Pitfalls

- **Fixing only the guides, not the owner surfaces** — Update `README.md` and a new async guide, but also align `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md`, then protect the wording with a verifier.
- **Overselling the first async release** — Keep the public wording firmly on Kafka-only, Spring Kafka-first, separate async report, and no payload validation.
- **Rebuilding proof logic in M005** — Reuse the M004 verifier scripts; do not fork them into a second near-duplicate acceptance script.
- **Treating analyzer success as enough** — Preserve the raw JSONL assertions first; otherwise metadata drift can hide behind a passing report.
- **Breaking deterministic merge behavior** — Do not sort merged events by timestamps or runtime order; the repository already stabilized on lexicographic path order.
- **Adding a new required CI job out of convenience** — Extend the existing workflow topology unless there is an explicit decision to change branch-protection contracts.
- **Assuming Gradle parity is automatically required** — The milestone context emphasizes productization and trust surfaces; new plugin APIs are optional unless explicitly chosen.
- **Leaving async invisible in CI artifacts** — If async proof fails but the summary/collector still only understand `yanote-report.json`, the capability will still feel second-class.

## Open Risks

- Public async docs may still drift from support/release wording unless one verifier owns the whole async boundary contract.
- The repository may continue to feel HTTP-first even after docs changes if CI artifacts and summaries still surface only HTTP outputs.
- If M005 introduces new Gradle async tasks without an explicit API decision, it may accidentally expand public support commitments beyond the milestone’s intent.
- The public `docs/requirements.md` contradiction is large enough that partial docs work can still leave users with the impression that async is unsupported.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| AsyncAPI | `melodic-software/claude-code-plugins@asyncapi-design` | installed |
| Spring Kafka | `claude-dev-suite/claude-dev-suite@spring-kafka` | installed |
| GitHub Actions | `dalestudy/skills@github-actions` | installed |

## Sources

- Root onboarding is still framed around HTTP/OpenAPI and `yanote-report.json` (source: `README.md`).
- User docs map still exposes only the three HTTP-centered canonical guides (source: `docs/README.md`).
- Public release/support owner surface is machine-checked and currently lacks async stable-surface language (source: `docs/release-and-support.md`; `scripts/docs/verify-s04-boundaries.sh`).
- Public requirements still state that AsyncAPI coverage is out of scope (source: `docs/requirements.md`).
- Public support intake still requests only HTTP-oriented artifacts (source: `SUPPORT.md`).
- The repository already has a composed final-acceptance pattern worth reusing (source: `scripts/docs/verify-s08-entry-paths.sh`).
- The analyzer already ships a separate `async-report` command and `YANOTE_ASYNC_*` summary/error contract (source: `yanote-js/src/cli.ts`).
- The first-wave async scope is intentionally Kafka-only (source: `yanote-js/src/spec/asyncapi.ts`).
- Async gate behavior is fail-closed on semantic drift before threshold/regression handling (source: `yanote-js/src/gates/asyncEvaluator.ts`).
- The authoritative single-service live proof validates raw JSONL attribution before `async-report` (source: `scripts/ci/verify-m004-s02-metadata-propagation.sh`).
- The authoritative two-service live proof composes single-service proof, two-service proof, deterministic merge, and `async-report` (source: `scripts/ci/verify-m004-s03-live-kafka-proof.sh`).
- Deterministic async evidence merge is lexicographic by resolved input path (source: `scripts/ci/merge-async-events-jsonl.mjs`).
- CI already runs the live Kafka proof, but standard validation/artifact surfaces remain HTTP-only (source: `.github/workflows/yanote-ci.yml`; `scripts/ci/run-yanote-gradle-check.sh`; `scripts/ci/collect-yanote-artifacts.sh`; `scripts/ci/render-yanote-summary.mjs`; `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt`; `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt`).
- AsyncAPI 3.0 operations use explicit `action: send|receive`, and AsyncAPI server objects declare `protocol: kafka` for Kafka brokers (source: AsyncAPI Specification docs, https://github.com/asyncapi/spec/blob/master/spec/asyncapi.md).
- Spring Kafka exposes the relevant producer/consumer seams the repo is already using conceptually: `ProducerListener` for send outcomes and listener/header metadata access on the consumer side (source: Spring Kafka docs, https://github.com/spring-projects/spring-kafka/blob/main/spring-kafka-docs/src/main/antora/modules/ROOT/pages/kafka/sending-messages.adoc and https://github.com/spring-projects/spring-kafka/blob/main/spring-kafka-docs/src/main/antora/modules/ROOT/pages/kafka/receiving-messages/listener-annotation.adoc).
