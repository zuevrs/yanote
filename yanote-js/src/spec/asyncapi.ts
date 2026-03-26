import { Parser, fromFile } from "@asyncapi/parser";
import {
  serializeOperationKey,
  type AsyncAction,
  type KafkaMessageContract,
  type KafkaMessageSelectionHint,
  type KafkaMessageSelectionRule,
  type KafkaOperationContract,
  type OperationKey
} from "../model/operationKey.js";
import { normalizeJsonValue } from "../model/asyncEvent.js";
import type { SemanticDiagnostic, SemanticDiagnosticsBundle } from "./diagnostics.js";
import type { ResolvedSpecSource } from "./specSource.js";

const KAFKA_RUNTIME = "kafka";

export type AsyncApiSemanticsBundle = SemanticDiagnosticsBundle & {
  operations: OperationKey[];
  operationContractsByKey: Map<string, KafkaOperationContract>;
};

type ResolvedKafkaMessageContracts = Pick<KafkaOperationContract, "message" | "messages" | "messageSelection">;
type AsyncApiSpecInput = string | Pick<ResolvedSpecSource, "materializedPath">;

export async function loadAsyncApiSemanticsBundle(specInput: AsyncApiSpecInput): Promise<AsyncApiSemanticsBundle> {
  const parser = new Parser();
  const { document, diagnostics } = await fromFile(parser, toAsyncApiSpecPath(specInput)).parse();

  if (!document) {
    throw new Error(formatParserDiagnostics(diagnostics));
  }

  return buildAsyncApiSemantics(document.json());
}

export async function loadAsyncApiOperations(specInput: AsyncApiSpecInput): Promise<OperationKey[]> {
  const bundle = await loadAsyncApiSemanticsBundle(specInput);

  if (hasBlockingAsyncDiagnostics(bundle.diagnostics)) {
    throw new Error(formatSemanticDiagnostics(bundle.diagnostics.filter(isBlockingAsyncDiagnostic)));
  }

  return bundle.operations;
}

function buildAsyncApiSemantics(spec: unknown): AsyncApiSemanticsBundle {
  const operations: OperationKey[] = [];
  const operationContractsByKey = new Map<string, KafkaOperationContract>();
  const diagnostics: SemanticDiagnostic[] = [];
  const seen = new Set<string>();

  if (!isRecord(spec)) {
    diagnostics.push({
      kind: "invalid",
      message: "AsyncAPI document is not an object",
      async: {
        runtime: KAFKA_RUNTIME
      }
    });
    return toBundle(operations, operationContractsByKey, diagnostics);
  }

  const version = normalizeNonEmptyString(spec.asyncapi);
  if (!version) {
    diagnostics.push({
      kind: "invalid",
      message: "AsyncAPI document is missing a valid asyncapi version",
      async: {
        runtime: KAFKA_RUNTIME
      }
    });
    return toBundle(operations, operationContractsByKey, diagnostics);
  }

  const protocol = resolveSupportedProtocol(spec.servers, version, diagnostics);
  if (!protocol) {
    return toBundle(operations, operationContractsByKey, diagnostics);
  }

  if (version.startsWith("2")) {
    extractV2(spec, version, protocol, seen, operations, operationContractsByKey, diagnostics);
    return toBundle(operations, operationContractsByKey, diagnostics);
  }

  if (version.startsWith("3")) {
    extractV3(spec, version, protocol, seen, operations, operationContractsByKey, diagnostics);
    return toBundle(operations, operationContractsByKey, diagnostics);
  }

  diagnostics.push({
    kind: "invalid",
    message: `Unsupported AsyncAPI version: ${version}. Only v2 and v3 are supported.`,
    async: {
      runtime: KAFKA_RUNTIME,
      asyncapiVersion: version,
      protocol
    }
  });

  return toBundle(operations, operationContractsByKey, diagnostics);
}

