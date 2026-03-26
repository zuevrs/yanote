import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import type { KafkaMessageContract } from "../model/operationKey.js";
import { loadAsyncApiSemanticsBundle, type AsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncCoverage, type AsyncCoverageResult } from "../coverage/asyncCoverage.js";
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

  it("maps runtime semantic diagnostics to typed failures and short-circuits regression and threshold logic", async () => {
    const coverage = await loadCoverage(
      "test/fixtures/async-events/header-runtime-failures.fixture.jsonl",
      "test/fixtures/asyncapi/header-runtime-inline-v3.yaml"
    );
    const comparison: AsyncRegressionComparison = {
      missingCoveredOperations: ["kafka send orders.command"],
      removedSpecOperations: [],
      dimensionRegressions: [{ dimension: "operations", baseline: 100, current: 0 }]
    };
    const policy = await resolveGatePolicy({
      profile: "local",
      cliOverrides: {
        minCoverage: 100
      }
    });

    const ordered = sortFailuresByPrecedence(
      evaluateAsyncGateFailures({
        coverage,
        policy,
        comparison
      })
    );

    expect(ordered.map((failure) => failure.code)).toEqual([
      "ASYNC_SEMANTIC_CORRELATION_ID_MISSING",
      "ASYNC_SEMANTIC_CORRELATION_ID_UNAVAILABLE",
      "ASYNC_SEMANTIC_REPLY_ADDRESS_MISSING",
      "ASYNC_SEMANTIC_REPLY_ADDRESS_UNAVAILABLE",
      "ASYNC_SEMANTIC_REPLY_ADDRESS_MISMATCH"
    ]);
    expect(ordered.every((failure) => failure.failureClass === "semantic" && failure.severity === "error")).toBe(true);
    expect(ordered[0]?.reason).toContain("Async evidence kafka send orders.command could not prove declared correlationId");
    expect(ordered[0]?.reason).toContain("$message.header#/correlation_id");
    expect(ordered[0]?.reason).not.toContain("corr-runtime-mismatch");
    expect(ordered[4]?.reason).toContain("expected=orders.reply");
    expect(ordered[4]?.reason).not.toContain("orders.deadletter");
  });

  it("maps unsupported runtime declarations to typed async semantic failures", async () => {
    const coverage = await loadCoverage(
      "test/fixtures/async-events/header-runtime-covered.fixture.jsonl",
      "test/fixtures/asyncapi/header-runtime-unsupported-v3.yaml"
    );
    const policy = await resolveGatePolicy({
      profile: "local",
      cliOverrides: {
        minCoverage: 100
      }
    });

    const ordered = sortFailuresByPrecedence(evaluateAsyncGateFailures({ coverage, policy }));

    expect(ordered.map((failure) => failure.code)).toEqual([
      "ASYNC_SEMANTIC_CORRELATION_ID_UNSUPPORTED",
      "ASYNC_SEMANTIC_REPLY_ADDRESS_UNSUPPORTED"
    ]);
    expect(ordered[0]?.reason).toContain("$message.payload#/meta/correlation_id");
    expect(ordered[1]?.reason).toContain("$message.payload#/meta/reply_to");
  });

  it("fails closed when a runtime semantic diagnostic is malformed instead of dropping it", async () => {
    const coverage = await loadCoverage(
      "test/fixtures/async-events/header-runtime-covered.fixture.jsonl",
      "test/fixtures/asyncapi/header-runtime-inline-v3.yaml"
    );
    const malformedCoverage: AsyncCoverageResult = {
      ...coverage,
      runtimeSemantics: {
        ...coverage.runtimeSemantics,
        diagnostics: [
          {
            semantic: "correlationId",
            state: "mystery",
            location: "$message.header#/correlation_id",
            reason: "Unexpected runtime state."
          } as unknown as AsyncCoverageResult["runtimeSemantics"]["diagnostics"][number]
        ]
      }
    };
    const policy = await resolveGatePolicy({
      profile: "local",
      cliOverrides: {
        minCoverage: 100
      }
    });

    const ordered = sortFailuresByPrecedence(evaluateAsyncGateFailures({ coverage: malformedCoverage, policy }));

    expect(ordered.map((failure) => failure.code)).toEqual(["ASYNC_SEMANTIC_RUNTIME_FAIL_CLOSED"]);
    expect(ordered[0]?.reason).toContain("could not be mapped safely");
    expect(ordered[0]?.reason).toContain("correlationId");
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
      "ASYNC_SEMANTIC_INVALID_PAYLOAD"
    ]);
    expect(ordered.map((failure) => failure.operationKey)).toEqual([SCHEMA_DEPTH_OPERATION_KEY, SCHEMA_DEPTH_OPERATION_KEY]);
    expect(ordered[0]?.reason).toContain("schema OrderCreatedPayload at /");
    expect(ordered[1]?.reason).toContain("schema OrderCreatedPayload at /order/total");
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

    expect(ordered.map((failure) => failure.code)).toEqual(["ASYNC_SEMANTIC_UNSUPPORTED_CONTENT_TYPE"]);
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

    expect(ordered.map((failure) => failure.code)).toEqual(["ASYNC_SEMANTIC_UNSUPPORTED_SCHEMA_FORMAT"]);
    expect(ordered[0]?.reason).toContain(
      "Unsupported AsyncAPI payload schema format: application/vnd.apache.avro;version=1.11.0."
    );
  });

  it("fails closed on runtime-ambiguous multi-message evidence before threshold logic", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/multi-message-resolvable.yaml");
    const coverage = computeAsyncCoverage(bundle, [
      {
        kind: "kafka",
        action: "send",
        channel: "users.lifecycle",
        message: "UserLifecycleEvent",
        payload: { userId: "user-2" },
        testRunId: "run-2",
        testSuite: "suite-runtime-ambiguous"
      }
    ]);
    const policy = await resolveGatePolicy({
      profile: "local",
      cliOverrides: {
        minCoverage: 100
      }
    });

    const ordered = sortFailuresByPrecedence(evaluateAsyncGateFailures({ coverage, policy }));

    expect(ordered.map((failure) => failure.code)).toEqual(["ASYNC_SEMANTIC_AMBIGUOUS_MESSAGE"]);
    expect(ordered[0]).toMatchObject({
      failureClass: "semantic",
      severity: "error",
      operationKey: "kafka send users.lifecycle"
    });
    expect(ordered[0]?.reason).toContain("could not deterministically select one declared message contract");
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
