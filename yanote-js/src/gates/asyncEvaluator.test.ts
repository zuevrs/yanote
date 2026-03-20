import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import type { KafkaMessageContract } from "../model/operationKey.js";
import { loadAsyncApiSemanticsBundle, type AsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncCoverage } from "../coverage/asyncCoverage.js";
import { sortFailuresByPrecedence } from "./failureOrder.js";
import { resolveGatePolicy } from "./policy.js";
import {
  evaluateAsyncGateFailures,
  evaluateAsyncRegressionGate,
  evaluateAsyncThresholdGate,
  type AsyncRegressionComparison
} from "./asyncEvaluator.js";

const SCHEMA_DEPTH_OPERATION_KEY = "kafka send orders.created";

async function loadCoverage(fixture: string, specPath = "test/fixtures/asyncapi/v3.yaml") {
  const bundle = await loadAsyncApiSemanticsBundle(specPath);
  const events = await readAsyncEventsJsonl(fixture);
  return computeAsyncCoverage(bundle, events.items);
}

describe("async gate evaluator contract", () => {
  it("fails closed on mismatched and unmatched async drift even when operation threshold is satisfied", async () => {
    const coverage = await loadCoverage("test/fixtures/async-events/drift.fixture.jsonl");
    const policy = await resolveGatePolicy({
      defaultProfile: "ci",
      cliOverrides: {
        minCoverage: 90
      }
    });

    const ordered = sortFailuresByPrecedence(
      evaluateAsyncGateFailures({
        coverage,
        policy
      })
    );

    expect(ordered.map((failure) => failure.code)).toEqual([
      "ASYNC_SEMANTIC_MESSAGE_MISMATCH",
      "ASYNC_SEMANTIC_UNMATCHED_EVIDENCE"
    ]);
    expect(ordered.every((failure) => failure.failureClass === "semantic" && failure.severity === "error")).toBe(true);
  });

  it("uses raw operation coverage decimals for threshold comparison and hard-fails critical async operations", async () => {
    const coverage = await loadCoverage("test/fixtures/async-events/partial.fixture.jsonl");
    const policy = await resolveGatePolicy({
      profile: "local",
      cliOverrides: {
        minCoverage: 50.001,
        criticalOperations: ["kafka receive users.deleted"]
      }
    });

    const failures = evaluateAsyncThresholdGate({ coverage, policy });

    expect(failures.map((failure) => failure.code)).toEqual(
      expect.arrayContaining(["ASYNC_GATE_MIN_COVERAGE", "ASYNC_GATE_CRITICAL_OPERATION_COVERAGE_LOSS"])
    );
    const critical = failures.find((failure) => failure.code === "ASYNC_GATE_CRITICAL_OPERATION_COVERAGE_LOSS");
    expect(critical?.severity).toBe("error");
  });

  it("maps public payload and header diagnostics to typed semantic failures with deterministic ordering", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml");
    const [invalidEvents, missingEvents] = await Promise.all([
      readAsyncEventsJsonl("test/fixtures/async-events/schema-invalid.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-missing-payload.fixture.jsonl")
    ]);
    const coverage = computeAsyncCoverage(bundle, [...invalidEvents.items, ...missingEvents.items]);
    const policy = await resolveGatePolicy({
      profile: "local",
      cliOverrides: {
        minCoverage: 100
      }
    });

    const ordered = sortFailuresByPrecedence(evaluateAsyncGateFailures({ coverage, policy }));

    expect(ordered.map((failure) => failure.code)).toEqual([
      "ASYNC_SEMANTIC_MISSING_PAYLOAD",
      "ASYNC_SEMANTIC_INVALID_PAYLOAD",
      "ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS"
    ]);
    expect(ordered.map((failure) => failure.operationKey)).toEqual([
      SCHEMA_DEPTH_OPERATION_KEY,
      SCHEMA_DEPTH_OPERATION_KEY,
      SCHEMA_DEPTH_OPERATION_KEY
    ]);
    expect(ordered[0]?.reason).toContain("schema OrderCreatedPayload at /");
    expect(ordered[1]?.reason).toContain("schema OrderCreatedPayload at /order/total");
    expect(ordered[2]?.reason).toContain("header schema OrderEventHeaders");
  });

  it("fails unsupported content-type contracts before header capability gaps", async () => {
    const bundle = withMessageOverride(
      await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      (message) => ({
        ...message,
        contentType: "application/xml"
      })
    );
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-unsupported-format.fixture.jsonl");
    const coverage = computeAsyncCoverage(bundle, events.items);
    const policy = await resolveGatePolicy({
      profile: "local"
    });

    const ordered = sortFailuresByPrecedence(evaluateAsyncGateFailures({ coverage, policy }));

    expect(ordered.map((failure) => failure.code)).toEqual([
      "ASYNC_SEMANTIC_UNSUPPORTED_CONTENT_TYPE",
      "ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS"
    ]);
    expect(ordered[0]?.reason).toContain("Unsupported AsyncAPI payload content type: application/xml.");
  });

  it("fails unsupported schema-format contracts before header capability gaps", async () => {
    const bundle = withMessageOverride(
      await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      (message) => ({
        ...message,
        schemaFormat: "application/vnd.apache.avro;version=1.11.0"
      })
    );
    const events = await readAsyncEventsJsonl("test/fixtures/async-events/schema-unsupported-format.fixture.jsonl");
    const coverage = computeAsyncCoverage(bundle, events.items);
    const policy = await resolveGatePolicy({
      profile: "local"
    });

    const ordered = sortFailuresByPrecedence(evaluateAsyncGateFailures({ coverage, policy }));

    expect(ordered.map((failure) => failure.code)).toEqual([
      "ASYNC_SEMANTIC_UNSUPPORTED_SCHEMA_FORMAT",
      "ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS"
    ]);
    expect(ordered[0]?.reason).toContain(
      "Unsupported AsyncAPI payload schema format: application/vnd.apache.avro;version=1.11.0."
    );
  });

  it("keeps regression failures deterministic and ordered ahead of threshold warnings", async () => {
    const coverage = await loadCoverage("test/fixtures/async-events/partial.fixture.jsonl");
    const comparison: AsyncRegressionComparison = {
      missingCoveredOperations: ["kafka receive users.deleted"],
      removedSpecOperations: ["kafka send users.removed"],
      dimensionRegressions: [
        { dimension: "channels", baseline: 100, current: 50 },
        { dimension: "messages", baseline: 100, current: 50 },
        { dimension: "operations", baseline: 100, current: 50 }
      ]
    };
    const policy = await resolveGatePolicy({
      defaultProfile: "ci",
      cliOverrides: {
        minCoverage: 80
      }
    });

    const regression = evaluateAsyncRegressionGate({ comparison, policy });
    expect(regression.map((failure) => failure.code)).toEqual([
      "ASYNC_GATE_REGRESSION_COVERAGE_LOSS",
      "ASYNC_GATE_REGRESSION_DIMENSION",
      "ASYNC_GATE_REGRESSION_DIMENSION",
      "ASYNC_GATE_REGRESSION_DIMENSION"
    ]);

    const ordered = sortFailuresByPrecedence(
      evaluateAsyncGateFailures({
        coverage,
        policy,
        comparison
      })
    );
    expect(ordered.map((failure) => failure.code)).toEqual([
      "ASYNC_GATE_REGRESSION_COVERAGE_LOSS",
      "ASYNC_GATE_MIN_COVERAGE",
      "ASYNC_GATE_REGRESSION_DIMENSION",
      "ASYNC_GATE_REGRESSION_DIMENSION",
      "ASYNC_GATE_REGRESSION_DIMENSION"
    ]);
  });
});

function withMessageOverride(
  bundle: AsyncApiSemanticsBundle,
  transform: (message: KafkaMessageContract) => KafkaMessageContract
): AsyncApiSemanticsBundle {
  const contract = bundle.operationContractsByKey.get(SCHEMA_DEPTH_OPERATION_KEY);
  if (!contract?.message) {
    throw new Error(`Expected kafka contract ${SCHEMA_DEPTH_OPERATION_KEY} to expose a message contract.`);
  }

  const nextContracts = new Map(bundle.operationContractsByKey);
  nextContracts.set(SCHEMA_DEPTH_OPERATION_KEY, {
    ...contract,
    message: transform({
      ...contract.message,
      ...(contract.message.payloadSchema !== undefined
        ? { payloadSchema: structuredClone(contract.message.payloadSchema) }
        : {})
    })
  });

  return {
    ...bundle,
    operationContractsByKey: nextContracts
  };
}