function extractV2(
  doc: Record<string, unknown>,
  version: string,
  protocol: string,
  seen: Set<string>,
  operations: OperationKey[],
  operationContractsByKey: Map<string, KafkaOperationContract>,
  diagnostics: SemanticDiagnostic[]
): void {
  const channels = doc.channels;
  if (!isRecord(channels)) {
    diagnostics.push({
      kind: "invalid",
      message: "AsyncAPI v2 document is missing a valid channels object",
      async: buildAsyncContext(version, protocol)
    });
    return;
  }

  for (const [rawChannelName, channelValue] of Object.entries(channels)) {
    const channel = rawChannelName.trim();
    if (channel.length === 0) {
      diagnostics.push({
        kind: "invalid",
        message: "AsyncAPI v2 channel name must be non-empty",
        async: buildAsyncContext(version, protocol)
      });
      continue;
    }

    if (!isRecord(channelValue)) {
      diagnostics.push({
        kind: "invalid",
        message: "AsyncAPI v2 channel must be an object",
        async: buildAsyncContext(version, protocol, { channel })
      });
      continue;
    }

    appendV2Operation(channelValue.publish, "send", channel, version, protocol, seen, operations, operationContractsByKey, diagnostics);
    appendV2Operation(
      channelValue.subscribe,
      "receive",
      channel,
      version,
      protocol,
      seen,
      operations,
      operationContractsByKey,
      diagnostics
    );
  }
}

function appendV2Operation(
  operationValue: unknown,
  action: AsyncAction,
  channel: string,
  version: string,
  protocol: string,
  seen: Set<string>,
  operations: OperationKey[],
  operationContractsByKey: Map<string, KafkaOperationContract>,
  diagnostics: SemanticDiagnostic[]
): void {
  if (operationValue === undefined) {
    return;
  }

  if (!isRecord(operationValue)) {
    diagnostics.push({
      kind: "invalid",
      message: `AsyncAPI v2 ${action} operation must be an object`,
      async: buildAsyncContext(version, protocol, { action, channel })
    });
    return;
  }

  const messageContract = extractV2MessageContract(operationValue.message, version, protocol, action, channel, diagnostics);
  if (messageContract === null) {
    return;
  }

  appendKafkaContract({ operation: { kind: KAFKA_RUNTIME, action, channel }, ...messageContract }, seen, operations, operationContractsByKey);
}

function extractV3(
  doc: Record<string, unknown>,
  version: string,
  protocol: string,
  seen: Set<string>,
  operations: OperationKey[],
  operationContractsByKey: Map<string, KafkaOperationContract>,
  diagnostics: SemanticDiagnostic[]
): void {
  const channels = doc.channels;
  const operationsNode = doc.operations;

  if (!isRecord(channels)) {
    diagnostics.push({
      kind: "invalid",
      message: "AsyncAPI v3 document is missing a valid channels object",
      async: buildAsyncContext(version, protocol)
    });
    return;
  }

  if (!isRecord(operationsNode)) {
    diagnostics.push({
      kind: "invalid",
      message: "AsyncAPI v3 document is missing a valid operations object",
      async: buildAsyncContext(version, protocol)
    });
    return;
  }

  for (const [, operationValue] of Object.entries(operationsNode)) {
    if (!isRecord(operationValue)) {
      diagnostics.push({
        kind: "invalid",
        message: "AsyncAPI v3 operation must be an object",
        async: buildAsyncContext(version, protocol)
      });
      continue;
    }

    const action = parseAsyncAction(operationValue.action);
    if (!action) {
      diagnostics.push({
        kind: "invalid",
        message: "AsyncAPI v3 operation action must be 'send' or 'receive'",
        async: buildAsyncContext(version, protocol)
      });
      continue;
    }

    const channel = resolveV3ChannelNameOrAddress(operationValue.channel, channels);
    if (!channel) {
      diagnostics.push({
        kind: "invalid",
        message: "AsyncAPI v3 operation channel must resolve to a non-empty address",
        async: buildAsyncContext(version, protocol, { action })
      });
      continue;
    }

    const messageContract = extractV3MessageContract(operationValue.messages, version, protocol, action, channel, diagnostics);
    if (messageContract === null) {
      continue;
    }

    appendKafkaContract({ operation: { kind: KAFKA_RUNTIME, action, channel }, ...messageContract }, seen, operations, operationContractsByKey);
  }
}

