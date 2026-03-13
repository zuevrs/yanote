# M003/S01 — Research

**Date:** 2026-03-13

## Summary

This slice owns the first genuinely risky async step: turning Kafka-oriented AsyncAPI contracts into one canonical identity surface that the rest of the product can trust. The repo is not starting from zero. `yanote-js` already carries `@asyncapi/parser`, a shallow `src/spec/asyncapi.ts` loader, and v2/v3 fixture files. But the current seam is too thin for M003: it returns bare `{ kind:"asyncapi", action, channel }` items, throws raw stringified parser errors, keeps no message-contract references, and does not align with the runtime domain Yanote actually wants to cover next — Kafka producer/consumer evidence.

The best path is to treat **AsyncAPI as the input format** and **Kafka as the canonical coverage domain**. That means normalizing supported AsyncAPI version shapes into one internal async contract bundle, using `send`/`receive` as the canonical direction verbs, and preserving message-contract references alongside the base operation identity instead of exploding them into the primary key too early. This follows the same pattern that already works for HTTP: `buildHttpSemantics()` returns a deterministic bundle of operations plus diagnostics, and later coverage/report layers consume that stable surface rather than re-parsing raw spec structure.

The biggest planning risk is semantic drift between spec versions and future runtime evidence. AsyncAPI v2 describes direction through `publish` / `subscribe` under `channels`, while v3 lifts operations into `operations` and uses `action: send|receive` with channel references or inline channel objects. If Yanote exposes those raw version differences downstream, M004 will have to special-case recorder output against parser behavior. S01 should instead absorb that complexity now and leave M004 a single Kafka identity target.

## Recommendation

Implement S01 around one new async semantics bundle that mirrors the existing HTTP semantics pattern:

1. **Canonical identity**
   - Use a Kafka-oriented primary identity (`kind: "kafka"`, `action: "send" | "receive"`, `channel`) rather than `kind: "asyncapi"`.
   - Keep message-contract identity as associated contract metadata, not part of the base key, so S02 can report both operation coverage and message-contract coverage without fragmenting the operation surface.

2. **Deterministic diagnostics instead of thrown parser strings**
   - Wrap AsyncAPI parse/validation failures, unsupported-version boundaries, non-Kafka protocols, unresolved channel refs, and missing action/channel cases into a deterministic semantic diagnostics bundle.
   - Preserve fail-closed behavior: invalid or unsupported async semantics should be inspectable, not silently skipped.

3. **Fixture-first normalization proof**
   - Expand the existing v2/v3 fixtures with invalid and unsupported cases.
   - Add tests that prove equivalent v2 and v3 contracts normalize to the same canonical operation keys and message-contract references in deterministic order.

4. **Keep discovery/report seams stable**
   - Update spec discovery and serialization surfaces only as much as S01 needs; report/gate wiring belongs to S03.
   - Preserve OpenAPI-only behavior while making AsyncAPI discovery more reliable and explicit.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| AsyncAPI parsing and validation | `@asyncapi/parser` already present in `yanote-js/package.json` | It provides real parsing/validation and diagnostics; hand-rolling version-specific AsyncAPI parsing would be brittle immediately. |
| Deterministic spec semantics bundling | `yanote-js/src/spec/semantics.ts` / `buildHttpSemantics()` | The HTTP path already demonstrates the right shape: canonical operations + diagnostics + `hasInvalid` summary. |
| Stable operation-key serialization | `yanote-js/src/model/operationKey.ts` | Reusing one serialization surface avoids inventing ad hoc async map keys later in coverage/report code. |
| File/directory spec discovery | `yanote-js/src/spec/discover.ts` | The repo already has content sniffing and naming heuristics; S01 should extend them, not replace them. |
| Fixture-driven semantic proof | `yanote-js/src/spec/*.test.ts` and `test/fixtures/spec-semantics/*` | The existing analyzer path already relies on fixture/unit proof; async should follow the same discipline. |

## Existing Code and Patterns

