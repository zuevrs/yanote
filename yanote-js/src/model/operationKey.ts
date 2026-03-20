import type { JsonValue } from "./asyncEvent.js";

export type AsyncAction = "send" | "receive";

export type HttpOperationKey = {
  kind: "http";
  method: string;
  route: string;
};

export type KafkaOperationKey = {
  kind: "kafka";
  action: AsyncAction;
  channel: string;
};

export type KafkaMessageContract = {
  name: string;
  payloadSchema?: JsonValue;
  contentType?: string;
  schemaFormat?: string;
};

export type KafkaOperationContract = {
  operation: KafkaOperationKey;
  message?: KafkaMessageContract;
};

export type OperationKey =
  | HttpOperationKey
  | KafkaOperationKey
  | {
      kind: string;
      [k: string]: unknown;
    };

export function serializeOperationKey(key: OperationKey): string {
  if (key.kind === "http") {
    return `http ${key.method} ${key.route}`;
  }

  const kafka = normalizeKafkaOperationKey(key);
  if (kafka) {
    return `kafka ${kafka.action} ${kafka.channel}`;
  }

  return JSON.stringify(key);
}

function normalizeKafkaOperationKey(key: OperationKey): KafkaOperationKey | null {
  const action = key.action;
  const channel = key.channel;

  if ((key.kind === "kafka" || key.kind === "asyncapi") && isAsyncAction(action) && typeof channel === "string") {
    return {
      kind: "kafka",
      action,
      channel
    };
  }

  return null;
}

function isAsyncAction(value: unknown): value is AsyncAction {
  return value === "send" || value === "receive";
}