function resolveSupportedProtocol(
  serversValue: unknown,
  version: string,
  diagnostics: SemanticDiagnostic[]
): string | null {
  if (!isRecord(serversValue) || Object.keys(serversValue).length === 0) {
    diagnostics.push({
      kind: "invalid",
      message: "AsyncAPI document must declare at least one server with protocol metadata",
      async: buildAsyncContext(version, undefined)
    });
    return null;
  }

  const protocols = new Set<string>();

  for (const [, serverValue] of Object.entries(serversValue)) {
    if (!isRecord(serverValue)) {
      diagnostics.push({
        kind: "invalid",
        message: "AsyncAPI server must be an object",
        async: buildAsyncContext(version, undefined)
      });
      continue;
    }

    const protocol = normalizeProtocol(serverValue.protocol);
    if (!protocol) {
      diagnostics.push({
        kind: "invalid",
        message: "AsyncAPI server must declare a non-empty protocol",
        async: buildAsyncContext(version, undefined)
      });
      continue;
    }

    protocols.add(protocol);
  }

  const normalizedProtocols = Array.from(protocols).sort();
  if (normalizedProtocols.length === 0) {
    return null;
  }

  if (normalizedProtocols.length !== 1 || normalizedProtocols[0] !== KAFKA_RUNTIME) {
    const protocolList = normalizedProtocols.join(", ");
    diagnostics.push({
      kind: "invalid",
      message: `Unsupported AsyncAPI protocol${normalizedProtocols.length === 1 ? "" : "s"}: ${protocolList}. Only kafka is supported.`,
      async: buildAsyncContext(version, protocolList)
    });
    return null;
  }

  return normalizedProtocols[0];
}

function appendKafkaContract(
  contract: KafkaOperationContract,
  seen: Set<string>,
  operations: OperationKey[],
  operationContractsByKey: Map<string, KafkaOperationContract>
): void {
  const key = serializeOperationKey(contract.operation);
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  operations.push(contract.operation);
  operationContractsByKey.set(key, contract);
}

function extractV2MessageContract(
  messageValue: unknown,
  version: string,
  protocol: string,
  action: AsyncAction,
  channel: string,
  diagnostics: SemanticDiagnostic[]
): ResolvedKafkaMessageContracts | null {
  if (messageValue === undefined) {
    return {};
  }

  const message = buildMessageContract(messageValue);
  if (!message) {
    diagnostics.push({
      kind: "invalid",
      message: "AsyncAPI v2 operation message must resolve to a single named message",
      async: buildAsyncContext(version, protocol, { action, channel })
    });
    return null;
  }

  return {
    message,
    messageSelection: {
      mode: "single",
      precedence: [{ kind: "message" }]
    }
  };
}

function extractV3MessageContract(
  messagesValue: unknown,
  version: string,
  protocol: string,
  action: AsyncAction,
  channel: string,
  diagnostics: SemanticDiagnostic[]
): ResolvedKafkaMessageContracts | null {
  if (messagesValue === undefined) {
    return {};
  }

  if (!Array.isArray(messagesValue)) {
    diagnostics.push({
      kind: "invalid",
      message: "AsyncAPI v3 operation messages must be an array",
      async: buildAsyncContext(version, protocol, { action, channel })
    });
    return null;
  }

  const builtMessages = messagesValue.map((value) => buildMessageContract(value));
  if (builtMessages.some((message) => !message)) {
    diagnostics.push({
      kind: "invalid",
      message: "AsyncAPI v3 operation message must resolve to a single named message",
      async: buildAsyncContext(version, protocol, { action, channel })
    });
    return null;
  }

  const uniqueMessages = dedupeMessageContracts(builtMessages);
  if (uniqueMessages.length === 0) {
    diagnostics.push({
      kind: "invalid",
      message: "AsyncAPI v3 operation message must resolve to a single named message",
      async: buildAsyncContext(version, protocol, { action, channel })
    });
    return null;
  }

  if (uniqueMessages.length === 1) {
    return {
      message: uniqueMessages[0],
      messageSelection: {
        mode: "single",
        precedence: [{ kind: "message" }]
      }
    };
  }

  const messageSelection = buildMultiMessageSelection(uniqueMessages);
  if (!messageSelection) {
    diagnostics.push({
      kind: "ambiguous",
      message:
        "AsyncAPI v3 operation declares multiple messages without a deterministic message-name or retained-header discriminator",
      async: buildAsyncContext(version, protocol, { action, channel }),
      candidates: uniqueMessages.map(formatMessageCandidate)
    });
    return null;
  }

  return {
    messages: sortMessageContracts(uniqueMessages),
    messageSelection: {
      mode: "runtime",
      precedence: messageSelection
    }
  };
}

