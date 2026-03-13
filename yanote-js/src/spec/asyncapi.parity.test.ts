import { describe, expect, it } from "vitest";
import { serializeOperationKey, type KafkaOperationContract } from "../model/operationKey.js";
import { loadAsyncApiSemanticsBundle } from "./asyncapi.js";

const expectedContracts = [
  {
    operation: {
      kind: "kafka",
      action: "send",
      channel: "users.signedup"
    },
    message: {
      name: "UserSignedUp"
    }
  },
  {
    operation: {
      kind: "kafka",
      action: "receive",
      channel: "users.deleted"
    },
    message: {
      name: "UserDeleted"
    }
  }
] satisfies KafkaOperationContract[];

const expectedKeys = expectedContracts.map((contract) => serializeOperationKey(contract.operation));

describe("asyncapi parity contract", () => {
  it("keeps message-contract metadata beside the kafka identity instead of inside the serialized key", () => {
    expect(expectedKeys).toEqual(["kafka send users.signedup", "kafka receive users.deleted"]);
    expect(expectedContracts.map((contract) => contract.message?.name)).toEqual(["UserSignedUp", "UserDeleted"]);
  });

  it("expects equivalent AsyncAPI v2 and v3 fixtures to normalize into the same kafka operation contracts", async () => {
    const v2 = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v2.yaml");
    const v3 = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");

    expect(v2.hasInvalid).toBe(false);
    expect(v3.hasInvalid).toBe(false);
    expect(v2.diagnostics).toEqual([]);
    expect(v3.diagnostics).toEqual([]);

    expect(serializedOperationKeys(v2)).toEqual(expectedKeys);
    expect(serializedOperationKeys(v3)).toEqual(expectedKeys);
    expect(serializedOperationKeys(v2)).toEqual(serializedOperationKeys(v3));

    expect(contractKeysInOrder(v2)).toEqual(expectedKeys);
    expect(contractKeysInOrder(v3)).toEqual(expectedKeys);

    expect(contractsInOrder(v2)).toEqual(expectedContracts);
    expect(contractsInOrder(v3)).toEqual(expectedContracts);
  });
});

function serializedOperationKeys(bundle: Awaited<ReturnType<typeof loadAsyncApiSemanticsBundle>>): string[] {
  return bundle.operations.map((operation) => serializeOperationKey(operation));
}

function contractKeysInOrder(bundle: Awaited<ReturnType<typeof loadAsyncApiSemanticsBundle>>): string[] {
  return Array.from(bundle.operationContractsByKey.keys());
}

function contractsInOrder(bundle: Awaited<ReturnType<typeof loadAsyncApiSemanticsBundle>>): KafkaOperationContract[] {
  return bundle.operations.map((operation) => {
    const key = serializeOperationKey(operation);
    const contract = bundle.operationContractsByKey.get(key);
    if (!contract) {
      throw new Error(`Missing kafka contract for ${key}`);
    }

    return contract;
  });
}
