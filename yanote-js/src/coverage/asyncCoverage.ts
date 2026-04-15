import {
  formatKafkaMessageIdentity,
  serializeOperationKey,
  type AsyncAction,
  type AsyncOperationContract,
  type AsyncOperationKey,
  type AsyncProtocol
} from "../model/operationKey.js";
import type { AsyncEvent } from "../model/asyncEvent.js";
import type { AsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import {
  computeAsyncSchemaConformance,
  resolveAsyncMessageContract,
  type AsyncRoutingCoverageDiagnostic,
  type AsyncRoutingCoverageDiagnosticKind,
  type AsyncSchemaConformanceDiagnostic,
  type AsyncSchemaConformanceDiagnosticKind,
  type AsyncSchemaValidationKind
} from "./asyncSchemaConformance.js";
import {
  computeAsyncSemanticConformance,
  type AsyncRuntimeSemanticDiagnostic,
  type AsyncRuntimeSemanticItem,
  type AsyncRuntimeSemanticSummary
} from "./asyncSemanticConformance.js";

export type AsyncCoverageSummary = {
  total: number;
  covered: number;
  percent: number | null;
};

export type AsyncChannelCoverage = {
  channel: string;
  state: "COVERED" | "UNCOVERED";
  coveredActions: AsyncAction[];
  missingActions: AsyncAction[];
};

export type AsyncOperationCoverage = {
  operationKey: string;
  channel: string;
  action: AsyncAction;
  operation: {
    state: "COVERED" | "UNCOVERED";
  };
  messageContract: {
    name?: string;
    state: "COVERED" | "PARTIAL" | "UNCOVERED" | "N/A";
    selectionMode?: "single" | "runtime";
    declaredMessages?: string[];
    selectedMessages?: string[];
  };
  suites: string[];
};

export type AsyncMessageCoverage = {
  operationKey: string;
  channel: string;
  action: AsyncAction;
  message: string;
  state: "COVERED" | "UNCOVERED";
  suites: string[];
};

export type AsyncCoverageDiagnosticKind = AsyncRoutingCoverageDiagnosticKind | AsyncSchemaConformanceDiagnosticKind;

export type AsyncSchemaCoverageDiagnostic = {
  kind: AsyncSchemaConformanceDiagnosticKind;
  validationKind: AsyncSchemaValidationKind;
  operationKey: string;
  channel: string;
  action: AsyncAction;
  messageName?: string;
  schemaId?: string;
  pointer?: string;
  reason: string;
  message: string;
};

export type AsyncCoverageDiagnostic = AsyncRoutingCoverageDiagnostic | AsyncSchemaCoverageDiagnostic;

export type AsyncRuntimeSemanticCoverage = {
  summary: AsyncRuntimeSemanticSummary;
  items: AsyncRuntimeSemanticItem[];
  diagnostics: AsyncRuntimeSemanticDiagnostic[];
};

export type AsyncCoverageResult = {
  channels: {
    summary: AsyncCoverageSummary;
    items: AsyncChannelCoverage[];
  };
  operations: {
    summary: AsyncCoverageSummary;
    items: AsyncOperationCoverage[];
  };
  messages: {
    summary: AsyncCoverageSummary;
    items: AsyncMessageCoverage[];
  };
  runtimeSemantics: AsyncRuntimeSemanticCoverage;
  diagnostics: AsyncCoverageDiagnostic[];
};

type ChannelAccumulator = {
  channel: string;
  expectedActions: AsyncAction[];
  observedOnKnownChannel: boolean;
  coveredActions: Set<AsyncAction>;
};

type OperationAccumulator = {
  operation: AsyncOperationKey;
  operationKey: string;
  selectionMode?: "single" | "runtime";
  singleMessageName?: string;
  declaredMessages: string[];
  selectedMessages: Set<string>;
  suites: Set<string>;
};

type MessageAccumulator = {
  operationKey: string;
  channel: string;
  action: AsyncAction;
  message: string;
  covered: boolean;
  suites: Set<string>;
};

export function computeAsyncCoverage(bundle: AsyncApiSemanticsBundle, events: AsyncEvent[]): AsyncCoverageResult {
  const operations = bundle.operations.filter(isAsyncOperationKey);
  const schemaConformance = computeAsyncSchemaConformance(bundle, events);
  const runtimeSemantics = computeAsyncSemanticConformance(bundle, events);
  const matchedOperationKeys = new Set(schemaConformance.matchedOperationKeys);
  const channels = new Map<string, ChannelAccumulator>();
  const operationsByMatchKey = new Map<string, OperationAccumulator>();
  const operationContractsByMatchKey = new Map<string, ReturnType<typeof buildOperationContractEntry>>();
  const parserAmbiguitiesByMatchKey = new Map<string, Extract<AsyncRoutingCoverageDiagnostic, { kind: "ambiguous" }>>();
  const operationOrder: OperationAccumulator[] = [];
  const messageByKey = new Map<string, MessageAccumulator>();

  for (const diagnostic of bundle.diagnostics) {
    if (diagnostic.kind !== "ambiguous" || !diagnostic.async?.channel || !diagnostic.async?.action) {
      continue;
    }

    const protocol = toAsyncProtocol(diagnostic.async.protocol ?? diagnostic.async.runtime);
    if (!protocol) {
      continue;
    }

    const operationKey = serializeOperationKey({
      kind: protocol,
      action: diagnostic.async.action,
      channel: diagnostic.async.channel
    });
    parserAmbiguitiesByMatchKey.set(matchKey(protocol, diagnostic.async.action, diagnostic.async.channel), {
      kind: "ambiguous",
      operationKey,
      channel: diagnostic.async.channel,
      action: diagnostic.async.action,
      reason: diagnostic.message,
      candidates: [...(diagnostic.candidates ?? [])].sort((left, right) => left.localeCompare(right)),
      message: `AsyncAPI message selection remained ambiguous, so the ${protocol} operation was not normalized`
    });
  }

  for (const operation of operations) {
    const operationKey = serializeOperationKey(operation);
    const contract = bundle.operationContractsByKey.get(operationKey) ?? { operation };
    const declaredMessages = getDeclaredMessages(contract);
    const channelKey = channelAccumulatorKey(operation.kind, operation.channel);

    if (!channels.has(channelKey)) {
      channels.set(channelKey, {
        channel: operation.channel,
        expectedActions: [],
        observedOnKnownChannel: false,
        coveredActions: new Set<AsyncAction>()
      });
    }
    channels.get(channelKey)?.expectedActions.push(operation.action);

    const accumulator: OperationAccumulator = {
      operation,
      operationKey,
      selectionMode: contract.messageSelection?.mode,
      singleMessageName: contract.message?.name,
      declaredMessages: declaredMessages.map((message) => message.identity),
      selectedMessages: new Set<string>(),
      suites: new Set<string>()
    };

    operationsByMatchKey.set(matchKey(operation.kind, operation.action, operation.channel), accumulator);
    operationContractsByMatchKey.set(matchKey(operation.kind, operation.action, operation.channel), buildOperationContractEntry(contract));
    operationOrder.push(accumulator);

    for (const message of declaredMessages) {
      messageByKey.set(messageAccumulatorKey(operationKey, message.identity), {
        operationKey,
        channel: operation.channel,
        action: operation.action,
        message: message.identity,
        covered: false,
        suites: new Set<string>()
      });
    }
  }

  const routingDiagnostics: AsyncRoutingCoverageDiagnostic[] = [];
  const seenRoutingDiagnostics = new Set<string>();

  for (const event of events) {
    const channel = channels.get(channelAccumulatorKey(event.kind, event.channel));
    if (channel) {
      channel.observedOnKnownChannel = true;
    }

    const matchedOperation = operationsByMatchKey.get(matchKey(event.kind, event.action, event.channel));
    if (!matchedOperation) {
      const parserAmbiguity = parserAmbiguitiesByMatchKey.get(matchKey(event.kind, event.action, event.channel));
      if (parserAmbiguity) {
        appendRoutingDiagnostic(routingDiagnostics, seenRoutingDiagnostics, {
          ...parserAmbiguity,
          ...(event.message ? { observedMessage: event.message } : {})
        });
      } else {
        appendRoutingDiagnostic(routingDiagnostics, seenRoutingDiagnostics, {
          kind: "unmatched",
          channel: event.channel,
          action: event.action,
          observedMessage: event.message,
          message: `No canonical async operation matched the observed ${event.kind} evidence`
        });
      }
      continue;
    }

    matchedOperation.suites.add(event.testSuite);
    channels.get(channelAccumulatorKey(event.kind, event.channel))?.coveredActions.add(event.action);

    const contractEntry = operationContractsByMatchKey.get(matchKey(event.kind, event.action, event.channel));
    if (!contractEntry) {
      continue;
    }

    const resolution = resolveAsyncMessageContract(contractEntry.contract, matchedOperation.operationKey, event);
    if (resolution.kind === "selected") {
      matchedOperation.selectedMessages.add(resolution.identity);
      const messageAccumulator = messageByKey.get(messageAccumulatorKey(matchedOperation.operationKey, resolution.identity));
      if (messageAccumulator) {
        messageAccumulator.covered = true;
        messageAccumulator.suites.add(event.testSuite);
      }
      continue;
    }

    if (resolution.kind === "mismatched" || resolution.kind === "ambiguous") {
      appendRoutingDiagnostic(routingDiagnostics, seenRoutingDiagnostics, resolution.diagnostic);
    }
  }

  const channelItems = Array.from(channels.values()).map((entry) => ({
    channel: entry.channel,
    state: entry.observedOnKnownChannel ? "COVERED" : "UNCOVERED",
    coveredActions: Array.from(entry.coveredActions),
    missingActions: entry.expectedActions.filter((action) => !entry.coveredActions.has(action))
  }));

  const operationItems = operationOrder.map((entry) => ({
    operationKey: entry.operationKey,
    channel: entry.operation.channel,
    action: entry.operation.action,
    operation: {
      state: matchedOperationKeys.has(entry.operationKey) ? "COVERED" : "UNCOVERED"
    },
    messageContract: buildOperationMessageCoverage(entry),
    suites: Array.from(entry.suites).sort((left, right) => left.localeCompare(right))
  }));

  const messageItems = Array.from(messageByKey.values())
    .map((entry) => ({
      operationKey: entry.operationKey,
      channel: entry.channel,
      action: entry.action,
      message: entry.message,
      state: entry.covered ? "COVERED" : "UNCOVERED",
      suites: Array.from(entry.suites).sort((left, right) => left.localeCompare(right))
    }))
    .sort((left, right) => {
      if (left.operationKey !== right.operationKey) {
        return left.operationKey.localeCompare(right.operationKey);
      }
      return left.message.localeCompare(right.message);
    });

  return {
    channels: {
      summary: summarizeCoverage(
        channelItems.filter((entry) => entry.state === "COVERED").length,
        channelItems.length
      ),
      items: channelItems
    },
    operations: {
      summary: summarizeCoverage(
        operationItems.filter((entry) => entry.operation.state === "COVERED").length,
        operationItems.length
      ),
      items: operationItems
    },
    messages: {
      summary: summarizeCoverage(
        messageItems.filter((entry) => entry.state === "COVERED").length,
        messageItems.length
      ),
      items: messageItems
    },
    runtimeSemantics,
    diagnostics: [
      ...routingDiagnostics,
      ...schemaConformance.diagnostics.filter(isPublicSchemaDiagnostic).map(toPublicSchemaDiagnostic)
    ].sort(compareAsyncCoverageDiagnostics)
  };
}

export function compareAsyncCoverageDiagnostics(left: AsyncCoverageDiagnostic, right: AsyncCoverageDiagnostic): number {
  const kind = diagnosticKindRank(left.kind) - diagnosticKindRank(right.kind);
  if (kind !== 0) {
    return kind;
  }

  const leftOperationKey = "operationKey" in left ? left.operationKey : "";
  const rightOperationKey = "operationKey" in right ? right.operationKey : "";
  if (leftOperationKey !== rightOperationKey) {
    return leftOperationKey.localeCompare(rightOperationKey);
  }

  if (left.channel !== right.channel) {
    return left.channel.localeCompare(right.channel);
  }

  const action = compareAsyncAction(left.action, right.action);
  if (action !== 0) {
    return action;
  }

  const leftValidationKind = "validationKind" in left ? validationKindRank(left.validationKind) : -1;
  const rightValidationKind = "validationKind" in right ? validationKindRank(right.validationKind) : -1;
  if (leftValidationKind !== rightValidationKind) {
    return leftValidationKind - rightValidationKind;
  }

  const leftObserved = "observedMessage" in left ? left.observedMessage ?? "" : "";
  const rightObserved = "observedMessage" in right ? right.observedMessage ?? "" : "";
  if (leftObserved !== rightObserved) {
    return leftObserved.localeCompare(rightObserved);
  }

  const leftExpected = "expectedMessage" in left ? left.expectedMessage ?? "" : "";
  const rightExpected = "expectedMessage" in right ? right.expectedMessage ?? "" : "";
  if (leftExpected !== rightExpected) {
    return leftExpected.localeCompare(rightExpected);
  }

  const leftMessageName = "messageName" in left ? left.messageName ?? "" : "";
  const rightMessageName = "messageName" in right ? right.messageName ?? "" : "";
  if (leftMessageName !== rightMessageName) {
    return leftMessageName.localeCompare(rightMessageName);
  }

  const leftSchemaId = "schemaId" in left ? left.schemaId ?? "" : "";
  const rightSchemaId = "schemaId" in right ? right.schemaId ?? "" : "";
  if (leftSchemaId !== rightSchemaId) {
    return leftSchemaId.localeCompare(rightSchemaId);
  }

  const leftPointer = "pointer" in left ? left.pointer ?? "" : "";
  const rightPointer = "pointer" in right ? right.pointer ?? "" : "";
  if (leftPointer !== rightPointer) {
    return leftPointer.localeCompare(rightPointer);
  }

  const leftReason = "reason" in left ? left.reason : "";
  const rightReason = "reason" in right ? right.reason : "";
  if (leftReason !== rightReason) {
    return leftReason.localeCompare(rightReason);
  }

  const leftCandidates = "candidates" in left ? left.candidates.join("\u0000") : "";
  const rightCandidates = "candidates" in right ? right.candidates.join("\u0000") : "";
  if (leftCandidates !== rightCandidates) {
    return leftCandidates.localeCompare(rightCandidates);
  }

  return left.message.localeCompare(right.message);
}

function buildOperationContractEntry(contract: ReturnType<NonNullable<AsyncApiSemanticsBundle["operationContractsByKey"]>["get"]>) {
  return {
    contract: contract ?? { operation: { kind: "kafka", action: "send", channel: "" } as AsyncOperationKey }
  };
}

function getDeclaredMessages(contract: ReturnType<NonNullable<AsyncApiSemanticsBundle["operationContractsByKey"]>["get"]>) {
  const messages = contract?.message ? [contract.message] : contract?.messages ?? [];
  return messages
    .map((message) => ({
      identity: formatKafkaMessageIdentity(message),
      name: message.name
    }))
    .sort((left, right) => left.identity.localeCompare(right.identity));
}

function buildOperationMessageCoverage(entry: OperationAccumulator): AsyncOperationCoverage["messageContract"] {
  if (entry.declaredMessages.length === 0) {
    return {
      state: "N/A"
    };
  }

  const selectedMessages = Array.from(entry.selectedMessages).sort((left, right) => left.localeCompare(right));
  const state =
    selectedMessages.length === 0
      ? "UNCOVERED"
      : selectedMessages.length === entry.declaredMessages.length
        ? "COVERED"
        : "PARTIAL";

  return {
    ...(entry.singleMessageName ? { name: entry.singleMessageName } : {}),
    ...(entry.selectionMode ? { selectionMode: entry.selectionMode } : {}),
    ...(entry.declaredMessages.length > 1 ? { declaredMessages: [...entry.declaredMessages] } : {}),
    ...(entry.selectionMode === "runtime" ? { selectedMessages } : {}),
    state
  };
}

function appendRoutingDiagnostic(
  diagnostics: AsyncRoutingCoverageDiagnostic[],
  seenDiagnostics: Set<string>,
  diagnostic: AsyncRoutingCoverageDiagnostic
): void {
  const key = [
    diagnostic.kind,
    "operationKey" in diagnostic ? diagnostic.operationKey : "",
    diagnostic.channel,
    diagnostic.action,
    diagnostic.observedMessage ?? "",
    "expectedMessage" in diagnostic ? diagnostic.expectedMessage ?? "" : "",
    "reason" in diagnostic ? diagnostic.reason ?? "" : "",
    "candidates" in diagnostic ? diagnostic.candidates.join("\u0000") : ""
  ].join("\u0000");

  if (seenDiagnostics.has(key)) {
    return;
  }

  seenDiagnostics.add(key);
  diagnostics.push(diagnostic);
}

function toPublicSchemaDiagnostic(diagnostic: AsyncSchemaConformanceDiagnostic): AsyncSchemaCoverageDiagnostic {
  return { ...diagnostic };
}

function isPublicSchemaDiagnostic(diagnostic: AsyncSchemaConformanceDiagnostic): boolean {
  return isRetainedPublicSchemaId(diagnostic.schemaId);
}

function isRetainedPublicSchemaId(schemaId: string | undefined): schemaId is string {
  return typeof schemaId === "string" && schemaId.length > 0 && !schemaId.startsWith("<anonymous-schema-");
}

function diagnosticKindRank(kind: AsyncCoverageDiagnosticKind): number {
  switch (kind) {
    case "unsupported-content-type":
      return 0;
    case "unsupported-schema-format":
      return 1;
    case "missing-payload":
      return 2;
    case "invalid-payload":
      return 3;
    case "missing-header":
      return 4;
    case "unavailable-header":
      return 5;
    case "invalid-header":
      return 6;
    case "unverifiable-headers":
      return 7;
    case "ambiguous":
      return 8;
    case "mismatched":
      return 9;
    case "unmatched":
      return 10;
  }
}

function validationKindRank(kind: AsyncSchemaValidationKind): number {
  switch (kind) {
    case "contentType":
      return 0;
    case "schemaFormat":
      return 1;
    case "payload":
      return 2;
    case "headers":
      return 3;
  }
}

function compareAsyncAction(left: AsyncAction, right: AsyncAction): number {
  return asyncActionRank(left) - asyncActionRank(right);
}

function asyncActionRank(value: AsyncAction): number {
  return value === "send" ? 0 : 1;
}

function matchKey(protocol: AsyncProtocol, action: AsyncAction, channel: string): string {
  return `${protocol}\u0000${action}\u0000${channel}`;
}

function channelAccumulatorKey(protocol: AsyncProtocol, channel: string): string {
  return `${protocol}\u0000${channel}`;
}

function isAsyncOperationKey(value: { kind: string }): value is AsyncOperationKey {
  return value.kind === "kafka" || value.kind === "amqp" || value.kind === "jms";
}

function toAsyncProtocol(value: unknown): AsyncProtocol | null {
  return value === "kafka" || value === "amqp" || value === "jms" ? value : null;
}

function messageAccumulatorKey(operationKey: string, identity: string): string {
  return `${operationKey}\u0000${identity}`;
}

function summarizeCoverage(covered: number, total: number): AsyncCoverageSummary {
  return {
    total,
    covered,
    percent: total === 0 ? null : roundPercent((covered / total) * 100)
  };
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}