function buildMultiMessageSelection(messages: KafkaMessageContract[]): KafkaMessageSelectionRule[] | null {
  const precedence: KafkaMessageSelectionRule[] = [{ kind: "message" }];
  const discriminatingHeaders = collectDiscriminatingHeaderRules(messages);

  for (const header of discriminatingHeaders) {
    precedence.push({ kind: "header", header });
  }

  const hasDeterministicRule = isUniqueRule(messages, { kind: "message" }) || discriminatingHeaders.length > 0;
  return hasDeterministicRule ? precedence : null;
}

function collectDiscriminatingHeaderRules(messages: KafkaMessageContract[]): string[] {
  const byHeader = new Map<string, string[]>();

  for (const message of messages) {
    const headerHints = message.selectionHints?.filter(
      (hint): hint is Extract<KafkaMessageSelectionHint, { kind: "header" }> => hint.kind === "header"
    );

    for (const hint of headerHints ?? []) {
      const values = byHeader.get(hint.header) ?? [];
      values.push(hint.value);
      byHeader.set(hint.header, values);
    }
  }

  return Array.from(byHeader.entries())
    .filter(([, values]) => values.length === messages.length && new Set(values).size === messages.length)
    .map(([header]) => header)
    .sort((left, right) => left.localeCompare(right));
}

function isUniqueRule(messages: KafkaMessageContract[], rule: KafkaMessageSelectionRule): boolean {
  if (rule.kind === "message") {
    return new Set(messages.map((message) => message.name)).size === messages.length;
  }

  const values = messages
    .map((message) =>
      message.selectionHints?.find(
        (hint): hint is Extract<KafkaMessageSelectionHint, { kind: "header" }> =>
          hint.kind === "header" && hint.header === rule.header
      )
    )
    .filter((hint): hint is Extract<KafkaMessageSelectionHint, { kind: "header" }> => hint !== undefined)
    .map((hint) => hint.value);

  return values.length === messages.length && new Set(values).size === messages.length;
}

function dedupeMessageContracts(messages: Array<KafkaMessageContract | null>): KafkaMessageContract[] {
  const unique = new Map<string, KafkaMessageContract>();

  for (const message of messages) {
    if (!message) {
      continue;
    }

    const key = JSON.stringify(message);
    if (!unique.has(key)) {
      unique.set(key, message);
    }
  }

  return sortMessageContracts(Array.from(unique.values()));
}

function sortMessageContracts(messages: KafkaMessageContract[]): KafkaMessageContract[] {
  return [...messages].sort(compareMessageContracts);
}

function compareMessageContracts(left: KafkaMessageContract, right: KafkaMessageContract): number {
  if (left.name !== right.name) {
    return left.name.localeCompare(right.name);
  }

  const leftPayload = left.payloadSchemaId ?? "";
  const rightPayload = right.payloadSchemaId ?? "";
  if (leftPayload !== rightPayload) {
    return leftPayload.localeCompare(rightPayload);
  }

  const leftHeaders = left.headersSchemaId ?? "";
  const rightHeaders = right.headersSchemaId ?? "";
  if (leftHeaders !== rightHeaders) {
    return leftHeaders.localeCompare(rightHeaders);
  }

  return JSON.stringify(left.selectionHints ?? []).localeCompare(JSON.stringify(right.selectionHints ?? []));
}

