import { normalizeAsyncHeaderEvidence, type AsyncEvent } from "../model/asyncEvent.js";
import {
  formatKafkaMessageIdentity,
  serializeOperationKey,
  type AsyncAction,
  type KafkaMessageContract,
  type KafkaOperationContract,
  type KafkaOperationKey
} from "../model/operationKey.js";
import type { AsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import { resolveAsyncMessageContract } from "./asyncSchemaConformance.js";

export type AsyncRuntimeSemanticKind = "correlationId" | "reply.address";
export type AsyncRuntimeSemanticFailureState = "missing" | "unavailable" | "unsupported" | "mismatched";

export type AsyncRuntimeSemanticSummary = {
  total: number;
  satisfied: number;
  percent: number | null;
};

export type AsyncRuntimeSemanticItem = {
  operationKey: string;
  channel: string;
  action: AsyncAction;
  semantic: AsyncRuntimeSemanticKind;
  state: "SATISFIED" | "UNSATISFIED";
  location: string;
  header?: string;
  messageName?: string;
  message?: string;
  replyChannelAddress?: string;
  suites: string[];
};

export type AsyncRuntimeSemanticDiagnostic = {
  semantic: AsyncRuntimeSemanticKind;
  state: AsyncRuntimeSemanticFailureState;
  operationKey: string;
  channel: string;
  action: AsyncAction;
  location: string;
  header?: string;
  messageName?: string;
  replyChannelAddress?: string;
  reason: string;
  message: string;
};

export type AsyncSemanticConformanceResult = {
  summary: AsyncRuntimeSemanticSummary;
  items: AsyncRuntimeSemanticItem[];
  diagnostics: AsyncRuntimeSemanticDiagnostic[];
};

type ItemAccumulator = Omit<AsyncRuntimeSemanticItem, "state" | "suites"> & {
  satisfied: boolean;
  suites: Set<string>;
};

type MatchedKafkaContract = {
  operationKey: string;
  contract: KafkaOperationContract;
};

type EvaluatedSemanticOutcome =
  | {
      state: "satisfied";
    }
  | {
      state: AsyncRuntimeSemanticFailureState;
      diagnostic: AsyncRuntimeSemanticDiagnostic;
    };

export function computeAsyncSemanticConformance(
  bundle: AsyncApiSemanticsBundle,
  events: AsyncEvent[]
): AsyncSemanticConformanceResult {
  const operations = bundle.operations.filter((operation): operation is KafkaOperationKey => operation.kind === "kafka");
  const contractsByMatchKey = new Map<string, MatchedKafkaContract>();
  const itemsByKey = new Map<string, ItemAccumulator>();
  const diagnostics: AsyncRuntimeSemanticDiagnostic[] = [];
  const seenDiagnostics = new Set<string>();

  for (const operation of operations) {
    const operationKey = serializeOperationKey(operation);
    const contract = bundle.operationContractsByKey.get(operationKey) ?? { operation };
    contractsByMatchKey.set(matchKey("kafka", operation.action, operation.channel), {
      operationKey,
      contract
    });
    registerDeclaredRuntimeSemantics(itemsByKey, operationKey, contract);
  }

  for (const event of events) {
    const matched = contractsByMatchKey.get(matchKey(event.kind, event.action, event.channel));
    if (!matched) {
      continue;
    }

    const resolution = resolveAsyncMessageContract(matched.contract, matched.operationKey, event);
    if (resolution.kind === "ambiguous" || resolution.kind === "mismatched") {
      continue;
    }

    if (resolution.kind === "selected" && resolution.message.declaredCorrelationId) {
      const messageIdentity = formatKafkaMessageIdentity(resolution.message);
      const outcome = evaluateCorrelationIdSemantic({
        operationKey: matched.operationKey,
        operation: matched.contract.operation,
        message: resolution.message,
        messageIdentity,
        event
      });
      applyOutcome(
        itemsByKey.get(correlationItemKey(matched.operationKey, messageIdentity, resolution.message.declaredCorrelationId.location)),
        diagnostics,
        seenDiagnostics,
        event.testSuite,
        outcome
      );
    }

    if (matched.contract.declaredReply) {
      const outcome = evaluateReplyAddressSemantic({
        operationKey: matched.operationKey,
        operation: matched.contract.operation,
        declaredReply: matched.contract.declaredReply,
        event
      });
      applyOutcome(
        itemsByKey.get(replyItemKey(matched.operationKey, matched.contract.declaredReply.address.location)),
        diagnostics,
        seenDiagnostics,
        event.testSuite,
        outcome
      );
    }
  }

  const items = [...itemsByKey.values()].map(toPublicRuntimeItem).sort(compareRuntimeSemanticItems);
  return {
    summary: summarizeRuntimeSemantics(items),
    items,
    diagnostics: [...diagnostics].sort(compareRuntimeSemanticDiagnostics)
  };
}

export function compareRuntimeSemanticDiagnostics(
  left: AsyncRuntimeSemanticDiagnostic,
  right: AsyncRuntimeSemanticDiagnostic
): number {
  if (left.operationKey !== right.operationKey) {
    return left.operationKey.localeCompare(right.operationKey);
  }

  const semantic = runtimeSemanticKindRank(left.semantic) - runtimeSemanticKindRank(right.semantic);
  if (semantic !== 0) {
    return semantic;
  }

  const state = runtimeSemanticFailureStateRank(left.state) - runtimeSemanticFailureStateRank(right.state);
  if (state !== 0) {
    return state;
  }

  const leftMessageName = left.messageName ?? "";
  const rightMessageName = right.messageName ?? "";
  if (leftMessageName !== rightMessageName) {
    return leftMessageName.localeCompare(rightMessageName);
  }

  if (left.location !== right.location) {
    return left.location.localeCompare(right.location);
  }

  const leftHeader = left.header ?? "";
  const rightHeader = right.header ?? "";
  if (leftHeader !== rightHeader) {
    return leftHeader.localeCompare(rightHeader);
  }

  const leftReplyChannelAddress = left.replyChannelAddress ?? "";
  const rightReplyChannelAddress = right.replyChannelAddress ?? "";
  if (leftReplyChannelAddress !== rightReplyChannelAddress) {
    return leftReplyChannelAddress.localeCompare(rightReplyChannelAddress);
  }

  if (left.reason !== right.reason) {
    return left.reason.localeCompare(right.reason);
  }

  return left.message.localeCompare(right.message);
}

function registerDeclaredRuntimeSemantics(
  itemsByKey: Map<string, ItemAccumulator>,
  operationKey: string,
  contract: KafkaOperationContract
): void {
  const messages = contract.message ? [contract.message] : contract.messages ?? [];

  for (const message of messages) {
    if (!message.declaredCorrelationId) {
      continue;
    }

    const messageIdentity = formatKafkaMessageIdentity(message);
    const location = message.declaredCorrelationId.location;
    const parsedLocation = parseSupportedHeaderLocation(location);
    const key = correlationItemKey(operationKey, messageIdentity, location);

    itemsByKey.set(key, {
      operationKey,
      channel: contract.operation.channel,
      action: contract.operation.action,
      semantic: "correlationId",
      location,
      ...(parsedLocation.kind === "supported" ? { header: parsedLocation.header } : {}),
      messageName: message.name,
      message: messageIdentity,
      satisfied: false,
      suites: new Set<string>()
    });
  }

  if (!contract.declaredReply) {
    return;
  }

  const replyLocation = contract.declaredReply.address.location;
  const parsedReplyLocation = parseSupportedHeaderLocation(replyLocation);
  itemsByKey.set(replyItemKey(operationKey, replyLocation), {
    operationKey,
    channel: contract.operation.channel,
    action: contract.operation.action,
    semantic: "reply.address",
    location: replyLocation,
    ...(parsedReplyLocation.kind === "supported" ? { header: parsedReplyLocation.header } : {}),
    ...(contract.declaredReply.channel?.address
      ? {
          replyChannelAddress: contract.declaredReply.channel.address
        }
      : {}),
    satisfied: false,
    suites: new Set<string>()
  });
}

function evaluateCorrelationIdSemantic(input: {
  operationKey: string;
  operation: KafkaOperationKey;
  message: KafkaMessageContract;
  messageIdentity: string;
  event: AsyncEvent;
}): EvaluatedSemanticOutcome {
  const location = input.message.declaredCorrelationId?.location;
  if (!location) {
    return { state: "satisfied" };
  }

  const parsedLocation = parseSupportedHeaderLocation(location);
  if (parsedLocation.kind === "unsupported") {
    return {
      state: "unsupported",
      diagnostic: {
        semantic: "correlationId",
        state: "unsupported",
        operationKey: input.operationKey,
        channel: input.operation.channel,
        action: input.operation.action,
        location,
        messageName: input.message.name,
        reason: parsedLocation.reason,
        message: "Declared AsyncAPI correlationId location is outside the supported kafka header-backed runtime-proof scope"
      }
    };
  }

  const headerEvidence = inspectRetainedHeaderEvidence(input.event.headers, parsedLocation.header);
  if (headerEvidence.kind === "captured") {
    return { state: "satisfied" };
  }

  return {
    state: headerEvidence.kind,
    diagnostic: {
      semantic: "correlationId",
      state: headerEvidence.kind,
      operationKey: input.operationKey,
      channel: input.operation.channel,
      action: input.operation.action,
      location,
      header: parsedLocation.header,
      messageName: input.message.name,
      reason: buildRuntimeHeaderReason({
        semantic: "correlationId",
        header: parsedLocation.header,
        location,
        evidence: headerEvidence
      }),
      message:
        headerEvidence.kind === "missing"
          ? "Observed kafka evidence is missing retained header evidence required to prove AsyncAPI correlationId"
          : "Observed kafka header value was unavailable for AsyncAPI correlationId runtime proof"
    }
  };
}

function evaluateReplyAddressSemantic(input: {
  operationKey: string;
  operation: KafkaOperationKey;
  declaredReply: NonNullable<KafkaOperationContract["declaredReply"]>;
  event: AsyncEvent;
}): EvaluatedSemanticOutcome {
  const location = input.declaredReply.address.location;
  const parsedLocation = parseSupportedHeaderLocation(location);
  if (parsedLocation.kind === "unsupported") {
    return {
      state: "unsupported",
      diagnostic: {
        semantic: "reply.address",
        state: "unsupported",
        operationKey: input.operationKey,
        channel: input.operation.channel,
        action: input.operation.action,
        location,
        ...(input.declaredReply.channel?.address
          ? {
              replyChannelAddress: input.declaredReply.channel.address
            }
          : {}),
        reason: parsedLocation.reason,
        message: "Declared AsyncAPI reply.address location is outside the supported kafka header-backed runtime-proof scope"
      }
    };
  }

  const headerEvidence = inspectRetainedHeaderEvidence(input.event.headers, parsedLocation.header);
  if (headerEvidence.kind !== "captured") {
    return {
      state: headerEvidence.kind,
      diagnostic: {
        semantic: "reply.address",
        state: headerEvidence.kind,
        operationKey: input.operationKey,
        channel: input.operation.channel,
        action: input.operation.action,
        location,
        header: parsedLocation.header,
        ...(input.declaredReply.channel?.address
          ? {
              replyChannelAddress: input.declaredReply.channel.address
            }
          : {}),
        reason: buildRuntimeHeaderReason({
          semantic: "reply.address",
          header: parsedLocation.header,
          location,
          evidence: headerEvidence
        }),
        message:
          headerEvidence.kind === "missing"
            ? "Observed kafka evidence is missing retained header evidence required to prove AsyncAPI reply.address"
            : "Observed kafka header value was unavailable for AsyncAPI reply.address runtime proof"
      }
    };
  }

  const expectedReplyChannelAddress = input.declaredReply.channel?.address;
  if (expectedReplyChannelAddress && headerEvidence.value !== expectedReplyChannelAddress) {
    return {
      state: "mismatched",
      diagnostic: {
        semantic: "reply.address",
        state: "mismatched",
        operationKey: input.operationKey,
        channel: input.operation.channel,
        action: input.operation.action,
        location,
        header: parsedLocation.header,
        replyChannelAddress: expectedReplyChannelAddress,
        reason: `Observed kafka header '${parsedLocation.header}' did not match declared AsyncAPI reply channel address '${expectedReplyChannelAddress}'.`,
        message: "Observed kafka reply.address header did not match the declared AsyncAPI reply channel address"
      }
    };
  }

  return { state: "satisfied" };
}

function applyOutcome(
  item: ItemAccumulator | undefined,
  diagnostics: AsyncRuntimeSemanticDiagnostic[],
  seenDiagnostics: Set<string>,
  suite: string,
  outcome: EvaluatedSemanticOutcome
): void {
  if (!item) {
    return;
  }

  if (outcome.state === "satisfied") {
    item.satisfied = true;
    item.suites.add(suite);
    return;
  }

  appendRuntimeDiagnostic(diagnostics, seenDiagnostics, outcome.diagnostic);
}

function appendRuntimeDiagnostic(
  diagnostics: AsyncRuntimeSemanticDiagnostic[],
  seenDiagnostics: Set<string>,
  diagnostic: AsyncRuntimeSemanticDiagnostic
): void {
  const key = [
    diagnostic.semantic,
    diagnostic.state,
    diagnostic.operationKey,
    diagnostic.channel,
    diagnostic.action,
    diagnostic.location,
    diagnostic.header ?? "",
    diagnostic.messageName ?? "",
    diagnostic.replyChannelAddress ?? "",
    diagnostic.reason,
    diagnostic.message
  ].join("\u0000");

  if (seenDiagnostics.has(key)) {
    return;
  }

  seenDiagnostics.add(key);
  diagnostics.push(diagnostic);
}

function inspectRetainedHeaderEvidence(
  headers: AsyncEvent["headers"] | undefined,
  header: string
):
  | {
      kind: "captured";
      value: string;
    }
  | {
      kind: "missing";
    }
  | {
      kind: "unavailable";
      detail: string;
    } {
  if (!isPlainRecord(headers)) {
    return { kind: "missing" };
  }

  if (!Object.hasOwn(headers, header)) {
    return { kind: "missing" };
  }

  const rawEvidence = headers[header];
  const normalizedEvidence = normalizeAsyncHeaderEvidence(rawEvidence);
  if (!normalizedEvidence) {
    return {
      kind: "unavailable",
      detail: "retained header evidence did not normalize to the expected { state, value | reason } shape"
    };
  }

  if (normalizedEvidence.state !== "captured" || !normalizedEvidence.value) {
    return {
      kind: "unavailable",
      detail: normalizedEvidence.reason
        ? `retained header evidence was ${normalizedEvidence.state} (${normalizedEvidence.reason})`
        : `retained header evidence was ${normalizedEvidence.state}`
    };
  }

  return {
    kind: "captured",
    value: normalizedEvidence.value
  };
}

function buildRuntimeHeaderReason(input: {
  semantic: AsyncRuntimeSemanticKind;
  header: string;
  location: string;
  evidence:
    | {
        kind: "missing";
      }
    | {
        kind: "unavailable";
        detail: string;
      };
}): string {
  if (input.evidence.kind === "missing") {
    return `Observed kafka evidence did not retain header '${input.header}' required by declared ${input.semantic} location '${input.location}'.`;
  }

  return `Observed kafka header '${input.header}' required by declared ${input.semantic} location '${input.location}' was unavailable because ${input.evidence.detail}.`;
}

function parseSupportedHeaderLocation(location: string):
  | {
      kind: "supported";
      header: string;
    }
  | {
      kind: "unsupported";
      reason: string;
    } {
  const prefix = "$message.header#/";
  if (!location.startsWith(prefix)) {
    return {
      kind: "unsupported",
      reason: `Declared runtime expression '${location}' is outside the supported $message.header#/... subset.`
    };
  }

  const pointer = location.slice("$message.header#".length);
  if (!pointer.startsWith("/")) {
    return {
      kind: "unsupported",
      reason: `Declared runtime expression '${location}' does not resolve to a flat retained kafka header key.`
    };
  }

  const segments = pointer
    .slice(1)
    .split("/")
    .filter((segment) => segment.length > 0);
  if (segments.length !== 1) {
    return {
      kind: "unsupported",
      reason: `Declared runtime expression '${location}' does not resolve to one flat retained kafka header key.`
    };
  }

  const decoded = decodeJsonPointerSegment(segments[0]);
  if (!decoded) {
    return {
      kind: "unsupported",
      reason: `Declared runtime expression '${location}' does not resolve to a valid retained kafka header key.`
    };
  }

  return {
    kind: "supported",
    header: decoded
  };
}

function decodeJsonPointerSegment(value: string): string | undefined {
  let decoded = "";
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character !== "~") {
      decoded += character;
      continue;
    }

    const next = value[index + 1];
    if (next === "0") {
      decoded += "~";
      index += 1;
      continue;
    }

    if (next === "1") {
      decoded += "/";
      index += 1;
      continue;
    }

    return undefined;
  }

  const normalized = decoded.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toPublicRuntimeItem(item: ItemAccumulator): AsyncRuntimeSemanticItem {
  return {
    operationKey: item.operationKey,
    channel: item.channel,
    action: item.action,
    semantic: item.semantic,
    state: item.satisfied ? "SATISFIED" : "UNSATISFIED",
    location: item.location,
    ...(item.header ? { header: item.header } : {}),
    ...(item.messageName ? { messageName: item.messageName } : {}),
    ...(item.message ? { message: item.message } : {}),
    ...(item.replyChannelAddress ? { replyChannelAddress: item.replyChannelAddress } : {}),
    suites: [...item.suites].sort((left, right) => left.localeCompare(right))
  };
}

