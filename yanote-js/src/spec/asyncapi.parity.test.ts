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

describe("asyncapi parity contract", () => {
  it("keeps message-contract metadata beside the kafka identity instead of inside the serialized key", () => {
    expect(expectedContracts.map((contract) => serializeOperationKey(contract.operation))).toEqual([
      "kafka send users.signedup",
      "kafka receive users.deleted"
    ]);
    expect(expectedContracts.map((contract) => contract.message?.name)).toEqual(["UserSignedUp", "UserDeleted"]);
  });

  it("expects equivalent AsyncAPI v2 and v3 fixtures to normalize into the same kafka operation contracts", async () => {
    const v2 = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v2.yaml");
    const v3 = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/v3.yaml");

    expect(v2.hasInvalid).toBe(false);
    expect(v3.hasInvalid).toBe(false);
    expect(v2.diagnostics).toEqual([]);
    expect(v3.diagnostics).toEqual([]);
    expect(v2.operations).toEqual(expectedContracts.map((contract) => contract.operation));
    expect(v3.operations).toEqual(expectedContracts.map((contract) => contract.operation));
    expect(contractsInOrder(v2)).toEqual(expectedContracts);
    expect(contractsInOrder(v3)).toEqual(expectedContracts);
  });
});

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