function formatMessageCandidate(message: KafkaMessageContract): string {
  const headerHints = (message.selectionHints ?? [])
    .filter((hint): hint is Extract<KafkaMessageSelectionHint, { kind: "header" }> => hint.kind === "header")
    .map((hint) => hint.header)
    .sort((left, right) => left.localeCompare(right));

  const details = [
    headerHints.length > 0 ? `headers: ${headerHints.join(", ")}` : null,
    message.payloadSchemaId ? `payload: ${message.payloadSchemaId}` : null,
    message.headersSchemaId ? `headerSchema: ${message.headersSchemaId}` : null
  ].filter((detail): detail is string => detail !== null);

  if (details.length === 0) {
    return message.name;
  }

  return `${message.name} [${details.join("; ")}]`;
}

function buildMessageContract(value: unknown): KafkaMessageContract | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = extractMessageName(value);
  if (!name) {
    return null;
  }

  const payloadSchema = normalizeJsonValue(value.payload);
  const payloadSchemaId = extractSchemaId(value.payload);
  const contentType = normalizeNonEmptyString(value.contentType) ?? undefined;
  const schemaFormat =
    normalizeNonEmptyString(value.schemaFormat) ??
    (isRecord(value.payload) ? normalizeNonEmptyString(value.payload.schemaFormat) ?? undefined : undefined);
  const headersSchema = normalizeJsonValue(value.headers);
  const headersSchemaId = extractSchemaId(value.headers);
  const headerValidationCapability = headersSchemaId || headersSchema !== undefined ? (headersSchema !== undefined ? "supported" : "unverifiable") : "none";
  const selectionHints = extractMessageSelectionHints(name, value.headers);

  return {
    name,
    headerValidationCapability,
    ...(selectionHints.length > 0 ? { selectionHints } : {}),
    ...(payloadSchema !== undefined ? { payloadSchema } : {}),
    ...(payloadSchemaId ? { payloadSchemaId } : {}),
    ...(contentType ? { contentType } : {}),
    ...(schemaFormat ? { schemaFormat } : {}),
    ...(headersSchema !== undefined ? { headersSchema } : {}),
    ...(headersSchemaId ? { headersSchemaId } : {})
  };
}

function extractMessageSelectionHints(name: string, headersValue: unknown): KafkaMessageSelectionHint[] {
  const hints: KafkaMessageSelectionHint[] = [{ kind: "message", value: name }];

  if (!isRecord(headersValue)) {
    return hints;
  }

  const properties = headersValue.properties;
  if (!isRecord(properties)) {
    return hints;
  }

  for (const [header, schemaValue] of Object.entries(properties).sort(([left], [right]) => left.localeCompare(right))) {
    if (!isRecord(schemaValue)) {
      continue;
    }

    const value = normalizeHeaderDiscriminatorValue(schemaValue.const) ?? normalizeHeaderEnumDiscriminatorValue(schemaValue.enum);
    if (!value) {
      continue;
    }

    hints.push({
      kind: "header",
      header,
      value
    });
  }

  return hints;
}

function normalizeHeaderDiscriminatorValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeHeaderEnumDiscriminatorValue(value: unknown): string | undefined {
  if (!Array.isArray(value) || value.length !== 1 || typeof value[0] !== "string") {
    return undefined;
  }

  const normalized = value[0].trim();
  return normalized.length > 0 ? normalized : undefined;
}

function extractSchemaId(value: unknown): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return normalizeNonEmptyString(value["x-parser-schema-id"]) ?? undefined;
}

function resolveV3ChannelNameOrAddress(channelRefOrObj: unknown, channels: Record<string, unknown>): string | null {
  const direct = normalizeChannelAddress(channelRefOrObj);
  if (direct) {
    return direct;
  }

  if (!isRecord(channelRefOrObj)) {
    return null;
  }

  const ref = normalizeNonEmptyString(channelRefOrObj.$ref);
  if (!ref) {
    return null;
  }

  const marker = "#/channels/";
  const idx = ref.indexOf(marker);
  if (idx < 0) {
    return null;
  }

  const channelName = ref.slice(idx + marker.length);
  if (channelName.length === 0) {
    return null;
  }

  const channelValue = channels[channelName];
  const address = normalizeChannelAddress(channelValue);
  return address ?? channelName;
}

