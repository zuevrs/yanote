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

export type KafkaHeaderValidationCapability = "none" | "supported" | "unverifiable";

export type KafkaMessageSelectionHint =
  | {
      kind: "message";
      value: string;
    }
  | {
      kind: "header";
      header: string;
      value: string;
    };

export type KafkaMessageSelectionRule =
  | {
      kind: "message";
    }
  | {
      kind: "header";
      header: string;
    };

export type KafkaMessageContract = {
  name: string;
  payloadSchema?: JsonValue;
  payloadSchemaId?: string;
  contentType?: string;
  schemaFormat?: string;
  headersSchema?: JsonValue;
  headersSchemaId?: string;
  headerValidationCapability: KafkaHeaderValidationCapability;
  selectionHints?: KafkaMessageSelectionHint[];
};

export type KafkaOperationContract = {
  operation: KafkaOperationKey;
  message?: KafkaMessageContract;
  messages?: KafkaMessageContract[];
  messageSelection?: {
    mode: "single" | "runtime";
    precedence: KafkaMessageSelectionRule[];
  };
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

export function formatKafkaMessageIdentity(message: KafkaMessageContract): string {
  const discriminators = (message.selectionHints ?? [])
    .filter((hint): hint is Extract<KafkaMessageSelectionHint, { kind: "header" }> => hint.kind === "header")
    .map((hint) => `${hint.header}=${hint.value}`)
    .sort((left, right) => left.localeCompare(right));

  const details = [
    discriminators.length > 0 ? `selectors: ${discriminators.join(", ")}` : null,
    message.payloadSchemaId ? `payload: ${message.payloadSchemaId}` : null,
    message.headersSchemaId ? `headers: ${message.headersSchemaId}` : null
  ].filter((detail): detail is string => detail !== null);

  if (details.length === 0) {
    return message.name;
  }

  return `${message.name} [${details.join("; ")}]`;
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