function summarizeRuntimeSemantics(items: AsyncRuntimeSemanticItem[]): AsyncRuntimeSemanticSummary {
  const satisfied = items.filter((item) => item.state === "SATISFIED").length;
  return {
    total: items.length,
    satisfied,
    percent: items.length === 0 ? null : roundPercent((satisfied / items.length) * 100)
  };
}

function compareRuntimeSemanticItems(left: AsyncRuntimeSemanticItem, right: AsyncRuntimeSemanticItem): number {
  if (left.operationKey !== right.operationKey) {
    return left.operationKey.localeCompare(right.operationKey);
  }

  const semantic = runtimeSemanticKindRank(left.semantic) - runtimeSemanticKindRank(right.semantic);
  if (semantic !== 0) {
    return semantic;
  }

  const leftMessage = left.message ?? "";
  const rightMessage = right.message ?? "";
  if (leftMessage !== rightMessage) {
    return leftMessage.localeCompare(rightMessage);
  }

  if (left.location !== right.location) {
    return left.location.localeCompare(right.location);
  }

  const leftReplyChannelAddress = left.replyChannelAddress ?? "";
  const rightReplyChannelAddress = right.replyChannelAddress ?? "";
  if (leftReplyChannelAddress !== rightReplyChannelAddress) {
    return leftReplyChannelAddress.localeCompare(rightReplyChannelAddress);
  }

  return left.state.localeCompare(right.state);
}

function runtimeSemanticKindRank(value: AsyncRuntimeSemanticKind): number {
  return value === "correlationId" ? 0 : 1;
}

function runtimeSemanticFailureStateRank(value: AsyncRuntimeSemanticFailureState): number {
  switch (value) {
    case "missing":
      return 0;
    case "unavailable":
      return 1;
    case "unsupported":
      return 2;
    case "mismatched":
      return 3;
  }
}

function correlationItemKey(operationKey: string, messageIdentity: string, location: string): string {
  return `${operationKey}\u0000correlationId\u0000${messageIdentity}\u0000${location}`;
}

function replyItemKey(operationKey: string, location: string): string {
  return `${operationKey}\u0000reply.address\u0000${location}`;
}

function matchKey(protocol: AsyncEvent["kind"], action: AsyncAction, channel: string): string {
  return `${protocol}\u0000${action}\u0000${channel}`;
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
