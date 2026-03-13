# GSD State

**Active Milestone:** M003 — AsyncAPI Coverage Foundations
**Active Slice:** S01 — AsyncAPI Contract Ingestion And Canonical Identity
**Active Task:** (none)
**Phase:** planning
**Requirements Status:** 12 active · 31 validated · 7 deferred · 6 out of scope

## Milestone Registry
- ✅ **M001:** Yanote v1 Delivery
- ✅ **M002:** Repository Product Maturity
- ⏳ **M003:** AsyncAPI Coverage Foundations
- ⏳ **M004:** Kafka Evidence Capture And Java Integration
- ⏳ **M005:** Async Productization And End-to-End Proof

## Recent Decisions
- Use `kind:"kafka"` as the canonical first-wave async operation kind; treat AsyncAPI as the input format, not the runtime identity label.
- Normalize AsyncAPI v2 `publish`/`subscribe` and v3 `send`/`receive` into canonical `send` / `receive` semantics.
- Keep message-contract references alongside the base async operation identity instead of embedding them in the primary key during S01.
- Translate AsyncAPI parser and normalization problems into deterministic semantic diagnostics bundles rather than raw thrown parser strings.
- Expose AsyncAPI normalization as a semantics bundle and fail closed on unsupported protocol or semantic invalidity before returning operations.

## Blockers
- None

## Next Action
Execute M003/S01/T03 — Add parity and failure-path proof for canonical async identity.
