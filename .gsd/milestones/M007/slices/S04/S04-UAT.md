# S04: Live Kafka Proof And Boundary Refresh — UAT

**Milestone:** M007
**Written:** 2026-03-20T20:15:57+03:00

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: S04 changes both live runtime behavior and public boundary wording, so confidence requires a real Kafka proof run, retained artifact inspection, and a human check that docs/support claims match the exported evidence.

## Preconditions

- Run from the repo worktree root with Java 21, Node >=20, and the local container/broker runtime available for the Spring Kafka proof scripts.
- `yanote-js` must be buildable from source by the verifier scripts.
- Do not run `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` and `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` in parallel from the same worktree.
- The worktree may already contain `.yanote-ci/live-kafka-proof/`; the verifier should replace it with a fresh bundle.

## Smoke Test

Run:

```bash
bash scripts/ci/verify-m004-s03-live-kafka-proof.sh
```

The smoke test passes when the command exits 0 and `.yanote-ci/live-kafka-proof/artifact-manifest.txt` shows `artifact_count=12`, `missing_artifacts=none`, and both the canonical happy-path trio plus the retained `schema-failure-*` sidecars.

## Test Cases

### 1. Happy-path live Kafka proof keeps the canonical async artifact trio stable

1. Run `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`.
2. Open `.yanote-ci/live-kafka-proof/artifact-manifest.txt`.
3. Confirm the manifest lists `async-report.stdout`, `async-report.stderr`, and `yanote-async-report.json`.
4. Open `.yanote-ci/live-kafka-proof/yanote-async-report.json`.
5. **Expected:** the verifier exits 0, the canonical trio is present under their original filenames, and the happy-path report remains the stable workflow-facing artifact surface.

### 2. The same live proof exports retained schema-failure sidecars with typed invalid-payload truth

1. Reuse the bundle from the previous test or rerun `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`.
2. Open `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr`.
3. Confirm it contains typed `ASYNC_SEMANTIC_INVALID_PAYLOAD` lines for both `kafka receive users.created` and `kafka send users.created`.
4. Open `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json`.
5. Confirm `diagnostics.counts.invalid-payload` equals `2` and both diagnostics carry `schemaId: "UserCreatedPayload"`.
6. **Expected:** the intentional mismatch run is retained as sidecar artifacts, not as a replacement for the happy-path trio, and it publishes inspectable typed payload-schema drift for the same merged Kafka evidence.

### 3. Public async docs and support boundary match the proven runtime truth

1. Run `bash scripts/docs/verify-m005-s01-async-path.sh`.
2. Run `bash scripts/docs/verify-m005-s01-async-boundaries.sh`.
3. Open `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md`.
4. Compare their wording with `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr` and `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json`.
5. **Expected:** the verifiers pass, the docs claim payload-schema drift only for the proven Kafka path, the wording still says routing percentages are routing-first, headers remain unverifiable, the async path remains Kafka-only / Spring Kafka-first / separate from HTTP, and the stale `payload-schema enforcement пока нет` wording is absent.

## Edge Cases

### Schema drift without routing drift still preserves routing-first coverage

1. Open `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json` after a fresh live-proof run.
2. Inspect `coverage.summary` / `coverage.operations.items[*]` alongside `diagnostics.counts.invalid-payload`.
3. **Expected:** the report shows `status: "partial"`, routing coverage remains 100% with operations/messages/channels still `COVERED`, and schema drift is represented only through typed diagnostics rather than by degrading routing coverage.

## Failure Signals

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` exits non-zero on the overall slice proof.
- `.yanote-ci/live-kafka-proof/artifact-manifest.txt` is missing any of the canonical trio or any retained `schema-failure-*` files.
- `schema-failure-async-report.stderr` lacks `ASYNC_SEMANTIC_INVALID_PAYLOAD` lines.
- `schema-failure-yanote-async-report.json` does not show `diagnostics.counts.invalid-payload = 2` with `schemaId: "UserCreatedPayload"`.
- The docs verifiers fail or the reviewed docs reintroduce broker-agnostic, header-level, or combined-report claims that the proof bundle does not actually support.

## Not Proven By This UAT

- Public proof of retained Kafka header conformance; headers remain intentionally unverifiable in the exported user-facing artifact bundle.
- Broker-agnostic AsyncAPI support, non-Kafka runtimes, or a unified HTTP+async report/gate surface.
- Deeper future-scope async work such as schema registries, schema-evolution policies, or operational broker semantics beyond the current contract surface.

## Notes for Tester

Use the live proof bundle, not ad hoc analyzer output, as the primary truth source for this slice. The happy-path trio is the stable consumer contract, while the `schema-failure-*` files are the deliberate red-path evidence. If you see schema drift reported with routing still green, that is expected and correct for S04.
