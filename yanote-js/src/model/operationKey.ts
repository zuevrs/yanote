import type { JsonValue } from "./asyncEvent.js";

export type AsyncAction = "send" | "receive";

export type HttpOperationKey = {
  kind: "http";
  method: string;
  route: string;
};

export type AsyncProtocol = "kafka" | "amqp";

export type KafkaOperationKey = {
  kind: "kafka";
  action: AsyncAction;
  channel: string;
};

export type AmqpOperationKey = {
  kind: "amqp";
  action: AsyncAction;
  channel: string;
};

export type AsyncOperationKey = KafkaOperationKey | AmqpOperationKey;

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

export type KafkaDeclaredCorrelationId = {
  location: string;
};

export type KafkaDeclaredReply = {
  address: {
    location: string;
  };
  channel?: {
    address: string;
  };
};

export type KafkaBindingSupportScope = "channel" | "operation" | "message";

export type KafkaBindingSupportField =
  | "topic"
  | "partitions"
  | "replicas"
  | "topicConfiguration"
  | "groupId"
  | "clientId"
  | "key"
  | "schemaIdLocation"
  | "schemaIdPayloadEncoding"
  | "schemaLookupStrategy";

export type KafkaBindingSupportStatus = "supported" | "declared-only" | "deferred" | "invalid";

export type KafkaBindingSupport = {
  scope: KafkaBindingSupportScope;
  field: KafkaBindingSupportField;
  status: KafkaBindingSupportStatus;
  source: string;
  messageName?: string;
  value?: string;
  reason?: string;
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
  declaredCorrelationId?: KafkaDeclaredCorrelationId;
};

export type AsyncOperationContract = {
  operation: AsyncOperationKey;
  message?: KafkaMessageContract;
  messages?: KafkaMessageContract[];
  messageSelection?: {
    mode: "single" | "runtime";
    precedence: KafkaMessageSelectionRule[];
  };
  bindingSupport?: KafkaBindingSupport[];
  declaredReply?: KafkaDeclaredReply;
};

export type KafkaOperationContract = AsyncOperationContract;

export type OperationKey =
  | HttpOperationKey
  | AsyncOperationKey
  | {
      kind: string;
      [k: string]: unknown;
    };

export function serializeOperationKey(key: OperationKey): string {
  if (key.kind === "http") {
    return `http ${key.method} ${key.route}`;
  }

  const asyncOperation = normalizeAsyncOperationKey(key);
  if (asyncOperation) {
    return `${asyncOperation.kind} ${asyncOperation.action} ${asyncOperation.channel}`;
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

function normalizeAsyncOperationKey(key: OperationKey): AsyncOperationKey | null {
  const action = key.action;
  const channel = key.channel;

  if (isAsyncProtocol(key.kind) && isAsyncAction(action) && typeof channel === "string") {
    return {
      kind: key.kind,
      action,
      channel
    };
  }

  if (key.kind === "asyncapi" && isAsyncAction(action) && typeof channel === "string") {
    const protocol = normalizeAsyncProtocol(key.protocol) ?? "kafka";
    return {
      kind: protocol,
      action,
      channel
    };
  }

  return null;
}

function isAsyncProtocol(value: unknown): value is AsyncProtocol {
  return value === "kafka" || value === "amqp";
}

function normalizeAsyncProtocol(value: unknown): AsyncProtocol | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return isAsyncProtocol(normalized) ? normalized : null;
}

function isAsyncAction(value: unknown): value is AsyncAction {
  return value === "send" || value === "receive";
}
