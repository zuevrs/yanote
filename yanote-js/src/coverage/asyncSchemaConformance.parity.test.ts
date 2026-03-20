import { describe, expect, it } from "vitest";
import { readAsyncEventsJsonl } from "../events/readAsyncEventsJsonl.js";
import type { KafkaMessageContract } from "../model/operationKey.js";
import { loadAsyncApiSemanticsBundle, type AsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { computeAsyncSchemaConformance } from "./asyncSchemaConformance.js";

const OPERATION_KEY = "kafka send orders.created";

describe("asyncSchemaConformance parity", () => {
  it("keeps equivalent AsyncAPI v2 and v3 schema-conformance diagnostics identical", async () => {
    const [v2, v3, valid, invalid, missing] = await Promise.all([
      loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v2.yaml"),
      loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-valid.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-invalid.fixture.jsonl"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-missing-payload.fixture.jsonl")
    ]);

    expect(snapshot(computeAsyncSchemaConformance(withoutHeaderValidation(v2), valid.items))).toEqual(
      snapshot(computeAsyncSchemaConformance(withoutHeaderValidation(v3), valid.items))
    );
    expect(snapshot(computeAsyncSchemaConformance(withoutHeaderValidation(v2), invalid.items))).toEqual(
      snapshot(computeAsyncSchemaConformance(withoutHeaderValidation(v3), invalid.items))
    );
    expect(snapshot(computeAsyncSchemaConformance(withoutHeaderValidation(v2), missing.items))).toEqual(
      snapshot(computeAsyncSchemaConformance(withoutHeaderValidation(v3), missing.items))
    );
    expect(snapshot(computeAsyncSchemaConformance(v2, [...valid.items, ...invalid.items, ...missing.items]))).toEqual(
      snapshot(computeAsyncSchemaConformance(v3, [...valid.items, ...invalid.items, ...missing.items]))
    );
  });

  it("keeps unsupported payload-format diagnostics identical across equivalent v2 and v3 contracts", async () => {
    const [v2, v3, events] = await Promise.all([
      loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v2.yaml"),
      loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/schema-depth-v3.yaml"),
      readAsyncEventsJsonl("test/fixtures/async-events/schema-unsupported-format.fixture.jsonl")
    ]);

    expect(
      snapshot(
        computeAsyncSchemaConformance(
          withMessageOverride(v2, (message) => ({
            ...message,
            schemaFormat: "application/vnd.apache.avro;version=1.11.0"
          })),
          events.items
        )
      )
    ).toEqual(
      snapshot(
        computeAsyncSchemaConformance(
          withMessageOverride(v3, (message) => ({
            ...message,
            schemaFormat: "application/vnd.apache.avro;version=1.11.0"
          })),
          events.items
        )
      )
    );
  });
});

function snapshot(result: ReturnType<typeof computeAsyncSchemaConformance>) {
  return {
    matchedOperationKeys: result.matchedOperationKeys,
    validatedOperationKeys: result.validatedOperationKeys,
    diagnostics: result.diagnostics
  };
}

function withoutHeaderValidation(bundle: AsyncApiSemanticsBundle): AsyncApiSemanticsBundle {
  return withMessageOverride(bundle, (message) => ({
    ...message,
    headersSchemaId: undefined,
    headerValidationCapability: "none"
  }));
}

function withMessageOverride(
  bundle: AsyncApiSemanticsBundle,
  transform: (message: KafkaMessageContract) => KafkaMessageContract
): AsyncApiSemanticsBundle {
  const contract = bundle.operationContractsByKey.get(OPERATION_KEY);
  if (!contract?.message) {
    throw new Error(`Expected kafka contract ${OPERATION_KEY} to expose a message contract.`);
  }

  const nextContracts = new Map(bundle.operationContractsByKey);
  nextContracts.set(OPERATION_KEY, {
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