- `yanote-js/src/spec/asyncapi.ts` — existing shallow loader; useful proof that parser integration works, but not yet a stable async semantics boundary.
- `yanote-js/src/spec/asyncapi.test.ts` — existing v2/v3 smoke tests; a good starting point for normalization-proof expansion.
- `yanote-js/src/spec/semantics.ts` — the cleanest model for how spec parsing should feed downstream layers: one deterministic bundle plus diagnostics.
- `yanote-js/src/spec/diagnostics.ts` — current diagnostic shape is HTTP-centric (`method`, `route`) and will need generalization for async context.
- `yanote-js/src/model/operationKey.ts` — current `kind:"asyncapi"` union arm exists, but it conflates spec format with runtime coverage domain.
- `yanote-js/src/spec/discover.ts` — existing file/directory discovery should stay the entry seam for mixed spec directories.
- `yanote-js/test/fixtures/asyncapi/v2.yaml` and `yanote-js/test/fixtures/asyncapi/v3.yaml` — already prove parser reachability; they should become canonical normalization fixtures, not just smoke samples.
- `docs/plans/2026-03-02-node-spec-analyzer-design.md` — prior design intent already leaned toward `{ kind:"kafka", channel, action }`, which matches the future runtime domain better than the current shallow loader.

## Constraints

- Preserve the existing deterministic analyzer/report posture; S01 cannot introduce non-deterministic ordering or raw parser exceptions that leak straight into user-facing surfaces.
- Prefer support for both AsyncAPI v2 and v3 if it can be done without semantic distortion; otherwise support v3 first and make the boundary explicit and test-covered.
- Keep report/gate changes out of this slice except for what is strictly necessary to preserve serialization or discovery compatibility.
- Do not promise payload-schema validation in this slice.
- Keep the future runtime path in mind: M004 needs one stable Kafka identity target for both producer and consumer evidence.

## Common Pitfalls

- **Using `kind:"asyncapi"` as the canonical runtime identity** — this binds coverage to the document format instead of the Kafka domain future evidence will actually represent.
- **Treating AsyncAPI v2 `publish/subscribe` and v3 `send/receive` as separate downstream semantics** — it will force M004 to special-case version-specific recorder matching.
- **Throwing raw parser error strings** — makes failures hard to categorize, order, and gate compared with the existing semantic diagnostic pattern.
- **Putting message contracts directly into the primary operation key too early** — fragments the base async identity before S02 has decided how to report message-contract coverage.
- **Assuming channel references are simple strings in v3** — the existing loader already hints that refs and channel objects need careful normalization.
- **Skipping invalid/unsupported fixtures** — shallow happy-path tests will not protect the fail-closed promise the user explicitly wants.

## Open Risks

- Parser diagnostics for v3 documents may not map cleanly onto the existing semantic diagnostic vocabulary without some translation layer.
- The current shallow loader already returns passing tests, so future work may underestimate how much semantic structure is still missing.
- If the canonical async contract becomes too rich too early, S02 coverage logic may inherit unnecessary complexity before runtime evidence exists.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| AsyncAPI parsing | `@asyncapi/parser` | available |
| Kafka Java runtime integration | `spring-kafka` docs | available |
| Context-mode repo/domain scouting | `context-mode` MCP | available |

## Sources

- The current shallow async loader, fixtures, and operation-key shape come from the live repo sources (source: `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/spec/asyncapi.test.ts`, `yanote-js/src/model/operationKey.ts`, `yanote-js/test/fixtures/asyncapi/v2.yaml`, `yanote-js/test/fixtures/asyncapi/v3.yaml`).
- The repo’s proven semantics pattern comes from the current HTTP implementation (source: `yanote-js/src/spec/semantics.ts`, `yanote-js/src/spec/diagnostics.ts`).
- The earlier design intent for Kafka-oriented canonical identities comes from the original analyzer design notes (source: `docs/plans/2026-03-02-node-spec-analyzer-design.md`).
- Parser behavior and diagnostics capabilities come from the AsyncAPI parser docs fetched during planning (source: Context7 `/asyncapi/parser-js`, query: `parse validate AsyncAPI document channels operations publish subscribe TypeScript Node`).
- AsyncAPI operation/action semantics and Kafka server/channel concepts come from the AsyncAPI spec docs fetched during planning (source: Context7 `/asyncapi/spec`, query: `v2 v3 differences operations publish subscribe send receive channels messages kafka bindings`).