function normalizeChannelAddress(value: unknown): string | null {
  if (typeof value === "string") {
    const channel = value.trim();
    return channel.length > 0 ? channel : null;
  }

  if (!isRecord(value)) {
    return null;
  }

  return normalizeNonEmptyString(value.address);
}

function parseAsyncAction(value: unknown): AsyncAction | null {
  return value === "send" || value === "receive" ? value : null;
}

function extractMessageName(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return (
    normalizeNonEmptyString(value["x-parser-message-name"]) ??
    normalizeNonEmptyString(value.messageId) ??
    normalizeNonEmptyString(value.name)
  );
}

function normalizeProtocol(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const protocol = value.trim().toLowerCase();
  return protocol.length > 0 ? protocol : null;
}

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toAsyncApiSpecPath(specInput: AsyncApiSpecInput): string {
  return typeof specInput === "string" ? specInput : specInput.materializedPath;
}

function buildAsyncContext(
  asyncapiVersion: string,
  protocol: string | undefined,
  extra: Partial<NonNullable<SemanticDiagnostic["async"]>> = {}
): NonNullable<SemanticDiagnostic["async"]> {
  return {
    runtime: KAFKA_RUNTIME,
    asyncapiVersion,
    ...(protocol ? { protocol } : {}),
    ...extra
  };
}

function toBundle(
  operations: OperationKey[],
  operationContractsByKey: Map<string, KafkaOperationContract>,
  diagnostics: SemanticDiagnostic[]
): AsyncApiSemanticsBundle {
  return {
    operations,
    operationContractsByKey,
    diagnostics,
    hasInvalid: diagnostics.some((diagnostic) => diagnostic.kind === "invalid")
  };
}

function hasBlockingAsyncDiagnostics(diagnostics: SemanticDiagnostic[]): boolean {
  return diagnostics.some(isBlockingAsyncDiagnostic);
}

function isBlockingAsyncDiagnostic(diagnostic: SemanticDiagnostic): boolean {
  return diagnostic.kind === "invalid" || diagnostic.kind === "ambiguous";
}

function formatParserDiagnostics(diagnostics: any[] | undefined): string {
  const details = diagnostics?.map((diagnostic) => diagnostic?.message).filter((message): message is string => Boolean(message)) ?? [];
  if (details.length === 0) {
    return "Invalid AsyncAPI document";
  }

  return `Invalid AsyncAPI document: ${details.join("; ")}`;
}

function formatSemanticDiagnostics(diagnostics: SemanticDiagnostic[]): string {
  if (diagnostics.length === 0) {
    return "AsyncAPI semantic extraction failed";
  }

  return `AsyncAPI semantic extraction failed: ${diagnostics.map(formatSemanticDiagnostic).join("; ")}`;
}

function formatSemanticDiagnostic(diagnostic: SemanticDiagnostic): string {
  const asyncContext = diagnostic.async
    ? [
        diagnostic.async.runtime ? `runtime=${diagnostic.async.runtime}` : null,
        diagnostic.async.asyncapiVersion ? `version=${diagnostic.async.asyncapiVersion}` : null,
        diagnostic.async.protocol ? `protocol=${diagnostic.async.protocol}` : null,
        diagnostic.async.channel ? `channel=${diagnostic.async.channel}` : null,
        diagnostic.async.action ? `action=${diagnostic.async.action}` : null,
        diagnostic.async.message ? `message=${diagnostic.async.message}` : null
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
    : "";
  const candidates = diagnostic.candidates?.length ? ` candidates=[${[...diagnostic.candidates].sort((left, right) => left.localeCompare(right)).join(", ")}]` : "";
  const detail = asyncContext.length > 0 ? `${diagnostic.message} [${asyncContext}]` : diagnostic.message;

  return `${detail}${candidates}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
