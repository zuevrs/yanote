# S03: Kafka binding support matrix without false green — UAT

**Milestone:** M014
**Written:** 2026-03-26T12:52:05.948Z

# S03: Kafka binding support matrix without false green — UAT

**Milestone:** M014
**Written:** 2026-03-26T15:57:00+03:00

## Preconditions
- Worktree: `/Users/zuevrs/Projects/yanote/.gsd/worktrees/M014`
- Node dependencies installed for `yanote-js`
- Built CLI available via `node yanote-js/dist/yanote.cjs` (`npm -C yanote-js run build`)
- Temp output directory available (examples below use `.tmp/m014-s03-bindings-uat`)

## Test Case 1 — Built CLI produces the binding matrix artifacts and machine tokens

**Goal:** Confirm the real `async-report` command writes the expected JSON/HTML artifacts and exposes binding-support truth without repointing `report=` away from JSON.

1. Run:
   ```bash
   npm -C yanote-js run build
   rm -rf .tmp/m014-s03-bindings-uat
   node yanote-js/dist/yanote.cjs async-report \
     --spec yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml \
     --events yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl \
     --out .tmp/m014-s03-bindings-uat \
     --profile local | tee .tmp/m014-s03-bindings-uat.stdout
   ```
   **Expected:** Exit code `0`.
2. Inspect stdout.
   **Expected:**
   - `status: partial`
   - a `Kafka Binding Support` section is present
   - counts are `operations with bindings: 3`, `total bindings: 18`, `supported bindings: 1`, `declared-only bindings: 6`, `deferred bindings: 11`, `invalid bindings: 0`
   - the final `YANOTE_ASYNC_SUMMARY` line contains `report=.tmp/m014-s03-bindings-uat/yanote-async-report.json`
   - the same summary line contains additive `binding_operations=3`, `binding_total=18`, `binding_supported=1`, `binding_declared_only=6`, `binding_deferred=11`, and `binding_invalid=0`
3. Inspect the output directory.
   **Expected:** Both `.tmp/m014-s03-bindings-uat/yanote-async-report.json` and `.tmp/m014-s03-bindings-uat/yanote-async-report.html` exist.
4. Confirm the local-profile warning boundary.
   **Expected:** The run is still `status: partial` because `users.lifecycle` is intentionally uncovered, but the command remains successful and writes both artifacts.

## Test Case 2 — JSON report carries the canonical bindingSupport matrix

**Goal:** Confirm the canonical JSON report publishes additive binding support without changing legacy coverage math or operation identity.

1. Open `.tmp/m014-s03-bindings-uat/yanote-async-report.json`.
2. Inspect top-level report state.
   **Expected:**
   - `status === "partial"`
   - `coverage.channels.percent === 66.67` (rounded display in CLI, numeric JSON value may be 66.6667)
   - `coverage.operations.percent === 66.67` / `66.6667`
   - `coverage.messages.percent === 50`
   - top-level `bindingSupport` object exists
3. Inspect `bindingSupport.summary`.
   **Expected:**
   - `totalOperations === 3`
   - `totalBindings === 18`
   - `supportedBindings === 1`
   - `declaredOnlyBindings === 6`
   - `deferredBindings === 11`
   - `invalidBindings === 0`
4. Inspect operation rows.
   **Expected:**
   - `kafka send orders.command` includes one supported binding for `channel.topic` with value `orders.actual`
   - the same operation includes declared-only rows for `operation.groupId`, `operation.clientId`, and `message.OrderCommand.key`
   - the same operation includes deferred rows for `channel.partitions`, `channel.replicas`, `channel.topicConfiguration`, `message.OrderCommand.schemaIdLocation`, and `message.OrderCommand.schemaLookupStrategy`
   - `kafka receive orders.consumer` contains declared-only bindings only and no supported rows
   - `kafka send users.lifecycle` contains deferred schema-registry rows and no supported rows
5. Check identity stability.
   **Expected:** Operation keys remain `kafka send orders.command`, `kafka receive orders.consumer`, and `kafka send users.lifecycle`; no binding field rewrites canonical async identities.

## Test Case 3 — HTML report mirrors the same binding-support story for humans

**Goal:** Confirm the human-facing report exposes the same support matrix as the JSON artifact.

1. Open `.tmp/m014-s03-bindings-uat/yanote-async-report.html` in a browser.
2. Navigate to the `Kafka Binding Support` section.
   **Expected:**
   - the section heading reads `Kafka Binding Support`
   - the summary cards match the JSON counts (`3 / 18 / 1 / 6 / 11 / 0`)
   - the table caption is `Kafka binding support by async operation`
3. Inspect the `send orders.command` row.
   **Expected:**
   - `channel · topic` appears under `Supported now`
   - `operation · groupId`, `operation · clientId`, and `message · OrderCommand · key` appear under `Declared-only`
   - channel partitions/replicas/topicConfiguration plus schema-registry fields appear under `Deferred`
4. Inspect the `receive orders.consumer` and `send users.lifecycle` rows.
   **Expected:**
   - `receive orders.consumer` shows declared-only fields and no supported/deferred invalid surprises beyond the expected matrix
   - `send users.lifecycle` shows deferred schema-registry rows and no supported fields

## Test Case 4 — No false green: binding truth stays additive and separate from coverage

**Goal:** Confirm the matrix does not inflate coverage or pretend deferred bindings are supported.

1. Compare the JSON `coverage.*` summary with the binding-support counts.
   **Expected:**
   - `binding_supported === 1` does **not** change `covered_operations` from `2/3`
   - `binding_total === 18` does **not** appear as a new coverage denominator anywhere
   - declared-only and deferred bindings stay outside the legacy channel/operation/message coverage percentages
2. Inspect stdout `Top Issues` and `YANOTE_ASYNC_SUMMARY`.
   **Expected:**
   - the uncovered `users.lifecycle` operation is still reported as uncovered
   - machine output keeps both coverage tokens and separate `binding_*` tokens
   - `report=` still points at the JSON artifact, not HTML
3. Edge check.
   **Expected:** Re-running the same command into a fresh temp directory produces the same binding counts and the same canonical operation keys, proving deterministic no-false-green output.
