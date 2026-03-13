import { describe, expect, it } from "vitest";
import { serializeOperationKey } from "../model/operationKey.js";
import { loadAsyncApiOperations, loadAsyncApiSemanticsBundle } from "./asyncapi.js";

describe("asyncapi contract", () => {
  it("serializes kafka identities without leaking message-contract metadata into the operation key", () => {
    expect(
      serializeOperationKey({
        kind: "kafka",
        action: "send",
        channel: "users.signedup"
      })
    ).toBe("kafka send users.signedup");
  });

  it("surfaces structured async diagnostics when a kafka-scoped contract is semantically invalid", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/invalid.yaml");

    expect(bundle.operations).toEqual([]);
    expect(bundle.hasInvalid).toBe(true);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "invalid",
        message: "AsyncAPI v3 operation channel must resolve to a non-empty address",
        async: {
          runtime: "kafka",
          asyncapiVersion: "3.0.0",
          protocol: "kafka",
          action: "send"
        }
      }
    ]);
  });

  it("surfaces structured async diagnostics when a document falls outside the kafka-only scope boundary", async () => {
    const bundle = await loadAsyncApiSemanticsBundle("test/fixtures/asyncapi/unsupported-rabbitmq.yaml");

    expect(bundle.operations).toEqual([]);
    expect(bundle.hasInvalid).toBe(true);
    expect(bundle.diagnostics).toEqual([
      {
        kind: "invalid",
        message: "Unsupported AsyncAPI protocol: amqp. Only kafka is supported.",
        async: {
          runtime: "kafka",
          asyncapiVersion: "3.0.0",
          protocol: "amqp"
        }
      }
    ]);
  });

  it("rejects unsupported AsyncAPI version documents before kafka normalization starts", async () => {
    await expectParserBoundaryToReject(
      "test/fixtures/asyncapi/unsupported-version.yaml",
      /Version "4\.0\.0" is not supported/i
    );
  });

  it("rejects unresolved AsyncAPI message references instead of producing partial kafka operations", async () => {
    await expectParserBoundaryToReject(
      "test/fixtures/asyncapi/unresolved-message-ref.yaml",
      /MissingMessage.*does not exist|does not exist.*MissingMessage/i
    );
  });

  it("rejects malformed AsyncAPI channel references instead of normalizing them as kafka operations", async () => {
    await expectParserBoundaryToReject(
      "test/fixtures/asyncapi/malformed-channel-ref.yaml",
      /must always reference a channel/i
    );
  });

  it("expects malformed kafka contracts to fail closed instead of silently disappearing", async () => {
    await expect(loadAsyncApiOperations("test/fixtures/asyncapi/invalid.yaml")).rejects.toThrow(
      /invalid|semantic|channel|kafka/i
    );
  });

  it("expects non-kafka async protocols to be rejected at the current scope boundary", async () => {
    await expect(loadAsyncApiOperations("test/fixtures/asyncapi/unsupported-rabbitmq.yaml")).rejects.toThrow(
      /unsupported|kafka|rabbitmq|amqp/i
    );
  });
});

async function expectParserBoundaryToReject(specPath: string, pattern: RegExp): Promise<void> {
  await expect(loadAsyncApiSemanticsBundle(specPath)).rejects.toThrow(pattern);
  await expect(loadAsyncApiOperations(specPath)).rejects.toThrow(pattern);
}
